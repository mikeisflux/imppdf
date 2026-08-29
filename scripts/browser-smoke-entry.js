/* Runs INSIDE Chromium. These tools cannot be driven from node: they rasterize
   through a canvas, or they load ONNX models, or both. Everything else is
   covered by scripts/smoke-all.mjs — this file exists only for the six that a
   node harness genuinely cannot reach.

   The engine is the real one, imported from src/. Nothing is stubbed. */

import '../src/lib/polyfills.ts';
import { PDFDocument, rgb } from 'pdf-lib';
import * as E from '../src/lib/imposition-toolkit/impose.ts';

const PT = 72;

async function artPdf(wIn, hIn, opts = {}) {
  const d = await PDFDocument.create();
  const w = wIn * PT, h = hIn * PT;
  const pg = d.addPage([w, h]);
  if (!opts.transparent) {
    pg.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(0.10, 0.09, 0.12) });
  }
  // A shape with real interior detail, so line-art and matting have something
  // to find, and a clear subject/background split for the segmentation tools.
  pg.drawEllipse({ x: w / 2, y: h * 0.58, xScale: w * 0.26, yScale: h * 0.24, color: rgb(0.87, 0.72, 0.62) });
  pg.drawEllipse({ x: w / 2, y: h * 0.30, xScale: w * 0.19, yScale: h * 0.16, color: rgb(0.85, 0.12, 0.45) });
  pg.drawRectangle({ x: w * 0.30, y: h * 0.66, width: w * 0.10, height: h * 0.04, color: rgb(0.15, 0.15, 0.18) });
  pg.drawRectangle({ x: w * 0.60, y: h * 0.66, width: w * 0.10, height: h * 0.04, color: rgb(0.15, 0.15, 0.18) });
  return d.save();
}

/* Minimal baseline-TIFF reader. The spot-color tools emit TIFF, not PDF, so
   "it rendered" is not a check — what matters is the channel LAYOUT the RIP
   reads (CLAUDE.md rules 2 and 4): 8-bit RGB photometric 2, interleaved,
   6 samples in the order R,G,B,alpha,W1,V1. This pulls that back out of the
   bytes we actually wrote. */
function readTiff(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const le = String.fromCharCode(bytes[0], bytes[1]) === 'II';
  const u16 = (o) => dv.getUint16(o, le);
  const u32 = (o) => dv.getUint32(o, le);
  if (u16(2) !== 42) throw new Error('not a TIFF');
  const ifd = u32(4);
  const n = u16(ifd);
  const tags = {};
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    const tag = u16(e), type = u16(e + 2), count = u32(e + 4);
    const size = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 }[type] ?? 1;
    const total = size * count;
    const at = total <= 4 ? e + 8 : u32(e + 8);
    const read = (k) => (type === 3 ? u16(at + k * 2) : type === 4 ? u32(at + k * 4) : bytes[at + k]);
    tags[tag] = count === 1 ? read(0) : Array.from({ length: Math.min(count, 64) }, (_, k) => read(k));
    tags[`${tag}_at`] = at; tags[`${tag}_count`] = count;
  }
  const width = tags[256], height = tags[257];
  const spp = tags[277] ?? 1;
  const offsets = Array.isArray(tags[273]) ? tags[273] : [tags[273]];
  const counts = Array.isArray(tags[279]) ? tags[279] : [tags[279]];
  const pixels = new Uint8Array(width * height * spp);
  let at = 0;
  for (let s = 0; s < offsets.length; s++) {
    const off = offsets[s], len = counts[s];
    pixels.set(bytes.subarray(off, off + len), at);
    at += len;
  }
  return { width, height, spp, photometric: tags[262], bits: tags[258], pixels,
    compression: tags[259], planar: tags[284] };
}

/** Draw one sample plane of a TIFF as grayscale — this is what the channel
 *  looks like opened in Photoshop, INVERTED spot polarity included. */
function planeToCanvas(t, sample) {
  const c = document.createElement('canvas');
  c.width = t.width; c.height = t.height;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(t.width, t.height);
  for (let i = 0; i < t.width * t.height; i++) {
    const v = t.pixels[i * t.spp + sample];
    img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function rgbToCanvas(t) {
  const c = document.createElement('canvas');
  c.width = t.width; c.height = t.height;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(t.width, t.height);
  for (let i = 0; i < t.width * t.height; i++) {
    img.data[i * 4] = t.pixels[i * t.spp];
    img.data[i * 4 + 1] = t.pixels[i * t.spp + 1];
    img.data[i * 4 + 2] = t.pixels[i * t.spp + 2];
    img.data[i * 4 + 3] = t.spp > 3 ? t.pixels[i * t.spp + 3] : 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

async function pdfToCanvas(bytes, maxPx = 700) {
  const pdfjs = await import('pdfjs-dist');
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const pg = await doc.getPage(1);
  const v1 = pg.getViewport({ scale: 1 });
  const scale = Math.min(maxPx / v1.width, maxPx / v1.height, 2);
  const vp = pg.getViewport({ scale });
  const c = document.createElement('canvas');
  c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  await pg.render({ canvasContext: ctx, viewport: vp }).promise;
  return { canvas: c, pages: doc.numPages, ptW: v1.width, ptH: v1.height };
}

function shrink(canvas, maxPx = 560) {
  const s = Math.min(1, maxPx / Math.max(canvas.width, canvas.height));
  if (s >= 1) return canvas.toDataURL('image/png');
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(canvas.width * s));
  c.height = Math.max(1, Math.round(canvas.height * s));
  c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

/* Does the artwork actually differ from the background in this plane? Used to
   prove a spot plate carries INK where the art is and none where it is not,
   rather than being a flat slab that happens to be the right size. */
function planeStats(t, sample) {
  let min = 255, max = 0, sum = 0;
  const n = t.width * t.height;
  for (let i = 0; i < n; i++) {
    const v = t.pixels[i * t.spp + sample];
    if (v < min) min = v; if (v > max) max = v; sum += v;
  }
  return { min, max, mean: Math.round(sum / n) };
}

/* Stats over a horizontal band of the sheet, given as fractions of the height.
   Used to look INSIDE one panel rather than averaging the whole box, where the
   empty panels would swamp the answer. */
function bandStats(t, sample, y0f, y1f) {
  const y0 = Math.floor(t.height * y0f), y1 = Math.floor(t.height * y1f);
  let ink = 0, clear = 0, n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < t.width; x++) {
      const v = t.pixels[(y * t.width + x) * t.spp + sample];
      if (v <= 8) ink++; else if (v >= 247) clear++;
      n++;
    }
  }
  return { hasInk: ink > n * 0.01, hasClear: clear > n * 0.01,
    ink: Math.round((ink / n) * 100), clear: Math.round((clear / n) * 100) };
}

const CASES = [];
const add = (id, fn) => CASES.push([id, fn]);

// ── divinitybox — the shop's UV box, all of CLAUDE.md's invariants ────────
add('divinitybox', async () => {
  // TRANSPARENT background on purpose. With an opaque panel the plate is a
  // solid slab and every polarity check passes trivially; the invariant that
  // matters is "white and varnish ONLY where the artwork has ink"
  // (CLAUDE.md 5), which only bites when the art has holes in it.
  /* Panel B is 300 x 207.5mm — LANDSCAPE. Portrait art gets cover-fitted and
     magnified until it fills the panel, which makes the plate a solid slab and
     the test meaningless. Matching the panel's aspect is what lets the holes in
     the artwork reach the plate. */
  const panel = await artPdf(11.8, 8.2, { transparent: true });
  // ONE options object, and each panel is { bytes } — raw bytes and a stray
  // second argument silently produce an empty box that still passes every
  // structural check, which is exactly how a smoke test lies to you.
  const tiff = await E.divinityBoxTiff({
    b: { bytes: panel }, c: { bytes: panel }, dpi: 150, fit: 'contain', varnish: true,
  });
  // Varnish is OPT-IN (default false). Prove it stays off when not asked for —
  // an accidental flood of gloss over the whole box is a ruined run.
  const noVarnish = readTiff(await E.divinityBoxTiff({
    b: { bytes: panel }, c: { bytes: panel }, dpi: 72, fit: 'contain',
  }));
  const t = readTiff(tiff);
  const checks = [];
  const need = (ok, msg) => checks.push((ok ? 'ok  ' : 'FAIL ') + msg);
  need(t.photometric === 2, 'photometric 2 (RGB), not Separated — CLAUDE.md 4');
  need(t.spp === 6, `6 samples R,G,B,alpha,W1,V1 (got ${t.spp}) — CLAUDE.md 2`);
  need(t.compression === 1, 'uncompressed');
  need(t.planar === 1 || t.planar === undefined, 'interleaved');
  need((Array.isArray(t.bits) ? t.bits[0] : t.bits) === 8, '8-bit');
  const w1 = planeStats(t, 4), v1 = planeStats(t, 5);
  // INVERTED polarity: 0 = full ink, 255 = none. So an empty area must be 255
  // and the art must pull the minimum down.
  need(w1.max === 255, `W1 leaves empty areas clear (max ${w1.max}) — CLAUDE.md 6`);
  need(w1.min < 250, `W1 lays ink under the art (min ${w1.min})`);
  need(v1.max === 255, `V1 leaves empty areas clear (max ${v1.max})`);
  need(v1.min < 250, `V1 lays ink under the art (min ${v1.min})`);
  // The real check: within a panel that HAS art, the plate must be neither
  // all ink nor all clear — it has to follow the artwork's own shape.
  /* The real check. Inside a band that definitely sits within a printed panel,
     the plate must contain BOTH full ink and no ink — that is what "only where
     the artwork has ink" means. A plate that floods the panel passes every
     polarity check above and is still wrong. */
  const off = planeStats(noVarnish, 5);
  need(off.min === 255, `V1 stays empty when varnish is not asked for (min ${off.min})`);
  const band = bandStats(t, 4, 0.30, 0.42);
  const bandV = bandStats(t, 5, 0.30, 0.42);
  need(band.hasInk && band.hasClear,
    `W1 has ink AND clear inside a printed panel (${band.ink}% ink) — CLAUDE.md 5, no flooding`);
  need(bandV.hasInk && bandV.hasClear,
    `V1 has ink AND clear inside a printed panel (${bandV.ink}% ink)`);
  // And the transparent gaps must carry no color either.
  const alpha = bandStats(t, 3, 0.30, 0.42);
  need(alpha.hasClear, 'the panel keeps transparent areas transparent');
  const fail = checks.some((c) => c.startsWith('FAIL'));
  return { ok: !fail, note: checks.join(' · '),
    meta: `${t.width}x${t.height}px, ${t.spp} samples, photometric ${t.photometric}`,
    images: [['RGB', shrink(rgbToCanvas(t))], ['W1 plate', shrink(planeToCanvas(t, 4))],
      ['V1 plate', shrink(planeToCanvas(t, 5))]] };
});

// ── raisedmetal — two passes, both carrying W1 then V1 in fixed order ─────
add('raisedmetal', async () => {
  const art = await artPdf(5, 7);
  const varnish = await E.raisedMetalTiff(art, { dpi: 150, pass: 'varnish' });
  const color = await E.raisedMetalTiff(art, { dpi: 150, pass: 'color' });
  const tv = readTiff(varnish), tc = readTiff(color);
  const checks = [];
  const need = (ok, msg) => checks.push((ok ? 'ok  ' : 'FAIL ') + msg);
  need(tv.spp === 6 && tc.spp === 6, 'both passes carry 6 samples');
  need(tv.width === tc.width && tv.height === tc.height,
    `both passes the same pixel size (${tv.width}x${tv.height} / ${tc.width}x${tc.height}) — they must register`);
  const vW = planeStats(tv, 4), vV = planeStats(tv, 5);
  const cW = planeStats(tc, 4), cV = planeStats(tc, 5);
  // Pass 1 is varnish ONLY: W1 empty (255 everywhere), V1 carrying the plate.
  need(vW.min === 255, `pass 1 lays no white (W1 min ${vW.min})`);
  need(vV.min < 250, `pass 1 lays varnish (V1 min ${vV.min})`);
  // Pass 2 is color + white, no varnish.
  need(cV.min === 255, `pass 2 lays no varnish (V1 min ${cV.min})`);
  need(cW.min < 250, `pass 2 lays white under the metal (W1 min ${cW.min})`);
  const fail = checks.some((c) => c.startsWith('FAIL'));
  return { ok: !fail, note: checks.join(' · '), meta: `${tv.width}x${tv.height}px both passes`,
    images: [['1 · V1 varnish', shrink(planeToCanvas(tv, 5))],
      ['2 · W1 white', shrink(planeToCanvas(tc, 4))], ['2 · color', shrink(rgbToCanvas(tc))]] };
});

// ── removebg — needs the ONNX models ─────────────────────────────────────
add('removebg', async () => {
  const art = await artPdf(4, 6);
  const out = await E.removeBackground(art, { dpi: 120 });
  const same = out.length === art.length;
  const r = await pdfToCanvas(out);
  // The models may not be installed; say which happened rather than passing quietly.
  const ctx = r.canvas.getContext('2d');
  const px = ctx.getImageData(0, 0, r.canvas.width, r.canvas.height).data;
  let white = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] > 245 && px[i + 1] > 245 && px[i + 2] > 245) white++;
  }
  const cut = white / (px.length / 4);
  return { ok: !same && cut > 0.05,
    note: same ? 'FAIL returned the input unchanged — the models are not installed'
      : `cut out ${(cut * 100).toFixed(1)}% of the page to transparent`,
    meta: `${r.ptW.toFixed(0)}x${r.ptH.toFixed(0)}pt`, images: [['cutout', shrink(r.canvas)]] };
});

// ── colormanage — lcms-wasm ──────────────────────────────────────────────
add('colormanage', async () => {
  const art = await artPdf(4, 6);
  const out = await E.applyColorManagement(art, {
    sourceProfile: 'sRGB (built-in)', destProfile: '', intent: 'relative',
    dpi: 120, convert: true, gamutWarning: false, pages: 'all',
  });
  const r = await pdfToCanvas(out);
  return { ok: out.length > 200 && r.pages === 1, note: `${out.length} bytes out`,
    meta: `${r.ptW.toFixed(0)}x${r.ptH.toFixed(0)}pt`, images: [['managed', shrink(r.canvas)]] };
});

// ── coloreffects — canvas rasterization ──────────────────────────────────
add('coloreffects', async () => {
  const art = await artPdf(4, 6);
  const out = await E.applyColorEffects(art, {
    brightness: 130, contrast: 110, saturation: 60, grayscale: 0, warmTone: 20,
    invert: 0, hueRotate: 0, dpi: 120, pages: 'all',
  });
  const r = await pdfToCanvas(out);
  return { ok: out.length > 200, note: 'ran in a browser, where node refuses',
    meta: `${r.ptW.toFixed(0)}x${r.ptH.toFixed(0)}pt`, images: [['effects', shrink(r.canvas)]] };
});

// ── pbcover — spine width from the page count and caliper ────────────────
add('pbcover', async () => {
  const front = await artPdf(6, 9), back = await artPdf(6, 9), spine = await artPdf(0.5, 9);
  // PerfectCoverArt is { bytes, page } — raw bytes silently leave the panel blank.
  const pages = 200, caliper = 0.0025;
  const spineIn = E.spineWidthIn(pages, caliper, 0);
  const out = await E.imposePerfectCover(front, {
    front: { bytes: front },
    back: { bytes: back }, spineArt: { bytes: spine }, trimWIn: 6, trimHIn: 9, pages, caliperPerPageIn: caliper,
    coverAllowanceIn: 0, bleedIn: 0.125, addMarks: true, markLenIn: 0.25,
    markOffIn: 0.125, markWeightPt: 0.25, hingeIn: 0.1875,
  });
  const r = await pdfToCanvas(out);
  // back + spine + front, plus bleed both sides.
  const expectW = 6 * 2 + spineIn + 0.125 * 2;
  const okW = Math.abs(r.ptW / PT - expectW) < 0.02;
  return { ok: okW,
    note: `spine ${spineIn.toFixed(3)}" for ${pages}pp at ${caliper}"/page; sheet `
      + `${(r.ptW / PT).toFixed(3)}x${(r.ptH / PT).toFixed(3)}", expected width ${expectW.toFixed(3)}"`,
    meta: `${(r.ptW / PT).toFixed(2)}x${(r.ptH / PT).toFixed(2)}"`,
    images: [['cover wrap', shrink(r.canvas)]] };
});

// ── gangsheet — several jobs nested on one sheet ─────────────────────────
add('gangsheet', async () => {
  const a = await artPdf(3, 2), b = await artPdf(2, 3);
  const out = await E.imposeGangJobs([a, b], [
    { srcIdx: 0, page: 1, qty: 4, allowRotate: true },
    { srcIdx: 1, page: 1, qty: 2, allowRotate: true },
  ], {
    sheetWIn: 11, sheetHIn: 8.5, workStyle: 'sheetwise', makeready: 0, spoilagePct: 0,
    marginTopIn: 0.25, marginLeftIn: 0.25, marginRightIn: 0.25, marginBottomIn: 0.25,
    gutterIn: 0.2, addMarks: false, bleedMode: 'doc', bleedIn: 0,
  });
  const r = await pdfToCanvas(out);
  const okSheet = Math.abs(r.ptW / PT - 11) < 0.02 && Math.abs(r.ptH / PT - 8.5) < 0.02;
  return { ok: okSheet, note: `${r.pages} sheet(s), 6 pieces across 2 jobs`,
    meta: `${(r.ptW / PT).toFixed(2)}x${(r.ptH / PT).toFixed(2)}"`,
    images: [['gang sheet', shrink(r.canvas)]] };
});

// ── export finishing — thumbnail, classic xref, Info, /ID ────────────────
add('export-finish', async () => {
  const { finalizePdfForExport } = await import('../src/lib/imposition-toolkit/pdf-finish.ts');
  const src = await artPdf(6, 9);
  const out = await finalizePdfForExport(src, { creator: 'ImpositionPDF' });
  const txt = new TextDecoder('latin1').decode(out);
  const checks = [];
  const need = (ok, msg) => checks.push((ok ? 'ok  ' : 'FAIL ') + msg);

  need(/^%PDF-1\.[45]/.test(txt), `header ${txt.slice(0, 8)}`);
  need(!/\/Type\s*\/ObjStm/.test(txt), 'no object streams — every object directly addressable');
  need(!/\/Type\s*\/XRef/.test(txt), 'classic xref table, not an xref stream');
  need(/\/ID\s*\[/.test(txt), 'trailer carries a file identifier');
  need(/\/Producer\s*\(/.test(txt), 'Producer is a literal string, as Adobe writes');
  need(/\/Subtype\s*\/XML/.test(txt), 'XMP metadata packet present');

  /* Page boxes. A missing CropBox is legal — it defaults to the MediaBox — but
     a controller that keys off CropBox or TrimBox and finds neither falls back
     to a default size, and the job images wrong while the PDF measures right.
     Adobe states all of them; so do we. */
  for (const box of ['MediaBox', 'CropBox', 'BleedBox', 'TrimBox', 'ArtBox']) {
    need(new RegExp(`/${box}\\s*\\[`).test(txt), `${box} stated explicitly`);
  }
  const boxes = [...txt.matchAll(/\/(?:Media|Crop|Bleed|Trim|Art)Box\s*\[([^\]]+)\]/g)]
    .map((m) => m[1].trim().split(/\s+/).map(Number));
  need(boxes.length > 0 && boxes.every((b) => b[0] === boxes[0][0] && b[1] === boxes[0][1]
    && b[2] === boxes[0][2] && b[3] === boxes[0][3]), 'every box agrees');
  need(boxes.every((b) => b[0] === 0 && b[1] === 0),
    `boxes start at 0,0 (got ${boxes[0] ? boxes[0].slice(0, 2).join(',') : '?'}) — a shifted `
    + 'origin moves the artwork on a RIP that honors it');

  // THE POINT OF ALL THIS: a preview must actually be in the file.
  need(/\/Thumb\s+\d+\s+\d+\s+R/.test(txt), 'page carries /Thumb — the PDF spec preview');
  const gimg = txt.match(/<xmpGImg:image>([^<]{200,})<\/xmpGImg:image>/);
  need(!!gimg, `XMP carries a thumbnail image${gimg ? ` (${gimg[1].length} base64 chars)` : ''}`);

  // And the xref must still be right after the byte-level patching.
  const sx = txt.lastIndexOf('startxref');
  const at = parseInt(txt.slice(sx + 9).trim(), 10);
  need(txt.slice(at, at + 4) === 'xref', 'startxref still lands on the table after patching');

  // Show the thumbnail that was embedded, decoded back out of the file.
  const images = [];
  if (gimg) images.push(['XMP thumbnail', 'data:image/png;base64,' + gimg[1]]);
  const r = await pdfToCanvas(out);
  images.push(['finished page', shrink(r.canvas)]);
  const fail = checks.some((c) => c.startsWith('FAIL'));
  return { ok: !fail, note: checks.join(' · '),
    meta: `${src.length} -> ${out.length} bytes`, images };
});

/* ── repairing an ALREADY-EXPORTED file ───────────────────────────────────
   The path for files that are already made: drop them in, pick the PDF REPAIR
   tool, download. That step runs the finisher and NOTHING else, so the boxes
   are repaired and a preview is added without re-doing the job, and the output
   keeps the source's file name.

   Pick any OTHER tool for this and it re-imposes the job — that is how sixteen
   finished covers were destroyed. PDF Repair exists so there is a step that
   cannot do that. This proves the repair on a file carrying the exact fault:
   a CropBox smaller than the MediaBox. */
add('repair-existing', async () => {
  const src = await PDFDocument.load(await artPdf(8.5, 11));
  const page = src.getPages()[0];
  page.setCropBox(36, 36, 540, 720);              // the fault, as Crop produces it
  page.setTrimBox(36, 36, 540, 720);
  const broken = await src.save();

  const { finalizePdfForExport } = await import('../src/lib/imposition-toolkit/pdf-finish.ts');
  const fixed = await finalizePdfForExport(broken, { creator: 'ImpositionPDF' });

  const boxesOf = async (bytes) => {
    const d = await PDFDocument.load(bytes, { updateMetadata: false });
    const p = d.getPages()[0];
    const m = p.getMediaBox(), c = p.getCropBox();
    return { m: [m.x, m.y, m.width, m.height], c: [c.x, c.y, c.width, c.height] };
  };
  const before = await boxesOf(broken), after = await boxesOf(fixed);
  const checks = [];
  const need = (ok, msg) => checks.push((ok ? 'ok  ' : 'FAIL ') + msg);
  need(before.m[2] !== before.c[2],
    `the input really is faulty: Media ${before.m[2]}x${before.m[3]}pt vs Crop ${before.c[2]}x${before.c[3]}pt`);
  need(after.m[2] === after.c[2] && after.m[3] === after.c[3],
    `repaired: Media and Crop now agree at ${after.m[2]}x${after.m[3]}pt`);
  need(after.m[0] === 0 && after.m[1] === 0, 'origin normalized to 0,0');
  need(after.m[2] === before.c[2] && after.m[3] === before.c[3],
    'the page is the size the operator SAW, not the oversized sheet');
  const txt = new TextDecoder('latin1').decode(fixed);
  need(/\/Thumb\s+\d+\s+\d+\s+R/.test(txt), 'and it gained a preview on the way through');

  // Render both, so the artwork is visibly in the same place on the page.
  const a = await pdfToCanvas(broken), b = await pdfToCanvas(fixed);
  const fail = checks.some((c) => c.startsWith('FAIL'));
  return { ok: !fail, note: checks.join(' · '),
    meta: `${before.m[2]}x${before.m[3]} -> ${after.m[2]}x${after.m[3]}pt`,
    images: [['before (RIP sees this)', shrink(a.canvas)], ['after', shrink(b.canvas)]] };
});

window.runSmoke = async function runSmoke() {
  const out = [];
  for (const [id, fn] of CASES) {
    const started = performance.now();
    try {
      const r = await fn();
      out.push({ id, ok: !!r.ok, note: r.note ?? '', meta: r.meta ?? '',
        images: r.images ?? [], ms: Math.round(performance.now() - started) });
    } catch (e) {
      out.push({ id, ok: false, note: `THREW: ${e && e.message ? e.message : String(e)}`,
        meta: '', images: [], ms: Math.round(performance.now() - started) });
    }
  }
  return out;
};
window.smokeReady = true;
