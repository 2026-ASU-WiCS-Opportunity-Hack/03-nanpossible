/**
 * Import affiliates crawled from directory.wial.org
 * (data/affiliates-directory.json, produced by
 * scripts/crawl-wial-affiliates.ts) into the `chapters` table.
 *
 * Matching is conservative and idempotent: an affiliate updates the chapter
 * whose `directory_slug` already equals its slug, else the chapter whose
 * subdomain equals the slug minus the "wial-" prefix, else a chapter with the
 * same name (case-insensitive). Anything unmatched is inserted as a new
 * active chapter.
 *
 * Directory-owned metadata (directory_slug, contact_name, address, social
 * links) always follows the directory. Admin-curated fields are only filled
 * when empty (country, region, description, contact_email), except
 * website_url and logo_url, which the directory updates whenever it has a
 * value. Logos are re-hosted into the public `affiliate-logos` bucket so we
 * never hotlink directory.wial.org.
 *
 * wial-global is skipped: it is WIAL headquarters (this platform), not an
 * affiliate, and the "global" subdomain is protected. Profiles that are not
 * on WIAL's affiliate roster (AFFILIATE_ROSTER_SLUGS) are retired instead of
 * imported: their chapter rows are set inactive, never deleted.
 *
 * Usage:
 *   npx tsx scripts/import-directory-affiliates.ts             # via Supabase API
 *   npx tsx scripts/import-directory-affiliates.ts --emit-sql out.sql
 *     # writes idempotent SQL instead of using the data API (logos are still
 *     # uploaded via the storage API); apply with psql when the data API is
 *     # unavailable, e.g.:
 *     #   docker exec -i supabase_db_03-nanpossible psql -U postgres -d postgres < out.sql
 *   npx tsx scripts/import-directory-affiliates.ts --emit-sql out.sql --skip-logos
 *     # no storage upload and no Supabase env needed — logo_url is left
 *     # untouched; this is how supabase/migrations/20260913000000 was generated
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DirectoryAffiliate } from "./crawl-wial-affiliates";

const DATA_PATH = path.join(process.cwd(), "data", "affiliates-directory.json");
const LOGO_BUCKET = "affiliate-logos";
const LOGO_PREFIX = "directory";
const SKIPPED_SLUGS = new Set(["wial-global"]);

/**
 * WIAL's affiliate roster (17), confirmed by WIAL on 2026-09-13 (France
 * confirmed separately — wial.fr is live). directory.wial.org itself went
 * offline in September 2026 (self-signed certificate, then 404), so the last
 * Wayback capture of its listing is the reference:
 * https://web.archive.org/web/20260228034924/http://directory.wial.org/affiliates
 * (2026-02-28). It lists the same 18 profiles as data/affiliates-directory.json
 * (crawled 2026-09-05), which stays the source of profile details because the
 * archive never captured the profile pages.
 *
 * A crawled profile that is not on this roster (wial-indonesia) is retired:
 * skipped from the upsert and its chapter set inactive — never deleted, so
 * coaches keep their chapter_id and an assigned affiliate head does not trip
 * users_chapter_admin_requires_chapter.
 */
const AFFILIATE_ROSTER_SLUGS = new Set([
  "wial-brazil",
  "wial-cambodia",
  "wial-canada",
  "wial-china",
  "wial-france",
  "wial-italy",
  "wial-japan",
  "wial-malaysia",
  "wial-netherlands",
  "wial-nigeria",
  "wial-philippines",
  "wial-poland",
  "wial-singapore",
  "wial-taiwan",
  "wial-thailand",
  "wial-usa",
  "wial-vietnam",
]);

/**
 * Chapters seeded before the directory import (migration 20260810000000)
 * that were never affiliates on the directory and are not on the roster.
 */
const RETIRED_SUBDOMAINS = ["russia"];

interface RetiredAffiliates {
  directorySlugs: string[];
  subdomains: string[];
}
const FALLBACK_CONTACT_EMAIL = "info@wial.org";

const regionByCountry = new Map<string, string>([
  ["brazil", "South America"],
  ["cambodia", "Asia Pacific"],
  ["canada", "North America"],
  ["china", "Asia Pacific"],
  ["france", "Europe"],
  ["indonesia", "Asia Pacific"],
  ["italy", "Europe"],
  ["japan", "Asia Pacific"],
  ["malaysia", "Asia Pacific"],
  ["netherlands", "Europe"],
  ["nigeria", "Africa"],
  ["philippines", "Asia Pacific"],
  ["poland", "Europe"],
  ["singapore", "Asia Pacific"],
  ["taiwan", "Asia Pacific"],
  ["thailand", "Asia Pacific"],
  ["united states", "North America"],
  ["vietnam", "Asia Pacific"],
]);

// The wial-italy profile was never filled in: its address defaulted to the
// directory's US placeholder, so the country would come through wrong.
const countryOverrides = new Map<string, string>([["wial-italy", "Italy"]]);

// Affiliate links that must not follow the directory. WIAL Vietnam's listed
// site (actionlearningcoach.org, and the older wialvietnam.com → wial.vn) went
// offline in 2026; the Facebook page is its only live presence, so WIAL asked
// for it to be the affiliate link until they have a website again (2026-09-13).
const websiteOverrides = new Map<string, string>([
  ["wial-vietnam", "https://www.facebook.com/wialvietnam"],
]);

function cleanText(value: string | null): string | null {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed : null;
}

/**
 * Directory profiles for affiliates without a named lead carry the
 * placeholder "Leadership Opportunity Available!" — not a contact name.
 */
function cleanContactName(value: string | null): string | null {
  const cleaned = cleanText(value);
  if (!cleaned || /leadership opportunit/i.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Websites pointing back at wial.org (e.g. the become-an-affiliate page on
 * placeholder profiles) are not the affiliate's own site.
 */
function cleanWebsite(value: string | null): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }
  try {
    const url = new URL(cleaned.includes("://") ? cleaned : `https://${cleaned}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    const host = url.hostname.toLowerCase();
    if (host === "wial.org" || host.endsWith(".wial.org")) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function cleanLink(value: string | null): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }
  try {
    const url = new URL(cleaned.includes("://") ? cleaned : `https://${cleaned}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Storage object keys must be ASCII-safe. */
function asciiSlug(slug: string): string {
  return slug
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function subdomainForSlug(slug: string): string {
  return slug.replace(/^wial-/, "");
}

interface AffiliateRow {
  directory_slug: string;
  name: string;
  subdomain: string;
  country: string | null;
  region: string | null;
  description: string;
  contact_email: string | null;
  contact_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  website_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  blog_url: string | null;
  logo_url: string | null;
}

function toRow(affiliate: DirectoryAffiliate, logoUrl: string | null): AffiliateRow {
  const country =
    countryOverrides.get(affiliate.slug) ?? cleanText(affiliate.countryName);
  return {
    directory_slug: affiliate.slug,
    name: cleanText(affiliate.name) ?? affiliate.slug,
    subdomain: subdomainForSlug(affiliate.slug),
    country,
    region: country ? (regionByCountry.get(country.toLowerCase()) ?? null) : null,
    description: country
      ? `Action Learning programs, events, and coach certification in ${country === "United States" ? "the United States" : country}.`
      : "Action Learning programs, events, and coach certification.",
    contact_email: cleanText(affiliate.contactEmail),
    contact_name: cleanContactName(affiliate.contactName),
    address_line1: countryOverrides.has(affiliate.slug)
      ? null
      : cleanText(affiliate.addressLine1),
    address_line2: countryOverrides.has(affiliate.slug)
      ? null
      : cleanText(affiliate.addressLine2),
    city: countryOverrides.has(affiliate.slug) ? null : cleanText(affiliate.city),
    state_province: countryOverrides.has(affiliate.slug)
      ? null
      : cleanText(affiliate.stateProvince),
    postal_code: countryOverrides.has(affiliate.slug)
      ? null
      : cleanText(affiliate.zipCode),
    website_url: websiteOverrides.get(affiliate.slug) ?? cleanWebsite(affiliate.website),
    facebook_url: cleanLink(affiliate.facebook),
    linkedin_url: cleanLink(affiliate.linkedin),
    youtube_url: cleanLink(affiliate.youtube),
    blog_url: cleanWebsite(affiliate.blog),
    logo_url: logoUrl,
  };
}

async function ensurePublicBucket(supabase: SupabaseClient, bucket: string): Promise<boolean> {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((existing) => existing.name === bucket)) {
    return true;
  }
  const { error } = await supabase.storage.createBucket(bucket, { public: true });
  if (error) {
    console.warn(`Cannot create ${bucket} bucket: ${error.message}`);
    return false;
  }
  return true;
}

async function uploadLogos(
  supabase: SupabaseClient,
  affiliates: DirectoryAffiliate[],
): Promise<Map<string, string>> {
  const logoUrls = new Map<string, string>();
  const withLogos = affiliates.filter((affiliate) => affiliate.logoUrl);
  if (withLogos.length === 0 || !(await ensurePublicBucket(supabase, LOGO_BUCKET))) {
    return logoUrls;
  }
  console.log(`Re-hosting ${withLogos.length} logos into ${LOGO_BUCKET}/${LOGO_PREFIX}/…`);
  for (const affiliate of withLogos) {
    try {
      const response = await fetch(affiliate.logoUrl!);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const contentType = response.headers.get("content-type") ?? "image/webp";
      const ext = contentType.includes("png") ? "png" : contentType.includes("jpeg") ? "jpg" : "webp";
      const objectPath = `${LOGO_PREFIX}/${asciiSlug(affiliate.slug)}.${ext}`;
      const body = Buffer.from(await response.arrayBuffer());
      const { error } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(objectPath, body, { upsert: true, contentType });
      if (error) {
        throw new Error(error.message);
      }
      const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(objectPath);
      logoUrls.set(affiliate.slug, data.publicUrl);
    } catch (error) {
      console.warn(`logo failed for ${affiliate.slug}: ${String(error)}`);
    }
  }
  return logoUrls;
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

function sqlList(values: string[]): string {
  return values.map((value) => sqlLiteral(value)).join(", ");
}

function retirementSql(retired: RetiredAffiliates): string {
  const clauses = [
    retired.directorySlugs.length ? `directory_slug in (${sqlList(retired.directorySlugs)})` : null,
    retired.subdomains.length ? `subdomain in (${sqlList(retired.subdomains)})` : null,
  ].filter((clause): clause is string => clause !== null);
  return `-- Retired: still listed on the directory or seeded earlier, but not on WIAL's affiliate roster.
update public.chapters set
  status = 'inactive',
  updated_at = timezone('utc', now())
where status = 'active'
  and (${clauses.join(" or ")});`;
}

function emitSql(rows: AffiliateRow[], retired: RetiredAffiliates): string {
  const lines = [
    "-- Generated by scripts/import-directory-affiliates.ts --emit-sql",
    "begin;",
  ];
  for (const row of rows) {
    const matcher = `directory_slug = ${sqlLiteral(row.directory_slug)} or (directory_slug is null and (subdomain = ${sqlLiteral(row.subdomain)} or lower(name) = lower(${sqlLiteral(row.name)})))`;
    lines.push(
      `update public.chapters set
  status = 'active',
  directory_slug = ${sqlLiteral(row.directory_slug)},
  contact_name = ${sqlLiteral(row.contact_name)},
  address_line1 = ${sqlLiteral(row.address_line1)},
  address_line2 = ${sqlLiteral(row.address_line2)},
  city = ${sqlLiteral(row.city)},
  state_province = ${sqlLiteral(row.state_province)},
  postal_code = ${sqlLiteral(row.postal_code)},
  facebook_url = ${sqlLiteral(row.facebook_url)},
  linkedin_url = ${sqlLiteral(row.linkedin_url)},
  youtube_url = ${sqlLiteral(row.youtube_url)},
  blog_url = ${sqlLiteral(row.blog_url)},
  website_url = coalesce(${sqlLiteral(row.website_url)}, website_url),
  logo_url = coalesce(${sqlLiteral(row.logo_url)}, logo_url),
  country = coalesce(country, ${sqlLiteral(row.country)}),
  region = coalesce(region, ${sqlLiteral(row.region)}),
  description = coalesce(nullif(description, ''), ${sqlLiteral(row.description)}),
  updated_at = timezone('utc', now())
where ${matcher};`,
      `insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select ${sqlLiteral(row.name)}, ${sqlLiteral(row.subdomain)}, 'en', 'en', 'active', ${sqlLiteral(row.contact_email ?? FALLBACK_CONTACT_EMAIL)}, '{}'::jsonb, '{}'::jsonb, ${sqlLiteral(row.description)}, ${sqlLiteral(row.region)}, ${sqlLiteral(row.country)}, ${sqlLiteral(row.description)}, ${sqlLiteral(row.website_url)}, ${sqlLiteral(row.logo_url)}, ${sqlLiteral(row.directory_slug)}, ${sqlLiteral(row.contact_name)}, ${sqlLiteral(row.address_line1)}, ${sqlLiteral(row.address_line2)}, ${sqlLiteral(row.city)}, ${sqlLiteral(row.state_province)}, ${sqlLiteral(row.postal_code)}, ${sqlLiteral(row.facebook_url)}, ${sqlLiteral(row.linkedin_url)}, ${sqlLiteral(row.youtube_url)}, ${sqlLiteral(row.blog_url)}
where not exists (select 1 from public.chapters where ${matcher});`,
    );
  }
  if (retired.directorySlugs.length || retired.subdomains.length) {
    lines.push(retirementSql(retired));
  }
  lines.push("commit;");
  return `${lines.join("\n")}\n`;
}

type ExistingChapter = {
  id: string;
  name: string;
  subdomain: string;
  directory_slug: string | null;
  country: string | null;
  region: string | null;
  description: string | null;
};

function findExisting(row: AffiliateRow, chapters: ExistingChapter[]): ExistingChapter | null {
  return (
    chapters.find((chapter) => chapter.directory_slug === row.directory_slug) ??
    chapters.find(
      (chapter) => !chapter.directory_slug && chapter.subdomain === row.subdomain,
    ) ??
    chapters.find(
      (chapter) =>
        !chapter.directory_slug &&
        chapter.name.trim().toLowerCase() === row.name.trim().toLowerCase(),
    ) ??
    null
  );
}

async function retireViaApi(
  supabase: SupabaseClient,
  retired: RetiredAffiliates,
): Promise<void> {
  const filters = [
    retired.directorySlugs.length
      ? `directory_slug.in.(${retired.directorySlugs.join(",")})`
      : null,
    retired.subdomains.length ? `subdomain.in.(${retired.subdomains.join(",")})` : null,
  ].filter((filter): filter is string => filter !== null);
  if (filters.length === 0) {
    return;
  }
  const { data, error } = await supabase
    .from("chapters")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("status", "active")
    .or(filters.join(","))
    .select("subdomain");
  if (error) {
    throw new Error(`Retirement failed: ${error.message}`);
  }
  for (const row of (data ?? []) as { subdomain: string }[]) {
    console.log(`retired ${row.subdomain} (set inactive)`);
  }
}

async function upsertViaApi(
  supabase: SupabaseClient,
  rows: AffiliateRow[],
  retired: RetiredAffiliates,
): Promise<void> {
  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, name, subdomain, directory_slug, country, region, description");
  if (error) {
    throw new Error(`Cannot read chapters: ${error.message}`);
  }
  const existingChapters = (chapters ?? []) as ExistingChapter[];

  let updated = 0;
  let created = 0;
  for (const row of rows) {
    const existing = findExisting(row, existingChapters);
    if (existing) {
      const patch: Record<string, unknown> = {
        status: "active",
        directory_slug: row.directory_slug,
        contact_name: row.contact_name,
        address_line1: row.address_line1,
        address_line2: row.address_line2,
        city: row.city,
        state_province: row.state_province,
        postal_code: row.postal_code,
        facebook_url: row.facebook_url,
        linkedin_url: row.linkedin_url,
        youtube_url: row.youtube_url,
        blog_url: row.blog_url,
        country: existing.country ?? row.country,
        region: existing.region ?? row.region,
        description: existing.description?.trim() ? existing.description : row.description,
        updated_at: new Date().toISOString(),
      };
      if (row.website_url) {
        patch.website_url = row.website_url;
      }
      if (row.logo_url) {
        patch.logo_url = row.logo_url;
      }
      const { error: updateError } = await supabase
        .from("chapters")
        .update(patch)
        .eq("id", existing.id);
      if (updateError) {
        throw new Error(`Update failed for ${row.name}: ${updateError.message}`);
      }
      updated += 1;
      console.log(`updated ${row.name} (${existing.subdomain})`);
    } else {
      const { error: insertError } = await supabase.from("chapters").insert({
        name: row.name,
        subdomain: row.subdomain,
        locale: "en",
        language: "en",
        status: "active",
        contact_email: row.contact_email ?? FALLBACK_CONTACT_EMAIL,
        theme_json: {},
        config: {},
        tagline: row.description,
        region: row.region,
        country: row.country,
        description: row.description,
        website_url: row.website_url,
        logo_url: row.logo_url,
        directory_slug: row.directory_slug,
        contact_name: row.contact_name,
        address_line1: row.address_line1,
        address_line2: row.address_line2,
        city: row.city,
        state_province: row.state_province,
        postal_code: row.postal_code,
        facebook_url: row.facebook_url,
        linkedin_url: row.linkedin_url,
        youtube_url: row.youtube_url,
        blog_url: row.blog_url,
      });
      if (insertError) {
        throw new Error(`Insert failed for ${row.name}: ${insertError.message}`);
      }
      created += 1;
      console.log(`created ${row.name} (${row.subdomain})`);
    }
  }
  await retireViaApi(supabase, retired);
  console.log(`Done: ${updated} updated, ${created} created.`);
}

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function main(): Promise<void> {
  const emitIndex = process.argv.indexOf("--emit-sql");
  const emitPath = emitIndex >= 0 ? process.argv[emitIndex + 1] : null;
  if (emitIndex >= 0 && !emitPath) {
    throw new Error("--emit-sql requires an output path");
  }
  const skipLogos = process.argv.includes("--skip-logos");

  const crawl = JSON.parse(await readFile(DATA_PATH, "utf8")) as {
    affiliates: DirectoryAffiliate[];
  };
  const retired: RetiredAffiliates = { directorySlugs: [], subdomains: [...RETIRED_SUBDOMAINS] };
  const affiliates = crawl.affiliates.filter((affiliate) => {
    if (SKIPPED_SLUGS.has(affiliate.slug)) {
      console.log(`skipping ${affiliate.slug} (WIAL headquarters, not an affiliate)`);
      return false;
    }
    if (!AFFILIATE_ROSTER_SLUGS.has(affiliate.slug)) {
      console.log(`retiring ${affiliate.slug} (not on WIAL's affiliate roster)`);
      retired.directorySlugs.push(affiliate.slug);
      retired.subdomains.push(subdomainForSlug(affiliate.slug));
      return false;
    }
    return true;
  });
  const crawledSlugs = new Set(affiliates.map((affiliate) => affiliate.slug));
  const missing = [...AFFILIATE_ROSTER_SLUGS].filter((slug) => !crawledSlugs.has(slug));
  if (missing.length) {
    console.warn(`Roster affiliates missing from the crawl: ${missing.join(", ")}`);
  }
  console.log(`Loaded ${affiliates.length} roster affiliates from ${DATA_PATH}`);

  const needsClient = !skipLogos || !emitPath;
  let supabase: SupabaseClient | null = null;
  if (needsClient) {
    process.loadEnvFile(
      (await readFile(".env.local").catch(() => null)) ? ".env.local" : ".env",
    );
    supabase = createSupabaseClient();
  }

  const logoUrls =
    skipLogos || !supabase ? new Map<string, string>() : await uploadLogos(supabase, affiliates);
  console.log(skipLogos ? "Logos skipped (--skip-logos)" : `Logos re-hosted: ${logoUrls.size}`);

  const rows = affiliates.map((affiliate) =>
    toRow(affiliate, logoUrls.get(affiliate.slug) ?? null),
  );

  if (emitPath) {
    await writeFile(emitPath, emitSql(rows, retired));
    console.log(`Wrote SQL for ${rows.length} affiliates to ${emitPath}`);
    return;
  }

  await upsertViaApi(supabase!, rows, retired);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
