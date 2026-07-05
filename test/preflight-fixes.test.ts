import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
// Note: addMirroredBleed delegates to the browser-oriented imposition module,
// so it's exercised in-app rather than here; these tests cover padToMultipleOf4.
import { padToMultipleOf4 } from '../src/lib/imposition-toolkit/preflight-fixes.ts';

const PT = 72;
async function pdfOf(n: number, w = 8.5 * PT, h = 11 * PT) {
  const d = await PDFDocument.create();
  for (let i = 0; i < n; i++) {
    const p = d.addPage([w, h]);
    p.drawRectangle({ x: 4, y: 4, width: w - 8, height: h - 8 });
  }
  return d.save();
}
const count = async (b: Uint8Array) => (await PDFDocument.load(b)).getPageCount();

test('padToMultipleOf4 pads 3 → 4 pages', async () => {
  assert.equal(await count(await padToMultipleOf4(await pdfOf(3))), 4);
});

test('padToMultipleOf4 pads 5 → 8 pages', async () => {
  assert.equal(await count(await padToMultipleOf4(await pdfOf(5))), 8);
});

test('padToMultipleOf4 leaves an already-÷4 document unchanged', async () => {
  const src = await pdfOf(8);
  const out = await padToMultipleOf4(src);
  assert.equal(await count(out), 8);
});

test('padded blank pages match the last page size', async () => {
  const out = await padToMultipleOf4(await pdfOf(1, 300, 500));
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 4);
  const last = doc.getPage(3).getSize();
  assert.ok(Math.abs(last.width - 300) < 0.5 && Math.abs(last.height - 500) < 0.5);
});
