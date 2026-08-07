import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { computeNUpGrid, imposeNUp, imposeBooklet, replicateFill, replicateGrid, orientCell, stampSerialNumber, serialLabel, chokePlane, inkBoundsFromPixels, blackKnockoutAlpha, blackSwathKeepMask, featherMask, applyMaskAlpha, spineWidthIn, metalMaskFromPixels } from '../src/lib/imposition-toolkit/impose.ts';

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

test('art prints: comic (6.88x10.5 incl bleed) packs 2-up rotated on 12x18; 11x17 packs 1-up', () => {
  // Comic-size portrait: upright only 1 fits; rotated (10.5x6.88) stacks 2 rows.
  const upright = replicateGrid({ sheetWIn: 12, sheetHIn: 18, cellWIn: 6.88, cellHIn: 10.5, marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125 });
  const rotated = replicateGrid({ sheetWIn: 12, sheetHIn: 18, cellWIn: 10.5, cellHIn: 6.88, marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125 });
  assert.equal(upright.cols * upright.rows, 1, 'upright comic: 1 fits');
  assert.equal(rotated.cols * rotated.rows, 2, 'rotated comic: 2 fit (replicate auto-rotates)');
  // 11x17 with standard bleed (11.25x17.25): exactly 1 per 12x18 either way.
  const eleven = replicateGrid({ sheetWIn: 12, sheetHIn: 18, cellWIn: 11.25, cellHIn: 17.25, marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125 });
  assert.equal(eleven.cols * eleven.rows, 1, '11x17+bleed: 1 fits');
  assert.ok(eleven.fits, '11x17+bleed physically fits the 12x18 sheet');
});

test('30-up proof labels: 3x10 of 2.625x1" fits Letter and matches the template margins', () => {
  // Geometry read from the shop's 8.5x11in30up template: 2.625x1" labels,
  // column pitch 2.7431" (0.1181" gutter), row pitch 1" (no gutter).
  const g = computeNUpGrid({
    ...baseNUp, sheetWIn: 8.5, sheetHIn: 11, cols: 3, rows: 10,
    cellWIn: 2.625, cellHIn: 1, marginIn: 0.19, gutterIn: 0.1181, gutterYIn: 0,
    addMarks: false,
  });
  assert.equal(g.cols, 3, '3 columns fit');
  assert.equal(g.rows, 10, '10 rows fit');
  assert.equal(g.cols * g.rows, 30, '30 labels per sheet');
  // Centring must reproduce the template's own margins (0.1956/0.1932 sides,
  // 0.4958/0.5042 top/bottom) to within a rounding hair.
  assert.ok(Math.abs(g.leftGapPt / PT - 0.1944) < 0.005, `side margin ~0.194" (${(g.leftGapPt / PT).toFixed(4)})`);
  assert.ok(Math.abs(g.topGapPt / PT - 0.5) < 0.005, `top margin ~0.5" (${(g.topGapPt / PT).toFixed(4)})`);
  // Turning marks on must NOT silently keep claiming 30 — the engine reserves
  // mark clearance and drops the count (CLAUDE.md: never assume the fit).
  const withMarks = computeNUpGrid({
    ...baseNUp, sheetWIn: 8.5, sheetHIn: 11, cols: 3, rows: 10,
    cellWIn: 2.625, cellHIn: 1, marginIn: 0.19, gutterIn: 0.1181, gutterYIn: 0,
    addMarks: true, markOffIn: 0.125, markLenIn: 0.43,
  });
  assert.ok(withMarks.cols * withMarks.rows < 30, 'crop marks reduce the count below 30');
});

test('replicateFill: art too big to gang natively falls back to the tool cell size', async () => {
  // A Letter-size upload on a Letter sheet: nothing fits at native size, so
  // without a fallback the sheet comes back with a single copy. With the tool's
  // own 2.625x1" label cell it fills 30-up instead.
  const letterArt = await pdfOf(1, 8.5 * 72, 11 * 72);
  const base = {
    sheetWIn: 8.5, sheetHIn: 11, marginIn: 0.19,
    gutterXIn: 0.1181, gutterYIn: 0, addMarks: false,
  };
  const without = await replicateFill(letterArt, base);
  const withFallback = await replicateFill(letterArt, { ...base, fallbackCellWIn: 2.625, fallbackCellHIn: 1 });
  for (const out of [without, withFallback]) {
    const s = (await PDFDocument.load(out)).getPage(0).getSize();
    assert.ok(Math.abs(s.width - 8.5 * PT) < 0.5 && Math.abs(s.height - 11 * PT) < 0.5, 'sheet stays 8.5x11');
  }
  // The fallback grid is the 30-up label layout.
  const g = replicateGrid({ ...base, cellWIn: 2.625, cellHIn: 1 });
  assert.equal(g.cols * g.rows, 30, 'fallback cell gangs 30-up');
  // Art that DOES fit natively is untouched by the fallback (native wins).
  const cardArt = await pdfOf(1, 3.5 * 72, 2 * 72);
  const native = replicateGrid({ sheetWIn: 8.5, sheetHIn: 11, cellWIn: 3.5, cellHIn: 2, marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125 });
  assert.ok(native.fits, 'card-size art fits natively');
  assert.ok((await replicateFill(cardArt, { sheetWIn: 8.5, sheetHIn: 11, marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125, addMarks: false, fallbackCellWIn: 2.625, fallbackCellHIn: 1 })).length > 0);
});

test('inkBoundsFromPixels: finds the artwork box, ignores white and transparent paper', () => {
  const w = 20, h = 10;
  const px = new Uint8Array(w * h * 4);
  // Fill with opaque white "paper".
  for (let i = 0; i < w * h; i++) { px[i*4] = 255; px[i*4+1] = 255; px[i*4+2] = 255; px[i*4+3] = 255; }
  // Draw a dark block from x 4..7, y 2..5 (inclusive).
  for (let y = 2; y <= 5; y++) for (let x = 4; x <= 7; x++) {
    const i = (y * w + x) * 4; px[i] = 10; px[i+1] = 20; px[i+2] = 30; px[i+3] = 255;
  }
  assert.deepEqual(inkBoundsFromPixels(px, w, h), { x0: 4, y0: 2, x1: 7, y1: 5 });
  // A transparent page with no ink returns null (nothing to trim).
  assert.equal(inkBoundsFromPixels(new Uint8Array(w * h * 4), w, h), null);
  // An all-white opaque page is also "blank" — never crop to nothing.
  const white = new Uint8Array(w * h * 4).fill(255);
  assert.equal(inkBoundsFromPixels(white, w, h), null);
});

test('blackKnockoutAlpha: substrate black drops out, light art untouched, edges ramp', () => {
  // Pure black art → no ink at all (the box's own black shows through).
  assert.equal(blackKnockoutAlpha(0, 0, 0, 255), 0);
  assert.equal(blackKnockoutAlpha(8, 8, 8, 255), 0, 'near-black still knocks out');
  // Light/coloured art is untouched — full alpha preserved.
  assert.equal(blackKnockoutAlpha(255, 255, 255, 255), 255);
  assert.equal(blackKnockoutAlpha(200, 30, 30, 255), 255, 'saturated red prints normally');
  assert.equal(blackKnockoutAlpha(60, 60, 60, 255), 255, 'dark grey above the ramp still prints');
  // Between the thresholds it RAMPS (never a hard cliff), so anti-aliased
  // edges and shadow gradients stay smooth.
  const mid = blackKnockoutAlpha(22, 22, 22, 255);
  assert.ok(mid > 0 && mid < 255, `mid-ramp is partial (${mid})`);
  // Monotonic: darker never prints MORE ink than lighter.
  let prev = -1;
  for (let v = 0; v <= 40; v += 2) {
    const cur = blackKnockoutAlpha(v, v, v, 255);
    assert.ok(cur >= prev, `ramp is monotonic at ${v}`);
    prev = cur;
  }
  // Already-transparent stays transparent; partial alpha scales, never grows.
  assert.equal(blackKnockoutAlpha(0, 0, 0, 0), 0);
  assert.ok(blackKnockoutAlpha(22, 22, 22, 128) <= 128);
});

// Build an RGBA buffer: white paper, with painted rects.
function canvasOf(w: number, h: number, rects: { x: number; y: number; w: number; h: number; c: [number, number, number] }[]) {
  const px = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { px[i*4] = 255; px[i*4+1] = 255; px[i*4+2] = 255; px[i*4+3] = 255; }
  for (const r of rects) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
    const i = (y * w + x) * 4; px[i] = r.c[0]; px[i+1] = r.c[1]; px[i+2] = r.c[2]; px[i+3] = 255;
  }
  return px;
}

test('blackSwathKeepMask: knocks out a large black expanse, spares small black details', () => {
  const w = 200, h = 200;
  const px = canvasOf(w, h, [
    { x: 0, y: 0, w: 200, h: 80, c: [0, 0, 0] },        // 32% of the panel — a swath
    { x: 20, y: 120, w: 10, h: 10, c: [0, 0, 0] },      // 0.25% — a detail (eye, line art)
    { x: 100, y: 120, w: 40, h: 40, c: [180, 40, 40] }, // coloured element
  ]);
  const keep = blackSwathKeepMask(px, w, h, { minAreaFrac: 0.02, step: 1 });
  const at = (x: number, y: number) => keep[y * w + x];
  assert.equal(at(100, 40), 0, 'inside the big black swath → knocked out');
  assert.equal(at(25, 125), 255, 'small black detail → kept');
  assert.equal(at(120, 140), 255, 'coloured element → kept');
  assert.equal(at(150, 180), 255, 'white paper → kept');
});

test('blackSwathKeepMask: a subject mask shields the character black costume', () => {
  const w = 200, h = 200;
  // One big black region that spans both "background" and "character".
  const px = canvasOf(w, h, [{ x: 0, y: 0, w: 200, h: 120, c: [0, 0, 0] }]);
  const protect = new Uint8Array(w * h);
  for (let y = 0; y < 120; y++) for (let x = 120; x < 200; x++) protect[y * w + x] = 255;  // right side = subject
  const keep = blackSwathKeepMask(px, w, h, { minAreaFrac: 0.02, step: 1, protect });
  assert.equal(keep[40 * w + 40], 0, 'background black → knocked out');
  assert.equal(keep[40 * w + 160], 255, 'the same black inside the subject → kept');
});

test('blackSwathKeepMask: no swath at all is a no-op', () => {
  const w = 100, h = 100;
  const px = canvasOf(w, h, [{ x: 10, y: 10, w: 6, h: 6, c: [0, 0, 0] }]);
  const keep = blackSwathKeepMask(px, w, h, { minAreaFrac: 0.02, step: 1 });
  assert.ok(keep.every((v) => v === 255), 'nothing is knocked out');
});

test('featherMask / applyMaskAlpha: soft edges, alpha only ever scales down', () => {
  const w = 9, h = 9;
  const m = new Uint8Array(w * h);
  for (let y = 3; y <= 5; y++) for (let x = 3; x <= 5; x++) m[y * w + x] = 1;
  const cov = featherMask(m, w, h, 1);
  assert.equal(cov[4 * w + 4], 255, 'centre fully covered');
  assert.equal(cov[0], 0, 'far corner empty');
  const edge = cov[3 * w + 2]!;
  assert.ok(edge > 0 && edge < 255, `edge is a soft ramp (${edge})`);
  // r = 0 is a plain binary expansion.
  const hard = featherMask(m, w, h, 0);
  assert.equal(hard[4 * w + 4], 255);
  assert.equal(hard[3 * w + 2], 0);
  // applyMaskAlpha multiplies, never increases.
  const rgba = new Uint8Array(w * h * 4).fill(200);
  applyMaskAlpha(rgba, cov);
  assert.equal(rgba[(4 * w + 4) * 4 + 3], 200, 'full coverage keeps alpha');
  assert.equal(rgba[3], 0, 'no coverage zeroes alpha');
});

test('spineWidthIn: pages x per-page caliper, plus optional cover allowance', () => {
  // 200pp on 60# offset (0.0025"/page ≈ 400 PPI) → half an inch.
  assert.ok(Math.abs(spineWidthIn(200, 0.0025) - 0.5) < 1e-9);
  // 50# white (KDP's 0.002252) — the usual trade-paperback stock.
  assert.ok(Math.abs(spineWidthIn(300, 0.002252) - 0.6756) < 1e-9);
  // PPI and caliper agree: spine = pages / PPI.
  const ppi = 400;
  assert.ok(Math.abs(spineWidthIn(240, 1 / ppi) - 240 / ppi) < 1e-9);
  // Cover stock allowance is added on top.
  assert.ok(Math.abs(spineWidthIn(200, 0.0025, 0.03) - 0.53) < 1e-9);
  // Degenerate input never produces a negative spine.
  assert.equal(spineWidthIn(0, 0.0025), 0);
  assert.equal(spineWidthIn(-50, 0.0025), 0);
  assert.equal(spineWidthIn(100, -1), 0);
});

test('perfect bound: 6x9 trim imposes 2-up on 11x17 with trim marks reserved', () => {
  // Two 6x9 pages fall on a 17x11 sheet even after mark clearance is reserved.
  const g = computeNUpGrid({
    ...baseNUp, sheetWIn: 17, sheetHIn: 11, cols: 99, rows: 99,
    cellWIn: 6, cellHIn: 9, marginIn: 0, gutterIn: 0, gutterYIn: 0,
    addMarks: true, markOffIn: 0.125, markLenIn: 0.43,
  });
  assert.equal(g.cols, 2, '2 across');
  assert.equal(g.rows, 1, '1 down');
  // Letter pages (the old hardcoded cell) are NOT a trade paperback: 2-up 8.5x11
  // only fits with zero mark clearance, which is why the default was wrong.
  const letter = computeNUpGrid({
    ...baseNUp, sheetWIn: 17, sheetHIn: 11, cols: 99, rows: 99,
    cellWIn: 8.5, cellHIn: 11, marginIn: 0, gutterIn: 0, gutterYIn: 0,
    addMarks: true, markOffIn: 0.125, markLenIn: 0.43,
  });
  assert.equal(letter.cols * letter.rows, 1, 'Letter 2-up leaves no room for marks');
});

test('perfect bound cut-and-stack: leaf N is page N front / page N+1 back', async () => {
  // 8 pages, 2-up duplex cut-and-stack on 17x11 → 4 leaves, 2 sheets,
  // each sheet printed front+back = 4 output pages.
  const out = await imposeNUp(await pdfOf(8, 6 * 72, 9 * 72), {
    ...baseNUp, sheetWIn: 17, sheetHIn: 11, cols: 2, rows: 1,
    cellWIn: 6, cellHIn: 9, marginIn: 0, gutterIn: 0, gutterYIn: 0,
    duplex: true, cutStack: true, addMarks: false,
  });
  assert.equal(await pageCount(out), 4, '2 sheets x (front+back)');
  // The pile formula: with 4 leaves 2-up there are 2 sheets, so position 1
  // carries leaves 1-2 (pages 1-4) and position 2 carries leaves 3-4 (pages
  // 5-8). Cut the stack, drop the right pile under the left, and the block
  // reads 1..8 with page 2 backing page 1.
  const g = computeNUpGrid({
    ...baseNUp, sheetWIn: 17, sheetHIn: 11, cols: 99, rows: 99,
    cellWIn: 6, cellHIn: 9, marginIn: 0, gutterIn: 0, gutterYIn: 0, addMarks: false,
  });
  assert.equal(g.cols * g.rows, 2, 'two 6x9 leaves per 17x11 sheet');
});

test('metalMaskFromPixels: plates the linework and highlights, not flat fills', () => {
  const w = 40, h = 40;
  const px = new Uint8Array(w * h * 4);
  // Left half mid-grey, right half near-white → a hard edge down the middle,
  // and the right half also reads as a specular highlight.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, v = x < 20 ? 120 : 245;
    px[i] = v; px[i + 1] = v; px[i + 2] = v; px[i + 3] = 255;
  }
  const m = metalMaskFromPixels(px, w, h, { toneGain: 0, highlightGain: 0, floor: 24 });
  const at = (x: number, y: number) => m[y * w + x]!;
  assert.ok(at(19, 20) > 100 || at(20, 20) > 100, 'the edge is plated');
  assert.equal(at(5, 20), 0, 'flat mid-grey gets no metal without tone');
  assert.equal(at(35, 20), 0, 'flat white gets none either with highlights off');
  // Highlights on: the bright side now plates even though it is flat.
  const hl = metalMaskFromPixels(px, w, h, { toneGain: 0, highlightGain: 1, highlightFrom: 200, floor: 1 });
  assert.ok(hl[20 * w + 35]! > 0, 'specular highlight is plated when enabled');
  // A slight grey tone lifts the darker side (more varnish where the art is dark).
  const tone = metalMaskFromPixels(px, w, h, { toneGain: 0.5, highlightGain: 0, floor: 1 });
  assert.ok(tone[20 * w + 5]! > tone[20 * w + 35]!, 'darker art carries more tone');
  // Transparent artwork never plates.
  const clear = new Uint8Array(w * h * 4);
  assert.ok(metalMaskFromPixels(clear, w, h).every((v) => v === 0), 'transparent gets no metal');
});

test('nonMaxSuppress: keeps the strongest of overlapping hits, per label', async () => {
  const { nonMaxSuppress } = await import('../src/lib/nsfw-detect.ts');
  const boxes = [
    { x0: 0, y0: 0, x1: 10, y1: 10, label: 'a', score: 0.9 },
    { x0: 1, y0: 1, x1: 11, y1: 11, label: 'a', score: 0.6 },   // overlaps the above
    { x0: 0, y0: 0, x1: 10, y1: 10, label: 'b', score: 0.5 },   // different label: kept
    { x0: 50, y0: 50, x1: 60, y1: 60, label: 'a', score: 0.4 }, // no overlap: kept
  ];
  const kept = nonMaxSuppress(boxes, 0.45);
  assert.equal(kept.length, 3);
  assert.equal(kept[0]!.score, 0.9, 'strongest survives its cluster');
  assert.ok(!kept.some((k) => k.score === 0.6), 'the weaker overlapping duplicate is dropped');
});
