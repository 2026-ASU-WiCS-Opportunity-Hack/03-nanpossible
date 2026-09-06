import libraryFixture from "@/content/library.json";
import scenariosFixture from "@/content/wial-talk-scenarios.json";
import { createSupabaseContentClient } from "@/lib/supabase";
import type { LibraryItem, LibraryKind, WialTalkScenario } from "@/lib/types";

export const LIBRARY_BUCKET = "resource-files";

type LibraryRow = {
  slug: string;
  kind: LibraryKind;
  title: string;
  summary: string | null;
  published_on: string | null;
  source_url: string | null;
  external_url: string | null;
  file_path: string | null;
  file_type: string | null;
  thumbnail_path: string | null;
};

const libraryColumns =
  "slug, kind, title, summary, published_on, source_url, external_url, file_path, file_type, thumbnail_path";

function mapRow(row: LibraryRow): LibraryItem {
  return {
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    summary: row.summary,
    publishedOn: row.published_on ?? "",
    sourceUrl: row.source_url ?? "",
    externalUrl: row.external_url,
    filePath: row.file_path,
    fileType: row.file_type,
    thumbnailPath: row.thumbnail_path,
  };
}

function byNewest(a: LibraryItem, b: LibraryItem) {
  return b.publishedOn.localeCompare(a.publishedOn) || a.title.localeCompare(b.title);
}

/** Public URL of an object in the `resource-files` bucket (null when Supabase is not configured). */
export function libraryFileUrl(objectPath: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!objectPath || !base) {
    return null;
  }
  return `${base}/storage/v1/object/public/${LIBRARY_BUCKET}/${objectPath}`;
}

export async function listLibraryItems(): Promise<LibraryItem[]> {
  const client = createSupabaseContentClient();

  if (client) {
    try {
      const { data, error } = await client
        .from("library_items")
        .select(libraryColumns)
        .order("published_on", { ascending: false });

      if (!error && data && data.length > 0) {
        return (data as unknown as LibraryRow[]).map(mapRow).sort(byNewest);
      }
    } catch {
      // fall through to the fixture
    }
  }

  return (libraryFixture as LibraryItem[]).slice().sort(byNewest);
}

export function getWialTalkScenarios(): WialTalkScenario[] {
  return scenariosFixture as WialTalkScenario[];
}

export const libraryKindLabels: Record<LibraryKind, string> = {
  article: "Article",
  book: "Book",
  video: "Video",
  podcast: "Podcast",
  poster: "Poster",
  infographic: "Infographic",
};

/** What the card's link does, in plain language. */
export function libraryActionLabel(item: Pick<LibraryItem, "kind" | "fileType">): string {
  switch (item.kind) {
    case "book":
      return "View the book";
    case "video":
      return "Watch the video";
    case "podcast":
      return "Listen to the episode";
    case "poster":
      return "Open the poster";
    case "infographic":
      return "Open the infographic";
    default:
      return item.fileType === "pdf" ? "Read the PDF" : "Open the article";
  }
}
