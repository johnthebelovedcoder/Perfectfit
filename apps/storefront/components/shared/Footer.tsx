import Link from "next/link";

const SELLER_URL = process.env["NEXT_PUBLIC_SELLER_URL"] ?? "http://localhost:3002";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 border-t border-white/5 py-12 px-4">
      <div className="container mx-auto grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8">
        <div className="col-span-2 sm:col-span-1">
          <p className="font-bold text-white text-lg mb-3">Perfect Fit</p>
          <p className="text-sm leading-relaxed">
            Curated fashion marketplace. Every piece inspected, every listing approved.
          </p>
        </div>
        {[
          {
            title: "SHOP",
            links: [
              ["All Items", "/catalogue"],
              ["Women's African Wear", "/catalogue?category=WOMENS_AFRICAN_WEAR"],
              ["Men's African Wear", "/catalogue?category=MENS_AFRICAN_WEAR"],
              ["Ankara Outfits", "/catalogue?category=ANKARA_OUTFITS"],
              ["Lace Outfits", "/catalogue?category=LACE_OUTFITS"],
              ["Shoes & Bags", "/catalogue?category=SHOES_BAGS"],
            ],
          },
          {
            title: "ABOUT",
            links: [
              ["How It Works", "/how-it-works"],
              ["Quality Promise", "/quality-promise"],
              ["Returns Policy", "/returns-policy"],
              ["Contact Us", "/contact"],
            ],
          },
          {
            title: "SELL WITH US",
            links: [
              ["Become a Seller", "/become-a-seller"],
              ["Seller Login", `${SELLER_URL}/login`],
              ["Seller FAQ", "/seller-faq"],
            ],
          },
        ].map(({ title, links }) => (
          <div key={title}>
            <p className="font-semibold text-white text-xs uppercase tracking-widest mb-3">{title}</p>
            <ul className="space-y-2">
              {links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container mx-auto mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs flex-wrap gap-3">
        <p>© {new Date().getFullYear()} Perfect Fit. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/cookies" className="hover:text-white">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
