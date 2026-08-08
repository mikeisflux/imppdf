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

const MODEL_URL = '/models/matte.onnx';
const SIDE = 320;                       // U²-Net's input square
// U²-Net's training normalisation (ImageNet statistics).
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

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
    try {
      session = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ['wasm'], graphOptimizationLevel: 'all',
      });
      return true;
    } catch (err) {
      console.warn('[matte] subject model unavailable:', err);
      return false;
    } finally { loading = null; }
  })();
  return loading;
}
export const matteReady = () => !!session;

/** Subject coverage for an already-rendered canvas: 0..255 at w×h, 255 = fully
 *  subject. Null when the model isn't deployed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function matteAlpha(canvas: any, w: number, h: number): Promise<Uint8Array | null> {
  if (!(await loadMatte())) return null;
  const ort = await getOrt();
  if (!ort || !session) return null;
  try {
    /* U²-Net takes a plain square resize — NOT a letterbox. It was trained
       that way, and padding instead leaves the model looking at bars it has
       never seen. The aspect distortion is undone when the matte is scaled
       back out. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sq: any = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(SIDE, SIDE)
      : Object.assign(document.createElement('canvas'), { width: SIDE, height: SIDE });
    const sctx = sq.getContext('2d', { willReadFrequently: true });
    // Transparent artwork composites onto white: the model reasons about a
    // photograph, and RGB 0,0,0 under alpha 0 would read as a black subject.
    sctx.fillStyle = '#fff'; sctx.fillRect(0, 0, SIDE, SIDE);
    sctx.drawImage(canvas, 0, 0, SIDE, SIDE);
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
      chw[i] = (px[p]! / peak - MEAN[0]!) / STD[0]!;
      chw[plane + i] = (px[p + 1]! / peak - MEAN[1]!) / STD[1]!;
      chw[2 * plane + i] = (px[p + 2]! / peak - MEAN[2]!) / STD[2]!;
    }

    const feeds: Record<string, Tensor> = {};
    feeds[session.inputNames[0]!] = new ort.Tensor('float32', chw, [1, 3, SIDE, SIDE]);
    const out = await session.run(feeds);
    const first = out[session.outputNames[0]!] as Tensor;
    const raw = first.data as Float32Array;

    /* The head is a logit map, not a probability map: min-max normalise it,
       exactly as U²-Net's own inference does. */
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < plane; i++) {
      const v = raw[i]!;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const span = hi - lo;
    const small = new Float32Array(plane);
    for (let i = 0; i < plane; i++) small[i] = span > 1e-6 ? (raw[i]! - lo) / span : 0;

    /* BILINEAR back up to the plate. The matte is smooth to begin with, and
       interpolating keeps it smooth — a nearest-neighbour blow-up from 320px
       would put a staircase on every edge, which is the whole thing we are
       trying to avoid. */
    const cov = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const fy = Math.min(SIDE - 1, Math.max(0, ((y + 0.5) * SIDE) / h - 0.5));
      const y0 = Math.floor(fy), y1 = Math.min(SIDE - 1, y0 + 1), ty = fy - y0;
      for (let x = 0; x < w; x++) {
        const fx = Math.min(SIDE - 1, Math.max(0, ((x + 0.5) * SIDE) / w - 0.5));
        const x0 = Math.floor(fx), x1 = Math.min(SIDE - 1, x0 + 1), tx = fx - x0;
        const a = small[y0 * SIDE + x0]! * (1 - tx) + small[y0 * SIDE + x1]! * tx;
        const b = small[y1 * SIDE + x0]! * (1 - tx) + small[y1 * SIDE + x1]! * tx;
        cov[y * w + x] = Math.max(0, Math.min(255, Math.round((a * (1 - ty) + b * ty) * 255)));
      }
    }
    return cov;
  } catch (err) {
    console.warn('[matte] failed:', err);
    return null;
  }
}
