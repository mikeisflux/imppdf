/* Media Size Fix + Perfect Bound Cover on real media: rendered, so the
   PLACEMENT is checked from pixels rather than from the page boxes. */
import fs from 'node:fs';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { imposeOnMedia, imposePerfectCover } from '../src/lib/imposition-toolkit/impose.ts';
import { renderPng, OUT, PT } from './smoke.mjs';

/* A block with an unmistakable top-left corner, so any rotation or mirroring
   of the placed art is obvious at a glance instead of plausible. */
async function block(wIn, hIn, label, col, rotate = 0) {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.HelveticaBold);
  const w = wIn * PT, h = hIn * PT;
  const p = d.addPage([w, h]);
  p.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(...col) });
  p.drawRectangle({ x: 0, y: h - 40, width: 120, height: 40, color: rgb(1, 1, 1) });
  p.drawText('TOP-LEFT', { x: 6, y: h - 26, size: 12, font: f, color: rgb(0, 0, 0) });
  p.drawText(label, { x: 20, y: h / 2, size: 22, font: f, color: rgb(1, 1, 1) });
  if (rotate) p.setRotation(degrees(rotate));
  return d.save();
}

const cases = [];
// 1 — the exact fault: a 13.75 x 10.5" cover onto the 12 x 18 in the tray.
cases.push(['mediafix-cover-on-12x18',
  (await imposeOnMedia(await block(13.75, 10.5, 'COVER WRAP 13.75 x 10.5', [0.16, 0.47, 0.83]),
    { mediaWIn: 12, mediaHIn: 18 })).bytes]);
// 2 — a page carrying /Rotate must land the way it PRINTS, not the way its box reads.
cases.push(['mediafix-rotated-source',
  (await imposeOnMedia(await block(10.5, 13.75, 'ROTATED SOURCE', [0.85, 0.11, 0.38], 90),
    { mediaWIn: 12, mediaHIn: 18 })).bytes]);
// 3 — the cover tool itself, now imposed on a real sheet.
const art = await block(6.875, 10.5, 'COVER', [0.30, 0.72, 0.42]);
cases.push(['pbcover-on-12x18', await imposePerfectCover(art, {
  front: { bytes: art }, back: { bytes: await block(6.875, 10.5, 'BACK', [0.96, 0.71, 0.11]) },
  trimWIn: 6.625, trimHIn: 10.25, pages: 32, caliperPerPageIn: 0.0025, bleedIn: 0.125,
  mediaWIn: 12, mediaHIn: 18, addMarks: true, creaseLabels: true, creaseLabelPt: 6,
})]);

for (const [name, bytes] of cases) {
  fs.writeFileSync(`${OUT}/${name}.pdf`, bytes);
  const d = await PDFDocument.load(bytes);
  const { width, height } = d.getPage(0).getSize();
  console.log(`${name}: ${(width / PT).toFixed(3)} x ${(height / PT).toFixed(3)}in`);
  await renderPng(bytes, `${OUT}/${name}.png`, 900);
}
