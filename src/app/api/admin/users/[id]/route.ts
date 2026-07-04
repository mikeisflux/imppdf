import { badRequest, json, unauthorized } from '@/lib/http';
import { getCurrentAdmin } from '@/lib/auth';
import { findUserById, setUserPlan, setUserRole, setUserStatus } from '@/lib/users';

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

  return json({ ok: true });
}
