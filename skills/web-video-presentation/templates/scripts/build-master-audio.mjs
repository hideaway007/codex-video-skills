#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const SEGMENTS = resolve(ROOT, "audio-segments.json");

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const AUDIO_DIR = resolve(ROOT, arg("audio-dir", "public/audio"));
const MASTER_NAME = arg("master-name", "master.mp3");
const TIMELINE_NAME = arg("timeline-name", "timeline.json");
const MASTER_AUDIO = resolve(AUDIO_DIR, MASTER_NAME);
const TIMELINE = resolve(AUDIO_DIR, TIMELINE_NAME);

function run(command, commandArgs, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(command, commandArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) resolveRun({ stdout, stderr });
      else rejectRun(new Error(`${command} exited with ${code}\n${stderr}`));
    });
  });
}

async function requireCommand(command) {
  try {
    await run(command, ["-version"]);
  } catch {
    console.error(`✗ ${command} is not available. Install ffmpeg first.`);
    process.exit(1);
  }
}

async function durationMs(file) {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    file,
  ]);
  const seconds = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Could not read duration for ${file}`);
  }
  return Math.round(seconds * 1000);
}

function concatPath(file) {
  return file.replaceAll("'", "'\\''");
}

if (!existsSync(SEGMENTS)) {
  console.error(`✗ ${SEGMENTS} not found. Run: npm run extract-narrations`);
  process.exit(1);
}

await requireCommand("ffprobe");
await requireCommand("ffmpeg");

const segments = JSON.parse(await readFile(SEGMENTS, "utf8"));
const missing = [];
const cues = [];
let totalMs = 0;

for (let i = 0; i < segments.length; i += 1) {
  const segment = segments[i];
  const file = resolve(AUDIO_DIR, segment.audio);
  if (!existsSync(file)) {
    missing.push(segment.audio);
    continue;
  }

  const ms = await durationMs(file);
  const startMs = totalMs;
  const endMs = startMs + ms;
  cues.push({
    globalIndex: i,
    chapter: segment.chapter,
    step: segment.step,
    audio: segment.audio,
    text: segment.text,
    startMs,
    endMs,
    durationMs: ms,
  });
  totalMs = endMs;
}

if (missing.length > 0) {
  console.error("✗ Missing segment mp3 files:");
  for (const item of missing) console.error(`  ${item}`);
  console.error("\nRun: npm run synthesize-audio");
  process.exit(1);
}

const tempRoot = await mkdtemp(join(tmpdir(), "web-video-master-audio-"));
const concatFile = join(tempRoot, "concat.txt");

try {
  const concatLines = segments
    .map((segment) => `file '${concatPath(resolve(AUDIO_DIR, segment.audio))}'`)
    .join("\n");
  await writeFile(concatFile, `${concatLines}\n`, "utf8");
  await mkdir(AUDIO_DIR, { recursive: true });

  await run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFile,
    "-c:a",
    "libmp3lame",
    "-q:a",
    "2",
    MASTER_AUDIO,
  ]);

  await writeFile(
    TIMELINE,
    JSON.stringify(
      {
        version: 1,
        audio: MASTER_NAME,
        source: "audio-segments.json",
        totalMs,
        cues,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

const seconds = (totalMs / 1000).toFixed(2);
console.log(`✓ wrote ${MASTER_AUDIO}`);
console.log(`✓ wrote ${TIMELINE}`);
console.log(`segments=${cues.length} duration=${seconds}s`);
