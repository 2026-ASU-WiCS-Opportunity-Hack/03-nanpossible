"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccountViewer } from "@/lib/auth";
import { getCoachByIdForAdmin } from "@/lib/coaches";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import type { CertificationLevel } from "@/lib/types";

const CERT_LEVELS: CertificationLevel[] = ["CALC", "PALC", "SALC", "MALC"];
const SLUG_PATTERN = /^[\p{Ll}\p{N}]+(?:-[\p{Ll}\p{N}]+)*$/u;

function buildReturnPath(coachId: string, params: Record<string, string>) {
  return `/admin/global/coaches/${coachId}?${new URLSearchParams(params).toString()}`;
}

function readText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value : null;
}

function readNumber(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readList(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function saveCoachAction(formData: FormData) {
  const coachId = String(formData.get("coachId") ?? "");

  await requireAccountViewer(`/admin/global/coaches/${coachId}`, ["platform_admin"]);

  const client = createServiceRoleSupabaseClient();
  const coach = coachId ? await getCoachByIdForAdmin(coachId) : null;

  if (!client || !coach) {
    redirect("/admin/global/coaches?error=save-failed");
  }

  const name = readText(formData, "name");

  if (!name) {
    redirect(buildReturnPath(coachId, { error: "name-required" }));
  }

  const slug = readText(formData, "slug");

  if (slug && !SLUG_PATTERN.test(slug)) {
    redirect(buildReturnPath(coachId, { error: "slug-invalid" }));
  }

  if (slug && slug !== coach.slug) {
    const { data: existing } = await client
      .from("coaches")
      .select("id")
      .eq("slug", slug)
      .neq("id", coachId)
      .maybeSingle();

    if (existing) {
      redirect(buildReturnPath(coachId, { error: "slug-taken" }));
    }
  }

  const certLevelInput = readText(formData, "certLevel");
  const certLevel = CERT_LEVELS.includes(certLevelInput as CertificationLevel)
    ? (certLevelInput as CertificationLevel)
    : null;
  const locationCity = readText(formData, "locationCity");
  const locationCountry = readText(formData, "locationCountry");

  const { error } = await client
    .from("coaches")
    .update({
      name,
      slug,
      title: readText(formData, "title"),
      organization: readText(formData, "organization"),
      chapter_id: readText(formData, "chapterId"),
      cert_level: certLevel,
      certification_level: certLevel,
      cert_valid_until: readText(formData, "certValidUntil"),
      email: readText(formData, "email"),
      phone: readText(formData, "phone"),
      location: [locationCity, locationCountry].filter(Boolean).join(", ") || null,
      location_city: locationCity,
      location_state: readText(formData, "locationState"),
      location_country: locationCountry,
      location_lat: readNumber(formData, "locationLat"),
      location_lng: readNumber(formData, "locationLng"),
      website: readText(formData, "website"),
      linkedin: readText(formData, "linkedin"),
      blog_url: readText(formData, "blogUrl"),
      youtube_url: readText(formData, "youtubeUrl"),
      twitter_url: readText(formData, "twitterUrl"),
      facebook_url: readText(formData, "facebookUrl"),
      photo_url: readText(formData, "photoUrl"),
      cv_url: readText(formData, "cvUrl"),
      credly_badge_url: readText(formData, "credlyBadgeUrl"),
      bio: readText(formData, "bio"),
      credentials: readText(formData, "credentials"),
      awards: readText(formData, "awards"),
      specializations: readList(formData, "specializations"),
      languages: readList(formData, "languages"),
      approved: formData.get("approved") === "true",
      updated_at: new Date().toISOString(),
    })
    .eq("id", coachId);

  if (error) {
    console.error("saveCoachAction update failed", error);
    redirect(buildReturnPath(coachId, { error: "save-failed" }));
  }

  revalidatePath("/coaches");
  revalidatePath(`/coaches/${coachId}`);
  for (const value of [coach.slug, slug]) {
    if (value) {
      revalidatePath(`/coaches/${encodeURIComponent(value)}`);
    }
  }
  revalidatePath("/admin/global/coaches");
  redirect(buildReturnPath(coachId, { notice: "saved" }));
}
