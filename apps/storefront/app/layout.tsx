import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@thread/ui/globals.css";
import { Providers } from "./providers";
import { CookieBanner } from "@/components/shared/CookieBanner";
import { OfflineBanner } from "@/components/shared/OfflineBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Perfect Fit — Curated Fashion",
    template: "%s | Perfect Fit",
  },
  description: "Shop curated thrift and new fashion. Quality checked, fast delivery.",
  icons: {
    icon: "/favicon.svg",
  },
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
      </body>
    </html>
  );
}
