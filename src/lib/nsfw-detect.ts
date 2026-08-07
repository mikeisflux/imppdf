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
  0: 'FEMALE_GENITALIA_COVERED', 1: 'FACE_FEMALE', 2: 'BUTTOCKS_EXPOSED',
  3: 'FEMALE_BREAST_EXPOSED', 4: 'FEMALE_GENITALIA_EXPOSED', 5: 'MALE_BREAST_EXPOSED',
  6: 'ANUS_EXPOSED', 7: 'FEET_EXPOSED', 8: 'BELLY_COVERED', 9: 'FEET_COVERED',
  10: 'ARMPITS_COVERED', 11: 'ARMPITS_EXPOSED', 12: 'FACE_MALE', 13: 'BELLY_EXPOSED',
  14: 'MALE_GENITALIA_EXPOSED', 15: 'ANUS_COVERED', 16: 'FEMALE_BREAST_COVERED',
  17: 'BUTTOCKS_COVERED',
};
// Raised by default: the exposed anatomy an adult title would want lifted.
export const DEFAULT_RAISE_CLASSES = new Set([
  'FEMALE_BREAST_EXPOSED', 'FEMALE_GENITALIA_EXPOSED',
  'BUTTOCKS_EXPOSED', 'ANUS_EXPOSED', 'MALE_GENITALIA_EXPOSED',
]);

/* Per-class confidence, as a MULTIPLIER of the operator's threshold.
   The model was trained on photographs; on painted/inked art the genital
   classes score far lower than breasts do (small in frame, stylised, often
   partly shadowed), so a single global floor either misses them entirely or
   floods the plate with junk once you drop it far enough to catch them.
   Giving those classes their own, lower floor catches them without loosening
   anything else. 1 = exactly the operator's threshold. */
export const CLASS_SCORE_SCALE: Record<string, number> = {
  FEMALE_GENITALIA_EXPOSED: 0.4,
  FEMALE_GENITALIA_COVERED: 0.4,
  MALE_GENITALIA_EXPOSED: 0.45,
  ANUS_EXPOSED: 0.5,
};

/* How far a class's box is pulled in toward its own centre before it is handed
   to SAM, as a fraction of the box's width/height per side.

   Two reasons. (1) The wanted feature sits at the CENTRE of the box — the
   nipple inside the breast box, the vulva inside the genital box — and the
   detector's box is the whole anatomy, so raising all of it is too much.
   (2) SAM takes a box as "segment the object in here"; when the box is loose
   the nearest whole object wins, which on a figure in clothing is the
   GARMENT — you ask for the crotch and get the skirt. A tight prompt lands on
   the skin instead. */
export const CLASS_INSET: Record<string, { x: number; y: number }> = {
  FEMALE_BREAST_EXPOSED: { x: 0.30, y: 0.30 },   // → areola/nipple, not the whole breast
  FEMALE_BREAST_COVERED: { x: 0.30, y: 0.30 },
  FEMALE_GENITALIA_EXPOSED: { x: 0.22, y: 0.18 },
  FEMALE_GENITALIA_COVERED: { x: 0.22, y: 0.18 },
  MALE_GENITALIA_EXPOSED: { x: 0.15, y: 0.10 },
  ANUS_EXPOSED: { x: 0.20, y: 0.20 },
  BUTTOCKS_EXPOSED: { x: 0.12, y: 0.12 },
};
const DEFAULT_INSET = { x: 0.12, y: 0.12 };

/** Pull a detected box in toward its centre. `strength` 1 = the class default,
 *  0 = the raw box; capped so a box can never collapse to nothing. */
export function tightenBox<T extends { x0: number; y0: number; x1: number; y1: number; label?: string }>(
  b: T, strength = 1,
): T {
  const base = (b.label && CLASS_INSET[b.label]) || DEFAULT_INSET;
  const fx = Math.max(0, Math.min(0.45, base.x * strength));
  const fy = Math.max(0, Math.min(0.45, base.y * strength));
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  return { ...b, x0: b.x0 + w * fx, x1: b.x1 - w * fx, y0: b.y0 + h * fy, y1: b.y1 - h * fy };
}

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
    const peak: number[] = new Array(numCls).fill(0);   // best raw score per class, for tuning
    // Each class is judged against its OWN floor, and the winner is the class
    // that clears its floor by the widest margin — not simply the top raw
    // score. Otherwise a confident FACE or BELLY on the same box would always
    // outrank the low-scoring genital hit we are specifically trying to catch.
    for (let i = 0; i < n; i++) {
      let best = -1, bestScore = 0, bestMargin = 0;
      for (let c = 0; c < numCls; c++) {
        const sc = data[(4 + c) * n + i]!;
        if (sc > (peak[c] ?? 0)) peak[c] = sc;
        const floor = minScore * (CLASS_SCORE_SCALE[CLASSES[c] ?? ''] ?? 1);
        if (sc < floor) continue;
        const margin = sc / Math.max(1e-6, floor);
        if (margin > bestMargin) { bestMargin = margin; bestScore = sc; best = c; }
      }
      if (best < 0) continue;
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
    const kept = nonMaxSuppress(hits, 0.45);
    // Makes a class-order or head-shape mismatch obvious instead of silent.
    console.info('[detect]', dims.join('x'), `${numCls} classes,`,
      kept.length ? kept.map((k) => `${k.label} ${k.score.toFixed(2)}`).join(', ') : 'nothing above threshold');
    // What the model saw but did NOT keep — set the threshold from this rather
    // than by guesswork when a region is being missed.
    console.info('[detect] best per class:', peak
      .map((v, c) => ({ label: CLASSES[c] ?? `class_${c}`, v }))
      .filter((e) => e.v > 0.02).sort((a, b) => b.v - a.v).slice(0, 8)
      .map((e) => `${e.label} ${e.v.toFixed(2)}`).join(', '));
    return kept;
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
