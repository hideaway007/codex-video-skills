#!/usr/bin/env node
import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function flag(name) {
  return process.argv.includes(`--${name}`);
}

function run(command, commandArgs) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, commandArgs, { stdio: "inherit" });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} exited with ${code}`));
    });
  });
}

function capture(command, commandArgs) {
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
      if (code === 0) resolveRun(stdout.trim());
      else rejectRun(new Error(`${command} exited with ${code}\n${stderr}`));
    });
  });
}

async function durationOf(file) {
  const outputText = await capture("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    file,
  ]);
  const seconds = Number(outputText);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Could not read duration for ${file}`);
  }
  return seconds;
}

const url = arg(
  "url",
  "http://127.0.0.1:5175/?auto=1&record=1&autostart=1",
);
const viewportRaw = arg("viewport", "1920x1080");
const durationSec = Number(arg("duration", "10"));
const fps = Number(arg("fps", "30"));
const quality = Number(arg("quality", "90"));
const outDir = resolve(arg("out", "output/cdp-screencast"));
const output = resolve(arg("output", `${outDir}/cdp-screencast.mp4`));
const audio = arg("audio", "");
const chromePath = arg(
  "chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
);
const keepFrames = flag("keep-frames");

const match = viewportRaw.match(/^(\d+)x(\d+)$/);
if (!match) {
  console.error("Expected --viewport=WIDTHxHEIGHT");
  process.exit(1);
}
const width = Number(match[1]);
const height = Number(match[2]);
if (!Number.isFinite(durationSec) || durationSec <= 0) {
  console.error("Expected --duration to be a positive number of seconds");
  process.exit(1);
}
if (!existsSync(chromePath)) {
  console.error(`Chrome executable not found: ${chromePath}`);
  process.exit(1);
}

const framesDir = resolve(outDir, "frames");
await rm(framesDir, { recursive: true, force: true });
await mkdir(framesDir, { recursive: true });
await mkdir(dirname(output), { recursive: true });

const frames = [];
let frameIndex = 0;

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: [
    "--autoplay-policy=no-user-gesture-required",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
  ],
  defaultViewport: { width, height, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const client = await page.createCDPSession();
  await client.send("Page.enable");

  client.on("Page.screencastFrame", async (event) => {
    const index = frameIndex;
    frameIndex += 1;
    const file = resolve(framesDir, `frame_${String(index).padStart(6, "0")}.jpg`);
    frames.push({
      file,
      timestamp: event.metadata.timestamp,
    });
    await writeFile(file, Buffer.from(event.data, "base64"));
    await client.send("Page.screencastFrameAck", { sessionId: event.sessionId });
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await new Promise((resolveWait) => setTimeout(resolveWait, 800));

  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality,
    maxWidth: width,
    maxHeight: height,
    everyNthFrame: 1,
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, durationSec * 1000));
  await client.send("Page.stopScreencast");
  await new Promise((resolveWait) => setTimeout(resolveWait, 500));
} finally {
  await browser.close();
}

if (frames.length < 2) {
  console.error(`Captured too few frames: ${frames.length}`);
  process.exit(1);
}

frames.sort((a, b) => a.timestamp - b.timestamp);

const concatFile = resolve(outDir, "frames.ffconcat");
const fallbackDuration = 1 / fps;
const minFrameDuration = 1 / 120;
let concat = "ffconcat version 1.0\n";
for (let i = 0; i < frames.length; i += 1) {
  const current = frames[i];
  const next = frames[i + 1];
  const rawDuration = next
    ? next.timestamp - current.timestamp
    : durationSec - (current.timestamp - frames[0].timestamp);
  const duration = Math.max(rawDuration, minFrameDuration);
  concat += `file '${current.file.replaceAll("'", "'\\''")}'\n`;
  concat += `duration ${duration.toFixed(6)}\n`;
}
concat += `file '${frames.at(-1).file.replaceAll("'", "'\\''")}'\n`;
await writeFile(concatFile, concat, "utf8");

const visualOutput = audio ? resolve(outDir, "_visual.mp4") : output;
await run("ffmpeg", [
  "-y",
  "-v",
  "warning",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concatFile,
  "-vf",
  `scale=in_range=pc:out_range=tv,format=yuv420p,fps=${fps}`,
  "-r",
  String(fps),
  "-c:v",
  "libx264",
  "-crf",
  "14",
  "-preset",
  "slow",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  visualOutput,
]);

if (audio) {
  const audioPath = resolve(audio);
  let visualForMux = visualOutput;
  const visualDuration = await durationOf(visualOutput);
  const audioDuration = await durationOf(audioPath);
  if (visualDuration + 0.1 < audioDuration) {
    const finalFrame = resolve(outDir, "_final-frame.png");
    const extendedVisual = resolve(outDir, "_visual-extended.mp4");
    const seek = String(Math.max(0, visualDuration - 0.2));
    const tailDuration = String(audioDuration - visualDuration);
    await run("ffmpeg", [
      "-y",
      "-v",
      "warning",
      "-ss",
      seek,
      "-i",
      visualOutput,
      "-frames:v",
      "1",
      finalFrame,
    ]);
    await run("ffmpeg", [
      "-y",
      "-v",
      "warning",
      "-i",
      visualOutput,
      "-loop",
      "1",
      "-t",
      tailDuration,
      "-i",
      finalFrame,
      "-filter_complex",
      `[0:v]setsar=1[v0];[1:v]scale=${width}:${height},format=yuv420p,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0[v]`,
      "-map",
      "[v]",
      "-c:v",
      "libx264",
      "-crf",
      "14",
      "-preset",
      "slow",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      extendedVisual,
    ]);
    visualForMux = extendedVisual;
  }
  await run("ffmpeg", [
    "-y",
    "-v",
    "warning",
    "-i",
    visualForMux,
    "-i",
    audioPath,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    output,
  ]);
}

const report = {
  url,
  viewport: { width, height },
  requestedDurationSec: durationSec,
  frames: frames.length,
  firstTimestamp: frames[0].timestamp,
  lastTimestamp: frames.at(-1).timestamp,
  capturedDurationSec: Number(
    (frames.at(-1).timestamp - frames[0].timestamp).toFixed(3),
  ),
  output,
  audio: audio || null,
};
await writeFile(resolve(outDir, "report.json"), JSON.stringify(report, null, 2));
if (!keepFrames) await rm(framesDir, { recursive: true, force: true });
console.log(JSON.stringify(report, null, 2));
