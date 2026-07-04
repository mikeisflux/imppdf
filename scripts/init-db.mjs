// Bootstraps the SQLite database and creates the initial admin account.
// Usage: npm run db:init   (reads ADMIN_EMAIL / ADMIN_PASSWORD from env/.env.local)
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Minimal .env.local loader (no dependency on dotenv).
function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnv(resolve(process.cwd(), '.env.local'));
loadEnv(resolve(process.cwd(), '.env'));

const dbPath = resolve(process.cwd(), process.env.DATABASE_PATH || './data/impositionpdf.db');
const dir = dirname(dbPath);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'free', status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paypal_subscription_id TEXT UNIQUE, plan_id TEXT, billing_cycle TEXT,
  status TEXT NOT NULL, current_period_end INTEGER,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT, prefix TEXT NOT NULL, key_hash TEXT NOT NULL, last4 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', last_used_at INTEGER,
  request_count INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL,
  subject TEXT, topic TEXT, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  emailed INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
  kind TEXT NOT NULL, bytes INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_events(user_id);
`;
db.exec(schema);

const email = (process.env.ADMIN_EMAIL || 'admin@impositionpdf.com').toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || 'change-me-please';

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
if (existing) {
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
  console.log(`Admin already exists (${email}) — ensured role=admin.`);
} else {
  const now = Date.now();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (email, name, password_hash, role, plan, status, created_at, updated_at)
     VALUES (?, 'Administrator', ?, 'admin', 'pro', 'active', ?, ?)`,
  ).run(email, hash, now, now);
  console.log(`Created admin account: ${email}`);
  if (password === 'change-me-please') {
    console.warn('  ⚠  Using the default password — change ADMIN_PASSWORD and re-run, or reset it in /admin.');
  }
}

console.log(`Database ready at ${dbPath}`);
db.close();
