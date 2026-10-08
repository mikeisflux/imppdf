import { badRequest, clientIp, isValidEmail, json } from '@/lib/http';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { isIPBlocked } from '@/lib/bot-blocker';
import { sendResetEmail } from '@/lib/password-reset';

// Always answers "ok" for a well-formed address, whether or not an account
// exists, so the form cannot be used to find out who has one. Unknown
// addresses are deliberately NOT recorded as suspicious activity: a person
// who mistypes their email must not get their IP blocked.
export async function POST(req: Request) {
  const ip = clientIp(req) ?? 'unknown';
  if (isIPBlocked(ip)) return json({ error: 'Access denied' }, 403);

  const body = await req.json().catch(() => null);
  if (!body) return badRequest('Invalid request.');
  const { email, recaptchaToken } = body as Record<string, string>;

  const captcha = await verifyRecaptcha(recaptchaToken, ip);
  if (!captcha.ok) return badRequest(captcha.error || 'CAPTCHA failed.');
  if (!email || !isValidEmail(email)) return badRequest('Enter a valid email address.');

  await sendResetEmail(email.trim());
  return json({ ok: true });
}
