/** Pure helpers for the inline newsletter capture (#164); no I/O. */

export const NEWSLETTER_HEADLINE = "Join our newsletter";
export const NEWSLETTER_PITCH = "Get Action Learning insights, events and certification dates.";

/** Where a signup came from; stored with the subscriber and sent to analytics. */
export const NEWSLETTER_SOURCES = [
  "home",
  "resources",
  "footer",
  "become_a_coach",
  "contact",
] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Constant Contact rejects addresses longer than 50 characters. */
const MAX_EMAIL_LENGTH = 50;

/** Lower-cased, trimmed address, or null when it is not a usable email. */
export function normalizeNewsletterEmail(value: unknown): string | null {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email) ? email : null;
}

export function resolveNewsletterSource(value: unknown): NewsletterSource {
  return NEWSLETTER_SOURCES.find((source) => source === value) ?? "footer";
}
