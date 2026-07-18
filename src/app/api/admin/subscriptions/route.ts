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
    const subscriptionId = String(body?.subscriptionId ?? '').trim();
    if (!subscriptionId) return badRequest('Enter a PayPal subscription ID (e.g. I-XXXXXXXX).');
    const typedEmail = String(body?.email ?? '').trim();

    // Try to pull the authoritative record from PayPal. If that fails (env/creds/
    // network) we can still link it manually from the admin-entered email — the
    // admin has confirmed the payment in the PayPal dashboard.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sub: any = null;
    let fetchErr = '';
    if (paypalConfigured()) {
      try { sub = await getSubscription(subscriptionId); }
      catch (e) { fetchErr = e instanceof Error ? e.message : 'PayPal lookup failed.'; }
    } else {
      fetchErr = 'PayPal is not configured.';
    }

    // Resolve the user: admin-entered email wins, then custom_id, then the
    // PayPal subscriber email.
    let user = typedEmail ? findUserByEmail(typedEmail) : undefined;
    if (!user && sub) {
      const customId = String(sub.custom_id ?? '').trim();
      if (/^\d+$/.test(customId)) user = findUserById(Number(customId));
      if (!user) {
        const email = String(sub.subscriber?.email_address ?? '').trim();
        if (email) user = findUserByEmail(email);
      }
    }
    if (!user) {
      return badRequest(fetchErr
        ? `PayPal lookup failed: ${fetchErr} Enter the account email above to link it manually.`
        : 'Could not match this subscription to a user — enter the account email to link it.');
    }

    const planId: string | null = sub?.plan_id ?? null;
    const cycle =
      planId === serverPaypal().planYearly ? 'yearly' :
      planId === serverPaypal().planMonthly ? 'monthly' : null;
    const periodEnd = sub?.billing_info?.next_billing_time ? Date.parse(sub.billing_info.next_billing_time) : null;
    const status: string = sub?.status ?? 'ACTIVE';

    upsertSubscription({
      userId: user.id,
      paypalSubscriptionId: subscriptionId,
      planId,
      billingCycle: cycle,
      status,
      currentPeriodEnd: periodEnd && !Number.isNaN(periodEnd) ? periodEnd : null,
    });
    if (['ACTIVE', 'APPROVAL_PENDING', 'APPROVED'].includes(status.toUpperCase())) {
      try { await enforceSingleSubscription(user.id, subscriptionId); } catch { /* best-effort */ }
    }
    return json({
      ok: true, email: user.email, status,
      note: sub ? undefined : `Linked from the email you entered — PayPal wasn't queried (${fetchErr})`,
    });
  }

  return badRequest('Unknown action.');
}
