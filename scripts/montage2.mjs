import fs from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
const rows = JSON.parse(fs.readFileSync('smoke-out/all-results.json', 'utf8'));
const pick = process.argv[2] ? process.argv[2].split(',') : null;
const use = pick ? rows.filter((r) => pick.includes(r.id)) : rows;
const COLS = Math.min(6, use.length), CW = 300, CH = 320, PAD = 34;
const c = createCanvas(COLS * CW, Math.ceil(use.length / COLS) * CH + PAD);
const x = c.getContext('2d');
x.fillStyle = '#14151a'; x.fillRect(0, 0, c.width, c.height);
x.fillStyle = '#fff'; x.font = 'bold 20px sans-serif';
x.fillText(process.argv[3] || 'Smoke test — page 1 of each output', 14, 24);
for (let i = 0; i < use.length; i++) {
  const r = use[i];
  let img; try { img = await loadImage(`smoke-out/${r.id}.png`); } catch { continue; }
  const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH + PAD;
  const s = Math.min((CW - 24) / img.width, (CH - 56) / img.height);
  const w = img.width * s, h = img.height * s;
  x.fillStyle = '#fff'; x.fillRect(cx + (CW - w) / 2 - 2, cy + 26 - 2, w + 4, h + 4);
  x.drawImage(img, cx + (CW - w) / 2, cy + 26, w, h);
  x.fillStyle = r.status === 'PASS' ? '#7ee787' : '#ff7b72';
  x.font = 'bold 14px sans-serif';
  x.fillText(`${r.id}  ${r.pages}pp  ${r.items} item${r.items === 1 ? '' : 's'}`, cx + 10, cy + 18);
  x.fillStyle = '#9aa0aa'; x.font = '12px sans-serif';
  x.fillText(`${r.sheet}"`, cx + 10, cy + 26 + h + 16);
}
const out = process.argv[4] || 'smoke-out/montage2.png';
fs.writeFileSync(out, c.toBuffer('image/png'));
console.log(out, c.width + 'x' + c.height);
