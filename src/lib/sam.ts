/* Segment-anything cutouts: isolate the subject of an artwork from its
   background.

   Luminance thresholding (what the Divinity Box's black knockout does) only
   works when the subject happens to be lighter or darker than everything
   around it — on a photo it punches holes in the subject's own shadows and
   cannot touch a mid-tone background at all. SAM actually understands what
   the object IS.

   MobileSAM splits into two pieces, and that split is what makes it usable in
   a browser: a heavy image encoder that runs ONCE per artwork and produces an
   embedding, then a small decoder that turns a box or a click into a mask in
   milliseconds. So the wait is paid once and every retry after that is
   instant.

   Everything runs locally — no pixels leave the browser, which is the promise
   the rest of the app makes. Models are MobileSAM (Apache 2.0); they are NOT
   in git (~77MB) — run scripts/fetch-sam.sh, which rebuild.sh calls.        */

import type { InferenceSession, Tensor } from "onnxruntime-web";

const ENCODER_URL = "/models/mobilesam-encoder.onnx";
const DECODER_URL = "/models/mobilesam-decoder.onnx";
const SIDE = 1024;                                  // what the encoder expects
/* SAM's own normalisation constants — the model was trained with these */
const MEAN = [123.675, 116.28, 103.53];
const STD = [58.395, 57.12, 57.375];

type Ort = typeof import("onnxruntime-web");
let ortPromise: Promise<Ort | null> | null = null;
let encoder: InferenceSession | null = null;
let decoder: InferenceSession | null = null;
let loading: Promise<boolean> | null = null;

export type SamProgress = (stage: "download" | "encode", note: string) => void;

async function getOrt(): Promise<Ort | null> {
  if (!ortPromise) {
    ortPromise = import("onnxruntime-web")
      .then((ort) => {
        /* served from public/ort so nothing is pulled off a CDN at runtime */
        ort.env.wasm.wasmPaths = "/ort/";
        ort.env.wasm.numThreads = 1;   // no cross-origin isolation to rely on
        return ort;
      })
      .catch(() => null);
  }
  return ortPromise;
}

/** Load the two models. Returns false if they are not deployed. */
export async function loadSam(onProgress?: SamProgress): Promise<boolean> {
  if (encoder && decoder) return true;
  if (loading) return loading;
  loading = (async () => {
    const ort = await getOrt();
    if (!ort) return false;
    try {
      onProgress?.("download", "Loading the segmentation model…");
      const opts: InferenceSession.SessionOptions = {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      };
      const [e, d] = await Promise.all([
        ort.InferenceSession.create(ENCODER_URL, opts),
        ort.InferenceSession.create(DECODER_URL, opts),
      ]);
      encoder = e; decoder = d;
      return true;
    } catch (err) {
      /* Say WHY. Swallowing this made a broken runtime look exactly like
         "no models installed", which cost real debugging time. */
      lastError = String(err);
      console.warn("[sam] segmentation model unavailable:", err);
      return false;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

export const samReady = () => !!(encoder && decoder);
let lastError = "";
export const samError = () => lastError;

export interface Embedding {
  data: Tensor;            // [1,256,64,64]
  scale: number;           // original px → encoder px
  origW: number;
  origH: number;
}

/* one embedding per artwork; re-encoding the same page is the slow part */
const embeddings = new Map<string, Embedding>();
export const forgetEmbedding = (key: string) => embeddings.delete(key);

/** Encode an image once. Slow (seconds); cached by key thereafter. */
export type SamSource = CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number };

export async function encodeImage(
  key: string, img: SamSource, onProgress?: SamProgress,
): Promise<Embedding | null> {
  const hit = embeddings.get(key);
  if (hit) return hit;
  if (!(await loadSam(onProgress))) return null;
  const ort = await getOrt();
  if (!ort || !encoder) return null;

  const W = img.naturalWidth ?? img.width ?? 0, H = img.naturalHeight ?? img.height ?? 0;
  if (!W || !H) return null;
  const scale = SIDE / Math.max(W, H);
  const nw = Math.round(W * scale), nh = Math.round(H * scale);

  /* longest side to 1024, then pad out to a square — SAM's own convention */
  const c = document.createElement("canvas");
  c.width = SIDE; c.height = SIDE;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, nw, nh);
  const px = ctx.getImageData(0, 0, SIDE, SIDE).data;

  const chw = new Float32Array(3 * SIDE * SIDE);
  const plane = SIDE * SIDE;
  for (let i = 0, p = 0; i < plane; i++, p += 4) {
    chw[i] = (px[p] - MEAN[0]) / STD[0];
    chw[plane + i] = (px[p + 1] - MEAN[1]) / STD[1];
    chw[2 * plane + i] = (px[p + 2] - MEAN[2]) / STD[2];
  }
  /* SAM normalises the image and THEN pads the square with zeros. Normalising
     the padding too (it is transparent black on the canvas) feeds the encoder
     a hard -2.1 slab down the side of the picture, which it reads as content
     and the masks come back ragged along that edge. A portrait page pads a
     third of the width, so this matters. Zero the pad instead. */
  for (let y = 0; y < SIDE; y++) {
    const row = y * SIDE;
    const from = y >= nh ? 0 : nw;                   // whole row below the image
    for (let x = from; x < SIDE; x++) {
      chw[row + x] = 0; chw[plane + row + x] = 0; chw[2 * plane + row + x] = 0;
    }
  }

  onProgress?.("encode", "Reading the artwork…");
  try {
    const input = new ort.Tensor("float32", chw, [1, 3, SIDE, SIDE]);
    const out = await encoder.run({ image: input });
    const emb: Embedding = { data: out.embedding as Tensor, scale, origW: W, origH: H };
    embeddings.set(key, emb);
    /* one page's embedding is ~4MB; a long book would add up */
    if (embeddings.size > 6) embeddings.delete(embeddings.keys().next().value as string);
    return emb;
  } catch { return null; }
}

export interface SamMask {
  data: Uint8Array;      // 1 = foreground, at origW × origH
  w: number;
  h: number;
  score: number;
}

export interface SamPrompt {
  box?: { x0: number; y0: number; x1: number; y1: number };
  /** Extra clicks, in original image pixels. fg=false marks background. */
  points?: { x: number; y: number; fg?: boolean }[];
  /** Which of the decoder's candidate masks to take. SAM returns several —
   *  roughly "the part", "the thing" and "the whole thing". 'score' is its own
   *  quality estimate; 'largest' is what you want when the prompt describes a
   *  whole subject and the highest-scoring candidate keeps coming back as a
   *  sleeve or a boot. */
  pick?: "score" | "largest";
  /** Decode the mask at this size instead of the full image. The decoder just
   *  upsamples a 256×256 logit map, so a smaller size loses no real detail —
   *  and at 300 dpi a full-size mask is tens of megabytes per call, which
   *  matters when a prompt is run dozens of times. Points are unaffected:
   *  they are always given in original-image pixels. */
  out?: { w: number; h: number };
}

/** Turn a prompt (box and/or clicks, in original image pixels) into a mask.
 *  Fast — milliseconds, once the image is encoded. */
export async function segment(emb: Embedding, prompt: SamPrompt): Promise<SamMask | null> {
  const ort = await getOrt();
  if (!ort || !decoder) return null;
  /* labels 2 and 3 are SAM's "this is a box corner" markers; 1 and 0 are
     foreground and background clicks. Points are given in the encoder's
     1024-space, not the original image's. */
  const coords: number[] = [];
  const labels: number[] = [];
  if (prompt.box) {
    coords.push(prompt.box.x0 * emb.scale, prompt.box.y0 * emb.scale,
      prompt.box.x1 * emb.scale, prompt.box.y1 * emb.scale);
    labels.push(2, 3);
  }
  for (const p of prompt.points ?? []) {
    coords.push(p.x * emb.scale, p.y * emb.scale);
    labels.push(p.fg === false ? 0 : 1);
  }
  if (!labels.length) return null;
  try {
    const out = await decoder.run({
      image_embedding: emb.data,
      point_coords: new ort.Tensor("float32", Float32Array.from(coords), [1, labels.length, 2]),
      point_labels: new ort.Tensor("float32", Float32Array.from(labels), [1, labels.length]),
      mask_input: new ort.Tensor("float32", new Float32Array(256 * 256), [1, 1, 256, 256]),
      has_mask_input: new ort.Tensor("float32", Float32Array.from([0]), [1]),
      orig_im_size: new ort.Tensor("float32",
        Float32Array.from([prompt.out?.h ?? emb.origH, prompt.out?.w ?? emb.origW]), [2]),
    });
    const masks = out.masks as Tensor;
    const dims = masks.dims as number[];
    const h = dims[dims.length - 2], w = dims[dims.length - 1];
    const raw = masks.data as Float32Array;
    const plane = w * h;
    const count = Math.max(1, Math.floor(raw.length / plane));
    const scores = out.scores?.data as Float32Array | undefined;

    /* the decoder emits logits: positive is inside the mask. Taking candidate
       0 unconditionally — which this used to do — is how you end up with a
       sub-part of the subject and a ragged edge. */
    let best = 0, bestKey = -Infinity;
    for (let m = 0; m < count; m++) {
      let key: number;
      if (prompt.pick === "largest") {
        let on = 0;
        for (let i = 0, o = m * plane; i < plane; i++, o++) if (raw[o] > 0) on++;
        key = on;
      } else key = scores ? scores[m] ?? 0 : -m;
      if (key > bestKey) { bestKey = key; best = m; }
    }
    const off = best * plane;
    const bits = new Uint8Array(plane);
    for (let i = 0; i < plane; i++) bits[i] = raw[off + i] > 0 ? 1 : 0;
    return { data: bits, w, h, score: scores ? scores[best] ?? 1 : 1 };
  } catch { return null; }
}

/** Box-only prompt — the common case. */
export async function segmentBox(
  emb: Embedding, x0: number, y0: number, x1: number, y1: number,
  pick: "score" | "largest" = "score",
): Promise<SamMask | null> {
  return segment(emb, { box: { x0, y0, x1, y1 }, pick });
}
