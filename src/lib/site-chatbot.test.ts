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
    expect(reply).toContain("/certification#badges");
    expect(reply).toContain("/coaches");
  });

  it("returns the LMS fallback link for LMS questions", () => {
    const reply = buildFallbackAssistantReply("Where is the LMS?");

    expect(reply).toContain("wialportal.org");
    expect(reply).toContain("LMS");
  });
});