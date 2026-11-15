/* Flatten for Print — render every page exactly as a viewer shows it and write
 * it back as ONE flat image per page, page boxes carried over.
 *
 * Why this exists: a client delivered a 48-page comic interior as a flipbook
 * export — every page a transparency group under a 74 dpi raster soft mask
 * with a clipping group inside. Affinity Publisher imported each page as
 * Group > Mask > Group > Clipping Mask > text > image and from page 12 on drew
 * the mask as solid white in front of the art. Acrobat's flattener and a
 * PDF/X-1a save still left the groups. Placing as Passthrough works but is a
 * page-by-page job on a book.
 *
 * Rasterizing is the one route that cannot leave anything behind: pdf.js
 * composites the soft masks, groups and blend modes the way Acrobat does, and
 * the output page holds a single opaque image. No /SMask, no /Group, no /BM,
 * no form XObjects, no fonts. `inspectTransparency` counts what a file
 * carries before and after, and the acceptance test is zero after.
 *
 * Resolution is the file's (300 dpi default; 450/600 for lettering-heavy
 * pages). Color is the viewer's sRGB; the RIP converts, as it does for any
 * RGB image. JPEG at quality 92 is the default (a comic interior at 300 dpi is
 * ~1.5 MB a page); PNG is lossless for line art.                           */

export interface FlattenOptions {
  dpi?: number;                      // default 300
  format?: 'jpeg' | 'png';           // default jpeg
  quality?: number;                  // JPEG quality 1-100, default 92
  /** Called after each page; `done` of `total`. */
  onProgress?: (done: number, total: number) => void;
}

export interface TransparencyReport {
  pages: number;
  softMasks: number;          // ExtGState or image /SMask that is not /None
  transparencyGroups: number; // /Group with /S /Transparency (pages and form XObjects)
  blendModes: number;         // /BM other than /Normal or /Compatible
  constantAlpha: number;      // /CA or /ca below 1
  imageMasks: number;         // image /Mask entries (stencil / color-key)
  formXObjects: number;       // nested form XObjects (wrapper groups)
  /** Smallest image resolution found, in ppi at the image's own size (not placed size). */
  rasters: number;
  flat: boolean;              // nothing above is present
}

/** Count the transparency features a PDF carries. Pure pdf-lib, runs anywhere. */
export async function inspectTransparency(bytes: Uint8Array): Promise<TransparencyReport> {
  const { PDFDocument, PDFDict, PDFStream, PDFRawStream, PDFName, PDFNumber, PDFArray } = await import('pdf-lib');
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  const nm = (k: string) => PDFName.of(k);
  const str = (o: unknown): string => (o == null ? '' : String((o as { toString(): string }).toString()));
  const r: TransparencyReport = {
    pages: doc.getPageCount(), softMasks: 0, transparencyGroups: 0, blendModes: 0,
    constantAlpha: 0, imageMasks: 0, formXObjects: 0, rasters: 0, flat: true,
  };
  const seen = new Set<unknown>();
  const dictOf = (o: unknown) => {
    if (o instanceof PDFDict) return o;
    if (o instanceof PDFStream || o instanceof PDFRawStream) return (o as { dict: typeof PDFDict.prototype }).dict;
    return null;
  };
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    const d = dictOf(obj);
    if (!d || seen.has(d)) continue;
    seen.add(d);
    const sub = str(d.get(nm('Subtype')));
    if (sub === '/Image') r.rasters++;
    if (sub === '/Form') r.formXObjects++;
    const grp = d.get(nm('Group'));
    const gd = grp instanceof PDFDict ? grp : (grp ? dictOf(doc.context.lookup(grp)) : null);
    if (gd && str(gd.get(nm('S'))) === '/Transparency') r.transparencyGroups++;
    const sm = d.get(nm('SMask'));
    if (sm != null && str(sm) !== '/None') r.softMasks++;
    if (sub === '/Image' && d.get(nm('Mask')) != null) r.imageMasks++;
    const bm = d.get(nm('BM'));
    if (bm != null) {
      const v = bm instanceof PDFArray ? str(bm.get(0)) : str(bm);
      if (v !== '/Normal' && v !== '/Compatible') r.blendModes++;
    }
    for (const k of ['CA', 'ca']) {
      const a = d.get(nm(k));
      if (a instanceof PDFNumber && a.asNumber() < 1) r.constantAlpha++;
    }
  }
  r.flat = r.softMasks + r.transparencyGroups + r.blendModes + r.constantAlpha + r.imageMasks + r.formXObjects === 0;
  return r;
}

/** Page boxes of one source page relative to its CropBox (what a viewer shows),
 *  in the viewer's orientation. Null boxes mean "same as the page". */
export function relativeBoxes(
  media: { x: number; y: number; width: number; height: number },
  crop: { x: number; y: number; width: number; height: number },
  trim: { x: number; y: number; width: number; height: number } | null,
  bleed: { x: number; y: number; width: number; height: number } | null,
  rotate: number,
): { w: number; h: number; trim: [number, number, number, number] | null; bleed: [number, number, number, number] | null } {
  const rot = ((Math.round(rotate / 90) * 90) % 360 + 360) % 360;
  const turned = rot === 90 || rot === 270;
  const w = turned ? crop.height : crop.width, h = turned ? crop.width : crop.height;
  // A box as [x0 y0 x1 y1] in the output page's coordinates, clamped to it.
  const map = (b: { x: number; y: number; width: number; height: number } | null): [number, number, number, number] | null => {
    if (!b) return null;
    // Source coordinates relative to the crop origin.
    let x0 = b.x - crop.x, y0 = b.y - crop.y, x1 = x0 + b.width, y1 = y0 + b.height;
    // Rotate into the viewer's frame: /Rotate 90 turns the page clockwise.
    if (rot === 90) { [x0, y0, x1, y1] = [crop.height - y1, x0, crop.height - y0, x1]; }
    else if (rot === 180) { [x0, y0, x1, y1] = [crop.width - x1, crop.height - y1, crop.width - x0, crop.height - y0]; }
    else if (rot === 270) { [x0, y0, x1, y1] = [y0, crop.width - x1, y1, crop.width - x0]; }
    const c = (v: number, hi: number) => Math.max(0, Math.min(hi, v));
    const out: [number, number, number, number] = [c(x0, w), c(y0, h), c(x1, w), c(y1, h)];
    if (out[2] - out[0] < 1 || out[3] - out[1] < 1) return null;
    // Identical to the page → not worth stating.
    if (Math.abs(out[0]) < 0.01 && Math.abs(out[1]) < 0.01 && Math.abs(out[2] - w) < 0.01 && Math.abs(out[3] - h) < 0.01) return null;
    return out;
  };
  void media;
  return { w, h, trim: map(trim), bleed: map(bleed) };
}

/** Render every page flat and rebuild the PDF as one image per page. Browser only
 *  (pdf.js + canvas); in any other runtime the input is returned unchanged. */
export async function flattenPdf(bytes: Uint8Array, opts: FlattenOptions = {}): Promise<Uint8Array> {
  const dpi = Math.max(36, Math.min(1200, opts.dpi ?? 300));
  const format = opts.format ?? 'jpeg';
  const quality = Math.max(0.3, Math.min(1, (opts.quality ?? 92) / 100));
  const hasCanvas = typeof OffscreenCanvas !== 'undefined' || typeof document !== 'undefined';
  if (!hasCanvas) return bytes;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import('pdfjs-dist');
  try { pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default; } catch { /* bundler resolves worker */ }
  const { PDFDocument } = await import('pdf-lib');

  const src = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const out = await PDFDocument.create();
  const total: number = doc.numPages;

  for (let i = 1; i <= total; i++) {
    const pg = await doc.getPage(i);
    const vp1 = pg.getViewport({ scale: 1 });
    const vp = pg.getViewport({ scale: dpi / 72 });
    const w = Math.max(1, Math.round(vp.width)), h = Math.max(1, Math.round(vp.height));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas: any = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement('canvas'), { width: w, height: h });
    const ctx = canvas.getContext('2d');
    // Opaque white paper under everything: a flat page has no alpha.
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    await pg.render({ canvasContext: ctx, viewport: vp, background: '#ffffff', intent: 'print' }).promise;
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const blob: Blob = canvas.convertToBlob
      ? await canvas.convertToBlob({ type: mime, quality })
      : await new Promise<Blob>((res) => canvas.toBlob(res, mime, quality));
    const img = new Uint8Array(await blob.arrayBuffer());
    const emb = format === 'png' ? await out.embedPng(img) : await out.embedJpg(img);

    // Page boxes: the output page is the viewer's page (CropBox, rotated); the
    // trim and bleed come across relative to it.
    const sp = src.getPage(i - 1);
    let trim: ReturnType<typeof sp.getTrimBox> | null = null, bleed: ReturnType<typeof sp.getBleedBox> | null = null;
    try { trim = sp.getTrimBox(); } catch { trim = null; }
    try { bleed = sp.getBleedBox(); } catch { bleed = null; }
    const media = sp.getMediaBox();
    let crop = media; try { crop = sp.getCropBox(); } catch { crop = media; }
    let rotate = 0; try { rotate = sp.getRotation().angle; } catch { rotate = 0; }
    const rb = relativeBoxes(media, crop, trim, bleed, rotate);
    const page = out.addPage([vp1.width, vp1.height]);
    page.drawImage(emb, { x: 0, y: 0, width: vp1.width, height: vp1.height });
    if (rb.trim) page.setTrimBox(rb.trim[0], rb.trim[1], rb.trim[2] - rb.trim[0], rb.trim[3] - rb.trim[1]);
    if (rb.bleed) page.setBleedBox(rb.bleed[0], rb.bleed[1], rb.bleed[2] - rb.bleed[0], rb.bleed[3] - rb.bleed[1]);
    try { pg.cleanup(); } catch { /* ignore */ }
    opts.onProgress?.(i, total);
  }
  try { await doc.destroy(); } catch { /* ignore */ }
  out.setProducer('ImpositionPDF Flatten for Print');
  return out.save({ useObjectStreams: false });
}
