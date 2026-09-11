/* Divinity trading cards — one card ganged 8-up on A4, the block duplicated
 * onto A3 so one sheet cuts into two identical A4s to run.
 *
 *   sheet   210 x 297 (A4) / 420 x 297 (A3)
 *   cell    89 x 63    the cut card, lying sideways
 *   gutters 10 between the columns, 3 between the rows
 *
 *   head    6.5 from the sheet edge to the first cut line
 *
 *   across  11 + 89 + 10 + 89 + 11                     = 210
 *   down    6.5 + 63 + 3 + 63 + 3 + 63 + 3 + 63 + 29.5 = 297
 *
 * The cell and the gutters were MEASURED off the shop's cut machine and are the
 * input; the margins are the remainder. Same template as fit/divinity-deck.ts,
 * asserted here so the two tools can never drift apart.                      */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  fitDivinityCards, PT_PER_MM, CARD_W_MM, CARD_H_MM, PLACED_W_MM, PLACED_H_MM,
  GUTTER_X_MM, GUTTER_Y_MM, MARGIN_X_MM, MARGIN_TOP_MM, MARGIN_BOTTOM_MM, COLS, ROWS,
} from '../src/lib/imposition-toolkit/fit/divinity-cards.ts';
import * as DECK from '../src/lib/imposition-toolkit/fit/divinity-deck.ts';
import { imposeDivinityCards } from '../src/lib/imposition-toolkit/impose.ts';

const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

test('the measured gaps are what the file says they are', () => {
  assert.equal(MARGIN_X_MM, 14, 'A and C — both sides');
  assert.equal(GUTTER_X_MM, 10, 'B — between the columns');
  assert.equal(MARGIN_TOP_MM, 6.5, 'D — head. Not more, not less.');
  assert.equal(GUTTER_Y_MM, 3, 'E/F/G — between the rows');
  assert.equal(MARGIN_BOTTOM_MM, 11, 'H — foot');
  assert.equal(COLS, 2);
  assert.equal(ROWS, 4);
});

test('the cell is DERIVED from those gaps, never stated', () => {
  assert.equal(PLACED_W_MM, 86, '(210 - 14 - 14 - 10) / 2');
  assert.equal(PLACED_H_MM, 67.625, '(297 - 6.5 - 11 - 3*3) / 4');
});

test('it is the SAME template as the deck tool, so both cut alike', () => {
  /* The two tools share a cut machine, not a code path. Asserting the numbers
     match is what stops one being re-tuned without the other. */
  assert.equal(PLACED_W_MM, DECK.CELL_W_MM);
  assert.equal(PLACED_H_MM, DECK.CELL_H_MM);
  assert.equal(MARGIN_X_MM, DECK.MARGIN_X_MM);
  assert.equal(GUTTER_X_MM, DECK.GUTTER_X_MM);
  assert.equal(GUTTER_Y_MM, DECK.GUTTER_Y_MM);
  assert.equal(MARGIN_X_MM, DECK.MARGIN_X_MM);
  assert.equal(MARGIN_TOP_MM, DECK.MARGIN_TOP_MM);
  assert.equal(MARGIN_BOTTOM_MM, DECK.MARGIN_BOTTOM_MM);
  assert.equal(COLS * ROWS, DECK.PER_SHEET);
});

test('both sums close on A4 exactly — the check the template is right', () => {
  assert.equal(2 * MARGIN_X_MM + COLS * PLACED_W_MM + (COLS - 1) * GUTTER_X_MM, 210);
  assert.equal(MARGIN_TOP_MM + ROWS * PLACED_H_MM + (ROWS - 1) * GUTTER_Y_MM + MARGIN_BOTTOM_MM, 297);
});

test('what the cell costs a 2.5 x 3.5in card, stated so it cannot creep', () => {
  // 88.9 x 63.5 sideways into an 86 x 67.625 cell: wider and shorter, so the
  // loss is off the width. Pinned so a re-measure shows up as a changed figure.
  const scale = Math.max(PLACED_W_MM / CARD_H_MM, PLACED_H_MM / CARD_W_MM);
  assert.ok(Math.abs(CARD_H_MM * scale - PLACED_W_MM - 8.68) < 0.05, '~8.7mm off the width');
  assert.ok(Math.abs(CARD_W_MM * scale - PLACED_H_MM) < 1e-6, 'nothing off the height');
});

test('A4: eight cards, 2 across x 4 down, on a 96 x 70.625 pitch', () => {
  const f = fitDivinityCards('a4');
  assert.equal(f.sheetWMm, 210);
  assert.equal(f.sheetHMm, 297);
  assert.equal(f.n, 8);
  assert.equal(f.cells.length, 8);
  const xs = [...new Set(f.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(f.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.deepEqual(xs, [14, 110], 'two columns at 14 and 110');
  assert.equal(ys.length, 4, 'four rows');
  assert.equal(xs[1]! - xs[0]!, 96, 'column pitch 86 + 10');
  for (let i = 1; i < ys.length; i++) assert.equal(ys[i - 1]! - ys[i]!, 70.625, 'row pitch 67.625 + 3');
  assert.equal(Math.min(...ys), 11, 'the last row sits exactly on the H margin');
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

test('A3: the A4 block duplicated — sixteen cards, cut down at 210', () => {
  const f = fitDivinityCards('a3');
  assert.equal(f.sheetWMm, 420, 'two A4 portraits side by side');
  assert.equal(f.sheetHMm, 297);
  assert.equal(f.n, 16);
  assert.deepEqual(f.cutXMm, [210], 'cut down the middle to make two A4s');

  const a4 = fitDivinityCards('a4');
  const left = f.cells.slice(0, 8), right = f.cells.slice(8);
  for (let i = 0; i < 8; i++) {
    assert.ok(close(left[i]!.xMm, a4.cells[i]!.xMm), `left card ${i} matches the A4`);
    assert.ok(close(right[i]!.xMm, a4.cells[i]!.xMm + 210), `right card ${i} is the same, +210`);
    assert.ok(close(left[i]!.yMm, right[i]!.yMm), 'and at the same height');
  }
  // So each half, cut free, is a correct A4: 14 mm in from its own edges.
  assert.ok(close(Math.min(...right.map((c) => c.xMm)) - 210, 14));
  assert.ok(close(420 - Math.max(...right.map((c) => c.xMm + c.wMm)), 14));
});

test('the grid is symmetric ACROSS, so a long-edge flip backs up', () => {
  /* What the duplex story rests on. It holds because A and C were both measured
     at 14. Down it is NOT symmetric — the block is pinned to the head at 6.5
     against 11 at the foot — so end-for-end does not register, and
     that is asserted too rather than left to be discovered on press. */
  for (const sheet of ['a4', 'a3'] as const) {
    const f = fitDivinityCards(sheet);
    const key = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;
    const at = new Set(f.cells.map((c) => key(c.xMm, c.yMm)));
    for (const c of f.cells) {
      assert.ok(at.has(key(f.sheetWMm - (c.xMm + c.wMm), c.yMm)),
        `${sheet}: no partner across for the card at ${c.xMm},${c.yMm}`);
    }
    const down = f.cells.filter((c) => at.has(key(c.xMm, f.sheetHMm - (c.yMm + c.hMm))));
    assert.equal(down.length, 0, `${sheet}: head-pinned, so nothing mirrors end-for-end`);
  }
});

/** One portrait card, with a marker so its orientation is checkable. */
async function cardPdf() {
  const d = await PDFDocument.create();
  const w = CARD_W_MM * PT_PER_MM, h = CARD_H_MM * PT_PER_MM;
  const p = d.addPage([w, h]);
  p.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(0.15, 0.2, 0.55) });
  p.drawRectangle({ x: 0, y: h - 12, width: 24, height: 12, color: rgb(1, 1, 1) });
  return d.save();
}

test('the sheets come out at real A4 and A3 sizes', async () => {
  const a3 = await PDFDocument.load(await imposeDivinityCards(await cardPdf(), { sheet: 'a3' }));
  assert.equal(a3.getPageCount(), 1);
  let { width, height } = a3.getPage(0).getSize();
  assert.ok(Math.abs(width - 420 * PT_PER_MM) < 0.5, `420 mm wide, got ${(width / PT_PER_MM).toFixed(2)}`);
  assert.ok(Math.abs(height - 297 * PT_PER_MM) < 0.5);

  const a4 = await PDFDocument.load(await imposeDivinityCards(await cardPdf(), { sheet: 'a4' }));
  ({ width, height } = a4.getPage(0).getSize());
  assert.ok(Math.abs(width - 210 * PT_PER_MM) < 0.5);
  assert.ok(Math.abs(height - 297 * PT_PER_MM) < 0.5);
});

/** Two pages, front and back, both portrait — the normal case. */
async function frontBackPdf() {
  const d = await PDFDocument.create();
  for (const col of [rgb(0.15, 0.2, 0.55), rgb(0.6, 0.15, 0.2)]) {
    const w = CARD_W_MM * PT_PER_MM, h = CARD_H_MM * PT_PER_MM;
    const p = d.addPage([w, h]);
    p.drawRectangle({ x: 0, y: 0, width: w, height: h, color: col });
  }
  return d.save();
}

/** Quarter turns on a page, by SIGN rather than exact text: a rotation is
 *  written as cos/sin and cos(90 deg) is 6.1e-17, not 0, so matching the
 *  literal "0 1 -1 0" finds nothing. Content is Flate-compressed. */
async function turnsOnPage(bytes: Uint8Array, index: number) {
  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const doc = await PDFDocument.load(bytes);
  const streams = doc.getPage(index).node.normalizedEntries().Contents;
  let text = '';
  for (let i = 0; streams && i < streams.size(); i++) {
    const raw = (doc.context.lookup(streams.get(i), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
    try { text += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
    catch { text += Buffer.from(raw).toString('latin1'); }
  }
  let ccw = 0, cw = 0;
  const NUM = '(-?[\\d.]+(?:e-?\\d+)?)';
  const re = new RegExp(`${NUM} ${NUM} ${NUM} ${NUM} ${NUM} ${NUM} cm`, 'g');
  for (const m of text.matchAll(re)) {
    const a = Number(m[1]), b = Number(m[2]), c = Number(m[3]);
    if (Math.abs(a) > 1e-6) continue;
    if (Math.abs(b - 1) < 1e-6 && Math.abs(c + 1) < 1e-6) ccw++;
    else if (Math.abs(b + 1) < 1e-6 && Math.abs(c - 1) < 1e-6) cw++;
  }
  return { ccw, cw };
}

test('a second page becomes a sheet of backs', async () => {
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4' });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 2, 'fronts and backs');
});

test('portrait art IS turned, and the backs turn the other way on a long flip', async () => {
  /* The cell lies sideways, so portrait art gets a quarter turn. A long-edge
     flip reverses the sheet's x-axis, and a turned card's "up" points along x —
     so printing the back with the same turn puts every back upside down, which
     only shows up after cutting. */
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', flip: 'long' });
  const front = await turnsOnPage(out, 0), back = await turnsOnPage(out, 1);
  assert.equal(front.ccw, 8, 'eight fronts, all turned one way');
  assert.equal(front.cw, 0);
  assert.equal(back.cw, 8, 'eight backs, turned the other way');
  assert.equal(back.ccw, 0);
});

test('portrait art: backs keep the SAME turn on a short flip', async () => {
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', flip: 'short' });
  const front = await turnsOnPage(out, 0), back = await turnsOnPage(out, 1);
  assert.equal(front.ccw, 8);
  assert.equal(back.ccw, 8, 'same turn as the front');
  assert.equal(back.cw, 0);
});

test('backs can be turned off, and a one-page file makes one sheet', async () => {
  const off = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', backs: false });
  assert.equal((await PDFDocument.load(off)).getPageCount(), 1, 'suppressed');
  const single = await imposeDivinityCards(await cardPdf(), { sheet: 'a4' });
  assert.equal((await PDFDocument.load(single)).getPageCount(), 1, 'nothing to back with');
});
