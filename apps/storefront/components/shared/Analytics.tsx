import Script from "next/script";

// Google Analytics 4. Renders nothing until NEXT_PUBLIC_GA_ID is set at build
// time, so it's a safe no-op in dev/preview. Set the repo variable to enable.
const GA_ID = process.env["NEXT_PUBLIC_GA_ID"];

export function Analytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
