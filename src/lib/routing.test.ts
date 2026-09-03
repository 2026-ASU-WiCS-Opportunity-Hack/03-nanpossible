import { describe, expect, it } from "vitest";
import {
  getTenantCandidate,
  normalizeSegments,
  shouldBypassTenantRewrite,
} from "./routing";

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
      redirectTo: "/benefits",
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

  it("resolves the conferences page slug", () => {
    expect(normalizeSegments(["conferences"])).toEqual({
      slug: "conferences",
      redirectTo: null,
    });
  });

  it("resolves the benefits page slug", () => {
    expect(normalizeSegments(["benefits"])).toEqual({
      slug: "benefits",
      redirectTo: null,
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

  it("resolves the our-services page slug", () => {
    expect(normalizeSegments(["our-services"])).toEqual({
      slug: "our-services",
      redirectTo: null,
    });
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
