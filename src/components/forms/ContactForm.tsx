'use client';
import { useRef, useState } from 'react';
import { Recaptcha, RecaptchaHandle } from '@/components/Recaptcha';

const TOPICS = [
  { value: 'support', label: 'Support / help' },
  { value: 'enterprise', label: 'Enterprise / team licensing' },
  { value: 'billing', label: 'Billing' },
  { value: 'general', label: 'General enquiry' },
];

export function ContactForm({ defaultTopic = 'general' }: { defaultTopic?: string }) {
  const captcha = useRef<RecaptchaHandle>(null);
  const [form, setForm] = useState({ name: '', email: '', topic: defaultTopic, subject: '', message: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const recaptchaToken = (await captcha.current?.getToken()) || '';
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); captcha.current?.reset(); setBusy(false); return; }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="form-success" style={{ fontSize: 15 }}>
        Thanks — your message has been sent. We’ll reply to <strong>{form.email}</strong>.
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="form-error">{error}</div>}
      <div className="grid-2" style={{ gap: 16 }}>
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" className="input" required value={form.name} onChange={upd('name')} />
        </div>
        <div className="field">
          <label htmlFor="c-email">Email</label>
          <input id="c-email" className="input" type="email" required value={form.email} onChange={upd('email')} />
        </div>
      </div>
      <div className="grid-2" style={{ gap: 16 }}>
        <div className="field">
          <label htmlFor="c-topic">Topic</label>
          <select id="c-topic" className="select" value={form.topic} onChange={upd('topic')}>
            {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="c-subject">Subject</label>
          <input id="c-subject" className="input" value={form.subject} onChange={upd('subject')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-message">Message</label>
        <textarea id="c-message" className="textarea" required value={form.message} onChange={upd('message')} />
      </div>
      <Recaptcha ref={captcha} className="field" />
      <button className="btn btn-primary btn-plain" disabled={busy} type="submit">
        {busy ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
