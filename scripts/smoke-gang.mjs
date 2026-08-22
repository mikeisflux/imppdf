/* Smoke: every gang tool, on every common sheet, verified from the PIXELS. */
import fs from 'node:fs';
import { sourceArt, renderPng, countBlocks, OUT, PT } from './smoke.mjs';
import { imposeNUp } from '../src/lib/imposition-toolkit/impose.ts';

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
  ['indexcard', fitIndexCards, 3, 5, 17, 11],
  ['business', fitBusinessCard, 3.5, 2, 8.5, 11],
  ['postcard', fitPostcard, 6, 4, 8.5, 11],
  ['rackcard', fitRackCard, 4, 9, 11, 17],
  ['hangtag', fitHangTag, 2.5, 4, 11, 17],
  ['label', fitLabel, 4, 3.33, 8.5, 11],
  ['namebadge', fitNameBadge, 3.5, 2.25, 8.5, 11],
  ['ticket', fitTicket, 4, 2.5, 8.5, 11],
  ['coupon', fitCoupon, 3.5, 2, 8.5, 11],
  ['placecard', fitPlaceCard, 3.5, 2, 8.5, 11],
  ['greeting', fitGreetingCard, 5, 7, 8.5, 11],
  ['trading', fitTradingCard, 2.5, 3.5, 8.5, 11],
  ['bookmark', fitBookmark, 2, 6, 8.5, 11],
  ['doorhanger', fitDoorHanger, 3.875, 8.75, 8.5, 11],
  ['envelope', fitEnvelope, 9.5, 4.125, 11, 17],
  ['coaster', fitCoaster, 4, 4, 11, 17],
  ['contact', fitContactCell, 3.75, 2.4, 8.5, 11],
  ['compslip', fitCompSlip, 8.27, 3.9, 8.86, 12.6],
];

const rows = [];
let failed = 0;

for (const [id, fit, pw, ph, sw, sh] of TOOLS) {
  // Sheet + marks only: each tool's own file supplies its margin, gutter and
  // whether it is butt-cut. That is the point of the per-tool files.
  const spec = { sheetWIn: sw, sheetHIn: sh, addMarks: true, markOffIn: 0.125, markLenIn: 0.43 };
  const f = fit(spec);
  const art = await sourceArt(pw, ph);
  let placed = -1, note = '';
  try {
    const out = await imposeNUp(art, {
      sheetWIn: sw, sheetHIn: sh, cols: f.cols, rows: f.rows,
      marginIn: f.marginIn, gutterIn: f.gutterXIn, gutterYIn: f.gutterYIn,
      repeatFirst: true, addMarks: true, markLenIn: 0.43, markOffIn: 0.125,
      // The cell is the calculator's (already swapped when rotated); the ART is
      // turned to match. autoOrient off — it would swap the cell back.
      cellWIn: f.cellWIn, cellHIn: f.cellHIn, autoOrient: false, buttCut: f.buttCut,
      rotateItems: f.rotated, fit: 'contain',
    });
    const r = await renderPng(out, `${OUT}/${id}.png`);
    placed = countBlocks(r.ctx, r.w, r.h).length;
    const sheetOk = Math.abs(r.ptW - sw * PT) < 2 && Math.abs(r.ptH - sh * PT) < 2;
    if (!sheetOk) note = `sheet ${(r.ptW / PT).toFixed(2)}x${(r.ptH / PT).toFixed(2)}" != ${sw}x${sh}"`;
  } catch (e) { note = `THREW: ${e.message}`; }
  const ok = placed === f.n && !note;
  if (!ok) failed++;
  rows.push({ id, sheet: `${sw}x${sh}`, expected: f.n, measured: placed, grid: `${f.cols}x${f.rows}`,
    rotated: f.rotated ? 'yes' : '', ok: ok ? 'PASS' : 'FAIL', note });
}

const pad = (v, n) => String(v).padEnd(n);
console.log(pad('tool', 12), pad('sheet', 11), pad('grid', 7), pad('expect', 7), pad('measured', 9), pad('rot', 5), 'result');
console.log('-'.repeat(80));
for (const r of rows) {
  console.log(pad(r.id, 12), pad(r.sheet, 11), pad(r.grid, 7), pad(r.expected, 7),
    pad(r.measured, 9), pad(r.rotated, 5), r.ok, r.note);
}
console.log(`\n${rows.length - failed}/${rows.length} tools place exactly what they claim.`);
fs.writeFileSync(`${OUT}/gang-results.json`, JSON.stringify(rows, null, 2));
process.exit(failed ? 1 : 0);
