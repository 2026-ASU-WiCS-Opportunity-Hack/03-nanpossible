import { describe, expect, it } from "vitest";
import {
  defaultGlobalFooterContent,
  hasGlobalFooterContent,
  parseGlobalFooterState,
  publishGlobalFooterDraft,
  saveGlobalFooterDraft,
  visibleFooterLinks,
} from "@/lib/global-footer";

describe("global footer draft and publish behavior", () => {
  it("saves a draft without changing the published footer", () => {
    const published = {
      ...defaultGlobalFooterContent,
      heading: "Currently live heading",
    };
    const state = {
      draft: published,
      published,
    };

    const nextState = saveGlobalFooterDraft(state, {
      ...state.draft,
      heading: "Draft-only heading",
    });

    expect(nextState.draft.heading).toBe("Draft-only heading");
    expect(nextState.published?.heading).toBe("Currently live heading");
  });

  it("publishes the edited draft as the live footer", () => {
    const state = parseGlobalFooterState({
      draft: defaultGlobalFooterContent,
      published: null,
    });
    const nextState = publishGlobalFooterDraft(state, {
      ...state.draft,
      heading: "New live heading",
      contactHeading: "Contact the team",
    });

    expect(nextState.draft.heading).toBe("New live heading");
    expect(nextState.published?.heading).toBe("New live heading");
    expect(nextState.published?.contactHeading).toBe("Contact the team");
  });

  it("keeps the original footer live before the first publish", () => {
    const state = parseGlobalFooterState({
      draft: {
        ...defaultGlobalFooterContent,
        heading: "Unpublished draft",
      },
      published: null,
    });

    expect(state.published).toBeNull();
  });
});

describe("hasGlobalFooterContent", () => {
  it("is true for the default footer content", () => {
    expect(hasGlobalFooterContent(defaultGlobalFooterContent)).toBe(true);
  });

  it("is false when every field and link is blank", () => {
    const empty = {
      ...defaultGlobalFooterContent,
      eyebrow: "",
      heading: "",
      description: "",
      contactHeading: "",
      address: "",
      email: "",
      linksHeading: "",
      links: [{ id: "home", label: "  ", href: "/" }],
      leftLegal: "",
      rightLegal: "",
    };

    expect(hasGlobalFooterContent(empty)).toBe(false);
  });

  it("is true when only a resolved (tenant) email is present", () => {
    const empty = {
      ...defaultGlobalFooterContent,
      eyebrow: "",
      heading: "",
      description: "",
      contactHeading: "",
      address: "",
      email: "",
      linksHeading: "",
      links: [],
      leftLegal: "",
      rightLegal: "",
    };

    expect(hasGlobalFooterContent(empty, "chapter@example.org")).toBe(true);
  });
});

describe("visibleFooterLinks", () => {
  it("drops links whose trimmed label is empty", () => {
    const links = [
      { id: "home", label: "Home", href: "/" },
      { id: "blank", label: "   ", href: "/blank" },
      { id: "contact", label: "Contact", href: "/contact" },
    ];

    expect(visibleFooterLinks(links).map((link) => link.id)).toEqual([
      "home",
      "contact",
    ]);
  });
});
