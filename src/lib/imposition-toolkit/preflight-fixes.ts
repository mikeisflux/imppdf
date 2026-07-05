// One-click preflight fixes. Each takes the source PDF bytes and returns a
// corrected copy — honest, in-browser transformations only. Colour conversion
// (RGB→CMYK) is deliberately NOT offered here: faithfully converting vector +
// image content to CMYK needs a colour-managed design app, and a naive remap
// would shift colour silently. The preflight panel exposes only the fixes below.

export type FixId = 'padTo4' | 'addBleed';

export interface FixDef {
  id: FixId;
  label: string;       // button text
  note: string;        // what it does / caveat
  // Which finding titles this fix resolves (matched case-insensitively as a substring).
  matches: (title: string) => boolean;
  run: (bytes: Uint8Array) => Promise<Uint8Array>;
}

// Pad the document with blank pages (matching the last page's size) until the
// page count is a multiple of 4 — what saddle-stitch / perfect-bound binding
// needs. Blanks are appended at the end.
export async function padToMultipleOf4(bytes: Uint8Array): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const n = doc.getPageCount();
  const rem = n % 4;
  if (rem === 0) return bytes;
  const last = doc.getPage(n - 1);
  const { width, height } = last.getSize();
  for (let i = 0; i < 4 - rem; i++) doc.addPage([width, height]);
  return doc.save();
}

// Fabricate a 1/8" bleed by mirroring the edge artwork outward, recording the
// original trim in the TrimBox. A rescue for art delivered without bleed.
export async function addMirroredBleed(bytes: Uint8Array, bleedIn = 0.125): Promise<Uint8Array> {
  // Imported lazily — the imposition module is large and browser-oriented.
  const { generateBleed } = await import('./impose');
  return generateBleed(bytes, { bleedIn, mode: 'mirror' });
}

export const PREFLIGHT_FIXES: FixDef[] = [
  {
    id: 'padTo4',
    label: 'Pad to ×4',
    note: 'Appends blank pages so the count is a multiple of 4 (for binding).',
    matches: (t) => /not a multiple of 4/i.test(t),
    run: (b) => padToMultipleOf4(b),
  },
  {
    id: 'addBleed',
    label: 'Add bleed',
    note: 'Fabricates a 1/8" bleed by mirroring the edges (rescue — real bleed is better).',
    matches: (t) => /no bleed detected/i.test(t),
    run: (b) => addMirroredBleed(b, 0.125),
  },
];

// The fix (if any) that resolves a given finding title.
export function fixFor(title: string): FixDef | undefined {
  return PREFLIGHT_FIXES.find((f) => f.matches(title));
}
