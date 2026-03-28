import Link from 'next/link';
import { getTransactions } from '@/lib/transaction-store';

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

export default async function AdminPage() {
  const transactions = await getTransactions();
  const totalCount = transactions.length;
  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Admin</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Transaction History</h1>
            <p className="mt-2 text-sm text-gray-500">Incoming successful payments sorted newest-first.</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Transactions</p>
              <p className="text-xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{formatMoney(totalAmount, 'usd')}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No transactions recorded yet. Payments will appear here after Stripe sends the checkout completion webhook.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Due Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Session ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.sessionId} className="align-top">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(transaction.createdAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{transaction.dueType}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatMoney(transaction.amount, transaction.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{transaction.customerEmail || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
                          {transaction.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{transaction.sessionId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
