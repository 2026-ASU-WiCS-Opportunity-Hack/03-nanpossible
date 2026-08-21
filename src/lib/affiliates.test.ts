import { describe, expect, it } from "vitest";
import { affiliateSiteUrl } from "./affiliates";
import type { ChapterRecord } from "./types";

function makeAffiliate(overrides: Partial<ChapterRecord>): ChapterRecord {
  return {
    id: "id",
    name: "WIAL Test",
    subdomain: "test",
    region: null,
    language: "en",
    country: null,
    leadUserId: null,
    contactEmail: null,
    contactPhone: null,
    contactPhoneCountryCode: null,
    description: null,
    logoUrl: null,
    websiteUrl: null,
    stripeAccountId: null,
    config: {},
    status: "active",
    ...overrides,
  };
}

describe("affiliateSiteUrl", () => {
  it("prefers the configured external website", () => {
    const affiliate = makeAffiliate({ websiteUrl: "https://www.wial.sg/" });
    expect(affiliateSiteUrl(affiliate, "chapterstack.org")).toBe("https://www.wial.sg/");
  });

  it("falls back to the hosted subdomain site", () => {
    const affiliate = makeAffiliate({ subdomain: "nigeria" });
    expect(affiliateSiteUrl(affiliate, "chapterstack.org")).toBe(
      "https://nigeria.chapterstack.org",
    );
    expect(affiliateSiteUrl(affiliate, "localhost:3000")).toBe(
      "http://nigeria.localhost:3000",
    );
  });
});
