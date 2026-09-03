import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ContentPage } from "@/components/content-page";
import { getContentPage } from "@/lib/content";
import { getGlobalSiteContext } from "@/lib/site-context";
import type { ContentPageRecord } from "@/lib/types";

type BetterWorldStoryPageProps = {
  params: Promise<{ slug: string }>;
};

// Better World stories migrated from wial.org's /projects/<slug> pages live
// in content_pages / pages.json under `better-world/<slug>`; this route
// renders them with the shared ContentPage, mirroring the /resources/[slug]
// blog article route.
const loadStory = cache(async (slug: string) =>
  getContentPage({ slug: `better-world/${slug}` }),
);

function firstImage(page: ContentPageRecord): string | null {
  for (const section of page.bodyRichtext.sections) {
    if (section.type === "media_prose" && section.image) {
      return section.image;
    }
  }
  return null;
}

export async function generateMetadata({
  params,
}: BetterWorldStoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadStory(slug);

  if (!page) {
    return {};
  }

  const description = page.seo?.description || page.bodyRichtext.heroIntro;
  const image = firstImage(page);
  const path = `/better-world/${slug}`;

  return {
    title: page.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: page.title,
      description,
      url: path,
      siteName: "World Institute for Action Learning",
      images: image ? [{ url: image, alt: page.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: page.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BetterWorldStoryPage({ params }: BetterWorldStoryPageProps) {
  const { slug } = await params;
  const [siteContext, page] = await Promise.all([getGlobalSiteContext(), loadStory(slug)]);

  if (!page) {
    notFound();
  }

  return <ContentPage page={page} siteContext={siteContext} />;
}
