"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

const API = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (pw !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pw }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok || json.error) { setError(json.error?.message ?? "Could not reset password"); setLoading(false); return; }
      router.push("/login?reset=1");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center text-sm text-gray-300">
        <p>This reset link is missing or invalid.</p>
        <Link href="/forgot-password" className="mt-3 inline-block font-semibold text-white hover:underline">Request a new link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm text-gray-300">New Password</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-500 pr-10"
            placeholder="Min. 8 characters"
          />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm text-gray-300">Confirm Password</label>
        <input
          type={show ? "text" : "password"}
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
        />
      </div>
      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-60"
      >
        {loading ? "Resetting…" : "Reset password"}
      </button>
    </form>
  );
}

export default function AdminResetPassword() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111111] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white">Set a new password</h1>
        </div>
        <div className="bg-[#1e1e1e] rounded-2xl p-6">
          <Suspense fallback={null}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
