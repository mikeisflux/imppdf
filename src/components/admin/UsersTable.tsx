'use client';
import { useState } from 'react';

export interface AdminUser {
  id: number; email: string; name: string | null; role: 'user' | 'admin';
  plan: 'free' | 'pro'; status: 'active' | 'suspended'; created_at: number;
}

export function UsersTable({ users: initial }: { users: AdminUser[] }) {
  const [users, setUsers] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);

  async function patch(id: number, patch: Partial<Pick<AdminUser, 'plan' | 'role' | 'status'>>) {
    setBusy(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setBusy(null);
    if (res.ok) setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    else alert((await res.json()).error || 'Update failed.');
  }

  return (
    <table className="admin-table">
      <thead>
        <tr><th>Email</th><th>Name</th><th>Plan</th><th>Role</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} style={{ opacity: busy === u.id ? 0.5 : 1 }}>
            <td>{u.email}</td>
            <td className="muted">{u.name || '—'}</td>
            <td><span className={`badge ${u.plan === 'pro' ? 'badge-brand' : 'badge-gray'}`}>{u.plan}</span></td>
            <td>{u.role === 'admin' ? <span className="badge badge-brand">admin</span> : <span className="muted">user</span>}</td>
            <td><span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>{u.status}</span></td>
            <td>
              <div className="admin-actions">
                <select className="admin-select" value={u.plan} onChange={(e) => patch(u.id, { plan: e.target.value as 'free' | 'pro' })}>
                  <option value="free">Free</option><option value="pro">Pro</option>
                </select>
                <select className="admin-select" value={u.role} onChange={(e) => patch(u.id, { role: e.target.value as 'user' | 'admin' })}>
                  <option value="user">User</option><option value="admin">Admin</option>
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
  );
}
