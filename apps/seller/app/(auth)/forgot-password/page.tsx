"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

const API = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

export default function SellerForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API}/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Always confirm — never reveal whether the email exists.
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold tracking-tight">Perfect Fit</p>
          <h1 className="text-xl font-semibold text-gray-800 mt-4">Reset your password</h1>
          <p className="text-sm text-gray-500 mt-1">We&apos;ll email you a link to set a new one</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                If a seller account exists for <span className="font-medium text-gray-900">{email}</span>, we&apos;ve sent a reset link. Check your inbox (and spam).
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/login" className="font-semibold text-gray-800 hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
