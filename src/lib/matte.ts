/* Subject matting — U²-Net (Apache 2.0), the model behind rembg.

   This exists because MobileSAM is the wrong tool for the job. SAM is a
   PROMPTABLE segmenter: you tell it which object you mean and it outlines it
   precisely. Asked to segment "the object in this box" where the box is the
   whole page, it is being asked an ambiguous question — the wall behind the
   figure fits that description exactly as well as the figure does — and it
   answers the wall about as often as it answers the subject. Hence a plate
   that came out backwards, and a pile of heuristics trying to guess which
   side it had picked.

   U²-Net asks no question. Salient object detection is its whole job: one
   forward pass, one probability map, subject bright and background dark, with
   no prompt to be ambiguous about and no polarity to guess at.

   It also matters that the output is a SOFT matte, not a mask. Every value is
   a probability, so hair and edges come back as partial coverage rather than
   in-or-out, and the plate inherits that gradient. A binary mask has to be
   thresholded somewhere, and a threshold on a curve is a staircase — which is
   what printed as jagged edges on the white plate.

   Not in git (~4-176MB): scripts/fetch-sam.sh pulls it. Without it the caller
   falls back to SAM.                                                        */

import type { InferenceSession, Tensor } from 'onnxruntime-web';

/* Tried in order. ISNet mattes at 1024, U²-Net at 320 — and that resolution
   is the whole difference around hair: at 320 one matte pixel covers ~10 print
   pixels, so curls smear into a blob and the plate takes half the background
   with them. Both are kept so an install with only the older weights works. */
const MODEL_URLS = ['/models/matte-isnet.onnx', '/models/matte.onnx'];
let side = 320;                         // read from the model that loads
let mean = [0.485, 0.456, 0.406];       // U²-Net: ImageNet statistics
let std = [0.229, 0.224, 0.225];        // ISNet: 0.5 / 1.0 (set on load)

type Ort = typeof import('onnxruntime-web');
let ortPromise: Promise<Ort | null> | null = null;
let session: InferenceSession | null = null;
let loading: Promise<boolean> | null = null;

async function getOrt(): Promise<Ort | null> {
  if (!ortPromise) {
    ortPromise = import('onnxruntime-web')
      .then((ort) => { ort.env.wasm.wasmPaths = '/ort/'; ort.env.wasm.numThreads = 1; return ort; })
      .catch(() => null);
  }
  return ortPromise;
}

export async function loadMatte(): Promise<boolean> {
  if (session) return true;
  if (loading) return loading;
  loading = (async () => {
    const ort = await getOrt();
    if (!ort) return false;
    for (const url of MODEL_URLS) {
      try {
        session = await ort.InferenceSession.create(url, {
          executionProviders: ['wasm'], graphOptimizationLevel: 'all',
        });
        // Take the input square from the model itself rather than assuming:
        // ISNet is 1024, U²-Net 320, and feeding either the wrong size is a
        // silent quality loss rather than an error.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meta = (session as any).inputMetadata?.[0];
        const dims = (meta?.shape ?? meta?.dimensions) as (number | string)[] | undefined;
        const got = Number(dims?.[dims.length - 1]);
        side = Number.isFinite(got) && got > 0 ? got : 320;
        // ISNet was trained on 0.5/1.0, U²-Net on the ImageNet statistics.
        // Feeding either the other one's numbers measurably weakens the matte.
        if (side >= 512) { mean = [0.5, 0.5, 0.5]; std = [1, 1, 1]; }
        else { mean = [0.485, 0.456, 0.406]; std = [0.229, 0.224, 0.225]; }
        console.info('[matte] using', url, `${side}px`);
        loading = null;
        return true;
      } catch { /* try the next one */ }
    }
    console.warn('[matte] no subject model installed — falling back to MobileSAM');
    loading = null;
    return false;
  })();
  return loading;
}
export const matteReady = () => !!session;

/* One forward pass over a region of the source, returned as 0..1 coverage at
   outW x outH. The model's input square is FIXED by its graph — 320 for
   U²-Net, 1024 for ISNet — so the only way to give it more detail on part of
   the picture is to hand it less of the picture. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function inferRegion(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any, ort: Ort, sx: number, sy: number, sw: number, sh: number,
  outW: number, outH: number,
): Promise<Float32Array | null> {
  if (!session) return null;
  const SIDE = side;
  /* A plain square resize, NOT a letterbox: that is how these models were
     trained, and padding leaves them looking at bars they have never seen.
     The aspect distortion is undone when the matte is scaled back out. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sq: any = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(SIDE, SIDE)
    : Object.assign(document.createElement('canvas'), { width: SIDE, height: SIDE });
  const sctx = sq.getContext('2d', { willReadFrequently: true });
  // Transparent artwork composites onto white: the model reasons about a
  // photograph, and RGB 0,0,0 under alpha 0 would read as a black subject.
  sctx.fillStyle = '#fff'; sctx.fillRect(0, 0, SIDE, SIDE);
  sctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, SIDE, SIDE);
  const px = sctx.getImageData(0, 0, SIDE, SIDE).data;

  const plane = SIDE * SIDE;
  let peak = 0;
  for (let i = 0, p = 0; i < plane; i++, p += 4) {
    if (px[p]! > peak) peak = px[p]!;
    if (px[p + 1]! > peak) peak = px[p + 1]!;
    if (px[p + 2]! > peak) peak = px[p + 2]!;
  }
  if (peak <= 0) peak = 255;
  const chw = new Float32Array(3 * plane);
  for (let i = 0, p = 0; i < plane; i++, p += 4) {
    chw[i] = (px[p]! / peak - mean[0]!) / std[0]!;
    chw[plane + i] = (px[p + 1]! / peak - mean[1]!) / std[1]!;
    chw[2 * plane + i] = (px[p + 2]! / peak - mean[2]!) / std[2]!;
  }
  const feeds: Record<string, Tensor> = {};
  feeds[session.inputNames[0]!] = new ort.Tensor('float32', chw, [1, 3, SIDE, SIDE]);
  const out = await session.run(feeds);
  const raw = (out[session.outputNames[0]!] as Tensor).data as Float32Array;

  // The head is a logit map: min-max normalize, as the models' own inference does.
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < plane; i++) { const v = raw[i]!; if (v < lo) lo = v; if (v > hi) hi = v; }
  const span = hi - lo;
  const small = new Float32Array(plane);
  for (let i = 0; i < plane; i++) small[i] = span > 1e-6 ? (raw[i]! - lo) / span : 0;

  /* BILINEAR back out. The matte is smooth to begin with and interpolating
     keeps it smooth; a nearest-neighbor blow-up would put a staircase on
     every edge, which is the whole thing being avoided here. */
  const cov = new Float32Array(outW * outH);
  for (let y = 0; y < outH; y++) {
    const fy = Math.min(SIDE - 1, Math.max(0, ((y + 0.5) * SIDE) / outH - 0.5));
    const y0 = Math.floor(fy), y1 = Math.min(SIDE - 1, y0 + 1), ty = fy - y0;
    for (let x = 0; x < outW; x++) {
      const fx = Math.min(SIDE - 1, Math.max(0, ((x + 0.5) * SIDE) / outW - 0.5));
      const x0 = Math.floor(fx), x1 = Math.min(SIDE - 1, x0 + 1), tx = fx - x0;
      const a = small[y0 * SIDE + x0]! * (1 - tx) + small[y0 * SIDE + x1]! * tx;
      const b = small[y1 * SIDE + x0]! * (1 - tx) + small[y1 * SIDE + x1]! * tx;
      cov[y * outW + x] = a * (1 - ty) + b * ty;
    }
  }
  return cov;
}

/** Subject coverage for an already-rendered canvas: 0..255 at w×h, 255 = fully
 *  subject. Null when the model isn't deployed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function matteAlpha(
  canvas: any, w: number, h: number,
  // Pulls the soft fringe in. The matte is a probability, so the halo around
  // hair sits in the middle of the range while the hair itself sits near the
  // top: raising the coverage to a power above 1 collapses the fringe and
  // leaves the solid parts alone. It is a CURVE, not a cut — nothing here is
  // allowed to put a step in the edge.
  tighten = 1,
  // Second pass over just the subject. See below.
  refine = true,
): Promise<Uint8Array | null> {
  if (!(await loadMatte())) return null;
  const ort = await getOrt();
  if (!ort || !session) return null;
  try {
    const full = await inferRegion(canvas, ort, 0, 0, w, h, w, h);
    if (!full) return null;

    /* SECOND PASS, over the subject alone.

       The input square is fixed, so the way to get more detail is to spend it
       on less picture. Pass one locates the subject; pass two re-runs on just
       that region, where the same 1024 pixels now cover perhaps half the area
       — which is exactly the detail that decides whether a curl of hair is
       kept or the wall behind it comes with it.

       Guarded: skipped when the subject already fills the frame (nothing to
       gain), and the result is discarded unless it still looks like a subject,
       so a crop that confuses the model cannot make things worse. */
    let cov = full;
    if (refine) {
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (full[y * w + x]! > 0.12) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      if (x1 >= x0 && bw * bh < w * h * 0.75) {
        const padX = bw * 0.08, padY = bh * 0.08;
        const cx0 = Math.max(0, Math.floor(x0 - padX)), cy0 = Math.max(0, Math.floor(y0 - padY));
        const cx1 = Math.min(w, Math.ceil(x1 + 1 + padX)), cy1 = Math.min(h, Math.ceil(y1 + 1 + padY));
        const cw = cx1 - cx0, ch = cy1 - cy0;
        const crop = await inferRegion(canvas, ort, cx0, cy0, cw, ch, cw, ch);
        if (crop) {
          let on = 0;
          for (let i = 0; i < crop.length; i++) if (crop[i]! > 0.5) on++;
          const frac = on / crop.length;
          if (frac > 0.02 && frac < 0.97) {
            cov = new Float32Array(w * h);
            for (let y = 0; y < ch; y++) {
              const dst = (cy0 + y) * w + cx0, src = y * cw;
              for (let x = 0; x < cw; x++) cov[dst + x] = crop[src + x]!;
            }
          }
        }
      }
    }

    const out = new Uint8Array(w * h);
    for (let i = 0; i < out.length; i++) {
      const v = cov[i]!;
      out[i] = Math.max(0, Math.min(255,
        Math.round((tighten === 1 ? v : Math.pow(v, tighten)) * 255)));
    }
    return out;
  } catch (err) {
    console.warn('[matte] failed:', err);
    return null;
  }
}
