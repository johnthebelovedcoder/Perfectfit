"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

const API = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

export default function AdminForgotPassword() {
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
    <main className="flex min-h-screen items-center justify-center bg-[#111111] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white">Reset your password</h1>
          <p className="text-sm text-gray-400 mt-1">Perfect Fit admin access</p>
        </div>
        <div className="bg-[#1e1e1e] rounded-2xl p-6">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
                <Mail className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                If an admin account exists for <span className="font-medium text-white">{email}</span>, we&apos;ve sent a reset link.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                  placeholder="admin@perfectfit.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>
        <p className="text-center mt-6">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
