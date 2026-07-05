import Script from 'next/script';
import { CookieConsent } from './CookieConsent';

// Privacy-friendly, env-gated analytics.
//   NEXT_PUBLIC_PLAUSIBLE_DOMAIN — Plausible (cookieless; loads without consent)
//   NEXT_PUBLIC_PLAUSIBLE_SRC    — optional self-hosted script override
//   NEXT_PUBLIC_GA_ID            — Google Analytics 4 (sets cookies; loaded only
//                                  after the visitor accepts, via CookieConsent)
// Nothing renders unless the relevant env var is set, so dev/un-configured
// deploys stay clean.
export function Analytics() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js';
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {plausibleDomain && (
        <Script defer data-domain={plausibleDomain} src={plausibleSrc} strategy="afterInteractive" />
      )}
      {/* GA4 sets cookies, so it is gated behind the consent banner. */}
      {gaId && <CookieConsent gaId={gaId} />}
    </>
  );
}
