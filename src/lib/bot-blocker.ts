import 'server-only';
// Bot blocker — database-backed IP blocking with an in-memory cache. Ported from
// the printingcomics Express/Prisma implementation and adapted to this app's
// better-sqlite3 layer. An IP that trips the suspicious-activity threshold is
// blocked for 24h. Search-engine and social crawlers are never recorded as
// suspicious (see isSearchEngine / middleware.ts), so SEO crawling is unaffected.
import { appendFileSync } from 'node:fs';
import { getDb } from './db';
import { isSearchEngine } from './bot-ua';
export { isSearchEngine, isMaliciousBot } from './bot-ua';

const BOT_BLOCK_THRESHOLD = 3;
const SUSPICIOUS_WINDOW_MS = 60 * 60 * 1000;   // 1 hour
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
// When an IP is blocked we append it here; the host-side botblock-watcher
// service turns it into an iptables DROP rule within seconds (see scripts/).
const PENDING_FILE = process.env.BOTBLOCK_PENDING_FILE ?? '/tmp/botblock-pending';

const blockedCache = new Map<string, number>(); // ip -> expiresAt (ms)

export function isIPBlocked(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  const now = Date.now();
  const cached = blockedCache.get(ip);
  if (cached) {
    if (cached > now) return true;
    blockedCache.delete(ip);
  }
  try {
    const row = getDb().prepare('SELECT expires_at FROM blocked_ips WHERE ip_address = ?').get(ip) as { expires_at: number } | undefined;
    if (row && row.expires_at > now) { blockedCache.set(ip, row.expires_at); return true; }
    if (row) getDb().prepare('DELETE FROM blocked_ips WHERE ip_address = ?').run(ip);
    return false;
  } catch (err) {
    console.error('[bot-blocker] isIPBlocked:', err);
    return false;
  }
}

export function recordSuspiciousActivity(
  ip: string, reason: string, meta?: { path?: string; userAgent?: string },
): boolean {
  if (!ip || ip === 'unknown') return false;
  // Never punish legitimate crawlers.
  if (meta?.userAgent && isSearchEngine(meta.userAgent)) return false;
  try {
    const now = Date.now();
    const db = getDb();
    db.prepare('INSERT INTO suspicious_activity (ip_address, reason, path, user_agent, created_at) VALUES (?,?,?,?,?)')
      .run(ip, reason, meta?.path ?? null, meta?.userAgent ?? null, now);
    const since = now - SUSPICIOUS_WINDOW_MS;
    const { c } = db.prepare('SELECT COUNT(*) AS c FROM suspicious_activity WHERE ip_address = ? AND created_at >= ?').get(ip, since) as { c: number };
    if (c >= BOT_BLOCK_THRESHOLD) return blockIP(ip, reason, meta);
    return false;
  } catch (err) {
    console.error('[bot-blocker] recordSuspiciousActivity:', err);
    return false;
  }
}

export function blockIP(ip: string, reason: string, meta?: { path?: string; userAgent?: string }): boolean {
  if (!ip || ip === 'unknown') return false;
  const now = Date.now(), expiresAt = now + BLOCK_DURATION_MS;
  try {
    getDb().prepare(`
      INSERT INTO blocked_ips (ip_address, reason, violation_count, last_user_agent, last_path, blocked_at, expires_at)
      VALUES (?,?,1,?,?,?,?)
      ON CONFLICT(ip_address) DO UPDATE SET
        reason=excluded.reason, violation_count=violation_count+1,
        last_user_agent=excluded.last_user_agent, last_path=excluded.last_path, expires_at=excluded.expires_at
    `).run(ip, reason, meta?.userAgent ?? null, meta?.path ?? null, now, expiresAt);
    blockedCache.set(ip, expiresAt);
    // Hand the IP to the firewall watcher for an OS-level iptables DROP.
    try { appendFileSync(PENDING_FILE, `${ip}\n`); } catch { /* watcher optional */ }
    console.info(`[bot-blocker] BLOCKED ${ip} — ${reason}`);
    return true;
  } catch (err) {
    console.error('[bot-blocker] blockIP:', err);
    return false;
  }
}

export function unblockIP(ip: string): boolean {
  try { getDb().prepare('DELETE FROM blocked_ips WHERE ip_address = ?').run(ip); blockedCache.delete(ip); return true; }
  catch (err) { console.error('[bot-blocker] unblockIP:', err); return false; }
}

export function getBlockedIPs() {
  try { return getDb().prepare('SELECT * FROM blocked_ips WHERE expires_at > ? ORDER BY blocked_at DESC').all(Date.now()); }
  catch { return []; }
}

