/**
 * Import the crawled wial.org Library (data/library-directory.json, produced by
 * scripts/crawl-wial-library.ts) into the `library_items` table and the public
 * `resource-files` storage bucket.
 *
 * Every wial.org-hosted asset (article PDFs, podcast MP3s, poster images) and
 * every thumbnail is re-hosted under `library/<slug>.<ext>` and
 * `library/thumbs/<slug>.<ext>` so /resources never hotlinks wial.org. Rows are
 * upserted on `slug`, so re-runs update in place. The script also regenerates
 * the `src/content/library.json` fixture (object paths, not URLs) that the app
 * falls back to when the database is unavailable.
 *
 * Usage:
 *   npx tsx scripts/import-library.ts                 # upload files + upsert via data API
 *   npx tsx scripts/import-library.ts --emit-sql out.sql
 *     # files are still uploaded; rows are written as idempotent SQL, e.g. for
 *     #   docker exec -i supabase_db_03-nanpossible psql -U postgres -d postgres < out.sql
 *   npx tsx scripts/import-library.ts --skip-files
 *     # reuse the object paths already recorded in src/content/library.json
 *   npx tsx scripts/import-library.ts --thumbs-only
 *     # keep the main files, re-generate only the thumbnails
 *
 * Thumbnails are resized with sharp to ≤480px wide WebP (~20–40 KB each) so a
 * /resources visit costs kilobytes of storage egress, not megabytes; the
 * source "medium" variants were often missing and fell back to 1–2 MB originals.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import type { DirectoryLibraryItem } from "./crawl-wial-library";

const DATA_PATH = path.join(process.cwd(), "data", "library-directory.json");
const FIXTURE_PATH = path.join(process.cwd(), "src", "content", "library.json");
const BUCKET = "resource-files";
const FILE_PREFIX = "library";
const THUMB_PREFIX = "library/thumbs";
const CONCURRENCY = 6;
const THUMB_MAX_WIDTH = 480;
const THUMB_WEBP_QUALITY = 75;

type FixtureItem = {
  slug: string;
  kind: DirectoryLibraryItem["kind"];
  title: string;
  summary: string | null;
  publishedOn: string;
  sourceUrl: string;
  externalUrl: string | null;
  filePath: string | null;
  fileType: string | null;
  thumbnailPath: string | null;
};

type LibraryRow = {
  slug: string;
  kind: string;
  title: string;
  summary: string | null;
  published_on: string;
  source_url: string;
  external_url: string | null;
  file_path: string | null;
  file_type: string | null;
  thumbnail_path: string | null;
};

const EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const TYPE_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(EXT_BY_TYPE).map(([type, ext]) => [ext, type]),
);

function extensionFor(url: string, contentType: string | null): string | null {
  const fromUrl = new URL(url).pathname.split(".").pop()?.toLowerCase() ?? "";
  const normalized = fromUrl === "jpeg" ? "jpg" : fromUrl;
  if (TYPE_BY_EXT[normalized]) {
    return normalized;
  }
  const base = contentType?.split(";")[0].trim() ?? "";
  return EXT_BY_TYPE[base] ?? null;
}

async function ensurePublicBucket(supabase: SupabaseClient): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((bucket) => bucket.name === BUCKET)) {
    return;
  }
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error) {
    throw new Error(`Cannot create ${BUCKET} bucket: ${error.message}`);
  }
}

async function download(sourceUrl: string): Promise<{ body: Buffer; contentType: string | null }> {
  const response = await fetch(sourceUrl, {
    headers: { "user-agent": "WIAL-Platform importer (contact: greg@ohack.org)" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type"),
  };
}

async function upload(
  supabase: SupabaseClient,
  objectPath: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, body, { upsert: true, contentType });
  if (error) {
    throw new Error(error.message);
  }
}

/** Re-host a main file (PDF / MP3 / poster image) unchanged. */
async function rehost(
  supabase: SupabaseClient,
  sourceUrl: string,
  prefix: string,
  slug: string,
): Promise<{ path: string; ext: string }> {
  const { body, contentType } = await download(sourceUrl);
  const ext = extensionFor(sourceUrl, contentType);
  if (!ext) {
    throw new Error(`unsupported type ${contentType ?? "unknown"}`);
  }
  const objectPath = `${prefix}/${slug}.${ext}`;
  await upload(supabase, objectPath, body, TYPE_BY_EXT[ext]);
  return { path: objectPath, ext };
}

/** Re-host a thumbnail as a small WebP so list views stay cheap to serve. */
async function rehostThumbnail(
  supabase: SupabaseClient,
  sourceUrl: string,
  slug: string,
): Promise<string> {
  const { body } = await download(sourceUrl);
  const resized = await sharp(body)
    .rotate()
    .resize({ width: THUMB_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMB_WEBP_QUALITY })
    .toBuffer();
  const objectPath = `${THUMB_PREFIX}/${slug}.webp`;
  await upload(supabase, objectPath, resized, "image/webp");
  return objectPath;
}

/** Remove every object under a prefix so re-runs never leave stale variants behind. */
async function pruneAll(supabase: SupabaseClient, prefix: string): Promise<void> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error || !data?.length) {
    return;
  }
  const paths = data.filter((entry) => entry.id).map((entry) => `${prefix}/${entry.name}`);
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await worker(items[index]);
      }
    }),
  );
  return results;
}

type FileMode = "all" | "thumbs-only" | "none";

async function buildFixture(
  supabase: SupabaseClient,
  items: DirectoryLibraryItem[],
  mode: FileMode,
): Promise<FixtureItem[]> {
  const previous = new Map<string, FixtureItem>();
  if (mode !== "all") {
    const existing: FixtureItem[] = JSON.parse(
      await readFile(FIXTURE_PATH, "utf8").catch(() => "[]"),
    );
    for (const item of existing) {
      previous.set(item.slug, item);
    }
  }
  if (mode !== "none") {
    await ensurePublicBucket(supabase);
    await pruneAll(supabase, THUMB_PREFIX);
    console.log(
      mode === "all"
        ? `Re-hosting files + thumbnails for ${items.length} items into ${BUCKET}/${FILE_PREFIX}/…`
        : `Re-generating thumbnails for ${items.length} items into ${BUCKET}/${THUMB_PREFIX}/…`,
    );
  }

  let failures = 0;
  const fixture = await mapWithConcurrency(items, async (item): Promise<FixtureItem> => {
    const prior = previous.get(item.slug);
    let filePath = prior?.filePath ?? null;
    let fileType = prior?.fileType ?? null;
    let thumbnailPath = prior?.thumbnailPath ?? null;

    if (mode === "all" && item.fileUrl) {
      try {
        const uploaded = await rehost(supabase, item.fileUrl, FILE_PREFIX, item.slug);
        filePath = uploaded.path;
        fileType = uploaded.ext;
      } catch (error) {
        failures += 1;
        console.warn(`file failed for ${item.slug}: ${String(error)}`);
      }
    }
    if (mode !== "none" && item.thumbnailUrl) {
      try {
        thumbnailPath = await rehostThumbnail(supabase, item.thumbnailUrl, item.slug);
      } catch (error) {
        console.warn(`thumbnail failed for ${item.slug}: ${String(error)}`);
        thumbnailPath = null;
      }
    }

    return {
      slug: item.slug,
      kind: item.kind,
      title: item.title,
      summary: item.summary,
      publishedOn: item.publishedOn,
      sourceUrl: item.sourceUrl,
      externalUrl: item.externalUrl,
      filePath,
      fileType,
      thumbnailPath,
    };
  });

  if (failures > 0) {
    console.warn(`${failures} file(s) could not be re-hosted; those items keep file_path = null`);
  }
  // Drop items that ended up with nothing to open.
  return fixture.filter((item) => item.filePath || item.externalUrl);
}

function toRow(item: FixtureItem): LibraryRow {
  return {
    slug: item.slug,
    kind: item.kind,
    title: item.title,
    summary: item.summary,
    published_on: item.publishedOn,
    source_url: item.sourceUrl,
    external_url: item.externalUrl,
    file_path: item.filePath,
    file_type: item.fileType,
    thumbnail_path: item.thumbnailPath,
  };
}

function sqlLiteral(value: string | null): string {
  return value === null ? "null" : `'${value.replace(/'/g, "''")}'`;
}

function emitSql(rows: LibraryRow[]): string {
  const columns = Object.keys(rows[0]) as (keyof LibraryRow)[];
  const values = rows
    .map((row) => `  (${columns.map((column) => sqlLiteral(row[column])).join(", ")})`)
    .join(",\n");
  const updates = columns
    .filter((column) => column !== "slug")
    .map((column) => `  ${column} = excluded.${column}`)
    .join(",\n");
  return [
    "-- Generated by scripts/import-library.ts --emit-sql",
    "begin;",
    `insert into public.library_items (${columns.join(", ")})`,
    "values",
    values,
    "on conflict (slug) do update set",
    `${updates},`,
    "  updated_at = now();",
    "commit;",
    "",
  ].join("\n");
}

async function upsertViaApi(supabase: SupabaseClient, rows: LibraryRow[]): Promise<void> {
  for (let index = 0; index < rows.length; index += 100) {
    const chunk = rows.slice(index, index + 100);
    const { error } = await supabase
      .from("library_items")
      .upsert(chunk, { onConflict: "slug" });
    if (error) {
      throw new Error(`upsert failed: ${error.message}`);
    }
  }
  console.log(`Upserted ${rows.length} library items`);
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

  const items: DirectoryLibraryItem[] = JSON.parse(await readFile(DATA_PATH, "utf8"));
  console.log(`Loaded ${items.length} library items from ${DATA_PATH}`);

  const mode: FileMode = process.argv.includes("--skip-files")
    ? "none"
    : process.argv.includes("--thumbs-only")
      ? "thumbs-only"
      : "all";
  const fixture = await buildFixture(supabase, items, mode);
  await writeFile(FIXTURE_PATH, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`Wrote ${fixture.length} items to ${FIXTURE_PATH}`);

  const rows = fixture.map(toRow);
  const emitIndex = process.argv.indexOf("--emit-sql");
  if (emitIndex >= 0) {
    const outPath = process.argv[emitIndex + 1];
    if (!outPath) {
      throw new Error("--emit-sql requires an output path");
    }
    await writeFile(outPath, emitSql(rows));
    console.log(`Wrote SQL for ${rows.length} items to ${outPath}`);
    return;
  }

  await upsertViaApi(supabase, rows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
