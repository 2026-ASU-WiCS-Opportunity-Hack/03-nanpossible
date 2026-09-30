import { describe, expect, it } from "vitest";
import { isSearchIndexingAllowed } from "./seo";

describe("isSearchIndexingAllowed", () => {
  it("blocks indexing by default (unset, empty, or anything but an explicit yes)", () => {
    expect(isSearchIndexingAllowed({})).toBe(false);
    expect(isSearchIndexingAllowed({ NEXT_PUBLIC_ALLOW_SEARCH_INDEXING: "" })).toBe(false);
    expect(isSearchIndexingAllowed({ NEXT_PUBLIC_ALLOW_SEARCH_INDEXING: "false" })).toBe(false);
    expect(isSearchIndexingAllowed({ NEXT_PUBLIC_ALLOW_SEARCH_INDEXING: "0" })).toBe(false);
    expect(isSearchIndexingAllowed({ NEXT_PUBLIC_ALLOW_SEARCH_INDEXING: "production" })).toBe(false);
  });

  it("allows indexing only when the flag is explicitly on", () => {
    expect(isSearchIndexingAllowed({ NEXT_PUBLIC_ALLOW_SEARCH_INDEXING: "true" })).toBe(true);
    expect(isSearchIndexingAllowed({ NEXT_PUBLIC_ALLOW_SEARCH_INDEXING: " TRUE " })).toBe(true);
    expect(isSearchIndexingAllowed({ NEXT_PUBLIC_ALLOW_SEARCH_INDEXING: "1" })).toBe(true);
    expect(isSearchIndexingAllowed({ NEXT_PUBLIC_ALLOW_SEARCH_INDEXING: "yes" })).toBe(true);
  });
});
