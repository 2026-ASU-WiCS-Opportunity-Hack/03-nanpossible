import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content-page";
import { withAffiliateDirectory } from "@/lib/affiliates";
import { getContentPage } from "@/lib/content";
import { getGlobalSiteContext } from "@/lib/site-context";
import { listAffiliateDirectory } from "@/lib/tenant";

// Always render fresh so admin changes to the directory show up immediately.
export const dynamic = "force-dynamic";

// The affiliate directory renders from live chapter records (managed in the
// global admin), so this page owns /affiliates instead of the content
// catch-all. The stored content page still supplies the hero and prose copy.
const loadAffiliatesPage = cache(async () => {
  const [siteContext, page, affiliates] = await Promise.all([
    getGlobalSiteContext(),
    getContentPage({ slug: "affiliates", chapterId: null }),
    listAffiliateDirectory(),
  ]);
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost:3000";

  return {
    siteContext,
    page: page ? withAffiliateDirectory(page, affiliates, siteDomain) : null,
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await loadAffiliatesPage();
  return page ? { title: page.title } : {};
}

export default async function AffiliatesPage() {
  const { siteContext, page } = await loadAffiliatesPage();

  if (!page) {
    notFound();
  }

  return <ContentPage page={page} siteContext={siteContext} />;
}
