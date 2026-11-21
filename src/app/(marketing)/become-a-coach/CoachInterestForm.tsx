"use client";

import Link from "next/link";
import { useState } from "react";
import { NewsletterSignupBlock } from "@/components/newsletter-signup";
import { formOutcomeEvent, trackEvent } from "@/lib/analytics";
import { countries } from "@/lib/countries";
import { submitCoachInterest, type CoachInterestResult } from "./actions";

const RESOURCE_LINKS = [
  { href: "/resources#library", label: "Browse the Action Learning library" },
  { href: "/resources#wial-talk", label: "Try a WIAL Talk scenario" },
  { href: "/certification", label: "Review the certification pathway" },
];

export function CoachInterestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CoachInterestResult | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setResult(null);
    setSubmittedEmail(String(formData.get("email") ?? "").trim());

    try {
      const response = await submitCoachInterest(formData);
      setResult(response);
      trackEvent(formOutcomeEvent("coach_interest", response));
    } catch {
      setResult({ error: "Something went wrong. Please try again." });
      trackEvent(formOutcomeEvent("coach_interest", null));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result?.success) {
    return (
      <div aria-live="polite" className="mt-6 space-y-6" role="status">
        <div className="account-flash is-success">
          Thank you. Your inquiry is on its way to the WIAL team.
        </div>
        <div>
          <h3 className="text-lg font-semibold text-teal-deep">What happens next</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-7 text-foreground/80">
            <li>
              {result.affiliate ? (
                <>
                  WIAL will connect you with{" "}
                  <a
                    className="font-semibold text-teal underline underline-offset-4"
                    href={result.affiliate.url}
                    rel="noopener"
                    target="_blank"
                  >
                    {result.affiliate.name}
                  </a>
                  , the affiliate in your country.
                </>
              ) : (
                <>
                  WIAL will connect you with the affiliate in your country
                  {result.country ? ` (${result.country})` : ""}, or with the nearest one
                  if there is none yet.
                </>
              )}
            </li>
            <li>They will share upcoming course dates, format, and fees.</li>
            <li>You choose a course and start your certification.</li>
          </ol>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-teal-deep">While you wait</h3>
          <ul className="mt-3 space-y-2 text-base">
            {RESOURCE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  className="font-semibold text-teal underline underline-offset-4"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {result.subscribed ? (
          <p className="text-sm text-foreground/70">
            You are also on the list for WIAL news about events and certification dates.
          </p>
        ) : (
          <NewsletterSignupBlock
            defaultEmail={submittedEmail}
            source="become_a_coach"
            title="Stay in the loop"
          />
        )}
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-shell">
          <span className="field-label">Name</span>
          <input autoComplete="name" className="field-input" name="name" required type="text" />
        </label>
        <label className="field-shell">
          <span className="field-label">Email</span>
          <input autoComplete="email" className="field-input" name="email" required type="email" />
        </label>
        <label className="field-shell">
          <span className="field-label">Phone</span>
          <input autoComplete="tel" className="field-input" name="phone" type="tel" />
        </label>
        <label className="field-shell">
          <span className="field-label">Country</span>
          <select
            autoComplete="country-name"
            className="field-input"
            defaultValue=""
            name="country"
            required
          >
            <option disabled value="">
              Select a country
            </option>
            {countries.map((country) => (
              <option key={country.code} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field-shell">
        <span className="field-label">Message</span>
        <textarea
          className="field-textarea"
          maxLength={4000}
          name="message"
          placeholder="Tell us about your background and what draws you to Action Learning coaching."
          required
          rows={5}
        />
      </label>
      {/* Hidden from people; bots that fill it are dropped server-side. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Website
          <input autoComplete="off" name="website" tabIndex={-1} type="text" />
        </label>
      </div>
      <label className="coach-checkbox text-sm">
        <input name="newsletter" type="checkbox" />
        <span>
          Send me WIAL news about Action Learning events, programs, and certification
          opportunities.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button className="button-link primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending..." : "Send my inquiry"}
        </button>
        <p className="text-sm text-foreground/60">
          We reply to every inquiry, usually within a few business days.
        </p>
      </div>

      {result?.error ? (
        <div className="account-flash is-error" role="alert">
          {result.error}
        </div>
      ) : null}
    </form>
  );
}
