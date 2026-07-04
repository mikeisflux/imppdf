import 'server-only';
import { serverEnv } from './config';

// Verifies a reCAPTCHA token (works for both v2 checkbox and v3 score).
// If no secret is configured we allow the request through (dev convenience) but
// log a warning so it is obvious the site is unprotected.
export async function verifyRecaptcha(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<{ ok: boolean; error?: string }> {
  const { recaptchaSecret, recaptchaV3MinScore } = serverEnv();

  if (!recaptchaSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[recaptcha] RECAPTCHA_SECRET_KEY is not set — forms are unprotected.');
    }
    return { ok: true };
  }

  if (!token) return { ok: false, error: 'Please complete the CAPTCHA.' };

  const body = new URLSearchParams({ secret: recaptchaSecret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as {
      success: boolean;
      score?: number;
      'error-codes'?: string[];
    };
    if (!data.success) {
      return { ok: false, error: 'CAPTCHA verification failed. Please try again.' };
    }
    // v3 returns a score; enforce the minimum when present.
    if (typeof data.score === 'number' && data.score < recaptchaV3MinScore) {
      return { ok: false, error: 'CAPTCHA score too low. Please try again.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the CAPTCHA service.' };
  }
}
