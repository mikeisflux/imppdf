'use client';
// Bridges the vendored catalog (156 templates + 69 production recipes) into the
// press editor's workflow-step model, plus the browser modal that surfaces them.
import React, { useMemo, useState } from 'react';
import { TEMPLATES, TEMPLATE_INDUSTRIES, RECIPES, type TemplateDef, type RecipeDef } from '@/lib/imposition-toolkit/catalog';
import { makeStep, defaultSettings, type StepSettings, type StepType, type WorkflowStep } from './steps';
import { Ic } from './panels';
import { Modal } from './modals';
import { findOp } from './operations';

// ── Recipe → steps ───────────────────────────────────────────────────────────

// Recipe step kinds that only make sense in a color-managed / raster RIP and
// have no engine backing yet. They're dropped from the chain (never silently —
// the modal shows the full chain and greys out what's skipped).
const UNSUPPORTED_KINDS = new Set(['passthrough', 'preflight']);

const KIND_TO_TYPE: Record<string, StepType> = {
  booklet: 'booklet', nup: 'grid', colorbar: 'colorbar', registration: 'regmarks',
  cutcontour: 'cuttermarks', resize: 'resize', nest: 'stickers', foldmarks: 'foldmarks',
  distort: 'distort', collating: 'collating', jobslug: 'slugline', gathering: 'gathering',
  watermark: 'watermark', shuffle: 'shuffle', headerfooter: 'headerfooter', bleed: 'bleed',
  rotate: 'rotate', flip: 'flip', colormanage: 'colormanage', optimize: 'pdftools',
  repair: 'pdftools', barcode: 'barcode', qrstamp: 'barcode',
};
const KIND_PATCH: Record<string, Record<string, unknown>> = {
  optimize: { op: 'optimize' }, repair: { op: 'repair' }, qrstamp: { symbology: 'qr' },
};

function mapNupSettings(opts: Record<string, unknown>): StepSettings {
  const o = opts as Record<string, number | boolean | string>;
  const patch: StepSettings = {};
  for (const k of ['cols', 'rows', 'sheetWIn', 'sheetHIn', 'marginIn', 'gutterIn', 'gutterYIn', 'cellWIn', 'cellHIn', 'markLenIn', 'markOffIn', 'duplexFlip'] as const) {
    if (o[k] !== undefined) patch[k] = o[k];
  }
  if (o.repeatFirst) patch.order = 'repeat';
  if (o.cutStack) patch.order = 'cutstack';
  if (o.duplex !== undefined) patch.duplex = o.duplex;
  if (o.addMarks !== undefined) patch.addMarks = o.addMarks;
  if (typeof o.bleedIn === 'number' && o.bleedIn > 0) { patch.bleedMode = 'fixed'; patch.bleedIn = o.bleedIn; }
  return patch;
}

export function recipeToSteps(r: RecipeDef): WorkflowStep[] {
  const out: WorkflowStep[] = [];
  for (const rs of r.steps) {
    if (rs.kind === 'cropmarks') {
      // Marks fold into the nearest preceding imposition step.
      const target = [...out].reverse().find((st) => ['booklet', 'zine', 'grid', 'cards', 'cutstack', 'nupbook', 'gangsheet'].includes(st.type));
      if (target) { target.s.addMarks = true; if (rs.opts) Object.assign(target.s, rs.opts); }
      continue;
    }
    if (UNSUPPORTED_KINDS.has(rs.kind)) continue;
    const type = KIND_TO_TYPE[rs.kind];
    if (!type) continue;
    const step = makeStep(type);
    step.collapsed = true;
    if (rs.opts) {
      if (type === 'grid') Object.assign(step.s, mapNupSettings(rs.opts));
      else if (type === 'colorbar') {
        const o = rs.opts as Record<string, unknown>;
        if (o.edge) step.s.location = o.edge;
        if (typeof o.heightIn === 'number') step.s.sizeIn = o.heightIn;
      } else Object.assign(step.s, rs.opts);
    }
    if (type === 'cuttermarks') step.s.addDielines = true;
    if (KIND_PATCH[rs.kind]) Object.assign(step.s, KIND_PATCH[rs.kind]);
    out.push(step);
  }
  if (out.length) out[0]!.collapsed = false;
  return out;
}
export function recipeSupported(r: RecipeDef): boolean { return recipeToSteps(r).length > 0; }

// ── Template → step ──────────────────────────────────────────────────────────

const TOOL_TO_TYPE: Record<string, StepType> = {
  business: 'cards', trading: 'cards', stickers: 'cards', steprepeat: 'cards', coasters: 'cards',
  bookmark: 'cards', hangtag: 'cards', complimentslip: 'cards', namebadge: 'cards',
  coupons: 'grid', wedding: 'grid', postcard: 'grid', labels: 'grid', ncrpads: 'grid',
  photo: 'grid', contact: 'grid', flyer: 'grid', tickets: 'grid', raffle: 'grid',
  trifold: 'grid', zfold: 'grid', presfolder: 'grid', gangsheet: 'gangsheet',
  booklet: 'booklet', magazine: 'booklet', comic: 'booklet', notebook: 'booklet',
  catalog: 'booklet', greeting: 'booklet', menu: 'booklet', program: 'booklet',
  perfectbound: 'booklet', zine: 'zine',
  cutstack: 'cutstack', shuffle: 'shuffle', rotate: 'rotate', pagenumbers: 'pagenumbers',
  overlay: 'watermark',
  poster: 'resize', rollerbanner: 'resize', banner: 'resize', featherflag: 'resize',
};

export function templateToSteps(t: TemplateDef): WorkflowStep[] | null {
  const type = TOOL_TO_TYPE[t.toolId];
  if (!type) return null;
  const step = makeStep(type);
  const p = t.preset;
  if (p?.nup && (type === 'cards' || type === 'grid' || type === 'cutstack')) {
    Object.assign(step.s, mapNupSettings(p.nup as Record<string, unknown>));
    if (type === 'cards') step.s.order = 'repeat';
    if (type === 'cutstack') step.s.order = 'cutstack';
  }
  if (p?.booklet && (type === 'booklet' || type === 'zine')) {
    const b = p.booklet as Record<string, unknown>;
    for (const k of ['rtl', 'marginIn', 'gutterIn', 'creepIn', 'signatureSheets', 'addMarks', 'markLenIn', 'markOffIn'] as const) {
      if (b[k] !== undefined) step.s[k] = b[k];
    }
  }
  if (p?.resize && type === 'resize') Object.assign(step.s, p.resize);
  return [step];
}
export function templateSupported(t: TemplateDef): boolean { return TOOL_TO_TYPE[t.toolId] !== undefined; }

// ── Schematic sheet preview (SVG mock of the imposed layout) ─────────────────

const MOCK = ['#4ade80', '#8b5cf6', '#f97316', '#22d3ee', '#e11d48', '#facc15'];

export function TemplateSchematic({ steps }: { steps: WorkflowStep[] }) {
  const impose = steps.find((st) => ['grid', 'cards', 'cutstack', 'booklet', 'zine', 'gangsheet', 'stickers', 'customimpose', 'nupbook'].includes(st.type));
  const s = impose?.s ?? {};
  const shW = s.sheetWIn ?? 8.5, shH = s.sheetHIn ?? 11;
  const W = 300, H = (W * shH) / shW;
  const hasBar = steps.some((st) => st.type === 'colorbar');
  const hasCut = steps.some((st) => st.type === 'cuttermarks' || st.type === 'regmarks');
  const cells: { x: number; y: number; w: number; h: number }[] = [];
  if (impose && (impose.type === 'booklet' || impose.type === 'nupbook')) {
    const m = 16;
    cells.push({ x: m, y: m, w: W / 2 - m - 2, h: H - 2 * m }, { x: W / 2 + 2, y: m, w: W / 2 - m - 2, h: H - 2 * m });
  } else if (impose) {
    const cols = s.cellWIn ? Math.max(1, Math.floor((shW - 0.5) / s.cellWIn)) : (s.cols ?? 2);
    const rows = s.cellHIn ? Math.max(1, Math.floor((shH - 0.5) / s.cellHIn)) : (s.rows ?? 2);
    const m = 14, g = 4;
    const cw = (W - 2 * m - g * (cols - 1)) / cols, ch = (H - 2 * m - g * (rows - 1)) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: m + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch });
  } else {
    cells.push({ x: 30, y: 30, w: W - 60, h: H - 60 });
  }
  return (
    <svg className="pe-tpl-schematic" viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <rect x="0" y="0" width={W} height={H} fill="#fff" rx="2" />
      {hasBar && Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={14 + i * ((W - 28) / 16)} y={5} width={(W - 28) / 16 - 1} height={5}
          fill={['#00b7d8', '#e52f8c', '#f5d90a', '#17181d'][i % 4]} />
      ))}
      {cells.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={MOCK[i % 2 === 0 ? 0 : 1]} opacity={0.85} rx={1} />
          <rect x={c.x + c.w * 0.12} y={c.y + c.h * 0.16} width={c.w * 0.5} height={Math.min(6, c.h * 0.09)} fill="#fff" opacity={0.85} />
          <rect x={c.x + c.w * 0.12} y={c.y + c.h * 0.32} width={c.w * 0.32} height={Math.min(3.5, c.h * 0.05)} fill="#fff" opacity={0.55} />
          {/* crop ticks */}
          <path d={`M${c.x - 8} ${c.y}h5M${c.x} ${c.y - 8}v5M${c.x + c.w + 3} ${c.y}h5M${c.x + c.w} ${c.y - 8}v5M${c.x - 8} ${c.y + c.h}h5M${c.x} ${c.y + c.h + 3}v5M${c.x + c.w + 3} ${c.y + c.h}h5M${c.x + c.w} ${c.y + c.h + 3}v5`}
            stroke="#333" strokeWidth="0.8" />
        </g>
      ))}
      {hasCut && (
        <>
          <circle cx={7} cy={7} r={3.4} fill="#111" /><circle cx={W - 7} cy={7} r={3.4} fill="#111" />
          <circle cx={7} cy={H - 7} r={3.4} fill="#111" /><circle cx={W - 7} cy={H - 7} r={3.4} fill="#111" />
        </>
      )}
    </svg>
  );
}

// ── Browser modal ────────────────────────────────────────────────────────────

const RECIPE_CATS = [...new Set(RECIPES.map((r) => r.cat))];

export function TemplatesModal({ onClose, onApply }: {
  onClose: () => void;
  onApply: (steps: WorkflowStep[]) => void;
}) {
  const [tab, setTab] = useState<'recipes' | 'templates'>('recipes');
  const [cat, setCat] = useState<string>('');
  const [q, setQ] = useState('');
  const [selId, setSelId] = useState<string>('');
  const ql = q.toLowerCase();

  const recipes = useMemo(() => RECIPES.filter((r) =>
    recipeSupported(r) && (!cat || r.cat === cat) &&
    (!ql || r.name.toLowerCase().includes(ql) || r.desc.toLowerCase().includes(ql) || r.tags.some((t) => t.includes(ql)))), [cat, ql]);
  const templates = useMemo(() => TEMPLATES.filter((t) =>
    templateSupported(t) && (!cat || t.industry === cat) &&
    (!ql || t.name.toLowerCase().includes(ql) || t.specs.toLowerCase().includes(ql))), [cat, ql]);

  const cats = tab === 'recipes' ? RECIPE_CATS : TEMPLATE_INDUSTRIES;

  return (
    <Modal title="Templates & Recipes" wide onClose={onClose}
      sub="Templates open one pre-configured step; recipes load a full production chain. Everything stays editable afterwards.">
      <div className="pe-row" style={{ marginBottom: 12 }}>
        <div className="pe-segrow">
          <button className={tab === 'recipes' ? 'pe-on' : ''} onClick={() => { setTab('recipes'); setCat(''); }}>RECIPES ({RECIPES.filter(recipeSupported).length})</button>
          <button className={tab === 'templates' ? 'pe-on' : ''} onClick={() => { setTab('templates'); setCat(''); }}>TEMPLATES ({TEMPLATES.filter(templateSupported).length})</button>
        </div>
        <input className="pe-input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
      </div>
      <div className="pe-chipwrap" style={{ marginBottom: 16 }}>
        <button className={`pe-chipbtn ${cat === '' ? 'pe-chip-on' : ''}`} onClick={() => setCat('')}>All</button>
        {cats.map((c) => <button key={c} className={`pe-chipbtn ${cat === c ? 'pe-chip-on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      <div className="pe-tpl-split">
        <div className="pe-tpl-list">
          {tab === 'recipes' ? recipes.map((r) => {
            const steps = recipeToSteps(r);
            const on = selId === r.id;
            return (
              <button key={r.id} className={`pe-tpl-item ${on ? 'pe-on' : ''}`} onClick={() => setSelId(r.id)}>
                <Ic name={findOp(steps[0]?.type)?.icon ?? 'gridview'} size={15} />
                <span className="pe-tpl-item-name">{r.name}</span>
                <span className={`pe-tpl-badge pe-tpl-badge-${Math.min(steps.length, 4)}`}>{steps.length}-STEP</span>
              </button>
            );
          }) : templates.map((t) => {
            const on = selId === t.id;
            return (
              <button key={t.id} className={`pe-tpl-item ${on ? 'pe-on' : ''}`} onClick={() => setSelId(t.id)}>
                <Ic name={findOp(templateToSteps(t)![0]!.type)!.icon} size={15} />
                <span className="pe-tpl-item-name">{t.name}</span>
                <span className="pe-tpl-badge pe-tpl-badge-1">1-STEP</span>
              </button>
            );
          })}
          {(tab === 'recipes' ? recipes : templates).length === 0 && <div className="pe-note" style={{ padding: 12 }}>Nothing matches that search.</div>}
        </div>
        <div className="pe-tpl-detail">
          {(() => {
            const r = tab === 'recipes' ? recipes.find((x) => x.id === selId) ?? recipes[0] : undefined;
            const t = tab === 'templates' ? templates.find((x) => x.id === selId) ?? templates[0] : undefined;
            const steps = r ? recipeToSteps(r) : t ? templateToSteps(t)! : [];
            if (!steps.length) return <div className="pe-note">Select a preset.</div>;
            const name = r?.name ?? t?.name ?? '';
            const desc = r?.desc ?? t?.specs ?? '';
            const impose = steps.find((st2) => st2.s.sheetWIn);
            return (
              <>
                <TemplateSchematic steps={steps} />
                <div className="pe-label" style={{ fontWeight: 800, marginTop: 12 }}>{name}
                  <span className="pe-cat-industry" style={{ marginLeft: 8 }}>{steps.length > 1 ? 'MULTI' : 'SINGLE'}</span>
                </div>
                <div className="pe-label-sm" style={{ marginTop: 4, lineHeight: 1.5 }}>{desc}</div>
                {impose && <div className="pe-label-sm pe-mono" style={{ marginTop: 6 }}>{impose.s.sheetWIn}″ × {impose.s.sheetHIn}″ sheet</div>}
                <div className="pe-cat-chain" style={{ margin: '10px 0 14px' }}>
                  {steps.map((st, i) => (
                    <React.Fragment key={st.id}>
                      {i > 0 && <span className="pe-cat-arrow">→</span>}
                      <span className="pe-cat-step"><Ic name={findOp(st.type)!.icon} size={12} /> {findOp(st.type)!.label}</span>
                    </React.Fragment>
                  ))}
                </div>
                {r?.tip && <div className="pe-note" style={{ marginBottom: 12 }}>💡 {r.tip}</div>}
                <button className="pe-btn pe-btn-dl" onClick={() => { onApply(steps); onClose(); }}>APPLY →</button>
              </>
            );
          })()}
        </div>
      </div>
    </Modal>
  );
}
