'use client';
import { useState } from 'react';

export interface AdminContact {
  id: number; name: string; email: string; subject: string | null; topic: string | null;
  message: string; status: 'new' | 'read' | 'archived'; emailed: number; created_at: number;
}

export function ContactsInbox({ messages: initial }: { messages: AdminContact[] }) {
  const [messages, setMessages] = useState(initial);
  const [openId, setOpenId] = useState<number | null>(null);

  async function setStatus(id: number, status: AdminContact['status']) {
    await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)));
  }

  function toggle(m: AdminContact) {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next !== null && m.status === 'new') setStatus(m.id, 'read');
  }

  if (messages.length === 0) return <p className="muted">No messages yet.</p>;

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id} className="card" style={{ marginBottom: 10, padding: 0, opacity: m.status === 'archived' ? 0.6 : 1 }}>
          <button onClick={() => toggle(m)}
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', color: 'var(--ink)' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                {m.status === 'new' && <span className="badge badge-brand" style={{ marginRight: 8 }}>new</span>}
                {m.subject || '(no subject)'}
                <span className="muted" style={{ fontWeight: 400 }}> · {m.topic || 'general'}</span>
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{m.name} &lt;{m.email}&gt;</div>
            </div>
            <div className="muted" style={{ fontSize: 12.5, flex: 'none' }}>
              {new Date(m.created_at).toLocaleString()}
              {!m.emailed && <span className="badge badge-red" style={{ marginLeft: 8 }}>not emailed</span>}
            </div>
          </button>
          {openId === m.id && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-soft)' }}>
              <p style={{ whiteSpace: 'pre-wrap', margin: '14px 0', fontSize: 14.5, color: 'var(--ink-2)' }}>{m.message}</p>
              <div className="admin-actions">
                <a className="btn btn-primary btn-plain admin-btn-sm" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'Your message')}`}>Reply by email</a>
                {m.status !== 'archived'
                  ? <button className="btn btn-ghost btn-plain admin-btn-sm" onClick={() => setStatus(m.id, 'archived')}>Archive</button>
                  : <button className="btn btn-ghost btn-plain admin-btn-sm" onClick={() => setStatus(m.id, 'read')}>Unarchive</button>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
