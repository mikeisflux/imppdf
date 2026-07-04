import 'server-only';
import { getDb } from './db';

// Free-tier download accounting for signed-in users. Anonymous users are tracked
// client-side in localStorage using the same limit/cooldown rules.

export function recordDownload(userId: number, apiKeyId?: number, bytes = 0) {
  getDb()
    .prepare(
      `INSERT INTO usage_events (user_id, api_key_id, kind, bytes, created_at)
       VALUES (?, ?, 'download', ?, ?)`,
    )
    .run(userId, apiKeyId ?? null, bytes, Date.now());
}

export function recordApiImpose(userId: number, apiKeyId: number, bytes: number) {
  getDb()
    .prepare(
      `INSERT INTO usage_events (user_id, api_key_id, kind, bytes, created_at)
       VALUES (?, ?, 'api_impose', ?, ?)`,
    )
    .run(userId, apiKeyId, bytes, Date.now());
}

export function downloadStats(userId: number): { count: number; lastAt: number | null } {
  const r = getDb()
    .prepare(
      `SELECT COUNT(*) AS count, MAX(created_at) AS lastAt
       FROM usage_events WHERE user_id = ? AND kind = 'download'`,
    )
    .get(userId) as { count: number; lastAt: number | null };
  return { count: r.count || 0, lastAt: r.lastAt || null };
}

export interface UsageTotals { downloads: number; apiCalls: number; apiBytes: number; }
export function usageTotals(): UsageTotals {
  const r = getDb()
    .prepare(
      `SELECT
         SUM(CASE WHEN kind = 'download' THEN 1 ELSE 0 END) AS downloads,
         SUM(CASE WHEN kind = 'api_impose' THEN 1 ELSE 0 END) AS apiCalls,
         SUM(CASE WHEN kind = 'api_impose' THEN bytes ELSE 0 END) AS apiBytes
       FROM usage_events`,
    )
    .get() as { downloads: number; apiCalls: number; apiBytes: number };
  return { downloads: r.downloads || 0, apiCalls: r.apiCalls || 0, apiBytes: r.apiBytes || 0 };
}
