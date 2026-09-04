import { cache } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ContentPage, renderSection } from "@/components/content-page";
import { GlobalNetworkSection } from "@/components/global-network-section";
import { getContentPage } from "@/lib/content";
import { getGlobalSiteContext, getLayoutSiteContext } from "@/lib/site-context";
import { normalizeSegments } from "@/lib/routing";

type MarketingPageProps = {
  params: Promise<{ slug?: string[] }>;
};

const GLOBAL_ONLY_SLUGS = new Set(["certification", "clients"]);

async function resolveSiteContextForSlug(slug: string) {
  if (GLOBAL_ONLY_SLUGS.has(slug)) {
    return getGlobalSiteContext();
  }
  const headerStore = await headers();
  return getLayoutSiteContext(headerStore);
}

// Deduped across generateMetadata and the page render for a given request —
// cache() keys on the primitive slug argument, so both call sites share the
// one site-context + content-page fetch instead of doubling DB round-trips.
const loadMarketingPage = cache(async (slug: string) => {
  const siteContext = await resolveSiteContextForSlug(slug);
  const page = await getContentPage({
    slug,
    chapterId: siteContext.tenant?.id ?? null,
  });
  return { siteContext, page };
});

export async function generateMetadata({
  params,
}: MarketingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = normalizeSegments(slug);
  if (!route?.slug) return {};

  const { siteContext, page } = await loadMarketingPage(route.slug);

  if (!page) return {};

  const title = siteContext.tenant
    ? `${page.title} — ${siteContext.tenant.name}`
    : page.title;
  const description = page.seo?.description || page.bodyRichtext.heroIntro || undefined;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
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

  const { siteContext, page } = await loadMarketingPage(route.slug);

  if (!page) {
    notFound();
  }

  // The global landing page leads with the world map of WIAL coaches and
  // affiliates, ahead of the page's JSON sections. (A sibling page.tsx is not
  // allowed next to an optional catch-all, so home is special-cased here.)
  if (route.slug === "home" && siteContext.isGlobal) {
    const body = page.bodyRichtext;
    const heroPage = { ...page, bodyRichtext: { ...body, sections: [] } };
    return (
      <ContentPage page={heroPage} siteContext={siteContext}>
        <GlobalNetworkSection />
        {body.sections.map((section) => renderSection(section))}
      </ContentPage>
    );
  }

  return <ContentPage page={page} siteContext={siteContext} />;
}
