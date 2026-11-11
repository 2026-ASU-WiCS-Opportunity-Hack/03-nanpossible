import { describe, expect, it } from "vitest";
import { CONTACT_ABOUT_OPTIONS, resolveContactAbout } from "./contact-about";

describe("resolveContactAbout", () => {
  it("matches topics case-insensitively and trims", () => {
    expect(resolveContactAbout("Programs")).toBe("Programs");
    expect(resolveContactAbout("programs")).toBe("Programs");
    expect(resolveContactAbout("  Programs ")).toBe("Programs");
    expect(resolveContactAbout("solution spheres")).toBe("Solution Spheres");
  });

  it("uses the first value of a repeated param", () => {
    expect(resolveContactAbout(["Events", "Other"])).toBe("Events");
  });

  it("ignores unknown, empty, and missing values", () => {
    expect(resolveContactAbout("bogus")).toBe("");
    expect(resolveContactAbout("<script>")).toBe("");
    expect(resolveContactAbout("")).toBe("");
    expect(resolveContactAbout(undefined)).toBe("");
    expect(resolveContactAbout([])).toBe("");
  });

  it("every option resolves to itself", () => {
    for (const option of CONTACT_ABOUT_OPTIONS) {
      expect(resolveContactAbout(option)).toBe(option);
    }
  });
});
