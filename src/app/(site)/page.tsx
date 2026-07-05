import Link from 'next/link';
import '@/components/home/home.css';
import { Hero } from '@/components/home/Hero';
import { Reviews } from '@/components/home/Reviews';
import { Faq } from '@/components/home/Faq';
import { ToolMockup } from '@/components/home/ToolMockup';
import {
  WHY_CARDS, USE_CASES, GUIDES, CATEGORY_LABEL, COMPARE_LINKS,
  POPULAR_GUIDE_LINKS, toolsByCategory, ToolCategory, toolAppHref,
} from '@/lib/tools';
import { IconArrow, IconPrinter, IconGrid } from '@/components/icons';
import { faqStructuredData } from '@/lib/seo';

const HOW_TO = [
  { n: 1, title: 'Add your PDF', body: 'Open ImpositionPDF in your browser and add the PDF or images you want to impose.' },
  { n: 2, title: 'Choose an imposition layout', body: 'Pick booklet, N-up grid, or step & repeat to gang up cards, labels and stickers.' },
  { n: 3, title: 'Set the sheet details', body: 'Choose page size, margins, gutters and bleed, and add crop, cut or registration marks.' },
  { n: 4, title: 'Preview and export', body: 'Check the live press-sheet preview, fix the page order, then export a print-ready PDF, processed locally with nothing uploaded.' },
];

const GALLERY_SECTIONS: ToolCategory[] = ['imposition', 'make', 'marks', 'pages'];

function GallerySection({ cat }: { cat: ToolCategory }) {
  // Homepage shows the curated, art-backed subset; the footer + /tools pages
  // cover the full catalog.
  const tools = toolsByCategory(cat).filter((t) => t.featured);
  return (
    <div className="gallery-block">
      <h3 className="gallery-block-title">{CATEGORY_LABEL[cat]}</h3>
      <div className="gallery-grid">
        {tools.map((t) => (
          <Link key={t.slug} href={toolAppHref(t.slug)} className="gallery-card card">
            <div className="gallery-thumb">
              <ToolMockup slug={t.slug} category={t.category} />
              {!t.inPlugin && <span className="gallery-soon">Coming soon</span>}
            </div>
            <div className="gallery-meta">
              <h4>{t.name}</h4>
              <p>{t.blurb}</p>
              <span className="link-arrow">{t.cta || 'Open tool'} <IconArrow width={15} height={15} /></span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData()) }} />
      <Hero />

      {/* Animated emoji tagline */}
      <section className="section tagline-section">
        <div className="container center">
          <p className="tagline">
            Turn any 📄 PDF into a print-ready press sheet 🖨️. Booklets 📚, n-up cards 🪪,
            labels 🏷️ and gang sheets, imposed with crop marks, bleeds and color bars, right
            in your browser. No installs, no waiting ⏱️.
          </p>
        </div>
      </section>

      {/* Why ImpositionPDF */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="pill-badge">✦ Why ImpositionPDF</span>
            <h2 style={{ marginTop: 16 }}>Why print pros choose ImpositionPDF</h2>
          </div>
          <div className="grid-3">
            {WHY_CARDS.map((c) => (
              <div key={c.title} className="card card-pad why-card">
                <div className="why-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p className="muted">{c.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="pill-badge">✦ Use cases</span>
            <h2 style={{ marginTop: 16 }}>Built for every print job</h2>
            <p>From a corner copy shop to a packaging line, ImpositionPDF imposes the layout each job needs and exports a print-ready PDF.</p>
          </div>
          <div className="grid-3">
            {USE_CASES.map((u) => (
              <div key={u.title} className="card card-pad usecase-card">
                <div className="why-icon">{u.icon}</div>
                <h3>{u.title}</h3>
                <p className="muted">{u.blurb}</p>
                <Link href={u.href} className="link-arrow">{u.link} <IconArrow width={15} height={15} /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to impose */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="pill-badge">✦ Step by step</span>
            <h2 style={{ marginTop: 16 }}>How to impose a PDF</h2>
            <p>To impose a PDF, you arrange its single pages onto a larger press sheet in the exact order and position your printer needs. ImpositionPDF does it right in your browser.</p>
          </div>
          <div className="grid-4">
            {HOW_TO.map((s) => (
              <div key={s.n} className="card card-pad howto-card">
                <span className="howto-num">{s.n}</span>
                <h4>{s.title}</h4>
                <p className="muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section" id="gallery">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Built for print</div>
            <h2>Everything a print-ready PDF needs</h2>
            <div style={{ marginTop: 18 }}>
              <Link href="/app" className="btn btn-ghost btn-lg">Browse the full gallery <IconArrow width={16} height={16} /></Link>
            </div>
          </div>
          {GALLERY_SECTIONS.map((cat) => (
            <GallerySection key={cat} cat={cat} />
          ))}
        </div>
      </section>

      <Reviews />

      {/* Guides */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="pill-badge">✦ Guides</span>
            <h2 style={{ marginTop: 16 }}>Popular imposition &amp; prepress guides</h2>
            <p>Step-by-step tutorials and comparisons to help you impose, fold and print with confidence.</p>
          </div>
          <div className="grid-3">
            {GUIDES.map((g) => (
              <Link key={g.title} href="/guide" className="card card-pad guide-card">
                <h3>{g.title}</h3>
                <p className="muted">{g.blurb}</p>
                <span className="link-arrow">Read the guide <IconArrow width={15} height={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA with floating orbs */}
      <section className="section cta-section">
        <div className="cta-orbs" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => <span key={i} className={`orb orb-${i}`} />)}
        </div>
        <div className="container center cta-inner">
          <h2 className="cta-title">Impose your next job in the browser</h2>
          <p className="muted cta-sub">Drop in a PDF, pick a layout, and export a print-ready sheet with marks and bleed. No install, no upload, no account needed to start.</p>
          <div className="row wrap" style={{ justifyContent: 'center', marginTop: 22 }}>
            <Link href="/app" className="btn btn-primary btn-lg"><IconPrinter width={18} height={18} /> Start imposing</Link>
            <Link href="/#gallery" className="btn btn-ghost btn-lg"><IconGrid width={18} height={18} /> Browse the gallery</Link>
          </div>
        </div>
      </section>

      <Faq />

      {/* SEO content block */}
      <section className="section-sm seo-section">
        <div className="container">
          <div className="eyebrow">Every imposition layout, in your browser</div>
          <h2 className="seo-title">Solve all your PDF imposition needs</h2>
          <p className="muted seo-copy">
            ImpositionPDF is browser-based PDF imposition software for print professionals. It runs
            entirely on your device, so customer files never leave the browser. Turn ordinary
            PDFs into print-ready booklets, N-up sheets, business cards, labels, tickets and gang
            sheets with crop and cutter marks, variable data printing and live preflight. No
            upload, no install. Works in any modern browser.
          </p>

          <div className="seo-cols">
            {GALLERY_SECTIONS.concat('advanced').map((cat) => (
              <div key={cat} className="seo-col">
                <h4>{CATEGORY_LABEL[cat as ToolCategory]}</h4>
                <ul>
                  {toolsByCategory(cat as ToolCategory).slice(0, 8).map((t) => (
                    <li key={t.slug}><Link href={`/tools/${t.slug}`}>{t.name}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare & alternatives */}
      <section className="section-sm">
        <div className="container">
          <div className="eyebrow">Compare &amp; alternatives</div>
          <p className="muted" style={{ maxWidth: 640, marginBottom: 24 }}>
            How ImpositionPDF compares to other imposition software and why it is a strong free,
            browser-based alternative to the tools print pros search for.
          </p>
          <div className="link-columns">
            {COMPARE_LINKS.map((c) => (
              <Link key={c} href="/guide" className="seo-link">⇄ {c}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular guides */}
      <section className="section-sm">
        <div className="container">
          <div className="eyebrow">Popular guides</div>
          <div className="link-columns">
            {POPULAR_GUIDE_LINKS.map((g) => (
              <Link key={g} href="/guide" className="seo-link">▤ {g}</Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
