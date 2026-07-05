// Rasterises each page of a PDF to a small PNG/JPEG data URL so the live
// imposition preview can show the *actual* artwork in each cell instead of a
// coloured numbered placeholder. Browser-only (uses <canvas> + pdf.js).
//
// This is site glue that lives alongside the vendored plugin — it uses the same
// pdf.js worker import the engine uses (`impose.ts`). If the plugin is upgraded,
// keep this file and re-apply the small hooks in `Impose.tsx` (see
// docs/UPGRADING.md).

// pdf.js v6 uses the stage-3 `getOrInsert(Computed)` Map/WeakMap methods, which
// older browsers don't ship yet — polyfill them before pdfjs loads.
function polyfillMapUpsert() {
  for (const proto of [Map.prototype, WeakMap.prototype] as unknown as Record<string, unknown>[]) {
    if (!proto.getOrInsert) {
      Object.defineProperty(proto, 'getOrInsert', {
        value(this: Map<unknown, unknown>, k: unknown, v: unknown) { if (!this.has(k)) this.set(k, v); return this.get(k); },
        configurable: true, writable: true,
      });
    }
    if (!proto.getOrInsertComputed) {
      Object.defineProperty(proto, 'getOrInsertComputed', {
        value(this: Map<unknown, unknown>, k: unknown, f: (k: unknown) => unknown) { if (!this.has(k)) this.set(k, f(k)); return this.get(k); },
        configurable: true, writable: true,
      });
    }
  }
}

const thumbCache = new WeakMap<Uint8Array, string[]>();

export interface RenderedSheet { url: string; wPt: number; hPt: number; }

// Rasterise the pages of a (usually imposed) PDF for the live preview canvas.
// `maxPx` bounds the longest edge; `maxPages` bounds how many sheets render;
// `fillWhite=false` keeps transparency (PNG) for the fill-background toggle.
export async function rasterizePdfSheets(
  bytes: Uint8Array,
  opts: { maxPx?: number; maxPages?: number; fillWhite?: boolean } = {},
): Promise<{ sheets: RenderedSheet[]; total: number }> {
  if (typeof document === 'undefined') return { sheets: [], total: 0 };
  // Render at the display's pixel density so the on-screen preview stays crisp
  // on HiDPI/Retina screens instead of being upscaled from a 1× raster.
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
  const maxPx = (opts.maxPx ?? 1200) * dpr;
  const fillWhite = opts.fillWhite !== false;
  polyfillMapUpsert();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import('pdfjs-dist');
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  } catch { /* bundler resolves the worker */ }
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const total = doc.numPages;
  const n = Math.min(total, opts.maxPages ?? total);
  const sheets: RenderedSheet[] = [];
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(maxPx / Math.max(base.width, base.height), 4);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(vp.width));
    canvas.height = Math.max(1, Math.ceil(vp.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (fillWhite) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    sheets.push({
      url: fillWhite ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png'),
      wPt: base.width, hPt: base.height,
    });
  }
  try { doc.cleanup?.(); doc.destroy?.(); } catch { /* best effort */ }
  return { sheets, total };
}

export async function rasterizePdfThumbs(bytes: Uint8Array, maxPx = 340): Promise<string[]> {
  if (typeof document === 'undefined') return [];
  const cached = thumbCache.get(bytes);
  if (cached) return cached;
  try {
    polyfillMapUpsert();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjs: any = await import('pdfjs-dist');
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    } catch { /* bundler resolves the worker */ }
    const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    const out: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
      const scale = Math.min((maxPx * dpr) / Math.max(base.width, base.height), 3);
      const vp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(vp.width));
      canvas.height = Math.max(1, Math.ceil(vp.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) { out.push(''); continue; }
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      out.push(canvas.toDataURL('image/jpeg', 0.85));
    }
    try { doc.cleanup?.(); doc.destroy?.(); } catch { /* best effort */ }
    thumbCache.set(bytes, out);
    return out;
  } catch {
    return [];
  }
}
