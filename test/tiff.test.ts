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

test('encodeRgbSpotTiff: RGB photometric, 5 samples R G B W1 V1, spot names present', () => {
  const width = 4, height = 3, spp = 5;                 // R G B + W1 + V1
  const interleaved = new Uint8Array(width * height * spp).map((_, i) => i % 256);
  const out = encodeRgbSpotTiff({ width, height, interleaved, spotNames: ['W1', 'V1'], dpi: 300 });
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
  assert.equal(tags.get(277)!.v, spp);            // SamplesPerPixel = 5
  assert.equal(tags.get(259)!.v, 1);              // Compression = none
  assert.equal(tags.get(284)!.v, 1);              // PlanarConfiguration = interleaved
  assert.equal(tags.get(338)!.count, 2);          // ExtraSamples: two spot channels
  assert.ok(tags.has(34377), 'Photoshop image-resource block (channel names) present');
  assert.equal(tags.get(279)!.v, width * height * spp);
  // Pixel data intact at StripOffsets.
  const so = tags.get(273)!.v;
  for (let i = 0; i < interleaved.length; i++) assert.equal(out[so + i], interleaved[i]);
  // The channel names "W1" and "V1" appear (ASCII) inside the Photoshop block.
  const ascii = String.fromCharCode(...out).slice(0, so);
  assert.ok(ascii.includes('W1') && ascii.includes('V1'), 'spot channel names W1/V1 embedded');
  // '8BIM' resource signature present.
  assert.ok(ascii.includes('8BIM'), 'Photoshop 8BIM resource signature present');
});
