'use client';

import { useState } from 'react';
import { submitSuccessStory } from './actions';

const inputClassName =
  'mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const labelClassName = 'block text-sm font-medium text-gray-700';

const INDUSTRIES = [
  'Manufacturing',
  'Banking',
  'Retail',
  'Hospitality',
  'Technology',
  'Education',
  'Government',
  'Other',
] as const;

export function SuccessStoryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await submitSuccessStory(formData);
      setResult(response);

      if (response.success) {
        const form = document.getElementById('success-story-form') as HTMLFormElement;
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
      <form id="success-story-form" action={handleSubmit} className="space-y-6">
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
            <label htmlFor="country" className={labelClassName}>
              Country
            </label>
            <input type="text" id="country" name="country" className={inputClassName} placeholder="Optional" />
          </div>
          <div>
            <label htmlFor="company" className={labelClassName}>
              Organization
            </label>
            <input type="text" id="company" name="company" className={inputClassName} placeholder="Optional" />
          </div>
          <div>
            <label htmlFor="titleAtCompany" className={labelClassName}>
              Role or title
            </label>
            <input
              type="text"
              id="titleAtCompany"
              name="titleAtCompany"
              className={inputClassName}
              placeholder="Optional"
            />
          </div>
          <div>
            <label htmlFor="industry" className={labelClassName}>
              Industry
            </label>
            <select id="industry" name="industry" defaultValue="" className={inputClassName}>
              <option value="">Choose industry</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="programType" className={labelClassName}>
              Type of program
            </label>
            <input
              type="text"
              id="programType"
              name="programType"
              className={inputClassName}
              placeholder="Optional"
            />
          </div>
          <div>
            <label htmlFor="coachName" className={labelClassName}>
              Name of coach used
            </label>
            <input type="text" id="coachName" name="coachName" className={inputClassName} placeholder="Optional" />
          </div>
        </div>

        <div>
          <label htmlFor="successStory" className={labelClassName}>
            Success story <span className="text-red-500">*</span>
          </label>
          <textarea
            id="successStory"
            name="successStory"
            required
            rows={6}
            className={inputClassName}
            placeholder="Tell us how Action Learning has impacted you"
          />
        </div>

        <div>
          <label htmlFor="keyResults" className={labelClassName}>
            Key results or progress recognized
          </label>
          <textarea
            id="keyResults"
            name="keyResults"
            rows={4}
            className={inputClassName}
            placeholder="Optional"
          />
        </div>

        <div>
          <label htmlFor="quote" className={labelClassName}>
            Quote for the testimonials page
          </label>
          <textarea
            id="quote"
            name="quote"
            rows={3}
            className={inputClassName}
            placeholder="Optional — a short quote we may publish"
          />
        </div>

        <div>
          <label htmlFor="companyLogoUrl" className={labelClassName}>
            Link to your organization logo
          </label>
          <input
            type="url"
            id="companyLogoUrl"
            name="companyLogoUrl"
            className={inputClassName}
            placeholder="https:// link to a .png or other image (optional)"
          />
        </div>

        <div>
          <label htmlFor="comment" className={labelClassName}>
            Additional comments
          </label>
          <textarea id="comment" name="comment" rows={3} className={inputClassName} placeholder="Optional" />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full justify-center rounded-md bg-teal-deep px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-deep/90 focus:outline-none focus:ring-2 focus:ring-teal-deep focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Share your story'}
        </button>

        {result?.success && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
            Thank you — your story was received. We will be in touch if we feature it.
          </div>
        )}
        {result?.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{result.error}</div>
        )}
      </form>
    </div>
  );
}
