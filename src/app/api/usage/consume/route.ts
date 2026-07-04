import { json } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth';
import { downloadStats, recordDownload } from '@/lib/usage';
import { freeTier } from '@/lib/config';

// Records a download for a signed-in free user and returns whether it was
// allowed. Pro users are always allowed and not metered. Anonymous users are
// handled purely client-side, so this endpoint only records for signed-in users.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return json({ ok: true, metered: false });
  if (user.plan === 'pro') return json({ ok: true, metered: false, plan: 'pro' });

  const stats = downloadStats(user.id);
  const now = Date.now();
  const cooldownMs = freeTier.cooldownHours * 3600 * 1000;
  const cooldownUntil = stats.lastAt ? stats.lastAt + cooldownMs : 0;
  const remaining = Math.max(0, freeTier.downloadLimit - stats.count);

  if (remaining <= 0) {
    return json({ ok: false, reason: 'limit', remaining: 0 }, 200);
  }
  if (now < cooldownUntil) {
    return json({ ok: false, reason: 'cooldown', cooldownUntil, remaining }, 200);
  }

  recordDownload(user.id);
  return json({ ok: true, metered: true, remaining: remaining - 1, cooldownUntil: now + cooldownMs });
}
