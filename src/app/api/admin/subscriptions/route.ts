import { badRequest, json, unauthorized } from '@/lib/http';
import { getCurrentAdmin } from '@/lib/auth';
import { getSubscription, paypalConfigured, enforceSingleSubscription } from '@/lib/paypal';
import { reconcilePlansFromDb, upsertSubscription } from '@/lib/subscriptions';
import { findUserByEmail, findUserById } from '@/lib/users';
import { serverPaypal } from '@/lib/settings';

// Admin reconciliation for billing.
//  - action 'sync':   flip every user with a live subscription record to Pro
//                     (fixes accounts that paid but were never upgraded).
//  - action 'import': pull a subscription from PayPal by its id (paste it from
//                     the PayPal dashboard), link it to the matching user by
//                     custom_id or subscriber/entered email, and activate them.
export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const action = body?.action as string | undefined;

  if (action === 'sync') {
    const { activated } = reconcilePlansFromDb();
    return json({ ok: true, activated, count: activated.length });
  }

  if (action === 'import') {
    if (!paypalConfigured()) return badRequest('PayPal is not configured.');
    const subscriptionId = String(body?.subscriptionId ?? '').trim();
    if (!subscriptionId) return badRequest('Enter a PayPal subscription ID (e.g. I-XXXXXXXX).');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sub: any;
    try { sub = await getSubscription(subscriptionId); }
    catch { return badRequest('Could not fetch that subscription from PayPal — check the ID.'); }

    // Resolve the user: an email typed by the admin wins, then custom_id, then
    // the PayPal subscriber email.
    const typedEmail = String(body?.email ?? '').trim();
    let user = typedEmail ? findUserByEmail(typedEmail) : undefined;
    if (!user) {
      const customId = String(sub.custom_id ?? '').trim();
      if (/^\d+$/.test(customId)) user = findUserById(Number(customId));
    }
    if (!user) {
      const email = String(sub.subscriber?.email_address ?? '').trim();
      if (email) user = findUserByEmail(email);
    }
    if (!user) {
      return badRequest('Could not match this subscription to a user. Enter the account email to link it.');
    }

    const cycle =
      sub.plan_id === serverPaypal().planYearly ? 'yearly' :
      sub.plan_id === serverPaypal().planMonthly ? 'monthly' : null;
    const periodEnd = sub.billing_info?.next_billing_time ? Date.parse(sub.billing_info.next_billing_time) : null;

    upsertSubscription({
      userId: user.id,
      paypalSubscriptionId: sub.id,
      planId: sub.plan_id ?? null,
      billingCycle: cycle,
      status: sub.status,
      currentPeriodEnd: periodEnd && !Number.isNaN(periodEnd) ? periodEnd : null,
    });
    if (['ACTIVE', 'APPROVAL_PENDING', 'APPROVED'].includes(String(sub.status).toUpperCase())) {
      try { await enforceSingleSubscription(user.id, sub.id); } catch { /* best-effort */ }
    }
    return json({ ok: true, email: user.email, status: sub.status });
  }

  return badRequest('Unknown action.');
}
