"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { getAuth } from "@/lib/auth";

export default function SecurityPage() {
  const auth = typeof window !== "undefined" ? getAuth() : null;
  const [enabled, setEnabled] = useState<boolean>(!!auth?.user?.mfaEnabled);

  const [setup, setSetup] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const startSetup = async () => {
    setError(null); setMsg(null); setBusy(true);
    try {
      const data = await api.post<{ qrDataUrl: string; secret: string }>("/auth/mfa/setup", {});
      setSetup(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to start setup"); }
    finally { setBusy(false); }
  };

  const enable = async () => {
    setError(null); setBusy(true);
    try {
      await api.post("/auth/mfa/enable", { code });
      setEnabled(true); setSetup(null); setCode(""); setMsg("MFA is now enabled. You'll be asked for a code at every login.");
    } catch (e) { setError(e instanceof Error ? e.message : "Invalid code"); }
    finally { setBusy(false); }
  };

  const disable = async () => {
    setError(null); setBusy(true);
    try {
      await api.post("/auth/mfa/disable", { code });
      setEnabled(false); setCode(""); setMsg("MFA has been disabled.");
    } catch (e) { setError(e instanceof Error ? e.message : "Invalid code"); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-4 sm:p-8 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <p className="text-gray-500 text-sm mt-1">Protect your admin account with two-factor authentication.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          {enabled ? <ShieldCheck className="h-6 w-6 text-emerald-500" /> : <ShieldOff className="h-6 w-6 text-gray-400" />}
          <div>
            <p className="font-semibold text-gray-900">Two-Factor Authentication (TOTP)</p>
            <p className="text-sm text-gray-500">{enabled ? "Enabled — a code is required at login." : "Not enabled."}</p>
          </div>
          <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            {enabled ? "On" : "Off"}
          </span>
        </div>

        {msg && <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{msg}</div>}
        {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>}

        {/* Not enabled, not mid-setup → offer to start */}
        {!enabled && !setup && (
          <button onClick={startSetup} disabled={busy}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-700 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enable 2FA
          </button>
        )}

        {/* Mid-setup → show QR + verify */}
        {!enabled && setup && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600">1. Scan this QR code with Google Authenticator, Authy, or 1Password:</p>
            <Image src={setup.qrDataUrl} alt="MFA QR code" width={160} height={160} className="rounded-lg border border-gray-100" unoptimized />
            <p className="text-xs text-gray-400">Or enter this key manually: <span className="font-mono text-gray-600">{setup.secret}</span></p>
            <p className="text-sm text-gray-600">2. Enter the 6-digit code to confirm:</p>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric" placeholder="000000"
                className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-gray-200" />
              <button onClick={enable} disabled={busy || code.length < 6}
                className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60">
                Verify & Enable
              </button>
            </div>
          </div>
        )}

        {/* Enabled → offer disable (requires a code) */}
        {enabled && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600">To disable 2FA, enter a current authenticator code:</p>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric" placeholder="000000"
                className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-gray-200" />
              <button onClick={disable} disabled={busy || code.length < 6}
                className="border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-60">
                Disable 2FA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
