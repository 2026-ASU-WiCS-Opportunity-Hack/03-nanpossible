import { slugifyName } from "@/lib/slug";
import type { ContentBody, MetricItem } from "@/lib/types";

/** Conference pages are global content pages whose slug starts with this. */
export const CONFERENCE_SLUG_PREFIX = "conferences/";

export type ConferenceRecord = {
  id: string;
  pageId: string;
  /** `2026-tokyo` — the part of the web address after `/conferences/`. */
  slug: string;
  /** `/conferences/2026-tokyo` */
  path: string;
  title: string;
  intro: string;
  /** False while the page is still a draft (hidden from the public site). */
  published: boolean;
  archived: boolean;
  /** `YYYY-MM-DD`, or null while the dates are not set yet. */
  startDate: string | null;
  endDate: string | null;
  location: string | null;
};

export type ConferenceDetails = {
  slug: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
};

export type ConferenceErrorCode =
  | "title-required"
  | "slug-required"
  | "slug-taken"
  | "invalid-date"
  | "end-before-start"
  | "confirm-required"
  | "not-found"
  | "db-unavailable"
  | "save-failed";

export class ConferencesError extends Error {
  constructor(public readonly code: ConferenceErrorCode) {
    super(code);
  }
}

export function conferencePageSlug(slug: string) {
  return `${CONFERENCE_SLUG_PREFIX}${slug}`;
}

export function conferenceSlugFromPageSlug(pageSlug: string) {
  return pageSlug.startsWith(CONFERENCE_SLUG_PREFIX)
    ? pageSlug.slice(CONFERENCE_SLUG_PREFIX.length)
    : pageSlug;
}

export function conferencePath(slug: string) {
  return `/${conferencePageSlug(slug)}`;
}

/** "WIAL Global Conference 2027 — São Paulo" → `wial-global-conference-2027-sao-paulo`. */
export function slugifyConference(value: string) {
  return slugifyName(value).slice(0, 70).replace(/-+$/g, "");
}

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00Z`);
  // Rejects impossible days such as 2027-02-31, which Date would roll over.
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function cleanDate(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!value) {
    return null;
  }
  if (!parseDate(value)) {
    throw new ConferencesError("invalid-date");
  }
  return value;
}

/** Validate the "conference details" fields shared by the create and edit forms. */
export function parseConferenceDetails(input: {
  slug: unknown;
  startDate: unknown;
  endDate: unknown;
  location: unknown;
}): ConferenceDetails {
  const slug = slugifyConference(String(input.slug ?? ""));
  if (!slug) {
    throw new ConferencesError("slug-required");
  }

  const startDate = cleanDate(input.startDate);
  // An end date with no start is treated as a one-day conference.
  const rawEnd = cleanDate(input.endDate);
  const start = startDate ?? rawEnd;
  const endDate = start && rawEnd && rawEnd !== start ? rawEnd : null;

  if (start && endDate && endDate < start) {
    throw new ConferencesError("end-before-start");
  }

  return {
    slug,
    startDate: start,
    endDate,
    location: String(input.location ?? "").trim() || null,
  };
}

const UTC = "UTC";
const monthDay = new Intl.DateTimeFormat("en-US", { timeZone: UTC, month: "long", day: "numeric" });
const full = new Intl.DateTimeFormat("en-US", {
  timeZone: UTC,
  month: "long",
  day: "numeric",
  year: "numeric",
});

/**
 * "October 23–24, 2026", "September 30 – October 2, 2026", or a single day.
 * Null while the dates are not set.
 */
export function formatConferenceDates(
  conference: Pick<ConferenceRecord, "startDate" | "endDate">,
): string | null {
  const start = parseDate(conference.startDate);
  const end = parseDate(conference.endDate);

  if (!start) {
    return null;
  }
  if (!end || end.getTime() <= start.getTime()) {
    return full.format(start);
  }
  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return `${full.format(start)} – ${full.format(end)}`;
  }
  if (start.getUTCMonth() !== end.getUTCMonth()) {
    return `${monthDay.format(start)} – ${full.format(end)}`;
  }
  return `${monthDay.format(start)}–${end.getUTCDate()}, ${end.getUTCFullYear()}`;
}

export function conferenceYear(conference: Pick<ConferenceRecord, "startDate">) {
  return conference.startDate ? conference.startDate.slice(0, 4) : null;
}

/**
 * Split conferences into the ones still ahead (soonest first; undated ones
 * last) and the archive (most recent first).
 */
export function splitConferences<T extends Pick<ConferenceRecord, "archived" | "startDate" | "title">>(
  conferences: T[],
) {
  const byDate = (left: T, right: T) =>
    (left.startDate ?? "9999").localeCompare(right.startDate ?? "9999") ||
    left.title.localeCompare(right.title);

  return {
    upcoming: conferences.filter((conference) => !conference.archived).sort(byDate),
    archive: conferences
      .filter((conference) => conference.archived)
      .sort((left, right) => byDate(right, left)),
  };
}

/** The structured facts shown beside a conference page's headline. */
export function conferenceFacts(
  conference: Pick<ConferenceRecord, "startDate" | "endDate" | "location" | "archived">,
): MetricItem[] {
  const dates = formatConferenceDates(conference);
  return [
    ...(dates ? [{ label: "Dates", value: dates }] : []),
    ...(conference.location ? [{ label: "Location", value: conference.location }] : []),
    ...(conference.archived ? [{ label: "Status", value: "Past conference" }] : []),
  ];
}

/**
 * Page content for a brand-new conference: empty, or a copy of another
 * conference's layout so the next year starts from last year's structure.
 */
export function starterConferenceBody(source?: ContentBody | null): ContentBody {
  if (!source) {
    return { heroIntro: "", metrics: [], sections: [] };
  }
  return {
    ...(source.heroCtas?.length ? { heroCtas: source.heroCtas } : {}),
    heroIntro: source.heroIntro,
    metrics: source.metrics,
    sections: source.sections,
  };
}
