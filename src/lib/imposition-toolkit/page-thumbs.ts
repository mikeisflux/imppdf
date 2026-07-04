// Rasterises each page of a PDF to a small PNG/JPEG data URL so the live
// imposition preview can show the *actual* artwork in each cell instead of a
// coloured numbered placeholder. Browser-only (uses <canvas> + pdf.js).
//
// This is site glue that lives alongside the vendored plugin — it uses the same
// pdf.js worker import the engine uses (`impose.ts`). If the plugin is upgraded,
// keep this file and re-apply the small hooks in `Impose.tsx` (see
// docs/UPGRADING.md).

const thumbCache = new WeakMap<Uint8Array, string[]>();

export async function rasterizePdfThumbs(bytes: Uint8Array, maxPx = 340): Promise<string[]> {
  if (typeof document === 'undefined') return [];
  const cached = thumbCache.get(bytes);
  if (cached) return cached;
  try {
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
      const scale = Math.min(maxPx / Math.max(base.width, base.height), 2);
      const vp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(vp.width));
      canvas.height = Math.max(1, Math.ceil(vp.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) { out.push(''); continue; }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      out.push(canvas.toDataURL('image/jpeg', 0.72));
    }
    try { doc.cleanup?.(); doc.destroy?.(); } catch { /* best effort */ }
    thumbCache.set(bytes, out);
    return out;
  } catch {
    return [];
  }
}
