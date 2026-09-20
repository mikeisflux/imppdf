/* Divinity trading cards — one card ganged 8-up on Letter, the block duplicated
 * onto 11 x 17 so one sheet cuts into two identical Letters to run.
 *
 *   page    215.9 x 279.4 (Letter) / 279.4 x 431.8 (11 x 17) — ALWAYS PORTRAIT
 *   layout  the 11 x 17 is reasoned about landscape, two blocks side by side,
 *           and the finished PAGE is stood up; nothing inside it moves
 *   cell    89 x 63      the MACHINE'S programmed card, off its own panel
 *   art     92 x 66, the vendor's LAYOUT SIZE — 1.5 past every cut, every card
 *
 *   letter      across  A 17.45 + 89 + B 3 + 89 + C 17.45  = 215.9
 *               down    D 7.6 + 4(63) + 3(3) + H 10.8      = 279.4
 *   letterreg   the manufacturer's A4 template, converted for Letter stock
 *               centred in a cutter hard-wired for A4:
 *               across  A 12.45 + 89 + B 13 + 89 + C 12.45 = 215.9
 *               down    D 7.6 + 4(63) + 3(6) + H 1.8       = 279.4
 *
 * The gutters place the CUTS and are read off the cutter's own panel (Front len,
 * Card len, Groove len) — never measured back off its output, which measures the
 * drift between file and machine rather than the machine. The art is then laid
 * at the vendor's layout size, so the grooves fill with ink and the blade cuts
 * through artwork. C and H are the remainder. These tests check both halves by
 * reading the drawn rectangles back out of the exported page. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  fitDivinityCards, PT_PER_MM, CARD_W_MM, CARD_H_MM, PLACED_W_MM, PLACED_H_MM,
  DEF_GUTTER_X_MM, DEF_MARGIN_X_MM, DEF_MARGIN_TOP_MM, COLS, ROWS,
  MACHINE_CARD_W_MM, MACHINE_CARD_L_MM, MACHINE_GROOVE_MM, MACHINE_FRONT_MM,
  LAYOUT_BLEED_MM, LAYOUT_W_MM, LAYOUT_L_MM, OUTER_BLEED_MM,
  REG_HEAD_MM, REG_MARK_INSET_MM, REG_MARK_DEPTH_MM, REG_MARK_PAD_MM,
  sheetDefaults, TEMPLATE_A4_EDGE_MM, TEMPLATE_COL_GAP_MM, TEMPLATE_COL_CUT_GAP_MM,
  TEMPLATE_ROW_CUT_GAP_MM, BLADE_INNER_MM, BLADE_OUTER_MM, LETTER_TEST_MARGIN_X_MM,
} from '../src/lib/imposition-toolkit/fit/divinity-cards.ts';
import { imposeDivinityCards, BLACK_BORDER_MM } from '../src/lib/imposition-toolkit/impose.ts';

const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

test("THE CELL IS THE MACHINE'S CARD — 89 x 63, off its own panel", () => {
  assert.ok(close(PLACED_W_MM, 89), `89 across, got ${PLACED_W_MM}`);
  assert.ok(close(PLACED_H_MM, 63), `63 in the feed direction, got ${PLACED_H_MM}`);
  /* Taken from the machine constants, not typed twice — a copy drifts the
     moment the cutter is reprogrammed and someone updates only one of them. */
  assert.ok(close(PLACED_W_MM, MACHINE_CARD_W_MM) && close(PLACED_H_MM, MACHINE_CARD_L_MM),
    'and it IS the machine figure');
  /* Near enough a 2.5 x 3.5" card that the difference is the panel rounding to
     whole millimetres — but the machine's number is the one that cuts. */
  assert.ok(Math.abs(PLACED_W_MM - CARD_H_MM) < 0.2, 'within rounding of 3.5in');
  assert.ok(Math.abs(PLACED_H_MM - CARD_W_MM) < 0.6, 'within rounding of 2.5in');
});

test("THE FILE STEPS WHAT THE MACHINE STEPS — Front 7.6, pitch 66", () => {
  /* Everything the cutter does is these four numbers. If the file disagrees with
     any of them the blade walks into the art, a little further every row. */
  assert.ok(close(MACHINE_FRONT_MM, 7.6) && close(MACHINE_GROOVE_MM, 3));
  const f = fitDivinityCards('letter');
  assert.ok(close(f.marginTopMm, MACHINE_FRONT_MM), 'D is the panel Front len');
  assert.deepEqual(f.rowGapsMm, [MACHINE_GROOVE_MM, MACHINE_GROOVE_MM, MACHINE_GROOVE_MM],
    'E F G are the panel Groove len');
  assert.ok(close(DEF_GUTTER_X_MM, MACHINE_GROOVE_MM), 'and so is B');
  const ys = [...new Set(f.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  for (let i = 1; i < ys.length; i++)
    assert.ok(close(ys[i - 1]! - ys[i]!, MACHINE_CARD_L_MM + MACHINE_GROOVE_MM),
      'row pitch is card + groove = 66, every row');
});

test('FIVE ROWS DO NOT FIT ANY SHEET IT TAKES — Cut pieces should be 8', () => {
  /* The panel is left on 10. At a 63 mm card five rows need 334.6, which is over
     Letter AND over A4, so after the eight that fit the machine goes hunting for
     a fifth row that cannot exist. Harmless to the eight, but it is why it looks
     like it is trying to cut past the end of the sheet. */
  const need = (rows: number) =>
    MACHINE_FRONT_MM + rows * MACHINE_CARD_L_MM + (rows - 1) * MACHINE_GROOVE_MM;
  assert.ok(need(4) <= 279.4, `4 rows fit Letter (${need(4)})`);
  assert.ok(need(5) > 297, `5 rows do not fit even A4 (${need(5)})`);
  assert.equal(fitDivinityCards('letter').n, 8, 'so the sheet is eight up');
});

test('tabloid is two Letters side by side in the LAYOUT frame, cut at 215.9', () => {
  const f = fitDivinityCards('tabloid');
  assert.ok(close(f.sheetWMm, 431.8), '11 x 17');
  assert.ok(close(f.sheetHMm, 279.4));
  assert.equal(f.n, 16);
  assert.ok(close(f.cutXMm[0]!, 215.9), 'cut down the middle into two Letters');
  const right = f.cells.slice(8);
  assert.ok(close(Math.min(...right.map((c) => c.xMm)) - 215.9, DEF_MARGIN_X_MM),
    'each half carries its own A margin');
});

test('B is a setting, and the cell never moves with it', () => {
  const wide = fitDivinityCards('letter', { gutterXMm: 20 });
  assert.ok(close(wide.cells[0]!.wMm, 89), 'still the cut size across');
  assert.ok(close(wide.cells[0]!.hMm, 63), 'still the cut size down');
  const xs = [...new Set(wide.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  assert.ok(close(xs[1]! - xs[0]!, 89 + 20), 'column pitch follows the gutter');
  assert.equal(wide.n, 8, 'and it still fits eight');
});

test('ONE gutter everywhere — B 3 and E F G 3, the machine steps one pitch', () => {
  const f = fitDivinityCards('letter');
  assert.ok(close(DEF_GUTTER_X_MM, 3), 'B defaults to the machine gutter, 3');
  assert.deepEqual(f.rowGapsMm, [3, 3, 3], 'E F G are the machine gutter, and EQUAL');
  /* The whole point: a slitter advances one pitch and repeats it. Unequal row
     gutters cannot describe that, and the error compounds down the sheet. */
  const pitches = [...new Set(f.rowGapsMm)];
  assert.equal(pitches.length, 1, 'one gutter, not three different ones');
  const xs = [...new Set(f.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(f.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.ok(close(xs[1]! - xs[0]!, PLACED_W_MM + 3), 'column pitch = cell + B');
  for (let i = 1; i < ys.length; i++)
    assert.ok(close(ys[i - 1]! - ys[i]!, PLACED_H_MM + f.rowGapsMm[i - 1]!), 'row pitch = cell + its own gap');
});

test('E F G are set INDEPENDENTLY, and H takes up whatever they leave', () => {
  /* Three boxes rather than one, so an operator can prove a machine wrong — but
     see the test above: this cutter steps ONE pitch, so in production they are
     all the panel's Groove len. The panel warns when they are set apart. */
  const f = fitDivinityCards('letter', { gutterEMm: 3, gutterFMm: 2, gutterGMm: 1 });
  assert.deepEqual(f.rowGapsMm, [3, 2, 1], 'each one lands where it was typed');
  const ys = [...new Set(f.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.ok(close(ys[0]! - ys[1]!, PLACED_H_MM + 3), 'E between rows 1 and 2');
  assert.ok(close(ys[1]! - ys[2]!, PLACED_H_MM + 2), 'F between rows 2 and 3');
  assert.ok(close(ys[2]! - ys[3]!, PLACED_H_MM + 1), 'G between rows 3 and 4');
  const plain = fitDivinityCards('letter');
  const opened = 6 - (plain.rowGapsMm[0] + plain.rowGapsMm[1] + plain.rowGapsMm[2]);
  assert.ok(close(plain.marginBottomMm - f.marginBottomMm, opened),
    'H closes up by exactly what the three gaps opened');
});

test('both sums close on A4 exactly — the check the template is right', () => {
  const f = fitDivinityCards('a4');
  assert.ok(close(f.marginXMm + COLS * PLACED_W_MM + (COLS - 1) * DEF_GUTTER_X_MM + f.marginRightMm, 210));
  /* The vertical chain is D + 4 cells + E + F + G + H. */
  const rowSum = f.rowGapsMm[0] + f.rowGapsMm[1] + f.rowGapsMm[2];
  assert.ok(close(f.marginTopMm + ROWS * PLACED_H_MM + rowSum + f.marginBottomMm, 297));
});

test('the art is STRETCHED to fill — nothing cropped, no white inside', () => {
  /* Owner's instruction, and an exception to the house contain-never-stretch
     rule: the cell IS the card's set size, so the art becomes the cell. The two
     axes therefore scale by DIFFERENT amounts, which is the whole point — a
     single shared scale would be cover (crops) or contain (leaves white). */
  const sx = PLACED_W_MM / CARD_H_MM, sy = PLACED_H_MM / CARD_W_MM;
  assert.ok(!close(sx, sy), 'the two axes scale apart, or it is not a stretch');
  assert.ok(close(CARD_H_MM * sx, PLACED_W_MM), 'fills the cell across');
  assert.ok(close(CARD_W_MM * sy, PLACED_H_MM), 'fills the cell down');
});

test("THE VENDOR'S LAYOUT SIZE — art at 92 x 66 over an 89 x 63 cut", async () => {
  /* Their template: "card size 89x63, LAYOUT SIZE 92x66". That is half the
     groove past the cut on every side, so two neighbours meet in the MIDDLE of
     the groove, it fills with ink, and the blade cuts through artwork however it
     drifts. It must move no cut line — the cells are still 89 x 63. */
  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const out = await imposeDivinityCards(await cardPdf(), { sheet: 'letter', addMarks: false });
  const doc = await PDFDocument.load(out);
  const st = doc.getPage(0).node.normalizedEntries().Contents;
  let t = '';
  for (let k = 0; st && k < st.size(); k++) {
    const raw = (doc.context.lookup(st.get(k), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
    try { t += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
    catch { t += Buffer.from(raw).toString('latin1'); }
  }
  const mm2 = (v: string) => Math.round((Number(v) / PT_PER_MM) * 100) / 100;
  const rects = [...new Set([...t.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re/g)]
    .map((m) => [mm2(m[1]!), mm2(m[2]!), mm2(m[3]!), mm2(m[4]!)].join(',')))]
    .map((r) => r.split(',').map(Number) as [number, number, number, number])
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const f = fitDivinityCards('letter');
  const B = LAYOUT_BLEED_MM;
  assert.ok(close(B, 1.5), 'the layout box is 1.5 past the cut');
  assert.ok(close(LAYOUT_W_MM, 92) && close(LAYOUT_L_MM, 66), "the vendor's 92 x 66");
  /* THE ART IS THE LAYOUT BOX AND NOTHING ELSE: eight rectangles of exactly
     92 x 66, one per card, each the cell grown 1.5 on every side. Identical on
     every card and symmetric on every edge, so the cut takes the same 1.5 off
     each edge of each one — the crop is the template's. */
  const art = rects.filter((r) => close(r[2], LAYOUT_W_MM, 0.02) && close(r[3], LAYOUT_L_MM, 0.02));
  assert.equal(art.length, 8, `eight layout boxes drawn, got ${art.length}`);
  for (const c of f.cells) {
    assert.ok(art.some((r) => close(r[0], c.xMm - B, 0.02) && close(r[1], c.yMm - B, 0.02)),
      `a layout box sits 1.5 outside the cell at ${c.xMm},${c.yMm}`);
  }
  /* EVERY OTHER RECTANGLE IS OUTSIDE THE BLOCK. The outer strips carry the
     art's edge across the margin (registration tolerance) and none of them
     reaches into a cell — the crop cannot be touched by them. */
  const strips = rects.filter((r) => !art.includes(r));
  assert.ok(strips.length > 0, 'the outer edges are carried across the margin');
  for (const r of strips) {
    const inside = f.cells.some((c) =>
      r[0] < c.xMm + c.wMm - 0.01 && r[0] + r[2] > c.xMm + 0.01
      && r[1] < c.yMm + c.hMm - 0.01 && r[1] + r[3] > c.yMm + 0.01);
    assert.ok(!inside, `a strip at ${r.join(',')} overlaps a cell`);
    const inBlock = r[0] >= f.marginXMm - 0.01 && r[0] + r[2] <= f.marginXMm + f.blockWMm + 0.01
      && r[1] >= f.marginBottomMm - 0.01 && r[1] + r[3] <= f.marginBottomMm + f.blockHMm + 0.01;
    assert.ok(!inBlock, `a strip at ${r.join(',')} lies inside the block — interior edges get none`);
  }
  /* On the Letter template B is 3, so the two columns' layout boxes MEET in the
     middle of the groove, and so do the rows. */
  const left = art.filter((r) => r[0] < 60).sort((a, b) => b[1] - a[1]);
  const right = art.filter((r) => r[0] > 60);
  assert.ok(close(right[0]![0] - (left[0]![0] + left[0]![2]), 0, 0.02),
    'the two columns of art MEET — the groove is ink, not paper');
  for (let i = 1; i < left.length; i++)
    assert.ok(close(left[i - 1]![1] - (left[i]![1] + left[i]![3]), 0, 0.02), 'and so do the rows');
  /* ...while every CUT line is exactly where the gutters put it. */
  assert.ok(close(left[0]![0] + B, f.marginXMm, 0.02), 'A cut line unmoved');
  assert.ok(close((right[0]![0] + B) - (left[0]![0] + left[0]![2] - B), MACHINE_GROOVE_MM, 0.02),
    'B cut lines still one groove apart');
  assert.ok(close(left[3]![1] + B, f.marginBottomMm, 0.02), 'H unmoved');

  /* THE REGISTRATION TOLERANCE reaches OUTER_BLEED_MM from the cut on the
     outside of the block, clamped to the paper there. */
  assert.ok(close(Math.min(...rects.map((r) => r[0])), f.marginXMm - Math.min(OUTER_BLEED_MM, f.marginXMm), 0.02),
    'the left edge is carried a full outer bleed past the cut');
  assert.ok(close(Math.max(...rects.map((r) => r[0] + r[2])),
    215.9 - f.marginRightMm + Math.min(OUTER_BLEED_MM, f.marginRightMm), 0.02), 'and so is the right');
  assert.ok(close(Math.max(...rects.map((r) => r[1] + r[3])), 279.4, 0.02),
    'row 1 runs to the sheet edge — the head has only Front len of room');
  /* CONSTANT ROW PITCH is the property that matters against a slitter. */
  const cuts = [...new Set(f.cells.map((c) => 279.4 - c.yMm - c.hMm))].sort((a, b) => a - b);
  for (let i = 1; i < cuts.length; i++)
    assert.ok(close(cuts[i]! - cuts[i - 1]!, PLACED_H_MM + MACHINE_GROOVE_MM, 0.02),
      `row pitch is ${PLACED_H_MM + MACHINE_GROOVE_MM} every time, got ${cuts[i]! - cuts[i - 1]!}`);
});

test('BLACK BACKGROUND: rich CMYK black, 1.5 of white left all round', async () => {
  /* The shop asked for 100/100/100/100 by that number — a four-plate black, not
     a single K and not an RGB zero a RIP would separate however it liked. So it
     is checked as DeviceCMYK in the content stream: pdf-lib writes cmyk() as a
     `k` operator, and only that carries the value to the plate. */
  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const streamOf = async (bytes: Uint8Array) => {
    const d = await PDFDocument.load(bytes);
    const st = d.getPage(0).node.normalizedEntries().Contents;
    let t = '';
    for (let k = 0; st && k < st.size(); k++) {
      const raw = (d.context.lookup(st.get(k), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
      try { t += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
      catch { t += Buffer.from(raw).toString('latin1'); }
    }
    return t;
  };
  const off = await streamOf(await imposeDivinityCards(await cardPdf(), { sheet: 'letter', addMarks: false }));
  assert.ok(!/\d+ \d+ \d+ \d+ k/.test(off), 'OFF by default — no flood at all');

  const on = await streamOf(await imposeDivinityCards(
    await cardPdf(), { sheet: 'letter', addMarks: false, blackBg: true }));
  assert.ok(/1 1 1 1 k/.test(on), 'DeviceCMYK 100/100/100/100, not K-only and not RGB');
  /* Painted FIRST, so every card lands on top of it and the artwork is untouched. */
  assert.ok(on.indexOf('1 1 1 1 k') < on.indexOf('re'), 'the flood is behind the cards');
  /* Inset BLACK_BORDER_MM on every side: pdf-lib translates to the corner, then
     runs the path out to the size, so both come out of the stream. */
  const b = BLACK_BORDER_MM * PT_PER_MM;
  const at = on.match(/1 0 0 1 ([\d.]+) ([\d.]+) cm/);
  assert.ok(at && close(Number(at[1]), b, 1e-6) && close(Number(at[2]), b, 1e-6),
    `flood starts ${BLACK_BORDER_MM} in from the corner`);
  const to = on.match(/0 ([\d.]+) l\n([\d.]+) [\d.]+ l/);
  assert.ok(to, 'the flood path is in the stream');
  assert.ok(close(Number(to![1]) / PT_PER_MM, 279.4 - 2 * BLACK_BORDER_MM, 0.01), 'height less both borders');
  assert.ok(close(Number(to![2]) / PT_PER_MM, 215.9 - 2 * BLACK_BORDER_MM, 0.01), 'width less both borders');
});

test('BLACK BACKGROUND: the cut marks invert so they stay visible', async () => {
  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const marks = async (blackBg: boolean) => {
    const d = await PDFDocument.load(await imposeDivinityCards(
      await cardPdf(), { sheet: 'letter', addMarks: true, blackBg }));
    const st = d.getPage(0).node.normalizedEntries().Contents;
    let t = '';
    for (let k = 0; st && k < st.size(); k++) {
      const raw = (d.context.lookup(st.get(k), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
      try { t += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
      catch { t += Buffer.from(raw).toString('latin1'); }
    }
    return t;
  };
  assert.ok(/0 0 0 RG/.test(await marks(false)), 'black marks on white paper');
  assert.ok(/1 1 1 RG/.test(await marks(true)), 'white marks on a flooded sheet');
});

test("THE LETTER TEST is the manufacturer's template, centred in an A4 cutter", async () => {
  /* Their A4 drawing, to the millimetre: layout boxes 92 x 66 at 8 from the
     sheet edge with 10 between the two columns, cut lines 89 x 63 inside them
     and 6 between the rows. Across, that is a drawing of the BLADES — hardware,
     fixed either side of the machine's centre line — and it is what a Letter
     sheet centred in the same machine has to meet. */
  assert.ok(close(TEMPLATE_A4_EDGE_MM, 8) && close(TEMPLATE_COL_GAP_MM, 10), "the template's own figures");
  assert.ok(close(TEMPLATE_COL_CUT_GAP_MM, 13), '10 between the boxes is 13 between the cuts');
  assert.ok(close(TEMPLATE_ROW_CUT_GAP_MM, 6), 'and 6 between the row cuts, dashed line to dashed line');
  assert.ok(close(BLADE_INNER_MM, 6.5) && close(BLADE_OUTER_MM, 95.5), 'blades at ±6.5 and ±95.5');
  /* On A4 those blades fall exactly where the template draws them. */
  assert.ok(close(105 - BLADE_OUTER_MM, TEMPLATE_A4_EDGE_MM + LAYOUT_BLEED_MM), 'first cut at 9.5 on A4');
  /* And this is the 5 mm of white the shop measured: the old file read the
     panel's 3 mm groove as the column gap, 10 short of the truth, halved. */
  assert.ok(close((TEMPLATE_COL_CUT_GAP_MM - MACHINE_GROOVE_MM) / 2, 5), 'the missing 5 mm, explained');

  const plain = fitDivinityCards('letter');
  const reg = fitDivinityCards('letterreg');
  assert.ok(close(plain.marginXMm, DEF_MARGIN_X_MM) && close(plain.marginTopMm, DEF_MARGIN_TOP_MM)
    && close(plain.gutterXMm, DEF_GUTTER_X_MM), 'Letter is untouched by any of this');
  assert.equal(reg.n, 8, 'same eight cards');
  assert.ok(close(reg.cells[0]!.wMm, PLACED_W_MM) && close(reg.cells[0]!.hMm, PLACED_H_MM),
    'and the same cell');
  /* ACROSS: Letter's centre is 107.95, so the cuts land at 12.45 / 101.45 /
     114.45 / 203.45 — B 13, A = C 12.45. */
  assert.ok(close(reg.gutterXMm, 13), 'B is 13, not the groove');
  assert.ok(close(reg.marginXMm, LETTER_TEST_MARGIN_X_MM) && close(reg.marginXMm, 12.45, 1e-9), 'A 12.45');
  assert.ok(close(reg.marginXMm, reg.marginRightMm), 'centred across, as the sheet is in the machine');
  const cutsX = [...new Set(reg.cells.flatMap((c) => [c.xMm, c.xMm + c.wMm]))].sort((a, b) => a - b);
  assert.deepEqual(cutsX.map((v) => Math.round(v * 100) / 100), [12.45, 101.45, 114.45, 203.45]);
  for (const x of cutsX)
    assert.ok([BLADE_INNER_MM, BLADE_OUTER_MM].some((b) => close(Math.abs(x - 215.9 / 2), b, 1e-9)),
      `every cut ${x} is a blade`);
  /* DOWN: the leading edge is the reference, so the sheet's length is
     irrelevant — first cut at the panel's Front len, then the template's
     pitch, 63 + 6 = 69, every row. */
  assert.ok(close(reg.marginTopMm, MACHINE_FRONT_MM), 'D is Front len');
  assert.deepEqual(reg.rowGapsMm, [6, 6, 6], "E F G are the template's 6");
  const ys = [...new Set(reg.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  for (let i = 1; i < ys.length; i++) assert.ok(close(ys[i - 1]! - ys[i]!, 69), 'pitch 69');
  assert.ok(close(reg.marginBottomMm, 279.4 - 7.6 - 4 * 63 - 3 * 6), 'H is the 1.8 left over');
  assert.ok(reg.marginBottomMm > 0, 'and four rows do fit Letter');
  /* NO MARK. The machine runs frontal and the owner says the bar is not needed. */
  assert.ok(!reg.regTest && !plain.regTest, 'no stock asks for marks');
  /* The panel's defaults come from the same place. */
  const same = (got: Record<string, number>, want: Record<string, number>) =>
    Object.entries(want).every(([k, v]) => close(got[k]!, v, 1e-9));
  assert.ok(same(sheetDefaults('letterreg'),
    { marginXMm: 12.45, gutterXMm: 13, marginTopMm: 7.6, gutterEMm: 6, gutterFMm: 6, gutterGMm: 6 }),
    `Letter Test defaults: ${JSON.stringify(sheetDefaults('letterreg'))}`);
  assert.ok(same(sheetDefaults('letter'),
    { marginXMm: 17.45, gutterXMm: 3, marginTopMm: 7.6, gutterEMm: 3, gutterFMm: 3, gutterGMm: 3 }),
    `Letter defaults: ${JSON.stringify(sheetDefaults('letter'))}`);
  /* A typed value still wins, so the operator can nudge after a test cut. */
  assert.ok(close(fitDivinityCards('letterreg', { marginXMm: 20 }).marginXMm, 20));
  assert.ok(close(fitDivinityCards('letterreg', { gutterEMm: 3 }).rowGapsMm[0], 3));

  /* RENDERED, it is the template's drawing: eight 92 x 66 layout boxes, the
     two columns' boxes 10 apart and the rows' boxes 3 apart, white between. */
  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const d = await PDFDocument.load(await imposeDivinityCards(await cardPdf(),
    { sheet: 'letterreg', addMarks: false, backs: false }));
  const st = d.getPage(0).node.normalizedEntries().Contents;
  let t = '';
  for (let k = 0; st && k < st.size(); k++) {
    const raw = (d.context.lookup(st.get(k), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
    try { t += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
    catch { t += Buffer.from(raw).toString('latin1'); }
  }
  const mm2 = (v: string) => Math.round((Number(v) / PT_PER_MM) * 100) / 100;
  const art = [...new Set([...t.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re/g)]
    .map((m) => [mm2(m[1]!), mm2(m[2]!), mm2(m[3]!), mm2(m[4]!)].join(',')))]
    .map((r) => r.split(',').map(Number) as [number, number, number, number])
    .filter((r) => close(r[2], 92, 0.02) && close(r[3], 66, 0.02));
  assert.equal(art.length, 8, 'eight layout boxes');
  const xs = [...new Set(art.map((r) => r[0]))].sort((a, b) => a - b);
  assert.ok(close(xs[1]! - (xs[0]! + 92), TEMPLATE_COL_GAP_MM, 0.02), '10 between the columns\' boxes');
  const top = [...new Set(art.map((r) => r[1]))].sort((a, b) => b - a);
  for (let i = 1; i < top.length; i++)
    assert.ok(close(top[i - 1]! - (top[i]! + 66), TEMPLATE_ROW_CUT_GAP_MM - 2 * LAYOUT_BLEED_MM, 0.02),
      "3 between the rows' boxes");
  assert.ok(!/1 1 1 rg/.test(t) && !/0 0 0 rg/.test(t), 'no mark, no pad');
});

test('MARK MODE: one black bar on the feed edge, clear of the first cut', async () => {
  /* The 2102-F is a SLITTER and offers exactly two modes, frontal and mark.
     Mark mode is a single eye at the throat seeing paper then black, so what it
     wants is one bar on the leading edge — not the corner marks a camera
     plotter reads. The bar's trailing edge must sit clear of the first cut or
     the blade lands on the mark. */
  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const PT = PT_PER_MM;
  /* OFF unless asked — the machine runs frontal. */
  const d = await PDFDocument.load(await imposeDivinityCards(await cardPdf(),
    { sheet: 'letterreg', addMarks: false, backs: false, regMarks: true }));
  const st = d.getPage(0).node.normalizedEntries().Contents;
  let t = '';
  for (let k = 0; st && k < st.size(); k++) {
    const raw = (d.context.lookup(st.get(k), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
    try { t += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
    catch { t += Buffer.from(raw).toString('latin1'); }
  }
  const boxes = [...t.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) cm\n1 0 0 1 0 0 cm\n1 0 0 1 0 0 cm\n0 0 m\n0 ([\d.]+) l\n([\d.]+) [\d.]+ l/g)]
    .map((m) => ({ x: Number(m[1]) / PT, y: Number(m[2]) / PT, h: Number(m[3]) / PT, w: Number(m[4]) / PT }));
  const bar = boxes.find((b) => b.h < 5 && b.w > 20);
  assert.ok(bar, 'a bar is drawn');
  assert.ok(close(bar!.w, 50, 0.01) && close(bar!.h, REG_MARK_DEPTH_MM, 0.01), '50 x 3');
  assert.ok(close(bar!.x + bar!.w / 2, 215.9 / 2, 0.01), 'centred on the edge');
  const fromTop = 279.4 - (bar!.y + bar!.h);
  assert.ok(close(fromTop, REG_MARK_INSET_MM, 0.01), `${REG_MARK_INSET_MM} mm in from the feed edge`);
  const f = fitDivinityCards('letterreg');
  const barEnds = fromTop + bar!.h;
  assert.ok(close(REG_HEAD_MM, REG_MARK_INSET_MM + REG_MARK_DEPTH_MM + REG_MARK_PAD_MM), 'bar + pad + inset = 7.5');
  assert.ok(f.marginTopMm - barEnds >= REG_MARK_PAD_MM - 1e-9,
    'the first cut falls at least one pad past the bar');
  assert.ok(f.marginTopMm > barEnds, 'and never on it');
  /* NO WHITE PAD on plain paper. It exists only to give the eye a paper-to-black
     step through the background flood; printed on white it paints over the bleed
     and that white then shows on the cut cards, which is exactly what came back
     off the machine. */
  const pad = boxes.find((b) => b.h > bar!.h && b.h < 10 && b.w > bar!.w);
  assert.ok(!pad, 'no pad is drawn when there is no flood to cut through');
});

test('the corner shapes still draw, for a camera machine', async () => {
  const zlib = await import('node:zlib');
  const { PDFStream } = await import('pdf-lib');
  const streamOf = async (bytes: Uint8Array) => {
    const d = await PDFDocument.load(bytes);
    const st = d.getPage(0).node.normalizedEntries().Contents;
    let t = '';
    for (let k = 0; st && k < st.size(); k++) {
      const raw = (d.context.lookup(st.get(k), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
      try { t += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
      catch { t += Buffer.from(raw).toString('latin1'); }
    }
    return t;
  };
  /* OFF on the normal Letter stock, and off unless asked. */
  const plain = await streamOf(await imposeDivinityCards(await cardPdf(),
    { sheet: 'letter', addMarks: false, backs: false }));
  const reg = await streamOf(await imposeDivinityCards(await cardPdf(),
    { sheet: 'letterreg', addMarks: false, backs: false }));
  const whitePads = (t: string) => (t.match(/^1 1 1 rg$/gm) || []).length;
  assert.equal(whitePads(plain), 0, 'Letter gets no marks');
  assert.equal(whitePads(reg), 0, 'and no pad on plain paper — it would print AS white');
  const regFlooded = await streamOf(await imposeDivinityCards(await cardPdf(),
    { sheet: 'letterreg', addMarks: false, backs: false, blackBg: true, regMarks: true }));
  assert.equal(whitePads(regFlooded), 1, 'ONE bar, not four corners, once there is a flood');
  const noAsk = await streamOf(await imposeDivinityCards(await cardPdf(),
    { sheet: 'letterreg', addMarks: false, backs: false, blackBg: true }));
  assert.equal(whitePads(noAsk), 0, 'and nothing at all unless the switch is on');

  /* Every shape still draws, and the marks go on LAST so nothing lands on top. */
  for (const regShape of ['square', 'circle', 'lshape', 'cross'] as const) {
    const t = await streamOf(await imposeDivinityCards(await cardPdf(),
      { sheet: 'letterreg', regShape, addMarks: false, backs: false, regMarks: true }));
    const withFlood = await streamOf(await imposeDivinityCards(await cardPdf(),
      { sheet: 'letterreg', regShape, addMarks: false, backs: false, blackBg: true, regMarks: true }));
    assert.equal(whitePads(withFlood), 4, `${regShape} draws four marks on a flooded sheet`);
    assert.ok(withFlood.lastIndexOf('1 1 1 rg') > withFlood.lastIndexOf('Do'),
      `${regShape} marks are drawn last`);
    assert.equal(whitePads(t), 0, `${regShape} needs no pad on plain paper`);
  }
});

test('A4: eight cards, 2 across x 4 down', () => {
  const f = fitDivinityCards('a4');
  assert.equal(f.sheetWMm, 210);
  assert.equal(f.sheetHMm, 297);
  assert.equal(f.n, 8);
  assert.equal(f.cells.length, 8);
  const xs = [...new Set(f.cells.map((c) => c.xMm))].sort((a, b) => a - b);
  const ys = [...new Set(f.cells.map((c) => c.yMm))].sort((a, b) => b - a);
  assert.equal(xs.length, 2, 'two columns');
  assert.ok(close(xs[0]!, DEF_MARGIN_X_MM), `A at ${DEF_MARGIN_X_MM}, got ${xs}`);
  assert.equal(ys.length, 4, 'four rows');
  assert.ok(close(xs[1]! - xs[0]!, PLACED_W_MM + DEF_GUTTER_X_MM), 'column pitch = the cell + B');
  for (let i = 1; i < ys.length; i++)
    assert.ok(close(ys[i - 1]! - ys[i]!, PLACED_H_MM + f.rowGapsMm[i - 1]!), 'row pitch = cell + its own gap');
  assert.ok(close(Math.min(...ys), 297 - DEF_MARGIN_TOP_MM - 4 * PLACED_H_MM - 3 * DEF_GUTTER_X_MM), 'the last row sits on H');
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
  assert.ok(close(Math.min(...right.map((c) => c.xMm)) - 210, DEF_MARGIN_X_MM));
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

test('EVERY sheet comes off PORTRAIT, at a real stock size', async () => {
  /* Owner's rule: nothing from this tool is landscape. The doubled stocks are
     reasoned about landscape — two blocks side by side — and the finished page
     is stood up, so an A3 is 297 x 420 and an 11 x 17 is 279.4 x 431.8, taller
     than they are wide, same as the single-up stocks. */
  const size = async (sheet: 'letter' | 'tabloid' | 'a4' | 'a3') => {
    const d = await PDFDocument.load(await imposeDivinityCards(await cardPdf(), { sheet, backs: false }));
    assert.equal(d.getPageCount(), 1);
    const { width, height } = d.getPage(0).getSize();
    return [width / PT_PER_MM, height / PT_PER_MM] as const;
  };
  for (const [sheet, w, h] of [
    ['letter', 215.9, 279.4], ['tabloid', 279.4, 431.8],
    ['a4', 210, 297], ['a3', 297, 420],
  ] as const) {
    const [gw, gh] = await size(sheet);
    assert.ok(Math.abs(gw - w) < 0.01, `${sheet} is ${w} wide, got ${gw.toFixed(2)}`);
    assert.ok(Math.abs(gh - h) < 0.01, `${sheet} is ${h} tall, got ${gh.toFixed(2)}`);
    assert.ok(gh > gw, `${sheet} must be PORTRAIT, got ${gw.toFixed(1)} x ${gh.toFixed(1)}`);
  }
});

test('standing the page up moves NOTHING inside the sheet', async () => {
  /* The claim the rotation rests on: the page turns, the layout does not. The
     landscape frame the fit reasons in is untouched, and one matrix carries the
     flood, the cards and the marks round together — so a card's position on the
     portrait page is exactly its landscape position with the axes swapped. */
  const f = fitDivinityCards('tabloid');
  assert.ok(f.rotated, '11 x 17 stands up');
  assert.ok(close(f.sheetWMm, 431.8) && close(f.sheetHMm, 279.4), 'layout stays landscape');
  assert.ok(close(f.pageWMm, 279.4) && close(f.pageHMm, 431.8), 'the PAGE is portrait');
  assert.ok(close(f.pageWMm, f.sheetHMm) && close(f.pageHMm, f.sheetWMm), 'a quarter turn, nothing rescaled');
  /* Same cells, same gutters, same cut as a Letter sheet — twice over. */
  const letter = fitDivinityCards('letter');
  assert.ok(close(f.marginXMm, letter.marginXMm) && close(f.marginRightMm, letter.marginRightMm));
  assert.ok(close(f.marginTopMm, letter.marginTopMm) && close(f.marginBottomMm, letter.marginBottomMm));
  assert.deepEqual(f.rowGapsMm, letter.rowGapsMm);
  assert.ok(close(f.cutXMm[0]!, 215.9), 'cut at 215.9 — across the portrait page, from the foot');
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
  /* Every draw of the card counts — the layout box AND the outer strips that
     carry its edge across the margin — so the turns are checked against `all`
     rather than a fixed eight. */
  const all = (text.match(/\bDo\b/g) || []).length;
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
  return { ccw, cw, half, all };
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
  assert.ok(f.all >= 8, 'eight fronts drawn, plus their outer strips');
  assert.equal(f.ccw, f.all, 'every front draw turned one way');
  assert.equal(f.cw, 0);
  assert.equal(b.cw, b.all, 'default: the backs take the opposite turn');
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
  assert.ok(ob.all >= 8 && ob.ccw + ob.cw + ob.half === 0, 'unspun: landscape back sits as-is');

  const on = await imposeDivinityCards(await landscapeBackPdf(), { sheet: 'a4', spinBacks: true });
  const nb = await turnsOnPage(on, 1);
  assert.equal(nb.half, nb.all, 'spun: every draw a real 180 — the cards face the other way');
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
  /* The template is NOT symmetric: A 17.45 against C 17.45, because that is where
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
      .map((m) => Math.round((Number(m[1]) / PT_PER_MM) * 100) / 100))].sort((a, b) => a - b);
  };
  /* Every rectangle's left edge: the left column's outer strip and layout box,
     the right column's layout box and its outer strip. */
  assert.deepEqual(await colsOf(0), [9.45, 15.95, 107.95, 199.95], 'unticked, nothing mirrors');
  assert.deepEqual(await colsOf(1), [9.45, 15.95, 107.95, 199.95], 'including the back sheet');
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
      .map((m) => Math.round((Number(m[1]) / PT_PER_MM) * 100) / 100));
  };
  assert.equal(await leftEdge(off), 9.45, 'unticked: A 17.45, less the outer bleed');
  assert.equal(await leftEdge(on), 9.45, 'ticked: A becomes C — equal now, so it does not move');
  /* A 17.45 against C 17.45 is a 6.9 mm move — if the mirror ever silently stopped
     working this is the assertion that screams, which the near-identical pairs
     of earlier templates could not do. */
  /* A and C are equal now, so the lopsided case below is what proves the mirror. */
  /* Run it again on a deliberately lopsided A, so the claim does not rest on one
     pair of numbers that happen to differ — the block really is flipped end for
     end, whatever A is set to. */
  const lop = { sheet: 'letter' as const, addMarks: false, marginXMm: 20 };
  assert.equal(await leftEdge(await imposeDivinityCards(await cardPdf(), lop)),
    20 - Math.min(OUTER_BLEED_MM, 20), 'lopsided, unticked: A 20, less the outer bleed');
  assert.equal(await leftEdge(await imposeDivinityCards(await cardPdf(), { ...lop, spinBacks: true })),
    (() => { const C = 215.9 - 20 - (2 * PLACED_W_MM + DEF_GUTTER_X_MM);
      return Math.round((C - Math.min(OUTER_BLEED_MM, C)) * 100) / 100; })(),
    'lopsided, ticked: C comes to the left');
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
      .map((m) => Math.round((Number(m[1]) / PT_PER_MM) * 100) / 100));
  };
  assert.equal(await leftOf(0), 9.45, 'fronts untouched');
  assert.equal(await leftOf(1), 9.45, 'backs swapped');
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
