#!/usr/bin/env node
// SQLite backup with rotation. Uses SQLite's online backup API (via
// better-sqlite3 .backup()), so it is safe to run against the live WAL database
// without stopping the app. Run from cron/systemd-timer:
//
//   DATABASE_PATH=/opt/pdfpress/app/data/impositionpdf.db \
//   BACKUP_DIR=/opt/pdfpress/backups BACKUP_KEEP=14 node scripts/backup-db.mjs
//
// Writes <BACKUP_DIR>/impositionpdf-YYYYMMDD-HHMMSS.db and prunes all but the
// newest BACKUP_KEEP files.
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const dbPath = resolve(process.cwd(), process.env.DATABASE_PATH || './data/impositionpdf.db');
const backupDir = resolve(process.cwd(), process.env.BACKUP_DIR || './backups');
const keep = Math.max(1, Number(process.env.BACKUP_KEEP || '14'));

if (!existsSync(dbPath)) { console.error(`✗ Database not found at ${dbPath}`); process.exit(1); }
if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });

// Timestamp: YYYYMMDD-HHMMSS (local time).
const d = new Date();
const p = (n) => String(n).padStart(2, '0');
const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
const prefix = basename(dbPath).replace(/\.db$/, '');
const dest = join(backupDir, `${prefix}-${stamp}.db`);

const db = new Database(dbPath, { readonly: true });
try {
  await db.backup(dest);
  console.log(`✓ Backup written: ${dest}`);
} finally {
  db.close();
}

// Rotate: keep the newest `keep` backups for this prefix.
const mine = readdirSync(backupDir)
  .filter((f) => f.startsWith(`${prefix}-`) && f.endsWith('.db'))
  .map((f) => ({ f, t: statSync(join(backupDir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);
for (const { f } of mine.slice(keep)) {
  unlinkSync(join(backupDir, f));
  console.log(`• Pruned old backup: ${f}`);
}
