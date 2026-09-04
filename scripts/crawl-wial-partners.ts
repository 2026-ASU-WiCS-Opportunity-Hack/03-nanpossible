/**
 * Crawl the official WIAL partner directory (directory.wial.org/partners — a
 * Brilliant Directories site) into:
 *
 *   - src/content/partners.json      fixture the app falls back to without a DB
 *   - public/partners/<slug>.<ext>   vendored logos (never hotlink the directory)
 *   - --emit-sql <file>              upsert statements for public.partners, to
 *                                    paste into a migration / run with psql
 *
 * The listing card carries the name, profile path and logo; each profile's
 * `table-display-*` widgets carry the website, about text and location. Row
 * ids are deterministic (derived from the directory slug) so re-crawls update
 * in place and the fixture matches the seeded rows.
 *
 *   npm run crawl:partners
 *   npm run crawl:partners -- --emit-sql supabase/migrations/2026xxxx_seed_partners.sql
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://directory.wial.org";
const LISTING_PATH = "/partners";
const FIXTURE_PATH = path.join(process.cwd(), "src", "content", "partners.json");
const LOGO_DIR = path.join(process.cwd(), "public", "partners");
const USER_AGENT = "WIAL-Platform importer (contact: greg@ohack.org)";
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
// SHA-1 of the directory's stock WIAL logo, served for members who never
// uploaded their own — a partner should not be shown wearing WIAL's logo.
const PLACEHOLDER_LOGO_HASHES = new Set(["699005ebc4953d4366bbe2bcb843fd83ec834912"]);

export interface DirectoryPartner {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string | null;
  description: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  countryCode: string | null;
  /** Site-relative path of the vendored logo, e.g. /partners/asio-consulting.webp */
  logoUrl: string | null;
  directoryUrl: string;
  sortOrder: number;
  active: boolean;
}

// The directory 301-redirects query-string URLs to themselves until the
// session cookie it sets is echoed back, so follow redirects manually.
let sessionCookie: string | null = null;

async function fetchResponse(url: string, attempt = 1): Promise<Response> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
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
      return fetchResponse(new URL(location ?? url, url).toString(), attempt + 1);
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response;
  } catch (error) {
    if (attempt >= 3) {
      throw new Error(`Failed to fetch ${url}: ${String(error)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    return fetchResponse(url, attempt + 1);
  }
}

async function fetchPage(url: string): Promise<string> {
  return (await fetchResponse(url)).text();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&hellip;/g, "…")
    .replace(/&bull;/g, "•")
    .replace(/&copy;/g, "©")
    .replace(/&reg;/g, "®")
    .replace(/&trade;/g, "™");
}

function stripTags(value: string): string {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/<[a-z][^<>]*$/i, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Stable UUID (v5-shaped) from the directory slug so re-runs upsert in place. */
function partnerIdFor(slug: string): string {
  const hex = createHash("sha1").update(`wial-partner:${slug}`).digest("hex").slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

type ListingCard = { name: string; profilePath: string; logoUrl: string | null };

function parseListing(html: string): ListingCard[] {
  const cards: ListingCard[] = [];
  const pattern = /<div class="grid_element">([\s\S]*?)<span class="google-pin-location"/g;
  for (const match of html.matchAll(pattern)) {
    const body = match[1];
    const name = body.match(/member-search-full-name">\s*([\s\S]*?)\s*<\/span>/);
    const href = body.match(/href="(\/[^"]+)"/);
    const logo = body.match(/<img[^>]+src="([^"]+)"/);
    if (!name || !href) {
      continue;
    }
    cards.push({
      name: stripTags(name[1]),
      profilePath: href[1],
      logoUrl: logo ? new URL(logo[1], BASE_URL).toString() : null,
    });
  }
  return cards;
}

/** Follow only pagination links that appear in the markup (see crawl-wial-affiliates). */
function nextPagePath(html: string): string | null {
  const match = html.match(/<a[^>]+href="([^"]*[?&]page=\d+[^"]*)"[^>]*rel="next"/i)
    ?? html.match(/<li[^>]*class="[^"]*next[^"]*"[^>]*>\s*<a[^>]+href="([^"]+)"/i);
  return match ? match[1] : null;
}

/**
 * Profile data lives in Brilliant Directories "table-view-group" blocks:
 * <div class="... table-display-<key>"><div class="col-sm-4 bold">Label</div>
 * <div class="col-sm-8">value…</div></div>
 */
function parseFieldBlocks(html: string): Map<string, { text: string; href: string | null }> {
  const fields = new Map<string, { text: string; href: string | null }>();
  for (const rawChunk of html.split(/class="table-view-group /g).slice(1)) {
    const headingIndex = rawChunk.search(/<h[123]\b/);
    const chunk = headingIndex >= 0 ? rawChunk.slice(0, headingIndex) : rawChunk;
    const keyMatch = chunk.match(/table-display-([a-z0-9_]+)"/);
    if (!keyMatch || fields.has(keyMatch[1])) {
      continue;
    }
    const valueMatch = chunk.match(/class="col-sm-8">([\s\S]*)$/);
    if (!valueMatch) {
      continue;
    }
    const hrefMatch = valueMatch[1].match(/href=['"]([^'"]+)['"]/);
    fields.set(keyMatch[1], {
      // The last widget on the page runs into the embedded map script; cut there.
      text: stripTags(valueMatch[1].split("#map-canvas")[0].split("$(document)")[0]),
      href: hrefMatch ? hrefMatch[1] : null,
    });
  }
  return fields;
}

function cleanWebsite(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || /wial\.org/i.test(trimmed)) {
    return null;
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

function asciiSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function downloadLogo(card: ListingCard, slug: string): Promise<string | null> {
  if (!card.logoUrl) {
    return null;
  }
  try {
    const response = await fetchResponse(card.logoUrl);
    const contentType = response.headers.get("content-type") ?? "image/webp";
    const ext = contentType.includes("png") ? "png" : contentType.includes("jpeg") ? "jpg" : "webp";
    const bytes = Buffer.from(await response.arrayBuffer());
    if (PLACEHOLDER_LOGO_HASHES.has(createHash("sha1").update(bytes).digest("hex"))) {
      console.log(`  (skipping placeholder WIAL logo for ${slug})`);
      return null;
    }
    const fileName = `${slug}.${ext}`;
    await mkdir(LOGO_DIR, { recursive: true });
    await writeFile(path.join(LOGO_DIR, fileName), bytes);
    return `/partners/${fileName}`;
  } catch (error) {
    console.warn(`logo failed for ${slug}: ${String(error)}`);
    return null;
  }
}

function sqlLiteral(value: string | number | boolean | null): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return `'${value.replace(/'/g, "''")}'`;
}

function emitSql(partners: DirectoryPartner[]): string {
  const rows = partners.map((partner) =>
    `  (${[
      sqlLiteral(partner.id),
      sqlLiteral(partner.slug),
      sqlLiteral(partner.name),
      sqlLiteral(partner.websiteUrl),
      sqlLiteral(partner.description),
      sqlLiteral(partner.city),
      sqlLiteral(partner.stateProvince),
      sqlLiteral(partner.country),
      sqlLiteral(partner.countryCode),
      sqlLiteral(partner.logoUrl),
      sqlLiteral(partner.directoryUrl),
      sqlLiteral(partner.sortOrder),
      sqlLiteral(partner.active),
    ].join(", ")})`,
  );
  return [
    "insert into public.partners",
    "  (id, slug, name, website_url, description, city, state_province, country, country_code, logo_url, directory_url, sort_order, active)",
    "values",
    rows.join(",\n"),
    "on conflict (slug) do update set",
    "  name = excluded.name,",
    "  website_url = coalesce(public.partners.website_url, excluded.website_url),",
    "  description = coalesce(public.partners.description, excluded.description),",
    "  city = excluded.city,",
    "  state_province = excluded.state_province,",
    "  country = excluded.country,",
    "  country_code = excluded.country_code,",
    "  logo_url = coalesce(public.partners.logo_url, excluded.logo_url),",
    "  directory_url = excluded.directory_url,",
    "  updated_at = now();",
    "",
  ].join("\n");
}

async function crawl(): Promise<void> {
  const emitIndex = process.argv.indexOf("--emit-sql");
  const emitPath = emitIndex >= 0 ? process.argv[emitIndex + 1] : null;

  const cards: ListingCard[] = [];
  const seen = new Set<string>();
  let pagePath: string | null = LISTING_PATH;
  while (pagePath && !seen.has(pagePath)) {
    seen.add(pagePath);
    const html = await fetchPage(new URL(pagePath, BASE_URL).toString());
    cards.push(...parseListing(html));
    pagePath = nextPagePath(html);
  }
  console.log(`Found ${cards.length} partner listings`);

  const partners: DirectoryPartner[] = [];
  for (const card of cards) {
    const slug = asciiSlug(decodeURIComponent(card.profilePath.split("/").pop() ?? card.name));
    const profileHtml = await fetchPage(`${BASE_URL}${card.profilePath}`);
    const fields = parseFieldBlocks(profileHtml);
    const text = (key: string) => fields.get(key)?.text.trim() || null;
    const stateName = text("state_ln");
    const countryCode = text("country_code")?.toUpperCase() ?? null;
    const rawCountry = text("country_ln");
    // One listing stores the ISO code in the country-name field; spell it out.
    const country =
      rawCountry && /^[A-Z]{2}$/.test(rawCountry)
        ? (regionNames.of(rawCountry) ?? rawCountry)
        : rawCountry;
    partners.push({
      id: partnerIdFor(slug),
      slug,
      name: card.name || text("company") || slug,
      websiteUrl: cleanWebsite(fields.get("website")?.href ?? text("website")),
      description: text("about_me"),
      city: text("city"),
      // Some listings repeat the country in the state field; keep it once.
      stateProvince: stateName && stateName !== country ? stateName : null,
      country,
      countryCode,
      logoUrl: await downloadLogo(card, slug),
      directoryUrl: `${BASE_URL}${card.profilePath}`,
      sortOrder: 0,
      active: true,
    });
    console.log(`  ${card.name}`);
  }

  partners.sort((a, b) => a.name.localeCompare(b.name, "en"));
  partners.forEach((partner, index) => {
    partner.sortOrder = (index + 1) * 10;
  });

  await writeFile(FIXTURE_PATH, `${JSON.stringify(partners, null, 2)}\n`);
  console.log(`Wrote ${partners.length} partners to ${path.relative(process.cwd(), FIXTURE_PATH)}`);

  if (emitPath) {
    await writeFile(emitPath, emitSql(partners));
    console.log(`Wrote seed SQL to ${emitPath}`);
  }
}

crawl().catch((error) => {
  console.error(error);
  process.exit(1);
});
