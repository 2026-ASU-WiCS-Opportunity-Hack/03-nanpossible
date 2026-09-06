import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage, renderSection } from "@/components/content-page";
import { getContentPage } from "@/lib/content";
import { listPartners } from "@/lib/partners";
import { getGlobalSiteContext } from "@/lib/site-context";
import type { ContentSection } from "@/lib/types";

// Static metadata, like /resources: the title and summary do not depend on
// live data, so the route can stay revalidated rather than dynamic.
export const metadata: Metadata = {
  title: "Our Partners",
  description: "WIAL's global network of partners advancing Action Learning worldwide.",
};

export const revalidate = 300;

/**
 * /partners: the `partners` content page with a live logo wall of partner
 * organizations (managed at /admin/global/partners) slotted in right after
 * the "why partner" feature grid — the same compact `logo_grid` the client
 * logos use on /clients. Partners without a logo appear as a name tile.
 */
export default async function PartnersPage() {
  const [siteContext, page, partners] = await Promise.all([
    getGlobalSiteContext(),
    getContentPage({ slug: "partners" }),
    listPartners(),
  ]);

  if (!page) {
    notFound();
  }

  const body = page.bodyRichtext;
  const heroPage = { ...page, bodyRichtext: { ...body, sections: [] } };

  const logoWall: ContentSection = {
    type: "logo_grid",
    title: "Our partners",
    compact: true,
    items: partners.map((partner) => ({
      name: partner.name,
      logo: partner.logoUrl ?? undefined,
      href: partner.websiteUrl ?? partner.directoryUrl ?? undefined,
    })),
  };

  const firstGrid = body.sections.findIndex((section) => section.type === "feature_grid");
  const insertAt = firstGrid >= 0 ? firstGrid + 1 : 0;

  return (
    <ContentPage page={heroPage} siteContext={siteContext}>
      {body.sections.slice(0, insertAt).map((section) => renderSection(section))}
      {logoWall.items.length > 0 ? renderSection(logoWall) : null}
      {body.sections.slice(insertAt).map((section) => renderSection(section))}
    </ContentPage>
  );
}
