import { describe, expect, it } from "vitest";
import { canonicalLanguageName, crossLingualExpansions } from "@/lib/languages";

describe("canonicalLanguageName", () => {
  it("maps endonyms to canonical English names", () => {
    expect(canonicalLanguageName("中文")).toBe("Chinese");
    expect(canonicalLanguageName("日本語")).toBe("Japanese");
    expect(canonicalLanguageName("한국어")).toBe("Korean");
    expect(canonicalLanguageName("español")).toBe("Spanish");
    expect(canonicalLanguageName("português")).toBe("Portuguese");
    expect(canonicalLanguageName("العربية")).toBe("Arabic");
  });

  it("maps ISO codes and case variants", () => {
    expect(canonicalLanguageName("zh")).toBe("Chinese");
    expect(canonicalLanguageName("PT")).toBe("Portuguese");
    expect(canonicalLanguageName("ESPAÑOL")).toBe("Spanish");
    expect(canonicalLanguageName("english")).toBe("English");
  });

  it("returns null for unknown or empty input", () => {
    expect(canonicalLanguageName("Klingon")).toBeNull();
    expect(canonicalLanguageName("")).toBeNull();
    expect(canonicalLanguageName(null)).toBeNull();
    expect(canonicalLanguageName(undefined)).toBeNull();
  });
});

describe("crossLingualExpansions", () => {
  it("expands language endonyms to English names", () => {
    expect(crossLingualExpansions("español")).toContain("Spanish");
    expect(crossLingualExpansions("中文")).toContain("Chinese");
  });

  it("finds endonyms embedded in unspaced-script tokens", () => {
    expect(crossLingualExpansions("中文教练")).toContain("Chinese");
    expect(crossLingualExpansions("日本のコーチ")).toContain("Japan");
  });

  it("expands place endonyms", () => {
    expect(crossLingualExpansions("台湾")).toContain("Taiwan");
    expect(crossLingualExpansions("deutschland")).toContain("Germany");
  });

  it("never expands short ASCII tokens that double as common words", () => {
    expect(crossLingualExpansions("it")).toEqual([]);
    expect(crossLingualExpansions("no")).toEqual([]);
    expect(crossLingualExpansions("de")).toEqual([]);
  });
});
