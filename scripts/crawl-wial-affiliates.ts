/**
 * Crawl https://directory.wial.org/affiliates and write every affiliate
 * profile to data/affiliates-directory.json. Read-only against the directory;
 * safe to re-run.
 *
 * Each profile page embeds the full member record as a `const profs = {...}`
 * JSON blob, which is far more reliable than scraping the rendered widgets.
 * Only the whitelisted fields below are persisted — the blob also carries
 * account internals (login token, password hash, last login IP) that must
 * never be written to disk.
 *
 * Usage: npx tsx scripts/crawl-wial-affiliates.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://directory.wial.org";
const OUTPUT_PATH = path.join(process.cwd(), "data", "affiliates-directory.json");
const USER_AGENT = "WIAL-Platform importer (contact: greg@ohack.org)";

// Real affiliates whose directory profile is unlisted (hidden from the
// /affiliates results) but still published at a canonical URL.
const EXTRA_PROFILE_PATHS = ["/united-states/affiliates/wial-italy"];

export interface DirectoryAffiliate {
  slug: string;
  profileUrl: string;
  name: string;
  company: string | null;
  contactName: string | null;
  contactEmail: string | null;
  website: string | null;
  blog: string | null;
  youtube: string | null;
  facebook: string | null;
  linkedin: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null;
  zipCode: string | null;
  countryCode: string | null;
  countryName: string | null;
  lat: number | null;
  lng: number | null;
  aboutHtml: string | null;
  credentials: string | null;
  awards: string | null;
  logoUrl: string | null;
  listed: boolean;
  memberStatus: number | null;
  joinDate: string | null;
}

// The directory 301-redirects query-string URLs to themselves until the
// session cookie it sets is echoed back, so follow redirects manually with a
// one-cookie jar instead of redirect: "follow".
let sessionCookie: string | null = null;

async function fetchPage(url: string, attempt = 1): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html",
        ...(sessionCookie ? { cookie: sessionCookie } : {}),
      },
      redirect: "manual",
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      sessionCookie = setCookie.split(";")[0];
    }
    if (response.status >= 300 && response.status < 400) {
      if (attempt >= 5) {
        throw new Error(`redirect loop at HTTP ${response.status}`);
      }
      const location = response.headers.get("location");
      return fetchPage(new URL(location ?? url, url).toString(), attempt + 1);
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    if (attempt >= 3) {
      throw new Error(`Failed to fetch ${url}: ${String(error)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    return fetchPage(url, attempt + 1);
  }
}

// The listing currently fits on one page (query-string pagination URLs 301
// to themselves server-side), so start from /affiliates and only follow
// pagination links that actually appear in the markup.
async function collectProfilePaths(): Promise<Map<string, string>> {
  const bySlug = new Map<string, string>();
  const queue = [`${BASE_URL}/affiliates`];
  const visited = new Set<string>();
  while (queue.length) {
    const url = queue.shift()!;
    if (visited.has(url)) {
      continue;
    }
    visited.add(url);
    const html = await fetchPage(url);
    const matches = [...html.matchAll(/href="(\/[^"]*?\/affiliates\/([^"/?#]+))"/g)];
    let added = 0;
    for (const match of matches) {
      const slug = decodeURIComponent(match[2]);
      if (slug === "connect" || bySlug.has(slug)) {
        continue;
      }
      bySlug.set(slug, match[1]);
      added += 1;
    }
    for (const pager of html.matchAll(/href="(\/affiliates\?page=\d+)"/g)) {
      queue.push(`${BASE_URL}${pager[1]}`);
    }
    console.log(`list ${url}: +${added} (total ${bySlug.size})`);
  }
  return bySlug;
}

/**
 * Extract the `const profs = {...}` member record. The object can contain
 * nested braces inside strings, so scan with a tiny state machine instead of
 * a regex.
 */
function extractProfsBlob(html: string): Record<string, unknown> | null {
  const marker = html.indexOf("const profs");
  if (marker < 0) {
    return null;
  }
  const start = html.indexOf("{", marker);
  if (start < 0) {
    return null;
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i += 1) {
    const char = html[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1)) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function textField(blob: Record<string, unknown>, key: string): string | null {
  const value = blob[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function numberField(blob: Record<string, unknown>, key: string): number | null {
  const raw = blob[key];
  const parsed =
    typeof raw === "number" ? raw : typeof raw === "string" ? Number.parseFloat(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed === 0) {
    return null;
  }
  return parsed;
}

function absoluteUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.startsWith("/") ? `${BASE_URL}${value}` : value;
}

function parseProfile(
  blob: Record<string, unknown>,
  profilePath: string,
  listed: boolean,
): DirectoryAffiliate {
  const slug = decodeURIComponent(profilePath.split("/").pop() ?? profilePath);
  const active = blob.active;
  return {
    slug,
    profileUrl: `${BASE_URL}${profilePath}`,
    name:
      textField(blob, "full_name") ??
      textField(blob, "affiliate") ??
      textField(blob, "company") ??
      slug,
    company: textField(blob, "company"),
    contactName: textField(blob, "contact_name"),
    contactEmail: textField(blob, "email"),
    website: textField(blob, "website"),
    blog: textField(blob, "blog"),
    youtube: textField(blob, "youtube"),
    facebook: textField(blob, "facebook"),
    linkedin: textField(blob, "linkedin"),
    addressLine1: textField(blob, "address1"),
    addressLine2: textField(blob, "address2"),
    city: textField(blob, "city"),
    stateProvince: textField(blob, "state_ln") ?? textField(blob, "state_code"),
    zipCode: textField(blob, "zip_code"),
    countryCode: textField(blob, "country_code"),
    countryName: textField(blob, "country_ln") ?? textField(blob, "country_name"),
    lat: numberField(blob, "lat"),
    lng: numberField(blob, "lon"),
    aboutHtml: textField(blob, "about_me"),
    credentials: textField(blob, "credentials"),
    awards: textField(blob, "awards"),
    logoUrl: absoluteUrl(textField(blob, "image_main_file") ?? textField(blob, "logo_file")),
    listed,
    memberStatus:
      typeof active === "number"
        ? active
        : typeof active === "string" && active.trim()
          ? Number.parseInt(active, 10)
          : null,
    joinDate: textField(blob, "join_date"),
  };
}

async function crawl(): Promise<void> {
  const listedBySlug = await collectProfilePaths();
  for (const extra of EXTRA_PROFILE_PATHS) {
    const slug = decodeURIComponent(extra.split("/").pop() ?? extra);
    if (!listedBySlug.has(slug)) {
      console.log(`adding unlisted profile: ${slug}`);
    }
  }

  const targets = new Map<string, { path: string; listed: boolean }>();
  for (const [slug, profilePath] of listedBySlug) {
    targets.set(slug, { path: profilePath, listed: true });
  }
  for (const extra of EXTRA_PROFILE_PATHS) {
    const slug = decodeURIComponent(extra.split("/").pop() ?? extra);
    if (!targets.has(slug)) {
      targets.set(slug, { path: extra, listed: false });
    }
  }

  console.log(`Found ${targets.size} affiliate profiles. Fetching…`);
  const affiliates: DirectoryAffiliate[] = [];
  const failures: string[] = [];

  for (const [slug, target] of targets) {
    try {
      const html = await fetchPage(`${BASE_URL}${encodeURI(target.path)}`);
      const blob = extractProfsBlob(html);
      if (!blob) {
        failures.push(`${target.path}: member record blob not found`);
        continue;
      }
      affiliates.push(parseProfile(blob, target.path, target.listed));
      console.log(`fetched ${slug}`);
    } catch (error) {
      failures.push(`${target.path}: ${String(error)}`);
    }
  }

  affiliates.sort((left, right) => left.slug.localeCompare(right.slug));

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(
      {
        source: `${BASE_URL}/affiliates`,
        crawledAt: new Date().toISOString(),
        count: affiliates.length,
        affiliates,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Wrote ${affiliates.length} affiliates to ${OUTPUT_PATH}`);
  if (failures.length) {
    console.error(`Failures (${failures.length}):`);
    for (const failure of failures) {
      console.error(`  ${failure}`);
    }
    process.exitCode = 1;
  }
}

crawl().catch((error) => {
  console.error(error);
  process.exit(1);
});
