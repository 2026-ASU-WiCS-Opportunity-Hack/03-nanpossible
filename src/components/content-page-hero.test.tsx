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
});
