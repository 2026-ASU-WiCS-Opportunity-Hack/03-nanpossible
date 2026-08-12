import { describe, expect, it } from "vitest";
import {
  affiliateSiteUrl,
  buildAffiliateDirectorySection,
  withAffiliateDirectory,
} from "./affiliates";
import type { ChapterRecord, ContentPageRecord } from "./types";

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

function makePage(): ContentPageRecord {
  return {
    id: "page",
    chapterId: null,
    slug: "affiliates",
    title: "Our Affiliates",
    isGlobal: true,
    language: "en",
    sortOrder: 0,
    published: true,
    aiGenerated: false,
    editorKind: "legacy",
    publishedEditorKind: "legacy",
    hasPublishedBuilderSnapshot: false,
    liveRenderSource: "legacy",
    bodyRichtext: {
      heroIntro: "intro",
      metrics: [
        { label: "Global affiliates", value: "8" },
        { label: "Countries", value: "8" },
        { label: "Global reach", value: "Worldwide" },
      ],
      sections: [
        { type: "prose", title: "Find your local affiliate", paragraphs: ["p"] },
        {
          type: "contact_cards",
          title: "WIAL affiliates worldwide",
          items: [{ title: "Static", body: "static" }],
        },
        { type: "cta", title: "cta", body: "b", href: "/contact", label: "Go" },
      ],
    },
    seo: { description: "", sourceUrl: "", sourceStatus: "", sourceNotes: "" },
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

describe("buildAffiliateDirectorySection", () => {
  it("builds flagged, linked cards from chapter records", () => {
    const section = buildAffiliateDirectorySection(
      [
        makeAffiliate({
          name: "WIAL Singapore",
          subdomain: "singapore",
          country: "Singapore",
          websiteUrl: "https://www.wial.sg/",
          description: "Programs in Singapore.",
        }),
        makeAffiliate({ name: "WIAL Nigeria", subdomain: "nigeria", country: "Nigeria" }),
      ],
      "chapterstack.org",
    );

    expect(section.type).toBe("contact_cards");
    const [singapore, nigeria] = section.type === "contact_cards" ? section.items : [];
    expect(singapore).toMatchObject({
      eyebrow: "Singapore",
      title: "WIAL Singapore",
      body: "Programs in Singapore.",
      href: "https://www.wial.sg/",
      label: "Visit website",
      image: "/flags/sg.svg",
      imageAlt: "Flag of Singapore",
    });
    expect(nigeria).toMatchObject({
      href: "https://nigeria.chapterstack.org",
      label: "Visit affiliate site",
      image: "/flags/ng.svg",
    });
  });

  it("omits the flag when the country is unknown", () => {
    const section = buildAffiliateDirectorySection(
      [makeAffiliate({ country: "Somewhere" })],
      "chapterstack.org",
    );
    const [card] = section.type === "contact_cards" ? section.items : [];
    expect(card.image).toBeUndefined();
  });
});

describe("withAffiliateDirectory", () => {
  it("replaces the static directory in place and refreshes metrics", () => {
    const affiliates = [
      makeAffiliate({ name: "A", subdomain: "a", country: "USA" }),
      makeAffiliate({ name: "B", subdomain: "b", country: "United States" }),
      makeAffiliate({ name: "C", subdomain: "c", country: "Poland" }),
    ];
    const page = withAffiliateDirectory(makePage(), affiliates, "chapterstack.org");

    expect(page.bodyRichtext.sections).toHaveLength(3);
    const directory = page.bodyRichtext.sections[1];
    expect(directory.type).toBe("contact_cards");
    expect(directory.type === "contact_cards" ? directory.items : []).toHaveLength(3);
    // Title of the stored section is preserved
    expect(directory.type === "contact_cards" ? directory.title : "").toBe(
      "WIAL affiliates worldwide",
    );
    expect(page.bodyRichtext.metrics[0].value).toBe("3");
    // USA and United States resolve to the same country
    expect(page.bodyRichtext.metrics[1].value).toBe("2");
    expect(page.bodyRichtext.metrics[2].value).toBe("Worldwide");
  });

  it("returns the page untouched when there are no affiliates", () => {
    const page = makePage();
    expect(withAffiliateDirectory(page, [], "chapterstack.org")).toBe(page);
  });
});
