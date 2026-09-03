"use client";

import { useState } from "react";
import { submitPartnerApplication, type PartnerApplicationResult } from "./actions";

export function PartnerApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PartnerApplicationResult | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await submitPartnerApplication(formData);
      setResult(response);

      if (response.success) {
        const form = document.getElementById("partner-application-form");
        if (form instanceof HTMLFormElement) form.reset();
      }
    } catch {
      setResult({ error: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="mt-6 grid gap-4" id="partner-application-form">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-shell">
          <span className="field-label">Organization name</span>
          <input autoComplete="organization" className="field-input" name="organizationName" required type="text" />
        </label>
        <label className="field-shell">
          <span className="field-label">Contact name</span>
          <input autoComplete="name" className="field-input" name="contactName" required type="text" />
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
          <span className="field-label">Website</span>
          <input
            autoComplete="url"
            className="field-input"
            name="website"
            placeholder="https:// (optional)"
            type="url"
          />
        </label>
        <label className="field-shell">
          <span className="field-label">Country</span>
          <input autoComplete="country-name" className="field-input" name="country" type="text" />
        </label>
        <label className="field-shell md:col-span-2">
          <span className="field-label">Organization type</span>
          <select className="field-input" defaultValue="" name="organizationType">
            <option value="">Prefer not to say</option>
            <option value="for-profit">For-profit</option>
            <option value="not-for-profit">Not-for-profit</option>
          </select>
        </label>
      </div>
      <label className="field-shell">
        <span className="field-label">About your organization</span>
        <textarea
          className="field-textarea"
          name="message"
          placeholder="Tell us about your organization, your experience with Action Learning, any existing WIAL connections, and why you want to partner with WIAL."
          required
          rows={6}
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button className="button-link primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending..." : "Submit application"}
        </button>
        <p className="text-sm text-foreground/60">
          We reply to every application, usually within a few business days.
        </p>
      </div>

      {result?.success ? (
        <div className="account-flash is-success">
          Thank you. Your application was sent and a member of the WIAL team will be in touch.
        </div>
      ) : null}
      {result?.error ? <div className="account-flash is-error">{result.error}</div> : null}
    </form>
  );
}
