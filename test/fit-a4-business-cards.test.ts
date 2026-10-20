/* A4 Business Card Cutter — the card cutter's namecard template, read back out
 * of the fit module and the exported page. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  fitBusinessCards, sheetDefaults, rowsFor, PT_PER_MM,
  BC_CARD_W_MM, BC_CARD_H_MM, BC_BLEED_MM, BC_LAYOUT_W_MM, BC_LAYOUT_H_MM, BC_GUTTER_X_MM, BC_GUTTER_Y_MM,
} from '../src/lib/imposition-toolkit/fit/a4-business-cards.ts';

const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;
const r2 = (v: number) => Math.round(v * 100) / 100;

test('the template: 89 x 54 cards, 92 x 57 file boxes, cards 10 apart across and 6 down', () => {
  assert.equal(BC_CARD_W_MM, 89); assert.equal(BC_CARD_H_MM, 54);
  assert.equal(BC_BLEED_MM, 1.5); assert.equal(BC_LAYOUT_W_MM, 92); assert.equal(BC_LAYOUT_H_MM, 57);
  assert.equal(BC_GUTTER_X_MM, 10); assert.equal(BC_GUTTER_Y_MM, 6);
  // The drawing adds up: 9.5 + 92 + 7 + 92 + 9.5 across, 5(57) + 4(3) down.
  assert.equal(9.5 + 92 + 7 + 92 + 9.5, 210);
  assert.equal(5 * 57 + 4 * 3, 297);
});

test('A4: cuts at 11 / 100 / 110 / 199 across; 1.5 from the head then every 60 down', () => {
  const f = fitBusinessCards('a4');
  assert.equal(f.n, 10); assert.equal(f.cols, 2); assert.equal(f.rows, 5); assert.equal(f.wholeRows, 5);
  const d = sheetDefaults('a4');
  assert.ok(close(d.marginXMm, 11), `A ${d.marginXMm}`);
  assert.ok(close(d.marginTopMm, 1.5), `D ${d.marginTopMm}`);
  assert.equal(d.gutterXMm, 10); assert.equal(d.gutterYMm, 6);
  const xs = [...new Set(f.cells.flatMap((c) => [c.xMm, c.xMm + c.wMm]))].sort((a, b) => a - b);
  assert.deepEqual(xs.map(r2), [11, 100, 110, 199]);
  const tops = [...new Set(f.cells.map((c) => 297 - (c.yMm + c.hMm)))].sort((a, b) => a - b);
  assert.deepEqual(tops.map(r2), [1.5, 61.5, 121.5, 181.5, 241.5]);
  assert.ok(close(f.marginBottomMm, 1.5, 1e-9), 'the last file box ends at the foot');
  for (const c of f.cells) { assert.equal(c.wMm, 89); assert.equal(c.hMm, 54); }
  // The mark sits in the middle of the column gap.
  assert.deepEqual(f.markXMm.map(r2), [105]);
  // Symmetric across, so backs register under a flip about the long edge.
  for (const c of f.cells) assert.ok(f.cells.some((d2) => close(d2.xMm, 210 - (c.xMm + c.wMm)) && close(d2.yMm, c.yMm)));
});

test('the machine takes 85, 89 or 90 wide: the block stays centered, the card gap stays 10', () => {
  for (const w of [85, 89, 90]) {
    const f = fitBusinessCards('a4', { cardWMm: w });
    assert.equal(f.cellWMm, w);
    assert.ok(close(f.marginXMm, (210 - (2 * w + 10)) / 2));
    assert.ok(close(f.cells[1]!.xMm - (f.cells[0]!.xMm + f.cells[0]!.wMm), 10));
  }
});

test('A3 is two A4 blocks side by side, stood up portrait, cut at 210', () => {
  const f = fitBusinessCards('a3');
  assert.equal(f.n, 20); assert.ok(f.rotated);
  assert.equal(f.pageWMm, 297); assert.equal(f.pageHMm, 420);
  assert.deepEqual(f.cutXMm, [210]);
  assert.deepEqual(f.markXMm.map(r2), [105, 315]);
  const a4 = fitBusinessCards('a4');
  for (let i = 0; i < 10; i++) {
    assert.ok(close(f.cells[i]!.xMm, a4.cells[i]!.xMm) && close(f.cells[i]!.yMm, a4.cells[i]!.yMm));
    assert.ok(close(f.cells[i + 10]!.xMm, a4.cells[i]!.xMm + 210) && close(f.cells[i + 10]!.yMm, a4.cells[i]!.yMm));
  }
});

test('Letter: the A4 layout hung from the top edge, centered across, row 5 not printed', () => {
  assert.equal(rowsFor('letter'), 5);
  const d = sheetDefaults('letter');
  assert.ok(close(d.marginXMm, (215.9 - 188) / 2, 0.01), 'centered across: the rails center the sheet on the blades');
  assert.ok(close(d.marginTopMm, 1.5, 0.01), 'NOT centered down: the first cut is where the A4 program puts it');
  const f = fitBusinessCards('letter');
  const tops = [...new Set(f.cells.map((c) => 279.4 - (c.yMm + c.hMm)))].sort((a, b) => a - b);
  // Row 5 would start at 241.5 and end at 295.5 > 279.4, so it is not laid.
  assert.deepEqual(tops.map(r2), [1.5, 61.5, 121.5, 181.5]);
  assert.equal(f.cells.length, 8); assert.equal(f.n, 8); assert.equal(f.wholeRows, 4);
  for (const c of f.cells) assert.ok(c.yMm >= 0);
  assert.ok(close(f.marginBottomMm, 279.4 - 1.5 - (4 * 54 + 3 * 6), 0.01), 'H is the blank tail');
  const a4tops = [...new Set(fitBusinessCards('a4').cells.map((c) => 297 - (c.yMm + c.hMm)))].sort((a, b) => a - b);
  assert.deepEqual(a4tops.slice(0, 4).map(r2), tops.map(r2));
});

test('11 x 17 is two Letter halves of 2 x 4, stood up, cut at 215.9', () => {
  const f = fitBusinessCards('tabloid');
  assert.equal(f.n, 16); assert.equal(f.wholeRows, 4); assert.ok(f.rotated);
  assert.ok(close(f.pageWMm, 279.4, 0.01)); assert.ok(close(f.pageHMm, 431.8, 0.01));
  assert.ok(close(f.cutXMm[0]!, 215.9, 0.01));
  assert.equal(f.cells.length, 16);
  for (const c of f.cells.slice(0, 8)) assert.ok(c.xMm + c.wMm <= 215.9 + 1e-9);
  for (const c of f.cells.slice(8)) assert.ok(c.xMm >= 215.9 - 1e-9);
});

test('typed gutters move the block, never the card', () => {
  const f = fitBusinessCards('a4', { marginXMm: 10, marginTopMm: 5, gutterXMm: 4, gutterYMm: 2 });
  assert.ok(close(f.cells[0]!.xMm, 10)); assert.ok(close(f.cells[1]!.xMm, 103));
  assert.ok(close(297 - (f.cells[0]!.yMm + 54), 5)); assert.ok(close(297 - (f.cells[2]!.yMm + 54), 61));
  for (const c of f.cells) { assert.equal(c.wMm, 89); assert.equal(c.hMm, 54); }
});

const mkCard = async (w: number, h: number, colors: [number, number, number][]) => {
  const d = await PDFDocument.create();
  for (const [r, g, b] of colors) {
    const p = d.addPage([w * PT_PER_MM, h * PT_PER_MM]);
    p.drawRectangle({ x: 0, y: 0, width: w * PT_PER_MM, height: h * PT_PER_MM, color: rgb(r, g, b) });
  }
  return d.save();
};

test('imposeBusinessCards: one page in, one sheet out; doubled stocks stand up portrait', async () => {
  const { imposeBusinessCards } = await import('../src/lib/imposition-toolkit/impose.ts');
  const bytes = await mkCard(92, 57, [[0.2, 0.4, 0.9]]);
  for (const [sheet, w, h] of [['a4', 210, 297], ['a3', 297, 420], ['letter', 215.9, 279.4], ['tabloid', 279.4, 431.8]] as const) {
    const out = await PDFDocument.load(await imposeBusinessCards(bytes, { sheet }));
    assert.equal(out.getPageCount(), 1, sheet);
    const s = out.getPage(0).getSize();
    assert.ok(close(s.width / PT_PER_MM, w, 0.05) && close(s.height / PT_PER_MM, h, 0.05), `${sheet} ${s.width / PT_PER_MM} x ${s.height / PT_PER_MM}`);
    assert.ok(s.height >= s.width, `${sheet} must be portrait`);
  }
  const two = await PDFDocument.load(await imposeBusinessCards(await mkCard(92, 57, [[0.2, 0.4, 0.9], [0.9, 0.8, 0.6]]), { sheet: 'a4' }));
  assert.equal(two.getPageCount(), 2);
});

test('imposeBusinessCards: separate front and back uploads, and a two-page file in either place', async () => {
  const { imposeBusinessCards } = await import('../src/lib/imposition-toolkit/impose.ts');
  const front = await mkCard(92, 57, [[0.2, 0.3, 0.8]]), back = await mkCard(92, 57, [[0.9, 0.8, 0.6]]);
  const twoPage = await mkCard(92, 57, [[0.2, 0.3, 0.8], [0.9, 0.8, 0.6]]);
  const other = await mkCard(50, 50, [[0, 0, 0]]);
  const pages = async (b: Uint8Array, o: Parameters<typeof imposeBusinessCards>[1]) => (await PDFDocument.load(await imposeBusinessCards(b, o))).getPageCount();
  assert.equal(await pages(front, { sheet: 'a4', back }), 2);
  assert.equal(await pages(other, { sheet: 'tabloid', front, back }), 2);
  assert.equal(await pages(front, { sheet: 'a4', back, backs: false }), 1);
  assert.equal(await pages(other, { sheet: 'a4', front }), 1);
  assert.equal(await pages(twoPage, { sheet: 'a4' }), 2);
  assert.equal(await pages(other, { sheet: 'a4', front: twoPage }), 2);
  assert.equal(await pages(other, { sheet: 'a3', front: twoPage, back: other }), 2);
  assert.equal(await pages(twoPage, { sheet: 'a4', backs: false }), 1);
});
