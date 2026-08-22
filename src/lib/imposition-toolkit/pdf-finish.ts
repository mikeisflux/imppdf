/* Final pass over every PDF this app hands out, so the files are built the way
   Adobe builds them rather than the way a JavaScript PDF library defaults to.

   WHY. A Photoshop PDF and our export of the same artwork were compared object
   by object. Everything matched — page boxes, image data, cross-reference,
   linearisation — except one thing: Photoshop carries a THUMBNAIL and we did
   not. That is ~46KB of base64 JPEG in the XMP packet, and it is what makes a
   preview appear: in the Fiery's job list, in Explorer, in Finder, in any
   spooler that shows the operator what they are about to run. Without it the
   job is a blank rectangle and nobody can tell one file from the next.

   Two mechanisms exist and this writes BOTH, because different software looks
   in different places:

     /Thumb   the PDF specification's own per-page thumbnail (ISO 32000 12.3.4),
              which is what Acrobat and most RIPs read.
     XMP      xmp:Thumbnails with a base64 JPEG, which is what Photoshop writes
              and what several asset browsers read.

   The rest is plain conservatism, all measured against the Adobe file:

     no object streams — pdf-lib defaults to compressing every object into an
              ObjStm behind an xref STREAM, which is PDF 1.5+. Adobe wrote a
              classic xref table with each object directly addressable. Older
              controllers read the classic form and some cannot read the other.
     version  1.4 to match, raised to 1.5 only if the file genuinely uses
              optional content, because claiming 1.4 for a file with layers in
              it would be a lie the parser catches.
     /ID      a file identifier, which pdf-lib omits and which spoolers key on
              to tell two versions of a job apart.
     Info     Producer/Creator/dates, so the job is attributable on the box. */

import type { PDFDocument } from 'pdf-lib';

export interface FinishOptions {
  /** Shown as the PDF's Creator. The tool that built the layout. */
  creator?: string;
  /** Thumbnails cost a render each; beyond this many pages only page 1 gets
   *  one, which is all a spooler shows anyway. */
  maxThumbPages?: number;
  /** Longest side of a thumbnail, in pixels. Acrobat's own are ~106. */
  thumbPx?: number;
  /** Skip rasterising (no canvas available, or the caller does not want it). */
  noThumbnails?: boolean;
}

const PRODUCER = 'ImpositionPDF';

/** Render each page small, for /Thumb and for the XMP packet. Returns PNG bytes
 *  per page index. Empty when there is no canvas to draw on — the rest of the
 *  finishing still applies, so a headless caller loses previews and nothing else. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function renderThumbs(bytes: Uint8Array, maxPages: number, px: number): Promise<Map<number, Uint8Array>> {
  const out = new Map<number, Uint8Array>();
  try {
    if (typeof document === 'undefined' && typeof OffscreenCanvas === 'undefined') return out;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjs: any = await import('pdfjs-dist');
    try { pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default; } catch { /* bundler resolves worker */ }
    const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    const n = Math.min(doc.numPages, Math.max(1, maxPages));
    for (let i = 1; i <= n; i++) {
      const pg = await doc.getPage(i);
      const v1 = pg.getViewport({ scale: 1 });
      const scale = Math.min(px / v1.width, px / v1.height);
      const vp = pg.getViewport({ scale });
      const w = Math.max(1, Math.ceil(vp.width)), h = Math.max(1, Math.ceil(vp.height));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c: any = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h)
        : Object.assign(document.createElement('canvas'), { width: w, height: h });
      const ctx = c.getContext('2d');
      // A thumbnail is a PREVIEW, so it is composited on white: a transparent
      // one shows as a black rectangle in most job lists.
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      await pg.render({ canvasContext: ctx, viewport: vp }).promise;
      const blob: Blob = c.convertToBlob ? await c.convertToBlob({ type: 'image/png' })
        : await new Promise((res) => c.toBlob(res, 'image/png'));
      out.set(i - 1, new Uint8Array(await blob.arrayBuffer()));
    }
  } catch { /* previews are a nicety; never fail an export over one */ }
  return out;
}

function base64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(s);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).Buffer.from(bytes).toString('base64');
}

function xmpPacket(o: {
  creator: string; title: string; created: string; modified: string;
  thumb?: { b64: string; w: number; h: number };
}): string {
  const t = o.thumb ? `
    <xmp:Thumbnails>
     <rdf:Alt>
      <rdf:li rdf:parseType="Resource">
       <xmpGImg:format>JPEG</xmpGImg:format>
       <xmpGImg:width>${o.thumb.w}</xmpGImg:width>
       <xmpGImg:height>${o.thumb.h}</xmpGImg:height>
       <xmpGImg:image>${o.thumb.b64}</xmpGImg:image>
      </rdf:li>
     </rdf:Alt>
    </xmp:Thumbnails>` : '';
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:xmpGImg="http://ns.adobe.com/xap/1.0/g/img/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
   <xmp:CreatorTool>${o.creator}</xmp:CreatorTool>
   <xmp:CreateDate>${o.created}</xmp:CreateDate>
   <xmp:ModifyDate>${o.modified}</xmp:ModifyDate>
   <pdf:Producer>${PRODUCER}</pdf:Producer>
   <dc:format>application/pdf</dc:format>${t}
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-`
  + `${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:`
  + `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

/** Add a file identifier and pin the header version. Both are byte edits on the
 *  saved file because pdf-lib exposes neither, and both are done in a way that
 *  cannot move any offset the cross-reference table already recorded:
 *  the version is the same width, and the trailer sits AFTER the xref. */
function patchBytes(bytes: Uint8Array, usesLayers: boolean): Uint8Array {
  /* BYTES ONLY — never round-trip a PDF through a string.
     `new TextDecoder('latin1')` is an alias for WINDOWS-1252, not ISO-8859-1:
     bytes 0x80–0x9F decode to different code points (0x80 becomes U+20AC), so
     encoding back gives different bytes. Every FlateDecode stream containing
     one of those 32 values comes out corrupt, and the symptom is a PDF that
     opens to a blank page — which is exactly what this did before. */
  const ascii = (t: string) => Uint8Array.from(t, (c) => c.charCodeAt(0));
  const find = (hay: Uint8Array, needle: Uint8Array, from = 0) => {
    outer: for (let i = from; i <= hay.length - needle.length; i++) {
      for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
      return i;
    }
    return -1;
  };

  // "%PDF-1.7" -> "%PDF-1.4": in place, same width, so every recorded offset holds.
  if (bytes[0] === 0x25 && bytes[1] === 0x50) {
    const v = ascii(usesLayers ? '1.5' : '1.4');
    bytes[5] = v[0]!; bytes[6] = v[1]!; bytes[7] = v[2]!;
  }

  // /ID goes into the trailer dictionary, which sits AFTER the xref table, so
  // adding bytes there moves nothing the table points at.
  if (find(bytes, ascii('/ID')) === -1) {
    const at = find(bytes, ascii('trailer'));
    if (at >= 0) {
      const open = find(bytes, ascii('<<'), at);
      if (open >= 0) {
        const hex = () => Array.from({ length: 16 },
          () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('').toUpperCase();
        const ins = ascii(`/ID [<${hex()}> <${hex()}>]`);
        const out = new Uint8Array(bytes.length + ins.length);
        out.set(bytes.subarray(0, open + 2), 0);
        out.set(ins, open + 2);
        out.set(bytes.subarray(open + 2), open + 2 + ins.length);
        return out;
      }
    }
  }
  return bytes;
}

/** Finish a PDF for delivery. Safe to call on anything: if a step cannot be
 *  done (no canvas for thumbnails, an unusual document) the file still comes
 *  back, just without that one addition. */
export async function finalizePdfForExport(
  bytes: Uint8Array, opts: FinishOptions = {},
): Promise<Uint8Array> {
  const { PDFDocument, PDFName, PDFRawStream, PDFDict, PDFString } = await import('pdf-lib');
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  } catch { return bytes; }

  const creator = opts.creator || doc.getCreator() || PRODUCER;
  const now = new Date();
  try {
    const created = doc.getCreationDate() ?? now;
    doc.setProducer(PRODUCER);
    doc.setCreator(creator);
    doc.setCreationDate(created);
    doc.setModificationDate(now);
    /* pdf-lib writes these as UTF-16 hex strings (<FEFF00490…>). Legal, but
       Adobe writes plain literal strings and some older job tickets show the
       hex form verbatim in the operator's job list. Rewrite the ASCII-safe
       ones in place — same dictionary, same objects, just the literal form. */
    const info = doc.context.lookup(doc.context.trailerInfo.Info);
    if (info instanceof PDFDict) {
      for (const [key, val] of [['Producer', PRODUCER], ['Creator', creator]] as const) {
        // eslint-disable-next-line no-control-regex
        if (/^[\x20-\x7e]*$/.test(val)) info.set(PDFName.of(key), PDFString.of(val));
      }
      info.set(PDFName.of('CreationDate'), PDFString.fromDate(created));
      info.set(PDFName.of('ModDate'), PDFString.fromDate(now));
    }
  } catch { /* an odd Info dict is not worth failing an export over */ }

  const pages = doc.getPages();
  const thumbs = opts.noThumbnails ? new Map<number, Uint8Array>()
    : await renderThumbs(bytes, Math.min(pages.length, opts.maxThumbPages ?? 32), opts.thumbPx ?? 128);

  // /Thumb — the PDF specification's own per-page preview.
  let firstThumb: { b64: string; w: number; h: number } | undefined;
  for (const [idx, png] of thumbs) {
    const page = pages[idx];
    if (!page) continue;
    try {
      const img = await doc.embedPng(png);
      /* A thumbnail image XObject must NOT carry /Type /XObject per 12.3.4 —
         it is referenced from /Thumb, not from a resource dictionary. Acrobat
         tolerates it; some RIPs do not, and then no preview appears at all. */
      const ref = img.ref;
      const stream = doc.context.lookup(ref);
      if (stream instanceof PDFRawStream || stream instanceof PDFDict) {
        const d = stream instanceof PDFRawStream ? stream.dict : stream;
        d.delete(PDFName.of('Type'));
        d.delete(PDFName.of('Name'));
      }
      page.node.set(PDFName.of('Thumb'), ref);
      if (idx === 0) firstThumb = { b64: base64(png), w: img.width, h: img.height };
    } catch { /* skip this page's preview */ }
  }

  // XMP — where Photoshop puts its thumbnail, and where asset browsers look.
  try {
    const xmp = xmpPacket({
      creator, title: doc.getTitle() || '', created: iso(doc.getCreationDate() ?? now),
      modified: iso(now), thumb: firstThumb,
    });
    const stream = doc.context.stream(xmp, {
      Type: PDFName.of('Metadata'), Subtype: PDFName.of('XML'),
    });
    doc.catalog.set(PDFName.of('Metadata'), doc.context.register(stream));
  } catch { /* metadata is additive; never fatal */ }

  const usesLayers = !!doc.catalog.get(PDFName.of('OCProperties'));
  /* useObjectStreams FALSE is the important one. pdf-lib's default packs every
     object into a compressed ObjStm behind an xref stream — PDF 1.5+, and not
     what Adobe writes. Classic xref, plain objects, same as the reference file. */
  const saved = await doc.save({ useObjectStreams: false, addDefaultPage: false });
  return patchBytes(saved, usesLayers);
}
