import { NextResponse } from 'next/server';
import { getSubscription, verifyWebhookSignature, enforceSingleSubscription } from '@/lib/paypal';
import { findSubscriptionByPaypalId, upsertSubscription } from '@/lib/subscriptions';
import { findUserByEmail } from '@/lib/users';
import { serverPaypal } from '@/lib/settings';

// PayPal subscription webhooks keep our records in sync with billing events
// (activations, renewals, cancellations, suspensions).
//
// This is also the BACKSTOP for activation: if the browser's /activate call
// never lands (closed tab, network/JS error), the subscription would otherwise
// be orphaned — PayPal charges the customer but our DB never links it, so they
// stay on the free plan ("I paid but can't use the service"). When there's no
// local record we resolve the user from the subscription's custom_id (the user
// id stamped at checkout) or the subscriber email, create the record, and
// upgrade them. On activation we also cancel any other live subscription for the
// user so nobody is double-charged.
export async function POST(req: Request) {
  const raw = await req.text();
  const verified = await verifyWebhookSignature(req.headers, raw);
  if (!verified) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }

  const type: string = event.event_type || '';
  const resource = event.resource || {};
  const subscriptionId: string | undefined = resource.id || resource.billing_agreement_id;
  if (!subscriptionId) return NextResponse.json({ ok: true });

  // Pull the authoritative subscription from PayPal (status, plan, subscriber).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sub: any = null;
  try { sub = await getSubscription(subscriptionId); } catch { /* fall back to the event payload */ }

  let status: string | undefined = sub?.status ?? (resource.status as string | undefined);
  if (!sub) {
    if (type.includes('CANCELLED')) status = 'CANCELLED';
    else if (type.includes('SUSPENDED')) status = 'SUSPENDED';
    else if (type.includes('EXPIRED')) status = 'EXPIRED';
    else if (type.includes('ACTIVATED') || type.includes('CREATED')) status = 'ACTIVE';
  }
  const nextBilling: string | undefined = sub?.billing_info?.next_billing_time ?? resource?.billing_info?.next_billing_time;
  const periodEnd = nextBilling ? Date.parse(nextBilling) : null;

  // Resolve the owning user: existing record → custom_id → subscriber email.
  const local = findSubscriptionByPaypalId(subscriptionId);
  let userId: number | undefined = local?.user_id;
  if (!userId) {
    const customId = String(sub?.custom_id ?? resource?.custom_id ?? '').trim();
    if (/^\d+$/.test(customId)) userId = Number(customId);
  }
  if (!userId) {
    const email = String(sub?.subscriber?.email_address ?? resource?.subscriber?.email_address ?? '').trim();
    if (email) userId = findUserByEmail(email)?.id;
  }
  // Truly unresolvable (e.g. activated on another instance) — ignore safely.
  if (!userId) return NextResponse.json({ ok: true });

  const planId: string | null = sub?.plan_id ?? local?.plan_id ?? null;
  const cycle =
    planId === serverPaypal().planYearly ? 'yearly' :
    planId === serverPaypal().planMonthly ? 'monthly' : (local?.billing_cycle ?? null);

  const finalStatus = status || local?.status || 'ACTIVE';
  upsertSubscription({
    userId,
    paypalSubscriptionId: subscriptionId,
    planId,
    status: finalStatus,
    billingCycle: cycle,
    currentPeriodEnd: periodEnd && !Number.isNaN(periodEnd) ? periodEnd : undefined,
  });

  // Newly-live subscription → make sure it's the only one for this user.
  if (['ACTIVE', 'APPROVAL_PENDING', 'APPROVED'].includes(finalStatus.toUpperCase())) {
    await enforceSingleSubscription(userId, subscriptionId);
  }

  return NextResponse.json({ ok: true });
}
