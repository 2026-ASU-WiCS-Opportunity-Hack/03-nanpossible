import { TrackedLink } from "@/components/analytics/tracked-link";
import type { ContentSection } from "@/lib/types";

export type PricingTiersSection = Extract<ContentSection, { type: "pricing_tiers" }>;

/**
 * Partner fee ladders: one card per organization type, rungs ordered by
 * headcount (the order is the information — fees climb with size).
 */
export function PartnerPricing({ section }: { section: PricingTiersSection }) {
  return (
    <section className="section-stack pricing">
      <div className="space-y-4">
        <h2 className="section-title text-teal-deep">{section.title}</h2>
        {section.intro ? (
          <p className="max-w-3xl text-base leading-7 text-foreground/75">{section.intro}</p>
        ) : null}
      </div>

      <div className="pricing-plans">
        {section.plans.map((plan) => (
          <article className={`pricing-plan tone-${plan.tone ?? "primary"}`} key={plan.name}>
            <header className="pricing-plan-head">
              <h3 className="pricing-plan-name">{plan.name}</h3>
              {plan.description ? <p className="pricing-plan-desc">{plan.description}</p> : null}
            </header>
            <ol aria-label={`${plan.name} fees by headcount`} className="pricing-ladder">
              {plan.bands.map((band) => (
                <li className="pricing-rung" key={band.label}>
                  <span aria-hidden="true" className="pricing-rung-marker" />
                  <span className="pricing-rung-band">{band.label}</span>
                  <span className="pricing-rung-price">
                    <strong>{band.price}</strong>
                    <small>per year</small>
                  </span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>

      {section.footnote || section.cta ? (
        <footer className="pricing-foot">
          {section.footnote ? <p className="pricing-footnote">{section.footnote}</p> : null}
          {section.cta ? (
            <TrackedLink
              className="button-link primary"
              event={{
                name: "cta_click",
                params: {
                  cta_label: section.cta.label,
                  cta_location: "partner_pricing",
                  cta_destination: section.cta.href,
                },
              }}
              href={section.cta.href}
            >
              {section.cta.label}
            </TrackedLink>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}
