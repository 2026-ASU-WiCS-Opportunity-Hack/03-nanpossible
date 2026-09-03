import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentViewer } from "@/lib/auth";
import { getStripeClient } from "@/lib/payments";
import { DonationForm } from "./DonationForm";

export const metadata: Metadata = {
  title: "Donate to the Better World Fund",
  description:
    "Support the WIAL Better World Fund — every contribution goes directly to bringing Action Learning to community organizations.",
};

export const dynamic = "force-dynamic";

const LEGACY_DONATION_URL = "https://wial.org/wial-better-world-fund-donation/";

const TAX_NOTICE =
  "World Institute for Action Learning (EIN: 02-0793616) is a 501(c)(3) organization. Contributions to WIAL are tax deductible to the fullest extent allowed by law. No goods or services were provided in exchange for your generous financial donation. Please consult your tax advisor for your specific circumstances.";

type DonatePageProps = {
  searchParams: Promise<{ cancelled?: string; error?: string }>;
};

function getError(code?: string) {
  switch (code) {
    case "invalid-amount":
      return "Please choose or enter a valid donation amount.";
    case "stripe-not-configured":
      return "Online donations are not available right now. Please contact WIAL to arrange your gift.";
    case "checkout-failed":
      return "We could not start the checkout. Please try again in a moment.";
    default:
      return null;
  }
}

export default async function BetterWorldDonatePage({ searchParams }: DonatePageProps) {
  const [query, viewer, stripe] = await Promise.all([
    searchParams,
    getCurrentViewer(),
    getStripeClient(),
  ]);

  const errorMessage = getError(query.error);

  return (
    <div className="page-frame">
      <div className="site-shell">
        <section className="site-panel hero-panel-warm rounded-[2rem] p-7 md:p-10">
          <div className="space-y-5">
            <span className="eyebrow">WIAL Better World Fund</span>
            <div className="space-y-4">
              <h1 className="max-w-4xl font-display text-3xl leading-none tracking-[-0.05em] text-teal-deep md:text-5xl">
                Donate to the Better World Fund
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-foreground/82">
                Every contribution is multiplied through pro bono coaching and
                in-kind support — and goes directly to bringing Action
                Learning to community organizations.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="button-link secondary" href="/better-world">
                Back to the Better World Fund
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-5">
          {query.cancelled ? (
            <div className="account-flash">
              Your donation was cancelled. Nothing was charged.
            </div>
          ) : null}
          {errorMessage ? <div className="account-flash is-error">{errorMessage}</div> : null}

          {!stripe ? (
            <section className="site-panel rounded-[2rem] p-6 md:p-8">
              <h2 className="section-title text-teal-deep">
                Online donations are not available yet
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/75">
                WIAL is still setting up online donations on this platform.
                You can still give today through the WIAL website, or contact
                us directly and we will help you complete your gift.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="button-link primary" href="/contact">
                  Contact WIAL
                </Link>
                <a
                  className="button-link secondary"
                  href={LEGACY_DONATION_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  Donate on wial.org for now
                </a>
              </div>
            </section>
          ) : (
            <section className="grid gap-5">
              <p className="max-w-3xl text-base leading-7 text-foreground/75">
                {viewer
                  ? `You are signed in as ${viewer.email}. Your receipt will be sent to this address.`
                  : "You can donate as a guest. Sign in first if you would like the donation linked to your WIAL account."}
                {!viewer ? (
                  <>
                    {" "}
                    <Link
                      className="font-semibold text-teal"
                      href="/login?next=%2Fbetter-world%2Fdonate"
                    >
                      Sign in
                    </Link>
                  </>
                ) : null}
              </p>
              <DonationForm />
              <p className="max-w-3xl text-sm leading-6 text-foreground/60">{TAX_NOTICE}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
