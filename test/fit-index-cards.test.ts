import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitIndexCards, INDEX_CARD_W_IN, INDEX_CARD_H_IN } from '../src/lib/imposition-toolkit/fit/index-cards.ts';

// The tool's defaults. Marks ON — that is the case that was wrong.
const marks = { addMarks: true, markOffIn: 0.125, markLenIn: 0.43 };
// Sheet and marks only — the tool supplies its own margin, gutter and whether
// it may be turned. Passing them here would test the test, not the tool.
const defaults = { ...marks };

test('index cards: 17×11 gangs 10, not the 4 it shipped with', () => {
  const f = fitIndexCards({ sheetWIn: 17, sheetHIn: 11, ...defaults });
  // This shipped as 4 (4×1): the shared grid was reserving markOff+markLen as
  // a MARGIN and again as every GUTTER, which ate a column and a whole row.
  assert.equal(f.n, 10, f.why);
  assert.equal(f.cols, 5);
  assert.equal(f.rows, 2);
  assert.ok(f.fits);
});

test('index cards: 17×11 landscape is 5 across × 2 down', () => {
  const f = fitIndexCards({ sheetWIn: 17, sheetHIn: 11, ...defaults });
  assert.equal(f.cols, 5, `3" across a 17" sheet is 5. ${f.why}`);
  assert.equal(f.rows, 2, `5" down an 11" sheet is 2`);
  assert.equal(f.n, 10, f.why);
});

test('index cards: 4 on Letter', () => {
  const f = fitIndexCards({ sheetWIn: 8.5, sheetHIn: 11, ...defaults });
  assert.equal(f.n, 4, f.why);
  assert.equal(f.cols, 2);
  assert.equal(f.rows, 2);
});

test('index cards: marks cost clearance, but nothing like a full mark length', () => {
  const bare = fitIndexCards({ sheetWIn: 17, sheetHIn: 11, marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125 });
  const withMarks = fitIndexCards({ sheetWIn: 17, sheetHIn: 11, ...defaults });
  assert.ok(withMarks.n <= bare.n, 'marks never increase the count');
  // Between two cards the marks are collinear and merge into one cut line, so
  // the gutter needs 2×offset — NOT offset+length twice over.
  // Butt-cut: the cards touch and share one cut, so the gutter stays 0.
  assert.equal(withMarks.gutterXIn, 0);
  assert.ok(withMarks.marginIn < 0.5, `margin stayed sane (${withMarks.marginIn})`);
});

test('index cards: a piece too big for the sheet reports it rather than lying', () => {
  const f = fitIndexCards({ sheetWIn: 4, sheetHIn: 4, ...defaults });
  assert.equal(f.fits, false);
  assert.match(f.why, /does not fit/);
});

test('index cards: 3 wide × 5 tall as supplied', () => {
  assert.equal(INDEX_CARD_W_IN, 3);
  assert.equal(INDEX_CARD_H_IN, 5);
});

test('index cards: 11×17 takes the better of the two layouts, and reports the turn', () => {
  const f = fitIndexCards({ sheetWIn: 11, sheetHIn: 17, ...defaults });
  /* Upright:  3 across × 3 down =  9   (11/3 = 3, 17/5 = 3)
     Turned:   2 across × 5 down = 10   (11/5 = 2, 17/3 = 5)
     Ten wins, so the card is turned — and the result must SAY so, because
     "2 × 5" of a 5"-tall card would be 6 × 25" and cannot exist. */
  assert.equal(f.n, 10, f.why);
  assert.equal(f.rotated, true, 'the turn is what gets 10');
  assert.equal(f.cellWIn, 5, 'placed 5 wide');
  assert.equal(f.cellHIn, 3, 'placed 3 tall');
  assert.match(f.why, /turned 90/, 'the turn must be stated, not implied');
  // The check that would have caught the nonsense: the grid must physically fit.
  assert.ok(f.cols * f.cellWIn + 2 * f.marginIn <= 11 + 1e-6,
    `${f.cols} × ${f.cellWIn}" + margins does not fit 11"`);
  assert.ok(f.rows * f.cellHIn + 2 * f.marginIn <= 17 + 1e-6,
    `${f.rows} × ${f.cellHIn}" + margins does not fit 17"`);
});
