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

export type AffiliateSiteLink = {
  href: string;
  /**
   * True when following the link leaves this platform for the affiliate's own
   * website (or a social page standing in for one). False for microsites we
   * host on a subdomain of `siteDomain`, which are part of the same site from
   * the visitor's point of view.
   */
  external: boolean;
  /** Hostname without a leading `www.`, for "opens wial-usa.org" hints. */
  host: string;
};

/**
 * `affiliateSiteUrl` plus the facts the UI needs to present the link honestly:
 * whether it leaves the platform and where it goes.
 */
export function affiliateSiteLink(
  affiliate: Pick<ChapterRecord, "subdomain" | "websiteUrl">,
  siteDomain: string,
): AffiliateSiteLink {
  const href = affiliateSiteUrl(affiliate, siteDomain);
  const host = linkHost(href);
  const platformHost = siteDomain.split(":")[0].toLowerCase();
  const hostedHere = host === platformHost || host.endsWith(`.${platformHost}`);

  return { href, external: !hostedHere, host };
}

function linkHost(href: string) {
  try {
    return new URL(href).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return href;
  }
}
