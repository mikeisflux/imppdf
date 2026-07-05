import 'server-only';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { serverEnv } from './config';

// A single shared connection for the whole server process. Next.js can re-import
// modules across hot reloads in dev, so we cache the connection on globalThis.
declare global {
  // eslint-disable-next-line no-var
  var __impositionpdf_db: Database.Database | undefined;
}

function open(): Database.Database {
  const path = resolve(process.cwd(), serverEnv().databasePath);
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

export function getDb(): Database.Database {
  if (!globalThis.__impositionpdf_db) globalThis.__impositionpdf_db = open();
  return globalThis.__impositionpdf_db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
      plan          TEXT NOT NULL DEFAULT 'free',    -- 'free' | 'pro'
      status        TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'suspended'
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id                INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      paypal_subscription_id TEXT UNIQUE,
      plan_id                TEXT,
      billing_cycle          TEXT,                 -- 'monthly' | 'yearly'
      status                 TEXT NOT NULL,        -- ACTIVE | CANCELLED | SUSPENDED | EXPIRED | APPROVAL_PENDING
      current_period_end     INTEGER,
      created_at             INTEGER NOT NULL,
      updated_at             INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT,
      prefix       TEXT NOT NULL,          -- shown to the user, e.g. imp_live_ab12
      key_hash     TEXT NOT NULL,          -- sha256 of the full secret
      last4        TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'active', -- 'active' | 'revoked'
      last_used_at INTEGER,
      request_count INTEGER NOT NULL DEFAULT 0,
      created_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      subject    TEXT,
      topic      TEXT,                     -- 'support' | 'enterprise' | 'general'
      message    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'new', -- 'new' | 'read' | 'archived'
      emailed    INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usage_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
      api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
      kind       TEXT NOT NULL,            -- 'download' | 'api_impose'
      bytes      INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocked_ips (
      ip_address       TEXT PRIMARY KEY,
      reason           TEXT NOT NULL,
      violation_count  INTEGER NOT NULL DEFAULT 1,
      last_user_agent  TEXT,
      last_path        TEXT,
      blocked_at       INTEGER NOT NULL,
      expires_at       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suspicious_activity (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address  TEXT NOT NULL,
      reason      TEXT NOT NULL,
      path        TEXT,
      user_agent  TEXT,
      created_at  INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_suspicious_ip ON suspicious_activity(ip_address, created_at);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_events(user_id);
  `);
}
