import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';
import { splitPdfParts } from '../src/lib/imposition-toolkit/impose.ts';
import { zipStore, crc32 } from '../src/lib/imposition-toolkit/zip.ts';

async function pdfOf(n: number) {
  const d = await PDFDocument.create();
  for (let i = 0; i < n; i++) { const p = d.addPage([200, 300]); p.drawRectangle({ x: 10, y: 10, width: 50, height: 50 }); }
  return d.save();
}
const pages = async (b: Uint8Array) => (await PDFDocument.load(b)).getPageCount();

test('splitPdfParts: every page by default, chunks, and ranges — named by the pages they hold', async () => {
  const src = await pdfOf(5);
  const each = await splitPdfParts(src, 'each');
  assert.equal(each.length, 5);
  assert.deepEqual(each.map((p) => [p.first, p.last]), [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
  for (const p of each) assert.equal(await pages(p.bytes), 1);
  const every = await splitPdfParts(src, 'every', { size: 2 });
  assert.deepEqual(every.map((p) => [p.first, p.last]), [[1, 2], [3, 4], [5, 5]]);
  assert.equal(await pages(every[0]!.bytes), 2);
  const ranges = await splitPdfParts(src, 'ranges', { ranges: '1-2, 4, 9-12' });
  assert.deepEqual(ranges.map((p) => [p.first, p.last]), [[1, 2], [4, 4]]);   // out-of-range dropped
});

test('zipStore: a valid STORE archive that python can list and verify', async () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);   // the CRC-32 check value
  const a = await pdfOf(1), b = await pdfOf(2);
  const zip = zipStore([{ name: 'book-p01.pdf', bytes: a }, { name: 'book-p02-03.pdf', bytes: b }]);
  assert.equal(zip.subarray(0, 4).toString(), '80,75,3,4');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'imppdf-zip-'));
  const f = path.join(dir, 't.zip');
  fs.writeFileSync(f, zip);
  const listing = execFileSync('python3', ['-I', '-m', 'zipfile', '-l', f]).toString();
  assert.match(listing, /book-p01\.pdf\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s+/);
  assert.match(listing, /book-p02-03\.pdf/);
  execFileSync('python3', ['-I', '-m', 'zipfile', '-t', f]);                 // CRCs check out
  const out = path.join(dir, 'x'); fs.mkdirSync(out);
  execFileSync('python3', ['-I', '-m', 'zipfile', '-e', f, out]);
  assert.equal(await pages(fs.readFileSync(path.join(out, 'book-p02-03.pdf'))), 2);
  fs.rmSync(dir, { recursive: true, force: true });
});
