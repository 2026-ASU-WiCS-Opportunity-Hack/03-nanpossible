import { describe, expect, it } from "vitest";
import {
  COACH_DIRECTORY_URL,
  getTenantCandidate,
  isExternalHref,
  affiliateCta,
  flattenNavigationItems,
  navigationItems,
  normalizeChapterSlug,
  normalizeSegments,
  shouldBypassTenantRewrite,
} from "./routing";

describe("navigationItems", () => {
  it("sends the Find a Coach nav item to the external WIAL directory", () => {
    const coaches = navigationItems.find((item) => item.label === "Find a Coach");
    expect(coaches?.href).toBe(COACH_DIRECTORY_URL);
    expect(isExternalHref(COACH_DIRECTORY_URL)).toBe(true);
  });

  it("orders the menu around visitor journeys (#156)", () => {
    expect(navigationItems.map((item) => [item.label, item.href])).toEqual([
      ["What is Action Learning?", "/action-learning"],
      ["For Organizations", "/for-organizations"],
      ["Get Certified", "/certification"],
      ["Find a Coach", COACH_DIRECTORY_URL],
      ["Resources", "/resources"],
      ["About WIAL", "/about"],
      ["Contact", "/contact"],
    ]);
  });

  it("keeps Clients, Partners and the other WIAL pages under About WIAL", () => {
    const about = navigationItems.find((item) => item.href === "/about");
    expect(about?.children?.map((item) => item.href)).toEqual([
      "/clients",
      "/partners",
      "/conferences",
      "/awards",
      "/better-world",
    ]);
    // Only one level of nesting, and every submenu target is a real route.
    for (const child of about?.children ?? []) {
      expect(child.children).toBeUndefined();
      expect(normalizeSegments([child.href.slice(1)])?.slug).toBe(child.href.slice(1));
    }
  });

  it("flattens the menu for voice navigation, parents before children", () => {
    const flat = flattenNavigationItems();
    expect(flat).toHaveLength(12);
    expect(flat.every((item) => !("children" in item))).toBe(true);
    const labels = flat.map((item) => item.label);
    expect(labels.indexOf("About WIAL")).toBeLessThan(labels.indexOf("Clients"));
    expect(new Set(flat.map((item) => item.href)).size).toBe(flat.length);
  });

  it("points the affiliate button at the affiliate page", () => {
    expect(affiliateCta).toEqual({ href: "/become-an-affiliate", label: "Become an Affiliate" });
    expect(normalizeSegments(["become-an-affiliate"])?.slug).toBe("become-an-affiliate");
  });

  it("treats only absolute http(s) URLs as external", () => {
    expect(isExternalHref("/coaches")).toBe(false);
    expect(isExternalHref("mailto:info@wial.org")).toBe(false);
    expect(isExternalHref("HTTP://example.org")).toBe(true);
  });
});

describe("normalizeSegments", () => {
  it("maps empty segments to the home slug", () => {
    expect(normalizeSegments(undefined)).toEqual({
      slug: "home",
      redirectTo: null,
    });
  });

  it("redirects legacy aliases to canonical routes", () => {
    expect(normalizeSegments(["about-wial"])).toEqual({
      slug: null,
      redirectTo: "/about",
    });
    expect(normalizeSegments(["contact-us"])).toEqual({
      slug: null,
      redirectTo: "/contact",
    });
    expect(normalizeSegments(["affiliates"])).toEqual({
      slug: null,
      redirectTo: "/coaches",
    });
    expect(normalizeSegments(["action-learning", "benefits"])).toEqual({
      slug: null,
      redirectTo: "/for-organizations",
    });
    expect(normalizeSegments(["past-conferences"])).toEqual({
      slug: null,
      redirectTo: "/conferences",
    });
    expect(normalizeSegments(["2024-wial-global-conference"])).toEqual({
      slug: null,
      redirectTo: "/conferences",
    });
    expect(normalizeSegments(["client-testimonials"])).toEqual({
      slug: null,
      redirectTo: "/clients",
    });
    expect(normalizeSegments(["our-clients"])).toEqual({
      slug: null,
      redirectTo: "/clients",
    });
    expect(normalizeSegments(["share-your-success-story"])).toEqual({
      slug: null,
      redirectTo: "/clients/success-story",
    });
  });

  it("redirects the legacy library, WIAL Talk, endorsed-products, and blog paths to /resources", () => {
    for (const path of [
      "library",
      "wial-talk",
      "action-learning/library",
      "action-learning/library/articles",
      "wial-endorsed-products",
      "category/wial-blog",
    ]) {
      expect(normalizeSegments(path.split("/"))).toEqual({
        slug: null,
        redirectTo: "/resources",
      });
    }
  });

  it("redirects legacy wial.org blog post URLs to their /resources articles", () => {
    expect(normalizeSegments(["future-action-learning-2"])).toEqual({
      slug: null,
      redirectTo: "/resources/the-future-is-action-learning",
    });
    expect(normalizeSegments(["fresh-look-ground-rule-1-call-apply-strictly-coach"])).toEqual({
      slug: null,
      redirectTo: "/resources/action-learning-ground-rule-1",
    });
  });

  it("resolves the resources page slug", () => {
    expect(normalizeSegments(["resources"])).toEqual({
      slug: "resources",
      redirectTo: null,
    });
  });

  it("resolves the become-an-affiliate page slug", () => {
    expect(normalizeSegments(["become-an-affiliate"])).toEqual({
      slug: "become-an-affiliate",
      redirectTo: null,
    });
  });

  it("resolves the partners page slug and redirects the legacy become-a-partner path", () => {
    expect(normalizeSegments(["partners"])).toEqual({
      slug: "partners",
      redirectTo: null,
    });
    expect(normalizeSegments(["become-a-partner"])).toEqual({
      slug: null,
      redirectTo: "/partners",
    });
  });

  it("resolves the privacy page slug and redirects the legacy privacy-policy path", () => {
    expect(normalizeSegments(["privacy"])).toEqual({
      slug: "privacy",
      redirectTo: null,
    });
    expect(normalizeSegments(["privacy-policy"])).toEqual({
      slug: null,
      redirectTo: "/privacy",
    });
  });

  it("serves /certification/in-house-programs as its own route instead of redirecting", () => {
    // #143 moved in-house programs back onto a dedicated page; the static route
    // wins over the catch-all, which must neither alias nor claim the path.
    expect(normalizeSegments(["certification", "in-house-programs"])).toBeNull();
    expect(normalizeSegments(["certification", "foundations"])).toEqual({
      slug: null,
      redirectTo: "/certification",
    });
  });

  it("resolves the community-impact page slug and redirects the legacy infographic/video paths", () => {
    expect(normalizeSegments(["community-impact"])).toEqual({
      slug: "community-impact",
      redirectTo: null,
    });
    expect(normalizeSegments(["community-impact-infographic"])).toEqual({
      slug: null,
      redirectTo: "/community-impact",
    });
    expect(normalizeSegments(["community-impact-video"])).toEqual({
      slug: null,
      redirectTo: "/community-impact",
    });
  });

  it("resolves the conferences page slug", () => {
    expect(normalizeSegments(["conferences"])).toEqual({
      slug: "conferences",
      redirectTo: null,
    });
  });

  it("permanently redirects the retired benefits page to /for-organizations", () => {
    expect(normalizeSegments(["benefits"])).toEqual({
      slug: null,
      redirectTo: "/for-organizations",
      permanent: true,
    });
  });

  it("resolves the action-learning page slug", () => {
    expect(normalizeSegments(["action-learning"])).toEqual({
      slug: "action-learning",
      redirectTo: null,
    });
  });

  it("resolves the better-world page slug", () => {
    expect(normalizeSegments(["better-world"])).toEqual({
      slug: "better-world",
      redirectTo: null,
    });
  });

  it("redirects legacy better world paths", () => {
    expect(normalizeSegments(["better-world-fund"])).toEqual({
      slug: null,
      redirectTo: "/better-world",
    });
    expect(normalizeSegments(["better-world-fund-2"])).toEqual({
      slug: null,
      redirectTo: "/better-world",
    });
    expect(normalizeSegments(["wial-gives-back"])).toEqual({
      slug: null,
      redirectTo: "/better-world",
    });
    expect(normalizeSegments(["projects"])).toEqual({
      slug: null,
      redirectTo: "/better-world",
    });
    expect(normalizeSegments(["share-your-better-world-story"])).toEqual({
      slug: null,
      redirectTo: "/contact",
    });
  });

  it("redirects legacy Better World story paths (multi-segment) to their /better-world articles", () => {
    expect(
      normalizeSegments([
        "projects",
        "partnership-world-institute-action-learning-international-federation-red-cross",
      ]),
    ).toEqual({
      slug: null,
      redirectTo: "/better-world/ifrc-partnership",
    });
    expect(
      normalizeSegments(["projects", "wial-gives-back-thailand-hospital-administration-association"]),
    ).toEqual({
      slug: null,
      redirectTo: "/better-world/thailand-hospital-administration",
    });
    expect(
      normalizeSegments(["projects", "wial-gives-back-supports-thailand-entrepreneurship-club"]),
    ).toEqual({
      slug: null,
      redirectTo: "/better-world/thailand-entrepreneurship-club",
    });
    expect(
      normalizeSegments(["projects", "grenada-red-cross-discovers-power-wial-action-learning"]),
    ).toEqual({
      slug: null,
      redirectTo: "/better-world/grenada-red-cross",
    });
    expect(normalizeSegments(["projects", "wial-gives-back-protector"])).toEqual({
      slug: null,
      redirectTo: "/better-world/malaysia-we-the-protector",
    });
    expect(
      normalizeSegments(["projects", "wial-gives-back-supports-singapores-centre-non-profit-leadership"]),
    ).toEqual({
      slug: null,
      redirectTo: "/better-world/singapore-centre-for-non-profit-leadership",
    });
    expect(
      normalizeSegments(["projects", "singapore-book-council-team-benefited-learning-wials-process"]),
    ).toEqual({
      slug: null,
      redirectTo: "/better-world/singapore-book-council",
    });
    expect(
      normalizeSegments(["projects", "wial-provides-action-learning-coaching-singapore-association-deaf"]),
    ).toEqual({
      slug: null,
      redirectTo: "/better-world/singapore-association-for-the-deaf",
    });
  });

  it("redirects the later-migrated legacy Better World story paths to their articles", () => {
    const moved: Array<[string, string]> = [
      ["human-needs-project", "/better-world/kenya-human-needs-project"],
      ["action-learning-drives-rebuilding-community-library", "/better-world/dominica-community-library"],
      ["action-learning-helping-kyrgyzstan-ngo", "/better-world/kyrgyzstan-women-ngo"],
      ["action-learning-helps-small-village-burkina-faso-discover-alternative-ideas-accessing-safe-water", "/better-world/burkina-faso-safe-water"],
      ["action-learning-improves-cross-functional-communications-non-profit-taiwan", "/better-world/taiwan-zs-foundation"],
      ["full-scale-project-non-profit-cenpec-magali-lopes", "/better-world/brazil-cenpec"],
      ["pro-bono-program-transforms-lar-da-bencao-divina-brazilian-non-profit", "/better-world/brazil-lar-da-bencao-divina"],
      ["supporting-karibu-centre-nairobi", "/better-world/kenya-karibu-centre"],
      ["wial-action-learning-helps-improve-curricular-offerings", "/better-world/brazil-vida-jovem"],
      ["wial-brazil-sets-new-bar-pro-bono-coaching", "/better-world/brazil-pro-bono-coaching"],
    ];
    for (const [oldSlug, target] of moved) {
      expect(normalizeSegments(["projects", oldSlug])).toEqual({
        slug: null,
        redirectTo: target,
      });
    }
    // The fund-overview post is not a story; it folds into the Better World page.
    expect(normalizeSegments(["projects", "better-world-fund-global-impact"])).toEqual({
      slug: null,
      redirectTo: "/better-world",
    });
  });

  it("resolves the awards page slug and redirects legacy award paths", () => {
    expect(normalizeSegments(["awards"])).toEqual({
      slug: "awards",
      redirectTo: null,
    });
    expect(normalizeSegments(["award-nomination"])).toEqual({
      slug: null,
      redirectTo: "/awards/nomination",
    });
    expect(normalizeSegments(["previous-wial-award-winners"])).toEqual({
      slug: null,
      redirectTo: "/awards",
    });
  });

  it("permanently redirects the retired our-services page to /for-organizations", () => {
    expect(normalizeSegments(["our-services"])).toEqual({
      slug: null,
      redirectTo: "/for-organizations",
      permanent: true,
    });
  });

  it("resolves the for-organizations page slug and lists it in the nav", () => {
    expect(normalizeSegments(["for-organizations"])).toEqual({
      slug: "for-organizations",
      redirectTo: null,
    });
    expect(navigationItems).toContainEqual({ href: "/for-organizations", label: "For Organizations" });
  });

  it("keeps other legacy aliases temporary and leaves tenant routing unchanged", () => {
    expect(normalizeSegments(["action-learning", "benefits"])).not.toHaveProperty("permanent");
    expect(normalizeSegments(["about-wial"])).not.toHaveProperty("permanent");
    expect(normalizeChapterSlug("benefits")).toEqual({ slug: "benefits", redirectTo: null });
    expect(normalizeChapterSlug("our-services")).toEqual({ slug: "our-services", redirectTo: null });
  });

  it("redirects legacy leadership paths to the about page", () => {
    for (const path of [
      ["about-us"],
      ["about-us", "leadership"],
      ["board-of-directors"],
      ["executive-committee"],
      ["directors-emeritus"],
      ["advisory-board"],
      ["wials-team"],
    ]) {
      expect(normalizeSegments(path)).toEqual({
        slug: null,
        redirectTo: "/about",
      });
    }
  });

  it("rejects unsupported paths", () => {
    expect(normalizeSegments(["blog"])).toBeNull();
  });
});

describe("getTenantCandidate", () => {
  it("treats apex and www as global", () => {
    expect(getTenantCandidate("wial.org")).toBeNull();
    expect(getTenantCandidate("www.wial.org")).toBeNull();
  });

  it("detects tenant hosts for production and local development", () => {
    expect(getTenantCandidate("usa.wial.org")).toBe("usa");
    expect(getTenantCandidate("usa.localhost:3000")).toBe("usa");
    expect(getTenantCandidate("usa.lvh.me:3000")).toBe("usa");
  });
});

describe("shouldBypassTenantRewrite", () => {
  it("keeps auth and account routes on their public paths", () => {
    expect(shouldBypassTenantRewrite("/login")).toBe(true);
    expect(shouldBypassTenantRewrite("/register")).toBe(true);
    expect(shouldBypassTenantRewrite("/auth/callback")).toBe(true);
    expect(shouldBypassTenantRewrite("/account/profile")).toBe(true);
    expect(shouldBypassTenantRewrite("/dashboard/profile")).toBe(true);
    expect(shouldBypassTenantRewrite("/admin/approvals")).toBe(true);
    expect(shouldBypassTenantRewrite("/resources")).toBe(false);
  });
});
