'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PayPalSubscribe } from './PayPalSubscribe';
import { IconCheck } from '@/components/icons';

const PLAN_MONTHLY = process.env.NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY || '';
const PLAN_YEARLY = process.env.NEXT_PUBLIC_PAYPAL_PLAN_YEARLY || '';
const PRICE_MONTHLY = process.env.NEXT_PUBLIC_PRICE_MONTHLY || '12';
const PRICE_YEARLY = process.env.NEXT_PUBLIC_PRICE_YEARLY || '120';
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'USD';

const PRO_FEATURES = [
  'Unlimited downloads — no cooldown',
  'Every one of the 60+ tools & workflows',
  'API access with your key',
  'Priority updates as new tools ship',
];

export function PlanPanel({
  plan, subscription,
}: {
  plan: 'free' | 'pro';
  subscription: { status: string; billing_cycle: string | null; current_period_end: number | null } | null;
}) {
  const router = useRouter();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [cancelling, setCancelling] = useState(false);

  async function cancel() {
    if (!confirm('Cancel your Pro subscription? You will return to the free tier.')) return;
    setCancelling(true);
    await fetch('/api/paypal/cancel', { method: 'POST' });
    setCancelling(false);
    router.refresh();
  }

  if (plan === 'pro') {
    return (
      <div className="card card-pad panel">
        <h2>Your plan</h2>
        <p className="panel-sub">Thanks for supporting PDF Press.</p>
        <div className="kv"><span className="k">Plan</span><span><span className="badge badge-brand">Pro</span></span></div>
        <div className="kv"><span className="k">Status</span><span>{subscription?.status || 'ACTIVE'}</span></div>
        {subscription?.billing_cycle && (
          <div className="kv"><span className="k">Billing</span><span style={{ textTransform: 'capitalize' }}>{subscription.billing_cycle}</span></div>
        )}
        {subscription?.current_period_end && (
          <div className="kv"><span className="k">Renews / ends</span><span>{new Date(subscription.current_period_end).toLocaleDateString()}</span></div>
        )}
        {subscription?.status === 'ACTIVE' && (
          <button className="btn btn-ghost btn-plain" style={{ marginTop: 16 }} onClick={cancel} disabled={cancelling}>
            {cancelling ? 'Cancelling…' : 'Cancel subscription'}
          </button>
        )}
      </div>
    );
  }

  const planId = cycle === 'yearly' ? PLAN_YEARLY : PLAN_MONTHLY;

  return (
    <div className="card card-pad panel">
      <h2>Upgrade to Pro</h2>
      <p className="panel-sub">Remove download cooldowns and unlock unlimited exports.</p>

      <div className="row" style={{ gap: 10, marginBottom: 18 }}>
        <button className={`btn btn-plain ${cycle === 'monthly' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setCycle('monthly')}>
          Monthly · {CURRENCY} {PRICE_MONTHLY}/mo
        </button>
        <button className={`btn btn-plain ${cycle === 'yearly' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setCycle('yearly')}>
          Yearly · {CURRENCY} {PRICE_YEARLY}/yr
        </button>
      </div>

      <ul className="plan-features">
        {PRO_FEATURES.map((f) => (
          <li key={f}><IconCheck width={16} height={16} /> {f}</li>
        ))}
      </ul>

      <PayPalSubscribe planId={planId} cycle={cycle} />
    </div>
  );
}
