'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  IconUpload, IconArrow, IconBook, IconGrid, IconCards, IconSliders,
  IconFlag, IconScissors, IconFile, IconLayers, IconSparkle,
} from '@/components/icons';
import { HERO_LAYOUT_CHIPS, toolAppHref } from '@/lib/tools';

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
  Newspapers: 'n-up-book', Zine: 'zine', Cards: 'business-cards', Postcards: 'postcards',
  Stickers: 'stickers', Calendar: 'calendar', Posters: 'tiled-poster', Flyers: 'flyers',
  'Photo Prints': 'photo-prints', Banners: 'banner', Packaging: 'packaging-dieline',
  'Cutter Marks': 'cutter-marks', 'Custom Impose': 'custom-impose', 'Folding Brochure': 'folded-brochure',
  Watermark: 'watermark', 'Color Convert': 'color-management', 'Merge PDF': 'merge',
  'Split PDF': 'split', 'Compress PDF': 'pdf-tools', 'Repair PDF': 'pdf-repair',
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
          <span className="pill-badge"><IconSparkle width={15} height={15} className="spark" /> Imposition and prepress, entirely on your own machine</span>
        </div>

        <h1 className="hero-title">
          Lay out the press sheet
          <br />
          <span className="gradient-text">in your browser</span>
        </h1>

        <p className="hero-sub">
          Booklets, N-up, step and repeat, gang sheets, tiled posters and numbered tickets,
          imposed by your own computer from a PDF you never have to upload.
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
            <strong>Drop a PDF here to start</strong>
            <span>PDF, JPEG, PNG, CSV or Excel. It opens in this tab and goes no further.</span>
          </div>
          <div className="hero-drop-actions">
            <span className="btn btn-primary"><IconUpload width={16} height={16} /> Choose a file</span>
            <span className="btn btn-ghost">Choose a folder</span>
          </div>
        </div>

        <div className="hero-layouts">
          <div className="hero-layouts-label">or start with a layout</div>
          <div className="hero-layouts-chips">
            {HERO_LAYOUT_CHIPS.map((c) => {
              const slug = CHIP_TO_SLUG[c];
              const href = slug ? toolAppHref(slug) : '/app';
              return (
                <Link key={c} href={href} className="chip">
                  <IconLayers width={14} height={14} /> {c}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hero-trust">
          <div className="hero-trust-text">Made in a working print shop</div>
          <div className="hero-trust-pill">
            <span className="dot" /> No upload, no install, and no account needed to try it.
          </div>
        </div>

        <Link href="/app" className="hero-ai" aria-label="Open the imposition editor">
          <span className="hero-ai-orb" />
          <span className="hero-ai-label">Open editor</span>
          <span className="hero-ai-input">Set up a custom sheet</span>
          <span className="hero-ai-send"><IconArrow width={16} height={16} /></span>
        </Link>
      </div>
    </section>
  );
}
