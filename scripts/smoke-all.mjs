/* Every remaining tool: run the real engine, verify the PDF, render page 1.
   Nothing is reported as working unless it produced a PDF that opens and has
   the pages/size it should. */
import fs from 'node:fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { sourceArt, renderPng, countBlocks, OUT, PT } from './smoke.mjs';
import * as E from '../src/lib/imposition-toolkit/impose.ts';
import { fitPerfectBound } from '../src/lib/imposition-toolkit/fit/perfect-bound.ts';

async function doc(pages, wIn = 8.5, hIn = 11, label = 'P') {
  const d = await PDFDocument.create();
  const font = await d.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const p = d.addPage([wIn * PT, hIn * PT]);
    p.drawRectangle({ x: 12, y: 12, width: wIn * PT - 24, height: hIn * PT - 24,
      color: rgb(0.85, 0.1, 0.55) });
    p.drawText(`${label}${i + 1}`, { x: 26, y: hIn * PT - 54, size: 28, font, color: rgb(1, 1, 1) });
  }
  return d.save();
}

const MARKS = { addMarks: true, markLenIn: 0.25, markOffIn: 0.125, markWeightPt: 0.25 };
const NUP = (o) => ({ sheetWIn: 8.5, sheetHIn: 11, cols: 1, rows: 1, marginIn: 0.25,
  gutterIn: 0.125, repeatFirst: false, ...MARKS, ...o });

// [id, async () => bytes, expectations]
const CASES = [
  // ---- bleed-inclusive + fixed die -------------------------------------
  // 6.88 x 10.5 goes 2-up on 12 x 18 only when TURNED: two side by side is
  // 13.76" wide and two stacked is 21" tall, but two turned is 12 x 13.76.
  ['artprint', async () => E.imposeNUp(await doc(2, 6.88, 10.5), NUP({
    sheetWIn: 12, sheetHIn: 18, cols: 1, rows: 2, cellWIn: 10.5, cellHIn: 6.88,
    bleedIn: 0.125, autoOrient: false, rotateItems: true, buttCut: true })),
    { items: 2, sheet: [12, 18] }],
  // The die is fixed, so mark clearance must not push rows off it: buttCut and
  // no marks, exactly like the template sheet the die was made from.
  ['prooflabel', async () => E.imposeNUp(await doc(1, 2.625, 1), NUP({
    cols: 3, rows: 10, cellWIn: 2.625, cellHIn: 1, marginIn: 0.19, gutterIn: 0.12,
    gutterYIn: 0, repeatFirst: true, fit: 'stretch', autoOrient: false,
    addMarks: false, buttCut: true })), { items: 30 }],

  // ---- large format -----------------------------------------------------
  ['poster', async () => E.imposeNUp(await doc(1, 24, 36), NUP({ sheetWIn: 24, sheetHIn: 36,
    marginIn: 0, gutterIn: 0, addMarks: false })), { items: 1, sheet: [24, 36] }],
  ['banner', async () => E.imposeNUp(await doc(1, 24, 72), NUP({ sheetWIn: 24, sheetHIn: 72,
    marginIn: 0, gutterIn: 0, addMarks: false })), { items: 1, sheet: [24, 72] }],
  ['rollbanner', async () => E.imposeNUp(await doc(1, 33, 80), NUP({ sheetWIn: 33, sheetHIn: 80,
    marginIn: 0, gutterIn: 0, addMarks: false })), { items: 1, sheet: [33, 80] }],
  ['featherflag', async () => E.imposeNUp(await doc(1, 30, 100), NUP({ sheetWIn: 30, sheetHIn: 100,
    marginIn: 0, gutterIn: 0, addMarks: false })), { items: 1, sheet: [30, 100] }],
  ['yardsign', async () => E.imposeNUp(await doc(1, 24, 18), NUP({ sheetWIn: 24, sheetHIn: 18,
    marginIn: 0, gutterIn: 0, addMarks: false })), { items: 1, sheet: [24, 18] }],

  // ---- folded -----------------------------------------------------------
  ['trifold', async () => E.addFoldMarks(await doc(1, 11, 8.5), { scheme: 'tri', orientation: 'vertical', edge: 'both', style: 'dashed', pages: 'all' }), { pages: 1, sheet: [11, 8.5] }],
  ['zfold', async () => E.addFoldMarks(await doc(1, 17, 11), { scheme: 'tri', orientation: 'vertical', edge: 'both', style: 'dashed', pages: 'all' }), { pages: 1, sheet: [17, 11] }],
  ['gatefold', async () => E.addFoldMarks(await doc(1, 11, 8.5), { scheme: 'gate', orientation: 'vertical', edge: 'both', style: 'dashed', pages: 'all' }), { pages: 1 }],
  ['menu', async () => E.addFoldMarks(await doc(1, 17, 11), { scheme: 'half', orientation: 'vertical', edge: 'both', style: 'dashed', pages: 'all' }), { pages: 1, sheet: [17, 11] }],
  ['zine', async () => E.imposeFoldZine(await doc(8, 4.25, 5.5), { format: 'mini', sheetWIn: 11, sheetHIn: 8.5, flipBackCover: true }), { items: 8, sheet: [11, 8.5] }],

  // ---- bound ------------------------------------------------------------
  ['booklet', async () => E.imposeBooklet(await doc(8, 5.5, 8.5), { sheetWIn: 11, sheetHIn: 8.5,
    landscape: true, autoscale: true, preserveAspect: true, marginIn: 0.2, marginTopIn: 0.2,
    gutterIn: 0, creepIn: 0.007, creepOutward: true, centerOutput: true, ...MARKS,
    signatureSheets: 0, fillLastSaddle: true }), { pages: 4, items: 2, sheet: [11, 8.5] }],
  ['magazine', async () => E.imposeBooklet(await doc(16, 8.27, 11.69), { sheetWIn: 16.54, sheetHIn: 11.69,
    landscape: true, autoscale: true, preserveAspect: true, marginIn: 0.2, marginTopIn: 0.2,
    gutterIn: 0, creepIn: 0.007, creepOutward: true, centerOutput: true, ...MARKS,
    signatureSheets: 4, fillLastSaddle: true }), { pages: 8, items: 2 }],
  // 6 x 9 pages go 2-up on 11 x 17 only TURNED: two side by side is 12" wide.
  // Driven by the calculator so the smoke cannot disagree with it.
  ['perfectbound', async () => {
    const f = fitPerfectBound({ sheetWIn: 11, sheetHIn: 17, addMarks: true,
      markOffIn: 0.125, markLenIn: 0.25 });
    return E.imposeNUp(await doc(8, 6, 9), NUP({ sheetWIn: 11, sheetHIn: 17,
      cols: f.cols, rows: f.rows, cellWIn: f.cellWIn, cellHIn: f.cellHIn,
      marginIn: f.marginIn, gutterIn: f.gutterXIn, gutterYIn: f.gutterYIn,
      rotateItems: f.rotated, autoOrient: false, cutStack: true, duplex: true,
      duplexFlip: 'long' }));
  }, { items: 2, sheet: [11, 17] }],
  ['cutstack', async () => E.imposeNUp(await doc(8), NUP({ cols: 2, rows: 2, cutStack: true })), { items: 4 }],
  ['nupbook', async () => E.imposeNUpBook(await doc(8, 5.5, 8.5), { sheetWIn: 11, sheetHIn: 8.5,
    cols: 2, rows: 1, marginIn: 0.25, gutterIn: 0.125, ...MARKS }), { items: 4 }],
  ['fierybooklet', async () => E.fieryBooklet(await doc(4, 6.75, 10.5), { bleedIn: 0.125 }), {}],
  ['calendar', async () => E.imposeCalendar(await doc(2, 11, 8.5), { halfSheet: false, rotateBack: true, ...MARKS, addMarks: false }), {}],

  // ---- marks and page furniture ----------------------------------------
  ['cuttermarks', async () => E.addCutterMarks(await doc(1), { cutTypes: ['thru'], shape: 'corner',
    sizeIn: 0.25, placement: 'inside', refBox: 'media', marginIn: 0.25, pages: 'all' }), { pages: 1 }],
  ['colorbar', async () => E.addPressColorBar(await doc(1), { location: 'bottom',
    marginAlongIn: 0.25, marginAcrossIn: 0.1, sizeIn: 0.16, colors: true, spotColors: true,
    shapes: { solid: true, tint: true }, repeat: false, pages: 'all' }), { pages: 1 }],
  ['slugline', async () => E.addJobSlug(await doc(1), { text: 'smoke · [date]', position: 'bottom', fontSizePt: 7 }), { pages: 1 }],
  ['foldmarks', async () => E.addFoldMarks(await doc(1), { scheme: 'half', orientation: 'vertical', edge: 'both', style: 'dashed', pages: 'all' }), { pages: 1 }],
  ['collating', async () => E.addCollatingMarks(await doc(8), { edge: 'left', pagesPerSig: 4 }), { pages: 8 }],
  ['omr', async () => E.addOmrMarks(await doc(4), { edge: 'left', encoding: 'binary', program: 1, bitCount: 8, pages: 'all' }), { pages: 4 }],
  ['gathering', async () => E.addGatheringMarks(await doc(4), { edge: 'bottom' }), { pages: 4 }],
  ['laymarks', async () => E.addLayMarks(await doc(1), { markType: 'arrow', edges: 'both', gripperEdge: 'bottom', sideGuideSide: 'left', pages: 'all' }), { pages: 1 }],
  ['watermark', async () => E.addTextWatermark(await doc(1), { text: 'PROOF', opacity: 0.16, angleDeg: 45, fontSizePt: 96 }), { pages: 1 }],
  ['pagenumbers', async () => E.addPageNumbers(await doc(3), { position: 'bottom-center', startAt: 1, prefix: '', suffix: '', fontSizePt: 10, marginPt: 24 }), { pages: 3 }],
  ['headerfooter', async () => E.addHeaderFooter(await doc(2), { header: 'HDR', footer: 'FTR', fontSizePt: 9, marginPt: 18, align: 'center' }), { pages: 2 }],
  ['barcode', async () => E.addBarcodeStamp(await doc(1), { text: 'SMOKE-1', symbology: 'qr', scale: 3, quietZone: 4, barHeightMm: 15, position: 'br', marginPt: 18, xOffsetPt: 18, yOffsetPt: 18, rotationDeg: 0, transparent: false, showText: true, pages: 'all' }), { pages: 1 }],
  ['dimensions', async () => E.addDimensions(await doc(1)), { pages: 1 }],
  ['bleed', async () => E.generateBleed(await doc(1), { bleedIn: 0.125 }), { pages: 1 }],
  ['braille', async () => E.addBraille(await doc(1), { text: 'smoke test', xIn: 0.5, yIn: 0.5, pages: 'all' }), { pages: 1 }],
  ['whitevarnish', async () => E.addWhiteVarnish(await doc(1), { spotName: 'White',
    coverage: 'trim', tint: 1, under: true, pages: 'all' }), { pages: 1 }],

  // ---- PDF operations ---------------------------------------------------
  ['shuffle', async () => E.shufflePages(await doc(4), 'reverse'), { pages: 4 }],
  ['rotate', async () => E.rotatePdf(await doc(2), 90, 'all'), { pages: 2 }],
  ['flip', async () => E.flipPdf(await doc(2), 'h', 'all'), { pages: 2 }],
  ['crop', async () => E.cropPdf(await doc(1), { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }, 'all'), { pages: 1 }],
  // splitPdf returns an ARRAY of documents, one per range.
  ['split', async () => (await E.splitPdf(await doc(6), '1-3,4-6'))[0], { pages: 3 }],
  ['merge', async () => E.mergePdfs([await doc(2), await doc(3)]), { pages: 5 }],
  ['overlay', async () => E.overlayPdf(await doc(2), await doc(1, 8.5, 11, 'S'), { opacity: 0.5, mode: 'center' }), { pages: 2 }],
  ['distort', async () => E.distortPdf(await doc(1), { factorPct: 110, direction: 'circ', pages: 'all' }), { pages: 1 }],
  ['resize', async () => E.resizePdf(await doc(1), { mode: 'fit', scalePct: 100, targetWIn: 8.27, targetHIn: 11.69 }, 'all'), { pages: 1, sheet: [8.27, 11.69] }],
  ['mix', async () => E.mixPdfs(await doc(3, 8.5, 11, 'A'), await doc(3, 8.5, 11, 'B'), false), { pages: 6 }],
  ['nudge', async () => E.nudgePdf(await doc(1), { dxIn: 0.1, dyIn: 0.1, rotateDeg: 0, pages: 'all' }), { pages: 1 }],
  // Colour Effects rasterises through a canvas, so it is browser-only by
  // design and refuses in node. Verified by the refusal, not skipped silently.
  ['coloreffects', async () => {
    try { await E.applyColorEffects(await doc(1), { brightness: 110, contrast: 100, saturation: 90,
      grayscale: 0, warmTone: 0, invert: 0, hueRotate: 0, dpi: 150, pages: 'all' }); }
    catch (e) {
      if (/browser/i.test(e.message)) return doc(1);      // correct refusal
      throw e;
    }
    throw new Error('expected a browser-only refusal in node');
  }, { pages: 1, browserOnly: true }],
  ['pdftools', async () => E.optimizePdf(await doc(2), { useObjectStreams: true, removeUnused: true, stripMetadata: false, removeAnnotations: false, removeJavaScript: true }), { pages: 2 }],
  ['trimart', async () => E.trimToArtwork(await doc(1), { page: 1, dpi: 100 }), { pages: 1 }],
  ['replicate', async () => E.replicateFill(await doc(1, 3, 2), { sheetWIn: 8.5, sheetHIn: 11,
    marginIn: 0.25, gutterXIn: 0, gutterYIn: 0, addMarks: true, markLenIn: 0.25, markOffIn: 0.125,
    fit: 'contain', page: 1 }), {}],
  ['stickers', async () => E.nestPdf(await doc(1, 2, 2), { sheetWIn: 11, sheetHIn: 8.5,
    roll: false, fillSheet: true, copies: 12, paddingIn: 0.1, marginIn: 0.2,
    allowRotate: true }), {}],
  ['customimpose', async () => E.imposeCustomGrid(await doc(4), { cols: 2, rows: 2,
    sheetWIn: 11, sheetHIn: 17, marginIn: 0.25, gutterIn: 0.125, addMarks: false,
    sheets: [[{ page: 1, rot: 0 }, { page: 2, rot: 0 }, { page: 3, rot: 0 }, { page: 4, rot: 0 }]],
  }), { items: 4 }],
  // ---- remaining bound + specials --------------------------------------
  ['comic', async () => E.imposeBooklet(await doc(8, 6.625, 10.25), { sheetWIn: 13.25, sheetHIn: 10.25,
    landscape: true, autoscale: true, preserveAspect: true, marginIn: 0.2, marginTopIn: 0.2,
    gutterIn: 0, creepIn: 0.007, creepOutward: true, centerOutput: true, ...MARKS,
    signatureSheets: 0, fillLastSaddle: true }), { pages: 4, items: 2 }],
  ['catalog', async () => E.imposeBooklet(await doc(8, 8, 8), { sheetWIn: 16, sheetHIn: 8,
    landscape: true, autoscale: true, preserveAspect: true, marginIn: 0.2, marginTopIn: 0.2,
    gutterIn: 0, creepIn: 0.007, creepOutward: true, centerOutput: true, ...MARKS,
    signatureSheets: 0, fillLastSaddle: true }), { pages: 4, items: 2 }],
  ['program', async () => E.imposeBooklet(await doc(8, 5.83, 8.27), { sheetWIn: 11.69, sheetHIn: 8.27,
    landscape: true, autoscale: true, preserveAspect: true, marginIn: 0.2, marginTopIn: 0.2,
    gutterIn: 0, creepIn: 0.007, creepOutward: true, centerOutput: true, ...MARKS,
    signatureSheets: 0, fillLastSaddle: true }), { pages: 4, items: 2 }],
  ['notebook', async () => E.imposeBooklet(await doc(8, 5.83, 8.27), { sheetWIn: 11.69, sheetHIn: 8.27,
    landscape: true, autoscale: true, preserveAspect: true, marginIn: 0.2, marginTopIn: 0.2,
    gutterIn: 0, creepIn: 0.007, creepOutward: true, centerOutput: true, ...MARKS,
    signatureSheets: 0, fillLastSaddle: true }), { pages: 4, items: 2 }],
  ['hymnal', async () => E.imposeBooklet(await doc(16, 5.83, 8.27), { sheetWIn: 11.69, sheetHIn: 8.27,
    landscape: true, autoscale: true, preserveAspect: true, marginIn: 0.2, marginTopIn: 0.2,
    gutterIn: 0, creepIn: 0.007, creepOutward: true, centerOutput: true, ...MARKS,
    signatureSheets: 4, fillLastSaddle: true }), { pages: 8, items: 2 }],
  ['fieryserial', async () => E.stampSerialNumber(await doc(3), { text: E.serialLabel('SN-{n} of {total}', 1, 3),
    page: 1, fontSizePt: 12, bold: true }), { pages: 3 }],
  // repeatFirst fills the leftover cells with copies of page 1 — without it a
  // 4-page source only ever fills 4 of the 8 cells.
  ['cards', async () => E.imposeNUp(await doc(4, 3.5, 2), NUP({ cols: 2, rows: 4,
    cellWIn: 3.5, cellHIn: 2, buttCut: true, autoOrient: false, repeatFirst: true })), { items: 8 }],
  ['grid', async () => E.imposeNUp(await doc(4), NUP({ cols: 2, rows: 2 })), { items: 4 }],
  ['boxcarton', async () => E.imposeNUp(await doc(1, 9, 14), NUP({ sheetWIn: 11, sheetHIn: 17,
    cols: 1, rows: 1, cellWIn: 9, cellHIn: 14, autoOrient: false })), { items: 1, sheet: [11, 17] }],
  ['presfolder', async () => E.imposeNUp(await doc(1, 9, 12), NUP({ sheetWIn: 11, sheetHIn: 17,
    cols: 1, rows: 1, cellWIn: 9, cellHIn: 12, autoOrient: false })), { items: 1, sheet: [11, 17] }],
  ['regmarks', async () => E.addCutterMarks(await doc(1), { cutTypes: ['thru'], shape: 'circle',
    sizeIn: 0.2, placement: 'outside', refBox: 'media', marginIn: 0.2, pages: 'all' }), { pages: 1 }],
  ['insertpages', async () => E.insertPages(await doc(4), await doc(2, 8.5, 11, 'I'),
    { mode: 'at', position: 2, everyN: 1, count: 1 }), {}],
  ['backdrop', async () => E.addBackdropFile(await doc(2), await doc(1, 8.5, 11, 'B'),
    { repeat: true, offsetXPt: 0, offsetYPt: 0, scalePct: 100, opacity: 0.6, pages: 'all' }), { pages: 2 }],
  ['layers', async () => E.setLayers(await doc(1), []), { pages: 1 }],
  ['pdfx', async () => E.repairPdf(await doc(1)), { pages: 1 }],
  ['preflight', async () => { await E.getPdfInfo(await doc(2)); return doc(2); }, { pages: 2 }],
];

const rows = [];
for (const [id, run, exp] of CASES) {
  let status = 'PASS', note = '', pages = 0, items = -1, sheet = '';
  try {
    const bytes = await run();
    if (!bytes || bytes.length < 200) throw new Error('no output');
    const r = await renderPng(bytes, `${OUT}/${id}.png`);
    pages = r.pages;
    sheet = `${(r.ptW / PT).toFixed(2)}x${(r.ptH / PT).toFixed(2)}`;
    items = countBlocks(r.ctx, r.w, r.h).length;
    if (exp.pages && pages !== exp.pages) { status = 'FAIL'; note = `${pages} pages, expected ${exp.pages}`; }
    if (exp.sheet) {
      const [w, h] = exp.sheet;
      if (Math.abs(r.ptW - w * PT) > 2 || Math.abs(r.ptH - h * PT) > 2) {
        status = 'FAIL'; note += ` sheet ${sheet}" != ${w}x${h}"`;
      }
    }
    if (exp.items !== undefined && items !== exp.items) {
      status = 'FAIL'; note += ` ${items} items on page 1, expected ${exp.items}`;
    }
  } catch (e) { status = 'FAIL'; note = `THREW: ${e.message}`; }
  rows.push({ id, pages, items, sheet, status, note });
}

const pad = (v, n) => String(v).padEnd(n);
console.log(pad('tool', 15), pad('pages', 6), pad('items', 6), pad('sheet', 13), 'result');
console.log('-'.repeat(88));
for (const r of rows) console.log(pad(r.id, 15), pad(r.pages, 6), pad(r.items < 0 ? '-' : r.items, 6), pad(r.sheet, 13), r.status, r.note);
const bad = rows.filter((r) => r.status === 'FAIL');
console.log(`\n${rows.length - bad.length}/${rows.length} pass`);
fs.writeFileSync(`${OUT}/all-results.json`, JSON.stringify(rows, null, 2));
process.exit(bad.length ? 1 : 0);
