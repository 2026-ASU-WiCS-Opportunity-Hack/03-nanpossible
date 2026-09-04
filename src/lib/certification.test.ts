import { describe, expect, it } from "vitest";
import {
  getCertificationHubContent,
  getCertificationLmsUrl,
  getTrackDocuments,
} from "@/lib/certification";

describe("certification hub data", () => {
  it("exposes all four certification tracks", () => {
    const content = getCertificationHubContent();

    expect(content.tracks.map((track) => track.level)).toEqual([
      "CALC",
      "PALC",
      "SALC",
      "MALC",
    ]);
  });

  it("provides document placeholders (documents removed per issue requirements)", () => {
    // Documents have been removed per issue requirements.
    // The getTrackDocuments function returns null for all document fields.
    expect(getTrackDocuments("calc").application).toBeNull();
    expect(getTrackDocuments("palc").application).toBeNull();
    expect(getTrackDocuments("salc").application).toBeNull();
    expect(getTrackDocuments("malc").application).toBeNull();
  });

  it("exposes digital badging content with the Credly link", () => {
    const content = getCertificationHubContent();

    expect(content.badging.credlyUrl).toBe("https://www.credly.com");
    expect(content.badging.shows.length).toBeGreaterThan(0);
    expect(content.badging.claimNote).toContain("no fee");
  });

  it("falls back to the global LMS URL when a level-specific URL is not configured", () => {
    process.env.NEXT_PUBLIC_WIAL_LMS_URL = "https://wialportal.org/";
    delete process.env.NEXT_PUBLIC_WIAL_LMS_SALC_URL;

    expect(getCertificationLmsUrl("SALC")).toBe("https://wialportal.org/");
  });

  it("exposes migrated Foundations and CALC course content", () => {
    const content = getCertificationHubContent();

    expect(content.why.id).toBe("why");
    expect(content.why.levels.map((level) => level.level)).toEqual([
      "CALC",
      "PALC",
      "SALC",
      "MALC",
    ]);

    expect(content.foundations.id).toBe("foundations");
    expect(content.foundations.title).toBe("Foundations of Action Learning");
    expect(content.foundations.forWho).toEqual([
      "Potential coaches",
      "Organizational champions",
      "Sponsors",
    ]);
    expect(content.foundations.actionLearningHref).toBe("/action-learning");
    expect(content.foundations.contactHref).toBe("/contact");
    expect(content.foundations.inHouse.paragraphs.length).toBeGreaterThan(0);
    expect(content.foundations.inHouse.moreHref).toBe("#in-house");

    expect(content.calcCourses.id).toBe("calc-courses");
    expect(content.calcCourses.modules.map((module) => module.title)).toEqual([
      "CALC 1",
      "CALC 2",
    ]);
    expect(content.calcCourses.prerequisite.href).toBe("#foundations");
    expect(content.calcCourses.skills).toContain("Complex problem-solving");
    expect(content.calcCourses.skillsSource).toContain("World Economic Forum");

    expect(content.becomeACoach.id).toBe("become-a-coach");
    expect(content.becomeACoach.title).toContain("Who gets WIAL Action Learning certified");
    expect(content.becomeACoach.industries).toEqual([
      "Marketing",
      "Education",
      "Manufacturing",
      "Banking",
      "Retail",
      "Hospitality",
      "Technology",
    ]);
    expect(content.becomeACoach.servicesHref).toBe("/our-services");
    expect(content.becomeACoach.contactHref).toBe("/contact");

    expect(content.programs.id).toBe("programs");
    expect(content.programs.title).toBe("Programs");
    expect(content.programs.items.map((item) => item.title)).toEqual([
      "Foundations of Action Learning",
      "CALC courses",
      "In-house programs",
    ]);
    expect(content.programs.intro.join(" ")).not.toMatch(/coming soon/i);

    expect(content.inHouse.id).toBe("in-house");
    expect(content.inHouse.title).toBe("In-house programs");
    expect(content.inHouse.intro.join(" ")).toContain("six days");
    expect(content.inHouse.quote.attribution).toContain("Dan Grady");
    expect(content.inHouse.quote.quote).toContain("Microsoft");
    expect(content.inHouse.contactHref).toBe("/contact");
  });
});