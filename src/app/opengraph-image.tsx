import { ImageResponse } from 'next/og';
import { siteName } from '@/lib/config';

// Default (Node) runtime so this image is statically generated at build time,
// matching the per-tool OG images. Declaring `runtime = 'edge'` here disabled
// static generation for this route (Next warns about exactly that).
export const alt = `${siteName} — press sheets from PDFs, in your browser`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PAPER = '#f4f1ea', INK = '#14120f', ACCENT = '#ff4f1f', MUTED = '#6f6a60';
const BAR = ['#00b4e6', '#40c7ec', '#80d9f2', '#bfecf9', '#e6007e', '#ec40a0', '#f280bf', '#f9bfdf',
  '#ffd400', '#ffdf40', '#ffea80', '#fff4bf', '#14120f', '#4f4d4a', '#8a8886', '#c5c3c0'];

// The site's logo: a sheet with its crop marks.
function Mark({ size: s }: { size: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="6" width="12" height="12" fill={INK} />
      <path d="M6 1v3M18 1v3M6 20v3M18 20v3M1 6h3M20 6h3M1 18h3M20 18h3" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          background: PAPER, color: INK, fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '72px 80px 56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 56, fontFamily: 'sans-serif' }}>
            <Mark size={52} />
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>{siteName}</div>
          </div>
          <div style={{ fontSize: 88, lineHeight: 1, letterSpacing: -3, display: 'flex', flexDirection: 'column' }}>
            <span>Lay out the press sheet</span>
            <span style={{ color: ACCENT, fontStyle: 'italic' }}>in your browser.</span>
          </div>
          <div style={{ fontSize: 28, marginTop: 36, color: MUTED, maxWidth: 940, fontFamily: 'sans-serif', lineHeight: 1.35 }}>
            Booklets, N-up, step and repeat, gang sheets, tiled posters and numbered tickets. Imposed on your own machine, nothing uploaded.
          </div>
        </div>
        <div style={{ display: 'flex', height: 22 }}>
          {BAR.map((c) => <div key={c} style={{ flex: 1, background: c }} />)}
        </div>
      </div>
    ),
    size,
  );
}
