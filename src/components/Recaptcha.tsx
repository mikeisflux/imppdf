'use client';
import { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react';

// Shared reCAPTCHA widget used by every form on the site.
//  - v2: renders a visible checkbox; token comes from grecaptcha.getResponse().
//  - v3: invisible; token is produced on demand via execute().
// If NEXT_PUBLIC_RECAPTCHA_SITE_KEY is unset the widget renders nothing and
// getToken() returns '' (the server treats an unconfigured secret as pass-through
// so local development is not blocked).

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
const VERSION = (process.env.NEXT_PUBLIC_RECAPTCHA_VERSION || 'v2') as 'v2' | 'v3';

declare global {
  interface Window {
    grecaptcha?: any;
    __ppRecaptchaLoaded?: boolean;
    __ppRecaptchaOnLoad?: () => void;
  }
}

export interface RecaptchaHandle {
  getToken: () => Promise<string>;
  reset: () => void;
}

function loadScript(): Promise<void> {
  return new Promise((resolve) => {
    if (!SITE_KEY) return resolve();
    if (window.grecaptcha && window.__ppRecaptchaLoaded) return resolve();
    const existing = document.getElementById('pp-recaptcha-script');
    if (existing) {
      const check = setInterval(() => {
        if (window.grecaptcha) { clearInterval(check); resolve(); }
      }, 50);
      return;
    }
    const s = document.createElement('script');
    s.id = 'pp-recaptcha-script';
    s.async = true;
    s.defer = true;
    s.src =
      VERSION === 'v3'
        ? `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
        : `https://www.google.com/recaptcha/api.js`;
    s.onload = () => { window.__ppRecaptchaLoaded = true; resolve(); };
    document.head.appendChild(s);
  });
}

export const Recaptcha = forwardRef<RecaptchaHandle, { className?: string }>(
  function Recaptcha({ className }, ref) {
    const boxRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<number | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
      let cancelled = false;
      loadScript().then(() => {
        if (cancelled || !SITE_KEY) { setReady(true); return; }
        window.grecaptcha?.ready(() => {
          if (cancelled) return;
          if (VERSION === 'v2' && boxRef.current && widgetId.current === null) {
            try {
              widgetId.current = window.grecaptcha.render(boxRef.current, {
                sitekey: SITE_KEY,
                theme: 'dark',
              });
            } catch { /* already rendered */ }
          }
          setReady(true);
        });
      });
      return () => { cancelled = true; };
    }, []);

    useImperativeHandle(ref, () => ({
      async getToken() {
        if (!SITE_KEY || !window.grecaptcha) return '';
        if (VERSION === 'v3') {
          return window.grecaptcha.execute(SITE_KEY, { action: 'submit' });
        }
        return window.grecaptcha.getResponse(widgetId.current ?? undefined) || '';
      },
      reset() {
        if (SITE_KEY && window.grecaptcha && VERSION === 'v2') {
          try { window.grecaptcha.reset(widgetId.current ?? undefined); } catch {}
        }
      },
    }));

    if (!SITE_KEY) return null;
    return (
      <div className={className} style={{ minHeight: VERSION === 'v2' ? 78 : 0 }}>
        {VERSION === 'v2' && <div ref={boxRef} />}
        {!ready && <span className="muted" style={{ fontSize: 13 }}>Loading verification…</span>}
      </div>
    );
  },
);
