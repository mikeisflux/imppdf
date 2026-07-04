import { json, unauthorized, badRequest } from '@/lib/http';
import { getCurrentAdmin } from '@/lib/auth';
import { setMany, SETTING_KEYS } from '@/lib/settings';

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('Invalid request.');

  // Only accept known keys. Secret fields left blank are skipped so submitting
  // the form without re-typing a secret doesn't wipe it.
  const SECRET = new Set(['recaptchaSecret', 'paypalSecret', 'smtpPass']);
  const updates: Record<string, string> = {};
  for (const key of SETTING_KEYS) {
    if (!(key in body)) continue;
    const val = String(body[key] ?? '');
    if (SECRET.has(key) && val === '') continue; // don't overwrite secret with blank
    updates[key] = val;
  }
  setMany(updates);
  return json({ ok: true });
}
