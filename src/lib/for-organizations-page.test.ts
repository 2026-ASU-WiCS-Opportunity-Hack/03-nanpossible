import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import pages from "@/content/pages.json";
import { resolveTestimonials, extractTestimonialItems } from "./testimonials";

type Section = { type: string; href?: string; label?: string; audience?: string; items?: Array<Record<string, unknown>>; quote?: string };
type Page = { id: string; slug: string; chapterId: string | null; bodyRichtext: { sections: Section[] } };

const all = pages as unknown as Page[];
const globalPage = (slug: string) => all.find((p) => p.slug === slug && !p.chapterId) as Page;

describe("for-organizations fixture", () => {
  const page = globalPage("for-organizations");
  const sections = page.bodyRichtext.sections;

  it("is a single global page with a unique id", () => {
    expect(all.filter((p) => p.slug === "for-organizations")).toHaveLength(1);
    expect(page.chapterId).toBeNull();
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
  });

  it("leads with the problems, then spheres, benefits, in-house, and social proof", () => {
    const titles = sections.map((s) => (s as { title?: string }).title);
    const idx = (t: string) => titles.indexOf(t);
    expect(sections[0].type).toBe("feature_grid");
    expect(sections[0].items).toHaveLength(3);
    expect(idx("Four ways Action Learning creates results")).toBeGreaterThan(0);
    expect(idx("Breakthrough problem solving")).toBeGreaterThan(idx("Four ways Action Learning creates results"));
    expect(idx("In-house programs")).toBeGreaterThan(idx("Breakthrough problem solving"));
    const types = sections.map((s) => s.type);
    expect(types.indexOf("testimonial_highlights")).toBeGreaterThan(idx("In-house programs"));
    expect(types.indexOf("logo_grid")).toBe(types.indexOf("testimonial_highlights") + 1);
  });

  it("has a Request a conversation CTA that preselects the Programs topic", () => {
    const cta = sections.find((s) => s.type === "cta" && s.label === "Request a conversation");
    expect(cta?.href).toBe("/contact?about=Programs");
  });

  it("keeps every CTA on an internal route", () => {
    for (const s of sections.filter((x) => x.type === "cta")) {
      expect(s.href?.startsWith("/")).toBe(true);
    }
  });

  it("selects organization quotes by rule without carrying quote copy", () => {
    const highlights = sections.filter((s) => s.type === "testimonial_highlights");
    expect(highlights).toHaveLength(1);
    expect(highlights[0].audience).toBe("organizations");
    expect(highlights[0]).not.toHaveProperty("items");
    const items = extractTestimonialItems(globalPage("clients").bodyRichtext as never);
    expect(resolveTestimonials(items, { audience: "organizations", limit: 3 })).toHaveLength(3);
  });

  it("only uses logos that exist in public/clients", () => {
    const grid = sections.find((s) => s.type === "logo_grid");
    expect(grid?.items?.length).toBeGreaterThan(0);
    for (const item of grid?.items ?? []) {
      expect(existsSync(path.join(process.cwd(), "public", String(item.logo)))).toBe(true);
    }
  });

  it("moved the organizations highlights off our-services", () => {
    expect(globalPage("our-services").bodyRichtext.sections.some((s) => s.type === "testimonial_highlights")).toBe(false);
  });
});

describe("internal links to the retired pages", () => {
  it("no live fixture page links to /our-services or /benefits", () => {
    const retired = new Set(["our-services", "benefits"]);
    for (const p of all.filter((x) => !retired.has(x.slug))) {
      const text = JSON.stringify(p);
      expect(text, p.slug).not.toMatch(/"href":\s*"\/(our-services|benefits)"/);
    }
  });
});
