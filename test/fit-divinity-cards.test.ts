/* Divinity trading cards — a standard 2.5 x 3.5" card on A4, doubled to A3.
 *
 *   card 63.5 x 88.9 mm, lying ACROSS a PORTRAIT sheet, 3 mm gutter
 *   A4 210 x 297  ->  2 across x 4 down =  8, margins 14.60 / 17.00
 *   A3 420 x 297  ->  the A4 block twice = 16, cut down at 210
 *
 * EIGHT, not the nine an upright card would take: the shop's guillotine cuts
 * eight off an A4 and cuts them lying across. Owner instruction, and it matches
 * fit/divinity-deck.ts so both tools come off the cutter the same way.
 *
 * The card is stated in inches because that is what "standard trading card"
 * means; the sheet in mm because A-sizes are metric. Card figures come from an
 * inch conversion, so they are compared with a tolerance rather than exactly —
 * 3.5 x 25.4 does not land on 88.9 in binary floating point. The pure-mm
 * figures (the gutter, the sheet) ARE exact and are asserted as such.        */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  fitDivinityCards, PT_PER_MM, CARD_W_MM, CARD_H_MM, PLACED_W_MM, PLACED_H_MM, GUTTER_MM,
  COLS, ROWS,
} from '../src/lib/imposition-toolkit/fit/divinity-cards.ts';
import { imposeDivinityCards } from '../src/lib/imposition-toolkit/impose.ts';

const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

test('the card is a standard 2.5 x 3.5in, standing upright on the sheet', () => {
  assert.ok(close(CARD_W_MM, 63.5), `2.5in = 63.5mm, got ${CARD_W_MM}`);
  assert.ok(close(CARD_H_MM, 88.9), `3.5in = 88.9mm, got ${CARD_H_MM}`);
  assert.ok(close(PLACED_W_MM, CARD_H_MM), 'placed across — long edge runs left to right');
  assert.ok(close(PLACED_H_MM, CARD_W_MM));
  assert.equal(GUTTER_MM, 3, "the shop's cutting allowance");
});

test('eight across is the arrangement, and nine upright is the trap', () => {
  /* On a 210 x 297 portrait sheet, across gives 2 x 4 = 8 and upright gives
     3 x 3 = 9. Nine is real and is not taken: the shop's guillotine cuts eight
     off an A4, lying across. Recorded so it can't be "fixed" by accident. */
  const fits = (w: number, h: number) =>
    Math.floor((210 + GUTTER_MM) / (w + GUTTER_MM)) * Math.floor((297 + GUTTER_MM) / (h + GUTTER_MM));
  assert.equal(fits(88.9, 63.5), 8, 'across: 2 x 4 — what we use');
  assert.equal(fits(63.5, 88.9), 9, 'upright: 3 x 3, and the wrong way for the cutter');
  assert.equal(COLS, 2);
  assert.equal(ROWS, 4);
});

test('A4: eight cards, 2 across x 4 down, centred 14.60 / 17.00', () => {
  const f = fitDivinityCards('a4');
  assert.equal(f.sheetWMm, 210, 'a plain portrait A4');
  assert.equal(f.sheetHMm, 297);
  assert.equal(f.n, 8);
  assert.equal(f.cells.length, 8);
  assert.ok(close(f.marginXMm, 14.6), `(210 - (2*88.9 + 3)) / 2, got ${f.marginXMm}`);
  assert.ok(close(f.marginYMm, 17), `(297 - (4*63.5 + 3*3)) / 2, got ${f.marginYMm}`);

  const xs = [...new Set(f.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(f.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.equal(xs.length, 2, 'two columns');
  assert.equal(ys.length, 4, 'four rows');
  assert.ok(close(xs[1]! - xs[0]!, 91.9), `column pitch 88.9 + 3, got ${xs[1]! - xs[0]!}`);
  for (let i = 1; i < ys.length; i++) {
    assert.ok(close(ys[i - 1]! - ys[i]!, 66.5), `row pitch 63.5 + 3, got ${ys[i - 1]! - ys[i]!}`);
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

test('A3: the A4 block duplicated — sixteen cards, cut down at 210', () => {
  const f = fitDivinityCards('a3');
  assert.equal(f.sheetWMm, 420, 'two A4 portraits side by side');
  assert.equal(f.sheetHMm, 297);
  assert.equal(f.n, 16);
  assert.deepEqual(f.cutXMm, [210], 'cut down the middle to make two A4s');

  /* The right half is the left half, moved over exactly one A4 width — which is
     what "duplicate the layout so you can cut it in half and run two sheets"
     has to mean for the halves to be interchangeable. */
  const a4 = fitDivinityCards('a4');
  const left = f.cells.slice(0, 8), right = f.cells.slice(8);
  for (let i = 0; i < 8; i++) {
    assert.ok(close(left[i]!.xMm, a4.cells[i]!.xMm), `left card ${i} matches the A4`);
    assert.ok(close(right[i]!.xMm, a4.cells[i]!.xMm + 210), `right card ${i} is the same, +210`);
    assert.ok(close(left[i]!.yMm, right[i]!.yMm), 'and at the same height');
  }
  // So each half, cut free, is a correct A4: 14.6 mm in from its own edges.
  assert.ok(close(Math.min(...right.map((c) => c.xMm)) - 210, 14.6));
  assert.ok(close(420 - Math.max(...right.map((c) => c.xMm + c.wMm)), 14.6));
});

/** A 54 x 90 mm portrait card, with a marker so its orientation is checkable. */
async function cardPdf(wMm = 63.5, hMm = 88.9) {
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

test('an A4 sheet is a real portrait A4', async () => {
  const out = await imposeDivinityCards(await cardPdf(), { sheet: 'a4' });
  const { width, height } = (await PDFDocument.load(out)).getPage(0).getSize();
  assert.ok(Math.abs(width - 210 * PT_PER_MM) < 0.5);
  assert.ok(Math.abs(height - 297 * PT_PER_MM) < 0.5);
});

test('the grid is symmetric about both sheet axes, so it backs up', () => {
  /* THE property the whole duplex story rests on. If every card has a partner
     at the mirrored position, the sheet registers with itself however the press
     turns it over — no special back layout, no per-flip variant. It holds here
     because the margins are equal: 14.6 / 14.6 across and 17 / 17 down. */
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

/** Two pages, front and back, both portrait — the normal case, and the one
 *  that needs NO turn now that the card stands upright. */
async function frontBackPdf() {
  const d = await PDFDocument.create();
  for (const col of [rgb(0.15, 0.2, 0.55), rgb(0.6, 0.15, 0.2)]) {
    const w = 63.5 * PT_PER_MM, h = 88.9 * PT_PER_MM;
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

test('portrait art IS turned, and the backs turn the other way on a long flip', async () => {
  /* The cell lies across now, so portrait art gets a quarter turn. A long-edge
     flip reverses the sheet's x-axis, and a turned card's "up" points along x —
     so printing the back with the same turn as the front puts every back upside
     down, which only shows up after cutting. */
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', flip: 'long' });
  const front = await turnsOnPage(out, 0), back = await turnsOnPage(out, 1);
  assert.equal(front.ccw, 8, 'eight fronts, all turned one way');
  assert.equal(front.cw, 0);
  assert.equal(back.cw, 8, 'eight backs, turned the other way');
  assert.equal(back.ccw, 0);
});

test('portrait art: backs keep the SAME turn on a short flip', async () => {
  // A short-edge flip leaves the x-axis alone, so the turn must not change.
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', flip: 'short' });
  const front = await turnsOnPage(out, 0), back = await turnsOnPage(out, 1);
  assert.equal(front.ccw, 8);
  assert.equal(back.ccw, 8, 'same turn as the front');
  assert.equal(back.cw, 0);
});

/** Two LANDSCAPE pages — already the cell's way round, so nothing is turned and
 *  the flip has nothing left to get wrong. */
async function landscapeFrontBackPdf() {
  const d = await PDFDocument.create();
  for (const col of [rgb(0.15, 0.2, 0.55), rgb(0.6, 0.15, 0.2)]) {
    const w = 88.9 * PT_PER_MM, h = 63.5 * PT_PER_MM;
    const p = d.addPage([w, h]);
    p.drawRectangle({ x: 0, y: 0, width: w, height: h, color: col });
  }
  return d.save();
}

test('landscape art is NOT turned, on either side, under either flip', async () => {
  for (const flip of ['long', 'short'] as const) {
    const out = await imposeDivinityCards(await landscapeFrontBackPdf(), { sheet: 'a4', flip });
    assert.deepEqual(await turnsOnPage(out, 0), { ccw: 0, cw: 0 }, `${flip}: fronts untouched`);
    assert.deepEqual(await turnsOnPage(out, 1), { ccw: 0, cw: 0 }, `${flip}: backs untouched`);
  }
});

test('backs can be turned off, and a one-page file makes one sheet', async () => {
  const off = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', backs: false });
  assert.equal((await PDFDocument.load(off)).getPageCount(), 1, 'suppressed');
  const single = await imposeDivinityCards(await cardPdf(), { sheet: 'a4' });
  assert.equal((await PDFDocument.load(single)).getPageCount(), 1, 'nothing to back with');
});
