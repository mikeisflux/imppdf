import { test } from 'node:test';
import assert from 'node:assert/strict';

import { fitIndexCards } from '../src/lib/imposition-toolkit/fit/index-cards.ts';
import { fitBusinessCard } from '../src/lib/imposition-toolkit/fit/business-cards.ts';
import { fitPostcard } from '../src/lib/imposition-toolkit/fit/postcards.ts';
import { fitRackCard } from '../src/lib/imposition-toolkit/fit/rack-cards.ts';
import { fitHangTag } from '../src/lib/imposition-toolkit/fit/hang-tags.ts';
import { fitLabel } from '../src/lib/imposition-toolkit/fit/labels.ts';
import { fitNameBadge } from '../src/lib/imposition-toolkit/fit/name-badges.ts';
import { fitTicket } from '../src/lib/imposition-toolkit/fit/tickets.ts';
import { fitCoupon } from '../src/lib/imposition-toolkit/fit/coupons.ts';
import { fitPlaceCard } from '../src/lib/imposition-toolkit/fit/place-cards.ts';
import { fitGreetingCard } from '../src/lib/imposition-toolkit/fit/greeting-cards.ts';
import { fitTradingCard } from '../src/lib/imposition-toolkit/fit/trading-cards.ts';
import { fitBookmark } from '../src/lib/imposition-toolkit/fit/bookmarks.ts';
import { fitFlyer } from '../src/lib/imposition-toolkit/fit/flyers.ts';
import { fitDoorHanger } from '../src/lib/imposition-toolkit/fit/door-hangers.ts';
import { fitEnvelope } from '../src/lib/imposition-toolkit/fit/envelopes.ts';
import { fitCoaster } from '../src/lib/imposition-toolkit/fit/coasters.ts';
import { fitContactCell } from '../src/lib/imposition-toolkit/fit/contact-sheets.ts';
import { fitCompSlip } from '../src/lib/imposition-toolkit/fit/comp-slips.ts';
import { cellRects } from '../src/lib/imposition-toolkit/fit/sheet-grid.ts';
import type { SheetFit, SheetSpec } from '../src/lib/imposition-toolkit/fit/types.ts';

type Calc = (spec: SheetSpec) => SheetFit;

/* `turns` says whether the tool is ALLOWED to rotate its piece. Most may:
   one more per sheet is one more, and you cut it out the same either way.
   Large format may not — a flag delivered on its side is a ruined flag. */
const TOOLS: { id: string; fit: Calc; w: number; h: number; turns?: boolean }[] = [
  { id: 'indexcard', fit: (s) => fitIndexCards(s), w: 3, h: 5 },
  { id: 'business', fit: (s) => fitBusinessCard(s), w: 3.5, h: 2 },
  { id: 'postcard', fit: (s) => fitPostcard(s), w: 6, h: 4 },
  { id: 'rackcard', fit: (s) => fitRackCard(s), w: 4, h: 9 },
  { id: 'hangtag', fit: (s) => fitHangTag(s), w: 2.5, h: 4 },
  { id: 'label', fit: (s) => fitLabel(s), w: 4, h: 3.33 },
  { id: 'namebadge', fit: (s) => fitNameBadge(s), w: 3.5, h: 2.25 },
  { id: 'ticket', fit: (s) => fitTicket(s), w: 4, h: 2.5 },
  { id: 'coupon', fit: (s) => fitCoupon(s), w: 3.5, h: 2 },
  { id: 'placecard', fit: (s) => fitPlaceCard(s), w: 3.5, h: 2 },
  { id: 'greeting', fit: (s) => fitGreetingCard(s), w: 5, h: 7 },
  { id: 'trading', fit: (s) => fitTradingCard(s), w: 2.5, h: 3.5 },
  { id: 'bookmark', fit: (s) => fitBookmark(s), w: 2, h: 6 },
  { id: 'flyer', fit: (s) => fitFlyer(s), w: 8.5, h: 11 },
  { id: 'doorhanger', fit: (s) => fitDoorHanger(s), w: 3.875, h: 8.75 },
  { id: 'envelope', fit: (s) => fitEnvelope(s), w: 9.5, h: 4.125 },
  { id: 'coaster', fit: (s) => fitCoaster(s), w: 4, h: 4 },
  { id: 'contact', fit: (s) => fitContactCell(s), w: 3.75, h: 2.4 },
  { id: 'compslip', fit: (s) => fitCompSlip(s), w: 8.27, h: 3.9 },
];

const SHEETS: [number, number, string][] = [
  [8.5, 11, 'Letter'], [11, 8.5, 'Letter landscape'],
  [8.5, 14, 'Legal'], [11, 17, 'Tabloid'], [17, 11, 'Tabloid landscape'],
  [12, 18, '12×18'], [8.27, 11.69, 'A4'], [11.69, 16.54, 'A3'], [13, 19, '13×19'],
];

// Sheet and marks only — each tool supplies its own margin/gutter/butt-cut.
const spec = (w: number, h: number): SheetSpec => ({
  sheetWIn: w, sheetHIn: h, addMarks: true, markOffIn: 0.125, markLenIn: 0.43,
});

/* Independent check: count by walking the sheet, not by the same division the
   calculator uses. If both are wrong they have to be wrong the same way, which
   a division bug and a walk are unlikely to be. */
function bruteForceMax(usable: number, cell: number, gutter: number): number {
  let n = 0;
  for (let used = 0; ;) {
    const need = n === 0 ? cell : used + gutter + cell;
    if (need > usable + 1e-6) break;
    used = need; n++;
  }
  return n;
}

for (const t of TOOLS) {
  test(`${t.id}: count is the true maximum on every sheet`, () => {
    for (const [sw, sh, name] of SHEETS) {
      const s = spec(sw, sh);
      const f = t.fit(s);
      // Counted the slow way, in whichever orientations this tool may use.
      let best = 0;
      const orientations = t.turns === false ? [[t.w, t.h]] : [[t.w, t.h], [t.h, t.w]];
      for (const [cw, ch] of orientations) {
        const uw = sw - 2 * f.marginIn, uh = sh - 2 * f.marginIn;
        best = Math.max(best,
          bruteForceMax(uw, cw!, f.gutterXIn) * bruteForceMax(uh, ch!, f.gutterYIn));
      }
      assert.equal(f.n, best, `${t.id} on ${name}: got ${f.n}, walking the sheet gives ${best}. ${f.why}`);
      assert.equal(f.n, f.cols * f.rows, `${t.id} on ${name}: n must be cols×rows`);
    }
  });

  test(`${t.id}: every cell is inside the margins and none overlap`, () => {
    for (const [sw, sh, name] of SHEETS) {
      const f = t.fit(spec(sw, sh));
      if (!f.fits) continue;
      const rects = cellRects(f, sw, sh);
      assert.equal(rects.length, f.n, `${t.id} on ${name}: placed ${rects.length}, expected ${f.n}`);
      for (const r of rects) {
        assert.ok(r.xIn >= f.marginIn - 1e-6 && r.yIn >= f.marginIn - 1e-6
          && r.xIn + r.wIn <= sw - f.marginIn + 1e-6 && r.yIn + r.hIn <= sh - f.marginIn + 1e-6,
          `${t.id} on ${name}: a cell at ${r.xIn.toFixed(3)},${r.yIn.toFixed(3)} breaks the margin`);
      }
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i]!, b = rects[j]!;
        const overlap = a.xIn < b.xIn + b.wIn - 1e-6 && b.xIn < a.xIn + a.wIn - 1e-6
          && a.yIn < b.yIn + b.hIn - 1e-6 && b.yIn < a.yIn + a.hIn - 1e-6;
        assert.ok(!overlap, `${t.id} on ${name}: cells ${i} and ${j} overlap`);
      }
    }
  });
}

test('no tool ever claims more than the sheet area allows', () => {
  /* An area bound is the cheapest possible sanity check and it catches any
     count that could not physically exist, whichever direction the mistake was
     made in: no arrangement of rectangles can beat sheet area / piece area. It
     is only an upper bound — real packing is usually below it — but a count
     ABOVE it is impossible, full stop. */
  for (const t of TOOLS) {
    for (const [sw, sh, name] of SHEETS) {
      const f = t.fit(spec(sw, sh));
      const usable = (sw - 2 * f.marginIn) * (sh - 2 * f.marginIn);
      const cap = Math.floor(usable / (t.w * t.h));
      assert.ok(f.n <= cap,
        `${t.id} on ${name}: claims ${f.n} but only ${cap} pieces of ${t.w}×${t.h}" `
        + `worth of area fit in ${usable.toFixed(2)} sq in. ${f.why}`);
    }
  }
});

test('every placed grid physically fits, in BOTH directions', () => {
  for (const t of TOOLS) {
    for (const [sw, sh, name] of SHEETS) {
      const f = t.fit(spec(sw, sh));
      if (!f.fits) continue;
      const usedW = f.cols * f.cellWIn + (f.cols - 1) * f.gutterXIn;
      const usedH = f.rows * f.cellHIn + (f.rows - 1) * f.gutterYIn;
      assert.ok(usedW <= sw - 2 * f.marginIn + 1e-9,
        `${t.id} on ${name}: ${f.cols} × ${f.cellWIn}" = ${usedW.toFixed(2)}" is wider than the sheet allows`);
      assert.ok(usedH <= sh - 2 * f.marginIn + 1e-9,
        `${t.id} on ${name}: ${f.rows} × ${f.cellHIn}" = ${usedH.toFixed(2)}" is taller than the sheet allows`);
      // …and it is the MOST that fits: one more would not go.
      assert.ok(usedW + f.gutterXIn + f.cellWIn > sw - 2 * f.marginIn + 1e-9,
        `${t.id} on ${name}: another column would fit`);
      assert.ok(usedH + f.gutterYIn + f.cellHIn > sh - 2 * f.marginIn + 1e-9,
        `${t.id} on ${name}: another row would fit`);
    }
  }
});

test('a tool that may turn its piece always picks the better orientation', () => {
  for (const t of TOOLS) {
    if (t.turns === false) continue;
    const f = t.fit(spec(11, 17));
    const upright = bruteForceMax(11 - 2 * f.marginIn, t.w, f.gutterXIn)
      * bruteForceMax(17 - 2 * f.marginIn, t.h, f.gutterYIn);
    const turned = bruteForceMax(11 - 2 * f.marginIn, t.h, f.gutterXIn)
      * bruteForceMax(17 - 2 * f.marginIn, t.w, f.gutterYIn);
    assert.equal(f.n, Math.max(upright, turned), `${t.id}: ${f.why}`);
  }
});

test('a bigger sheet never fits fewer pieces', () => {
  for (const t of TOOLS) {
    const small = t.fit(spec(8.5, 11)).n;
    const big = t.fit(spec(13, 19)).n;
    assert.ok(big >= small, `${t.id}: 13×19 fits ${big} but Letter fits ${small}`);
  }
});
