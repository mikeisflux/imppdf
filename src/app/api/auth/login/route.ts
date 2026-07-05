import { badRequest, clientIp, json } from '@/lib/http';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { findUserByEmail } from '@/lib/users';
import { createSession, verifyPassword } from '@/lib/auth';
import { isIPBlocked, recordSuspiciousActivity } from '@/lib/bot-blocker';

export async function POST(req: Request) {
  const ip = clientIp(req) ?? 'unknown';
  if (isIPBlocked(ip)) return json({ error: 'Access denied' }, 403);
  const ua = req.headers.get('user-agent') ?? undefined;
  const flag = (reason: string) => recordSuspiciousActivity(ip, reason, { path: '/api/auth/login', userAgent: ua });

  const body = await req.json().catch(() => null);
  if (!body) return badRequest('Invalid request.');
  const { email, password, recaptchaToken } = body as Record<string, string>;

  const captcha = await verifyRecaptcha(recaptchaToken, ip);
  if (!captcha.ok) return badRequest(captcha.error || 'CAPTCHA failed.');

  if (!email || !password) return badRequest('Email and password are required.');

  const user = findUserByEmail(email);
  if (!user || user.status === 'suspended') { flag('auth:unknown-user'); return badRequest('Invalid email or password.'); }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) { flag('auth:bad-password'); return badRequest('Invalid email or password.'); }

  await createSession(user.id);
  return json({ ok: true, user: { email: user.email, name: user.name, plan: user.plan } });
}
