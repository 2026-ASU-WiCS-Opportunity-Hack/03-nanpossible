import { describe, expect, it } from "vitest";
import { affiliateSiteLink, affiliateSiteUrl } from "./affiliates";
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

describe("affiliateSiteLink", () => {
  it("marks a configured website as external and exposes its bare host", () => {
    const affiliate = makeAffiliate({ websiteUrl: "http://www.wial-usa.org/" });
    expect(affiliateSiteLink(affiliate, "chapterstack.org")).toEqual({
      href: "http://www.wial-usa.org/",
      external: true,
      host: "wial-usa.org",
    });
  });

  it("treats a social page standing in for a website as external", () => {
    const affiliate = makeAffiliate({ websiteUrl: "https://www.facebook.com/wialvietnam" });
    expect(affiliateSiteLink(affiliate, "chapterstack.org").external).toBe(true);
    expect(affiliateSiteLink(affiliate, "chapterstack.org").host).toBe("facebook.com");
  });

  it("marks the hosted subdomain site as staying on the platform", () => {
    const affiliate = makeAffiliate({ subdomain: "nigeria" });
    expect(affiliateSiteLink(affiliate, "chapterstack.org")).toEqual({
      href: "https://nigeria.chapterstack.org",
      external: false,
      host: "nigeria.chapterstack.org",
    });
    expect(affiliateSiteLink(affiliate, "localhost:3000").external).toBe(false);
  });

  it("does not call a website on the platform's own domain external", () => {
    const affiliate = makeAffiliate({ websiteUrl: "https://italy.chapterstack.org/" });
    expect(affiliateSiteLink(affiliate, "chapterstack.org").external).toBe(false);
  });
});
