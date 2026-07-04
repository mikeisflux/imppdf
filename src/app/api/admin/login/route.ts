import { badRequest, clientIp, json } from '@/lib/http';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { findUserByEmail } from '@/lib/users';
import { createAdminSession, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return badRequest('Invalid request.');
  const { email, password, recaptchaToken } = body as Record<string, string>;

  const captcha = await verifyRecaptcha(recaptchaToken, clientIp(req));
  if (!captcha.ok) return badRequest(captcha.error || 'CAPTCHA failed.');

  if (!email || !password) return badRequest('Email and password are required.');

  const user = findUserByEmail(email);
  // Uniform error to avoid leaking which accounts are admins.
  if (!user || user.role !== 'admin' || user.status === 'suspended') {
    return badRequest('Invalid credentials.');
  }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return badRequest('Invalid credentials.');

  await createAdminSession(user.id);
  return json({ ok: true });
}
