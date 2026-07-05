'use client';
// Template Library — the full-screen preset browser: category tree with
// step-count badges, filter chips, and a generated Example/Diagram preview of
// each preset's imposed sheet.
import React, { useMemo, useState } from 'react';
import { Ic, paperName } from './panels';
import { findOp } from './operations';
import { LIBRARY } from './library-catalog';
import { makeStep, type WorkflowStep } from './steps';

interface Entry {
  id: string; name: string; desc: string; group: string;
  steps: WorkflowStep[]; prod: boolean; vdp: boolean; tip?: string;
}

// Every category/entry/badge is authored in library-catalog.ts to match the
// product reference exactly; the badge equals the length of the step chain.
function buildEntries(): Entry[] {
  const out: Entry[] = [];
  for (const cat of LIBRARY) {
    for (const le of cat.entries) {
      const steps = le.steps.map((ls) => {
        const st = makeStep(ls.type);
        if (ls.s) Object.assign(st.s, ls.s);
        return st;
      });
      out.push({
        id: le.id, name: le.name, desc: le.desc, group: cat.name,
        steps, prod: steps.length > 1, vdp: cat.name === 'Variable Data',
      });
    }
  }
  return out;
}

// Deterministic mock branding per preset (matches the reference's generated examples).
const BRANDS = ['AURORA', 'NOVA', 'PRISM', 'ZENITH', 'VIVID', 'EMBER', 'ONYX', 'VERTEX', 'APEX', 'PULSE', 'ECHO', 'FLUX', 'BLOOM', 'SURGE', 'METRO', 'CRAFT', 'PURE', 'SOLAR', 'LUNAR', 'NEON', 'FLORA', 'URBAN', 'ARCTIC', 'STELLAR'];
const TAGLINES = ['Creative Works', 'Design Studio', 'Print House', 'Ink & Type', 'Visual Arts', 'Brand Studio', 'Premium Brand', 'Art Direction', 'Creative Agency', 'Press Co', 'Atelier', 'Typography'];
const PALETTES: [string, string][] = [
  ['#86efac', '#7c3aed'], ['#4ade80', '#a21caf'], ['#fb923c', '#a78bfa'], ['#67e8f9', '#ec4899'],
  ['#a3e635', '#7f1d1d'], ['#f5d90a', '#38bdf8'], ['#f472b6', '#16a34a'], ['#b91c1c', '#5eead4'],
  ['#facc15', '#4338ca'], ['#34d399', '#1e3a8a'], ['#e879f9', '#365314'], ['#93c5fd', '#c2410c'],
];
function hash(s: string): number { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h; }

function layoutCells(steps: WorkflowStep[], W: number, H: number) {
  const impose = steps.find((st) => ['grid', 'cards', 'cutstack', 'booklet', 'zine', 'gangsheet', 'stickers', 'customimpose', 'nupbook', 'calendar', 'resize'].includes(st.type));
  const s = impose?.s ?? {};
  const cells: { x: number; y: number; w: number; h: number; rot?: boolean }[] = [];
  let cols = 1, rows = 1, duplex = !!s.duplex;
  if (!impose || impose.type === 'resize' || impose.type === 'calendar') {
    cells.push({ x: W * 0.12, y: H * 0.1, w: W * 0.76, h: H * 0.8 });
  } else if (impose.type === 'booklet' || impose.type === 'nupbook' || impose.type === 'zine') {
    const m = W * 0.055;
    cols = 2; rows = 1; duplex = true;
    if (impose.type === 'zine') { cols = 4; rows = 2; }
    const g = 3, cw = (W - 2 * m - g * (cols - 1)) / cols, ch = (H - 2 * m - g * (rows - 1)) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      cells.push({ x: m + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch, rot: impose.type === 'zine' && r === 0 });
  } else {
    const shW = s.sheetWIn ?? 8.5, shH = s.sheetHIn ?? 11;
    cols = s.cellWIn ? Math.max(1, Math.floor((shW - 0.5) / (s.cellWIn + (s.gutterIn ?? 0)))) : (s.cols ?? 2);
    rows = s.cellHIn ? Math.max(1, Math.floor((shH - 0.5) / (s.cellHIn + (s.gutterYIn ?? s.gutterIn ?? 0)))) : (s.rows ?? 2);
    cols = Math.min(cols, 8); rows = Math.min(rows, 10);
    const m = W * 0.06, g = 3;
    const cw = (W - 2 * m - g * (cols - 1)) / cols, ch = (H - 2 * m - g * (rows - 1)) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: m + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch });
  }
  return { cells, cols, rows, duplex, s };
}

function SheetPreview({ entry, mode }: { entry: Entry; mode: 'diagram' | 'example' }) {
  const impose = entry.steps.find((st) => st.s.sheetWIn);
  const shW = impose?.s.sheetWIn ?? 8.5, shH = impose?.s.sheetHIn ?? 11;
  const W = 340, H = Math.max(160, Math.min(480, (340 * shH) / shW));
  const { cells } = layoutCells(entry.steps, W, H);
  const h = hash(entry.id);
  const brand = BRANDS[h % BRANDS.length]!, tagline = TAGLINES[(h >>> 3) % TAGLINES.length]!;
  const [c1, c2] = PALETTES[(h >>> 5) % PALETTES.length]!;
  const variant = (h >>> 8) % 3;
  const hasBar = entry.steps.some((st) => st.type === 'colorbar');
  const hasCut = entry.steps.some((st) => st.type === 'cuttermarks');
  const hasReg = entry.steps.some((st) => st.type === 'regmarks' || (st.type === 'cuttermarks' && st.s.cornersAndEdges));
  const marks = entry.steps.some((st) => st.s.addMarks);
  const wm = entry.steps.find((st) => st.type === 'watermark');
  return (
    <svg className="pe-lib-sheet" viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <rect width={W} height={H} fill="#fff" rx="1.5" />
      {hasBar && Array.from({ length: 22 }, (_, i) => (
        <rect key={i} x={10 + i * ((W - 20) / 22)} y={3.5} width={(W - 20) / 22 - 0.8} height={4.5}
          fill={['#00b7d8', '#e52f8c', '#f5d90a', '#17181d', '#8a8f98'][(i + (h % 3)) % 5]} />
      ))}
      {cells.map((c, i) => (
        <g key={i} transform={c.rot ? `rotate(180 ${c.x + c.w / 2} ${c.y + c.h / 2})` : undefined}>
          {mode === 'example' ? (
            <>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={i % 2 === 0 ? c1 : c2} />
              {variant === 0 && <rect x={c.x} y={c.y + c.h * 0.55} width={c.w} height={c.h * 0.45} fill={i % 2 === 0 ? c2 : c1} opacity={0.9} />}
              {variant === 1 && <rect x={c.x + c.w * 0.45} y={c.y} width={c.w * 0.55} height={c.h} fill={i % 2 === 0 ? c2 : c1} opacity={0.9} />}
              {variant === 2 && <circle cx={c.x + c.w * 0.78} cy={c.y + c.h * 0.72} r={Math.min(c.w, c.h) * 0.2} fill="#ffffff" opacity={0.2} />}
              {c.w > 46 && (
                <>
                  <text x={c.x + c.w / 2} y={c.y + c.h * (variant === 0 ? 0.32 : 0.46)} textAnchor="middle"
                    fontFamily="Inter, ui-sans-serif" fontWeight={800} fontSize={Math.min(16, c.w / 6.2)} fill="#fff">{brand}</text>
                  <text x={c.x + c.w / 2} y={c.y + c.h * (variant === 0 ? 0.32 : 0.46) + Math.min(16, c.w / 6.2)} textAnchor="middle"
                    fontFamily="Inter, ui-sans-serif" fontSize={Math.min(6.5, c.w / 14)} fill="#ffffffcc">{tagline}</text>
                </>
              )}
            </>
          ) : (
            <>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="none" stroke="#7b6cf6" strokeWidth={1} strokeDasharray="4 3" />
              <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 5} textAnchor="middle" fontFamily="ui-monospace" fontSize={Math.min(15, c.h / 3)} fill="#4c4a85" fontWeight={700}>{i + 1}</text>
            </>
          )}
          {marks && (
            <path d={`M${c.x - 7} ${c.y}h4.5M${c.x} ${c.y - 7}v4.5M${c.x + c.w + 2.5} ${c.y}h4.5M${c.x + c.w} ${c.y - 7}v4.5M${c.x - 7} ${c.y + c.h}h4.5M${c.x} ${c.y + c.h + 2.5}v4.5M${c.x + c.w + 2.5} ${c.y + c.h}h4.5M${c.x + c.w} ${c.y + c.h + 2.5}v4.5`}
              stroke="#222" strokeWidth={0.7} />
          )}
        </g>
      ))}
      {wm && mode === 'example' && (
        <text x={W / 2} y={H / 2} textAnchor="middle" fontFamily="Inter, ui-sans-serif" fontWeight={800} fontSize={26}
          fill="#00000030" transform={`rotate(-${wm.s.angleDeg ?? 45} ${W / 2} ${H / 2})`}>{wm.s.text || 'PROOF'}</text>
      )}
      {hasCut && (
        <>
          <circle cx={6.5} cy={hasBar ? 13 : 6.5} r={3} fill="#111" /><circle cx={W - 6.5} cy={hasBar ? 13 : 6.5} r={3} fill="#111" />
          <circle cx={6.5} cy={H - 6.5} r={3} fill="#111" /><circle cx={W - 6.5} cy={H - 6.5} r={3} fill="#111" />
        </>
      )}
      {hasReg && ['M', 'E'].map((_, i) => (
        <g key={i} transform={`translate(${i === 0 ? 8 : W - 8} ${H / 2})`} stroke="#111" strokeWidth={0.7} fill="none">
          <circle r={3.2} /><path d="M-5 0h10M0 -5v10" />
        </g>
      ))}
    </svg>
  );
}

const PAPER_CHIPS = ['LETTER', 'LEGAL', 'TABLOID', 'A3', 'A4', 'A5', 'SRA3'];
const KIND_CHIPS = ['1 STEP', 'MULTI-STEP', 'PRODUCTION'];
const FLAG_CHIPS = ['WITH BLEEDS', 'CROP MARKS', 'DIELINES', 'DOUBLE-SIDED', 'CSV / VDP'];

function entryPaper(e: Entry): string {
  const st = e.steps.find((s) => s.s.sheetWIn);
  if (!st) return '';
  return paperName(st.s.sheetWIn, st.s.sheetHIn).toUpperCase();
}
function matchesFlags(e: Entry, active: Set<string>): boolean {
  for (const f of active) {
    if (PAPER_CHIPS.includes(f) && entryPaper(e) !== f.replace('SRA3', 'SRA3')) return false;
    if (f === '1 STEP' && e.steps.length !== 1) return false;
    if (f === 'MULTI-STEP' && e.steps.length < 2) return false;
    if (f === 'PRODUCTION' && !e.prod) return false;
    if (f === 'WITH BLEEDS' && !e.steps.some((s) => s.s.bleedMode === 'fixed' || s.type === 'bleed')) return false;
    if (f === 'CROP MARKS' && !e.steps.some((s) => s.s.addMarks)) return false;
    if (f === 'DIELINES' && !e.steps.some((s) => s.s.addDielines || (s.s.cutTypes?.length))) return false;
    if (f === 'DOUBLE-SIDED' && !e.steps.some((s) => s.s.duplex || ['booklet', 'zine', 'nupbook'].includes(s.type))) return false;
    if (f === 'CSV / VDP' && !e.vdp) return false;
  }
  return true;
}

function stats(e: Entry, pageCount: number) {
  const { cells, cols, rows, duplex, s } = layoutCells(e.steps, 100, 100 as number);
  const impose = e.steps.find((st) => ['grid', 'cards', 'cutstack', 'booklet', 'zine', 'gangsheet', 'stickers', 'nupbook'].includes(st.type));
  let perSheet = Math.max(1, cols * rows) * (duplex ? 2 : 1);
  if (impose?.type === 'booklet' || impose?.type === 'nupbook') perSheet = 4;
  if (impose?.type === 'zine') perSheet = 8;
  if (impose?.s.order === 'repeat') perSheet = Math.max(1, pageCount);   // step & repeat: 1 sheet per design run
  const sheets = Math.max(1, Math.ceil(pageCount / perSheet));
  const sheetArea = (s.sheetWIn ?? 8.5) * (s.sheetHIn ?? 11);
  const usedPct = Math.min(99, Math.round((cells.reduce((a, c) => a + c.w * c.h, 0) / (100 * (100 as number))) * 100));
  void sheetArea;
  return { sheets, dupLabel: `${cols}×${rows}${duplex ? ' duplex' : ''}`, usedPct };
}

export function TemplateLibrary({ onClose, onApply, pageCount = 30 }: {
  onClose: () => void;
  onApply: (steps: WorkflowStep[]) => void;
  pageCount?: number;
}) {
  const entries = useMemo(buildEntries, []);
  const groups = useMemo(() => LIBRARY.map((c) => c.name).filter((g) => entries.some((e) => e.group === g)), [entries]);
  const [q, setQ] = useState('');
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'diagram' | 'example'>('example');
  const [open, setOpen] = useState<Set<string>>(new Set([groups[0]!]));
  const [selId, setSelId] = useState<string>('');

  const ql = q.toLowerCase();
  const visible = entries.filter((e) =>
    (!ql || e.name.toLowerCase().includes(ql) || e.desc.toLowerCase().includes(ql)) && matchesFlags(e, flags));
  const sel = visible.find((e) => e.id === selId) ?? visible[0];
  const toggleFlag = (f: string) => setFlags((s) => { const n = new Set(s); if (n.has(f)) n.delete(f); else n.add(f); return n; });
  const st = sel ? stats(sel, pageCount) : null;
  const paper = sel ? (() => {
    const imp = sel.steps.find((s2) => s2.s.sheetWIn);
    if (!imp) return '';
    const n = paperName(imp.s.sheetWIn, imp.s.sheetHIn);
    return n === 'Custom' ? `${imp.s.sheetWIn}×${imp.s.sheetHIn}″` : n;
  })() : '';

  return (
    <div className="pe-lib-backdrop">
      <div className="pe-lib">
        <div className="pe-lib-head">
          <Ic name="layers" size={17} />
          <b>Template Library</b>
          <span className="pe-label-sm pe-mono">{entries.length} PRESETS</span>
          <div className="pe-lib-search"><Ic name="search" size={14} /><input placeholder="Search templates..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="pe-segrow">
            <button className={mode === 'diagram' ? 'pe-on' : ''} onClick={() => setMode('diagram')}><Ic name="rules" size={12} /> DIAGRAM</button>
            <button className={mode === 'example' ? 'pe-on' : ''} onClick={() => setMode('example')}><Ic name="eye" size={12} /> EXAMPLE</button>
          </div>
          <button className="pe-iconbtn" style={{ marginLeft: 8 }} onClick={onClose}><Ic name="close" size={17} /></button>
        </div>
        <div className="pe-lib-filters">
          <Ic name="settings" size={13} />
          {PAPER_CHIPS.map((f) => <button key={f} className={`pe-lib-chip ${flags.has(f) ? 'pe-on' : ''}`} onClick={() => toggleFlag(f)}>{f}</button>)}
          <span className="pe-tb-div" />
          {KIND_CHIPS.map((f) => <button key={f} className={`pe-lib-chip ${flags.has(f) ? 'pe-on' : ''}`} onClick={() => toggleFlag(f)}>{f}</button>)}
          <span className="pe-tb-div" />
          {FLAG_CHIPS.map((f) => <button key={f} className={`pe-lib-chip ${flags.has(f) ? 'pe-on' : ''}`} onClick={() => toggleFlag(f)}>{f}</button>)}
        </div>
        <div className="pe-lib-body">
          <aside className="pe-lib-tree">
            {groups.map((g) => {
              const items = visible.filter((e) => e.group === g);
              if (!items.length) return null;
              const isOpen = open.has(g) || !!ql;
              return (
                <div key={g}>
                  <button className="pe-lib-group" onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(g)) n.delete(g); else n.add(g); return n; })}>
                    <span style={{ display: 'inline-flex', transform: isOpen ? 'none' : 'rotate(-90deg)' }}><Ic name="chevron" size={12} /></span>
                    <Ic name="file" size={13} />
                    <span className="pe-lib-group-name">{g.toUpperCase()}</span>
                    <span className="pe-label-sm pe-mono">{items.length}</span>
                  </button>
                  {isOpen && items.map((e) => (
                    <button key={e.id} className={`pe-tpl-item ${sel?.id === e.id ? 'pe-on' : ''}`} onClick={() => setSelId(e.id)}>
                      <Ic name={findOp(e.steps[0]!.type)?.icon ?? 'gridview'} size={14} />
                      <span className="pe-tpl-item-name">{e.name}</span>
                      <span className={`pe-tpl-badge pe-tpl-badge-${Math.min(e.steps.length, 4)}`}>{e.steps.length}-STEP</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </aside>
          <main className="pe-lib-preview">
            {sel && (
              <>
                <div className="pe-lib-preview-chips">
                  <span className="pe-lib-chip">{paper}</span>
                  {sel.steps.some((s2) => s2.type === 'cuttermarks' || s2.type === 'regmarks') && <span className="pe-lib-chip"><Ic name="scissors" size={11} /></span>}
                  <span className="pe-lib-chip pe-on">{st!.sheets} sheets</span>
                </div>
                <SheetPreview entry={sel} mode={mode} />
              </>
            )}
          </main>
        </div>
        {sel && (
          <div className="pe-lib-foot">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pe-label" style={{ fontWeight: 800 }}>
                {sel.name}
                <span className={`pe-cat-industry`} style={{ marginLeft: 8 }}>{sel.prod ? 'PROD' : sel.steps.length > 1 ? 'MULTI' : 'SINGLE'}</span>
              </div>
              <div className="pe-label-sm" style={{ marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sel.desc}</div>
              <div className="pe-label-sm pe-mono" style={{ marginTop: 4 }}>
                <b>{pageCount}</b> pages → <b>{st!.sheets}</b> sheets · {st!.dupLabel} · {st!.usedPct}% paper
              </div>
            </div>
            <div className="pe-cat-chain" style={{ flex: '0 0 auto', maxWidth: 300 }}>
              {sel.steps.map((s2, i) => (
                <React.Fragment key={s2.id}>
                  {i > 0 && <span className="pe-cat-arrow">→</span>}
                  <span className="pe-cat-step"><Ic name={findOp(s2.type)!.icon} size={11} /></span>
                </React.Fragment>
              ))}
            </div>
            <button className="pe-btn pe-btn-dl" onClick={() => { onApply(sel.steps.map((s2) => ({ ...s2 }))); onClose(); }}>APPLY ›</button>
          </div>
        )}
      </div>
    </div>
  );
}
