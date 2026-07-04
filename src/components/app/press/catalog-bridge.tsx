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
const UNSUPPORTED_KINDS = new Set(['passthrough', 'colormanage', 'optimize', 'repair', 'barcode', 'qrstamp', 'preflight']);

const KIND_TO_TYPE: Record<string, StepType> = {
  booklet: 'booklet', nup: 'grid', colorbar: 'colorbar', registration: 'regmarks',
  cutcontour: 'cuttermarks', resize: 'resize', nest: 'gangsheet', foldmarks: 'foldmarks',
  distort: 'distort', collating: 'collating', jobslug: 'slugline', gathering: 'gathering',
  watermark: 'watermark', shuffle: 'shuffle', headerfooter: 'headerfooter', bleed: 'bleed',
  rotate: 'rotate', flip: 'flip',
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

// ── Browser modal ────────────────────────────────────────────────────────────

const RECIPE_CATS = [...new Set(RECIPES.map((r) => r.cat))];

export function TemplatesModal({ onClose, onApply }: {
  onClose: () => void;
  onApply: (steps: WorkflowStep[]) => void;
}) {
  const [tab, setTab] = useState<'recipes' | 'templates'>('recipes');
  const [cat, setCat] = useState<string>('');
  const [q, setQ] = useState('');
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

      {tab === 'recipes' ? recipes.map((r) => {
        const steps = recipeToSteps(r);
        return (
          <div key={r.id} className="pe-cat-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pe-label" style={{ fontWeight: 700 }}>{r.name}</div>
              <div className="pe-label-sm" style={{ marginTop: 2 }}>{r.desc}</div>
              <div className="pe-cat-chain">
                {steps.map((st, i) => (
                  <React.Fragment key={st.id}>
                    {i > 0 && <span className="pe-cat-arrow">→</span>}
                    <span className="pe-cat-step"><Ic name={findOp(st.type)!.icon} size={12} /> {findOp(st.type)!.label}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <button className="pe-btn pe-btn-dl" style={{ padding: '7px 13px', flex: '0 0 auto' }} onClick={() => { onApply(steps); onClose(); }}>Use</button>
          </div>
        );
      }) : templates.map((t) => {
        const steps = templateToSteps(t)!;
        return (
          <div key={t.id} className="pe-cat-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pe-label" style={{ fontWeight: 700 }}>{t.name} <span className="pe-cat-industry">{t.industry}</span></div>
              <div className="pe-label-sm" style={{ marginTop: 2 }}>{t.specs}</div>
              <div className="pe-cat-chain">
                <span className="pe-cat-step"><Ic name={findOp(steps[0]!.type)!.icon} size={12} /> {findOp(steps[0]!.type)!.label}</span>
              </div>
            </div>
            <button className="pe-btn pe-btn-dl" style={{ padding: '7px 13px', flex: '0 0 auto' }} onClick={() => { onApply(steps); onClose(); }}>Use</button>
          </div>
        );
      })}
      {(tab === 'recipes' ? recipes : templates).length === 0 && <div className="pe-note">Nothing matches that search.</div>}
    </Modal>
  );
}
