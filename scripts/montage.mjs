import fs from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
const rows = JSON.parse(fs.readFileSync('smoke-out/gang-results.json', 'utf8'));
const COLS = 6, CW = 300, CH = 330, PAD = 34;
const c = createCanvas(COLS * CW, Math.ceil(rows.length / COLS) * CH + PAD);
const x = c.getContext('2d');
x.fillStyle = '#14151a'; x.fillRect(0, 0, c.width, c.height);
x.fillStyle = '#fff'; x.font = 'bold 20px sans-serif';
x.fillText('Gang tools — items counted from the rendered sheet', 14, 24);
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  const img = await loadImage(`smoke-out/${r.id}.png`);
  const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH + PAD;
  const s = Math.min((CW - 24) / img.width, (CH - 56) / img.height);
  const w = img.width * s, h = img.height * s;
  x.fillStyle = '#fff';
  x.fillRect(cx + (CW - w) / 2 - 2, cy + 26 - 2, w + 4, h + 4);
  x.drawImage(img, cx + (CW - w) / 2, cy + 26, w, h);
  x.fillStyle = r.ok === 'PASS' ? '#7ee787' : '#ff7b72';
  x.font = 'bold 14px sans-serif';
  x.fillText(`${r.id}  ${r.measured}-up  ${r.grid}${r.rotated ? ' rot' : ''}`, cx + 10, cy + 18);
  x.fillStyle = '#9aa0aa'; x.font = '12px sans-serif';
  x.fillText(`${r.sheet}"`, cx + 10, cy + 26 + h + 16);
}
fs.writeFileSync('smoke-out/gang-montage.png', c.toBuffer('image/png'));
console.log('smoke-out/gang-montage.png', c.width + 'x' + c.height);
