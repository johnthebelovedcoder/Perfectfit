"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Search, Eye, Globe, EyeOff, Plus, X, Trash2, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { getCloudinaryUrl, formatPrice } from "@thread/utils";
import {
  CATEGORY_VALUES,
  categoryLabel,
  CONDITION_VALUES,
  conditionLabel,
  GENDER_VALUES,
  genderLabel,
} from "@thread/types";
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { QueryError } from "@/components/shared/QueryError";

interface AdminItem {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  category: string;
  size: string;
  condition: string;
  photos: string[];
  retailPrice: number;
  agreedPayoutPrice: number;
  isLive: boolean;
  soldAt: string | null;
  createdAt: string;
  submission?: { seller?: { firstName: string; lastName: string } | null } | null;
}

function marginPct(retail: number, payout: number) {
  if (!retail) return 0;
  return Math.round(((retail - payout) / retail) * 100);
}

const CATEGORY_OPTIONS = ["All", ...CATEGORY_VALUES];

const BLANK_FORM = { title: "", brand: "", category: CATEGORY_VALUES[0] as string, itemType: "", size: "", genderTarget: "UNISEX", condition: "EXCELLENT", description: "", retailPrice: "", agreedPayoutPrice: "", photos: [] as string[] };

export default function CataloguePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft" | "sold" | "archived">("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-items-all"],
    queryFn: () => api.get<AdminItem[]>("/items/admin-catalogue?limit=200"),
    refetchInterval: 30_000,
  });

  const { data: archivedData, isLoading: archivedLoading } = useQuery({
    queryKey: ["admin-items-archived"],
    queryFn: () => api.get<AdminItem[]>("/items/archived?limit=200"),
  });

  const items = data ?? [];
  const archivedItems = archivedData ?? [];

  const [mutationError, setMutationError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<AdminItem | null>(null);

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post<unknown>(`/items/${id}/publish`, {}),
    onSuccess: () => { setMutationError(null); void qc.invalidateQueries({ queryKey: ["admin-items-all"] }); },
    onError: (err: unknown) => setMutationError(err instanceof Error ? err.message : "Failed to publish item"),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => api.post<unknown>(`/items/${id}/unpublish`, {}),
    onSuccess: () => { setMutationError(null); void qc.invalidateQueries({ queryKey: ["admin-items-all"] }); },
    onError: (err: unknown) => setMutationError(err instanceof Error ? err.message : "Failed to unpublish item"),
  });

  const addMutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) => api.post<unknown>("/items/direct", dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-items-all"] });
      setShowAdd(false);
      setForm({ ...BLANK_FORM });
      setFormError(null);
    },
    onError: (err: unknown) => setFormError(err instanceof Error ? err.message : "Failed to create item"),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/items/${id}`),
    onSuccess: () => {
      setMutationError(null); setConfirmArchive(null);
      void qc.invalidateQueries({ queryKey: ["admin-items-all"] });
      void qc.invalidateQueries({ queryKey: ["admin-items-archived"] });
    },
    onError: (err: unknown) => setMutationError(err instanceof Error ? err.message : "Failed to archive item"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.post<unknown>(`/items/${id}/restore`, {}),
    onSuccess: () => {
      setMutationError(null);
      void qc.invalidateQueries({ queryKey: ["admin-items-all"] });
      void qc.invalidateQueries({ queryKey: ["admin-items-archived"] });
    },
    onError: (err: unknown) => setMutationError(err instanceof Error ? err.message : "Failed to restore item"),
  });

  const matchesSearchCat = (i: AdminItem) => {
    const matchCat = catFilter === "All" || i.category === catFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || i.title.toLowerCase().includes(q) || (i.brand ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  };

  const isArchivedView = statusFilter === "archived";

  const filtered = (isArchivedView ? archivedItems : items).filter((i) => {
    if (!matchesSearchCat(i)) return false;
    if (isArchivedView) return true;
    return (
      statusFilter === "all" ||
      (statusFilter === "live" && i.isLive && !i.soldAt) ||
      (statusFilter === "draft" && !i.isLive && !i.soldAt) ||
      (statusFilter === "sold" && !!i.soldAt)
    );
  });

  const counts = {
    all: items.length,
    live: items.filter((i) => i.isLive && !i.soldAt).length,
    draft: items.filter((i) => !i.isLive && !i.soldAt).length,
    sold: items.filter((i) => !!i.soldAt).length,
    archived: archivedItems.length,
  };

  return (
    <>
    <div className="p-4 sm:p-8 space-y-6">
      {isError && <QueryError onRetry={() => void refetch()} />}
      {mutationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all items — publish drafts to make them visible on the storefront</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["all", "live", "draft", "sold", "archived"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              statusFilter === s
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {s} <span className="ml-1 text-xs text-gray-400">({counts[s]})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by title or brand..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c === "All" ? "All Categories" : categoryLabel(c)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {(isArchivedView ? archivedLoading : isLoading) ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading catalogue…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">Item</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Retail</th>
                <th className="text-left px-4 py-3 font-medium">Margin</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const photo = item.photos[0];
                const payout = item.agreedPayoutPrice ?? 0;
                const margin = marginPct(item.retailPrice, payout);
                const isPending = publishMutation.isPending || unpublishMutation.isPending;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-8 shrink-0 rounded-md overflow-hidden bg-gray-100">
                          {photo && (
                            <Image
                              src={getCloudinaryUrl(photo, { width: 64, height: 80 })}
                              alt=""
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                          <p className="text-xs text-gray-400">
                            {item.brand ?? "—"} · Size {item.size}
                            {item.submission?.seller && (
                              <span className="ml-1 text-gray-300">
                                · {item.submission.seller.firstName} {item.submission.seller.lastName}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {categoryLabel(item.category)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{formatPrice(item.retailPrice)}</p>
                      <p className="text-xs text-gray-400">Payout: {formatPrice(payout)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-emerald-600">{formatPrice(item.retailPrice - payout)}</p>
                      <p className="text-xs text-gray-400">{margin}%</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          isArchivedView ? "bg-gray-300" : item.soldAt ? "bg-gray-400" : item.isLive ? "bg-emerald-500" : "bg-amber-400"
                        }`} />
                        <span className={`text-xs font-medium ${
                          isArchivedView ? "text-gray-400" : item.soldAt ? "text-gray-500" : item.isLive ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          {isArchivedView ? "Archived" : item.soldAt ? "Sold" : item.isLive ? "Live" : "Draft"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isArchivedView ? (
                          <button
                            onClick={() => restoreMutation.mutate(item.id)}
                            disabled={restoreMutation.isPending}
                            title="Restore to catalogue (as draft)"
                            className="flex items-center gap-1 text-xs border border-gray-200 text-gray-700 hover:bg-gray-50 px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" /> Restore
                          </button>
                        ) : (
                        <>
                        <a
                          href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"}/item/${item.slug}`}
                          target="_blank"
                          className="text-gray-400 hover:text-gray-600"
                          title="View on storefront"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        {!item.soldAt && (
                          item.isLive ? (
                            <button
                              onClick={() => unpublishMutation.mutate(item.id)}
                              disabled={isPending}
                              title="Unpublish (hide from storefront)"
                              className="flex items-center gap-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors"
                            >
                              <EyeOff className="h-3 w-3" /> Unpublish
                            </button>
                          ) : (
                            <button
                              onClick={() => publishMutation.mutate(item.id)}
                              disabled={isPending}
                              title="Publish to storefront"
                              className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors"
                            >
                              <Globe className="h-3 w-3" /> Publish
                            </button>
                          )
                        )}
                        {!item.soldAt && (
                          <button
                            onClick={() => setConfirmArchive(item)}
                            title="Archive (remove from catalogue)"
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">No items found</div>
        )}
      </div>
    </div>

      {/* Archive confirmation */}
      {confirmArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Archive this item?</h2>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium text-gray-700">{confirmArchive.title}</span> will be removed from the storefront and catalogue. Order history is kept, and support can restore it if needed.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmArchive(null)}
                disabled={archiveMutation.isPending}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => archiveMutation.mutate(confirmArchive.id)}
                disabled={archiveMutation.isPending}
                className="px-5 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                {archiveMutation.isPending ? "Archiving…" : "Archive Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Add Item to Catalogue</h2>
                <p className="text-xs text-gray-400 mt-0.5">Goes live on the storefront as soon as you create it</p>
              </div>
              <button onClick={() => { setShowAdd(false); setForm({ ...BLANK_FORM }); setFormError(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-5">
              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                <PhotoUpload value={form.photos} onChange={(ids) => setForm((f) => ({ ...f, photos: ids }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" placeholder="e.g. Zara Slim Fit Chinos" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Brand (optional)</label>
                  <input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" placeholder="e.g. Zara" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item Type</label>
                  <input value={form.itemType} onChange={(e) => setForm((f) => ({ ...f, itemType: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" placeholder="e.g. Chinos, Dress, Sneaker" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
                    {CATEGORY_VALUES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                  <input value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" placeholder="e.g. M, 32, 42" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                  <select value={form.genderTarget} onChange={(e) => setForm((f) => ({ ...f, genderTarget: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
                    {GENDER_VALUES.map((g) => <option key={g} value={g}>{genderLabel(g)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
                  <select value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
                    {CONDITION_VALUES.map((c) => <option key={c} value={c}>{conditionLabel(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Retail Price ($)</label>
                  <input type="number" min="0" value={form.retailPrice} onChange={(e) => setForm((f) => ({ ...f, retailPrice: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" placeholder="e.g. 120" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payout Price ($)</label>
                  <input type="number" min="0" value={form.agreedPayoutPrice} onChange={(e) => setForm((f) => ({ ...f, agreedPayoutPrice: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" placeholder="e.g. 0 for house items" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none" placeholder="Describe the item condition, style, fit…" />
                </div>
              </div>

              {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => { setShowAdd(false); setForm({ ...BLANK_FORM }); setFormError(null); }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                disabled={addMutation.isPending || !form.title || !form.itemType || !form.size || !form.description || form.photos.length === 0}
                onClick={() => {
                  const retail = Math.round(parseFloat(form.retailPrice as unknown as string) * 100);
                  const payout = Math.round(parseFloat((form.agreedPayoutPrice || "0") as unknown as string) * 100);
                  if (isNaN(retail) || retail <= 0) { setFormError("Enter a valid retail price"); return; }
                  addMutation.mutate({
                    title: form.title, brand: form.brand || undefined, category: form.category,
                    itemType: form.itemType, size: form.size, genderTarget: form.genderTarget,
                    condition: form.condition, description: form.description, photos: form.photos,
                    retailPrice: retail, agreedPayoutPrice: isNaN(payout) ? 0 : payout,
                  });
                }}
                className="px-5 py-2 text-sm font-medium bg-gray-900 hover:bg-gray-700 text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                {addMutation.isPending ? "Publishing…" : "Create & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
