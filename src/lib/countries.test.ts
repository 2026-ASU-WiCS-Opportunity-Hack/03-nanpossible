import { describe, expect, it } from "vitest";
import { countries, countryCodeFor, countryFlagSrc, countryNameFor } from "./countries";

describe("countryCodeFor", () => {
  it("resolves canonical names regardless of case and spacing", () => {
    expect(countryCodeFor("Singapore")).toBe("sg");
    expect(countryCodeFor("  netherlands ")).toBe("nl");
    expect(countryCodeFor("UNITED STATES")).toBe("us");
  });

  it("resolves common aliases", () => {
    expect(countryCodeFor("USA")).toBe("us");
    expect(countryCodeFor("Viet Nam")).toBe("vn");
    expect(countryCodeFor("Russian Federation")).toBe("ru");
    expect(countryCodeFor("UK")).toBe("gb");
  });

  it("accepts bare ISO codes", () => {
    expect(countryCodeFor("tw")).toBe("tw");
    expect(countryCodeFor("PL")).toBe("pl");
  });

  it("returns null for unknown or empty labels", () => {
    expect(countryCodeFor("Atlantis")).toBeNull();
    expect(countryCodeFor("")).toBeNull();
    expect(countryCodeFor(null)).toBeNull();
    expect(countryCodeFor(undefined)).toBeNull();
  });
});

describe("countryFlagSrc", () => {
  it("maps labels to vendored flag paths", () => {
    expect(countryFlagSrc("Malaysia")).toBe("/flags/my.svg");
    expect(countryFlagSrc("USA")).toBe("/flags/us.svg");
    expect(countryFlagSrc("nowhere")).toBeNull();
  });
});

describe("countryNameFor", () => {
  it("returns the canonical name for aliases and codes", () => {
    expect(countryNameFor("USA")).toBe("United States");
    expect(countryNameFor("vn")).toBe("Vietnam");
  });
});

describe("countries", () => {
  it("contains the full ISO list with unique codes", () => {
    expect(countries.length).toBeGreaterThan(200);
    expect(new Set(countries.map((country) => country.code)).size).toBe(countries.length);
  });
});
