/* Media Size Fix, and the same media selection inside Perfect Bound Cover.
 *
 * The fault both exist for: a cover wrap exported at its own size (13.75 × 10.5")
 * is a page no press has in its trays. A Fiery loaded with 11×17 then decides
 * what to do with it, and decides by rotating and scaling to taste — the job is
 * the right size in the PDF and the wrong size off the press.
 *
 * So the things asserted here are the ones that make that impossible: the page
 * becomes the MEDIA, the artwork keeps its EXACT size, and it is centred.      */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, PDFName, PDFArray, degrees } from 'pdf-lib';
import { imposeOnMedia, imposePerfectCover } from '../src/lib/imposition-toolkit/impose.ts';

const PT = 72;
const near = (a: number, b: number, tol = 0.6) => Math.abs(a - b) <= tol;

/** A page of the given size in inches, with a mark near one corner so the
 *  placement can be told apart from a rotation. */
async function pagePdf(wIn: number, hIn: number, rotate = 0, count = 1) {
  const d = await PDFDocument.create();
  for (let i = 0; i < count; i++) {
    const p = d.addPage([wIn * PT, hIn * PT]);
    p.drawRectangle({ x: 10, y: 10, width: 40, height: 20 });
    if (rotate) p.setRotation(degrees(rotate));
  }
  return d.save();
}

const box = (doc: PDFDocument, i: number, name: string): number[] | null => {
  const v = doc.getPage(i).node.lookup(PDFName.of(name));
  return v instanceof PDFArray ? v.asArray().map((n) => Number(n.toString())) : null;
};

test('media fix: a 13.75 × 10.5" cover lands centred on 12 × 18, sheet turned', async () => {
  const { bytes, report } = await imposeOnMedia(await pagePdf(13.75, 10.5), { mediaWIn: 12, mediaHIn: 18 });
  const doc = await PDFDocument.load(bytes);
  const { width, height } = doc.getPage(0).getSize();
  // 13.75" does not fit across a 12" sheet, so the sheet is described the other
  // way round — the same piece of paper, fed the other direction.
  assert.ok(near(width, 18 * PT) && near(height, 12 * PT), `sheet is 18×12, got ${width}×${height}`);
  assert.deepEqual(report.oversize, [], 'nothing overhangs');
  assert.deepEqual(report.scaled, [], 'and nothing was scaled');

  // Centred: (18 - 13.75)/2 = 2.125", (12 - 10.5)/2 = 0.75".
  const bleedB = box(doc, 0, 'BleedBox')!;
  assert.ok(near(bleedB[0]!, 2.125 * PT), `left margin 2.125", got ${(bleedB[0]! / PT).toFixed(3)}`);
  assert.ok(near(bleedB[1]!, 0.75 * PT), `bottom margin 0.75", got ${(bleedB[1]! / PT).toFixed(3)}`);
  // And the artwork is still its exact size — this is the whole point.
  assert.ok(near(bleedB[2]! - bleedB[0]!, 13.75 * PT), 'artwork still 13.75" wide');
  assert.ok(near(bleedB[3]! - bleedB[1]!, 10.5 * PT), 'artwork still 10.5" tall');
});

test('media fix: never scales by default, even when the job is too big', async () => {
  const { bytes, report } = await imposeOnMedia(await pagePdf(20, 14), { mediaWIn: 11, mediaHIn: 17 });
  assert.deepEqual(report.oversize, [1], 'reported as oversize');
  assert.deepEqual(report.scaled, [], 'but NOT silently shrunk');
  const doc = await PDFDocument.load(bytes);
  const bleedB = box(doc, 0, 'BleedBox')!;
  // The sheet is the media; the artwork keeps its size and overhangs visibly.
  assert.ok(near(doc.getPage(0).getSize().width, 17 * PT));
  assert.ok(bleedB[0]! < 0 || near(bleedB[0]!, 0), 'it hangs off rather than being resized');
});

test('media fix: shrink is available but opt-in', async () => {
  const { report } = await imposeOnMedia(await pagePdf(20, 14), { mediaWIn: 11, mediaHIn: 17, shrinkOversize: true });
  assert.deepEqual(report.scaled, [1], 'scaled only because it was asked for');
});

test('media fix: a forced orientation is honoured', async () => {
  const { bytes } = await imposeOnMedia(await pagePdf(8, 10), { mediaWIn: 11, mediaHIn: 17, orient: 'landscape' });
  const { width, height } = (await PDFDocument.load(bytes)).getPage(0).getSize();
  assert.ok(width > height, 'landscape was asked for and given');
  assert.ok(near(width, 17 * PT) && near(height, 11 * PT));
});

test('media fix: turning the artwork is off unless asked for', async () => {
  // 16 × 9 does not fit 11 × 17 either way round without turning the art.
  const off = await imposeOnMedia(await pagePdf(16, 9), { mediaWIn: 11, mediaHIn: 17, orient: 'portrait' });
  assert.deepEqual(off.report.turned, [], 'artwork left alone');
  const on = await imposeOnMedia(await pagePdf(16, 9), { mediaWIn: 11, mediaHIn: 17, orient: 'portrait', rotateArt: true });
  assert.deepEqual(on.report.turned, [1], 'turned only when asked');
  const doc = await PDFDocument.load(on.bytes);
  const bleedB = box(doc, 0, 'BleedBox')!;
  assert.ok(near(bleedB[2]! - bleedB[0]!, 9 * PT), 'placed 9" across after the turn');
  assert.ok(near(bleedB[3]! - bleedB[1]!, 16 * PT), 'and 16" down');
});

test('media fix: a page carrying /Rotate is measured as it prints', async () => {
  /* A page whose box is 10.5 × 13.75 but which carries /Rotate 90 IMAGES as
     13.75 × 10.5. Measuring the box instead of what prints would put it on the
     sheet sideways — which is the exact class of bug being fixed here. */
  const { bytes } = await imposeOnMedia(await pagePdf(10.5, 13.75, 90), { mediaWIn: 12, mediaHIn: 18 });
  const doc = await PDFDocument.load(bytes);
  const { width, height } = doc.getPage(0).getSize();
  assert.ok(near(width, 18 * PT) && near(height, 12 * PT), 'sheet turned for the VISIBLE 13.75 × 10.5');
  const bleedB = box(doc, 0, 'BleedBox')!;
  assert.ok(near(bleedB[2]! - bleedB[0]!, 13.75 * PT), 'footprint is what prints, not what the box says');
});

test('media fix: every page of a multi-page file is placed', async () => {
  const { bytes, report } = await imposeOnMedia(await pagePdf(8, 10, 0, 4), { mediaWIn: 11, mediaHIn: 17 });
  assert.equal(report.pages, 4);
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 4, 'no page added, none dropped');
  for (let i = 0; i < 4; i++) {
    const { width, height } = doc.getPage(i).getSize();
    assert.ok(near(width, 11 * PT) && near(height, 17 * PT), `page ${i + 1} is on the media`);
  }
});

test('perfect cover: with no media the page is the wrap (unchanged behaviour)', async () => {
  const art = await pagePdf(6.875, 9.25);
  const out = await imposePerfectCover(art, {
    front: { bytes: art }, back: { bytes: art },
    trimWIn: 6.625, trimHIn: 10.25, pages: 32, caliperPerPageIn: 0.0025, bleedIn: 0.125,
  });
  const doc = await PDFDocument.load(out);
  const { width, height } = doc.getPage(0).getSize();
  const spine = 32 * 0.0025;
  assert.ok(near(width, (2 * 6.625 + spine + 0.25) * PT), 'wrap width');
  assert.ok(near(height, (10.25 + 0.25) * PT), 'wrap height');
});

test('perfect cover: naming the media centres the wrap on a real sheet', async () => {
  const art = await pagePdf(6.875, 10.5);
  const out = await imposePerfectCover(art, {
    front: { bytes: art }, back: { bytes: art },
    trimWIn: 6.625, trimHIn: 10.25, pages: 32, caliperPerPageIn: 0.0025, bleedIn: 0.125,
    mediaWIn: 12, mediaHIn: 18,
  });
  const doc = await PDFDocument.load(out);
  const { width, height } = doc.getPage(0).getSize();
  const spine = 32 * 0.0025;
  const wrapW = (2 * 6.625 + spine + 0.25) * PT, wrapH = (10.25 + 0.25) * PT;
  // The wrap is 13.58" across, so a 12×18 sheet is described 18×12.
  assert.ok(near(width, 18 * PT) && near(height, 12 * PT), `sheet 18×12, got ${width}×${height}`);

  // TrimBox is the finished cover, centred on the sheet.
  const trim = box(doc, 0, 'TrimBox')!;
  const expectX = (18 * PT - wrapW) / 2 + 0.125 * PT;
  const expectY = (12 * PT - wrapH) / 2 + 0.125 * PT;
  assert.ok(near(trim[0]!, expectX), `trim left ${(trim[0]! / PT).toFixed(3)}" vs ${(expectX / PT).toFixed(3)}"`);
  assert.ok(near(trim[1]!, expectY), 'trim bottom centred');
  assert.ok(near(trim[2]! - trim[0]!, (2 * 6.625 + spine) * PT), 'trim is the two covers plus the spine');
  assert.ok(near(trim[3]! - trim[1]!, 10.25 * PT), 'trim height is the book');
});

test('perfect cover: the wrap keeps its exact size on the sheet — never scaled', async () => {
  const art = await pagePdf(6.875, 10.5);
  const mk = (media?: { mediaWIn: number; mediaHIn: number }) => imposePerfectCover(art, {
    front: { bytes: art }, back: { bytes: art },
    trimWIn: 6.625, trimHIn: 10.25, pages: 32, caliperPerPageIn: 0.0025, bleedIn: 0.125,
    ...media,
  });
  const bare = await PDFDocument.load(await mk());
  const onSheet = await PDFDocument.load(await mk({ mediaWIn: 12, mediaHIn: 18 }));
  const b = bare.getPage(0).getSize();
  const t = box(onSheet, 0, 'BleedBox')!;
  assert.ok(near(t[2]! - t[0]!, b.width), 'same wrap width on the sheet as off it');
  assert.ok(near(t[3]! - t[1]!, b.height), 'same wrap height');
});
