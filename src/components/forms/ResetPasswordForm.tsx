'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [valid, setValid] = useState<boolean | null>(token ? null : false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/reset?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setValid(Boolean(d.valid)))
      .catch(() => setValid(false));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setBusy(false); return; }
      router.push(data.admin ? '/admin/login' : '/account');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  if (valid === null) {
    return <p className="auth-subtitle muted">Checking your link…</p>;
  }
  if (!valid) {
    return (
      <div>
        <h1 className="auth-title">This link has expired</h1>
        <p className="auth-subtitle muted">
          Reset links work once and last an hour. Request a fresh one and use it straight away.
        </p>
        <Link href="/forgot-password" className="btn btn-primary btn-block btn-plain">Request a new link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <h1 className="auth-title">Choose a new password</h1>
      <p className="auth-subtitle muted">At least 8 characters. You will be signed in once it is saved.</p>
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" className="input" type="password" autoComplete="new-password" required
          minLength={8} autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="confirm">Type it again</label>
        <input id="confirm" className="input" type="password" autoComplete="new-password" required
          minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-block btn-plain" disabled={busy} type="submit">
        {busy ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  );
}
