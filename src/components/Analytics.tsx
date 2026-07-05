import Script from 'next/script';

// Privacy-friendly, env-gated analytics. Nothing renders unless the relevant
// env var is set, so local/dev and un-configured deploys stay clean:
//   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=impositionpdf.com        → Plausible
//   NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.js (optional override
//     for a self-hosted instance)
//   NEXT_PUBLIC_GA_ID=G-XXXXXXX                            → Google Analytics 4
// If both are set, both load. No cookies are set by Plausible; GA4 respects the
// site's own consent setup if present.
export function Analytics() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js';
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {plausibleDomain && (
        <Script
          defer
          data-domain={plausibleDomain}
          src={plausibleSrc}
          strategy="afterInteractive"
        />
      )}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
    </>
  );
}
