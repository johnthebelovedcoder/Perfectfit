/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  // Service workers are disabled in dev to avoid caching headaches during development.
  // Real offline behaviour only appears in a production build (next build && next start).
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Cache pages as the user navigates so previously-seen routes work offline.
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Served when a navigation request misses the cache while offline.
  fallbacks: {
    document: "/offline",
  },
  // Keep the default page/asset caching, but make catalogue/API reads NetworkFirst
  // so a freshly-published item shows up straight away instead of a stale cached
  // list. Falls back to cache only when the network is unavailable (offline).
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ url }) => /\/v1\/(items|search)/.test(url.href),
        handler: "NetworkFirst",
        options: {
          cacheName: "thread-catalogue-api",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 64, maxAgeSeconds: 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

const nextConfig = {
  images: {
    // Self-hosted: the on-demand /_next/image optimizer is unreliable in the
    // container, so serve images straight from the source CDN (Unsplash/Cloudinary
    // already deliver optimized, sized images).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["@thread/ui"],
  },
};

module.exports = withPWA(nextConfig);
