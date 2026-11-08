import { describe, expect, it } from "vitest";
import { sanitizeSection, sanitizeSections } from "./page-section-sanitize";
import type { ContentSection } from "./types";

const grid: ContentSection = {
  type: "testimonial_grid",
  title: "Stories",
  items: [
    { organization: "A", name: "Ann", quote: "Real quote", audiences: ["home"] },
    { organization: "B", name: "Bob", quote: "Other", logo: "/b.png" },
  ],
};
const ctx = { storedSections: [grid] };

function highlights(extra: Record<string, unknown> = {}): ContentSection {
  return {
    type: "testimonial_highlights",
    title: "Hear from clients",
    audience: "home",
    ...extra,
  } as ContentSection;
}

describe("testimonial_highlights", () => {
  it("fills defaults and keeps valid input", () => {
    const out = sanitizeSection(highlights(), 0, ctx);
    expect(out).toEqual({
      section: {
        type: "testimonial_highlights",
        title: "Hear from clients",
        audience: "home",
        limit: 3,
      },
    });
  });

  it("clamps the limit, stores video only when true, drops unknown keys", () => {
    const out = sanitizeSection(
      highlights({ limit: 99, includeVideo: "yes", items: [{ quote: "x" }], extra: 1 }),
      0,
      ctx,
    );
    expect(out).toEqual({
      section: {
        type: "testimonial_highlights",
        title: "Hear from clients",
        audience: "home",
        limit: 6,
      },
    });
    const withVideo = sanitizeSection(highlights({ includeVideo: true }), 0, ctx);
    expect("section" in withVideo && withVideo.section).toMatchObject({ includeVideo: true });
  });

  it("rejects a missing title, bad audience and external links", () => {
    expect(sanitizeSection(highlights({ title: " " }), 0, ctx)).toEqual({
      error: "Section 1: add a heading for the client quotes.",
    });
    expect("error" in sanitizeSection(highlights({ audience: "nope" }), 2, ctx)).toBe(true);
    expect(sanitizeSection(highlights({ linkHref: "https://x.com" }), 0, ctx)).toEqual({
      error: "Section 1: the link must be a page on this site, like /clients.",
    });
    expect("error" in sanitizeSection(highlights({ linkHref: "javascript:x" }), 0, ctx)).toBe(true);
  });

  it("omits blank link fields and keeps valid ones", () => {
    const blank = sanitizeSection(highlights({ linkHref: " ", linkLabel: "" }), 0, ctx);
    expect("section" in blank && "linkHref" in blank.section).toBe(false);
    const ok = sanitizeSection(highlights({ linkHref: "/clients", linkLabel: " More " }), 0, ctx);
    expect("section" in ok && ok.section).toMatchObject({ linkHref: "/clients", linkLabel: "More" });
  });

  it("rejects duplicate heading + audience", () => {
    const out = sanitizeSections([grid, highlights(), highlights()], ctx);
    expect(out).toEqual({
      error: "Sections 2 and 3: two client-quote sections can't share the same heading and page.",
    });
  });
});

describe("testimonial_grid", () => {
  it("ignores payload copy and applies tags", () => {
    const tampered: ContentSection = {
      type: "testimonial_grid",
      title: "HACKED",
      items: [
        { organization: "A", name: "Ann", quote: "Evil", audiences: ["certification", "home"] },
        { organization: "B", name: "Bob", quote: "Evil", logo: "/evil.png", audiences: ["affiliate"] },
      ],
    };
    const out = sanitizeSections([tampered], ctx);
    expect(out).toEqual({
      sections: [
        {
          type: "testimonial_grid",
          title: "Stories",
          items: [
            { organization: "A", name: "Ann", quote: "Real quote", audiences: ["home", "certification"] },
            { organization: "B", name: "Bob", quote: "Other", logo: "/b.png", audiences: ["affiliate"] },
          ],
        },
      ],
    });
  });

  it("errors when the stored grid is dropped or a new one is added", () => {
    expect(sanitizeSections([], ctx)).toEqual({
      error: "The client stories section can't be removed here.",
    });
    expect(sanitizeSections([grid], { storedSections: [] })).toEqual({
      error: "Client stories can't be added from here.",
    });
  });

  it("maps a second grid to the second stored grid", () => {
    const second: ContentSection = { ...grid, title: "Second", items: [{ organization: "Z", name: "Zed", quote: "zq" }] };
    const out = sanitizeSections([grid, second], { storedSections: [grid, second] });
    expect("sections" in out && out.sections[1]).toMatchObject({ title: "Second" });
  });
});

describe("existing section types", () => {
  it("still validates prose, timeline and cta, and passes locked types through", () => {
    expect(sanitizeSection({ type: "prose", title: "", paragraphs: [] }, 0)).toEqual({
      error: "Section 1: add a heading.",
    });
    expect(sanitizeSection({ type: "prose", title: "T", paragraphs: [] }, 1)).toEqual({
      error: "Section 2 (T): add at least one paragraph.",
    });
    expect("error" in sanitizeSection({ type: "timeline", title: "T", items: [] }, 0)).toBe(true);
    expect("error" in sanitizeSection({ type: "cta", title: "T", body: "", href: "", label: "" }, 0)).toBe(true);
    const locked = { type: "video", title: "V", videoUrl: "u", videoTitle: "t" } as ContentSection;
    expect(sanitizeSection(locked, 0)).toEqual({ section: locked });
  });
});

describe("hardening", () => {
  it("rejects client quotes on unsupported pages", () => {
    for (const slug of ["clients", "contact", "certification/in-house-programs", "resources/x"]) {
      expect("error" in sanitizeSection(highlights(), 0, { storedSections: [], slug })).toBe(true);
    }
    expect("section" in sanitizeSection(highlights(), 0, { storedSections: [], slug: "certification" })).toBe(true);
  });

  it("returns errors instead of throwing on hostile input", () => {
    expect("error" in sanitizeSections([null], ctx)).toBe(true);
    expect("error" in sanitizeSections([5], ctx)).toBe(true);
    expect("error" in sanitizeSections([[]], ctx)).toBe(true);
    expect("error" in sanitizeSection(highlights({ title: 5 }), 0)).toBe(true);
    expect("section" in sanitizeSection(highlights({ description: 5, linkLabel: [] }), 0)).toBe(true);
  });

  it("refuses a tag patch that does not match the stored quotes", () => {
    const stale = { ...grid, items: [{ organization: "A", name: "Ann", audiences: ["home"] }] } as ContentSection;
    const out = sanitizeSections([stale], ctx);
    expect("error" in out && out.error).toMatch(/Reload the page/);
  });

  it("names both sections in the duplicate heading error", () => {
    const out = sanitizeSections([grid, highlights(), highlights()], ctx);
    expect("error" in out && out.error).toMatch(/Sections 2 and 3/);
  });
});
