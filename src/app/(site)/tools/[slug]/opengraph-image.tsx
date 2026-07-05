import { ImageResponse } from 'next/og';
import { TOOLS, findTool, CATEGORY_LABEL } from '@/lib/tools';
import { siteName } from '@/lib/config';

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export const alt = 'Tool preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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
        justifyContent: 'space-between', padding: '72px',
        background: 'linear-gradient(135deg, #0b0d12 0%, #1b1740 55%, #4c2f8f 100%)',
        color: '#fff', fontFamily: 'sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#7c6cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>▚</div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{siteName}</div>
          <div style={{ marginLeft: 'auto', fontSize: 24, color: '#c9c4ef' }}>{cat}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: 30, marginTop: 20, color: '#c9c4ef', maxWidth: 980 }}>{blurb}</div>
        </div>
        <div style={{ fontSize: 24, color: '#9a93c7' }}>Free · runs in your browser · nothing uploaded</div>
      </div>
    ),
    size,
  );
}
