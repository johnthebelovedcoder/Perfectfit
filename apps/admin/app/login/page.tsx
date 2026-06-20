"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoginSchema } from "@thread/types";
import { setAuth } from "@/lib/auth";
import type { Login } from "@thread/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Login>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: Login) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, totpCode: mfaRequired ? totpCode : undefined }),
      });
      const json = await res.json() as { data?: { accessToken: string; refreshToken: string; user: { role: string; id: string; email: string; emailVerified: boolean; mfaEnabled: boolean } }; error?: { message: string; code?: string } };

      if (!res.ok || json.error) {
        const code = json.error?.code;
        if (code === "MFA_REQUIRED") { setMfaRequired(true); setError(null); return; }
        if (code === "MFA_INVALID") { setMfaRequired(true); setError("Invalid authenticator code — try again"); return; }
        setError(json.error?.message ?? "Invalid credentials");
        return;
      }
      if (json.data?.user.role !== "ADMIN") { setError("Access restricted to Perfect Fit admin accounts"); return; }

      setAuth({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken, user: json.data.user });
      const from = searchParams.get("from") ?? "/dashboard";
      router.push(from);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111111]">
      <div className="w-full max-w-sm px-4">
        {/* Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] flex items-center justify-center mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">Admin Login</h1>
          <p className="text-sm text-gray-400 mt-1">Perfect Fit operations dashboard</p>
        </div>

        <div className="bg-[#1e1e1e] rounded-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-300">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 border border-[#3a3a3a] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                  placeholder="admin@thread.com"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-300">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 border border-[#3a3a3a] rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-gray-500"
                  placeholder="••••••••••••"
                  {...register("password")}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {mfaRequired && (
              <div className="space-y-1.5">
                <label className="text-sm text-gray-300">Authenticator code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm tracking-[0.4em] text-center focus:outline-none focus:border-gray-500"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-xs text-gray-500">Enter the 6-digit code from your authenticator app.</p>
              </div>
            )}

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

            <button
              type="submit"
              disabled={isSubmitting || (mfaRequired && totpCode.length < 6)}
              className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : mfaRequired ? "Verify & Sign In" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6">
          <Link href={`${process.env["NEXT_PUBLIC_SELLER_URL"] ?? "http://localhost:3002"}/login`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Seller Login
          </Link>
        </p>
      </div>
    </main>
  );
}
