import { badRequest, json, unauthorized } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth';
import { createApiKey, listApiKeys } from '@/lib/apikeys';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const keys = listApiKeys(user.id).map((k) => ({
    id: k.id, name: k.name, prefix: k.prefix, last4: k.last4, status: k.status,
    lastUsedAt: k.last_used_at, requestCount: k.request_count, createdAt: k.created_at,
  }));
  return json({ keys });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const name = (body?.name as string | undefined)?.slice(0, 60);

  // Cap keys per account to keep things tidy.
  if (listApiKeys(user.id).filter((k) => k.status === 'active').length >= 10) {
    return badRequest('You have reached the maximum of 10 active API keys.');
  }

  const key = createApiKey(user.id, name);
  return json({ ok: true, key });
}
