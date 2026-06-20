import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're offline",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">You&apos;re offline</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          This page hasn&apos;t been saved for offline use yet. Pages and items you&apos;ve already
          viewed are still available, and your cart is saved.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-gray-700 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </main>
  );
}
