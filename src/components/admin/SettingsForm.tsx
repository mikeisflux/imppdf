'use client';
import { useState } from 'react';

interface FieldDef {
  key: string; label: string;
  type?: 'text' | 'password' | 'number' | 'select';
  options?: string[]; placeholder?: string;
}
interface GroupDef { title: string; note?: string; keys: FieldDef[]; }

export function SettingsForm({
  groups, view,
}: {
  groups: GroupDef[];
  view: Record<string, { value: string; isSecret: boolean; isSet: boolean }>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const g of groups) for (const f of g.keys) v[f.key] = view[f.key]?.value ?? '';
    return v;
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const upd = (k: string, val: string) => { setValues((s) => ({ ...s, [k]: val })); setSaved(false); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) { setError((await res.json()).error || 'Save failed.'); setBusy(false); return; }
      setSaved(true);
      setBusy(false);
      // Clear secret fields back to blank (they're stored now).
      setValues((s) => {
        const n = { ...s };
        for (const g of groups) for (const f of g.keys) if (f.type === 'password') n[f.key] = '';
        return n;
      });
    } catch {
      setError('Network error.'); setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      {error && <div className="form-error">{error}</div>}
      {saved && <div className="form-success">Settings saved. Changes take effect immediately.</div>}

      {groups.map((g) => (
        <div key={g.title} className="card card-pad" style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, marginBottom: g.note ? 4 : 14 }}>{g.title}</h2>
          {g.note && <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>{g.note}</p>}
          <div className="grid-2" style={{ gap: 16 }}>
            {g.keys.map((f) => {
              const meta = view[f.key];
              return (
                <div key={f.key} className="field">
                  <label htmlFor={`s-${f.key}`}>
                    {f.label}
                    {f.type === 'password' && meta?.isSet && (
                      <span className="badge badge-green" style={{ marginLeft: 8, fontSize: 11 }}>configured</span>
                    )}
                  </label>
                  {f.type === 'select' ? (
                    <select id={`s-${f.key}`} className="select" value={values[f.key] ?? ''}
                      onChange={(e) => upd(f.key, e.target.value)}>
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input id={`s-${f.key}`} className="input"
                      type={f.type === 'password' ? 'password' : f.type === 'number' ? 'number' : 'text'}
                      value={values[f.key] ?? ''}
                      placeholder={f.type === 'password' && meta?.isSet ? '•••••••• (leave blank to keep)' : f.placeholder}
                      onChange={(e) => upd(f.key, e.target.value)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button className="btn btn-primary btn-plain" disabled={busy} type="submit">
        {busy ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}
