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
                  </div>
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
