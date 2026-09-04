import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import pages from "@/content/pages.json";
import { CertificationHubSections } from "./certification-hub";
import type { ContentPageRecord } from "@/lib/types";

function renderHub() {
  return renderToStaticMarkup(<CertificationHubSections />);
}

describe("CertificationHubSections", () => {
  it("renders the merged wial.org certification, foundations, and CALC course copy", () => {
    const html = renderHub();

    expect(html).toContain('id="why"');
    expect(html).toContain("Why get certified?");
    expect(html).toContain("trained Action Learning coach");

    expect(html).toContain('id="progression"');
    expect(html).toContain("Certification pathway");
    expect(html).toContain("Certified Action Learning Coach");
    expect(html).toContain("Professional Action Learning Coach");
    expect(html).toContain("Senior Action Learning Coach");
    expect(html).toContain("Master Action Learning Coach");

    expect(html).toContain('id="foundations"');
    expect(html).toContain("Foundations of Action Learning");
    expect(html).toContain("Potential coaches");
    expect(html).toContain("Organizational champions");
    expect(html).toContain("In-house Foundations option");
    expect(html).toContain('href="/action-learning"');
    expect(html).toContain("See in-house certification programs");
    expect(html).toContain('href="#in-house"');

    expect(html).toContain('id="become-a-coach"');
    expect(html).toContain("Who gets WIAL Action Learning certified?");
    expect(html).toContain("six continents");
    expect(html).toContain("Marketing");
    expect(html).toContain("Hospitality");
    expect(html).toContain("Technology");
    expect(html).toContain("problem solving to idea generation");
    expect(html).toContain("Solution Spheres");
    expect(html).toContain('href="/our-services"');
    expect(html).toContain("Ask about becoming a coach");
    expect(html).not.toContain("Please enable JavaScript");

    expect(html).toContain('id="programs"');
    expect(html).toContain("training programs for Action Learning coaches");
    expect(html).toContain('href="#foundations"');
    expect(html).toContain('href="#calc-courses"');
    expect(html).not.toMatch(/coming soon/i);

    expect(html).toContain('id="calc-courses"');
    expect(html).toContain("Certification for Action Learning Coaches");
    expect(html).toContain("CALC 1");
    expect(html).toContain("CALC 2");
    expect(html).toContain("Developing complete problem statements");
    expect(html).toContain("Fostering a culture of Action Learning");
    expect(html).toContain("Top skills of tomorrow");
    expect(html).toContain("World Economic Forum");
    expect(html).toContain('href="#foundations"');

    expect(html).toContain('id="in-house"');
    expect(html).toContain("In-house programs");
    expect(html).toContain("six days of training");
    expect(html).toContain("staffing for large leadership development programs");
    expect(html).toContain("best leadership development experiences");
    expect(html).toContain("Dan Grady, Premier Field Engineering Director, Microsoft");
    expect(html).toContain("Ask about in-house training");

    expect(html).toContain('id="badges"');
    expect(html).toContain("Credly");
    expect(html).toContain('href="/contact"');
    expect(html).not.toContain("wial.org/certification");
  });

  it("keeps the pages.json fixture aligned with the public hub sections", () => {
    const certificationPage = (pages as ContentPageRecord[]).find(
      (page) => page.slug === "certification" && page.chapterId === null,
    );
    const titles =
      certificationPage?.bodyRichtext.sections.flatMap((section) =>
        "title" in section ? [section.title] : [],
      ) ?? [];

    expect(titles).toContain("Why get certified?");
    expect(titles).toContain("Who gets WIAL Action Learning certified?");
    expect(titles).toContain("Programs");
    expect(titles).toContain("Foundations of Action Learning");
    expect(titles).toContain("Certification for Action Learning Coaches");
    expect(titles).toContain("In-house programs");
    expect(titles).toContain("Top skills of tomorrow");

    const microsoftQuote = certificationPage?.bodyRichtext.sections.find(
      (section) => section.type === "quote",
    );
    expect(microsoftQuote && "quote" in microsoftQuote ? microsoftQuote.quote : "").toContain(
      "Microsoft",
    );
    expect(
      microsoftQuote && "attribution" in microsoftQuote ? microsoftQuote.attribution : "",
    ).toContain("Dan Grady");
  });
});
