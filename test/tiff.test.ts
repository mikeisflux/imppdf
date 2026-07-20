import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeSeparatedTiff, encodeRgbSpotTiff } from '../src/lib/imposition-toolkit/tiff.ts';

function u16(b: Uint8Array, o: number) { return b[o]! | (b[o + 1]! << 8); }
function u32(b: Uint8Array, o: number) { return (b[o]! | (b[o + 1]! << 8) | (b[o + 2]! << 16) | (b[o + 3]! << 24)) >>> 0; }

test('encodeSeparatedTiff: valid little-endian header + core tags', () => {
  const width = 4, height = 3, spp = 6;
  const interleaved = new Uint8Array(width * height * spp).map((_, i) => i % 256);
  const out = encodeSeparatedTiff({ width, height, interleaved, inkNames: ['Cyan', 'Magenta', 'Yellow', 'Black', 'W1', 'V1'], dpi: 300 });
  assert.equal(out[0], 0x49); assert.equal(out[1], 0x49);   // 'II'
  assert.equal(u16(out, 2), 42);                            // magic
  const ifd = u32(out, 4);
  const nTags = u16(out, ifd);
  // Read tags into a map of id -> {type,count,valueOffset}
  const tags = new Map<number, { type: number; count: number; v: number }>();
  for (let i = 0; i < nTags; i++) {
    const p = ifd + 2 + i * 12;
    tags.set(u16(out, p), { type: u16(out, p + 2), count: u32(out, p + 4), v: u32(out, p + 8) });
  }
  assert.equal(tags.get(256)!.v, width);          // ImageWidth
  assert.equal(tags.get(257)!.v, height);         // ImageLength
  assert.equal(tags.get(259)!.v, 1);              // Compression = none
  assert.equal(tags.get(262)!.v, 5);              // Photometric = Separated
  assert.equal(tags.get(277)!.v, spp);            // SamplesPerPixel
  assert.equal(tags.get(284)!.v, 1);              // PlanarConfiguration = interleaved
  assert.equal(tags.get(334)!.v, spp);            // NumberOfInks
  assert.equal(tags.get(279)!.v, width * height * spp); // StripByteCounts
  // Pixel data at StripOffsets matches the input.
  const so = tags.get(273)!.v;
  for (let i = 0; i < interleaved.length; i++) assert.equal(out[so + i], interleaved[i]);
});

test('encodeRgbSpotTiff: RGB photometric, 6 samples R G B A W1 V1, alpha + spot names', () => {
  const width = 4, height = 3, spp = 6;                 // R G B + A + W1 + V1
  const interleaved = new Uint8Array(width * height * spp).map((_, i) => i % 256);
  const out = encodeRgbSpotTiff({ width, height, interleaved, spotNames: ['W1', 'V1'], alpha: true, dpi: 300 });
  assert.equal(out[0], 0x49); assert.equal(out[1], 0x49);   // 'II'
  assert.equal(u16(out, 2), 42);
  const ifd = u32(out, 4);
  const nTags = u16(out, ifd);
  const tags = new Map<number, { type: number; count: number; v: number }>();
  for (let i = 0; i < nTags; i++) {
    const p = ifd + 2 + i * 12;
    tags.set(u16(out, p), { type: u16(out, p + 2), count: u32(out, p + 4), v: u32(out, p + 8) });
  }
  assert.equal(tags.get(262)!.v, 2);              // Photometric = RGB (NOT 5/Separated)
  assert.equal(tags.get(277)!.v, spp);            // SamplesPerPixel = 6
  assert.equal(tags.get(259)!.v, 1);              // Compression = none
  assert.equal(tags.get(284)!.v, 1);              // PlanarConfiguration = interleaved
  assert.equal(tags.get(338)!.count, 3);          // ExtraSamples: alpha + two spot channels
  // ExtraSamples out-of-line (3 shorts = 6 bytes): first = 2 (unassociated alpha), rest 0.
  { const eo = tags.get(338)!.v; assert.equal(u16(out, eo), 2, 'first extra sample is unassociated alpha'); assert.equal(u16(out, eo + 2), 0); assert.equal(u16(out, eo + 4), 0); }
  assert.ok(tags.has(34377), 'Photoshop image-resource block (channel names) present');
  assert.equal(tags.get(279)!.v, width * height * spp);
  // Pixel data intact at StripOffsets.
  const so = tags.get(273)!.v;
  for (let i = 0; i < interleaved.length; i++) assert.equal(out[so + i], interleaved[i]);
  // The declared image ends exactly at EOF — no missing bytes (which is what
  // triggers Photoshop's "unexpected end-of-file"), no trailing slop.
  assert.equal(so + tags.get(279)!.v, out.length, 'StripOffset + StripByteCounts == file length');
  // Walk the Photoshop 8BIM resource section (BIG-endian) and confirm every
  // resource's declared size stays within the block — a bad size is exactly
  // what makes a reader run past EOF.
  const rs = tags.get(34377)!;
  const be16 = (o: number) => (out[o]! << 8) | out[o + 1]!;
  const be32 = (o: number) => ((out[o]! << 24) | (out[o + 1]! << 16) | (out[o + 2]! << 8) | out[o + 3]!) >>> 0;
  let q = rs.v; const end = rs.v + rs.count; const found: string[] = [];
  while (q + 12 <= end) {
    assert.equal(be32(q), 0x3842494d, '8BIM signature at each resource');   // '8BIM'
    const id = be16(q + 4);
    const nameLen = out[q + 6]!;                        // Pascal name (padded to even w/ the length byte)
    const namePad = (1 + nameLen) % 2 ? 1 : 0;
    let p2 = q + 6 + 1 + nameLen + namePad;
    const size = be32(p2); p2 += 4;
    assert.ok(p2 + size <= end, `resource ${id} size ${size} stays within the block`);
    if (id === 0x03ee) {                                // alpha/spot channel names
      let c = p2; const e = p2 + size;
      while (c < e) { const l = out[c]!; found.push(String.fromCharCode(...out.slice(c + 1, c + 1 + l))); c += 1 + l; }
    }
    q = p2 + size + (size % 2 ? 1 : 0);
  }
  assert.deepEqual(found, ['W1', 'V1'], 'channel names are exactly W1, V1 in order');
  assert.equal(q, end, 'resource walk consumes the block exactly (no overrun/underrun)');
});
