import { badRequest, clientIp, isValidEmail, json } from '@/lib/http';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { createUser, findUserByEmail } from '@/lib/users';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return badRequest('Invalid request.');
  const { email, password, name, recaptchaToken } = body as Record<string, string>;

  const captcha = await verifyRecaptcha(recaptchaToken, clientIp(req));
  if (!captcha.ok) return badRequest(captcha.error || 'CAPTCHA failed.');

  if (!email || !isValidEmail(email)) return badRequest('Enter a valid email address.');
  if (!password || password.length < 8) return badRequest('Password must be at least 8 characters.');

  if (findUserByEmail(email)) return badRequest('An account with that email already exists.');

  const user = await createUser({ email, password, name });
  await createSession(user.id);
  return json({ ok: true, user: { email: user.email, name: user.name, plan: user.plan } });
}
