import type { ChapterRecord, UserProfile } from "@/lib/types";

/**
 * Why an account has no usable affiliate workspace.
 *
 * - `unassigned`: the role needs an affiliate but none is attached.
 * - `unavailable`: an affiliate is attached but it is not active (or the id no
 *   longer matches a row), so the anon-client lookups cannot see it.
 * - `choose`: a platform admin opened /admin/chapter off an affiliate site.
 */
export type WorkspaceGap =
  | { kind: "unassigned"; role: "chapter_admin" | "content_creator" }
  | {
      kind: "unavailable";
      chapterId: string;
      chapterName: string | null;
      status: ChapterRecord["status"] | "missing";
    }
  | { kind: "choose" };

export type WorkspaceGapSubject = Pick<UserProfile, "role" | "chapterId" | "assignedChapters">;
export type WorkspaceGapChapter = Pick<ChapterRecord, "id" | "name" | "status">;

/**
 * Pure classification shared by the affiliate workspace layout (server) and
 * the platform-admin user list (client): returns null when the account has an
 * active affiliate to work in, or when its role never needs one.
 */
export function describeWorkspaceGap(
  subject: WorkspaceGapSubject,
  chapters: ReadonlyArray<WorkspaceGapChapter>,
): WorkspaceGap | null {
  if (subject.role === "chapter_admin") {
    if (!subject.chapterId) {
      return { kind: "unassigned", role: "chapter_admin" };
    }

    return describeUnavailable(subject.chapterId, chapters);
  }

  if (subject.role === "content_creator") {
    if (!subject.assignedChapters.length) {
      return { kind: "unassigned", role: "content_creator" };
    }

    const hasActiveChapter = subject.assignedChapters.some(
      (chapterId) => chapters.find((chapter) => chapter.id === chapterId)?.status === "active",
    );

    return hasActiveChapter ? null : describeUnavailable(subject.assignedChapters[0], chapters);
  }

  return null;
}

function describeUnavailable(
  chapterId: string,
  chapters: ReadonlyArray<WorkspaceGapChapter>,
): WorkspaceGap | null {
  const chapter = chapters.find((candidate) => candidate.id === chapterId);

  if (!chapter) {
    return { kind: "unavailable", chapterId, chapterName: null, status: "missing" };
  }

  if (chapter.status !== "active") {
    return { kind: "unavailable", chapterId, chapterName: chapter.name, status: chapter.status };
  }

  return null;
}
