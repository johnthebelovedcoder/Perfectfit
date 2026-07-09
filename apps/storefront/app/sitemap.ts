import type { MetadataRoute } from "next";

const SITE_URL = process.env["NEXT_PUBLIC_STOREFRONT_URL"] ?? "https://perfectfithq.com";
const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

// Static, indexable marketing/content routes.
const STATIC_PATHS = [
  "",
  "/catalogue",
  "/how-it-works",
  "/become-a-seller",
  "/seller-faq",
  "/quality-promise",
  "/returns-policy",
  "/terms",
  "/privacy",
  "/cookies",
  "/contact",
];

interface CatalogueItem {
  slug: string;
  updatedAt?: string;
}

async function fetchItems(): Promise<CatalogueItem[]> {
  try {
    // Pull a large page of live items; sitemap regenerates daily.
    const res = await fetch(`${API_URL}/v1/items?limit=1000`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: CatalogueItem[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/catalogue" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/catalogue" ? 0.9 : 0.5,
  }));

  const items = await fetchItems();
  const itemEntries: MetadataRoute.Sitemap = items
    .filter((i) => i.slug)
    .map((i) => ({
      url: `${SITE_URL}/item/${i.slug}`,
      lastModified: i.updatedAt ? new Date(i.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticEntries, ...itemEntries];
}
