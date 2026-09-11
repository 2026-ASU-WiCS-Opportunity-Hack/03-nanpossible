"use client";

import { useFormStatus } from "react-dom";
import { beginCheckoutEvent, trackEvent } from "@/lib/analytics";
import { formatMinorAmount } from "@/lib/payments-format";
import type { PaymentType } from "@/lib/types";

/**
 * Submit button for one payment card. Reports `begin_checkout` as the visitor
 * leaves for Stripe (gtag sends it as a beacon, so the redirect does not lose it).
 */
export function PayButton({ paymentType }: { paymentType: PaymentType }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="button-link primary"
      disabled={pending}
      onClick={() => trackEvent(beginCheckoutEvent(paymentType))}
      type="submit"
    >
      {pending
        ? "Redirecting to Stripe…"
        : `Pay ${formatMinorAmount(paymentType.amount, paymentType.currency)}`}
    </button>
  );
}
