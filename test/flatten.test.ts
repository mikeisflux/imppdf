import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, PDFName, PDFOperator, PDFRawStream, rgb } from 'pdf-lib';
import { PDFOperatorNames as Ops } from 'pdf-lib';
import { inspectTransparency, relativeBoxes } from '../src/lib/imposition-toolkit/flatten.ts';

/* A page built the way the flipbook export built the Hellfire interior: the
   art inside a transparency group, painted through an ExtGState whose
   luminosity soft mask is a white rectangle over the page. */
export async function maskedPagePdf(pages = 2, w = 477, h = 738): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const pg = doc.addPage([w, h]);
    pg.setTrimBox(9, 9, w - 18, h - 18);
    pg.setBleedBox(0, 0, w, h);
    const ctx = doc.context;
    // Mask group: a form XObject with a transparency group, painting white.
    const maskForm = PDFRawStream.of(ctx.obj({
      Type: 'XObject', Subtype: 'Form', BBox: [0, 0, w, h],
      Group: { S: 'Transparency', CS: 'DeviceGray' },
    }), new TextEncoder().encode(`1 g 0 0 ${w} ${h} re f`));
    const maskRef = ctx.register(maskForm);
    const gs = ctx.obj({ Type: 'ExtGState', SMask: { S: 'Luminosity', G: maskRef, BC: [0] }, BM: 'Normal', CA: 1, ca: 1 });
    const gsRef = ctx.register(gs);
    pg.node.set(PDFName.of('Group'), ctx.obj({ S: 'Transparency', CS: 'DeviceRGB', I: true }));
    pg.node.normalize();
    pg.node.Resources()!.set(PDFName.of('ExtGState'), ctx.obj({ GS0: gsRef }));
    // Paint through the masked graphics state: "/GS0 gs" first, then the art —
    // a white page, a colored block and a dark bar.
    pg.pushOperators(PDFOperator.of(Ops.SetGraphicsStateParams, [PDFName.of('GS0')]));
    pg.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(1, 1, 1) });
    pg.drawRectangle({ x: 60, y: 120, width: w - 120, height: h - 240, color: rgb(0.8, 0.3, 0.1) });
    pg.drawRectangle({ x: 30, y: 30, width: w - 60, height: 40, color: rgb(0.1, 0.1, 0.1) });
  }
  const bytes = await doc.save({ useObjectStreams: false });
  const txt = new TextDecoder('latin1').decode(bytes);
  assert.ok(txt.includes('/SMask'), 'fixture carries a soft mask');
  return bytes;
}

test('inspectTransparency: counts the soft masks and groups a flipbook export carries', async () => {
  const r = await inspectTransparency(await maskedPagePdf(3));
  assert.equal(r.pages, 3);
  assert.ok(r.softMasks >= 3, `soft masks ${r.softMasks}`);
  assert.ok(r.transparencyGroups >= 6, `groups ${r.transparencyGroups}`);   // page group + mask group per page
  assert.equal(r.flat, false);
});

test('inspectTransparency: a plain page is flat', async () => {
  const d = await PDFDocument.create();
  const p = d.addPage([200, 200]);
  p.drawRectangle({ x: 10, y: 10, width: 100, height: 100, color: rgb(0, 0, 1) });
  const r = await inspectTransparency(await d.save());
  assert.equal(r.flat, true);
  assert.equal(r.softMasks, 0);
  assert.equal(r.transparencyGroups, 0);
});

test('relativeBoxes: trim and bleed come across relative to the crop, through /Rotate', () => {
  const media = { x: 0, y: 0, width: 500, height: 700 };
  const crop = { x: 10, y: 20, width: 480, height: 660 };
  const trim = { x: 30, y: 40, width: 440, height: 620 };
  // Upright: trim at (20,20) inside the 480x660 page.
  let r = relativeBoxes(media, crop, trim, null, 0);
  assert.deepEqual([r.w, r.h], [480, 660]);
  assert.deepEqual(r.trim, [20, 20, 460, 640]);
  assert.equal(r.bleed, null);
  // Rotated 90: page is 660 wide, 480 tall; the trim's left inset (20) becomes the top inset.
  r = relativeBoxes(media, crop, trim, null, 90);
  assert.deepEqual([r.w, r.h], [660, 480]);
  assert.deepEqual(r.trim, [20, 20, 640, 460]);
  // Rotated 180 keeps the size; insets mirror.
  r = relativeBoxes(media, crop, { x: 10, y: 20, width: 400, height: 600 }, null, 180);
  assert.deepEqual(r.trim, [80, 60, 480, 660]);
  // A box identical to the page is not stated.
  r = relativeBoxes(media, crop, crop, crop, 0);
  assert.equal(r.trim, null); assert.equal(r.bleed, null);
});
