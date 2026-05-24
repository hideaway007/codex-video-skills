#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALIDATOR="${CODEX_SKILL_VALIDATOR:-}"

if [ -z "$VALIDATOR" ]; then
  for candidate in \
    "$HOME/.codex/skills/.system/skill-creator/scripts/quick_validate.py" \
    "$HOME/.codex/plugins/cache/openai-bundled/skill-creator/scripts/quick_validate.py"; do
    if [ -f "$candidate" ]; then
      VALIDATOR="$candidate"
      break
    fi
  done
fi

if [ -z "$VALIDATOR" ] || [ ! -f "$VALIDATOR" ]; then
  echo "quick_validate.py not found. Set CODEX_SKILL_VALIDATOR=/path/to/quick_validate.py" >&2
  exit 2
fi

for skill_dir in "$ROOT_DIR"/skills/*; do
  [ -d "$skill_dir" ] || continue
  echo "validating $(basename "$skill_dir")"
  python3 "$VALIDATOR" "$skill_dir"
done

echo "all skills valid"
