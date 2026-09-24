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
import { COMPETITORS } from '@/lib/compare';
import { IconArrow, IconPrinter, IconGrid } from '@/components/icons';
import { faqStructuredData } from '@/lib/seo';

// From file to press sheet, in the order it happens at the counter.
const HOW_TO = [
  { n: 1, title: 'Open the file', body: 'Drag a PDF into the editor — or images, or a CSV if the job has numbers and names on it. It opens in your browser and stays there.' },
  { n: 2, title: 'Pick the job', body: 'A saddle-stitched booklet, an N-up sheet, a step-and-repeat run, a tiled poster, a dieline. Set the sheet, bleed, gutters and marks; the preview redraws as you type.' },
  { n: 3, title: 'Export the press sheet', body: 'Download a PDF laid out for your press and your finishing, page order and marks included. Open it in the RIP and print.' },
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

// A comparison label links to its page when there is one.
function compareHref(label: string): string {
  const c = COMPETITORS.find((x) => x.name.toLowerCase() === label.toLowerCase());
  return c ? `/compare/${c.slug}` : '/compare';
}

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData()) }} />
      <Hero />

      <section className="section tagline-section">
        <div className="container center">
          <p className="tagline">
            A PDF goes in. A press sheet comes out — folded 📚, ganged 🪪, numbered 🎟️,
            marked up ✂️ and ready for the RIP 🖨️ — without leaving your browser tab.
          </p>
        </div>
      </section>

      {/* What it does */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="pill-badge">✦ What it does</span>
            <h2 style={{ marginTop: 16 }}>Built the way a press room works</h2>
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

      {/* Jobs */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="pill-badge">✦ Jobs</span>
            <h2 style={{ marginTop: 16 }}>One tool, most of the jobs on the board</h2>
            <p>Each of these is a job as it arrives at the counter, and the tool that turns it into a sheet.</p>
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

      {/* Three steps */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="pill-badge">✦ Three steps</span>
            <h2 style={{ marginTop: 16 }}>From file to press sheet</h2>
            <p>Imposition is the step between a finished document and a printable sheet: the pages are placed, turned and ordered so that after folding and cutting they read as intended. Here that step is a tab in your browser.</p>
          </div>
          <div className="grid-3">
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
            <div className="eyebrow">The tool gallery</div>
            <h2>Pick the layout, not the software</h2>
            <div style={{ marginTop: 18 }}>
              <Link href="/app" className="btn btn-ghost btn-lg">See every tool <IconArrow width={16} height={16} /></Link>
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
            <h2 style={{ marginTop: 16 }}>Notes from the shop floor</h2>
            <p>Short, practical pieces on the parts of prepress that go wrong most often: folding, trimming, backing up and getting a file past the RIP.</p>
          </div>
          <div className="grid-3">
            {GUIDES.map((g) => (
              <Link key={g.title} href="/guide" className="card card-pad guide-card">
                <h3>{g.title}</h3>
                <p className="muted">{g.blurb}</p>
                <span className="link-arrow">Read it <IconArrow width={15} height={15} /></span>
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
          <h2 className="cta-title">Your next sheet is one tab away</h2>
          <p className="muted cta-sub">Open the editor, drop the PDF in, and have a marked-up press sheet back before the kettle boils. No install, no upload, and nothing to sign up for to try it.</p>
          <div className="row wrap" style={{ justifyContent: 'center', marginTop: 22 }}>
            <Link href="/app" className="btn btn-primary btn-lg"><IconPrinter width={18} height={18} /> Open the editor</Link>
            <Link href="/#gallery" className="btn btn-ghost btn-lg"><IconGrid width={18} height={18} /> See the tools</Link>
          </div>
        </div>
      </section>

      <Faq />

      {/* Catalogue by category */}
      <section className="section-sm seo-section">
        <div className="container">
          <div className="eyebrow">The whole catalogue</div>
          <h2 className="seo-title">Ninety-odd tools, one editor</h2>
          <p className="muted seo-copy">
            ImpositionPDF started as the in-house prepress tool of a small print shop and grew one
            job at a time: a booklet that would not fold right, a run of tickets that needed
            numbering, a sheet of cards for a cutter that steps a fixed pitch. Every tool in the
            catalogue exists because a real job needed it. All of them run in the browser, on your
            own machine, on a PDF that never has to be uploaded.
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

      {/* Comparisons */}
      <section className="section-sm">
        <div className="container">
          <div className="eyebrow">Comparisons</div>
          <p className="muted" style={{ maxWidth: 640, marginBottom: 24 }}>
            Side-by-side pages for the desktop apps, plug-ins and prepress suites people usually
            weigh ImpositionPDF against — what each one is, and where doing the job in a browser
            with nothing uploaded differs.
          </p>
          <div className="link-columns">
            {COMPARE_LINKS.map((c) => (
              <Link key={c} href={compareHref(c)} className="seo-link">⇄ vs {c}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* More guide topics */}
      <section className="section-sm">
        <div className="container">
          <div className="eyebrow">More topics</div>
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
