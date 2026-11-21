import Link from "next/link";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { certificationFindTraining } from "@/content/certification-hub";
import { affiliateSiteUrl } from "@/lib/affiliates";
import { countryFlagSrc } from "@/lib/countries";
import { listAffiliateDirectory } from "@/lib/tenant";

const linkClass =
  "font-semibold text-teal-deep underline decoration-gold/60 underline-offset-4";

export type TrainingAffiliate = { name: string; country: string; href: string };

/** One flag tile per affiliate country, sorted by country (pure, for tests). */
export function FindTrainingGrid({ affiliates }: { affiliates: TrainingAffiliate[] }) {
  const content = certificationFindTraining;
  const sorted = [...affiliates].sort((a, b) => a.country.localeCompare(b.country));

  return (
    <section aria-labelledby="find-training-title" className="scroll-mt-20" id={content.id}>
      <h2 className="text-2xl font-bold" id="find-training-title">
        {content.title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/70">
        {content.intro}
      </p>
      {sorted.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((affiliate) => {
            const flagSrc = countryFlagSrc(affiliate.country);
            return (
              <li key={affiliate.href}>
                <TrackedLink
                  className="feature-card flex h-full items-center gap-3 rounded-lg"
                  event={{
                    name: "select_content",
                    params: {
                      content_type: "affiliate_site",
                      content_id: affiliate.name,
                      outbound: true,
                    },
                  }}
                  href={affiliate.href}
                >
                  {flagSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="h-6 w-8 shrink-0 border border-line object-cover"
                      height={24}
                      loading="lazy"
                      src={flagSrc}
                      style={{ borderRadius: 3 }}
                      width={32}
                    />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-teal-deep">
                      {affiliate.country}
                    </span>
                    <span className="block truncate text-xs text-foreground/60">
                      {affiliate.name} <span aria-hidden="true">↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </span>
                  </span>
                </TrackedLink>
              </li>
            );
          })}
        </ul>
      ) : null}
      <p className="mt-4 text-sm text-foreground/70">
        {content.missingCountry}{" "}
        <Link className={linkClass} href={content.coachHref}>
          {content.coachLabel}
        </Link>
        {content.coachAfter} {content.affiliatePrompt}{" "}
        <Link className={linkClass} href={content.affiliateHref}>
          {content.affiliateLabel}
        </Link>
        .
      </p>
    </section>
  );
}

/** "Find training in your country" (#160): active affiliates as flag tiles. */
export async function CertificationFindTraining() {
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost:3000";
  const affiliates = (await listAffiliateDirectory())
    .filter((chapter) => chapter.country)
    .map((chapter) => ({
      name: chapter.name,
      country: chapter.country as string,
      href: affiliateSiteUrl(chapter, siteDomain),
    }));

  return <FindTrainingGrid affiliates={affiliates} />;
}
