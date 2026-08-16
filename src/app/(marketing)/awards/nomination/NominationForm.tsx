'use client';

import { useState } from 'react';
import { submitAwardNomination } from './actions';
import { AWARD_CATEGORIES } from './categories';

const inputClassName =
  'mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const labelClassName = 'block text-sm font-medium text-gray-700';

export function NominationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isThirdParty, setIsThirdParty] = useState(true);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await submitAwardNomination(formData);
      setResult(response);

      if (response.success) {
        const form = document.getElementById('nomination-form') as HTMLFormElement;
        if (form) form.reset();
        setIsThirdParty(true);
      }
    } catch {
      setResult({ error: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form id="nomination-form" action={handleSubmit} className="space-y-6">
        {/* Nomination type */}
        <fieldset>
          <legend className={labelClassName}>
            Are you nominating someone else, or applying yourself?{' '}
            <span className="text-red-500">*</span>
          </legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="radio"
                name="nominationType"
                value="third_party"
                checked={isThirdParty}
                onChange={() => setIsThirdParty(true)}
                className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              I&apos;m nominating a person or organization for an award
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="radio"
                name="nominationType"
                value="self"
                checked={!isThirdParty}
                onChange={() => setIsThirdParty(false)}
                className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              I&apos;m applying for an award myself
            </label>
          </div>
        </fieldset>

        {/* Award category */}
        <fieldset>
          <legend className={labelClassName}>
            Award category <span className="text-red-500">*</span>
          </legend>
          <div className="mt-2 space-y-3">
            {AWARD_CATEGORIES.map((category) => (
              <label key={category.value} className="flex items-start gap-3 text-sm">
                <input
                  type="radio"
                  name="awardCategory"
                  value={category.value}
                  required
                  className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="font-medium text-gray-800">{category.value}</span>
                  <span className="block text-gray-500">{category.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Your details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your details</h2>
          <div>
            <label htmlFor="name" className={labelClassName}>
              Name <span className="text-red-500">*</span>
            </label>
            <input type="text" id="name" name="name" required className={inputClassName} placeholder="Your full name" />
          </div>
          <div>
            <label htmlFor="email" className={labelClassName}>
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" id="email" name="email" required className={inputClassName} placeholder="you@example.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className={labelClassName}>
                Phone
              </label>
              <input type="tel" id="phone" name="phone" className={inputClassName} placeholder="Optional" />
            </div>
            <div>
              <label htmlFor="location" className={labelClassName}>
                Location
              </label>
              <input type="text" id="location" name="location" className={inputClassName} placeholder="City, country" />
            </div>
            <div>
              <label htmlFor="designation" className={labelClassName}>
                Role or title
              </label>
              <input type="text" id="designation" name="designation" className={inputClassName} placeholder="Optional" />
            </div>
            <div>
              <label htmlFor="company" className={labelClassName}>
                Organization
              </label>
              <input type="text" id="company" name="company" className={inputClassName} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label htmlFor="companyWebsite" className={labelClassName}>
              Organization website
            </label>
            <input type="url" id="companyWebsite" name="companyWebsite" className={inputClassName} placeholder="https://example.com" />
          </div>
        </div>

        {/* Nominee details (third-party only) */}
        {isThirdParty ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Nominee&apos;s details</h2>
            <div>
              <label htmlFor="nomineeName" className={labelClassName}>
                Nominee&apos;s name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nomineeName"
                name="nomineeName"
                required
                className={inputClassName}
                placeholder="Person or organization you are nominating"
              />
            </div>
            <div>
              <label htmlFor="nomineeEmail" className={labelClassName}>
                Nominee&apos;s email
              </label>
              <input type="email" id="nomineeEmail" name="nomineeEmail" className={inputClassName} placeholder="Optional" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nomineeLocation" className={labelClassName}>
                  Nominee&apos;s location
                </label>
                <input type="text" id="nomineeLocation" name="nomineeLocation" className={inputClassName} placeholder="City, country" />
              </div>
              <div>
                <label htmlFor="nomineeDesignation" className={labelClassName}>
                  Nominee&apos;s role or title
                </label>
                <input type="text" id="nomineeDesignation" name="nomineeDesignation" className={inputClassName} placeholder="Optional" />
              </div>
              <div>
                <label htmlFor="nomineeCompany" className={labelClassName}>
                  Nominee&apos;s organization
                </label>
                <input type="text" id="nomineeCompany" name="nomineeCompany" className={inputClassName} placeholder="Optional" />
              </div>
              <div>
                <label htmlFor="nomineeWebsite" className={labelClassName}>
                  Nominee&apos;s website
                </label>
                <input type="url" id="nomineeWebsite" name="nomineeWebsite" className={inputClassName} placeholder="https://example.com" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Reason */}
        <div>
          <label htmlFor="reason" className={labelClassName}>
            Reason for the {isThirdParty ? 'nomination' : 'application'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            required
            rows={6}
            className={inputClassName}
            placeholder="Tell us about the Action Learning work and the impact it has had"
          />
        </div>

        {/* Supporting materials */}
        <div>
          <label htmlFor="supportingMaterialsUrl" className={labelClassName}>
            Link to supporting materials
          </label>
          <input
            type="url"
            id="supportingMaterialsUrl"
            name="supportingMaterialsUrl"
            className={inputClassName}
            placeholder="https:// link to a shared folder, document, or publication (optional)"
          />
        </div>

        {/* Nominee consent (third-party only) */}
        {isThirdParty ? (
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                type="checkbox"
                id="nomineeConsent"
                name="nomineeConsent"
                required
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <label htmlFor="nomineeConsent" className="ml-3 text-sm text-gray-600">
              I confirm the nominee consents to this nomination.{' '}
              <span className="text-red-500">*</span>
            </label>
          </div>
        ) : null}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full justify-center rounded-md bg-teal-deep px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-deep/90 focus:outline-none focus:ring-2 focus:ring-teal-deep focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : isThirdParty ? 'Send Nomination' : 'Send Application'}
        </button>

        {/* Result messages */}
        {result?.success && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
            Thank you — your {isThirdParty ? 'nomination' : 'application'} was received. The WIAL
            Awards Committee will be in touch.
          </div>
        )}
        {result?.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{result.error}</div>
        )}
      </form>
    </div>
  );
}
