import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderSection } from "./content-page";
import type { ContentSection } from "@/lib/types";
import type { TestimonialItem } from "@/lib/testimonials";

const source: TestimonialItem[] = [
  { organization: "Org One", name: "Ann", role: "CEO", quote: "First quote", audiences: ["home"], videoUrl: "https://www.youtube-nocookie.com/embed/x", videoTitle: "One video" },
  { organization: "Org Two", name: "Bob", quote: "Second quote", audiences: ["home"] },
  { organization: "Org Three", name: "Cy", quote: "Third quote", audiences: ["certification"] },
];

const section: ContentSection = {
  type: "testimonial_highlights",
  title: "What clients say",
  audience: "home",
};

function html(s: ContentSection, testimonials: TestimonialItem[] | undefined = source) {
  return renderToStaticMarkup(<>{renderSection(s, { testimonials })}</>);
}

describe("testimonial_highlights section", () => {
  it("renders audience-matched quotes from the shared source with a link to /clients", () => {
    const out = html(section);
    expect(out).toContain("First quote");
    expect(out).toContain("Second quote");
    expect(out).not.toContain("Third quote");
    expect(out).toContain("<blockquote");
    expect(out).toContain('href="/clients"');
    expect(out).toContain("See all client stories");
    expect(out).not.toContain("<iframe");
  });

  it("embeds a lazy, titled video only when includeVideo is set", () => {
    const out = html({ ...section, includeVideo: true } as ContentSection);
    expect(out).toContain("<iframe");
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('title="One video"');
  });

  it("honours custom link label/href and limit", () => {
    const out = html({ ...section, limit: 1, linkLabel: "More stories", linkHref: "/clients#x" } as ContentSection);
    expect(out).toContain("First quote");
    expect(out).not.toContain("Second quote");
    expect(out).toContain("More stories");
    expect(out).toContain('href="/clients#x"');
  });

  it("renders nothing when there are no matching quotes", () => {
    expect(html({ ...section, audience: "affiliate" } as ContentSection)).toBe("");
    expect(html(section, [])).toBe("");
  });
});

describe("testimonial_grid (the /clients layout)", () => {
  it("still renders every item with the shared card markup", () => {
    const out = html({ type: "testimonial_grid", title: "All", items: source });
    expect(out).toContain("First quote");
    expect(out).toContain("Third quote");
    expect(out).toContain("feature-card feature-card--flat");
    expect(out).toContain('title="One video"');
  });
});
