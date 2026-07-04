import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CurrencyDef {
  code: string;
  label: string;
  flag: string;
  /** Fallback USD→currency rate, used until live rates load. */
  fallback: number;
}

// Diaspora-focused set. Rates are refreshed live on load (see loadRates);
// the fallback values are only used offline / before the fetch resolves.
export const CURRENCIES: CurrencyDef[] = [
  { code: "USD", label: "US Dollar", flag: "🇺🇸", fallback: 1 },
  { code: "GBP", label: "British Pound", flag: "🇬🇧", fallback: 0.79 },
  { code: "EUR", label: "Euro", flag: "🇪🇺", fallback: 0.92 },
  { code: "CAD", label: "Canadian Dollar", flag: "🇨🇦", fallback: 1.37 },
  { code: "NGN", label: "Nigerian Naira", flag: "🇳🇬", fallback: 1550 },
  { code: "GHS", label: "Ghanaian Cedi", flag: "🇬🇭", fallback: 15 },
];

const FALLBACK_RATES: Record<string, number> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.fallback]),
);

interface CurrencyState {
  code: string;
  rates: Record<string, number>;
  setCode: (code: string) => void;
  loadRates: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      code: "USD",
      rates: FALLBACK_RATES,
      setCode: (code) => set({ code }),
      loadRates: async () => {
        try {
          // Free, no-key USD base rates.
          const res = await fetch("https://open.er-api.com/v6/latest/USD");
          if (!res.ok) return;
          const json = (await res.json()) as { rates?: Record<string, number> };
          if (!json.rates) return;
          const next: Record<string, number> = { ...get().rates };
          for (const c of CURRENCIES) {
            if (typeof json.rates[c.code] === "number") next[c.code] = json.rates[c.code]!;
          }
          set({ rates: next });
        } catch {
          // keep fallback rates
        }
      },
    }),
    { name: "pf_currency", partialize: (s) => ({ code: s.code }) },
  ),
);
