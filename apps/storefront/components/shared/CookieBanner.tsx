"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, ChevronDown, ChevronUp } from "lucide-react";

type ConsentState = {
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "pf_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    preferences: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  function save(c: ConsentState & { essential: true }) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...c, savedAt: Date.now() }));
    } catch { /* */ }
    setVisible(false);
  }

  function acceptAll() {
    save({ essential: true, analytics: true, preferences: true, marketing: true });
  }

  function rejectAll() {
    save({ essential: true, analytics: false, preferences: false, marketing: false });
  }

  function saveChoices() {
    save({ essential: true, ...consent });
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="mx-auto max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-black/10 pointer-events-auto">
        {/* Main row */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
              <Cookie className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">We use cookies</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                We use essential cookies to keep the site working, and optional ones to improve your experience and show relevant content.{" "}
                <Link href="/cookies" className="underline hover:text-gray-800">Cookie Policy</Link>
                {" · "}
                <Link href="/privacy" className="underline hover:text-gray-800">Privacy</Link>
              </p>
            </div>
            <button
              onClick={rejectAll}
              aria-label="Dismiss — reject non-essential"
              className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Expanded preferences */}
          {expanded && (
            <div className="mt-4 space-y-2 border-t border-gray-50 pt-4">
              {/* Essential — always on */}
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Essential</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Login, cart, security — always required</p>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">Always on</span>
              </div>

              {(
                [
                  { key: "analytics", label: "Analytics", desc: "Help us understand how you use the site (anonymised)" },
                  { key: "preferences", label: "Preferences", desc: "Remember your currency, recently viewed items" },
                  { key: "marketing", label: "Marketing", desc: "Personalised ads on other platforms" },
                ] as { key: keyof ConsentState; label: string; desc: string }[]
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={consent[key]}
                    onClick={() => setConsent((p) => ({ ...p, [key]: !p[key] }))}
                    className={`relative w-9 h-5 rounded-full transition-colors ${consent[key] ? "bg-gray-900" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${consent[key] ? "left-4" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              onClick={acceptAll}
              className="bg-gray-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Accept all
            </button>
            <button
              onClick={rejectAll}
              className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Reject non-essential
            </button>
            {expanded && (
              <button
                onClick={saveChoices}
                className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Save my choices
              </button>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              {expanded ? "Less" : "Manage"} {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
