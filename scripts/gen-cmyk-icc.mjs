#!/usr/bin/env node
// Generate a valid, generic CMYK ICC v2 output profile ('prtr', PCS = XYZ) with
// lut16 A2B0/B2A0 tables. This is OUR own code producing OUR own asset — no
// third-party profile is redistributed, so there are no licensing questions.
//
// It is a GENERIC APPROXIMATION (naive ink model), suitable as a default
// PDF/X OutputIntent so the export works out of the box. Serious print work
// should upload the press's real ICC profile, which the PDF/X export accepts.
//
//   node scripts/gen-cmyk-icc.mjs  ->  public/icc/generic-cmyk.icc
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── little-endian? no — ICC is big-endian. Simple growable byte writer. ──────
class W {
  constructor() { this.b = []; }
  u8(v) { this.b.push(v & 0xff); return this; }
  u16(v) { this.u8(v >> 8).u8(v); return this; }
  u32(v) { this.u8(v >>> 24).u8(v >>> 16).u8(v >>> 8).u8(v); return this; }
  s15f16(v) { return this.u32(Math.round(v * 65536) >>> 0); } // s15Fixed16, two's complement
  ascii(s) { for (const c of s) this.u8(c.charCodeAt(0)); return this; }
  sig(s) { return this.ascii(s); }
  bytes() { return Uint8Array.from(this.b); }
}
const align4 = (n) => (n + 3) & ~3;

// sRGB→XYZ (Bradford-adapted to D50); rows sum to the D50 white point.
const M = [
  [0.4360747, 0.3850649, 0.1430804],
  [0.2225045, 0.7168786, 0.0606169],
  [0.0139322, 0.0971045, 0.7141733],
];
const Minv = [
  [3.1338561, -1.6168667, -0.4906146],
  [-0.9787684, 1.9161415, 0.0334540],
  [0.0719453, -0.2289914, 1.4052427],
];
const clamp01 = (x) => Math.min(1, Math.max(0, x));
// XYZ encoded in a 16-bit LUT: u16 = XYZ * 32768 (1.0 -> 0x8000), capped.
const encXYZ = (v) => Math.min(0xffff, Math.max(0, Math.round(v * 32768)));

function cmykToXYZ(c, m, y, k) {
  const r = (1 - c) * (1 - k), g = (1 - m) * (1 - k), b = (1 - y) * (1 - k);
  return [
    M[0][0] * r + M[0][1] * g + M[0][2] * b,
    M[1][0] * r + M[1][1] * g + M[1][2] * b,
    M[2][0] * r + M[2][1] * g + M[2][2] * b,
  ];
}
function xyzToCMYK(X, Y, Z) {
  let r = clamp01(Minv[0][0] * X + Minv[0][1] * Y + Minv[0][2] * Z);
  let g = clamp01(Minv[1][0] * X + Minv[1][1] * Y + Minv[1][2] * Z);
  let b = clamp01(Minv[2][0] * X + Minv[2][1] * Y + Minv[2][2] * Z);
  const k = 1 - Math.max(r, g, b);
  if (k >= 0.9999) return [0, 0, 0, 1];
  return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - y_(b) ? 0 : 0), 0].length ? [
    (1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k,
  ] : [0, 0, 0, 0];
}
function y_() { return 0; } // (unused guard kept explicit)

// ── lut16Type (mft2) ─────────────────────────────────────────────────────────
function lut16({ inCh, outCh, grid, clut }) {
  const w = new W();
  w.sig('mft2').u32(0);
  w.u8(inCh).u8(outCh).u8(grid).u8(0);
  // 3x3 identity matrix (used only for XYZ-input profiles; harmless otherwise).
  const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (const v of I) w.s15f16(v);
  w.u16(2).u16(2);                                  // input/output table entries
  for (let ch = 0; ch < inCh; ch++) { w.u16(0x0000); w.u16(0xffff); }   // linear input tables
  for (const v of clut) w.u16(v);                   // CLUT (already u16-encoded)
  for (let ch = 0; ch < outCh; ch++) { w.u16(0x0000); w.u16(0xffff); }  // linear output tables
  return w.bytes();
}

// A2B0: CMYK(4) -> XYZ(3), 2^4 nodes. First channel (C) varies slowest.
function a2b0() {
  const clut = [];
  for (let c = 0; c < 2; c++) for (let m = 0; m < 2; m++) for (let y = 0; y < 2; y++) for (let k = 0; k < 2; k++) {
    const [X, Y, Z] = cmykToXYZ(c, m, y, k);
    clut.push(encXYZ(X), encXYZ(Y), encXYZ(Z));
  }
  return lut16({ inCh: 4, outCh: 3, grid: 2, clut });
}
// B2A0: XYZ(3) -> CMYK(4), 2^3 nodes. XYZ corner 1 -> ~2.0 in real units.
function b2a0() {
  const clut = [];
  for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) {
    const [C, Mg, Ye, K] = xyzToCMYK(x * 1.9999, y * 1.9999, z * 1.9999);
    clut.push(
      Math.round(clamp01(C) * 0xffff), Math.round(clamp01(Mg) * 0xffff),
      Math.round(clamp01(Ye) * 0xffff), Math.round(clamp01(K) * 0xffff),
    );
  }
  return lut16({ inCh: 3, outCh: 4, grid: 2, clut });
}

function descTag(text) {
  const w = new W();
  w.sig('desc').u32(0);
  const ascii = text + '\0';
  w.u32(ascii.length).ascii(ascii);
  w.u32(0).u32(0);          // unicode: lang code + count
  w.u16(0).u8(0);           // scriptcode: code + count
  for (let i = 0; i < 67; i++) w.u8(0); // scriptcode 67-byte buffer
  return w.bytes();
}
function textTag(text) {
  const w = new W();
  w.sig('text').u32(0).ascii(text + '\0');
  return w.bytes();
}
function xyzTag(X, Y, Z) {
  const w = new W();
  w.sig('XYZ ').u32(0).s15f16(X).s15f16(Y).s15f16(Z);
  return w.bytes();
}

function build() {
  const tags = [
    ['desc', descTag('Generic Coated CMYK (approximate) — ImpositionPDF')],
    ['cprt', textTag('Generated by ImpositionPDF. Public domain / free to use.')],
    ['wtpt', xyzTag(0.9642, 1.0, 0.8249)],  // D50
    ['A2B0', a2b0()],
    ['B2A0', b2a0()],
  ];

  const headerLen = 128;
  const tableLen = 4 + tags.length * 12;
  let offset = align4(headerLen + tableLen);
  const placed = tags.map(([sig, data]) => {
    const o = offset; offset = align4(offset + data.length);
    return { sig, data, offset: o, size: data.length };
  });
  const total = offset;

  const out = new Uint8Array(total);
  // Header.
  const h = new W();
  h.u32(total).u32(0).u32(0x02400000).sig('prtr').sig('CMYK').sig('XYZ ');
  // date/time (fixed): 2024-01-01T00:00:00
  h.u16(2024).u16(1).u16(1).u16(0).u16(0).u16(0);
  h.sig('acsp').u32(0).u32(0).u32(0).u32(0).u32(0).u32(0); // platform..attributes(hi)
  h.u32(0);                                                // attributes(lo)
  h.u32(0);                                                // rendering intent = perceptual
  h.s15f16(0.9642).s15f16(1.0).s15f16(0.8249);             // PCS illuminant D50
  h.u32(0);                                                // creator
  for (let i = 0; i < 16; i++) h.u8(0);                    // profile id
  for (let i = 0; i < 28; i++) h.u8(0);                    // reserved
  out.set(h.bytes(), 0);

  // Tag table.
  const tt = new W();
  tt.u32(tags.length);
  for (const p of placed) { tt.sig(p.sig).u32(p.offset).u32(p.size); }
  out.set(tt.bytes(), headerLen);

  // Tag data.
  for (const p of placed) out.set(p.data, p.offset);
  return out;
}

const icc = build();
const dest = join(ROOT, 'public', 'icc', 'generic-cmyk.icc');
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, icc);
console.log(`Wrote ${dest} (${icc.length} bytes)`);
console.log(`  colorSpace @16..20 = ${String.fromCharCode(...icc.slice(16, 20))}`);
console.log(`  deviceClass @12..16 = ${String.fromCharCode(...icc.slice(12, 16))}`);
