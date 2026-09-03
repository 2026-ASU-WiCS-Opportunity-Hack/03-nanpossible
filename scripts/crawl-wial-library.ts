/**
 * Crawl the wial.org Library and WIAL Talk archives (WordPress REST API) for the
 * /resources page.
 *
 * Library (wial.org/action-learning/library/) is four WordPress categories:
 * books, videos-and-podcasts, posters-infographics, articles. Every item is a
 * post whose content links to the real asset — a PDF on wial.org for articles,
 * an Amazon page for books, a YouTube URL or wial.org-hosted MP3 for videos and
 * podcasts, and the featured image itself for posters/infographics. The library
 * page's HTML is also riddled with injected SEO-spam anchors ("jacktoto",
 * "slot gacor", …) — anchors that are not wial.org/YouTube/Amazon are dropped
 * before the summary text is extracted.
 *
 * WIAL Talk (wial.org/wial-talk/) is a members' discussion program: 600+ weekly
 * posts, each a two-sentence coaching scenario ("As an action learning coach,
 * how would you handle the following situation: …"). The same scenarios are
 * re-posted year after year, so they are deduplicated on the prompt text and
 * written straight to the src/content fixture (there is no DB table for them).
 *
 * Output:
 *   data/library-directory.json          (input for scripts/import-library.ts)
 *   src/content/wial-talk-scenarios.json (rendered directly by /resources)
 *
 * Usage: npx tsx scripts/crawl-wial-library.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://wial.org";
const USER_AGENT = "WIAL-Platform importer (contact: greg@ohack.org)";
const LIBRARY_OUTPUT = path.join(process.cwd(), "data", "library-directory.json");
const SCENARIOS_OUTPUT = path.join(
  process.cwd(),
  "src",
  "content",
  "wial-talk-scenarios.json",
);

export type LibraryKind =
  | "article"
  | "book"
  | "video"
  | "podcast"
  | "poster"
  | "infographic";

export type DirectoryLibraryItem = {
  slug: string;
  kind: LibraryKind;
  title: string;
  summary: string | null;
  publishedOn: string;
  sourceUrl: string;
  /** Amazon / YouTube page for books and videos. */
  externalUrl: string | null;
  /** PDF, MP3, or poster image hosted on wial.org (re-hosted by the importer). */
  fileUrl: string | null;
  thumbnailUrl: string | null;
};

export type WialTalkScenario = {
  slug: string;
  title: string;
  prompt: string;
  firstPostedOn: string;
  lastPostedOn: string;
  timesPosted: number;
};

type WpPost = {
  id: number;
  slug: string;
  date: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  featured_media: number;
};

type WpMedia = {
  id: number;
  source_url: string;
  mime_type: string;
  media_details?: {
    sizes?: Record<string, { source_url: string }>;
  };
};

const CATEGORY_KINDS: Record<number, LibraryKind> = {
  36: "book",
  37: "video",
  38: "poster",
  31: "article",
};
const WIAL_TALK_CATEGORY = 29;
const SCENARIO_LEAD =
  /^\s*as an action learning coach,?\s*how would you handle the following situation:?\s*/i;
const ALLOWED_LINK_HOSTS = /(^|\.)(wial\.org|youtube\.com|youtu\.be|amazon\.[a-z.]+)$/i;
const ACRONYMS = new Set([
  "WIAL", "AL", "CALC", "PALC", "SALC", "MALC", "L&D", "ROI", "K-12", "PWD", "IDP",
  "ICF", "ATD", "CRU", "JSR", "BST", "DRCS", "CARICAD", "HUD", "UMBC", "MBA",
  "USA", "US", "UK", "HR", "IT", "AI", "TPS", "MBS", "PBL", "CEO", "COVID-19",
  "4Q", "CO", "LTD", "&", "-", "–", "—", "|", "#1", "#2", "2", "1",
]);
const SMALL_WORDS = new Set([
  "a", "an", "the", "of", "and", "or", "in", "on", "at", "to", "for", "with", "by",
  "as", "vs", "vs.", "from", "through", "into", "is", "its", "it's", "not", "be",
]);

async function fetchJson<T>(url: string): Promise<{ data: T; totalPages: number }> {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return {
    data: (await response.json()) as T,
    totalPages: Number(response.headers.get("x-wp-totalpages") ?? "1"),
  };
}

async function fetchCategoryPosts(categoryId: number): Promise<WpPost[]> {
  const posts: WpPost[] = [];
  const fields = "id,slug,date,link,title,content,featured_media";
  let page = 1;
  let totalPages = 1;
  do {
    const url = `${BASE_URL}/wp-json/wp/v2/posts?categories=${categoryId}&per_page=100&page=${page}&_fields=${fields}`;
    const result = await fetchJson<WpPost[]>(url);
    posts.push(...result.data);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);
  return posts;
}

async function fetchMedia(ids: number[]): Promise<Map<number, WpMedia>> {
  const media = new Map<number, WpMedia>();
  const unique = [...new Set(ids.filter((id) => id > 0))];
  for (let index = 0; index < unique.length; index += 100) {
    const chunk = unique.slice(index, index + 100).join(",");
    const url = `${BASE_URL}/wp-json/wp/v2/media?include=${chunk}&per_page=100&_fields=id,source_url,mime_type,media_details.sizes.medium.source_url,media_details.sizes.large.source_url`;
    const { data } = await fetchJson<WpMedia[]>(url);
    for (const item of data) {
      media.set(item.id, item);
    }
  }
  return media;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absoluteUrl(href: string): string {
  const cleaned = href.trim().replace(/%22$/, "").replace(/"$/, "");
  if (cleaned.startsWith("/")) {
    return `${BASE_URL}${cleaned}`;
  }
  return cleaned;
}

function isAllowedLink(href: string): boolean {
  try {
    return ALLOWED_LINK_HOSTS.test(new URL(absoluteUrl(href)).hostname);
  } catch {
    return false;
  }
}

/** Remove injected spam anchors, then strip all markup. */
function toPlainText(html: string): string {
  const withoutSpam = html.replace(
    /<a\b[^>]*href="([^"]*)"[^>]*>[\s\S]*?<\/a>/gi,
    (match, href: string) => (isAllowedLink(href) ? match : " "),
  );
  return decodeEntities(
    withoutSpam
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

function summarize(html: string): string | null {
  const text = toPlainText(html)
    .replace(/\bread more\b\.?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) {
    return null;
  }
  if (text.length <= 600) {
    return text;
  }
  const cut = text.slice(0, 600);
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return sentenceEnd > 200 ? cut.slice(0, sentenceEnd + 1) : `${cut.trimEnd()}…`;
}

/** wial.org publishes most article titles in SHOUTING CAPS — normalize to title case. */
export function normalizeTitle(raw: string): string {
  const title = decodeEntities(raw.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
  const letters = title.replace(/[^a-z]/gi, "");
  const upper = letters.replace(/[^A-Z]/g, "");
  if (letters.length < 8 || upper.length / letters.length < 0.8) {
    return title;
  }
  return title
    .split(" ")
    .map((word, index) => {
      const trailing = word.match(/[:,.!?]+$/)?.[0] ?? "";
      const bare = word.slice(0, word.length - trailing.length);
      if (ACRONYMS.has(bare.toUpperCase())) {
        return `${bare.toUpperCase().replace("CO", "Co")}${trailing}`;
      }
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower.replace(/[^a-z'.]/g, ""))) {
        return lower;
      }
      return lower.replace(/(^|[\s\-–—("“])([a-z])/g, (_, lead: string, letter: string) =>
        `${lead}${letter.toUpperCase()}`,
      );
    })
    .join(" ")
    .replace(/\bWial\b/g, "WIAL")
    .replace(/:\s+([a-z])/g, (_, letter: string) => `: ${letter.toUpperCase()}`);
}

function firstHref(html: string, pattern: RegExp): string | null {
  const matches = html.matchAll(/(?:href|src)="([^"]+)"/gi);
  for (const match of matches) {
    const href = absoluteUrl(match[1]);
    if (pattern.test(href) && isAllowedLink(href)) {
      return href;
    }
  }
  return null;
}

function toLibraryItem(
  post: WpPost,
  baseKind: LibraryKind,
  media: Map<number, WpMedia>,
): DirectoryLibraryItem | null {
  const html = post.content.rendered;
  const featured = media.get(post.featured_media);
  const thumbnail =
    featured?.media_details?.sizes?.medium?.source_url ?? featured?.source_url ?? null;

  let kind = baseKind;
  let externalUrl: string | null = null;
  let fileUrl: string | null = null;

  switch (baseKind) {
    case "book":
      externalUrl = firstHref(html, /amazon\./i);
      break;
    case "video": {
      fileUrl = firstHref(html, /\.mp3(\?|$)/i);
      externalUrl = fileUrl ? null : firstHref(html, /youtube\.com|youtu\.be/i);
      kind = fileUrl ? "podcast" : "video";
      if (!fileUrl && !externalUrl) {
        console.warn(`skip ${post.slug}: video post without a video or audio link`);
        return null;
      }
      break;
    }
    case "poster":
      kind = post.slug.startsWith("infographic") ? "infographic" : "poster";
      post.title.rendered = post.title.rendered.replace(/^\s*(poster|infographic)\s+/i, "");
      fileUrl = featured?.source_url ?? null;
      if (!fileUrl) {
        console.warn(`skip ${post.slug}: poster without an image`);
        return null;
      }
      break;
    case "article":
      fileUrl = firstHref(html, /\.pdf(\?|$)/i);
      if (!fileUrl) {
        console.warn(`skip ${post.slug}: article without a PDF`);
        return null;
      }
      break;
    default:
      break;
  }

  return {
    slug: post.slug,
    kind,
    title: normalizeTitle(post.title.rendered),
    summary: summarize(html),
    publishedOn: post.date.slice(0, 10),
    sourceUrl: post.link,
    externalUrl,
    fileUrl,
    thumbnailUrl: thumbnail,
  };
}

function scenarioTitle(raw: string): string {
  return decodeEntities(raw.replace(/<[^>]+>/g, ""))
    .replace(/^\s*scenario\s*:?\s*/i, "")
    .replace(/\s*[-–(]?\s*(19|20)\d{2}\s*\)?\s*$/, "")
    .replace(/\s*-\s*\d+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function normalizePrompt(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toScenarios(posts: WpPost[]): WialTalkScenario[] {
  const byPrompt = new Map<string, WialTalkScenario>();
  const sorted = [...posts].sort((a, b) => a.date.localeCompare(b.date));
  for (const post of sorted) {
    const prompt = toPlainText(post.content.rendered)
      .replace(/\s+/g, " ")
      .replace(SCENARIO_LEAD, "")
      .trim();
    if (!prompt) {
      continue;
    }
    const key = normalizePrompt(prompt);
    const date = post.date.slice(0, 10);
    const existing = byPrompt.get(key);
    if (existing) {
      existing.lastPostedOn = date;
      existing.timesPosted += 1;
      continue;
    }
    byPrompt.set(key, {
      slug: post.slug,
      title: scenarioTitle(post.title.rendered),
      prompt,
      firstPostedOn: date,
      lastPostedOn: date,
      timesPosted: 1,
    });
  }
  return [...byPrompt.values()].sort(
    (a, b) => b.lastPostedOn.localeCompare(a.lastPostedOn) || a.title.localeCompare(b.title),
  );
}

async function main(): Promise<void> {
  const items: DirectoryLibraryItem[] = [];
  const categoryPosts = new Map<number, WpPost[]>();
  for (const categoryId of Object.keys(CATEGORY_KINDS).map(Number)) {
    const posts = await fetchCategoryPosts(categoryId);
    categoryPosts.set(categoryId, posts);
    console.log(`category ${categoryId} (${CATEGORY_KINDS[categoryId]}): ${posts.length} posts`);
  }
  const media = await fetchMedia(
    [...categoryPosts.values()].flat().map((post) => post.featured_media),
  );
  for (const [categoryId, posts] of categoryPosts) {
    for (const post of posts) {
      const item = toLibraryItem(post, CATEGORY_KINDS[categoryId], media);
      if (item) {
        items.push(item);
      }
    }
  }
  items.sort((a, b) => b.publishedOn.localeCompare(a.publishedOn) || a.slug.localeCompare(b.slug));

  const talkPosts = await fetchCategoryPosts(WIAL_TALK_CATEGORY);
  const scenarios = toScenarios(talkPosts);
  console.log(`WIAL Talk: ${talkPosts.length} posts → ${scenarios.length} distinct scenarios`);

  await mkdir(path.dirname(LIBRARY_OUTPUT), { recursive: true });
  await writeFile(LIBRARY_OUTPUT, `${JSON.stringify(items, null, 2)}\n`);
  await writeFile(SCENARIOS_OUTPUT, `${JSON.stringify(scenarios, null, 2)}\n`);
  console.log(`Wrote ${items.length} library items to ${LIBRARY_OUTPUT}`);
  console.log(`Wrote ${scenarios.length} scenarios to ${SCENARIOS_OUTPUT}`);
}

if (process.argv[1] && /crawl-wial-library/.test(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
