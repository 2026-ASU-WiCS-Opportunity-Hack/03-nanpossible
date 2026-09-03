import { unstable_noStore as noStore } from "next/cache";
import { SiteFooterContent } from "@/components/site-footer-content";
import { getContentPage } from "@/lib/content";
import {
  defaultGlobalFooterContent,
  hasGlobalFooterContent,
  parseGlobalFooterState,
} from "@/lib/global-footer";
import type { SiteContext } from "@/lib/types";

type SiteFooterProps = {
  siteContext: SiteContext;
};

export async function SiteFooter({ siteContext }: SiteFooterProps) {
  noStore();

  const footerPage = await getContentPage({
    slug: "global-footer",
    chapterId: null,
    publishedOnly: true,
  });
  const footerState = parseGlobalFooterState(footerPage?.bodyJson);
  const content = footerState.published ?? defaultGlobalFooterContent;
  const resolvedEmail = siteContext.tenant?.contactEmail ?? content.email;

  if (!hasGlobalFooterContent(content, resolvedEmail)) {
    return null;
  }

  return (
    <footer className="pb-8">
      <div className="site-shell">
        <SiteFooterContent content={content} siteContext={siteContext} />
      </div>
    </footer>
  );
}
