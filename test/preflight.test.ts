import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { runPreflight } from '../src/lib/imposition-toolkit/preflight.ts';

const PT = 72;

// Build a PDF from a list of [wIn, hIn] page sizes, each with a real Contents
// stream so pdf-lib treats it as a normal page.
async function pdfOf(sizes: [number, number][]) {
  const d = await PDFDocument.create();
  for (const [w, h] of sizes) {
    const p = d.addPage([w * PT, h * PT]);
    p.drawRectangle({ x: 2, y: 2, width: w * PT - 4, height: h * PT - 4 });
  }
  const bytes = await d.save();
  const pageSizes = sizes.map(([w, h]) => ({ wPt: w * PT, hPt: h * PT }));
  return { bytes, pageSizes };
}
const has = (fs: { title: string }[], sub: string) => fs.some((f) => f.title.toLowerCase().includes(sub.toLowerCase()));
const level = (fs: { title: string; level: string }[], sub: string) =>
  fs.find((f) => f.title.toLowerCase().includes(sub.toLowerCase()))?.level;

test('a page with no bleed box is flagged', async () => {
  const { bytes, pageSizes } = await pdfOf([[8.5, 11]]);
  const findings = await runPreflight(bytes, pageSizes);
  assert.ok(findings.some((f) => /bleed/i.test(f.title)), 'reports on bleed');
});

test('a clean Letter PDF is recognised as a standard trim', async () => {
  const { bytes, pageSizes } = await pdfOf([[8.5, 11]]);
  const findings = await runPreflight(bytes, pageSizes);
  assert.ok(has(findings, 'Trim'), 'reports a trim finding');
  assert.ok(findings.some((f) => /letter/i.test(f.detail) || /letter/i.test(f.title)),
    'recognises Letter');
  assert.equal(level(findings, 'Consistent page size'), 'pass');
});

test('mixed page sizes are flagged as a warning', async () => {
  const { bytes, pageSizes } = await pdfOf([[8.5, 11], [5.83, 8.27]]);
  const findings = await runPreflight(bytes, pageSizes);
  assert.equal(level(findings, 'Mixed page sizes'), 'warning');
});

test('page count not divisible by 4 is flagged for binding', async () => {
  const { bytes, pageSizes } = await pdfOf([[8.5, 11], [8.5, 11], [8.5, 11]]);
  const findings = await runPreflight(bytes, pageSizes);
  assert.ok(findings.some((f) => /4|binding|multiple/i.test(f.title + f.detail)),
    'warns about page-count divisibility');
});

test('a standard (base-14) font that is not embedded is flagged', async () => {
  const d = await PDFDocument.create();
  const p = d.addPage([8.5 * PT, 11 * PT]);
  const font = await d.embedFont(StandardFonts.Helvetica); // base-14, not embedded
  p.drawText('Hello', { x: 20, y: 20, size: 12, font });
  const bytes = await d.save();
  const findings = await runPreflight(bytes, [{ wPt: 8.5 * PT, hPt: 11 * PT }]);
  assert.ok(findings.some((f) => /font/i.test(f.title)), 'reports on fonts');
});
