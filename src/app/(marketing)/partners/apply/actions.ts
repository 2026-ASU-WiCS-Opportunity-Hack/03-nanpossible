"use server";

import { createClient } from "@/lib/supabase/server";

export type PartnerApplicationResult = { success?: boolean; error?: string };

const ORGANIZATION_TYPES = ["for-profit", "not-for-profit"] as const;
type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

function isOrganizationType(value: string): value is OrganizationType {
  return (ORGANIZATION_TYPES as readonly string[]).includes(value);
}

function optionalText(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalUrl(value: FormDataEntryValue | null) {
  const trimmed = optionalText(value);
  if (!trimmed) return { value: null as string | null };
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: "Website must start with http:// or https://" as const };
    }
    return { value: url.toString() };
  } catch {
    return { error: "Please enter a valid website address" as const };
  }
}

export async function submitPartnerApplication(
  formData: FormData,
): Promise<PartnerApplicationResult> {
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = optionalText(formData.get("phone"));
  const country = optionalText(formData.get("country"));
  const organizationTypeRaw = String(formData.get("organizationType") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const website = optionalUrl(formData.get("website"));

  if (!organizationName) {
    return { error: "Organization name is required" };
  }

  if (!contactName) {
    return { error: "Contact name is required" };
  }

  if (!email.includes("@")) {
    return { error: "Valid email is required" };
  }

  if (organizationTypeRaw && !isOrganizationType(organizationTypeRaw)) {
    return { error: "Please choose an organization type from the list" };
  }

  if (!message) {
    return { error: "Please tell us about your organization and your interest in partnering" };
  }

  if ("error" in website) {
    return { error: website.error };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("partner_applications").insert({
      organization_name: organizationName,
      contact_name: contactName,
      email,
      phone,
      website: website.value,
      country,
      organization_type: organizationTypeRaw || null,
      message,
    });

    if (error) {
      console.error("Partner application error:", error);
      return { error: "We could not send your application. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Partner application error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
