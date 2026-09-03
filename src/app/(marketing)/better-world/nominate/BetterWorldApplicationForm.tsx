'use client';

import { useState } from 'react';
import { submitBetterWorldApplication } from './actions';

const inputClassName =
  'mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const labelClassName = 'block text-sm font-medium text-gray-700';

export function BetterWorldApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await submitBetterWorldApplication(formData);
      setResult(response);

      if (response.success) {
        const form = document.getElementById('better-world-application-form') as HTMLFormElement;
        if (form) form.reset();
      }
    } catch {
      setResult({ error: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form id="better-world-application-form" action={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your details</h2>
        </div>

        <div>
          <label htmlFor="name" className={labelClassName}>
            Your name <span className="text-red-500">*</span>
          </label>
          <input type="text" id="name" name="name" required className={inputClassName} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={labelClassName}>
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" id="email" name="email" required className={inputClassName} />
          </div>
          <div>
            <label htmlFor="role" className={labelClassName}>
              Your role at the organization
            </label>
            <input type="text" id="role" name="role" className={inputClassName} placeholder="Optional" />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900">Your organization</h2>
        </div>

        <div>
          <label htmlFor="organizationName" className={labelClassName}>
            Organization name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="organizationName"
            name="organizationName"
            required
            className={inputClassName}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="organizationWebsite" className={labelClassName}>
              Organization website
            </label>
            <input
              type="url"
              id="organizationWebsite"
              name="organizationWebsite"
              className={inputClassName}
              placeholder="https:// (optional)"
            />
          </div>
          <div>
            <label htmlFor="country" className={labelClassName}>
              Country
            </label>
            <input type="text" id="country" name="country" className={inputClassName} placeholder="Optional" />
          </div>
          <div>
            <label htmlFor="organizationType" className={labelClassName}>
              Organizational type
            </label>
            <input
              type="text"
              id="organizationType"
              name="organizationType"
              className={inputClassName}
              placeholder="Charity, educational institution, other"
            />
          </div>
          <div>
            <label htmlFor="yearsInOperation" className={labelClassName}>
              Years in operation
            </label>
            <input
              type="text"
              id="yearsInOperation"
              name="yearsInOperation"
              className={inputClassName}
              placeholder="Optional"
            />
          </div>
          <div>
            <label htmlFor="registeredNonprofit" className={labelClassName}>
              Registered non-profit?
            </label>
            <select id="registeredNonprofit" name="registeredNonprofit" defaultValue="" className={inputClassName}>
              <option value="">Choose an option</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label htmlFor="affiliateType" className={labelClassName}>
              Local body or international affiliate?
            </label>
            <select id="affiliateType" name="affiliateType" defaultValue="" className={inputClassName}>
              <option value="">Choose an option</option>
              <option value="Local body">Local body</option>
              <option value="International affiliate">International affiliate</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900">The need</h2>
        </div>

        <div>
          <label htmlFor="mission" className={labelClassName}>
            What is your organization&apos;s mission, and who does it serve?{' '}
            <span className="text-red-500">*</span>
          </label>
          <textarea id="mission" name="mission" required rows={3} className={inputClassName} />
        </div>

        <div>
          <label htmlFor="urgentNeed" className={labelClassName}>
            What is the problem or urgent need your organization is facing?{' '}
            <span className="text-red-500">*</span>
          </label>
          <textarea id="urgentNeed" name="urgentNeed" required rows={4} className={inputClassName} />
        </div>

        <div>
          <label htmlFor="howItWouldHelp" className={labelClassName}>
            How could WIAL or Action Learning coaching help address this need?{' '}
            <span className="text-red-500">*</span>
          </label>
          <textarea id="howItWouldHelp" name="howItWouldHelp" required rows={4} className={inputClassName} />
        </div>

        <div>
          <label htmlFor="supportRequested" className={labelClassName}>
            What type of Action Learning support are you looking for?
          </label>
          <textarea
            id="supportRequested"
            name="supportRequested"
            rows={3}
            className={inputClassName}
            placeholder="Optional"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="otherFunding" className={labelClassName}>
              Currently receiving other funding?
            </label>
            <select id="otherFunding" name="otherFunding" defaultValue="" className={inputClassName}>
              <option value="">Choose an option</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Not sure">Not sure</option>
            </select>
          </div>
          <div>
            <label htmlFor="fundingNeeded" className={labelClassName}>
              Estimated funding needed or preferred timing
            </label>
            <input
              type="text"
              id="fundingNeeded"
              name="fundingNeeded"
              className={inputClassName}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label htmlFor="additionalInfo" className={labelClassName}>
            Anything else you would like to share?
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            rows={3}
            className={inputClassName}
            placeholder="Optional"
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consent"
            name="consent"
            required
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="consent" className="text-sm text-gray-700">
            I consent to WIAL contacting me about this application. <span className="text-red-500">*</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full justify-center rounded-md bg-teal-deep px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-deep/90 focus:outline-none focus:ring-2 focus:ring-teal-deep focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Submit application'}
        </button>

        {result?.success && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
            Thank you — your application was received. The Better World Fund committee will
            follow up by email.
          </div>
        )}
        {result?.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{result.error}</div>
        )}
      </form>
    </div>
  );
}
