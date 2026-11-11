/** Topics offered by the contact form's "About" dropdown, in display order. */
export const CONTACT_ABOUT_OPTIONS = [
  "Action Learning",
  "Certification",
  "Programs",
  "Solution Spheres",
  "Events",
  "WIAL",
  "Other",
] as const;

/**
 * Resolve the `?about=` query value to one of the dropdown topics so links
 * (e.g. "Request a conversation" on /for-organizations) can pre-select it.
 * Matching is trimmed and case-insensitive; anything unknown returns "" and
 * the visitor sees the normal empty choice. The raw value is never echoed.
 */
export function resolveContactAbout(raw: string | string[] | undefined): string {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();
  if (!value) return "";
  return CONTACT_ABOUT_OPTIONS.find((option) => option.toLowerCase() === value) ?? "";
}
