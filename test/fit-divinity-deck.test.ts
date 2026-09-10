/* Divinity trading card DECK — a whole deck out of one file, ganged on an A4
 * fed long edge first, backs as a SEPARATE PASS.
 *
 *   card  63.5 x 88.9 mm (2.5 x 3.5"), 3 mm gutter
 *   sheet 297 x 210 — A4 the long way, and that does not change
 *
 *   UPRIGHT (default)  63.5 x 88.9   4 across x 2 down = 8   margins 17.00 / 14.60
 *   TURNED             88.9 x 63.5   3 across x 3 down = 9   margins 12.15 /  6.75
 *
 * Turned fits one more, but hands the guillotine its cards a quarter turn from
 * how the shop cuts them, so upright is the default and the ninth card is not
 * taken. That trade is the point of the tool, so both layouts are asserted.
 *
 * The other thing a wrong build costs is a backs pass that does not land on its
 * fronts, so the grid is checked to be symmetric about both axes either way.
 *
 * Card figures come from an inch conversion, so they are compared with a
 * tolerance — 3.5 * 25.4 does not land on 88.9 in binary floating point. The
 * pure-mm figures (the gutter, the sheet) ARE exact and are asserted as such. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  PT_PER_MM, CARD_W_MM, CARD_H_MM, GUTTER_MM, SHEET_W_MM, SHEET_H_MM,
  DEFAULT_ORIENT, deckLayout, deckSheets, deckCardAt, cardsOnSheet,
} from '../src/lib/imposition-toolkit/fit/divinity-deck.ts';
import { imposeDivinityDeck } from '../src/lib/imposition-toolkit/impose.ts';

const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

test('standard 2.5 x 3.5in card, 3 mm gutter', () => {
  assert.ok(close(CARD_W_MM, 63.5), `2.5in = 63.5mm, got ${CARD_W_MM}`);
  assert.ok(close(CARD_H_MM, 88.9), `3.5in = 88.9mm, got ${CARD_H_MM}`);
  assert.equal(GUTTER_MM, 3, "the shop's cutting allowance");
});

test('the sheet is A4 fed LONG EDGE FIRST — 297 x 210, not 210 x 297', () => {
  /* Not a cosmetic choice: heavy card stock run short-edge-first wears a band
     across the fuser, and that band then shows on 11x17 work afterwards. It is
     also NOT what the orientation option changes — that is the card, not the
     paper. */
  assert.equal(SHEET_W_MM, 297);
  assert.equal(SHEET_H_MM, 210);
});

test('UPRIGHT is the default — the way round the cutter takes them', () => {
  assert.equal(DEFAULT_ORIENT, 'upright');
  const L = deckLayout();
  assert.equal(L.orient, 'upright');
  assert.ok(close(L.placedWMm, CARD_W_MM), 'placed upright — no quarter turn');
  assert.ok(close(L.placedHMm, CARD_H_MM));
  assert.equal(L.cols, 4);
  assert.equal(L.rows, 2);
  assert.equal(L.perSheet, 8);
  assert.equal(L.cells.length, 8);
});

test('the fit is worked, not hard-coded — all four ways round', () => {
  /* The project rule. Both sheet orientations, both card orientations. Note the
     two nines are the SAME physical arrangement: a portrait A4 laid out 3 x 3
     upright is this sheet rotated, and its cards come off lying down too. So
     there is no 9-up-and-upright to be had — 8 is what upright costs. */
  const fits = (sw: number, sh: number, w: number, h: number) =>
    Math.floor((sw + GUTTER_MM) / (w + GUTTER_MM)) * Math.floor((sh + GUTTER_MM) / (h + GUTTER_MM));
  assert.equal(fits(210, 297, 63.5, 88.9), 9, 'portrait sheet, upright card');
  assert.equal(fits(210, 297, 88.9, 63.5), 8, 'portrait sheet, turned card');
  assert.equal(fits(297, 210, 63.5, 88.9), 8, 'landscape sheet, upright card — what we use');
  assert.equal(fits(297, 210, 88.9, 63.5), 9, 'landscape sheet, turned card');

  // And the layout agrees with the arithmetic rather than restating a number.
  assert.equal(deckLayout('upright').perSheet, fits(297, 210, 63.5, 88.9));
  assert.equal(deckLayout('turned').perSheet, fits(297, 210, 88.9, 63.5));
});

test('turned is still available, at 9-up on the same sheet', () => {
  const L = deckLayout('turned');
  assert.ok(close(L.placedWMm, CARD_H_MM), 'turned: the long edge runs across');
  assert.ok(close(L.placedHMm, CARD_W_MM));
  assert.equal(L.cols, 3);
  assert.equal(L.rows, 3);
  assert.equal(L.perSheet, 9);
});

test('upright grid is centred 17.00 / 14.60, on a 66.5 x 91.9 pitch', () => {
  const L = deckLayout('upright');
  assert.ok(close(L.marginXMm, 17), `(297 - (4*63.5 + 3*3)) / 2, got ${L.marginXMm}`);
  assert.ok(close(L.marginYMm, 14.6), `(210 - (2*88.9 + 3)) / 2, got ${L.marginYMm}`);

  const xs = [...new Set(L.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(L.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.equal(xs.length, 4, 'four columns');
  assert.equal(ys.length, 2, 'two rows');
  for (let i = 1; i < xs.length; i++) {
    assert.ok(close(xs[i]! - xs[i - 1]!, 66.5), `column pitch 63.5 + 3, got ${xs[i]! - xs[i - 1]!}`);
  }
  assert.ok(close(ys[0]! - ys[1]!, 91.9), `row pitch 88.9 + 3, got ${ys[0]! - ys[1]!}`);
});

test('turned grid is centred 12.15 / 6.75, on a 91.9 x 66.5 pitch', () => {
  const L = deckLayout('turned');
  assert.ok(close(L.marginXMm, 12.15), `(297 - (3*88.9 + 2*3)) / 2, got ${L.marginXMm}`);
  assert.ok(close(L.marginYMm, 6.75), `(210 - (3*63.5 + 2*3)) / 2, got ${L.marginYMm}`);
  const xs = [...new Set(L.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(L.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  for (let i = 1; i < xs.length; i++) assert.ok(close(xs[i]! - xs[i - 1]!, 91.9));
  for (let i = 1; i < ys.length; i++) assert.ok(close(ys[i - 1]! - ys[i]!, 66.5));
});

test('every cell is inside the sheet and none overlaps another, either way', () => {
  for (const orient of ['upright', 'turned'] as const) {
    const { cells } = deckLayout(orient);
    for (const c of cells) {
      assert.ok(c.xMm >= 0 && c.xMm + c.wMm <= SHEET_W_MM + 1e-9, `${orient}: inside across`);
      assert.ok(c.yMm >= 0 && c.yMm + c.hMm <= SHEET_H_MM + 1e-9, `${orient}: inside down`);
    }
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i]!, b = cells[j]!;
        const apart = a.xMm + a.wMm <= b.xMm + 1e-9 || b.xMm + b.wMm <= a.xMm + 1e-9
          || a.yMm + a.hMm <= b.yMm + 1e-9 || b.yMm + b.hMm <= a.yMm + 1e-9;
        assert.ok(apart, `${orient}: cells ${i} and ${j} overlap`);
      }
    }
  }
});

test('the grid is symmetric about both axes, so the backs pass registers', () => {
  /* THE property the two-pass workflow rests on. The stack comes out of the
     tray, gets turned over and goes back in; if every cell has a partner at the
     mirrored position the backs land on their fronts however it was turned. */
  for (const orient of ['upright', 'turned'] as const) {
    const { cells } = deckLayout(orient);
    const key = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;
    const at = new Set(cells.map((c) => key(c.xMm, c.yMm)));
    for (const c of cells) {
      assert.ok(at.has(key(SHEET_W_MM - (c.xMm + c.wMm), c.yMm)),
        `${orient}: no partner across for the cell at ${c.xMm},${c.yMm}`);
      assert.ok(at.has(key(c.xMm, SHEET_H_MM - (c.yMm + c.hMm))),
        `${orient}: no partner down for the cell at ${c.xMm},${c.yMm}`);
    }
  }
});

test('cells read the way a person reads — left to right, top row first', () => {
  const { cells, cols } = deckLayout();
  // Top row is the ones with the LARGEST y (PDF origin is bottom-left).
  const topY = Math.max(...cells.map((c) => c.yMm));
  assert.ok(close(cells[0]!.yMm, topY), 'cell 0 is on the top row');
  for (let i = 1; i < cols; i++) {
    assert.ok(cells[i]!.xMm > cells[i - 1]!.xMm, 'and runs left to right');
    assert.ok(close(cells[i]!.yMm, topY), 'across the whole top row');
  }
  assert.ok(cells[cols]!.yMm < topY, 'then the next row down');
});

test('sheet arithmetic: 172 cards is 22 sheets with 4 cells spare', () => {
  const { perSheet } = deckLayout();
  assert.equal(perSheet, 8);
  assert.equal(deckSheets(172, perSheet), 22, '172 / 8 rounds up to 22');
  assert.equal(deckSheets(0, perSheet), 0);
  assert.equal(deckSheets(1, perSheet), 1);
  assert.equal(deckSheets(8, perSheet), 1, 'exactly full');
  assert.equal(deckSheets(9, perSheet), 2, 'one over');
  assert.equal(cardsOnSheet(0, 172, perSheet), 8);
  assert.equal(cardsOnSheet(21, 172, perSheet), 4, '172 - 21*8');
  assert.equal(cardsOnSheet(22, 172, perSheet), 0, 'past the end');
  // Turned would save two sheets. That is the whole cost of cutting the right
  // way round, stated here so it can't quietly grow.
  assert.equal(deckSheets(172, deckLayout('turned').perSheet), 20);
});

test('cards fall SEQUENTIALLY, not cut-and-stack', () => {
  /* A deck is collated by hand off the guillotine, so sheet 1 holding cards
     1-8 is what makes the stack checkable. Cut-and-stack would scatter them. */
  const { perSheet } = deckLayout();
  for (let c = 0; c < perSheet; c++) assert.equal(deckCardAt(0, c, 172, perSheet), c);
  for (let c = 0; c < perSheet; c++) assert.equal(deckCardAt(1, c, 172, perSheet), perSheet + c);
  assert.equal(deckCardAt(21, 3, 172, perSheet), 171, 'the last card');
  assert.equal(deckCardAt(21, 4, 172, perSheet), -1, 'and then the sheet runs out');
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

test('172 cards + a back: 22 front sheets then 22 back sheets', async () => {
  const { bytes, report } = await imposeDivinityDeck(await deckPdf(172));
  assert.equal(report.cards, 172);
  assert.equal(report.orient, 'upright', 'the default');
  assert.equal(report.cols, 4);
  assert.equal(report.rows, 2);
  assert.equal(report.perSheet, 8);
  assert.equal(report.sheets, 22);
  assert.equal(report.blanksOnLastSheet, 4, '22*8 - 172');
  assert.equal(report.backsStartPage, 23, 'the second pass starts here');
  assert.equal(report.totalPages, 44);
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 44);
});

test('turned still builds the 20-sheet job it always did', async () => {
  const { report } = await imposeDivinityDeck(await deckPdf(172), { orient: 'turned' });
  assert.equal(report.orient, 'turned');
  assert.equal(report.perSheet, 9);
  assert.equal(report.sheets, 20);
  assert.equal(report.blanksOnLastSheet, 8);
  assert.equal(report.backsStartPage, 21);
  assert.equal(report.totalPages, 40);
});

test('every output page is an A4 lying down — 297 x 210 mm, both ways round', async () => {
  for (const orient of ['upright', 'turned'] as const) {
    const { bytes } = await imposeDivinityDeck(await deckPdf(12), { orient });
    const doc = await PDFDocument.load(bytes);
    for (let i = 0; i < doc.getPageCount(); i++) {
      const { width, height } = doc.getPage(i).getSize();
      assert.ok(Math.abs(width - 297 * PT_PER_MM) < 0.5,
        `${orient} page ${i + 1}: 297 mm wide, got ${(width / PT_PER_MM).toFixed(2)}`);
      assert.ok(Math.abs(height - 210 * PT_PER_MM) < 0.5,
        `${orient} page ${i + 1}: 210 mm tall, got ${(height / PT_PER_MM).toFixed(2)}`);
    }
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
  assert.equal(report.perSheet, 8, 'the layout is still reported');
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

test('upright: portrait art is NOT turned, on fronts or backs, under either flip', async () => {
  /* The quiet win of cutting the right way round. Upright art in an upright
     cell needs no quarter turn, so there is nothing for the backs pass to get
     wrong however the stack goes back in. */
  for (const flip of ['long', 'short'] as const) {
    const { bytes } = await imposeDivinityDeck(await deckPdf(8), { flip });
    assert.deepEqual(await turnsOnPage(bytes, 0), { ccw: 0, cw: 0 }, `${flip}: fronts untouched`);
    assert.deepEqual(await turnsOnPage(bytes, 1), { ccw: 0, cw: 0 }, `${flip}: backs untouched`);
  }
});

test('turned: art is quartered, and the backs go the other way on a long flip', async () => {
  /* A card lying on its side has its "up" along the axis a long-edge flip
     reverses, so the back has to be turned the opposite way to come out upright
     against its front. A short-edge flip leaves that axis alone. */
  const long = await imposeDivinityDeck(await deckPdf(9), { orient: 'turned', flip: 'long' });
  const lf = await turnsOnPage(long.bytes, 0), lb = await turnsOnPage(long.bytes, 1);
  assert.equal(lf.ccw + lf.cw, 9, 'nine cards, each turned');
  assert.equal(lb.ccw + lb.cw, 9, 'nine backs, each turned');
  assert.ok((lf.ccw > 0) !== (lb.ccw > 0), 'and the backs turn the OTHER way');

  const short = await imposeDivinityDeck(await deckPdf(9), { orient: 'turned', flip: 'short' });
  const sf = await turnsOnPage(short.bytes, 0), sb = await turnsOnPage(short.bytes, 1);
  assert.deepEqual(sf, sb, 'short-edge flip: fronts and backs turn the same way');
});

test('the short last sheet gets no ink in its empty cells, front or back', async () => {
  /* 10 cards at 8-up: sheet 2 carries two cards and six blanks. Its back sheet
     must carry two backs, not eight — no point laying ink where nothing is cut
     out. Counted by placement rather than by turn, since upright art has none:
     each placed card writes one Do, so the Do count is the card count. */
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
    // pdf-lib names them "EmbeddedPdfPage-7098480789" — the hyphen has to be in
    // the class or this counts nothing and the test passes for the wrong reason.
    return [...text.matchAll(/\/[A-Za-z0-9_.-]+ Do\b/g)].length;
  };
  assert.equal(await placements(0), 8, 'sheet 1 is full');
  assert.equal(await placements(1), 2, 'two cards on the short front sheet');
  assert.equal(await placements(3), 2, 'and two backs opposite them');
});
