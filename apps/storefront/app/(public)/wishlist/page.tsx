import type { Metadata } from "next";
import { Header } from "@/components/shared/Header";
import { WishlistClient } from "@/components/catalogue/WishlistClient";
import { Footer } from "@/components/shared/Footer";

export const metadata: Metadata = { title: "Wishlist — Perfect Fit" };

export default function WishlistPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 min-h-[60vh]">
        <WishlistClient />
      </main>
      <Footer />
    </>
  );
}
