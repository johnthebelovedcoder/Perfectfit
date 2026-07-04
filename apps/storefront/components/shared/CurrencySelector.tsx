"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrencyStore, CURRENCIES } from "@/stores/currency.store";

export function CurrencySelector() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const code = useCurrencyStore((s) => s.code);
  const setCode = useCurrencyStore((s) => s.setCode);
  const loadRates = useCurrencyStore((s) => s.loadRates);

  useEffect(() => {
    setMounted(true);
    void loadRates();
  }, [loadRates]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const active = CURRENCIES.find((c) => c.code === (mounted ? code : "USD")) ?? CURRENCIES[0]!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        aria-label="Change currency"
        aria-expanded={open}
      >
        <span>{active.flag}</span>
        <span className="hidden sm:inline font-medium">{active.code}</span>
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
          <p className="px-4 pt-1 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Display currency</p>
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => { setCode(c.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                c.code === active.code ? "text-gray-900 font-semibold" : "text-gray-600"
              }`}
            >
              <span>{c.flag}</span>
              <span className="flex-1 text-left">{c.label}</span>
              <span className="text-gray-400 text-xs">{c.code}</span>
            </button>
          ))}
          <p className="px-4 pt-2 text-[10px] text-gray-400 leading-snug border-t border-gray-50 mt-1">
            Indicative prices. Orders are charged in USD.
          </p>
        </div>
      )}
    </div>
  );
}
