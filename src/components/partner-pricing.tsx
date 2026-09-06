"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { ContentSection } from "@/lib/types";

export type PricingTiersSection = Extract<ContentSection, { type: "pricing_tiers" }>;
type PricingPlan = PricingTiersSection["plans"][number];
type PricingBand = PricingPlan["bands"][number];

const QUICK_PICKS = [10, 50, 100, 500, 1000];

function bandFor(plan: PricingPlan, headcount: number): PricingBand | null {
  return (
    plan.bands.find(
      (band) => headcount >= band.min && (band.max === null || headcount <= band.max),
    ) ?? null
  );
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function parseHeadcount(raw: string): number | null {
  const parsed = Number.parseInt(raw.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
}

/**
 * Partner fee ladders: one card per organization type, rungs ordered by
 * headcount (the order is the information — fees climb with size). The
 * headcount finder highlights the matching rung in every ladder and reads the
 * fee out loud; without a value every rung shows at full strength.
 */
export function PartnerPricing({ section }: { section: PricingTiersSection }) {
  const [raw, setRaw] = useState("");
  const inputId = useId();
  const headcount = parseHeadcount(raw);

  const matches = section.plans.map((plan) => ({
    plan,
    band: headcount === null ? null : bandFor(plan, headcount),
  }));

  const summary =
    headcount === null
      ? "Enter your headcount to highlight your fee in each ladder."
      : `With ${formatCount(headcount)} ${headcount === 1 ? "person" : "people"}, your annual fee is ${matches
          .filter((match) => match.band)
          .map((match) => `${match.band!.price} as a ${match.plan.name.toLowerCase()}`)
          .join(" or ")}.`;

  return (
    <section className="section-stack pricing">
      <div className="space-y-4">
        <h2 className="section-title text-teal-deep">{section.title}</h2>
        {section.intro ? (
          <p className="max-w-3xl text-base leading-7 text-foreground/75">{section.intro}</p>
        ) : null}
      </div>

      <div className="pricing-finder">
        <label className="pricing-finder-label" htmlFor={inputId}>
          How many people work at your organization?
        </label>
        <div className="pricing-finder-row">
          <input
            className="field-input pricing-finder-input"
            id={inputId}
            inputMode="numeric"
            min={1}
            onChange={(event) => setRaw(event.target.value)}
            placeholder="e.g. 120"
            type="number"
            value={raw}
          />
          <div aria-label="Common organization sizes" className="pricing-quick" role="group">
            {QUICK_PICKS.map((count) => (
              <button
                aria-pressed={headcount === count}
                className={`pricing-chip${headcount === count ? " is-active" : ""}`}
                key={count}
                onClick={() => setRaw(String(count))}
                type="button"
              >
                {formatCount(count)}
              </button>
            ))}
          </div>
        </div>
        <p aria-live="polite" className="pricing-finder-result">
          {summary}
        </p>
      </div>

      <div className="pricing-plans">
        {matches.map(({ plan, band: match }) => (
          <article className={`pricing-plan tone-${plan.tone ?? "primary"}`} key={plan.name}>
            <header className="pricing-plan-head">
              <h3 className="pricing-plan-name">{plan.name}</h3>
              {plan.description ? <p className="pricing-plan-desc">{plan.description}</p> : null}
            </header>
            <ol aria-label={`${plan.name} fees by headcount`} className="pricing-ladder">
              {plan.bands.map((band) => {
                const isMatch = match === band;
                const isDim = headcount !== null && !isMatch;
                return (
                  <li
                    aria-current={isMatch ? "true" : undefined}
                    className={`pricing-rung${isMatch ? " is-match" : ""}${isDim ? " is-dim" : ""}`}
                    key={band.label}
                  >
                    <span aria-hidden="true" className="pricing-rung-marker" />
                    <span className="pricing-rung-band">{band.label}</span>
                    <span className="pricing-rung-price">
                      <strong>{band.price}</strong>
                      <small>per year</small>
                    </span>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>

      {section.footnote || section.cta ? (
        <footer className="pricing-foot">
          {section.footnote ? <p className="pricing-footnote">{section.footnote}</p> : null}
          {section.cta ? (
            <Link className="button-link primary" href={section.cta.href}>
              {section.cta.label}
            </Link>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}
