'use client';
import { useEffect, useState } from 'react';

interface KeyItem {
  id: number; name: string | null; prefix: string; last4: string;
  status: string; lastUsedAt: number | null; requestCount: number; createdAt: number;
}

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/keys');
    if (res.ok) setKeys((await res.json()).keys);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    setCreating(true); setError('');
    const res = await fetch('/api/keys', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setError(data.error || 'Could not create key.'); return; }
    setRevealed(data.key.fullKey);
    setName('');
    load();
  }

  async function revoke(id: number) {
    if (!confirm('Revoke this key? Any integration using it will stop working.')) return;
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="card card-pad panel">
      <h2>API keys</h2>
      <p className="panel-sub">One key works across the web app, desktop app and the API. Keep it secret.</p>

      {revealed && (
        <div style={{ marginBottom: 16 }}>
          <div className="form-success">Copy your new key now — it won’t be shown again.</div>
          <div className="key-reveal">{revealed}</div>
          <button className="btn btn-ghost btn-plain" style={{ marginTop: 10 }}
            onClick={() => { navigator.clipboard?.writeText(revealed); }}>
            Copy to clipboard
          </button>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      <div className="row wrap" style={{ marginBottom: 18, gap: 10 }}>
        <input className="input" placeholder="Key name (e.g. Production)" value={name}
          onChange={(e) => setName(e.target.value)} style={{ maxWidth: 280 }} />
        <button className="btn btn-primary btn-plain" onClick={create} disabled={creating}>
          {creating ? 'Creating…' : 'Create API key'}
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="muted">No API keys yet.</p>
      ) : (
        keys.map((k) => (
          <div key={k.id} className="key-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{k.name || 'Untitled key'}</div>
              <div className="key-mono">{k.prefix}…{k.last4}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                {k.requestCount} requests
                {k.lastUsedAt ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : ' · never used'}
              </div>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <span className={`badge ${k.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{k.status}</span>
              {k.status === 'active' && (
                <button className="btn btn-ghost btn-plain" style={{ padding: '7px 13px' }}
                  onClick={() => revoke(k.id)}>Revoke</button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
