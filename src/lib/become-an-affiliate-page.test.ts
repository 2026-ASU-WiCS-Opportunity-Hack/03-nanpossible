import { describe, expect, it } from "vitest";
import pages from "@/content/pages.json";
import { defaultGlobalFooterContent } from "@/lib/global-footer";
import type { ContentPageRecord } from "@/lib/types";

const page = (pages as ContentPageRecord[]).find(
  (item) => item.slug === "become-an-affiliate" && item.chapterId === null,
);
const sections = page?.bodyRichtext.sections ?? [];

function section(title: string) {
  return sections.find((item) => "title" in item && item.title === title);
}

describe("become-an-affiliate fixture (#159)", () => {
  it("opens with an apply button that jumps to the form", () => {
    expect(page?.bodyRichtext.heroCtas?.[0]).toEqual({
      label: "Apply to become an affiliate",
      href: "#apply",
      variant: "primary",
    });
  });

  it("lists the five benefits as plain cards", () => {
    const why = section("Why become an affiliate");
    expect(why?.type).toBe("feature_grid");
    if (why?.type !== "feature_grid") return;
    expect(why.flat).toBe(true);
    expect(why.items).toHaveLength(5);
    // Nothing links anywhere, so nothing may look clickable.
    expect(why.items.every((item) => !item.href)).toBe(true);
  });

  it("says who can apply", () => {
    const who = section("Who can apply");
    expect(who?.type).toBe("prose");
    if (who?.type !== "prose") return;
    expect(who.bullets?.length).toBeGreaterThanOrEqual(4);
  });

  it("walks through inquiry, call, agreement and launch in order", () => {
    const how = section("How it works");
    expect(how?.type).toBe("timeline");
    if (how?.type !== "timeline") return;
    expect(how.items.map((item) => item.year)).toEqual(["Step 1", "Step 2", "Step 3", "Step 4"]);
    expect(how.items.map((item) => item.title)).toEqual([
      "Send an inquiry",
      "Talk with WIAL",
      "Sign the agreement",
      "Launch",
    ]);
    // The steps are the last thing before the form.
    expect(sections.at(-1)).toBe(how);
  });

  it("is linked from the default footer", () => {
    expect(defaultGlobalFooterContent.links).toContainEqual({
      id: "affiliate",
      label: "Become an affiliate",
      href: "/become-an-affiliate",
    });
  });
});
