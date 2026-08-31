/* Divinity trading cards — the numbers off the printer's spec sheet.
 *
 *   A4 210 x 297, card placed 90 x 54, pitch 93 x 57 (so a 3 mm gutter),
 *   2 across x 5 down = ten, centred: 13.5 mm sides, 7.5 mm top and bottom.
 *   The A4 block doubled onto an A3 420 x 297 = twenty, cut at 210.
 *
 * These are exact by definition — 93 - 90 is 3, not 2.9998 — so they are
 * asserted exactly, in millimetres, which is how the spec is written.        */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  fitDivinityCards, PT_PER_MM, CARD_W_MM, CARD_H_MM, PLACED_W_MM, PLACED_H_MM, GUTTER_MM,
} from '../src/lib/imposition-toolkit/fit/divinity-cards.ts';
import { imposeDivinityCards } from '../src/lib/imposition-toolkit/impose.ts';

test('the card is 54 x 90 as artwork and lies 90 x 54 on the sheet', () => {
  assert.equal(CARD_W_MM, 54);
  assert.equal(CARD_H_MM, 90);
  assert.equal(PLACED_W_MM, 90, 'placed long edge across');
  assert.equal(PLACED_H_MM, 54);
  assert.equal(GUTTER_MM, 3, '93 pitch - 90 card, and 57 - 54');
});

test('A4: ten cards, 2 across x 5 down, centred 13.5 / 7.5', () => {
  const f = fitDivinityCards('a4');
  assert.equal(f.sheetWMm, 210);
  assert.equal(f.sheetHMm, 297);
  assert.equal(f.n, 10, 'ten to an A4, as the spec sheet says');
  assert.equal(f.cells.length, 10);
  assert.equal(f.marginXMm, 13.5, '(210 - (2*90 + 3)) / 2');
  assert.equal(f.marginYMm, 7.5, '(297 - (5*54 + 4*3)) / 2');

  // Column pitch is 93 and row pitch is 57, exactly as drawn.
  const xs = [...new Set(f.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(f.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.deepEqual(xs, [13.5, 106.5], 'two columns, 93 apart');
  assert.equal(ys.length, 5, 'five rows');
  for (let i = 1; i < ys.length; i++) {
    assert.ok(Math.abs((ys[i - 1]! - ys[i]!) - 57) < 1e-9, `row pitch 57, got ${ys[i - 1]! - ys[i]!}`);
  }
});

test('A4: every card is inside the sheet, and none overlaps another', () => {
  const f = fitDivinityCards('a4');
  for (const c of f.cells) {
    assert.ok(c.xMm >= 0 && c.xMm + c.wMm <= f.sheetWMm + 1e-9, 'inside across');
    assert.ok(c.yMm >= 0 && c.yMm + c.hMm <= f.sheetHMm + 1e-9, 'inside down');
  }
  for (let i = 0; i < f.cells.length; i++) {
    for (let j = i + 1; j < f.cells.length; j++) {
      const a = f.cells[i]!, b = f.cells[j]!;
      const apart = a.xMm + a.wMm <= b.xMm + 1e-9 || b.xMm + b.wMm <= a.xMm + 1e-9
        || a.yMm + a.hMm <= b.yMm + 1e-9 || b.yMm + b.hMm <= a.yMm + 1e-9;
      assert.ok(apart, `cards ${i} and ${j} overlap`);
    }
  }
});

test('A3: the A4 block doubled — twenty cards, cut at 210', () => {
  const f = fitDivinityCards('a3');
  assert.equal(f.sheetWMm, 420, 'two A4 portraits side by side');
  assert.equal(f.sheetHMm, 297);
  assert.equal(f.n, 20);
  assert.deepEqual(f.cutXMm, [210], 'cut down the middle to make two A4s');

  // The right half is the left half, moved over exactly one A4 width.
  const a4 = fitDivinityCards('a4');
  const left = f.cells.slice(0, 10), right = f.cells.slice(10);
  for (let i = 0; i < 10; i++) {
    assert.equal(left[i]!.xMm, a4.cells[i]!.xMm, `left card ${i} matches the A4`);
    assert.equal(right[i]!.xMm, a4.cells[i]!.xMm + 210, `right card ${i} is the same, +210`);
    assert.equal(left[i]!.yMm, right[i]!.yMm, 'and at the same height');
  }
  // So each half, cut free, is a correct A4: 13.5 mm in from its own edges.
  assert.equal(Math.min(...right.map((c) => c.xMm)) - 210, 13.5);
  assert.equal(420 - Math.max(...right.map((c) => c.xMm + c.wMm)), 13.5);
});

/** A 54 x 90 mm portrait card, with a marker so its orientation is checkable. */
async function cardPdf(wMm = 54, hMm = 90) {
  const d = await PDFDocument.create();
  const w = wMm * PT_PER_MM, h = hMm * PT_PER_MM;
  const p = d.addPage([w, h]);
  p.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(0.15, 0.2, 0.55) });
  p.drawRectangle({ x: 0, y: h - 12, width: 24, height: 12, color: rgb(1, 1, 1) });
  return d.save();
}

test('the sheet is a real A3 at 420 x 297 mm', async () => {
  const out = await imposeDivinityCards(await cardPdf(), { sheet: 'a3' });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 1);
  const { width, height } = doc.getPage(0).getSize();
  assert.ok(Math.abs(width - 420 * PT_PER_MM) < 0.5, `420 mm wide, got ${(width / PT_PER_MM).toFixed(2)}`);
  assert.ok(Math.abs(height - 297 * PT_PER_MM) < 0.5, `297 mm tall, got ${(height / PT_PER_MM).toFixed(2)}`);
});

test('an A4 sheet is a real A4', async () => {
  const out = await imposeDivinityCards(await cardPdf(), { sheet: 'a4' });
  const { width, height } = (await PDFDocument.load(out)).getPage(0).getSize();
  assert.ok(Math.abs(width - 210 * PT_PER_MM) < 0.5);
  assert.ok(Math.abs(height - 297 * PT_PER_MM) < 0.5);
});
