import { badRequest, json, unauthorized } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth';
import { getSubscription, paypalConfigured, enforceSingleSubscription } from '@/lib/paypal';
import { upsertSubscription } from '@/lib/subscriptions';
import { serverPaypal } from '@/lib/settings';

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
    sub.plan_id && sub.plan_id === serverPaypal().planYearly ? 'yearly' :
    sub.plan_id && sub.plan_id === serverPaypal().planMonthly ? 'monthly' : null;

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

  // One active subscription per user: cancel any older duplicate the customer
  // may have created (e.g. by checking out twice) so they aren't double-charged.
  if (['ACTIVE', 'APPROVAL_PENDING', 'APPROVED'].includes(String(sub.status).toUpperCase())) {
    try { await enforceSingleSubscription(user.id, sub.id); } catch { /* best-effort */ }
  }

  return json({ ok: true, status: sub.status });
}
