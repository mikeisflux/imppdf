import { test } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { PDFDocument, rgb } from 'pdf-lib';
import { imposePerfectCover, spineWidthIn } from '../src/lib/imposition-toolkit/impose.ts';

const PT = 72;
const MM = 25.4 / PT;

async function block(wIn: number, hIn: number) {
  const d = await PDFDocument.create();
  const p = d.addPage([wIn * PT, hIn * PT]);
  p.drawRectangle({ x: 0, y: 0, width: wIn * PT, height: hIn * PT, color: rgb(0.2, 0.4, 0.8) });
  return d.save();
}

/** The mm figures printed along the top, read back out of the page's content.
 *  Content streams are Flate-compressed, so they have to be inflated first —
 *  searching the raw file finds nothing and would make this test pass for the
 *  wrong reason the moment compression changed. */
function labelsIn(bytes: Uint8Array): number[] {
  const buf = Buffer.from(bytes);
  const nums = new Set<number>();
  /* pdf-lib encodes standard-font text as a HEX string — <31 35 30 2e 38> Tj —
     not a literal (150.8) Tj. Read both, or this finds nothing and the test
     passes for the wrong reason. */
  const scan = (text: string) => {
    for (const m of text.matchAll(/\(([\d]+\.\d)\)\s*Tj/g)) nums.add(Number(m[1]));
    for (const m of text.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g)) {
      const hex = m[1]!.replace(/\s+/g, '');
      const decoded = (hex.match(/.{2}/g) ?? [])
        .map((h) => String.fromCharCode(parseInt(h, 16))).join('');
      const num = /^(\d+\.\d)$/.exec(decoded.trim());
      if (num) nums.add(Number(num[1]));
    }
  };
  scan(buf.toString('latin1'));                       // uncompressed content
  const s = buf.toString('latin1');
  for (const m of s.matchAll(/stream\r?\n/g)) {
    const start = m.index! + m[0].length;
    const end = s.indexOf('endstream', start);
    if (end < 0) continue;
    try { scan(zlib.inflateSync(buf.subarray(start, end)).toString('latin1')); }
    catch { /* not a Flate stream, or an image; nothing to read here */ }
  }
  return [...nums].sort((a, b) => a - b);
}

const BASE = {
  trimWIn: 6, trimHIn: 9, pages: 200, caliperPerPageIn: 0.0025,
  coverAllowanceIn: 0, bleedIn: 0.125, addMarks: true,
  markLenIn: 0.25, markOffIn: 0.125, markWeightPt: 0.25, hingeIn: 0.1875,
};

test('perfect cover: crease labels are the real positions, in mm from the left edge', async () => {
  const art = await block(6.25, 9.25);
  const out = await imposePerfectCover(art, {
    ...BASE, front: { bytes: art }, back: { bytes: art }, creaseLabels: true,
  });
  const spine = spineWidthIn(BASE.pages, BASE.caliperPerPageIn, BASE.coverAllowanceIn);
  const b = BASE.bleedIn, t = BASE.trimWIn, h = BASE.hingeIn;
  // score, fold, fold, score — measured from the sheet's left edge (x = 0).
  const expect = [b + t - h, b + t, b + t + spine, b + t + spine + h]
    .map((x) => Number((x * 25.4).toFixed(1)));
  const got = labelsIn(out);
  for (const mm of expect) {
    assert.ok(got.includes(mm), `expected a ${mm}mm label; the sheet carries ${got.join(', ')}`);
  }
  void MM;
});

test('perfect cover: a different page count moves the labels with the spine', async () => {
  const art = await block(6.25, 9.25);
  const thin = await imposePerfectCover(art, { ...BASE, pages: 100, front: { bytes: art }, creaseLabels: true });
  const fat = await imposePerfectCover(art, { ...BASE, pages: 400, front: { bytes: art }, creaseLabels: true });
  const a = labelsIn(thin), z = labelsIn(fat);
  // The two left-hand creases never move — they are set by the trim, not the
  // spine. The two right-hand ones must move outward as the book thickens.
  assert.equal(a[0], z[0], 'the back-cover score does not depend on page count');
  assert.equal(a[1], z[1], 'the back|spine fold does not depend on page count');
  assert.ok(z[2]! > a[2]!, `a 400pp spine pushes the second fold right (${a[2]} -> ${z[2]})`);
  assert.ok(z[3]! > a[3]!, 'and the front score with it');
  // And the gap between the folds IS the spine.
  const spine100 = spineWidthIn(100, BASE.caliperPerPageIn, 0) * 25.4;
  assert.ok(Math.abs((a[2]! - a[1]!) - spine100) < 0.15,
    `fold-to-fold ${((a[2]! - a[1]!)).toFixed(1)}mm should equal the ${spine100.toFixed(1)}mm spine`);
});

test('perfect cover: labels can be turned off', async () => {
  const art = await block(6.25, 9.25);
  const out = await imposePerfectCover(art, { ...BASE, front: { bytes: art }, creaseLabels: false });
  assert.equal(labelsIn(out).length, 0, 'no millimetre figures when the option is off');
});
