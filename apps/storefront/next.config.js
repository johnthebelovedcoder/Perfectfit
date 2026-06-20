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
});

const nextConfig = {
  images: {
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
