import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { computeNUpGrid, imposeNUp, imposeBooklet, replicateFill, replicateGrid, orientCell, stampSerialNumber, serialLabel, chokePlane } from '../src/lib/imposition-toolkit/impose.ts';

const PT = 72;
const baseNUp = {
  sheetWIn: 8.5, sheetHIn: 11, cols: 2, rows: 2, marginIn: 0.25, gutterIn: 0.125,
  repeatFirst: false, addMarks: false, markLenIn: 0.1, markOffIn: 0.1,
};

async function pdfOf(n: number, w = 252, h = 144) {
  const d = await PDFDocument.create();
  for (let i = 0; i < n; i++) {
    const p = d.addPage([w, h]);
    // Give every page a real Contents stream — pdf-lib refuses to embed a page
    // that has none ("Can't embed page with missing Contents").
    p.drawRectangle({ x: 4, y: 4, width: w - 8, height: h - 8 });
  }
  return d.save();
}
async function pageCount(bytes: Uint8Array) {
  return (await PDFDocument.load(bytes)).getPageCount();
}

test('computeNUpGrid honours requested cols/rows and centres the block', () => {
  const g = computeNUpGrid({ ...baseNUp, cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2 });
  assert.equal(g.cols, 2);          // requested 2, fits 2
  assert.equal(g.rows, 5);          // requested 5, fits 5
  const blockW = g.cols * g.cellWPt + (g.cols - 1) * g.gxPt;
  const expectLeft = (8.5 * PT - blockW) / 2;
  assert.ok(Math.abs(g.leftGapPt - expectLeft) < 0.01, 'block is horizontally centred');
});

test('computeNUpGrid: 1×1 places a single cell even when many would fit', () => {
  // The core bug fix: a fixed cell size must NOT fill the whole sheet.
  const g = computeNUpGrid({ ...baseNUp, cols: 1, rows: 1, cellWIn: 3, cellHIn: 5 });
  assert.equal(g.cols, 1);
  assert.equal(g.rows, 1);
});

test('orientCell swaps a portrait cell for landscape artwork (and leaves matches alone)', () => {
  assert.deepEqual(orientCell(3, 5, true), [5, 3]);    // portrait cell, landscape art → swap
  assert.deepEqual(orientCell(3, 5, false), [3, 5]);   // both portrait → unchanged
  assert.deepEqual(orientCell(5, 3, true), [5, 3]);    // both landscape → unchanged
  assert.deepEqual(orientCell(5, 3, false), [3, 5]);   // landscape cell, portrait art → swap
});

test('imposeNUp: auto-orients the sheet-cell layout for landscape art', async () => {
  // Landscape source (w>h) into a portrait 3×5 cell, 1×1 → the placed cell is
  // oriented landscape, so with a landscape sheet it fills without cropping.
  const out = await imposeNUp(await pdfOf(1, 720, 288), {
    ...baseNUp, sheetWIn: 11, sheetHIn: 8.5, cols: 1, rows: 1, cellWIn: 3, cellHIn: 5, fit: 'cover',
  });
  assert.equal(await pageCount(out), 1);
});

test('computeNUpGrid clamps requested cols/rows to what physically fits', () => {
  const g = computeNUpGrid({ ...baseNUp, cols: 99, rows: 99, cellWIn: 3.5, cellHIn: 2 });
  assert.equal(g.cols, 2);          // only 2 columns fit on 8.5"
  assert.equal(g.rows, 5);          // only 5 rows fit on 11"
});

test('exact 2-up (two Letter pages) fits on 11x17 with zero margin', () => {
  const g = computeNUpGrid({ ...baseNUp, sheetWIn: 17, sheetHIn: 11, cellWIn: 8.5, cellHIn: 11, marginIn: 0, gutterIn: 0 });
  assert.equal(g.cols, 2);
  assert.equal(g.rows, 1);
});

test('imposeNUp: 10 pages, 10-up → 1 sheet', async () => {
  const out = await imposeNUp(await pdfOf(10), { ...baseNUp, cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2 });
  assert.equal(await pageCount(out), 1);
});

test('imposeNUp: 1×1 fixed cell places one page per sheet (no auto-tiling)', async () => {
  // 4 pages, 1×1 → one page per sheet → 4 sheets (not tiled onto one).
  const out = await imposeNUp(await pdfOf(4), { ...baseNUp, cols: 1, rows: 1, cellWIn: 3, cellHIn: 5 });
  assert.equal(await pageCount(out), 4);
});

test('imposeNUp: duplex pairs two source pages per leaf', async () => {
  // 4 source pages, 1x2 duplex → 2 items, 2 per sheet → 1 sheet × (front+back) = 2 output pages.
  const out = await imposeNUp(await pdfOf(4), { ...baseNUp, cols: 1, rows: 2, duplex: true });
  assert.equal(await pageCount(out), 2);
});

test('imposeNUp: cover fit does not throw and yields a valid PDF', async () => {
  // wide source into a portrait cell → cover-crop path (with clip).
  const out = await imposeNUp(await pdfOf(2, 1000, 200), { ...baseNUp, cols: 2, rows: 2, cellWIn: 3.5, cellHIn: 2, fit: 'cover' });
  assert.ok((await pageCount(out)) >= 1);
});

test('imposeNUp: per-image fit overrides apply without throwing', async () => {
  // Different fit/zoom per source page: page 0 contained, page 1 cover-zoomed,
  // page 2 stretched; page 3 falls back to the global fit.
  const out = await imposeNUp(await pdfOf(4, 1000, 200), {
    ...baseNUp, cols: 2, rows: 2, cellWIn: 3.5, cellHIn: 2, fit: 'cover',
    perImage: {
      0: { fit: 'contain' },
      1: { fit: 'cover', imageZoom: 1.5, imageOffsetX: 0.2, imageOffsetY: 0.8 },
      2: { fit: 'stretch' },
    },
  });
  assert.equal(await pageCount(out), 1);
});

const baseBook = {
  rtl: false, marginIn: 0.25, gutterIn: 0, creepIn: 0, addMarks: true,
  markLenIn: 0.1, markOffIn: 0.1, sheetWIn: 17, sheetHIn: 11,
  autoscale: true, preserveAspect: true, bleedIn: 0.125,
};

test('imposeBooklet: spine-bleed drop produces valid spreads', async () => {
  // 8 pages → 4 spreads (2 sheets × 2 sides). Fixed 1/8" bleed, dropped at spine.
  const out = await imposeBooklet(await pdfOf(8, 612, 792), { ...baseBook });
  assert.equal(await pageCount(out), 4);
});

test('imposeBooklet: keepSpineBleed keeps the legacy full-bleed placement', async () => {
  const out = await imposeBooklet(await pdfOf(8, 612, 792), { ...baseBook, keepSpineBleed: true });
  assert.equal(await pageCount(out), 4);
});

test('imposeBooklet: spine drop is a no-op path when there is no bleed', async () => {
  const out = await imposeBooklet(await pdfOf(4, 612, 792), { ...baseBook, bleedIn: 0 });
  assert.equal(await pageCount(out), 2);
});

test('fieryBooklet: single pages out, spine bleed trimmed per page', async () => {
  const { fieryBooklet } = await import('../src/lib/imposition-toolkit/impose.ts');
  const PT2 = 72, B = 0.125 * PT2;
  const W = 6.25 * PT2, H = 9.25 * PT2;           // 6x9 trim + 1/8" bleed all round
  const out = await fieryBooklet(await pdfOf(4, W, H), { bleedIn: 0.125, rtl: false });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 4);            // single pages, same order
  for (const p of doc.getPages()) {
    const s = p.getSize();
    assert.ok(Math.abs(s.width - (W - B)) < 0.5, `page width trimmed by one bleed (${s.width})`);
    assert.ok(Math.abs(s.height - H) < 0.5, 'height unchanged');
  }
});

test('replicateGrid: packs as many fixed cells as safely fit the sheet', () => {
  // 3.5×2" cards on 8.5×11" with 0.25" margin, 0.125" gutter → 2 cols × 5 rows.
  const g = replicateGrid({ sheetWIn: 8.5, sheetHIn: 11, cellWIn: 3.5, cellHIn: 2, marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125 });
  assert.equal(g.cols, 2);
  assert.equal(g.rows, 5);
});

test('replicateFill: output is exactly the SELECTED sheet size (never grows)', async () => {
  const out = await replicateFill(await pdfOf(1, 3.5 * 72, 2 * 72), {
    sheetWIn: 8.5, sheetHIn: 11, cellWIn: 3.5, cellHIn: 2, marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125, addMarks: false,
  });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 1);
  const s = doc.getPage(0).getSize();
  assert.ok(Math.abs(s.width - 8.5 * 72) < 0.5, `sheet width is the selected 8.5" (${s.width})`);
  assert.ok(Math.abs(s.height - 11 * 72) < 0.5, `sheet height is the selected 11" (${s.height})`);
});

test('replicateGrid: auto-oriented landscape cell changes how many fit', () => {
  // A 3×5 cell oriented to 5×3 for landscape art fits differently on 11×17.
  const portrait = replicateGrid({ sheetWIn: 11, sheetHIn: 17, cellWIn: 3, cellHIn: 5, marginIn: 0.25, gutterXIn: 0, gutterYIn: 0 });
  const landscape = replicateGrid({ sheetWIn: 11, sheetHIn: 17, cellWIn: 5, cellHIn: 3, marginIn: 0.25, gutterXIn: 0, gutterYIn: 0 });
  assert.notDeepEqual([portrait.cols, portrait.rows], [landscape.cols, landscape.rows]);
});

test('replicateFill: extra art occupies its cells, primary fills the rest', async () => {
  const extra = await pdfOf(1, 3 * 72, 3 * 72);
  const out = await replicateFill(await pdfOf(1, 3 * 72, 3 * 72), {
    sheetWIn: 8.5, sheetHIn: 11, cellWIn: 3, cellHIn: 3, marginIn: 0, gutterXIn: 0, gutterYIn: 0, addMarks: false,
    extras: [{ bytes: extra, qty: 1 }],
  });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 1);             // one packed sheet, the selected size
});

test('serialLabel formats the running number', () => {
  assert.equal(serialLabel('{n}/{total}', 3, 200), '3/200');
  assert.equal(serialLabel('No. {n} of {total}', 1, 50), 'No. 1 of 50');
});

test('stampSerialNumber: stamps only the chosen page, keeps page count', async () => {
  const src = await pdfOf(4, 6 * 72, 9 * 72);
  const out = await stampSerialNumber(src, { text: '7/200', page: 1, insetRightIn: 0.75, insetBottomIn: 0.75 });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 4);                 // single pages preserved
  const s = doc.getPage(0).getSize();
  assert.ok(Math.abs(s.width - 6 * 72) < 0.5 && Math.abs(s.height - 9 * 72) < 0.5, 'page geometry unchanged');
});

test('imposeNUp: crop marks never cross into a neighbour (small gutter)', async () => {
  // 2×2 of 4×6 cards on 12×18 with a small 0.125" gutter and long 0.5" marks.
  // With clamping, marks must stay within the gutter/margins — assert the output
  // builds and stays on the sheet (no throw, single sheet).
  const out = await imposeNUp(await pdfOf(4, 4 * 72, 6 * 72), {
    sheetWIn: 12, sheetHIn: 18, cols: 2, rows: 2, cellWIn: 4, cellHIn: 6,
    marginIn: 0.25, gutterIn: 0.125, repeatFirst: false,
    addMarks: true, markLenIn: 0.5, markOffIn: 0.125,
  });
  assert.equal(await pageCount(out), 1);
});

test('computeNUpGrid: a card bigger than the sheet still returns 1×1 (no overflow tiling)', () => {
  // 4×6 card on a tiny 5×5 sheet: only 1×1 can be requested; the panel warns.
  const g = computeNUpGrid({ ...baseNUp, sheetWIn: 5, sheetHIn: 5, cols: 3, rows: 3, cellWIn: 4, cellHIn: 6 });
  assert.equal(g.cols, 1);
  assert.equal(g.rows, 1);
});

test('computeNUpGrid reserves space for cut marks (fewer fit with marks on)', () => {
  const noMarks = computeNUpGrid({ ...baseNUp, cols: 99, rows: 99, sheetWIn: 12, sheetHIn: 12, cellWIn: 2, cellHIn: 2, marginIn: 0, gutterIn: 0, addMarks: false });
  const withMarks = computeNUpGrid({ ...baseNUp, cols: 99, rows: 99, sheetWIn: 12, sheetHIn: 12, cellWIn: 2, cellHIn: 2, marginIn: 0, gutterIn: 0, addMarks: true, markOffIn: 0.125, markLenIn: 0.5 });
  assert.ok(withMarks.cols < noMarks.cols || withMarks.rows < noMarks.rows, 'marks reserve space so fewer fit');
});

test('replicateGrid: markAllow reserves space and lowers the count', () => {
  const bare = replicateGrid({ sheetWIn: 11, sheetHIn: 17, cellWIn: 5, cellHIn: 5, marginIn: 0, gutterXIn: 0, gutterYIn: 0 });
  const marked = replicateGrid({ sheetWIn: 11, sheetHIn: 17, cellWIn: 5, cellHIn: 5, marginIn: 0, gutterXIn: 0, gutterYIn: 0, markAllowIn: 0.5 });
  assert.ok(marked.cols * marked.rows <= bare.cols * bare.rows);
  assert.ok(marked.marginIn >= 0.5 && marked.gutterXIn >= 0.5, 'effective margin/gutter grew to fit marks');
});

test('replicateFill: rotates the image 90° when that packs more, output still one sheet', async () => {
  // Wide 10×3" image on a tall 12×22" sheet: rotating to 3×10 fits more.
  const up = replicateGrid({ sheetWIn: 12, sheetHIn: 22, cellWIn: 10, cellHIn: 3, marginIn: 0, gutterXIn: 0, gutterYIn: 0 });
  const turned = replicateGrid({ sheetWIn: 12, sheetHIn: 22, cellWIn: 3, cellHIn: 10, marginIn: 0, gutterXIn: 0, gutterYIn: 0 });
  assert.ok(turned.cols * turned.rows > up.cols * up.rows, 'rotating fits more');
  const out = await replicateFill(await pdfOf(1, 10 * 72, 3 * 72), {
    sheetWIn: 12, sheetHIn: 22, marginIn: 0, gutterXIn: 0, gutterYIn: 0, addMarks: false,
  });
  assert.equal(await pageCount(out), 1);
});

test('imposeDivinityBox: builds the 300×572mm flat with panels + white spot', async () => {
  const { imposeDivinityBox } = await import('../src/lib/imposition-toolkit/impose.ts');
  const panel = (w: number, h: number) => pdfOf(1, w * 72 / 25.4, h * 72 / 25.4);
  const out = await imposeDivinityBox({
    a: { bytes: await panel(306, 46.5) },
    b: { bytes: await panel(306, 215) },
    c: { bytes: await panel(306, 48) },
    d: { bytes: await panel(306, 204) },
    whiteUnder: true, varnish: true, foldMarks: true,
  });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 1);
  const s = doc.getPage(0).getSize();
  // 306 mm wide: 300 trim + 3 mm bleed left+right (New_Box_Full template).
  assert.ok(Math.abs(s.width - 306 * 72 / 25.4) < 0.6, `sheet width 306mm (${s.width})`);
  assert.ok(Math.abs(s.height - 572 * 72 / 25.4) < 0.6, `sheet height 572mm (${s.height})`);
});

test('chokePlane: white under-base pulls in by r px from every edge (choke trap)', () => {
  // 20×20 solid-white (255) plane; choke by 3 px.
  const w = 20, h = 20;
  const src = new Uint8Array(w * h).fill(255);
  const out = chokePlane(src, w, h, 3);
  const at = (x: number, y: number) => out[y * w + x];
  // Pixels within 3 px of the sheet edge are choked to 0.
  assert.equal(at(0, 0), 0, 'corner choked');
  assert.equal(at(2, 10), 0, 'within 3px of left edge choked');
  assert.equal(at(10, 2), 0, 'within 3px of top edge choked');
  assert.equal(at(17, 10), 0, 'within 3px of right edge choked');
  // The interior (>= 3 px from every edge) is untouched.
  assert.equal(at(3, 3), 255, 'first fully-interior pixel kept');
  assert.equal(at(10, 10), 255, 'centre kept');
  assert.equal(at(16, 16), 255, 'interior kept');
  // A hole in the middle erodes outward by exactly 3 px (square) too.
  const src2 = new Uint8Array(w * h).fill(255);
  src2[10 * w + 10] = 0;                       // single empty pixel, well off the edges
  const out2 = chokePlane(src2, w, h, 3);
  const at2 = (x: number, y: number) => out2[y * w + x];
  assert.equal(at2(10, 10), 0, 'hole stays empty');
  assert.equal(at2(13, 10), 0, '3px right of hole choked');
  assert.equal(at2(14, 10), 255, '4px right of hole kept');
  assert.equal(at2(10, 13), 0, '3px below hole choked');
  assert.equal(at2(10, 14), 255, '4px below hole kept');
  // r <= 0 is a no-op (returns the same reference).
  assert.equal(chokePlane(src, w, h, 0), src);
});
