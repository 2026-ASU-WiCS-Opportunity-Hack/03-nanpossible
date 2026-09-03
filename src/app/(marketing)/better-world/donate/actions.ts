"use server";

import { redirect } from "next/navigation";
import { buildAbsoluteUrl, getCurrentViewer } from "@/lib/auth";
import { createDonationCheckoutSession, PaymentsError } from "@/lib/payments";
import { DONATION_COMMENT_MAX, parseDonationAmount } from "@/lib/payments-format";

export async function startDonationAction(formData: FormData) {
  const preset = String(formData.get("preset") ?? "").trim();
  const custom = String(formData.get("custom") ?? "").trim();
  const amount = parseDonationAmount(preset, custom);
  if (amount === null) {
    redirect("/better-world/donate?error=invalid-amount");
  }

  const rawComment = String(formData.get("comment") ?? "").trim().slice(0, DONATION_COMMENT_MAX);
  const comment = rawComment || null;

  const [viewer, appUrl] = await Promise.all([getCurrentViewer(), buildAbsoluteUrl("")]);

  let checkoutUrl: string;
  try {
    checkoutUrl = await createDonationCheckoutSession({ amount, comment, appUrl, user: viewer });
  } catch (error) {
    const code = error instanceof PaymentsError ? error.code : "checkout-failed";
    redirect(`/better-world/donate?error=${encodeURIComponent(code)}`);
  }

  redirect(checkoutUrl);
}
