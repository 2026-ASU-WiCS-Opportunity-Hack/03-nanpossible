"use server";

import { createClient } from "@/lib/supabase/server";

export type AffiliateInquiryResult = { success?: boolean; error?: string };

export async function submitAffiliateInquiry(
  formData: FormData,
): Promise<AffiliateInquiryResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name) {
    return { error: "Name is required" };
  }

  if (!email.includes("@")) {
    return { error: "Valid email is required" };
  }

  if (!country) {
    return { error: "Country is required" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("affiliate_inquiries").insert({
      name,
      email,
      phone: phone || null,
      organization: organization || null,
      country,
      message: message || null,
    });

    if (error) {
      console.error("Affiliate inquiry error:", error);
      return { error: "We could not send your inquiry. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Affiliate inquiry error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
