import { badRequest, json, unauthorized } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth';
import { getSubscription, paypalConfigured } from '@/lib/paypal';
import { upsertSubscription } from '@/lib/subscriptions';
import { paypal as paypalCfg } from '@/lib/config';

// Called by the browser right after PayPal approves a subscription. We verify
// the subscription with PayPal (never trust the client) and mark the user Pro.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized('Please sign in first.');
  if (!paypalConfigured()) return badRequest('Payments are not configured.');

  const body = await req.json().catch(() => null);
  const subscriptionId = body?.subscriptionId as string | undefined;
  if (!subscriptionId) return badRequest('Missing subscription id.');

  let sub;
  try {
    sub = await getSubscription(subscriptionId);
  } catch {
    return badRequest('Could not verify the subscription with PayPal.');
  }

  const cycle =
    sub.plan_id && sub.plan_id === paypalCfg.planYearly ? 'yearly' :
    sub.plan_id && sub.plan_id === paypalCfg.planMonthly ? 'monthly' : null;

  const periodEnd = sub.billing_info?.next_billing_time
    ? Date.parse(sub.billing_info.next_billing_time)
    : null;

  upsertSubscription({
    userId: user.id,
    paypalSubscriptionId: sub.id,
    planId: sub.plan_id ?? null,
    billingCycle: cycle,
    status: sub.status,
    currentPeriodEnd: Number.isNaN(periodEnd) ? null : periodEnd,
  });

  return json({ ok: true, status: sub.status });
}
