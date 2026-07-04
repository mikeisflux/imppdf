import Link from 'next/link';
import { siteUrl } from '@/lib/config';
import { IconArrow } from '@/components/icons';

export const metadata = {
  title: 'API',
  description: 'POST a PDF and a steps pipeline — get a print-ready, imposed PDF back. One key for web, desktop, and API.',
};

const CURL = `curl ${siteUrl}/api/v1/impose \\
  -H "Authorization: Bearer imp_live_..." \\
  -F file=@flyer.pdf \\
  -F 'steps=[{"kind":"Grid","columns":2,"rows":2}]' \\
  -o imposed.pdf`;

const ENDPOINTS = [
  { method: 'POST', path: '/api/v1/impose', desc: 'Impose a PDF with a steps pipeline — grid, cards, booklet, n-up and more.' },
  { method: 'GET', path: '/api/v1/operations', desc: 'Discover every operation kind, its fields, and defaults.' },
  { method: 'GET', path: '/api/v1/me', desc: 'Check the authenticated account and plan for a key.' },
];

export default function ApiDocsPage() {
  return (
    <div className="container" style={{ padding: '64px 24px 40px' }}>
      <div className="eyebrow">Developers</div>
      <h1 style={{ fontSize: 'clamp(32px,4.4vw,48px)', marginBottom: 16 }}>PDF Press API</h1>
      <p className="muted" style={{ fontSize: 18, maxWidth: 620, marginBottom: 26 }}>
        POST a PDF and a steps pipeline — get a print-ready, imposed PDF back. One key works
        across the web app, the desktop app, and the API.
      </p>

      <div className="row wrap" style={{ marginBottom: 34 }}>
        <Link href="/account" className="btn btn-primary btn-plain">Get your API key <IconArrow width={16} height={16} /></Link>
        <a href="#endpoints" className="btn btn-ghost btn-plain">API reference</a>
      </div>

      <div className="card card-pad" style={{ marginBottom: 40, overflowX: 'auto' }}>
        <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 13.5, color: 'var(--ink-2)', whiteSpace: 'pre' }}>{CURL}</pre>
      </div>

      <div className="grid-3" style={{ marginBottom: 40 }}>
        {[
          { n: 1, t: 'Send a PDF + steps', b: 'POST your file with a steps pipeline (the same operations the visual editor builds).' },
          { n: 2, t: 'We impose it', b: 'Grid, cards, booklet, n-up, marks, bleed — server-side, in milliseconds.' },
          { n: 3, t: 'Get a print-ready PDF', b: 'Download the imposed PDF. Metered by the document, billed clearly.' },
        ].map((s) => (
          <div key={s.n} className="card card-pad">
            <span className="howto-num">{s.n}</span>
            <h4 style={{ fontSize: 17, margin: '12px 0 8px' }}>{s.t}</h4>
            <p className="muted" style={{ fontSize: 14.5 }}>{s.b}</p>
          </div>
        ))}
      </div>

      <h2 id="endpoints" style={{ fontSize: 24, marginBottom: 18 }}>Endpoints</h2>
      <div className="card" style={{ overflow: 'hidden' }}>
        {ENDPOINTS.map((e, i) => (
          <div key={e.path} className="row" style={{ padding: '16px 20px', gap: 16, borderTop: i ? '1px solid var(--border-soft)' : 'none' }}>
            <span className="badge badge-brand" style={{ fontFamily: 'var(--font-mono)' }}>{e.method}</span>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink)' }}>{e.path}</code>
            <span className="muted" style={{ fontSize: 14 }}>{e.desc}</span>
          </div>
        ))}
      </div>

      <p className="muted" style={{ marginTop: 26, fontSize: 14.5 }}>
        Authenticate with a Bearer API key created on your{' '}
        <Link href="/account" style={{ color: 'var(--brand)' }}>account page</Link>. The same key
        activates the web app and the API.
      </p>
    </div>
  );
}
