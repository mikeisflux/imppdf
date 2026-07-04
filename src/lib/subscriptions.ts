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

export function listSubscriptions(): (SubscriptionRow & { email: string })[] {
  return getDb()
    .prepare(
      `SELECT s.*, u.email FROM subscriptions s JOIN users u ON u.id = s.user_id
       ORDER BY s.updated_at DESC`,
    )
    .all() as (SubscriptionRow & { email: string })[];
}
