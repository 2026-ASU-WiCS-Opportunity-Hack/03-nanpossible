import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage, renderSection } from "@/components/content-page";
import { getContentPage } from "@/lib/content";
import {
  getWialTalkScenarios,
  libraryActionLabel,
  libraryFileUrl,
  libraryKindLabels,
  listLibraryItems,
} from "@/lib/library";
import { getGlobalSiteContext } from "@/lib/site-context";
import { LibraryCatalog, type LibraryCard } from "./LibraryCatalog";
import { ScenarioArchive } from "./ScenarioArchive";

export const metadata: Metadata = {
  title: "Action Learning Resources",
  description:
    "Books, articles, case studies, videos, podcasts, posters, and WIAL Talk coaching scenarios from the World Institute for Action Learning.",
};

export const revalidate = 300;

export default async function ResourcesPage() {
  const [siteContext, page, items] = await Promise.all([
    getGlobalSiteContext(),
    getContentPage({ slug: "resources" }),
    listLibraryItems(),
  ]);
  const scenarios = getWialTalkScenarios();

  if (!page) {
    notFound();
  }

  const cards = items.flatMap<LibraryCard>((item) => {
    const href = libraryFileUrl(item.filePath) ?? item.externalUrl;
    if (!href) {
      return [];
    }
    return [
      {
        slug: item.slug,
        kind: item.kind,
        kindLabel: libraryKindLabels[item.kind],
        title: item.title,
        summary: item.summary,
        year: item.publishedOn.slice(0, 4),
        href,
        actionLabel: libraryActionLabel(item),
        thumbnailUrl: libraryFileUrl(item.thumbnailPath),
      },
    ];
  });

  const body = page.bodyRichtext;
  const heroPage = {
    ...page,
    bodyRichtext: {
      ...body,
      metrics: [
        { label: "Library resources", value: String(cards.length) },
        { label: "Coaching scenarios", value: String(scenarios.length) },
        ...body.metrics.slice(2),
      ],
      sections: [],
    },
  };

  return (
    <ContentPage page={heroPage} siteContext={siteContext}>
      <LibraryCatalog items={cards} />
      <ScenarioArchive scenarios={scenarios} />
      {body.sections.map((section) => renderSection(section))}
    </ContentPage>
  );
}
