import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentViewer } from "@/lib/auth";
import { recordCheckoutSession } from "@/lib/payments";
import { formatMinorAmount } from "@/lib/payments-format";
import type { PaymentRecord } from "@/lib/types";

export const metadata: Metadata = {
  title: "Payment received",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

type PaySuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function PaySuccessPage({ searchParams }: PaySuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) {
    redirect("/pay");
  }

  const viewer = await getCurrentViewer();
  let payment: PaymentRecord | null = null;
  let failed = false;
  try {
    payment = await recordCheckoutSession(sessionId);
  } catch (error) {
    console.error("Could not verify the Stripe checkout session:", error);
    failed = true;
  }

  const isDonation = payment?.source === "better-world-donation";

  return (
    <div className="page-frame">
      <div className="site-shell">
        <section className="site-panel hero-panel-warm rounded-[2rem] p-7 md:p-10">
          <div className="space-y-5">
            <span className="eyebrow">Global WIAL</span>
            {payment ? (
              <>
                <h1 className="max-w-4xl font-display text-3xl leading-none tracking-[-0.05em] text-teal-deep md:text-5xl">
                  {isDonation ? "Thank you for your donation" : "Thank you, your payment was received"}
                </h1>
                <dl className="grid max-w-2xl gap-4 text-base leading-7 text-foreground/82 md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
                      Paid for
                    </dt>
                    <dd className="mt-1 font-semibold text-teal-deep">{payment.productName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
                      Amount
                    </dt>
                    <dd className="mt-1 font-semibold text-teal-deep">
                      {formatMinorAmount(payment.amount, payment.currency)}
                    </dd>
                  </div>
                  {payment.payerEmail ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
                        Receipt sent to
                      </dt>
                      <dd className="mt-1">{payment.payerEmail}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
                      Reference
                    </dt>
                    <dd className="mt-1 break-all text-sm">{payment.stripeSessionId}</dd>
                  </div>
                </dl>
                <p className="max-w-2xl text-base leading-7 text-foreground/75">
                  Stripe emails your receipt within a few minutes. Keep the
                  reference above if you need to ask WIAL about this payment.
                </p>
              </>
            ) : (
              <>
                <h1 className="max-w-4xl font-display text-3xl leading-none tracking-[-0.05em] text-teal-deep md:text-5xl">
                  We could not confirm this payment yet
                </h1>
                <p className="max-w-2xl text-base leading-7 text-foreground/75">
                  {failed
                    ? "Stripe did not respond in time. If your card was charged, the payment is safe; contact WIAL with the reference below and we will confirm it."
                    : "Stripe has not marked this checkout as paid. If you completed the payment, it can take a moment to register; otherwise nothing was charged."}
                </p>
                <p className="break-all text-sm text-foreground/60">Reference: {sessionId}</p>
              </>
            )}
            <div className="flex flex-wrap gap-3">
              {isDonation ? (
                <Link className="button-link primary" href="/better-world">
                  Back to the Better World Fund
                </Link>
              ) : (
                <Link className="button-link primary" href="/pay">
                  Make another payment
                </Link>
              )}
              {viewer ? (
                <Link className="button-link secondary" href="/account/profile">
                  Go to your account
                </Link>
              ) : (
                <Link className="button-link secondary" href="/contact">
                  Contact WIAL
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
