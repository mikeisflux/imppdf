'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Recaptcha, RecaptchaHandle } from '@/components/Recaptcha';

export function ForgotPasswordForm() {
  const captcha = useRef<RecaptchaHandle>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const recaptchaToken = (await captcha.current?.getToken()) || '';
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        captcha.current?.reset();
        setBusy(false);
        return;
      }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div>
        <h1 className="auth-title">Check your email</h1>
        <p className="auth-subtitle muted">
          If there is an account for <b>{email}</b>, a reset link is on its way. It works once and
          expires in an hour. No email after a few minutes? Check spam, or try again.
        </p>
        <p className="auth-alt muted"><Link href="/login">Back to sign in</Link></p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <h1 className="auth-title">Forgot your password?</h1>
      <p className="auth-subtitle muted">Enter your email and we will send you a link to choose a new one.</p>
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" className="input" type="email" autoComplete="email" required autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Recaptcha ref={captcha} className="field" />
      <button className="btn btn-primary btn-block btn-plain" disabled={busy} type="submit">
        {busy ? 'Sending…' : 'Send reset link'}
      </button>
      <p className="auth-alt muted">
        Remembered it? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
