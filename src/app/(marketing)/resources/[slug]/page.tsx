import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ContentPage } from "@/components/content-page";
import { getContentPage } from "@/lib/content";
import { getGlobalSiteContext } from "@/lib/site-context";
import type { ContentPageRecord } from "@/lib/types";

type ResourceArticlePageProps = {
  params: Promise<{ slug: string }>;
};

// Blog posts migrated from wial.org live in content_pages / pages.json under
// `resources/<slug>`; this route renders them with the shared ContentPage.
const loadArticle = cache(async (slug: string) =>
  getContentPage({ slug: `resources/${slug}` }),
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
}: ResourceArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadArticle(slug);

  if (!page) {
    return {};
  }

  const description = page.seo?.description || page.bodyRichtext.heroIntro;
  const image = firstImage(page);
  const path = `/resources/${slug}`;

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

export default async function ResourceArticlePage({ params }: ResourceArticlePageProps) {
  const { slug } = await params;
  const [siteContext, page] = await Promise.all([getGlobalSiteContext(), loadArticle(slug)]);

  if (!page) {
    notFound();
  }

  return <ContentPage page={page} siteContext={siteContext} />;
}
