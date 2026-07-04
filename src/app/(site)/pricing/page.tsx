import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getActiveSubscriptionForUser } from '@/lib/subscriptions';
import { PlanPanel } from '@/components/account/PlanPanel';
import { pricing } from '@/lib/config';
import { CATEGORY_LABEL, toolsByCategory, ToolCategory } from '@/lib/tools';
import { IconCheck, IconArrow } from '@/components/icons';

export const metadata = {
  title: 'Pricing',
  description: 'Start free, then upgrade to Pro for unlimited downloads. Billed via PayPal.',
};
export const dynamic = 'force-dynamic';

const FREE_FEATURES = [
  'All tools and previews', 'Local, in-browser processing',
  `${process.env.NEXT_PUBLIC_FREE_DOWNLOAD_LIMIT || '5'} free downloads total`,
  `${process.env.NEXT_PUBLIC_FREE_COOLDOWN_HOURS || '8'}-hour cooldown while free downloads remain`,
];
const PRO_FEATURES = [
  'Unlimited downloads — no cooldown', 'Every one of the 60+ tools & workflows',
  'API access with your key', 'Priority updates as new tools ship',
];

const CATS: ToolCategory[] = ['imposition', 'make', 'marks', 'pages', 'advanced'];

export default async function PricingPage() {
  const user = await getCurrentUser();
  const sub = user ? getActiveSubscriptionForUser(user.id) : null;

  return (
    <div className="container" style={{ padding: '64px 24px 40px' }}>
      <div className="eyebrow">Pricing</div>
      <h1 style={{ fontSize: 'clamp(32px,4.4vw,46px)', marginBottom: 14 }}>Start free, upgrade when you need more</h1>
      <p className="muted" style={{ fontSize: 17, maxWidth: 620, marginBottom: 12 }}>
        Use the full app free in your browser. Upgrade to Pro for unlimited, cooldown-free
        downloads. Plans are billed in {pricing.currency} and processed securely by PayPal.
      </p>

      {/* Plans */}
      <div className="plan-grid" style={{ marginTop: 34 }}>
        <div className="card plan-card">
          <div className="plan-name">Free <span className="badge badge-gray">No account required</span></div>
          <div className="plan-price">{pricing.currency === 'USD' ? '$0' : `${pricing.currency} 0`}</div>
          <ul className="plan-features">
            {FREE_FEATURES.map((f) => <li key={f}><IconCheck width={16} height={16} /> {f}</li>)}
          </ul>
          <Link href="/app" className="btn btn-ghost btn-plain btn-block">Open the app <IconArrow width={16} height={16} /></Link>
        </div>

        <div className="card plan-card featured">
          <div className="plan-name">Pro <span className="badge badge-brand">Unlimited downloads</span></div>
          <div className="plan-price">
            ${pricing.monthly}<small>/mo</small>
            <span className="muted" style={{ fontSize: 15, marginLeft: 10 }}>or ${pricing.yearly}/yr</span>
          </div>
          <ul className="plan-features">
            {PRO_FEATURES.map((f) => <li key={f}><IconCheck width={16} height={16} /> {f}</li>)}
          </ul>
          {!user && (
            <Link href="/signup" className="btn btn-primary btn-plain btn-block">Create account to subscribe</Link>
          )}
          {user && user.plan === 'pro' && (
            <Link href="/account" className="btn btn-ghost btn-plain btn-block">Manage subscription</Link>
          )}
        </div>
      </div>

      {/* Inline subscribe for signed-in free users */}
      {user && user.plan === 'free' && (
        <div style={{ maxWidth: 520, marginTop: 26 }}>
          <PlanPanel plan="free" subscription={null} />
        </div>
      )}

      {/* Enterprise */}
      <div className="card card-pad" style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div className="plan-name">Enterprise team plans <span className="badge badge-gray">Team licensing</span></div>
          <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>
            Share PDF Press across a studio, print shop or production team with centralized
            billing and concurrent-user access.
          </p>
        </div>
        <Link href="/contact?topic=enterprise" className="link-arrow">Request enterprise pricing <IconArrow width={15} height={15} /></Link>
      </div>

      {/* Everything Pro unlocks */}
      <div className="section">
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>Everything Pro unlocks</h2>
        <p className="muted" style={{ marginBottom: 28 }}>All professional tools are included, from everyday PDF fixes to print-shop imposition and production preflight.</p>
        <div className="seo-cols">
          {CATS.map((cat) => (
            <div key={cat} className="seo-col">
              <h4>{CATEGORY_LABEL[cat]}</h4>
              <ul>
                {toolsByCategory(cat).slice(0, 8).map((t) => (
                  <li key={t.slug}><Link href={`/tools/${t.slug}`}>{t.name}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Billing note */}
      <div className="section-sm" style={{ borderTop: '1px solid var(--border-soft)' }}>
        <h3 style={{ fontSize: 20, marginBottom: 10 }}>Billing</h3>
        <p className="muted" style={{ maxWidth: 640 }}>
          Subscriptions are processed securely via PayPal. You can manage or cancel your plan
          from the <Link href="/account" style={{ color: 'var(--brand)' }}>account page</Link> at any time.
          Refunds follow our <Link href="/terms" style={{ color: 'var(--brand)' }}>terms</Link>.
        </p>
      </div>
    </div>
  );
}
