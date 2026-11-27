import { describe, expect, it } from "vitest";
import {
  ConferencesError,
  conferenceFacts,
  conferencePageSlug,
  conferencePath,
  conferenceSlugFromPageSlug,
  formatConferenceDates,
  parseConferenceDetails,
  slugifyConference,
  splitConferences,
  starterConferenceBody,
} from "./conferences-fields";

const errorCodeOf = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return error instanceof ConferencesError ? error.code : "unexpected";
  }
  return null;
};

describe("conference slugs", () => {
  it("maps between the conference slug, its page slug and its path", () => {
    expect(conferencePageSlug("2026-tokyo")).toBe("conferences/2026-tokyo");
    expect(conferenceSlugFromPageSlug("conferences/2026-tokyo")).toBe("2026-tokyo");
    expect(conferencePath("2026-tokyo")).toBe("/conferences/2026-tokyo");
  });

  it("builds a web address from a name", () => {
    expect(slugifyConference("WIAL Global Conference 2027 — São Paulo")).toBe(
      "wial-global-conference-2027-sao-paulo",
    );
    // No path tricks survive.
    expect(slugifyConference("../admin/2027")).toBe("admin-2027");
  });
});

describe("parseConferenceDetails", () => {
  const base = { slug: "2027 Lisbon", startDate: "2027-10-21", endDate: "2027-10-22", location: " Lisbon, Portugal " };

  it("cleans the fields", () => {
    expect(parseConferenceDetails(base)).toEqual({
      slug: "2027-lisbon",
      startDate: "2027-10-21",
      endDate: "2027-10-22",
      location: "Lisbon, Portugal",
    });
  });

  it("allows a conference with no dates or location yet", () => {
    expect(parseConferenceDetails({ slug: "2027", startDate: "", endDate: "", location: "" })).toEqual({
      slug: "2027",
      startDate: null,
      endDate: null,
      location: null,
    });
  });

  it("treats a lone or repeated day as a one-day conference", () => {
    expect(parseConferenceDetails({ ...base, startDate: "", endDate: "2027-10-22" })).toMatchObject({
      startDate: "2027-10-22",
      endDate: null,
    });
    expect(parseConferenceDetails({ ...base, endDate: "2027-10-21" }).endDate).toBeNull();
  });

  it("rejects bad input", () => {
    expect(errorCodeOf(() => parseConferenceDetails({ ...base, slug: " -- " }))).toBe("slug-required");
    expect(errorCodeOf(() => parseConferenceDetails({ ...base, startDate: "2027-02-31" }))).toBe(
      "invalid-date",
    );
    expect(errorCodeOf(() => parseConferenceDetails({ ...base, endDate: "2027-10-01" }))).toBe(
      "end-before-start",
    );
  });
});

describe("formatConferenceDates", () => {
  it("formats single days and ranges", () => {
    expect(formatConferenceDates({ startDate: null, endDate: null })).toBeNull();
    expect(formatConferenceDates({ startDate: "2026-10-23", endDate: null })).toBe("October 23, 2026");
    expect(formatConferenceDates({ startDate: "2026-10-23", endDate: "2026-10-24" })).toBe(
      "October 23–24, 2026",
    );
    expect(formatConferenceDates({ startDate: "2027-09-30", endDate: "2027-10-02" })).toBe(
      "September 30 – October 2, 2027",
    );
    expect(formatConferenceDates({ startDate: "2027-12-30", endDate: "2028-01-02" })).toBe(
      "December 30, 2027 – January 2, 2028",
    );
  });
});

describe("splitConferences", () => {
  const conference = (title: string, startDate: string | null, archived = false) => ({
    title,
    startDate,
    archived,
  });

  it("orders upcoming soonest first (undated last) and the archive newest first", () => {
    const { upcoming, archive } = splitConferences([
      conference("Undated 2028", null),
      conference("2027", "2027-10-21"),
      conference("2024", "2024-10-25", true),
      conference("2026", "2026-10-23", true),
    ]);
    expect(upcoming.map((item) => item.title)).toEqual(["2027", "Undated 2028"]);
    expect(archive.map((item) => item.title)).toEqual(["2026", "2024"]);
  });
});

describe("conference page helpers", () => {
  it("lists the structured facts, flagging archived conferences", () => {
    expect(
      conferenceFacts({ startDate: "2026-10-23", endDate: "2026-10-24", location: "Tokyo, Japan", archived: true }),
    ).toEqual([
      { label: "Dates", value: "October 23–24, 2026" },
      { label: "Location", value: "Tokyo, Japan" },
      { label: "Status", value: "Past conference" },
    ]);
    expect(conferenceFacts({ startDate: null, endDate: null, location: null, archived: false })).toEqual([]);
  });

  it("starts a new conference blank or from a copy", () => {
    expect(starterConferenceBody()).toEqual({ heroIntro: "", metrics: [], sections: [] });
    const source = {
      heroTitle: "Tokyo 2026",
      heroIntro: "Intro",
      metrics: [{ label: "Theme", value: "Teams" }],
      sections: [{ type: "prose" as const, title: "About", paragraphs: ["Text"] }],
    };
    const copy = starterConferenceBody(source);
    expect(copy.sections).toEqual(source.sections);
    expect(copy.metrics).toEqual(source.metrics);
    // The old conference's headline is not carried into the new one.
    expect(copy.heroTitle).toBeUndefined();
  });
});
