import Link from 'next/link';
import { GUIDES, POPULAR_GUIDE_LINKS } from '@/lib/tools';
import { IconArrow } from '@/components/icons';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Guides',
  description: 'Short, practical notes on the parts of prepress that go wrong most often: folding, trimming, backing up, creep, and getting a file past the RIP.',
  path: '/guide',
});

const pad = (n: number) => String(n).padStart(2, '0');

export default function GuidePage() {
  return (
    <div className="container">
      <div className="page-hero">
        <div className="eyebrow">Guides</div>
        <h1>Notes from the shop floor.</h1>
        <p className="lede">
          Short, practical pieces on the parts of prepress that go wrong most often — folding,
          trimming, backing up and getting a file past the RIP — written from jobs that went wrong first.
        </p>
      </div>

      <div className="guide-list">
        {GUIDES.map((g, i) => (
          <Link key={g.title} href="/app" className="guide-row">
            <span className="index-n">{pad(i + 1)}</span>
            <div>
              <h3>{g.title}</h3>
              <p>{g.blurb}</p>
            </div>
            <span className="link-arrow">Try it in the editor <IconArrow width={14} height={14} /></span>
          </Link>
        ))}
      </div>

      <div className="section-sm">
        <div className="eyebrow">More topics</div>
        <div className="link-columns">
          {POPULAR_GUIDE_LINKS.map((g) => (
            <span key={g} className="seo-link">{g}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
