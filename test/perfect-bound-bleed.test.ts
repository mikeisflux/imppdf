/* Perfect Bound interiors: doc bleed, cropped at the SPINE ONLY.
 *
 * The bug this pins: a page exported at trim + bleed (a 6.625 x 10.25 comic
 * page saved 6.875 x 10.5) was CONTAINED into a trim-sized cell, which scaled
 * the whole thing to 96.4% and printed a book with every page 3.6% small. The
 * bleed was never removed — the artwork was shrunk to make room for it.
 *
 * The rule, per the owner: crop the bleed off the SPINE side only. That edge is
 * glued, not trimmed, so it needs no allowance. The other three edges are
 * guillotined and MUST keep their bleed, and that bleed overprints past the
 * trim rather than being clipped — clipping it is the same as not having it. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb, PDFName, PDFDict, PDFStream } from 'pdf-lib';
import { imposeNUp, computeNUpGrid } from '../src/lib/imposition-toolkit/impose.ts';

const PT = 72;
const TRIM_W = 6.625, TRIM_H = 10.25, BLEED = 0.125;
const PW = TRIM_W + 2 * BLEED, PH = TRIM_H + 2 * BLEED;   // 6.875 x 10.5

/** Interior pages at trim + bleed, each stating its TrimBox. */
async function bookPages(n = 4) {
  const d = await PDFDocument.create();
  for (let i = 0; i < n; i++) {
    const p = d.addPage([PW * PT, PH * PT]);
    p.drawRectangle({ x: 0, y: 0, width: PW * PT, height: PH * PT, color: rgb(0.85, 0.1, 0.1) });
    p.drawRectangle({ x: BLEED * PT, y: BLEED * PT, width: TRIM_W * PT, height: TRIM_H * PT, color: rgb(0.15, 0.3, 0.75) });
    p.setTrimBox(BLEED * PT, BLEED * PT, TRIM_W * PT, TRIM_H * PT);
  }
  return d.save();
}

const PB = {
  cols: 2, rows: 1, sheetWIn: 17, sheetHIn: 11, cellWIn: TRIM_W, cellHIn: TRIM_H,
  autoOrient: true, marginIn: 0, gutterIn: 0, gutterYIn: 0,
  cutStack: true, repeatFirst: false, duplex: true, duplexFlip: 'long' as const,
  addMarks: true, markLenIn: 0.25, markOffIn: 0.125, bleedIn: 0, fit: 'contain' as const,
};

/** The placed forms on a sheet: their BBox size, in inches. */
async function placedSizes(bytes: Uint8Array, pageIndex: number) {
  const doc = await PDFDocument.load(bytes);
  const pg = doc.getPage(pageIndex);
  const xo = pg.node.Resources()?.lookup(PDFName.of('XObject'), PDFDict);
  if (!xo) return [];
  return xo.keys().map((k) => {
    const form = xo.lookup(k, PDFStream);
    const bb = form?.dict.lookup(PDFName.of('BBox'));
    if (!bb) return null;
    const v = (bb as unknown as { asArray(): { toString(): string }[] }).asArray().map((n) => Number(n.toString()));
    return { wIn: (v[2]! - v[0]!) / PT, hIn: (v[3]! - v[1]!) / PT };
  }).filter(Boolean) as { wIn: number; hIn: number }[];
}

/** Inflated content of a page, for checking there is no clip. */
async function contentOf(bytes: Uint8Array, pageIndex: number) {
  const zlib = await import('node:zlib');
  const doc = await PDFDocument.load(bytes);
  const cs = doc.getPage(pageIndex).node.normalizedEntries().Contents;
  let t = '';
  for (let i = 0; cs && i < cs.size(); i++) {
    const raw = (doc.context.lookup(cs.get(i), PDFStream) as unknown as { getContents(): Uint8Array }).getContents();
    try { t += zlib.inflateSync(Buffer.from(raw)).toString('latin1'); }
    catch { t += Buffer.from(raw).toString('latin1'); }
  }
  return t;
}

test('doc bleed: pages are placed 1:1, never scaled down to fit the trim cell', async () => {
  const out = await imposeNUp(await bookPages(), { ...PB, bleedFromDoc: true });
  const t = await contentOf(out, 0);
  /* Any scale other than 1 in a placement matrix means the book prints small.
     0.9636 (= 6.625/6.875) is the exact value this bug produced. */
  for (const m of t.matchAll(/([-\d.]+) 0 0 ([-\d.]+) [-\d.]+ [-\d.]+ cm/g)) {
    const sx = Number(m[1]), sy = Number(m[2]);
    assert.ok(Math.abs(sx - 1) < 1e-6 && Math.abs(sy - 1) < 1e-6,
      `placed at ${sx} x ${sy} — interiors must never be rescaled`);
  }
});

test('doc bleed: ONE bleed comes off across, BOTH are kept down', async () => {
  const out = await imposeNUp(await bookPages(), { ...PB, bleedFromDoc: true });
  for (const side of [0, 1]) {
    for (const p of await placedSizes(out, side)) {
      assert.ok(Math.abs(p.wIn - (TRIM_W + BLEED)) < 0.01,
        `across: trim + ONE bleed (spine cropped) = ${TRIM_W + BLEED}, got ${p.wIn.toFixed(3)}`);
      assert.ok(Math.abs(p.hIn - (TRIM_H + 2 * BLEED)) < 0.01,
        `down: trim + BOTH bleeds (head and foot are trimmed) = ${TRIM_H + 2 * BLEED}, got ${p.hIn.toFixed(3)}`);
    }
  }
});

test('doc bleed: the kept bleed overprints — it is never clipped away', async () => {
  /* Clipping the overhang to the cell is the same as not having bleed: the
     guillotine gets no allowance and any drift shows white at the trim. */
  const out = await imposeNUp(await bookPages(), { ...PB, bleedFromDoc: true });
  const t = await contentOf(out, 0);
  assert.equal((t.match(/ W n/g) ?? []).length, 0, 'no clip path around the placed pages');
});

test('doc bleed: the TRIM lands on the cell, so the marks cut the right size', async () => {
  /* Position is checked against the grid the engine actually computed, not
     against a hand-figured margin — the mark clearance widens the gutter, and
     assuming it away is how "it is 0.125 out" gets misdiagnosed. */
  const g = computeNUpGrid({ ...PB });
  const cellX = [0, 1].map((c) => (g.leftGapPt + c * (g.cellWPt + g.gxPt)) / PT);
  assert.ok(Math.abs(g.cellWPt / PT - TRIM_W) < 1e-6, 'the cell IS the trim');

  const out = await imposeNUp(await bookPages(), { ...PB, bleedFromDoc: true });
  const t = await contentOf(out, 0);
  // Outer placement matrices, in order: one per cell.
  const xs = [...t.matchAll(/1 0 0 1 ([-\d.]+) ([-\d.]+) cm\s*\n?q/g)].map((m) => Number(m[1]) / PT);
  const placed = xs.length ? xs : [...t.matchAll(/1 0 0 1 ([-\d.]+) [-\d.]+ cm/g)]
    .map((m) => Number(m[1]) / PT).filter((v) => v > 0.5);
  // Fronts are rectos: spine LEFT, so the art starts exactly at the cell edge.
  for (const c of cellX) {
    assert.ok(placed.some((v) => Math.abs(v - c) < 0.02),
      `a page should start at the cell edge ${c.toFixed(3)}, got [${placed.map((v) => v.toFixed(3)).join(', ')}]`);
  }
});

test('no TrimBox: the page is placed exactly as before', async () => {
  /* A file without a TrimBox says nothing about its bleed, so it must not be
     guessed at — it falls back to the old contain behaviour. */
  const d = await PDFDocument.create();
  const p = d.addPage([PW * PT, PH * PT]);
  p.drawRectangle({ x: 0, y: 0, width: PW * PT, height: PH * PT, color: rgb(0.2, 0.3, 0.7) });
  const withFlag = await imposeNUp(await d.save(), { ...PB, bleedFromDoc: true });
  const without = await imposeNUp(await d.save(), { ...PB, bleedFromDoc: false });
  assert.deepEqual(await placedSizes(withFlag, 0), await placedSizes(without, 0),
    'identical placement when there is no TrimBox to read');
});

test('bleedFromDoc off: unchanged, so every other N-up tool is untouched', async () => {
  const src = await bookPages();
  const off = await imposeNUp(src, { ...PB, bleedFromDoc: false });
  const t = await contentOf(off, 0);
  const scales = [...t.matchAll(/([-\d.]+) 0 0 ([-\d.]+) [-\d.]+ [-\d.]+ cm/g)]
    .map((m) => Number(m[1])).filter((v) => Math.abs(v - 1) > 1e-6);
  assert.ok(scales.length > 0, 'still contains-and-scales without the flag, as it always did');
});

/** Stroked line segments on a sheet — what a crop mark actually is. */
async function markSegments(bytes: Uint8Array, pageIndex: number) {
  const t = await contentOf(bytes, pageIndex);
  return [...t.matchAll(/([-\d.]+) ([-\d.]+) m\s*\n?([-\d.]+) ([-\d.]+) l/g)].length;
}

test('doc bleed: the crop marks are still drawn', async () => {
  /* The first version of the doc-bleed branch RETURNED after placing the page,
     and the crop marks are drawn at the end of the same function — so every
     page came out with no trim marks at all. Placement and marks are separate
     concerns and must not share an exit. Counted against the unchanged path so
     this cannot pass by drawing some other number of lines. */
  const src = await bookPages();
  const on = await imposeNUp(src, { ...PB, bleedFromDoc: true });
  const off = await imposeNUp(src, { ...PB, bleedFromDoc: false });
  const onN = await markSegments(on, 0), offN = await markSegments(off, 0);
  assert.ok(onN > 0, 'doc bleed still draws crop marks');
  assert.equal(onN, offN, `same marks either way (${onN} vs ${offN})`);
});

test('doc bleed: center marks are drawn too', async () => {
  const src = await bookPages();
  const plain = await markSegments(await imposeNUp(src, { ...PB, bleedFromDoc: true }), 0);
  const centered = await markSegments(
    await imposeNUp(src, { ...PB, bleedFromDoc: true, centerMarks: true }), 0);
  assert.ok(centered > plain, `center marks add segments (${centered} vs ${plain})`);
});

test('doc bleed: marks are not buried under the neighbour\'s bleed', async () => {
  /* The kept bleed overhangs into the gutter, and each cell draws its art then
     its marks — so a later cell's overhang could paint over an earlier cell's
     marks. On a BACK sheet the versos keep their LEFT bleed, which is the side
     that reaches back toward the previous cell, so that is the one to check. */
  const out = await imposeNUp(await bookPages(), { ...PB, bleedFromDoc: true });
  const t = await contentOf(out, 1);
  const lastDraw = t.lastIndexOf(' Do');
  const lastStroke = t.lastIndexOf('\nS');
  assert.ok(lastStroke > lastDraw,
    'the final stroke comes after the final page draw, so marks sit on top');
});
