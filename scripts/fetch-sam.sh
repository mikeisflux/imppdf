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
for f in ort-wasm-simd-threaded.wasm ort-wasm-simd-threaded.mjs \
         ort-wasm-simd-threaded.jsep.wasm ort-wasm-simd-threaded.jsep.mjs; do
  cp -f "node_modules/onnxruntime-web/dist/$f" "public/ort/$f"
done
echo "MobileSAM ready:"; du -sh public/models public/ort
