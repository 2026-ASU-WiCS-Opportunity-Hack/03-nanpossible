import Link from 'next/link';

export default function Cancel() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Payment Cancelled</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">Your transaction was cancelled. No charges were made to your account. You can safely try again when you are ready.</p>
        <Link href="/" className="inline-block w-full bg-gray-100 text-gray-800 font-bold py-4 px-6 rounded-xl hover:bg-gray-200 transition-colors shadow-sm hover:shadow-md active:scale-95">
          Return Home
        </Link>
      </div>
    </main>
  );
}