#!/usr/bin/env bash
set -euo pipefail

PDF_PATH="${1:-/Users/anderschan/Downloads/DSM 5 TR-APA (2022).pdf}"
OUT_DIR="${2:-./scratch/dsm5-pages}"

if ! command -v pdftotext >/dev/null 2>&1; then
  echo "pdftotext is required but not installed." >&2
  exit 1
fi

if [[ ! -f "$PDF_PATH" ]]; then
  echo "PDF not found: $PDF_PATH" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

extract_range() {
  local slug="$1"
  local start="$2"
  local end="$3"
  local output="$OUT_DIR/$slug.txt"
  echo "Extracting $slug ($start-$end) -> $output"
  pdftotext -layout -f "$start" -l "$end" "$PDF_PATH" "$output"
}

extract_range "mdd" 308 317
extract_range "persistent-depressive-disorder" 319 322
extract_range "social-anxiety-disorder" 366 371
extract_range "panic-disorder" 373 379
extract_range "gad" 392 395
extract_range "ocd" 409 414
extract_range "ptsd" 454 467
extract_range "acute-stress-disorder" 469 475
extract_range "adjustment-disorder" 476 479
extract_range "adhd" 167 172
extract_range "bipolar-i" 254 265
extract_range "bipolar-ii" 267 275
extract_range "alcohol-use-disorder" 764 772
extract_range "cannabis-use-disorder" 790 797
extract_range "borderline-personality-disorder" 1002 1005

echo "Done. Scratch files written to $OUT_DIR"
