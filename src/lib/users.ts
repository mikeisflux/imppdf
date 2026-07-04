import 'server-only';
import { getDb } from './db';
import { hashPassword } from './auth';

export interface UserRow {
  id: number;
  email: string;
  name: string | null;
  password_hash: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  status: 'active' | 'suspended';
  created_at: number;
  updated_at: number;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return getDb()
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase().trim()) as UserRow | undefined;
}

export function findUserById(id: number): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export async function createUser(opts: {
  email: string;
  password: string;
  name?: string;
  role?: 'user' | 'admin';
}): Promise<UserRow> {
  const now = Date.now();
  const hash = await hashPassword(opts.password);
  const info = getDb()
    .prepare(
      `INSERT INTO users (email, name, password_hash, role, plan, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'free', 'active', ?, ?)`,
    )
    .run(
      opts.email.toLowerCase().trim(),
      opts.name || null,
      hash,
      opts.role || 'user',
      now,
      now,
    );
  return findUserById(Number(info.lastInsertRowid))!;
}

export function setUserPlan(userId: number, plan: 'free' | 'pro') {
  getDb()
    .prepare('UPDATE users SET plan = ?, updated_at = ? WHERE id = ?')
    .run(plan, Date.now(), userId);
}

export function setUserStatus(userId: number, status: 'active' | 'suspended') {
  getDb()
    .prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, Date.now(), userId);
}

export function setUserRole(userId: number, role: 'user' | 'admin') {
  getDb()
    .prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
    .run(role, Date.now(), userId);
}

export async function setUserPassword(userId: number, password: string) {
  const hash = await hashPassword(password);
  getDb()
    .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(hash, Date.now(), userId);
}

export function listUsers(): UserRow[] {
  return getDb().prepare('SELECT * FROM users ORDER BY created_at DESC').all() as UserRow[];
}

export function countUsers(): number {
  const r = getDb().prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  return r.c;
}
