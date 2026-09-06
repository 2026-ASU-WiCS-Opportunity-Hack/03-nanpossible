import { NetworkMap } from "@/components/network-map";
import { affiliateSiteUrl } from "@/lib/affiliates";
import { listCoachMapPoints } from "@/lib/coaches";
import { countryFlagSrc } from "@/lib/countries";
import { COACH_DIRECTORY_URL } from "@/lib/routing";
import { listAffiliateDirectory } from "@/lib/tenant";
import { buildCoachMapMarkers } from "@/lib/world-map";
import type { AffiliateMapEntry } from "@/lib/types";

function AffiliateStrip({ affiliates }: { affiliates: AffiliateMapEntry[] }) {
  return (
    <div className="coach-affiliate-strip">
      <span className="coach-affiliate-strip-label">
        WIAL affiliates — visit their local sites:
      </span>
      {affiliates.map((affiliate) => {
        const flagSrc = countryFlagSrc(affiliate.country);
        return (
          <a
            className="coach-affiliate-chip"
            href={affiliate.href}
            key={affiliate.href}
            rel="noreferrer"
            target="_blank"
          >
            {flagSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" height={12} src={flagSrc} width={17} />
            ) : null}
            {affiliate.name}
            <span aria-hidden="true">↗</span>
          </a>
        );
      })}
    </div>
  );
}

/**
 * Landing-page "Global network" panel: the world map of countries with WIAL
 * coaches and affiliates, the affiliate link strip, and a link out to the
 * public coach directory. Renders nothing when neither dataset is available.
 */
export async function GlobalNetworkSection() {
  const [points, affiliates] = await Promise.all([
    listCoachMapPoints(),
    listAffiliateDirectory(),
  ]);

  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost:3000";
  const affiliateEntries: AffiliateMapEntry[] = affiliates
    .filter((chapter) => chapter.country)
    .map((chapter) => ({
      name: chapter.name,
      country: chapter.country as string,
      href: affiliateSiteUrl(chapter, siteDomain),
    }));

  const markers = buildCoachMapMarkers(points, affiliateEntries);

  if (markers.length === 0 && affiliateEntries.length === 0) {
    return null;
  }

  return (
    <section className="site-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <span className="eyebrow">Global network</span>
          <h2 className="font-display text-[clamp(1.4rem,2vw,1.9rem)] leading-[1.05] tracking-[-0.04em] text-teal-deep">
            {markers.length > 0
              ? `Coaches and affiliates on the ground in ${markers.length} ${
                  markers.length === 1 ? "country" : "countries"
                }`
              : "WIAL affiliates around the world"}
          </h2>
          <p className="text-base leading-7 text-foreground/72">
            WIAL-certified Action Learning coaches work through local affiliates
            worldwide. Browse the coach directory to find one near you.
          </p>
        </div>
        <a
          className="button-link secondary"
          href={COACH_DIRECTORY_URL}
          rel="noreferrer"
          target="_blank"
        >
          Find a coach ↗
        </a>
      </div>
      {markers.length > 0 ? <NetworkMap markers={markers} /> : null}
      {affiliateEntries.length > 0 ? <AffiliateStrip affiliates={affiliateEntries} /> : null}
    </section>
  );
}
