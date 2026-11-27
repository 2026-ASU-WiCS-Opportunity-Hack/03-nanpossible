import type { Metadata } from "next";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { EventsCalendar } from "@/components/events-calendar";
import { listPublicCalendarEvents } from "@/lib/events";
import { buildCalendarEvents, buildCalendarHosts } from "@/lib/events-calendar";
import { listAffiliateDirectory } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming Action Learning events from WIAL and its affiliates around the world — workshops, certification courses, conferences, and community gatherings.",
  alternates: { canonical: "/events" },
};

// Saving or deleting an event revalidates this path; the timer only moves
// finished events off the calendar.
export const revalidate = 300;

/**
 * /events (#184): one calendar of every published upcoming event — WIAL-wide
 * events created at /admin/global/events plus the events each affiliate
 * publishes from its own workspace — with a link to the organising affiliate.
 */
export default async function EventsPage() {
  const [events, affiliates] = await Promise.all([
    listPublicCalendarEvents(),
    listAffiliateDirectory(),
  ]);
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost:3000";
  const calendarEvents = buildCalendarEvents(events, buildCalendarHosts(affiliates, siteDomain));

  return (
    <div className="page-frame">
      <div className="site-shell">
        <div className="hero-grid hero-grid--single">
          <section className="site-panel hero-panel-warm rounded-[2rem] p-7 md:p-10">
            <div className="space-y-5">
              <span className="eyebrow">Global WIAL</span>
              <div className="space-y-4">
                <h1 className="max-w-4xl font-display text-3xl leading-none tracking-[-0.05em] text-teal-deep md:text-5xl">
                  Events around the world
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-foreground/82">
                  See what is happening across the WIAL network: events run by WIAL
                  and by our affiliates in every region, in one calendar. Each
                  affiliate event links to the affiliate that is hosting it.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <TrackedLink
                  className="button-link secondary"
                  event={{
                    name: "cta_click",
                    params: {
                      cta_label: "WIAL conferences",
                      cta_location: "hero",
                      cta_destination: "/conferences",
                    },
                  }}
                  href="/conferences"
                >
                  WIAL conferences
                </TrackedLink>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6">
          <EventsCalendar events={calendarEvents} />
        </div>
      </div>
    </div>
  );
}
