/* A4 Business Card Cutter — the manufacturer's 10-up template, read back out
 * of the fit module and the exported page. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  fitBusinessCards, sheetDefaults, rowsFor, PT_PER_MM,
  BC_CARD_W_MM, BC_CARD_H_MM, BC_GROOVE_MM, BC_BLEED_MM, BC_LAYOUT_W_MM, BC_LAYOUT_H_MM,
} from '../src/lib/imposition-toolkit/fit/a4-business-cards.ts';

const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

test('the template: 90 x 54 cards, 93 x 57 layout, 3 mm groove', () => {
  assert.equal(BC_CARD_W_MM, 90); assert.equal(BC_CARD_H_MM, 54);
  assert.equal(BC_BLEED_MM, 1.5); assert.equal(BC_LAYOUT_W_MM, 93); assert.equal(BC_LAYOUT_H_MM, 57);
  assert.equal(BC_GROOVE_MM, 3);
});

test('A4: two columns of five, centered — 12 + 93 + 93 + 12 across, 6 + 5(57) + 6 down', () => {
  const f = fitBusinessCards('a4');
  assert.equal(f.n, 10); assert.equal(f.cols, 2); assert.equal(f.rows, 5);
  assert.equal(f.sheetWMm, 210); assert.equal(f.sheetHMm, 297);
  // Cuts: the layout boxes start 12 / 6 from the edge, so the cut is 1.5 inside that.
  const d = sheetDefaults('a4');
  assert.ok(close(d.marginXMm, 13.5), `A ${d.marginXMm}`);
  assert.ok(close(d.marginTopMm, 7.5), `D ${d.marginTopMm}`);
  assert.equal(d.gutterXMm, 3); assert.equal(d.gutterYMm, 3);
  assert.ok(close(f.marginRightMm, 13.5)); assert.ok(close(f.marginBottomMm, 7.5));
  // Column cuts at 13.5 / 103.5 / 106.5 / 196.5.
  const xs = [...new Set(f.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  assert.deepEqual(xs.map((x) => Math.round(x * 100) / 100), [13.5, 106.5]);
  // Row tops, from the top of the sheet: 7.5, 64.5, 121.5, 178.5, 235.5.
  const tops = [...new Set(f.cells.map((c) => 297 - (c.yMm + c.hMm)))].sort((a, b) => a - b);
  assert.deepEqual(tops.map((v) => Math.round(v * 100) / 100), [7.5, 64.5, 121.5, 178.5, 235.5]);
  // Every cell is the card as cut.
  for (const c of f.cells) { assert.equal(c.wMm, 90); assert.equal(c.hMm, 54); }
  // Symmetric about both axes, so backs register under either flip.
  for (const c of f.cells) {
    assert.ok(f.cells.some((d) => close(d.xMm, 210 - (c.xMm + c.wMm)) && close(d.yMm, c.yMm)), 'mirror across');
    assert.ok(f.cells.some((d) => close(d.yMm, 297 - (c.yMm + c.hMm)) && close(d.xMm, c.xMm)), 'mirror down');
  }
});

test('A3 is two A4 blocks side by side, stood up portrait, cut at 210', () => {
  const f = fitBusinessCards('a3');
  assert.equal(f.n, 20);
  assert.ok(f.rotated);
  assert.equal(f.pageWMm, 297); assert.equal(f.pageHMm, 420);   // never landscape
  assert.deepEqual(f.cutXMm, [210]);
  const a4 = fitBusinessCards('a4');
  // Second block is the first shifted by 210, cell for cell.
  for (let i = 0; i < 10; i++) {
    assert.ok(close(f.cells[i]!.xMm, a4.cells[i]!.xMm) && close(f.cells[i]!.yMm, a4.cells[i]!.yMm));
    assert.ok(close(f.cells[i + 10]!.xMm, a4.cells[i]!.xMm + 210) && close(f.cells[i + 10]!.yMm, a4.cells[i]!.yMm));
  }
});

test('11 x 17 is two Letter halves: the A4 layout hung from the top, row 5 off the foot, cut at 215.9', () => {
  assert.equal(rowsFor('letter'), 5);
  assert.ok(5 * 54 + 4 * 3 > 279.4, 'the 10-up block is taller than a Letter half');
  const f = fitBusinessCards('tabloid');
  assert.equal(f.n, 16); assert.equal(f.wholeRows, 4); assert.ok(f.rotated);
  assert.ok(close(f.pageWMm, 279.4, 0.01)); assert.ok(close(f.pageHMm, 431.8, 0.01));
  assert.ok(close(f.cutXMm[0]!, 215.9, 0.01));
  const d = sheetDefaults('letter');
  // Across: centered on the half, (215.9 - 183) / 2 — the slitting blades sit
  // either side of the machine's center line and the rails center the sheet.
  assert.ok(close(d.marginXMm, (215.9 - 183) / 2, 0.01));
  // Down: NOT centered. The cross-cut indexes off the leading edge at the A4
  // program, so the first cut is at 7.5 on Letter exactly as on A4, the rows
  // step 57, and the leftover (46.9) all goes to the tail.
  assert.ok(close(d.marginTopMm, 7.5, 0.01));
  assert.equal(d.gutterXMm, 3); assert.equal(d.gutterYMm, 3);
  const letter = fitBusinessCards('letter');
  // EXACTLY the A4 layout from the top edge, and the fifth row — which would
  // start at 235.5 and end at 289.5 > 279.4 — is NOT laid (owner: "don't even
  // put the image there").
  const tops = [...new Set(letter.cells.map((c) => 279.4 - (c.yMm + c.hMm)))].sort((a, b) => a - b);
  assert.deepEqual(tops.map((v) => Math.round(v * 100) / 100), [7.5, 64.5, 121.5, 178.5]);
  assert.equal(letter.cells.length, 8); assert.equal(letter.n, 8); assert.equal(letter.wholeRows, 4);
  for (const c of letter.cells) assert.ok(c.yMm >= 0, 'every laid card is wholly on the sheet');
  assert.ok(close(letter.marginBottomMm, 279.4 - 7.5 - 225, 0.01), 'H is the blank tail, 46.9');
  // The A4 rows are at the same distances from the head — same program, same cuts.
  const a4tops = [...new Set(fitBusinessCards('a4').cells.map((c) => 297 - (c.yMm + c.hMm)))].sort((a, b) => a - b);
  assert.deepEqual(a4tops.slice(0, 4).map((v) => Math.round(v * 100) / 100), tops.map((v) => Math.round(v * 100) / 100));
  // Every cell lies within its own half across.
  assert.equal(f.cells.length, 16);
  for (const c of f.cells.slice(0, 8)) assert.ok(c.xMm + c.wMm <= 215.9 + 1e-9);
  for (const c of f.cells.slice(8)) assert.ok(c.xMm >= 215.9 - 1e-9);
});

test('typed gutters move the block, never the card', () => {
  const f = fitBusinessCards('a4', { marginXMm: 10, marginTopMm: 5, gutterXMm: 4, gutterYMm: 2 });
  assert.ok(close(f.cells[0]!.xMm, 10)); assert.ok(close(f.cells[1]!.xMm, 104));
  assert.ok(close(297 - (f.cells[0]!.yMm + 54), 5)); assert.ok(close(297 - (f.cells[2]!.yMm + 54), 61));
  for (const c of f.cells) { assert.equal(c.wMm, 90); assert.equal(c.hMm, 54); }
});

test('imposeBusinessCards: A4 one page in, one sheet out; doubled stocks stand up portrait', async () => {
  const { imposeBusinessCards } = await import('../src/lib/imposition-toolkit/impose.ts');
  const card = await PDFDocument.create();
  const p = card.addPage([93 * PT_PER_MM, 57 * PT_PER_MM]);
  p.drawRectangle({ x: 0, y: 0, width: 93 * PT_PER_MM, height: 57 * PT_PER_MM, color: rgb(0.2, 0.4, 0.9) });
  const bytes = await card.save();
  for (const [sheet, w, h, n] of [['a4', 210, 297, 1], ['a3', 297, 420, 1], ['letter', 215.9, 279.4, 1], ['tabloid', 279.4, 431.8, 1]] as const) {
    const out = await PDFDocument.load(await imposeBusinessCards(bytes, { sheet }));
    assert.equal(out.getPageCount(), n, sheet);
    const s = out.getPage(0).getSize();
    assert.ok(close(s.width / PT_PER_MM, w, 0.05) && close(s.height / PT_PER_MM, h, 0.05), `${sheet} ${s.width / PT_PER_MM} x ${s.height / PT_PER_MM}`);
    assert.ok(s.height >= s.width, `${sheet} must be portrait`);
  }
  // Two pages in → fronts and backs.
  const b = card.addPage([93 * PT_PER_MM, 57 * PT_PER_MM]);
  b.drawRectangle({ x: 0, y: 0, width: 93 * PT_PER_MM, height: 57 * PT_PER_MM, color: rgb(0.9, 0.8, 0.6) });
  const two = await PDFDocument.load(await imposeBusinessCards(await card.save(), { sheet: 'a4' }));
  assert.equal(two.getPageCount(), 2);
});

test('imposeBusinessCards: separate front and back uploads make a fronts sheet and a backs sheet', async () => {
  const { imposeBusinessCards } = await import('../src/lib/imposition-toolkit/impose.ts');
  const mk = async (r: number, g: number, b: number, w = 93, h = 57) => {
    const d = await PDFDocument.create();
    const p = d.addPage([w * PT_PER_MM, h * PT_PER_MM]);
    p.drawRectangle({ x: 0, y: 0, width: w * PT_PER_MM, height: h * PT_PER_MM, color: rgb(r, g, b) });
    return d.save();
  };
  const front = await mk(0.2, 0.3, 0.8), back = await mk(0.9, 0.8, 0.6);
  // Working file is the front; back comes from its own upload.
  const two = await PDFDocument.load(await imposeBusinessCards(front, { sheet: 'a4', back }));
  assert.equal(two.getPageCount(), 2);
  // Both as uploads over an unrelated one-page working file.
  const other = await mk(0, 0, 0, 50, 50);
  const both = await PDFDocument.load(await imposeBusinessCards(other, { sheet: 'tabloid', front, back }));
  assert.equal(both.getPageCount(), 2);
  assert.ok(both.getPage(1).getSize().height > both.getPage(1).getSize().width, 'backs sheet portrait too');
  // Backs switched off: one sheet even with a back supplied.
  const one = await PDFDocument.load(await imposeBusinessCards(front, { sheet: 'a4', back, backs: false }));
  assert.equal(one.getPageCount(), 1);
  // A front upload and a one-page working file: no back to be had, one sheet.
  const solo = await PDFDocument.load(await imposeBusinessCards(other, { sheet: 'a4', front }));
  assert.equal(solo.getPageCount(), 1);
});

test('imposeBusinessCards: a two-page PDF carries front and back, wherever it is loaded', async () => {
  const { imposeBusinessCards } = await import('../src/lib/imposition-toolkit/impose.ts');
  const twoPage = await (async () => {
    const d = await PDFDocument.create();
    for (const c of [rgb(0.2, 0.3, 0.8), rgb(0.9, 0.8, 0.6)]) {
      const p = d.addPage([93 * PT_PER_MM, 57 * PT_PER_MM]);
      p.drawRectangle({ x: 0, y: 0, width: 93 * PT_PER_MM, height: 57 * PT_PER_MM, color: c });
    }
    return d.save();
  })();
  const onePage = await (async () => {
    const d = await PDFDocument.create();
    const p = d.addPage([50 * PT_PER_MM, 50 * PT_PER_MM]);
    p.drawRectangle({ x: 0, y: 0, width: 50 * PT_PER_MM, height: 50 * PT_PER_MM, color: rgb(0, 0, 0) });
    return d.save();
  })();
  // As the working file.
  assert.equal((await PDFDocument.load(await imposeBusinessCards(twoPage, { sheet: 'a4' }))).getPageCount(), 2);
  // In the Front slot, over an unrelated one-page working file.
  assert.equal((await PDFDocument.load(await imposeBusinessCards(onePage, { sheet: 'a4', front: twoPage }))).getPageCount(), 2);
  // In the Front slot with a separate Back: the Back upload wins, still two sheets.
  assert.equal((await PDFDocument.load(await imposeBusinessCards(onePage, { sheet: 'a3', front: twoPage, back: onePage }))).getPageCount(), 2);
  // Backs off: one sheet.
  assert.equal((await PDFDocument.load(await imposeBusinessCards(twoPage, { sheet: 'a4', backs: false }))).getPageCount(), 1);
});
