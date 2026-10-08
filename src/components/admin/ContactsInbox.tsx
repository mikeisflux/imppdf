'use client';
import { useState } from 'react';

export interface AdminContact {
  id: number; name: string; email: string; subject: string | null; topic: string | null;
  message: string; status: 'new' | 'read' | 'archived'; emailed: number; created_at: number;
}

export function ContactsInbox({ messages: initial }: { messages: AdminContact[] }) {
  const [messages, setMessages] = useState(initial);
  const [openId, setOpenId] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

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

  function copyEmail(m: AdminContact) {
    navigator.clipboard?.writeText(m.email).then(() => {
      setCopied(m.id);
      setTimeout(() => setCopied((c) => (c === m.id ? null : c)), 1500);
    }).catch(() => {});
  }

  if (messages.length === 0) return <p className="muted">No messages yet.</p>;

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id} className="card contact-card" style={{ opacity: m.status === 'archived' ? 0.6 : 1 }}>
          {/* The header is a plain row, not a button, so the name and address
              can be selected and copied like any other text. Only the subject
              line and the chevron toggle the message open. */}
          <div className="contact-head">
            <div style={{ minWidth: 0, flex: 1 }}>
              <button type="button" className="contact-toggle" onClick={() => toggle(m)} aria-expanded={openId === m.id}>
                <span className="contact-chev" aria-hidden>{openId === m.id ? '▾' : '▸'}</span>
                {m.status === 'new' && <span className="badge badge-brand" style={{ marginRight: 8 }}>new</span>}
                <span className="contact-subject">{m.subject || '(no subject)'}</span>
                <span className="muted" style={{ fontWeight: 400 }}> · {m.topic || 'general'}</span>
              </button>
              <div className="contact-from muted">
                {m.name} &lt;<span className="contact-email">{m.email}</span>&gt;
                <button type="button" className="contact-copy" onClick={() => copyEmail(m)} title="Copy email address">
                  {copied === m.id ? 'copied' : 'copy'}
                </button>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 12.5, flex: 'none' }}>
              {new Date(m.created_at).toLocaleString()}
              {!m.emailed && <span className="badge badge-red" style={{ marginLeft: 8 }}>not emailed</span>}
            </div>
          </div>
          {openId === m.id && (
            <div className="contact-body">
              <p style={{ whiteSpace: 'pre-wrap', margin: '14px 0', fontSize: 14.5 }}>{m.message}</p>
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
