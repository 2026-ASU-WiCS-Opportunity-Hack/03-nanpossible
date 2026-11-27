import { affiliateSiteLink } from "@/lib/affiliates";
import { countryFlagSrc } from "@/lib/countries";
import type { ChapterRecord, EventRecord } from "@/lib/types";

/** Who is putting an event on: an affiliate, with a link to its site. */
export type CalendarHost = {
  id: string;
  name: string;
  country: string | null;
  flagSrc: string | null;
  href: string;
  /** True when the link leaves this platform for the affiliate's own website. */
  external: boolean;
  /** Hostname for "opens wial-usa.org in a new tab" hints. */
  host: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  description: string | null;
  linkUrl: string | null;
  /** `null` means a WIAL-wide event that belongs to no affiliate. */
  host: CalendarHost | null;
};

export type CalendarMonth = {
  /** `2026-10` — sortable and unique per month. */
  key: string;
  /** `October 2026` */
  label: string;
  events: CalendarEvent[];
};

export const GLOBAL_HOST_LABEL = "WIAL Global";

type HostChapter = Pick<ChapterRecord, "id" | "name" | "subdomain" | "websiteUrl" | "country">;

/** Affiliate id → the host details shown on a calendar entry. */
export function buildCalendarHosts(
  affiliates: HostChapter[],
  siteDomain: string,
): Record<string, CalendarHost> {
  const hosts: Record<string, CalendarHost> = {};

  for (const affiliate of affiliates) {
    // The "global" workspace row is WIAL itself, not an affiliate.
    if (affiliate.subdomain === "global") {
      continue;
    }

    hosts[affiliate.id] = {
      id: affiliate.id,
      name: affiliate.name,
      country: affiliate.country,
      flagSrc: countryFlagSrc(affiliate.country),
      ...affiliateSiteLink(affiliate, siteDomain),
    };
  }

  return hosts;
}

/**
 * Attach host details to events. An event whose affiliate is not in `hosts`
 * (no affiliate at all, or the "global" workspace) is presented as WIAL-wide.
 */
export function buildCalendarEvents(
  events: EventRecord[],
  hosts: Record<string, CalendarHost>,
): CalendarEvent[] {
  return events
    .map((event) => ({
      id: event.id,
      title: event.title,
      startAt: event.startAt,
      endAt: event.endAt,
      location: event.location,
      description: event.description,
      linkUrl: event.linkUrl,
      host: (event.chapterId && hosts[event.chapterId]) || null,
    }))
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}

function dateParts(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

/** Calendar day (`2026-10-23`) an instant falls on in the given time zone. */
export function eventDayKey(value: string, timeZone: string) {
  const { year, month, day } = dateParts(value, timeZone);
  return `${year}-${month}-${day}`;
}

/** Group events (already sorted) under month headings in the given time zone. */
export function groupEventsByMonth(events: CalendarEvent[], timeZone: string): CalendarMonth[] {
  const months: CalendarMonth[] = [];
  const labelFormat = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    year: "numeric",
  });

  for (const event of events) {
    const { year, month } = dateParts(event.startAt, timeZone);
    const key = `${year}-${month}`;
    const current = months[months.length - 1];

    if (current?.key === key) {
      current.events.push(event);
    } else {
      months.push({ key, label: labelFormat.format(new Date(event.startAt)), events: [event] });
    }
  }

  return months;
}

/**
 * "Fri, Oct 23, 2026 · 9:00 AM – 5:00 PM GMT+9" for a same-day event,
 * "Oct 23 – Oct 24, 2026" style ranges when it spans days.
 */
export function formatEventWhen(
  event: Pick<CalendarEvent, "startAt" | "endAt">,
  timeZone: string,
) {
  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : null;
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
  const timeWithZone = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  if (!end || end.getTime() <= start.getTime()) {
    return `${day.format(start)} · ${timeWithZone.format(start)}`;
  }

  if (eventDayKey(event.startAt, timeZone) === eventDayKey(event.endAt as string, timeZone)) {
    return `${day.format(start)} · ${time.format(start)} – ${timeWithZone.format(end)}`;
  }

  return `${day.format(start)}, ${time.format(start)} – ${day.format(end)}, ${timeWithZone.format(end)}`;
}

/** The two-line date badge on a calendar entry: `OCT` / `23`. */
export function formatEventBadge(value: string, timeZone: string) {
  const date = new Date(value);
  return {
    month: new Intl.DateTimeFormat("en-US", { timeZone, month: "short" }).format(date).toUpperCase(),
    day: new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(date),
    weekday: new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date),
  };
}

export type CalendarFilter = { key: string; label: string; count: number };

export const ALL_FILTER_KEY = "all";
export const GLOBAL_FILTER_KEY = "global";

/** "All", "WIAL Global", then one filter per affiliate that has events. */
export function buildCalendarFilters(events: CalendarEvent[]): CalendarFilter[] {
  const counts = new Map<string, CalendarFilter>();
  let globalCount = 0;

  for (const event of events) {
    if (!event.host) {
      globalCount += 1;
      continue;
    }

    const existing = counts.get(event.host.id);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(event.host.id, { key: event.host.id, label: event.host.name, count: 1 });
    }
  }

  const affiliates = [...counts.values()].sort((left, right) =>
    left.label.localeCompare(right.label),
  );

  return [
    { key: ALL_FILTER_KEY, label: "All events", count: events.length },
    ...(globalCount ? [{ key: GLOBAL_FILTER_KEY, label: GLOBAL_HOST_LABEL, count: globalCount }] : []),
    ...affiliates,
  ];
}

export function filterCalendarEvents(events: CalendarEvent[], filterKey: string) {
  if (filterKey === ALL_FILTER_KEY) {
    return events;
  }

  if (filterKey === GLOBAL_FILTER_KEY) {
    return events.filter((event) => !event.host);
  }

  return events.filter((event) => event.host?.id === filterKey);
}
