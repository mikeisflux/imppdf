// Preflight — standard prepress checks on the source PDF, surfaced in the
// Preflight tool. Covers the common Ghent-Workgroup / PDF-X style checks that
// are detectable in-browser: encryption, empty doc, page-box/bleed, mixed sizes,
// trim-size sanity, binding page-count, and low-resolution (DPI) images.

import { PDFArray, PDFDict, PDFName, PDFRawStream, PDFStream, type PDFDocument, type PDFObject } from 'pdf-lib';

export type PreflightLevel = 'error' | 'warning' | 'pass';
export interface PreflightFinding { level: PreflightLevel; title: string; detail: string; }

const PT = 72;
const STD: [string, number, number][] = [
  ['Letter', 8.5, 11], ['Legal', 8.5, 14], ['Tabloid', 11, 17], ['A6', 4.13, 5.83],
  ['A5', 5.83, 8.27], ['A4', 8.27, 11.69], ['A3', 11.69, 16.54], ['SRA3', 12.6, 17.72],
  ['Business card', 3.5, 2], ['Postcard', 6, 4],
];
function nearStd(wIn: number, hIn: number): string | null {
  for (const [name, w, h] of STD) {
    const m = (a: number, b: number) => Math.abs(a - b) < 0.06;
    if ((m(wIn, w) && m(hIn, h)) || (m(wIn, h) && m(hIn, w))) return name;
  }
  return null;
}

export async function runPreflight(
  bytes: Uint8Array,
  pageSizes: { wPt: number; hPt: number }[] = [],
  pageCount = pageSizes.length,
): Promise<PreflightFinding[]> {
  const out: PreflightFinding[] = [];
  const { PDFDocument } = await import('pdf-lib');

  // 1. Encryption — blocks most prepress workflows.
  try {
    await PDFDocument.load(bytes.slice());
  } catch {
    out.push({ level: 'error', title: 'Encrypted PDF', detail: 'The file is password-protected/encrypted. Decrypt it (PDF Tools → Decrypt) before imposing.' });
  }

  const doc = await PDFDocument.load(bytes.slice(), { ignoreEncryption: true }).catch(() => null);
  const pages = doc?.getPages() ?? [];
  const n = pageCount || pages.length;

  // 2. Empty document.
  if (n === 0) { out.push({ level: 'error', title: 'No pages', detail: 'The document contains no pages.' }); return out; }

  // 3. Mixed page sizes.
  const sizes = (pageSizes.length ? pageSizes : pages.map((p) => { const s = p.getSize(); return { wPt: s.width, hPt: s.height }; }));
  const key = (z: { wPt: number; hPt: number }) => `${Math.round(z.wPt)}×${Math.round(z.hPt)}`;
  const uniq = new Set(sizes.map(key));
  if (uniq.size > 1) out.push({ level: 'warning', title: 'Mixed page sizes', detail: `${uniq.size} different page sizes detected — imposition assumes a consistent trim size.` });
  else out.push({ level: 'pass', title: 'Consistent page size', detail: 'All pages share one trim size.' });

  // 4. Trim-size sanity + tiny/huge pages.
  const first = sizes[0]!;
  const wIn = first.wPt / PT, hIn = first.hPt / PT;
  const std = nearStd(wIn, hIn);
  if (wIn < 0.5 || hIn < 0.5) out.push({ level: 'warning', title: 'Very small page', detail: `Page is ${wIn.toFixed(2)}×${hIn.toFixed(2)}" — check the units of your source file.` });
  else if (wIn > 60 || hIn > 60) out.push({ level: 'warning', title: 'Very large page', detail: `Page is ${wIn.toFixed(1)}×${hIn.toFixed(1)}" — confirm this is intentional (large-format).` });
  else out.push({ level: 'pass', title: `Trim ${wIn.toFixed(2)}×${hIn.toFixed(2)}"${std ? ` (${std})` : ''}`, detail: std ? 'Matches a standard size.' : 'Non-standard trim — make sure your press supports it.' });

  // 5. Bleed box — many print jobs need 1/8" bleed.
  try {
    const p0 = pages[0]!;
    const mb = p0.getMediaBox(); const tb = p0.getTrimBox?.() ?? mb;
    const hasBleed = (mb.width - tb.width) > 2 || (mb.height - tb.height) > 2; // >~0.03"
    if (!hasBleed) out.push({ level: 'warning', title: 'No bleed detected', detail: 'The page has no trim/bleed box offset. If artwork runs to the edge, add bleed (BleedMaker) so trimming doesn’t leave white slivers.' });
    else out.push({ level: 'pass', title: 'Bleed present', detail: 'Page defines a bleed area beyond the trim.' });
  } catch { /* box methods vary by pdf-lib version */ }

  // 6. Binding page count.
  if (n % 4 !== 0) out.push({ level: 'warning', title: `Page count ${n} not a multiple of 4`, detail: 'Saddle-stitch and perfect-bound booklets need the page count divisible by 4 — blank pages will be padded.' });
  else out.push({ level: 'pass', title: `Page count ${n} (÷4)`, detail: 'Ready for booklet/perfect-bound imposition.' });

  // 7. Fonts, spot colors and transparency — low-level object scan.
  if (doc) checkFontsAndColor(doc, bytes, out);

  // 8. Low-resolution images (DPI) — best-effort scan via pdf.js.
  await checkImageDpi(bytes, sizes, out);

  // 9. PDF/X-1a readiness summary — aggregate the print-critical checks into a
  // single verdict. PDF/X-1a requires all fonts embedded, CMYK/spot only (no
  // RGB), and no live transparency.
  const blockers: string[] = [];
  if (out.some((f) => /unembedded font/i.test(f.title))) blockers.push('embed all fonts');
  if (out.some((f) => /RGB colour detected/i.test(f.title))) blockers.push('convert RGB to CMYK');
  if (out.some((f) => /transparency/i.test(f.title))) blockers.push('flatten transparency');
  if (blockers.length)
    out.push({ level: 'warning', title: 'Not yet PDF/X-1a ready', detail: `For strict PDF/X-1a output you still need to: ${blockers.join(', ')}.` });
  else
    out.push({ level: 'pass', title: 'Meets PDF/X-1a essentials', detail: 'Fonts embedded, no RGB or live transparency detected — the core PDF/X-1a requirements are satisfied.' });

  return out;
}

// Enumerate every indirect object (pdf-lib decodes object streams on load, so
// this sees objects that a raw byte-scan would miss) and report on the checks a
// prepress operator cares about: unembedded fonts, spot/separation inks, and
// transparency. Also does a coarse RGB-vs-CMYK token scan of the raw bytes.
function checkFontsAndColor(doc: PDFDocument, bytes: Uint8Array, out: PreflightFinding[]) {
  try {
    const nm = (s: string) => PDFName.of(s);
    // PDFName stringifies with a leading slash (e.g. "/Font"); compare the tail.
    const str = (v: unknown) => (v == null ? '' : String(v).replace(/^\//, ''));
    const dictOf = (o: PDFObject): PDFDict | null => {
      if (o instanceof PDFDict) return o;
      if (o instanceof PDFStream || o instanceof PDFRawStream) return o.dict;
      return null;
    };

    let unembedded = 0, standard14 = 0, embedded = 0;
    let spot = 0, deviceN = 0, transparency = false;
    const objs = doc.context.enumerateIndirectObjects();
    for (const [, obj] of objs) {
      // Spot / DeviceN colour spaces are arrays: [/Separation name alt tint] etc.
      if (obj instanceof PDFArray) {
        const head = str(obj.get(0));
        if (head === 'Separation') spot++;
        else if (head === 'DeviceN') deviceN++;
        continue;
      }
      const d = dictOf(obj);
      if (!d) continue;
      const type = str(d.get(nm('Type')));
      if (type === 'FontDescriptor') {
        const has = ['FontFile', 'FontFile2', 'FontFile3'].some((k) => d.get(nm(k)) != null);
        if (has) embedded++; else unembedded++;
      } else if (type === 'Font') {
        const sub = str(d.get(nm('Subtype')));
        // Simple fonts with no descriptor are the base-14 standard fonts.
        if (sub !== 'Type0' && d.get(nm('FontDescriptor')) == null) standard14++;
      }
      // Transparency group (page or form XObject) or a non-trivial soft mask.
      if (str(d.get(nm('S'))) === 'Transparency') transparency = true;
      const sm = d.get(nm('SMask'));
      if (sm != null && str(sm) !== 'None') transparency = true;
    }

    if (unembedded > 0)
      out.push({ level: 'error', title: `${unembedded} unembedded font${unembedded > 1 ? 's' : ''}`, detail: 'Fonts without embedded outlines can reflow or substitute on the RIP. Embed all fonts before printing.' });
    else if (standard14 > 0)
      out.push({ level: 'warning', title: 'Standard (base-14) fonts not embedded', detail: 'Base-14 fonts (Helvetica/Times/Courier…) rely on the RIP’s built-ins. For predictable output, embed them.' });
    else if (embedded > 0)
      out.push({ level: 'pass', title: 'Fonts embedded', detail: 'All detected fonts carry embedded outlines.' });

    if (spot + deviceN > 0)
      out.push({ level: 'warning', title: `${spot + deviceN} spot/separation colour${spot + deviceN > 1 ? 's' : ''}`, detail: 'Separation/DeviceN inks print on their own plates. Confirm the spot colours are intended, or convert to process (CMYK).' });

    if (transparency)
      out.push({ level: 'warning', title: 'Live transparency present', detail: 'Transparency/soft masks can render inconsistently on older RIPs. Flatten to PDF/X-1a if your printer requires it.' });

    // Coarse colour-space hint from raw tokens (image XObject dicts are usually
    // not inside object streams, so these tokens survive a byte-scan). Skipped
    // for very large files to bound memory.
    if (bytes.length < 40 * 1024 * 1024) {
      const txt = new TextDecoder('latin1').decode(bytes);
      const hasCMYK = txt.includes('/DeviceCMYK');
      const hasRGB = txt.includes('/DeviceRGB');
      if (hasRGB && !hasCMYK)
        out.push({ level: 'warning', title: 'RGB colour detected', detail: 'The file appears to use RGB. Most offset/digital presses expect CMYK — colours may shift on conversion. Supply CMYK artwork for accurate colour.' });
      else if (hasCMYK && !hasRGB)
        out.push({ level: 'pass', title: 'CMYK colour', detail: 'File uses process (CMYK) colour — press-ready.' });
    }
  } catch { /* low-level scan is best-effort */ }
}

async function checkImageDpi(bytes: Uint8Array, sizes: { wPt: number; hPt: number }[], out: PreflightFinding[]) {
  if (typeof document === 'undefined') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjs: any = await import('pdfjs-dist');
    try { pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default; } catch { /* bundler */ }
    const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    let minDpi = Infinity, sampled = 0;
    const pages = Math.min(pdf.numPages, 8); // sample first few pages
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const ops = await page.getOperatorList();
      const OPS = pdfjs.OPS;
      const pageWIn = (sizes[i - 1]?.wPt ?? page.getViewport({ scale: 1 }).width) / PT;
      for (let k = 0; k < ops.fnArray.length; k++) {
        const fn = ops.fnArray[k];
        if (fn !== OPS.paintImageXObject && fn !== OPS.paintJpegXObject && fn !== OPS.paintImageXObjectRepeat) continue;
        const name = ops.argsArray[k]?.[0];
        let img: { width?: number; height?: number } | undefined;
        try { img = page.objs.get(name); } catch { img = undefined; }
        if (!img?.width) continue;
        // Effective DPI ≈ image pixels across the page width, assuming a full-width placement.
        const dpi = img.width / Math.max(0.1, pageWIn);
        if (dpi < minDpi) minDpi = dpi;
        sampled++;
      }
      try { page.cleanup?.(); } catch { /* noop */ }
    }
    try { pdf.cleanup?.(); pdf.destroy?.(); } catch { /* noop */ }
    if (sampled && isFinite(minDpi)) {
      if (minDpi < 100) out.push({ level: 'error', title: `Low image resolution (~${Math.round(minDpi)} DPI)`, detail: 'Images below ~100 DPI will look pixelated in print. Use 300 DPI artwork.' });
      else if (minDpi < 200) out.push({ level: 'warning', title: `Marginal image resolution (~${Math.round(minDpi)} DPI)`, detail: 'For crisp print, 300 DPI is recommended; below ~200 DPI can look soft.' });
      else out.push({ level: 'pass', title: `Image resolution OK (~${Math.round(minDpi)} DPI)`, detail: 'Raster images are high enough resolution for print.' });
    }
  } catch { /* DPI scan is best-effort */ }
}
