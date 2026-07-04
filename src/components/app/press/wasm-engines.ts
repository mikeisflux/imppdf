'use client';
// Real production engines, loaded on demand:
//  - qpdf (WASM) — AES-256 encryption, password decryption, linearization
//  - LittleCMS (WASM) — true ICC transforms for Color Management
// The .wasm binaries are served from /public/wasm.

import { assignOutputIntent } from '@/lib/imposition-toolkit/impose';

// ── qpdf ─────────────────────────────────────────────────────────────────────

async function qpdfRun(input: Uint8Array, args: string[]): Promise<Uint8Array> {
  const createModule = (await import('@neslinesli93/qpdf-wasm')).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await createModule({
    locateFile: () => '/wasm/qpdf.wasm',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    noInitialRun: true, print: () => {}, printErr: () => {},
  } as any);
  mod.FS.writeFile('/input.pdf', input);
  let code = 0;
  try { code = mod.callMain([...args, '/input.pdf', '/output.pdf']); } catch { /* ExitStatus */ }
  try {
    const out = mod.FS.readFile('/output.pdf') as Uint8Array;
    if (out?.length) return out;
  } catch { /* no output */ }
  throw new Error(`qpdf failed (exit ${code}) — wrong password or unsupported file?`);
}

export function encryptPdfAes(bytes: Uint8Array, userPw: string, ownerPw?: string): Promise<Uint8Array> {
  return qpdfRun(bytes, ['--encrypt', userPw, ownerPw || userPw, '256', '--']);
}
export function decryptPdfWithPassword(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  return qpdfRun(bytes, [`--password=${password}`, '--decrypt']);
}
export function linearizePdf(bytes: Uint8Array): Promise<Uint8Array> {
  return qpdfRun(bytes, ['--linearize']);
}

// ── LittleCMS ────────────────────────────────────────────────────────────────

// The LittleCMS ES module is served statically (public/wasm/lcms.mjs) so the
// emscripten glue never passes through the bundler.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let lcmsPromise: Promise<{ lcms: any; consts: any }> | null = null;
function getLcms() {
  lcmsPromise ??= import(/* webpackIgnore: true */ '/wasm/lcms.mjs' as string).then(async (m) => ({
    lcms: await m.instantiate({ locateFile: () => '/wasm/lcms.wasm' }),
    consts: m,
  }));
  return lcmsPromise;
}

export async function iccProfileInfo(icc: Uint8Array): Promise<{ name: string; space: string } | null> {
  try {
    const { lcms, consts } = await getLcms();
    const prof = lcms.cmsOpenProfileFromMem(icc, icc.length);
    if (!prof) return null;
    const name = lcms.cmsGetProfileInfoASCII(prof, consts.cmsInfoDescription ?? 0, 'en', 'US');
    const space = lcms.cmsGetColorSpaceASCII ? lcms.cmsGetColorSpaceASCII(prof) : '';
    lcms.cmsCloseProfile(prof);
    return { name, space };
  } catch { return null; }
}

const INTENT_NUM: Record<string, number> = { perceptual: 0, relative: 1, saturation: 2, absolute: 3 };
const FLAG_SOFTPROOF = 0x4000, FLAG_GAMUTCHECK = 0x1000, FLAG_BPC = 0x2000, FLAG_COPY_ALPHA = 0x04000000;
const TYPE_RGBA_8 = (4 << 16) | (3 << 3) | 1 | (1 << 7);   // PT_RGB, 4 ch (extra alpha), 1 byte

// True ICC soft-proof: every pixel goes sRGB → destination profile → back,
// through LittleCMS with the chosen rendering intent; the destination profile
// is embedded as the PDF OutputIntent so downstream RIPs separate consistently.
export async function applyIccColorManagement(bytes: Uint8Array, icc: Uint8Array, opts: {
  intent: string; dpi?: number; gamutWarning?: boolean; blackPointComp?: boolean; pages?: string;
}): Promise<Uint8Array> {
  const { lcms, consts } = await getLcms();
  const TYPE_RGBA = consts.TYPE_RGBA_8 ?? TYPE_RGBA_8;
  const prof = lcms.cmsOpenProfileFromMem(icc, icc.length);
  if (!prof) throw new Error('Could not parse that ICC profile.');
  const srgb = lcms.cmsCreate_sRGBProfile();
  const intent = INTENT_NUM[opts.intent] ?? 1;
  const flags = FLAG_SOFTPROOF | FLAG_COPY_ALPHA | (opts.gamutWarning ? FLAG_GAMUTCHECK : 0) | (opts.blackPointComp !== false ? FLAG_BPC : 0);
  const transform = lcms.cmsCreateProofingTransform(srgb, TYPE_RGBA, srgb, TYPE_RGBA, prof, intent, intent, flags);
  if (!transform) { lcms.cmsCloseProfile(prof); throw new Error('This ICC profile has no usable transform tables (needs A2B/B2A).'); }

  // Rasterise pages, push pixels through the transform, re-embed.
  const { parsePageRange } = await import('@/lib/imposition-toolkit/impose');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import('pdfjs-dist');
  try { pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default; } catch { /* bundler */ }
  const { PDFDocument } = await import('pdf-lib');
  const srcDoc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const out = await PDFDocument.create();
  const sel = parsePageRange(opts.pages ?? 'all', srcDoc.numPages);
  const scale = (opts.dpi ?? 300) / 72;

  const CHUNK = 1 << 16;
  const inPtr = lcms._malloc(CHUNK * 4), outPtr = lcms._malloc(CHUNK * 4);
  try {
    for (let i = 1; i <= srcDoc.numPages; i++) {
      const page = await srcDoc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      if (!sel.has(i)) {
        // untouched page: copy vector content via pdf-lib
        const orig = await PDFDocument.load(bytes.slice(), { ignoreEncryption: true });
        const [copied] = await out.copyPages(orig, [i - 1]);
        out.addPage(copied!);
        continue;
      }
      const vp = page.getViewport({ scale: Math.min(scale, 4200 / Math.max(base.width, base.height)) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = img.data;
      for (let off = 0; off < px.length; off += CHUNK * 4) {
        const n = Math.min(CHUNK, (px.length - off) / 4);
        lcms.HEAPU8.set(px.subarray(off, off + n * 4), inPtr);
        lcms.cmsDoTransform(transform, inPtr, outPtr, n);
        px.set(lcms.HEAPU8.subarray(outPtr, outPtr + n * 4), off);
      }
      ctx.putImageData(img, 0, 0);
      const jpg = await fetch(canvas.toDataURL('image/jpeg', 0.92)).then((r) => r.arrayBuffer());
      const emb = await out.embedJpg(jpg);
      const pg = out.addPage([base.width, base.height]);
      pg.drawImage(emb, { x: 0, y: 0, width: base.width, height: base.height });
    }
  } finally {
    lcms._free(inPtr); lcms._free(outPtr);
    lcms.cmsDeleteTransform(transform);
    lcms.cmsCloseProfile(prof); lcms.cmsCloseProfile(srgb);
    try { srcDoc.cleanup?.(); srcDoc.destroy?.(); } catch { /* best effort */ }
  }
  const saved = await out.save();
  // Tag the output with the real destination profile.
  return assignOutputIntent(saved, icc, 'Uploaded ICC profile');
}
