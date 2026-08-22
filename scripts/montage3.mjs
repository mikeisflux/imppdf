import fs from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
const rows = JSON.parse(fs.readFileSync('smoke-out/browser-results.json', 'utf8'));
const tiles = [];
for (const r of rows) for (const [label, file] of r.files ?? []) tiles.push({ r, label, file });
const COLS = 5, CW = 300, CH = 340, PAD = 34;
const c = createCanvas(COLS * CW, Math.ceil(tiles.length / COLS) * CH + PAD);
const x = c.getContext('2d');
x.fillStyle = '#14151a'; x.fillRect(0, 0, c.width, c.height);
x.fillStyle = '#fff'; x.font = 'bold 20px sans-serif';
x.fillText('Browser-only tools — run in real Chromium with the ONNX models', 14, 24);
for (let i = 0; i < tiles.length; i++) {
  const t = tiles[i];
  let img; try { img = await loadImage(`smoke-out/${t.file}`); } catch { continue; }
  const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH + PAD;
  const s = Math.min((CW - 24) / img.width, (CH - 60) / img.height);
  const w = img.width * s, h = img.height * s;
  x.fillStyle = '#3a3d47'; x.fillRect(cx + (CW - w) / 2 - 2, cy + 26 - 2, w + 4, h + 4);
  x.drawImage(img, cx + (CW - w) / 2, cy + 26, w, h);
  x.fillStyle = t.r.ok ? '#7ee787' : '#ff7b72'; x.font = 'bold 13px sans-serif';
  x.fillText(`${t.r.id} — ${t.label}`, cx + 10, cy + 18);
  x.fillStyle = '#9aa0aa'; x.font = '11px sans-serif';
  x.fillText(t.r.meta.slice(0, 40), cx + 10, cy + 26 + h + 15);
}
fs.writeFileSync('smoke-out/browser-montage.png', c.toBuffer('image/png'));
console.log('smoke-out/browser-montage.png', c.width + 'x' + c.height);
