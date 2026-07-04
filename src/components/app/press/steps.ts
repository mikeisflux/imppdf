'use client';
// Workflow model for the press editor: an ordered list of steps, each backed by
// an engine function in the imposition toolkit. The pipeline feeds the source
// PDF through every enabled step in order — exactly what Download/Print export.

import {
  imposeBooklet, imposeNUp, imposeNUpBook, shufflePages, rotatePdf, flipPdf,
  mergePdfs, splitPdf, cropPdf, resizePdf, overlayPdf, distortPdf, generateBleed,
  addHeaderFooter, addPressColorBar, addCutterMarks, addJobSlug, addFoldMarks,
  addCollatingMarks, addOmrMarks, addGatheringMarks, addLayMarks, addTextWatermark,
  addPageNumbers, imposeGangJobs, imposeFoldZine, imposeCustomGrid, getPdfInfo,
  nestPdf, imposeCalendar, insertPages as insertPagesOp, mixPdfs, nudgePdf,
  addBackdropFile, applyColorEffects, applyColorManagement, addBarcodeStamp,
  addDimensions, addWhiteVarnish, addBraille, optimizePdf, repairPdf, decryptPdf, setLayers,
} from '@/lib/imposition-toolkit/impose';
import type { PdfJobInfo, GangJob, CustomCell, LayerState } from '@/lib/imposition-toolkit/impose';

export type StepType =
  | 'cards' | 'booklet' | 'zine' | 'shuffle' | 'grid' | 'nupbook' | 'cutstack' | 'datamerge'
  | 'preflight' | 'gangsheet' | 'cuttermarks' | 'layers' | 'customimpose' | 'pdftools'
  | 'resize' | 'rotate' | 'crop' | 'split' | 'flip' | 'merge' | 'overlay' | 'distort'
  | 'bleed' | 'headerfooter' | 'colorbar' | 'slugline' | 'foldmarks' | 'regmarks'
  | 'collating' | 'omr' | 'gathering' | 'laymarks' | 'watermark' | 'pagenumbers'
  | 'stickers' | 'calendar' | 'insertpages' | 'mix' | 'nudge' | 'backdrop'
  | 'coloreffects' | 'colormanage' | 'barcode' | 'dimensions' | 'whitevarnish'
  | 'braille' | 'editpdf';

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
    case 'zine':
      return {
        format: 'mini', sheetWIn: 11, sheetHIn: 8.5, flipBackCover: true,
        signatureSheets: 0,
        guides: { margin: false, center: true, fold: false },
        guideWeights: { margin: 4.5, center: 2.25, fold: 1.5 },
        showSheet: 0,
      };
    case 'customimpose':
      return {
        cols: 2, rows: 2, sheetWIn: 12.6, sheetHIn: 17.72, marginIn: 0.25, gutterIn: 0.125,
        preset: 'sequential',
        cells: [{ page: 1, rot: 0 }, { page: 2, rot: 0 }, { page: 3, rot: 0 }, { page: 4, rot: 0 }],
        ...MARKS, addMarks: false,
      };
    case 'gangsheet':
      return {
        sheetWIn: 11, sheetHIn: 8.5,
        workStyle: 'sheetwise', makeready: 0, spoilagePct: 0,
        marginTopIn: 0.2, marginLeftIn: 0.2, marginRightIn: 0.2, marginBottomIn: 0.2,
        gutterIn: 0.2, ...MARKS, addMarks: false, bleedMode: 'doc', bleedIn: 0.125,
        jobs: [], files: [], docPages: 0,
      };
    case 'pdftools':
      return { op: 'optimize', useObjectStreams: true, removeUnused: true, stripMetadata: false, removeAnnotations: false, removeJavaScript: true };
    case 'layers':
      return { states: [] };
    case 'stickers':
      return { sheetWIn: 11, sheetHIn: 8.5, roll: false, fillSheet: true, copies: 20, paddingIn: 0, marginTopIn: 0.2, marginLeftIn: 0.2, marginRightIn: 0.2, marginBottomIn: 0.2, allowRotate: true };
    case 'calendar':
      return { halfSheet: false, rotateBack: true, ...MARKS, addMarks: false };
    case 'insertpages':
      return { file: null, fileName: '', mode: 'at', position: 1, everyN: 1, count: 1 };
    case 'mix':
      return { second: null, secondName: '', reverseB: false };
    case 'nudge':
      return { dxIn: 0, dyIn: 0, rotateDeg: 0, stepIn: 0.2, rotStepDeg: 2, pages: 'all' };
    case 'backdrop':
      return { file: null, fileName: '', repeat: true, offsetXPt: 0, offsetYPt: 0, scalePct: 100, opacity: 100, pages: 'all' };
    case 'coloreffects':
      return { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, warmTone: 0, invert: 0, hueRotate: 0, dpi: 300, pages: 'all' };
    case 'colormanage':
      return { sourceProfile: 'sRGB (built-in)', destProfile: '', intent: 'relative', dpi: 300, convert: true, gamutWarning: false, pages: 'all' };
    case 'barcode':
      return { text: 'Hello World', symbology: 'qr', scale: 3, quietZone: 4, barHeightMm: 15, position: 'br', marginPt: 18, xOffsetPt: 18, yOffsetPt: 18, rotationDeg: 0, transparent: false, showText: true, pages: 'all' };
    case 'dimensions':
      return {};
    case 'whitevarnish':
      return { layerType: 'white', spotName: 'White', coverage: 'trim', tint: 1, pages: 'all' };
    case 'braille':
      return { text: '', position: 'bl', dotDiaPt: 4.25, pages: 'all' };
    case 'editpdf':
      return {};
    case 'booklet':
      return {
        sheetWIn: 16.54, sheetHIn: 11.69,           // A3 landscape
        landscape: true, autoscale: true, preserveAspect: true,
        rtl: false, signatureSheets: 0, fillLastSaddle: true,
        marginIn: 0.2, marginTopIn: 0.2, gutterIn: 0, creepIn: 0.007, creepOutward: true,
        centerOutput: false, ...MARKS,
        bleedMode: 'doc', bleedIn: 0.125, rotatePages: false,
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
    case 'preflight': case 'datamerge': return {};
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

// Insert file B into the pipeline document at a position (or every N pages).
async function mergeInsert(a: Uint8Array, bFile: Uint8Array, s: StepSettings): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.load(a, { ignoreEncryption: true });
  const ins = await PDFDocument.load(bFile.slice(), { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const aPages = await out.copyPages(doc, doc.getPageIndices());
  const bPages = await out.copyPages(ins, ins.getPageIndices());
  const every = s.mode === 'everyN' ? Math.max(1, Math.round(s.everyN)) : 0;
  const at = Math.max(1, Math.round(s.position));
  const pushB = () => bPages.forEach((p) => out.addPage(p));
  if (!every && at <= 1) pushB();
  aPages.forEach((p, i) => {
    if (!every && i + 1 === at && at > 1) pushB();
    out.addPage(p);
    if (every && (i + 1) % every === 0) pushB();
  });
  if (!every && at > aPages.length) pushB();
  return out.save();
}

// Map the 4-corner braille position choice onto engine x/y (1" inset).
function braillePos(pos: string): { xPt?: number; yPt?: number } {
  // The engine anchors at top-left; corners other than tl need page size, which
  // it resolves internally when x/y are omitted — bottom-left default there.
  if (pos === 'tl') return { xPt: 72, yPt: 72 };
  return {};
}

// Runs every enabled step. `split` and `preflight` are pass-through here — the
// export path handles split's multi-file output separately. Encryption only
// applies on export (`forExport`) so the live preview can still rasterise.
export async function runPipeline(bytes: Uint8Array, steps: WorkflowStep[], forExport = false): Promise<Uint8Array> {
  let b = bytes;
  for (const step of steps) {
    if (!step.enabled) continue;
    const s = step.s;
    if (step.type === 'pdftools' && s.op === 'encrypt' && !forExport) continue;
    switch (step.type) {
      case 'booklet': b = await imposeBooklet(b, bookletOpts(s)); break;
      case 'zine': b = await imposeFoldZine(b, {
        format: s.format, sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn,
        flipBackCover: !!s.flipBackCover, signatureSheets: s.signatureSheets || 0,
        guides: s.guides ?? {}, guideWeights: s.guideWeights,
      }); break;
      case 'customimpose': {
        const cells = (s.cells ?? []) as { page: number; rot: 0 | 90 | 180 | 270 }[];
        const perSheet = Math.max(1, ...cells.map((c) => c.page || 0));
        const info = await getPdfInfo(b);
        const numSheets = Math.max(1, Math.ceil(info.count / perSheet));
        const sheets: (CustomCell | null)[][] = Array.from({ length: numSheets }, (_, sh) =>
          cells.map((c) => (c.page ? { page: sh * perSheet + c.page, rotation: c.rot } : null)));
        b = await imposeCustomGrid(b, {
          cols: s.cols, rows: s.rows, sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn,
          marginIn: s.marginIn, gutterIn: s.gutterIn, sheets, addMarks: !!s.addMarks,
        });
        break;
      }
      case 'cards': case 'grid': case 'cutstack': b = await imposeNUp(b, nupOpts(s)); break;
      case 'nupbook': b = await imposeNUpBook(b, {
        nUp: s.nUp, sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn, marginIn: s.marginIn,
        gutterIn: s.gutterIn, creepIn: s.creepIn, rtl: !!s.rtl, signatureSheets: s.signatureSheets,
        addMarks: !!s.addMarks, markLenIn: s.markLenIn, markOffIn: s.markOffIn,
      }); break;
      case 'gangsheet': {
        const files = (s.files ?? []) as { bytes: Uint8Array }[];
        const jobs = ((s.jobs ?? []) as GangJob[]).filter((j) => j.qty > 0);
        if (jobs.length) {
          b = await imposeGangJobs([b, ...files.map((f) => f.bytes)], jobs, {
            sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn,
            marginTopIn: s.marginTopIn, marginLeftIn: s.marginLeftIn,
            marginRightIn: s.marginRightIn, marginBottomIn: s.marginBottomIn,
            gutterIn: s.gutterIn, addMarks: !!s.addMarks,
            markLenIn: s.markLenIn, markOffIn: s.markOffIn,
            centerMarks: !!s.centerMarks, markWeightPt: s.markWeightPt,
          });
        }
        break;
      }
      case 'pdftools': {
        if (s.op === 'optimize') b = await optimizePdf(b, { objectStreams: s.useObjectStreams !== false, removeUnused: s.removeUnused !== false });
        else if (s.op === 'linearize') b = await (await import('./wasm-engines')).linearizePdf(b);
        else if (s.op === 'encrypt') {
          if (s.userPassword?.trim()) b = await (await import('./wasm-engines')).encryptPdfAes(b, s.userPassword, s.ownerPassword);
        } else if (s.op === 'decrypt') {
          b = s.password?.trim()
            ? await (await import('./wasm-engines')).decryptPdfWithPassword(b, s.password)
            : await decryptPdf(b);
        } else b = await repairPdf(b, { reserialize: true, stripMetadata: !!s.stripMetadata, removeAnnotations: !!s.removeAnnotations, removeJavaScript: !!s.removeJavaScript });
        break;
      }
      case 'layers': {
        const states = ((s.states ?? []) as LayerState[]).filter((st2) => st2.state !== 'default');
        if (states.length) b = await setLayers(b, s.states as LayerState[]);
        break;
      }
      case 'stickers': b = await nestPdf(b, {
        sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn, roll: !!s.roll, paddingIn: s.paddingIn,
        marginIn: Math.max(s.marginTopIn, s.marginLeftIn, s.marginRightIn, s.marginBottomIn),
        allowRotate: !!s.allowRotate, copies: s.copies ?? 1, fillSheet: !!s.fillSheet,
      }); break;
      case 'calendar': b = await imposeCalendar(b, {
        halfSheet: !!s.halfSheet, rotateBack: !!s.rotateBack,
        addMarks: !!s.addMarks, markLenIn: s.markLenIn, markOffIn: s.markOffIn,
        centerMarks: !!s.centerMarks, markWeightPt: s.markWeightPt,
      }); break;
      case 'insertpages': if (s.file) b = await mergeInsert(b, s.file, s); break;
      case 'mix': if (s.second) b = await mixPdfs(b, s.second, !!s.reverseB); break;
      case 'nudge': b = await nudgePdf(b, { dxIn: s.dxIn, dyIn: s.dyIn, rotateDeg: s.rotateDeg, pages: s.pages }); break;
      case 'backdrop': if (s.file) b = await addBackdropFile(b, s.file, {
        offsetXPt: s.offsetXPt, offsetYPt: s.offsetYPt, scalePct: s.scalePct,
        opacity: (s.opacity ?? 100) / 100, repeat: s.repeat !== false, pages: s.pages,
      }); break;
      case 'coloreffects': b = await applyColorEffects(b, {
        brightness: s.brightness, contrast: s.contrast, saturation: s.saturation,
        grayscale: s.grayscale, warmTone: s.warmTone, invert: s.invert,
        hueRotate: s.hueRotate, dpi: s.dpi, pages: s.pages,
      }); break;
      case 'colormanage': {
        if (s.icc && s.convert) {
          // Real LittleCMS proofing transform through the uploaded ICC profile.
          b = await (await import('./wasm-engines')).applyIccColorManagement(b, s.icc as Uint8Array, {
            intent: s.intent, dpi: s.dpi, gamutWarning: !!s.gamutWarning,
            blackPointComp: s.blackPointComp !== false, pages: s.pages,
          });
        } else {
          b = await applyColorManagement(b, {
            sourceProfile: s.sourceProfile, destProfile: s.destProfile, intent: s.intent,
            dpi: s.dpi, convert: !!s.convert, gamutWarning: !!s.gamutWarning, pages: s.pages,
          });
        }
        break;
      }
      case 'barcode': b = await addBarcodeStamp(b, {
        text: s.text || ' ', symbology: s.symbology, scale: s.scale, quietZone: s.quietZone,
        barHeightMm: s.barHeightMm, position: s.position, marginPt: s.marginPt,
        xOffsetPt: s.xOffsetPt, yOffsetPt: s.yOffsetPt, rotationDeg: s.rotationDeg,
        transparent: !!s.transparent, showText: !!s.showText, pages: s.pages,
      }); break;
      case 'dimensions': b = await addDimensions(b); break;
      case 'whitevarnish': b = await addWhiteVarnish(b, {
        spotName: s.spotName || (s.layerType === 'varnish' ? 'Varnish' : 'White'),
        coverage: s.coverage, tint: s.tint, under: s.layerType === 'white', pages: s.pages,
      }); break;
      case 'braille': if (s.text?.trim()) b = await addBraille(b, {
        text: s.text, dotDiaPt: s.dotDiaPt, pages: s.pages,
        ...(braillePos(s.position)),
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
      case 'split': case 'preflight': case 'layers': case 'datamerge': break;
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
