/* End-to-end smoke test: run the real engine, render the result, and COUNT the
   items on the sheet from the pixels.
   
   The point is that nothing here trusts the calculator. The source art is a
   solid block; after imposition the rendered page is scanned for connected
   blocks of that colour, and the number found is compared with what the tool
   said it would place. A count that is right on paper and wrong on the sheet
   fails here.
   
   Writes a PNG per tool to smoke-out/ so the sheets can be looked at.        */

import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, rgb } from 'pdf-lib';
import { createCanvas } from '@napi-rs/canvas';

const OUT = 'smoke-out';
fs.mkdirSync(OUT, { recursive: true });
const PT = 72;

/* Source art: a magenta block INSET inside a white piece, with a notch top-left
   so rotation is visible. The inset matters: butt-cut tools place pieces edge
   to edge, and a full-bleed block would touch its neighbour and be counted as
   one region by the flood fill below — the measurement would report a single
   giant item and look like a catastrophic failure that had not happened. */
const INSET_PT = 5;
async function sourceArt(wIn, hIn) {
  const doc = await PDFDocument.create();
  const w = wIn * PT, h = hIn * PT;
  const pg = doc.addPage([w, h]);
  pg.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(1, 1, 1) });
  pg.drawRectangle({ x: INSET_PT, y: INSET_PT, width: w - 2 * INSET_PT, height: h - 2 * INSET_PT,
    color: rgb(0.85, 0.1, 0.55) });
  pg.drawRectangle({ x: INSET_PT + 3, y: h - INSET_PT - 15, width: 16, height: 11, color: rgb(1, 1, 1) });
  return doc.save();
}

async function renderPng(bytes, outPath, maxPx = 900, pageNo = 1) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  /* A COPY every time: pdfjs transfers the buffer into its worker, so the second
     call on the same Uint8Array gets a detached one and throws DataCloneError. */
  const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: false }).promise;
  const pg = await doc.getPage(Math.min(doc.numPages, Math.max(1, pageNo)));
  const v1 = pg.getViewport({ scale: 1 });
  const scale = Math.min(maxPx / v1.width, maxPx / v1.height, 3);
  const vp = pg.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await pg.render({ canvasContext: ctx, viewport: vp }).promise;
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  return { canvas, ctx, w: canvas.width, h: canvas.height, pages: doc.numPages,
           ptW: v1.width, ptH: v1.height };
}

/* Count solid blocks of the source colour by flood fill. This is what makes
   the number MEASURED: it is whatever actually got drawn on the page. */
function countBlocks(ctx, w, h) {
  const px = ctx.getImageData(0, 0, w, h).data;
  const isArt = (i) => {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    return r > 140 && r < 250 && g < 110 && b > 90 && b < 200;
  };
  const seen = new Uint8Array(w * h);
  const blocks = [];
  const stack = new Int32Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || !isArt(s)) continue;
    let sp = 0, n = 0;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    stack[sp++] = s; seen[s] = 1;
    while (sp > 0) {
      const i = stack[--sp]; n++;
      const x = i % w, y = (i / w) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && !seen[i - 1] && isArt(i - 1)) { seen[i - 1] = 1; stack[sp++] = i - 1; }
      if (x < w - 1 && !seen[i + 1] && isArt(i + 1)) { seen[i + 1] = 1; stack[sp++] = i + 1; }
      if (y > 0 && !seen[i - w] && isArt(i - w)) { seen[i - w] = 1; stack[sp++] = i - w; }
      if (y < h - 1 && !seen[i + w] && isArt(i + w)) { seen[i + w] = 1; stack[sp++] = i + w; }
    }
    // Ignore specks: anti-aliasing along a mark can leave a few stray pixels.
    if (n > (w * h) / 4000) blocks.push({ n, x0, y0, x1, y1 });
  }
  return blocks;
}

export { sourceArt, renderPng, countBlocks, OUT, PT };
