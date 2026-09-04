"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccountViewer } from "@/lib/auth";
import {
  createPartner,
  deletePartner,
  setPartnerActive,
  updatePartner,
  uploadPartnerLogo,
} from "@/lib/partners";
import { parsePartnerForm, PartnersError } from "@/lib/partners-fields";

const ADMIN_PATH = "/admin/global/partners";

function back(path: string, params: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}

function errorCode(error: unknown) {
  return error instanceof PartnersError ? error.code : "save-failed";
}

function logoFileFrom(formData: FormData) {
  const file = formData.get("logoFile");
  return file instanceof File && file.size > 0 ? file : null;
}

function revalidatePartners() {
  revalidatePath("/partners");
  revalidatePath(ADMIN_PATH);
}

export async function createPartnerAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  let failure: string | null = null;
  try {
    const input = parsePartnerForm(formData);
    const partner = await createPartner(input);
    const logoFile = logoFileFrom(formData);
    if (logoFile) {
      const logoUrl = await uploadPartnerLogo(logoFile, partner.slug);
      await updatePartner(partner.id, { ...input, logoUrl });
    }
  } catch (error) {
    failure = errorCode(error);
  }
  if (failure) {
    back(ADMIN_PATH, { error: failure });
  }
  revalidatePartners();
  back(ADMIN_PATH, { notice: "created" });
}

export async function updatePartnerAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    back(ADMIN_PATH, { error: "not-found" });
  }
  const detailPath = `${ADMIN_PATH}/${id}`;
  let failure: string | null = null;
  try {
    const input = parsePartnerForm(formData);
    const logoFile = logoFileFrom(formData);
    const slug = String(formData.get("slug") ?? "partner").trim() || "partner";
    const logoUrl = logoFile ? await uploadPartnerLogo(logoFile, slug) : input.logoUrl;
    await updatePartner(id, { ...input, logoUrl });
  } catch (error) {
    failure = errorCode(error);
  }
  if (failure) {
    back(detailPath, { error: failure });
  }
  revalidatePartners();
  back(detailPath, { notice: "saved" });
}

export async function setPartnerActiveAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const id = String(formData.get("id") ?? "").trim();
  const active = String(formData.get("active") ?? "") === "true";
  let failure: string | null = null;
  try {
    await setPartnerActive(id, active);
  } catch (error) {
    failure = errorCode(error);
  }
  if (failure) {
    back(ADMIN_PATH, { error: failure });
  }
  revalidatePartners();
  back(ADMIN_PATH, { notice: active ? "shown" : "hidden" });
}

export async function deletePartnerAction(formData: FormData) {
  await requireAccountViewer(ADMIN_PATH, ["platform_admin"]);
  const id = String(formData.get("id") ?? "").trim();
  let failure: string | null = null;
  try {
    await deletePartner(id);
  } catch (error) {
    failure = errorCode(error);
  }
  if (failure) {
    back(`${ADMIN_PATH}/${id}`, { error: failure });
  }
  revalidatePartners();
  back(ADMIN_PATH, { notice: "deleted" });
}
