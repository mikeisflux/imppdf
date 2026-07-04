'use client';
import { useState } from 'react';

interface FieldDef {
  key: string; label: string;
  type?: 'text' | 'password' | 'number' | 'select';
  options?: string[]; placeholder?: string;
}
interface GroupDef { title: string; note?: string; keys: FieldDef[]; }
type Meta = { value: string; isSecret: boolean; isSet: boolean };

// A single setting with its own click-to-edit → click-to-save lifecycle, so each
// value persists (and shows confirmation) independently.
function SettingField({ f, meta }: { f: FieldDef; meta: Meta }) {
  const isSecret = f.type === 'password';
  const [current, setCurrent] = useState(meta.value); // persisted display value (non-secret)
  const [configured, setConfigured] = useState(meta.isSet);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<'saved' | 'error' | null>(null);

  function startEdit() {
    setDraft(isSecret ? '' : current);
    setFlash(null);
    setEditing(true);
  }
  function cancel() { setEditing(false); setDraft(''); }

  async function save() {
    setBusy(true); setFlash(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [f.key]: draft }),
      });
      setBusy(false);
      if (!res.ok) { setFlash('error'); return; }
      if (!isSecret) setCurrent(draft);
      setConfigured(isSecret ? true : Boolean(draft));
      setEditing(false);
      setDraft('');
      setFlash('saved');
      setTimeout(() => setFlash((v) => (v === 'saved' ? null : v)), 2500);
    } catch {
      setBusy(false); setFlash('error');
    }
  }

  return (
    <div className="setting-row">
      <div className="setting-label">{f.label}</div>
      <div className="setting-control">
        {editing ? (
          <>
            {f.type === 'select' ? (
              <select className="select" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                className="input" autoFocus
                type={isSecret ? 'password' : f.type === 'number' ? 'number' : 'text'}
                value={draft} placeholder={f.placeholder}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
              />
            )}
            <button type="button" className="btn btn-primary btn-plain admin-btn-sm" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn-ghost btn-plain admin-btn-sm" onClick={cancel} disabled={busy}>
              Cancel
            </button>
            {flash === 'error' && <span className="setting-flash err">save failed</span>}
          </>
        ) : (
          <>
            <span className="setting-value">
              {isSecret
                ? (configured ? <span className="badge badge-green">configured</span> : <span className="muted">not set</span>)
                : (current ? current : <span className="muted">not set</span>)}
            </span>
            {flash === 'saved' && <span className="setting-flash ok">✓ saved</span>}
            <button type="button" className="btn btn-ghost btn-plain admin-btn-sm" onClick={startEdit}>
              {configured || current ? 'Edit' : 'Set'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function SettingsForm({
  groups, view,
}: {
  groups: GroupDef[];
  view: Record<string, Meta>;
}) {
  return (
    <div>
      {groups.map((g) => (
        <div key={g.title} className="card card-pad" style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, marginBottom: g.note ? 4 : 14 }}>{g.title}</h2>
          {g.note && <p className="muted" style={{ fontSize: 13.5, marginBottom: 14 }}>{g.note}</p>}
          <div className="setting-list">
            {g.keys.map((f) => (
              <SettingField key={f.key} f={f} meta={view[f.key] || { value: '', isSecret: false, isSet: false }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
