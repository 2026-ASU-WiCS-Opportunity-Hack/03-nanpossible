import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ContentPage } from "@/components/content-page";
import { getPublishedConferenceBySlug } from "@/lib/conferences";
import { conferenceFacts, conferencePageSlug, formatConferenceDates } from "@/lib/conferences-fields";
import { getContentPage } from "@/lib/content";
import { getGlobalSiteContext } from "@/lib/site-context";

type ConferencePageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

// A conference page is the global content page `conferences/<slug>` (edited
// at /admin/global/conferences) plus its row in `conferences`, which supplies
// the dates, location and archive status shown beside the headline.
const loadConference = cache(async (slug: string) => {
  const [page, conference] = await Promise.all([
    getContentPage({ slug: conferencePageSlug(slug) }),
    getPublishedConferenceBySlug(slug),
  ]);
  return page && conference ? { page, conference } : null;
});

export async function generateMetadata({ params }: ConferencePageProps): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadConference(slug);

  if (!loaded) {
    return {};
  }

  const { page, conference } = loaded;
  const facts = [formatConferenceDates(conference), conference.location].filter(Boolean).join(", ");
  const description =
    page.seo?.description || page.bodyRichtext.heroIntro || `${page.title}${facts ? ` — ${facts}` : ""}`;

  return {
    title: page.title,
    description,
    alternates: { canonical: conference.path },
    openGraph: {
      type: "article",
      title: page.title,
      description,
      url: conference.path,
      siteName: "World Institute for Action Learning",
    },
  };
}

export default async function ConferencePage({ params }: ConferencePageProps) {
  const { slug } = await params;
  const [siteContext, loaded] = await Promise.all([getGlobalSiteContext(), loadConference(slug)]);

  if (!loaded) {
    notFound();
  }

  const { page, conference } = loaded;
  const body = page.bodyRichtext;

  return (
    <ContentPage
      page={{
        ...page,
        bodyRichtext: {
          ...body,
          // Dates and location come from the conference details, so they can
          // never drift from what the listing shows; the page's own quick
          // facts (theme, venue, …) follow them.
          metrics: [...conferenceFacts(conference), ...body.metrics],
          heroCtas: body.heroCtas?.length
            ? body.heroCtas
            : [{ label: "All conferences", href: "/conferences", variant: "secondary" }],
        },
      }}
      siteContext={siteContext}
    />
  );
}
