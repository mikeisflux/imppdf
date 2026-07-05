'use client';
// Template kit — shared building blocks for the one-file-per-template system.
//
// Every template lives in its own file under templates/<category>/<id>.tsx and
// exports a self-contained TemplateSpec: its geometry, its APPLY step-chain, and
// its OWN preview() function. The helpers here (grid/booklet/zine/single/poster
// preview factories + SVG mark primitives) keep each file small, but a template
// is free to replace preview() with a fully hand-drawn function to match the
// reference pixel-for-pixel without affecting any other template.
import React from 'react';
import type { StepType } from '../steps';

export type Category =
  | 'Commercial Print' | 'Packaging' | 'Publishing' | 'Large Format'
  | 'Office' | 'Variable Data' | 'Real Estate';

export interface LibStep { type: StepType; s?: Record<string, unknown>; }

export interface PreviewProps { mode: 'diagram' | 'example'; W: number; H: number; }

export interface TemplateSpec {
  id: string;
  name: string;
  desc: string;
  category: Category;
  /** Press-sheet size — drives the preview aspect ratio and the paper chip. */
  sheetWIn: number;
  sheetHIn: number;
  /** Editor step-chain applied on APPLY; its length is the N-STEP badge. */
  steps: LibStep[];
  /** This template's own thumbnail. Defaults come from the factories below. */
  preview: (p: PreviewProps) => React.ReactNode;
}

/** Identity helper so template files read declaratively. */
export function template(t: TemplateSpec): TemplateSpec { return t; }

// ── Deterministic mock branding (unchanged from the reference mock) ───────────
const BRANDS = ['AURORA', 'NOVA', 'PRISM', 'ZENITH', 'VIVID', 'EMBER', 'ONYX', 'VERTEX', 'APEX', 'PULSE', 'ECHO', 'FLUX', 'BLOOM', 'SURGE', 'METRO', 'CRAFT', 'PURE', 'SOLAR', 'LUNAR', 'NEON', 'FLORA', 'URBAN', 'ARCTIC', 'STELLAR'];
const TAGLINES = ['Creative Works', 'Design Studio', 'Print House', 'Ink & Type', 'Visual Arts', 'Brand Studio', 'Premium Brand', 'Art Direction', 'Creative Agency', 'Press Co', 'Atelier', 'Typography'];
const PALETTES: [string, string][] = [
  ['#86efac', '#7c3aed'], ['#4ade80', '#a21caf'], ['#fb923c', '#a78bfa'], ['#67e8f9', '#ec4899'],
  ['#a3e635', '#7f1d1d'], ['#f5d90a', '#38bdf8'], ['#f472b6', '#16a34a'], ['#b91c1c', '#5eead4'],
  ['#facc15', '#4338ca'], ['#34d399', '#1e3a8a'], ['#e879f9', '#365314'], ['#93c5fd', '#c2410c'],
];
export function hash(s: string): number { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h; }
export function brandOf(id: string) {
  const h = hash(id);
  return {
    brand: BRANDS[h % BRANDS.length]!,
    tagline: TAGLINES[(h >>> 3) % TAGLINES.length]!,
    palette: PALETTES[(h >>> 5) % PALETTES.length]!,
    variant: (h >>> 8) % 3,
  };
}

export interface Cell { x: number; y: number; w: number; h: number; rot?: boolean }

// ── Shared SVG primitives ─────────────────────────────────────────────────────

/** Crop ticks at all four corners of every piece. */
export function CropTicks({ cells }: { cells: Cell[] }) {
  return <>{cells.map((c, i) => (
    <path key={i} d={`M${c.x - 7} ${c.y}h4.5M${c.x} ${c.y - 7}v4.5M${c.x + c.w + 2.5} ${c.y}h4.5M${c.x + c.w} ${c.y - 7}v4.5M${c.x - 7} ${c.y + c.h}h4.5M${c.x} ${c.y + c.h + 2.5}v4.5M${c.x + c.w + 2.5} ${c.y + c.h}h4.5M${c.x + c.w} ${c.y + c.h + 2.5}v4.5`}
      stroke="#222" strokeWidth={0.7} />
  ))}</>;
}

/** Registration targets on the four edges of the imposition bounding box. */
export function RegTargets({ cells }: { cells: Cell[] }) {
  const minX = Math.min(...cells.map((c) => c.x)), minY = Math.min(...cells.map((c) => c.y));
  const maxX = Math.max(...cells.map((c) => c.x + c.w)), maxY = Math.max(...cells.map((c) => c.y + c.h));
  const pts: [number, number][] = [
    [(minX + maxX) / 2, minY - 8], [(minX + maxX) / 2, maxY + 8],
    [minX - 8, (minY + maxY) / 2], [maxX + 8, (minY + maxY) / 2],
  ];
  return <>{pts.map(([x, y], k) => (
    <g key={k} transform={`translate(${x} ${y})`} stroke="#111" strokeWidth={0.7} fill="none">
      <circle r={3.2} /><path d="M-5 0h10M0 -5v10" />
    </g>
  ))}</>;
}

/** Corner cutter dots. */
export function CutDots({ W, H, top = 7 }: { W: number; H: number; top?: number }) {
  const pts: [number, number][] = [[7, top], [W - 7, top], [7, H - 7], [W - 7, H - 7]];
  return <>{pts.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={2.6} fill="#111" />)}</>;
}

/** Saddle-stitch staples on the spine fold. */
export function Staples({ W, H }: { W: number; H: number }) {
  return <>{[0.32, 0.68].map((fy, i) => (
    <g key={i} transform={`translate(${W / 2} ${H * fy})`} fill="#111">
      <rect x={-1} y={-5.5} width={2} height={11} rx={0.8} />
      <rect x={-4} y={-5.5} width={8} height={1.8} rx={0.8} />
      <rect x={-4} y={3.7} width={8} height={1.8} rx={0.8} />
    </g>
  ))}</>;
}

/** Press color-control bar along the gripper edge. */
export function ColorBar({ W, seed }: { W: number; seed: number }) {
  return <>{Array.from({ length: 22 }, (_, i) => (
    <rect key={i} x={10 + i * ((W - 20) / 22)} y={3.5} width={(W - 20) / 22 - 0.8} height={4.5}
      fill={['#00b7d8', '#e52f8c', '#f5d90a', '#17181d', '#8a8f98'][(i + (seed % 3)) % 5]} />
  ))}</>;
}

/** One mocked-up printed piece (the confirmed reference look). */
export function MockPiece({ cell, id }: { cell: Cell; id: string }) {
  const c = cell;
  const { brand, tagline, palette: [c1, c2], variant } = brandOf(id);
  return (
    <g transform={c.rot ? `rotate(180 ${c.x + c.w / 2} ${c.y + c.h / 2})` : undefined}>
      <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c1} rx={1} />
      {variant === 0 && <>
        <rect x={c.x} y={c.y + c.h * 0.54} width={c.w} height={c.h * 0.46} fill={c2} />
        <rect x={c.x} y={c.y + c.h * 0.54} width={c.w} height={c.h * 0.46} fill="url(#pe-diag)" />
      </>}
      {variant === 1 && <>
        <rect x={c.x + c.w * 0.5} y={c.y} width={c.w * 0.5} height={c.h} fill={c2} />
        <rect x={c.x + c.w * 0.5} y={c.y} width={c.w * 0.5} height={c.h} fill="url(#pe-check)" />
      </>}
      {variant === 2 && <>
        <rect x={c.x} y={c.y + c.h * 0.58} width={c.w} height={c.h * 0.42} fill={c2} />
        {Array.from({ length: 6 }, (_, k) => {
          const inset = (k + 1) * Math.min(c.w, c.h * 0.58) * 0.06;
          return <rect key={k} x={c.x + inset} y={c.y + inset} width={c.w - 2 * inset} height={c.h * 0.58 - inset} fill="none" stroke="#ffffff" strokeWidth={0.5} strokeOpacity={0.35} />;
        })}
        <circle cx={c.x + c.w * 0.74} cy={c.y + c.h * 0.34} r={Math.min(c.w, c.h) * 0.2} fill="#ffffff" opacity={0.14} />
      </>}
      {c.w > 46 && (() => {
        const cx = variant === 1 ? c.x + c.w * 0.27 : c.x + c.w / 2;
        const cy = variant === 0 ? c.y + c.h * 0.3 : variant === 2 ? c.y + c.h * 0.78 : c.y + c.h * 0.46;
        const ink = variant === 2 ? '#17181d' : '#fff', sub = variant === 2 ? '#17181d99' : '#ffffffcc';
        return <>
          <text x={cx} y={cy} textAnchor="middle" fontFamily="Inter, ui-sans-serif" fontWeight={800} fontSize={Math.min(16, c.w / 6.2)} fill={ink}>{brand}</text>
          <text x={cx} y={cy + Math.min(14, c.w / 7)} textAnchor="middle" fontFamily="Inter, ui-sans-serif" fontSize={Math.min(6.5, c.w / 14)} fill={sub}>{tagline}</text>
        </>;
      })()}
    </g>
  );
}

/** Dashed numbered placeholder (DIAGRAM mode). */
export function DiagramPiece({ cell, n }: { cell: Cell; n: number }) {
  const c = cell;
  return (
    <g transform={c.rot ? `rotate(180 ${c.x + c.w / 2} ${c.y + c.h / 2})` : undefined}>
      <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="none" stroke="#7b6cf6" strokeWidth={1} strokeDasharray="4 3" />
      <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 5} textAnchor="middle" fontFamily="ui-monospace" fontSize={Math.min(15, c.h / 3)} fill="#4c4a85" fontWeight={700}>{n}</text>
    </g>
  );
}

/** The outer sheet + shared <defs>. Wrap every preview in this. */
export function Sheet({ W, H, children }: { W: number; H: number; children: React.ReactNode }) {
  return (
    <svg className="pe-lib-sheet" viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <defs>
        <pattern id="pe-diag" width="6.5" height="6.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6.5" stroke="#ffffff" strokeWidth="2.4" strokeOpacity="0.13" />
        </pattern>
        <pattern id="pe-check" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#ffffff" fillOpacity="0.1" />
          <rect x="10" y="10" width="10" height="10" fill="#ffffff" fillOpacity="0.1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="#fff" rx="1.5" />
      {children}
    </svg>
  );
}

// ── Cell layout helpers ───────────────────────────────────────────────────────

/** Even cols×rows grid inside the sheet, with gutters wide enough to read as
 *  separate pieces (the old renderer's ~3px gutter merged adjacent cards). */
export function gridLayout(cols: number, rows: number, W: number, H: number): Cell[] {
  const m = W * 0.065, g = Math.max(5, W * 0.02);
  const cw = (W - 2 * m - g * (cols - 1)) / cols;
  const ch = (H - 2 * m - g * (rows - 1)) / rows;
  const out: Cell[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    out.push({ x: m + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch });
  return out;
}

// ── Preview factories ─────────────────────────────────────────────────────────

export interface MarkOpts {
  crop?: boolean; reg?: boolean; cut?: boolean; colorbar?: boolean; watermark?: string;
}

function Marks({ cells, W, H, id, o }: { cells: Cell[]; W: number; H: number; id: string; o: MarkOpts }) {
  return <>
    {o.colorbar && <ColorBar W={W} seed={hash(id)} />}
    {o.crop && <CropTicks cells={cells} />}
    {o.reg && <RegTargets cells={cells} />}
    {o.cut && <CutDots W={W} H={H} top={o.colorbar ? 13 : 7} />}
    {o.watermark && (
      <text x={W / 2} y={H / 2} textAnchor="middle" fontFamily="Inter, ui-sans-serif" fontWeight={800}
        fontSize={26} fill="#00000030" transform={`rotate(-45 ${W / 2} ${H / 2})`}>{o.watermark}</text>
    )}
  </>;
}

function Pieces({ cells, mode, id }: { cells: Cell[]; mode: 'diagram' | 'example'; id: string }) {
  // Same design across every cell (a gang sheet repeats one artwork); the wide
  // gutters keep the identical pieces reading as separate cards.
  return <>{cells.map((c, i) => mode === 'example'
    ? <MockPiece key={i} cell={c} id={id} />
    : <DiagramPiece key={i} cell={c} n={i + 1} />)}</>;
}

/** Standard cols×rows gang. The default preview for most templates. */
export function grid(id: string, cols: number, rows: number, o: MarkOpts = {}) {
  return ({ mode, W, H }: PreviewProps) => {
    const cells = gridLayout(cols, rows, W, H);
    return <Sheet W={W} H={H}><Pieces cells={cells} mode={mode} id={id} /><Marks cells={cells} W={W} H={H} id={id} o={o} /></Sheet>;
  };
}

/** Single piece filling the sheet (posters, signs, single flats). */
export function single(id: string, o: MarkOpts = {}) {
  return ({ mode, W, H }: PreviewProps) => {
    const cells: Cell[] = [{ x: W * 0.1, y: H * 0.08, w: W * 0.8, h: H * 0.84 }];
    return <Sheet W={W} H={H}><Pieces cells={cells} mode={mode} id={id} /><Marks cells={cells} W={W} H={H} id={id} o={o} /></Sheet>;
  };
}

/** Saddle-stitch / signature spread: two facing pages + staples on the spine. */
export function booklet(id: string, o: MarkOpts & { saddle?: boolean } = {}) {
  return ({ mode, W, H }: PreviewProps) => {
    const m = W * 0.055, g = 6;
    const cw = (W - 2 * m - g) / 2, ch = H - 2 * m;
    const cells: Cell[] = [{ x: m, y: m, w: cw, h: ch }, { x: m + cw + g, y: m, w: cw, h: ch }];
    return <Sheet W={W} H={H}>
      <Pieces cells={cells} mode={mode} id={id} />
      <Marks cells={cells} W={W} H={H} id={id} o={o} />
      {o.saddle !== false && <Staples W={W} H={H} />}
    </Sheet>;
  };
}

/** One-sheet fold-and-cut zine: 4×2 imposition, top row rotated 180°. */
export function zine(id: string, o: MarkOpts = {}) {
  return ({ mode, W, H }: PreviewProps) => {
    const m = W * 0.055, g = 5, cols = 4, rows = 2;
    const cw = (W - 2 * m - g * (cols - 1)) / cols, ch = (H - 2 * m - g * (rows - 1)) / rows;
    const cells: Cell[] = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      cells.push({ x: m + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch, rot: r === 0 });
    return <Sheet W={W} H={H}><Pieces cells={cells} mode={mode} id={id} /><Marks cells={cells} W={W} H={H} id={id} o={o} /></Sheet>;
  };
}
