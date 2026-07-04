import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { getDb } from './db';
import { serverEnv } from './config';

// Full key format:  imp_live_<32 hex chars>
// We store only the sha256 hash + a display prefix + last4. The raw key is
// shown to the user exactly once, at creation time.

function sha256(s: string) {
  return createHash('sha256').update(s).digest('hex');
}

export interface NewApiKey {
  id: number;
  fullKey: string; // shown once
  prefix: string;
  last4: string;
  name: string | null;
}

export function createApiKey(userId: number, name?: string): NewApiKey {
  const live = serverEnv().paypalEnv === 'live' ? 'live' : 'test';
  const raw = randomBytes(24).toString('hex'); // 48 chars
  const fullKey = `imp_${live}_${raw}`;
  const prefix = `imp_${live}_${raw.slice(0, 6)}`;
  const last4 = raw.slice(-4);
  const info = getDb()
    .prepare(
      `INSERT INTO api_keys (user_id, name, prefix, key_hash, last4, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
    )
    .run(userId, name || null, prefix, sha256(fullKey), last4, Date.now());
  return { id: Number(info.lastInsertRowid), fullKey, prefix, last4, name: name || null };
}

export interface ApiKeyRow {
  id: number;
  user_id: number;
  name: string | null;
  prefix: string;
  last4: string;
  status: 'active' | 'revoked';
  last_used_at: number | null;
  request_count: number;
  created_at: number;
}

export function listApiKeys(userId: number): ApiKeyRow[] {
  return getDb()
    .prepare('SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as ApiKeyRow[];
}

export function revokeApiKey(userId: number, keyId: number) {
  getDb()
    .prepare("UPDATE api_keys SET status = 'revoked' WHERE id = ? AND user_id = ?")
    .run(keyId, userId);
}

export interface ApiKeyWithUser extends ApiKeyRow { email: string }
export function listAllApiKeys(): ApiKeyWithUser[] {
  return getDb()
    .prepare(
      `SELECT ak.*, u.email FROM api_keys ak JOIN users u ON u.id = ak.user_id
       ORDER BY ak.created_at DESC`,
    )
    .all() as ApiKeyWithUser[];
}

export function adminRevokeKey(keyId: number) {
  getDb().prepare("UPDATE api_keys SET status = 'revoked' WHERE id = ?").run(keyId);
}

// Resolves a raw API key to its owning user (or null). Also bumps usage stats.
export function resolveApiKey(rawKey: string):
  | { keyId: number; userId: number; plan: string }
  | null {
  const row = getDb()
    .prepare(
      `SELECT ak.id AS keyId, ak.user_id AS userId, u.plan AS plan, ak.status AS status, u.status AS ustatus
       FROM api_keys ak JOIN users u ON u.id = ak.user_id
       WHERE ak.key_hash = ?`,
    )
    .get(sha256(rawKey)) as
    | { keyId: number; userId: number; plan: string; status: string; ustatus: string }
    | undefined;
  if (!row || row.status !== 'active' || row.ustatus !== 'active') return null;
  getDb()
    .prepare(
      'UPDATE api_keys SET last_used_at = ?, request_count = request_count + 1 WHERE id = ?',
    )
    .run(Date.now(), row.keyId);
  return { keyId: row.keyId, userId: row.userId, plan: row.plan };
}
