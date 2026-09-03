"use server";

import { redirect } from "next/navigation";
import { buildAbsoluteUrl, getCurrentViewer } from "@/lib/auth";
import { createCheckoutSession, PaymentsError } from "@/lib/payments";

export async function startCheckoutAction(formData: FormData) {
  const priceId = String(formData.get("priceId") ?? "").trim();
  if (!priceId) {
    redirect("/pay?error=unknown-price");
  }

  const [viewer, appUrl] = await Promise.all([getCurrentViewer(), buildAbsoluteUrl("")]);

  let checkoutUrl: string;
  try {
    checkoutUrl = await createCheckoutSession({ priceId, appUrl, user: viewer });
  } catch (error) {
    const code = error instanceof PaymentsError ? error.code : "checkout-failed";
    redirect(`/pay?error=${encodeURIComponent(code)}`);
  }

  redirect(checkoutUrl);
}
