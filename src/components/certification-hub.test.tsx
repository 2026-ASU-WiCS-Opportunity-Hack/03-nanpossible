import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import pages from "@/content/pages.json";
import {
  certificationJourney,
  certificationRecertificationRules,
} from "@/content/certification-hub";
import { FindTrainingGrid } from "./certification-find-training";
import { CertificationHubSections } from "./certification-hub";
import { InHouseProgramsPage } from "./certification-in-house";
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
    // #143: the three levels are plain subheadings with Mark's one-line descriptions.
    expect(html).toContain("CALCs can coach Action Learning sessions.");
    expect(html).toContain("100+ hours of coaching experience");
    expect(html).toContain("published and contributed significantly");

    expect(html).toContain('id="progression"');
    expect(html).toContain("Your path to certification");
    expect(html).toContain("Certified Action Learning Coach");
    expect(html).toContain("Professional Action Learning Coach");
    expect(html).not.toContain("Senior Action Learning Coach");
    expect(html).not.toContain("SALC");
    expect(html).toContain("Master Action Learning Coach");

    expect(html).toContain('id="foundations"');
    expect(html).toContain("Foundations of Action Learning");
    expect(html).toContain("Potential coaches");
    expect(html).toContain("Organizational champions");
    expect(html).toContain('href="/action-learning"');
    // The in-house Foundations callout was removed (#in-house below covers it).
    expect(html).not.toContain("In-house Foundations option");
    expect(html).not.toContain("See in-house certification programs");

    expect(html).toContain('id="become-a-coach"');
    expect(html).toContain("Who gets WIAL Action Learning certified?");
    expect(html).toContain("six continents");
    expect(html).toContain("in any industry");
    // The industries list was removed to shorten the page.
    expect(html).not.toContain("Marketing");
    expect(html).not.toContain("Hospitality");
    expect(html).toContain("problem solving to idea generation");
    expect(html).toContain("Solution Spheres");
    expect(html).toContain('href="/for-organizations"');
    expect(html).toContain('href="/become-a-coach"');
    expect(html).toContain("/certification/certified-coaches-cohort.jpg");
    expect(html).not.toContain("Please enable JavaScript");

    expect(html).toContain('id="programs"');
    expect(html).toContain("training programs for Action Learning coaches");
    expect(html).toContain('href="#foundations"');
    expect(html).toContain('href="#calc-courses"');
    expect(html).not.toMatch(/coming soon/i);

    expect(html).toContain('id="calc-courses"');
    expect(html).toContain("Certification for Action Learning Coaches");
    // One CALC certification course now — no CALC 1 / CALC 2 (#143).
    expect(html).not.toMatch(/CALC [12]\b/);
    // The course focus-area cards and prerequisite line were removed (WIAL markup, Sept 2026).
    expect(html).not.toContain("Advanced coaching methods");
    expect(html).not.toContain("Running a successful Action Learning program");
    expect(html).not.toContain("Senior or Master");
    expect(html).toContain("/certification/calc-certificate-presentation.jpg");
    // Top skills of tomorrow was removed from the page to shorten it (kept in
    // certification-hub.ts for the chatbot).
    expect(html).not.toContain("Top skills of tomorrow");
    expect(html).not.toContain("World Economic Forum");

    // In-house programs is a teaser on the hub; the copy lives on its own page.
    expect(html).toContain('id="in-house"');
    expect(html).toContain("In-house programs");
    expect(html).toContain("Explore in-house programs");
    expect(html).not.toContain("Dan Grady");

    // The digital-badge section was removed from the page (#143).
    expect(html).not.toContain('id="badges"');
    expect(html).not.toContain("Credly");
    expect(html).not.toContain("digital badge");

    expect(html).not.toContain("wial.org/certification");
  });

  it("does not dress non-interactive lists up as cards", () => {
    const html = renderHub();
    // Plain lists (foundations/CALC-course bullets) don't get feature-card
    // styling; only the pathway buttons and the Programs catalog (which link
    // somewhere) keep the feature-card look.
    expect(html).not.toMatch(/<li class="feature-card/);
    expect(html).toMatch(/<button[^>]*class="feature-card/);
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
    expect(titles).not.toContain("Top skills of tomorrow");
    expect(JSON.stringify(certificationPage?.bodyRichtext)).not.toMatch(/CALC [12]\b/);

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

describe("certification coach journey (#160)", () => {
  it("leads with the how-to headline and a Become a coach CTA", () => {
    const html = renderHub();

    expect(html).toMatch(/<h1[^>]*>How to become a Certified Action Learning Coach<\/h1>/);
    expect(html).toContain('href="#find-training"');
    // No generic "Contact Us" CTA any more.
    expect(html).not.toContain("Contact Us");
    expect(html).not.toContain('href="/contact"');
    expect(html.match(/href="\/become-a-coach"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain("Want to bring WIAL to your country?");
    expect(html).toContain('href="/become-an-affiliate"');
  });

  it("numbers the four steps with prerequisites, time and renewal", () => {
    const html = renderHub();
    const steps = html.slice(html.indexOf('id="progression"'), html.indexOf('id="what-you-get"'));

    expect(certificationJourney.map((step) => step.name)).toEqual([
      "Foundations",
      "CALC",
      "PALC",
      "MALC",
    ]);
    for (const [index, step] of certificationJourney.entries()) {
      expect(steps).toContain(`Step ${index + 1}: `);
      expect(steps).toContain(step.prerequisites);
      expect(steps).toContain(step.time);
      expect(steps).toContain(step.validity);
    }
    expect(steps).toContain("2 days");
    expect(steps).toContain("100+ hours");
    expect(steps).toContain("500+ hours");
    expect(steps.match(/Validity and renewal/g)).toHaveLength(4);
    // Level anchors used by the chatbot and old links still exist.
    for (const anchor of ["calc", "palc", "malc"]) {
      expect(steps).toContain(`id="${anchor}"`);
    }
    expect(steps).toContain('href="#foundations"');
  });

  it("keeps the published validity in step with the renewal rules", () => {
    for (const step of certificationJourney) {
      if (!step.trackKey) continue;
      const rule = certificationRecertificationRules.find((item) => item.track === step.trackKey);
      expect(step.validity).toContain(`Valid for ${rule?.validity}`);
    }
  });

  it("explains what a coach gets", () => {
    const html = renderHub();

    expect(html).toContain('id="what-you-get"');
    expect(html).toContain("ICF Continuing Coach Education (CCE)");
    expect(html).toContain("coach directory");
    expect(html).toContain("https://directory.wial.org/coaches");
    expect(html).toContain("Global recognition");
    expect(html).toContain("After you are certified");
  });

  it("lists a flag tile per affiliate country, sorted by country", () => {
    const html = renderToStaticMarkup(
      <FindTrainingGrid
        affiliates={[
          { name: "WIAL Poland", country: "Poland", href: "https://wial.pl" },
          { name: "WIAL Brazil", country: "Brazil", href: "https://wial.com.br" },
        ]}
      />,
    );

    expect(html).toContain('id="find-training"');
    expect(html).toContain("Find training in your country");
    expect(html.indexOf("Brazil")).toBeLessThan(html.indexOf("Poland"));
    expect(html).toContain('href="https://wial.pl"');
    expect(html).toContain("/flags/pl.svg");
    expect(html).toContain('href="/become-a-coach"');
    expect(html).toContain('href="/become-an-affiliate"');
  });
});

describe("InHouseProgramsPage", () => {
  it("renders the full in-house programs copy on its own route", () => {
    const html = renderToStaticMarkup(<InHouseProgramsPage />);

    expect(html).toContain("In-house Action Learning coach certification programs");
    expect(html).toContain("six days of training");
    expect(html).toContain("staffing for large leadership development programs");
    expect(html).toContain("best leadership development experiences");
    expect(html).toContain("Dan Grady, Premier Field Engineering Director, Microsoft");
    expect(html).toContain("Ask about in-house training");
    expect(html).toContain('href="/contact"');
    expect(html).toContain('href="/certification#foundations"');
    expect(html).toContain('href="/certification"');
    expect(html).not.toContain("wial.org");
  });
});
