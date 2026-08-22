import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  saddlePageSlots, saddleSheets, saddleSheetPages, saddleCreepIn, fitSaddleBooklet,
} from '../src/lib/imposition-toolkit/fit/saddle-booklet.ts';
import { perfectItemAt, perfectSheets, fitPerfectBound } from '../src/lib/imposition-toolkit/fit/perfect-bound.ts';
import { fitCalendar } from '../src/lib/imposition-toolkit/fit/calendars.ts';

test('saddle: pages pad to a multiple of four, never dropped', () => {
  assert.equal(saddlePageSlots(1), 4);
  assert.equal(saddlePageSlots(4), 4);
  assert.equal(saddlePageSlots(5), 8);
  assert.equal(saddlePageSlots(6), 8, '6 pages need 8 slots — 2 blanks, not 2 pages binned');
  assert.equal(saddlePageSlots(32), 32);
  for (const n of [1, 2, 3, 7, 13, 29, 100]) {
    assert.ok(saddlePageSlots(n) >= n, `${n}: slots must never be fewer than the pages`);
    assert.equal(saddlePageSlots(n) % 4, 0, `${n}: saddle work comes in fours`);
  }
});

test('saddle: sheet count follows the slots', () => {
  assert.equal(saddleSheets(4), 1);
  assert.equal(saddleSheets(8), 2);
  assert.equal(saddleSheets(6), 2);
  assert.equal(saddleSheets(32), 8);
});

test('saddle: every page appears exactly once, in fold order', () => {
  for (const pages of [4, 8, 12, 16, 32]) {
    const slots = saddlePageSlots(pages);
    const seen = new Map<number, number>();
    for (let s = 0; s < saddleSheets(pages); s++) {
      for (const p of saddleSheetPages(s, pages)) {
        assert.ok(p >= 1 && p <= slots, `${pages}pp: page ${p} is outside 1..${slots}`);
        seen.set(p, (seen.get(p) ?? 0) + 1);
      }
    }
    assert.equal(seen.size, slots, `${pages}pp: ${seen.size} distinct pages, expected ${slots}`);
    for (const [p, n] of seen) assert.equal(n, 1, `${pages}pp: page ${p} placed ${n} times`);
  }
});

test('saddle: the outer sheet carries the last page beside the first', () => {
  // 8 pages: outer sheet is 8|1 on the front, 2|7 on the back. This is the
  // check that catches a booklet that counts right and reads as nonsense.
  assert.deepEqual(saddleSheetPages(0, 8), [8, 1, 2, 7]);
  assert.deepEqual(saddleSheetPages(1, 8), [6, 3, 4, 5]);
});

test('saddle: creep grows inward from an unmoved outer sheet', () => {
  const total = 4, per = 0.007;
  assert.equal(saddleCreepIn(0, total, per), 0, 'the outermost sheet does not move');
  assert.ok(saddleCreepIn(3, total, per) > saddleCreepIn(1, total, per), 'inner sheets creep more');
  assert.equal(saddleCreepIn(3, total, per), 3 * per);
});

test('saddle: 2 pages per side whatever the trim', () => {
  const f = fitSaddleBooklet({ sheetWIn: 16.54, sheetHIn: 11.69 }, 6);
  assert.equal(f.n, 2);
  assert.equal(f.cellWIn, 16.54 / 2);
  assert.match(f.why, /8 slots/);
});

test('perfect bound: cut-and-stack order, not sequential', () => {
  // 3 sheets, 2 cells: cutting into 2 piles and stacking must give 1..6.
  const numSheets = 3, cells = 2;
  const order: number[] = [];
  for (let cell = 0; cell < cells; cell++) {
    for (let s = 0; s < numSheets; s++) order.push(perfectItemAt(cell, s, numSheets));
  }
  assert.deepEqual(order, [0, 1, 2, 3, 4, 5], 'stacking pile 1 on pile 0 reads in order');
  // Sequential imposition would be cell*1+sheet*cells — the wrong book.
  assert.notDeepEqual(
    [perfectItemAt(0, 1, numSheets), perfectItemAt(1, 1, numSheets)], [2, 3],
    'this must NOT be sequential fill',
  );
});

test('perfect bound: every page lands exactly once across the sheets', () => {
  for (const [numSheets, cells] of [[1, 2], [4, 2], [3, 4], [7, 6]] as const) {
    const seen = new Set<number>();
    for (let cell = 0; cell < cells; cell++) {
      for (let s = 0; s < numSheets; s++) {
        const i = perfectItemAt(cell, s, numSheets);
        assert.ok(!seen.has(i), `${numSheets}x${cells}: page ${i} placed twice`);
        seen.add(i);
      }
    }
    assert.equal(seen.size, numSheets * cells);
  }
});

test('perfect bound: duplex halves the sheets — page 2 backs page 1', () => {
  assert.equal(perfectSheets(4, 1), 2, '4 pages 1-up duplex = 2 sheets');
  assert.equal(perfectSheets(8, 2), 2, '8 pages 2-up duplex = 2 sheets');
  assert.equal(perfectSheets(1, 2), 1);
  assert.equal(perfectSheets(200, 2), 50);
});

test('perfect bound: 6×9 trim goes 2-up on 11×17', () => {
  const f = fitPerfectBound({ sheetWIn: 11, sheetHIn: 17, addMarks: true, markOffIn: 0.125, markLenIn: 0.43 });
  assert.equal(f.n, 2, f.why);
  assert.match(f.why, /page 2 backs page 1/);
});

test('calendar: half-sheet gives two, and says the back is turned', () => {
  assert.equal(fitCalendar({ sheetWIn: 11, sheetHIn: 17 }, false).n, 1);
  const half = fitCalendar({ sheetWIn: 11, sheetHIn: 17 }, true);
  assert.equal(half.n, 2);
  assert.equal(half.cellHIn, 8.5);
  assert.match(half.why, /180/);
});
