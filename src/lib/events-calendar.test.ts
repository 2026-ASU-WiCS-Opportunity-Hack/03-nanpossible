import { describe, expect, it } from "vitest";
import {
  ALL_FILTER_KEY,
  GLOBAL_FILTER_KEY,
  buildCalendarEvents,
  buildCalendarFilters,
  buildCalendarHosts,
  eventDayKey,
  filterCalendarEvents,
  formatEventBadge,
  formatEventWhen,
  groupEventsByMonth,
} from "./events-calendar";
import type { EventRecord } from "./types";

function event(overrides: Partial<EventRecord>): EventRecord {
  return {
    id: "e1",
    chapterId: null,
    title: "Event",
    startAt: "2026-10-23T00:00:00.000Z",
    endAt: null,
    location: null,
    description: null,
    linkUrl: null,
    published: true,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

const hosts = buildCalendarHosts(
  [
    { id: "usa", name: "WIAL USA", subdomain: "usa", websiteUrl: "https://wial-usa.org", country: "United States" },
    { id: "jp", name: "WIAL Japan", subdomain: "japan", websiteUrl: null, country: "Japan" },
    { id: "hq", name: "WIAL Global", subdomain: "global", websiteUrl: null, country: null },
  ],
  "chapterstack.org",
);

describe("buildCalendarHosts", () => {
  it("links affiliates to their own site or hosted microsite and skips the global workspace", () => {
    expect(hosts.usa).toMatchObject({ href: "https://wial-usa.org", external: true, host: "wial-usa.org" });
    expect(hosts.jp).toMatchObject({
      href: "https://japan.chapterstack.org",
      external: false,
      flagSrc: "/flags/jp.svg",
    });
    expect(hosts.hq).toBeUndefined();
  });
});

describe("buildCalendarEvents", () => {
  const events = buildCalendarEvents(
    [
      event({ id: "late", chapterId: "usa", startAt: "2026-11-05T15:00:00.000Z" }),
      event({ id: "global", chapterId: null }),
      event({ id: "hq", chapterId: "hq", startAt: "2026-10-24T00:00:00.000Z" }),
      event({ id: "gone", chapterId: "deleted", startAt: "2026-10-25T00:00:00.000Z" }),
      event({ id: "jp", chapterId: "jp", startAt: "2026-10-30T15:30:00.000Z" }),
    ],
    hosts,
  );

  it("sorts by start and treats events without a known affiliate as WIAL-wide", () => {
    expect(events.map((item) => item.id)).toEqual(["global", "hq", "gone", "jp", "late"]);
    expect(events.map((item) => item.host?.name ?? null)).toEqual([
      null,
      null,
      null,
      "WIAL Japan",
      "WIAL USA",
    ]);
  });

  it("builds filters only for organisers that have events", () => {
    expect(buildCalendarFilters(events)).toEqual([
      { key: ALL_FILTER_KEY, label: "All events", count: 5 },
      { key: GLOBAL_FILTER_KEY, label: "WIAL Global", count: 3 },
      { key: "jp", label: "WIAL Japan", count: 1 },
      { key: "usa", label: "WIAL USA", count: 1 },
    ]);
    expect(filterCalendarEvents(events, GLOBAL_FILTER_KEY)).toHaveLength(3);
    expect(filterCalendarEvents(events, "usa").map((item) => item.id)).toEqual(["late"]);
    expect(filterCalendarEvents(events, ALL_FILTER_KEY)).toHaveLength(5);
  });

  it("groups by month in the viewer's time zone", () => {
    // 2026-10-30T15:30Z is already 31 Oct in Tokyo, and 2026-11-01T02:00Z is
    // still 31 Oct in Phoenix.
    const edge = buildCalendarEvents(
      [event({ id: "a", startAt: "2026-11-01T02:00:00.000Z" })],
      hosts,
    );
    expect(groupEventsByMonth(edge, "UTC").map((month) => month.label)).toEqual(["November 2026"]);
    expect(groupEventsByMonth(edge, "America/Phoenix").map((month) => month.label)).toEqual([
      "October 2026",
    ]);
    expect(groupEventsByMonth(events, "UTC").map((month) => [month.key, month.events.length])).toEqual([
      ["2026-10", 4],
      ["2026-11", 1],
    ]);
  });
});

describe("date formatting", () => {
  it("uses the given time zone for the day", () => {
    expect(eventDayKey("2026-10-23T00:00:00.000Z", "Asia/Tokyo")).toBe("2026-10-23");
    expect(eventDayKey("2026-10-23T00:00:00.000Z", "America/Phoenix")).toBe("2026-10-22");
    expect(formatEventBadge("2026-10-23T00:00:00.000Z", "Asia/Tokyo")).toEqual({
      month: "OCT",
      day: "23",
      weekday: "Fri",
    });
  });

  it("formats single-time, same-day and multi-day events", () => {
    const start = "2026-10-23T00:00:00.000Z";
    expect(formatEventWhen({ startAt: start, endAt: null }, "Asia/Tokyo")).toBe(
      "Fri, Oct 23, 2026 · 9:00 AM GMT+9",
    );
    expect(
      formatEventWhen({ startAt: start, endAt: "2026-10-23T08:00:00.000Z" }, "Asia/Tokyo"),
    ).toBe("Fri, Oct 23, 2026 · 9:00 AM – 5:00 PM GMT+9");
    expect(
      formatEventWhen({ startAt: start, endAt: "2026-10-24T08:00:00.000Z" }, "Asia/Tokyo"),
    ).toBe("Fri, Oct 23, 2026, 9:00 AM – Sat, Oct 24, 2026, 5:00 PM GMT+9");
  });
});
