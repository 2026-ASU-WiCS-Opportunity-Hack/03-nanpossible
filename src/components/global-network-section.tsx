import { TrackedLink } from "@/components/analytics/tracked-link";
import { NetworkMap } from "@/components/network-map";
import { affiliateSiteLink, type AffiliateSiteLink } from "@/lib/affiliates";
import { listCoachMapPoints } from "@/lib/coaches";
import { countryFlagSrc } from "@/lib/countries";
import { COACH_DIRECTORY_URL } from "@/lib/routing";
import { listAffiliateDirectory } from "@/lib/tenant";
import { buildCoachMapMarkers } from "@/lib/world-map";
import type { AffiliateMapEntry } from "@/lib/types";

type AffiliateStripEntry = AffiliateMapEntry & Pick<AffiliateSiteLink, "external" | "host">;

/**
 * The "↗ + new tab" affordance is reserved for links that leave WIAL for an
 * affiliate's own website, so its meaning stays intact. Microsites we host
 * are part of this site and read as ordinary links that open in place.
 */
function AffiliateChip({ affiliate }: { affiliate: AffiliateStripEntry }) {
  const flagSrc = countryFlagSrc(affiliate.country);
  const flag = flagSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" height={12} src={flagSrc} width={17} />
  ) : null;

  if (affiliate.external) {
    return (
      <TrackedLink
        className="coach-affiliate-chip"
        event={{
          name: "select_content",
          params: {
            content_type: "affiliate_site",
            content_id: affiliate.name,
            outbound: true,
          },
        }}
        href={affiliate.href}
        title={`Opens ${affiliate.host} in a new tab`}
      >
        {flag}
        {affiliate.name}
        <span aria-hidden="true" className="coach-affiliate-chip-external">
          ↗
        </span>
        <span className="sr-only">(own website, opens {affiliate.host} in a new tab)</span>
      </TrackedLink>
    );
  }

  return (
    <TrackedLink
      className="coach-affiliate-chip"
      event={{
        name: "select_content",
        params: {
          content_type: "affiliate_site",
          content_id: affiliate.name,
          outbound: false,
        },
      }}
      href={affiliate.href}
      // Hosted on our own subdomain: navigate in place like any internal link.
      target="_self"
    >
      {flag}
      {affiliate.name}
    </TrackedLink>
  );
}

function affiliateStripNote(affiliates: AffiliateStripEntry[]) {
  const externalCount = affiliates.filter((affiliate) => affiliate.external).length;
  if (externalCount === 0) {
    return null;
  }
  if (externalCount === affiliates.length) {
    return "Each link opens the affiliate's own website in a new tab.";
  }
  return "↗ marks affiliates with their own website, which opens in a new tab. The others stay on WIAL.";
}

function AffiliateStrip({ affiliates }: { affiliates: AffiliateStripEntry[] }) {
  const note = affiliateStripNote(affiliates);
  return (
    <div className="coach-affiliate-strip">
      <div className="coach-affiliate-strip-row">
        <span className="coach-affiliate-strip-label">
          WIAL affiliates — visit their local sites:
        </span>
        {affiliates.map((affiliate) => (
          <AffiliateChip affiliate={affiliate} key={affiliate.href} />
        ))}
      </div>
      {note ? <p className="coach-affiliate-strip-note">{note}</p> : null}
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
  const affiliateEntries: AffiliateStripEntry[] = affiliates
    .filter((chapter) => chapter.country)
    .map((chapter) => ({
      name: chapter.name,
      country: chapter.country as string,
      ...affiliateSiteLink(chapter, siteDomain),
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
        <TrackedLink
          className="button-link secondary"
          event={{
            name: "cta_click",
            params: {
              cta_label: "Find a coach",
              cta_location: "network_map",
              cta_destination: COACH_DIRECTORY_URL,
              outbound: true,
            },
          }}
          href={COACH_DIRECTORY_URL}
        >
          Find a coach ↗
        </TrackedLink>
      </div>
      {markers.length > 0 ? <NetworkMap markers={markers} /> : null}
      {affiliateEntries.length > 0 ? <AffiliateStrip affiliates={affiliateEntries} /> : null}
    </section>
  );
}
