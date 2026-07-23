import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountPageShell } from "@/components/account-page-shell";
import { ChapterPageEditor } from "@/components/admin/ChapterPageEditor";
import { PageList } from "@/components/admin/PageList";
import { requireAccountViewer } from "@/lib/auth";
import { listChapterPagesForAdmin } from "@/lib/content";
import { resolveWorkspaceChapter } from "@/lib/chapter-workspace";

type ChapterAdminPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function ChapterAdminPage({
  searchParams,
}: ChapterAdminPageProps) {
  const viewer = await requireAccountViewer("/admin/chapter", [
    "platform_admin",
    "chapter_admin",
    "content_creator",
  ]);
  const chapter = await resolveWorkspaceChapter(viewer);

  if (!chapter) {
    notFound();
  }

  const params = await searchParams;
  const pages = await listChapterPagesForAdmin(chapter.id);
  const requestedPage = pages.find((page) => page.id === params.page) ?? null;
  const selectedPage = requestedPage ?? pages[0] ?? null;
  const isBuilderPage = Boolean(
    selectedPage &&
      selectedPage.editorKind === "builder" &&
      selectedPage.builderState &&
      chapter.builderChromeState,
  );

  // Only take over the screen with the builder when a page was explicitly
  // requested — landing here without a selection keeps the admin nav visible.
  if (requestedPage && isBuilderPage && chapter.builderChromeState) {
    return (
      <ChapterPageEditor
        chapterId={chapter.id}
        chapterName={chapter.name}
        chapterSubdomain={chapter.subdomain}
        defaultLanguage={chapter.language}
        initialBuilderChromeState={chapter.builderChromeState}
        page={requestedPage}
        pages={pages}
      />
    );
  }

  return (
    <AccountPageShell
      badge="Chapter content"
      description="Edit the live chapter pages, save drafts, and generate localized copy with the chapter-in-a-box flow."
      eyebrow="Chapter workspace"
      title={chapter.name}
    >
      <div className="space-y-5">
        <PageList currentPageId={selectedPage?.id ?? null} pages={pages} />
        {selectedPage && isBuilderPage ? (
          <section className="site-panel rounded-[2rem] p-8">
            <p className="eyebrow">Page editor</p>
            <h2 className="mt-3 font-display text-3xl tracking-[-0.04em] text-teal-deep">
              {selectedPage.title}
            </h2>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-foreground/72">
              This page uses the full-screen builder. Open it when you are
              ready to edit — you can come back here with the exit button in
              the builder header.
            </p>
            <Link
              className="button-link primary mt-6 inline-flex"
              href={`/admin/chapter?page=${selectedPage.id}`}
            >
              Open page builder
            </Link>
          </section>
        ) : selectedPage ? (
          <ChapterPageEditor
            chapterId={chapter.id}
            chapterName={chapter.name}
            chapterSubdomain={chapter.subdomain}
            defaultLanguage={chapter.language}
            initialBuilderChromeState={chapter.builderChromeState ?? null}
            pages={pages}
            page={selectedPage}
          />
        ) : (
          <section className="site-panel rounded-[2rem] p-8">
            <p className="text-lg leading-8 text-foreground/72">
              No content pages are seeded for this chapter yet.
            </p>
          </section>
        )}
      </div>
    </AccountPageShell>
  );
}
