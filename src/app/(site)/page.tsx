import Link from 'next/link';
import { Hero } from '@/components/home/Hero';
import { Faq } from '@/components/home/Faq';
import { ToolMockup } from '@/components/home/ToolMockup';
import {
  WHY_CARDS, USE_CASES, GUIDES, CATEGORY_LABEL, COMPARE_LINKS,
  POPULAR_GUIDE_LINKS, toolsByCategory, ToolCategory, toolAppHref,
} from '@/lib/tools';
import { COMPETITORS } from '@/lib/compare';
import { IconArrow } from '@/components/icons';
import { faqStructuredData } from '@/lib/seo';

// From file to press sheet, in the order it happens at the counter.
const HOW_TO = [
  { n: '1', title: 'Open the file', body: 'Drag a PDF into the editor — or images, or a CSV if the job has numbers and names on it. It opens in your browser and stays there.' },
  { n: '2', title: 'Pick the job', body: 'A saddle-stitched booklet, an N-up sheet, a step-and-repeat run, a tiled poster, a dieline. Set the sheet, bleed, gutters and marks; the preview redraws as you type.' },
  { n: '3', title: 'Export the press sheet', body: 'Download a PDF laid out for your press and your finishing, page order and marks included. Open it in the RIP and print.' },
];

const GALLERY_SECTIONS: ToolCategory[] = ['imposition', 'make', 'marks', 'pages'];

function GallerySection({ cat }: { cat: ToolCategory }) {
  // Homepage shows the curated, art-backed subset; the footer + /tools pages
  // cover the full catalog.
  const all = toolsByCategory(cat);
  const tools = all.filter((t) => t.featured);
  return (
    <div className="gallery-block reveal">
      <h3 className="gallery-block-title">{CATEGORY_LABEL[cat]} <small>{tools.length} of {all.length}</small></h3>
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
              <span className="link-arrow">{t.cta || 'Open tool'} <IconArrow width={14} height={14} /></span>
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

const pad = (n: number) => String(n).padStart(2, '0');

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData()) }} />
      <Hero />

      {/* 01 — What it does */}
      <section className="section">
        <div className="container">
          <div className="sec-head reveal">
            <div className="sec-n eyebrow" style={{ marginBottom: 0 }}>01 — What it does</div>
            <h2>Built the way a press room works.</h2>
            <p>A PDF goes in. A press sheet comes out — folded, ganged, numbered, marked up and ready for the RIP — without leaving your browser tab.</p>
          </div>
          <div className="index reveal">
            {WHY_CARDS.map((c, i) => (
              <div key={c.title} className="index-row">
                <span className="index-n">{pad(i + 1)}</span>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 02 — Jobs */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head reveal">
            <div className="sec-n eyebrow" style={{ marginBottom: 0 }}>02 — Jobs</div>
            <h2>One tool, most of the jobs on the board.</h2>
            <p>Each of these is a job as it arrives at the counter, and the tool that turns it into a sheet.</p>
          </div>
          <div className="tickets reveal">
            {USE_CASES.map((u, i) => (
              <div key={u.title} className="ticket">
                <div className="ticket-head"><b>Job {pad(i + 1)}</b><span>{u.link}</span></div>
                <div className="ticket-body">
                  <h3>{u.title}</h3>
                  <p>{u.blurb}</p>
                  <Link href={u.href} className="link-arrow">{u.link} <IconArrow width={14} height={14} /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — Three steps */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head reveal">
            <div className="sec-n eyebrow" style={{ marginBottom: 0 }}>03 — Three steps</div>
            <h2>From file to press sheet.</h2>
            <p>Imposition is the step between a finished document and a printable sheet: the pages are placed, turned and ordered so that after folding and cutting they read as intended. Here that step is a tab in your browser.</p>
          </div>
          <div className="steps reveal">
            {HOW_TO.map((s) => (
              <div key={s.n} className="step">
                <div className="step-n">{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — Gallery */}
      <section className="section" id="gallery" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head reveal">
            <div className="sec-n eyebrow" style={{ marginBottom: 0 }}>04 — The tools</div>
            <h2>Pick the layout, not the software.</h2>
            <p>Ninety-odd tools in one editor, each one there because a real job needed it. The full catalogue is in the footer and in the editor itself.</p>
          </div>
          {GALLERY_SECTIONS.map((cat) => (
            <GallerySection key={cat} cat={cat} />
          ))}
          <div style={{ marginTop: 36 }}>
            <Link href="/app" className="btn btn-line btn-lg">Open the editor with every tool <IconArrow width={16} height={16} /></Link>
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head reveal">
            <div className="sec-n eyebrow" style={{ marginBottom: 0 }}>Guides</div>
            <h2>Notes from the shop floor.</h2>
            <p>Short, practical pieces on the parts of prepress that go wrong most often: folding, trimming, backing up and getting a file past the RIP.</p>
          </div>
          <div className="guide-list reveal">
            {GUIDES.map((g, i) => (
              <Link key={g.title} href="/guide" className="guide-row">
                <span className="index-n">{pad(i + 1)}</span>
                <div>
                  <h3>{g.title}</h3>
                  <p>{g.blurb}</p>
                </div>
                <span className="link-arrow">Read it <IconArrow width={14} height={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* The band */}
      <section className="band">
        <div className="container">
          <div className="reg-dots" aria-hidden><i /><i /><i /><i /></div>
          <h2 className="band-title">Your next sheet is <span className="it">one tab away.</span></h2>
          <p className="band-sub">Open the editor, drop the PDF in, and have a marked-up press sheet back before the kettle boils. No install, no upload, and nothing to sign up for to try it.</p>
          <div className="row wrap">
            <Link href="/app" className="btn btn-paper btn-lg">Open the editor <IconArrow width={16} height={16} /></Link>
            <Link href="/pricing" className="btn btn-line btn-lg">See the plans</Link>
          </div>
        </div>
      </section>

      <Faq />

      {/* Catalogue by category */}
      <section className="section-sm seo-section">
        <div className="container">
          <div className="eyebrow">The whole catalogue</div>
          <h2 className="seo-title">Ninety-odd tools, one editor.</h2>
          <p className="seo-copy">
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

      {/* Comparisons + topics */}
      <section className="section-sm">
        <div className="container">
          <div className="grid-2" style={{ gap: 48 }}>
            <div>
              <div className="eyebrow">Comparisons</div>
              <p className="muted" style={{ maxWidth: '34em', marginBottom: 20 }}>
                What the desktop apps, plug-ins and prepress suites are good at, and where doing
                the job in a browser tab — on your own machine, nothing uploaded — differs.
              </p>
              <div className="link-columns" style={{ columns: 2 }}>
                {COMPARE_LINKS.map((c) => (
                  <Link key={c} href={compareHref(c)} className="seo-link">vs {c}</Link>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow">More topics</div>
              <div className="link-columns" style={{ columns: 2 }}>
                {POPULAR_GUIDE_LINKS.map((g) => (
                  <Link key={g} href="/guide" className="seo-link">{g}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
