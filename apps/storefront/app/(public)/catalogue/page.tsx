import type { Metadata } from "next";
import { Header } from "@/components/shared/Header";
import { CataloguePageClient } from "@/components/catalogue/CataloguePageClient";
import { CATEGORY_VALUES, categoryLabel } from "@thread/types";

interface Props {
  searchParams: Promise<{ category?: string; condition?: string; gender?: string; sort?: string; search?: string }>;
}

export const metadata: Metadata = { title: "Shop All — Perfect Fit" };

const CATEGORIES = [
  { value: "", label: "All Items" },
  ...CATEGORY_VALUES.map((value) => ({ value, label: categoryLabel(value) })),
];

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

// Server-fetch the first page so products render on first paint (no client waterfall).
async function getInitialItems(sp: { category?: string; condition?: string; gender?: string; sort?: string; search?: string }) {
  try {
    const params = new URLSearchParams();
    if (sp.category) params.set("category", sp.category);
    if (sp.condition) params.set("condition", sp.condition);
    if (sp.gender) params.set("genderTarget", sp.gender);
    if (sp.search) params.set("search", sp.search);
    if (sp.sort) params.set("sortBy", sp.sort);
    params.set("limit", "24");
    const res = await fetch(`${API_URL}/v1/items?${params.toString()}`, { next: { revalidate: 60 } });
    if (!res.ok) return undefined;
    return (await res.json()) as { data: unknown[]; meta: unknown };
  } catch {
    return undefined; // fall back to client fetch
  }
}

export default async function CataloguePage({ searchParams }: Props) {
  const { category, condition, gender, sort, search } = await searchParams;
  const initialData = await getInitialItems({ category, condition, gender, sort, search });

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-48 shrink-0">
            <div className="space-y-6">
              {/* Category */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Category</p>
                <div className="space-y-0.5">
                  {CATEGORIES.map(({ value, label }) => (
                    <a key={value}
                      href={value ? `/catalogue?category=${value}` : "/catalogue"}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        category === value || (!category && !value)
                          ? "bg-gray-100 font-medium text-gray-900"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Condition</p>
                <div className="space-y-0.5">
                  {[{ value: "BRAND_NEW", label: "Brand New" }, { value: "EXCELLENT", label: "Excellent" }, { value: "GOOD", label: "Good" }, { value: "FAIR", label: "Fair" }].map(({ value, label }) => (
                    <a key={value}
                      href={`/catalogue?${category ? `category=${category}&` : ""}condition=${value}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        condition === value
                          ? "bg-gray-100 font-medium text-gray-900"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* For */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">For</p>
                <div className="space-y-0.5">
                  {["Women", "Men", "Unisex"].map((g) => (
                    <a key={g}
                      href={`/catalogue?${category ? `category=${category}&` : ""}gender=${g.toUpperCase()}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        gender === g.toUpperCase()
                          ? "bg-gray-100 font-medium text-gray-900"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}>
                      {g}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <CataloguePageClient
              category={category}
              condition={condition}
              gender={gender}
              sort={sort}
              search={search}
              categoryLabel={search ? `Search: "${search}"` : (CATEGORIES.find(c => c.value === (category ?? ""))?.label ?? "All Items")}
              initialData={initialData as { data: never[]; meta: never } | undefined}
            />
          </div>
        </div>
      </main>
    </>
  );
}
