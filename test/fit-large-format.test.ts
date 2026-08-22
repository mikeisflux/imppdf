import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitPoster, POSTER_W_IN, POSTER_H_IN } from '../src/lib/imposition-toolkit/fit/posters.ts';
import { fitBanner } from '../src/lib/imposition-toolkit/fit/banners.ts';
import { fitRollBanner } from '../src/lib/imposition-toolkit/fit/roll-banners.ts';
import { fitFeatherFlag } from '../src/lib/imposition-toolkit/fit/feather-flags.ts';
import { fitYardSign } from '../src/lib/imposition-toolkit/fit/yard-signs.ts';

const LARGE = [
  ['poster', fitPoster, 24, 36], ['banner', fitBanner, 24, 72],
  ['rollbanner', fitRollBanner, 33, 80], ['featherflag', fitFeatherFlag, 30, 100],
  ['yardsign', fitYardSign, 24, 18],
] as const;

test('large format: always exactly one piece per sheet', () => {
  for (const [id, fit, w, h] of LARGE) {
    const f = fit({ sheetWIn: w, sheetHIn: h });
    assert.equal(f.n, 1, `${id}: ${f.why}`);
    assert.ok(f.fits, id);
  }
});

test('large format: never ganged even when several would fit', () => {
  // A yard sign is 24×18; a 48×36 sheet holds four. It must still be one —
  // wide-format prints to the piece, the media IS the sign.
  const f = fitYardSign({ sheetWIn: 48, sheetHIn: 36 });
  assert.equal(f.n, 1, f.why);
});

test('large format: no cut marks, so no margin is stolen', () => {
  const f = fitPoster({ sheetWIn: POSTER_W_IN, sheetHIn: POSTER_H_IN });
  assert.equal(f.marginIn, 0, 'a poster prints edge to edge');
  assert.match(f.why, /no cut marks/);
});

test('large format: never turned — a flag on its side is a ruined flag', () => {
  const f = fitFeatherFlag({ sheetWIn: 30, sheetHIn: 100 });
  assert.equal(f.rotated, false);
  assert.equal(f.cellWIn, 30);
  assert.equal(f.cellHIn, 100);
});
