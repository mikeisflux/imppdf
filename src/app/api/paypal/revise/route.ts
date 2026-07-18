import { badRequest, json, unauthorized } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth';
import { reviseSubscription, paypalConfigured } from '@/lib/paypal';
import { getActiveSubscriptionForUser } from '@/lib/subscriptions';
import { serverPaypal } from '@/lib/settings';
import { siteUrl } from '@/lib/config';

// Change the caller's active subscription to the other billing cycle. Returns a
// PayPal approval URL when the change needs the subscriber to confirm.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized('Please sign in first.');
  if (!paypalConfigured()) return badRequest('Payments are not configured.');

  const body = await req.json().catch(() => ({}));
  const cycle = body?.cycle === 'yearly' ? 'yearly' : body?.cycle === 'monthly' ? 'monthly' : null;
  if (!cycle) return badRequest('Choose a monthly or yearly plan.');

  const sub = getActiveSubscriptionForUser(user.id);
  if (!sub || !sub.paypal_subscription_id || sub.paypal_subscription_id.startsWith('manual-')) {
    return badRequest('No PayPal subscription to change.');
  }

  const planId = cycle === 'yearly' ? serverPaypal().planYearly : serverPaypal().planMonthly;
  if (!planId) return badRequest(`The ${cycle} plan isn’t configured.`);
  if (sub.plan_id === planId) return badRequest(`You’re already on the ${cycle} plan.`);

  try {
    const { approveUrl } = await reviseSubscription(
      sub.paypal_subscription_id, planId,
      `${siteUrl}/account?changed=1`, `${siteUrl}/account`,
    );
    return json({ ok: true, approveUrl: approveUrl ?? null });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Could not change the plan.');
  }
}
