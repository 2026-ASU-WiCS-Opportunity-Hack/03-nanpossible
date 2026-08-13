/**
 * Crawl https://directory.wial.org/coaches and write every coach profile to
 * data/coaches-directory.json. Read-only against the directory; safe to re-run.
 *
 * Usage: npx tsx scripts/crawl-wial-directory.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://directory.wial.org";
const OUTPUT_PATH = path.join(process.cwd(), "data", "coaches-directory.json");
const CONCURRENCY = 6;
const USER_AGENT = "WIAL-Platform importer (contact: greg@ohack.org)";

export interface DirectoryCoach {
  slug: string;
  profileUrl: string;
  name: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone: string | null;
  city: string | null;
  stateCode: string | null;
  stateName: string | null;
  zipCode: string | null;
  countryCode: string | null;
  countryName: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  blog: string | null;
  youtube: string | null;
  twitter: string | null;
  facebook: string | null;
  linkedin: string | null;
  aboutMe: string | null;
  credentials: string | null;
  awards: string | null;
  cvUrl: string | null;
  photoUrl: string | null;
  certLevel: "CALC" | "PALC" | "SALC" | "MALC" | null;
  certValidUntil: string | null;
  affiliate: string | null;
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
    .replace(/&ndash;/g, "–");
}

function stripTags(value: string): string {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      // chunk boundaries can leave a dangling opening tag fragment like "<div "
      .replace(/<[a-z][^<>]*$/i, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchPage(url: string, attempt = 1): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      redirect: "follow",
    });
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

async function collectProfilePaths(): Promise<string[]> {
  const bySlug = new Map<string, string>();
  for (let page = 1; page <= 20; page += 1) {
    const html = await fetchPage(`${BASE_URL}/coaches?page=${page}`);
    const matches = [...html.matchAll(/href="(\/[^"]*?\/coaches\/([^"/?#]+))"/g)];
    let added = 0;
    for (const match of matches) {
      const slug = decodeURIComponent(match[2]);
      if (!bySlug.has(slug)) {
        bySlug.set(slug, match[1]);
        added += 1;
      }
    }
    console.log(`list page ${page}: +${added} (total ${bySlug.size})`);
    if (added === 0) {
      break;
    }
  }
  return [...bySlug.values()];
}

/**
 * Profile data lives in Brilliant Directories "table-view-group" blocks:
 * <div class="... table-display-<key>"><div class="col-sm-4 bold">Label</div>
 * <div class="col-sm-8">value…</div></div>
 */
function parseFieldBlocks(html: string): Map<string, { text: string; href: string | null }> {
  const fields = new Map<string, { text: string; href: string | null }>();
  const chunks = html.split(/class="table-view-group /g).slice(1);
  for (const rawChunk of chunks) {
    // The last block of a section runs into the next section's <h2> heading —
    // cut there so headings never leak into field values.
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
    const body = valueMatch[1];
    const hrefMatch = body.match(/href=['"]([^'"]+)['"]/);
    fields.set(keyMatch[1], {
      text: stripTags(body),
      href: hrefMatch ? hrefMatch[1] : null,
    });
  }
  return fields;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseProfile(html: string, profilePath: string): DirectoryCoach {
  const slug = decodeURIComponent(profilePath.split("/").pop() ?? profilePath);
  const fields = parseFieldBlocks(html);
  const text = (key: string) => {
    const value = fields.get(key)?.text.trim();
    return value ? value : null;
  };
  const href = (key: string) => fields.get(key)?.href ?? null;

  const nameMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const ogImageMatch = html.match(/property="og:image"[^>]+content="([^"]+)"/);
  const photoUrl =
    ogImageMatch && ogImageMatch[1].includes("/pictures/profile/") ? ogImageMatch[1] : null;

  const certSectionStart = html.indexOf("Highest Certification Level");
  const certSection = certSectionStart >= 0 ? html.slice(certSectionStart, certSectionStart + 2000) : "";
  const certLevelMatch = certSection.match(/\((CALC|PALC|SALC|MALC)\)/);
  const certValidMatch = certSection.match(/Certification Valid Until[\s\S]*?(\d{2}\/\d{2}\/\d{4})/);

  const affiliateMatch = html.match(/>\s*Affiliate\s*<[\s\S]{0,400}?>\s*(WIAL[^<]*|[A-Z][^<]{2,80}?)\s*</);

  const phone = text("phone_number") ?? text("phone_number2") ?? text("phone_number3");

  return {
    slug,
    profileUrl: `${BASE_URL}${profilePath}`,
    name: nameMatch ? stripTags(nameMatch[1]) : [text("first_name"), text("last_name")].filter(Boolean).join(" "),
    title: text("title"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    company: text("company"),
    phone,
    city: text("city"),
    stateCode: text("state_code"),
    stateName: text("state_ln"),
    zipCode: text("zip_code"),
    countryCode: text("country_code"),
    countryName: text("country_ln"),
    lat: parseNumber(fields.get("lat")?.text),
    lng: parseNumber(fields.get("lon")?.text),
    website: href("website"),
    blog: href("blog"),
    youtube: href("youtube"),
    twitter: href("twitter"),
    facebook: href("facebook"),
    linkedin: href("linkedin"),
    aboutMe: text("about_me"),
    credentials: text("credentials"),
    awards: text("awards"),
    cvUrl: href("cv"),
    photoUrl,
    certLevel: certLevelMatch ? (certLevelMatch[1] as DirectoryCoach["certLevel"]) : null,
    certValidUntil: certValidMatch ? certValidMatch[1] : null,
    affiliate: affiliateMatch ? stripTags(affiliateMatch[1]) : null,
  };
}

async function crawl(): Promise<void> {
  const profilePaths = await collectProfilePaths();
  console.log(`Found ${profilePaths.length} coach profiles. Fetching…`);

  const coaches: DirectoryCoach[] = [];
  const failures: string[] = [];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < profilePaths.length) {
      const index = cursor;
      cursor += 1;
      const profilePath = profilePaths[index];
      try {
        let coach: DirectoryCoach | null = null;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          const html = await fetchPage(`${BASE_URL}${encodeURI(profilePath)}`);
          coach = parseProfile(html, profilePath);
          // Under load the server occasionally serves pages without the
          // profile widgets — retry when the always-present fields are gone.
          if (coach.certLevel !== null || coach.lat !== null) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
        }
        coaches.push(coach!);
      } catch (error) {
        failures.push(`${profilePath}: ${String(error)}`);
      }
      if ((index + 1) % 50 === 0) {
        console.log(`fetched ${index + 1}/${profilePaths.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  coaches.sort((a, b) => a.slug.localeCompare(b.slug));
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(coaches, null, 2)}\n`);

  const withCoords = coaches.filter((coach) => coach.lat !== null && coach.lng !== null).length;
  const withPhoto = coaches.filter((coach) => coach.photoUrl).length;
  const withCert = coaches.filter((coach) => coach.certLevel).length;
  const withBio = coaches.filter((coach) => coach.aboutMe).length;
  console.log(
    `Wrote ${coaches.length} coaches to ${OUTPUT_PATH}\n` +
      `coords: ${withCoords}, photos: ${withPhoto}, cert level: ${withCert}, bio: ${withBio}`,
  );
  if (failures.length > 0) {
    console.warn(`Failures (${failures.length}):\n${failures.join("\n")}`);
  }
}

crawl().catch((error) => {
  console.error(error);
  process.exit(1);
});
