/* Structural dump of a PDF, in the terms a RIP cares about.
   Deliberately reads the RAW BYTES rather than parsing with a library: what
   matters here is how the file is BUILT — header, binary marker, xref style,
   object streams, page boxes, image filters — and a parser hides exactly those. */
import fs from 'node:fs';

const file = process.argv[2];
const buf = fs.readFileSync(file);
const s = buf.toString('latin1');
const out = [];
const say = (k, v) => out.push([k, v]);

say('file', `${file}  (${buf.length.toLocaleString()} bytes)`);
say('header', s.slice(0, 8));
// A RIP uses the 4 high-bit bytes on line 2 to decide the file is binary.
/* The marker is on the SECOND line: "%PDF-x.y\n" then "%" + four bytes with
   the high bit set. Find the '%' after the first newline rather than assuming
   an offset — the header line length varies. */
const nl = buf.indexOf(0x0a);
const pct = buf[nl + 1] === 0x25 ? nl + 1 : -1;
const bin = pct >= 0 ? buf.subarray(pct + 1, pct + 5) : Buffer.alloc(0);
const hasBinaryMarker = bin.length === 4 && [...bin].every((b) => b > 127);
say('binary marker', hasBinaryMarker
  ? `yes (%${[...bin.subarray(0, 4)].map((b) => b.toString(16)).join(' ')})`
  : 'NO — some RIPs then treat the file as text and mangle the streams');

say('linearized', /\/Linearized/.test(s) ? 'yes' : 'no');
const xrefStream = /\/Type\s*\/XRef/.test(s);
say('cross-reference', xrefStream
  ? 'xref STREAM (PDF 1.5+) — older RIPs may not read it'
  : 'classic xref table');
say('object streams', /\/Type\s*\/ObjStm/.test(s)
  ? 'yes (PDF 1.5+) — objects are compressed inside streams'
  : 'no — every object is directly addressable');
say('XMP metadata', /\/Subtype\s*\/XML/.test(s) || /<x:xmpmeta/.test(s) ? 'yes' : 'no');
say('OutputIntent', /\/OutputIntent/.test(s) ? 'yes' : 'no — no ICC destination profile declared');
say('trailer /ID', /\/ID\s*\[/.test(s) ? 'yes' : 'NO — some workflows key on it');
say('encrypted', /\/Encrypt/.test(s) ? 'YES' : 'no');

for (const key of ['Producer', 'Creator']) {
  // Literal (…) or UTF-16BE hex <FEFF…>. Both are legal; Adobe writes literal.
  const lit = s.match(new RegExp(`/${key}\\s*\\(([^)]*)\\)`));
  const hex = s.match(new RegExp(`/${key}\\s*<(FEFF[0-9A-Fa-f]+)>`));
  if (lit) say(key.toLowerCase(), `${lit[1]}  (literal string, as Adobe writes)`);
  else if (hex) {
    const txt = (hex[1].slice(4).match(/.{4}/g) ?? [])
      .map((h) => String.fromCharCode(parseInt(h, 16))).join('');
    say(key.toLowerCase(), `${txt}  (UTF-16 hex string)`);
  } else say(key.toLowerCase(), '(absent)');
}
const ver = s.match(/%PDF-(\d\.\d)/);
say('version', ver ? ver[1] : '?');

for (const box of ['MediaBox', 'CropBox', 'TrimBox', 'BleedBox', 'ArtBox']) {
  const m = [...s.matchAll(new RegExp(`/${box}\\s*\\[([^\\]]*)\\]`, 'g'))];
  if (!m.length) { say(box, 'absent'); continue; }
  const vals = [...new Set(m.map((x) => x[1].trim().split(/\s+/).map(Number)))].slice(0, 2);
  say(box, m.map((x) => {
    const n = x[1].trim().split(/\s+/).map(Number);
    return `[${n.join(' ')}] = ${((n[2] - n[0]) / 72).toFixed(2)}×${((n[3] - n[1]) / 72).toFixed(2)}in`;
  }).slice(0, 3).join('  ') + (m.length > 3 ? ` … ${m.length} total` : ''));
  void vals;
}

const filters = {};
for (const m of s.matchAll(/\/Filter\s*\/(\w+)/g)) filters[m[1]] = (filters[m[1]] ?? 0) + 1;
for (const m of s.matchAll(/\/Filter\s*\[\s*\/(\w+)/g)) filters[m[1]] = (filters[m[1]] ?? 0) + 1;
say('stream filters', Object.entries(filters).map(([k, v]) => `${k}×${v}`).join(', ') || 'none');
say('images', String((s.match(/\/Subtype\s*\/Image/g) ?? []).length));
say('soft masks', String((s.match(/\/SMask/g) ?? []).length));
say('transparency groups', String((s.match(/\/Group\s*<</g) ?? []).length));
say('ExtGState', String((s.match(/\/ExtGState/g) ?? []).length));
say('fonts embedded', /\/FontFile[23]?/.test(s) ? 'yes' : (/\/Font/.test(s) ? 'NO — fonts referenced but not embedded' : 'no fonts'));
say('separation/spot', String((s.match(/\/Separation/g) ?? []).length));
say('objects', String((s.match(/\d+ \d+ obj/g) ?? []).length));
say('%%EOF', s.trimEnd().endsWith('%%EOF') ? 'present' : 'MISSING');

const w = Math.max(...out.map(([k]) => k.length));
for (const [k, v] of out) console.log(k.padEnd(w), ' ', v);
