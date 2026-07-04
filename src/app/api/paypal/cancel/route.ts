import { badRequest, json, unauthorized } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth';
import { cancelSubscription, paypalConfigured } from '@/lib/paypal';
import { getActiveSubscriptionForUser, upsertSubscription } from '@/lib/subscriptions';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized('Please sign in first.');

  const sub = getActiveSubscriptionForUser(user.id);
  if (!sub || !sub.paypal_subscription_id) return badRequest('No active subscription found.');

  if (paypalConfigured()) {
    try {
      await cancelSubscription(sub.paypal_subscription_id);
    } catch {
      return badRequest('Could not cancel with PayPal. Please try again.');
    }
  }

  upsertSubscription({
    userId: user.id,
    paypalSubscriptionId: sub.paypal_subscription_id,
    status: 'CANCELLED',
  });

  return json({ ok: true });
}
