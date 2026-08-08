#!/usr/bin/env bash
# Fetch the MobileSAM weights and the ONNX runtime WASM for the segmentation
# tools: Remove Background, Raised Metal's subject dropout, and the Divinity
# Box's subject-aware black knockout.
# The binaries are ~77MB, so they are not kept in git — run this once after
# cloning, and in the deploy step. Without them those tools fall through
# untouched: no cutout, no dropout, and the knockout stops shielding the
# subject. Nothing errors, so a missed fetch is easy to miss.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/models public/ort
BASE=https://raw.githubusercontent.com/Kazuhito00/MobileSAM-ONNX-Sample/main/onnx_model
[ -f public/models/mobilesam-encoder.onnx ] || curl -fL --progress-bar -o public/models/mobilesam-encoder.onnx "$BASE/vit_t_encoder.onnx"
[ -f public/models/mobilesam-decoder.onnx ] || curl -fL --progress-bar -o public/models/mobilesam-decoder.onnx "$BASE/vit_t_decoder.onnx"
# Subject matting for the background drop (U2-Net, Apache 2.0 — the model
# behind rembg). Salient-object detection: no prompt, so it cannot come back
# inverted, and it returns a soft matte instead of a binary mask. The full
# model is best; the "p" variant is 4.7MB and is a fine fallback. VERIFIES the
# download is real ONNX — a silent HTML error page would "succeed" here and
# then fail at load time.
MATTE_OUT=public/models/matte.onnx
if [ ! -s "$MATTE_OUT" ]; then
  for u in \
    "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx" \
    "https://huggingface.co/tomjackson2023/rembg/resolve/main/u2net.onnx?download=true" \
    "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx" ; do
    echo "  trying $u"
    if curl -fL --progress-bar -o "$MATTE_OUT.part" "$u"; then
      sz=$(wc -c < "$MATTE_OUT.part")
      if [ "$sz" -gt 1000000 ] && [ "$(head -c 1 "$MATTE_OUT.part")" != "<" ]; then
        mv "$MATTE_OUT.part" "$MATTE_OUT"; echo "  subject matting OK ($sz bytes)"; break
      fi
      echo "  rejected: $sz bytes, not an ONNX model"
    fi
    rm -f "$MATTE_OUT.part"
  done
fi
[ -s "$MATTE_OUT" ] || echo "  !! subject matting NOT installed — the background drop falls back to MobileSAM"

for f in ort-wasm-simd-threaded.wasm ort-wasm-simd-threaded.mjs \
         ort-wasm-simd-threaded.jsep.wasm ort-wasm-simd-threaded.jsep.mjs; do
  cp -f "node_modules/onnxruntime-web/dist/$f" "public/ort/$f"
done
echo "MobileSAM ready:"; du -sh public/models public/ort
