import type { ContentBody, TestimonialAudience, TestimonialItem } from "@/lib/types";

export type { TestimonialAudience, TestimonialItem };

export const DEFAULT_TESTIMONIAL_LIMIT = 3;
const MAX_TESTIMONIAL_LIMIT = 6;

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
  const max = Number.isFinite(limit)
    ? Math.min(Math.max(Math.floor(limit as number), 1), MAX_TESTIMONIAL_LIMIT)
    : DEFAULT_TESTIMONIAL_LIMIT;

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
