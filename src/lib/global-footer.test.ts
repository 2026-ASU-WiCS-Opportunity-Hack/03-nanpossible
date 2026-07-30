import { describe, expect, it } from "vitest";
import {
  defaultGlobalFooterContent,
  parseGlobalFooterState,
  publishGlobalFooterDraft,
  saveGlobalFooterDraft,
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
