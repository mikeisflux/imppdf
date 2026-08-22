/* Validate a PDF's cross-reference table against the actual object positions.

   This is the failure a viewer hides from you. Acrobat, Preview and Photoshop
   all silently rebuild a broken xref by scanning the file, so a damaged table
   opens fine on a desk and is rejected by a RIP, which trusts the table. */
import fs from 'node:fs';
const buf = fs.readFileSync(process.argv[2]);
const s = buf.toString('latin1');

const startxref = s.lastIndexOf('startxref');
if (startxref < 0) { console.log('no startxref — file is not usable'); process.exit(1); }
const start = parseInt(s.slice(startxref + 9).trim(), 10);
console.log('startxref points to byte', start, buf.length > start ? '(in range)' : '(PAST END OF FILE)');

let bad = 0, checked = 0, freeCount = 0;
const walk = (at, seen = new Set()) => {
  if (at == null || seen.has(at) || at < 0 || at >= buf.length) return;
  seen.add(at);
  if (s.slice(at, at + 4) !== 'xref') {
    console.log(`  section at ${at}: not a classic "xref" keyword (found "${s.slice(at, at + 12).replace(/\n/g, '\\n')}")`);
    return;
  }
  let p = at + 4;
  for (;;) {
    const m = /^\s*(\d+)\s+(\d+)\s*/.exec(s.slice(p, p + 40));
    if (!m) break;
    const first = +m[1], count = +m[2];
    p += m[0].length;
    for (let i = 0; i < count; i++) {
      const entry = s.slice(p, p + 20);
      const em = /^(\d{10}) (\d{5}) ([nf])/.exec(entry);
      if (!em) { console.log(`  malformed entry at ${p}`); bad++; break; }
      p += 20;
      if (em[3] === 'f') { freeCount++; continue; }
      const off = +em[1], num = first + i;
      checked++;
      const there = s.slice(off, off + 24);
      const ok = new RegExp(`^\\s*${num}\\s+\\d+\\s+obj`).test(there);
      if (!ok) {
        bad++;
        if (bad <= 5) console.log(`  obj ${num}: table says byte ${off}, but that is "${there.slice(0, 20).replace(/\n/g, '\\n')}"`);
      }
    }
  }
  const tail = s.slice(p, p + 800);
  const prev = /\/Prev\s+(\d+)/.exec(tail);
  if (prev) walk(+prev[1], seen);
};
walk(start);

console.log(`checked ${checked} in-use entries, ${freeCount} free`);
console.log(bad ? `${bad} ENTRY/ENTRIES POINT AT THE WRONG PLACE — a RIP that trusts the table will fail here`
  : 'every xref entry lands exactly on its object');
process.exit(bad ? 1 : 0);
