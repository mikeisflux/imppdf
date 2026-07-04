'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Recaptcha, RecaptchaHandle } from '@/components/Recaptcha';

export function SignupForm() {
  const router = useRouter();
  const captcha = useRef<RecaptchaHandle>(null);
  const [name, setName] = useState('');
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        captcha.current?.reset();
        setBusy(false);
        return;
      }
      router.push('/account');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="auth-title">Create your account</h1>
      <p className="auth-subtitle muted">Free to start — no card required.</p>
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" className="input" type="text" autoComplete="name"
          value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" className="input" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" className="input" type="password" autoComplete="new-password" required
          minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="form-note" style={{ marginTop: 6 }}>At least 8 characters.</p>
      </div>
      <Recaptcha ref={captcha} className="field" />
      <button className="btn btn-primary btn-block btn-plain" disabled={busy} type="submit">
        {busy ? 'Creating account…' : 'Create account'}
      </button>
      <p className="auth-alt muted">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
