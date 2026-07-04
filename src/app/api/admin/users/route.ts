import { badRequest, isValidEmail, json, unauthorized } from '@/lib/http';
import { getCurrentAdmin } from '@/lib/auth';
import { createUser, findUserByEmail, setUserPlan } from '@/lib/users';
import { setManualSubscription } from '@/lib/subscriptions';

// Admin: create a user account directly.
export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim();
  const password = String(body.password || '');
  const name = body.name ? String(body.name) : undefined;
  const plan = body.plan === 'pro' ? 'pro' : 'free';
  const role = body.role === 'admin' ? 'admin' : 'user';
  const lifetime = Boolean(body.lifetime); // grant a free-forever Pro comp

  if (!isValidEmail(email)) return badRequest('Enter a valid email address.');
  if (password.length < 8) return badRequest('Password must be at least 8 characters.');
  if (findUserByEmail(email)) return badRequest('An account with that email already exists.');

  const user = await createUser({ email, password, name, role });
  if (plan === 'pro' || lifetime) setUserPlan(user.id, 'pro');
  if (lifetime) setManualSubscription(user.id, 'ACTIVE', null); // no end date = forever

  return json({ ok: true, user: { id: user.id, email: user.email } });
}
