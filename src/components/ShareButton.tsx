'use client';
import { useEffect, useRef, useState } from 'react';
import { siteName } from '@/lib/config';

const SHARE_TEXT = `${siteName} — free online PDF imposition & prepress software`;

function IconShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

interface Target { label: string; href: (u: string, t: string) => string; }
const TARGETS: Target[] = [
  { label: 'X / Twitter', href: (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
  { label: 'Facebook', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { label: 'LinkedIn', href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  { label: 'Reddit', href: (u, t) => `https://www.reddit.com/submit?url=${u}&title=${t}` },
  { label: 'WhatsApp', href: (u, t) => `https://api.whatsapp.com/send?text=${t}%20${u}` },
  { label: 'Telegram', href: (u, t) => `https://t.me/share/url?url=${u}&text=${t}` },
  { label: 'Email', href: (u, t) => `mailto:?subject=${t}&body=${u}` },
];

export function ShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pageUrl = () => (typeof window !== 'undefined' ? window.location.href : '');

  const onClick = async () => {
    // Native share sheet on supported (mobile) browsers.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: siteName, text: SHARE_TEXT, url: pageUrl() }); return; }
      catch { /* fall through to menu */ }
    }
    setOpen((v) => !v);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(pageUrl()); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* ignore */ }
  };

  return (
    <div className="pp-share" ref={ref} style={{ position: 'relative' }}>
      <button className="pp-signin pp-share-btn" onClick={onClick} aria-label="Share" aria-haspopup="menu" aria-expanded={open}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <IconShare /> Share
      </button>
      {open && (
        <div role="menu" style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 60, minWidth: 190,
          background: 'var(--pp-surface, #14151a)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: 6, boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}>
          {TARGETS.map((t) => (
            <a key={t.label} role="menuitem" target="_blank" rel="noopener noreferrer"
              href={t.href(encodeURIComponent(pageUrl()), encodeURIComponent(SHARE_TEXT))}
              onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '8px 10px', borderRadius: 6, color: 'inherit', textDecoration: 'none', fontSize: 14 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              {t.label}
            </a>
          ))}
          <button onClick={copy}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6,
              color: 'inherit', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            {copied ? '✓ Link copied' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
}
