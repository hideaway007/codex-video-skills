#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <panels_dir> <presentation_dir>" >&2
  exit 2
fi

panels_dir="${1%/}"
presentation_dir="${2%/}"
target_dir="$presentation_dir/public/assets/panels"

if [[ ! -d "$panels_dir" ]]; then
  echo "Panels directory not found: $panels_dir" >&2
  exit 1
fi

if [[ ! -f "$panels_dir/manifest.json" ]]; then
  echo "manifest.json not found in: $panels_dir" >&2
  exit 1
fi

if [[ ! -d "$presentation_dir" ]]; then
  echo "Presentation directory not found: $presentation_dir" >&2
  exit 1
fi

shopt -s nullglob
panel_files=("$panels_dir"/panel_*.png)
if [[ ${#panel_files[@]} -eq 0 ]]; then
  echo "No panel_*.png files found in: $panels_dir" >&2
  exit 1
fi

mkdir -p "$target_dir"
cp "$panels_dir/manifest.json" "$target_dir/manifest.json"
cp "${panel_files[@]}" "$target_dir/"

echo "Imported ${#panel_files[@]} panel(s) to $target_dir"
