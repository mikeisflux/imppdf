'use client';
// Workflow model for the press editor: an ordered list of steps, each backed by
// an engine function in the imposition toolkit. The pipeline feeds the source
// PDF through every enabled step in order — exactly what Download/Print export.

import {
  imposeBooklet, fieryBooklet, stampSerialNumber, serialLabel, imposeNUp, imposeNUpBook, shufflePages, rotatePdf, flipPdf,
  mergePdfs, splitPdf, cropPdf, resizePdf, overlayPdf, distortPdf, generateBleed,
  addHeaderFooter, addPressColorBar, addCutterMarks, addJobSlug, addFoldMarks,
  addCollatingMarks, addOmrMarks, addGatheringMarks, addLayMarks, addTextWatermark,
  addPageNumbers, imposeGangJobs, imposeFoldZine, imposeCustomGrid, getPdfInfo,
  nestPdf, imposeCalendar, insertPages as insertPagesOp, mixPdfs, nudgePdf,
  addBackdropFile, applyColorEffects, applyColorManagement, addBarcodeStamp,
  addDimensions, addWhiteVarnish, addBraille, optimizePdf, repairPdf, decryptPdf, setLayers,
  replicateFill, imposeDivinityBox,
} from '@/lib/imposition-toolkit/impose';
import type { PdfJobInfo, GangJob, CustomCell, LayerState } from '@/lib/imposition-toolkit/impose';

export type StepType =
  | 'cards' | 'booklet' | 'zine' | 'shuffle' | 'grid' | 'nupbook' | 'cutstack' | 'perfectbound' | 'datamerge'
  | 'trading' | 'bookmark' | 'flyer'
  | 'business' | 'postcard' | 'rackcard' | 'hangtag' | 'label' | 'namebadge' | 'ticket' | 'coupon' | 'placecard' | 'greeting'
  | 'comic' | 'magazine' | 'catalog' | 'program' | 'notebook' | 'hymnal'
  | 'trifold' | 'zfold' | 'gatefold' | 'menu'
  | 'doorhanger' | 'envelope' | 'coaster' | 'contact' | 'compslip'
  | 'poster' | 'banner' | 'rollbanner' | 'featherflag' | 'yardsign'
  | 'boxcarton' | 'presfolder'
  | 'preflight' | 'gangsheet' | 'cuttermarks' | 'layers' | 'customimpose' | 'pdftools'
  | 'resize' | 'rotate' | 'crop' | 'split' | 'flip' | 'merge' | 'overlay' | 'distort'
  | 'bleed' | 'headerfooter' | 'colorbar' | 'slugline' | 'foldmarks' | 'regmarks'
  | 'collating' | 'omr' | 'gathering' | 'laymarks' | 'watermark' | 'pagenumbers'
  | 'stickers' | 'calendar' | 'insertpages' | 'mix' | 'nudge' | 'backdrop'
  | 'coloreffects' | 'colormanage' | 'barcode' | 'dimensions' | 'whitevarnish'
  | 'braille' | 'editpdf' | 'pdfx' | 'fierybooklet' | 'fieryserial' | 'replicate' | 'indexcard' | 'divinitybox';

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

// Base N-Up settings for the domain "preset" layout tools (business cards,
// postcards, hang tags…). Each tool just overrides size/count.
const nupPreset = (o: StepSettings): StepSettings => ({
  sheetWIn: 8.5, sheetHIn: 11, cellWIn: 3.5, cellHIn: 2,
  marginIn: 0.25, gutterIn: 0.125, gutterYIn: 0.125, order: 'sequential', duplex: false,
  autoscale: true, preserveAspect: true, ...MARKS, bleedMode: 'doc', bleedIn: 0.125, ...o,
  // Every gang tool starts as a single 1×1 copy — the user raises columns/rows
  // (or ticks Replicate) to gang up. This keeps the preset's cell SIZE while
  // never tiling the sheet on its own.
  cols: 1, rows: 1,
});
// Base Booklet settings for book/magazine "preset" tools. Each overrides trim/sheet.
const bookletPreset = (o: StepSettings): StepSettings => ({
  sheetWIn: 16.54, sheetHIn: 11.69, landscape: true, autoscale: true, preserveAspect: true,
  rtl: false, signatureSheets: 0, fillLastSaddle: true, marginIn: 0.2, marginTopIn: 0.2,
  gutterIn: 0, creepIn: 0.007, creepOutward: true, centerOutput: true, ...MARKS,
  bleedMode: 'doc', bleedIn: 0.125, rotatePages: false, ...o,
});
// Large-format single-piece (no crop marks on wide-format signage).
const signPreset = (o: StepSettings): StepSettings =>
  nupPreset({ cols: 1, rows: 1, marginIn: 0, gutterIn: 0, gutterYIn: 0, ...o, addMarks: false });

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
    case 'pdfx':
      // CMYK conversion is OFF by default: RIPs/Fiery do their own colour
      // management, so converting here is usually wrong. The generic bundled
      // profile is used unless you upload your press's ICC.
      return { standard: 'x-4', convertCmyk: false, iccSource: 'bundled', intent: 'relative', dpi: 300, conditionName: 'Generic CMYK', icc: null, iccName: '' };
    case 'fierybooklet':
      // Single-page output for a Fiery/DFE booklet maker; spine-side bleed is
      // trimmed per page. Fiery bleed is always 1/8".
      return { rtl: false, coverIsPage1: true, setTrimBox: true };
    case 'fieryserial':
      // Fiery Booklet (spine-bleed trim, single pages) PLUS a limited-edition
      // serial number stamped on page 1 only, bottom-right, 3/4" insets. On
      // export it emits the whole run as separate numbered files (1/total …).
      return {
        rtl: false, coverIsPage1: true, setTrimBox: true,
        total: 200, start: 1, end: 0, template: '{n}/{total}',
        fontSizePt: 12, bold: true, insetRightIn: 0.75, insetBottomIn: 0.75,
      };
    case 'replicate':
      // Fills the SELECTED sheet with as many copies of the image as safely fit.
      // cellWIn/cellHIn of 0 means "use the image's own size". Extra images/PDFs
      // drop into leftover cells. Single-sheet items only.
      return {
        sheetWIn: 8.5, sheetHIn: 11, cellWIn: 0, cellHIn: 0, page: 1,
        marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125, fit: 'contain',
        extras: [], ...MARKS,
      };
    case 'indexcard':
      // Index cards (3×5") on Letter. Starts as a single 1×1 copy; raise
      // columns/rows (or tick Replicate) to gang up.
      return nupPreset({ cellWIn: 3, cellHIn: 5 });
    case 'divinitybox':
      // Fixed 300×572 mm box flat with four printable panels (A–D). Each panel
      // takes its own uploaded art; a white under-base (W1) prints behind every
      // panel because the box is black, with optional gloss varnish (V1).
      // foldMarks default OFF: this is a borderless, zero-bleed box — no crop,
      // cut, registration, or fold marks on the artwork unless explicitly asked.
      return { a: null, b: null, c: null, d: null, fit: 'cover', whiteUnder: true, varnish: false, foldMarks: false };
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
        sheetWIn: 12.6, sheetHIn: 17.72, cols: 1, rows: 1,
        marginIn: 0.25, gutterIn: 0.125, gutterYIn: 0.125,
        order: type === 'cards' ? 'repeat' : type === 'cutstack' ? 'cutstack' : 'sequential',
        duplex: false, autoscale: true, preserveAspect: true, ...MARKS,
        bleedMode: 'doc', bleedIn: 0.125,
      };
    case 'perfectbound':
      // Perfect-bound trade paperback: sequential 2-up, printed duplex and laid
      // out cut-and-stack so leaves fall into reading order (page 2 backs page 1).
      return {
        sheetWIn: 17, sheetHIn: 11, cols: 2, rows: 1, cellWIn: 8.5, cellHIn: 11,
        marginIn: 0, gutterIn: 0, gutterYIn: 0, order: 'cutstack', duplex: true,
        duplexFlip: 'long', autoscale: true, preserveAspect: true, ...MARKS,
        bleedMode: 'doc', bleedIn: 0.125,
        // Book pages must never be cropped — fit inside the cell, don't cover-crop.
        fit: 'contain',
      };
    case 'comic':
      // Single-issue comic: saddle-stitch booklet on tabloid, pages centered on
      // the sheet so duplex fronts/backs register. 2-up per side.
      return {
        sheetWIn: 17, sheetHIn: 11, landscape: true, autoscale: true, preserveAspect: true,
        rtl: false, signatureSheets: 0, fillLastSaddle: true,
        marginIn: 0.2, marginTopIn: 0.2, gutterIn: 0, creepIn: 0.007, creepOutward: true,
        centerOutput: true, ...MARKS, bleedMode: 'doc', bleedIn: 0.125, rotatePages: false,
        // Digital single issue: bleed to the sheet edge, no paper margin.
        fitSheetToSpread: true, addMarks: false,
      };
    case 'trading':
      // Standard trading/sports cards (2.5×3.5") on Letter. Starts 1×1; raise
      // columns/rows (or tick Replicate) to gang up.
      return {
        sheetWIn: 8.5, sheetHIn: 11, cols: 1, rows: 1, cellWIn: 2.5, cellHIn: 3.5,
        marginIn: 0.25, gutterIn: 0.1, gutterYIn: 0.1, order: 'sequential', duplex: false,
        autoscale: true, preserveAspect: true, ...MARKS, bleedMode: 'doc', bleedIn: 0.125,
      };
    case 'bookmark':
      // Bookmarks (2×6") on Letter. Starts 1×1; raise columns/rows to gang up.
      return {
        sheetWIn: 8.5, sheetHIn: 11, cols: 1, rows: 1, cellWIn: 2, cellHIn: 6,
        marginIn: 0.25, gutterIn: 0.125, gutterYIn: 0.125, order: 'sequential', duplex: false,
        autoscale: true, preserveAspect: true, ...MARKS, bleedMode: 'doc', bleedIn: 0.125,
      };
    case 'flyer':
      // Full-bleed flyer prep (8.5×11"), 1-up with crop marks.
      return {
        sheetWIn: 8.5, sheetHIn: 11, cols: 1, rows: 1, cellWIn: 8.5, cellHIn: 11,
        marginIn: 0, gutterIn: 0, gutterYIn: 0, order: 'sequential', duplex: false,
        autoscale: true, preserveAspect: true, ...MARKS, bleedMode: 'doc', bleedIn: 0.125,
      };
    // ── Domain N-Up preset tools ────────────────────────────────────────────
    case 'business':  return nupPreset({ cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2 });                 // 10-up business cards, Letter
    case 'postcard':  return nupPreset({ cols: 1, rows: 2, cellWIn: 6, cellHIn: 4, duplex: true, duplexFlip: 'long' }); // 2-up 6×4, duplex
    case 'rackcard':  return nupPreset({ sheetWIn: 11, sheetHIn: 17, cols: 2, rows: 1, cellWIn: 4, cellHIn: 9 });       // 2-up 4×9 on tabloid
    case 'hangtag':   return nupPreset({ sheetWIn: 11, sheetHIn: 17, cols: 2, rows: 4, cellWIn: 2.5, cellHIn: 4 });     // 8-up tags on tabloid
    case 'label':     return nupPreset({ cols: 2, rows: 3, cellWIn: 4, cellHIn: 3.33 });                 // 6-up labels, Letter
    case 'namebadge': return nupPreset({ cols: 2, rows: 4, cellWIn: 3.5, cellHIn: 2.25 });               // 8-up name badges
    case 'ticket':    return nupPreset({ cols: 2, rows: 4, cellWIn: 4, cellHIn: 2.5 });                  // 8-up event tickets
    case 'coupon':    return nupPreset({ cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2 });                  // 10-up coupons
    case 'placecard': return nupPreset({ cols: 2, rows: 4, cellWIn: 3.5, cellHIn: 2 });                  // 8-up place cards
    case 'greeting':  return nupPreset({ cols: 1, rows: 1, cellWIn: 5, cellHIn: 7 });                    // single-fold 5×7 greeting
    // ── Flat extras ─────────────────────────────────────────────────────────
    case 'doorhanger': return nupPreset({ cols: 2, rows: 1, cellWIn: 3.875, cellHIn: 8.75 });            // 2-up door hangers, Letter
    case 'envelope':   return nupPreset({ sheetWIn: 11, sheetHIn: 17, cols: 1, rows: 4, cellWIn: 9.5, cellHIn: 4.125 }); // #10 flats 4-up
    case 'coaster':    return nupPreset({ sheetWIn: 11, sheetHIn: 17, cols: 2, rows: 3, cellWIn: 4, cellHIn: 4 });       // round coasters 6-up
    case 'contact':    return nupPreset({ cols: 2, rows: 4, cellWIn: 3.75, cellHIn: 2.4 });              // 8-up photo contact sheet
    case 'compslip':   return nupPreset({ sheetWIn: 8.86, sheetHIn: 12.6, cols: 1, rows: 3, cellWIn: 8.27, cellHIn: 3.9 }); // DL comp slips 3-up
    // ── Folds (impose the flat; add fold marks as a step) ───────────────────
    case 'trifold':   return nupPreset({ sheetWIn: 11, sheetHIn: 8.5, cols: 1, rows: 1, cellWIn: 11, cellHIn: 8.5 });
    case 'zfold':     return nupPreset({ sheetWIn: 17, sheetHIn: 11, cols: 1, rows: 1, cellWIn: 17, cellHIn: 11 });
    case 'gatefold':  return nupPreset({ sheetWIn: 11, sheetHIn: 8.5, cols: 1, rows: 1, cellWIn: 11, cellHIn: 8.5 });
    case 'menu':      return nupPreset({ sheetWIn: 17, sheetHIn: 11, cols: 1, rows: 1, cellWIn: 17, cellHIn: 11 });
    // ── Large format (single piece, no marks) ───────────────────────────────
    case 'poster':      return signPreset({ sheetWIn: 24, sheetHIn: 36, cellWIn: 24, cellHIn: 36 });
    case 'banner':      return signPreset({ sheetWIn: 24, sheetHIn: 72, cellWIn: 24, cellHIn: 72 });
    case 'rollbanner':  return signPreset({ sheetWIn: 33, sheetHIn: 80, cellWIn: 33, cellHIn: 80 });
    case 'featherflag': return signPreset({ sheetWIn: 30, sheetHIn: 100, cellWIn: 30, cellHIn: 100 });
    case 'yardsign':    return signPreset({ sheetWIn: 24, sheetHIn: 18, cellWIn: 24, cellHIn: 18 });
    // ── Packaging (die flats) ───────────────────────────────────────────────
    case 'boxcarton':  return nupPreset({ sheetWIn: 11, sheetHIn: 17, cols: 1, rows: 1, cellWIn: 9, cellHIn: 14 });
    case 'presfolder': return nupPreset({ sheetWIn: 11, sheetHIn: 17, cols: 1, rows: 1, cellWIn: 9, cellHIn: 12 });
    // ── Books / magazines (saddle or perfect-bound signatures) ──────────────
    case 'magazine': return bookletPreset({ sheetWIn: 16.54, sheetHIn: 11.69, signatureSheets: 4 });
    case 'catalog':  return bookletPreset({ sheetWIn: 16, sheetHIn: 8 });
    case 'program':  return bookletPreset({ sheetWIn: 11.69, sheetHIn: 8.27 });
    case 'notebook': return bookletPreset({ sheetWIn: 11.69, sheetHIn: 8.27 });
    case 'hymnal':   return bookletPreset({ sheetWIn: 11.69, sheetHIn: 8.27, signatureSheets: 4 });
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
    keepSpineBleed: !!s.keepSpineBleed,   // default false → drop inner bleed at the fold
    fitSheetToSpread: !!s.fitSheetToSpread,
    rotatePages: !!s.rotatePages,
  };
}
function nupOpts(s: StepSettings) {
  return {
    cols: s.cols, rows: s.rows, sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn,
    cellWIn: s.cellWIn || undefined, cellHIn: s.cellHIn || undefined,
    autoOrient: s.autoOrient !== false,   // orient the cell to the artwork by default
    duplexFlip: s.duplexFlip, rtl: !!s.rtl,
    marginIn: s.marginIn, gutterIn: s.gutterIn, gutterYIn: s.gutterYIn,
    repeatFirst: s.order === 'repeat', cutStack: s.order === 'cutstack', snake: !!s.snake,
    duplex: !!s.duplex, addMarks: !!s.addMarks, markLenIn: s.markLenIn, markOffIn: s.markOffIn,
    centerMarks: !!s.centerMarks, markWeightPt: s.markWeightPt,
    bleedIn: s.bleedMode === 'fixed' ? s.bleedIn : 0,
    fit: s.fit ?? 'contain', imageZoom: s.imageZoom, imageOffsetX: s.imageOffsetX, imageOffsetY: s.imageOffsetY,
    // The crop dialog stores per-image {fit,zoom,offsetX,offsetY}; map it to the
    // engine's {fit,imageZoom,imageOffsetX,imageOffsetY} shape.
    perImage: s.perImage
      ? Object.fromEntries(Object.entries(s.perImage as Record<string, { fit?: 'cover' | 'contain' | 'stretch'; zoom?: number; offsetX?: number; offsetY?: number }>)
          .map(([k, v]) => [k, { fit: v.fit, imageZoom: v.zoom, imageOffsetX: v.offsetX, imageOffsetY: v.offsetY }])) as Record<number, { fit?: 'cover' | 'contain' | 'stretch'; imageZoom?: number; imageOffsetX?: number; imageOffsetY?: number }>
      : undefined,
  };
}

// Map a step's settings onto the replicateFill engine options. N-up tools store
// the gutter as gutterIn/gutterYIn; the dedicated Replicate tool uses
// gutterXIn/gutterYIn — accept whichever is present.
function replicateOpts(s: StepSettings) {
  return {
    // Replicate fills the SELECTED sheet with as many copies as safely fit,
    // and tiles the image at its OWN NATIVE SIZE (no cellWIn/cellHIn passed).
    // Respecting the image size is the whole point — fixed card sizes are the
    // job of the normal N-up tools instead.
    sheetWIn: s.sheetWIn, sheetHIn: s.sheetHIn, page: s.page ?? 1,
    marginIn: s.marginIn,
    gutterXIn: s.gutterXIn ?? s.gutterIn ?? 0,
    gutterYIn: s.gutterYIn ?? s.gutterIn ?? 0,
    fit: (s.fit ?? 'contain') as 'contain' | 'cover' | 'stretch',
    extras: ((s.extras ?? []) as { bytes: Uint8Array; page?: number; qty?: number }[])
      .filter((e) => e && e.bytes),
    addMarks: !!s.addMarks, markLenIn: s.markLenIn, markOffIn: s.markOffIn,
    centerMarks: !!s.centerMarks, markWeightPt: s.markWeightPt,
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
      case 'booklet': case 'comic': case 'magazine': case 'catalog': case 'program': case 'notebook': case 'hymnal':
        b = await imposeBooklet(b, bookletOpts(s)); break;
      case 'fierybooklet':
        // Fiery bleed is always 1/8".
        b = await fieryBooklet(b, {
          bleedIn: 0.125, bleedFromDoc: false,
          rtl: !!s.rtl, coverIsPage1: s.coverIsPage1 !== false, setTrimBox: s.setTrimBox !== false,
        }); break;
      case 'fieryserial': {
        // Same spine-bleed trim as Fiery Booklet. The per-copy numbering happens
        // at export (one file per serial number) — see runSerial(). For the live
        // PREVIEW only, stamp the first number so the corner is visible.
        b = await fieryBooklet(b, {
          bleedIn: 0.125, bleedFromDoc: false,
          rtl: !!s.rtl, coverIsPage1: s.coverIsPage1 !== false, setTrimBox: s.setTrimBox !== false,
        });
        if (!forExport) {
          b = await stampSerialNumber(b, {
            text: serialLabel(s.template, Math.max(1, Math.round(s.start ?? 1)), Math.max(1, Math.round(s.total ?? 1))),
            page: 1, insetRightIn: s.insetRightIn ?? 0.75, insetBottomIn: s.insetBottomIn ?? 0.75,
            fontSizePt: s.fontSizePt ?? 12, bold: s.bold !== false,
          });
        }
        break;
      }
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
      case 'cards': case 'grid': case 'cutstack': case 'perfectbound':
      case 'trading': case 'bookmark': case 'flyer': case 'indexcard':
      case 'business': case 'postcard': case 'rackcard': case 'hangtag': case 'label':
      case 'namebadge': case 'ticket': case 'coupon': case 'placecard': case 'greeting':
      case 'doorhanger': case 'envelope': case 'coaster': case 'contact': case 'compslip':
      case 'trifold': case 'zfold': case 'gatefold': case 'menu':
      case 'poster': case 'banner': case 'rollbanner': case 'featherflag': case 'yardsign':
      case 'boxcarton': case 'presfolder':
        // Single-sheet gang tools can opt into Replicate (auto-sized sheet +
        // copies + extra art); otherwise the normal fixed-sheet N-up runs.
        b = s.replicate ? await replicateFill(b, replicateOpts(s)) : await imposeNUp(b, nupOpts(s)); break;
      case 'replicate': b = await replicateFill(b, replicateOpts(s)); break;
      case 'divinitybox': {
        // Self-contained: builds the box flat from the four uploaded panels and
        // ignores the pipeline input entirely.
        const art = (v: { bytes?: Uint8Array } | null | undefined) => (v?.bytes ? { bytes: v.bytes } : null);
        b = await imposeDivinityBox({
          a: art(s.a), b: art(s.b), c: art(s.c), d: art(s.d),
          fit: (s.fit ?? 'cover') as 'cover' | 'contain' | 'stretch',
          whiteUnder: s.whiteUnder !== false, varnish: !!s.varnish, foldMarks: s.foldMarks !== false,
        });
        break;
      }
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
      case 'pdfx': {
        const { exportPdfX } = await import('@/lib/imposition-toolkit/pdfx');
        // Use the uploaded profile if any, else the bundled generic CMYK one.
        let icc = s.icc as Uint8Array | null;
        if (!icc || s.iccSource !== 'upload') {
          const res = await fetch('/icc/generic-cmyk.icc');
          icc = new Uint8Array(await res.arrayBuffer());
        }
        b = await exportPdfX(b, {
          standard: s.standard === 'x-1a' ? 'x-1a' : 'x-4',
          icc, convertCmyk: !!s.convertCmyk, intent: s.intent, dpi: s.dpi,
          conditionName: s.iccSource === 'upload' ? (s.iccName || 'Custom CMYK') : 'Generic CMYK',
        });
        break;
      }
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
      case 'split': case 'preflight': case 'datamerge': break;
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

// ── Fiery Serial Booklet: numbered edition output ────────────────────────────
// The export path calls this instead of a single download when a fieryserial
// step is enabled. `base` is the already-trimmed booklet (forExport pipeline,
// NOT yet numbered). We stamp page 1 with each serial number and hand the caller
// one file at a time via `onCopy`, so peak memory stays at ~one book — never a
// giant concatenated PDF that could exceed the browser's limits.
export function serialStep(steps: WorkflowStep[]): WorkflowStep | undefined {
  return steps.find((st) => st.enabled && st.type === 'fieryserial');
}
export function serialRange(s: StepSettings): { start: number; end: number; total: number } {
  const total = Math.max(1, Math.round(s.total ?? 1));
  const start = Math.min(total, Math.max(1, Math.round(s.start ?? 1)));
  const end = Math.min(total, Math.max(start, Math.round(s.end || total)));
  return { start, end, total };
}
export async function runSerial(
  base: Uint8Array,
  step: WorkflowStep,
  onCopy: (bytes: Uint8Array, n: number, total: number) => Promise<void> | void,
): Promise<void> {
  const s = step.s;
  const { start, end, total } = serialRange(s);
  for (let n = start; n <= end; n++) {
    const copy = await stampSerialNumber(base, {
      text: serialLabel(s.template, n, total), page: 1,
      insetRightIn: s.insetRightIn ?? 0.75, insetBottomIn: s.insetBottomIn ?? 0.75,
      fontSizePt: s.fontSizePt ?? 12, bold: s.bold !== false,
    });
    await onCopy(copy, n, total);
  }
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
  if (Array.isArray(c.extras)) c.extras = [];
  if (c.stamp) { c.stamp = null; c.stampName = ''; }
  for (const k of ['a', 'b', 'c', 'd'] as const) if (c[k] && (c[k] as { bytes?: Uint8Array }).bytes) c[k] = null;
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
