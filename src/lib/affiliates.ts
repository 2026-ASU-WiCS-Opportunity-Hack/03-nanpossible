import { countryCodeFor, countryFlagSrc, countryNameFor } from "@/lib/countries";
import type { ChapterRecord, ContentPageRecord, ContentSection, FeatureItem } from "@/lib/types";

const DIRECTORY_SECTION_TITLE = "WIAL affiliates worldwide";

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

function affiliateCard(affiliate: ChapterRecord, siteDomain: string): FeatureItem {
  const countryName = countryNameFor(affiliate.country) ?? affiliate.country;
  const flag = countryFlagSrc(affiliate.country);

  return {
    eyebrow: countryName ?? affiliate.region ?? "Worldwide",
    title: affiliate.name,
    body:
      affiliate.description?.trim() ||
      `Action Learning programs, events, and certification support in the ${affiliate.name} community.`,
    href: affiliateSiteUrl(affiliate, siteDomain),
    label: affiliate.websiteUrl ? "Visit website" : "Visit affiliate site",
    ...(flag ? { image: flag, imageAlt: `Flag of ${countryName}` } : {}),
  };
}

export function buildAffiliateDirectorySection(
  affiliates: ChapterRecord[],
  siteDomain: string,
  title = DIRECTORY_SECTION_TITLE,
): ContentSection {
  return {
    type: "contact_cards",
    title,
    items: affiliates.map((affiliate) => affiliateCard(affiliate, siteDomain)),
  };
}

/**
 * Swap the static affiliate list on the affiliates content page for cards
 * generated from live chapter records, and refresh the count metrics. When no
 * affiliates are available the page is returned untouched so the stored
 * content keeps working as a fallback.
 */
export function withAffiliateDirectory(
  page: ContentPageRecord,
  affiliates: ChapterRecord[],
  siteDomain: string,
): ContentPageRecord {
  if (!affiliates.length) {
    return page;
  }

  const staticDirectory = page.bodyRichtext.sections.find(
    (section) => section.type === "contact_cards",
  );
  const directory = buildAffiliateDirectorySection(
    affiliates,
    siteDomain,
    staticDirectory?.title,
  );
  let replaced = false;
  const sections: ContentSection[] = [];

  for (const section of page.bodyRichtext.sections) {
    if (section.type === "contact_cards") {
      if (!replaced) {
        sections.push(directory);
        replaced = true;
      }
      continue;
    }

    sections.push(section);
  }

  if (!replaced) {
    sections.push(directory);
  }

  const countryCount = new Set(
    affiliates
      .map((affiliate) => countryCodeFor(affiliate.country) ?? affiliate.country?.toLowerCase())
      .filter(Boolean),
  ).size;

  return {
    ...page,
    bodyRichtext: {
      ...page.bodyRichtext,
      metrics: page.bodyRichtext.metrics.map((metric) => {
        const label = metric.label.toLowerCase();

        if (label.includes("affiliate")) {
          return { ...metric, value: String(affiliates.length) };
        }

        if (label.includes("countries")) {
          return { ...metric, value: String(countryCount) };
        }

        return metric;
      }),
      sections,
    },
  };
}
