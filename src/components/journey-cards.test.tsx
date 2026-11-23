import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import pages from "@/content/pages.json";
import { renderSection } from "./content-page";
import type { ContentSection } from "@/lib/types";

function homeJourneyCards(): Extract<ContentSection, { type: "journey_cards" }> {
  const home = (pages as unknown as { slug: string; chapterId: string | null; bodyRichtext: { sections: ContentSection[] } }[]).find(
    (page) => page.slug === "home" && page.chapterId === null,
  );
  const section = home?.bodyRichtext.sections.find(
    (item) => item.type === "journey_cards",
  );
  if (!section || section.type !== "journey_cards") {
    throw new Error("global home fixture has no journey_cards section");
  }
  return section;
}

describe("journey_cards section", () => {
  it("renders three audience cards with every link", () => {
    const html = renderToStaticMarkup(renderSection(homeJourneyCards()));
    expect(html).toContain("Find your path");
    expect(html).toContain("For organizations");
    expect(html).toContain("HR director, L&amp;D leader, executive");
    expect(html).toContain("How can Action Learning help my organization?");
    expect(html).toContain("For coaches &amp; trainers");
    expect(html).toContain("For the WIAL community");
    expect(html).toContain('href="/for-organizations"');
    expect(html).toContain('href="/contact"');
    expect(html).toContain('href="/certification"');
    expect(html).toContain('href="/become-an-affiliate"');
    expect(html).toContain('href="/resources"');
    expect(html).toContain('href="https://directory.wial.org/coaches"');
    expect(html).toContain('href="https://directory.wial.org/affiliates"');
  });

  // #158 flags the affiliate path as super important: it is the only
  // primary button in the coaches card.
  it("makes the Become an affiliate link the primary button in its card", () => {
    const html = renderToStaticMarkup(renderSection(homeJourneyCards()));
    const affiliateIndex = html.indexOf("Become an affiliate");
    expect(affiliateIndex).toBeGreaterThan(-1);
    expect(html.slice(0, affiliateIndex)).toContain("button-link primary");
    const coachesIndex = html.indexOf("For coaches");
    const communityIndex = html.indexOf("For the WIAL community");
    const coachesCard = html.slice(coachesIndex, communityIndex);
    expect(coachesCard).toContain("button-link primary");
    expect(coachesCard).toContain("button-link secondary");
    expect(coachesCard.match(/button-link primary/g)).toHaveLength(1);
  });
});
