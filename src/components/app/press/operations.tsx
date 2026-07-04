'use client';
import React from 'react';

// ── Line icons (stroke-based, match the reference screenshots) ───────────────
const S = (p: React.SVGProps<SVGSVGElement> & { children: React.ReactNode }) => (
  <svg width={p.width ?? 20} height={p.height ?? 20} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {p.children}
  </svg>
);

export const Icons = {
  cards: (p = {}) => <S {...p}><rect x="3" y="4" width="14" height="16" rx="1.5" /><path d="M7 8h6M7 12h6" /><rect x="9" y="6" width="12" height="14" rx="1.5" fill="var(--pe-bg)" /></S>,
  booklet: (p = {}) => <S {...p}><path d="M12 5v15" /><path d="M12 5C10 3.5 6 3.5 4 5v13c2-1.5 6-1.5 8 0 2-1.5 6-1.5 8 0V5c-2-1.5-6-1.5-8 0Z" /></S>,
  shuffle: (p = {}) => <S {...p}><path d="M16 4h4v4" /><path d="M4 20 20 4" /><path d="M4 4l5 5" /><path d="M16 20h4v-4" /><path d="M14 14l6 6" /></S>,
  grid: (p = {}) => <S {...p}><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M4 12h16M12 4v16" /></S>,
  nupbook: (p = {}) => <S {...p}><rect x="3" y="5" width="8" height="14" rx="1" /><rect x="13" y="5" width="8" height="14" rx="1" /><path d="M7 9v6M17 9v6" /></S>,
  cutstack: (p = {}) => <S {...p}><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><path d="M8 6h12M8 18h12M14 6l-6 12" /></S>,
  resize: (p = {}) => <S {...p}><path d="M4 9V4h5M20 15v5h-5" /><path d="M4 4l6 6M20 20l-6-6" /></S>,
  rotate: (p = {}) => <S {...p}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v5h-5" /></S>,
  crop: (p = {}) => <S {...p}><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M2 6h14a2 2 0 0 1 2 2v14" /></S>,
  split: (p = {}) => <S {...p}><rect x="3" y="4" width="8" height="16" rx="1" /><rect x="13" y="4" width="8" height="16" rx="1" /></S>,
  flip: (p = {}) => <S {...p}><path d="M12 3v18" /><path d="M8 7 4 12l4 5M16 7l4 5-4 5" /></S>,
  merge: (p = {}) => <S {...p}><rect x="3" y="3" width="10" height="13" rx="1" /><rect x="11" y="8" width="10" height="13" rx="1" fill="var(--pe-bg)" /></S>,
  overlay: (p = {}) => <S {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></S>,
  distort: (p = {}) => <S {...p}><path d="M4 6c4-2 12-2 16 0M4 18c4 2 12 2 16 0M4 6v12M20 6v12" /></S>,
  bleed: (p = {}) => <S {...p}><path d="M4 4h5V2M20 4h-5V2M4 20h5v2M20 20h-5v2M4 9v6M20 9v6" /><rect x="8" y="8" width="8" height="8" rx="1" /></S>,
  nudge: (p = {}) => <S {...p}><path d="M12 3v18M3 12h18" /><path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" /></S>,
  headerfooter: (p = {}) => <S {...p}><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M4 8h16M4 16h16" /></S>,
  colorbar: (p = {}) => <S {...p}><rect x="3" y="9" width="18" height="6" rx="1" /><path d="M7 9v6M11 9v6M15 9v6" /></S>,
  stickers: (p = {}) => <S {...p}><path d="M4 4h16v11l-5 5H4Z" /><path d="M20 15h-5v5" /></S>,
  calendar: (p = {}) => <S {...p}><rect x="3" y="5" width="18" height="16" rx="1.5" /><path d="M3 9h18M8 3v4M16 3v4" /></S>,
  insertpages: (p = {}) => <S {...p}><rect x="4" y="3" width="12" height="18" rx="1.5" /><path d="M18 8v8M22 12h-8" /></S>,
  mix: (p = {}) => <S {...p}><path d="M4 7h6M14 7h6M4 12h16M4 17h6M14 17h6" /></S>,
  slugline: (p = {}) => <S {...p}><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M7 20v-3h5v3" /><path d="M7 8h6" /></S>,
  foldmarks: (p = {}) => <S {...p}><path d="M8 3v18M16 3v18" strokeDasharray="3 3" /><path d="M3 12h18" /></S>,
  registration: (p = {}) => <S {...p}><circle cx="12" cy="12" r="7" /><path d="M12 2v20M2 12h20" /></S>,
  collating: (p = {}) => <S {...p}><rect x="4" y="6" width="12" height="14" rx="1" /><rect x="8" y="3" width="12" height="14" rx="1" fill="var(--pe-bg)" /></S>,
  // toolbar
  search: (p = {}) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></S>,
  list: (p = {}) => <S {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></S>,
  gridview: (p = {}) => <S {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></S>,
  layers: (p = {}) => <S {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></S>,
  sort: (p = {}) => <S {...p}><path d="M7 4v16M7 20l-3-3M7 4l3 3M17 4v16M17 4l-3 3M17 20l3-3" /></S>,
  zoomin: (p = {}) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="M11 8v6M8 11h6m6 9-3-3" /></S>,
  zoomout: (p = {}) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="M8 11h6m6 9-3-3" /></S>,
  spreads: (p = {}) => <S {...p}><rect x="3" y="5" width="8" height="14" rx="1" /><rect x="13" y="5" width="8" height="14" rx="1" /></S>,
  hash: (p = {}) => <S {...p}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></S>,
  settings: (p = {}) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 2.6 1.7 1.7 0 0 0 10 1V.9a2 2 0 1 1 4 0V1a1.7 1.7 0 0 0 2.9 1.2 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></S>,
  info: (p = {}) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></S>,
  columns: (p = {}) => <S {...p}><rect x="3" y="4" width="16" height="16" rx="1.5" /><path d="M11 4v16" /></S>,
  jdf: (p = {}) => <S {...p}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M8 8h8M8 12h5" /></S>,
  batch: (p = {}) => <S {...p}><rect x="3" y="7" width="14" height="14" rx="1.5" /><path d="M7 7V4a1 1 0 0 1 1-1h13v13a1 1 0 0 1-1 1h-3" /></S>,
  print: (p = {}) => <S {...p}><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" rx="1" /></S>,
  download: (p = {}) => <S {...p}><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" /></S>,
  close: (p = {}) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>,
  globe: (p = {}) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></S>,
  user: (p = {}) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></S>,
  file: (p = {}) => <S {...p}><path d="M6 2h8l4 4v16H6Z" /><path d="M14 2v4h4" /></S>,
  chevron: (p = {}) => <S {...p}><path d="m6 9 6 6 6-6" /></S>,
  undo: (p = {}) => <S {...p}><path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-7L3 9" /></S>,
  back: (p = {}) => <S {...p}><path d="M15 6l-6 6 6 6" /></S>,
  help: (p = {}) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3M12 17h.01" /></S>,
  bulb: (p = {}) => <S {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11 2 2 0 0 1 1 1.7V17h4v-1.3a2 2 0 0 1 1-1.7 6 6 0 0 0-3-11Z" /></S>,
  addstep: (p = {}) => <S {...p}><path d="M12 5v14M5 12h14" /></S>,
  save: (p = {}) => <S {...p}><path d="M5 3h11l3 3v15H5Z" /><path d="M8 3v5h7V3M8 21v-6h8v6" /></S>,
};

export type OpEngine =
  | 'cards' | 'grid' | 'cutstack' | 'booklet' | 'nupbook' | 'shuffle'
  | 'rotate' | 'flip' | 'merge' | 'split';

export interface OpDef { id: string; label: string; icon: keyof typeof Icons; engine: OpEngine; tip: string; }

export interface OpGroup { label: string; ops: OpDef[]; }

// Stage-1 operation catalog. Grouped + labelled to match the reference
// "Choose Operation" sidebar; every op here is fully wired to the engine.
export const OP_GROUPS: OpGroup[] = [
  { label: '// LAYOUT', ops: [
    { id: 'cards', label: 'Cards', icon: 'cards', engine: 'cards', tip: 'Use Cards to tile identical copies of your pages onto larger sheets for efficient cutting.' },
    { id: 'booklet', label: 'Booklet', icon: 'booklet', engine: 'booklet', tip: 'Use Booklet to create saddle-stitch booklets.' },
    { id: 'shuffle', label: 'Shuffle', icon: 'shuffle', engine: 'shuffle', tip: 'Use Shuffle to reorder pages for printing.' },
    { id: 'grid', label: 'Grid', icon: 'grid', engine: 'grid', tip: 'Use Grid to arrange pages in a grid layout.' },
    { id: 'nupbook', label: 'N-up Book', icon: 'nupbook', engine: 'nupbook', tip: 'Use N-up Book for multi-up signature imposition.' },
    { id: 'cutstack', label: 'Cut and Stack', icon: 'cutstack', engine: 'cutstack', tip: 'Use Cut & Stack so sequential numbers fall into order after cutting.' },
  ] },
  { label: '// TRANSFORM', ops: [
    { id: 'rotate', label: 'Rotate', icon: 'rotate', engine: 'rotate', tip: 'Rotate pages by 90°, 180° or 270°.' },
    { id: 'flip', label: 'Flip', icon: 'flip', engine: 'flip', tip: 'Flip / mirror pages horizontally or vertically.' },
    { id: 'split', label: 'Split', icon: 'split', engine: 'split', tip: 'Split a PDF into separate files by page ranges.' },
    { id: 'merge', label: 'Merge PDFs', icon: 'merge', engine: 'merge', tip: 'Merge multiple PDFs into one document.' },
  ] },
];

export function findOp(id: string | null): OpDef | undefined {
  if (!id) return undefined;
  for (const g of OP_GROUPS) { const o = g.ops.find((x) => x.id === id); if (o) return o; }
  return undefined;
}
