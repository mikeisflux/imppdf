import { NextResponse } from 'next/server';
import { getSubscription, verifyWebhookSignature } from '@/lib/paypal';
import {
  findSubscriptionByPaypalId, upsertSubscription,
} from '@/lib/subscriptions';
import { serverPaypal } from '@/lib/settings';

// PayPal subscription webhooks keep our records in sync with billing events
// (renewals, cancellations, suspensions). Configure the endpoint URL and copy
// the webhook id into PAYPAL_WEBHOOK_ID.
export async function POST(req: Request) {
  const raw = await req.text();
  const verified = await verifyWebhookSignature(req.headers, raw);
  if (!verified) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }

  const type: string = event.event_type || '';
  const resource = event.resource || {};
  const subscriptionId: string | undefined = resource.id || resource.billing_agreement_id;

  if (!subscriptionId) return NextResponse.json({ ok: true });

  // Resolve which user this subscription belongs to.
  const local = findSubscriptionByPaypalId(subscriptionId);
  if (!local) {
    // Unknown subscription — likely activated on another instance; ignore safely.
    return NextResponse.json({ ok: true });
  }

  // Determine the authoritative status.
  let status = resource.status as string | undefined;
  let periodEnd: number | null = null;
  try {
    const sub = await getSubscription(subscriptionId);
    status = sub.status;
    periodEnd = sub.billing_info?.next_billing_time ? Date.parse(sub.billing_info.next_billing_time) : null;
  } catch {
    // Fall back to the event-implied status.
    if (type.includes('CANCELLED')) status = 'CANCELLED';
    else if (type.includes('SUSPENDED')) status = 'SUSPENDED';
    else if (type.includes('EXPIRED')) status = 'EXPIRED';
    else if (type.includes('ACTIVATED')) status = 'ACTIVE';
  }

  const cycle =
    local.plan_id === serverPaypal().planYearly ? 'yearly' :
    local.plan_id === serverPaypal().planMonthly ? 'monthly' : local.billing_cycle;

  upsertSubscription({
    userId: local.user_id,
    paypalSubscriptionId: subscriptionId,
    status: status || local.status,
    billingCycle: cycle,
    currentPeriodEnd: periodEnd && !Number.isNaN(periodEnd) ? periodEnd : undefined,
  });

  return NextResponse.json({ ok: true });
}
