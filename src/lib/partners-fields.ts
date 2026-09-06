import type { Partner } from "@/lib/types";

/**
 * Pure helpers for the partners directory (validation + display), kept free
 * of Supabase imports so they can be unit-tested; data access lives in
 * `src/lib/partners.ts`.
 */

export type PartnersErrorCode =
  | "name-required"
  | "invalid-website"
  | "invalid-logo-url"
  | "logo-too-large"
  | "logo-type"
  | "not-found"
  | "db-unavailable"
  | "save-failed";

export class PartnersError extends Error {
  constructor(
    public readonly code: PartnersErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "PartnersError";
  }
}

export type PartnerInput = {
  name: string;
  websiteUrl: string | null;
  description: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  logoUrl: string | null;
  sortOrder: number;
  active: boolean;
};

export const PARTNER_LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** Accepted upload types → stored file extension. */
export const PARTNER_LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function optionalText(value: unknown, max = 2000): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/** Empty → null; bare domains get https://; anything that is not http(s) is rejected. */
export function normalizeWebsiteUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new PartnersError("invalid-website");
  }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname.includes(".")) {
    throw new PartnersError("invalid-website");
  }
  return url.toString();
}

/** Logos may be site-relative (vendored under /partners/) or absolute http(s) URLs. */
export function normalizeLogoUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    // fall through
  }
  throw new PartnersError("invalid-logo-url");
}

/** "Annapolis, Maryland, United States" — skips blanks and repeated values. */
export function partnerLocation(
  partner: Pick<Partner, "city" | "stateProvince" | "country">,
): string | null {
  const parts: string[] = [];
  for (const part of [partner.city, partner.stateProvince, partner.country]) {
    const trimmed = part?.trim();
    if (trimmed && !parts.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      parts.push(trimmed);
    }
  }
  return parts.length ? parts.join(", ") : null;
}

/** Hostname shown next to a partner's name in admin lists. */
export function websiteHost(url: string | null): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Validate an admin form submission. Throws `PartnersError` on bad input. */
export function parsePartnerForm(formData: FormData): PartnerInput {
  const name = optionalText(formData.get("name"), 160);
  if (!name) {
    throw new PartnersError("name-required");
  }
  const sortOrderRaw = optionalText(formData.get("sortOrder"), 12);
  const sortOrder = sortOrderRaw === null ? 0 : Number.parseInt(sortOrderRaw, 10);

  return {
    name,
    websiteUrl: normalizeWebsiteUrl(optionalText(formData.get("website"), 500)),
    description: optionalText(formData.get("description")),
    city: optionalText(formData.get("city"), 120),
    stateProvince: optionalText(formData.get("stateProvince"), 120),
    country: optionalText(formData.get("country"), 120),
    logoUrl: normalizeLogoUrl(optionalText(formData.get("logoUrl"), 1000)),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    active: formData.get("active") !== null,
  };
}

/** Basic checks on an uploaded logo before it is sent to storage. */
export function validatePartnerLogoFile(file: File): string {
  const ext = PARTNER_LOGO_TYPES[file.type];
  if (!ext) {
    throw new PartnersError("logo-type");
  }
  if (file.size > PARTNER_LOGO_MAX_BYTES) {
    throw new PartnersError("logo-too-large");
  }
  return ext;
}
