'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

declare global { interface Window { paypal?: any; } }

let sdkPromise: Promise<void> | null = null;
function loadSdk(clientId: string): Promise<void> {
  if (!clientId) return Promise.resolve();
  if (window.paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load PayPal'));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export function PayPalSubscribe(
  { planId, cycle, clientId }: { planId: string; cycle: 'monthly' | 'yearly'; clientId: string },
) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  useEffect(() => {
    if (!clientId || !planId) return;
    let cancelled = false;
    loadSdk(clientId).then(() => {
      if (cancelled || !ref.current || !window.paypal) return;
      ref.current.innerHTML = '';
      window.paypal.Buttons({
        style: { shape: 'pill', color: 'gold', layout: 'horizontal', label: 'subscribe', height: 44 },
        createSubscription: (_data: any, actions: any) => actions.subscription.create({ plan_id: planId }),
        onApprove: async (data: any) => {
          setStatus('processing');
          try {
            const res = await fetch('/api/paypal/activate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscriptionId: data.subscriptionID }),
            });
            if (!res.ok) {
              const d = await res.json();
              setError(d.error || 'Could not activate subscription.');
              setStatus('idle');
              return;
            }
            setStatus('done');
            router.refresh();
          } catch {
            setError('Network error activating subscription.');
            setStatus('idle');
          }
        },
        onError: () => setError('PayPal encountered an error. Please try again.'),
      }).render(ref.current);
    }).catch(() => setError('Could not load PayPal.'));
    return () => { cancelled = true; };
  }, [planId, cycle, clientId, router]);

  if (!clientId) {
    return <div className="form-note">PayPal is not configured yet. Add your PayPal keys in Admin → Settings.</div>;
  }
  if (!planId) {
    return <div className="form-note">The {cycle} plan isn’t configured yet. Add the {cycle} plan ID in Admin → Settings → PayPal.</div>;
  }

  return (
    <div>
      {error && <div className="form-error">{error}</div>}
      {status === 'processing' && <div className="form-note" style={{ marginBottom: 8 }}>Activating your subscription…</div>}
      {status === 'done' && <div className="form-success">Subscription active — you are now Pro!</div>}
      <div ref={ref} />
    </div>
  );
}
