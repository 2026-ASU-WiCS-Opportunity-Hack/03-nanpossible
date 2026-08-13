/**
 * Import coaches crawled from directory.wial.org (data/coaches-directory.json,
 * produced by scripts/crawl-wial-directory.ts) into the `coaches` table.
 *
 * Photos are always re-hosted into the public `coach-photos` storage bucket
 * (path `directory/<slug>.<ext>`) so next/image can serve them from the
 * Supabase host instead of hotlinking directory.wial.org.
 *
 * Rows are upserted with deterministic ids derived from the directory slug,
 * so re-running the import updates rather than duplicates. Coaches are
 * imported as approved (they are already published on the official WIAL
 * directory). `chapter_id` is resolved from the profile's "Affiliate" name
 * when a chapter with a matching name exists.
 *
 * Usage:
 *   npx tsx scripts/import-directory-coaches.ts             # upsert via Supabase API
 *   npx tsx scripts/import-directory-coaches.ts --emit-sql out.sql
 *     # writes idempotent SQL instead of using the data API (photos are still
 *     # uploaded via the storage API); apply with psql when the data API is
 *     # unavailable, e.g.:
 *     #   docker exec -i supabase_db_03-nanpossible psql -U postgres -d postgres < out.sql
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DirectoryCoach } from "./crawl-wial-directory";

const DATA_PATH = path.join(process.cwd(), "data", "coaches-directory.json");
const PHOTO_BUCKET = "coach-photos";
const PHOTO_PREFIX = "directory";
const FILE_BUCKET = "coach-files";
const CV_PREFIX = "directory-cv";
// Fixed namespace so ids stay stable across runs (uuid v5, RFC 4122).
const SLUG_NAMESPACE = "8f0b0d0e-4b1a-4a5e-9d5b-2f6a1c3e7a90";

function uuidV5FromSlug(slug: string): string {
  const namespaceBytes = Buffer.from(SLUG_NAMESPACE.replace(/-/g, ""), "hex");
  const hash = createHash("sha1")
    .update(namespaceBytes)
    .update(slug, "utf8")
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function cleanText(value: string | null): string | null {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed : null;
}

function cleanMultiline(value: string | null): string | null {
  const trimmed = value
    ?.replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return trimmed ? trimmed : null;
}

/**
 * Directory dates are MM/DD/YYYY, but a few profiles carry hand-entered
 * DD/MM/YYYY values (e.g. "13/09/2026") — swap when the month is impossible.
 */
function parseUsDate(value: string | null): string | null {
  const match = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }
  const year = match[3];
  let [, month, day] = match;
  if (Number(month) > 12 && Number(day) <= 12) {
    [month, day] = [day, month];
  }
  if (Number(month) > 12 || Number(day) > 31) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

/** Storage object keys must be ASCII-safe. */
function asciiSlug(slug: string): string {
  return slug
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-");
}

interface CoachRow {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  organization: string | null;
  phone: string | null;
  bio: string | null;
  credentials: string | null;
  awards: string | null;
  cert_level: DirectoryCoach["certLevel"];
  cert_valid_until: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  website: string | null;
  linkedin: string | null;
  blog_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  photo_url: string | null;
  cv_url: string | null;
  affiliate: string | null;
}

function toRow(
  coach: DirectoryCoach,
  photoUrl: string | null,
  cvUrl: string | null,
): CoachRow {
  // lat/lng of exactly (0, 0) is the directory's "not geocoded" marker.
  const hasCoords =
    coach.lat !== null && coach.lng !== null && !(coach.lat === 0 && coach.lng === 0);
  const city = cleanText(coach.city);
  return {
    id: uuidV5FromSlug(coach.slug),
    slug: coach.slug,
    name: cleanText(coach.name) ?? coach.slug,
    title: cleanText(coach.title),
    organization: cleanText(coach.company),
    phone: cleanText(coach.phone),
    bio: cleanMultiline(coach.aboutMe),
    credentials: cleanMultiline(coach.credentials),
    awards: cleanMultiline(coach.awards),
    cert_level: coach.certLevel,
    cert_valid_until: parseUsDate(coach.certValidUntil),
    location_city: city,
    location_state: cleanText(coach.stateName),
    location_country: cleanText(coach.countryName),
    location_lat: hasCoords ? coach.lat : null,
    location_lng: hasCoords ? coach.lng : null,
    website: cleanText(coach.website),
    linkedin: cleanText(coach.linkedin),
    blog_url: cleanText(coach.blog),
    youtube_url: cleanText(coach.youtube),
    twitter_url: cleanText(coach.twitter),
    facebook_url: cleanText(coach.facebook),
    photo_url: photoUrl,
    cv_url: cvUrl,
    affiliate: cleanText(coach.affiliate),
  };
}

async function ensurePublicBucket(
  supabase: SupabaseClient,
  bucket: string,
): Promise<boolean> {
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

async function uploadPhotos(
  supabase: SupabaseClient,
  coaches: DirectoryCoach[],
): Promise<Map<string, string>> {
  const photoUrls = new Map<string, string>();
  const withPhotos = coaches.filter((coach) => coach.photoUrl);
  if (withPhotos.length === 0 || !(await ensurePublicBucket(supabase, PHOTO_BUCKET))) {
    return photoUrls;
  }
  console.log(`Re-hosting ${withPhotos.length} photos into ${PHOTO_BUCKET}/${PHOTO_PREFIX}/…`);
  for (const coach of withPhotos) {
    try {
      const response = await fetch(coach.photoUrl!);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const contentType = response.headers.get("content-type") ?? "image/webp";
      const ext = contentType.includes("png") ? "png" : contentType.includes("jpeg") ? "jpg" : "webp";
      const objectPath = `${PHOTO_PREFIX}/${asciiSlug(coach.slug)}.${ext}`;
      const body = Buffer.from(await response.arrayBuffer());
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(objectPath, body, { upsert: true, contentType });
      if (error) {
        throw new Error(error.message);
      }
      const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(objectPath);
      photoUrls.set(coach.slug, data.publicUrl);
    } catch (error) {
      console.warn(`photo failed for ${coach.slug}: ${String(error)}`);
    }
  }
  return photoUrls;
}

async function uploadCvs(
  supabase: SupabaseClient,
  coaches: DirectoryCoach[],
): Promise<Map<string, string>> {
  const cvUrls = new Map<string, string>();
  const withCvs = coaches.filter((coach) => coach.cvUrl);
  if (withCvs.length === 0 || !(await ensurePublicBucket(supabase, FILE_BUCKET))) {
    return cvUrls;
  }

  console.log(`Re-hosting ${withCvs.length} CVs into ${FILE_BUCKET}/${CV_PREFIX}/…`);
  for (const coach of withCvs) {
    try {
      const response = await fetch(coach.cvUrl!);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const urlExt = coach.cvUrl!.split(".").pop()?.toLowerCase() ?? "";
      const ext = ["pdf", "doc", "docx"].includes(urlExt) ? urlExt : "pdf";
      const contentType =
        response.headers.get("content-type") ?? "application/octet-stream";
      const objectPath = `${CV_PREFIX}/${asciiSlug(coach.slug)}.${ext}`;
      const body = Buffer.from(await response.arrayBuffer());
      const { error } = await supabase.storage
        .from(FILE_BUCKET)
        .upload(objectPath, body, { upsert: true, contentType });
      if (error) {
        throw new Error(error.message);
      }
      const { data } = supabase.storage.from(FILE_BUCKET).getPublicUrl(objectPath);
      cvUrls.set(coach.slug, data.publicUrl);
    } catch (error) {
      console.warn(`cv failed for ${coach.slug}: ${String(error)}`);
    }
  }
  return cvUrls;
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

function emitSql(rows: CoachRow[]): string {
  const lines = [
    "-- Generated by scripts/import-directory-coaches.ts --emit-sql",
    "begin;",
  ];
  for (const row of rows) {
    const chapterExpr = row.affiliate
      ? `(select id from public.chapters where lower(name) = lower(${sqlLiteral(row.affiliate)}) limit 1)`
      : "null";
    lines.push(
      `insert into public.coaches (id, chapter_id, slug, name, title, organization, phone, bio, credentials, awards, cert_level, certification_level, cert_valid_until, location, location_city, location_state, location_country, location_lat, location_lng, specializations, languages, website, linkedin, blog_url, youtube_url, twitter_url, facebook_url, photo_url, cv_url, approved, last_approved_at, rejection_reason, rejected_at)
values (${sqlLiteral(row.id)}, ${chapterExpr}, ${sqlLiteral(row.slug)}, ${sqlLiteral(row.name)}, ${sqlLiteral(row.title)}, ${sqlLiteral(row.organization)}, ${sqlLiteral(row.phone)}, ${sqlLiteral(row.bio)}, ${sqlLiteral(row.credentials)}, ${sqlLiteral(row.awards)}, ${sqlLiteral(row.cert_level)}::public.certification_level, ${sqlLiteral(row.cert_level)}::public.certification_level, ${sqlLiteral(row.cert_valid_until)}::date, ${sqlLiteral([row.location_city, row.location_country].filter(Boolean).join(", ") || null)}, ${sqlLiteral(row.location_city)}, ${sqlLiteral(row.location_state)}, ${sqlLiteral(row.location_country)}, ${sqlLiteral(row.location_lat)}, ${sqlLiteral(row.location_lng)}, '{}', '{}', ${sqlLiteral(row.website)}, ${sqlLiteral(row.linkedin)}, ${sqlLiteral(row.blog_url)}, ${sqlLiteral(row.youtube_url)}, ${sqlLiteral(row.twitter_url)}, ${sqlLiteral(row.facebook_url)}, ${sqlLiteral(row.photo_url)}, ${sqlLiteral(row.cv_url)}, true, now(), null, null)
on conflict (id) do update set chapter_id = excluded.chapter_id, slug = excluded.slug, name = excluded.name, title = excluded.title, organization = excluded.organization, phone = excluded.phone, bio = excluded.bio, credentials = excluded.credentials, awards = excluded.awards, cert_level = excluded.cert_level, certification_level = excluded.certification_level, cert_valid_until = excluded.cert_valid_until, location = excluded.location, location_city = excluded.location_city, location_state = excluded.location_state, location_country = excluded.location_country, location_lat = excluded.location_lat, location_lng = excluded.location_lng, website = excluded.website, linkedin = excluded.linkedin, blog_url = excluded.blog_url, youtube_url = excluded.youtube_url, twitter_url = excluded.twitter_url, facebook_url = excluded.facebook_url, photo_url = coalesce(excluded.photo_url, public.coaches.photo_url), cv_url = coalesce(excluded.cv_url, public.coaches.cv_url), approved = true, updated_at = now();`,
    );
  }
  lines.push("commit;");
  return `${lines.join("\n")}\n`;
}

async function upsertViaApi(supabase: SupabaseClient, rows: CoachRow[]): Promise<void> {
  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id,name");
  if (chaptersError) {
    throw new Error(`Cannot read chapters: ${chaptersError.message}`);
  }
  const chapterByName = new Map(
    (chapters ?? []).map((chapter) => [chapter.name.toLowerCase(), chapter.id]),
  );

  let done = 0;
  for (const row of rows) {
    const { affiliate, ...columns } = row;
    const { error } = await supabase.from("coaches").upsert({
      ...columns,
      chapter_id: affiliate ? (chapterByName.get(affiliate.toLowerCase()) ?? null) : null,
      certification_level: row.cert_level,
      location: [row.location_city, row.location_country].filter(Boolean).join(", ") || null,
      specializations: [],
      languages: [],
      approved: true,
      last_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) {
      throw new Error(`Upsert failed for ${row.name}: ${error.message}`);
    }
    done += 1;
    if (done % 100 === 0) {
      console.log(`upserted ${done}/${rows.length}`);
    }
  }
  console.log(`Upserted ${rows.length} coaches.`);
}

async function main(): Promise<void> {
  process.loadEnvFile(
    (await readFile(".env.local").catch(() => null)) ? ".env.local" : ".env",
  );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const coaches: DirectoryCoach[] = JSON.parse(await readFile(DATA_PATH, "utf8"));
  console.log(`Loaded ${coaches.length} coaches from ${DATA_PATH}`);

  const photoUrls = await uploadPhotos(supabase, coaches);
  console.log(`Photos re-hosted: ${photoUrls.size}`);
  const cvUrls = await uploadCvs(supabase, coaches);
  console.log(`CVs re-hosted: ${cvUrls.size}`);

  const rows = coaches.map((coach) =>
    toRow(coach, photoUrls.get(coach.slug) ?? null, cvUrls.get(coach.slug) ?? null),
  );

  const emitIndex = process.argv.indexOf("--emit-sql");
  if (emitIndex >= 0) {
    const outPath = process.argv[emitIndex + 1];
    if (!outPath) {
      throw new Error("--emit-sql requires an output path");
    }
    await writeFile(outPath, emitSql(rows));
    console.log(`Wrote SQL for ${rows.length} coaches to ${outPath}`);
    return;
  }

  await upsertViaApi(supabase, rows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
