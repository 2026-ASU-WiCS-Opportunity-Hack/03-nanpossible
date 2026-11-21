"use server";

import { subscribeToNewsletter } from "@/lib/newsletter";
import { normalizeNewsletterEmail, resolveNewsletterSource } from "@/lib/newsletter-fields";

export type NewsletterSignupResult = { success?: boolean; error?: string };

export async function subscribeToNewsletterAction(
  formData: FormData,
): Promise<NewsletterSignupResult> {
  // Honeypot: real visitors never fill the hidden field.
  if (String(formData.get("company") ?? "").trim()) {
    return { success: true };
  }

  const email = normalizeNewsletterEmail(formData.get("email"));
  if (!email) {
    return { error: "Please enter a valid email address." };
  }

  const outcome = await subscribeToNewsletter(email, resolveNewsletterSource(formData.get("source")));
  return outcome.ok
    ? { success: true }
    : { error: "We could not sign you up just now. Please try again in a moment." };
}
