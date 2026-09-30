import { describe, expect, it } from "vitest";
import { buildFallbackAssistantReply } from "@/lib/site-chatbot";

describe("site chatbot fallback", () => {
  it("returns CALC application guidance for application questions", () => {
    const reply = buildFallbackAssistantReply("Where is the CALC application form?");

    // Documents have been removed per issue requirements
    // The response should still guide users to the certification page
    expect(reply).toContain("CALC");
    expect(reply).toContain("/certification#calc");
    // Document links are no longer available
    expect(reply).not.toContain("/downloads/certification/calc-application.doc");
  });

  it("returns renewal guidance for PALC renewal questions", () => {
    const reply = buildFallbackAssistantReply("How do I renew PALC?");

    expect(reply).toContain("PALC");
    expect(reply).toContain("valid for");
    // Documents have been removed, so specific requirements like "10 hours" may not be present
    // Instead, check for general renewal guidance
    expect(reply).toContain("Renewal details are in the current certification packet");
  });

  it("returns Credly badge guidance for digital badge questions", () => {
    const reply = buildFallbackAssistantReply("How do I get my digital badge?");

    expect(reply).toContain("Credly");
    expect(reply).toContain("/contact");
    expect(reply).not.toContain("#badges");
    expect(reply).toContain("/coaches");
  });

  it("returns the LMS fallback link for LMS questions", () => {
    const reply = buildFallbackAssistantReply("Where is the LMS?");

    expect(reply).toContain("wialportal.org");
    expect(reply).toContain("LMS");
  });

  it("returns Foundations guidance without sending the visitor to the LMS", () => {
    const reply = buildFallbackAssistantReply(
      "Tell me about the Foundations of Action Learning program",
    );

    expect(reply).toContain("two-day");
    expect(reply).toContain("/certification#foundations");
    expect(reply).toContain("/action-learning");
    expect(reply).not.toContain("wialportal.org");
  });

  it("answers CALC 1 / CALC 2 questions with the single CALC certification course", () => {
    const reply = buildFallbackAssistantReply("What is the CALC 1 workshop?");

    expect(reply).toContain("single CALC certification course");
    expect(reply).toContain("no longer offered separately");
    expect(reply).toContain("Advanced coaching methods");
    expect(reply).toContain("Running a successful Action Learning program");
    expect(reply).toContain("/certification#calc-courses");
    expect(reply).toContain("Foundations of Action Learning");
  });

  it("returns in-house program guidance without sending the visitor to the LMS", () => {
    const reply = buildFallbackAssistantReply(
      "Can WIAL run an in-house certification program?",
    );

    expect(reply).toContain("six days");
    expect(reply).toContain("/certification/in-house-programs");
    expect(reply).toContain("/contact");
    expect(reply).not.toContain("wialportal.org");
  });

  it("returns become-a-coach guidance from the merged certification hub", () => {
    const reply = buildFallbackAssistantReply("How do I become a coach?");

    expect(reply).toContain("six continents");
    expect(reply).toContain("Marketing");
    expect(reply).toContain("/our-services");
    expect(reply).toContain("/certification#become-a-coach");
    expect(reply).toContain("/contact");
  });
});