import Link from 'next/link';
import { GUIDES, POPULAR_GUIDE_LINKS } from '@/lib/tools';
import { IconArrow } from '@/components/icons';

export const metadata = {
  title: 'Guides',
  description: 'Step-by-step imposition and prepress tutorials — booklets, N-up, step & repeat, bleed and more.',
};

export default function GuidePage() {
  return (
    <div className="container" style={{ padding: '64px 24px 40px' }}>
      <div className="eyebrow">Guides</div>
      <h1 style={{ fontSize: 'clamp(32px,4.4vw,46px)', marginBottom: 14 }}>Imposition &amp; prepress guides</h1>
      <p className="muted" style={{ fontSize: 17, maxWidth: 620, marginBottom: 34 }}>
        Step-by-step tutorials and comparisons to help you impose, fold and print with confidence.
      </p>

      <div className="grid-3">
        {GUIDES.map((g) => (
          <div key={g.title} className="card card-pad guide-card">
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>{g.title}</h3>
            <p className="muted" style={{ marginBottom: 16 }}>{g.blurb}</p>
            <Link href="/app" className="link-arrow">Try it in the app <IconArrow width={15} height={15} /></Link>
          </div>
        ))}
      </div>

      <div className="section-sm" style={{ marginTop: 30 }}>
        <div className="eyebrow">More topics</div>
        <div className="link-columns">
          {POPULAR_GUIDE_LINKS.map((g) => (
            <span key={g} className="seo-link">▤ {g}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
