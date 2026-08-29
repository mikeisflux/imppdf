/* Perfect Bound Cover preview: a colored block per uploaded file, so the
   layout and the new crease labels can be checked before any real art exists. */
import fs from 'node:fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { imposePerfectCover, spineWidthIn, HINGE_DEFAULT_IN } from '../src/lib/imposition-toolkit/impose.ts';
import { renderPng, OUT, PT } from './smoke.mjs';
import { createCanvas, loadImage } from '@napi-rs/canvas';

// One color per FILE the tool accepts, so it is obvious which panel came from
// which upload — and obvious if two ever land in the same place.
const PARTS = {
  front:       [0.85, 0.11, 0.38, 'FRONT COVER'],
  back:        [0.16, 0.47, 0.83, 'BACK COVER'],
  spineArt:    [0.96, 0.71, 0.11, 'SPINE'],
  insideFront: [0.30, 0.72, 0.42, 'INSIDE FRONT'],
  insideBack:  [0.60, 0.36, 0.78, 'INSIDE BACK'],
};

async function block(wIn, hIn, key) {
  const [r, g, b, label] = PARTS[key];
  const d = await PDFDocument.create();
  const font = await d.embedFont(StandardFonts.HelveticaBold);
  const w = wIn * PT, h = hIn * PT;
  const p = d.addPage([w, h]);
  p.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(r, g, b) });
  // Corner ticks, so any crop or scaling of the block is visible at a glance.
  for (const [cx, cy] of [[0, 0], [w - 22, 0], [0, h - 22], [w - 22, h - 22]]) {
    p.drawRectangle({ x: cx + 4, y: cy + 4, width: 18, height: 18,
      borderColor: rgb(1, 1, 1), borderWidth: 1.2, opacity: 0 });
  }
  const size = Math.min(16, w / (label.length * 0.62));
  if (w > 40 && h > 40) {
    p.drawText(label, { x: (w - font.widthOfTextAtSize(label, size)) / 2, y: h / 2 - size / 2,
      size, font, color: rgb(1, 1, 1) });
  } else {
    // The spine is too narrow for horizontal type — set it up the spine.
    p.drawText(label, { x: w / 2 + size / 2.6, y: (h - font.widthOfTextAtSize(label, size)) / 2,
      size: Math.min(size, w * 0.55), font, color: rgb(1, 1, 1), rotate: { type: 'degrees', angle: 90 } });
  }
  return d.save();
}

const TRIM_W = 6, TRIM_H = 9, PAGES = 200, CALIPER = 0.0025, BLEED = 0.125;
const spineIn = spineWidthIn(PAGES, CALIPER, 0);
console.log(`${TRIM_W}×${TRIM_H}" book, ${PAGES}pp at ${CALIPER}"/page → spine ${spineIn.toFixed(3)}" (${(spineIn * 25.4).toFixed(1)}mm)`);

const out = await imposePerfectCover(await block(TRIM_W + BLEED * 2, TRIM_H + BLEED * 2, 'front'), {
  front: { bytes: await block(TRIM_W + BLEED * 2, TRIM_H + BLEED * 2, 'front') },
  back: { bytes: await block(TRIM_W + BLEED * 2, TRIM_H + BLEED * 2, 'back') },
  spineArt: { bytes: await block(spineIn, TRIM_H + BLEED * 2, 'spineArt') },
  insideFront: { bytes: await block(TRIM_W + BLEED * 2, TRIM_H + BLEED * 2, 'insideFront') },
  insideBack: { bytes: await block(TRIM_W + BLEED * 2, TRIM_H + BLEED * 2, 'insideBack') },
  trimWIn: TRIM_W, trimHIn: TRIM_H, pages: PAGES, caliperPerPageIn: CALIPER,
  coverAllowanceIn: 0, bleedIn: BLEED, addMarks: true, markLenIn: 0.25,
  markOffIn: 0.125, markWeightPt: 0.25,          // hinge left at the 6 mm default
  creaseLabels: true, creaseLabelPt: 4,
});
fs.writeFileSync(`${OUT}/pbcover-preview.pdf`, out);

// Render both sides, plus a zoom on the top edge where the labels live.
const pages = [];
for (const p of [1, 2]) {
  const r = await renderPng(out, `${OUT}/pbcover-p${p}.png`, 1500, p);
  pages.push(r);
  console.log(`page ${p}: ${(r.ptW / PT).toFixed(3)} × ${(r.ptH / PT).toFixed(3)}in`);
}
console.log('\ncrease positions, from the sheet left edge:');
for (const [label, xIn] of [
  // Read the hinge from the ENGINE, never a second copy of the number here —
  // a readout that restates a constant can report a value the engine stopped
  // producing, which is exactly what it did.
  ['score (back)', BLEED + TRIM_W - HINGE_DEFAULT_IN], ['fold  back|spine', BLEED + TRIM_W],
  ['fold  spine|front', BLEED + TRIM_W + spineIn], ['score (front)', BLEED + TRIM_W + spineIn + HINGE_DEFAULT_IN],
]) console.log(`  ${label.padEnd(18)} ${xIn.toFixed(4)}in = ${(xIn * 25.4).toFixed(1)}mm`);
