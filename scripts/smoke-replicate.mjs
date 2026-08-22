/* Replicate with art whose shape does NOT match the tool's cell — the case
   that put landscape index cards on their side. */
import fs from 'node:fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { renderPng, countBlocks, OUT, PT } from './smoke.mjs';
import { replicateFill } from '../src/lib/imposition-toolkit/impose.ts';

// A landscape "thank you" card: 5 x 3", with text so its ORIENTATION is
// visible in the render. A count that is right with the art on its side is
// still a ruined job.
async function landscapeCard() {
  const d = await PDFDocument.create();
  const font = await d.embedFont(StandardFonts.HelveticaBold);
  const w = 5 * PT, h = 3 * PT;
  const p = d.addPage([w, h]);
  p.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(1, 1, 1) });
  p.drawRectangle({ x: 6, y: 6, width: w - 12, height: h - 12, color: rgb(0.85, 0.1, 0.55) });
  // A wide bar along the top: unmistakably horizontal when upright.
  p.drawRectangle({ x: 18, y: h - 34, width: w - 36, height: 14, color: rgb(1, 1, 1) });
  p.drawText('THANK YOU', { x: 24, y: h / 2, size: 22, font, color: rgb(1, 1, 1) });
  return d.save();
}

const rows = [];
for (const [sw, sh, label] of [[11, 17, 'Tabloid portrait'], [17, 11, 'Tabloid landscape'],
  [8.5, 11, 'Letter']]) {
  const art = await landscapeCard();
  const out = await replicateFill(art, {
    sheetWIn: sw, sheetHIn: sh, marginIn: 0.25, gutterXIn: 0, gutterYIn: 0,
    buttCut: true, addMarks: true, markLenIn: 0.25, markOffIn: 0.125,
    fit: 'contain', page: 1, fallbackCellWIn: 3, fallbackCellHIn: 5,
  });
  const id = `replicate-${sw}x${sh}`;
  const r = await renderPng(out, `${OUT}/${id}.png`);
  const blocks = countBlocks(r.ctx, r.w, r.h);
  /* Rotation is NOT the fault by itself — when the cell stays portrait, turning
     a landscape card to fill it is right, and you cut it out the same either
     way. What was actually wrong is that the card came out turned AND tiny: the
     wrong orientation scales a 5x3 into a 3x5 cell at 0.6, so it covers 36% of
     the cell it was given and the sheet is mostly white.

     So check the two things that matter, neither of which cares which way round
     it ended up:
       coverage — how much of the sheet the artwork actually occupies
       aspect   — the card is still 5:3, i.e. it was fitted, not stretched.  */
  const inked = blocks.reduce((a, b) => a + b.n, 0);
  const coverage = inked / (r.w * r.h);
  /* Judge the fill against what the CELLS can hold, not against the sheet. A
     smaller sheet leaves more unavoidable waste — Letter tops out at 4 cells of
     15 sq in on 93.5, so an absolute threshold fails a layout that is filling
     its cells perfectly well. The ratio is what carries the meaning. */
  const cellArea = 3 * 5;
  const possible = (blocks.length * cellArea) / (sw * sh);
  const fillRatio = coverage / possible;
  const aspects = blocks.map((b) => {
    const w = b.x1 - b.x0, h = b.y1 - b.y0;
    return Math.max(w, h) / Math.min(w, h);
  });
  const worstAspect = aspects.length
    ? aspects.reduce((a, v) => Math.max(a, Math.abs(v - 5 / 3)), 0) : 99;
  const upright = blocks.filter((b) => (b.x1 - b.x0) > (b.y1 - b.y0)).length;
  // 0.75 leaves room for the 6pt white border this test art carries.
  const ok = blocks.length > 0 && fillRatio > 0.75 && worstAspect < 0.12;
  rows.push({ id, label, sheet: `${sw}x${sh}`, placed: blocks.length, upright,
    coverage: `${(coverage * 100).toFixed(0)}%`, fill: `${(fillRatio * 100).toFixed(0)}%`, aspect: (5 / 3 + worstAspect).toFixed(2),
    status: ok ? 'PASS' : 'FAIL',
    note: ok ? '' : fillRatio <= 0.75
      ? `art fills only ${(fillRatio * 100).toFixed(0)}% of its cell — wrong orientation chosen`
      : `aspect off by ${worstAspect.toFixed(2)} — the art is being stretched` });
}
const pad = (v, n) => String(v).padEnd(n);
console.log(pad('case', 20), pad('sheet', 9), pad('placed', 7), pad('upright', 8), pad('sheet ink', 10), pad('cell fill', 10), pad('aspect', 7), 'result');
console.log('-'.repeat(84));
for (const r of rows) console.log(pad(r.id, 20), pad(r.sheet, 9), pad(r.placed, 7), pad(r.upright, 8), pad(r.coverage, 10), pad(r.fill, 10), pad(r.aspect, 7), r.status, r.note);
const bad = rows.filter((r) => r.status === 'FAIL');
console.log(`\n${rows.length - bad.length}/${rows.length} fill their cells without distortion (5:3 art)`);
fs.writeFileSync(`${OUT}/replicate-results.json`, JSON.stringify(rows, null, 2));
process.exit(bad.length ? 1 : 0);
