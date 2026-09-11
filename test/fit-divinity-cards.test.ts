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

test('tabloid is two Letters side by side, cut at 215.9', () => {
  const f = fitDivinityCards('tabloid');
  assert.ok(close(f.sheetWMm, 431.8), '11 x 17');
  assert.ok(close(f.sheetHMm, 279.4));
  assert.equal(f.n, 16);
  assert.ok(close(f.cutXMm[0]!, 215.9), 'cut down the middle into two Letters');
  const right = f.cells.slice(8);
  assert.ok(close(Math.min(...right.map((c) => c.xMm)) - 215.9, 14),
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

test('A4: eight cards, 2 across x 4 down, rows butting', () => {
  const f = fitDivinityCards('a4');
  assert.equal(f.sheetWMm, 210);
  assert.equal(f.sheetHMm, 297);
  assert.equal(f.n, 8);
  assert.equal(f.cells.length, 8);
  const xs = [...new Set(f.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(f.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.equal(xs.length, 2, 'two columns');
  assert.ok(close(xs[0]!, 14), `A at 14, got ${xs}`);
  assert.equal(ys.length, 4, 'four rows');
  assert.ok(close(xs[1]! - xs[0]!, 97.4), 'column pitch 88.9 + 8.5');
  for (let i = 1; i < ys.length; i++) assert.ok(close(ys[i - 1]! - ys[i]!, 63.5), 'row pitch = the card, butting');
  assert.ok(close(Math.min(...ys), 297 - 6.5 - 254), 'the last row sits on H');
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
  assert.ok(close(Math.min(...right.map((c) => c.xMm)) - 210, 14));
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

test('the BACK sheet mirrors across — A and C trade places', async () => {
  /* The template is NOT symmetric: A 15.5 against C 12.6, because that is where
     the machine cuts on production stock. A sheet turned over about its long
     edge therefore only lands on its front if the block is mirrored. Nothing
     about a symmetric template would need this, and nothing would catch it
     breaking either — hence the test. */
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'letter', addMarks: false });
  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const doc = await PDFDocument.load(out);
  const colsOf = async (i: number) => {
    const st = doc.getPage(i).node.normalizedEntries().Contents;
    let t = '';
    for (let k = 0; st && k < st.size(); k++) {
      const raw = (doc.context.lookup(st.get(k), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
      try { t += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
      catch { t += Buffer.from(raw).toString('latin1'); }
    }
    return [...new Set([...t.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re/g)]
      .map((m) => Math.round((Number(m[1]) / PT_PER_MM) * 10) / 10))].sort((a, b) => a - b);
  };
  assert.deepEqual(await colsOf(0), [12.5, 109.9], 'unticked, nothing mirrors');
  assert.deepEqual(await colsOf(1), [12.5, 109.9], 'including the back sheet');
});

test('SPIN BACKS swaps the margins on a ONE-PAGE upload', async () => {
  /* The shop's actual workflow: the backs are their own one-page file, printed
     as a separate pass. That single sheet IS the backs, so ticking the box has
     to move ITS margins — 15.5 to C, 12.6 to A — or the backs run does not
     register with the fronts run. Read off the rendered content stream, not the
     settings, because this is the exact claim that kept being wrong. */
  const off = await imposeDivinityCards(await cardPdf(), { sheet: 'letter', addMarks: false });
  const on = await imposeDivinityCards(await cardPdf(), { sheet: 'letter', addMarks: false, spinBacks: true });
  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const leftEdge = async (b: Uint8Array) => {
    const d = await PDFDocument.load(b);
    assert.equal(d.getPageCount(), 1, 'and it is still ONE sheet');
    const st = d.getPage(0).node.normalizedEntries().Contents;
    let t = '';
    for (let k = 0; st && k < st.size(); k++) {
      const raw = (d.context.lookup(st.get(k), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
      try { t += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
      catch { t += Buffer.from(raw).toString('latin1'); }
    }
    return Math.min(...[...t.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re/g)]
      .map((m) => Math.round((Number(m[1]) / PT_PER_MM) * 10) / 10));
  };
  assert.equal(await leftEdge(off), 12.5, 'unticked: A 14, less the 1.5 bleed');
  assert.equal(await leftEdge(on), 14.1, 'ticked: A becomes C 15.6, less the bleed');
});

test('SPIN BACKS swaps the back sheet of a TWO-PAGE upload', async () => {
  const out = await imposeDivinityCards(await frontBackPdf(), { sheet: 'letter', addMarks: false, spinBacks: true });
  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const d = await PDFDocument.load(out);
  const leftOf = async (i: number) => {
    const st = d.getPage(i).node.normalizedEntries().Contents;
    let t = '';
    for (let k = 0; st && k < st.size(); k++) {
      const raw = (d.context.lookup(st.get(k), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
      try { t += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
      catch { t += Buffer.from(raw).toString('latin1'); }
    }
    return Math.min(...[...t.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re/g)]
      .map((m) => Math.round((Number(m[1]) / PT_PER_MM) * 10) / 10));
  };
  assert.equal(await leftOf(0), 12.5, 'fronts untouched');
  assert.equal(await leftOf(1), 14.1, 'backs swapped');
});

test('11 x 17 doubles the sheet up and cuts back to two Letters', () => {
  /* Run the job two-up on tabloid and guillotine down the middle. Each half has
     to be a whole Letter template in its own right, carrying its own A and C —
     otherwise the halves are not interchangeable and the double-up is worthless. */
  const f = fitDivinityCards('tabloid');
  assert.ok(close(f.sheetWMm, 431.8) && close(f.sheetHMm, 279.4), '11 x 17');
  assert.equal(f.n, 16, 'sixteen cards');
  assert.ok(close(f.cutXMm[0]!, 215.9), 'cut down the middle at one Letter width');

  const one = fitDivinityCards('letter');
  const right = f.cells.filter((c) => c.xMm > 215.9);
  assert.equal(right.length, 8, 'eight on the right half');
  assert.ok(close(Math.min(...right.map((c) => c.xMm)) - 215.9, one.marginXMm), 'its own A 14');
  assert.ok(close(431.8 - Math.max(...right.map((c) => c.xMm + c.wMm)), one.marginRightMm), 'its own C 12.6');
  // And the left half is the plain Letter layout untouched.
  const left = f.cells.filter((c) => c.xMm < 215.9);
  assert.deepEqual(left.map((c) => Math.round(c.xMm * 100)), one.cells.map((c) => Math.round(c.xMm * 100)));
});
