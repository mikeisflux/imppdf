'use client';
// Cookie consent banner. Only used when GA4 is configured (GA4 sets cookies).
// GA4 is loaded ONLY after the visitor accepts; declining stores the choice so
// the banner doesn't reappear and no analytics cookies are set. Choice lives in
// localStorage under 'pp_consent' ('granted' | 'denied').
import { useEffect, useState } from 'react';
import Script from 'next/script';

type Consent = 'granted' | 'denied' | null;
const KEY = 'pp_consent';

export function CookieConsent({ gaId }: { gaId: string }) {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setConsent((localStorage.getItem(KEY) as Consent) || null); } catch { /* ignore */ }
    setReady(true);
  }, []);

  const choose = (value: Exclude<Consent, null>) => {
    try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
    setConsent(value);
  };

  // Don't render anything until we've read the stored choice (avoids a flash).
  if (!ready) return null;

  return (
    <>
      {consent === 'granted' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {consent === null && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
          style={{
            position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 300, margin: '0 auto', maxWidth: 720,
            background: '#14141d', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 12, padding: '16px 18px', boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
            display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
          }}
        >
          <p style={{ margin: 0, flex: '1 1 320px', fontSize: 14, lineHeight: 1.5 }}>
            We use analytics cookies to understand how the site is used. Your PDFs are always processed
            locally and never uploaded. You can accept or decline analytics.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => choose('denied')}
              style={{ background: 'transparent', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}
            >
              Decline
            </button>
            <button
              onClick={() => choose('granted')}
              style={{ background: '#7c6cf6', color: '#fff', border: 0, borderRadius: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
}
