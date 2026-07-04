'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { AdminImpose } from '@/lib/imposition-toolkit/Impose';
import '@/lib/imposition-toolkit/impose.css';
import { Logo } from '@/components/Logo';

interface Entitlement {
  authenticated: boolean;
  plan: 'free' | 'pro';
  limit: number;
  cooldownHours: number;
  count: number;
  lastAt: number | null;
}

const LS_KEY = 'pp_downloads';

function readLocalTimes(): number[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function writeLocalTimes(t: number[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(t)); } catch {}
}

export function AppWorkspace() {
  const [ent, setEnt] = useState<Entitlement | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [modal, setModal] = useState<null | 'limit' | 'cooldown'>(null);
  const lastConsume = useRef(0);
  const entRef = useRef<Entitlement | null>(null);
  const remainingRef = useRef(0);
  const cooldownRef = useRef(0);

  const recompute = useCallback((e: Entitlement) => {
    const cooldownMs = e.cooldownHours * 3600 * 1000;
    if (e.plan === 'pro') { setRemaining(Infinity); setCooldownUntil(0); remainingRef.current = Infinity; cooldownRef.current = 0; return; }
    let count = e.count;
    let lastAt = e.lastAt || 0;
    if (!e.authenticated) {
      const times = readLocalTimes();
      count = times.length;
      lastAt = times.length ? Math.max(...times) : 0;
    }
    const rem = Math.max(0, e.limit - count);
    const cd = lastAt ? lastAt + cooldownMs : 0;
    setRemaining(rem); setCooldownUntil(cd);
    remainingRef.current = rem; cooldownRef.current = cd;
  }, []);

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.json())
      .then((e: Entitlement) => { setEnt(e); entRef.current = e; recompute(e); })
      .catch(() => {
        const fallback: Entitlement = { authenticated: false, plan: 'free', limit: 5, cooldownHours: 8, count: 0, lastAt: null };
        setEnt(fallback); entRef.current = fallback; recompute(fallback);
      });
  }, [recompute]);

  // Intercept the plugin's download anchors to enforce the free tier.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a[download]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const e0 = entRef.current;
      if (!e0 || e0.plan === 'pro') { markConsume(true); return; }

      const now = Date.now();
      // Treat a burst of anchors (multi-file export) as a single job.
      if (now - lastConsume.current < 2000) return;

      const canByLimit = remainingRef.current > 0;
      const canByCooldown = now >= cooldownRef.current;
      if (!canByLimit) { block(e); setModal('limit'); return; }
      if (!canByCooldown) { block(e); setModal('cooldown'); return; }

      // Allowed — let the download proceed and record it.
      markConsume(false);
    }
    function block(e: MouseEvent) { e.preventDefault(); e.stopImmediatePropagation(); }
    function markConsume(pro: boolean) {
      lastConsume.current = Date.now();
      if (pro) return;
      const e0 = entRef.current!;
      if (e0.authenticated) {
        fetch('/api/usage/consume', { method: 'POST' })
          .then((r) => r.json())
          .then((d) => {
            if (typeof d.remaining === 'number') { setRemaining(d.remaining); remainingRef.current = d.remaining; }
            if (typeof d.cooldownUntil === 'number') { setCooldownUntil(d.cooldownUntil); cooldownRef.current = d.cooldownUntil; }
          })
          .catch(() => {});
      } else {
        const times = readLocalTimes();
        times.push(Date.now());
        writeLocalTimes(times);
        recompute(entRef.current!);
      }
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [recompute]);

  const isPro = ent?.plan === 'pro';
  const cdLeftH = cooldownUntil > Date.now() ? Math.ceil((cooldownUntil - Date.now()) / 3600000) : 0;

  return (
    <div className="app-shell">
      <div className="app-bar">
        <Logo size={24} />
        <div className="app-bar-right">
          {ent && (
            isPro ? (
              <span className="usage-pill pro">✦ Pro · unlimited downloads</span>
            ) : (
              <span className="usage-pill">
                {remaining > 0
                  ? `${remaining} free download${remaining === 1 ? '' : 's'} left`
                  : 'Free downloads used'}
                {cdLeftH > 0 && remaining > 0 ? ` · ~${cdLeftH}h cooldown` : ''}
              </span>
            )
          )}
          {!isPro && (
            <Link href="/pricing" className="btn btn-primary btn-plain" style={{ padding: '8px 16px' }}>
              Upgrade to Pro
            </Link>
          )}
          {ent && !ent.authenticated && (
            <Link href="/login" className="pp-signin">Sign in</Link>
          )}
        </div>
      </div>

      <div className="app-plugin">
        <AdminImpose />
      </div>

      {modal && (
        <div className="app-modal-backdrop" onClick={() => setModal(null)}>
          <div className="app-modal card" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'limit' ? 'Free download limit reached' : 'Cooldown in progress'}</h2>
            <p className="muted">
              {modal === 'limit'
                ? `Free accounts include ${ent?.limit} downloads. Upgrade to Pro for unlimited, cooldown-free exports.`
                : `Free downloads have a cooldown of about ${ent?.cooldownHours} hours between exports${cdLeftH ? ` (~${cdLeftH}h left)` : ''}. Upgrade to Pro to remove it.`}
            </p>
            <div className="row wrap" style={{ marginTop: 18 }}>
              <Link href="/pricing" className="btn btn-primary btn-plain">Upgrade to Pro</Link>
              <button className="btn btn-ghost btn-plain" onClick={() => setModal(null)}>Keep working</button>
            </div>
            {ent && !ent.authenticated && (
              <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
                Already Pro? <Link href="/login" style={{ color: 'var(--brand)' }}>Sign in</Link> to unlock.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
