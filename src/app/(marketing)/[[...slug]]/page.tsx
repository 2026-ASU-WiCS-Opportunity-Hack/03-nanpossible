import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ContentPage } from "@/components/content-page";
import { getContentPage } from "@/lib/content";
import { getLayoutSiteContext } from "@/lib/site-context";
import { normalizeSegments } from "@/lib/routing";

type MarketingPageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({
  params,
}: MarketingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = normalizeSegments(slug);
  if (!route?.slug) return {};

  const headerStore = await headers();
  const siteContext = await getLayoutSiteContext(headerStore);
  const page = await getContentPage({
    slug: route.slug,
    chapterId: siteContext.tenant?.id ?? null,
  });

  if (!page) return {};

  return {
    title: siteContext.tenant
      ? `${page.title} — ${siteContext.tenant.name}`
      : page.title,
  };
}

export default async function MarketingPage({ params }: MarketingPageProps) {
  const { slug } = await params;
  const route = normalizeSegments(slug);

  if (!route) {
    notFound();
  }

  if (route.redirectTo) {
    redirect(route.redirectTo);
  }

  if (!route.slug) {
    notFound();
  }

  const headerStore = await headers();
  const siteContext = await getLayoutSiteContext(headerStore);
  const page = await getContentPage({
    slug: route.slug,
    chapterId: siteContext.tenant?.id ?? null,
  });

  if (!page) {
    notFound();
  }

  return <ContentPage page={page} siteContext={siteContext} />;
}