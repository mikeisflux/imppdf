import { badRequest, clientIp, json } from '@/lib/http';
import { isIPBlocked } from '@/lib/bot-blocker';
import { completeReset, userForResetToken } from '@/lib/password-reset';
import { createSession } from '@/lib/auth';

// GET ?token= — is this link still live? (The page asks before showing the
// form, so a stale link gets a clear message instead of a failed submit.)
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') || '';
  return json({ valid: Boolean(userForResetToken(token)) });
}

// POST { token, password } — set the password, burn the token, sign them in.
export async function POST(req: Request) {
  const ip = clientIp(req) ?? 'unknown';
  if (isIPBlocked(ip)) return json({ error: 'Access denied' }, 403);

  const body = await req.json().catch(() => null);
  if (!body) return badRequest('Invalid request.');
  const { token, password } = body as Record<string, string>;
  if (!token) return badRequest('This reset link is not valid.');
  if (!password || password.length < 8) return badRequest('Password must be at least 8 characters.');

  const user = await completeReset(token, password);
  if (!user) return badRequest('This reset link has expired or was already used. Request a new one.');

  await createSession(user.id);
  return json({ ok: true, admin: user.role === 'admin' });
}
