"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function ForgotPasswordPage() {
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
      // Always show the same confirmation — never reveal whether the email exists.
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
            <p className="text-gray-400 text-sm mt-1">We&apos;ll email you a link to set a new one</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {sent ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  If an account exists for <span className="font-medium text-gray-900">{email}</span>, we&apos;ve sent a password reset link. Check your inbox (and spam).
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm hover:bg-gray-800 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            )}
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
