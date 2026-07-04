import { json } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth';
import { downloadStats } from '@/lib/usage';
import { freeTier } from '@/lib/config';

// Returns the caller's download entitlement. Anonymous callers get the limits
// only and enforce client-side via localStorage.
export async function GET() {
  const user = await getCurrentUser();
  const base = {
    limit: freeTier.downloadLimit,
    cooldownHours: freeTier.cooldownHours,
  };
  if (!user) {
    return json({ authenticated: false, plan: 'free', ...base, count: 0, lastAt: null });
  }
  if (user.plan === 'pro') {
    return json({ authenticated: true, plan: 'pro', ...base, count: 0, lastAt: null });
  }
  const stats = downloadStats(user.id);
  return json({ authenticated: true, plan: 'free', ...base, ...stats });
}
