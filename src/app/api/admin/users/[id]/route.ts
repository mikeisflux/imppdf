import { badRequest, json, unauthorized } from '@/lib/http';
import { getCurrentAdmin } from '@/lib/auth';
import { findUserById, setUserPlan, setUserRole, setUserStatus } from '@/lib/users';
import { clearManualSubscription, setManualSubscription } from '@/lib/subscriptions';

const SUB_STATUSES = ['ACTIVE', 'CANCELLED', 'SUSPENDED', 'EXPIRED'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  const { id } = await params;
  const userId = Number(id);
  const target = findUserById(userId);
  if (!target) return badRequest('User not found.');

  const body = await req.json().catch(() => ({}));

  // Guard: an admin cannot suspend or demote themselves via this endpoint.
  if (userId === admin.id && (body.status === 'suspended' || body.role === 'user')) {
    return badRequest('You cannot suspend or demote your own admin account.');
  }

  if (body.plan === 'free' || body.plan === 'pro') setUserPlan(userId, body.plan);
  if (body.role === 'user' || body.role === 'admin') setUserRole(userId, body.role);
  if (body.status === 'active' || body.status === 'suspended') setUserStatus(userId, body.status);

  // Subscription grant/edit. `subscription: 'none'` removes any manual grant;
  // 'ACTIVE' with no endDate = lifetime (free-forever) comp; with endDate = a
  // timed comp. Other statuses drop the user to free.
  if (typeof body.subscription === 'string') {
    if (body.subscription === 'none') {
      clearManualSubscription(userId);
    } else if (SUB_STATUSES.includes(body.subscription)) {
      const end = body.subscriptionEndDate ? Date.parse(body.subscriptionEndDate) : null;
      setManualSubscription(userId, body.subscription, Number.isNaN(end as number) ? null : end);
    } else {
      return badRequest('Invalid subscription status.');
    }
  }

  return json({ ok: true });
}
