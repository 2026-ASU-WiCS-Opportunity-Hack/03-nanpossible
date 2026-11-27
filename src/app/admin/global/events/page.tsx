import { AccountPageShell } from "@/components/account-page-shell";
import { EventWorkbench } from "@/components/admin/EventWorkbench";
import { requireAccountViewer } from "@/lib/auth";
import { listAllEventsForAdmin } from "@/lib/events";
import { buildCalendarHosts } from "@/lib/events-calendar";
import { listChapters } from "@/lib/tenant";

type GlobalEventsPageProps = {
  searchParams: Promise<{
    edit?: string;
  }>;
};

/**
 * Platform admins see every event on the platform here — the ones affiliates
 * publish from their own workspaces and WIAL-wide ones — and create events
 * that belong to no affiliate. Everything published shows on /events.
 */
export default async function GlobalEventsPage({ searchParams }: GlobalEventsPageProps) {
  await requireAccountViewer("/admin/global/events", ["platform_admin"]);

  const [params, events, chapters] = await Promise.all([
    searchParams,
    listAllEventsForAdmin(),
    listChapters(),
  ]);
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost:3000";

  return (
    <AccountPageShell
      badge="Events admin"
      description="See every event across WIAL and its affiliates, and add WIAL-wide events that are not tied to one affiliate. Published events appear on the public events calendar."
      eyebrow="Global admin"
      title="Events"
    >
      <EventWorkbench
        calendarHosts={buildCalendarHosts(chapters, siteDomain)}
        chapterId={null}
        initialEvents={events}
        initialSelectedEventId={params.edit ?? null}
      />
    </AccountPageShell>
  );
}
