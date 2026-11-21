import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";

/**
 * Constant Contact v3 client for newsletter signups (#164).
 *
 * Platform admins connect the account at /admin/global/newsletter: they enter
 * the app's API key and secret, authorize it (OAuth2 server flow), and pick
 * the list. Everything is stored encrypted in Supabase Vault through the
 * service-role-only `set/get/clear_platform_secret` RPCs — the settings as one
 * JSON secret, the refresh token as another (Constant Contact issues a new
 * refresh token on every refresh, so it changes often).
 *
 * The CONSTANT_CONTACT_* env vars are an optional fallback for any value the
 * admin page has not set.
 */

const AUTHORIZE_URL = "https://authz.constantcontact.com/oauth2/default/v1/authorize";
const TOKEN_URL = "https://authz.constantcontact.com/oauth2/default/v1/token";
const API_BASE = "https://api.cc.email/v3";
const SETTINGS_SECRET = "constant_contact_settings";
const REFRESH_TOKEN_SECRET = "constant_contact_refresh_token";
const REQUEST_TIMEOUT_MS = 8000;
const SETTINGS_CACHE_TTL_MS = 60_000;
/** contact_data covers lists and contacts; offline_access is what returns a refresh token. */
const SCOPES = "contact_data offline_access";

export const CONSTANT_CONTACT_CALLBACK_PATH = "/admin/global/newsletter/callback";

export type ConstantContactSettings = {
  clientId: string | null;
  clientSecret: string | null;
  listId: string | null;
  listName: string | null;
};

export type ConstantContactConfig = {
  clientId: string;
  clientSecret: string;
  listId: string;
};

const EMPTY_SETTINGS: ConstantContactSettings = {
  clientId: null,
  clientSecret: null,
  listId: null,
  listName: null,
};

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Parses the stored settings JSON; anything malformed reads as "not set". */
export function parseStoredSettings(raw: unknown): ConstantContactSettings {
  if (typeof raw !== "string" || !raw.trim()) return EMPTY_SETTINGS;
  try {
    const record = JSON.parse(raw) as Record<string, unknown>;
    return {
      clientId: clean(record.clientId),
      clientSecret: clean(record.clientSecret),
      listId: clean(record.listId),
      listName: clean(record.listName),
    };
  } catch {
    return EMPTY_SETTINGS;
  }
}

/** Admin-saved values win; env vars fill whatever is missing. */
export function mergeSettingsWithEnv(
  stored: ConstantContactSettings,
  env: Record<string, string | undefined> = process.env,
): ConstantContactSettings {
  return {
    clientId: stored.clientId ?? clean(env.CONSTANT_CONTACT_CLIENT_ID),
    clientSecret: stored.clientSecret ?? clean(env.CONSTANT_CONTACT_CLIENT_SECRET),
    listId: stored.listId ?? clean(env.CONSTANT_CONTACT_LIST_ID),
    listName: stored.listName,
  };
}

/** The address Constant Contact sends the admin back to; must be registered in the app. */
export function constantContactRedirectUri(host: string) {
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return `${local ? "http" : "https"}://${host}${CONSTANT_CONTACT_CALLBACK_PATH}`;
}

export function buildAuthorizeUrl(input: { clientId: string; redirectUri: string; state: string }) {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: SCOPES,
    state: input.state,
  });
  // Constant Contact expects space-delimited scopes encoded as %20, not "+".
  return `${AUTHORIZE_URL}?${params.toString().replace(/\+/g, "%20")}`;
}

export type TokenResponse = { accessToken: string; refreshToken: string | null; expiresIn: number };

/** Parses the token endpoint payload; `expires_in` arrives as a number or a string. */
export function parseTokenResponse(payload: unknown): TokenResponse | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const accessToken = clean(record.access_token);
  if (!accessToken) return null;
  const expiresIn = Number(record.expires_in);
  return {
    accessToken,
    refreshToken: clean(record.refresh_token),
    expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600,
  };
}

export type ConstantContactList = { id: string; name: string };

export function parseContactLists(payload: unknown): ConstantContactList[] {
  const lists = (payload as { lists?: unknown } | null)?.lists;
  if (!Array.isArray(lists)) return [];
  return lists.flatMap((item) => {
    const id = clean((item as Record<string, unknown>)?.list_id);
    const name = clean((item as Record<string, unknown>)?.name);
    return id ? [{ id, name: name ?? id }] : [];
  });
}

// ---------------------------------------------------------------------------
// Vault storage
// ---------------------------------------------------------------------------

async function readSecret(name: string): Promise<string | null> {
  const client = createServiceRoleSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc("get_platform_secret", { p_name: name });
  if (error) {
    console.warn(`Constant Contact: could not read ${name}:`, error.message);
    return null;
  }
  return clean(data);
}

async function writeSecret(name: string, value: string | null): Promise<boolean> {
  const client = createServiceRoleSupabaseClient();
  if (!client) return false;
  const { error } = value
    ? await client.rpc("set_platform_secret", { p_name: name, p_value: value })
    : await client.rpc("clear_platform_secret", { p_name: name });
  if (error) {
    console.error(`Constant Contact: could not store ${name}:`, error.message);
    return false;
  }
  return true;
}

let cachedSettings: { value: ConstantContactSettings; expires: number } | null = null;
let cachedAccessToken: { value: string; expires: number } | null = null;

function invalidateCaches() {
  cachedSettings = null;
  cachedAccessToken = null;
}

async function readStoredSettings(force = false): Promise<ConstantContactSettings> {
  if (!force && cachedSettings && cachedSettings.expires > Date.now()) {
    return cachedSettings.value;
  }
  const value = parseStoredSettings(await readSecret(SETTINGS_SECRET));
  cachedSettings = { value, expires: Date.now() + SETTINGS_CACHE_TTL_MS };
  return value;
}

async function saveStoredSettings(patch: Partial<ConstantContactSettings>): Promise<boolean> {
  const next = { ...(await readStoredSettings(true)), ...patch };
  const saved = await writeSecret(SETTINGS_SECRET, JSON.stringify(next));
  invalidateCaches();
  return saved;
}

async function readRefreshToken(): Promise<string | null> {
  return (
    (await readSecret(REFRESH_TOKEN_SECRET)) ?? clean(process.env.CONSTANT_CONTACT_REFRESH_TOKEN)
  );
}

// ---------------------------------------------------------------------------
// Admin operations
// ---------------------------------------------------------------------------

export type ConstantContactStatus = {
  hasCredentials: boolean;
  clientIdLastFour: string | null;
  connected: boolean;
  listId: string | null;
  listName: string | null;
  /** Ready to receive signups: credentials, authorization and a list are all in place. */
  ready: boolean;
};

export async function getConstantContactStatus(): Promise<ConstantContactStatus> {
  const settings = mergeSettingsWithEnv(await readStoredSettings(true));
  const hasCredentials = Boolean(settings.clientId && settings.clientSecret);
  const connected = hasCredentials && Boolean(await readRefreshToken());
  return {
    hasCredentials,
    clientIdLastFour: settings.clientId ? settings.clientId.slice(-4) : null,
    connected,
    listId: settings.listId,
    listName: settings.listName,
    ready: connected && Boolean(settings.listId),
  };
}

/** Saves the app's API key and secret. A new pair invalidates the old authorization. */
export async function saveConstantContactCredentials(clientId: string, clientSecret: string) {
  const saved = await saveStoredSettings({ clientId, clientSecret, listId: null, listName: null });
  if (saved) {
    await writeSecret(REFRESH_TOKEN_SECRET, null);
  }
  return saved;
}

export async function saveConstantContactList(list: ConstantContactList) {
  return saveStoredSettings({ listId: list.id, listName: list.name });
}

export async function disconnectConstantContact() {
  const cleared =
    (await writeSecret(SETTINGS_SECRET, null)) && (await writeSecret(REFRESH_TOKEN_SECRET, null));
  invalidateCaches();
  return cleared;
}

/** Credentials for starting the authorization redirect, or null when not saved yet. */
export async function getConstantContactClientId(): Promise<string | null> {
  return mergeSettingsWithEnv(await readStoredSettings(true)).clientId;
}

async function requestToken(
  credentials: { clientId: string; clientSecret: string },
  params: Record<string, string>,
) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) return null;
  return parseTokenResponse(await response.json().catch(() => null));
}

function rememberAccessToken(token: TokenResponse) {
  cachedAccessToken = {
    value: token.accessToken,
    // Refresh a minute early.
    expires: Date.now() + Math.max(token.expiresIn - 60, 60) * 1000,
  };
}

export type AuthorizationResult = "connected" | "not-configured" | "rejected" | "no-refresh-token" | "save-failed";

/** Second half of the OAuth flow: swaps the code from the callback for tokens. Never throws. */
export async function completeConstantContactAuthorization(
  code: string,
  redirectUri: string,
): Promise<AuthorizationResult> {
  try {
    const settings = mergeSettingsWithEnv(await readStoredSettings(true));
    if (!settings.clientId || !settings.clientSecret) return "not-configured";

    const token = await requestToken(
      { clientId: settings.clientId, clientSecret: settings.clientSecret },
      { grant_type: "authorization_code", code, redirect_uri: redirectUri },
    );
    if (!token) return "rejected";
    if (!token.refreshToken) return "no-refresh-token";
    if (!(await writeSecret(REFRESH_TOKEN_SECRET, token.refreshToken))) return "save-failed";

    rememberAccessToken(token);
    return "connected";
  } catch (error) {
    console.error("Constant Contact: authorization failed:", error);
    return "rejected";
  }
}

async function getAccessToken(credentials: { clientId: string; clientSecret: string }) {
  if (cachedAccessToken && cachedAccessToken.expires > Date.now()) {
    return cachedAccessToken.value;
  }

  const refreshToken = await readRefreshToken();
  if (!refreshToken) return null;

  const token = await requestToken(credentials, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  if (!token) return null;

  // Each refresh returns a replacement refresh token; keep the newest.
  if (token.refreshToken && token.refreshToken !== refreshToken) {
    await writeSecret(REFRESH_TOKEN_SECRET, token.refreshToken);
  }
  rememberAccessToken(token);
  return token.accessToken;
}

/** The account's contact lists, for the admin's list picker. Null when the request failed. */
export async function listConstantContactLists(): Promise<ConstantContactList[] | null> {
  try {
    const settings = mergeSettingsWithEnv(await readStoredSettings());
    if (!settings.clientId || !settings.clientSecret) return null;
    const accessToken = await getAccessToken({
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
    });
    if (!accessToken) return null;

    const response = await fetch(`${API_BASE}/contact_lists?limit=1000`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status === 401) cachedAccessToken = null;
    if (!response.ok) return null;
    return parseContactLists(await response.json().catch(() => null));
  } catch (error) {
    console.error("Constant Contact: could not load lists:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Signups
// ---------------------------------------------------------------------------

/** Everything needed to add contacts, or null when setup is incomplete. */
export async function resolveConstantContactConfig(): Promise<ConstantContactConfig | null> {
  const settings = mergeSettingsWithEnv(await readStoredSettings());
  if (!settings.clientId || !settings.clientSecret || !settings.listId) return null;
  return {
    clientId: settings.clientId,
    clientSecret: settings.clientSecret,
    listId: settings.listId,
  };
}

export type ConstantContactResult =
  | { ok: true; action: "created" | "updated" }
  | { ok: false; error: string };

/** Adds (or updates) a contact on the configured list. Never throws. */
export async function addContactToNewsletterList(
  email: string,
  config: ConstantContactConfig,
): Promise<ConstantContactResult> {
  try {
    const accessToken = await getAccessToken(config);
    if (!accessToken) {
      return { ok: false, error: "authorization-failed" };
    }

    const response = await fetch(`${API_BASE}/contacts/sign_up_form`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email_address: email, list_memberships: [config.listId] }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 401) {
      cachedAccessToken = null;
    }
    if (!response.ok) {
      return { ok: false, error: `http-${response.status}` };
    }
    return { ok: true, action: response.status === 201 ? "created" : "updated" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.name : "request-failed" };
  }
}
