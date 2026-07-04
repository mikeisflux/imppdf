import { badRequest, json, unauthorized } from '@/lib/http';
import { getCurrentAdmin } from '@/lib/auth';
import { setContactStatus } from '@/lib/contact';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  if (!['new', 'read', 'archived'].includes(status)) return badRequest('Invalid status.');
  setContactStatus(Number(id), status);
  return json({ ok: true });
}
