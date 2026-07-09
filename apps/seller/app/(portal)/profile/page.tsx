"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle, Mail, Phone, MapPin, Building2,
  Pencil, Lock, Package, Tag, DollarSign, Clock, AlertTriangle, Eye, EyeOff, X, Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@thread/utils";

interface SellerProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  isVerified: boolean;
  createdAt: string;
  user: { email: string; emailVerified: boolean };
  stats: { total: number; live: number; sold: number; pending: number; totalEarned: number };
}

function mask(s: string) {
  if (!s || s.length <= 4) return "****" + s.slice(-4);
  return "****" + s.slice(-4);
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

function Field({ label, value, hint }: { label: string; value?: string; hint?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || <span className="text-gray-300">—</span>}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function EditField({
  label, value, onChange, type = "text", placeholder, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !show ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-10"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) { setError("New passwords do not match"); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await api.patch("/auth/change-password", { currentPassword: current, newPassword: next });
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => { setSuccess(false); setOpen(false); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-3 border-b border-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="h-4 w-4 text-gray-300" />
          <div>
            <p className="text-sm font-medium text-gray-900">Password</p>
            <p className="text-xs text-gray-400">{success ? "Password updated!" : "Keep your account secure"}</p>
          </div>
        </div>
        <button
          onClick={() => { setOpen((v) => !v); setError(null); }}
          className="text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          {open ? "Cancel" : "Change Password"}
        </button>
      </div>
      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input type="password" placeholder="Current password" value={current}
            onChange={(e) => setCurrent(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <input type="password" placeholder="New password (min. 8 characters)" value={next}
            onChange={(e) => setNext(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <input type="password" placeholder="Confirm new password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60 transition-colors">
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}

type EditSection = "personal" | "payout" | null;

export default function ProfilePage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EditSection>(null);
  const [personal, setPersonal] = useState({ firstName: "", lastName: "", phone: "", city: "" });
  const [connecting, setConnecting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.get<SellerProfile>("/sellers/me"),
    staleTime: 5 * 60 * 1000,
  });

  const profile = data as unknown as SellerProfile | undefined;

  const personalMutation = useMutation({
    mutationFn: (dto: Record<string, string>) => api.patch<SellerProfile>("/sellers/me", dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-profile"] });
      setEditing(null);
    },
  });

  const { data: connectStatus } = useQuery({
    queryKey: ["connect-status"],
    queryFn: () => api.get<{ connected: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean }>("/sellers/me/connect/status"),
  });

  async function startConnect() {
    setConnecting(true);
    try {
      const { url } = await api.post<{ url: string }>("/sellers/me/connect", {});
      window.location.href = url;
    } catch {
      setConnecting(false);
    }
  }

  function startEditPersonal() {
    if (!profile) return;
    setPersonal({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone, city: profile.city });
    setEditing("personal");
  }


  if (isLoading) return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">
      <Skeleton className="h-8 w-40" />
      <div className="bg-white rounded-2xl p-6 space-y-4">
        <div className="flex gap-4"><Skeleton className="w-16 h-16 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-24" /></div></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="p-4 sm:p-8 text-sm text-gray-400">Could not load profile. Please try again.</div>
  );

  // Stats may be missing if the API hasn't been redeployed yet — provide safe defaults
  const safeStats = profile.stats ?? { total: 0, live: 0, sold: 0, pending: 0, totalEarned: 0 };

  const initials = `${profile.firstName?.[0] ?? "?"}${profile.lastName?.[0] ?? ""}`.toUpperCase();
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const STATS = [
    { label: "Submitted", value: safeStats.total, icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Live", value: safeStats.live, icon: Tag, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Sold", value: safeStats.sold, icon: Check, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Earned", value: formatPrice(safeStats.totalEarned), icon: DollarSign, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Pending", value: safeStats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Verification warning */}
      {!profile.isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Awaiting verification</p>
            <p className="text-xs text-amber-700 mt-0.5">Our team is reviewing your account. You&apos;ll be able to submit items once verified.</p>
          </div>
        </div>
      )}

      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cover strip */}
        <div className="h-16 bg-gradient-to-r from-gray-900 to-gray-700" />
        <div className="px-6 pb-6">
          {/* Avatar — pulled up over cover */}
          <div className="-mt-8 mb-4 flex items-end justify-between">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-white shadow-md flex items-center justify-center text-xl font-bold text-gray-700">
              {initials}
            </div>
            {profile.isVerified && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle className="h-3.5 w-3.5" /> Verified Seller
              </span>
            )}
          </div>

          <p className="text-lg font-bold text-gray-900">{profile.firstName} {profile.lastName}</p>
          <p className="text-xs text-gray-400 mt-0.5">Member since {memberSince}</p>

          {/* Stats row */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-5">
            {STATS.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
                <p className="text-base font-bold text-gray-900">{value}</p>
                <p className="text-[10px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-semibold text-gray-900">Personal Information</p>
            <p className="text-xs text-gray-400 mt-0.5">Your name and contact details</p>
          </div>
          {editing !== "personal" && (
            <button onClick={startEditPersonal}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
        </div>

        {editing === "personal" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EditField label="First Name" value={personal.firstName} onChange={(v) => setPersonal((p) => ({ ...p, firstName: v }))} />
              <EditField label="Last Name" value={personal.lastName} onChange={(v) => setPersonal((p) => ({ ...p, lastName: v }))} />
              <EditField label="Phone" value={personal.phone} onChange={(v) => setPersonal((p) => ({ ...p, phone: v }))} placeholder="+1 234 567 8900" />
              <EditField label="City" value={personal.city} onChange={(v) => setPersonal((p) => ({ ...p, city: v }))} />
            </div>
            {personalMutation.isError && <p className="text-xs text-red-500">{(personalMutation.error as Error).message}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => personalMutation.mutate(personal)}
                disabled={personalMutation.isPending}
                className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-black disabled:opacity-60 transition-colors">
                <Check className="h-3.5 w-3.5" /> {personalMutation.isPending ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditing(null)}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              <Field label="Email" value={profile.user.email} hint={profile.user.emailVerified ? "Verified" : "Not verified"} />
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              <Field label="Phone" value={profile.phone} />
            </div>
            <div className="flex items-start gap-3 col-span-2">
              <MapPin className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              <Field label="City" value={profile.city} />
            </div>
          </div>
        )}
      </div>

      {/* Payout Account — Stripe Connect */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <p className="font-semibold text-gray-900">Payout Account</p>
          <p className="text-xs text-gray-400 mt-0.5">Connect your bank securely through Stripe to receive payouts</p>
        </div>

        {connectStatus?.payoutsEnabled ? (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">Payout account connected & verified</p>
              <p className="text-xs text-emerald-700 mt-0.5">Stripe verified your bank and identity — you&apos;re ready to be paid.</p>
            </div>
            <button onClick={startConnect} disabled={connecting} className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900 shrink-0 disabled:opacity-50">
              Manage
            </button>
          </div>
        ) : connectStatus?.detailsSubmitted ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Clock className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Verification in progress</p>
                <p className="text-xs text-amber-700 mt-0.5">Stripe is reviewing your details. This usually only takes a few minutes.</p>
              </div>
            </div>
            <button onClick={startConnect} disabled={connecting}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-60 transition-colors">
              {connecting ? "Redirecting…" : "Continue verification"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
              <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-300" />
              <span>Stripe securely collects and <strong>verifies</strong> your bank details and identity — we never see or store your account number. Payouts are sent automatically when your items sell.</span>
            </div>
            <button onClick={startConnect} disabled={connecting}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-black disabled:opacity-60 transition-colors">
              {connecting ? "Redirecting…" : "Connect payout account"}
            </button>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="font-semibold text-gray-900 mb-1">Account Security</p>
        <p className="text-xs text-gray-400 mb-5">Manage your login credentials</p>
        <ChangePasswordSection />
        <div className="border-b border-gray-50 mb-0" />
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-xs text-gray-400">{profile.user.email}</p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${profile.user.emailVerified ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-amber-600 bg-amber-50 border-amber-200"}`}>
            {profile.user.emailVerified ? "Verified" : "Unverified"}
          </span>
        </div>
      </div>
    </div>
  );
}
