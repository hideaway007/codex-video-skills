#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
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

function displayWidth(str) {
  let width = 0;
  for (const ch of str) {
    if (/\s/.test(ch)) width += 0.5;
    else if (/[^\x00-\xff]/.test(ch)) width += 2;
    else width += 1;
  }
  return width;
}

function phraseSplit(text) {
  const parts = [];
  let buffer = "";
  for (const ch of text.replace(/\s*\n\s*/g, " ").trim()) {
    buffer += ch;
    if (/[。！？；：，,]/.test(ch)) {
      parts.push(buffer.trim());
      buffer = "";
    }
  }
  if (buffer.trim()) parts.push(buffer.trim());
  return parts.length ? parts : [text.trim()];
}

function splitLongPhrase(str, maxWidth) {
  if (displayWidth(str) <= maxWidth) return [str];

  const chunks = [];
  let line = "";
  let lastBreakIndex = -1;
  const breakChars = /[，、：, ]/;

  for (const ch of str) {
    line += ch;
    if (breakChars.test(ch)) lastBreakIndex = [...line].length;

    if (displayWidth(line) > maxWidth) {
      if (lastBreakIndex > 0) {
        const chars = [...line];
        const head = chars.slice(0, lastBreakIndex).join("").trim();
        const tail = chars.slice(lastBreakIndex).join("").trim();
        if (head) chunks.push(head);
        line = tail;
      } else {
        const chars = [...line];
        const tail = chars.pop() ?? "";
        const head = chars.join("").trim();
        if (head) chunks.push(head);
        line = tail;
      }
      lastBreakIndex = -1;
    }
  }

  if (line.trim()) chunks.push(line.trim());
  return chunks;
}

function mergeSmallChunks(chunks, maxWidth, minWidth) {
  const result = [];

  for (const chunk of chunks) {
    const previous = result.at(-1);
    const isTiny = displayWidth(chunk) < minWidth;
    const isToken = /^(Agent|AI|PPT)[。？！，,：]?$/.test(chunk);
    if (previous && (isTiny || isToken) && displayWidth(previous + chunk) <= maxWidth) {
      result[result.length - 1] = previous + chunk;
    } else {
      result.push(chunk);
    }
  }

  for (let i = 0; i < result.length - 1; i += 1) {
    if (displayWidth(result[i]) < minWidth && displayWidth(result[i] + result[i + 1]) <= maxWidth) {
      result[i + 1] = result[i] + result[i + 1];
      result.splice(i, 1);
      i -= 1;
    }
  }

  return result;
}

function makeEvents(cue, maxTextWidth, mergeWidth, minTextWidth) {
  const rawChunks = phraseSplit(cue.text).flatMap((part) =>
    splitLongPhrase(part, maxTextWidth),
  );
  const chunks = mergeSmallChunks(rawChunks, mergeWidth, minTextWidth);
  const weights = chunks.map((chunk) => Math.max(5, displayWidth(chunk)));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = cue.startMs;

  return chunks.map((text, index) => {
    const startMs = cursor;
    const endMs = index === chunks.length - 1
      ? cue.endMs
      : Math.round(cursor + (cue.endMs - cue.startMs) * (weights[index] / totalWeight));
    cursor = endMs;
    return {
      startMs,
      endMs,
      durationMs: endMs - startMs,
      chapter: cue.chapter,
      step: cue.step,
      text,
    };
  });
}

function assTime(ms) {
  const totalCentiseconds = Math.max(0, Math.round(ms / 10));
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function assEscape(str) {
  return str.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function defaultOutputPath(inputPath) {
  const parsedExt = extname(inputPath);
  const base = basename(inputPath, parsedExt);
  return resolve(dirname(inputPath), `${base}-subtitled${parsedExt || ".mp4"}`);
}

const timelinePath = resolve(arg("timeline", "public/audio-normalized/timeline-normalized.json"));
const inputVideo = resolve(arg("input", "output/cdp-full/final.mp4"));
const outputVideo = resolve(arg("output", defaultOutputPath(inputVideo)));
const outDir = resolve(arg("out", "output/subtitles"));
const chromePath = arg("chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
const fontSize = Number(arg("font-size", "66"));
const bottom = Number(arg("bottom", "36"));
const maxTextWidth = Number(arg("max-text-width", "36"));
const mergeWidth = Number(arg("merge-width", "38"));
const minTextWidth = Number(arg("min-text-width", "8"));
const maxPixelWidth = Number(arg("max-pixel-width", "1660"));
const fps = Number(arg("fps", "30"));

if (!existsSync(timelinePath)) {
  console.error(`Timeline not found: ${timelinePath}`);
  process.exit(1);
}
if (!existsSync(inputVideo)) {
  console.error(`Input video not found: ${inputVideo}`);
  process.exit(1);
}
if (!existsSync(chromePath)) {
  console.error(`Chrome executable not found: ${chromePath}`);
  process.exit(1);
}

const timeline = JSON.parse(readFileSync(timelinePath, "utf8"));
if (!Array.isArray(timeline.cues) || timeline.cues.length === 0) {
  console.error(`Timeline has no cues: ${timelinePath}`);
  process.exit(1);
}

const framesDir = resolve(outDir, "frames-segmented-white");
const concatPath = resolve(outDir, "subtitle-layer-segmented-white.ffconcat");
const eventsPath = resolve(outDir, "subtitle-events-segmented-white.json");
const assPath = resolve(outDir, "subtitles-segmented-white.zh.ass");

await rm(framesDir, { recursive: true, force: true });
await mkdir(framesDir, { recursive: true });
await mkdir(dirname(outputVideo), { recursive: true });

const events = timeline.cues.flatMap((cue) =>
  makeEvents(cue, maxTextWidth, mergeWidth, minTextWidth),
);

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: [
    "--hide-scrollbars",
    "--font-render-hinting=none",
    "--window-size=1920,1080",
  ],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
});

const rendered = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1920px;height:1080px;background:transparent;overflow:hidden}
.caption{position:absolute;left:50%;bottom:${bottom}px;transform:translateX(-50%);max-width:${maxPixelWidth}px;box-sizing:border-box;color:#fffaf0;font-family:"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC",sans-serif;font-size:${fontSize}px;font-weight:700;line-height:1.08;text-align:center;white-space:nowrap;-webkit-text-stroke:5px rgba(32,24,20,.78);paint-order:stroke fill;text-shadow:0 4px 16px rgba(32,24,20,.38),0 1px 3px rgba(32,24,20,.55)}
</style></head><body><div class="caption"></div><script>
window.setCaption=(text)=>{
  const el=document.querySelector(".caption");
  el.textContent=text;
  el.style.fontSize="${fontSize}px";
  el.style.transform="translateX(-50%) scaleX(1)";
  const maxWidth=${maxPixelWidth};
  let size=${fontSize};
  while(el.scrollWidth>maxWidth&&size>${Math.max(24, fontSize - 10)}){
    size-=1;
    el.style.fontSize=size+"px";
  }
  if(el.scrollWidth>maxWidth){
    const scale=Math.max(.92,maxWidth/el.scrollWidth);
    el.style.transform="translateX(-50%) scaleX("+scale+")";
  }
  return {fontSize:size,scrollWidth:el.scrollWidth,text};
};
</script></body></html>`, { waitUntil: "load" });
  await page.evaluateHandle("document.fonts.ready");

  for (let i = 0; i < events.length; i += 1) {
    const metric = await page.evaluate((text) => window.setCaption(text), events[i].text);
    const file = resolve(framesDir, `subtitle_${String(i).padStart(4, "0")}.png`);
    await page.screenshot({
      path: file,
      type: "png",
      omitBackground: true,
      fullPage: false,
    });
    events[i].file = file;
    rendered.push({
      index: i,
      text: events[i].text,
      fontSize: metric.fontSize,
      scrollWidth: metric.scrollWidth,
      durationMs: events[i].durationMs,
    });
  }
} finally {
  await browser.close();
}

let concat = "ffconcat version 1.0\n";
for (const event of events) {
  concat += `file '${event.file.replaceAll("'", "'\\''")}'\n`;
  concat += `duration ${((event.endMs - event.startMs) / 1000).toFixed(6)}\n`;
}
concat += `file '${events.at(-1).file.replaceAll("'", "'\\''")}'\n`;
await writeFile(concatPath, concat, "utf8");
await writeFile(eventsPath, JSON.stringify(events, null, 2), "utf8");

const ass = `[Script Info]
ScriptType: v4.00+
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,PingFang SC,${fontSize},&H00F0FAFF,&H000000FF,&H00141820,&H00000000,1,0,0,0,100,100,0,0,1,5,0,2,120,120,${bottom},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
` + events.map((event) =>
  `Dialogue: 0,${assTime(event.startMs)},${assTime(event.endMs)},Default,,0,0,0,,${assEscape(event.text)}`,
).join("\n") + "\n";
await writeFile(assPath, ass, "utf8");

await run("ffmpeg", [
  "-y",
  "-v",
  "warning",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concatPath,
  "-i",
  inputVideo,
  "-filter_complex",
  `[0:v]format=rgba,fps=${fps},setpts=PTS-STARTPTS[ov];[1:v]setpts=PTS-STARTPTS[base];[base][ov]overlay=0:0:format=auto,format=yuv420p[v]`,
  "-map",
  "[v]",
  "-map",
  "1:a?",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "14",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "copy",
  "-shortest",
  "-movflags",
  "+faststart",
  outputVideo,
]);

const summary = {
  input: inputVideo,
  output: outputVideo,
  timeline: timelinePath,
  cues: timeline.cues.length,
  subtitleEvents: events.length,
  style: {
    color: "white",
    fontSize,
    background: "none",
    segmentedBy: "punctuation-and-cue-duration",
  },
  artifacts: {
    concat: concatPath,
    events: eventsPath,
    ass: assPath,
  },
  metrics: {
    minFontSize: Math.min(...rendered.map((item) => item.fontSize)),
    maxScrollWidth: Math.max(...rendered.map((item) => item.scrollWidth)),
    minDurationMs: Math.min(...rendered.map((item) => item.durationMs)),
  },
};

console.log(JSON.stringify(summary, null, 2));
