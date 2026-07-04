'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  IconUpload, IconArrow, IconBook, IconGrid, IconCards, IconSliders,
  IconFlag, IconScissors, IconFile, IconLayers, IconSparkle,
} from '@/components/icons';
import { HERO_LAYOUT_CHIPS } from '@/lib/tools';

const FEATURES = [
  { label: 'Booklets', icon: IconBook }, { label: 'N-up', icon: IconGrid },
  { label: 'Step & repeat', icon: IconLayers }, { label: 'Grid', icon: IconGrid },
  { label: 'Cards', icon: IconCards }, { label: 'Custom impose', icon: IconSliders },
  { label: 'Crop marks & bleeds', icon: IconFlag }, { label: 'Cutter marks', icon: IconScissors },
  { label: 'Variable data', icon: IconFile },
];

// Map a layout chip label to a tool slug where one exists.
const CHIP_TO_SLUG: Record<string, string> = {
  Books: 'perfect-bound-book', Brochures: 'trifold-brochure', Magazines: 'saddle-stitch-magazine',
  Newspapers: 'n-up-book', Zine: 'zine', Cards: 'business-cards', Postcards: 'business-cards',
  Stickers: 'stickers', Calendar: 'calendar', Posters: 'tiled-poster', Flyers: 'standard-sizes',
  'Photo Prints': 'index-print', Banners: 'tiled-poster', Packaging: 'packaging-dieline',
  'Cutter Marks': 'cutter-marks', 'Custom Impose': 'custom-impose', 'Folding Brochure': 'folded-brochure',
  Watermark: 'watermark', 'Color Convert': 'color-management', 'Merge PDF': 'merge',
  'Split PDF': 'split', 'Compress PDF': 'compress', 'Repair PDF': 'pdf-repair',
};

export function Hero() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  // Files are processed inside the app itself; the hero just launches it.
  const openApp = () => router.push('/app');

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-badge">
          <span className="pill-badge"><IconSparkle width={15} height={15} className="spark" /> Browser-based imposition &amp; prepress</span>
        </div>

        <h1 className="hero-title">
          Impose, mark up &amp; export
          <br />
          <span className="gradient-text">print-ready PDFs</span>
        </h1>

        <p className="hero-sub">
          Booklets, N-up, step and repeat, and variable data, all built right in your
          browser. Your files never get uploaded. Sign in once and start in seconds.
        </p>

        <div className="hero-features">
          {FEATURES.map((f) => (
            <span key={f.label} className="hero-feature">
              <f.icon width={16} height={16} /> {f.label}
            </span>
          ))}
        </div>

        <div
          className={`hero-drop ${drag ? 'drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); openApp(); }}
          onClick={openApp}
          role="button"
          tabIndex={0}
        >
          <input ref={inputRef} type="file" hidden accept=".pdf,image/*,.csv,.xlsx" onChange={openApp} />
          <div className="hero-drop-icon"><IconUpload width={22} height={22} /></div>
          <div className="hero-drop-text">
            <strong>Drop files here or click to select</strong>
            <span>PDF, images, CSV and Excel. Files stay on your device.</span>
          </div>
          <div className="hero-drop-actions">
            <span className="btn btn-primary"><IconUpload width={16} height={16} /> Upload a File</span>
            <span className="btn btn-ghost">Select Folder</span>
          </div>
        </div>

        <div className="hero-layouts">
          <div className="hero-layouts-label">or start with a layout</div>
          <div className="hero-layouts-chips">
            {HERO_LAYOUT_CHIPS.map((c) => {
              const slug = CHIP_TO_SLUG[c];
              const href = slug ? `/tools/${slug}` : '/app';
              return (
                <Link key={c} href={href} className="chip">
                  <IconLayers width={14} height={14} /> {c}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hero-trust">
          <div className="hero-trust-text">Trusted by print and design teams</div>
          <div className="hero-trust-pill">
            <span className="dot" /> We respect your privacy. Files are processed locally on your device.
          </div>
        </div>

        <Link href="/app" className="hero-ai" aria-label="Open the imposition app">
          <span className="hero-ai-orb" />
          <span className="hero-ai-label">Ask AI to</span>
          <span className="hero-ai-input">build a custom imposition</span>
          <span className="hero-ai-send"><IconArrow width={16} height={16} /></span>
        </Link>
      </div>
    </section>
  );
}
