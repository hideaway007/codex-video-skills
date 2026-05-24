---
name: hyperframes-teaching-video
description: Create, revise, render, package, and prepare publishing for Chinese teaching or explainer videos with HyperFrames HTML, synced narration, large subtitles, Apple-style visual direction, thumbnail or cover generation, real MP4 verification, and social platform draft assets. Use when the user asks to make AI coding or technical course videos from source material, improve pacing, voiceover, animation focus, captions, transitions, duration, cover, platform title/tags/copy, or upload preparation, fix blank or dropped transition frames, or says to use HyperFrames instead of Web Video Engineer or web-video-presentation.
---

# HyperFrames Teaching Video

## Contract

Use HyperFrames as the primary production surface for Chinese teaching videos. Treat the HyperFrames HTML composition, synthesized narration, rendered MP4, and optional cover image as the deliverables.

Do not use the old Web Video Engineer / `web-video-presentation` implementation path unless the user explicitly asks for a click-driven webpage presentation. Reuse only its durable production lessons: narration-first structure, large readable subtitles, 16:9 frame checks, and explicit render verification.

## Default Style

Use Apple Keynote / macOS style unless the user gives a stronger reference:

- Calm high-end layout, generous but purposeful spacing, clear hierarchy, glass or soft material panels, subtle shadows, rounded corners, clean icons, and smooth easing.
- Keep the tone like a science or teaching video: conversational, concrete, and easy to follow. Avoid stiff report language and over-dense bullet narration.
- Use Chinese for audience-facing labels whenever English is not necessary. Keep English only for code identifiers, API names, UI names, or terms the viewer must recognize.
- Do not say internal course labels like `s03`, `s02`, folder names, or implementation IDs in the voiceover or on-screen text unless the user explicitly wants them.
- Avoid starting with formulaic lines like "AI 时代，别再...". Prefer a direct claim, a concrete pain point, or a familiar analogy.

## Workflow

1. Read the local context first.
   - Locate the target folder, `AGENTS.md`, existing HyperFrames project files, prior renders, `DESIGN.md`, narration text, assets, and package scripts.
   - If revising an existing video, inspect `index.html`, narration files, audio duration, previous render duration, and recent user complaints before changing anything.

2. Write the narration before animating.
   - For narration drafting or rewriting, read `references/CODE-GARDEN-VOICEOVER.md` first. This is the imported voiceover-writing reference from the old `web-video-presentation` skill.
   - Treat that reference as the voice and pacing guide, then apply this skill's higher-priority video requirements: Apple-style presentation, casual teaching tone, no audience-facing internal labels like `s03`, Chinese-first labels, large subtitles, and narration-synced visual entrances.
   - Make the script sound like a teaching video, not a formal document.
   - Expand duration by adding useful explanation, examples, analogies, and short recap beats, not by stretching dead air.
   - Split narration into short cues that can drive subtitles and visual entrances.
   - Keep one source of truth for the final narration, such as `assets/narration.txt` or a clearly named script file.
   - End cleanly on a concrete takeaway or next action. Do not use generic future-facing endings like "以后你看到..." / "不要只看..." / "这才是...真正值钱的地方."

3. Build a timed storyboard.
   - Map every narration cue to a visual action: title, diagram part, highlight, screenshot, icon, card, path line, pointer, or caption.
   - Make elements appear one by one with the voiceover. Never dump all key elements onto the screen at once.
   - Give each scene a clear focus. The viewer should always know what to look at.
   - Rotate composition types across scenes: center hero, layered UI, flow diagram, timeline, stack, route map, dashboard, comparison wall, or close-up detail.

4. Implement in HyperFrames.
   - Put the composition duration on the root element with `data-duration`.
   - Keep the audio in a real `<audio>` element and sync animation to the actual audio duration after synthesis.
   - Register a paused GSAP timeline in `window.__timelines` and build deterministic animation. Do not rely on random values, current date, or infinite loops.
   - Animate `transform`, `opacity`, filters, masks, and strokes. Prefer overlapping crossfades, slides, blur reveals, and clip reveals for transitions.
   - Avoid full-screen wipes or hard `visibility` changes that can expose a blank frame during rendering.
   - Keep text inside containers at 1920x1080 and mobile preview sizes; no clipped labels, tiny metadata, or decorative text that becomes unreadable.

5. Generate or update narration audio.
   - Use the project's TTS path when available. For this skill family, default to Doubao / Volcano `seed-tts-2.0`, voice `zh_male_liufei_uranus_bigtts`, and `speech_rate=20` unless the user says otherwise.
   - Do not silently fall back to a slower default like `speech_rate=0` or `speed=1.0`.
   - Run `ffprobe` after synthesis and update the HyperFrames duration and cue timings from the real audio duration.

6. Add large subtitles.
   - Subtitles must be readable in a 1080p recording. Use the old web-video baseline as the minimum mental model: burned-in subtitle text around 66px with strong contrast.
   - Default to centered bottom subtitles with text only: no "旁白" label, no large caption box, no decorative backing unless the user asks for it or contrast fails.
   - Keep visible subtitles to one line. A caption cue may cover one or two spoken clauses, but join them with spaces, not a line break. If two clauses would be too long for one line, show one clause at a time.
   - Use roughly 66-72px Chinese text for burned-in HyperFrames subtitles, strong contrast or shadow, and enough bottom margin to avoid covering the scene focus.
   - Use simple opacity fades for subtitle entrances and exits. Avoid jumpy y-motion, bouncing, or overly frequent pop-ins.
   - Break subtitles into cue-sized chunks synced to speech. Avoid one tiny static caption per scene and avoid long paragraph captions.

7. Add visual assets when they help teaching.
   - Use screenshots, simple icons, diagrams, code snippets, UI fragments, or web images when they clarify the point.
   - If current, external, or product-specific imagery matters, search or browse for current references and save local assets instead of hotlinking.
   - For generated or edited covers, follow the user's reference image. If the user says the person must stay unchanged, only change typography, background, diagrams, lighting accents, or non-person elements.

8. Package for social publishing when requested.
   - Create a short runbook or publish note near the video folder with the MP4 path, cover path, title, platform copy, tags, account/platform targets, upload status, and verification notes.
   - Reuse previous platform tags, title style, and copy templates when the user asks for consistency; otherwise draft platform-native Chinese copy without internal labels like `s04`.
   - For covers, prefer a 9:16 poster image that matches the user's reference style and the episode topic. Preserve the person unchanged if the user gives that constraint.
   - When using a live browser to upload to social platforms, prepare drafts and verify fields, but do not click the final publish/submit button until the user confirms the exact platform, account, title/copy/tags, MP4, and cover.

## Verification

Always verify the real artifact before saying the video is done.

Run the project's checks first:

```bash
npm run check
```

If the project does not define `check`, use the HyperFrames CLI directly:

```bash
npx hyperframes lint .
npx hyperframes inspect .
```

Render an MP4 and inspect its real duration:

```bash
npm run render -- --quality standard --output renders/final.mp4
ffprobe -v error -show_entries format=duration,size -of json renders/final.mp4
```

Extract review frames, including transition-heavy sections:

```bash
ffmpeg -hide_banner -y -i renders/final.mp4 -vf "fps=1/8,scale=480:270,tile=4x4" -frames:v 1 /tmp/final-contact.jpg
```

Check these items visually:

- No blank frame, dropped-looking transition, or abrupt all-screen flash.
- The current narration point has the strongest visual emphasis.
- Elements enter in sync with the voiceover instead of appearing all at once.
- Subtitles are large enough and do not cover key content.
- Chinese labels are used where English is unnecessary.
- The final duration matches the user's requested pacing.
- Captions are centered, readable, single-line by default, and do not include unintended labels or boxes.
- Publishing assets have absolute paths and can be found without guessing.

## Common Revisions

- If the video is too short: rewrite the narration with more explanation and examples, synthesize new audio, update cue timing, then render again.
- If attention has no focus: stagger entrances, dim old elements, add highlights, and make only one area active per narration beat.
- If transitions have blank or dropped frames: replace hard cuts or full-screen wipes with overlapped crossfades, persistent backgrounds, or layer-to-layer motion.
- If subtitles are too small: increase caption font size and backing contrast before changing anything else.
- If subtitles wrap to two lines: shorten the grouping threshold or split the cue; do not solve it by accepting two visual lines.
- If the script feels too dry: add everyday analogies and viewer-facing phrasing while preserving technical accuracy.
- If the user wants platform publishing: prepare metadata and draft/upload state, then ask for action-time confirmation before final public posting.

## Delivery

When finished, report absolute paths for the output folder, MP4, cover image if generated, and important source files. The user should not have to guess where the video is.

If the target is inside a git repository, inspect the diff, run verification, and commit the task-related changes unless there is no change, no repository, or a real blocker.
