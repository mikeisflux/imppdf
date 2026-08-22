import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitIndexCards } from '../src/lib/imposition-toolkit/fit/index-cards.ts';

// The tool's defaults. Marks ON — that is the case that was wrong.
const marks = { addMarks: true, markOffIn: 0.125, markLenIn: 0.43 };
const defaults = { marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125, ...marks };

test('index cards: 3×5 on 17×11 tabloid gangs 10, not 4', () => {
  const f = fitIndexCards({ sheetWIn: 17, sheetHIn: 11, ...defaults });
  // This shipped as 4 (4×1): the shared grid was reserving markOff+markLen as
  // a MARGIN and again as every GUTTER, which ate a column and a whole row.
  assert.equal(f.n, 10, f.why);
  assert.equal(f.cols, 5);
  assert.equal(f.rows, 2);
  assert.ok(f.fits);
});

test('index cards: the same 10 on 11×17 portrait, the grid turned round', () => {
  const f = fitIndexCards({ sheetWIn: 11, sheetHIn: 17, ...defaults });
  assert.equal(f.n, 10, f.why);
  assert.equal(f.cols, 2);
  assert.equal(f.rows, 5);
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
  assert.equal(withMarks.gutterXIn, 0.25);
  assert.ok(withMarks.marginIn < 0.5, `margin stayed sane (${withMarks.marginIn})`);
});

test('index cards: a piece too big for the sheet reports it rather than lying', () => {
  const f = fitIndexCards({ sheetWIn: 4, sheetHIn: 4, ...defaults });
  assert.equal(f.fits, false);
  assert.match(f.why, /does not fit/);
});
