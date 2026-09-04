'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AdminUser {
  id: number; email: string; name: string | null; role: 'user' | 'admin';
  plan: 'free' | 'pro'; status: 'active' | 'suspended'; created_at: number;
  sub?: string; // latest subscription status, if any
}

const SUB_OPTIONS = [
  { value: '', label: 'Subscription…' },
  { value: 'ACTIVE', label: 'Grant lifetime Pro' },
  { value: 'CANCELLED', label: 'Mark cancelled' },
  { value: 'SUSPENDED', label: 'Mark suspended' },
  { value: 'EXPIRED', label: 'Mark expired' },
  { value: 'none', label: 'Remove subscription' },
];

function subBadge(s?: string) {
  if (!s) return null;
  const cls = s === 'ACTIVE' ? 'badge-green' : 'badge-gray';
  return <span className={`badge ${cls}`}>{s}</span>;
}

export function UsersTable({ users: initial }: { users: AdminUser[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);

  // Keep the table in sync when server data refreshes (e.g. after create /
  // subscription change triggers router.refresh()). Without this the local
  // useState list goes stale and new users don't appear.
  useEffect(() => { setUsers(initial); }, [initial]);

  // Create-user form state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', plan: 'free', role: 'user', lifetime: false });
  const [createErr, setCreateErr] = useState('');
  const [creating, setCreating] = useState(false);

  /* Password reset. `resetFor` is the row whose panel is open; the value is
     typed or generated. It is held only for as long as the panel is open and
     is never written anywhere but the request body. */
  const [resetFor, setResetFor] = useState<number | null>(null);
  const [newPw, setNewPw] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  /* Generated in the BROWSER with crypto.getRandomValues — never Math.random,
     which is not a cryptographic source and is seeded predictably enough that
     generated passwords could be guessed. The alphabet drops the characters
     that get misread when a password is dictated over the phone or copied off
     a screen: 0/O, 1/l/I. */
  function generatePw(len = 16) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    const bytes = new Uint32Array(len);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  }

  async function resetPassword(id: number) {
    const pw = newPw;
    if (pw.length < 8) { setResetMsg('Password must be at least 8 characters.'); return; }
    setBusy(id); setResetMsg('');
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(null);
    if (!res.ok) { setResetMsg((await res.json()).error || 'Reset failed.'); return; }
    setResetMsg('Password changed.');
  }

  async function removeUser(u: AdminUser) {
    /* Typed confirmation, not an OK/Cancel. This is unrecoverable — the account,
       its subscriptions and its API keys go — and a misplaced click on the wrong
       row of a table is exactly how that happens by accident. */
    const typed = prompt(
      `Permanently delete ${u.email}?\n\n`
      + 'This removes the account, its subscription and its API keys. It cannot be undone.\n'
      + 'Type the email address to confirm:',
    );
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== u.email.toLowerCase()) { alert('That did not match — nothing was deleted.'); return; }
    setBusy(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    setBusy(null);
    if (!res.ok) { alert((await res.json()).error || 'Delete failed.'); return; }
    setUsers((us) => us.filter((x) => x.id !== u.id));
    router.refresh();
  }

  async function patch(id: number, patch: Record<string, unknown>, reload = false) {
    setBusy(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setBusy(null);
    if (!res.ok) { alert((await res.json()).error || 'Update failed.'); return; }
    if (reload) { router.refresh(); return; }
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } as AdminUser : u)));
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setCreateErr('');
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (!res.ok) { setCreateErr((await res.json()).error || 'Could not create user.'); return; }
    setForm({ email: '', name: '', password: '', plan: 'free', role: 'user', lifetime: false });
    setShowCreate(false);
    router.refresh();
  }

  return (
    <div>
      {/* Create user */}
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary btn-plain" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : '+ Create user'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createUser} className="card card-pad" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>Create user</h2>
          {createErr && <div className="form-error">{createErr}</div>}
          <div className="grid-2" style={{ gap: 14 }}>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Name</label>
              <input className="input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Password (min 8)</label>
              <input className="input" type="text" required minLength={8} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="field">
              <label>Plan</label>
              <select className="select" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                <option value="free">Free</option><option value="pro">Pro</option>
              </select>
            </div>
            <div className="field">
              <label>Role</label>
              <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">User</option><option value="admin">Admin</option>
              </select>
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.lifetime}
                  onChange={(e) => setForm({ ...form, lifetime: e.target.checked })} />
                Grant free access forever (lifetime Pro)
              </label>
            </div>
          </div>
          <button className="btn btn-primary btn-plain" disabled={creating} type="submit">
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </form>
      )}

      <div className="card card-pad" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th>Email</th><th>Plan</th><th>Role</th><th>Status</th><th>Subscription</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ opacity: busy === u.id ? 0.5 : 1 }}>
                <td>
                  {u.email}
                  {u.name && <div className="muted" style={{ fontSize: 12.5 }}>{u.name}</div>}
                </td>
                <td><span className={`badge ${u.plan === 'pro' ? 'badge-brand' : 'badge-gray'}`}>{u.plan}</span></td>
                <td>{u.role === 'admin' ? <span className="badge badge-brand">admin</span> : <span className="muted">user</span>}</td>
                <td><span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>{u.status}</span></td>
                <td>{subBadge(u.sub) || <span className="muted" style={{ fontSize: 12.5 }}>none</span>}</td>
                <td>
                  <div className="admin-actions" style={{ flexWrap: 'wrap' }}>
                    <select className="admin-select" value={u.plan} onChange={(e) => patch(u.id, { plan: e.target.value })}>
                      <option value="free">Free</option><option value="pro">Pro</option>
                    </select>
                    <select className="admin-select" value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}>
                      <option value="user">User</option><option value="admin">Admin</option>
                    </select>
                    <select className="admin-select" value="" onChange={(e) => {
                      if (e.target.value) patch(u.id, { subscription: e.target.value }, true);
                    }}>
                      {SUB_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-plain admin-btn-sm"
                      onClick={() => patch(u.id, { status: u.status === 'active' ? 'suspended' : 'active' })}>
                      {u.status === 'active' ? 'Suspend' : 'Reinstate'}
                    </button>
                    <button className="btn btn-ghost btn-plain admin-btn-sm"
                      onClick={() => {
                        const open = resetFor === u.id;
                        setResetFor(open ? null : u.id);
                        setNewPw(''); setResetMsg('');
                      }}>
                      {resetFor === u.id ? 'Close' : 'Password'}
                    </button>
                    <button className="btn btn-ghost btn-plain admin-btn-sm"
                      style={{ color: '#ef4444' }} onClick={() => removeUser(u)}>
                      Delete
                    </button>
                  </div>

                  {resetFor === u.id && (
                    <div style={{ marginTop: 10, padding: 10, border: '1px solid var(--border, #333)', borderRadius: 8 }}>
                      <div className="admin-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
                        {/* type="text" on purpose: an admin setting a password
                            for someone else needs to READ it to pass it on, and
                            masking it only invites a typo they cannot see. */}
                        <input
                          className="admin-select" type="text" autoComplete="off" spellCheck={false}
                          style={{ minWidth: 260, fontFamily: 'ui-monospace, monospace' }}
                          placeholder="Type a password, or generate one"
                          value={newPw}
                          onChange={(e) => { setNewPw(e.target.value); setResetMsg(''); }}
                        />
                        <button className="btn btn-ghost btn-plain admin-btn-sm"
                          onClick={() => { setNewPw(generatePw()); setResetMsg(''); }}>
                          Generate
                        </button>
                        <button className="btn btn-ghost btn-plain admin-btn-sm"
                          disabled={!newPw}
                          onClick={() => { navigator.clipboard?.writeText(newPw).catch(() => {}); }}>
                          Copy
                        </button>
                        <button className="btn btn-primary btn-plain admin-btn-sm"
                          disabled={busy === u.id || newPw.length < 8}
                          onClick={() => resetPassword(u.id)}>
                          {busy === u.id ? 'Setting…' : 'Set password'}
                        </button>
                      </div>
                      <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                        {resetMsg
                          ? resetMsg
                          : newPw.length > 0 && newPw.length < 8
                            ? `${8 - newPw.length} more character${8 - newPw.length === 1 ? '' : 's'} needed`
                            : 'Minimum 8 characters. Copy it before you close this — it is not stored anywhere you can read it back.'}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={6} className="muted">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
