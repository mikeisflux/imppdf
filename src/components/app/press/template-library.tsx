'use client';
// Template Library — the full-screen preset browser: category tree with
// step-count badges, filter chips, and a generated Example/Diagram preview of
// each preset's imposed sheet.
import React, { useMemo, useState } from 'react';
import { Ic, paperName } from './panels';
import { findOp } from './operations';
import { LIBRARY } from './templates/registry';
import type { TemplateSpec, PreviewProps } from './templates/kit';
import { makeStep, type WorkflowStep } from './steps';

interface Entry {
  id: string; name: string; desc: string; group: string;
  steps: WorkflowStep[]; prod: boolean; vdp: boolean;
  sheetWIn: number; sheetHIn: number;
  preview: (p: PreviewProps) => React.ReactNode;
}

// Each template is a self-contained module under templates/<category>/; the
// registry groups them. The badge equals the length of the step chain, and each
// template renders through its OWN preview() so any one can be tuned in isolation.
function buildEntries(): Entry[] {
  const out: Entry[] = [];
  for (const cat of LIBRARY) {
    for (const le of cat.entries as TemplateSpec[]) {
      const steps = le.steps.map((ls) => {
        const st = makeStep(ls.type);
        if (ls.s) Object.assign(st.s, ls.s);
        return st;
      });
      out.push({
        id: le.id, name: le.name, desc: le.desc, group: cat.name,
        steps, prod: steps.length > 1, vdp: cat.name === 'Variable Data',
        sheetWIn: le.sheetWIn, sheetHIn: le.sheetHIn, preview: le.preview,
      });
    }
  }
  return out;
}

// Derive the imposition grid (cols×rows, duplex) from a template's step chain.
// Used only for the stats readout; the visual comes from each template's own
// preview() function, which lives in its template file.
function layoutOf(steps: WorkflowStep[]) {
  const impose = steps.find((st) => ['grid', 'cards', 'cutstack', 'perfectbound', 'booklet', 'zine', 'gangsheet', 'stickers', 'datamerge', 'customimpose', 'nupbook'].includes(st.type));
  const s = impose?.s ?? {};
  const duplex = !!s.duplex;
  if (!impose) return { cols: 1, rows: 1, duplex, kind: 'single' as const, s };
  if (impose.type === 'booklet' || impose.type === 'nupbook') return { cols: 2, rows: 1, duplex: true, kind: 'booklet' as const, s };
  if (impose.type === 'zine') return { cols: 4, rows: 2, duplex: true, kind: 'zine' as const, s };
  const shW = s.sheetWIn ?? 8.5, shH = s.sheetHIn ?? 11;
  let cols = s.cols ?? (s.cellWIn ? Math.max(1, Math.floor((shW - 0.5) / (s.cellWIn + (s.gutterIn ?? 0)))) : 2);
  let rows = s.rows ?? (s.cellHIn ? Math.max(1, Math.floor((shH - 0.5) / (s.cellHIn + (s.gutterYIn ?? s.gutterIn ?? 0)))) : 2);
  cols = Math.max(1, Math.min(cols, 12)); rows = Math.max(1, Math.min(rows, 16));
  return { cols, rows, duplex, kind: 'grid' as const, s };
}

// Thin wrapper: size the sheet from the template's own dimensions, then hand off
// to the template's own preview() — all drawing lives in the template file.
function SheetPreview({ entry, mode }: { entry: Entry; mode: 'diagram' | 'example' }) {
  const W = 340, H = Math.max(160, Math.min(480, (340 * entry.sheetHIn) / entry.sheetWIn));
  return <>{entry.preview({ mode, W, H })}</>;
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
  const { cols, rows, duplex, kind, s } = layoutOf(e.steps);
  let perSheet = Math.max(1, cols * rows) * (duplex ? 2 : 1);
  if (kind === 'booklet') perSheet = 4;
  if (kind === 'zine') perSheet = 8;
  if (s.order === 'repeat') perSheet = Math.max(1, pageCount);   // step & repeat: 1 sheet per design run
  const sheets = Math.max(1, Math.ceil(pageCount / perSheet));
  const usedPct = (s.cellWIn && s.cellHIn)
    ? Math.min(99, Math.round((s.cellWIn * s.cellHIn * cols * rows) / ((s.sheetWIn ?? 8.5) * (s.sheetHIn ?? 11)) * 100))
    : 82;
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
