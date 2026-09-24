import Link from 'next/link';
import { TOOLS, Tool } from '@/lib/tools';
import { siteContact } from '@/lib/config';

// Group tools into the four footer columns.
const COLS: { title: string; cats: Tool['category'][] }[] = [
  { title: 'Layout & imposition', cats: ['imposition'] },
  { title: 'What you can make', cats: ['make'] },
  { title: 'Marks & prepress', cats: ['marks'] },
  { title: 'Pages & advanced', cats: ['pages', 'advanced'] },
];

// The colour bar a press sheet carries in its margin: C, M, Y, K at 100 / 75 /
// 50 / 25 %. Purely a signature here — but a correct one.
const BAR = ['#00b4e6', '#40c7ec', '#80d9f2', '#bfecf9', '#e6007e', '#ec40a0', '#f280bf', '#f9bfdf',
  '#ffd400', '#ffdf40', '#ffea80', '#fff4bf', '#14120f', '#4f4d4a', '#8a8886', '#c5c3c0'];

export function SiteFooter() {
  return (
    <footer className="pp-footer">
      <div className="colorbar" aria-hidden>
        {BAR.map((c) => <i key={c} style={{ background: c }} />)}
      </div>
      <div className="container-wide">
        <div className="pp-footer-tools-label">Every tool</div>
        <div className="pp-footer-tools">
          {COLS.map((col) => {
            const items = TOOLS.filter((t) => col.cats.includes(t.category));
            return (
              <div key={col.title} className="pp-footer-col">
                <h4>{col.title}</h4>
                <ul>
                  {items.map((t) => (
                    <li key={t.slug}>
                      <Link href={`/tools/${t.slug}`}>{t.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="pp-footer-bottom">
          <div className="muted">
            © 2026 ImpositionPDF. Your files never leave your device.
            <span className="sep">/</span>
            <a href={siteContact.phoneHref}>{siteContact.phoneDisplay}</a>
          </div>
          <div className="pp-footer-links">
            <Link href="/about">About</Link>
            <span className="sep">/</span>
            <Link href="/pricing">Pricing</Link>
            <span className="sep">/</span>
            <Link href="/compare">Compare</Link>
            <span className="sep">/</span>
            <Link href="/contact">Contact</Link>
            <span className="sep">/</span>
            <Link href="/privacy">Privacy</Link>
            <span className="sep">/</span>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
