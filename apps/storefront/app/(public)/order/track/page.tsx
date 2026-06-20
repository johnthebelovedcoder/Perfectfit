"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Search } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export default function OrderTrackPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) { setError("Please enter your order token."); return; }
    router.push(`/order/${t}/track`);
  };

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <Package className="h-7 w-7 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-400 text-sm mb-8">
            Enter the order tracking token from your confirmation email.
          </p>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Order Token
              </label>
              <input
                value={token}
                onChange={(e) => { setToken(e.target.value); setError(null); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
                placeholder="e.g. abc123xyz"
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
              <p className="mt-1 text-xs text-gray-400">
                Found in your order confirmation email
              </p>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm hover:bg-gray-800 transition-colors"
            >
              <Search className="h-4 w-4" />
              Track Order
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
