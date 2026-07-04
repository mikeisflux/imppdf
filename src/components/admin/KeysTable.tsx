'use client';
import { useState } from 'react';

export interface AdminKey {
  id: number; email: string; name: string | null; prefix: string; last4: string;
  status: string; request_count: number; last_used_at: number | null; created_at: number;
}

export function KeysTable({ keys: initial }: { keys: AdminKey[] }) {
  const [keys, setKeys] = useState(initial);

  async function revoke(id: number) {
    if (!confirm('Revoke this API key?')) return;
    await fetch(`/api/admin/keys/${id}`, { method: 'DELETE' });
    setKeys((ks) => ks.map((k) => (k.id === id ? { ...k, status: 'revoked' } : k)));
  }

  return (
    <table className="admin-table">
      <thead>
        <tr><th>Owner</th><th>Name</th><th>Key</th><th>Requests</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        {keys.map((k) => (
          <tr key={k.id}>
            <td>{k.email}</td>
            <td className="muted">{k.name || '—'}</td>
            <td className="key-mono">{k.prefix}…{k.last4}</td>
            <td>{k.request_count}</td>
            <td><span className={`badge ${k.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{k.status}</span></td>
            <td>
              {k.status === 'active' && (
                <button className="btn btn-ghost btn-plain admin-btn-sm" onClick={() => revoke(k.id)}>Revoke</button>
              )}
            </td>
          </tr>
        ))}
        {keys.length === 0 && <tr><td colSpan={6} className="muted">No API keys yet.</td></tr>}
      </tbody>
    </table>
  );
}
