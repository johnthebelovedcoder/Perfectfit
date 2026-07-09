import type { MetadataRoute } from "next";

const SITE_URL = process.env["NEXT_PUBLIC_STOREFRONT_URL"] ?? "https://perfectfithq.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private / transactional routes should not be indexed.
      disallow: ["/checkout", "/cart", "/wishlist", "/account", "/auth", "/order"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
