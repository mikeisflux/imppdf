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

test('the grid is symmetric about both sheet axes, so it backs up', () => {
  /* THE property the whole duplex story rests on. If every card has a partner
     at the mirrored position, the sheet registers with itself however the press
     turns it over — no special back layout, no per-flip variant. It holds here
     because the margins are equal: 13.5 / 13.5 across and 7.5 / 7.5 down. */
  for (const sheet of ['a4', 'a3'] as const) {
    const f = fitDivinityCards(sheet);
    const key = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;
    const at = new Set(f.cells.map((c) => key(c.xMm, c.yMm)));
    for (const c of f.cells) {
      assert.ok(at.has(key(f.sheetWMm - (c.xMm + c.wMm), c.yMm)),
        `${sheet}: no partner across for the card at ${c.xMm},${c.yMm}`);
      assert.ok(at.has(key(c.xMm, f.sheetHMm - (c.yMm + c.hMm))),
        `${sheet}: no partner down for the card at ${c.xMm},${c.yMm}`);
    }
  }
});

/** Two pages: a front and a back, both portrait so both get the quarter turn. */
async function frontBackPdf() {
  const d = await PDFDocument.create();
  for (const col of [rgb(0.15, 0.2, 0.55), rgb(0.6, 0.15, 0.2)]) {
    const w = 54 * PT_PER_MM, h = 90 * PT_PER_MM;
    const p = d.addPage([w, h]);
    p.drawRectangle({ x: 0, y: 0, width: w, height: h, color: col });
  }
  return d.save();
}

/** Count the quarter turns in a page's content, by SIGN rather than by exact
 *  text. A rotation is written as cos/sin, and cos(90 deg) comes out of the
 *  floating-point as 6.1e-17, not 0 — matching the literal "0 1 -1 0" finds
 *  nothing and the test passes for the wrong reason. So: parse every cm and
 *  classify it. b = +1 is counter-clockwise, b = -1 is clockwise.
 *  Content is Flate-compressed, so it has to be inflated first. */
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
    if (Math.abs(a) > 1e-6) continue;                  // not a quarter turn
    if (Math.abs(b - 1) < 1e-6 && Math.abs(c + 1) < 1e-6) ccw++;
    else if (Math.abs(b + 1) < 1e-6 && Math.abs(c - 1) < 1e-6) cw++;
  }
  return { ccw, cw };
}

test('a second page becomes a sheet of backs', async () => {
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4' });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 2, 'fronts and backs');
  for (let i = 0; i < 2; i++) {
    const { width } = doc.getPage(i).getSize();
    assert.ok(Math.abs(width - 210 * PT_PER_MM) < 0.5, `page ${i + 1} is A4`);
  }
});

test('backs are turned the OTHER way for a long-edge flip', async () => {
  /* A long-edge flip reverses the sheet's x-axis, and a turned card's "up"
     points along x — so printing the back with the same turn as the front puts
     every back upside down, which only shows up after cutting. */
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', flip: 'long' });
  const front = await turnsOnPage(out, 0), back = await turnsOnPage(out, 1);
  assert.equal(front.ccw, 10, 'ten fronts, all turned one way');
  assert.equal(front.cw, 0);
  assert.equal(back.cw, 10, 'ten backs, turned the other way');
  assert.equal(back.ccw, 0);
});

test('backs keep the SAME turn for a short-edge flip', async () => {
  // A short-edge flip leaves the x-axis alone, so the turn must not change.
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', flip: 'short' });
  const front = await turnsOnPage(out, 0), back = await turnsOnPage(out, 1);
  assert.equal(front.ccw, 10);
  assert.equal(back.ccw, 10, 'same turn as the front');
  assert.equal(back.cw, 0);
});

test('backs can be turned off, and a one-page file makes one sheet', async () => {
  const off = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', backs: false });
  assert.equal((await PDFDocument.load(off)).getPageCount(), 1, 'suppressed');
  const single = await imposeDivinityCards(await cardPdf(), { sheet: 'a4' });
  assert.equal((await PDFDocument.load(single)).getPageCount(), 1, 'nothing to back with');
});
