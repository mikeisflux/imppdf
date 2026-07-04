import { json, unauthorized } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth';
import { revokeApiKey } from '@/lib/apikeys';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  revokeApiKey(user.id, Number(id));
  return json({ ok: true });
}
