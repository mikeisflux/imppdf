'use client';
import { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react';

// Shared reCAPTCHA widget used by every form on the site.
//  - v2: renders a visible checkbox; token comes from grecaptcha.getResponse().
//  - v3: invisible; token is produced on demand via execute().
// The site key + version are fetched at runtime from /api/public-config so an
// admin can configure reCAPTCHA in /admin/settings without a rebuild. If no site
// key is configured the widget renders nothing and getToken() returns '' (the
// server treats an unconfigured secret as pass-through).

let SITE_KEY = '';
let VERSION: 'v2' | 'v3' = 'v2';
let configPromise: Promise<void> | null = null;
function loadConfig(): Promise<void> {
  if (configPromise) return configPromise;
  configPromise = fetch('/api/public-config')
    .then((r) => r.json())
    .then((c) => { SITE_KEY = c?.recaptcha?.siteKey || ''; VERSION = c?.recaptcha?.version || 'v2'; })
    .catch(() => {});
  return configPromise;
}

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
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
      let cancelled = false;
      loadConfig().then(() => {
        if (cancelled) return;
        if (!SITE_KEY) { setReady(true); return; }
        setEnabled(true);
        loadScript().then(() => {
          if (cancelled) return;
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
      });
      return () => { cancelled = true; };
    }, []);

    useImperativeHandle(ref, () => ({
      async getToken() {
        await loadConfig();
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

    if (!enabled) return null;
    return (
      <div className={className} style={{ minHeight: VERSION === 'v2' ? 78 : 0 }}>
        {VERSION === 'v2' && <div ref={boxRef} />}
        {!ready && <span className="muted" style={{ fontSize: 13 }}>Loading verification…</span>}
      </div>
    );
  },
);
