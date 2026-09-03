import Link from "next/link";
import { AccountPageShell } from "@/components/account-page-shell";
import { requireAccountViewer } from "@/lib/auth";
import {
  getStripeConfigStatus,
  listPaymentTypes,
  listRecentPayments,
} from "@/lib/payments";
import { formatMinorAmount, SUPPORTED_CURRENCIES } from "@/lib/payments-format";
import type { PaymentType } from "@/lib/types";
import {
  archivePaymentTypeAction,
  clearStripeKeyAction,
  createPaymentTypeAction,
  saveStripeKeyAction,
} from "./actions";

type PaymentsAdminPageProps = {
  searchParams: Promise<{ notice?: string; error?: string }>;
};

function getNotice(notice?: string) {
  switch (notice) {
    case "key-saved":
      return "Stripe key saved. Visitors can now pay on /pay.";
    case "key-cleared":
      return "Stored Stripe key removed.";
    case "type-created":
      return "Payment type created in Stripe.";
    case "type-archived":
      return "Payment type archived. It no longer appears on /pay.";
    default:
      return null;
  }
}

function getError(error?: string) {
  switch (error) {
    case "invalid-key":
      return "That does not look like a Stripe secret key. It should start with sk_test_, sk_live_, rk_test_, or rk_live_.";
    case "key-rejected":
      return "Stripe rejected that key. Check that you copied the full secret key from the Stripe Dashboard.";
    case "save-failed":
      return "WIAL could not store the key. Check the Supabase service-role configuration.";
    case "stripe-not-configured":
      return "Connect a Stripe key first.";
    case "name-required":
      return "Give the payment type a name.";
    case "invalid-amount":
      return "Enter an amount greater than zero, for example 150 or 150.50.";
    case "invalid-currency":
      return "Choose one of the listed currencies.";
    case "stripe-failed":
      return "Stripe did not accept that change. Please try again.";
    default:
      return null;
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

export default async function PaymentsAdminPage({ searchParams }: PaymentsAdminPageProps) {
  await requireAccountViewer("/admin/global/payments", ["platform_admin"]);
  const [query, status] = await Promise.all([searchParams, getStripeConfigStatus()]);

  let paymentTypes: PaymentType[] = [];
  let stripeUnreachable = false;
  if (status.configured) {
    try {
      paymentTypes = await listPaymentTypes();
    } catch (error) {
      console.error("Could not list Stripe prices:", error);
      stripeUnreachable = true;
    }
  }
  const payments = await listRecentPayments(25);

  const notice = getNotice(query.notice);
  const errorMessage = getError(query.error);
  const dashboardBase = status.mode === "live" ? "https://dashboard.stripe.com" : "https://dashboard.stripe.com/test";

  return (
    <AccountPageShell
      badge="Stripe"
      description="Connect WIAL's Stripe account, decide what visitors can pay for on the public payment page, and review recent payments."
      eyebrow="Global admin"
      title="Payments"
    >
      {notice ? <div className="account-flash is-success">{notice}</div> : null}
      {errorMessage ? <div className="account-flash is-error">{errorMessage}</div> : null}

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">Stripe connection</p>
            <p className="text-base leading-7 text-foreground/75">
              {status.configured
                ? `Connected with a ${status.mode ?? "Stripe"} key ending in ${status.lastFour ?? "????"}${
                    status.source === "env"
                      ? ", read from the STRIPE_SECRET_KEY environment variable."
                      : ", stored securely in this platform."
                  }`
                : "No Stripe key is configured. Visitors see a “payments not available yet” notice on /pay until you add one."}
            </p>
            {status.configured && status.mode === "test" ? (
              <p className="text-sm text-foreground/60">
                This is a test-mode key: cards are not really charged. Paste a live key when you are ready to take real payments.
              </p>
            ) : null}
          </div>
          <Link className="button-link secondary" href="/pay" rel="noreferrer" target="_blank">
            View the public payment page
          </Link>
        </div>

        <form action={saveStripeKeyAction} className="mt-6 grid gap-4">
          <label className="field-shell">
            <span className="field-label">
              {status.configured ? "Replace the Stripe secret key" : "Stripe secret key"}
            </span>
            <input
              autoComplete="off"
              className="field-input"
              name="secretKey"
              placeholder="sk_live_…"
              required
              type="password"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
              Found in the Stripe Dashboard under Developers → API keys. The key is verified with Stripe, then stored encrypted; it is never shown again.
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button className="button-link primary" type="submit">
              Save key
            </button>
          </div>
        </form>
        {status.configured && status.source === "vault" ? (
          <form action={clearStripeKeyAction} className="mt-4">
            <button className="button-link ghost" type="submit">
              Remove stored key
            </button>
          </form>
        ) : null}
      </section>

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">Payment types</p>
            <p className="max-w-2xl text-base leading-7 text-foreground/75">
              Each payment type is a product with a one-time price in Stripe. Add them here or in the Stripe Dashboard; both show up on /pay within a minute.
            </p>
          </div>
          {status.configured ? (
            <a
              className="button-link secondary"
              href={`${dashboardBase}/products`}
              rel="noreferrer"
              target="_blank"
            >
              Open products in Stripe
            </a>
          ) : null}
        </div>

        {stripeUnreachable ? (
          <div className="account-flash is-error mt-5">
            Stripe rejected the stored key or did not respond. Replace the key above and try again.
          </div>
        ) : null}

        {paymentTypes.length > 0 ? (
          <ul className="mt-6 grid gap-3">
            {paymentTypes.map((paymentType) => (
              <li
                className="feature-card flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem]"
                key={paymentType.priceId}
              >
                <div className="min-w-0 space-y-1">
                  <h3>{paymentType.name}</h3>
                  {paymentType.description ? (
                    <p className="text-sm">{paymentType.description}</p>
                  ) : null}
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
                    {paymentType.nickname ? `${paymentType.nickname} · ` : ""}
                    {paymentType.priceId}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-display text-2xl text-teal-deep">
                    {formatMinorAmount(paymentType.amount, paymentType.currency)}
                  </p>
                  <form action={archivePaymentTypeAction}>
                    <input name="productId" type="hidden" value={paymentType.productId} />
                    <button className="button-link ghost" type="submit">
                      Archive
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : status.configured && !stripeUnreachable ? (
          <p className="mt-6 text-base text-foreground/70">
            No active payment types yet. Add the first one below, for example annual membership dues.
          </p>
        ) : null}

        {status.configured ? (
          <form action={createPaymentTypeAction} className="mt-8 grid gap-4 border-t border-line pt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/55">
              Add a payment type
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="field-shell md:col-span-2">
                <span className="field-label">Name</span>
                <input className="field-input" name="name" placeholder="Annual membership dues" required type="text" />
              </label>
              <label className="field-shell md:col-span-2">
                <span className="field-label">Description</span>
                <input
                  className="field-input"
                  name="description"
                  placeholder="Shown to the payer on /pay and on their receipt"
                  type="text"
                />
              </label>
              <label className="field-shell">
                <span className="field-label">Amount</span>
                <input className="field-input" inputMode="decimal" name="amount" placeholder="150.00" required type="text" />
              </label>
              <label className="field-shell">
                <span className="field-label">Currency</span>
                <select className="field-input" defaultValue="usd" name="currency">
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <button className="button-link primary" type="submit">
                Create payment type
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <p className="eyebrow">Recent payments</p>
        {payments.length === 0 ? (
          <p className="mt-4 text-base text-foreground/70">
            No payments recorded yet. Completed checkouts on /pay appear here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Payer</th>
                  <th className="py-2 pr-4">Paid for</th>
                  <th className="py-2 pr-4 text-right">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr className="border-t border-line" key={payment.stripeSessionId}>
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(payment.paidAt)}</td>
                    <td className="py-3 pr-4">
                      <div>{payment.payerName ?? "—"}</div>
                      <div className="text-xs text-foreground/55">{payment.payerEmail ?? ""}</div>
                    </td>
                    <td className="py-3 pr-4">{payment.productName}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-teal-deep">
                      {formatMinorAmount(payment.amount, payment.currency)}
                    </td>
                    <td className="py-3 capitalize">{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AccountPageShell>
  );
}
