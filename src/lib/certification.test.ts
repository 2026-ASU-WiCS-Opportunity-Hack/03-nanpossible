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

  it("falls back to the global LMS URL when a level-specific URL is not configured", () => {
    process.env.NEXT_PUBLIC_WIAL_LMS_URL = "https://wialportal.org/";
    delete process.env.NEXT_PUBLIC_WIAL_LMS_SALC_URL;

    expect(getCertificationLmsUrl("SALC")).toBe("https://wialportal.org/");
  });
});