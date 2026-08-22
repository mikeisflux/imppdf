import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitArtPrints, ART_PRINT_SIZES } from '../src/lib/imposition-toolkit/fit/art-prints.ts';

const sheet = { sheetWIn: 12, sheetHIn: 18, marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125,
  addMarks: true, markOffIn: 0.125, markLenIn: 0.43 };

test('art prints: comic 6.88×10.5 goes 2-up on 12×18', () => {
  const c = ART_PRINT_SIZES.comic;
  const f = fitArtPrints(sheet, c.wIn, c.hIn);
  assert.equal(f.n, 2, f.why);
  assert.ok(f.fits);
});

test('art prints: 11×17 is 1-up on 12×18', () => {
  const e = ART_PRINT_SIZES.eleven17;
  const f = fitArtPrints(sheet, e.wIn, e.hIn);
  assert.equal(f.n, 1, f.why);
  assert.ok(f.fits);
});

test('art prints: the size already includes the bleed, and says so', () => {
  const f = fitArtPrints(sheet, ART_PRINT_SIZES.comic.wIn, ART_PRINT_SIZES.comic.hIn);
  assert.match(f.why, /includes 0\.125" bleed/);
});
