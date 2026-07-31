import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { BuilderPageRenderer } from "@/components/chapter/BuilderPageRenderer";
import { ChapterHtmlPage } from "@/components/chapter/ChapterHtmlPage";
import { getContentPage } from "@/lib/content";
import { normalizeChapterSlug } from "@/lib/routing";
import { getChapterBySubdomain } from "@/lib/tenant";

export const revalidate = 3600;

type TenantChapterPageProps = {
  params: Promise<{
    tenant: string;
    slug: string;
  }>;
};

// Deduped across generateMetadata and the page render for a given request —
// cache() keys on the primitive tenant/slug arguments, so both call sites
// share the one chapter + content-page fetch instead of doubling DB round-trips.
const loadTenantPage = cache(async (tenant: string, slug: string) => {
  const chapter = await getChapterBySubdomain(tenant);
  const route = normalizeChapterSlug(slug);

  if (!chapter || !route.slug) {
    return { chapter, route, page: null };
  }

  const page = await getContentPage({
    slug: route.slug,
    chapterId: chapter.id,
    tenantSubdomain: chapter.subdomain,
  });

  return { chapter, route, page };
});

export async function generateMetadata({
  params,
}: TenantChapterPageProps): Promise<Metadata> {
  const { tenant, slug } = await params;
  const { chapter, page } = await loadTenantPage(tenant, slug);

  if (!chapter || !page) return {};

  return { title: `${page.title} — ${chapter.name}` };
}

export default async function TenantChapterPage({
  params,
}: TenantChapterPageProps) {
  const { tenant, slug } = await params;
  const { chapter, route, page } = await loadTenantPage(tenant, slug);

  if (!chapter) {
    notFound();
  }

  if (route.redirectTo) {
    redirect(route.redirectTo);
  }

  if (!route.slug) {
    notFound();
  }

  if (!page?.published) {
    notFound();
  }

  if (page.liveRenderSource === "builder" && page.builderPublished) {
    return (
      <BuilderPageRenderer
        chapter={chapter}
        chrome={chapter.builderChromePublished ?? null}
        doc={page.builderPublished}
        suppressChrome
      />
    );
  }

  if (!page.bodyHtml) {
    notFound();
  }

  return <ChapterHtmlPage chapterName={chapter.name} html={page.bodyHtml} title={page.title} />;
}
