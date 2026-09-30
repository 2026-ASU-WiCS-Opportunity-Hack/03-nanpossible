import { cache } from "react";
import { headers } from "next/headers";
import { canEditChapter } from "@/lib/auth";
import { getChapterFromHeaders } from "@/lib/chapter-context";
import { getChapterById, listChapters } from "@/lib/tenant";
import type { ChapterRecord, UserProfile } from "@/lib/types";
import { describeWorkspaceGap, type WorkspaceGap } from "@/lib/workspace-gap";

export type WorkspaceAccess =
  | { chapter: ChapterRecord; gap: null }
  | { chapter: null; gap: WorkspaceGap };

async function findWorkspaceChapter(viewer: UserProfile): Promise<ChapterRecord | null> {
  const headerChapter = await getChapterFromHeaders();

  if (headerChapter) {
    const fullChapter = await getChapterById(headerChapter.id);

    if (fullChapter && canEditChapter(viewer, fullChapter.id)) {
      return fullChapter;
    }
  }

  if (viewer.role === "chapter_admin" && viewer.chapterId) {
    return getChapterById(viewer.chapterId);
  }

  if (viewer.role === "content_creator" && viewer.assignedChapters.length) {
    const requestedChapter = (await headers()).get("x-chapter-id");
    const candidates =
      requestedChapter && viewer.assignedChapters.includes(requestedChapter)
        ? [requestedChapter, ...viewer.assignedChapters.filter((id) => id !== requestedChapter)]
        : viewer.assignedChapters;

    for (const chapterId of candidates) {
      const chapter = await getChapterById(chapterId);

      if (chapter) {
        return chapter;
      }
    }
  }

  return null;
}

/**
 * The affiliate workspace the viewer can work in, or why there is none.
 * Cached per request so the layout and the page share one lookup.
 */
export const resolveWorkspaceAccess = cache(
  async (viewer: UserProfile): Promise<WorkspaceAccess> => {
    const chapter = await findWorkspaceChapter(viewer);

    if (chapter) {
      return { chapter, gap: null };
    }

    if (viewer.role === "platform_admin") {
      return { chapter: null, gap: { kind: "choose" } };
    }

    // Service-role read: sees draft/inactive affiliates the anon client cannot.
    const chapters = await listChapters();
    const gap = describeWorkspaceGap(viewer, chapters) ?? {
      kind: "unavailable",
      chapterId: viewer.chapterId ?? viewer.assignedChapters[0] ?? "",
      chapterName: null,
      status: "missing",
    };

    return { chapter: null, gap };
  },
);

export async function resolveWorkspaceChapter(
  viewer: UserProfile,
): Promise<ChapterRecord | null> {
  return (await resolveWorkspaceAccess(viewer)).chapter;
}
