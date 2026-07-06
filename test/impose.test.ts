import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { computeNUpGrid, imposeNUp } from '../src/lib/imposition-toolkit/impose.ts';

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

test('computeNUpGrid centres a fixed-size grid on the sheet', () => {
  const g = computeNUpGrid({ ...baseNUp, cellWIn: 3.5, cellHIn: 2 });
  assert.equal(g.cols, 2);          // floor((8.5-0.5)/3.625) = 2
  assert.equal(g.rows, 5);          // floor((11-0.5)/2.125) = 5
  const blockW = g.cols * g.cellWPt + (g.cols - 1) * g.gxPt;
  const expectLeft = (8.5 * PT - blockW) / 2;
  assert.ok(Math.abs(g.leftGapPt - expectLeft) < 0.01, 'block is horizontally centred');
});

test('exact 2-up (two Letter pages) fits on 11x17 with zero margin', () => {
  const g = computeNUpGrid({ ...baseNUp, sheetWIn: 17, sheetHIn: 11, cellWIn: 8.5, cellHIn: 11, marginIn: 0, gutterIn: 0 });
  assert.equal(g.cols, 2);
  assert.equal(g.rows, 1);
});

test('imposeNUp: 10 pages, 10-up → 1 sheet', async () => {
  const out = await imposeNUp(await pdfOf(10), { ...baseNUp, cellWIn: 3.5, cellHIn: 2 });
  assert.equal(await pageCount(out), 1);
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
