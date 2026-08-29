/* PDF Repair — the finisher run over a file that is already imposed.
 *
 * The fault this tool exists for: a page that MEASURES right in Acrobat and
 * IMAGES wrong on the press, because the viewer honours the CropBox and the RIP
 * images the MediaBox. Sixteen finished covers were destroyed trying to fix that
 * by re-exporting them through Perfect Bound Cover, which re-imposed them. So
 * the two things asserted here are: the fault is detected, and the repair fixes
 * it WITHOUT moving the artwork.                                             */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, PDFName, PDFArray } from 'pdf-lib';
import { finalizePdfForExport, inspectPdfForRepair } from '../src/lib/imposition-toolkit/pdf-finish.ts';

const PT = 72;

/** A letter page whose CropBox is inset 36pt all round — Acrobat shows a
 *  540×720pt page, the press images 612×792pt. A rectangle sits 20pt in from
 *  the crop's bottom-left so the artwork's position can be checked after. */
async function croppedPdf() {
  const d = await PDFDocument.create();
  const p = d.addPage([8.5 * PT, 11 * PT]);
  p.drawRectangle({ x: 56, y: 56, width: 100, height: 60 });
  p.setCropBox(36, 36, 540, 720);
  return d.save();
}

const box = (doc: PDFDocument, i: number, name: string): number[] | null => {
  const v = doc.getPage(i).node.lookup(PDFName.of(name));
  return v instanceof PDFArray ? v.asArray().map((n) => Number(n.toString())) : null;
};

test('inspect: reports the crop/media mismatch and the off-origin page', async () => {
  const rep = await inspectPdfForRepair(await croppedPdf());
  assert.ok(rep, 'file was readable');
  assert.equal(rep!.pages, 1);
  assert.deepEqual(rep!.cropMismatch, [1], 'page 1 crops differently from the media');
  assert.deepEqual(rep!.offOrigin, [1], 'the visible page does not start at 0,0');
  assert.equal(Math.round(rep!.visiblePt!.wPt), 540, 'measures 540pt wide');
  assert.equal(Math.round(rep!.mediaPt!.wPt), 612, 'images 612pt wide');
  assert.equal(rep!.hasThumb, false, 'no preview to show in the job list');
});

test('inspect: a clean file reports nothing to fix', async () => {
  const d = await PDFDocument.create();
  d.addPage([8.5 * PT, 11 * PT]).drawRectangle({ x: 20, y: 20, width: 100, height: 60 });
  const rep = await inspectPdfForRepair(await d.save());
  assert.deepEqual(rep!.cropMismatch, []);
  assert.deepEqual(rep!.offOrigin, []);
  assert.deepEqual(rep!.noMediaBox, []);
});

test('inspect: never throws on rubbish', async () => {
  assert.equal(await inspectPdfForRepair(new TextEncoder().encode('not a pdf')), null);
});

test('repair: the visible page becomes the imaged page, at 0,0', async () => {
  const out = await finalizePdfForExport(await croppedPdf(), { noThumbnails: true });
  const doc = await PDFDocument.load(out);
  assert.deepEqual(box(doc, 0, 'MediaBox')!.map(Math.round), [0, 0, 540, 720]);
  assert.deepEqual(box(doc, 0, 'CropBox')!.map(Math.round), [0, 0, 540, 720]);

  const rep = await inspectPdfForRepair(out);
  assert.deepEqual(rep!.cropMismatch, [], 'nothing left to fix');
  assert.deepEqual(rep!.offOrigin, []);
});

test('repair: the artwork does not move relative to the visible page', async () => {
  /* The rectangle is at x=56,y=56 in the original coordinates and the crop
     starts at 36,36 — so it sits 20pt in from the visible corner. After the
     repair the page starts at 0,0 and the rectangle must be at 20,20. If the
     content were not translated with the box, the job would print shifted. */
  const out = await finalizePdfForExport(await croppedPdf(), { noThumbnails: true });
  const doc = await PDFDocument.load(out);
  const page = doc.getPage(0);
  const streams = page.node.normalizedEntries().Contents;
  assert.ok(streams, 'page keeps its content');
  // The translate is applied as a wrapping cm operator; the drawn rectangle's
  // own coordinates are unchanged, so check the offset the wrapper carries.
  const raw = await (async () => {
    const { PDFStream } = await import('pdf-lib');
    const { inflateSync } = await import('node:zlib');
    const parts: string[] = [];
    for (let i = 0; i < streams.size(); i++) {
      const s = doc.context.lookup(streams.get(i), PDFStream);
      const bytes = (s as unknown as { getContents(): Uint8Array }).getContents();
      // pdf-lib flate-compresses content it writes; inflate what inflates.
      let text: string;
      try { text = inflateSync(Buffer.from(bytes)).toString('latin1'); }
      catch { text = Buffer.from(bytes).toString('latin1'); }
      parts.push(text);
    }
    return parts.join('\n');
  })();
  assert.match(raw, /1 0 0 1 -36 -36 cm/, 'content is shifted with the box');
});

test('repair: is idempotent — running it twice changes nothing further', async () => {
  const once = await finalizePdfForExport(await croppedPdf(), { noThumbnails: true });
  const twice = await finalizePdfForExport(once, { noThumbnails: true });
  const a = await PDFDocument.load(once), b = await PDFDocument.load(twice);
  assert.deepEqual(box(a, 0, 'MediaBox')!.map(Math.round), box(b, 0, 'MediaBox')!.map(Math.round));
  assert.deepEqual(box(a, 0, 'TrimBox')!.map(Math.round), box(b, 0, 'TrimBox')!.map(Math.round));
});

test('repair: page count and page order are untouched', async () => {
  const d = await PDFDocument.create();
  for (const n of [1, 2, 3, 4]) {
    const p = d.addPage([8.5 * PT, 11 * PT]);
    p.drawRectangle({ x: 10 * n, y: 10, width: 20, height: 20 });
    p.setCropBox(36, 36, 540, 720);
  }
  const out = await finalizePdfForExport(await d.save(), { noThumbnails: true });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 4, 'no page added, none dropped');
  for (let i = 0; i < 4; i++) {
    assert.deepEqual(box(doc, i, 'MediaBox')!.map(Math.round), [0, 0, 540, 720], `page ${i + 1}`);
  }
});

test('repair: a TrimBox keeps its position relative to the artwork', async () => {
  const d = await PDFDocument.create();
  const p = d.addPage([8.5 * PT, 11 * PT]);
  p.setCropBox(36, 36, 540, 720);
  p.setTrimBox(45, 45, 522, 702);          // 9pt inside the crop on every side
  const out = await finalizePdfForExport(await d.save(), { noThumbnails: true });
  const doc = await PDFDocument.load(out);
  assert.deepEqual(box(doc, 0, 'TrimBox')!.map(Math.round), [9, 9, 531, 711]);
});
