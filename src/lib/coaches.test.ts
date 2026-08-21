import { describe, expect, it } from "vitest";
import { extractSearchTerms } from "@/lib/coaches";

describe("extractSearchTerms", () => {
  it("tokenizes, folds accents, and drops stop words", () => {
    expect(extractSearchTerms("coach near São Paulo")).toEqual(
      expect.arrayContaining(["sao", "paulo"]),
    );
    expect(extractSearchTerms("coach near São Paulo")).not.toContain("coach");
  });

  it("adds English equivalents for language endonyms", () => {
    expect(extractSearchTerms("coach español")).toEqual(
      expect.arrayContaining(["espanol", "spanish"]),
    );
  });

  it("adds English equivalents inside unspaced CJK tokens", () => {
    expect(extractSearchTerms("中文教练")).toEqual(
      expect.arrayContaining(["中文教练", "chinese"]),
    );
  });

  it("splits multi-word place expansions into single tsquery-safe tokens", () => {
    const terms = extractSearchTerms("미국");
    expect(terms).toEqual(expect.arrayContaining(["united", "states"]));
    expect(terms.every((term) => !term.includes(" "))).toBe(true);
  });
});
