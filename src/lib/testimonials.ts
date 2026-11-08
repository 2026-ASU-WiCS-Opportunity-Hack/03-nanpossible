import type { ContentBody, TestimonialAudience, TestimonialItem } from "@/lib/types";

export type { TestimonialAudience, TestimonialItem };

export const DEFAULT_TESTIMONIAL_LIMIT = 3;
export const MAX_TESTIMONIAL_LIMIT = 6;

type ResolveOptions = {
  audience: TestimonialAudience;
  limit?: number;
  includeVideo?: boolean;
};

/** Testimonial items of the `/clients` page body — the single source of quote copy. */
export function extractTestimonialItems(
  body: ContentBody | null | undefined,
): TestimonialItem[] {
  const grid = body?.sections?.find((section) => section.type === "testimonial_grid");
  return grid && grid.type === "testimonial_grid" ? grid.items : [];
}

/**
 * Deterministic selection: items tagged for the audience, in source order,
 * capped at `limit`. Video is dropped unless `includeVideo`; an item that
 * would then have nothing to show (video only) is skipped.
 */
export function resolveTestimonials(
  items: TestimonialItem[] | null | undefined,
  { audience, limit, includeVideo = false }: ResolveOptions,
): TestimonialItem[] {
  const max = clampTestimonialLimit(limit);

  const picked: TestimonialItem[] = [];
  for (const item of items ?? []) {
    if (picked.length >= max) break;
    if (!item.audiences?.includes(audience)) continue;
    if (includeVideo && item.videoUrl) {
      picked.push(item);
      continue;
    }
    if (!item.quote) continue;
    const { videoUrl: _videoUrl, videoTitle: _videoTitle, ...rest } = item;
    void _videoUrl;
    void _videoTitle;
    picked.push(rest);
  }
  return picked;
}

export const TESTIMONIAL_AUDIENCES = [
  "home",
  "certification",
  "organizations",
  "affiliate",
] as const satisfies readonly TestimonialAudience[];

export const TESTIMONIAL_AUDIENCE_LABELS: Record<TestimonialAudience, string> = {
  home: "Home page",
  certification: "Certification page",
  organizations: "Our services page",
  affiliate: "Become an affiliate page",
};

/**
 * Pages whose routes do not pass testimonials to `renderSection`, so a
 * "Client quotes" section added there would silently render nothing
 * (`/clients` itself is the source). The `resources/*` blog and
 * `better-world/*` story routes don't wire testimonials either.
 */
export const TESTIMONIAL_HIGHLIGHTS_UNSUPPORTED_SLUGS: readonly string[] = [
  "clients",
  "resources",
  "partners",
  // Dedicated routes that don't render content_pages sections.
  "contact",
  "certification/in-house-programs",
];

export function isTestimonialHighlightsSupported(slug: string): boolean {
  return (
    !TESTIMONIAL_HIGHLIGHTS_UNSUPPORTED_SLUGS.includes(slug) &&
    !slug.startsWith("resources/") &&
    !slug.startsWith("better-world/")
  );
}

export function isTestimonialAudience(value: unknown): value is TestimonialAudience {
  return (
    typeof value === "string" &&
    (TESTIMONIAL_AUDIENCES as readonly string[]).includes(value)
  );
}

/** Whole number from 1 to 6; anything non-numeric falls back to the default. */
export function clampTestimonialLimit(value: unknown): number {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    return DEFAULT_TESTIMONIAL_LIMIT;
  }
  return Math.min(Math.max(Math.floor(n), 1), MAX_TESTIMONIAL_LIMIT);
}

/** True for a same-site path like `/clients` (no scheme, no `//host`). */
export function isInternalHref(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\s]/.test(value)
  );
}

export function testimonialKey(
  item: Pick<TestimonialItem, "organization" | "name">,
): string {
  return `${(item.organization ?? "").trim().toLowerCase()}||${(item.name ?? "").trim().toLowerCase()}`;
}

/** One stable key per item; a `#n` suffix is added only when keys collide. */
export function testimonialKeys(items: TestimonialItem[]): string[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const base = testimonialKey(item);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}#${count}`;
  });
}

function cleanAudiences(value: unknown[]): TestimonialAudience[] {
  return TESTIMONIAL_AUDIENCES.filter((audience) => value.includes(audience));
}

/** Untrusted map of item key -> audience tags. */
export type AudienceTagPatch = Record<string, unknown>;

/**
 * Apply audience tag changes onto the stored items. `stored` is the only
 * authority: the result has the same length and order, every field is
 * copied from it, and only `audiences` can differ.
 */
export function applyAudienceTags(
  stored: TestimonialItem[],
  patch: AudienceTagPatch,
): TestimonialItem[] {
  const keys = testimonialKeys(stored);
  return stored.map((item, index) => {
    const key = keys[index];
    if (!Object.prototype.hasOwnProperty.call(patch, key)) return { ...item };
    const wanted = patch[key];
    if (!Array.isArray(wanted)) return { ...item };
    const audiences = cleanAudiences(wanted);
    const { audiences: _old, ...rest } = item;
    void _old;
    return audiences.length ? { ...rest, audiences } : rest;
  });
}

/** Build a patch from untrusted payload items, reading only identity + tags. */
export function audiencePatchFromItems(items: unknown): AudienceTagPatch {
  const patch: AudienceTagPatch = {};
  if (!Array.isArray(items)) return patch;
  const list = items.filter(
    (item): item is TestimonialItem => typeof item === "object" && item !== null,
  );
  const keys = testimonialKeys(
    list.map((item) => ({
      ...item,
      organization: String(item.organization ?? ""),
      name: String(item.name ?? ""),
    })),
  );
  list.forEach((item, index) => {
    patch[keys[index]] = item.audiences;
  });
  return patch;
}

/** Public paths to refresh after saving a page's content. */
export function testimonialPathsToRevalidate(slug: string): string[] {
  const own = slug === "home" ? "/" : `/${slug}`;
  const paths =
    slug === "clients"
      ? [own, "/", "/certification", "/our-services", "/become-an-affiliate"]
      : [own];
  return [...new Set(paths)];
}
