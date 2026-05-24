#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"

mkdir -p "$TARGET_DIR"

for skill_dir in "$ROOT_DIR"/skills/*; do
  [ -d "$skill_dir" ] || continue
  skill_name="$(basename "$skill_dir")"
  if [ ! -f "$skill_dir/SKILL.md" ]; then
    echo "skip $skill_name: missing SKILL.md" >&2
    continue
  fi
  rm -rf "$TARGET_DIR/$skill_name"
  cp -R "$skill_dir" "$TARGET_DIR/$skill_name"
  echo "installed $skill_name -> $TARGET_DIR/$skill_name"
done

echo "done"
