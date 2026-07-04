import 'server-only';
import { getDb } from './db';

export interface ContactRow {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  topic: string | null;
  message: string;
  status: 'new' | 'read' | 'archived';
  emailed: number;
  created_at: number;
}

export function saveContactMessage(opts: {
  name: string;
  email: string;
  subject?: string;
  topic?: string;
  message: string;
  emailed: boolean;
}): number {
  const info = getDb()
    .prepare(
      `INSERT INTO contact_messages (name, email, subject, topic, message, status, emailed, created_at)
       VALUES (?, ?, ?, ?, ?, 'new', ?, ?)`,
    )
    .run(
      opts.name,
      opts.email,
      opts.subject || null,
      opts.topic || null,
      opts.message,
      opts.emailed ? 1 : 0,
      Date.now(),
    );
  return Number(info.lastInsertRowid);
}

export function listContactMessages(): ContactRow[] {
  return getDb()
    .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC')
    .all() as ContactRow[];
}

export function setContactStatus(id: number, status: 'new' | 'read' | 'archived') {
  getDb().prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, id);
}

export function countNewContacts(): number {
  const r = getDb()
    .prepare("SELECT COUNT(*) AS c FROM contact_messages WHERE status = 'new'")
    .get() as { c: number };
  return r.c;
}
