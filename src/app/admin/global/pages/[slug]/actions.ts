"use server";

import { revalidatePath } from "next/cache";
import { requireAccountViewer } from "@/lib/auth";
import { getGlobalPageBySlugForAdmin } from "@/lib/content";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import { sanitizeSections } from "@/lib/page-section-sanitize";
import { testimonialPathsToRevalidate } from "@/lib/testimonials";
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

  const sanitized = sanitizeSections(payload.body?.sections, {
    storedSections: record.bodyRichtext.sections,
    slug: payload.slug,
  });
  if ("error" in sanitized) {
    return fail(sanitized.error);
  }
  const sections: ContentSection[] = sanitized.sections;

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

  for (const path of testimonialPathsToRevalidate(payload.slug)) {
    revalidatePath(path);
  }
  revalidatePath("/admin/global/pages");

  return { ok: true, error: null, savedAt: now };
}
