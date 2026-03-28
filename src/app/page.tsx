'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [selectedDue, setSelectedDue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!selectedDue) {
      alert('Please select a due to pay.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueType: selectedDue }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to create checkout session.');
      }

      const session = await response.json();

      if (session.error) {
        alert(`Checkout Error: ${session.error}`);
        return;
      }

      if (session.url) {
        window.location.href = session.url;
        return;
      }

      throw new Error('Checkout session did not include a redirect URL.');
    } catch (err) {
      console.error(err);
      alert('An error occurred during checkout.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">NaNpossible</p>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pay Your Dues</h1>
          </div>
          <Link
            href="/admin"
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Admin View
          </Link>
        </div>
        <p className="text-center text-gray-500 mb-8 text-sm">Select a category below to continue to secure checkout.</p>

        <div className="space-y-4 mb-8">
          {[
            { id: 'annual', label: 'Annual Fee', price: '$100.00', desc: 'Yearly membership subscription' },
            { id: 'workshop', label: 'Workshop Event', price: '$50.00', desc: 'Entry to our specialized training' },
            { id: 'certification', label: 'Certification Fee', price: '$200.00', desc: 'Official certification testing' },
          ].map((due) => (
            <div
              key={due.id}
              onClick={() => setSelectedDue(due.id)}
              className={`p-5 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-center ${
                selectedDue === due.id
                  ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md transform scale-[1.02]'
                  : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-lg">{due.label}</span>
                <span className="font-bold text-lg">{due.price}</span>
              </div>
              <span className={`text-sm ${selectedDue === due.id ? 'text-blue-700' : 'text-gray-500'}`}>{due.desc}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleCheckout}
          disabled={!selectedDue || isLoading}
          className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95 flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Proceed to Checkout'
          )}
        </button>
      </div>
    </main>
  );
}
