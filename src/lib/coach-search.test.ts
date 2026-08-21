import { describe, expect, it } from "vitest";
import {
  buildSearchCacheKey,
  isComplexCoachQuery,
  mergeCoachSearchResults,
} from "@/lib/coach-search";
import type { CoachRecord } from "@/lib/types";

const baseCoach: CoachRecord = {
  id: "coach-1",
  userId: null,
  chapterId: null,
  slug: "maria-santos",
  name: "Maria Santos",
  title: null,
  organization: null,
  email: "maria@wial.org",
  phone: null,
  phoneCountryCode: null,
  photoUrl: null,
  certLevel: "SALC",
  certValidUntil: null,
  locationCity: "Sao Paulo",
  locationState: null,
  locationCountry: "Brazil",
  locationLat: null,
  locationLng: null,
  bio: "Government leadership specialist",
  credentials: null,
  awards: null,
  cvUrl: null,
  specializations: ["government"],
  languages: ["pt", "en"],
  website: null,
  linkedin: null,
  blogUrl: null,
  youtubeUrl: null,
  twitterUrl: null,
  facebookUrl: null,
  credlyBadgeUrl: null,
  approved: true,
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
  lastApprovedAt: "2026-03-01T00:00:00.000Z",
  rejectionReason: null,
  rejectedAt: null,
};

describe("coach search helpers", () => {
  it("flags longer natural-language searches as complex", () => {
    expect(isComplexCoachQuery("Maria Santos")).toBe(false);
    expect(
      isComplexCoachQuery("I need a SALC near Sao Paulo who works with government agencies"),
    ).toBe(true);
  });

  it("flags non-Latin-script searches as complex", () => {
    expect(isComplexCoachQuery("说中文的教练")).toBe(true);
    expect(isComplexCoachQuery("リーダーシップ")).toBe(true);
    expect(isComplexCoachQuery("مدرب في دبي")).toBe(true);
    expect(isComplexCoachQuery("São Paulo")).toBe(false);
    expect(isComplexCoachQuery("Małgorzata")).toBe(false);
  });

  it("builds stable cache keys for normalized filters", () => {
    expect(
      buildSearchCacheKey(" Maria Santos ", {
        certLevel: "SALC",
        country: " Brazil ",
        language: "pt",
      }),
    ).toBe(
      buildSearchCacheKey("maria santos", {
        certLevel: "SALC",
        country: "brazil",
        language: "pt",
      }),
    );
  });

  it("merges exact-name and semantic results without duplicates", () => {
    const merged = mergeCoachSearchResults(
      [{ ...baseCoach, similarity: 0.88 }],
      [{ ...baseCoach, similarity: 1 }],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.similarity).toBe(1);
  });
});
