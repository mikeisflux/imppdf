/* Divinity trading card DECK — a whole deck out of one file, ganged 8-up on
 * portrait A4, backs as a SEPARATE PASS.
 *
 *   sheet   210 x 297   portrait A4
 *   cell    89 x 63     the cut card, lying sideways
 *   gutters 10 between the columns, 3 between the rows
 *
 *   across  11 + 89 + 10 + 89 + 11                  = 210
 *   down    18 + 63 + 3 + 63 + 3 + 63 + 3 + 63 + 18 = 297
 *
 * The cell and the gutters were MEASURED off the shop's cut machine and are the
 * input; the margins are the remainder. Both sums closing exactly on A4 is the
 * check that the template is right, so both are asserted directly — get either
 * wrong and the file stops meeting the blade.
 *
 * The other thing a wrong build costs is a backs pass that does not land on its
 * fronts, so the grid is checked to be symmetric about both axes.            */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  PT_PER_MM, CARD_W_MM, CARD_H_MM, SHEET_W_MM, SHEET_H_MM,
  CELL_W_MM, CELL_H_MM, GUTTER_X_MM, GUTTER_Y_MM, COLS, ROWS, PER_SHEET,
  MARGIN_X_MM, MARGIN_Y_MM, deckLayout, deckSheets, deckCardAt, cardsOnSheet,
} from '../src/lib/imposition-toolkit/fit/divinity-deck.ts';
import { imposeDivinityDeck } from '../src/lib/imposition-toolkit/impose.ts';

const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

test('the measured numbers are what the file says they are', () => {
  assert.equal(CELL_W_MM, 89, 'the cut card, long edge');
  assert.equal(CELL_H_MM, 63, 'the cut card, short edge');
  assert.equal(GUTTER_X_MM, 10, 'between the columns');
  assert.equal(GUTTER_Y_MM, 3, 'between the rows — NOT the same as the column gutter');
  assert.equal(COLS, 2);
  assert.equal(ROWS, 4);
  assert.equal(PER_SHEET, 8);
});

test('the sheet is a plain PORTRAIT A4 — 210 x 297', () => {
  assert.equal(SHEET_W_MM, 210);
  assert.equal(SHEET_H_MM, 297);
});

test('both sums close on A4 exactly — the check the template is right', () => {
  assert.equal(2 * MARGIN_X_MM + COLS * CELL_W_MM + (COLS - 1) * GUTTER_X_MM, 210,
    '11 + 89 + 10 + 89 + 11');
  assert.equal(2 * MARGIN_Y_MM + ROWS * CELL_H_MM + (ROWS - 1) * GUTTER_Y_MM, 297,
    '18 + 4(63) + 3(3) + 18');
  assert.equal(MARGIN_X_MM, 11, 'the remainder across, not a choice');
  assert.equal(MARGIN_Y_MM, 18, 'the remainder down, not a choice');
});

test('the cell is close enough to a 2.5 x 3.5in card to cost only bleed', () => {
  /* The artwork is 88.9 x 63.5 placed sideways; the cell is 89 x 63. Cover-fit
     scales by the larger ratio and clips the rest, so the loss is what the
     blade was taking anyway. Guard the magnitude, not the exact figure. */
  const scale = Math.max(CELL_W_MM / CARD_H_MM, CELL_H_MM / CARD_W_MM);
  const lostW = CARD_H_MM * scale - CELL_W_MM;
  const lostH = CARD_W_MM * scale - CELL_H_MM;
  assert.ok(lostW < 1, `under a millimetre off the width, got ${lostW.toFixed(2)}`);
  assert.ok(lostH < 1, `under a millimetre off the height, got ${lostH.toFixed(2)}`);
});

test('eight cells, 2 across x 4 down, on a 99 x 66 pitch', () => {
  const L = deckLayout();
  assert.equal(L.cells.length, 8);
  assert.equal(L.perSheet, 8);
  const xs = [...new Set(L.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(L.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.deepEqual(xs, [11, 110], 'two columns at 11 and 110');
  assert.equal(ys.length, 4, 'four rows');
  assert.equal(xs[1]! - xs[0]!, 99, 'column pitch 89 + 10');
  for (let i = 1; i < ys.length; i++) {
    assert.equal(ys[i - 1]! - ys[i]!, 66, 'row pitch 63 + 3');
  }
});

test('every cell is inside the sheet and none overlaps another', () => {
  const { cells } = deckLayout();
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
     mirrored position the backs land on their fronts however it was turned. It
     holds because the margins came out equal on each axis. */
  const { cells } = deckLayout();
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
  const { cells, cols } = deckLayout();
  const topY = Math.max(...cells.map((c) => c.yMm));
  assert.ok(close(cells[0]!.yMm, topY), 'cell 0 is on the top row');
  for (let i = 1; i < cols; i++) {
    assert.ok(cells[i]!.xMm > cells[i - 1]!.xMm, 'and runs left to right');
    assert.ok(close(cells[i]!.yMm, topY), 'across the whole top row');
  }
  assert.ok(cells[cols]!.yMm < topY, 'then the next row down');
});

test('sheet arithmetic: 172 cards is 22 sheets with 4 cells spare', () => {
  assert.equal(deckSheets(172), 22);
  assert.equal(deckSheets(0), 0);
  assert.equal(deckSheets(8), 1, 'exactly full');
  assert.equal(deckSheets(9), 2, 'one over');
  assert.equal(cardsOnSheet(0, 172), 8);
  assert.equal(cardsOnSheet(21, 172), 4, '172 - 21*8');
  assert.equal(cardsOnSheet(22, 172), 0, 'past the end');
});

test('cards fall SEQUENTIALLY, not cut-and-stack', () => {
  /* A deck is collated by hand off the guillotine, so sheet 1 holding cards
     1-8 is what makes the stack checkable. Cut-and-stack would scatter them. */
  for (let c = 0; c < PER_SHEET; c++) assert.equal(deckCardAt(0, c, 172), c);
  for (let c = 0; c < PER_SHEET; c++) assert.equal(deckCardAt(1, c, 172), PER_SHEET + c);
  assert.equal(deckCardAt(21, 3, 172), 171, 'the last card');
  assert.equal(deckCardAt(21, 4, 172), -1, 'and then the sheet runs out');
});

/** A deck: `cards` distinct pages plus a final back page. */
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

test('172 cards + a back: 22 front sheets then 22 back sheets', async () => {
  const { bytes, report } = await imposeDivinityDeck(await deckPdf(172));
  assert.equal(report.cards, 172);
  assert.equal(report.cols, 2);
  assert.equal(report.rows, 4);
  assert.equal(report.perSheet, 8);
  assert.equal(report.sheets, 22);
  assert.equal(report.blanksOnLastSheet, 4, '22*8 - 172');
  assert.equal(report.backsStartPage, 23, 'the second pass starts here');
  assert.equal(report.totalPages, 44);
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 44);
});

test('every output page is a portrait A4 — 210 x 297 mm', async () => {
  const { bytes } = await imposeDivinityDeck(await deckPdf(12));
  const doc = await PDFDocument.load(bytes);
  for (let i = 0; i < doc.getPageCount(); i++) {
    const { width, height } = doc.getPage(i).getSize();
    assert.ok(Math.abs(width - 210 * PT_PER_MM) < 0.5,
      `page ${i + 1}: 210 mm wide, got ${(width / PT_PER_MM).toFixed(2)}`);
    assert.ok(Math.abs(height - 297 * PT_PER_MM) < 0.5,
      `page ${i + 1}: 297 mm tall, got ${(height / PT_PER_MM).toFixed(2)}`);
  }
});

test('backs OFF gives fronts only', async () => {
  const { report } = await imposeDivinityDeck(await deckPdf(20), { backs: false });
  assert.equal(report.sheets, 3, '20 cards, 8 up');
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
  const d = await imposeDivinityDeck(await deckPdf(20));
  assert.equal(d.report.cards, 20);
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
  assert.equal(report.perSheet, 8, 'the layout is still reported');
});

/** Count the quarter turns in a page's content, by SIGN rather than by exact
 *  text. A rotation is written as cos/sin, and cos(90 deg) comes out of the
 *  floating-point as 6.1e-17, not 0 — matching the literal "0 1 -1 0" finds
 *  nothing and the test passes for the wrong reason. Content is Flate'd. */
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

test('portrait art is turned sideways, backs the other way on a long flip', async () => {
  /* A card lying sideways has its "up" along the axis a long-edge flip
     reverses, so the back has to turn the opposite way to come out upright
     against its front. A short-edge flip leaves that axis alone. */
  const long = await imposeDivinityDeck(await deckPdf(8), { flip: 'long' });
  const lf = await turnsOnPage(long.bytes, 0), lb = await turnsOnPage(long.bytes, 1);
  assert.equal(lf.ccw + lf.cw, 8, 'eight cards, each turned');
  assert.equal(lb.ccw + lb.cw, 8, 'eight backs, each turned');
  assert.ok((lf.ccw > 0) !== (lb.ccw > 0), 'and the backs turn the OTHER way');

  const short = await imposeDivinityDeck(await deckPdf(8), { flip: 'short' });
  const sf = await turnsOnPage(short.bytes, 0), sb = await turnsOnPage(short.bytes, 1);
  assert.deepEqual(sf, sb, 'short-edge flip: fronts and backs turn the same way');
});

test('the short last sheet gets no ink in its empty cells, front or back', async () => {
  /* 10 cards at 8-up: sheet 2 carries two cards and six blanks. Its back sheet
     must carry two backs, not eight — no point laying ink where nothing is cut
     out. Counted by placement: pdf-lib names them "EmbeddedPdfPage-1234", and
     the hyphen has to be in the class or this counts nothing and the test
     passes for the wrong reason. */
  const { bytes, report } = await imposeDivinityDeck(await deckPdf(10));
  assert.equal(report.sheets, 2);
  assert.equal(report.blanksOnLastSheet, 6);

  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const doc = await PDFDocument.load(bytes);
  const placements = async (index: number) => {
    const streams = doc.getPage(index).node.normalizedEntries().Contents;
    let text = '';
    for (let i = 0; streams && i < streams.size(); i++) {
      const raw = (doc.context.lookup(streams.get(i), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
      try { text += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
      catch { text += Buffer.from(raw).toString('latin1'); }
    }
    return [...text.matchAll(/\/[A-Za-z0-9_.-]+ Do\b/g)].length;
  };
  assert.equal(await placements(0), 8, 'sheet 1 is full');
  assert.equal(await placements(1), 2, 'two cards on the short front sheet');
  assert.equal(await placements(3), 2, 'and two backs opposite them');
});
