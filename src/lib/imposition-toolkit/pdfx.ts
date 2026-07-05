// PDF/X export — turn an imposed PDF into a conformant PDF/X-4 or PDF/X-1a file.
//
// Deliberately optional at every layer: adding this step is opt-in, and colour
// conversion to CMYK is OFF by default. If you send to a RIP or Fiery that does
// its own colour management you usually do NOT want the app to convert colour —
// leave `convertCmyk` off and the page content is preserved untouched; only the
// PDF/X container (output intent, boxes, XMP identification, /ID, version) is
// added so the file is recognised as PDF/X.
//
// What it does:
//  • (optional) rasterise + convert colour to CMYK through the chosen profile,
//  • embed the OutputIntent (DestOutputProfile = the CMYK ICC),
//  • ensure every page has a TrimBox (and BleedBox where a bleed exists),
//  • write XMP PDF/X identification metadata,
//  • set a trailer /ID and the correct PDF version header.
//
// Content-level conformance (all fonts embedded, no RGB for X-1a, no live
// transparency for X-1a) can't be forced from arbitrary input — the Preflight
// tool reports those so you know before sending.

export type PdfXStandard = 'x-4' | 'x-1a';

export interface PdfXOptions {
  standard: PdfXStandard;
  icc: Uint8Array;                 // CMYK ICC profile bytes (bundled generic or uploaded)
  conditionName?: string;          // OutputConditionIdentifier, e.g. "Generic CMYK"
  convertCmyk?: boolean;           // default false — leave off for RIP/Fiery workflows
  intent?: 'perceptual' | 'relative' | 'saturation' | 'absolute';
  dpi?: number;                    // rasterisation DPI when converting
}

// A stable 32-hex-char id derived from the content (no RNG — deterministic and
// safe in every runtime). Good enough for the trailer /ID uniqueness intent.
function contentId(bytes: Uint8Array): string {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < bytes.length; i += 997) { // sample for speed on big files
    h1 = (h1 ^ bytes[i]!) >>> 0; h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (h2 + bytes[i]! * (i + 1)) >>> 0;
  }
  const mix = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const len = mix(bytes.length);
  return (mix(h1) + mix(h2) + len + mix(h1 ^ h2)).slice(0, 32);
}

function xmpPacket(standard: PdfXStandard): string {
  const version = standard === 'x-1a' ? 'PDF/X-1:2003' : 'PDF/X-4';
  const conformance = standard === 'x-1a'
    ? '<pdfxid:GTS_PDFXConformance>PDF/X-1a:2003</pdfxid:GTS_PDFXConformance>\n      '
    : '';
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfxid="http://www.npes.org/pdfx/ns/id/">
      <pdfxid:GTS_PDFXVersion>${version}</pdfxid:GTS_PDFXVersion>
      ${conformance}</rdf:Description>
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

export async function exportPdfX(bytes: Uint8Array, opts: PdfXOptions): Promise<Uint8Array> {
  const { standard, icc } = opts;
  const conditionName = opts.conditionName || 'Custom CMYK';

  // 1. Optional colour conversion to CMYK (rasterises). Off by default.
  let working = bytes;
  if (opts.convertCmyk) {
    const { applyIccColorManagement } = await import('../../components/app/press/wasm-engines');
    working = await applyIccColorManagement(working, icc, {
      intent: opts.intent ?? 'relative', dpi: opts.dpi ?? 300, pages: 'all',
    });
  }

  const { PDFDocument, PDFName, PDFString, PDFHexString } = await import('pdf-lib');
  const doc = await PDFDocument.load(working, { ignoreEncryption: true });
  const ctx = doc.context;

  // 2. Boxes — every PDF/X page needs a TrimBox (or ArtBox). Default it to the
  //    CropBox/MediaBox when missing; keep any existing bleed as BleedBox.
  for (const page of doc.getPages()) {
    const mb = page.getMediaBox();
    let hasTrim = false;
    try { const t = page.getTrimBox(); hasTrim = !(t.x === mb.x && t.y === mb.y && t.width === mb.width && t.height === mb.height); } catch { hasTrim = false; }
    if (!hasTrim) {
      let crop = mb;
      try { crop = page.getCropBox(); } catch { /* fall back to media */ }
      page.setTrimBox(crop.x, crop.y, crop.width, crop.height);
    }
  }

  // 3. OutputIntent with the embedded CMYK profile.
  const cs = String.fromCharCode(...icc.slice(16, 20)); // 'CMYK' | 'RGB ' | 'GRAY'
  const N = cs.startsWith('CMYK') ? 4 : cs.startsWith('GRAY') ? 1 : 3;
  const iccRef = ctx.register(ctx.stream(icc, { N }));
  const oi = ctx.obj({
    Type: 'OutputIntent', S: 'GTS_PDFX',
    OutputConditionIdentifier: PDFString.of(conditionName),
    Info: PDFString.of(conditionName),
    DestOutputProfile: iccRef,
  });
  doc.catalog.set(PDFName.of('OutputIntents'), ctx.obj([ctx.register(oi)]));

  // 4. XMP identification metadata (uncompressed, as PDF/X expects).
  const xmp = new TextEncoder().encode(xmpPacket(standard));
  const metaRef = ctx.register(ctx.stream(xmp, { Type: 'Metadata', Subtype: 'XML' }));
  doc.catalog.set(PDFName.of('Metadata'), metaRef);

  // 5. Trailer /ID (two identical strings — a fresh, self-consistent id).
  const id = PDFHexString.of(contentId(working));
  ctx.trailerInfo.ID = ctx.obj([id, id]);

  // 6. Save. X-1a is a PDF 1.4 dialect → no object streams (a 1.5 feature).
  const out = await doc.save({ useObjectStreams: standard !== 'x-1a' });

  // 7. Version header: %PDF-1.6 for X-4, %PDF-1.4 for X-1a.
  if (out[0] === 0x25 && out[5] === 0x31 && out[6] === 0x2e) {
    out[7] = standard === 'x-1a' ? 0x34 /* '4' */ : 0x36 /* '6' */;
  }
  return out;
}
