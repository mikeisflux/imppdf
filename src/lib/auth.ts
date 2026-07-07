import 'server-only';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { serverEnv } from './config';
import { getDb } from './db';

const SESSION_COOKIE = 'pp_session';
const ADMIN_COOKIE = 'pp_admin';
const DAY = 60 * 60 * 24;

export interface SessionUser {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  status: 'active' | 'suspended';
}

function secret() {
  return new TextEncoder().encode(serverEnv().authSecret);
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

async function signToken(payload: Record<string, unknown>, maxAgeSec: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSec)
    .sign(secret());
}

// ── User sessions ────────────────────────────────────────────────────────────

export async function createSession(userId: number) {
  const token = await signToken({ uid: userId }, 30 * DAY);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * DAY,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const uid = Number(payload.uid);
    if (!uid) return null;
    const row = getDb()
      .prepare('SELECT id, email, name, role, plan, status FROM users WHERE id = ?')
      .get(uid) as SessionUser | undefined;
    if (!row || row.status === 'suspended') return null;
    return row;
  } catch {
    return null;
  }
}

// ── Admin sessions (separate cookie so /admin is isolated from the app) ──────

export async function createAdminSession(userId: number) {
  const token = await signToken({ uid: userId, admin: true }, 7 * DAY);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * DAY,
  });
}

export async function destroyAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function getCurrentAdmin(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.admin) return null;
    const uid = Number(payload.uid);
    // If this browser is ALSO signed into the regular app as a different user,
    // drop admin privileges. The admin/user sessions are separate cookies, so
    // without this a stale admin cookie would keep granting /admin access even
    // after logging in as an ordinary user. You can't be "acting as" a normal
    // user and still hold the admin panel.
    const sess = jar.get(SESSION_COOKIE)?.value;
    if (sess) {
      try {
        const { payload: sp } = await jwtVerify(sess, secret());
        if (Number(sp.uid) !== uid) return null;
      } catch { /* invalid/expired user session — ignore, admin cookie stands */ }
    }
    const row = getDb()
      .prepare('SELECT id, email, name, role, plan, status FROM users WHERE id = ?')
      .get(uid) as SessionUser | undefined;
    if (!row || row.role !== 'admin' || row.status === 'suspended') return null;
    return row;
  } catch {
    return null;
  }
}
