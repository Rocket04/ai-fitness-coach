#!/bin/bash
# Run Lighthouse audit for PWA quality
# Usage: ./lighthouse-audit.sh [url] [output-dir]
URL="${1:-http://localhost:5000}"
OUTPUT_DIR="${2:-./lighthouse}"

mkdir -p "$OUTPUT_DIR"

npx lighthouse "$URL" \
  --output=json \
  --output-path="$OUTPUT_DIR/report.json" \
  --preset=mobile \
  --chrome-flags="--headless" \
  --quiet

echo "Lighthouse report saved to $OUTPUT_DIR/report.json"
echo "View summary: npx lighthouse-ci autorun --collect.settings.url=$URL --upload.target=temporary-public-storage"