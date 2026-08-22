/* EVERY gang tool against EVERY paper size, both ways round.

   Three independent checks per row, because a count on its own is not evidence:

     fits    — the columns fit the width AND the rows fit the height. Both
               directions, every time; checking one is how you get a grid that
               is 6" wide and 25" tall on a 17" sheet.
     max     — one more column or row would NOT fit, so nothing is left on the
               table.
     ≤ area  — the count is under floor(sheet area / piece area). That bound is
               unreachable in practice (a card cannot be cut in half, so the
               remainder in each direction is wasted) but nothing can EXCEED it,
               which makes it a cheap catch for an impossible number.

   Both orientations are shown so the choice is visible rather than implied. */
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
import { fitDoorHanger } from '../src/lib/imposition-toolkit/fit/door-hangers.ts';
import { fitEnvelope } from '../src/lib/imposition-toolkit/fit/envelopes.ts';
import { fitCoaster } from '../src/lib/imposition-toolkit/fit/coasters.ts';
import { fitContactCell } from '../src/lib/imposition-toolkit/fit/contact-sheets.ts';
import { fitCompSlip } from '../src/lib/imposition-toolkit/fit/comp-slips.ts';

const TOOLS = [
  ['indexcard', fitIndexCards, 3, 5], ['business', fitBusinessCard, 3.5, 2],
  ['postcard', fitPostcard, 6, 4], ['rackcard', fitRackCard, 4, 9],
  ['hangtag', fitHangTag, 2.5, 4], ['label', fitLabel, 4, 3.33],
  ['namebadge', fitNameBadge, 3.5, 2.25], ['ticket', fitTicket, 4, 2.5],
  ['coupon', fitCoupon, 3.5, 2], ['placecard', fitPlaceCard, 3.5, 2],
  ['greeting', fitGreetingCard, 5, 7], ['trading', fitTradingCard, 2.5, 3.5],
  ['bookmark', fitBookmark, 2, 6], ['doorhanger', fitDoorHanger, 3.875, 8.75],
  ['envelope', fitEnvelope, 9.5, 4.125], ['coaster', fitCoaster, 4, 4],
  ['contact', fitContactCell, 3.75, 2.4], ['compslip', fitCompSlip, 8.27, 3.9],
];
const PAPERS = {
  A5: [5.83, 8.27], A4: [8.27, 11.69], A3: [11.69, 16.54], SRA3: [12.6, 17.72],
  Letter: [8.5, 11], Legal: [8.5, 14], Tabloid: [11, 17], 'Arch B': [12, 18],
};
const marks = { addMarks: true, markOffIn: 0.125, markLenIn: 0.43 };
const pad = (v, n) => String(v).padEnd(n);
const only = process.argv[2];

let bad = 0, rows = 0;
for (const [id, fit, pw, ph] of TOOLS) {
  if (only && id !== only) continue;
  console.log(`\n${id} — piece ${pw} × ${ph}"`);
  console.log(pad('  paper', 12), pad('sheet', 12), pad('usable', 13), pad('upright', 9),
    pad('turned', 9), pad('placed', 16), pad('n', 4), pad('cap', 4), 'checks');
  console.log('  ' + '-'.repeat(110));
  for (const [name, [w, h]] of Object.entries(PAPERS)) {
    for (const [sw, sh, tag] of [[w, h, ''], [h, w, ' ↻']]) {
      const f = fit({ sheetWIn: sw, sheetHIn: sh, ...marks });
      const uw = sw - 2 * f.marginIn, uh = sh - 2 * f.marginIn;
      const g = (cw, ch) => {
        const c = Math.floor((uw + f.gutterXIn) / (cw + f.gutterXIn) + 1e-9);
        const r = Math.floor((uh + f.gutterYIn) / (ch + f.gutterYIn) + 1e-9);
        return [Math.max(0, c), Math.max(0, r)];
      };
      const [uc, ur] = g(pw, ph), [tc, tr] = g(ph, pw);
      const usedW = f.cols * f.cellWIn + Math.max(0, f.cols - 1) * f.gutterXIn;
      const usedH = f.rows * f.cellHIn + Math.max(0, f.rows - 1) * f.gutterYIn;
      const cap = Math.floor((uw * uh) / (pw * ph));
      const fits = usedW <= uw + 1e-9 && usedH <= uh + 1e-9;
      const maxed = f.n === Math.max(uc * ur, tc * tr);
      const underCap = f.n <= cap;
      const ok = fits && maxed && underCap;
      if (!ok) bad++;
      rows++;
      console.log('  ' + pad(name + tag, 10), pad(`${sw}×${sh}"`, 12),
        pad(`${uw.toFixed(2)}×${uh.toFixed(2)}`, 13),
        pad(`${uc}×${ur}=${uc * ur}`, 9), pad(`${tc}×${tr}=${tc * tr}`, 9),
        pad(`${f.cols}×${f.rows} @ ${f.cellWIn}×${f.cellHIn}"`, 16),
        pad(f.n, 4), pad(cap, 4),
        ok ? 'ok' : `FAIL ${[!fits && 'does not fit', !maxed && 'not the max', !underCap && 'over the area cap'].filter(Boolean).join(', ')}`);
    }
  }
}
console.log(`\n${rows - bad}/${rows} rows fit their sheet, are the maximum that fits, and are under the area cap.`);
process.exit(bad ? 1 : 0);
