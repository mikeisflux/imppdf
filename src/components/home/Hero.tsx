import Link from 'next/link';
import { IconArrow, IconLayers } from '@/components/icons';
import { HERO_LAYOUT_CHIPS, toolAppHref } from '@/lib/tools';
import { PressSheet } from './PressSheet';

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
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow hero-eyebrow">Imposition &amp; prepress · runs on your machine</div>
            <h1 className="hero-title">
              Lay out the press sheet <span className="it">in your browser.</span>
            </h1>
            <p className="hero-sub">
              Booklets, N-up, step and repeat, gang sheets, tiled posters and numbered tickets —
              imposed by your own computer from a PDF you never have to upload.
            </p>
            <div className="hero-actions">
              <Link href="/app" className="btn btn-ink btn-lg">Open the editor <IconArrow width={16} height={16} /></Link>
              <Link href="/#gallery" className="btn btn-line btn-lg">See the tools</Link>
            </div>
            <div className="hero-spec">
              <span><i /> No upload</span>
              <span><i /> No install</span>
              <span><i /> Free to start</span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden>
            <PressSheet />
            <div className="hero-caption">
              <span>Letter · 2 × 4 · bleed 1.5</span>
              <span>marks · bar · slug</span>
            </div>
          </div>
        </div>

        <div className="hero-layouts">
          <div className="hero-layouts-label eyebrow" style={{ marginBottom: 0 }}>Start from a layout</div>
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
      </div>
    </section>
  );
}
