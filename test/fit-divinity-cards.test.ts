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
 * input; the margins are the remainder.                      */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  fitDivinityCards, PT_PER_MM, CARD_W_MM, CARD_H_MM, PLACED_W_MM, PLACED_H_MM,
  DEF_GUTTER_X_MM, DEF_GUTTER_Y_MM, DEF_MARGIN_X_MM, DEF_MARGIN_TOP_MM, COLS, ROWS,
} from '../src/lib/imposition-toolkit/fit/divinity-cards.ts';
import { imposeDivinityCards } from '../src/lib/imposition-toolkit/impose.ts';

const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

test('THE CELL IS THE CARD — 2.5 x 3.5in laid sideways, exactly', () => {
  assert.ok(close(PLACED_W_MM, 88.9), `3.5in across, got ${PLACED_W_MM}`);
  assert.ok(close(PLACED_H_MM, 63.5), `2.5in down, got ${PLACED_H_MM}`);
  assert.ok(close(PLACED_W_MM, CARD_H_MM), 'and it IS the card, not a copy of its figures');
  assert.ok(close(PLACED_H_MM, CARD_W_MM));
});

test('the measured gaps are the DEFAULTS the panel starts from', () => {
  assert.equal(DEF_GUTTER_X_MM, 10, 'B — between the columns');
  assert.equal(DEF_GUTTER_Y_MM, 3, 'E/F/G — between the rows');
  assert.equal(DEF_MARGIN_X_MM, undefined, 'A is not a number — it is whatever makes C equal it');
  assert.equal(DEF_MARGIN_TOP_MM, 6.5, 'D — the shop\'s measured head margin');
  assert.equal(COLS, 2);
  assert.equal(ROWS, 4);
});

test('LETTER is the default sheet, and the measured template closes on it', () => {
  /* The whole twenty-round confusion in one test. The owner's ruler said 14 mm
     at the sides with a 10 mm centre gutter. On A4 that needs 215.8 mm of a
     210 mm sheet and cannot be honoured — which is why every attempt to respect
     it produced a wrong-sized cell. On LETTER it is exact, and A4 being 17.6 mm
     TALLER than Letter is why the A4 file ran off the top of Letter stock. */
  const f = fitDivinityCards();
  assert.ok(close(f.sheetWMm, 215.9), '8.5in wide');
  assert.ok(close(f.sheetHMm, 279.4), '11in tall');
  assert.ok(close(f.marginXMm, 14.05), `A as centred, got ${f.marginXMm}`);
  assert.ok(close(f.marginXMm, f.marginRightMm), 'A and C are equal, which is the point');
  assert.equal(f.n, 8);
  // And the sum the owner measured across the sheet.
  assert.ok(close(f.marginXMm + 2 * PLACED_W_MM + DEF_GUTTER_X_MM + f.marginRightMm, 215.9),
    'A 14.05 + 88.9 + B 10 + 88.9 + C 14.05 = 215.9');
  // A4 is taller, which is the clipping.
  assert.ok(close(297 - 279.4, 17.6), 'A4 overhangs Letter by 17.6 mm');
});

test('tabloid is two Letters side by side, cut at 215.9', () => {
  const f = fitDivinityCards('tabloid');
  assert.ok(close(f.sheetWMm, 431.8), '11 x 17');
  assert.ok(close(f.sheetHMm, 279.4));
  assert.equal(f.n, 16);
  assert.ok(close(f.cutXMm[0]!, 215.9), 'cut down the middle into two Letters');
  const right = f.cells.slice(8);
  assert.ok(close(Math.min(...right.map((c) => c.xMm)) - 215.9, 14.05),
    'each half carries its own A margin');
});

test('the gutters are settings, and the cell never moves with them', () => {
  const wide = fitDivinityCards('letter', { gutterXMm: 20, gutterYMm: 8 });
  assert.ok(close(wide.cells[0]!.wMm, 88.9), 'still a true 3.5in across');
  assert.ok(close(wide.cells[0]!.hMm, 63.5), 'still a true 2.5in down');
  const xs = [...new Set(wide.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  assert.ok(close(xs[1]! - xs[0]!, 88.9 + 20), 'column pitch follows the gutter');
  assert.equal(wide.n, 8, 'and it still fits eight');
});

test('both sums close on A4 exactly — the check the template is right', () => {
  const f = fitDivinityCards('a4');
  assert.ok(close(f.marginXMm + COLS * PLACED_W_MM + (COLS - 1) * DEF_GUTTER_X_MM + f.marginRightMm, 210));
  assert.ok(close(f.marginTopMm + ROWS * PLACED_H_MM + (ROWS - 1) * DEF_GUTTER_Y_MM + f.marginBottomMm, 297));
});

test('the artwork loses NOTHING — the cell is the card, so cover-fit is 1:1', () => {
  const scale = Math.max(PLACED_W_MM / CARD_H_MM, PLACED_H_MM / CARD_W_MM);
  assert.ok(close(scale, 1), `no scaling, got ${scale}`);
  assert.ok(close(CARD_H_MM * scale - PLACED_W_MM, 0), 'nothing off the width');
  assert.ok(close(CARD_W_MM * scale - PLACED_H_MM, 0), 'nothing off the height');
});

test('A4: eight cards, 2 across x 4 down, on a 98.9 x 66.5 pitch', () => {
  const f = fitDivinityCards('a4');
  assert.equal(f.sheetWMm, 210);
  assert.equal(f.sheetHMm, 297);
  assert.equal(f.n, 8);
  assert.equal(f.cells.length, 8);
  const xs = [...new Set(f.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(f.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.equal(xs.length, 2, 'two columns');
  assert.ok(close(xs[0]!, 11.1), `A4 centres A at 11.1, got ${xs}`);
  assert.equal(ys.length, 4, 'four rows');
  assert.ok(close(xs[1]! - xs[0]!, 98.9), 'column pitch 88.9 + 10');
  for (let i = 1; i < ys.length; i++) assert.ok(close(ys[i - 1]! - ys[i]!, 66.5), 'row pitch 63.5 + 3');
  assert.ok(close(Math.min(...ys), 297 - 6.5 - 254 - 9), 'the last row sits on H');
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
  // Each half, cut free, carries its own A margin.
  assert.ok(close(Math.min(...right.map((c) => c.xMm)) - 210, 11.1));
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
  const a3 = await PDFDocument.load(await imposeDivinityCards(await cardPdf(), { sheet: 'a3', backs: false }));
  assert.equal(a3.getPageCount(), 1);
  let { width, height } = a3.getPage(0).getSize();
  assert.ok(Math.abs(width - 420 * PT_PER_MM) < 0.5, `420 mm wide, got ${(width / PT_PER_MM).toFixed(2)}`);
  assert.ok(Math.abs(height - 297 * PT_PER_MM) < 0.5);

  const a4 = await PDFDocument.load(await imposeDivinityCards(await cardPdf(), { sheet: 'a4', backs: false }));
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
  let ccw = 0, cw = 0, half = 0;
  const NUM = '(-?[\\d.]+(?:e-?\\d+)?)';
  const re = new RegExp(`${NUM} ${NUM} ${NUM} ${NUM} ${NUM} ${NUM} cm`, 'g');
  for (const m of text.matchAll(re)) {
    const a = Number(m[1]), b = Number(m[2]), c = Number(m[3]), d = Number(m[4]);
    // 180 has a = d = -1 with b = c = 0; the quarter turns have a = 0.
    if (Math.abs(a + 1) < 1e-6 && Math.abs(d + 1) < 1e-6) { half++; continue; }
    if (Math.abs(a) > 1e-6) continue;
    if (Math.abs(b - 1) < 1e-6 && Math.abs(c + 1) < 1e-6) ccw++;
    else if (Math.abs(b + 1) < 1e-6 && Math.abs(c - 1) < 1e-6) cw++;
  }
  return { ccw, cw, half };
}

test('a second page becomes a sheet of backs', async () => {
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4' });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 2, 'fronts and backs');
});

test('portrait art IS turned, and SPIN BACKS picks the other turn', async () => {
  /* The two quarter turns are 180 apart, so the switch simply picks the other
     one. Default OFF — a fresh job gets the press convention, and the operator
     ticks the box only if a cut sheet shows the backs upside down. */
  const off = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', flip: 'long' });
  const f = await turnsOnPage(off, 0), b = await turnsOnPage(off, 1);
  assert.equal(f.ccw, 8, 'eight fronts, all turned one way');
  assert.equal(f.cw, 0);
  assert.equal(b.cw, 8, 'default: the backs take the opposite turn');
  assert.equal(b.ccw, 0);

  const on = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', flip: 'long', spinBacks: true });
  const ob = await turnsOnPage(on, 1);
  assert.deepEqual(ob, f, 'spun: a real 180 — the backs now match the fronts');
});

/** A LANDSCAPE back — already the cell's way round, so it takes no quarter turn
 *  at all. This is the case the old swap-the-quarter-turn implementation could
 *  not touch: there was no quarter turn to swap, so the switch did nothing. */
async function landscapeBackPdf() {
  const d = await PDFDocument.create();
  const w = CARD_W_MM * PT_PER_MM, h = CARD_H_MM * PT_PER_MM;
  const front = d.addPage([w, h]);
  front.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(0.15, 0.2, 0.55) });
  const back = d.addPage([h, w]);                     // landscape
  back.drawRectangle({ x: 0, y: 0, width: h, height: w, color: rgb(0.6, 0.15, 0.2) });
  return d.save();
}

test('SPIN BACKS works even when the back needs no quarter turn', async () => {
  /* The bug this exists for: spinning used to mean "take the other quarter
     turn", which is a no-op when the art is already lying the cell's way round
     — exactly the artwork most likely to need spinning. It now adds a literal
     180 on top of whatever the base orientation is. */
  const off = await imposeDivinityCards(await landscapeBackPdf(), { sheet: 'a4' });
  const ob = await turnsOnPage(off, 1);
  assert.deepEqual(ob, { ccw: 0, cw: 0, half: 0 }, 'unspun: landscape back sits as-is');

  const on = await imposeDivinityCards(await landscapeBackPdf(), { sheet: 'a4', spinBacks: true });
  const nb = await turnsOnPage(on, 1);
  assert.equal(nb.half, 8, 'spun: eight real 180s — the cards face the other way');
  assert.equal(nb.ccw + nb.cw, 0, 'and no quarter turns');
});

test('the flip still picks the base turn that spinning inverts', async () => {
  const long = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', flip: 'long' });
  const short = await imposeDivinityCards(await frontBackPdf(), { sheet: 'a4', flip: 'short' });
  const lb = await turnsOnPage(long, 1), sb = await turnsOnPage(short, 1);
  assert.ok((lb.ccw > 0) !== (sb.ccw > 0), 'long and short land opposite ways');
});

test('a one-page file makes ONE sheet — no invented back', async () => {
  /* Regression. A build that faked a back sheet from page 1 so the spin switch
     had something to act on doubled the page count of every single-card export.
     The back comes from page 2 or it does not exist. */
  const single = await imposeDivinityCards(await cardPdf(), { sheet: 'letter' });
  assert.equal((await PDFDocument.load(single)).getPageCount(), 1, 'one page in, one sheet out');

  const pair = await imposeDivinityCards(await frontBackPdf(), { sheet: 'letter' });
  assert.equal((await PDFDocument.load(pair)).getPageCount(), 2, 'two pages in, fronts + backs');

  const off = await imposeDivinityCards(await frontBackPdf(), { sheet: 'letter', backs: false });
  assert.equal((await PDFDocument.load(off)).getPageCount(), 1, 'and backs can still be suppressed');
});
test('BLEED runs the art past the trim without moving the cut', async () => {
  /* The white slivers on the shop's first cut stack: the art was fitted to the
     bare trim, so any drift in the blade left paper showing down one edge. The
     art now overflows into the gutter. The CELL is untouched — bleed must move
     ink, never the cut line, or every card comes out a different size. */
  const a = fitDivinityCards('letter');
  for (const c of a.cells) {
    assert.ok(close(c.wMm, PLACED_W_MM), 'trim unchanged by bleed');
    assert.ok(close(c.hMm, PLACED_H_MM));
  }

  const zero = await imposeDivinityCards(await cardPdf(), { sheet: 'letter', bleedMm: 0 });
  const bled = await imposeDivinityCards(await cardPdf(), { sheet: 'letter', bleedMm: 1.5 });
  // More ink on the sheet means a bigger scale factor in the placement matrix.
  const scaleOf = async (b: Uint8Array) => {
    const zlib = await import('node:zlib');
    const { PDFStream } = await import('pdf-lib');
    const d = await PDFDocument.load(b);
    const st = d.getPage(0).node.normalizedEntries().Contents;
    let text = '';
    for (let i = 0; st && i < st.size(); i++) {
      const raw = (d.context.lookup(st.get(i), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
      try { text += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
      catch { text += Buffer.from(raw).toString('latin1'); }
    }
    const m = [...text.matchAll(/(-?[\d.]+) 0 0 (-?[\d.]+) [-\d.]+ [-\d.]+ cm/g)];
    return Math.max(...m.map((x) => Math.abs(Number(x[1]))));
  };
  assert.ok(await scaleOf(bled) > await scaleOf(zero), 'bleed really enlarges the art');
});

test('bleed is NOT capped — it is meant to spill into the gutters', async () => {
  /* Every card on the sheet is the same artwork, so where two bleeds overlap
     they overlap with themselves, and the blade takes the overlap away. Capping
     it at half the gutter was the wrong instinct: a 3 mm row gutter would have
     silently held the bleed to 1.5 however much was asked for. */
  const huge = await imposeDivinityCards(await cardPdf(), { sheet: 'letter', bleedMm: 50 });
  const doc = await PDFDocument.load(huge);
  assert.equal(doc.getPageCount(), 1, 'still builds');
  const { width, height } = doc.getPage(0).getSize();
  assert.ok(Math.abs(width - 215.9 * PT_PER_MM) < 0.5, 'and the sheet is untouched');
  assert.ok(Math.abs(height - 279.4 * PT_PER_MM) < 0.5);
});

test('the bleed leaves the paper the operator expects in each gutter', () => {
  /* The arithmetic the owner did out loud, kept so it cannot drift: bleed eats
     into the gutter from BOTH sides, so what is left between two bled cards is
     the gutter minus twice the bleed. B 10 leaves 7 mm of paper; E/F/G 3 leaves
     nothing at all, which is a shared edge and exactly right. */
  const BLEED = 1.5;
  const f = fitDivinityCards('letter');
  const xs = [...new Set(f.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(f.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  const gapX = xs[1]! - xs[0]! - PLACED_W_MM;
  const gapY = ys[0]! - ys[1]! - PLACED_H_MM;
  assert.ok(close(gapX, 10), 'B is 10 between the trims');
  assert.ok(close(gapY, 3), 'E/F/G is 3 between the trims');
  assert.ok(close(gapX - 2 * BLEED, 7), '7 mm of paper left between the columns');
  assert.ok(close(gapY - 2 * BLEED, 0), 'and the rows bleed edge to edge');
});

test('SPIN BACKS turns a lone sheet — and still never adds a page', async () => {
  /* The shop runs fronts from one file and backs from another. A single upload
     of the back artwork IS the backs pass, so the switch has to turn THAT sheet;
     with no second sheet to act on it would otherwise do nothing at all. The
     page count is asserted in the same test because the last two fixes to this
     tool both moved it by accident. */
  const plain = await imposeDivinityCards(await cardPdf(), { sheet: 'letter' });
  const spun = await imposeDivinityCards(await cardPdf(), { sheet: 'letter', spinBacks: true });
  assert.equal((await PDFDocument.load(plain)).getPageCount(), 1, 'one sheet');
  assert.equal((await PDFDocument.load(spun)).getPageCount(), 1, 'still one sheet when spun');

  const a = await turnsOnPage(plain, 0), b = await turnsOnPage(spun, 0);
  assert.ok((a.ccw > 0) !== (b.ccw > 0), 'and the art really turned a half turn');

  /* With a real back page the switch goes back to acting on the BACK sheet only,
     leaving the fronts alone — otherwise ticking it would flip both and the
     backs would land the same way round they started. */
  const pair = await imposeDivinityCards(await frontBackPdf(), { sheet: 'letter', spinBacks: true });
  const pf = await turnsOnPage(pair, 0), pb = await turnsOnPage(pair, 1);
  assert.deepEqual(pf, a, 'fronts untouched when a back page exists');
  assert.deepEqual(pb, pf, 'and the back is spun onto the front’s orientation');
});

test('A EQUALS C unless A is typed — the shop’s requirement, as a constraint', () => {
  /* "Gutter C is supposed to be the exact same width as A." That is not a
     number to store, it is a constraint: A + block + C = the sheet, so equality
     fixes A at (sheet - block) / 2 and leaves nothing to choose. Asserted on
     every sheet, and at a non-default gutter, so it cannot hold by luck. */
  for (const sheet of ['letter', 'tabloid', 'a4', 'a3'] as const) {
    for (const gutterXMm of [10, 16, 4]) {
      const f = fitDivinityCards(sheet, { gutterXMm });
      assert.ok(close(f.marginXMm, f.marginRightMm),
        `${sheet} @ B ${gutterXMm}: A ${f.marginXMm} vs C ${f.marginRightMm}`);
      assert.ok(close(f.marginXMm + f.blockWMm + f.marginRightMm,
        sheet === 'tabloid' ? 215.9 : sheet === 'a3' ? 210 : f.sheetWMm), 'and it still sums');
    }
  }
  // Typing A still wins, with C taking the difference.
  const pinned = fitDivinityCards('letter', { marginXMm: 11 });
  assert.ok(close(pinned.marginXMm, 11));
  assert.ok(close(pinned.marginRightMm, 17.1), 'C absorbs it');
});
