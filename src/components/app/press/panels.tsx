'use client';
import React, { useEffect, useState } from 'react';
import { Icons, OP_GROUPS, findOp, type IconName } from './operations';
import { defaultSettings, type StepSettings, type StepType, type WorkflowStep } from './steps';

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
export function Check({ label, sub, checked, onChange }: { label: React.ReactNode; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <>
      <label className="pe-check">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="pe-box">{checked && <Tick />}</span>
        {label}
      </label>
      {sub && <div className="pe-check-sub">{sub}</div>}
    </>
  );
}
export function Radio({ label, sub, on, onSelect }: { label: React.ReactNode; sub?: string; on: boolean; onSelect: () => void }) {
  return (
    <label className={`pe-radio ${on ? 'pe-on' : ''}`} onClick={onSelect}>
      <input type="radio" checked={on} readOnly />
      <span className="pe-dot"><i /></span>
      <span><div className="pe-radio-main">{label}</div>{sub && <div className="pe-radio-sub">{sub}</div>}</span>
    </label>
  );
}
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
  const name = paperName(wIn, hIn);
  const land = wIn > hIn;
  return (
    <Section label="// PAPER SIZE" help="Output sheet dimensions — the physical paper going through your press.">
      <div className="pe-row">
        <select className="pe-select" value={name} onChange={(e) => {
          const p = PAPERS[e.target.value.replace(' ', '_')];
          if (p) up(land ? { sheetWIn: Math.max(...p), sheetHIn: Math.min(...p) } : { sheetWIn: Math.min(...p), sheetHIn: Math.max(...p) });
        }}>
          {Object.keys(PAPERS).map((k) => <option key={k}>{k.replace('_', ' ')}</option>)}
          <option>Custom</option>
        </select>
        <button className="pe-preset-add" title="Save preset"><Ic name="addstep" size={16} /></button>
      </div>
      <div className="pe-row"><span className="pe-label" style={{ width: 52 }}>Width</span><NumIn valueIn={wIn} unit={unit} onIn={(v) => up(lock ? { sheetWIn: v, sheetHIn: v * (hIn / wIn) } : { sheetWIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      <div className="pe-row"><span className="pe-label" style={{ width: 52 }}>Height</span><NumIn valueIn={hIn} unit={unit} onIn={(v) => up(lock ? { sheetHIn: v, sheetWIn: v * (wIn / hIn) } : { sheetHIn: v })} /><button className="pe-lock" onClick={() => setLock((l) => !l)} title="Lock aspect ratio">{lock ? '🔒' : '🔓'}</button></div>
      <Check label="Landscape" checked={land} onChange={(v) => { const lo = Math.min(wIn, hIn), hi = Math.max(wIn, hIn); up(v ? { sheetWIn: hi, sheetHIn: lo } : { sheetWIn: lo, sheetHIn: hi }); }} />
    </Section>
  );
}

function MarksSection({ s, up, unit, onUnit }: PanelProps) {
  return (
    <Section label="// PRINTER'S MARKS" help="Trim guides and alignment marks outside the live area.">
      <Check label="Draw crop marks" checked={!!s.addMarks} onChange={(v) => up({ addMarks: v })} />
      <Check label="Draw center marks" checked={!!s.centerMarks} onChange={(v) => up({ centerMarks: v })} />
      <div className="pe-row"><span className="pe-label pe-w96">Line length</span><NumIn valueIn={s.markLenIn} unit={unit} onIn={(v) => up({ markLenIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      <div className="pe-row"><span className="pe-label pe-w96">Line thickness</span><NumIn valueIn={(s.markWeightPt ?? 0.25) / 72} unit={unit} onIn={(v) => up({ markWeightPt: v * 72 })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      <div className="pe-row"><span className="pe-label pe-w96">Line distance</span><NumIn valueIn={s.markOffIn} unit={unit} onIn={(v) => up({ markOffIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      <Check label={<span className="pe-check-swatch"><i style={{ background: '#111' }} />Four-color black</span>} checked={!!s.fourColorBlack} onChange={(v) => up({ fourColorBlack: v })} />
      <Check label={<span className="pe-check-swatch"><i className="pe-swatch-ko" />Knockout</span>} checked={!!s.knockout} onChange={(v) => up({ knockout: v })} />
    </Section>
  );
}

function BleedsSection({ s, up, unit, onUnit }: PanelProps) {
  return (
    <Section label="// BLEEDS" help="Where the artwork bleed comes from when placing pages.">
      <Radio label="No bleeds" sub="Cards placed with no bleed extension" on={s.bleedMode === 'none'} onSelect={() => up({ bleedMode: 'none' })} />
      <Radio label="From document" sub="Use bleed info from source PDF" on={s.bleedMode === 'doc'} onSelect={() => up({ bleedMode: 'doc' })} />
      <Radio label="Fixed bleeds" sub="Specify custom bleed amounts" on={s.bleedMode === 'fixed'} onSelect={() => up({ bleedMode: 'fixed' })} />
      {s.bleedMode === 'fixed' && (
        <div className="pe-row" style={{ marginTop: 8 }}><span className="pe-label pe-w96">Bleed</span><NumIn valueIn={s.bleedIn ?? 0.125} unit={unit} onIn={(v) => up({ bleedIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
      )}
    </Section>
  );
}

// ── Per-step panels ──────────────────────────────────────────────────────────
export interface PanelProps {
  s: StepSettings;
  up: (patch: StepSettings) => void;
  unit: Unit;
  onUnit: (u: Unit) => void;
  pageCount?: number;
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
        <Check label="Fill last saddle" checked={s.fillLastSaddle !== false} onChange={(v) => up({ fillLastSaddle: v })} />
        <div className="pe-cards2" style={{ marginTop: 8 }}>
          <SelCard on={!s.rtl} cap="LEFT TO RIGHT" onClick={() => up({ rtl: false })}><Flow arrows="ltr" /></SelCard>
          <SelCard on={!!s.rtl} off={!s.rtl} cap="RIGHT TO LEFT" onClick={() => up({ rtl: true })}><Flow arrows="rtl" /></SelCard>
        </div>
      </Section>
      <Section label="// SCALE" help="How source pages fill each half of the spread.">
        <Check label="Autoscale" checked={s.autoscale !== false} onChange={(v) => up({ autoscale: v })} />
        <Check label="Preserve aspect ratio" checked={s.preserveAspect !== false} onChange={(v) => up({ preserveAspect: v })} />
      </Section>
      <Section label="// WHITE SPACE" help="Margins, spine gutter and creep compensation.">
        <div className="pe-row"><span className="pe-label">Margins:</span><span style={{ flex: 1 }} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <div className="pe-grid2">
          <div className="pe-field-col"><span className="pe-label-sm">Left</span><NumIn valueIn={s.marginIn} unit={unit} onIn={(v) => up({ marginIn: v })} /></div>
          <div className="pe-field-col"><span className="pe-label-sm">Top</span><NumIn valueIn={s.marginTopIn ?? s.marginIn} unit={unit} onIn={(v) => up({ marginTopIn: v })} /></div>
        </div>
        <div className="pe-row" style={{ marginTop: 12 }}><span className="pe-label">Center Gutter</span></div>
        <div className="pe-row"><NumIn valueIn={s.gutterIn} unit={unit} onIn={(v) => up({ gutterIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <div className="pe-row" style={{ marginTop: 8 }}><span className="pe-label">Page Creep</span></div>
        <div className="pe-row"><NumIn valueIn={s.creepIn} unit={unit} onIn={(v) => up({ creepIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <Radio label="Creep Outward" on={s.creepOutward !== false} onSelect={() => up({ creepOutward: true })} />
        <Radio label="Creep Inward" on={s.creepOutward === false} onSelect={() => up({ creepOutward: false })} />
        <div style={{ marginTop: 8 }}>
          <Check label="Center output on page" checked={!!s.centerOutput} onChange={(v) => up({ centerOutput: v })} />
        </div>
      </Section>
      <MarksSection {...p} />
      <BleedsSection {...p} />
      <Section label="// OUTPUT" help="Post-processing applied to the finished spreads.">
        <Check label="Rotate pages" sub="Portrait orientation for office printers" checked={!!s.rotatePages} onChange={(v) => up({ rotatePages: v })} />
      </Section>
    </>
  );
}

function NUpPanel(p: PanelProps & { kind: 'cards' | 'grid' | 'cutstack' }) {
  const { s, up, unit, onUnit, kind } = p;
  return (
    <>
      <PaperSize {...p} />
      {kind === 'grid' && (
        <Section label="// PAGE ORDER" help="Reading direction and fill pattern.">
          <div className="pe-row">
            <select className="pe-select" value={s.order} onChange={(e) => up({ order: e.target.value })}>
              <option value="sequential">Sequential</option><option value="repeat">Step and Repeat</option><option value="cutstack">Cut and Stack</option>
            </select>
            <Check label="Double Sided" checked={!!s.duplex} onChange={(v) => up({ duplex: v })} />
          </div>
        </Section>
      )}
      <Section label="// LAYOUT" help="Rows, columns and scaling.">
        <Check label="Autoscale" checked={s.autoscale !== false} onChange={(v) => up({ autoscale: v })} />
        <Check label="Preserve aspect ratio" checked={s.preserveAspect !== false} onChange={(v) => up({ preserveAspect: v })} />
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
        <div className="pe-row"><span className="pe-label">Margins:</span><span style={{ flex: 1 }} /><UnitSel unit={unit} onChange={onUnit} /></div>
        <div className="pe-row"><NumIn valueIn={s.marginIn} unit={unit} onIn={(v) => up({ marginIn: v })} /></div>
        <div className="pe-row" style={{ marginTop: 8 }}><span className="pe-label">Gutters:</span></div>
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
        <Check label="Spot colors" checked={!!s.spotColors} onChange={(v) => up({ spotColors: v })} />
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
          <Check label="Repeat" checked={!!s.repeat} onChange={(v) => up({ repeat: v })} />
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
            <Check label="Add dielines" checked={!!s.addDielines} onChange={(v) => up({ addDielines: v })} />
          </Section>
          <Section label="// ARTWORK" help="Marks-only output for cutter-side file separation.">
            <Check label="Remove artwork (create a cut-marks only file)" checked={!!s.removeArtwork} onChange={(v) => up({ removeArtwork: v })} />
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
    case 'distort':
      return (
        <Section label="// DISTORTION" help="Flexo plate distortion compensation.">
          <div className="pe-row"><span className="pe-label pe-w96">Factor</span><NumRaw value={s.factorPct} onValue={(v) => up({ factorPct: v })} w={90} /><span className="pe-label-sm">%</span></div>
          <select className="pe-select" value={s.direction} onChange={(e) => up({ direction: e.target.value })}>
            <option value="circ">Circumferential (height)</option><option value="cross">Cross-web (width)</option><option value="both">Both</option>
          </select>
        </Section>
      );
    case 'bleed':
      return (
        <Section label="// BLEED" help="Scales content outward to fabricate bleed; trim recorded in TrimBox.">
          <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Bleed</span><NumIn valueIn={s.bleedIn} unit={unit} onIn={(v) => up({ bleedIn: v })} /><UnitSel unit={unit} onChange={onUnit} /></div>
        </Section>
      );
    case 'headerfooter':
      return (
        <Section label="// TEXT BANDS" help="Running header and footer.">
          <span className="pe-label-sm">Header</span>
          <input className="pe-input" style={{ margin: '5px 0 10px' }} value={s.header} onChange={(e) => up({ header: e.target.value })} />
          <span className="pe-label-sm">Footer</span>
          <input className="pe-input" style={{ margin: '5px 0 10px' }} value={s.footer} onChange={(e) => up({ footer: e.target.value })} />
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
        <Section label="// SLUG" help="Thin job-info strip. Tokens: [file-name] [date] [time] [page] [page-count]">
          <input className="pe-input" value={s.text} onChange={(e) => up({ text: e.target.value })} />
          <div className="pe-row" style={{ marginTop: 10, marginBottom: 0 }}>
            <select className="pe-select" value={s.position} onChange={(e) => up({ position: e.target.value })}>
              <option value="bottom">Bottom</option><option value="top">Top</option>
            </select>
            <NumRaw value={s.fontSizePt} onValue={(v) => up({ fontSizePt: v })} w={70} /><span className="pe-label-sm">pt</span>
          </div>
        </Section>
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
        <Section label="// WATERMARK" help="Diagonal text stamp across every page.">
          <input className="pe-input" value={s.text} onChange={(e) => up({ text: e.target.value })} />
          <div className="pe-row" style={{ marginTop: 10 }}><span className="pe-label pe-w96">Opacity</span><NumRaw value={Math.round(s.opacity * 100)} onValue={(v) => up({ opacity: Math.min(100, Math.max(1, v)) / 100 })} w={70} /><span className="pe-label-sm">%</span></div>
          <div className="pe-row" style={{ marginBottom: 0 }}><span className="pe-label pe-w96">Angle</span><NumRaw value={s.angleDeg} onValue={(v) => up({ angleDeg: v })} w={70} /><span className="pe-label-sm">°</span><NumRaw value={s.fontSizePt} onValue={(v) => up({ fontSizePt: v })} w={70} /><span className="pe-label-sm">pt</span></div>
        </Section>
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
            <Check label="Allow 90° rotation" checked={!!s.allowRotate} onChange={(v) => up({ allowRotate: v })} />
            <Check label="Roll media (variable length)" checked={!!s.roll} onChange={(v) => up({ roll: v })} />
            <Check label="True-shape nesting" checked={!!s.trueShape} onChange={(v) => up({ trueShape: v })} />
            <Check label="Fill sheet with copies" checked={!!s.fillSheet} onChange={(v) => up({ fillSheet: v })} />
          </Section>
        </>
      );
    case 'preflight':
      return (
        <Section label="// PREFLIGHT" help="Non-destructive inspection of the current pipeline input.">
          <div className="pe-note">The report opens in the Job Info panel once a PDF is loaded. This step never modifies the file.</div>
        </Section>
      );
    default:
      return null;
  }
}

export function StepPanelBody(props: PanelProps & { type: StepType }) {
  const { type } = props;
  if (type === 'booklet' || type === 'zine') return <BookletPanel {...props} />;
  if (type === 'cards' || type === 'grid' || type === 'cutstack') return <NUpPanel {...props} kind={type} />;
  if (type === 'nupbook') return <NUpBookPanel {...props} />;
  if (type === 'colorbar') return <ColorBarPanel {...props} />;
  if (type === 'cuttermarks') return <CutterMarksPanel {...props} />;
  if (type === 'regmarks') return <CutterMarksPanel {...props} lite />;
  return <SimplePanels {...props} type={type} />;
}

// ── Step card (collapsible, reorderable) ─────────────────────────────────────
export function StepCard({ step, index, unit, onUnit, pageCount, onChange, onRemove, onMove, canUp, canDown }: {
  step: WorkflowStep; index: number; unit: Unit; onUnit: (u: Unit) => void; pageCount?: number;
  onChange: (next: WorkflowStep) => void; onRemove: () => void; onMove: (dir: -1 | 1) => void;
  canUp: boolean; canDown: boolean;
}) {
  const op = findOp(step.type);
  if (!op) return null;
  const up = (patch: StepSettings) => onChange({ ...step, s: { ...step.s, ...patch } });
  return (
    <div className={`pe-stepcard ${step.collapsed ? 'pe-collapsed' : ''}`}>
      <div className="pe-stephead">
        <button className="pe-iconbtn" onClick={() => onChange({ ...step, collapsed: !step.collapsed })} title={step.collapsed ? 'Expand' : 'Collapse'}>
          <span style={{ display: 'inline-flex', transform: step.collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}><Ic name="chevron" size={15} /></span>
        </button>
        <Ic name={op.icon} size={17} />
        <span className="pe-stepno">STEP {index + 1}</span>
        <span className="pe-steptitle">{op.label}</span>
        <span className="pe-stephead-actions">
          <button className="pe-iconbtn" disabled={!canUp} onClick={() => onMove(-1)} title="Move up"><Ic name="chevronup" size={14} /></button>
          <button className="pe-iconbtn" disabled={!canDown} onClick={() => onMove(1)} title="Move down"><Ic name="chevron" size={14} /></button>
          <button className="pe-iconbtn" onClick={() => onChange({ ...step, s: defaultSettings(step.type) })} title="Reset step"><Ic name="undo" size={14} /></button>
          <button className="pe-iconbtn" title={op.tip}><Ic name="help" size={14} /></button>
          <button className="pe-iconbtn" onClick={onRemove} title="Remove step"><Ic name="close" size={14} /></button>
        </span>
      </div>
      {!step.collapsed && (
        <>
          <div className="pe-tip"><Ic name="bulb" size={16} /> {op.tip}</div>
          <StepPanelBody type={step.type} s={step.s} up={up} unit={unit} onUnit={onUnit} pageCount={pageCount} />
        </>
      )}
    </div>
  );
}

// ── Choose Operation (tool catalog + customize) ──────────────────────────────
export function ChooseOperation({ onSelect, hidden, onToggleHidden, title = 'Choose Operation' }: {
  onSelect: (id: StepType) => void;
  hidden: string[];
  onToggleHidden: (id: string, hide: boolean) => void;
  title?: string;
}) {
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [customize, setCustomize] = useState(false);
  const match = (label: string) => !q || label.toLowerCase().includes(q.toLowerCase());
  return (
    <>
      <div className="pe-choose-head">
        {searching ? (
          <input className="pe-input" autoFocus placeholder="Search tools…" value={q}
            onChange={(e) => setQ(e.target.value)} onBlur={() => { if (!q) setSearching(false); }} />
        ) : (
          <span className="pe-choose-title">{title}</span>
        )}
        <div className="pe-choose-views">
          <button className="pe-iconbtn" title="Search" onClick={() => setSearching((s) => !s)}><Ic name="search" size={16} /></button>
          <button className="pe-iconbtn pe-active" title="Grid"><Ic name="gridview" size={16} /></button>
        </div>
      </div>
      {OP_GROUPS.map((g) => {
        const ops = g.ops.filter((o) => match(o.label) && !hidden.includes(o.id));
        if (!ops.length) return null;
        return (
          <div key={g.label}>
            <div className="pe-group-label">{g.label}</div>
            <div className="pe-op-grid">
              {ops.map((o) => (
                <button key={o.id} className="pe-op" onClick={() => onSelect(o.id)}>
                  <span className="pe-op-ic"><Ic name={o.icon} size={22} /></span>
                  <span className="pe-op-label">{o.label}</span>
                </button>
              ))}
            </div>
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
