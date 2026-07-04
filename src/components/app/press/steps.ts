'use client';
// Workflow model for the press editor: an ordered list of steps, each backed by
// an engine function in the imposition toolkit. The pipeline feeds the source
// PDF through every enabled step in order — exactly what Download/Print export.

import {
  imposeBooklet, imposeNUp, imposeNUpBook, shufflePages, rotatePdf, flipPdf,
  mergePdfs, splitPdf, cropPdf, resizePdf, overlayPdf, distortPdf, generateBleed,
  addHeaderFooter, addPressColorBar, addCutterMarks, addJobSlug, addFoldMarks,
  addCollatingMarks, addOmrMarks, addGatheringMarks, addLayMarks, addTextWatermark,
  addPageNumbers, nestPdf,
} from '@/lib/imposition-toolkit/impose';
import type { PdfJobInfo } from '@/lib/imposition-toolkit/impose';

export type StepType =
  | 'cards' | 'booklet' | 'zine' | 'shuffle' | 'grid' | 'nupbook' | 'cutstack'
  | 'preflight' | 'gangsheet' | 'cuttermarks'
  | 'resize' | 'rotate' | 'crop' | 'split' | 'flip' | 'merge' | 'overlay' | 'distort'
  | 'bleed' | 'headerfooter' | 'colorbar' | 'slugline' | 'foldmarks' | 'regmarks'
  | 'collating' | 'omr' | 'gathering' | 'laymarks' | 'watermark' | 'pagenumbers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StepSettings = Record<string, any>;

export interface WorkflowStep {
  id: string;
  type: StepType;
  enabled: boolean;
  collapsed: boolean;
  s: StepSettings;
}

let nextId = 1;
export function makeStepId(): string { return `st${Date.now().toString(36)}${(nextId++).toString(36)}`; }

// ── Defaults ─────────────────────────────────────────────────────────────────

const MARKS = { addMarks: true, centerMarks: true, markLenIn: 0.43, markOffIn: 0.125, markWeightPt: 0.25, fourColorBlack: true, knockout: false };

export function defaultSettings(type: StepType): StepSettings {
  switch (type) {
    case 'booklet':
    case 'zine':
      return {
        sheetWIn: 16.54, sheetHIn: 11.69,           // A3 landscape
        landscape: true, autoscale: true, preserveAspect: true,
        rtl: false, signatureSheets: 0, fillLastSaddle: true,
        marginIn: 0.2, marginTopIn: 0.2, gutterIn: 0, creepIn: 0.007, creepOutward: true,
        centerOutput: false, ...MARKS,
        bleedMode: 'doc', bleedIn: 0.125, rotatePages: type === 'zine',
      };
    case 'cards':
    case 'grid':
    case 'cutstack':
      return {
        sheetWIn: 12.6, sheetHIn: 17.72, cols: 2, rows: 2,
        marginIn: 0.25, gutterIn: 0.125, gutterYIn: 0.125,
        order: type === 'cards' ? 'repeat' : type === 'cutstack' ? 'cutstack' : 'sequential',
        duplex: false, autoscale: true, preserveAspect: true, ...MARKS,
        bleedMode: 'doc', bleedIn: 0.125,
      };
    case 'nupbook':
      return { nUp: 4, sheetWIn: 11, sheetHIn: 17, marginIn: 0.2, gutterIn: 0, creepIn: 0, rtl: false, signatureSheets: 4, ...MARKS };
    case 'gangsheet':
      return { sheetWIn: 12.6, sheetHIn: 17.72, marginIn: 0.25, paddingIn: 0.125, allowRotate: true, trueShape: false, fillSheet: false, roll: false, copies: 1 };
    case 'shuffle': return { pattern: 'all' };
    case 'rotate': return { angle: 90, pages: 'all' };
    case 'flip': return { dir: 'h', pages: 'all' };
    case 'crop': return { top: 0, right: 0, bottom: 0, left: 0, pages: 'all' };
    case 'resize': return { mode: 'fit', scalePct: 100, targetWIn: 8.27, targetHIn: 11.69, pages: 'all' };
    case 'split': return { ranges: '' };
    case 'merge': return { files: [] };
    case 'overlay': return { stamp: null, stampName: '', opacity: 1, mode: 'center' };
    case 'distort': return { factorPct: 100, direction: 'circ', pages: 'all' };
    case 'bleed': return { bleedIn: 0.125 };
    case 'headerfooter': return { header: '', footer: '', fontSizePt: 9, marginPt: 18, align: 'center' };
    case 'colorbar':
      return {
        location: 'top', marginAlongIn: 0.25, marginAcrossIn: 0.25, pages: 'all',
        sizeIn: 0.25, colors: true, spotColors: true,
        shapes: { solid: true, diagonal: true, tint: true, rings: true, starburst: true, target: true },
        repeat: true, layer: '',
      };
    case 'cuttermarks':
      return {
        cutTypes: ['thru'], shape: 'circle', sizeIn: 0.25, placement: 'inside', refBox: 'media',
        marginIn: 0.25, cornersAndEdges: false, keySlot: 1, keyDistIn: 2, layer: 'Regmark',
        pages: 'all', addDielines: false, removeArtwork: false,
      };
    case 'regmarks':
      return {
        cutTypes: [], shape: 'circle', sizeIn: 0.2, placement: 'inside', refBox: 'media',
        marginIn: 0.2, cornersAndEdges: true, keySlot: -1, keyDistIn: 2, layer: '',
        pages: 'all', addDielines: false, removeArtwork: false,
      };
    case 'slugline': return { text: '[file-name] · [date] · [page-count]pp', position: 'bottom', fontSizePt: 7 };
    case 'foldmarks': return { scheme: 'half', orientation: 'vertical', edge: 'both', style: 'dashed', pages: 'all' };
    case 'collating': return { edge: 'left', pagesPerSig: 16 };
    case 'omr': return { edge: 'left', encoding: 'binary', program: 1, bitCount: 8, pages: 'all' };
    case 'gathering': return { edge: 'bottom' };
    case 'laymarks': return { markType: 'arrow', edges: 'both', gripperEdge: 'bottom', sideGuideSide: 'left', pages: 'all' };
    case 'watermark': return { text: 'PROOF', opacity: 0.16, angleDeg: 45, fontSizePt: 96 };
    case 'pagenumbers': return { position: 'bottom-center', startAt: 1, prefix: '', suffix: '', fontSizePt: 10, marginPt: 24 };
    case 'preflight': return {};
  }
}

export function makeStep(type: StepType): WorkflowStep {
  return { id: makeStepId(), type, enabled: true, collapsed: false, s: defaultSettings(type) };
}

// ── Pipeline ─────────────────────────────────────────────────────────────────

function bookletOpts(s: StepSettings) {
  return {
    rtl: !!s.rtl, marginIn: s.marginIn, marginTopIn: s.marginTopIn, gutterIn: s.gutterIn,
    creepIn: s.creepIn, creepOutward: s.creepOutward !== false, centerOutput: !!s.centerOutput,
    addMarks: !!s.addMarks, centerMarks: !!s.centerMarks, markLenIn: s.markLenIn,
    markOffIn: s.markOffIn, markWeightPt: s.markWeightPt,
    fourColorBlack: !!s.fourColorBlack, knockout: !!s.knockout,
    signatureSheets: s.signatureSheets || 0, fillLastSaddle: s.fillLastSaddle !== false,
    sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn,
    autoscale: s.autoscale !== false, preserveAspect: s.preserveAspect !== false,
    bleedIn: s.bleedMode === 'fixed' ? s.bleedIn : 0, bleedFromDoc: s.bleedMode === 'doc',
    rotatePages: !!s.rotatePages,
  };
}
function nupOpts(s: StepSettings) {
  return {
    cols: s.cols, rows: s.rows, sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn,
    cellWIn: s.cellWIn || undefined, cellHIn: s.cellHIn || undefined,
    duplexFlip: s.duplexFlip, rtl: !!s.rtl,
    marginIn: s.marginIn, gutterIn: s.gutterIn, gutterYIn: s.gutterYIn,
    repeatFirst: s.order === 'repeat', cutStack: s.order === 'cutstack', snake: !!s.snake,
    duplex: !!s.duplex, addMarks: !!s.addMarks, markLenIn: s.markLenIn, markOffIn: s.markOffIn,
    centerMarks: !!s.centerMarks, markWeightPt: s.markWeightPt,
    bleedIn: s.bleedMode === 'fixed' ? s.bleedIn : 0,
  };
}

// Runs every enabled step. `split` and `preflight` are pass-through here — the
// export path handles split's multi-file output separately.
export async function runPipeline(bytes: Uint8Array, steps: WorkflowStep[]): Promise<Uint8Array> {
  let b = bytes;
  for (const step of steps) {
    if (!step.enabled) continue;
    const s = step.s;
    switch (step.type) {
      case 'booklet': case 'zine': b = await imposeBooklet(b, bookletOpts(s)); break;
      case 'cards': case 'grid': case 'cutstack': b = await imposeNUp(b, nupOpts(s)); break;
      case 'nupbook': b = await imposeNUpBook(b, {
        nUp: s.nUp, sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn, marginIn: s.marginIn,
        gutterIn: s.gutterIn, creepIn: s.creepIn, rtl: !!s.rtl, signatureSheets: s.signatureSheets,
        addMarks: !!s.addMarks, markLenIn: s.markLenIn, markOffIn: s.markOffIn,
      }); break;
      case 'gangsheet': b = await nestPdf(b, {
        sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn, marginIn: s.marginIn, paddingIn: s.paddingIn,
        allowRotate: !!s.allowRotate, trueShape: !!s.trueShape, fillSheet: !!s.fillSheet,
        roll: !!s.roll, copies: s.copies ?? 1,
      }); break;
      case 'shuffle': b = await shufflePages(b, s.pattern || 'all'); break;
      case 'rotate': b = await rotatePdf(b, s.angle, s.pages); break;
      case 'flip': b = await flipPdf(b, s.dir, s.pages); break;
      case 'crop': b = await cropPdf(b, { top: s.top, right: s.right, bottom: s.bottom, left: s.left }, s.pages); break;
      case 'resize': b = await resizePdf(b, { mode: s.mode, scalePct: s.scalePct, targetWIn: s.targetWIn, targetHIn: s.targetHIn }, s.pages); break;
      case 'merge': if (Array.isArray(s.files) && s.files.length) b = await mergePdfs([b, ...s.files.map((f: { bytes: Uint8Array }) => f.bytes)]); break;
      case 'overlay': if (s.stamp) b = await overlayPdf(b, s.stamp, { opacity: s.opacity, mode: s.mode }); break;
      case 'distort': b = await distortPdf(b, { factorPct: s.factorPct, direction: s.direction, pages: s.pages }); break;
      case 'bleed': b = await generateBleed(b, { bleedIn: s.bleedIn }); break;
      case 'headerfooter': b = await addHeaderFooter(b, { header: s.header, footer: s.footer, fontSizePt: s.fontSizePt, marginPt: s.marginPt, align: s.align }); break;
      case 'colorbar': b = await addPressColorBar(b, {
        location: s.location, marginAlongIn: s.marginAlongIn, marginAcrossIn: s.marginAcrossIn,
        pages: s.pages, sizeIn: s.sizeIn, colors: !!s.colors, spotColors: !!s.spotColors,
        shapes: s.shapes ?? {}, repeat: !!s.repeat, layer: s.layer,
      }); break;
      case 'cuttermarks': case 'regmarks': b = await addCutterMarks(b, {
        cutTypes: s.cutTypes ?? [], shape: s.shape, sizeIn: s.sizeIn, placement: s.placement,
        refBox: s.refBox, marginIn: s.marginIn, cornersAndEdges: !!s.cornersAndEdges,
        keySlot: s.keySlot, keyDistIn: s.keyDistIn, layer: s.layer, pages: s.pages,
        addDielines: !!s.addDielines, removeArtwork: !!s.removeArtwork,
      }); break;
      case 'slugline': b = await addJobSlug(b, { text: s.text, position: s.position, fontSizePt: s.fontSizePt, fileName: s.fileName }); break;
      case 'foldmarks': b = await addFoldMarks(b, { scheme: s.scheme, orientation: s.orientation, edge: s.edge, style: s.style, positions: s.positions, pages: s.pages }); break;
      case 'collating': b = await addCollatingMarks(b, { edge: s.edge, pagesPerSig: s.pagesPerSig }); break;
      case 'omr': b = await addOmrMarks(b, { edge: s.edge, encoding: s.encoding, program: s.program, bitCount: s.bitCount, pages: s.pages }); break;
      case 'gathering': b = await addGatheringMarks(b, { edge: s.edge }); break;
      case 'laymarks': b = await addLayMarks(b, { markType: s.markType, edges: s.edges, gripperEdge: s.gripperEdge, sideGuideSide: s.sideGuideSide, pages: s.pages }); break;
      case 'watermark': b = await addTextWatermark(b, { text: s.text, opacity: s.opacity, angleDeg: s.angleDeg, fontSizePt: s.fontSizePt }); break;
      case 'pagenumbers': b = await addPageNumbers(b, { position: s.position, startAt: s.startAt, prefix: s.prefix, suffix: s.suffix, fontSizePt: s.fontSizePt, marginPt: s.marginPt }); break;
      case 'split': case 'preflight': break;
    }
  }
  return b;
}

export function splitStep(steps: WorkflowStep[]): WorkflowStep | undefined {
  return steps.find((st) => st.enabled && st.type === 'split' && st.s.ranges?.trim());
}
export async function runSplit(bytes: Uint8Array, step: WorkflowStep): Promise<Uint8Array[]> {
  return splitPdf(bytes, step.s.ranges);
}

// ── JDF ticket (CIP4 JDF 1.2, Cutting) ───────────────────────────────────────
// Mirrors the ticket the reference app emits: one Layout/Signature/Sheet per
// physical press sheet plus CuttingParams CutBlocks sized to the cut area.

export function buildJdf(opts: {
  fileName: string;
  sheets: { wPt: number; hPt: number }[];
  cutMarginPt: number;
  agentVersion?: string;
}): string {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const job = `Cut ${opts.fileName}`;
  const ts = new Date().toISOString().replace(/\.\d+Z$/, '');
  const fronts = opts.sheets.filter((_, i) => i % 2 === 0);
  const layouts: string[] = [], cuts: string[] = [], links: string[] = [];
  fronts.forEach((sh, i) => {
    const n = i + 1, sheetName = `Sheet${i * 2 + 1}`;
    layouts.push(
      `    <Layout ID="Layout${n}" Class="Parameter" Status="Available" PartIDKeys="SheetName">\n` +
      `      <Signature Name="Signature${n}">\n` +
      `        <Sheet Name="${sheetName}">\n` +
      `          <Surface Side="Front" SurfaceContentsBox="0 0 ${sh.wPt.toFixed(2)} ${sh.hPt.toFixed(2)}" />\n` +
      `        </Sheet>\n      </Signature>\n    </Layout>`);
    const m = opts.cutMarginPt;
    cuts.push(
      `    <CuttingParams ID="CuttingParams${n}" Class="Parameter" Status="Available" PartIDKeys="SheetName">\n` +
      `      <Part SheetName="${sheetName}" />\n` +
      `      <CutBlock BlockName="Block${n}" BlockSize="${(sh.wPt - 2 * m).toFixed(4)} ${(sh.hPt - 2 * m).toFixed(2)}" BlockTrf="1 0 0 1 ${m.toFixed(1)} ${m.toFixed(1)}" BlockType="CutBlock" />\n` +
      `    </CuttingParams>`);
    links.push(`    <CuttingParamsLink rRef="CuttingParams${n}" Usage="Input" />`);
  });
  fronts.forEach((_, i) => links.push(`    <LayoutLink rRef="Layout${i + 1}" Usage="Input" />`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<JDF ID="${esc(job)}" xmlns="http://www.CIP4.org/JDFSchema_1_1" Version="1.2" Type="Cutting" Status="Waiting" JobID="${esc(job)}" JobPartID="CutOnly_Sheets">\n` +
    `  <AuditPool>\n    <Created AgentName="ImpositionPDF" AgentVersion="${opts.agentVersion ?? '1.0'}" TimeStamp="${ts}" />\n  </AuditPool>\n` +
    `  <ResourcePool>\n${layouts.join('\n')}\n${cuts.join('\n')}\n  </ResourcePool>\n` +
    `  <ResourceLinkPool>\n${links.join('\n')}\n  </ResourceLinkPool>\n` +
    `</JDF>\n`;
}

// ── Output naming ────────────────────────────────────────────────────────────

export interface NamingCtx { fileName: string; tool: string; pages: number; paperSize: string; custom: string; }

export function resolveName(template: string, ctx: NamingCtx): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const map: Record<string, string> = {
    fileName: ctx.fileName.replace(/\.pdf$/i, ''),
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}${pad(now.getMinutes())}`,
    tool: ctx.tool, pages: String(ctx.pages), paperSize: ctx.paperSize, custom: ctx.custom,
  };
  const out = template.replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k]! : m))
    .replace(/[\\/:*?"<>|]/g, '-').trim();
  return (out || 'output') + '.pdf';
}

// ── Persistence ──────────────────────────────────────────────────────────────

export interface SavedWorkflow { name: string; savedAt: number; steps: Array<{ type: StepType; s: StepSettings }>; }
const WF_KEY = 'pp_workflows';

// Strip runtime byte buffers (merge/overlay attachments) before serialising.
function stripBytes(s: StepSettings): StepSettings {
  const c: StepSettings = { ...s };
  if (Array.isArray(c.files)) c.files = [];
  if (c.stamp) { c.stamp = null; c.stampName = ''; }
  return c;
}

export function listWorkflows(): SavedWorkflow[] {
  try { return JSON.parse(localStorage.getItem(WF_KEY) || '[]'); } catch { return []; }
}
export function saveWorkflow(name: string, steps: WorkflowStep[]) {
  const all = listWorkflows().filter((w) => w.name !== name);
  all.unshift({ name, savedAt: Date.now(), steps: steps.map((st) => ({ type: st.type, s: stripBytes(st.s) })) });
  try { localStorage.setItem(WF_KEY, JSON.stringify(all.slice(0, 50))); } catch { /* full */ }
}
export function deleteWorkflow(name: string) {
  try { localStorage.setItem(WF_KEY, JSON.stringify(listWorkflows().filter((w) => w.name !== name))); } catch { /* noop */ }
}
export function workflowToSteps(w: SavedWorkflow): WorkflowStep[] {
  return w.steps.map((st) => ({ id: makeStepId(), type: st.type, enabled: true, collapsed: true, s: { ...defaultSettings(st.type), ...st.s } }));
}
