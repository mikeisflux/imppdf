import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TOOLS, findTool, toolsByCategory, CATEGORY_LABEL, toolAppHref } from '@/lib/tools';
import { ToolMockup } from '@/components/home/ToolMockup';
import { IconArrow, IconCheck } from '@/components/icons';

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) return { title: 'Tool not found' };
  return {
    title: `${tool.name} — impose in your browser`,
    description: `${tool.name}: ${tool.blurb} Runs entirely in your browser, nothing uploaded.`,
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) notFound();

  const related = toolsByCategory(tool.category).filter((t) => t.slug !== tool.slug).slice(0, 6);

  return (
    <div className="container" style={{ padding: '56px 24px 40px' }}>
      <div className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
        <Link href="/#gallery" style={{ color: 'var(--muted)' }}>Gallery</Link> ›{' '}
        <span>{CATEGORY_LABEL[tool.category]}</span>
      </div>

      <div className="grid-2" style={{ alignItems: 'center', gap: 40 }}>
        <div>
          <div className="eyebrow">{CATEGORY_LABEL[tool.category]}</div>
          <h1 style={{ fontSize: 'clamp(32px,4.4vw,48px)', marginBottom: 16 }}>{tool.name}</h1>
          <p className="muted" style={{ fontSize: 18, marginBottom: 24 }}>{tool.blurb}</p>

          {!tool.inPlugin && (
            <div className="form-note" style={{ marginBottom: 18 }}>
              <span className="badge badge-brand">Coming soon</span>{' '}
              This tool ships in the next ImpositionPDF release.
            </div>
          )}

          <ul className="plan-features" style={{ marginBottom: 26 }}>
            <li><IconCheck width={16} height={16} /> Runs 100% in your browser — files never uploaded</li>
            <li><IconCheck width={16} height={16} /> Print-ready output with marks and bleed</li>
            <li><IconCheck width={16} height={16} /> Works on any modern browser, no install</li>
          </ul>

          <div className="row wrap">
            <Link href={toolAppHref(tool.slug)} className="btn btn-primary btn-plain">{tool.cta || 'Open the tool'} <IconArrow width={16} height={16} /></Link>
            <Link href="/pricing" className="btn btn-ghost btn-plain">See pricing</Link>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="gallery-thumb" style={{ aspectRatio: '4 / 3' }}>
            <ToolMockup slug={tool.slug} category={tool.category} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="section">
          <h2 style={{ fontSize: 24, marginBottom: 22 }}>Related tools</h2>
          <div className="gallery-grid">
            {related.map((t) => (
              <Link key={t.slug} href={toolAppHref(t.slug)} className="gallery-card card">
                <div className="gallery-thumb"><ToolMockup slug={t.slug} category={t.category} /></div>
                <div className="gallery-meta">
                  <h4>{t.name}</h4>
                  <p>{t.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
