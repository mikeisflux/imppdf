#!/usr/bin/env bash
# Fetch the MobileSAM weights and the ONNX runtime WASM for Tuck Behind Art.
# The binaries are ~77MB, so they are not kept in git — run this once after
# cloning, and in the deploy step. Without them the tuck tool silently falls
# back to the old luminance-threshold cutout.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/models public/ort
BASE=https://raw.githubusercontent.com/Kazuhito00/MobileSAM-ONNX-Sample/main/onnx_model
[ -f public/models/mobilesam-encoder.onnx ] || curl -fL --progress-bar -o public/models/mobilesam-encoder.onnx "$BASE/vit_t_encoder.onnx"
[ -f public/models/mobilesam-decoder.onnx ] || curl -fL --progress-bar -o public/models/mobilesam-decoder.onnx "$BASE/vit_t_decoder.onnx"
# Region detector for Raised Metal's auto-boost (NudeNet, MIT). Tries the
# known mirrors and VERIFIES the result is a real ONNX file — a silent HTML
# error page would download "successfully" and then fail at load time.
NUDE_OUT=public/models/nudenet-320n.onnx
if [ ! -s "$NUDE_OUT" ]; then
  for u in \
    "https://github.com/notAI-tech/NudeNet/releases/download/v3.4-weights/320n.onnx" \
    "https://github.com/notAI-tech/NudeNet/releases/download/v3.0-weights/320n.onnx" \
    "https://huggingface.co/deepghs/nudenet_onnx/resolve/main/320n.onnx?download=true" ; do
    echo "  trying $u"
    if curl -fL --progress-bar -o "$NUDE_OUT.part" "$u"; then
      sz=$(wc -c < "$NUDE_OUT.part")
      # ONNX is protobuf; an HTML error page starts with '<' and is tiny.
      if [ "$sz" -gt 1000000 ] && [ "$(head -c 1 "$NUDE_OUT.part")" != "<" ]; then
        mv "$NUDE_OUT.part" "$NUDE_OUT"; echo "  region detector OK ($sz bytes)"; break
      fi
      echo "  rejected: $sz bytes, not an ONNX model"
    fi
    rm -f "$NUDE_OUT.part"
  done
fi
[ -s "$NUDE_OUT" ] || echo "  !! region detector NOT installed — Raised Metal auto-detect will find nothing"

for f in ort-wasm-simd-threaded.wasm ort-wasm-simd-threaded.mjs \
         ort-wasm-simd-threaded.jsep.wasm ort-wasm-simd-threaded.jsep.mjs; do
  cp -f "node_modules/onnxruntime-web/dist/$f" "public/ort/$f"
done
echo "MobileSAM ready:"; du -sh public/models public/ort
