import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage, renderSection } from "@/components/content-page";
import { listPublishedConferences } from "@/lib/conferences";
import {
  conferenceYear,
  formatConferenceDates,
  splitConferences,
  type ConferenceRecord,
} from "@/lib/conferences-fields";
import { getContentPage } from "@/lib/content";
import { getGlobalSiteContext } from "@/lib/site-context";
import type { ContentSection, MetricItem } from "@/lib/types";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContentPage({ slug: "conferences" });
  return {
    title: page?.title ?? "WIAL Global Conferences",
    description: page?.bodyRichtext.heroIntro || undefined,
    alternates: { canonical: "/conferences" },
  };
}

/** First sentence or so of the page intro, for the listing card. */
function summarize(intro: string, limit = 200) {
  const text = intro.trim();
  if (text.length <= limit) {
    return text;
  }
  const cut = text.slice(0, limit);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).replace(/[\s,;:—–-]+$/, "")}…`;
}

function conferenceCard(conference: ConferenceRecord, eyebrowFallback: string) {
  const facts = [formatConferenceDates(conference), conference.location].filter(Boolean).join(" · ");
  return {
    eyebrow: conferenceYear(conference) ?? eyebrowFallback,
    title: conference.title,
    body: [facts, summarize(conference.intro)].filter(Boolean).join(" — ") || "Details coming soon.",
    href: conference.path,
    label: "View conference",
  };
}

// The hand-written hero facts about "the next conference" are replaced by the
// real upcoming conference so the page cannot go stale when one is archived.
const NEXT_CONFERENCE_LABELS = new Set(["next conference", "host city"]);

function heroMetrics(stored: MetricItem[], next: ConferenceRecord | undefined): MetricItem[] {
  const kept = stored.filter((metric) => !NEXT_CONFERENCE_LABELS.has(metric.label.toLowerCase()));
  if (!next) {
    return kept;
  }
  const dates = formatConferenceDates(next);
  return [
    ...(dates ? [{ label: "Next conference", value: dates }] : []),
    ...(next.location ? [{ label: "Host city", value: next.location }] : []),
    ...kept,
  ];
}

/**
 * /conferences: the `conferences` content page (hero, "what happens at a
 * conference", the hand-written timeline of older conferences) with the
 * conferences managed at /admin/global/conferences slotted in — upcoming ones
 * first, the archive just before the older timeline.
 */
export default async function ConferencesPage() {
  const [siteContext, page, conferences] = await Promise.all([
    getGlobalSiteContext(),
    getContentPage({ slug: "conferences" }),
    listPublishedConferences(),
  ]);

  if (!page) {
    notFound();
  }

  const body = page.bodyRichtext;
  const { upcoming, archive } = splitConferences(conferences);

  const upcomingSection: ContentSection | null = upcoming.length
    ? {
        type: "feature_grid",
        title: upcoming.length === 1 ? "Upcoming conference" : "Upcoming conferences",
        items: upcoming.map((conference) => conferenceCard(conference, "Upcoming")),
      }
    : null;
  const archiveSection: ContentSection | null = archive.length
    ? {
        type: "feature_grid",
        title: "Conference archive",
        items: archive.map((conference) => conferenceCard(conference, "Past")),
      }
    : null;

  const timelineIndex = body.sections.findIndex((section) => section.type === "timeline");
  const archiveAt = timelineIndex >= 0 ? timelineIndex : body.sections.length;
  const heroPage = {
    ...page,
    bodyRichtext: { ...body, metrics: heroMetrics(body.metrics, upcoming[0]), sections: [] },
  };

  return (
    <ContentPage page={heroPage} siteContext={siteContext}>
      {upcomingSection ? renderSection(upcomingSection) : null}
      {body.sections.slice(0, archiveAt).map((section) => renderSection(section))}
      {archiveSection ? renderSection(archiveSection) : null}
      {body.sections.slice(archiveAt).map((section) => renderSection(section))}
    </ContentPage>
  );
}
