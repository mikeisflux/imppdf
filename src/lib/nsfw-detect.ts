/* Anatomical region detection for print finishing.

   The Raised Metal plate can lift specific regions higher than the rest of the
   artwork. Picking those by hand for every cover is slow, so this locates them
   automatically: NudeNet (MIT) is a small ONNX detector that returns boxes for
   exposed anatomy. We take the boxes and hand them to MobileSAM, which turns a
   box into a precise mask — the detector only has to be roughly right.

   Everything runs locally, like the rest of the app; no artwork is uploaded.
   The model is NOT in git (~20MB) — scripts/fetch-sam.sh pulls it, and without
   it detection simply returns nothing and the manual boxes still work.

   Accuracy note: NudeNet is trained mostly on photographic material, so on
   stylised comic art it is a starting point, not gospel. Keep the confidence
   threshold adjustable and always let the operator override the result.      */

import type { InferenceSession, Tensor } from 'onnxruntime-web';

const MODEL_URL = '/models/nudenet-320n.onnx';
const SIDE = 320;                       // the detector's input square

type Ort = typeof import('onnxruntime-web');
let ortPromise: Promise<Ort | null> | null = null;
let session: InferenceSession | null = null;
let loading: Promise<boolean> | null = null;
let lastError = '';

async function getOrt(): Promise<Ort | null> {
  if (!ortPromise) {
    ortPromise = import('onnxruntime-web')
      .then((ort) => { ort.env.wasm.wasmPaths = '/ort/'; ort.env.wasm.numThreads = 1; return ort; })
      .catch(() => null);
  }
  return ortPromise;
}

export async function loadDetector(): Promise<boolean> {
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
      lastError = String(err);
      console.warn('[detect] region model unavailable:', err);
      return false;
    } finally { loading = null; }
  })();
  return loading;
}
export const detectorReady = () => !!session;
export const detectorError = () => lastError;

// NudeNet's class order. Only the ones worth raising are mapped; the rest are
// ignored so a stray hit never drives the plate.
const CLASSES: Record<number, string> = {
  0: 'anus', 1: 'armpits', 2: 'belly', 3: 'buttocks', 4: 'feet',
  5: 'breast_covered', 6: 'genitalia_covered', 7: 'face',
  8: 'breast_exposed', 9: 'genitalia_exposed', 10: 'anus_exposed',
  11: 'belly_exposed', 12: 'buttocks_exposed', 13: 'feet_exposed',
  14: 'armpits_exposed', 15: 'nipple_male', 16: 'face_male', 17: 'face_female',
};
// Raised by default: the exposed anatomy an adult title would want lifted.
export const DEFAULT_RAISE_CLASSES = new Set([
  'breast_exposed', 'genitalia_exposed', 'buttocks_exposed', 'anus_exposed',
]);

export interface DetectedRegion {
  /** Pixel box in the SOURCE image's coordinates. */
  x0: number; y0: number; x1: number; y1: number;
  label: string;
  score: number;
}

/** Detect regions in an already-rendered canvas. Empty when the model is absent. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function detectRegions(
  canvas: any, w: number, h: number, minScore = 0.25,
): Promise<DetectedRegion[]> {
  if (!(await loadDetector())) return [];
  const ort = await getOrt();
  if (!ort || !session) return [];
  try {
    // Letterbox to the detector's square, keeping aspect (as YOLO expects).
    const scale = Math.min(SIDE / w, SIDE / h);
    const nw = Math.round(w * scale), nh = Math.round(h * scale);
    const padX = (SIDE - nw) / 2, padY = (SIDE - nh) / 2;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sq: any = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(SIDE, SIDE)
      : Object.assign(document.createElement('canvas'), { width: SIDE, height: SIDE });
    const sctx = sq.getContext('2d', { willReadFrequently: true });
    sctx.fillStyle = '#000'; sctx.fillRect(0, 0, SIDE, SIDE);
    sctx.drawImage(canvas, padX, padY, nw, nh);
    const px = sctx.getImageData(0, 0, SIDE, SIDE).data;

    const chw = new Float32Array(3 * SIDE * SIDE);
    const plane = SIDE * SIDE;
    for (let i = 0, p = 0; i < plane; i++, p += 4) {
      chw[i] = px[p]! / 255;
      chw[plane + i] = px[p + 1]! / 255;
      chw[2 * plane + i] = px[p + 2]! / 255;
    }
    const out = await session.run({ images: new ort.Tensor('float32', chw, [1, 3, SIDE, SIDE]) });
    const t = Object.values(out)[0] as Tensor;
    const data = t.data as Float32Array;
    const dims = t.dims as number[];
    // YOLO head: [1, 4 + numClasses, numBoxes] — rows are cx,cy,w,h then scores.
    const rows = dims[1] ?? 0, n = dims[2] ?? 0;
    const numCls = Math.max(0, rows - 4);
    const hits: DetectedRegion[] = [];
    for (let i = 0; i < n; i++) {
      let best = -1, bestScore = 0;
      for (let c = 0; c < numCls; c++) {
        const sc = data[(4 + c) * n + i]!;
        if (sc > bestScore) { bestScore = sc; best = c; }
      }
      if (best < 0 || bestScore < minScore) continue;
      const cx = data[i]!, cy = data[n + i]!, bw = data[2 * n + i]!, bh = data[3 * n + i]!;
      // Undo the letterbox back into source pixels.
      const x0 = (cx - bw / 2 - padX) / scale, y0 = (cy - bh / 2 - padY) / scale;
      const x1 = (cx + bw / 2 - padX) / scale, y1 = (cy + bh / 2 - padY) / scale;
      hits.push({
        x0: Math.max(0, Math.min(w - 1, x0)), y0: Math.max(0, Math.min(h - 1, y0)),
        x1: Math.max(0, Math.min(w - 1, x1)), y1: Math.max(0, Math.min(h - 1, y1)),
        label: CLASSES[best] ?? `class_${best}`, score: bestScore,
      });
    }
    return nonMaxSuppress(hits, 0.45);
  } catch (err) { lastError = String(err); return []; }
}

/** Drop overlapping duplicates, keeping the strongest of each cluster. */
export function nonMaxSuppress(boxes: DetectedRegion[], iouLimit = 0.45): DetectedRegion[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: DetectedRegion[] = [];
  const area = (r: DetectedRegion) => Math.max(0, r.x1 - r.x0) * Math.max(0, r.y1 - r.y0);
  for (const b of sorted) {
    let drop = false;
    for (const k of kept) {
      if (k.label !== b.label) continue;
      const ix = Math.max(0, Math.min(k.x1, b.x1) - Math.max(k.x0, b.x0));
      const iy = Math.max(0, Math.min(k.y1, b.y1) - Math.max(k.y0, b.y0));
      const inter = ix * iy;
      const uni = area(k) + area(b) - inter;
      if (uni > 0 && inter / uni > iouLimit) { drop = true; break; }
    }
    if (!drop) kept.push(b);
  }
  return kept;
}
