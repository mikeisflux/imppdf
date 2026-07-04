'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Recaptcha, RecaptchaHandle } from '@/components/Recaptcha';

export function LoginForm({ next = '/account', admin = false }: { next?: string; admin?: boolean }) {
  const router = useRouter();
  const captcha = useRef<RecaptchaHandle>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const recaptchaToken = (await captcha.current?.getToken()) || '';
      const endpoint = admin ? '/api/admin/login' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        captcha.current?.reset();
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="auth-title">{admin ? 'Admin sign in' : 'Sign in'}</h1>
      <p className="auth-subtitle muted">
        {admin ? 'Restricted access.' : 'Welcome back to PDF Press.'}
      </p>
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" className="input" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" className="input" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Recaptcha ref={captcha} className="field" />
      <button className="btn btn-primary btn-block btn-plain" disabled={busy} type="submit">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      {!admin && (
        <p className="auth-alt muted">
          No account? <Link href="/signup">Create one</Link>
        </p>
      )}
    </form>
  );
}
