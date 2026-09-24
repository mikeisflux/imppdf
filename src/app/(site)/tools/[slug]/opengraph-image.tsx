import { ImageResponse } from 'next/og';
import { TOOLS, findTool, CATEGORY_LABEL } from '@/lib/tools';
import { siteName } from '@/lib/config';

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export const alt = 'Tool preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PAPER = '#f4f1ea', INK = '#14120f', ACCENT = '#ff4f1f', MUTED = '#6f6a60';
const BAR = ['#00b4e6', '#40c7ec', '#80d9f2', '#bfecf9', '#e6007e', '#ec40a0', '#f280bf', '#f9bfdf',
  '#ffd400', '#ffdf40', '#ffea80', '#fff4bf', '#14120f', '#4f4d4a', '#8a8886', '#c5c3c0'];

export default async function ToolOG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = findTool(slug);
  const name = tool?.name ?? siteName;
  const blurb = tool?.blurb ?? 'PDF imposition in your browser';
  const cat = tool ? CATEGORY_LABEL[tool.category] : 'Imposition';
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: PAPER, color: INK, fontFamily: 'serif',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '64px 80px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'sans-serif' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="6" width="12" height="12" fill={INK} />
              <path d="M6 1v3M18 1v3M6 20v3M18 20v3M1 6h3M20 6h3M1 18h3M20 18h3" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>{siteName}</div>
            <div style={{ marginLeft: 'auto', fontSize: 20, color: MUTED, letterSpacing: 3, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 28, height: 2, background: INK }} />{cat}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 84, letterSpacing: -3, lineHeight: 1.02 }}>{name}</div>
            <div style={{ fontSize: 30, marginTop: 24, color: MUTED, maxWidth: 980, fontFamily: 'sans-serif', lineHeight: 1.35 }}>{blurb}</div>
          </div>
          <div style={{ fontSize: 22, color: ACCENT, fontFamily: 'sans-serif' }}>Free · runs in your browser · nothing uploaded</div>
        </div>
        <div style={{ display: 'flex', height: 22 }}>
          {BAR.map((c) => <div key={c} style={{ flex: 1, background: c }} />)}
        </div>
      </div>
    ),
    size,
  );
}
