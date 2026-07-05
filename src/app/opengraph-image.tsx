import { ImageResponse } from 'next/og';
import { siteName } from '@/lib/config';

export const runtime = 'edge';
export const alt = `${siteName} — free online PDF imposition & prepress software`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '80px',
          background: 'linear-gradient(135deg, #0b0d12 0%, #1b1740 55%, #4c2f8f 100%)',
          color: '#fff', fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: '#7c6cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>▚</div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>{siteName}</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>
          Free online PDF imposition & prepress
        </div>
        <div style={{ fontSize: 30, marginTop: 28, color: '#c9c4ef', maxWidth: 900 }}>
          Booklets · N-up · step &amp; repeat · gang sheets · comics · trade paperbacks — crop marks, bleed &amp; registration, all in your browser.
        </div>
      </div>
    ),
    size,
  );
}
