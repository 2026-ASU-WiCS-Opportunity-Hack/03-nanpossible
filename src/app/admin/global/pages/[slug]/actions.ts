"use server";

import { revalidatePath } from "next/cache";
import { requireAccountViewer } from "@/lib/auth";
import { getGlobalPageBySlugForAdmin } from "@/lib/content";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import type { ContentBody, ContentSection } from "@/lib/types";

export type SaveGlobalPagePayload = {
  slug: string;
  title: string;
  published: boolean;
  body: ContentBody;
};

export type SaveGlobalPageResult = {
  ok: boolean;
  error: string | null;
  savedAt: string | null;
};

function fail(error: string): SaveGlobalPageResult {
  return { ok: false, error, savedAt: null };
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
function sanitizeSection(
  section: ContentSection,
  index: number,
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
    default:
      return { section };
  }
}

export async function saveGlobalPageAction(
  payload: SaveGlobalPagePayload,
): Promise<SaveGlobalPageResult> {
  await requireAccountViewer(`/admin/global/pages/${payload.slug}`, [
    "platform_admin",
  ]);

  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return fail("The database is unavailable right now.");
  }

  const record = await getGlobalPageBySlugForAdmin(payload.slug);
  if (!record) {
    return fail("This page no longer exists.");
  }

  const title = payload.title?.trim();
  if (!title) {
    return fail("Add a page title.");
  }

  const heroIntro = String(payload.body?.heroIntro ?? "").trim();
  const metrics = (Array.isArray(payload.body?.metrics) ? payload.body.metrics : [])
    .map((metric) => ({
      label: String(metric?.label ?? "").trim(),
      value: String(metric?.value ?? "").trim(),
    }))
    .filter((metric) => metric.label && metric.value);

  const sections: ContentSection[] = [];
  for (const [index, raw] of (payload.body?.sections ?? []).entries()) {
    const result = sanitizeSection(raw, index);
    if ("error" in result) {
      return fail(result.error);
    }
    sections.push(result.section);
  }

  const body: ContentBody = { heroIntro, metrics, sections };
  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await client
    .from("content_pages")
    .update({
      title,
      published: payload.published,
      body_richtext: body,
      updated_at: now,
    })
    .is("chapter_id", null)
    .eq("slug", payload.slug)
    .select("id");

  if (updateError) {
    return fail("Saving failed — try again.");
  }

  if (!updated?.length) {
    // Fixture-only page (migration not applied yet): create the row.
    const { error: insertError } = await client.from("content_pages").insert({
      id: record.id,
      chapter_id: null,
      slug: payload.slug,
      title,
      published: payload.published,
      body_richtext: body,
      seo: record.seo ?? {},
      created_at: now,
      updated_at: now,
    });
    if (insertError) {
      return fail("Saving failed — try again.");
    }
  }

  revalidatePath(payload.slug === "home" ? "/" : `/${payload.slug}`);
  revalidatePath("/admin/global/pages");

  return { ok: true, error: null, savedAt: now };
}
