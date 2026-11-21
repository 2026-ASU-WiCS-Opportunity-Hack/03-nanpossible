import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContentPage } from "./content-page";
import type { ContentPageRecord, SiteContext } from "@/lib/types";

const siteContext: SiteContext = { isGlobal: true, tenant: null, host: "example.org" };

function pageWithSlug(slug: string): ContentPageRecord {
  return {
    id: "test",
    chapterId: null,
    slug,
    title: "Test page",
    isGlobal: true,
    language: "en",
    sortOrder: 0,
    published: true,
    aiGenerated: false,
    editorKind: "legacy",
    publishedEditorKind: "legacy",
    hasPublishedBuilderSnapshot: false,
    liveRenderSource: "legacy",
    bodyRichtext: { heroIntro: "Intro", metrics: [], sections: [] },
    seo: { description: "Test", sourceUrl: "", sourceStatus: "", sourceNotes: "" },
  };
}

describe("ContentPage hero", () => {
  it.each([
    ["partners", false],
    ["clients", false],
    ["about", true],
  ])("slug %s renders the clients button: %s", (slug, expected) => {
    const html = renderToStaticMarkup(
      <ContentPage page={pageWithSlug(slug)} siteContext={siteContext} />,
    );
    expect(html.includes("View our clients")).toBe(expected);
  });

  // #157: a heroTitle overrides the page title; the page title stays the SEO title.
  it("renders heroTitle instead of the page title when set", () => {
    const page = pageWithSlug("home");
    page.bodyRichtext.heroTitle = "Solve complex problems. Develop stronger leaders.";
    const html = renderToStaticMarkup(
      <ContentPage page={page} siteContext={siteContext} />,
    );
    expect(html).toContain("Solve complex problems. Develop stronger leaders.");
    expect(html).not.toContain(">Test page<");
  });

  it("falls back to the page title when heroTitle is blank", () => {
    const page = pageWithSlug("home");
    page.bodyRichtext.heroTitle = "   ";
    const html = renderToStaticMarkup(
      <ContentPage page={page} siteContext={siteContext} />,
    );
    expect(html).toContain("Test page");
  });

  it("renders heroCtas instead of the default Contact / Clients buttons", () => {
    const page = pageWithSlug("home");
    page.bodyRichtext.heroCtas = [
      { label: "Explore solutions", href: "/for-organizations", variant: "primary" },
      { label: "Become a certified coach", href: "/certification", variant: "secondary" },
    ];
    const html = renderToStaticMarkup(
      <ContentPage page={page} siteContext={siteContext} />,
    );
    expect(html).toContain("Explore solutions");
    expect(html).toContain('href="/for-organizations"');
    expect(html).toContain("Become a certified coach");
    expect(html).toContain('href="/certification"');
    expect(html).not.toContain("Contact WIAL");
    expect(html).not.toContain("View our clients");
  });
});
