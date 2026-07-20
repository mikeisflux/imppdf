// Minimal baseline TIFF writer for print separations: 8-bit, UNCOMPRESSED,
// INTERLEAVED (PlanarConfiguration = chunky), Photometric = Separated (5) with
// named inks — i.e. CMYK plus spot channels (e.g. W1 white, V1 varnish). This is
// the format a RIP expects for white/varnish underprint on black stock: "no
// image compression, interleaved". Little-endian.

export interface SeparatedTiffInput {
  width: number;
  height: number;
  // Interleaved samples, row-major: for each pixel, one byte per ink in inkNames
  // order (0 = no ink, 255 = full ink). Length must be width*height*inkNames.length.
  interleaved: Uint8Array;
  inkNames: string[];   // e.g. ['Cyan','Magenta','Yellow','Black','W1','V1']
  dpi?: number;         // stored as the resolution (default 300)
}

export function encodeSeparatedTiff(input: SeparatedTiffInput): Uint8Array {
  const { width, height, interleaved, inkNames } = input;
  const spp = inkNames.length;
  const dpi = input.dpi ?? 300;
  if (interleaved.length !== width * height * spp) {
    throw new Error(`TIFF: interleaved length ${interleaved.length} != ${width}×${height}×${spp}`);
  }

  const TYPE = { SHORT: 3, LONG: 4, RATIONAL: 5, ASCII: 2 } as const;
  // Tags in ascending id order (TIFF requires it).
  const tags: { id: number; type: number; count: number; value?: number; data?: Uint8Array }[] = [];

  // Extra (out-of-line) data blobs, placed after the IFD.
  const extras: Uint8Array[] = [];
  const bytesPerSampleArr = new Uint8Array(spp * 2);            // BitsPerSample SHORT[spp]
  { const dv = new DataView(bytesPerSampleArr.buffer); for (let i = 0; i < spp; i++) dv.setUint16(i * 2, 8, true); }
  const rational = (num: number, den: number) => { const b = new Uint8Array(8); const dv = new DataView(b.buffer); dv.setUint32(0, num, true); dv.setUint32(4, den, true); return b; };
  const inkNamesBytes = (() => {
    const s = inkNames.map((n) => n + '\0').join('');
    const b = new TextEncoder().encode(s);
    return b.length % 2 ? new Uint8Array([...b, 0]) : b;   // pad to even
  })();
  const extraSamplesArr = (() => { const n = spp - 4; const b = new Uint8Array(n * 2); return b; })(); // all 0 (unspecified)

  // Placeholders; offsets filled once layout is known.
  tags.push({ id: 256, type: TYPE.LONG, count: 1, value: width });         // ImageWidth
  tags.push({ id: 257, type: TYPE.LONG, count: 1, value: height });        // ImageLength
  tags.push({ id: 258, type: TYPE.SHORT, count: spp, data: bytesPerSampleArr }); // BitsPerSample
  tags.push({ id: 259, type: TYPE.SHORT, count: 1, value: 1 });            // Compression = none
  tags.push({ id: 262, type: TYPE.SHORT, count: 1, value: 5 });            // Photometric = Separated
  tags.push({ id: 273, type: TYPE.LONG, count: 1, value: 0 });             // StripOffsets (patched)
  tags.push({ id: 277, type: TYPE.SHORT, count: 1, value: spp });          // SamplesPerPixel
  tags.push({ id: 278, type: TYPE.LONG, count: 1, value: height });        // RowsPerStrip
  tags.push({ id: 279, type: TYPE.LONG, count: 1, value: width * height * spp }); // StripByteCounts
  tags.push({ id: 282, type: TYPE.RATIONAL, count: 1, data: rational(dpi, 1) }); // XResolution
  tags.push({ id: 283, type: TYPE.RATIONAL, count: 1, data: rational(dpi, 1) }); // YResolution
  tags.push({ id: 284, type: TYPE.SHORT, count: 1, value: 1 });            // PlanarConfiguration = chunky/interleaved
  tags.push({ id: 296, type: TYPE.SHORT, count: 1, value: 2 });            // ResolutionUnit = inch
  tags.push({ id: 332, type: TYPE.SHORT, count: 1, value: 2 });            // InkSet = not-CMYK (custom, named)
  tags.push({ id: 333, type: TYPE.ASCII, count: new TextEncoder().encode(inkNames.map((n) => n + '\0').join('')).length, data: inkNamesBytes }); // InkNames
  tags.push({ id: 334, type: TYPE.SHORT, count: 1, value: spp });          // NumberOfInks
  if (spp > 4) tags.push({ id: 338, type: TYPE.SHORT, count: spp - 4, data: extraSamplesArr }); // ExtraSamples

  // ── Layout ──────────────────────────────────────────────────────────────
  const HEADER = 8;
  const ifdSize = 2 + tags.length * 12 + 4;
  let cursor = HEADER + ifdSize;
  // Reserve extra-data offsets (must be even).
  const align = (n: number) => (n % 2 ? n + 1 : n);
  const tagDataOffset = new Map<number, number>();
  for (const t of tags) {
    if (t.data && t.data.length > 4) { cursor = align(cursor); tagDataOffset.set(t.id, cursor); extras.push(t.data); cursor += t.data.length; }
  }
  cursor = align(cursor);
  const stripOffset = cursor;
  const total = stripOffset + interleaved.length;

  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  // Header (little-endian).
  out[0] = 0x49; out[1] = 0x49; dv.setUint16(2, 42, true); dv.setUint32(4, HEADER, true);
  // IFD.
  let p = HEADER;
  dv.setUint16(p, tags.length, true); p += 2;
  for (const t of tags) {
    dv.setUint16(p, t.id, true);
    dv.setUint16(p + 2, t.type, true);
    dv.setUint32(p + 4, t.count, true);
    if (t.id === 273) { dv.setUint32(p + 8, stripOffset, true); }
    else if (t.data && t.data.length > 4) { dv.setUint32(p + 8, tagDataOffset.get(t.id)!, true); }
    else if (t.data) { out.set(t.data, p + 8); }                 // inline (≤4 bytes: e.g. ExtraSamples)
    else if (t.type === TYPE.SHORT) { dv.setUint16(p + 8, t.value ?? 0, true); }
    else { dv.setUint32(p + 8, t.value ?? 0, true); }
    p += 12;
  }
  dv.setUint32(p, 0, true);   // next IFD = 0
  // Extra data blobs.
  for (const t of tags) {
    if (t.data && t.data.length > 4) out.set(t.data, tagDataOffset.get(t.id)!);
  }
  // Pixel data.
  out.set(interleaved, stripOffset);
  return out;
}
