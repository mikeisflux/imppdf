'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  getPdfInfo, computeNUpGrid, imposeNUp, imposeBooklet, imposeNUpBook,
  shufflePages, rotatePdf, flipPdf, mergePdfs, splitPdf, downloadPdf, downloadFile,
} from '@/lib/imposition-toolkit/impose';
import type { NUpOptions, BookletOptions, NUpBookOptions, PdfPageInfo } from '@/lib/imposition-toolkit/impose';
import { rasterizePdfThumbs } from '@/lib/imposition-toolkit/page-thumbs';
import { Icons, OP_GROUPS, findOp, type OpDef } from './operations';
import './press.css';

// ── Units & paper presets ────────────────────────────────────────────────────
type Unit = 'in' | 'mm' | 'pt';
const toIn = (v: number, u: Unit) => (u === 'mm' ? v / 25.4 : u === 'pt' ? v / 72 : v);
const fromIn = (v: number, u: Unit) => (u === 'mm' ? v * 25.4 : u === 'pt' ? v * 72 : v);
const fmt = (inch: number, u: Unit) => {
  const v = fromIn(inch, u);
  return u === 'pt' ? String(Math.round(v)) : (Math.round(v * 100) / 100).toString();
};
const PAPERS: Record<string, [number, number]> = {
  Letter: [8.5, 11], Legal: [8.5, 14], Tabloid: [11, 17],
  A4: [8.27, 11.69], A3: [11.69, 16.54], A5: [5.83, 8.27], SRA3: [12.6, 17.72],
};
function paperName(wIn: number, hIn: number): string {
  for (const [k, [w, h]] of Object.entries(PAPERS)) {
    if ((Math.abs(w - wIn) < 0.05 && Math.abs(h - hIn) < 0.05) || (Math.abs(h - wIn) < 0.05 && Math.abs(w - hIn) < 0.05)) return k;
  }
  return 'Custom';
}
const PAGE_COLORS = ['#e5484d', '#3fb950', '#4361ee', '#f5d90a', '#c74bc2', '#22c3c3', '#f0883e', '#7d7d7d'];

interface LoadedFile { name: string; bytes: Uint8Array; info: PdfPageInfo; }
type Status = 'idle' | 'processing' | 'done' | 'error';

// ── Sheet geometry (preview) ─────────────────────────────────────────────────
interface PCell { n: number; blank: boolean; rot?: boolean; }
interface Sheet { wIn: number; hIn: number; cols: number; rows: number; cells: PCell[]; }

function buildSheets(engine: string, nup: NUpOptions, booklet: BookletOptions, nupbook: NUpBookOptions, stepRep: boolean, pageCount: number): Sheet[] {
  const N = Math.max(1, pageCount);
  if (engine === 'booklet') {
    const sig = booklet.signatureSheets && booklet.signatureSheets > 0 ? booklet.signatureSheets * 4 : Math.ceil(N / 4) * 4;
    const sides = sig / 2;
    const sheets: Sheet[] = [];
    const start = 0;
    for (let s = 0; s < Math.ceil(N / sig) * sides; s++) {
      const k = Math.floor(s / 2);
      const isBack = s % 2 === 1;
      let L: number, R: number;
      if (!isBack) { L = sig - k * 2; R = k * 2 + 1; } else { L = k * 2 + 2; R = sig - k * 2 - 1; }
      if (booklet.rtl) { const t = L; L = R; R = t; }
      const gp = (p: number) => start + p;
      sheets.push({ wIn: 11, hIn: 8.5, cols: 2, rows: 1, cells: [
        { n: gp(L), blank: gp(L) > N || gp(L) < 1 }, { n: gp(R), blank: gp(R) > N || gp(R) < 1 },
      ] });
    }
    return sheets;
  }
  if (engine === 'nupbook') {
    // Quarto 4-up: top row rotated 180°.
    const sigPages = 8, numSigs = Math.ceil(N / sigPages);
    const sheets: Sheet[] = [];
    for (let si = 0; si < numSigs * 2; si++) {
      const sigNo = Math.floor(si / 2), isBack = si % 2 === 1;
      const FRONT: [number, number, number][] = [[5, 0, 0], [4, 0, 1], [8, 1, 0], [1, 1, 1]];
      const BACK: [number, number, number][] = [[3, 0, 0], [6, 0, 1], [2, 1, 0], [7, 1, 1]];
      const cells: PCell[] = [];
      for (const [p, r, c] of (isBack ? BACK : FRONT)) {
        const gp = sigNo * sigPages + p; const cc = nupbook.rtl ? 1 - c : c;
        void cc;
        cells[r * 2 + (nupbook.rtl ? 1 - c : c)] = { n: gp, blank: gp > N, rot: r === 0 };
      }
      sheets.push({ wIn: nupbook.sheetWIn, hIn: nupbook.sheetHIn, cols: 2, rows: 2, cells });
    }
    return sheets;
  }
  // nup family
  const g = computeNUpGrid(nup);
  const perSheet = g.cols * g.rows;
  const sheets: Sheet[] = [];
  if (engine === 'cards' || (engine === 'grid' && stepRep)) {
    for (let p = 1; p <= N; p++) {
      sheets.push({ wIn: nup.sheetWIn, hIn: nup.sheetHIn, cols: g.cols, rows: g.rows, cells: Array.from({ length: perSheet }, () => ({ n: p, blank: false })) });
    }
    return sheets;
  }
  const total = Math.ceil(N / perSheet);
  for (let si = 0; si < total; si++) {
    const cells: PCell[] = [];
    for (let i = 0; i < perSheet; i++) {
      const cellIdx = i;
      const itemIdx = engine === 'cutstack' ? cellIdx * total + si : si * perSheet + cellIdx;
      const pg = itemIdx + 1;
      cells.push({ n: pg, blank: pg > N });
    }
    sheets.push({ wIn: nup.sheetWIn, hIn: nup.sheetHIn, cols: g.cols, rows: g.rows, cells });
  }
  return sheets;
}

// ── Small UI atoms ───────────────────────────────────────────────────────────
function Ic({ name, size = 20 }: { name: keyof typeof Icons; size?: number }) {
  const C = Icons[name] as (p: Record<string, unknown>) => React.ReactElement;
  return C({ width: size, height: size });
}
function Section({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
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
function Check({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <>
      <label className="pe-check">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="pe-box"><Ic name="close" size={0} />{checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L19 6" /></svg>}</span>
        {label}
      </label>
      {sub && <div className="pe-check-sub">{sub}</div>}
    </>
  );
}
function Radio({ label, sub, on, onSelect }: { label: string; sub?: string; on: boolean; onSelect: () => void }) {
  return (
    <label className={`pe-radio ${on ? 'pe-on' : ''}`} onClick={onSelect}>
      <input type="radio" checked={on} readOnly />
      <span className="pe-dot"><i /></span>
      <span><div className="pe-radio-main">{label}</div>{sub && <div className="pe-radio-sub">{sub}</div>}</span>
    </label>
  );
}
function UnitSelect({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  return (
    <select className="pe-select pe-unit" value={unit} onChange={(e) => onChange(e.target.value as Unit)}>
      <option value="in">in</option><option value="mm">mm</option><option value="pt">pt</option>
    </select>
  );
}
function NumIn({ valueIn, unit, onIn, step }: { valueIn: number; unit: Unit; onIn: (v: number) => void; step?: number }) {
  const [txt, setTxt] = useState(fmt(valueIn, unit));
  useEffect(() => { setTxt(fmt(valueIn, unit)); }, [valueIn, unit]);
  return (
    <input className="pe-input pe-num" inputMode="decimal" value={txt} step={step}
      onChange={(e) => { setTxt(e.target.value); const v = parseFloat(e.target.value); if (!Number.isNaN(v)) onIn(toIn(v, unit)); }} />
  );
}
function SelCard({ on, off, cap, children, onClick }: { on?: boolean; off?: boolean; cap: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div className={`pe-selcard ${on ? 'pe-on' : ''} ${off ? 'pe-off' : ''}`} onClick={onClick}>
      {children}
      <span className="pe-selcard-cap">{cap}</span>
    </div>
  );
}
function PaperSizeSection({ wIn, hIn, unit, onUnit, onSize }: { wIn: number; hIn: number; unit: Unit; onUnit: (u: Unit) => void; onSize: (w: number, h: number) => void }) {
  const [lock, setLock] = useState(false);
  const name = paperName(wIn, hIn);
  const land = wIn > hIn;
  return (
    <Section label="// PAPER SIZE" help="Output sheet dimensions — the physical paper going through your press.">
      <div className="pe-row">
        <select className="pe-select" value={name} onChange={(e) => { const p = PAPERS[e.target.value]; if (p) onSize(land ? Math.max(...p) : Math.min(...p), land ? Math.min(...p) : Math.max(...p)); }}>
          {Object.keys(PAPERS).map((k) => <option key={k}>{k}</option>)}
          <option>Custom</option>
        </select>
        <button className="pe-preset-add" title="Save preset"><Ic name="addstep" size={16} /></button>
      </div>
      <div className="pe-row"><span className="pe-label" style={{ width: 52 }}>Width</span><NumIn valueIn={wIn} unit={unit} onIn={(v) => onSize(v, hIn)} /><UnitSelect unit={unit} onChange={onUnit} /></div>
      <div className="pe-row"><span className="pe-label" style={{ width: 52 }}>Height</span><NumIn valueIn={hIn} unit={unit} onIn={(v) => onSize(lock ? v * (wIn / hIn) : wIn, v)} /><button className="pe-lock" onClick={() => setLock((l) => !l)} title="Lock aspect">{lock ? '🔒' : '🔓'}</button></div>
      <Check label="Landscape" checked={land} onChange={(v) => { const lo = Math.min(wIn, hIn), hi = Math.max(wIn, hIn); onSize(v ? hi : lo, v ? lo : hi); }} />
    </Section>
  );
}
function WhiteSpaceSection({ marginIn, gutterIn, unit, onUnit, onMargin, onGutter, gutterLabel = 'Gutters:' }: { marginIn: number; gutterIn: number; unit: Unit; onUnit: (u: Unit) => void; onMargin: (v: number) => void; onGutter: (v: number) => void; gutterLabel?: string }) {
  return (
    <Section label="// WHITE SPACE" help="Margins around the sheet edge and gutters between items.">
      <div className="pe-row"><span className="pe-label">Margins:</span><span style={{ flex: 1 }} /><UnitSelect unit={unit} onChange={onUnit} /></div>
      <div className="pe-grid2">
        <div className="pe-field-col"><span className="pe-label-sm">Left</span><NumIn valueIn={marginIn} unit={unit} onIn={onMargin} /></div>
        <div className="pe-field-col"><span className="pe-label-sm">Top</span><NumIn valueIn={marginIn} unit={unit} onIn={onMargin} /></div>
      </div>
      <div className="pe-row" style={{ marginTop: 10 }}><span className="pe-label">{gutterLabel}</span></div>
      <div className="pe-grid2">
        <div className="pe-field-col"><span className="pe-label-sm">Horizontal</span><NumIn valueIn={gutterIn} unit={unit} onIn={onGutter} /></div>
        <div className="pe-field-col"><span className="pe-label-sm">Vertical</span><NumIn valueIn={gutterIn} unit={unit} onIn={onGutter} /></div>
      </div>
    </Section>
  );
}

// ── The editor ───────────────────────────────────────────────────────────────
export interface PressUsage { authenticated: boolean; isPro: boolean; remaining: number; limit: number; }
export function PressEditor({ initialOp, usage, onUpgrade, onSignIn }: {
  initialOp?: string | null; usage?: PressUsage; onUpgrade?: React.ReactNode; onSignIn?: React.ReactNode;
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [unit, setUnit] = useState<Unit>('mm');
  const [activeOp, setActiveOp] = useState<string | null>(initialOp ?? null);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [nup, setNup] = useState<NUpOptions>({ cols: 2, rows: 2, sheetWIn: 8.5, sheetHIn: 11, marginIn: 0.2, gutterIn: 0, repeatFirst: false, addMarks: false, markLenIn: 0.25, markOffIn: 0.125 });
  const [booklet, setBooklet] = useState<BookletOptions>({ rtl: false, marginIn: 0.2, gutterIn: 0.2, creepIn: 0, addMarks: false, markLenIn: 0.25, markOffIn: 0.125 });
  const [nupbook, setNupbook] = useState<NUpBookOptions>({ nUp: 4, sheetWIn: 11, sheetHIn: 17, marginIn: 0.2, gutterIn: 0, creepIn: 0, rtl: false, signatureSheets: 4, addMarks: false, markLenIn: 0.25, markOffIn: 0.125 });
  const [stepRep, setStepRep] = useState(false);
  const [autoscale, setAutoscale] = useState(true);
  const [preserveAR, setPreserveAR] = useState(true);
  const [bleedMode, setBleedMode] = useState<'none' | 'doc' | 'fixed'>('doc');
  const [drawMarks, setDrawMarks] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState('all');
  const [rotateDeg, setRotateDeg] = useState(90);
  const [flipDir, setFlipDir] = useState<'h' | 'v'>('h');
  const [splitRanges, setSplitRanges] = useState('1-1');
  const [mergeFiles, setMergeFiles] = useState<LoadedFile[]>([]);

  const op = findOp(activeOp);

  useEffect(() => { setActiveOp(initialOp ?? null); }, [initialOp]);

  // Rasterise pages for the preview.
  useEffect(() => {
    let cancelled = false;
    if (!file) { setThumbs([]); return; }
    setThumbs([]);
    rasterizePdfThumbs(file.bytes).then((t) => { if (!cancelled) setThumbs(t); }).catch(() => {});
    return () => { cancelled = true; };
  }, [file]);

  const loadFile = useCallback(async (f: File) => {
    setStatus('idle');
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const info = await getPdfInfo(bytes);
      setFile({ name: f.name, bytes, info });
      setSplitRanges(`1-${info.count}`);
    } catch { setStatus('error'); }
  }, []);
  const onPick = (files: FileList | null) => { const f = files?.[0]; if (f) void loadFile(f); };

  const pageCount = file?.info.count ?? 0;
  const sheets = useMemo(() => (file && op ? buildSheets(op.engine, { ...nup, addMarks: drawMarks }, { ...booklet, addMarks: drawMarks }, { ...nupbook, addMarks: drawMarks }, stepRep, pageCount) : []), [file, op, nup, booklet, nupbook, stepRep, drawMarks, pageCount]);

  async function runEngine(): Promise<{ bytes: Uint8Array; name: string } | { multi: Uint8Array[]; base: string } | null> {
    if (!file || !op) return null;
    const b = file.bytes; const base = file.name.replace(/\.pdf$/i, '');
    switch (op.engine) {
      case 'cards': return { bytes: await imposeNUp(b, { ...nup, addMarks: drawMarks, repeatFirst: true }), name: `${base}-cards.pdf` };
      case 'grid': return { bytes: await imposeNUp(b, { ...nup, addMarks: drawMarks, repeatFirst: stepRep }), name: `${base}-grid.pdf` };
      case 'cutstack': return { bytes: await imposeNUp(b, { ...nup, addMarks: drawMarks, cutStack: true }), name: `${base}-cutstack.pdf` };
      case 'booklet': return { bytes: await imposeBooklet(b, { ...booklet, addMarks: drawMarks }), name: `${base}-booklet.pdf` };
      case 'nupbook': return { bytes: await imposeNUpBook(b, { ...nupbook, addMarks: drawMarks }), name: `${base}-nupbook.pdf` };
      case 'shuffle': return { bytes: await shufflePages(b, shuffleOrder), name: `${base}-shuffled.pdf` };
      case 'rotate': return { bytes: await rotatePdf(b, rotateDeg), name: `${base}-rotated.pdf` };
      case 'flip': return { bytes: await flipPdf(b, flipDir), name: `${base}-flipped.pdf` };
      case 'merge': return { bytes: await mergePdfs([b, ...mergeFiles.map((m) => m.bytes)]), name: `${base}-merged.pdf` };
      case 'split': return { multi: await splitPdf(b, splitRanges), base };
    }
    void imposeNUp; void nup;
    return null;
  }
  async function doDownload() {
    if (!file || status === 'processing') return;
    setStatus('processing');
    try {
      const r = await runEngine();
      if (!r) { setStatus('error'); return; }
      if ('multi' in r) { r.multi.forEach((bytes, i) => downloadFile(bytes, `${r.base}-${i + 1}.pdf`, 'application/pdf')); }
      else downloadPdf(r.bytes, r.name);
      setStatus('done'); setTimeout(() => setStatus('idle'), 2000);
    } catch { setStatus('error'); }
  }

  const sheetName = paperName(nup.sheetWIn, nup.sheetHIn);
  const pillW = op?.engine === 'booklet' ? 11 : op?.engine === 'nupbook' ? nupbook.sheetWIn : nup.sheetWIn;
  const pillH = op?.engine === 'booklet' ? 8.5 : op?.engine === 'nupbook' ? nupbook.sheetHIn : nup.sheetHIn;

  return (
    <div className={`pe ${theme === 'dark' ? 'pe-dark' : ''}`}>
      {/* App bar */}
      <div className="pe-appbar">
        <div className="pe-brand"><span className="pe-brand-mark"><Ic name="gridview" size={15} /></span>ImpositionPDF</div>
        <button className="pe-filemenu">File <Ic name="chevron" size={14} /></button>
        <div className="pe-appbar-right">
          {usage && (usage.isPro ? <span className="pe-usage pe-pro">✦ Pro · unlimited</span> : <span className="pe-usage">{usage.remaining} free download{usage.remaining === 1 ? '' : 's'} left</span>)}
          {onUpgrade}
          {onSignIn ?? <span className="pe-signin"><Ic name="user" size={16} /> Sign In</span>}
          {file && <span className="pe-filepill"><Ic name="file" size={15} /><span className="pe-filename">{file.name}</span><Ic name="chevron" size={14} /></span>}
          <button className="pe-iconbtn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} title="Toggle theme">{theme === 'dark' ? '☀' : '☾'}</button>
          <span className="pe-lang"><Ic name="globe" size={16} /> EN</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="pe-toolbar">
        <button className="pe-iconbtn" title="Search"><Ic name="search" size={18} /></button>
        <button className="pe-iconbtn" title="List view"><Ic name="list" size={18} /></button>
        <button className="pe-iconbtn pe-active" title="Grid view"><Ic name="gridview" size={18} /></button>
        <button className="pe-iconbtn" title="Layers"><Ic name="layers" size={18} /></button>
        <button className="pe-iconbtn" title="Sort"><Ic name="sort" size={18} /></button>
        <span className="pe-tb-div" />
        <button className="pe-iconbtn" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} title="Zoom in"><Ic name="zoomin" size={18} /></button>
        <button className="pe-iconbtn" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))} title="Zoom out"><Ic name="zoomout" size={18} /></button>
        <button className="pe-iconbtn" title="Spreads"><Ic name="spreads" size={18} /></button>
        <button className="pe-iconbtn" title="Page numbers"><Ic name="hash" size={18} /></button>
        <button className="pe-iconbtn" title="Layers"><Ic name="layers" size={18} /></button>
        <button className="pe-iconbtn" title="Grid"><Ic name="grid" size={18} /></button>
        <button className="pe-iconbtn" title="Checklist"><Ic name="batch" size={18} /></button>
        <button className="pe-iconbtn" title="Settings"><Ic name="settings" size={18} /></button>
        <button className="pe-iconbtn" title="Info"><Ic name="info" size={18} /></button>
        <button className="pe-iconbtn" title="Split view"><Ic name="columns" size={18} /></button>
        <span className="pe-tb-chip"><Ic name="jdf" size={16} /> JDF</span>
        <span className="pe-tb-chip"><Ic name="batch" size={16} /> BATCH</span>
        <div className="pe-tb-right">
          <button className="pe-btn pe-btn-print" disabled={!file} onClick={doDownload}><Ic name="print" size={16} /> Print</button>
          <button className="pe-btn pe-btn-dl" disabled={!file || status === 'processing'} onClick={doDownload}>
            <Ic name="download" size={16} /> {status === 'processing' ? '…' : status === 'done' ? 'Saved ✓' : 'Download'}
          </button>
          <button className="pe-iconbtn" title="Close" onClick={() => setActiveOp(null)}><Ic name="close" size={18} /></button>
        </div>
      </div>

      {/* Body */}
      <div className="pe-body">
        <aside className="pe-side">
          {!op ? (
            <ChooseOperation onSelect={setActiveOp} />
          ) : (
            <>
              <div className="pe-panel-head">
                <div className="pe-panel-title"><Ic name={op.icon} size={20} />{op.label}</div>
                <div className="pe-panel-head-actions">
                  <button className="pe-iconbtn" title="Reset"><Ic name="undo" size={16} /></button>
                  <button className="pe-iconbtn" title="Help"><Ic name="help" size={16} /></button>
                  <button className="pe-back" onClick={() => setActiveOp(null)}><Ic name="back" size={14} /> Back</button>
                </div>
              </div>
              <div className="pe-tip"><Ic name="bulb" size={16} /> {op.tip}</div>
              {renderPanel(op)}
              <div className="pe-panel-foot">
                <button className="pe-foot-btn pe-foot-add"><Ic name="addstep" size={15} /> ADD STEP</button>
                <button className="pe-foot-btn pe-foot-save"><Ic name="save" size={15} /> SAVE WORKFLOW</button>
              </div>
            </>
          )}
        </aside>

        <main className="pe-canvas-wrap"
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(e.dataTransfer.files); }}>
          {!file ? (
            <div className={`pe-drop ${drag ? 'pe-dragging' : ''}`}>
              <Ic name="download" size={40} />
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--pe-ink)' }}>Drop a PDF to start</div>
              <div style={{ fontSize: 13 }}>Processed locally — nothing is uploaded.</div>
              <button className="pe-drop-btn" onClick={() => inputRef.current?.click()}>Choose PDF</button>
              <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => onPick(e.target.files)} />
            </div>
          ) : !op ? (
            <div className="pe-drop"><div style={{ fontSize: 15, color: 'var(--pe-muted)' }}>Choose an operation from the left to begin.</div></div>
          ) : (
            <SheetCanvas sheets={sheets} thumbs={thumbs} zoom={zoom} />
          )}

          {file && op && (
            <div className="pe-pill">
              <Ic name="file" size={14} /> <b>PAGE 1</b>
              <span className="pe-pill-badge">{sheetName.toUpperCase()}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span className="pe-violet-dot">⤢</span>
              <b>{fmt(pillW, unit)} × {fmt(pillH, unit)}</b> <span style={{ opacity: 0.6 }}>{unit}</span>
              <Ic name="info" size={13} />
            </div>
          )}
          {file && <span className="pe-avatar pe-avatar-loose">{usage?.authenticated ? 'U' : 'N'}</span>}
        </main>
      </div>
    </div>
  );

  // ── Panel renderer ──────────────────────────────────────────────────────────
  function renderPanel(o: OpDef): React.ReactNode {
    const paper = (getW: number, getH: number, set: (w: number, h: number) => void) => (
      <PaperSizeSection wIn={getW} hIn={getH} unit={unit} onUnit={setUnit} onSize={set} />
    );
    switch (o.engine) {
      case 'cards':
      case 'grid':
      case 'cutstack':
        return (
          <>
            {paper(nup.sheetWIn, nup.sheetHIn, (w, h) => setNup((s) => ({ ...s, sheetWIn: w, sheetHIn: h })))}
            {o.engine === 'grid' && (
              <Section label="// PAGE ORDER" help="Reading direction and fill pattern.">
                <div className="pe-row">
                  <select className="pe-select" value={stepRep ? 'step' : 'seq'} onChange={(e) => setStepRep(e.target.value === 'step')}>
                    <option value="seq">Sequential</option><option value="step">Step and Rep</option>
                  </select>
                  <label className="pe-check" style={{ margin: 0 }}><input type="checkbox" checked={nup.duplex ?? false} onChange={(e) => setNup((s) => ({ ...s, duplex: e.target.checked }))} /><span className="pe-box">{nup.duplex && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M5 12l5 5L19 6" /></svg>}</span>Double Sided</label>
                </div>
              </Section>
            )}
            <Section label="// LAYOUT" help="Rows, columns and scaling.">
              <Check label="Autoscale" checked={autoscale} onChange={setAutoscale} />
              <Check label="Preserve aspect ratio" checked={preserveAR} onChange={setPreserveAR} />
              <div className="pe-grid2" style={{ marginTop: 6 }}>
                <div className="pe-row" style={{ margin: 0 }}><span className="pe-label" style={{ width: 56 }}>Columns</span><input className="pe-input pe-num" type="number" min={1} value={nup.cols} onChange={(e) => setNup((s) => ({ ...s, cols: Math.max(1, +e.target.value) }))} /></div>
                <div className="pe-row" style={{ margin: 0 }}><span className="pe-label" style={{ width: 40 }}>Rows</span><input className="pe-input pe-num" type="number" min={1} value={nup.rows} onChange={(e) => setNup((s) => ({ ...s, rows: Math.max(1, +e.target.value) }))} /></div>
              </div>
              <div className="pe-cards2" style={{ marginTop: 12 }}>
                <SelCard on={!nup.cutStack} cap="Z-PATTERN" onClick={() => setNup((s) => ({ ...s, cutStack: false }))}><Flow arrows="z" /></SelCard>
                <SelCard off cap="S-PATTERN"><Flow arrows="s" /></SelCard>
              </div>
              <div className="pe-note">Need a precise layout? Use Custom Impose for per-cell control. <a href="#">Custom Impose guide</a></div>
            </Section>
            <WhiteSpaceSection marginIn={nup.marginIn} gutterIn={nup.gutterIn} unit={unit} onUnit={setUnit} onMargin={(v) => setNup((s) => ({ ...s, marginIn: v }))} onGutter={(v) => setNup((s) => ({ ...s, gutterIn: v }))} />
            <PrintersMarks />
            <BleedsSection />
          </>
        );
      case 'booklet':
        return (
          <>
            {paper(11, 8.5, () => {})}
            <Section label="// BOOK BINDING" help="Saddle-stitch or perfect binding.">
              <div className="pe-row"><span className="pe-label">Saddle size</span><input className="pe-input pe-num" style={{ width: 70 }} type="number" min={0} value={booklet.signatureSheets ?? ''} placeholder="" onChange={(e) => setBooklet((s) => ({ ...s, signatureSheets: e.target.value ? +e.target.value : 0 }))} /><span className="pe-label-sm">sheets</span></div>
              <div className="pe-label-sm" style={{ marginBottom: 10 }}>{booklet.signatureSheets ? 'Perfect binding' : 'Saddle stitch (single stack)'}</div>
              <div className="pe-cards2">
                <SelCard on={!booklet.rtl} cap="LEFT TO RIGHT" onClick={() => setBooklet((s) => ({ ...s, rtl: false }))}><Flow arrows="ltr" /></SelCard>
                <SelCard on={booklet.rtl} off={!booklet.rtl} cap="RIGHT TO LEFT" onClick={() => setBooklet((s) => ({ ...s, rtl: true }))}><Flow arrows="rtl" /></SelCard>
              </div>
            </Section>
            <Section label="// SCALE" help="Fit pages to the spread.">
              <Check label="Autoscale" checked={autoscale} onChange={setAutoscale} />
              <Check label="Preserve aspect ratio" checked={preserveAR} onChange={setPreserveAR} />
            </Section>
            <WhiteSpaceSection marginIn={booklet.marginIn} gutterIn={booklet.gutterIn} unit={unit} onUnit={setUnit} onMargin={(v) => setBooklet((s) => ({ ...s, marginIn: v }))} onGutter={(v) => setBooklet((s) => ({ ...s, gutterIn: v }))} />
            <PrintersMarks />
            <BleedsSection />
          </>
        );
      case 'nupbook':
        return (
          <>
            <Section label="// BOOK BINDING" help="Signature binding method.">
              <Radio label="Perfect Bound" on={(nupbook.signatureSheets ?? 0) > 0} onSelect={() => setNupbook((s) => ({ ...s, signatureSheets: 4 }))} />
              <Radio label="Saddle Stitch" on={(nupbook.signatureSheets ?? 0) === 0} onSelect={() => setNupbook((s) => ({ ...s, signatureSheets: 0 }))} />
              <div className="pe-row" style={{ marginTop: 8 }}><span className="pe-label">N up</span><input className="pe-input pe-num" style={{ width: 70 }} type="number" value={nupbook.nUp} onChange={(e) => setNupbook((s) => ({ ...s, nUp: +e.target.value }))} /></div>
              <div className="pe-cards2" style={{ marginTop: 10 }}>
                <SelCard on={!nupbook.rtl} cap="LEFT TO RIGHT" onClick={() => setNupbook((s) => ({ ...s, rtl: false }))}><Flow arrows="ltr" /></SelCard>
                <SelCard on={nupbook.rtl} off={!nupbook.rtl} cap="RIGHT TO LEFT" onClick={() => setNupbook((s) => ({ ...s, rtl: true }))}><Flow arrows="rtl" /></SelCard>
              </div>
              <div className="pe-note">Need a precise layout? Use Custom Impose for per-cell control. <a href="#">Custom Impose guide</a></div>
            </Section>
            <Section label="// MARGINS" help="Non-printable border around each sheet.">
              <div className="pe-row"><span className="pe-label" style={{ width: 88 }}>Left &amp; right</span><NumIn valueIn={nupbook.marginIn} unit={unit} onIn={(v) => setNupbook((s) => ({ ...s, marginIn: v }))} /><UnitSelect unit={unit} onChange={setUnit} /></div>
              <div className="pe-row"><span className="pe-label" style={{ width: 88 }}>Top &amp; bottom</span><NumIn valueIn={nupbook.marginIn} unit={unit} onIn={(v) => setNupbook((s) => ({ ...s, marginIn: v }))} /></div>
            </Section>
            <Section label="// GUTTERS" help="Spacing between adjacent pages.">
              <div className="pe-row"><span className="pe-label" style={{ width: 88 }}>Binding Gutter</span><NumIn valueIn={nupbook.gutterIn} unit={unit} onIn={(v) => setNupbook((s) => ({ ...s, gutterIn: v }))} /><NumIn valueIn={nupbook.creepIn} unit={unit} onIn={(v) => setNupbook((s) => ({ ...s, creepIn: v }))} /></div>
              <div style={{ marginTop: 10 }}>
                <Radio label="Creep Inward" on={nupbook.creepIn >= 0} onSelect={() => setNupbook((s) => ({ ...s, creepIn: Math.abs(s.creepIn) }))} />
                <Radio label="Creep Outward" on={nupbook.creepIn < 0} onSelect={() => setNupbook((s) => ({ ...s, creepIn: -Math.abs(s.creepIn || 0.01) }))} />
              </div>
            </Section>
            <PrintersMarks />
          </>
        );
      case 'shuffle':
        return (
          <>
            <Section label="// PAGES" help="Page reordering expression.">
              <span className="pe-label-sm">Pattern</span>
              <input className="pe-input" style={{ marginTop: 5 }} value={shuffleOrder} onChange={(e) => setShuffleOrder(e.target.value)} />
              <div className="pe-note" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Syntax:</div>
                <div><code>all</code> — All pages</div>
                <div><code>1-5</code> Range, <code>5-1</code> Reverse</div>
                <div><code>odd</code>, <code>even</code>, <code>last</code>, <code>first</code></div>
                <div><code>5*(1)</code> Repeat, <code>[a, b]</code> Interleave</div>
              </div>
            </Section>
            <Section label="// QUICK ACTIONS" help="Common presets.">
              <div className="pe-row" style={{ flexWrap: 'wrap' }}>
                <button className="pe-chipbtn" onClick={() => setShuffleOrder('last-1')}><Ic name="shuffle" size={14} /> Reverse</button>
                <button className="pe-chipbtn" onClick={() => setShuffleOrder('odd')}>Odd only</button>
                <button className="pe-chipbtn" onClick={() => setShuffleOrder('even')}>Even only</button>
              </div>
            </Section>
          </>
        );
      case 'rotate':
        return (
          <Section label="// ROTATION" help="Rotate all pages.">
            <div className="pe-cards2" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {[90, 180, 270].map((d) => <SelCard key={d} on={rotateDeg === d} off={rotateDeg !== d} cap={`${d}°`} onClick={() => setRotateDeg(d)}><Ic name="rotate" size={22} /></SelCard>)}
            </div>
          </Section>
        );
      case 'flip':
        return (
          <Section label="// FLIP" help="Mirror pages.">
            <div className="pe-cards2">
              <SelCard on={flipDir === 'h'} off={flipDir !== 'h'} cap="HORIZONTAL" onClick={() => setFlipDir('h')}><Ic name="flip" size={22} /></SelCard>
              <SelCard on={flipDir === 'v'} off={flipDir !== 'v'} cap="VERTICAL" onClick={() => setFlipDir('v')}><Ic name="flip" size={22} /></SelCard>
            </div>
          </Section>
        );
      case 'split':
        return (
          <Section label="// RANGES" help="Comma-separated page ranges; each becomes a file.">
            <input className="pe-input" value={splitRanges} onChange={(e) => setSplitRanges(e.target.value)} placeholder="1-5, 6-10" />
            <div className="pe-note">Each range downloads as a separate PDF.</div>
          </Section>
        );
      case 'merge':
        return (
          <Section label="// FILES" help="Add PDFs to append after the current one.">
            <div className="pe-note" style={{ marginBottom: 10 }}>Base: {file?.name ?? '—'}</div>
            {mergeFiles.map((m, i) => <div key={i} className="pe-label-sm" style={{ marginBottom: 6 }}>+ {m.name}</div>)}
            <button className="pe-chipbtn" onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/pdf'; inp.multiple = true; inp.onchange = async () => { const list = Array.from(inp.files ?? []); const loaded = await Promise.all(list.map(async (f) => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()), info: await getPdfInfo(new Uint8Array(await f.arrayBuffer())) }))); setMergeFiles((s) => [...s, ...loaded]); }; inp.click(); }}><Ic name="addstep" size={14} /> Add PDFs</button>
          </Section>
        );
      default:
        return null;
    }
  }
  function PrintersMarks() {
    return (
      <Section label="// PRINTER'S MARKS" help="Trim guides and alignment marks outside the live area.">
        <Check label="Draw crop marks" checked={drawMarks} onChange={setDrawMarks} />
      </Section>
    );
  }
  function BleedsSection() {
    return (
      <Section label="// BLEEDS" help="Extend artwork beyond the trim edge.">
        <Radio label="No bleeds" sub="Cards placed with no bleed extension" on={bleedMode === 'none'} onSelect={() => setBleedMode('none')} />
        <Radio label="From document" sub="Use bleed info from source PDF" on={bleedMode === 'doc'} onSelect={() => setBleedMode('doc')} />
        <Radio label="Fixed bleeds" sub="Specify custom bleed amounts" on={bleedMode === 'fixed'} onSelect={() => setBleedMode('fixed')} />
      </Section>
    );
  }
}

function Flow({ arrows }: { arrows: 'z' | 's' | 'ltr' | 'rtl' }) {
  if (arrows === 'ltr' || arrows === 'rtl') {
    return (
      <div className="pe-flow">
        <b>{arrows === 'ltr' ? '2' : '3'}</b>
        <span className="pe-flow-arrow">{arrows === 'ltr' ? '→' : '←'}</span>
        <b>{arrows === 'ltr' ? '3' : '2'}</b>
      </div>
    );
  }
  const rows = arrows === 'z' ? [[1, 2, 3], [4, 5, 6]] : [[1, 2, 3], [6, 5, 4]];
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      {rows.map((r, i) => (
        <div key={i} className="pe-flow" style={{ gap: 3 }}>
          {r.map((n, j) => <React.Fragment key={j}><b style={{ width: 20, height: 18, fontSize: 11 }}>{n}</b>{j < 2 && <span className="pe-flow-arrow" style={{ fontSize: 11 }}>{arrows === 'z' ? '→' : (i === 0 ? '→' : '←')}</span>}</React.Fragment>)}
        </div>
      ))}
    </div>
  );
}

function ChooseOperation({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <>
      <div className="pe-choose-head">
        <span className="pe-choose-title">Choose Operation</span>
        <div className="pe-choose-views">
          <button className="pe-iconbtn" title="Search"><Ic name="search" size={16} /></button>
          <button className="pe-iconbtn" title="List"><Ic name="list" size={16} /></button>
          <button className="pe-iconbtn pe-active" title="Grid"><Ic name="gridview" size={16} /></button>
          <button className="pe-iconbtn" title="Layers"><Ic name="layers" size={16} /></button>
          <button className="pe-iconbtn" title="Sort"><Ic name="sort" size={16} /></button>
        </div>
      </div>
      {OP_GROUPS.map((g) => (
        <div key={g.label}>
          <div className="pe-group-label">{g.label}</div>
          <div className="pe-op-grid">
            {g.ops.map((o) => (
              <button key={o.id} className="pe-op" onClick={() => onSelect(o.id)}>
                <span className="pe-op-ic"><Ic name={o.icon} size={22} /></span>
                <span className="pe-op-label">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function SheetCanvas({ sheets, thumbs, zoom }: { sheets: Sheet[]; thumbs: string[]; zoom: number }) {
  return (
    <div className="pe-sheets">
      {sheets.map((sh, si) => {
        const baseH = 260 * zoom;
        const aspect = sh.wIn / sh.hIn;
        const w = baseH * aspect, h = baseH;
        return (
          <div key={si} className="pe-sheet" style={{ width: w, height: h }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sh.cols}, 1fr)`, gridTemplateRows: `repeat(${sh.rows}, 1fr)`, gap: 2, width: '100%', height: '100%' }}>
              {sh.cells.map((c, i) => {
                const img = !c.blank ? thumbs[c.n - 1] : undefined;
                const color = PAGE_COLORS[(c.n - 1) % PAGE_COLORS.length];
                return (
                  <div key={i} className={`pe-page ${c.blank ? 'pe-page-blank' : ''}`} style={{ background: c.blank ? '#fff' : color, transform: c.rot ? 'rotate(180deg)' : undefined }}>
                    {img && <img src={img} alt="" />}
                    {!c.blank && !img && <span className="pe-page-num">{c.n}</span>}
                    {img && !c.blank && <span className="pe-page-badge">{c.n}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
