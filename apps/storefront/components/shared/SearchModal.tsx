"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getCloudinaryUrl } from "@thread/utils";
import { Price } from "./Price";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  brand?: string | null;
  retailPrice: number;
  photos: string[];
  condition: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounce(query, 300);

  // Focus on open + lock background scroll while the modal is open
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    setQuery("");
    setResults([]);
    setError(null);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Search on debounced query
  useEffect(() => {
    if (!debounced.trim()) { setResults([]); setError(null); return; }
    setLoading(true);
    setError(null);
    // Dedicated search endpoint: Algolia when configured, DB fallback otherwise.
    fetch(`${API_URL}/v1/search?q=${encodeURIComponent(debounced)}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((json) => {
        const items = (json as { data: SearchResult[] }).data ?? [];
        setResults(items);
      })
      .catch(() => { setResults([]); setError("Search failed. Check your connection and try again."); })
      .finally(() => setLoading(false));
  }, [debounced]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col items-center pt-16 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clothes, brands, styles…"
            className="flex-1 text-base outline-none text-gray-800 placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-sm text-gray-400">Searching…</div>
          )}

          {!loading && error && (
            <div className="p-8 text-center text-sm text-red-500">{error}</div>
          )}

          {!loading && !error && debounced && results.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">
              No results for &quot;{debounced}&quot;
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="divide-y divide-gray-50">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    href={`/item/${item.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {item.photos[0] && (
                        <Image
                          src={getCloudinaryUrl(item.photos[0], { width: 48, height: 56 })}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.brand && (
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{item.brand}</p>
                      )}
                      <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                      <Price cents={item.retailPrice} className="text-sm font-bold text-gray-900 mt-0.5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <Link
                  href={`/catalogue?search=${encodeURIComponent(debounced)}`}
                  onClick={onClose}
                  className="block w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  See all results for &quot;{debounced}&quot; →
                </Link>
              </div>
            </>
          )}

          {!debounced && (
            <div className="p-8 text-center text-sm text-gray-400">
              Start typing to search Perfect Fit…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
