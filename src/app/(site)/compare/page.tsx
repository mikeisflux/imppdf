import Link from 'next/link';
import type { Metadata } from 'next';
import { COMPETITORS } from '@/lib/compare';
import { siteName, siteUrl } from '@/lib/config';
import { seoKeywords } from '@/lib/seo';
import { IconArrow } from '@/components/icons';

export const metadata: Metadata = {
  title: `${siteName} vs the alternatives — imposition software comparison`,
  description: `How ${siteName} compares to Imposition Wizard, Quite Imposing, Montax Imposer, Kodak Preps, PDFsam and callas pdfToolbox. Free, browser-based imposition — nothing uploaded.`,
  keywords: ['imposition software comparison', 'imposition software alternative', ...seoKeywords.slice(0, 14)],
  alternates: { canonical: '/compare' },
  openGraph: {
    title: `${siteName} vs the alternatives`,
    description: 'Compare free, browser-based imposition against the leading desktop and plugin tools.',
    url: `${siteUrl}/compare`, type: 'website',
  },
};

export default function CompareIndex() {
  return (
    <div className="container" style={{ padding: '56px 24px 40px' }}>
      <div className="eyebrow">Comparisons</div>
      <h1 style={{ fontSize: 'clamp(30px,4.2vw,46px)', marginBottom: 14 }}>{siteName} vs the alternatives</h1>
      <p className="muted" style={{ fontSize: 18, maxWidth: 720, marginBottom: 32 }}>
        Weighing up imposition tools? Here&rsquo;s an honest, side-by-side look at how {siteName} —
        free and entirely in your browser — compares to the leading desktop apps, Acrobat plugins and prepress suites.
      </p>
      <div className="gallery-grid">
        {COMPETITORS.map((c) => (
          <Link key={c.slug} href={`/compare/${c.slug}`} className="gallery-card card" style={{ padding: 20 }}>
            <div className="gallery-meta" style={{ padding: 0 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>{c.kind}</div>
              <h4>vs {c.name}</h4>
              <p>{c.tagline}</p>
              <div className="row" style={{ marginTop: 12, color: 'var(--brand, #7c6cf6)', fontSize: 14 }}>
                Compare <IconArrow width={14} height={14} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
