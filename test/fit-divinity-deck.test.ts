/* Divinity trading card DECK — a whole deck out of one file, nine to an A4 fed
 * long edge first, backs as a SEPARATE PASS.
 *
 *   card 63.5 x 88.9 mm, placed TURNED (88.9 x 63.5), 3 mm gutter
 *   sheet 297 x 210 (A4 the long way)  ->  3 across x 3 down = 9
 *   margins 12.15 across / 6.75 down
 *
 * The two things a wrong build would cost the shop are (a) more sheets than
 * necessary and (b) a backs pass that does not land on its fronts, so both are
 * asserted directly: the fit is worked all four ways here rather than taken on
 * trust, and the grid is checked to be symmetric about both axes.
 *
 * Card figures come from an inch conversion, so they are compared with a
 * tolerance — 3.5 * 25.4 does not land on 88.9 in binary floating point. The
 * pure-mm figures (the gutter, the sheet) ARE exact and are asserted as such. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  PT_PER_MM, CARD_W_MM, CARD_H_MM, PLACED_W_MM, PLACED_H_MM, GUTTER_MM,
  COLS, ROWS, PER_SHEET, SHEET_W_MM, SHEET_H_MM, MARGIN_X_MM, MARGIN_Y_MM,
  deckCells, deckSheets, deckCardAt, cardsOnSheet,
} from '../src/lib/imposition-toolkit/fit/divinity-deck.ts';
import { imposeDivinityDeck } from '../src/lib/imposition-toolkit/impose.ts';

const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

test('standard 2.5 x 3.5in card, placed on its side', () => {
  assert.ok(close(CARD_W_MM, 63.5), `2.5in = 63.5mm, got ${CARD_W_MM}`);
  assert.ok(close(CARD_H_MM, 88.9), `3.5in = 88.9mm, got ${CARD_H_MM}`);
  assert.ok(close(PLACED_W_MM, CARD_H_MM), 'turned: the long edge runs across');
  assert.ok(close(PLACED_H_MM, CARD_W_MM));
  assert.equal(GUTTER_MM, 3, "the shop's cutting allowance");
});

test('the sheet is A4 fed LONG EDGE FIRST — 297 x 210, not 210 x 297', () => {
  /* Not a cosmetic choice: heavy card stock run short-edge-first wears a band
     across the fuser, and that band then shows on 11x17 work afterwards. */
  assert.equal(SHEET_W_MM, 297);
  assert.equal(SHEET_H_MM, 210);
});

test('nine really is the best of the four ways round', () => {
  /* Worked, not assumed — the project rule. Both sheet orientations, both card
     orientations. Landscape-turned and portrait-upright tie at nine; landscape
     is taken because of the fuser, and it costs nothing. */
  const fits = (sw: number, sh: number, w: number, h: number) =>
    Math.floor((sw + GUTTER_MM) / (w + GUTTER_MM)) * Math.floor((sh + GUTTER_MM) / (h + GUTTER_MM));
  assert.equal(fits(210, 297, 63.5, 88.9), 9, 'portrait sheet, upright card');
  assert.equal(fits(210, 297, 88.9, 63.5), 8, 'portrait sheet, turned card');
  assert.equal(fits(297, 210, 63.5, 88.9), 8, 'landscape sheet, upright card');
  assert.equal(fits(297, 210, 88.9, 63.5), 9, 'landscape sheet, turned card — what we use');
  assert.equal(PER_SHEET, 9);
  assert.equal(COLS, 3);
  assert.equal(ROWS, 3);
});

test('the grid is centred: 12.15 across, 6.75 down', () => {
  assert.ok(close(MARGIN_X_MM, 12.15), `(297 - (3*88.9 + 2*3)) / 2, got ${MARGIN_X_MM}`);
  assert.ok(close(MARGIN_Y_MM, 6.75), `(210 - (3*63.5 + 2*3)) / 2, got ${MARGIN_Y_MM}`);

  const cells = deckCells();
  assert.equal(cells.length, 9);
  const xs = [...new Set(cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.equal(xs.length, 3, 'three columns');
  assert.equal(ys.length, 3, 'three rows');
  for (let i = 1; i < xs.length; i++) {
    assert.ok(close(xs[i]! - xs[i - 1]!, 91.9), `column pitch 88.9 + 3, got ${xs[i]! - xs[i - 1]!}`);
  }
  for (let i = 1; i < ys.length; i++) {
    assert.ok(close(ys[i - 1]! - ys[i]!, 66.5), `row pitch 63.5 + 3, got ${ys[i - 1]! - ys[i]!}`);
  }
});

test('every cell is inside the sheet and none overlaps another', () => {
  const cells = deckCells();
  for (const c of cells) {
    assert.ok(c.xMm >= 0 && c.xMm + c.wMm <= SHEET_W_MM + 1e-9, 'inside across');
    assert.ok(c.yMm >= 0 && c.yMm + c.hMm <= SHEET_H_MM + 1e-9, 'inside down');
  }
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i]!, b = cells[j]!;
      const apart = a.xMm + a.wMm <= b.xMm + 1e-9 || b.xMm + b.wMm <= a.xMm + 1e-9
        || a.yMm + a.hMm <= b.yMm + 1e-9 || b.yMm + b.hMm <= a.yMm + 1e-9;
      assert.ok(apart, `cells ${i} and ${j} overlap`);
    }
  }
});

test('the grid is symmetric about both axes, so the backs pass registers', () => {
  /* THE property the two-pass workflow rests on. The stack comes out of the
     tray, gets turned over and goes back in; if every cell has a partner at the
     mirrored position the backs land on their fronts however it was turned. */
  const cells = deckCells();
  const key = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;
  const at = new Set(cells.map((c) => key(c.xMm, c.yMm)));
  for (const c of cells) {
    assert.ok(at.has(key(SHEET_W_MM - (c.xMm + c.wMm), c.yMm)),
      `no partner across for the cell at ${c.xMm},${c.yMm}`);
    assert.ok(at.has(key(c.xMm, SHEET_H_MM - (c.yMm + c.hMm))),
      `no partner down for the cell at ${c.xMm},${c.yMm}`);
  }
});

test('cells read the way a person reads — left to right, top row first', () => {
  const cells = deckCells();
  // Top row is the three with the LARGEST y (PDF origin is bottom-left).
  const topY = Math.max(...cells.map((c) => c.yMm));
  assert.ok(close(cells[0]!.yMm, topY), 'cell 0 is on the top row');
  assert.ok(cells[0]!.xMm < cells[1]!.xMm && cells[1]!.xMm < cells[2]!.xMm, 'and runs left to right');
  assert.ok(cells[3]!.yMm < cells[0]!.yMm, 'cell 3 starts the next row down');
});

test('sheet arithmetic: 172 cards is 20 sheets with 8 cells spare', () => {
  assert.equal(deckSheets(172), 20);
  assert.equal(deckSheets(0), 0);
  assert.equal(deckSheets(1), 1);
  assert.equal(deckSheets(9), 1, 'exactly full');
  assert.equal(deckSheets(10), 2, 'one over');
  assert.equal(cardsOnSheet(0, 172), 9);
  assert.equal(cardsOnSheet(19, 172), 1, '172 - 19*9');
  assert.equal(cardsOnSheet(20, 172), 0, 'past the end');
});

test('cards fall SEQUENTIALLY, not cut-and-stack', () => {
  /* A deck is collated by hand off the guillotine, so sheet 1 holding cards
     1-9 is what makes the stack checkable. Cut-and-stack would scatter them. */
  for (let c = 0; c < 9; c++) assert.equal(deckCardAt(0, c, 172), c);
  for (let c = 0; c < 9; c++) assert.equal(deckCardAt(1, c, 172), 9 + c);
  assert.equal(deckCardAt(19, 0, 172), 171, 'the last card');
  assert.equal(deckCardAt(19, 1, 172), -1, 'and then the sheet runs out');
});

/** A deck: `cards` distinct pages plus a final back page. Each card carries a
 *  white mark in one corner so its placement can be told apart from its back. */
async function deckPdf(cards: number) {
  const d = await PDFDocument.create();
  const w = CARD_W_MM * PT_PER_MM, h = CARD_H_MM * PT_PER_MM;
  for (let i = 0; i < cards; i++) {
    const p = d.addPage([w, h]);
    p.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(0.15, 0.2, 0.55) });
    p.drawRectangle({ x: 0, y: h - 12, width: 24, height: 12, color: rgb(1, 1, 1) });
  }
  const back = d.addPage([w, h]);
  back.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(0.6, 0.15, 0.2) });
  return d.save();
}

test('172 cards + a back: 20 front sheets then 20 back sheets', async () => {
  const { bytes, report } = await imposeDivinityDeck(await deckPdf(172));
  assert.equal(report.cards, 172);
  assert.equal(report.sheets, 20);
  assert.equal(report.perSheet, 9);
  assert.equal(report.blanksOnLastSheet, 8, '20*9 - 172');
  assert.equal(report.backsStartPage, 21, 'the second pass starts here');
  assert.equal(report.totalPages, 40);
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 40);
});

test('every output page is an A4 lying down — 297 x 210 mm', async () => {
  const { bytes } = await imposeDivinityDeck(await deckPdf(12));
  const doc = await PDFDocument.load(bytes);
  for (let i = 0; i < doc.getPageCount(); i++) {
    const { width, height } = doc.getPage(i).getSize();
    assert.ok(Math.abs(width - 297 * PT_PER_MM) < 0.5,
      `page ${i + 1}: 297 mm wide, got ${(width / PT_PER_MM).toFixed(2)}`);
    assert.ok(Math.abs(height - 210 * PT_PER_MM) < 0.5,
      `page ${i + 1}: 210 mm tall, got ${(height / PT_PER_MM).toFixed(2)}`);
  }
});

test('backs OFF gives fronts only', async () => {
  const { report } = await imposeDivinityDeck(await deckPdf(20), { backs: false });
  assert.equal(report.sheets, 3);
  assert.equal(report.totalPages, 3, 'no backs pass');
  assert.equal(report.backsStartPage, null, 'and nothing to tell the operator');
});

test('grouped is the default; interleaved is opt-in', async () => {
  const g = await imposeDivinityDeck(await deckPdf(20));
  assert.equal(g.report.backsStartPage, 4, 'fronts 1-3, backs 4-6');
  const i = await imposeDivinityDeck(await deckPdf(20), { order: 'interleaved' });
  assert.equal(i.report.totalPages, 6, 'same page count');
  assert.equal(i.report.backsStartPage, null, 'but no single point to restart at');
});

test('the back page defaults to the LAST page, and can be named', async () => {
  // Default: 21 pages in, 20 cards out.
  const d = await imposeDivinityDeck(await deckPdf(20));
  assert.equal(d.report.cards, 20);
  // Naming page 1 as the back leaves the other 20 as cards — the count is the
  // same, but a file with its back somewhere else needs no reordering.
  const n = await imposeDivinityDeck(await deckPdf(20), { backPage: 1 });
  assert.equal(n.report.cards, 20);
});

test('a file with nothing to gang comes back empty rather than wrong', async () => {
  const d = await PDFDocument.create();
  d.addPage([100, 100]);
  const { report } = await imposeDivinityDeck(await d.save());
  assert.equal(report.cards, 0);
  assert.equal(report.sheets, 0);
  assert.equal(report.totalPages, 0);
});

/** Count the quarter turns in a page's content, by SIGN rather than by exact
 *  text. A rotation is written as cos/sin, and cos(90 deg) comes out of the
 *  floating-point as 6.1e-17, not 0 — matching the literal "0 1 -1 0" finds
 *  nothing and the test passes for the wrong reason. b = +1 is
 *  counter-clockwise, b = -1 is clockwise. Content is Flate-compressed. */
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

test('portrait art is turned to lie in the cell, backs the other way on a long flip', async () => {
  /* A card lying on its side has its "up" along the axis a long-edge flip
     reverses, so the back has to be turned the opposite way to come out upright
     against its front. A short-edge flip leaves that axis alone. */
  const long = await imposeDivinityDeck(await deckPdf(9), { flip: 'long' });
  const lf = await turnsOnPage(long.bytes, 0), lb = await turnsOnPage(long.bytes, 1);
  assert.equal(lf.ccw + lf.cw, 9, 'nine cards, each turned');
  assert.equal(lb.ccw + lb.cw, 9, 'nine backs, each turned');
  assert.ok((lf.ccw > 0) !== (lb.ccw > 0), 'and the backs turn the OTHER way');

  const short = await imposeDivinityDeck(await deckPdf(9), { flip: 'short' });
  const sf = await turnsOnPage(short.bytes, 0), sb = await turnsOnPage(short.bytes, 1);
  assert.deepEqual(sf, sb, 'short-edge flip: fronts and backs turn the same way');
});

test('the short last sheet gets no ink in its empty cells, front or back', async () => {
  // 10 cards: sheet 2 carries one card and eight blanks. Its back sheet must
  // carry one back, not nine — no point laying ink where nothing is cut out.
  const { bytes, report } = await imposeDivinityDeck(await deckPdf(10));
  assert.equal(report.sheets, 2);
  assert.equal(report.blanksOnLastSheet, 8);
  const lastFront = await turnsOnPage(bytes, 1), lastBack = await turnsOnPage(bytes, 3);
  assert.equal(lastFront.ccw + lastFront.cw, 1, 'one card on the short front sheet');
  assert.equal(lastBack.ccw + lastBack.cw, 1, 'and one back opposite it');
});
