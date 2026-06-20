import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { ItemDetailClient } from "@/components/catalogue/ItemDetailClient";
import type { CatalogueItem } from "@thread/types";

interface Props {
  params: Promise<{ slug: string }>;
}

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

// API wraps everything in { data: ... }
async function getItem(slug: string): Promise<CatalogueItem | null> {
  try {
    const res = await fetch(`${API_URL}/v1/items/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json() as { data: CatalogueItem };
    return json.data ?? null;
  } catch {
    return null;
  }
}

interface ReviewData {
  id: string; rating: number; title?: string | null; body: string;
  buyerName: string; verified: boolean; createdAt: string;
}
interface ReviewStats { count: number; average: number; breakdown: Record<number, number>; }

async function getReviews(slug: string): Promise<{ reviews: ReviewData[]; stats: ReviewStats }> {
  try {
    const res = await fetch(`${API_URL}/v1/items/${slug}/reviews`, { next: { revalidate: 30 } });
    if (!res.ok) return { reviews: [], stats: { count: 0, average: 0, breakdown: {} } };
    const json = await res.json() as { data: { reviews: ReviewData[]; stats: ReviewStats } };
    return json.data ?? { reviews: [], stats: { count: 0, average: 0, breakdown: {} } };
  } catch {
    return { reviews: [], stats: { count: 0, average: 0, breakdown: {} } };
  }
}

// List endpoint: { data: CatalogueItem[], meta: {...} }
async function getSimilar(item: CatalogueItem): Promise<CatalogueItem[]> {
  try {
    const res = await fetch(
      `${API_URL}/v1/items?category=${item.category}&limit=8`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const json = await res.json() as { data: CatalogueItem[] };
    const list: CatalogueItem[] = json.data ?? [];
    return list.filter((i) => i.id !== item.id).slice(0, 4);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItem(slug);
  if (!item) return { title: "Item not found" };
  return {
    title: `${item.title} — Perfect Fit`,
    description: item.description.slice(0, 160),
  };
}

export default async function ItemPage({ params }: Props) {
  const { slug } = await params;
  const item = await getItem(slug);
  if (!item) notFound();
  const [similar, { reviews, stats: reviewStats }] = await Promise.all([
    getSimilar(item),
    getReviews(slug),
  ]);

  return (
    <>
      <Header />
      <ItemDetailClient item={item} similar={similar} reviews={reviews} reviewStats={reviewStats} />
    </>
  );
}
