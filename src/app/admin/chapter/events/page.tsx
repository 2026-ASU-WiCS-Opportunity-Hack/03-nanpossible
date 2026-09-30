import { AccountPageShell } from "@/components/account-page-shell";
import { EventWorkbench } from "@/components/admin/EventWorkbench";
import { requireAccountViewer } from "@/lib/auth";
import { listEventsForAdmin } from "@/lib/events";
import { resolveWorkspaceChapter } from "@/lib/chapter-workspace";

type ChapterEventsPageProps = {
  searchParams: Promise<{
    edit?: string;
  }>;
};

export default async function ChapterEventsPage({
  searchParams,
}: ChapterEventsPageProps) {
  const viewer = await requireAccountViewer("/admin/chapter/events", [
    "platform_admin",
    "chapter_admin",
    "content_creator",
  ]);
  const chapter = await resolveWorkspaceChapter(viewer);

  if (!chapter) {
    return null;
  }

  const [params, events] = await Promise.all([searchParams, listEventsForAdmin(chapter.id)]);

  return (
    <AccountPageShell
      badge="Events admin"
      description="Create events and publish them to your affiliate homepage."
      eyebrow="Affiliate workspace"
      title="Events"
    >
      <EventWorkbench
        chapterId={chapter.id}
        chapterSubdomain={chapter.subdomain}
        initialEvents={events}
        initialSelectedEventId={params.edit ?? null}
      />
    </AccountPageShell>
  );
}
