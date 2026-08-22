/* Drive the browser-only tools in real Chromium.

   Six tools cannot be reached from node: they rasterise through a canvas, or
   they load ONNX models, or both. Rather than click through the UI — which
   tests selectors more than it tests imposition — this bundles the REAL engine
   from src/ and runs it inside the browser, where those APIs exist. Same code
   the app ships, same models, same canvas.                                   */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'smoke-out');
const WEB = path.join(OUT, 'browser');
fs.mkdirSync(WEB, { recursive: true });

/* pdfjs asks for its worker with an import ending in `?url`, which is a bundler
   convention esbuild does not know. Point it at the copy served below instead
   of letting the build fail on an import the engine only makes opportunistically. */
const urlSuffixPlugin = {
  name: 'url-suffix',
  setup(build) {
    build.onResolve({ filter: /\?url$/ }, (args) => ({ path: args.path, namespace: 'url-stub' }));
    build.onLoad({ filter: /.*/, namespace: 'url-stub' }, () => ({
      contents: 'export default "/pdf.worker.min.mjs";', loader: 'js',
    }));
  },
};

console.log('bundling the real toolkit for the browser…');
await esbuild.build({
  entryPoints: [path.join(ROOT, 'scripts/browser-smoke-entry.js')],
  bundle: true, format: 'esm', target: 'chrome120', platform: 'browser',
  outfile: path.join(WEB, 'bundle.js'), plugins: [urlSuffixPlugin],
  loader: { '.ts': 'ts', '.wasm': 'file' }, logLevel: 'error',
  define: { 'process.env.NODE_ENV': '"production"' },
});
fs.copyFileSync(path.join(ROOT, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
  path.join(WEB, 'pdf.worker.min.mjs'));
fs.writeFileSync(path.join(WEB, 'index.html'),
  '<!doctype html><meta charset="utf-8"><title>smoke</title>'
  + '<body style="background:#14151a;color:#eee;font:14px sans-serif">'
  + '<p id="s">loading…</p><script type="module" src="/bundle.js"></script>');

// Serve the harness, plus public/ for /models and /ort — the ONNX weights and
// the onnxruntime wasm have to come from the same origin.
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.wasm': 'application/wasm', '.onnx': 'application/octet-stream', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const roots = rel.startsWith('/models/') || rel.startsWith('/ort/')
    ? [path.join(ROOT, 'public')] : [WEB, path.join(ROOT, 'public')];
  for (const root of roots) {
    const f = path.join(root, rel === '/' ? 'index.html' : rel);
    if (!f.startsWith(root)) continue;
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream',
        // onnxruntime-web wants these for threaded wasm.
        'cross-origin-opener-policy': 'same-origin',
        'cross-origin-embedder-policy': 'require-corp' });
      fs.createReadStream(f).pipe(res);
      return;
    }
  }
  res.writeHead(404).end('not found');
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

/* Use the Chromium already on the machine. The installed playwright package
   expects a build number that is not here, and downloading one is blocked —
   pointing at the existing binary is what this environment documents. */
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  for (const dir of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell',
      'chrome-headless-shell-linux64/chrome-headless-shell']) {
      const p = path.join(base, dir, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}
const exe = findChromium();
console.log('chromium:', exe ?? '(playwright default)');
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

console.log(`running in chromium on :${port} …`);
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
await page.waitForFunction('window.smokeReady === true', null, { timeout: 60_000 });
const results = await page.evaluate(() => window.runSmoke(), null);

// Write every returned image out so the plates can be looked at.
for (const r of results) {
  r.files = [];
  for (const [label, dataUrl] of r.images ?? []) {
    const name = `${r.id}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
    fs.writeFileSync(path.join(OUT, name), Buffer.from(dataUrl.split(',')[1], 'base64'));
    r.files.push([label, name]);
  }
  delete r.images;
}

const pad = (v, n) => String(v).padEnd(n);
console.log('');
console.log(pad('tool', 14), pad('ms', 7), pad('detail', 26), 'result');
console.log('-'.repeat(100));
for (const r of results) {
  console.log(pad(r.id, 14), pad(r.ms, 7), pad(r.meta, 26), r.ok ? 'PASS' : 'FAIL');
  if (r.note) for (const line of r.note.split(' · ')) console.log(' '.repeat(23), line);
}
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length}/${results.length} pass`);
if (consoleErrors.length) {
  console.log('\nbrowser console errors:');
  for (const e of [...new Set(consoleErrors)].slice(0, 8)) console.log('  ', e.slice(0, 200));
}
fs.writeFileSync(path.join(OUT, 'browser-results.json'), JSON.stringify(results, null, 2));

await browser.close();
server.close();
process.exit(bad.length ? 1 : 0);
