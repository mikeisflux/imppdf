import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { COMPETITORS, findCompetitor } from '@/lib/compare';
import { siteName, siteUrl } from '@/lib/config';
import { seoKeywords } from '@/lib/seo';
import { IconArrow, IconCheck } from '@/components/icons';

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const c = findCompetitor(slug);
  if (!c) return { title: 'Comparison not found' };
  const title = `${siteName} vs ${c.name} — free browser imposition alternative`;
  const description = `${c.name} alternative: ${siteName} is a free, browser-based imposition tool with booklets, N-up, step-and-repeat, gang sheets and marks — nothing uploaded. See how they compare.`;
  const url = `${siteUrl}/compare/${c.slug}`;
  return {
    title,
    description,
    keywords: [`${c.name} alternative`, `${c.name} vs ${siteName}`, `free ${c.name} alternative`, `${c.name} online`, ...seoKeywords.slice(0, 10)],
    alternates: { canonical: `/compare/${c.slug}` },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>;
  if (v === false) return <span style={{ color: 'var(--muted)' }}>—</span>;
  return <span className="muted" style={{ fontSize: 13 }}>{v}</span>;
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = findCompetitor(slug);
  if (!c) notFound();

  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${siteUrl}/compare` },
      { '@type': 'ListItem', position: 3, name: `vs ${c.name}`, item: `${siteUrl}/compare/${c.slug}` },
    ],
  };

  const others = COMPETITORS.filter((x) => x.slug !== c.slug);

  return (
    <div className="container" style={{ padding: '56px 24px 40px' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
        <Link href="/compare" style={{ color: 'var(--muted)' }}>Compare</Link> › <span>vs {c.name}</span>
      </div>

      <div className="eyebrow">{c.kind} comparison</div>
      <h1 style={{ fontSize: 'clamp(30px,4.2vw,46px)', marginBottom: 14 }}>{siteName} vs {c.name}</h1>
      <p className="muted" style={{ fontSize: 18, maxWidth: 760, marginBottom: 22 }}>{c.intro}</p>

      <div className="row wrap" style={{ marginBottom: 34 }}>
        <Link href="/app" className="btn btn-primary btn-plain">Try {siteName} free <IconArrow width={16} height={16} /></Link>
        <Link href="/#gallery" className="btn btn-ghost btn-plain">Browse the tools</Link>
      </div>

      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Why people switch</h2>
      <ul className="plan-features" style={{ marginBottom: 34, maxWidth: 720 }}>
        {c.whySwitch.map((w) => (<li key={w}><IconCheck width={16} height={16} /> {w}</li>))}
      </ul>

      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Feature comparison</h2>
      <div className="card" style={{ overflowX: 'auto', marginBottom: 40 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 14 }}>Feature</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 14 }}>{siteName}</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 14 }}>{c.name}</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r, i) => (
              <tr key={r.feature} style={{ borderTop: '1px solid var(--border, rgba(255,255,255,0.08))', background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '11px 16px', fontSize: 14 }}>{r.feature}</td>
                <td style={{ padding: '11px 16px', textAlign: 'center' }}><Cell v={r.ours} /></td>
                <td style={{ padding: '11px 16px', textAlign: 'center' }}><Cell v={r.theirs} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 40 }}>
        Comparison is based on publicly documented features and may change as each product evolves.
        {' '}{c.name} is a trademark of its respective owner; {siteName} is not affiliated with or endorsed by it.
      </p>

      <h2 style={{ fontSize: 22, marginBottom: 18 }}>Other comparisons</h2>
      <div className="row wrap">
        {others.map((o) => (
          <Link key={o.slug} href={`/compare/${o.slug}`} className="btn btn-ghost btn-plain">vs {o.name}</Link>
        ))}
      </div>
    </div>
  );
}
