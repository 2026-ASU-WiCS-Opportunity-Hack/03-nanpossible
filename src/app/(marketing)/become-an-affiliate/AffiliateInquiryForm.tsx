"use client";

import Link from "next/link";
import { useState } from "react";
import { formOutcomeEvent, trackEvent } from "@/lib/analytics";
import { submitAffiliateInquiry, type AffiliateInquiryResult } from "./actions";

export function AffiliateInquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AffiliateInquiryResult | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await submitAffiliateInquiry(formData);
      setResult(response);
      trackEvent(formOutcomeEvent("affiliate_inquiry", response));

    } catch {
      setResult({ error: "Something went wrong. Please try again." });
      trackEvent(formOutcomeEvent("affiliate_inquiry", null));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result?.success) {
    return (
      <div aria-live="polite" className="mt-6 space-y-6" role="status">
        <div className="account-flash is-success">
          Thank you. Your inquiry was sent to the WIAL team.
        </div>
        <div>
          <h3 className="text-lg font-semibold text-teal-deep">What happens next</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-7 text-foreground/80">
            <li>We reply by email, usually within a few business days.</li>
            <li>We set up a call to talk about your region and your goals.</li>
            <li>If it is a good fit, WIAL shares the affiliate agreement and you plan your launch.</li>
          </ol>
        </div>
        <p className="text-base text-foreground/80">
          While you wait, explore the{" "}
          <Link
            className="font-semibold text-teal underline underline-offset-4"
            href="/resources"
          >
            Action Learning library and WIAL Talk scenarios
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="mt-6 grid gap-4" id="affiliate-inquiry-form">
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
          <span className="field-label">Contact number</span>
          <input autoComplete="tel" className="field-input" name="phone" type="tel" />
        </label>
        <label className="field-shell">
          <span className="field-label">Organization</span>
          <input autoComplete="organization" className="field-input" name="organization" type="text" />
        </label>
        <label className="field-shell md:col-span-2">
          <span className="field-label">Country or region you want to serve</span>
          <input autoComplete="country-name" className="field-input" name="country" required type="text" />
        </label>
      </div>
      <label className="field-shell">
        <span className="field-label">Message</span>
        <textarea
          className="field-textarea"
          name="message"
          placeholder="Tell us about your experience with Action Learning and the community you hope to build."
          rows={5}
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button className="button-link primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending..." : "Send inquiry"}
        </button>
        <p className="text-sm text-foreground/60">
          We reply to every inquiry, usually within a few business days.
        </p>
      </div>

      {result?.error ? <div className="account-flash is-error">{result.error}</div> : null}
    </form>
  );
}
