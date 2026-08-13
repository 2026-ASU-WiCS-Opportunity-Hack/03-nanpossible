import { describe, expect, it } from "vitest";
import { slugifyName } from "./slug";

describe("slugifyName", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyName("Bea Carson")).toBe("bea-carson");
  });

  it("strips diacritics, including đ", () => {
    expect(slugifyName("Đàm Thị Minh Hạnh")).toBe("dam-thi-minh-hanh");
    expect(slugifyName("Érica Sacramoni")).toBe("erica-sacramoni");
  });

  it("collapses punctuation and trims hyphens", () => {
    expect(slugifyName("  Dr. José O'Neill-Smith  ")).toBe("dr-jose-o-neill-smith");
  });

  it("returns empty string for non-latin-only names", () => {
    expect(slugifyName("张伟")).toBe("");
  });
});
