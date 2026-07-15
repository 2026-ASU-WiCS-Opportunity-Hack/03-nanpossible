'use client';

import { useState } from 'react';
import { submitContactForm } from './actions';

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await submitContactForm(formData);
      setResult(response);
      
      if (response.success) {
        // Reset form on success
        const form = document.getElementById('contact-form') as HTMLFormElement;
        if (form) form.reset();
      }
    } catch (error) {
      setResult({ error: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form id="contact-form" action={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Your full name"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="How can we help you?"
          />
        </div>

        {/* Newsletter Checkbox */}
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              type="checkbox"
              id="newsletter"
              name="newsletter"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <label htmlFor="newsletter" className="ml-3 text-sm text-gray-600">
            Subscribe to our newsletter for updates on Action Learning events, programs, and certification opportunities.
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full justify-center rounded-md bg-teal-deep px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-deep/90 focus:outline-none focus:ring-2 focus:ring-teal-deep focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>

        {/* Result Messages */}
        {result?.success && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
            Your message was sent successfully! We'll get back to you soon.
          </div>
        )}
        {result?.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {result.error}
          </div>
        )}
      </form>
    </div>
  );
}