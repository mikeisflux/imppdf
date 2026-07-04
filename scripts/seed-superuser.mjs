// Seed / reset a superuser: role=admin + plan=pro (lifetime — no subscription to
// expire it). Idempotent: creates the account if missing, otherwise promotes it
// and resets the password.
//
// Credentials are read from the environment so nothing sensitive is committed:
//   SUPERUSER_EMAIL="you@example.com" SUPERUSER_PASSWORD='secret' npm run seed:superuser
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnv(resolve(process.cwd(), '.env.local'));
loadEnv(resolve(process.cwd(), '.env'));

const email = (process.env.SUPERUSER_EMAIL || '').toLowerCase().trim();
const password = process.env.SUPERUSER_PASSWORD || '';
if (!email || !password) {
  console.error('Set SUPERUSER_EMAIL and SUPERUSER_PASSWORD, e.g.:');
  console.error("  SUPERUSER_EMAIL=you@example.com SUPERUSER_PASSWORD='secret' npm run seed:superuser");
  process.exit(1);
}

const dbPath = resolve(process.cwd(), process.env.DATABASE_PATH || './data/impositionpdf.db');
const dir = dirname(dbPath);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure the users table exists (safe if db:init already ran).
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'free', status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);`);

const now = Date.now();
const hash = bcrypt.hashSync(password, 10);
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existing) {
  db.prepare(
    `UPDATE users SET role='admin', plan='pro', status='active',
       password_hash=?, updated_at=? WHERE id=?`,
  ).run(hash, now, existing.id);
  console.log(`Superuser updated: ${email} (role=admin, plan=pro, lifetime).`);
} else {
  db.prepare(
    `INSERT INTO users (email, name, password_hash, role, plan, status, created_at, updated_at)
     VALUES (?, 'Superuser', ?, 'admin', 'pro', 'active', ?, ?)`,
  ).run(email, hash, now, now);
  console.log(`Superuser created: ${email} (role=admin, plan=pro, lifetime).`);
}

db.close();
