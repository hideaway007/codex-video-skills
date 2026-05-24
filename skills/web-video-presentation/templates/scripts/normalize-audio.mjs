#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), "..");
const SEGMENTS = resolve(ROOT, "audio-segments.json");

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function run(command, commandArgs) {
  return new Promise((resolveRun, rejectRun) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(command, commandArgs, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) resolveRun({ stdout, stderr });
      else rejectRun(new Error(`${command} exited with ${code}\n${stderr}`));
    });
  });
}

async function durationSec(file) {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    file,
  ]);
  return Number(stdout.trim());
}

async function meanVolume(file) {
  const { stderr } = await run("ffmpeg", [
    "-hide_banner",
    "-i",
    file,
    "-af",
    "volumedetect",
    "-f",
    "null",
    "-",
  ]);
  const mean = stderr.match(/mean_volume: ([-0-9.]+) dB/);
  const max = stderr.match(/max_volume: ([-0-9.]+) dB/);
  return {
    meanDb: mean ? Number(mean[1]) : null,
    maxDb: max ? Number(max[1]) : null,
  };
}

if (!existsSync(SEGMENTS)) {
  console.error("audio-segments.json not found. Run: npm run extract-narrations");
  process.exit(1);
}

await run("ffmpeg", ["-version"]);
await run("ffprobe", ["-version"]);

const inputDir = resolve(ROOT, arg("input-dir", "public/audio"));
const outputDir = resolve(ROOT, arg("output-dir", "public/audio-normalized"));
const targetI = arg("i", "-18");
const targetTp = arg("tp", "-1.5");
const targetLra = arg("lra", "7");
const noiseFloor = arg("noise-floor", "-48");
const highpass = arg("highpass", "80");
const segments = JSON.parse(await readFile(SEGMENTS, "utf8"));
const rows = [];

for (let i = 0; i < segments.length; i += 1) {
  const segment = segments[i];
  const input = resolve(inputDir, segment.audio);
  const output = resolve(outputDir, segment.audio);
  if (!existsSync(input)) {
    throw new Error(`Missing input audio: ${input}`);
  }
  await mkdir(dirname(output), { recursive: true });
  const before = await meanVolume(input);
  const filter = [
    `highpass=f=${highpass}`,
    `afftdn=nf=${noiseFloor}`,
    `loudnorm=I=${targetI}:TP=${targetTp}:LRA=${targetLra}`,
    "alimiter=limit=0.95",
  ].join(",");

  await run("ffmpeg", [
    "-y",
    "-v",
    "warning",
    "-i",
    input,
    "-af",
    filter,
    "-codec:a",
    "libmp3lame",
    "-q:a",
    "2",
    output,
  ]);
  const after = await meanVolume(output);
  const duration = await durationSec(output);
  rows.push({
    index: i + 1,
    audio: segment.audio,
    durationSec: Number(duration.toFixed(2)),
    before,
    after,
  });
  console.log(
    `[${String(i + 1).padStart(2, " ")}/${segments.length}] ${segment.audio} ` +
      `${before.meanDb}dB -> ${after.meanDb}dB`,
  );
}

const report = {
  inputDir,
  outputDir,
  target: {
    integratedLufs: Number(targetI),
    truePeakDb: Number(targetTp),
    lra: Number(targetLra),
    noiseFloorDb: Number(noiseFloor),
    highpassHz: Number(highpass),
  },
  segments: rows,
};
await writeFile(
  resolve(outputDir, "normalize-report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(`✓ wrote ${resolve(outputDir, "normalize-report.json")}`);
