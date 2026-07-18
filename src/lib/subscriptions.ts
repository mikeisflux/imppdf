import 'server-only';
import { getDb } from './db';
import { setUserPlan } from './users';

export interface SubscriptionRow {
  id: number;
  user_id: number;
  paypal_subscription_id: string | null;
  plan_id: string | null;
  billing_cycle: string | null;
  status: string;
  current_period_end: number | null;
  created_at: number;
  updated_at: number;
}

// Upserts a subscription by its PayPal id and keeps the user's plan in sync.
export function upsertSubscription(opts: {
  userId: number;
  paypalSubscriptionId: string;
  planId?: string | null;
  billingCycle?: string | null;
  status: string;
  currentPeriodEnd?: number | null;
}) {
  const now = Date.now();
  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM subscriptions WHERE paypal_subscription_id = ?')
    .get(opts.paypalSubscriptionId) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE subscriptions
       SET status = ?, plan_id = COALESCE(?, plan_id),
           billing_cycle = COALESCE(?, billing_cycle),
           current_period_end = COALESCE(?, current_period_end),
           updated_at = ?
       WHERE id = ?`,
    ).run(
      opts.status,
      opts.planId ?? null,
      opts.billingCycle ?? null,
      opts.currentPeriodEnd ?? null,
      now,
      existing.id,
    );
  } else {
    db.prepare(
      `INSERT INTO subscriptions
       (user_id, paypal_subscription_id, plan_id, billing_cycle, status, current_period_end, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      opts.userId,
      opts.paypalSubscriptionId,
      opts.planId ?? null,
      opts.billingCycle ?? null,
      opts.status,
      opts.currentPeriodEnd ?? null,
      now,
      now,
    );
  }

  // Any of these statuses means the user has an entitled Pro plan.
  const active = ['ACTIVE', 'APPROVAL_PENDING', 'APPROVED'].includes(opts.status.toUpperCase());
  setUserPlan(opts.userId, active ? 'pro' : 'free');
}

// Admin-set (manual/comp) subscription. Uses a synthetic id so it never
// collides with a real PayPal subscription, and syncs the user's plan.
export function setManualSubscription(
  userId: number,
  status: string,
  currentPeriodEnd?: number | null,
) {
  upsertSubscription({
    userId,
    paypalSubscriptionId: `manual-${userId}`,
    planId: 'manual',
    billingCycle: 'manual',
    status,
    currentPeriodEnd: currentPeriodEnd ?? null,
  });
}

// Remove any manual subscription for a user and drop them to free (unless a
// real PayPal subscription still keeps them active).
export function clearManualSubscription(userId: number) {
  getDb().prepare('DELETE FROM subscriptions WHERE paypal_subscription_id = ?').run(`manual-${userId}`);
  const stillActive = getDb()
    .prepare("SELECT 1 FROM subscriptions WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1")
    .get(userId);
  setUserPlan(userId, stillActive ? 'pro' : 'free');
}

// Map of userId -> latest subscription status (for the admin users list).
export function subscriptionStatusByUser(): Record<number, string> {
  const rows = getDb()
    .prepare(
      `SELECT user_id, status FROM subscriptions
       WHERE id IN (SELECT MAX(id) FROM subscriptions GROUP BY user_id)`,
    )
    .all() as { user_id: number; status: string }[];
  const map: Record<number, string> = {};
  for (const r of rows) map[r.user_id] = r.status;
  return map;
}

export function getActiveSubscriptionForUser(userId: number): SubscriptionRow | undefined {
  return getDb()
    .prepare(
      `SELECT * FROM subscriptions WHERE user_id = ?
       ORDER BY (status = 'ACTIVE') DESC, updated_at DESC LIMIT 1`,
    )
    .get(userId) as SubscriptionRow | undefined;
}

export function findSubscriptionByPaypalId(id: string): SubscriptionRow | undefined {
  return getDb()
    .prepare('SELECT * FROM subscriptions WHERE paypal_subscription_id = ?')
    .get(id) as SubscriptionRow | undefined;
}

// Other real (non-manual) PayPal subscriptions for a user that are still live —
// used to enforce a single active subscription so a customer is never
// double-charged for two overlapping plans.
export function otherLiveSubscriptions(userId: number, exceptPaypalId: string): SubscriptionRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM subscriptions
       WHERE user_id = ? AND paypal_subscription_id != ?
         AND paypal_subscription_id NOT LIKE 'manual-%'
         AND UPPER(status) IN ('ACTIVE','APPROVAL_PENDING','APPROVED')`,
    )
    .all(userId, exceptPaypalId) as SubscriptionRow[];
}

export function markSubscriptionStatus(paypalSubscriptionId: string, status: string) {
  getDb()
    .prepare('UPDATE subscriptions SET status = ?, updated_at = ? WHERE paypal_subscription_id = ?')
    .run(status, Date.now(), paypalSubscriptionId);
}

export function listSubscriptions(): (SubscriptionRow & { email: string; plan: string })[] {
  return getDb()
    .prepare(
      `SELECT s.*, u.email, u.plan FROM subscriptions s JOIN users u ON u.id = s.user_id
       ORDER BY s.updated_at DESC`,
    )
    .all() as (SubscriptionRow & { email: string; plan: string })[];
}

// Reconcile user plans from the subscription records already in the database:
// anyone with a live subscription is set to Pro. Fixes accounts that paid but
// were never upgraded (e.g. the browser's activate call never landed). Returns
// the emails that were flipped to Pro so the admin can see who was activated.
export function reconcilePlansFromDb(): { activated: string[] } {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT DISTINCT s.user_id, u.email, u.plan FROM subscriptions s JOIN users u ON u.id = s.user_id
       WHERE UPPER(s.status) IN ('ACTIVE','APPROVAL_PENDING','APPROVED')`,
    )
    .all() as { user_id: number; email: string; plan: string }[];
  const activated: string[] = [];
  for (const r of rows) {
    if (r.plan !== 'pro') activated.push(r.email);
    setUserPlan(r.user_id, 'pro');
  }
  return { activated };
}
