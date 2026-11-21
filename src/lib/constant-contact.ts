import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";

/**
 * Constant Contact v3 client for newsletter signups (#164).
 *
 * Configuration (all four are required, otherwise `isConfigured` is false and
 * signups are only stored locally):
 *   CONSTANT_CONTACT_CLIENT_ID / CONSTANT_CONTACT_CLIENT_SECRET — the app's API key and secret
 *   CONSTANT_CONTACT_LIST_ID — the list to add contacts to
 *   CONSTANT_CONTACT_REFRESH_TOKEN — from a one-time OAuth2 server-flow authorization
 *
 * Constant Contact returns a new refresh token on every refresh, so the
 * latest one is kept in Supabase Vault (`set_platform_secret`) and preferred
 * over the env value, which only seeds the first exchange.
 */

const TOKEN_URL = "https://authz.constantcontact.com/oauth2/default/v1/token";
const SIGN_UP_URL = "https://api.cc.email/v3/contacts/sign_up_form";
const REFRESH_TOKEN_SECRET = "constant_contact_refresh_token";
const REQUEST_TIMEOUT_MS = 8000;

export type ConstantContactConfig = {
  clientId: string;
  clientSecret: string;
  listId: string;
  refreshToken: string;
};

export function readConstantContactConfig(
  env: Record<string, string | undefined> = process.env,
): ConstantContactConfig | null {
  const clientId = env.CONSTANT_CONTACT_CLIENT_ID?.trim();
  const clientSecret = env.CONSTANT_CONTACT_CLIENT_SECRET?.trim();
  const listId = env.CONSTANT_CONTACT_LIST_ID?.trim();
  const refreshToken = env.CONSTANT_CONTACT_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !listId || !refreshToken) {
    return null;
  }
  return { clientId, clientSecret, listId, refreshToken };
}

export type TokenResponse = { accessToken: string; refreshToken: string | null; expiresIn: number };

/** Parses the token endpoint payload; `expires_in` arrives as a number or a string. */
export function parseTokenResponse(payload: unknown): TokenResponse | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const accessToken = typeof record.access_token === "string" ? record.access_token : "";
  if (!accessToken) return null;
  const expiresIn = Number(record.expires_in);
  return {
    accessToken,
    refreshToken:
      typeof record.refresh_token === "string" && record.refresh_token
        ? record.refresh_token
        : null,
    expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600,
  };
}

let cachedAccessToken: { value: string; expires: number } | null = null;

async function readStoredRefreshToken(): Promise<string | null> {
  const client = createServiceRoleSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc("get_platform_secret", {
    p_name: REFRESH_TOKEN_SECRET,
  });
  if (error) return null;
  return typeof data === "string" && data.trim() ? data.trim() : null;
}

async function storeRefreshToken(token: string) {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    console.error("Constant Contact: no service client, the new refresh token was not saved.");
    return;
  }
  const { error } = await client.rpc("set_platform_secret", {
    p_name: REFRESH_TOKEN_SECRET,
    p_value: token,
  });
  if (error) {
    console.error("Constant Contact: could not save the new refresh token:", error.message);
  }
}

async function requestToken(config: ConstantContactConfig, refreshToken: string) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) return null;
  return parseTokenResponse(await response.json().catch(() => null));
}

async function getAccessToken(config: ConstantContactConfig): Promise<string | null> {
  if (cachedAccessToken && cachedAccessToken.expires > Date.now()) {
    return cachedAccessToken.value;
  }

  const stored = await readStoredRefreshToken();
  // Try the stored token first; fall back to the env seed if it was replaced there.
  const candidates = [...new Set([stored, config.refreshToken].filter(Boolean))] as string[];

  for (const candidate of candidates) {
    const token = await requestToken(config, candidate);
    if (!token) continue;
    if (token.refreshToken && token.refreshToken !== stored) {
      await storeRefreshToken(token.refreshToken);
    }
    cachedAccessToken = {
      value: token.accessToken,
      // Refresh a minute early.
      expires: Date.now() + Math.max(token.expiresIn - 60, 60) * 1000,
    };
    return token.accessToken;
  }

  return null;
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

    const response = await fetch(SIGN_UP_URL, {
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
