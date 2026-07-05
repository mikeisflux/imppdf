import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFStream, PDFNumber } from 'pdf-lib';
import { exportPdfX } from '../src/lib/imposition-toolkit/pdfx.ts';

const PT = 72;
const ICC = new Uint8Array(readFileSync(new URL('../public/icc/generic-cmyk.icc', import.meta.url)));

async function samplePdf() {
  const d = await PDFDocument.create();
  const p = d.addPage([8.5 * PT, 11 * PT]);
  p.drawRectangle({ x: 20, y: 20, width: 200, height: 120 });
  return d.save();
}
const header = (b: Uint8Array) => String.fromCharCode(...b.slice(0, 8));

test('PDF/X-4: embeds output intent, XMP metadata, trim box, version 1.6', async () => {
  const out = await exportPdfX(await samplePdf(), { standard: 'x-4', icc: ICC, convertCmyk: false, conditionName: 'Generic CMYK' });
  assert.equal(header(out), '%PDF-1.6');

  const doc = await PDFDocument.load(out);
  const cat = doc.catalog;
  const oi = cat.lookup(PDFName.of('OutputIntents'));
  assert.ok(oi, 'has OutputIntents');
  const meta = cat.lookup(PDFName.of('Metadata'));
  assert.ok(meta, 'has Metadata (XMP)');

  // TrimBox present on the page.
  const page = doc.getPage(0);
  const tb = page.node.lookup(PDFName.of('TrimBox'));
  assert.ok(tb, 'page has a TrimBox');
});

test('PDF/X-4 XMP declares GTS_PDFXVersion PDF/X-4', async () => {
  const out = await exportPdfX(await samplePdf(), { standard: 'x-4', icc: ICC });
  const doc = await PDFDocument.load(out);
  const meta = doc.catalog.lookup(PDFName.of('Metadata'), PDFStream);
  const xmp = new TextDecoder('latin1').decode(meta.getContents());
  assert.ok(/GTS_PDFXVersion>\s*PDF\/X-4/.test(xmp), 'XMP has PDF/X-4 version');
});

test('PDF/X-1a: version 1.4 and X-1a conformance in XMP', async () => {
  const out = await exportPdfX(await samplePdf(), { standard: 'x-1a', icc: ICC });
  assert.equal(header(out), '%PDF-1.4');
  const txt = new TextDecoder('latin1').decode(out);
  assert.ok(/PDF\/X-1a:2003/.test(txt), 'XMP declares PDF/X-1a:2003 conformance');
});

test('the embedded DestOutputProfile is the CMYK profile (N=4)', async () => {
  const out = await exportPdfX(await samplePdf(), { standard: 'x-4', icc: ICC });
  const doc = await PDFDocument.load(out);
  const arr = doc.catalog.lookup(PDFName.of('OutputIntents'), PDFArray);
  const oi = arr.lookup(0, PDFDict);
  const prof = oi.lookup(PDFName.of('DestOutputProfile'), PDFStream);
  const n = prof.dict.lookup(PDFName.of('N'), PDFNumber);
  assert.equal(n.asNumber(), 4);
});
