'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Admin billing reconciliation: activate everyone who paid but wasn't upgraded,
// and import an individual PayPal subscription by id when it never reached us.
export function SubscriptionsReconcile() {
  const router = useRouter();
  const [busy, setBusy] = useState<'' | 'sync' | 'import'>('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [subId, setSubId] = useState('');
  const [email, setEmail] = useState('');

  async function post(payload: Record<string, unknown>) {
    const res = await fetch('/api/admin/subscriptions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  async function sync() {
    setBusy('sync'); setMsg(''); setErr('');
    try {
      const d = await post({ action: 'sync' });
      setMsg(d.count ? `Activated ${d.count} account${d.count === 1 ? '' : 's'}: ${d.activated.join(', ')}` : 'All paid accounts were already active.');
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed.'); }
    finally { setBusy(''); }
  }

  async function importSub() {
    if (!subId.trim()) { setErr('Enter a PayPal subscription ID.'); return; }
    setBusy('import'); setMsg(''); setErr('');
    try {
      const d = await post({ action: 'import', subscriptionId: subId.trim(), email: email.trim() || undefined });
      setMsg(`Linked ${subId.trim()} to ${d.email} (${d.status}).${d.note ? ` ${d.note}.` : ''}`);
      setSubId(''); setEmail('');
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed.'); }
    finally { setBusy(''); }
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 18, display: 'grid', gap: 14 }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Activate paid accounts</div>
        <p className="muted" style={{ marginBottom: 10, fontSize: 14 }}>
          Sets every user with a live subscription record to Pro — fixes accounts that paid but weren’t upgraded.
        </p>
        <button className="btn btn-primary btn-plain" onClick={sync} disabled={!!busy}>
          {busy === 'sync' ? 'Syncing…' : 'Sync & activate paid accounts'}
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border, #2a2a33)', paddingTop: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Import a PayPal subscription</div>
        <p className="muted" style={{ marginBottom: 10, fontSize: 14 }}>
          Paste a subscription ID from PayPal (e.g. <span className="key-mono">I-XXXXXXXX</span>) to link a payment that never reached the site. Add the account email if it can’t be matched automatically.
        </p>
        <div className="row wrap" style={{ gap: 8 }}>
          <input className="pe-input" style={{ minWidth: 200 }} placeholder="I-XXXXXXXX" value={subId} onChange={(e) => setSubId(e.target.value)} />
          <input className="pe-input" style={{ minWidth: 200 }} placeholder="account email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn btn-ghost btn-plain" onClick={importSub} disabled={!!busy}>
            {busy === 'import' ? 'Importing…' : 'Import & activate'}
          </button>
        </div>
      </div>

      {msg && <div className="form-success">{msg}</div>}
      {err && <div className="form-error">{err}</div>}
    </div>
  );
}
