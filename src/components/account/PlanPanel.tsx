'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PayPalSubscribe } from './PayPalSubscribe';
import { IconCheck } from '@/components/icons';

export interface BillingConfig {
  clientId: string;
  planMonthly: string;
  planYearly: string;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
}

const PRO_FEATURES = [
  'Unlimited downloads — no cooldown',
  'Every one of the 90+ tools & workflows',
  'Priority updates as new tools ship',
];

export function PlanPanel({
  plan, subscription, cfg, userId,
}: {
  plan: 'free' | 'pro';
  subscription: { status: string; billing_cycle: string | null; current_period_end: number | null } | null;
  cfg: BillingConfig;
  userId?: number;
}) {
  const router = useRouter();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [cancelling, setCancelling] = useState(false);
  const [changing, setChanging] = useState(false);
  const [err, setErr] = useState('');

  async function cancel() {
    if (!confirm('Cancel your Pro subscription? You will return to the free tier.')) return;
    setCancelling(true); setErr('');
    const res = await fetch('/api/paypal/cancel', { method: 'POST' });
    setCancelling(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error || 'Could not cancel.'); return; }
    router.refresh();
  }

  // Switch an active PayPal subscription to the other billing cycle. PayPal may
  // return an approval URL the subscriber must confirm.
  async function changePlan(to: 'monthly' | 'yearly') {
    setChanging(true); setErr('');
    try {
      const res = await fetch('/api/paypal/revise', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cycle: to }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error || 'Could not change the plan.'); setChanging(false); return; }
      if (d.approveUrl) { window.location.href = d.approveUrl; return; }
      router.refresh();
    } catch { setErr('Network error changing the plan.'); }
    setChanging(false);
  }

  if (plan === 'pro') {
    const current = (subscription?.billing_cycle || '').toLowerCase();
    const canManage = subscription?.status === 'ACTIVE' && !!subscription?.billing_cycle && current !== 'manual';
    const other: 'monthly' | 'yearly' = current === 'yearly' ? 'monthly' : 'yearly';
    const otherPrice = other === 'yearly' ? `${cfg.currency} ${cfg.priceYearly}/yr` : `${cfg.currency} ${cfg.priceMonthly}/mo`;
    return (
      <div className="card card-pad panel">
        <h2>Your plan</h2>
        <p className="panel-sub">Manage or cancel your subscription anytime.</p>
        <div className="kv"><span className="k">Plan</span><span><span className="badge badge-brand">Pro</span></span></div>
        <div className="kv"><span className="k">Status</span><span>{subscription?.status || 'ACTIVE'}</span></div>
        {subscription?.billing_cycle && (
          <div className="kv"><span className="k">Billing</span><span style={{ textTransform: 'capitalize' }}>{subscription.billing_cycle}</span></div>
        )}
        {subscription?.current_period_end && (
          <div className="kv"><span className="k">Renews / ends</span><span>{new Date(subscription.current_period_end).toLocaleDateString()}</span></div>
        )}
        {err && <div className="form-error" style={{ marginTop: 12 }}>{err}</div>}
        <div className="row wrap" style={{ marginTop: 16, gap: 10 }}>
          {canManage && (
            <button className="btn btn-ghost btn-plain" onClick={() => changePlan(other)} disabled={changing || cancelling}>
              {changing ? 'Switching…' : `Switch to ${other} · ${otherPrice}`}
            </button>
          )}
          {subscription?.status === 'ACTIVE' && (
            <button className="btn btn-ghost btn-plain" onClick={cancel} disabled={cancelling || changing}>
              {cancelling ? 'Cancelling…' : 'Cancel subscription'}
            </button>
          )}
        </div>
        {current === 'manual' && <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>This is a complimentary plan managed by our team — contact us to make changes.</p>}
      </div>
    );
  }

  const planId = cycle === 'yearly' ? cfg.planYearly : cfg.planMonthly;

  return (
    <div className="card card-pad panel">
      <h2>Upgrade to Pro</h2>
      <p className="panel-sub">Remove download cooldowns and unlock unlimited exports.</p>

      <div className="row" style={{ gap: 10, marginBottom: 18 }}>
        <button className={`btn btn-plain ${cycle === 'monthly' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setCycle('monthly')}>
          Monthly · {cfg.currency} {cfg.priceMonthly}/mo
        </button>
        <button className={`btn btn-plain ${cycle === 'yearly' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setCycle('yearly')}>
          Yearly · {cfg.currency} {cfg.priceYearly}/yr
        </button>
      </div>

      <ul className="plan-features">
        {PRO_FEATURES.map((f) => (
          <li key={f}><IconCheck width={16} height={16} /> {f}</li>
        ))}
      </ul>

      <PayPalSubscribe planId={planId} cycle={cycle} clientId={cfg.clientId} userId={userId} />
    </div>
  );
}
