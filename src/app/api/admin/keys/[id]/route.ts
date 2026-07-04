import { json, unauthorized } from '@/lib/http';
import { getCurrentAdmin } from '@/lib/auth';
import { adminRevokeKey } from '@/lib/apikeys';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  const { id } = await params;
  adminRevokeKey(Number(id));
  return json({ ok: true });
}
