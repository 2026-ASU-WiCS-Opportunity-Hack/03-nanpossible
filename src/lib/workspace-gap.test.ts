import { describe, expect, it } from "vitest";
import { describeWorkspaceGap } from "@/lib/workspace-gap";

const chapters = [
  { id: "usa", name: "WIAL USA", status: "active" as const },
  { id: "draft", name: "WIAL Draftland", status: "draft" as const },
  { id: "off", name: "WIAL Switched Off", status: "inactive" as const },
];

describe("describeWorkspaceGap", () => {
  it("flags an affiliate head with no affiliate", () => {
    expect(
      describeWorkspaceGap({ role: "chapter_admin", chapterId: null, assignedChapters: [] }, chapters),
    ).toEqual({ kind: "unassigned", role: "chapter_admin" });
  });

  it("names an affiliate that is not active yet", () => {
    expect(
      describeWorkspaceGap(
        { role: "chapter_admin", chapterId: "draft", assignedChapters: [] },
        chapters,
      ),
    ).toEqual({
      kind: "unavailable",
      chapterId: "draft",
      chapterName: "WIAL Draftland",
      status: "draft",
    });
  });

  it("reports an affiliate id that no longer exists", () => {
    expect(
      describeWorkspaceGap(
        { role: "chapter_admin", chapterId: "gone", assignedChapters: [] },
        chapters,
      ),
    ).toEqual({ kind: "unavailable", chapterId: "gone", chapterName: null, status: "missing" });
  });

  it("returns null for an affiliate head with an active affiliate", () => {
    expect(
      describeWorkspaceGap({ role: "chapter_admin", chapterId: "usa", assignedChapters: [] }, chapters),
    ).toBeNull();
  });

  it("flags a content creator with no assigned affiliates", () => {
    expect(
      describeWorkspaceGap({ role: "content_creator", chapterId: null, assignedChapters: [] }, chapters),
    ).toEqual({ kind: "unassigned", role: "content_creator" });
  });

  it("flags a content creator whose affiliates are all inactive", () => {
    expect(
      describeWorkspaceGap(
        { role: "content_creator", chapterId: null, assignedChapters: ["off", "draft"] },
        chapters,
      ),
    ).toEqual({
      kind: "unavailable",
      chapterId: "off",
      chapterName: "WIAL Switched Off",
      status: "inactive",
    });
  });

  it("returns null for a content creator with at least one active affiliate", () => {
    expect(
      describeWorkspaceGap(
        { role: "content_creator", chapterId: null, assignedChapters: ["off", "usa"] },
        chapters,
      ),
    ).toBeNull();
  });

  it("ignores roles that never need an affiliate", () => {
    for (const role of ["platform_admin", "coach", "public_visitor"] as const) {
      expect(describeWorkspaceGap({ role, chapterId: null, assignedChapters: [] }, chapters)).toBeNull();
    }
  });
});
