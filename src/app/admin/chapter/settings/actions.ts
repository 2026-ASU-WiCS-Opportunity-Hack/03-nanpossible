"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccountViewer } from "@/lib/auth";
import { updateChapterSettings } from "@/lib/chapters-admin";
import { getChapterById } from "@/lib/tenant";

function buildReturnPath(params: Record<string, string>) {
  return `/admin/chapter/settings?${new URLSearchParams(params).toString()}`;
}

export async function saveChapterSettingsAction(formData: FormData) {
  const viewer = await requireAccountViewer("/admin/chapter/settings", [
    "platform_admin",
    "chapter_admin",
  ]);

  const chapterId = String(formData.get("chapterId") ?? "");

  if (!chapterId) {
    redirect(buildReturnPath({ error: "missing-chapter" }));
  }

  if (viewer.role !== "platform_admin" && viewer.chapterId !== chapterId) {
    redirect(buildReturnPath({ error: "forbidden" }));
  }

  try {
    await updateChapterSettings({
      chapterId,
      name: String(formData.get("name") ?? ""),
      region: String(formData.get("region") ?? ""),
      country: String(formData.get("country") ?? ""),
      language: String(formData.get("language") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      contactPhoneCountryCode: String(formData.get("phone_country_code") ?? "").trim(),
      description: String(formData.get("description") ?? ""),
      contactName: String(formData.get("contactName") ?? ""),
      addressLine1: String(formData.get("addressLine1") ?? ""),
      addressLine2: String(formData.get("addressLine2") ?? ""),
      city: String(formData.get("city") ?? ""),
      stateProvince: String(formData.get("stateProvince") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
      facebookUrl: String(formData.get("facebookUrl") ?? ""),
      linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
      blogUrl: String(formData.get("blogUrl") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? ""),
      websiteUrl: String(formData.get("websiteUrl") ?? ""),
    });
  } catch (error) {
    redirect(
      buildReturnPath({
        error:
          error instanceof Error && error.message === "invalid-website"
            ? "invalid-website"
            : "save-failed",
      }),
    );
  }

  const chapter = await getChapterById(chapterId);

  if (chapter) {
    revalidatePath(`/sites/${chapter.subdomain}`);
    revalidatePath(`/sites/${chapter.subdomain}/contact`);
  }

  revalidatePath("/coaches");
  redirect(buildReturnPath({ notice: "saved" }));
}
