import {
  applyAudienceTags,
  audiencePatchFromItems,
  clampTestimonialLimit,
  isInternalHref,
  isTestimonialAudience,
  isTestimonialHighlightsSupported,
  testimonialKeys,
} from "@/lib/testimonials";
import type { ContentSection } from "@/lib/types";

export type SanitizeContext = { storedSections: ContentSection[]; slug?: string };

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanLines(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

/**
 * Rebuild each section from the payload so only known shapes reach the DB.
 * The four section types the editor can change are validated field by
 * field; any other type is passed through untouched (the editor shows
 * those as locked cards and never modifies them).
 */
export function sanitizeSection(
  section: ContentSection,
  index: number,
  ctx: SanitizeContext = { storedSections: [] },
  gridOccurrence = 0,
): { section: ContentSection } | { error: string } {
  const label = `Section ${index + 1}`;
  switch (section.type) {
    case "prose": {
      const title = section.title?.trim();
      const paragraphs = cleanLines(section.paragraphs);
      if (!title) {
        return { error: `${label}: add a heading.` };
      }
      if (!paragraphs.length) {
        return { error: `${label} (${title}): add at least one paragraph.` };
      }
      const bullets = cleanLines(section.bullets);
      return {
        section: {
          type: "prose",
          title,
          paragraphs,
          ...(bullets.length ? { bullets } : {}),
        },
      };
    }
    case "media_prose": {
      const title = section.title?.trim();
      const image = section.image?.trim();
      const paragraphs = cleanLines(section.paragraphs);
      if (!title) {
        return { error: `${label}: add a heading.` };
      }
      if (!image) {
        return { error: `${label} (${title}): add an image path.` };
      }
      if (!paragraphs.length) {
        return { error: `${label} (${title}): add at least one paragraph.` };
      }
      const bullets = cleanLines(section.bullets);
      const caption = section.caption?.trim();
      return {
        section: {
          type: "media_prose",
          title,
          image,
          imageAlt: section.imageAlt?.trim() ?? "",
          paragraphs,
          ...(bullets.length ? { bullets } : {}),
          ...(caption ? { caption } : {}),
          ...(section.imagePosition === "left" || section.imagePosition === "right"
            ? { imagePosition: section.imagePosition }
            : {}),
        },
      };
    }
    case "timeline": {
      const title = section.title?.trim();
      if (!title) {
        return { error: `${label}: add a heading.` };
      }
      const items = (Array.isArray(section.items) ? section.items : [])
        .map((item) => ({
          year: item.year?.trim() || undefined,
          title: item.title?.trim() ?? "",
          body: item.body?.trim() ?? "",
        }))
        .filter((item) => item.title || item.body);
      if (!items.length) {
        return { error: `${label} (${title}): add at least one entry.` };
      }
      const incomplete = items.findIndex((item) => !item.title || !item.body);
      if (incomplete !== -1) {
        return {
          error: `${label} (${title}): entry ${incomplete + 1} needs both a title and a description.`,
        };
      }
      return { section: { type: "timeline", title, items } };
    }
    case "cta": {
      const title = section.title?.trim();
      const body = section.body?.trim();
      const href = section.href?.trim();
      const ctaLabel = section.label?.trim();
      if (!title || !body || !href || !ctaLabel) {
        return {
          error: `${label}: the call to action needs a heading, text, a link, and a button label.`,
        };
      }
      return { section: { type: "cta", title, body, href, label: ctaLabel } };
    }
    case "testimonial_highlights": {
      if (ctx.slug !== undefined && !isTestimonialHighlightsSupported(ctx.slug)) {
        return {
          error: `${label}: client quotes can't be shown on this page.`,
        };
      }
      const title = str(section.title);
      if (!title) {
        return { error: `${label}: add a heading for the client quotes.` };
      }
      if (!isTestimonialAudience(section.audience)) {
        return { error: `${label} (${title}): choose which page's quotes to show.` };
      }
      const description = str(section.description);
      const linkLabel = str(section.linkLabel);
      const linkHref = str(section.linkHref);
      if (linkHref && !isInternalHref(linkHref)) {
        return {
          error: `${label}: the link must be a page on this site, like /clients.`,
        };
      }
      return {
        section: {
          type: "testimonial_highlights",
          title,
          ...(description ? { description } : {}),
          audience: section.audience,
          limit: clampTestimonialLimit(section.limit),
          ...(section.includeVideo === true ? { includeVideo: true } : {}),
          ...(linkLabel ? { linkLabel } : {}),
          ...(linkHref ? { linkHref } : {}),
        },
      };
    }
    case "testimonial_grid": {
      // Tags only: quote copy always comes from the stored page.
      const storedGrid = ctx.storedSections.filter(
        (stored) => stored.type === "testimonial_grid",
      )[gridOccurrence];
      if (!storedGrid || storedGrid.type !== "testimonial_grid") {
        return { error: "Client stories can't be added from here." };
      }
      const patch = audiencePatchFromItems(section.items);
      const storedKeys = testimonialKeys(storedGrid.items);
      const patchKeys = Object.keys(patch);
      if (
        patchKeys.length !== storedKeys.length ||
        !storedKeys.every((key) => Object.prototype.hasOwnProperty.call(patch, key))
      ) {
        return {
          error:
            "The client stories changed since this page was opened. Reload the page and try again.",
        };
      }
      return {
        section: {
          ...storedGrid,
          items: applyAudienceTags(storedGrid.items, patch),
        },
      };
    }
    default:
      return { section };
  }
}

export function sanitizeSections(
  raw: unknown,
  ctx: SanitizeContext,
): { sections: ContentSection[] } | { error: string } {
  const list: unknown[] = Array.isArray(raw) ? raw : [];
  const sections: ContentSection[] = [];
  const seenHighlights = new Map<string, number>();
  let grids = 0;
  for (const [index, item] of list.entries()) {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item) ||
      typeof (item as { type?: unknown }).type !== "string"
    ) {
      return { error: `Section ${index + 1}: this section is not valid. Reload the page and try again.` };
    }
    const result = sanitizeSection(item as ContentSection, index, ctx, grids);
    if ("error" in result) {
      return result;
    }
    if (result.section.type === "testimonial_grid") {
      grids += 1;
    }
    if (result.section.type === "testimonial_highlights") {
      const key = `${result.section.audience}||${result.section.title.toLowerCase()}`;
      const first = seenHighlights.get(key);
      if (first !== undefined) {
        return {
          error: `Sections ${first + 1} and ${index + 1}: two client-quote sections can't share the same heading and page.`,
        };
      }
      seenHighlights.set(key, index);
    }
    sections.push(result.section);
  }
  const storedGrids = ctx.storedSections.filter(
    (stored) => stored.type === "testimonial_grid",
  ).length;
  if (grids < storedGrids) {
    return { error: "The client stories section can't be removed here." };
  }
  return { sections };
}
