import type { ChapterRecord } from "@/lib/types";

/**
 * Public URL for an affiliate: its own website when one is configured,
 * otherwise the microsite hosted on this platform.
 */
export function affiliateSiteUrl(
  affiliate: Pick<ChapterRecord, "subdomain" | "websiteUrl">,
  siteDomain: string,
) {
  if (affiliate.websiteUrl) {
    return affiliate.websiteUrl;
  }

  const protocol = siteDomain.includes("localhost") ? "http" : "https";
  return `${protocol}://${affiliate.subdomain}.${siteDomain}`;
}
