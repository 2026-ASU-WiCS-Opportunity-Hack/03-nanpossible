import { describe, expect, it } from "vitest";
import pages from "@/content/pages.json";
import type { ContentBody } from "@/lib/types";

type FixturePage = {
  id: string;
  chapterId: string | null;
  slug: string;
  title: string;
  bodyRichtext: ContentBody;
};

function globalHome(): FixturePage {
  const home = (pages as unknown as FixturePage[]).find(
    (page) => page.slug === "home" && page.chapterId === null,
  );
  if (!home) {
    throw new Error("global home fixture is missing");
  }
  return home;
}

describe("global home fixture (#157, #158)", () => {
  it("keeps the page title for SEO and overrides the hero instead", () => {
    const home = globalHome();
    expect(home.title).toBe("World Institute for Action Learning");
    expect(home.bodyRichtext.heroTitle).toBe(
      "Solve complex problems. Develop stronger leaders. At the same time.",
    );
    expect(home.bodyRichtext.heroIntro).toBe(
      "WIAL Action Learning helps organizations turn real business challenges into opportunities for breakthrough solutions, stronger teams, and lasting leadership development.",
    );
    expect(home.bodyRichtext.heroCtas).toEqual([
      { label: "Explore solutions", href: "/for-organizations", variant: "primary" },
      { label: "Become a certified coach", href: "/certification", variant: "secondary" },
    ]);
    // At-a-glance metrics are untouched by the hero rewrite.
    expect(home.bodyRichtext.metrics).toEqual([
      { label: "Certification levels", value: "4" },
      { label: "Solution categories", value: "4" },
      { label: "Global affiliates", value: "8" },
    ]);
  });

  it("has no Purpose / Vision / Mission statements and no offers cards", () => {
    const types = globalHome().bodyRichtext.sections.map((section) => section.type);
    expect(types).not.toContain("statements");
    expect(types).not.toContain("feature_grid");
  });

  it("opens with the teaser video, then the journey cards, then the CTAs", () => {
    const sections = globalHome().bodyRichtext.sections;
    expect(sections.map((section) => section.type)).toEqual([
      "video",
      "journey_cards",
      "cta",
      "cta",
      "cta",
    ]);
  });

  it("embeds the teaser video from youtube-nocookie.com, lazy-loaded by the renderer", () => {
    const video = globalHome().bodyRichtext.sections[0];
    expect(video.type).toBe("video");
    if (video.type !== "video") {
      throw new Error("first home section is not the video");
    }
    expect(video.videoUrl).toBe("https://www.youtube-nocookie.com/embed/x8gjjN0pu5o");
    expect(video.videoTitle).toBeTruthy();
  });

  it("has three journey cards with the exact CTA hrefs", () => {
    const cards = globalHome().bodyRichtext.sections[1];
    expect(cards.type).toBe("journey_cards");
    if (cards.type !== "journey_cards") {
      throw new Error("second home section is not the journey cards");
    }
    expect(cards.title).toBe("Find your path");
    expect(cards.items.map((item) => item.title)).toEqual([
      "For organizations",
      "For coaches & trainers",
      "For the WIAL community",
    ]);
    const hrefs = cards.items.map((item) =>
      item.links.map((link) => link.href),
    );
    expect(hrefs).toEqual([
      ["/for-organizations", "/contact"],
      ["/certification", "/become-an-affiliate"],
      ["/resources", "https://directory.wial.org/coaches", "/coaches"],
    ]);
    // The affiliate link is the primary button in the coaches card.
    const coachesLinks = cards.items[1].links;
    expect(coachesLinks.find((link) => link.label === "Become an affiliate")?.variant).toBe(
      "primary",
    );
    expect(
      coachesLinks.find((link) => link.label === "See the certification pathway")
        ?.variant,
    ).toBe("secondary");
  });

  it("leaves the WIAL USA tenant home page untouched", () => {
    const usa = (pages as unknown as FixturePage[]).find(
      (page) => page.slug === "home" && page.chapterId !== null,
    );
    expect(usa).toBeDefined();
    expect(usa?.bodyRichtext.sections.map((section) => section.type)).toEqual([
      "feature_grid",
      "cta",
    ]);
    expect(usa?.bodyRichtext.heroTitle).toBeUndefined();
  });
});
