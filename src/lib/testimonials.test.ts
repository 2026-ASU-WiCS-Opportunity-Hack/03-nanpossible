import { describe, expect, it } from "vitest";
import {
  extractTestimonialItems,
  resolveTestimonials,
  type TestimonialItem,
} from "./testimonials";

const items: TestimonialItem[] = [
  { organization: "A", name: "Ann", quote: "Quote A", audiences: ["home"], videoUrl: "https://v/a", videoTitle: "A video" },
  { organization: "B", name: "Bob", quote: "Quote B", audiences: ["home", "certification"] },
  { organization: "C", name: "Cy", quote: "Quote C", audiences: ["certification"] },
  { organization: "D", name: "Di", quote: "Quote D", audiences: ["home"] },
  { organization: "E", name: "Ed", quote: "Quote E", audiences: ["home"] },
  { organization: "F", name: "Flo", quote: "Quote F" },
  { organization: "G", name: "Gus", audiences: ["home"], videoUrl: "https://v/g" },
];

describe("resolveTestimonials", () => {
  it("returns only audience matches in stable source order", () => {
    const out = resolveTestimonials(items, { audience: "certification" });
    expect(out.map((i) => i.organization)).toEqual(["B", "C"]);
  });

  it("defaults the limit to 3", () => {
    expect(resolveTestimonials(items, { audience: "home" })).toHaveLength(3);
  });

  it("honours an explicit limit and clamps nonsense values", () => {
    expect(resolveTestimonials(items, { audience: "home", limit: 2 })).toHaveLength(2);
    expect(resolveTestimonials(items, { audience: "home", limit: 0 })).toHaveLength(1);
    expect(resolveTestimonials(items, { audience: "home", limit: Number.NaN })).toHaveLength(3);
  });

  it("strips video unless includeVideo is set, and skips video-only items without it", () => {
    const without = resolveTestimonials(items, { audience: "home", limit: 6 });
    expect(without.some((i) => i.videoUrl)).toBe(false);
    expect(without.map((i) => i.organization)).toEqual(["A", "B", "D", "E"]);
    const withVideo = resolveTestimonials(items, { audience: "home", limit: 6, includeVideo: true });
    expect(withVideo.map((i) => i.organization)).toEqual(["A", "B", "D", "E", "G"]);
    expect(withVideo[0].videoUrl).toBe("https://v/a");
  });

  it("never mutates the source and is deterministic", () => {
    const copy = JSON.stringify(items);
    const a = resolveTestimonials(items, { audience: "home" });
    const b = resolveTestimonials(items, { audience: "home" });
    expect(a).toEqual(b);
    expect(JSON.stringify(items)).toBe(copy);
  });

  it("handles an empty or missing source", () => {
    expect(resolveTestimonials([], { audience: "home" })).toEqual([]);
    expect(resolveTestimonials(undefined, { audience: "home" })).toEqual([]);
  });

  it("returns source items, not copies of the text (no duplication)", () => {
    const [first] = resolveTestimonials(items, { audience: "certification" });
    expect(first.quote).toBe("Quote B");
  });
});

describe("extractTestimonialItems", () => {
  it("reads the testimonial_grid items from a page body", () => {
    const body = { heroIntro: "", metrics: [], sections: [{ type: "testimonial_grid" as const, title: "t", items }] };
    expect(extractTestimonialItems(body)).toHaveLength(items.length);
    expect(extractTestimonialItems(null)).toEqual([]);
    expect(extractTestimonialItems({ heroIntro: "", metrics: [], sections: [] })).toEqual([]);
  });
});
