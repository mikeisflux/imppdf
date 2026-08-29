/* Page-box audit across every tool that emits a PDF.

   The failure this is looking for: a page whose boxes disagree, or whose boxes
   are missing. A viewer shows the CropBox and looks right; a RIP that keys off
   CropBox or TrimBox and finds neither falls back to a default, and the job
   images at the wrong size while the PDF measures correctly on the desk.

   Reads the boxes with pdf-lib rather than by grepping, so it sees them whether
   or not the objects are compressed. */
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, PDFName, PDFArray } from 'pdf-lib';
import { finalizePdfForExport } from '../src/lib/imposition-toolkit/pdf-finish.ts';

const OUT = 'smoke-out';
const BOXES = ['MediaBox', 'CropBox', 'BleedBox', 'TrimBox', 'ArtBox'];

/* Read a box as four numbers, or null when the page does not state it.
   pdf-lib's page.getCropBox() FALLS BACK to the MediaBox, so it can never tell
   "stated" from "absent" — which is the entire question here. This looks the
   entry up on the page's own dictionary, then walks /Parent, because MediaBox
   and CropBox are inheritable and a tool may set them on the Pages node. */
function boxOf(page, name) {
  let node = page.node;
  for (let guard = 0; node && guard < 8; guard++) {
    const v = node.lookup(PDFName.of(name));
    if (v instanceof PDFArray) return v.asArray().map((n) => Number(n.toString()));
    node = node.lookup(PDFName.of('Parent'));
  }
  return null;
}

async function audit(file) {
  const bytes = new Uint8Array(fs.readFileSync(file));
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  const rows = [];
  doc.getPages().forEach((page, i) => {
    const got = {};
    for (const b of BOXES) got[b] = boxOf(page, b);
    const media = got.MediaBox;
    const missing = BOXES.filter((b) => !got[b]);
    /* Only a CROPBOX that differs from the MediaBox is a fault: the viewer
       honours the CropBox and the RIP images the MediaBox, so the file measures
       right and prints wrong. A TrimBox or BleedBox INSET from the MediaBox is
       not a fault — it is the whole point of them, telling the RIP where the
       trim sits inside the bleed. What would be wrong is one reaching OUTSIDE
       the MediaBox, which describes a trim off the edge of the sheet. */
    const inside = (b) => b && media
      && b[0] >= media[0] - 0.01 && b[1] >= media[1] - 0.01
      && b[2] <= media[2] + 0.01 && b[3] <= media[3] + 0.01;
    const mismatched = [
      ...(got.CropBox && media && got.CropBox.some((v, k) => Math.abs(v - media[k]) > 0.01)
        ? ['CropBox≠MediaBox'] : []),
      ...BOXES.filter((b) => b !== 'MediaBox' && got[b] && !inside(got[b])).map((b) => `${b} outside MediaBox`),
    ];
    const originOff = media ? (Math.abs(media[0]) > 0.01 || Math.abs(media[1]) > 0.01) : false;
    rows.push({ page: i + 1, media, missing, mismatched, originOff });
  });
  return rows;
}

const files = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.readdirSync(OUT).filter((f) => f.endsWith('.pdf')).map((f) => path.join(OUT, f));

const pad = (v, n) => String(v).padEnd(n);
console.log(pad('file', 26), pad('pages', 6), pad('size (in)', 16), pad('missing boxes', 34), 'verdict');
console.log('-'.repeat(112));
let bad = 0;
for (const f of files) {
  let rows;
  try { rows = await audit(f); } catch (e) { console.log(pad(path.basename(f), 26), 'unreadable:', e.message); bad++; continue; }
  const r = rows[0];
  const size = r.media ? `${((r.media[2] - r.media[0]) / 72).toFixed(2)}×${((r.media[3] - r.media[1]) / 72).toFixed(2)}` : '?';
  const problems = [];
  if (r.missing.length) problems.push(`${r.missing.length} missing`);
  if (r.mismatched.length) problems.push(`MISMATCH: ${r.mismatched.join(',')}`);
  if (r.originOff) problems.push('origin not 0,0');
  if (problems.length) bad++;
  console.log(pad(path.basename(f), 26), pad(rows.length, 6), pad(size, 16),
    pad(r.missing.join(', ') || '—', 34), problems.length ? `FAIL ${problems.join('; ')}` : 'ok');
}
console.log(`\n${files.length - bad}/${files.length} files state every box consistently BEFORE finishing.`);
console.log('(pdf-lib writes a MediaBox and nothing else, so raw tool output is expected to be bare —');
console.log(' what ships is the finished file, and that is what the exit code below reflects.)');

/* The gate. Raw tool output is not what leaves the app — every download goes
   through finalizePdfForExport — so the pass/fail is whether the FINISHED file
   states its boxes properly. */
let stillBad = 0;
{
  console.log('\nAfter finalizePdfForExport (this is what ships):');
  for (const f of files) {
    try {
      const fixed = await finalizePdfForExport(new Uint8Array(fs.readFileSync(f)), { noThumbnails: true });
      const rows = await audit0(fixed);
      const r = rows[0];
      const ok = !r.missing.length && !r.mismatched.length && !r.originOff;
      if (!ok) { stillBad++; console.log('  ', pad(path.basename(f), 26), 'STILL', r.missing.join(','), r.mismatched.join(','), r.originOff ? 'origin' : ''); }
    } catch (e) { stillBad++; console.log('  ', path.basename(f), 'threw:', e.message); }
  }
  console.log(`  ${files.length - stillBad}/${files.length} clean after finishing.`);
}
if (stillBad) process.exitCode = 1;
async function audit0(bytes) {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  return doc.getPages().map((page) => {
    const got = {};
    for (const b of BOXES) got[b] = boxOf(page, b);
    const media = got.MediaBox;
    const inside = (b) => b && media
      && b[0] >= media[0] - 0.01 && b[1] >= media[1] - 0.01
      && b[2] <= media[2] + 0.01 && b[3] <= media[3] + 0.01;
    return {
      missing: BOXES.filter((b) => !got[b]),
      mismatched: [
        ...(got.CropBox && media && got.CropBox.some((v, k) => Math.abs(v - media[k]) > 0.01)
          ? ['CropBox≠MediaBox'] : []),
        ...BOXES.filter((b) => b !== 'MediaBox' && got[b] && !inside(got[b])).map((b) => `${b} outside`),
      ],
      originOff: media ? (Math.abs(media[0]) > 0.01 || Math.abs(media[1]) > 0.01) : false,
    };
  });
}
