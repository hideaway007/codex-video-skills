# 录制与后期合成

网页做完 + 音频合成完之后，**Auto 模式 + 屏幕录制可以一镜到底**——
不需要手动点击推进 step、也不需要后期对音频。

如果你不打音频，仍可走"手动点击 + 后期配"的传统路径（在文档末尾）。

---

## 推荐流程：CDP 自动录制 + ffmpeg 合标准化音频

当前默认自动化路径：

```bash
cd presentation

# 1. 确保音频已合成并标准化
npm run extract-narrations
npm run synthesize-audio
npm run normalize-audio
npm run build-master-audio -- \
  --audio-dir=public/audio-normalized \
  --master-name=master-normalized.mp3 \
  --timeline-name=timeline-normalized.json

# 2. 启动 dev server，另一个终端执行录制
npm run dev

# 3. CDP 录 1080p/30fps，并用标准化 master 合音频
DURATION=$(python3 - <<'PY'
import json
from pathlib import Path
print(round(json.loads(Path('public/audio-normalized/timeline-normalized.json').read_text())['totalMs']/1000 + 1.2, 3))
PY
)
npm run record-cdp -- \
  --duration=$DURATION \
  --viewport=1920x1080 \
  --fps=30 \
  --out=output/cdp-full \
  --output=output/cdp-full/final.mp4 \
  --audio=public/audio-normalized/master-normalized.mp3

# 4. 默认烧录字幕：白色大字、无背景框、按断句和口播速度分段
npm run burn-subtitles -- \
  --input=output/cdp-full/final.mp4 \
  --output=output/cdp-full/final-subtitled.mp4
```

这条路径不消耗 AI token；`record-cdp` 用 Puppeteer 启动本机 Chrome，再通过
Chrome DevTools Protocol 的 `Page.startScreencast` 抓帧，最后用 ffmpeg
转成恒定 `30fps` MP4 并合入标准化音频。

默认字幕规则：

- 字幕源使用 `public/audio-normalized/timeline-normalized.json`；如果要用未标准化
  音频时间轴，显式传 `--timeline=public/audio/timeline.json`。
- 一条口播 cue 会按中文标点、顿号 / 逗号和 cue 时长拆成多条短字幕事件，
  不是整段铺满底部。
- 样式默认是白色 `66px` 大字，无背景框，保留深色描边和阴影；字幕底部边距
  默认 `36px`，这相当于早期 `44px` 字幕的 1.5 倍大小。
- `ffmpeg` 如果没有 `subtitles` / `drawtext` filter，脚本仍可工作：它会先用
  Puppeteer 渲染透明字幕层，再用 `overlay` 合成到视频。

> 不默认使用 `screencli`：它会启动 AI agent，哪怕只是等待页面播放也会消耗
> 模型 token。本 skill 的页面已经支持自播放，CDP/Playwright/人工录屏更可控。

---

## 备选流程：Auto 模式人工一镜到底

### 默认录制规则

- **最终交付视频必须是有效画面铺满 16:9 全屏**，不能把浏览器窗口背景、
  shell 留白、stage 外阴影或四周 breathing room 一起录进去。
- 自动录制脚本必须打开 `?auto=1&record=1`。其中 `record=1` 表示录制专用
  布局：1920×1080 stage 不留 margin，直接贴满 viewport，并隐藏进度条、
  模式切换按钮等录制无关 UI。
- 自动化录制脚本可以额外加 `autostart=1`，即
  `?auto=1&record=1&autostart=1`。这只用于 Playwright / browser automation
  等可关闭浏览器自动播放限制的环境，避免把启动蒙层录进母版。人工录屏不要
  用 `autostart=1`，仍然按一次 Space 启动。
- 手动录屏时，如果页面四周还能看到 stage 外背景，先切到录制 URL：
  `http://localhost:5173/?auto=1&record=1`，再开始录。
- 录制启动不要用会同时触发翻页的快捷键。脚本优先点击 auto gate；如果人工
  使用 Space，代码必须保证待启动的 Auto 模式不会同时执行 `next()`。
- **画质默认优先稳定**：自动化优先 CDP `1920×1080 / 30fps`；需要更高清
  母版时，再用 Playwright / browser automation 走 2x viewport；人工正式
  录制可用 Screen Studio / CleanShot 输出 `1080p / 60fps`。

### 前置

- 章节代码做完，每章都有 `narrations.ts`
- 已经跑过 `npm run extract-narrations` + `npm run synthesize-audio` +
  `npm run build-master-audio`，`public/audio/master.mp3` 和
  `public/audio/timeline.json` 全部就位
- `npm run dev` 跑着，浏览器能打开页面

### 录制步骤

1. **浏览器全屏**（F11 / Ctrl+Cmd+F），URL 改成
   `http://localhost:5173/?auto=1&record=1`
2. 看到 "Press SPACE to start" 蒙层 = Auto 模式就绪
3. **打开屏幕录制**（QuickTime / OBS / Cmd+Shift+5），开始录
4. **按一次 Space** → 蒙层消失 → step 0 出现，1.mp3 自动播 →
   播完自动推进到 step 1 → 2.mp3 → … → 最后一个 step 播完 → 停在终态
5. **停止录制** → 后期裁掉头尾（Space 那一下、最后停在终态的尾巴）就是
   成品

整个过程**完全不用点鼠标**。音视频天然同步，不需要后期对轨。

> **Auto 模式严格按 `master.mp3` 的连续时间线推进**，没有"等动画跑完"
> 的兜底。如果你看到某步动画被切了一半 → 说明该 step 动画长于口播，
> 回章节代码改：写更长口播 / 拆 step / 调动画速度。

### 录屏工具

| 平台 | 工具 | 设置 |
|---|---|---|
| 自动化 | `npm run record-cdp` | Chrome CDP screencast，1080p/30fps，ffmpeg 合标准化音频 |
| 自动化母版 | Playwright / browser automation | 3840×2160 录视觉，ffmpeg 合标准化音频 |
| macOS | Cmd+Shift+5 → 录制选定窗口 | 选浏览器窗口；浏览器全屏后输出就是 1920×1080 |
| macOS | QuickTime → 文件 → 新建屏幕录制 | 同上 |
| macOS | Screen Studio / CleanShot | 正式人工录制；建议 1080p/60fps，高质量导出 |
| 跨平台 | OBS Studio | 窗口捕获，Canvas 1920×1080，60fps |

### 模式速查

| URL / 快捷键 | 行为 |
|---|---|
| 直接打开（默认） | Manual：点击 / ←→ 推进，不播音频 |
| `?audio=1` 或按 `M` | Audio：进入 step 自动播音频，但**手动点鼠标推进** |
| `?audio=1` + 再按 `M` | Auto：进入 step 自动播 + 自动推进（录制用） |
| Auto 模式下首次按 `Space` | 启动 Auto 播放（绕过浏览器自动播放限制） |

也可以鼠标移到右上角，会出现一个隐藏的模式切换按钮。

---

## 备用流程：没合成音频时手动录屏

如果你跳过了音频合成（`Checkpoint Audio` 选了"不合成"），按老方法：

1. 浏览器全屏 → 打开 `localhost:5173`（默认 Manual 模式）
2. **刷新一次**清空历史 step
3. 开始录屏 → 按口播节奏点击空白推进 step
4. 后期用任何剪辑软件配音 + 调时间线

### 后期工具

| 工具 | 适合 |
|---|---|
| **DaVinci Resolve** | 跨平台免费、能处理多段音频拼接 |
| **iMovie** | macOS 简单场景 |
| **CapCut / 剪映** | B 站 / 抖音风加字幕 |

---

> agent 在 Checkpoint Audio 后**主动告诉用户**上面 Auto 模式录屏的
> 路径，让用户知道下一步怎么把网页变成 mp4。
