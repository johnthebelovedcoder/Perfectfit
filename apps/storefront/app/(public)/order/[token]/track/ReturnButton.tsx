"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

export function ReturnButton({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit() {
    if (!reason.trim()) return;
    setState("pending");
    try {
      const res = await fetch(`${API_URL}/v1/orders/${token}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = await res.json() as { message?: string; error?: { message?: string } };
        throw new Error(body.error?.message ?? body.message ?? "Request failed");
      }
      setState("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700 font-medium">
        ✅ Return request submitted — we&apos;ll be in touch within 24 hours.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-orange-200 text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        Request Return
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-orange-200 bg-orange-50/50 p-5 space-y-3">
      <p className="text-sm font-semibold text-orange-900">Request a Return</p>
      <p className="text-xs text-orange-600">Returns are accepted within 48 hours of delivery. Tell us what&apos;s wrong.</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Item doesn't match description, wrong size received…"
        rows={3}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none bg-white"
      />
      {state === "error" && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setState("idle"); }}
          className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!reason.trim() || state === "pending"}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          {state === "pending" ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </div>
  );
}
