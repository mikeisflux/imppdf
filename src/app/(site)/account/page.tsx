import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getActiveSubscriptionForUser } from '@/lib/subscriptions';
import { publicConfig } from '@/lib/settings';
import { PlanPanel } from '@/components/account/PlanPanel';
import { LogoutButton } from '@/components/account/LogoutButton';

export const metadata = { title: 'My account' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sub = getActiveSubscriptionForUser(user.id);
  const pc = publicConfig();
  const billingCfg = {
    clientId: pc.paypal.clientId,
    planMonthly: pc.paypal.planMonthly,
    planYearly: pc.paypal.planYearly,
    priceMonthly: pc.pricing.monthly,
    priceYearly: pc.pricing.yearly,
    currency: pc.pricing.currency,
  };

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h1>My account</h1>
          <p className="muted">{user.email}</p>
        </div>
        <div className="row">
          <Link href="/app" className="btn btn-primary btn-plain">Open the app</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="card card-pad panel">
        <h2>Profile</h2>
        <div className="kv"><span className="k">Name</span><span>{user.name || '—'}</span></div>
        <div className="kv"><span className="k">Email</span><span>{user.email}</span></div>
        <div className="kv">
          <span className="k">Plan</span>
          <span>
            {user.plan === 'pro'
              ? <span className="badge badge-brand">Pro</span>
              : <span className="badge badge-gray">Free</span>}
          </span>
        </div>
      </div>

      <PlanPanel
        plan={user.plan}
        subscription={sub ? {
          status: sub.status,
          billing_cycle: sub.billing_cycle,
          current_period_end: sub.current_period_end,
        } : null}
        cfg={billingCfg}
      />
    </div>
  );
}
