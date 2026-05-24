#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# synthesize-audio.sh — read audio-segments.json and synthesize one mp3
# per segment under public/audio/<chapter>/<N>.mp3.
#
# Prereq:
#   1. npm run extract-narrations   (writes audio-segments.json)
#   2. DOUBAO_TTS_API_KEY or VOLCENGINE_TTS_API_KEY for default Volcengine/Doubao TTS
#
# Behavior:
#   • Serial calls (TTS APIs commonly rate-limit parallel requests).
#   • Skips segments whose mp3 already exists (so you can rerun safely
#     after a partial failure). Pass --force to re-synthesize all.
#   • Prints progress per segment with elapsed time.
#
# Usage:
#   bash scripts/synthesize-audio.sh                # incremental
#   bash scripts/synthesize-audio.sh --force        # overwrite all
#   bash scripts/synthesize-audio.sh --engine=melotts # use local MeloTTS instead
#   bash scripts/synthesize-audio.sh --engine=mmx     # use MiniMax instead
#   bash scripts/synthesize-audio.sh --speed=1.2    # default cloud/MeloTTS speed
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$ROOT/../.." && pwd)"
SEGMENTS="$ROOT/audio-segments.json"
OUT_DIR="$ROOT/public/audio"
DEFAULT_ENGINE="volcengine"
DEFAULT_VOICE="zh_male_liufei_uranus_bigtts"
DEFAULT_RESOURCE_ID="seed-tts-2.0"
DEFAULT_SAMPLE_RATE="24000"
DEFAULT_SPEECH_RATE="20"
DEFAULT_PITCH_RATE="0"
DEFAULT_VOLUME_RATIO="1.2"
DEFAULT_VOLCENGINE_ENV_FILE="$HOME/.config/doubao-tts/env"
DEFAULT_VOICE_SAMPLE="$PROJECT_ROOT/tts_samples/melotts_zh_standard.wav"
DEFAULT_TTS_BIN="$PROJECT_ROOT/.venv-tts/bin/melotts"

FORCE=false
ENGINE="$DEFAULT_ENGINE"
VOICE="$DEFAULT_VOICE"
RESOURCE_ID="$DEFAULT_RESOURCE_ID"
SAMPLE_RATE="$DEFAULT_SAMPLE_RATE"
SPEECH_RATE="$DEFAULT_SPEECH_RATE"
PITCH_RATE="$DEFAULT_PITCH_RATE"
VOLUME_RATIO="$DEFAULT_VOLUME_RATIO"
VOICE_SAMPLE="$DEFAULT_VOICE_SAMPLE"
TTS_BIN="$DEFAULT_TTS_BIN"
LANGUAGE="zh"
SPEED="1.2"
DEVICE="auto"
VOICE_ARG=""
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    --engine=*) ENGINE="${arg#--engine=}" ;;
    --voice-sample=*) VOICE_SAMPLE="${arg#--voice-sample=}" ;;
    --tts-bin=*) TTS_BIN="${arg#--tts-bin=}" ;;
    --language=*) LANGUAGE="${arg#--language=}" ;;
    --speed=*) SPEED="${arg#--speed=}"; SPEECH_RATE="$(python3 -c 'import sys; print(round((float(sys.argv[1]) - 1.0) * 100))' "${arg#--speed=}")" ;;
    --device=*) DEVICE="${arg#--device=}" ;;
    --voice=*) VOICE="${arg#--voice=}" ;;
    --resource-id=*) RESOURCE_ID="${arg#--resource-id=}" ;;
    --sample-rate=*) SAMPLE_RATE="${arg#--sample-rate=}" ;;
    --speech-rate=*) SPEECH_RATE="${arg#--speech-rate=}" ;;
    --pitch-rate=*) PITCH_RATE="${arg#--pitch-rate=}" ;;
    --volume-ratio=*) VOLUME_RATIO="${arg#--volume-ratio=}" ;;
    *) echo "✗ unknown arg: $arg" >&2; exit 1 ;;
  esac
done
VOICE_ARG="--voice $VOICE"

if [[ -z "${DOUBAO_TTS_API_KEY:-${VOLCENGINE_TTS_API_KEY:-}}" && -f "$DEFAULT_VOLCENGINE_ENV_FILE" ]]; then
  # Local-only secrets file; keep API keys out of reusable skill code and project repos.
  # shellcheck source=/dev/null
  source "$DEFAULT_VOLCENGINE_ENV_FILE"
fi

if [[ ! -f "$SEGMENTS" ]]; then
  echo "✗ $SEGMENTS not found. Run: npm run extract-narrations" >&2
  exit 1
fi
if ! command -v jq >/dev/null; then
  echo "✗ jq is required to read audio-segments.json" >&2
  exit 1
fi
if [[ "$ENGINE" == "volcengine" || "$ENGINE" == "doubao" || "$ENGINE" == "volc" ]]; then
  ENGINE="volcengine"
  if [[ -z "${DOUBAO_TTS_API_KEY:-${VOLCENGINE_TTS_API_KEY:-}}" ]]; then
    cat <<EOF >&2
✗ Volcengine/Doubao TTS API key missing.

  Set one of:
    export DOUBAO_TTS_API_KEY=...
    export VOLCENGINE_TTS_API_KEY=...

  Or choose another engine:
    npm run synthesize-audio -- --engine=melotts
    npm run synthesize-audio -- --engine=mmx
EOF
    exit 1
  fi
  if ! command -v python3 >/dev/null; then
    echo "✗ python3 is required for Volcengine/Doubao TTS response decoding" >&2
    exit 1
  fi
  if ! command -v curl >/dev/null; then
    echo "✗ curl is required for Volcengine/Doubao TTS requests" >&2
    exit 1
  fi
elif [[ "$ENGINE" == "melotts" ]]; then
  if [[ ! -f "$VOICE_SAMPLE" ]]; then
    echo "✗ default MeloTTS voice sample not found: $VOICE_SAMPLE" >&2
    exit 1
  fi
  if [[ ! -x "$TTS_BIN" ]]; then
    echo "✗ MeloTTS CLI not found or not executable: $TTS_BIN" >&2
    exit 1
  fi
  if ! command -v ffmpeg >/dev/null; then
    echo "✗ ffmpeg is required to convert MeloTTS wav output to mp3" >&2
    exit 1
  fi
elif [[ "$ENGINE" == "mmx" ]]; then
  if ! command -v mmx >/dev/null; then
    cat <<EOF >&2
✗ mmx CLI not found in PATH.

  Install:  npm install -g mmx-cli
  Login:    mmx auth login --api-key sk-xxxxx
            (get a key at https://platform.minimaxi.com)

Default is now Volcengine/Doubao TTS. To use it, run without --engine=mmx.
EOF
    exit 1
  fi
else
  echo "✗ unknown engine: $ENGINE (expected volcengine, melotts, or mmx)" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

total=$(jq 'length' "$SEGMENTS")
i=0
synthesized=0
skipped=0
failed=0

while IFS= read -r row; do
  i=$((i + 1))
  chapter=$(echo "$row" | jq -r '.chapter')
  step=$(echo "$row" | jq -r '.step')
  text=$(echo "$row" | jq -r '.text')
  out="$OUT_DIR/$chapter/$step.mp3"

  if [[ -z "$text" ]]; then
    skipped=$((skipped + 1))
    printf "[%3d/%d] %-20s skip (empty narration)\n" "$i" "$total" "$chapter/$step.mp3"
    continue
  fi
  if [[ -f "$out" && "$FORCE" != true ]]; then
    skipped=$((skipped + 1))
    printf "[%3d/%d] %-20s skip (exists)\n" "$i" "$total" "$chapter/$step.mp3"
    continue
  fi

  mkdir -p "$(dirname "$out")"
  start=$(date +%s)
  ok=false
  if [[ "$ENGINE" == "volcengine" ]]; then
    safe_name="${chapter//\//__}-$step"
    raw_file="$TMP_DIR/$safe_name.jsonl"
    body_file="$TMP_DIR/$safe_name.body.json"
    tts_auth_header_value="${DOUBAO_TTS_API_KEY:-${VOLCENGINE_TTS_API_KEY:-}}"
    request_id="$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)"
    if TEXT="$text" VOICE="$VOICE" SAMPLE_RATE="$SAMPLE_RATE" SPEECH_RATE="$SPEECH_RATE" PITCH_RATE="$PITCH_RATE" VOLUME_RATIO="$VOLUME_RATIO" BODY_FILE="$body_file" python3 - <<'PY' >/dev/null
import json
import os
import pathlib

speech_rate = int(float(os.environ["SPEECH_RATE"]))
pitch_rate = int(float(os.environ["PITCH_RATE"]))
volume_ratio = float(os.environ["VOLUME_RATIO"])
payload = {
    "req_params": {
        "text": os.environ["TEXT"],
        "speaker": os.environ["VOICE"],
        "audio_params": {
            "format": "mp3",
            "sample_rate": int(os.environ["SAMPLE_RATE"]),
            "speech_rate": speech_rate,
            "pitch_rate": pitch_rate,
            "volume_ratio": volume_ratio,
        },
    }
}
pathlib.Path(os.environ["BODY_FILE"]).write_text(
    json.dumps(payload, ensure_ascii=False),
    encoding="utf-8",
)
PY
    then
      if http_status=$(curl -sS -X POST "https://openspeech.bytedance.com/api/v3/tts/unidirectional" \
           -H "Content-Type: application/json" \
           -H "X-Api-Key: ${tts_auth_header_value}" \
           -H "X-Api-Resource-Id: ${RESOURCE_ID}" \
           -H "X-Api-Request-Id: ${request_id}" \
           -o "$raw_file" \
           -w "%{http_code}" \
           --data @"$body_file") &&
         RAW_FILE="$raw_file" OUT_FILE="$out" HTTP_STATUS="$http_status" python3 - <<'PY' >/dev/null
import base64
import json
import os
import pathlib

raw_path = pathlib.Path(os.environ["RAW_FILE"])
raw = raw_path.read_bytes()
if os.environ["HTTP_STATUS"] != "200":
    raise SystemExit(f"HTTP {os.environ['HTTP_STATUS']}: {raw[:500]!r}")

chunks = []
for line in raw.decode("utf-8", errors="replace").splitlines():
    line = line.strip()
    if not line:
        continue
    try:
        event = json.loads(line)
    except json.JSONDecodeError:
        continue
    data = event.get("data") or event.get("payload_msg", {}).get("data")
    if data:
        chunks.append(base64.b64decode(data))

if not chunks:
    raise SystemExit(raw[:500].decode("utf-8", errors="replace"))

pathlib.Path(os.environ["OUT_FILE"]).write_bytes(b"".join(chunks))
PY
      then
        ok=true
      fi
    fi
  elif [[ "$ENGINE" == "melotts" ]]; then
    safe_name="${chapter//\//__}-$step"
    text_file="$TMP_DIR/$safe_name.txt"
    wav_file="$TMP_DIR/$safe_name.wav"
    printf '%s' "$text" > "$text_file"
    if "$TTS_BIN" --file --language "$LANGUAGE" --speed "$SPEED" --device "$DEVICE" \
         "$text_file" "$wav_file" >/dev/null 2>&1 &&
       ffmpeg -y -v error -i "$wav_file" -codec:a libmp3lame -q:a 2 "$out" >/dev/null 2>&1; then
      ok=true
    fi
  else
    if mmx speech synthesize $VOICE_ARG --text "$text" --out "$out" >/dev/null 2>&1; then
      ok=true
    fi
  fi

  if [[ "$ok" == true ]]; then
    elapsed=$(( $(date +%s) - start ))
    synthesized=$((synthesized + 1))
    printf "[%3d/%d] %-20s ✓ %ss\n" "$i" "$total" "$chapter/$step.mp3" "$elapsed"
  else
    failed=$((failed + 1))
    printf "[%3d/%d] %-20s ✗ FAILED\n" "$i" "$total" "$chapter/$step.mp3" >&2
  fi
done < <(jq -c '.[]' "$SEGMENTS")

echo
echo "✓ done — synthesized $synthesized, skipped $skipped, failed $failed"
echo "engine=$ENGINE"
if [[ "$ENGINE" == "melotts" ]]; then
  echo "voice_sample=$VOICE_SAMPLE"
  echo "language=$LANGUAGE speed=$SPEED device=$DEVICE"
elif [[ "$ENGINE" == "volcengine" ]]; then
  echo "resource_id=$RESOURCE_ID"
  echo "voice=$VOICE"
  echo "sample_rate=$SAMPLE_RATE"
  echo "speech_rate=$SPEECH_RATE"
  echo "pitch_rate=$PITCH_RATE"
  echo "volume_ratio=$VOLUME_RATIO"
fi
[[ $failed -eq 0 ]] || exit 2
