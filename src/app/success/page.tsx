import Link from 'next/link';
import { getStripeClient } from '@/lib/stripe';

type SuccessPageProps = {
  searchParams?: {
    session_id?: string | string[];
  };
};

function formatMoney(amountInCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

export default async function Success({ searchParams }: SuccessPageProps) {
  const sessionId = Array.isArray(searchParams?.session_id)
    ? searchParams?.session_id[0]
    : searchParams?.session_id;

  let sessionDetails: {
    dueType: string;
    amount: string;
    email: string;
    paidOn: string;
    paymentIntentId: string;
  } | null = null;

  if (sessionId) {
    try {
      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || 'n/a';

      sessionDetails = {
        dueType: session.metadata?.dueType || 'unknown',
        amount: formatMoney(session.amount_total || 0, session.currency || 'usd'),
        email: session.customer_details?.email || 'not provided',
        paidOn: new Date((session.created || Math.floor(Date.now() / 1000)) * 1000).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        paymentIntentId,
      };
    } catch {
      sessionDetails = null;
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Payment Successful!</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">Thank you for fulfilling your dues. Your payment has been securely processed and your receipt is ready to download.</p>

        {sessionId && (
          <a
            href={`/api/receipt?session_id=${encodeURIComponent(sessionId)}`}
            className="mb-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg transition-colors hover:bg-blue-700 hover:shadow-xl active:scale-95"
          >
            Download Receipt
          </a>
        )}

        {sessionDetails && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Payment Details</h2>
            <dl className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Due type</dt>
                <dd className="font-semibold">{sessionDetails.dueType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Amount</dt>
                <dd className="font-semibold">{sessionDetails.amount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-semibold">{sessionDetails.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Paid on</dt>
                <dd className="font-semibold">{sessionDetails.paidOn}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Payment intent</dt>
                <dd className="font-mono text-xs font-semibold">{sessionDetails.paymentIntentId}</dd>
              </div>
            </dl>
          </div>
        )}

        <Link href="/" className="inline-block w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl active:scale-95">
          Return Home
        </Link>
      </div>
    </main>
  );
}
