import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentViewer } from "@/lib/auth";
import { listPaymentTypes } from "@/lib/payments";
import { formatMinorAmount } from "@/lib/payments-format";
import type { PaymentType } from "@/lib/types";
import { startCheckoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Make a payment",
  description:
    "Pay WIAL membership dues, certification fees, and other charges securely through Stripe.",
};

export const dynamic = "force-dynamic";

type PayPageProps = {
  searchParams: Promise<{ cancelled?: string; error?: string }>;
};

function getError(code?: string) {
  switch (code) {
    case "unknown-price":
      return "That payment option is no longer available. Please choose another one.";
    case "stripe-not-configured":
      return "Online payments are not available right now. Please contact WIAL to arrange a payment.";
    case "checkout-failed":
      return "We could not start the checkout. Please try again in a moment.";
    default:
      return null;
  }
}

export default async function PayPage({ searchParams }: PayPageProps) {
  const [query, viewer] = await Promise.all([searchParams, getCurrentViewer()]);

  let paymentTypes: PaymentType[] = [];
  let unavailable = false;
  try {
    paymentTypes = await listPaymentTypes();
  } catch (error) {
    console.error("Could not load payment types from Stripe:", error);
    unavailable = true;
  }

  const errorMessage = getError(query.error);

  return (
    <div className="page-frame">
      <div className="site-shell">
        <div className="hero-grid">
          <section className="site-panel hero-panel-warm rounded-[2rem] p-7 md:p-10">
            <div className="space-y-5">
              <span className="eyebrow">Global WIAL</span>
              <div className="space-y-4">
                <h1 className="max-w-4xl font-display text-3xl leading-none tracking-[-0.05em] text-teal-deep md:text-5xl">
                  Make a payment
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-foreground/82">
                  Pay WIAL dues, certification fees, and other charges in a few
                  clicks. Checkout is handled by Stripe, so WIAL never sees or
                  stores your card details, and your receipt arrives by email.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="button-link secondary" href="/contact">
                  Questions? Contact WIAL
                </Link>
              </div>
            </div>
          </section>

          <aside className="site-panel rounded-[2rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/55">
              At a glance
            </p>
            <div className="mt-4 grid gap-3">
              <article className="metric-card rounded-[1.35rem]">
                <p className="metric-value text-teal-deep">Stripe</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/60">
                  Secure checkout
                </p>
              </article>
              <article className="metric-card rounded-[1.35rem]">
                <p className="metric-value text-teal-deep">Email</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/60">
                  Receipt delivery
                </p>
              </article>
              <article className="metric-card rounded-[1.35rem]">
                <p className="metric-value text-teal-deep">
                  {viewer ? "Signed in" : "Guest"}
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/60">
                  {viewer ? "Saved to your account" : "No account needed"}
                </p>
              </article>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-5">
          {query.cancelled ? (
            <div className="account-flash">Your payment was cancelled. Nothing was charged.</div>
          ) : null}
          {errorMessage ? <div className="account-flash is-error">{errorMessage}</div> : null}

          {unavailable || paymentTypes.length === 0 ? (
            <section className="site-panel rounded-[2rem] p-6 md:p-8">
              <h2 className="section-title text-teal-deep">Online payments are not available yet</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/75">
                WIAL is still setting up online payments. Contact us and we will
                arrange your dues, fees, or other payment directly.
              </p>
              <Link className="button-link primary mt-6 inline-flex" href="/contact">
                Contact WIAL
              </Link>
            </section>
          ) : (
            <section className="section-stack">
              <div className="space-y-3">
                <h2 className="section-title text-teal-deep">What would you like to pay?</h2>
                <p className="max-w-3xl text-base leading-7 text-foreground/75">
                  {viewer
                    ? `You are signed in as ${viewer.email}. This payment will be linked to your account.`
                    : "You can pay as a guest. Sign in first if you would like the payment saved to your WIAL account."}
                  {!viewer ? (
                    <>
                      {" "}
                      <Link className="font-semibold text-teal" href="/login?next=%2Fpay">
                        Sign in
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paymentTypes.map((paymentType) => (
                  <article
                    className="feature-card flex flex-col rounded-[1.5rem]"
                    key={paymentType.priceId}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green">
                      {paymentType.nickname ?? "One-time payment"}
                    </p>
                    <h3 className="mt-3">{paymentType.name}</h3>
                    {paymentType.description ? (
                      <p className="mt-3 text-sm">{paymentType.description}</p>
                    ) : null}
                    <p className="mt-5 font-display text-3xl text-teal-deep">
                      {formatMinorAmount(paymentType.amount, paymentType.currency)}
                    </p>
                    <form action={startCheckoutAction} className="mt-auto pt-5">
                      <input name="priceId" type="hidden" value={paymentType.priceId} />
                      <button className="button-link primary" type="submit">
                        Pay {formatMinorAmount(paymentType.amount, paymentType.currency)}
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
