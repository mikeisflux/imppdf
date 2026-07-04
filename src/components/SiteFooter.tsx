import Link from 'next/link';
import { TOOLS, Tool } from '@/lib/tools';

// Group tools into the four footer columns shown in the design.
const COLS: { title: string; cats: Tool['category'][] }[] = [
  { title: 'Layout & Imposition', cats: ['imposition'] },
  { title: 'What you can make', cats: ['make'] },
  { title: 'Marks & prepress', cats: ['marks'] },
  { title: 'Pages & advanced', cats: ['pages', 'advanced'] },
];

export function SiteFooter() {
  return (
    <footer className="pp-footer">
      <div className="container-wide">
        <div className="pp-footer-tools-label">All tools</div>
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
          <div className="muted">© 2026 ImpositionPDF. Files stay on your device.</div>
          <div className="pp-footer-links">
            <Link href="/about">About</Link>
            <span className="sep">/</span>
            <Link href="/pricing">Pricing</Link>
            <span className="sep">/</span>
            <Link href="/contact">Contact</Link>
            <span className="sep">/</span>
            <Link href="/privacy">Privacy</Link>
            <span className="sep">/</span>
            <Link href="/terms">Terms</Link>
            <span className="pp-footer-follow">Follow</span>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
