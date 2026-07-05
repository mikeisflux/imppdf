'use client';
import React, { useEffect, useState } from 'react';
import { zineSheetLayout, zinePanels, type ZineFormat } from '@/lib/imposition-toolkit/impose';
import { Icons, OP_GROUPS, findOp, type IconName } from './operations';
import { defaultSettings, type StepSettings, type StepType, type WorkflowStep } from './steps';
import { ImageFitModal } from './image-fit-modal';

// ── Units ────────────────────────────────────────────────────────────────────
export type Unit = 'in' | 'mm' | 'pt';
export const toIn = (v: number, u: Unit) => (u === 'mm' ? v / 25.4 : u === 'pt' ? v / 72 : v);
export const fromIn = (v: number, u: Unit) => (u === 'mm' ? v * 25.4 : u === 'pt' ? v * 72 : v);
export const fmtIn = (inch: number, u: Unit) => {
  const v = fromIn(inch, u);
  return u === 'pt' ? String(Math.round(v)) : (Math.round(v * 100) / 100).toString();
};

export const PAPERS: Record<string, [number, number]> = {
  A5: [5.83, 8.27], A4: [8.27, 11.69], A3: [11.69, 16.54], SRA3: [12.6, 17.72],
  Letter: [8.5, 11], Legal: [8.5, 14], Tabloid: [11, 17], Arch_B: [12, 18],
};
export function paperName(wIn: number, hIn: number): string {
  for (const [k, [w, h]] of Object.entries(PAPERS)) {
    if ((Math.abs(w - wIn) < 0.05 && Math.abs(h - hIn) < 0.05) || (Math.abs(h - wIn) < 0.05 && Math.abs(w - hIn) < 0.05)) return k.replace('_', ' ');
  }
  return 'Custom';
}

// User-defined paper presets (persisted). Keyed by display name → [w, h] inches.
const PAPER_PRESETS_KEY = 'pp_paper_presets';
function loadPaperPresets(): Record<string, [number, number]> {
  try { return JSON.parse(localStorage.getItem(PAPER_PRESETS_KEY) || '{}'); } catch { return {}; }
}
function savePaperPreset(name: string, wh: [number, number]) {
  const all = loadPaperPresets(); all[name] = wh;
  try { localStorage.setItem(PAPER_PRESETS_KEY, JSON.stringify(all)); } catch { /* storage full */ }
}
const closeIn = (a: number, b: number) => Math.abs(a - b) < 0.05;

// ── Atoms ────────────────────────────────────────────────────────────────────
export function Ic({ name, size = 20 }: { name: IconName; size?: number }) {
  const C = Icons[name] as (p: Record<string, unknown>) => React.ReactElement;
  return C({ width: size, height: size });
}
export function Section({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="pe-section">
      <div className="pe-section-head">
        <span className="pe-section-label">{label}</span>
        <span className="pe-help" title={help}>?</span>
      </div>
      {children}
    </div>
  );
}
const Tick = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L19 6" /></svg>;
export function Check({ label, sub, checked, onChange, icon }: { label: React.ReactNode; sub?: string; checked: boolean; onChange: (v: boolean) => void; icon?: IconName }) {
  return (
    <>
      <label className="pe-check">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="pe-box">{checked && <Tick />}</span>
        {icon && <span className="pe-check-ic"><Ic name={icon} size={16} /></span>}
        {label}
      </label>
      {sub && <div className="pe-check-sub">{sub}</div>}
    </>
  );
}
export function Radio({ label, sub, on, onSelect, thumb }: { label: React.ReactNode; sub?: string; on: boolean; onSelect: () => void; thumb?: React.ReactNode }) {
  return (
    <label className={`pe-radio ${on ? 'pe-on' : ''}`} onClick={onSelect}>
      <input type="radio" checked={on} readOnly />
      <span className="pe-dot"><i /></span>
      {thumb && <span className="pe-radio-thumb">{thumb}</span>}
      <span><div className="pe-radio-main">{label}</div>{sub && <div className="pe-radio-sub">{sub}</div>}</span>
    </label>
  );
}
// A small monochrome label icon that sits before a field-group heading (Margins, Gutters…).
export function RowIcon({ name }: { name: IconName }) { return <span className="pe-row-ic"><Ic name={name} size={15} /></span>; }
export function UnitSel({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  return (
    <select className="pe-select pe-unit" value={unit} onChange={(e) => onChange(e.target.value as Unit)}>
      <option value="mm">mm</option><option value="in">in</option><option value="pt">pt</option>
    </select>
  );
}
export function NumIn({ valueIn, unit, onIn, w }: { valueIn: number; unit: Unit; onIn: (v: number) => void; w?: number }) {
  const [txt, setTxt] = useState(fmtIn(valueIn, unit));
  useEffect(() => { setTxt(fmtIn(valueIn, unit)); }, [valueIn, unit]);
  return (
    <input className="pe-input pe-num" style={w ? { width: w, flex: `0 0 ${w}px` } : undefined} inputMode="decimal" value={txt}
      onChange={(e) => { setTxt(e.target.value); const v = parseFloat(e.target.value); if (!Number.isNaN(v)) onIn(toIn(v, unit)); }} />
  );
}
export function NumRaw({ value, onValue, w, min }: { value: number; onValue: (v: number) => void; w?: number; min?: number }) {
  return <input className="pe-input pe-num" style={w ? { width: w, flex: `0 0 ${w}px` } : undefined} type="number" min={min} value={Number.isFinite(value) ? value : ''}
    onChange={(e) => { const v = +e.target.value; if (!Number.isNaN(v)) onValue(min !== undefined ? Math.max(min, v) : v); }} />;
}
export function SelCard({ on, off, cap, children, onClick }: { on?: boolean; off?: boolean; cap: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div className={`pe-selcard ${on ? 'pe-on' : ''} ${off ? 'pe-off' : ''}`} onClick={onClick}>
      {children}
      <span className="pe-selcard-cap">{cap}</span>
    </div>
  );
}
export function Flow({ arrows }: { arrows: 'ltr' | 'rtl' }) {
  return (
    <div className="pe-flow">
      <b>{arrows === 'ltr' ? '2' : '3'}</b>
      <span className="pe-flow-arrow">{arrows === 'ltr' ? '→' : '←'}</span>
      <b>{arrows === 'ltr' ? '3' : '2'}</b>
    </div>
  );
}
function PagesInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="pe-row" style={{ marginBottom: 0 }}>
      <input className="pe-input" value={value} placeholder="all" onChange={(e) => onChange(e.target.value)} />
      <span className="pe-pages-ic"><Ic name="gridview" size={15} /></span>
    </div>
  );
}

// ── Paper size (shared by imposition panels) ─────────────────────────────────
function PaperSize({ s, up, unit, onUnit }: PanelProps) {
  const wIn = s.sheetWIn as number, hIn = s.sheetHIn as number;
  const [lock, setLock] = useState(false);
  const [presets, setPresets] = useState<Record<string, [number, number]>>({});
  useEffect(() => { setPresets(loadPaperPresets()); }, []);
  const land = wIn > hIn;
  const allPapers = { ...PAPERS, ...presets };
  const name = (() => {
    for (const [k, [w, h]] of Object.entries(allPapers)) {
      if ((closeIn(w, wIn) && closeIn(h, hIn)) || (closeIn(h, wIn) && closeIn(w, hIn))) return k.replace('_', ' ');
    }
    return 'Custom';
  })();
  return (
    <Section label="// PAPER SIZE" help="Output sheet dimensions — the physical paper going through your press.">
      <div className="pe-row">
        <select className="pe-select" value={name} onChange={(e) => {
          const entry = Object.entries(allPapers).find(([k]) => k.replace('_', ' ') === e.target.value);
          if (entry) { const p = entry[1]; up(land ? { sheetWIn: Math.max(...p), sheetHIn: Math.min(...p) } : { sheetWIn: Math.min(...p), sheetHIn: Math.max(...p) }); }
        }}>
          {Object.keys(allPapers).map((k) => <option key={k}>{k.replace('_', ' ')}</option>)}
          <option>Custom</option>
        </select>
        <button className="pe-preset-add" title="Save current size as a preset" onClick={() => {
          const nm = window.prompt('Preset name', `${fmtIn(wIn, unit)}×${fmtIn(hIn, unit)} ${unit}`);
          const clean = nm?.trim();
          if (!clean) return;
          savePaperPreset(clean, [wIn, hIn]);
          setPresets(loadPaperPresets());
        }}><Ic name="addstep" size={16} /></button>
      </div>
      <div className="pe-row"><span className="pe-label" style={{ width: 52 }}>Width</span><NumIn valueIn={wIn} unit={unit} onIn={(v) => up(lock ? { sheetWIn: v, sheetHIn: v * (hIn / wIn) } : { sheetWIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      <div className="pe-row"><span className="pe-label" style={{ width: 52 }}>Height</span><NumIn valueIn={hIn} unit={unit} onIn={(v) => up(lock ? { sheetHIn: v, sheetWIn: v * (wIn / hIn) } : { sheetHIn: v })} /><button className="pe-lock" onClick={() => setLock((l) => !l)} title="Lock aspect ratio">{lock ? '🔒' : '🔓'}</button></div>
      <Check icon="columns" label="Landscape" checked={land} onChange={(v) => { const lo = Math.min(wIn, hIn), hi = Math.max(wIn, hIn); up(v ? { sheetWIn: hi, sheetHIn: lo } : { sheetWIn: lo, sheetHIn: hi }); }} />
    </Section>
  );
}

function MarksSection({ s, up, unit, onUnit }: PanelProps) {
  return (
    <Section label="// PRINTER'S MARKS" help="Trim guides and alignment marks outside the live area.">
      <Check icon="crop" label="Draw crop marks" checked={!!s.addMarks} onChange={(v) => up({ addMarks: v })} />
      <Check icon="registration" label="Draw center marks" checked={!!s.centerMarks} onChange={(v) => up({ centerMarks: v })} />
      <div className="pe-row"><span className="pe-label pe-w96">Line length</span><NumIn valueIn={s.markLenIn} unit={unit} onIn={(v) => up({ markLenIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      <div className="pe-row"><span className="pe-label pe-w96">Line thickness</span><NumIn valueIn={(s.markWeightPt ?? 0.25) / 72} unit={unit} onIn={(v) => up({ markWeightPt: v * 72 })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      <div className="pe-row"><span className="pe-label pe-w96">Line distance</span><NumIn valueIn={s.markOffIn} unit={unit} onIn={(v) => up({ markOffIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      <Check label={<span className="pe-check-swatch"><i style={{ background: '#111' }} />Four-color black</span>} checked={!!s.fourColorBlack} onChange={(v) => up({ fourColorBlack: v })} />
      <Check label={<span className="pe-check-swatch"><i className="pe-swatch-ko" />Knockout</span>} checked={!!s.knockout} onChange={(v) => up({ knockout: v })} />
    </Section>
  );
}

// Small glyphs shown beside each Bleeds option (match the reference thumbnails).
const BleedThumbNone = () => <span className="pe-bleedthumb"><i className="pe-bt-solid" /></span>;
const BleedThumbDoc = () => <span className="pe-bleedthumb"><i className="pe-bt-dashed" /></span>;
const BleedThumbFixed = () => <span className="pe-bleedthumb"><i className="pe-bt-marks" /></span>;

function BleedsSection({ s, up, unit, onUnit }: PanelProps) {
  return (
    <Section label="// BLEEDS" help="Where the artwork bleed comes from when placing pages.">
      <Radio thumb={<BleedThumbNone />} label="No bleeds" sub="Cards placed with no bleed extension" on={s.bleedMode === 'none'} onSelect={() => up({ bleedMode: 'none' })} />
      <Radio thumb={<BleedThumbDoc />} label="From document" sub="Use bleed info from source PDF" on={s.bleedMode === 'doc'} onSelect={() => up({ bleedMode: 'doc' })} />
      <Radio thumb={<BleedThumbFixed />} label="Fixed bleeds" sub="Specify custom bleed amounts" on={s.bleedMode === 'fixed'} onSelect={() => up({ bleedMode: 'fixed' })} />
      {s.bleedMode === 'fixed' && (
        <div className="pe-row" style={{ marginTop: 8 }}><span className="pe-label pe-w96">Bleed</span><NumIn valueIn={s.bleedIn ?? 0.125} unit={unit} onIn={(v) => up({ bleedIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      )}
    </Section>
  );
}

// ── Per-step panels ──────────────────────────────────────────────────────────
export interface LayerEntry { name: string; stepLabel: string; stepId: string; enabled: boolean; }
export interface PanelProps {
  s: StepSettings;
  up: (patch: StepSettings) => void;
  unit: Unit;
  onUnit: (u: Unit) => void;
  pageCount?: number;
  thumbs?: string[];
  pageSizes?: { wPt: number; hPt: number }[];
  layerEntries?: LayerEntry[];
  onToggleLayer?: (stepId: string) => void;
  sourceBytes?: Uint8Array | null;
}

function BookletPanel(p: PanelProps) {
  const { s, up, unit, onUnit } = p;
  return (
    <>
      <PaperSize {...p} />
      <Section label="// BOOK BINDING" help="Saddle-stitch signature size and reading direction.">
        <div className="pe-row"><span className="pe-label">Saddle size</span><NumRaw value={s.signatureSheets || ('' as unknown as number)} onValue={(v) => up({ signatureSheets: Math.max(0, Math.round(v)) })} w={74} min={0} /><span className="pe-label-sm">sheets</span></div>
        <div className="pe-label-sm" style={{ marginBottom: 6 }}>{s.signatureSheets ? `Signatures of ${s.signatureSheets} sheets (${s.signatureSheets * 4} pages)` : 'Saddle stitch (single stack)'}</div>
        <div className="pe-label-sm" style={{ marginBottom: 10, lineHeight: 1.5 }}>
          This is your signature size — sheets per signature. Set 4 for 16-page signatures (each sheet = 4 pages, folded in half). Leave blank for one saddle-stitched booklet.
        </div>
        <Check icon="booklet" label="Fill last saddle" checked={s.fillLastSaddle !== false} onChange={(v) => up({ fillLastSaddle: v })} />
        <div className="pe-cards2" style={{ marginTop: 8 }}>
          <SelCard on={!s.rtl} cap="LEFT TO RIGHT" onClick={() => up({ rtl: false })}><Flow arrows="ltr" /></SelCard>
          <SelCard on={!!s.rtl} off={!s.rtl} cap="RIGHT TO LEFT" onClick={() => up({ rtl: true })}><Flow arrows="rtl" /></SelCard>
        </div>
      </Section>
      <Section label="// SCALE" help="How source pages fill each half of the spread.">
        <Check icon="fit" label="Autoscale" checked={s.autoscale !== false} onChange={(v) => up({ autoscale: v })} />
        <Check icon="resize" label="Preserve aspect ratio" checked={s.preserveAspect !== false} onChange={(v) => up({ preserveAspect: v })} />
      </Section>
      <Section label="// WHITE SPACE" help="Margins, spine gutter and creep compensation.">
        <div className="pe-row"><RowIcon name="dimensionsIc" /><span className="pe-label">Margins:</span><span style={{ flex: 1 }} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <div className="pe-grid2">
          <div className="pe-field-col"><span className="pe-label-sm">Left</span><NumIn valueIn={s.marginIn} unit={unit} onIn={(v) => up({ marginIn: v })} /></div>
          <div className="pe-field-col"><span className="pe-label-sm">Top</span><NumIn valueIn={s.marginTopIn ?? s.marginIn} unit={unit} onIn={(v) => up({ marginTopIn: v })} /></div>
        </div>
        <div className="pe-row" style={{ marginTop: 12 }}><RowIcon name="columns" /><span className="pe-label">Center Gutter</span></div>
        <div className="pe-row"><NumIn valueIn={s.gutterIn} unit={unit} onIn={(v) => up({ gutterIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <div className="pe-row" style={{ marginTop: 8 }}><RowIcon name="nudge" /><span className="pe-label">Page Creep</span></div>
        <div className="pe-row"><NumIn valueIn={s.creepIn} unit={unit} onIn={(v) => up({ creepIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <Radio thumb={<Ic name="tofront" size={16} />} label="Creep Outward" on={s.creepOutward !== false} onSelect={() => up({ creepOutward: true })} />
        <Radio thumb={<Ic name="toback" size={16} />} label="Creep Inward" on={s.creepOutward === false} onSelect={() => up({ creepOutward: false })} />
        <div style={{ marginTop: 8 }}>
          <Check icon="fit" label="Center output on page" checked={!!s.centerOutput} onChange={(v) => up({ centerOutput: v })} />
        </div>
      </Section>
      <MarksSection {...p} />
      <BleedsSection {...p} />
      <Section label="// OUTPUT" help="Post-processing applied to the finished spreads.">
        <Check icon="rotate" label="Rotate pages" sub="Portrait orientation for office printers" checked={!!s.rotatePages} onChange={(v) => up({ rotatePages: v })} />
      </Section>
    </>
  );
}

function NUpPanel(p: PanelProps & { kind: 'cards' | 'grid' | 'cutstack' | 'perfectbound' }) {
  const { s, up, unit, onUnit, kind } = p;
  const [fitOpen, setFitOpen] = useState(false);
  const thumb = (p.thumbs ?? [])[0] || '';
  const cw = s.cellWIn || (s.sheetWIn ?? 8.5) / (s.cols || 2);
  const ch = s.cellHIn || (s.sheetHIn ?? 11) / (s.rows || 2);
  return (
    <>
      <PaperSize {...p} />
      <Section label="// IMAGE FIT" help="How each page/image fills its cell. Cover preserves proportions and crops the overflow.">
        <div className="pe-row" style={{ gap: 8 }}>
          <select className="pe-select" value={s.fit ?? 'cover'} onChange={(e) => up({ fit: e.target.value })} style={{ flex: 1 }}>
            <option value="cover">Cover — fill &amp; crop</option>
            <option value="contain">Contain — fit inside</option>
            <option value="stretch">Stretch — distort to fill</option>
          </select>
          <button className="pe-btn" disabled={!thumb} title={thumb ? '' : 'Add a PDF/image first'} onClick={() => setFitOpen(true)}>Adjust &amp; crop…</button>
        </div>
        {(s.imageZoom || s.imageOffsetX != null) && s.fit !== 'stretch' && (
          <div className="pe-note" style={{ marginTop: 6 }}>Custom crop: {(s.imageZoom ?? 1).toFixed(2)}× · {(Math.round((s.imageOffsetX ?? 0.5) * 100))}%,{Math.round((s.imageOffsetY ?? 0.5) * 100)}%</div>
        )}
      </Section>
      {fitOpen && thumb && (
        <ImageFitModal thumb={thumb} cellWIn={+cw.toFixed(2)} cellHIn={+ch.toFixed(2)}
          value={{ fit: s.fit ?? 'cover', zoom: s.imageZoom ?? 1, offsetX: s.imageOffsetX ?? 0.5, offsetY: s.imageOffsetY ?? 0.5 }}
          onApply={(v) => { up({ fit: v.fit, imageZoom: v.zoom, imageOffsetX: v.offsetX, imageOffsetY: v.offsetY }); setFitOpen(false); }}
          onClose={() => setFitOpen(false)} />
      )}
      {kind === 'grid' && (
        <Section label="// PAGE ORDER" help="Reading direction and fill pattern.">
          <div className="pe-row">
            <select className="pe-select" value={s.order} onChange={(e) => up({ order: e.target.value })}>
              <option value="sequential">Sequential</option><option value="repeat">Step and Repeat</option><option value="cutstack">Cut and Stack</option>
            </select>
            <Check icon="spreads" label="Double Sided" checked={!!s.duplex} onChange={(v) => up({ duplex: v })} />
          </div>
        </Section>
      )}
      <Section label="// LAYOUT" help="Rows, columns and scaling.">
        <Check icon="fit" label="Autoscale" checked={s.autoscale !== false} onChange={(v) => up({ autoscale: v })} />
        <Check icon="resize" label="Preserve aspect ratio" checked={s.preserveAspect !== false} onChange={(v) => up({ preserveAspect: v })} />
        <div className="pe-grid2" style={{ marginTop: 6 }}>
          <div className="pe-row" style={{ margin: 0 }}><span className="pe-label" style={{ width: 56 }}>Columns</span><NumRaw value={s.cols} onValue={(v) => up({ cols: Math.max(1, Math.round(v)) })} min={1} /></div>
          <div className="pe-row" style={{ margin: 0 }}><span className="pe-label" style={{ width: 40 }}>Rows</span><NumRaw value={s.rows} onValue={(v) => up({ rows: Math.max(1, Math.round(v)) })} min={1} /></div>
        </div>
        {kind === 'cards' && (
          <>
            <div className="pe-label-sm" style={{ margin: '10px 0 5px' }}>Card size (optional — auto-fits the grid and centers the block)</div>
            <div className="pe-grid2">
              <div className="pe-field-col"><span className="pe-label-sm">Width</span><NumIn valueIn={s.cellWIn ?? 0} unit={unit} onIn={(v) => up({ cellWIn: v })} /></div>
              <div className="pe-field-col"><span className="pe-label-sm">Height</span><NumIn valueIn={s.cellHIn ?? 0} unit={unit} onIn={(v) => up({ cellHIn: v })} /></div>
            </div>
          </>
        )}
        <div className="pe-cards2" style={{ marginTop: 12 }}>
          <SelCard on={!s.snake} cap="Z-PATTERN" onClick={() => up({ snake: false })}><MiniGrid pattern="z" /></SelCard>
          <SelCard on={!!s.snake} off={!s.snake} cap="S-PATTERN" onClick={() => up({ snake: true })}><MiniGrid pattern="s" /></SelCard>
        </div>
      </Section>
      <Section label="// WHITE SPACE" help="Margins around the sheet and gutters between cells.">
        <div className="pe-row"><RowIcon name="dimensionsIc" /><span className="pe-label">Margins:</span><span style={{ flex: 1 }} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <div className="pe-row"><NumIn valueIn={s.marginIn} unit={unit} onIn={(v) => up({ marginIn: v })} /></div>
        <div className="pe-row" style={{ marginTop: 8 }}><RowIcon name="grid" /><span className="pe-label">Gutters:</span></div>
        <div className="pe-grid2">
          <div className="pe-field-col"><span className="pe-label-sm">Horizontal</span><NumIn valueIn={s.gutterIn} unit={unit} onIn={(v) => up({ gutterIn: v })} /></div>
          <div className="pe-field-col"><span className="pe-label-sm">Vertical</span><NumIn valueIn={s.gutterYIn ?? s.gutterIn} unit={unit} onIn={(v) => up({ gutterYIn: v })} /></div>
        </div>
      </Section>
      <MarksSection {...p} />
      <BleedsSection {...p} />
    </>
  );
}
function MiniGrid({ pattern }: { pattern: 'z' | 's' }) {
  const rows = pattern === 'z' ? [[1, 2, 3], [4, 5, 6]] : [[1, 2, 3], [6, 5, 4]];
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      {rows.map((r, i) => (
        <div key={i} className="pe-flow" style={{ gap: 3 }}>
          {r.map((n, j) => <React.Fragment key={j}><b style={{ width: 20, height: 18, fontSize: 11 }}>{n}</b>{j < 2 && <span className="pe-flow-arrow" style={{ fontSize: 11 }}>{pattern === 'z' || i === 0 ? '→' : '←'}</span>}</React.Fragment>)}
        </div>
      ))}
    </div>
  );
}

function NUpBookPanel(p: PanelProps) {
  const { s, up, unit, onUnit } = p;
  return (
    <>
      <Section label="// BOOK BINDING" help="Signature binding method.">
        <Radio label="Perfect Bound" on={(s.signatureSheets ?? 0) > 0} onSelect={() => up({ signatureSheets: 4 })} />
        <Radio label="Saddle Stitch" on={(s.signatureSheets ?? 0) === 0} onSelect={() => up({ signatureSheets: 0 })} />
        <div className="pe-row" style={{ marginTop: 8 }}><span className="pe-label">N up</span>
          <select className="pe-select" style={{ width: 110, flex: '0 0 110px' }} value={s.nUp} onChange={(e) => up({ nUp: +e.target.value })}>
            <option value={2}>2 (folio)</option><option value={4}>4 (quarto)</option>
          </select>
        </div>
        <div className="pe-cards2" style={{ marginTop: 10 }}>
          <SelCard on={!s.rtl} cap="LEFT TO RIGHT" onClick={() => up({ rtl: false })}><Flow arrows="ltr" /></SelCard>
          <SelCard on={!!s.rtl} off={!s.rtl} cap="RIGHT TO LEFT" onClick={() => up({ rtl: true })}><Flow arrows="rtl" /></SelCard>
        </div>
      </Section>
      <PaperSize {...p} />
      <Section label="// GUTTERS" help="Spacing between adjacent pages plus creep.">
        <div className="pe-row"><span className="pe-label pe-w96">Binding Gutter</span><NumIn valueIn={s.gutterIn} unit={unit} onIn={(v) => up({ gutterIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <div className="pe-row"><span className="pe-label pe-w96">Page Creep</span><NumIn valueIn={Math.abs(s.creepIn)} unit={unit} onIn={(v) => up({ creepIn: s.creepIn < 0 ? -v : v })} /></div>
        <Radio label="Creep Outward" on={s.creepIn >= 0} onSelect={() => up({ creepIn: Math.abs(s.creepIn) })} />
        <Radio label="Creep Inward" on={s.creepIn < 0} onSelect={() => up({ creepIn: -Math.abs(s.creepIn || 0.007) })} />
      </Section>
      <MarksSection {...p} />
    </>
  );
}

// Color bar — Step 2 of the reference workflow.
function ColorBarPanel(p: PanelProps) {
  const { s, up, unit, onUnit } = p;
  const locCap = { top: 'Left & right · Top', bottom: 'Left & right · Bottom', left: 'Top & bottom · Left', right: 'Top & bottom · Right' }[s.location as string];
  const shape = (k: string, v: boolean) => up({ shapes: { ...s.shapes, [k]: v } });
  return (
    <>
      <Section label="// LOCATION" help="Which edge of the sheet carries the control strip.">
        <div className="pe-locpick">
          <button className={`pe-locdot ${s.location === 'top' ? 'pe-on' : ''}`} style={{ gridArea: 'top' }} onClick={() => up({ location: 'top' })} />
          <button className={`pe-locdot ${s.location === 'left' ? 'pe-on' : ''}`} style={{ gridArea: 'left' }} onClick={() => up({ location: 'left' })} />
          <div className="pe-locsheet" style={{ gridArea: 'mid' }} />
          <button className={`pe-locdot ${s.location === 'right' ? 'pe-on' : ''}`} style={{ gridArea: 'right' }} onClick={() => up({ location: 'right' })} />
          <button className={`pe-locdot ${s.location === 'bottom' ? 'pe-on' : ''}`} style={{ gridArea: 'bot' }} onClick={() => up({ location: 'bottom' })} />
          <div className="pe-loccap">{locCap}</div>
        </div>
        <div className="pe-row" style={{ marginTop: 12 }}><span className="pe-label">Margins:</span></div>
        <div className="pe-row">
          <NumIn valueIn={s.marginAlongIn} unit={unit} onIn={(v) => up({ marginAlongIn: v })} />
          <NumIn valueIn={s.marginAcrossIn} unit={unit} onIn={(v) => up({ marginAcrossIn: v })} />
          <UnitSel unit={unit} onChange={onUnit} />
        </div>
        <div className="pe-row" style={{ marginTop: 8 }}><span className="pe-label">Pages</span></div>
        <PagesInput value={s.pages} onChange={(v) => up({ pages: v })} />
      </Section>
      <Section label="// MARKS" help="Patch size (bar thickness).">
        <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label" style={{ width: 36 }}>Size</span><NumIn valueIn={s.sizeIn} unit={unit} onIn={(v) => up({ sizeIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      </Section>
      <Section label="// COLORS" help="Process patches, tints and spot approximations.">
        <div className="pe-row">
          <label className="pe-check" style={{ margin: 0 }}>
            <input type="checkbox" checked={!!s.colors} onChange={(e) => up({ colors: e.target.checked })} />
            <span className="pe-box">{s.colors && <Tick />}</span>
          </label>
          <span className="pe-cmyk-strip"><i style={{ background: '#00b7d8' }} /><i style={{ background: '#e52f8c' }} /><i style={{ background: '#f5d90a' }} /><i style={{ background: '#17181d' }} /></span>
        </div>
        <Check icon="colorbar" label="Spot colors" checked={!!s.spotColors} onChange={(v) => up({ spotColors: v })} />
      </Section>
      <Section label="// SHAPES" help="Which patch styles are included in the strip.">
        <div className="pe-shapes-grid">
          <ShapeCheck on={s.shapes?.solid !== false} onChange={(v) => shape('solid', v)}><span className="pe-shp" style={{ background: '#00b7d8' }} /></ShapeCheck>
          <ShapeCheck on={!!s.shapes?.diagonal} onChange={(v) => shape('diagonal', v)}><span className="pe-shp pe-shp-diag" /></ShapeCheck>
          <ShapeCheck on={!!s.shapes?.tint} onChange={(v) => shape('tint', v)}><span className="pe-shp" style={{ background: '#9adcEA' }} /></ShapeCheck>
          <ShapeCheck on={!!s.shapes?.rings} onChange={(v) => shape('rings', v)}><span className="pe-shp pe-shp-rings" /></ShapeCheck>
          <ShapeCheck on={!!s.shapes?.starburst} onChange={(v) => shape('starburst', v)}><span className="pe-shp pe-shp-star" /></ShapeCheck>
          <ShapeCheck on={s.shapes?.target !== false} onChange={(v) => shape('target', v)}><span className="pe-shp pe-shp-target">⊕</span></ShapeCheck>
        </div>
        <div style={{ marginTop: 12 }}>
          <Check icon="duplicate" label="Repeat" checked={!!s.repeat} onChange={(v) => up({ repeat: v })} />
        </div>
        <div className="pe-row" style={{ marginTop: 6 }}><span className="pe-label">Layer</span></div>
        <input className="pe-input" placeholder="(optional)" value={s.layer ?? ''} onChange={(e) => up({ layer: e.target.value })} />
      </Section>
    </>
  );
}
function ShapeCheck({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="pe-shapecheck">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span className="pe-box">{on && <Tick />}</span>
      {children}
    </label>
  );
}

// Cutter marks — Step 3 of the reference workflow.
const CUT_TYPES: { id: string; label: string; color: string; dashed?: boolean }[] = [
  { id: 'thru', label: 'Thru-Cut', color: '#22c55e' },
  { id: 'kiss', label: 'Kiss-Cut', color: '#4361ee' },
  { id: 'crease', label: 'Crease', color: '#e5484d' },
  { id: 'perf', label: 'Perf', color: '#ff2fa0', dashed: true },
  { id: 'fold', label: 'Fold Marks', color: '#22c3c3', dashed: true },
];
const EQUIPMENT = ['Custom', 'Zünd', 'Kongsberg', 'Graphtec', 'Summa', 'i-cut', 'Silhouette'];

function CutterMarksPanel(p: PanelProps & { lite?: boolean }) {
  const { s, up, unit, onUnit, lite } = p;
  const toggleCut = (id: string) => {
    const cur: string[] = s.cutTypes ?? [];
    up({ cutTypes: cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id] });
  };
  return (
    <>
      {!lite && (
        <Section label="// CUT TYPE" help="Which cut operations this file drives — sets dieline colors and the JDF block type.">
          <div className="pe-cutchips">
            {CUT_TYPES.map((c) => (
              <button key={c.id} className={`pe-cutchip ${(s.cutTypes ?? []).includes(c.id) ? 'pe-on' : ''}`} onClick={() => toggleCut(c.id)}>
                <i style={{ background: c.dashed ? `repeating-linear-gradient(90deg, ${c.color} 0 4px, transparent 4px 7px)` : c.color }} />
                {c.label}
              </button>
            ))}
          </div>
        </Section>
      )}
      <Section label="// REGISTRATION MARKS" help="Optical targets the cutting table camera locates.">
        <span className="pe-label-sm">Equipment</span>
        <div className="pe-row" style={{ marginTop: 5 }}>
          <select className="pe-select" style={{ width: 130, flex: '0 0 130px' }} value={s.equipment ?? 'Custom'} onChange={(e) => {
            const eq = e.target.value;
            const presets: Record<string, StepSettings> = {
              'Zünd': { shape: 'circle', sizeIn: 0.2, marginIn: 0.24 }, Kongsberg: { shape: 'circle', sizeIn: 0.25, marginIn: 0.25 },
              Graphtec: { shape: 'square', sizeIn: 0.4, marginIn: 0.4 }, Summa: { shape: 'circle', sizeIn: 0.16, marginIn: 0.2 },
              'i-cut': { shape: 'circle', sizeIn: 0.25, marginIn: 0.25 }, Silhouette: { shape: 'corner', sizeIn: 0.4, marginIn: 0.4 },
            };
            up({ equipment: eq, ...(presets[eq] ?? {}) });
          }}>
            {EQUIPMENT.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        <span className="pe-label-sm">Shape</span>
        <div className="pe-seg3" style={{ marginTop: 5 }}>
          <button className={s.shape === 'circle' ? 'pe-on' : ''} onClick={() => up({ shape: 'circle' })}><span className="pe-seg-circle" /></button>
          <button className={s.shape === 'square' ? 'pe-on' : ''} onClick={() => up({ shape: 'square' })}><span className="pe-seg-square" /></button>
          <button className={s.shape === 'corner' ? 'pe-on' : ''} onClick={() => up({ shape: 'corner' })}><span className="pe-seg-corner" /></button>
        </div>
        <span className="pe-label-sm">Size</span>
        <div className="pe-row" style={{ marginTop: 5 }}><NumIn valueIn={s.sizeIn} unit={unit} onIn={(v) => up({ sizeIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <div className="pe-row">
          <select className="pe-select" style={{ width: 100, flex: '0 0 100px' }} value={s.placement} onChange={(e) => up({ placement: e.target.value })}>
            <option value="inside">Inside</option><option value="outside">Outside</option>
          </select>
          <select className="pe-select" style={{ width: 100, flex: '0 0 100px' }} value={s.refBox} onChange={(e) => up({ refBox: e.target.value })}>
            <option value="media">Media</option><option value="trim">Trim</option>
          </select>
          <span className="pe-label-sm">box</span>
        </div>
        <span className="pe-label-sm">Margins</span>
        <div className="pe-row" style={{ marginTop: 5 }}><NumIn valueIn={s.marginIn} unit={unit} onIn={(v) => up({ marginIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <Radio label="Corners Only" on={!s.cornersAndEdges} onSelect={() => up({ cornersAndEdges: false })} />
        <Radio label="Corners & Edges" on={!!s.cornersAndEdges} onSelect={() => up({ cornersAndEdges: true })} />
        <div className="pe-row" style={{ marginTop: 8 }}><span className="pe-label">Layer</span><span className="pe-help" title="Regmark layer name carried into the JDF ticket.">?</span></div>
        <input className="pe-input" value={s.layer ?? ''} placeholder="Regmark" onChange={(e) => up({ layer: e.target.value })} />
        <div className="pe-row" style={{ marginTop: 8 }}><span className="pe-label">Pages</span><span className="pe-help" title="Which sheets get marks — e.g. all, odd, 1-4.">?</span></div>
        <PagesInput value={s.pages} onChange={(v) => up({ pages: v })} />
      </Section>
      <Section label="// KEY MARK" help="An extra target so the cutter can identify sheet orientation.">
        <span className="pe-label-sm">Location</span>
        <KeyMarkGrid slot={s.keySlot ?? -1} onSlot={(k) => up({ keySlot: k })} />
        <span className="pe-label-sm">Distance from corner mark</span>
        <div className="pe-row" style={{ marginTop: 5, marginBottom: 0 }}><NumIn valueIn={s.keyDistIn ?? 2} unit={unit} onIn={(v) => up({ keyDistIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      </Section>
      {!lite && (
        <>
          <Section label="// DIELINES" help="Draw cut/crease/perf outlines in their standard colors.">
            <Check icon="cuttermarks" label="Add dielines" checked={!!s.addDielines} onChange={(v) => up({ addDielines: v })} />
          </Section>
          <Section label="// ARTWORK" help="Marks-only output for cutter-side file separation.">
            <Check icon="eraser" label="Remove artwork (create a cut-marks only file)" checked={!!s.removeArtwork} onChange={(v) => up({ removeArtwork: v })} />
          </Section>
        </>
      )}
    </>
  );
}
// 12 key-mark slots clockwise from the top-left corner, mirroring the engine.
function KeyMarkGrid({ slot, onSlot }: { slot: number; onSlot: (k: number) => void }) {
  const dot = (k: number, style: React.CSSProperties) => (
    <button key={k} className={`pe-keydot ${slot === k ? 'pe-on' : ''}`} style={style} onClick={() => onSlot(slot === k ? -1 : k)} />
  );
  return (
    <div className="pe-keygrid">
      {dot(0, { gridArea: '1/1' })}{dot(1, { gridArea: '1/2' })}{dot(2, { gridArea: '1/3' })}{dot(3, { gridArea: '1/4' })}
      {dot(11, { gridArea: '2/1' })}{dot(4, { gridArea: '2/4' })}
      {dot(10, { gridArea: '3/1' })}{dot(5, { gridArea: '3/4' })}
      {dot(9, { gridArea: '4/1' })}{dot(8, { gridArea: '4/2' })}{dot(7, { gridArea: '4/3' })}{dot(6, { gridArea: '4/4' })}
    </div>
  );
}

// ── Zine (fold-and-cut single-sheet booklets) ────────────────────────────────
function ZinePanel(p: PanelProps) {
  const { s, up, pageCount = 0 } = p;
  const fmt = s.format as ZineFormat;
  const { perSheet } = zinePanels(fmt);
  const M = Math.max(perSheet, Math.ceil(Math.max(1, pageCount) / perSheet) * perSheet);
  const numSheets = M / perSheet;
  const showSheet = Math.min(s.showSheet ?? 0, numSheets - 1);
  const grid = zineSheetLayout(fmt, M, showSheet, !!s.flipBackCover);
  const blanks = M - pageCount;
  const setGuide = (k: string, v: boolean) => up({ guides: { ...s.guides, [k]: v } });
  const setGw = (k: string, v: number) => up({ guideWeights: { ...s.guideWeights, [k]: v } });
  return (
    <>
      <Section label="// FORMAT" help="How many panels fold out of each sheet.">
        <Radio label={<span><b>Half (1/2)</b></span>} sub="2 panels per side — fold once" on={fmt === 'half'} onSelect={() => up({ format: 'half' })} />
        <Radio label={<span><b>Quarter (1/4)</b></span>} sub="4 panels — fold twice" on={fmt === 'quarter'} onSelect={() => up({ format: 'quarter' })} />
        <Radio label={<span><b>Mini (1/8)</b></span>} sub="8 panels — fold, slit, refold. No staples." on={fmt === 'mini'} onSelect={() => up({ format: 'mini' })} />
        <div className="pe-note">{pageCount || '—'} pages → {numSheets} sheet{numSheets === 1 ? '' : 's'} in {fmt === 'mini' ? 'Mini (1/8)' : fmt === 'quarter' ? 'Quarter (1/4)' : 'Half (1/2)'}</div>
      </Section>
      <Section label="// OPTIONS" help="Back-cover flip and signature splitting.">
        <Check icon="flip" label="Flip back cover" sub="Rotates the back cover 180° so a top-folded zine reads upright." checked={!!s.flipBackCover} onChange={(v) => up({ flipBackCover: v })} />
        <Check icon="booklet" label="Custom signature size" sub="Split long documents into stacked signatures instead of one nested booklet."
          checked={(s.signatureSheets ?? 0) > 0} onChange={(v) => up({ signatureSheets: v ? 2 : 0 })} />
        {(s.signatureSheets ?? 0) > 0 && (
          <div className="pe-row"><span className="pe-label pe-w96">Sheets / sig</span><NumRaw value={s.signatureSheets} onValue={(v) => up({ signatureSheets: Math.max(1, Math.round(v)) })} w={70} min={1} /></div>
        )}
        <div className="pe-label-sm" style={{ margin: '8px 0 6px' }}>Cutting guides</div>
        {([['margin', 'Margin guides'], ['center', 'Center guides'], ['fold', 'Fold guides']] as const).map(([k, label]) => (
          <div key={k} className="pe-row" style={{ marginBottom: 6 }}>
            <label className="pe-check" style={{ margin: 0, flex: 1 }}>
              <input type="checkbox" checked={!!s.guides?.[k]} onChange={(e) => setGuide(k, e.target.checked)} />
              <span className="pe-box">{s.guides?.[k] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round"><path d="M5 12l5 5L19 6" /></svg>}</span>
              {label}
            </label>
            <NumRaw value={s.guideWeights?.[k] ?? 1} onValue={(v) => setGw(k, v)} w={56} />
            <span className="pe-label-sm">pt</span>
            <span className="pe-zine-guide-swatch" style={{ background: k === 'fold' ? '#7b6cf6' : '#f59e0b' }} />
          </div>
        ))}
      </Section>
      <PaperSize {...p} />
      <Section label="// SHEET PREVIEW" help="Where each PDF page lands on the printed sheet. Upside-down numbers are rotated 180°.">
        {blanks > 0 && <div className="pe-note" style={{ marginTop: 0, marginBottom: 8 }}>Pages should be a multiple of {perSheet}; {blanks} blank page(s) will be added.</div>}
        <div className="pe-zine-diagram" style={{ aspectRatio: `${s.sheetWIn} / ${s.sheetHIn}` }}>
          {grid.map((row, r) => (
            <div key={r} className="pe-zine-row" style={{ height: `${100 / grid.length}%` }}>
              {row.map((cell, c) => (
                <div key={c} className={`pe-zine-cell ${cell.page === 1 ? 'pe-zine-cover' : ''}`} style={{ width: `${100 / row.length}%` }}>
                  {cell.page ? <span style={{ transform: cell.rot ? 'rotate(180deg)' : undefined }}>{cell.page > pageCount ? '·' : cell.page}</span> : ''}
                  {cell.page === 1 && <i className="pe-zine-front">FRONT</i>}
                </div>
              ))}
            </div>
          ))}
          {fmt === 'mini' && <span className="pe-zine-slit" />}
        </div>
        <div className="pe-zine-legend">
          <span><i className="pe-zl-fold" /> Fold</span><span><i className="pe-zl-cut" /> Cut</span>
          <span><i className="pe-zl-rot" /> Rotated 180°</span><span><i className="pe-zl-cover" /> Cover page</span>
        </div>
        {numSheets > 1 && (
          <>
            <div className="pe-label-sm" style={{ margin: '10px 0 5px' }}>Show printed sheet</div>
            <div className="pe-chipwrap">
              {Array.from({ length: numSheets }, (_, i) => (
                <button key={i} className={`pe-chipbtn ${showSheet === i ? 'pe-chip-on' : ''}`} onClick={() => up({ showSheet: i })}>{i + 1}</button>
              ))}
            </div>
          </>
        )}
        {fmt === 'mini' && (
          <div className="pe-note" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, color: 'var(--pe-violet)', marginBottom: 4 }}>How to fold</div>
            <div style={{ color: '#e5484d', fontWeight: 600, marginBottom: 6 }}>Print at 100% / Actual Size — do not scale to fit.</div>
            <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
              <li>Hold the page with the front cover at the bottom right.</li>
              <li>Fold in half (hamburger style).</li>
              <li>Cut along the top of the back cover to create a slit in the middle of the paper.</li>
              <li>Unfold, then fold in half (hotdog style).</li>
              <li>Push the two sides in, letting the middle pages split into a diamond.</li>
              <li>Starting with the back cover, fold the pages together until the back faces the front.</li>
            </ol>
          </div>
        )}
      </Section>
    </>
  );
}

// ── Gang sheet (jobs with per-page quantities) ───────────────────────────────
const WORK_STYLES = [
  { id: 'sheetwise', label: 'Sheetwise', cap: 'Front and back printed separately' },
  { id: 'workturn', label: 'Work and Turn', cap: 'Same plate; flip on the long edge' },
  { id: 'worktumble', label: 'Work and Tumble', cap: 'Same plate; flip on the short edge' },
  { id: 'perfecting', label: 'Perfecting', cap: 'Both sides in one pass' },
];

function GangSheetPanel(p: PanelProps) {
  const { s, up, unit, onUnit, pageCount = 0, thumbs = [], pageSizes = [] } = p;
  // Sync one job per source page whenever the loaded document changes.
  useEffect(() => {
    if (pageCount > 0 && s.docPages !== pageCount) {
      up({
        docPages: pageCount,
        jobs: pageSizes.slice(0, pageCount).map((sz, i) => ({
          srcIdx: 0, page: i + 1, qty: 1, padPt: 0, allowRotate: false, wPt: sz.wPt, hPt: sz.hPt,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount, pageSizes]);

  const usableW = (s.sheetWIn - s.marginLeftIn - s.marginRightIn) * 72;
  const usableH = (s.sheetHIn - s.marginTopIn - s.marginBottomIn) * 72;
  const jobs = (s.jobs ?? []) as { srcIdx: number; page: number; qty: number; padPt: number; allowRotate: boolean; wPt?: number; hPt?: number }[];
  const jobFits = (j: typeof jobs[number]) => {
    if (!j.wPt || !j.hPt) return true;
    const bw = j.wPt + 2 * (j.padPt || 0), bh = j.hPt + 2 * (j.padPt || 0);
    return (bw <= usableW && bh <= usableH) || (j.allowRotate && bh <= usableW && bw <= usableH);
  };
  const patchJob = (i: number, patch: Record<string, unknown>) => up({ jobs: jobs.map((j, k) => (k === i ? { ...j, ...patch } : j)) });
  return (
    <>
      <PaperSize {...p} />
      <Section label="// OPTIONS" help="Press work style and planning allowances (recorded on the job; layout is unchanged).">
        <span className="pe-label-sm">Work Style</span>
        <div className="pe-cards2" style={{ marginTop: 6 }}>
          {WORK_STYLES.map((w) => (
            <SelCard key={w.id} on={s.workStyle === w.id} off={s.workStyle !== w.id} cap={w.label.toUpperCase()} onClick={() => up({ workStyle: w.id })}>
              <Ic name="gangsheet" size={20} />
            </SelCard>
          ))}
        </div>
        <div className="pe-label-sm" style={{ margin: '6px 0 10px' }}>{WORK_STYLES.find((w) => w.id === s.workStyle)?.cap}</div>
        <span className="pe-label-sm">Makeready sheet count</span>
        <div className="pe-row" style={{ marginTop: 5 }}><NumRaw value={s.makeready} onValue={(v) => up({ makeready: Math.max(0, Math.round(v)) })} /></div>
        <span className="pe-label-sm">Running spoilage</span>
        <div className="pe-row" style={{ marginTop: 5, marginBottom: 0 }}><NumRaw value={s.spoilagePct} onValue={(v) => up({ spoilagePct: Math.max(0, v) })} /><span className="pe-label-sm">%</span></div>
      </Section>
      <Section label="// WHITE SPACE" help="Margins around the sheet plus the gutter between jobs.">
        <div className="pe-row"><span className="pe-label">Margins</span><span style={{ flex: 1 }} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <div className="pe-gang-margins">
          <div className="pe-field-col" style={{ gridArea: 'top' }}><span className="pe-label-sm">Top</span><NumIn valueIn={s.marginTopIn} unit={unit} onIn={(v) => up({ marginTopIn: v })} /></div>
          <div className="pe-field-col" style={{ gridArea: 'left' }}><span className="pe-label-sm">Left</span><NumIn valueIn={s.marginLeftIn} unit={unit} onIn={(v) => up({ marginLeftIn: v })} /></div>
          <div className="pe-field-col" style={{ gridArea: 'right' }}><span className="pe-label-sm">Right</span><NumIn valueIn={s.marginRightIn} unit={unit} onIn={(v) => up({ marginRightIn: v })} /></div>
          <div className="pe-field-col" style={{ gridArea: 'bot' }}><span className="pe-label-sm">Bottom</span><NumIn valueIn={s.marginBottomIn} unit={unit} onIn={(v) => up({ marginBottomIn: v })} /></div>
        </div>
        <div className="pe-row" style={{ marginTop: 10 }}><span className="pe-label">Gutters</span></div>
        <div className="pe-field-col"><span className="pe-label-sm">Between jobs</span><NumIn valueIn={s.gutterIn} unit={unit} onIn={(v) => up({ gutterIn: v })} /></div>
      </Section>
      <MarksSection {...p} />
      <BleedsSection {...p} />
      <Section label="// JOBS" help="Each source page is a job: set its run quantity, padding and rotation.">
        {jobs.map((j, i) => (
          <div key={`${j.srcIdx}-${j.page}-${i}`} className="pe-gang-job">
            <div className="pe-row" style={{ marginBottom: 8 }}>
              <span className="pe-gang-thumb">{j.srcIdx === 0 && thumbs[j.page - 1] ? <img src={thumbs[j.page - 1]} alt="" /> : <Ic name="file" size={16} />}</span>
              <span className="pe-label" style={{ fontWeight: 600, flex: 1 }}>{j.srcIdx === 0 ? `Page ${j.page}` : `File ${j.srcIdx} · p${j.page}`}</span>
              <button className="pe-iconbtn" onClick={() => up({ jobs: jobs.filter((_, k) => k !== i) })}><Ic name="trash" size={14} /></button>
            </div>
            <span className="pe-label-sm">Quantity</span>
            <div className="pe-row" style={{ marginTop: 4 }}><NumRaw value={j.qty} onValue={(v) => patchJob(i, { qty: Math.max(0, Math.round(v)) })} min={0} /></div>
            <span className="pe-label-sm">Padding</span>
            <div className="pe-row" style={{ marginTop: 4 }}>
              <NumRaw value={j.padPt} onValue={(v) => patchJob(i, { padPt: Math.max(0, v) })} />
              <span className="pe-label-sm">pt</span>
            </div>
            <Check icon="rotate" label="Allow rotation" checked={j.allowRotate} onChange={(v) => patchJob(i, { allowRotate: v })} />
            {!jobFits(j) && <div className="pe-gang-warn">Sheet too small to fit all jobs. Increase paper size or reduce margins/gutters.</div>}
          </div>
        ))}
        <div className="pe-gang-addfiles" onClick={() => {
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = 'application/pdf'; inp.multiple = true;
          inp.onchange = async () => {
            const list = Array.from(inp.files ?? []);
            const { getPageSizes } = await import('@/lib/imposition-toolkit/impose');
            const files = [...(s.files ?? [])];
            const newJobs = [...jobs];
            for (const f of list) {
              const bytes = new Uint8Array(await f.arrayBuffer());
              const sizes = await getPageSizes(bytes);
              files.push({ name: f.name, bytes });
              sizes.forEach((sz, pi) => newJobs.push({ srcIdx: files.length, page: pi + 1, qty: 1, padPt: 0, allowRotate: false, wPt: sz.wPt, hPt: sz.hPt }));
            }
            up({ files, jobs: newJobs });
          };
          inp.click();
        }}>
          <Ic name="upload" size={20} />
          <div>Drag and drop a file here or <span style={{ color: 'var(--pe-violet)' }}>browse</span> to add it to the gang sheet.</div>
        </div>
      </Section>
    </>
  );
}

// ── Custom impose (per-cell page + rotation) ─────────────────────────────────
function fillCells(preset: string, cols: number, rows: number): { page: number; rot: 0 | 90 | 180 | 270 }[] {
  const n = cols * rows;
  if (preset === 'repeat') return Array.from({ length: n }, () => ({ page: 1, rot: 0 as const }));
  if (preset === 'cutstack') return Array.from({ length: n }, (_, i) => ({ page: i + 1, rot: 0 as const }));   // sheet count applied downstream
  if (preset === 'saddle' && n >= 4) {
    // 4-up quarto-style: top row rotated 180.
    const cells = Array.from({ length: n }, (_, i) => ({ page: i + 1, rot: (Math.floor(i / cols) === 0 ? 180 : 0) as 0 | 180 }));
    return cells as { page: number; rot: 0 | 90 | 180 | 270 }[];
  }
  return Array.from({ length: n }, (_, i) => ({ page: i + 1, rot: 0 as const }));
}

function CustomImposePanel(p: PanelProps) {
  const { s, up, pageCount = 0 } = p;
  const cells = (s.cells ?? []) as { page: number; rot: 0 | 90 | 180 | 270 }[];
  const [sel, setSel] = useState(0);
  const setGrid = (cols: number, rows: number) => {
    const next = Array.from({ length: cols * rows }, (_, i) => cells[i] ?? { page: i + 1, rot: 0 as const });
    up({ cols, rows, cells: next });
  };
  const cell = cells[sel];
  return (
    <>
      <div className="pe-note" style={{ marginBottom: 12 }}>
        Custom Impose keeps pages at their original size ratio inside each cell. To change the page size first, chain a <b>Resize</b> step before this one.
      </div>
      <Section label="// GRID LAYOUT" help="Click a cell to select it, then set its page and rotation.">
        <div className="pe-grid2" style={{ marginBottom: 10 }}>
          <div className="pe-row" style={{ margin: 0 }}><span className="pe-label" style={{ width: 56 }}>Columns</span><NumRaw value={s.cols} onValue={(v) => setGrid(Math.max(1, Math.min(6, Math.round(v))), s.rows)} min={1} /></div>
          <div className="pe-row" style={{ margin: 0 }}><span className="pe-label" style={{ width: 40 }}>Rows</span><NumRaw value={s.rows} onValue={(v) => setGrid(s.cols, Math.max(1, Math.min(6, Math.round(v))))} min={1} /></div>
        </div>
        <div className="pe-ci-grid" style={{ gridTemplateColumns: `repeat(${s.cols}, 1fr)`, aspectRatio: `${s.sheetWIn} / ${s.sheetHIn}` }}>
          {cells.map((c, i) => (
            <button key={i} className={`pe-ci-cell ${sel === i ? 'pe-on' : ''}`} onClick={() => setSel(i)}>
              <span style={{ transform: c.rot ? `rotate(${c.rot}deg)` : undefined }}>{c.page || '—'}</span>
            </button>
          ))}
        </div>
        {cell && (
          <div style={{ marginTop: 12 }}>
            <div className="pe-row">
              <span className="pe-label pe-w96">Cell {sel + 1} page</span>
              <NumRaw value={cell.page} onValue={(v) => up({ cells: cells.map((c, i) => (i === sel ? { ...c, page: Math.max(0, Math.round(v)) } : c)) })} w={70} min={0} />
              <span className="pe-label-sm">0 = blank</span>
            </div>
            <div className="pe-row" style={{ marginBottom: 0 }}>
              <span className="pe-label pe-w96">Rotation</span>
              {([0, 90, 180, 270] as const).map((r) => (
                <button key={r} className={`pe-chipbtn ${cell.rot === r ? 'pe-chip-on' : ''}`} onClick={() => up({ cells: cells.map((c, i) => (i === sel ? { ...c, rot: r } : c)) })}>{r}°</button>
              ))}
            </div>
          </div>
        )}
      </Section>
      <Section label="// PRESETS" help="Fill strategies. You can edit cells afterwards.">
        <div className="pe-cards2">
          {[['sequential', 'Sequential'], ['repeat', 'Repeat'], ['saddle', 'Saddle Stitch'], ['cutstack', 'Cut and Stack']].map(([id, label]) => (
            <SelCard key={id} on={s.preset === id} off={s.preset !== id} cap={label!.toUpperCase()}
              onClick={() => up({ preset: id, cells: fillCells(id!, s.cols, s.rows) })}>
              <Ic name={id === 'saddle' ? 'booklet' : id === 'cutstack' ? 'cutstack' : id === 'repeat' ? 'cards' : 'grid'} size={20} />
            </SelCard>
          ))}
        </div>
        <div className="pe-note">Pick a strategy to fill cells automatically, then fine-tune any cell by hand ({pageCount || '—'} source pages).</div>
      </Section>
      <PaperSize {...p} />
      <Section label="// WHITE SPACE" help="Sheet margins and cell gutters.">
        <div className="pe-grid2">
          <div className="pe-field-col"><span className="pe-label-sm">Margin</span><NumIn valueIn={s.marginIn} unit={p.unit} onIn={(v) => up({ marginIn: v })} /></div>
          <div className="pe-field-col"><span className="pe-label-sm">Gutter</span><NumIn valueIn={s.gutterIn} unit={p.unit} onIn={(v) => up({ gutterIn: v })} /></div>
        </div>
      </Section>
      <MarksSection {...p} />
    </>
  );
}

// ── PDF Tools + Layers ───────────────────────────────────────────────────────
function PdfToolsPanel({ s, up }: PanelProps) {
  return (
    <Section label="// OPERATION" help="Whole-file maintenance. Encrypt, decrypt and linearize run on qpdf compiled to WebAssembly — still entirely in your browser.">
      <div className="pe-chipwrap" style={{ marginBottom: 12 }}>
        {([['optimize', '⚡ Optimize'], ['linearize', '🌐 Linearize'], ['encrypt', '🔒 Encrypt'], ['decrypt', '🔓 Decrypt'], ['repair', '🛠 Repair']] as const).map(([op, label]) => (
          <button key={op} className={`pe-chipbtn ${s.op === op ? 'pe-chip-on' : ''}`} onClick={() => up({ op })}>{label}</button>
        ))}
      </div>
      {s.op === 'optimize' && (
        <>
          <Check icon="layers" label="Generate object streams (smaller)" checked={s.useObjectStreams !== false} onChange={(v) => up({ useObjectStreams: v })} />
          <Check icon="trash" label="Remove unreferenced objects" checked={s.removeUnused !== false} onChange={(v) => up({ removeUnused: v })} />
          <div className="pe-note">Rebuilds the file with compressed object streams — often 10-40% smaller.</div>
        </>
      )}
      {s.op === 'linearize' && (
        <div className="pe-note">Rewrites the file for fast web view (byte-serving) via qpdf — first page renders before the rest downloads.</div>
      )}
      {s.op === 'encrypt' && (
        <>
          <span className="pe-label-sm">User password (to open)</span>
          <input className="pe-input" type="password" style={{ margin: '5px 0 10px' }} value={s.userPassword ?? ''} onChange={(e) => up({ userPassword: e.target.value })} />
          <span className="pe-label-sm">Owner password (permissions — optional)</span>
          <input className="pe-input" type="password" style={{ margin: '5px 0 10px' }} value={s.ownerPassword ?? ''} onChange={(e) => up({ ownerPassword: e.target.value })} />
          <div className="pe-note">AES-256 encryption via qpdf. Applied at export; the live preview shows the unencrypted content.</div>
        </>
      )}
      {s.op === 'decrypt' && (
        <>
          <span className="pe-label-sm">Password (leave blank for restriction-only files)</span>
          <input className="pe-input" type="password" style={{ margin: '5px 0 10px' }} value={s.password ?? ''} onChange={(e) => up({ password: e.target.value })} />
          <div className="pe-note">Removes encryption you are authorised to remove — with the password via qpdf, or directly for permission-flag-only files.</div>
        </>
      )}
      {s.op === 'repair' && (
        <>
          <Check icon="settings" label="Re-serialize PDF (fix xref, streams)" checked onChange={() => {}} />
          <Check icon="eraser" label="Strip metadata (title, author, etc.)" checked={!!s.stripMetadata} onChange={(v) => up({ stripMetadata: v })} />
          <Check icon="trash" label="Remove annotations" checked={!!s.removeAnnotations} onChange={(v) => up({ removeAnnotations: v })} />
          <Check icon="close" label="Remove JavaScript / actions" checked={s.removeJavaScript !== false} onChange={(v) => up({ removeJavaScript: v })} />
        </>
      )}
    </Section>
  );
}

function LayersPanel({ s, up, layerEntries = [], onToggleLayer, sourceBytes }: PanelProps) {
  const [pdfLayers, setPdfLayers] = useState<{ name: string }[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!sourceBytes) { setPdfLayers([]); return; }
    import('@/lib/imposition-toolkit/impose').then(({ readLayers }) => readLayers(sourceBytes.slice()))
      .then((ls) => { if (!cancelled) setPdfLayers(ls); })
      .catch(() => { if (!cancelled) setPdfLayers([]); });
    return () => { cancelled = true; };
  }, [sourceBytes]);
  const states = (s.states ?? []) as { name: string; state: 'on' | 'off' | 'default' }[];
  const stateOf = (name: string) => states.find((x) => x.name === name)?.state ?? 'default';
  const cycle = (name: string) => {
    const cur = stateOf(name);
    const next = cur === 'default' ? 'off' : cur === 'off' ? 'on' : 'default';
    up({ states: [...states.filter((x) => x.name !== name), { name, state: next }] });
  };
  const empty = (!pdfLayers || pdfLayers.length === 0) && layerEntries.length === 0;
  return (
    <Section label="// LAYERS" help="Optional-content (OCG) layers in the PDF, plus layers contributed by workflow steps.">
      {empty ? (
        <div className="pe-layers-empty">
          <Ic name="layers" size={26} />
          <div style={{ fontWeight: 600, marginTop: 8 }}>No layers detected</div>
          <div className="pe-label-sm" style={{ marginTop: 4, lineHeight: 1.5 }}>
            Add a Color Bar or Cutter Marks step with a layer name to create toggleable layers.
          </div>
        </div>
      ) : (
        <>
          {(pdfLayers ?? []).map((l) => {
            const st = stateOf(l.name);
            return (
              <div key={l.name} className="pe-row" style={{ marginBottom: 8 }}>
                <Ic name="layers" size={15} />
                <span className="pe-label" style={{ flex: 1 }}>{l.name} <span className="pe-label-sm">· PDF layer</span></span>
                <button className="pe-chipbtn" onClick={() => cycle(l.name)}>{st === 'default' ? 'Default' : st === 'on' ? 'Forced on' : 'Forced off'}</button>
              </div>
            );
          })}
          {layerEntries.map((l) => (
            <div key={l.stepId} className="pe-row" style={{ marginBottom: 8 }}>
              <Ic name="layers" size={15} />
              <span className="pe-label" style={{ flex: 1 }}>{l.name} <span className="pe-label-sm">· {l.stepLabel}</span></span>
              <button className={`pe-eye ${l.enabled ? '' : 'pe-eye-off'}`} style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => onToggleLayer?.(l.stepId)}><Ic name={l.enabled ? 'eye' : 'eyeoff'} size={16} /></button>
            </div>
          ))}
        </>
      )}
    </Section>
  );
}

// ── Compact panels for the remaining tools ───────────────────────────────────
function SimplePanels({ type, s, up, unit, onUnit, pageCount }: PanelProps & { type: StepType }) {
  switch (type) {
    case 'shuffle':
      return (
        <>
          <Section label="// PAGES" help="Page reordering expression.">
            <span className="pe-label-sm">Pattern</span>
            <input className="pe-input" style={{ marginTop: 5 }} value={s.pattern} onChange={(e) => up({ pattern: e.target.value })} />
            <div className="pe-note" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Syntax:</div>
              <div><code>all</code> — All pages · <code>1-5</code> Range · <code>5-1</code> Reverse</div>
              <div><code>odd</code>, <code>even</code>, <code>last</code>, <code>first</code></div>
              <div><code>5*(1)</code> Repeat · <code>[a, b]</code> Interleave</div>
            </div>
          </Section>
          <Section label="// QUICK ACTIONS" help="Common presets.">
            <div className="pe-row" style={{ flexWrap: 'wrap', marginBottom: 0 }}>
              <button className="pe-chipbtn" onClick={() => up({ pattern: 'last-1' })}><Ic name="shuffle" size={14} /> Reverse</button>
              <button className="pe-chipbtn" onClick={() => up({ pattern: 'odd' })}>Odd only</button>
              <button className="pe-chipbtn" onClick={() => up({ pattern: 'even' })}>Even only</button>
            </div>
          </Section>
        </>
      );
    case 'rotate':
      return (
        <Section label="// ROTATION" help="Rotate the selected pages.">
          <div className="pe-cards2" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {[90, 180, 270].map((d) => <SelCard key={d} on={s.angle === d} off={s.angle !== d} cap={`${d}°`} onClick={() => up({ angle: d })}><Ic name="rotate" size={22} /></SelCard>)}
          </div>
          <div className="pe-row" style={{ marginTop: 10, marginBottom: 0 }}><span className="pe-label">Pages</span><input className="pe-input" value={s.pages} onChange={(e) => up({ pages: e.target.value })} /></div>
        </Section>
      );
    case 'flip':
      return (
        <Section label="// FLIP" help="Mirror page content (iron-on transfers, window clings).">
          <div className="pe-cards2">
            <SelCard on={s.dir === 'h'} off={s.dir !== 'h'} cap="HORIZONTAL" onClick={() => up({ dir: 'h' })}><Ic name="flip" size={22} /></SelCard>
            <SelCard on={s.dir === 'v'} off={s.dir !== 'v'} cap="VERTICAL" onClick={() => up({ dir: 'v' })}><Ic name="flip" size={22} /></SelCard>
          </div>
        </Section>
      );
    case 'crop':
      return (
        <Section label="// CROP" help="Inches trimmed from each edge (sets CropBox + TrimBox).">
          <div className="pe-grid2">
            {(['top', 'right', 'bottom', 'left'] as const).map((e) => (
              <div key={e} className="pe-field-col"><span className="pe-label-sm">{e[0]!.toUpperCase() + e.slice(1)}</span><NumIn valueIn={s[e]} unit={unit} onIn={(v) => up({ [e]: v })} /></div>
            ))}
          </div>
          <div className="pe-row" style={{ marginTop: 10, marginBottom: 0 }}><UnitSel unit={unit} onChange={onUnit} /></div>
        </Section>
      );
    case 'resize':
      return (
        <Section label="// RESIZE" help="Scale by percent, or fit/stretch to a target size.">
          <select className="pe-select" value={s.mode} onChange={(e) => up({ mode: e.target.value })}>
            <option value="scale">Scale %</option><option value="fit">Fit to size</option><option value="stretch">Stretch to size</option>
          </select>
          {s.mode === 'scale' ? (
            <div className="pe-row" style={{ marginTop: 10, marginBottom: 0 }}><span className="pe-label">Scale</span><NumRaw value={s.scalePct} onValue={(v) => up({ scalePct: v })} w={90} /><span className="pe-label-sm">%</span></div>
          ) : (
            <div className="pe-grid2" style={{ marginTop: 10 }}>
              <div className="pe-field-col"><span className="pe-label-sm">Width</span><NumIn valueIn={s.targetWIn} unit={unit} onIn={(v) => up({ targetWIn: v })} /></div>
              <div className="pe-field-col"><span className="pe-label-sm">Height</span><NumIn valueIn={s.targetHIn} unit={unit} onIn={(v) => up({ targetHIn: v })} /></div>
            </div>
          )}
        </Section>
      );
    case 'split':
      return (
        <Section label="// RANGES" help="Comma-separated page ranges; each becomes a file at export.">
          <input className="pe-input" value={s.ranges} onChange={(e) => up({ ranges: e.target.value })} placeholder={pageCount ? `1-${pageCount}` : '1-5, 6-10'} />
          <div className="pe-note">Each range downloads as a separate PDF. The preview shows the un-split output.</div>
        </Section>
      );
    case 'merge':
      return (
        <Section label="// FILES" help="PDFs appended after the loaded document, in order.">
          {(s.files as { name: string }[]).map((m, i) => (
            <div key={i} className="pe-row" style={{ marginBottom: 6 }}>
              <span className="pe-label-sm" style={{ flex: 1 }}>+ {m.name}</span>
              <button className="pe-iconbtn" onClick={() => up({ files: (s.files as unknown[]).filter((_, j) => j !== i) })}><Ic name="close" size={14} /></button>
            </div>
          ))}
          <button className="pe-chipbtn" onClick={() => {
            const inp = document.createElement('input');
            inp.type = 'file'; inp.accept = 'application/pdf'; inp.multiple = true;
            inp.onchange = async () => {
              const list = Array.from(inp.files ?? []);
              const loaded = await Promise.all(list.map(async (f) => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));
              up({ files: [...(s.files as unknown[]), ...loaded] });
            };
            inp.click();
          }}><Ic name="addstep" size={14} /> Add PDFs</button>
        </Section>
      );
    case 'overlay':
      return (
        <Section label="// STAMP" help="A PDF drawn over every page of the document.">
          <button className="pe-chipbtn" onClick={() => {
            const inp = document.createElement('input');
            inp.type = 'file'; inp.accept = 'application/pdf';
            inp.onchange = async () => { const f = inp.files?.[0]; if (f) up({ stamp: new Uint8Array(await f.arrayBuffer()), stampName: f.name }); };
            inp.click();
          }}><Ic name="upload" size={14} /> {s.stampName || 'Choose stamp PDF'}</button>
          <div className="pe-row" style={{ marginTop: 10 }}><span className="pe-label pe-w96">Opacity</span><NumRaw value={Math.round(s.opacity * 100)} onValue={(v) => up({ opacity: Math.min(100, Math.max(0, v)) / 100 })} w={80} /><span className="pe-label-sm">%</span></div>
          <select className="pe-select" value={s.mode} onChange={(e) => up({ mode: e.target.value })}>
            <option value="center">Center</option><option value="fill">Fill</option><option value="tile">Tile</option>
          </select>
        </Section>
      );
    case 'distort': {
      const dia = s.cylinderDiaMm ?? 150, plate = s.plateThickMm ?? 1.7;
      const circ = Math.PI * dia, printCirc = Math.PI * (dia + 2 * plate);
      const cylFactor = (circ / printCirc) * 100;
      return (
        <>
          <Section label="// CALCULATION MODE" help="Compute the shrink factor from the cylinder, or type it directly.">
            <div className="pe-chipwrap" style={{ marginBottom: 12 }}>
              <button className={`pe-chipbtn ${s.calcMode !== 'custom' ? 'pe-chip-on' : ''}`} onClick={() => up({ calcMode: 'cylinder', factorPct: cylFactor })}>Cylinder</button>
              <button className={`pe-chipbtn ${s.calcMode === 'custom' ? 'pe-chip-on' : ''}`} onClick={() => up({ calcMode: 'custom' })}>Custom</button>
            </div>
            {s.calcMode !== 'custom' ? (
              <>
                <span className="pe-label-sm">Cylinder Diameter</span>
                <div className="pe-row" style={{ marginTop: 4 }}><NumRaw value={dia} onValue={(v) => up({ cylinderDiaMm: v, factorPct: (Math.PI * v / (Math.PI * (v + 2 * plate))) * 100 })} w={90} /><span className="pe-label-sm">mm</span></div>
                <span className="pe-label-sm">Plate Thickness</span>
                <div className="pe-row" style={{ marginTop: 4, marginBottom: 0 }}><NumRaw value={plate} onValue={(v) => up({ plateThickMm: v, factorPct: (Math.PI * dia / (Math.PI * (dia + 2 * v))) * 100 })} w={90} /><span className="pe-label-sm">mm</span></div>
              </>
            ) : (
              <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Factor</span><NumRaw value={s.factorPct} onValue={(v) => up({ factorPct: v })} w={90} /><span className="pe-label-sm">%</span></div>
            )}
          </Section>
          <Section label="// DIRECTION" help="Which axis pre-shrinks to cancel cylinder stretch.">
            <select className="pe-select" value={s.direction} onChange={(e) => up({ direction: e.target.value })}>
              <option value="circ">Circumferential (height only)</option><option value="cross">Cross-web (width)</option><option value="both">Both</option>
            </select>
            <div className="pe-name-preview" style={{ marginTop: 12 }}>
              <div className="pe-label-sm">COMPUTED RESULT</div>
              <div className="pe-mono" style={{ fontSize: 13, display: 'grid', gap: 3, marginTop: 6 }}>
                <span>Scale factor&nbsp;&nbsp;{((s.factorPct ?? 100) / 100).toFixed(6)}</span>
                <span>Percentage&nbsp;&nbsp;&nbsp;&nbsp;{(s.factorPct ?? 100).toFixed(3)}%</span>
                {s.calcMode !== 'custom' && <><span>Base circumference&nbsp;&nbsp;{circ.toFixed(2)} mm</span><span>Print circumference&nbsp;{printCirc.toFixed(2)} mm</span></>}
              </div>
            </div>
          </Section>
        </>
      );
    }
    case 'bleed':
      return (
        <Section label="// BLEED" help="Scales content outward to fabricate bleed; trim recorded in TrimBox.">
          <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Bleed</span><NumIn valueIn={s.bleedIn} unit={unit} onIn={(v) => up({ bleedIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
        </Section>
      );
    case 'headerfooter':
      return (
        <Section label="// TEXT BANDS" help="Running header and footer. Tokens fill in per page at export.">
          <span className="pe-label-sm">Header</span>
          <input className="pe-input" style={{ margin: '5px 0 6px' }} value={s.header} onChange={(e) => up({ header: e.target.value })} />
          <span className="pe-label-sm">Footer</span>
          <input className="pe-input" style={{ margin: '5px 0 6px' }} value={s.footer} onChange={(e) => up({ footer: e.target.value })} />
          <div className="pe-label-sm" style={{ margin: '4px 0 5px' }}>Insert variable (into footer)</div>
          <div className="pe-chipwrap" style={{ marginBottom: 10 }}>
            {['[page]', '[pages]', '[file-name]', '[date]', '[time]'].map((t) => (
              <button key={t} className="pe-chipbtn pe-mono" onClick={() => up({ footer: `${s.footer ?? ''}${s.footer ? ' ' : ''}${t}` })}>{t}</button>
            ))}
          </div>
          <div className="pe-row" style={{ marginBottom: 0 }}>
            <select className="pe-select" value={s.align} onChange={(e) => up({ align: e.target.value })}>
              <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
            </select>
            <NumRaw value={s.fontSizePt} onValue={(v) => up({ fontSizePt: v })} w={70} /><span className="pe-label-sm">pt</span>
          </div>
        </Section>
      );
    case 'slugline':
      return (
        <>
          <Section label="// PRESETS" help="Common slug templates.">
            <div className="pe-chipwrap">
              {([['Standard', '[file-name] · [date] · [page-count]pp'], ['Minimal', '[file-name]'], ['Full Job Info', '[file-name] · [date] [time] · page [page] of [page-count]'], ['Proof', 'PROOF · [file-name] · [date] · NOT FOR PRODUCTION']] as const).map(([label, tpl]) => (
                <button key={label} className={`pe-chipbtn ${s.text === tpl ? 'pe-chip-on' : ''}`} onClick={() => up({ text: tpl })}>{label}</button>
              ))}
            </div>
          </Section>
          <Section label="// TEMPLATE" help="Click a token to insert it.">
            <input className="pe-input pe-mono" value={s.text} onChange={(e) => up({ text: e.target.value })} />
            <div className="pe-label-sm" style={{ margin: '8px 0 5px' }}>Insert token</div>
            <div className="pe-chipwrap">
              {['[file-name]', '[page]', '[page-count]', '[date]', '[time]'].map((t) => (
                <button key={t} className="pe-chipbtn pe-mono" onClick={() => up({ text: `${s.text ?? ''}${s.text ? ' · ' : ''}${t}` })}>{t}</button>
              ))}
            </div>
          </Section>
          <Section label="// PLACEMENT" help="Edge + size.">
            <div className="pe-row" style={{ marginBottom: 0 }}>
              <select className="pe-select" value={s.position} onChange={(e) => up({ position: e.target.value })}>
                <option value="bottom">Bottom</option><option value="top">Top</option>
              </select>
              <NumRaw value={s.fontSizePt} onValue={(v) => up({ fontSizePt: v })} w={70} /><span className="pe-label-sm">pt</span>
            </div>
          </Section>
        </>
      );
    case 'foldmarks':
      return (
        <Section label="// FOLD SCHEME" help="Fold position ticks.">
          <select className="pe-select" value={s.scheme} onChange={(e) => up({ scheme: e.target.value })}>
            {['half', 'letter', 'zfold', 'gate', 'doubleparallel', 'roll', 'accordion', 'custom'].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          {s.scheme === 'custom' && <input className="pe-input" style={{ marginTop: 8 }} placeholder="33,66 (%)" value={s.positions ?? ''} onChange={(e) => up({ positions: e.target.value })} />}
          <div className="pe-row" style={{ marginTop: 10, marginBottom: 0 }}>
            <select className="pe-select" value={s.orientation} onChange={(e) => up({ orientation: e.target.value })}>
              <option value="vertical">Vertical folds</option><option value="horizontal">Horizontal folds</option>
            </select>
            <select className="pe-select" value={s.style} onChange={(e) => up({ style: e.target.value })}>
              <option value="dashed">Dashed</option><option value="solid">Solid</option><option value="dotted">Dotted</option>
            </select>
          </div>
        </Section>
      );
    case 'collating':
      return (
        <Section label="// COLLATING" help="Stepped spine ticks per signature.">
          <div className="pe-cards2">
            <SelCard on={s.edge === 'left'} off={s.edge !== 'left'} cap="LEFT SPINE" onClick={() => up({ edge: 'left' })}><Ic name="collating" size={22} /></SelCard>
            <SelCard on={s.edge === 'right'} off={s.edge !== 'right'} cap="RIGHT SPINE" onClick={() => up({ edge: 'right' })}><Ic name="collating" size={22} /></SelCard>
          </div>
          <div className="pe-row" style={{ marginTop: 10, marginBottom: 0 }}><span className="pe-label pe-w96">Pages / sig</span><NumRaw value={s.pagesPerSig} onValue={(v) => up({ pagesPerSig: Math.max(2, Math.round(v)) })} w={80} /></div>
        </Section>
      );
    case 'omr':
      return (
        <Section label="// OMR" help="Optical marks for inserters / folders.">
          <div className="pe-row"><span className="pe-label pe-w96">Edge</span>
            <select className="pe-select" value={s.edge} onChange={(e) => up({ edge: e.target.value })}>
              {['left', 'right', 'top', 'bottom'].map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div className="pe-row"><span className="pe-label pe-w96">Encoding</span>
            <select className="pe-select" value={s.encoding} onChange={(e) => up({ encoding: e.target.value })}>
              <option value="binary">Binary</option><option value="barheight">Bar height</option>
            </select>
          </div>
          <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Program</span><NumRaw value={s.program} onValue={(v) => up({ program: Math.max(0, Math.round(v)) })} w={70} /><span className="pe-label-sm">of</span><NumRaw value={s.bitCount} onValue={(v) => up({ bitCount: Math.max(4, Math.round(v)) })} w={70} /><span className="pe-label-sm">bits</span></div>
        </Section>
      );
    case 'gathering':
      return (
        <Section label="// GATHERING" help="Staircase marks on the gripper edge.">
          <div className="pe-cards2">
            <SelCard on={s.edge === 'bottom'} off={s.edge !== 'bottom'} cap="BOTTOM (GRIPPER)" onClick={() => up({ edge: 'bottom' })}><Ic name="gathering" size={22} /></SelCard>
            <SelCard on={s.edge === 'top'} off={s.edge !== 'top'} cap="TOP" onClick={() => up({ edge: 'top' })}><Ic name="gathering" size={22} /></SelCard>
          </div>
        </Section>
      );
    case 'laymarks':
      return (
        <Section label="// LAY MARKS" help="Front-lay + side-lay marks for hand-fed presses.">
          <div className="pe-row"><span className="pe-label pe-w96">Type</span>
            <select className="pe-select" value={s.markType} onChange={(e) => up({ markType: e.target.value })}>
              <option value="arrow">Arrow</option><option value="line">Line</option><option value="cross">Cross</option>
            </select>
          </div>
          <div className="pe-row"><span className="pe-label pe-w96">Edges</span>
            <select className="pe-select" value={s.edges} onChange={(e) => up({ edges: e.target.value })}>
              <option value="both">Gripper + side guide</option><option value="gripper">Gripper only</option><option value="sideguide">Side guide only</option>
            </select>
          </div>
          <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Side guide</span>
            <select className="pe-select" value={s.sideGuideSide} onChange={(e) => up({ sideGuideSide: e.target.value })}>
              <option value="left">Left</option><option value="right">Right</option>
            </select>
          </div>
        </Section>
      );
    case 'watermark':
      return (
        <>
          <Section label="// PRESETS" help="Common proof stamps.">
            <div className="pe-chipwrap">
              {['DRAFT', 'CONFIDENTIAL', 'PROOF', 'COPY', 'SAMPLE', 'DO NOT COPY'].map((t) => (
                <button key={t} className={`pe-chipbtn ${s.text === t ? 'pe-chip-on' : ''}`} onClick={() => up({ text: t })}>{t}</button>
              ))}
            </div>
          </Section>
          <Section label="// TEXT" help="The stamped text.">
            <input className="pe-input" value={s.text} onChange={(e) => up({ text: e.target.value })} />
          </Section>
          <Section label="// APPEARANCE" help="Size, opacity and angle.">
            <div className="pe-row"><span className="pe-label pe-w96">Font Size</span><NumRaw value={s.fontSizePt} onValue={(v) => up({ fontSizePt: v })} w={70} /><span className="pe-label-sm">pt</span></div>
            <div className="pe-row"><span className="pe-label pe-w96">Opacity</span><NumRaw value={Math.round(s.opacity * 100)} onValue={(v) => up({ opacity: Math.min(100, Math.max(1, v)) / 100 })} w={70} /><span className="pe-label-sm">%</span></div>
            <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Angle</span><NumRaw value={s.angleDeg} onValue={(v) => up({ angleDeg: v })} w={70} /><span className="pe-label-sm">degrees</span></div>
          </Section>
          <Section label="// PREVIEW" help="How the stamp will sit on the page.">
            <div className="pe-wm-preview"><span style={{ transform: `rotate(-${s.angleDeg}deg)`, opacity: Math.max(0.15, s.opacity * 2) }}>{s.text || 'DRAFT'}</span></div>
          </Section>
        </>
      );
    case 'pagenumbers':
      return (
        <Section label="// PAGE NUMBERS" help="Folio / Bates stamping.">
          <select className="pe-select" value={s.position} onChange={(e) => up({ position: e.target.value })}>
            {['bottom-center', 'bottom-right', 'bottom-left', 'top-center', 'top-right', 'top-left'].map((k) => <option key={k}>{k}</option>)}
          </select>
          <div className="pe-grid2" style={{ marginTop: 10 }}>
            <div className="pe-field-col"><span className="pe-label-sm">Prefix</span><input className="pe-input" value={s.prefix} onChange={(e) => up({ prefix: e.target.value })} /></div>
            <div className="pe-field-col"><span className="pe-label-sm">Suffix</span><input className="pe-input" value={s.suffix} onChange={(e) => up({ suffix: e.target.value })} /></div>
          </div>
          <div className="pe-row" style={{ marginTop: 10, marginBottom: 0 }}><span className="pe-label pe-w96">Start at</span><NumRaw value={s.startAt} onValue={(v) => up({ startAt: Math.round(v) })} w={70} /><NumRaw value={s.fontSizePt} onValue={(v) => up({ fontSizePt: v })} w={70} /><span className="pe-label-sm">pt</span></div>
        </Section>
      );
    case 'gangsheet':
      return (
        <>
          <Section label="// SHEET" help="Nest target media.">
            <div className="pe-grid2">
              <div className="pe-field-col"><span className="pe-label-sm">Width</span><NumIn valueIn={s.sheetWIn} unit={unit} onIn={(v) => up({ sheetWIn: v })} /></div>
              <div className="pe-field-col"><span className="pe-label-sm">Height</span><NumIn valueIn={s.sheetHIn} unit={unit} onIn={(v) => up({ sheetHIn: v })} /></div>
            </div>
            <div className="pe-row" style={{ marginTop: 10 }}><span className="pe-label pe-w96">Margin</span><NumIn valueIn={s.marginIn} unit={unit} onIn={(v) => up({ marginIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
            <div className="pe-row"><span className="pe-label pe-w96">Spacing</span><NumIn valueIn={s.paddingIn} unit={unit} onIn={(v) => up({ paddingIn: v })} /></div>
            <Check icon="rotate" label="Allow 90° rotation" checked={!!s.allowRotate} onChange={(v) => up({ allowRotate: v })} />
            <Check icon="split" label="Roll media (variable length)" checked={!!s.roll} onChange={(v) => up({ roll: v })} />
            <Check icon="gangsheet" label="True-shape nesting" checked={!!s.trueShape} onChange={(v) => up({ trueShape: v })} />
            <Check icon="duplicate" label="Fill sheet with copies" checked={!!s.fillSheet} onChange={(v) => up({ fillSheet: v })} />
          </Section>
        </>
      );
    case 'stickers':
      return (
        <>
          <Section label="// MEDIA FORMAT" help="Stacked sheets or continuous roll.">
            <div className="pe-cards2">
              <SelCard on={!s.roll} off={!!s.roll} cap="STACKED SHEETS" onClick={() => up({ roll: false })}><Ic name="stickers" size={20} /></SelCard>
              <SelCard on={!!s.roll} off={!s.roll} cap="ROLL OF STICKERS" onClick={() => up({ roll: true })}><Ic name="split" size={20} /></SelCard>
            </div>
          </Section>
          <PaperSize {...{ s, up, unit, onUnit }} />
          <Section label="// REPEAT" help="Fill each sheet, or produce an exact copy count.">
            <Radio label="Fill sheet" on={!!s.fillSheet} onSelect={() => up({ fillSheet: true })} />
            <div className="pe-row">
              <Radio label="Copies" on={!s.fillSheet} onSelect={() => up({ fillSheet: false })} />
              <NumRaw value={s.copies} onValue={(v) => up({ copies: Math.max(1, Math.round(v)), fillSheet: false })} w={70} min={1} />
            </div>
          </Section>
          <Section label="// WHITESPACE" help="Padding between stickers and margins around the block.">
            <div className="pe-row"><span className="pe-label pe-w96">Padding</span><NumIn valueIn={s.paddingIn} unit={unit} onIn={(v) => up({ paddingIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
            <div className="pe-row"><span className="pe-label pe-w96">Margin</span><NumIn valueIn={s.marginTopIn} unit={unit} onIn={(v) => up({ marginTopIn: v, marginLeftIn: v, marginRightIn: v, marginBottomIn: v })} /></div>
          </Section>
          <Section label="// NESTING" help="Allow 90° rotation for tighter packing.">
            <Check icon="rotate" label="Allow rotations (0°, 90°)" checked={!!s.allowRotate} onChange={(v) => up({ allowRotate: v })} />
          </Section>
        </>
      );
    case 'calendar':
      return (
        <>
          <Section label="// PAGE LAYOUT" help="Wall calendars flip the back page so the hung spread reads upright.">
            <Radio label="Full Sheet" on={!s.halfSheet} onSelect={() => up({ halfSheet: false })} />
            <Radio label="Half Sheet" on={!!s.halfSheet} onSelect={() => up({ halfSheet: true })} />
            <Check icon="rotate" label="Rotate back page 180°" sub="Wall-calendar back flip" checked={!!s.rotateBack} onChange={(v) => up({ rotateBack: v })} />
          </Section>
          <MarksSection {...{ s, up, unit, onUnit }} />
        </>
      );
    case 'insertpages':
      return (
        <>
          <Section label="// SOURCE FILE" help="The PDF whose pages get inserted.">
            <button className="pe-chipbtn" onClick={() => pickPdf((bytes, name) => up({ file: bytes, fileName: name }))}>
              <Ic name="upload" size={14} /> {s.fileName || 'Choose file'}
            </button>
          </Section>
          <Section label="// POSITION" help="Where the inserted pages land.">
            <div className="pe-row"><span className="pe-label pe-w96">Insert before page</span><NumRaw value={s.position} onValue={(v) => up({ position: Math.max(1, Math.round(v)), mode: 'at' })} w={70} min={1} /></div>
            <Check label={<span>and after every <b>{s.everyN}</b> pages</span>} checked={s.mode === 'everyN'} onChange={(v) => up({ mode: v ? 'everyN' : 'at' })} />
            {s.mode === 'everyN' && <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Every</span><NumRaw value={s.everyN} onValue={(v) => up({ everyN: Math.max(1, Math.round(v)) })} w={70} min={1} /><span className="pe-label-sm">pages</span></div>}
          </Section>
        </>
      );
    case 'mix':
      return (
        <>
          <Section label="// SECOND DOCUMENT" help="Interleaved after each page of the working document.">
            <button className="pe-chipbtn" onClick={() => pickPdf((bytes, name) => up({ second: bytes, secondName: name }))}>
              <Ic name="upload" size={14} /> {s.secondName || 'Choose PDF'}
            </button>
            <div style={{ marginTop: 10 }}>
              <Check icon="reverse" label="Reverse second document" sub="For scanned backs collected in reverse order" checked={!!s.reverseB} onChange={(v) => up({ reverseB: v })} />
            </div>
          </Section>
          <div className="pe-note" style={{ marginBottom: 12 }}>
            Output order: Doc A page 1, Doc B page 1, Doc A page 2, Doc B page 2… Perfect for merging fronts and backs scanned separately.
          </div>
        </>
      );
    case 'nudge':
      return (
        <>
          <Section label="// PAGES" help="Which pages shift.">
            <input className="pe-input" value={s.pages} onChange={(e) => up({ pages: e.target.value })} />
          </Section>
          <Section label="// ROTATE" help="Tiny rotation correction.">
            <div className="pe-row">
              <button className="pe-chipbtn" onClick={() => up({ rotateDeg: s.rotateDeg - s.rotStepDeg })}>↺</button>
              <button className="pe-chipbtn" onClick={() => up({ rotateDeg: s.rotateDeg + s.rotStepDeg })}>↻</button>
              <span className="pe-label-sm" style={{ marginLeft: 'auto' }}>Current: {s.rotateDeg.toFixed(1)}°</span>
            </div>
            <div className="pe-row" style={{ marginBottom: 0 }}><NumRaw value={s.rotStepDeg} onValue={(v) => up({ rotStepDeg: v })} w={70} /><span className="pe-label-sm">degrees per step</span></div>
          </Section>
          <Section label="// MOVE" help="Cumulative content offset.">
            <div className="pe-nudge-pad">
              <button className="pe-chipbtn" style={{ gridArea: 'up' }} onClick={() => up({ dyIn: s.dyIn + s.stepIn })}>▲</button>
              <button className="pe-chipbtn" style={{ gridArea: 'left' }} onClick={() => up({ dxIn: s.dxIn - s.stepIn })}>◀</button>
              <button className="pe-chipbtn" style={{ gridArea: 'right' }} onClick={() => up({ dxIn: s.dxIn + s.stepIn })}>▶</button>
              <button className="pe-chipbtn" style={{ gridArea: 'down' }} onClick={() => up({ dyIn: s.dyIn - s.stepIn })}>▼</button>
            </div>
            <div className="pe-label-sm" style={{ margin: '8px 0' }}>Cumulative offset: X {fmtIn(s.dxIn, unit)} · Y {fmtIn(s.dyIn, unit)} {unit}</div>
            <div className="pe-row"><span className="pe-label pe-w96">Step</span><NumIn valueIn={s.stepIn} unit={unit} onIn={(v) => up({ stepIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
            <button className="pe-chipbtn" onClick={() => up({ dxIn: 0, dyIn: 0, rotateDeg: 0 })}><Ic name="undo" size={13} /> RESET</button>
          </Section>
        </>
      );
    case 'backdrop':
      return (
        <>
          <Section label="// BACKDROP FILE" help="Drawn behind your existing page content.">
            <button className="pe-chipbtn" onClick={() => pickPdf((bytes, name) => up({ file: bytes, fileName: name }))}>
              <Ic name="upload" size={14} /> {s.fileName || 'Choose File'}
            </button>
          </Section>
          <Section label="// SETTINGS" help="Placement of the backdrop underneath each page.">
            <Check icon="duplicate" label="Repeat across all pages" checked={s.repeat !== false} onChange={(v) => up({ repeat: v })} />
            <div className="pe-grid2">
              <div className="pe-field-col"><span className="pe-label-sm">Offset X (pt)</span><NumRaw value={s.offsetXPt} onValue={(v) => up({ offsetXPt: v })} /></div>
              <div className="pe-field-col"><span className="pe-label-sm">Offset Y (pt)</span><NumRaw value={s.offsetYPt} onValue={(v) => up({ offsetYPt: v })} /></div>
              <div className="pe-field-col"><span className="pe-label-sm">Scale (%)</span><NumRaw value={s.scalePct} onValue={(v) => up({ scalePct: v })} /></div>
              <div className="pe-field-col"><span className="pe-label-sm">Opacity (%)</span><NumRaw value={s.opacity} onValue={(v) => up({ opacity: Math.min(100, Math.max(0, v)) })} /></div>
            </div>
          </Section>
        </>
      );
    case 'coloreffects':
      return (
        <>
          <Section label="// COLOR ADJUSTMENTS" help="Rasterises pages and applies the filter stack.">
            {([['brightness', 'Brightness', 0, 200], ['contrast', 'Contrast', 0, 200], ['saturation', 'Saturation', 0, 200]] as const).map(([k, label, min, max]) => (
              <Slider key={k} label={label} value={s[k]} min={min} max={max} suffix="" onChange={(v) => up({ [k]: v })} />
            ))}
          </Section>
          <Section label="// EFFECTS" help="Grayscale, sepia, invert and hue rotation.">
            {([['grayscale', 'Grayscale', 0, 100, '%'], ['warmTone', 'Warm Tone', 0, 100, '%'], ['invert', 'Invert', 0, 100, '%'], ['hueRotate', 'Hue Rotate', 0, 360, '°']] as const).map(([k, label, min, max, suf]) => (
              <Slider key={k} label={label} value={s[k]} min={min} max={max} suffix={suf} onChange={(v) => up({ [k]: v })} />
            ))}
          </Section>
          <Section label="// OUTPUT QUALITY" help="Pages become images at this resolution.">
            <select className="pe-select" value={s.dpi} onChange={(e) => up({ dpi: +e.target.value })}>
              <option value={150}>150 DPI</option><option value={300}>300 DPI</option><option value={600}>600 DPI</option>
            </select>
          </Section>
          <button className="pe-chipbtn" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
            onClick={() => up({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, warmTone: 0, invert: 0, hueRotate: 0 })}>RESET ALL</button>
        </>
      );
    case 'colormanage':
      return (
        <>
          <Section label="// ICC PROFILE" help="Upload the destination profile (.icc/.icm). With a profile loaded, pixels go through a true LittleCMS proofing transform and the profile is embedded as the PDF OutputIntent.">
            <button className="pe-chipbtn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
              const inp = document.createElement('input');
              inp.type = 'file'; inp.accept = '.icc,.icm';
              inp.onchange = async () => {
                const f = inp.files?.[0]; if (!f) return;
                const bytes = new Uint8Array(await f.arrayBuffer());
                const { iccProfileInfo } = await import('./wasm-engines');
                const info = await iccProfileInfo(bytes);
                up({ icc: bytes, iccName: info?.name || f.name, destProfile: info?.name || f.name });
              };
              inp.click();
            }}><Ic name="upload" size={14} /> {s.iccName ? `✓ ${s.iccName}` : 'UPLOAD ICC PROFILE'}</button>
            {s.icc && <button className="pe-chipbtn" style={{ marginTop: 8 }} onClick={() => up({ icc: null, iccName: '', destProfile: '' })}><Ic name="trash" size={12} /> Remove profile</button>}
            <div className="pe-note">Accepts .icc and .icm. CMYK profiles cannot be bundled due to licensing — upload your own (e.g. FOGRA39, GRACoL 2006, SWOP).</div>
          </Section>
          <Section label="// COLOR TRANSFORM" help={s.icc ? 'True ICC transform via LittleCMS (WASM), rendered per pixel with your chosen intent.' : 'No profile uploaded — falls back to a built-in CMYK gamut approximation.'}>
            <span className="pe-label-sm">Source Profile</span>
            <select className="pe-select" style={{ margin: '5px 0 10px' }} value={s.sourceProfile} onChange={(e) => up({ sourceProfile: e.target.value })}>
              <option>sRGB (built-in)</option><option>Display P3 (approx.)</option>
            </select>
            <span className="pe-label-sm">Destination Profile</span>
            {s.icc ? (
              <input className="pe-input" style={{ margin: '5px 0 10px' }} disabled value={`${s.iccName} (LittleCMS)`} />
            ) : (
              <select className="pe-select" style={{ margin: '5px 0 10px' }} value={s.destProfile} onChange={(e) => up({ destProfile: e.target.value })}>
                <option value="">Select destination…</option><option>FOGRA39 (approx.)</option><option>GRACoL 2006 (approx.)</option><option>SWOP (approx.)</option>
              </select>
            )}
            <span className="pe-label-sm">Rendering Intent</span>
            <select className="pe-select" style={{ margin: '5px 0 10px' }} value={s.intent} onChange={(e) => up({ intent: e.target.value })}>
              <option value="relative">Relative Colorimetric</option><option value="perceptual">Perceptual</option>
              <option value="saturation">Saturation</option><option value="absolute">Absolute Colorimetric</option>
            </select>
            <Check icon="colormanageIc" label="Convert colours (not just tag)" sub="Rewrite pixels toward the CMYK gamut instead of only tagging" checked={!!s.convert} onChange={(v) => up({ convert: v })} />
            <Check icon="droplet" label="Black-point compensation" checked={s.blackPointComp !== false} onChange={(v) => up({ blackPointComp: v })} />
            <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Rasterize DPI</span>
              <select className="pe-select" style={{ width: 110, flex: '0 0 110px' }} value={s.dpi} onChange={(e) => up({ dpi: +e.target.value })}>
                <option value={150}>150</option><option value={300}>300</option><option value={600}>600</option>
              </select>
            </div>
          </Section>
          <Section label="// GAMUT WARNING" help="Paints out-of-gamut pixels bright green in the output.">
            <Check icon="eye" label="Show out-of-gamut colors" checked={!!s.gamutWarning} onChange={(v) => up({ gamutWarning: v })} />
          </Section>
          <div className="pe-note" style={{ marginBottom: 12 }}>
            ⓘ {s.icc
              ? 'Color conversion rasterises each page, transforms pixels through your ICC profile with LittleCMS, re-embeds them and tags the output with the profile as its OutputIntent.'
              : 'Without an uploaded ICC profile this step approximates the CMYK gamut in-browser. Upload a profile above for a true LittleCMS transform.'}
          </div>
        </>
      );
    case 'barcode':
      return (
        <>
          <Section label="// DATA" help="Static text or URL encoded into the symbol.">
            <input className="pe-input pe-mono" value={s.text} onChange={(e) => up({ text: e.target.value })} />
          </Section>
          <Section label="// SYMBOLOGY" help="QR fits URLs/text; Code 128 and EAN-13 are linear retail codes.">
            <select className="pe-select" value={s.symbology} onChange={(e) => up({ symbology: e.target.value })}>
              <option value="qr">QR Code</option><option value="code128">Code 128</option>
              <option value="datamatrix">DataMatrix</option><option value="ean13">EAN-13</option>
            </select>
            <div className="pe-grid2" style={{ marginTop: 10 }}>
              <div className="pe-field-col"><span className="pe-label-sm">Module size (pt)</span><NumRaw value={s.scale} onValue={(v) => up({ scale: Math.max(1, v) })} /></div>
              <div className="pe-field-col"><span className="pe-label-sm">Quiet zone</span><NumRaw value={s.quietZone} onValue={(v) => up({ quietZone: Math.max(0, v) })} /></div>
            </div>
          </Section>
          <Section label="// POSITION" help="Anchor + offsets, like the reference 9-point grid.">
            <div className="pe-anchor-grid">
              {(['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'] as const).map((p2) => (
                <button key={p2} className={`pe-anchor ${s.position === p2 ? 'pe-on' : ''}`} onClick={() => up({ position: p2 })} />
              ))}
            </div>
            <div className="pe-grid2" style={{ marginTop: 10 }}>
              <div className="pe-field-col"><span className="pe-label-sm">X Offset (pt)</span><NumRaw value={s.xOffsetPt} onValue={(v) => up({ xOffsetPt: v })} /></div>
              <div className="pe-field-col"><span className="pe-label-sm">Y Offset (pt)</span><NumRaw value={s.yOffsetPt} onValue={(v) => up({ yOffsetPt: v })} /></div>
            </div>
            <span className="pe-label-sm" style={{ display: 'block', margin: '10px 0 5px' }}>Rotation</span>
            <div className="pe-chipwrap">
              {[0, 90, 180, 270].map((r) => <button key={r} className={`pe-chipbtn ${s.rotationDeg === r ? 'pe-chip-on' : ''}`} onClick={() => up({ rotationDeg: r })}>{r}°</button>)}
            </div>
          </Section>
          <Section label="// APPEARANCE" help="Background + human-readable text.">
            <Check icon="fillbg" label="Transparent background" checked={!!s.transparent} onChange={(v) => up({ transparent: v })} />
            <Check icon="barcodeIc" label="Human-readable text under linear codes" checked={!!s.showText} onChange={(v) => up({ showText: v })} />
            <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Pages</span><input className="pe-input" value={s.pages} onChange={(e) => up({ pages: e.target.value })} /></div>
          </Section>
        </>
      );
    case 'dimensions':
      return (
        <Section label="// DIMENSIONS" help="Labels the exact page sizes with arrows in the margins.">
          <div className="pe-note">Adds width/height dimension callouts (inches + points) to every page — handy on proofs so nobody guesses the trim.</div>
        </Section>
      );
    case 'whitevarnish':
      return (
        <>
          <Section label="// LAYER TYPE" help="White prints under the artwork as a base; varnish coats on top.">
            <div className="pe-cards2">
              <SelCard on={s.layerType === 'white'} off={s.layerType !== 'white'} cap="WHITE" onClick={() => up({ layerType: 'white', spotName: 'White' })}><Ic name="watermark" size={20} /></SelCard>
              <SelCard on={s.layerType === 'varnish'} off={s.layerType !== 'varnish'} cap="VARNISH" onClick={() => up({ layerType: 'varnish', spotName: 'Varnish' })}><Ic name="layers" size={20} /></SelCard>
            </div>
          </Section>
          <Section label="// APPEARANCE" help="Separation name sent to the RIP + coverage.">
            <span className="pe-label-sm">Separation Name</span>
            <input className="pe-input" style={{ margin: '5px 0 10px' }} value={s.spotName} onChange={(e) => up({ spotName: e.target.value })} />
            <Slider label="Coverage" value={Math.round(s.tint * 100)} min={0} max={100} suffix="%" onChange={(v) => up({ tint: v / 100 })} />
          </Section>
          <Section label="// TARGET BOX" help="The area the layer floods.">
            <div className="pe-chipwrap">
              {(['trim', 'bleed', 'flood'] as const).map((c) => (
                <button key={c} className={`pe-chipbtn ${s.coverage === c ? 'pe-chip-on' : ''}`} onClick={() => up({ coverage: c })}>{c === 'flood' ? 'Media' : c[0]!.toUpperCase() + c.slice(1)}</button>
              ))}
            </div>
          </Section>
        </>
      );
    case 'braille':
      return (
        <>
          <Section label="// BRAILLE TEXT" help="Grade-1 (uncontracted) transcription — proof against a certified source before embossing.">
            <input className="pe-input" placeholder="Type text to transcribe..." value={s.text} onChange={(e) => up({ text: e.target.value })} />
          </Section>
          <Section label="// POSITION" help="Corner anchor for the first cell.">
            <div className="pe-chipwrap">
              {([['bl', 'bottom-left'], ['tl', 'top-left']] as const).map(([v, label]) => (
                <button key={v} className={`pe-chipbtn ${s.position === v ? 'pe-chip-on' : ''}`} onClick={() => up({ position: v })}>{label}</button>
              ))}
            </div>
          </Section>
          <Section label="// APPEARANCE" help="Dot diameter (1.5 mm standard).">
            <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Dot size</span><NumRaw value={s.dotDiaPt} onValue={(v) => up({ dotDiaPt: Math.max(1, v) })} w={70} /><span className="pe-label-sm">pt</span></div>
          </Section>
        </>
      );
    case 'preflight':
      return null; // handled in StepPanelBody (needs sourceBytes/pageSizes)
    default:
      return null;
  }
}

function pickPdf(onLoaded: (bytes: Uint8Array, name: string) => void) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/pdf';
  inp.onchange = async () => { const f = inp.files?.[0]; if (f) onLoaded(new Uint8Array(await f.arrayBuffer()), f.name); };
  inp.click();
}
function Slider({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="pe-row" style={{ marginBottom: 4 }}>
        <span className="pe-label-sm" style={{ flex: 1 }}>{label}</span>
        <span className="pe-label-sm pe-mono">{value}{suffix}</span>
      </div>
      <input type="range" className="pe-slider" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

// Live preflight report — runs standard prepress checks on the loaded PDF.
function PreflightPanel({ sourceBytes, pageSizes = [], pageCount = 0 }: PanelProps) {
  const [findings, setFindings] = useState<import('@/lib/imposition-toolkit/preflight').PreflightFinding[] | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!sourceBytes) { setFindings(null); return; }
    let cancelled = false; setLoading(true);
    import('@/lib/imposition-toolkit/preflight')
      .then(({ runPreflight }) => runPreflight(sourceBytes.slice(), pageSizes, pageCount))
      .then((f) => { if (!cancelled) { setFindings(f); setLoading(false); } })
      .catch(() => { if (!cancelled) { setFindings([]); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceBytes, pageCount]);

  const errors = findings?.filter((f) => f.level === 'error').length ?? 0;
  const warns = findings?.filter((f) => f.level === 'warning').length ?? 0;
  const dot = (lvl: string) => lvl === 'error' ? '#ef4444' : lvl === 'warning' ? '#f59e0b' : '#22c55e';
  const label = (lvl: string) => lvl === 'error' ? 'ERROR' : lvl === 'warning' ? 'WARN' : 'PASS';

  return (
    <Section label="// PREFLIGHT" help="Standard prepress checks. Non-destructive — never modifies the file.">
      {!sourceBytes && <div className="pe-note">Add a PDF to run preflight.</div>}
      {sourceBytes && loading && <div className="pe-note">Running preflight checks…</div>}
      {findings && !loading && (
        <>
          <div className="pe-row" style={{ gap: 8, marginBottom: 10 }}>
            <span className="pe-label-sm pe-mono" style={{ color: errors ? '#ef4444' : '#22c55e' }}>{errors} errors</span>
            <span className="pe-label-sm pe-mono" style={{ color: warns ? '#f59e0b' : 'var(--muted)' }}>{warns} warnings</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {findings.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ marginTop: 5, width: 8, height: 8, borderRadius: 4, background: dot(f.level), flex: '0 0 auto' }} />
                <div style={{ minWidth: 0 }}>
                  <div className="pe-label-sm" style={{ fontWeight: 700 }}>
                    <span className="pe-mono" style={{ color: dot(f.level), marginRight: 6 }}>{label(f.level)}</span>{f.title}
                  </div>
                  <div className="pe-label-sm" style={{ color: 'var(--muted)' }}>{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}

// N-Up-driven layout tools (generic + domain presets) all use the N-Up panel.
const NUP_TOOLS = new Set<StepType>([
  'cards', 'grid', 'cutstack', 'perfectbound', 'trading', 'bookmark', 'flyer',
  'business', 'postcard', 'rackcard', 'hangtag', 'label', 'namebadge', 'ticket', 'coupon', 'placecard', 'greeting',
  'doorhanger', 'envelope', 'coaster', 'contact', 'compslip',
  'trifold', 'zfold', 'gatefold', 'menu',
  'poster', 'banner', 'rollbanner', 'featherflag', 'yardsign',
  'boxcarton', 'presfolder',
]);

export function StepPanelBody(props: PanelProps & { type: StepType }) {
  const { type } = props;
  if (type === 'preflight') return <PreflightPanel {...props} />;
  if (type === 'booklet' || type === 'comic' || type === 'magazine' || type === 'catalog'
    || type === 'program' || type === 'notebook' || type === 'hymnal') return <BookletPanel {...props} />;
  if (type === 'zine') return <ZinePanel {...props} />;
  if (NUP_TOOLS.has(type)) {
    const kind = type === 'cards' ? 'cards' : type === 'cutstack' ? 'cutstack' : type === 'perfectbound' ? 'perfectbound' : 'grid';
    return <NUpPanel {...props} kind={kind} />;
  }
  if (type === 'nupbook') return <NUpBookPanel {...props} />;
  if (type === 'colorbar') return <ColorBarPanel {...props} />;
  if (type === 'cuttermarks') return <CutterMarksPanel {...props} />;
  if (type === 'regmarks') return <CutterMarksPanel {...props} lite />;
  if (type === 'gangsheet') return <GangSheetPanel {...props} />;
  if (type === 'customimpose') return <CustomImposePanel {...props} />;
  if (type === 'pdftools') return <PdfToolsPanel {...props} />;
  if (type === 'layers') return <LayersPanel {...props} />;
  return <SimplePanels {...props} type={type} />;
}

// ── Step card (collapsible, reorderable) ─────────────────────────────────────
export function StepCard({ step, index, unit, onUnit, pageCount, thumbs, pageSizes, layerEntries, onToggleLayer, sourceBytes, onChange, onRemove, onMove, onBack, canUp, canDown, single }: {
  step: WorkflowStep; index: number; unit: Unit; onUnit: (u: Unit) => void; pageCount?: number;
  thumbs?: string[]; pageSizes?: { wPt: number; hPt: number }[];
  layerEntries?: LayerEntry[]; onToggleLayer?: (stepId: string) => void; sourceBytes?: Uint8Array | null;
  onChange: (next: WorkflowStep) => void; onRemove: () => void; onMove: (dir: -1 | 1) => void; onBack?: () => void;
  canUp: boolean; canDown: boolean; single?: boolean;
}) {
  const op = findOp(step.type);
  if (!op) return null;
  const up = (patch: StepSettings) => onChange({ ...step, s: { ...step.s, ...patch } });
  return (
    <div className={`pe-stepcard ${step.collapsed ? 'pe-collapsed' : ''}`}>
      {/* Title bar — mirrors the reference: icon + name on the left, reset/help/back on the right */}
      <div className="pe-stephead">
        {!single && (
          <button className="pe-iconbtn" onClick={() => onChange({ ...step, collapsed: !step.collapsed })} title={step.collapsed ? 'Expand' : 'Collapse'}>
            <span style={{ display: 'inline-flex', transform: step.collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}><Ic name="chevron" size={15} /></span>
          </button>
        )}
        <span className="pe-stephead-ic"><Ic name={op.icon} size={17} /></span>
        {!single && <span className="pe-stepno">STEP {index + 1}</span>}
        <span className="pe-steptitle">{op.label}</span>
        <span className="pe-stephead-actions">
          {!single && <>
            <button className="pe-iconbtn" disabled={!canUp} onClick={() => onMove(-1)} title="Move up"><Ic name="chevronup" size={14} /></button>
            <button className="pe-iconbtn" disabled={!canDown} onClick={() => onMove(1)} title="Move down"><Ic name="chevron" size={14} /></button>
          </>}
          <button className="pe-iconbtn" onClick={() => onChange({ ...step, s: defaultSettings(step.type) })} title="Reset step"><Ic name="undo" size={15} /></button>
          <button className="pe-iconbtn" title={op.tip}><Ic name="help" size={15} /></button>
          {single && onBack
            ? <button className="pe-back pe-stephead-back" onClick={onBack} title="Back to tools"><Ic name="back" size={14} /> Back</button>
            : <button className="pe-iconbtn" onClick={onRemove} title="Remove step"><Ic name="close" size={15} /></button>}
        </span>
      </div>
      {!step.collapsed && (
        <>
          <div className="pe-tip"><Ic name="bulb" size={16} /> {op.tip}</div>
          <StepPanelBody type={step.type} s={step.s} up={up} unit={unit} onUnit={onUnit} pageCount={pageCount}
            thumbs={thumbs} pageSizes={pageSizes} layerEntries={layerEntries} onToggleLayer={onToggleLayer} sourceBytes={sourceBytes} />
        </>
      )}
    </div>
  );
}

// ── Choose Operation toolbar bar (lives in the top toolbar's left segment) ───
export function ChooseOperationBar({ title = 'Choose Operation', view, onView, query, onQuery, searching, onSearching, onBrowseTemplates }: {
  title?: string;
  view: 'grid' | 'list';
  onView: (v: 'grid' | 'list') => void;
  query: string;
  onQuery: (q: string) => void;
  searching: boolean;
  onSearching: (v: boolean) => void;
  onBrowseTemplates?: () => void;
}) {
  return (
    <div className="pe-choose-bar">
      {searching ? (
        <input className="pe-choose-search" autoFocus placeholder="Search tools…" value={query}
          onChange={(e) => onQuery(e.target.value)} onBlur={() => { if (!query) onSearching(false); }} />
      ) : (
        <span className="pe-choose-title">{title}</span>
      )}
      <div className="pe-choose-views">
        <button className={`pe-viewbtn ${searching ? 'pe-active' : ''}`} title="Search tools" onClick={() => onSearching(!searching)}><Ic name="search" size={16} /></button>
        <button className={`pe-viewbtn ${view === 'list' ? 'pe-active' : ''}`} title="List view" onClick={() => onView('list')}><Ic name="list" size={16} /></button>
        <button className={`pe-viewbtn ${view === 'grid' ? 'pe-active' : ''}`} title="Icon view" onClick={() => onView('grid')}><Ic name="gridview" size={16} /></button>
        <button className="pe-viewbtn" title="Browse templates" onClick={() => onBrowseTemplates?.()}><Ic name="layers" size={16} /></button>
      </div>
    </div>
  );
}

// ── Choose Operation (tool catalog + customize) ──────────────────────────────
export function ChooseOperation({ onSelect, hidden, onToggleHidden, showTips, view = 'grid', query = '' }: {
  onSelect: (id: StepType) => void;
  hidden: string[];
  onToggleHidden: (id: string, hide: boolean) => void;
  showTips?: boolean;
  view?: 'grid' | 'list';
  query?: string;
}) {
  const [customize, setCustomize] = useState(false);
  const [tip, setTip] = useState(0);
  const match = (label: string) => !query || label.toLowerCase().includes(query.toLowerCase());
  const TIPS = OP_GROUPS.flatMap((g) => g.ops).filter((o) => ['cuttermarks', 'booklet', 'gangsheet', 'colorbar'].includes(o.id));
  return (
    <>
      {showTips && TIPS.length > 0 && (
        <div className="pe-tipcarousel">
          <div className="pe-tipcarousel-head">
            <Ic name="bulb" size={14} /> <b>{TIPS[tip % TIPS.length]!.label}</b>
            <span className="pe-label-sm pe-mono" style={{ marginLeft: 'auto' }}>{(tip % TIPS.length) + 1}/{TIPS.length}</span>
            <button className="pe-iconbtn" onClick={() => setTip((t2) => (t2 + TIPS.length - 1) % TIPS.length)}><Ic name="back" size={12} /></button>
            <button className="pe-iconbtn" style={{ transform: 'scaleX(-1)' }} onClick={() => setTip((t2) => (t2 + 1) % TIPS.length)}><Ic name="back" size={12} /></button>
          </div>
          <div className="pe-label-sm" style={{ lineHeight: 1.5 }}>{TIPS[tip % TIPS.length]!.tip}</div>
        </div>
      )}
      {OP_GROUPS.map((g) => {
        const ops = g.ops.filter((o) => match(o.label) && !hidden.includes(o.id));
        if (!ops.length) return null;
        return (
          <div key={g.label}>
            <div className="pe-group-label">{g.label}</div>
            {view === 'grid' ? (
              <div className="pe-op-grid">
                {ops.map((o) => (
                  <button key={o.id} className="pe-op" onClick={() => onSelect(o.id)}>
                    <span className="pe-op-ic"><Ic name={o.icon} size={22} /></span>
                    <span className="pe-op-label">{o.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="pe-op-list">
                {ops.map((o) => (
                  <button key={o.id} className="pe-op-row" onClick={() => onSelect(o.id)}>
                    <Ic name={o.icon} size={18} />
                    <span>
                      <span className="pe-op-row-name">{o.label}</span>
                      <span className="pe-op-row-desc">{o.tip.replace(/^Use [^ ]+ (to|for) /, '').replace(/^./, (c) => c.toUpperCase())}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button className="pe-customize-head" onClick={() => setCustomize((c) => !c)}>
        <Ic name="settings" size={14} /> CUSTOMIZE TOOLS
        <span style={{ marginLeft: 'auto', display: 'inline-flex', transform: customize ? 'rotate(180deg)' : 'none' }}><Ic name="chevron" size={14} /></span>
      </button>
      {customize && (
        <div className="pe-customize-list">
          {OP_GROUPS.flatMap((g) => g.ops).map((o) => {
            const off = hidden.includes(o.id);
            return (
              <button key={o.id} className="pe-customize-row" onClick={() => onToggleHidden(o.id, !off)}>
                <span className={`pe-eye ${off ? 'pe-eye-off' : ''}`}><Ic name={off ? 'eyeoff' : 'eye'} size={15} /></span>
                <Ic name={o.icon} size={15} />
                <span>{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
