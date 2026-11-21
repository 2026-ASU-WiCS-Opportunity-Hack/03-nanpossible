"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { subscribeToNewsletterAction, type NewsletterSignupResult } from "@/app/newsletter-actions";
import { formOutcomeEvent, trackEvent } from "@/lib/analytics";
import { NEWSLETTER_PITCH, type NewsletterSource } from "@/lib/newsletter-fields";

type NewsletterSignupProps = {
  source: NewsletterSource;
  /** Pre-fills the field, e.g. with the address just used in another form. */
  defaultEmail?: string;
};

/**
 * Inline newsletter capture (#164): one email field and a Subscribe button
 * that stays on the page. Callers supply the surrounding heading and copy.
 */
export function NewsletterSignup({ source, defaultEmail }: NewsletterSignupProps) {
  const fieldId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<NewsletterSignupResult | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await subscribeToNewsletterAction(formData);
      setResult(response);
      trackEvent(formOutcomeEvent("newsletter", response, { form_variant: source }));
    } catch {
      setResult({ error: "Something went wrong. Please try again." });
      trackEvent(formOutcomeEvent("newsletter", null));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result?.success) {
    return (
      <p aria-live="polite" className="account-flash is-success" role="status">
        Thank you. You are on the list for WIAL news.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="newsletter-signup">
      <input name="source" type="hidden" value={source} />
      <div className="newsletter-signup-row">
        <label className="sr-only" htmlFor={fieldId}>
          Email address
        </label>
        <input
          aria-describedby={`${fieldId}-consent`}
          autoComplete="email"
          className="field-input"
          defaultValue={defaultEmail}
          id={fieldId}
          maxLength={50}
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <button className="button-link primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Subscribing..." : "Subscribe"}
        </button>
      </div>
      {/* Hidden from people; bots that fill it are dropped server-side. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Company
          <input autoComplete="off" name="company" tabIndex={-1} type="text" />
        </label>
      </div>
      <p className="newsletter-signup-consent" id={`${fieldId}-consent`}>
        By subscribing you agree to receive email from WIAL. Unsubscribe at any time. See our{" "}
        <Link className="underline underline-offset-2" href="/privacy">
          privacy policy
        </Link>
        .
      </p>
      {result?.error ? (
        <p className="account-flash is-error" role="alert">
          {result.error}
        </p>
      ) : null}
    </form>
  );
}

/** Heading + pitch + form, for places that have no surrounding copy of their own. */
export function NewsletterSignupBlock({
  source,
  title,
  defaultEmail,
}: NewsletterSignupProps & { title: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">{title}</p>
      <p className="text-sm leading-6 text-foreground/78">{NEWSLETTER_PITCH}</p>
      <NewsletterSignup defaultEmail={defaultEmail} source={source} />
    </div>
  );
}
