import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { getDb } from './db';
import { sendMail } from './email';
import { findUserByEmail, setUserPassword, type UserRow } from './users';
import { siteName, siteUrl } from './config';

// Forgot-password flow. The link in the email carries a random token; only its
// sha256 is stored, so a copy of the database cannot be turned into a working
// link. Tokens live for an hour, work once, and issuing a new one voids any
// older ones for the same account.
const TOKEN_TTL_MS = 60 * 60 * 1000;
// At most this many emails per account per hour, so the form cannot be used to
// flood somebody's inbox.
const MAX_PER_HOUR = 3;

const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex');

/** Issue a token for the user and return the raw value for the link, or null
 *  if the account has already asked too often this hour. */
export function issueResetToken(user: UserRow): string | null {
  const db = getDb();
  const now = Date.now();
  const { c } = db
    .prepare('SELECT COUNT(*) AS c FROM password_resets WHERE user_id = ? AND created_at >= ?')
    .get(user.id, now - 60 * 60 * 1000) as { c: number };
  if (c >= MAX_PER_HOUR) return null;
  // One live token per account: a new request replaces the old link.
  db.prepare('UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL').run(now, user.id);
  const raw = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO password_resets (user_id, token_hash, expires_at, created_at) VALUES (?,?,?,?)')
    .run(user.id, hashToken(raw), now + TOKEN_TTL_MS, now);
  return raw;
}

/** The user a live token belongs to, or null if it is unknown, used or expired. */
export function userForResetToken(raw: string): UserRow | undefined {
  if (!raw || raw.length < 20) return undefined;
  const row = getDb()
    .prepare(`SELECT u.* FROM password_resets r JOIN users u ON u.id = r.user_id
              WHERE r.token_hash = ? AND r.used_at IS NULL AND r.expires_at > ?`)
    .get(hashToken(raw), Date.now()) as UserRow | undefined;
  return row;
}

/** Set the new password and burn the token. Returns the user, or null if the
 *  token was not live. */
export async function completeReset(raw: string, password: string): Promise<UserRow | null> {
  const user = userForResetToken(raw);
  if (!user) return null;
  await setUserPassword(user.id, password);
  getDb().prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').run(Date.now(), hashToken(raw));
  return user;
}

/** Email a reset link to the address, if an account exists for it. Resolves
 *  the same way either way so the caller cannot learn whether it exists. */
export async function sendResetEmail(email: string): Promise<void> {
  const user = findUserByEmail(email);
  if (!user || user.status === 'suspended') return;
  const raw = issueResetToken(user);
  if (!raw) return;
  const link = `${siteUrl}/reset-password?token=${raw}`;
  const text = [
    `Someone asked to reset the password for ${user.email} on ${siteName}.`,
    '',
    'Open this link to choose a new password. It works once and expires in one hour:',
    link,
    '',
    'If that was not you, ignore this email. Your password has not changed.',
  ].join('\n');
  const html = `
    <div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#14120f;background:#f4f1ea">
      <div style="font-weight:700;font-size:16px;margin-bottom:28px">${siteName}</div>
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.1;margin:0 0 16px">Reset your password</h1>
      <p style="font-size:15px;line-height:1.55;margin:0 0 20px">Someone asked to reset the password for <b>${user.email}</b>. Open the link below to choose a new one. It works once and expires in one hour.</p>
      <p style="margin:0 0 28px"><a href="${link}" style="display:inline-block;background:#14120f;color:#f4f1ea;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px">Choose a new password</a></p>
      <p style="font-size:13px;line-height:1.55;color:#6f6a60;margin:0 0 8px">If the button does not work, paste this into your browser:<br><a href="${link}" style="color:#14120f;word-break:break-all">${link}</a></p>
      <p style="font-size:13px;line-height:1.55;color:#6f6a60;margin:0">If that was not you, ignore this email. Your password has not changed.</p>
    </div>`;
  const ok = await sendMail({ to: user.email, subject: `Reset your ${siteName} password`, text, html });
  if (!ok) console.error('[password-reset] email not sent for', user.email);
}
