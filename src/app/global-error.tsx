'use client';
// Top-level error boundary for the App Router. Catches render errors anywhere in
// the tree, reports them (env-gated), and shows a minimal recovery screen.
import { useEffect } from 'react';
import { reportError } from '@/lib/report-error';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportError(error, { digest: error.digest, boundary: 'global-error' }); }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#0b0b12', color: '#e8e8f0', margin: 0 }}>
        <div style={{ maxWidth: 520, margin: '18vh auto 0', padding: '0 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 26, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            An unexpected error occurred. Your files are safe — nothing is uploaded, so nothing was lost.
          </p>
          <button
            onClick={reset}
            style={{ background: '#7c6cf6', color: '#fff', border: 0, borderRadius: 8, padding: '10px 20px', fontSize: 15, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
