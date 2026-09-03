"use client";

import { useState } from "react";
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

      if (response.success) {
        const form = document.getElementById("affiliate-inquiry-form");
        if (form instanceof HTMLFormElement) form.reset();
      }
    } catch {
      setResult({ error: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
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

      {result?.success ? (
        <div className="account-flash is-success">
          Thank you. Your inquiry was sent and a member of the WIAL team will be in touch.
        </div>
      ) : null}
      {result?.error ? <div className="account-flash is-error">{result.error}</div> : null}
    </form>
  );
}
