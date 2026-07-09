import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@thread/ui/globals.css";
import { Providers } from "./providers";
import { CookieBanner } from "@/components/shared/CookieBanner";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { Analytics } from "@/components/shared/Analytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = process.env["NEXT_PUBLIC_STOREFRONT_URL"] ?? "https://perfectfithq.com";
const TITLE = "Perfect Fit — Curated Fashion";
const DESCRIPTION = "Shop curated thrift and new fashion. Quality checked, fast delivery.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Perfect Fit",
  },
  description: DESCRIPTION,
  applicationName: "Perfect Fit",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Perfect Fit",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          <OfflineBanner />
          {children}
          <CookieBanner />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
