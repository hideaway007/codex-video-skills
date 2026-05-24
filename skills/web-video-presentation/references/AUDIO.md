# 音频合成

把每个章节 `narrations.ts` 里的口播文字按 **step 颗粒度**合成 mp3，
落到 `presentation/public/audio/<chapter-id>/<step-N>.mp3`，再拼成一条
连续的 `presentation/public/audio/master.mp3` 和 `timeline.json`。运行时
Auto 模式优先播放 master 音轨，并按 timeline 驱动 HTML 节点——录屏可以
一镜到底，且不会有分段 mp3 交接导致的尾字截断。

默认流程会在分段 TTS 之后再做一次**响度标准化 + 轻量降噪**，把结果写到
`presentation/public/audio-normalized/`。这是为了避免每段单独 TTS 后出现
"有的段落大、有的段落小"以及持续轻微底噪的问题。

> **真相源**：每个章节的 `src/chapters/<NN>-<id>/narrations.ts` 是 step
> 数 + 口播文本的**唯一来源**。`outline.md` 不再参与音频合成，章节代码
> 也不再手写 `totalSteps`。这一改根除了"网页 step 和音频文件数对不上"
> 这个老问题。

默认用 **火山 / 豆包语音合成 2.0**：

```text
engine=volcengine
resource_id=seed-tts-2.0
voice_type=zh_male_liufei_uranus_bigtts
voice_name=刘飞 2.0
```

鉴权只从环境变量读取，不写入项目文件：

```bash
export DOUBAO_TTS_API_KEY="..."
# 兼容别名：
export VOLCENGINE_TTS_API_KEY="..."
```

缺少 API Key 时不要假装合成成功；直接提示用户配置环境变量或显式切换
`--engine=melotts` / `--engine=mmx`。

MeloTTS 中文标准音色仍保留为可选路径，对应样本：
`../../tts_samples/melotts_zh_standard.wav`。显式传 `--engine=melotts` 时，
脚本会调用 `../../.venv-tts/bin/melotts` 生成 wav，再用 `ffmpeg` 转成 mp3。

MiniMax CLI（`mmx-cli`）仍可作为可选路径：显式传 `--engine=mmx`。
不要悄悄假装合成成功；缺哪个本地依赖就直接报出来。

---

## 文件命名约定

```
presentation/public/audio/
├── coldopen/
│   ├── 1.mp3
│   ├── 2.mp3
│   └── ...
├── hook/
│   └── ...
└── ...
```

- 章节子目录名 = `chapters.ts` 里的 `id`
- 文件名 = `<step-N>.mp3`（**1-indexed**，对齐 narrations 数组的 index + 1）
- 格式默认 mp3。如果 TTS 后端只能出 wav，加一步用 `ffmpeg` 转换

---

## 标准流程

### TTS 文本规范化

口播稿和画面文字保持原样，但送进 TTS 前要做一层**发音规范化**。默认规则：

- `GPT` → `G P T`
- `LLM` → `L L M`
- `AI` → `A I`
- `ChatGPT` → `Chat G P T`

原因：中文 TTS 容易把英文缩写连读成一个词，导致 `GPT / LLM / AI` 听感不清。
规范化只影响音频合成输入，不改 `narrations.ts`、画面文字或
`audio-segments.json` 的原始文本。

### 1. 抽取 segments

```bash
cd presentation
npm run extract-narrations
```

这会扫所有章节的 `narrations.ts`，按 `chapters.ts` 注册顺序生成
`audio-segments.json`：

```json
[
  { "chapter": "coldopen", "step": 1, "text": "...", "audio": "coldopen/1.mp3" },
  { "chapter": "coldopen", "step": 2, "text": "...", "audio": "coldopen/2.mp3" },
  ...
]
```

默认不再让用户人工扫这个 json。agent 需要自己检查 `audio-segments.json`
的段数、chapter / step 顺序和空文本情况；确认与 `narrations.ts` 对齐后
直接进入合成。只有用户明确要求人工审核，或段数 / 文本明显异常时才停。

> 空字符串的 narration 会被自动跳过（不烧 TTS token）——运行时 Auto 模式
> 按字数估时撑过这种"无声过场"step。

### 2. 合成

默认路径先检查云端鉴权和基础工具：

```bash
test -n "${DOUBAO_TTS_API_KEY:-${VOLCENGINE_TTS_API_KEY:-}}"
python3 --version
```

- 都存在 → 走 [2.A](#2a-火山--豆包默认合成)
- 想用 MeloTTS → 走 [2.B](#2b-melotts-可选合成)
- 想用 MiniMax → 走 [2.C](#2c-minimax-可选合成)
- API Key 或依赖缺失 → 走 [2.D](#2d-退化路径)

#### 2.A 火山 / 豆包默认合成

##### 调用合成脚本

```bash
npm run synthesize-audio              # 增量：跳过已存在的 mp3
npm run synthesize-audio -- --force   # 全部重合成
npm run synthesize-audio -- --voice=zh_male_liufei_uranus_bigtts
npm run synthesize-audio -- --speed=1.2
```

默认配置：

```text
engine=volcengine
resource_id=seed-tts-2.0
voice=zh_male_liufei_uranus_bigtts
voice_name=刘飞 2.0
sample_rate=24000
speed=1.2
speech_rate=20
pitch_rate=0
volume_ratio=1.2
tts_normalize=false
```

`tts_normalize=false` 表示送入 TTS 的文本保持原始口播，不把 `ChatGPT`、
`LLM`、`AI` 拆成字母读法。需要字母读法时显式传 `--tts-normalize`。

#### 2.B MeloTTS 可选合成

##### 调用合成脚本

```bash
npm run synthesize-audio              # 增量：跳过已存在的 mp3
npm run synthesize-audio -- --force   # 全部重合成
npm run synthesize-audio -- --speed=1.05
npm run normalize-audio               # 统一响度 + 轻量降噪
npm run build-master-audio -- \
  --audio-dir=public/audio-normalized \
  --master-name=master-normalized.mp3 \
  --timeline-name=timeline-normalized.json
```

当前 `llm-explainer-video` 的默认连续音轨会在相邻分段之间插入
`574ms` 间隔。这个值来自当前 Edge TTS 口播中“句子级长停顿”的中位数
`0.574s`，由 `build-master-audio.mjs` 写入 `timeline.json` 的
`interSegmentGapMs`。需要临时覆盖时可用：

```bash
INTER_SEGMENT_GAP_MS=0 npm run build-master-audio
INTER_SEGMENT_GAP_MS=574 npm run build-master-audio
```

默认配置：

```text
engine=melotts
voice_sample=../../tts_samples/melotts_zh_standard.wav
tts_bin=../../.venv-tts/bin/melotts
language=zh
speed=1.0
```

这条路径不消耗云端 TTS token。空 narration 会跳过，已存在 mp3 默认跳过。

##### 标准化输出

`npm run normalize-audio` 会读取 `audio-segments.json`，逐段处理
`public/audio/<chapter>/<step>.mp3`，输出：

```text
public/audio-normalized/<chapter>/<step>.mp3
public/audio-normalized/normalize-report.json
```

默认参数：

```text
integrated loudness = -18 LUFS
true peak = -1.5 dB
LRA = 7
highpass = 80 Hz
noise floor = -48 dB
```

如果用户反馈声音忽大忽小或有轻微连续噪声，优先重跑：

```bash
npm run normalize-audio
npm run build-master-audio -- \
  --audio-dir=public/audio-normalized \
  --master-name=master-normalized.mp3 \
  --timeline-name=timeline-normalized.json
```

如果仍不够稳，再把 `normalize-audio.mjs` 升级成 two-pass loudnorm；不要先
重写稿子或重做页面。

#### 2.C MiniMax 可选合成

##### 鉴权检查

```bash
which mmx
mmx auth status
```

未登录 → 提示用户：

```text
你的 mmx-cli 未登录。请运行：
  mmx auth login --api-key sk-xxxxx
（API key 在 https://platform.minimaxi.com 获取）
```

登录前**不要继续**。

```bash
npm run synthesize-audio -- --engine=mmx
npm run synthesize-audio -- --engine=mmx --force
npm run synthesize-audio -- --engine=mmx --voice=<voice-id>
npm run synthesize-audio-edge -- --rate=+0%     # Edge TTS 路径默认 1x，不加速
npm run normalize-audio
npm run build-master-audio -- \
  --audio-dir=public/audio-normalized \
  --master-name=master-normalized.mp3 \
  --timeline-name=timeline-normalized.json
```

脚本**串行**调用所选 TTS（避免 rate limit / 本地资源争用），**自动跳过已
存在文件**。每条打印进度：

```
[  3/24] coldopen/3.mp3   ✓ 4s
[  4/24] coldopen/4.mp3   skip (exists)
```

##### 生成连续音轨

分段 mp3 全部就位后，生成录屏用的连续音轨：

```bash
npm run normalize-audio
npm run build-master-audio -- \
  --audio-dir=public/audio-normalized \
  --master-name=master-normalized.mp3 \
  --timeline-name=timeline-normalized.json
```

它会读取 `audio-segments.json` 和每段 mp3 的真实时长，输出：

```text
public/audio-normalized/master-normalized.mp3
public/audio-normalized/timeline-normalized.json
```

浏览器 Auto 预览默认仍读取 `public/audio/master.mp3` 和
`public/audio/timeline.json`。标准化 master 主要给最终 ffmpeg mux 使用。
如果要让浏览器也直接播放标准化音轨，可以把 normalized 文件复制回默认名：

```bash
cp public/audio-normalized/master-normalized.mp3 public/audio/master.mp3
cp public/audio-normalized/timeline-normalized.json public/audio/timeline.json
```

若默认 master/timeline 不存在，运行时会退回旧的分段 mp3 播放路径，方便
开发阶段预览。

##### 校验时长

合成完后跑：

```bash
for f in public/audio/*/*.mp3; do
  d=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$f")
  echo "$f  ${d}s"
done
```

把每条的实际秒数汇总告诉用户。**重点关注 ≥ 15s 的条目**——口播太长意味
着该 step 的 narration 写得过密，或者 step 没拆够。让用户决定**改稿子
重合**还是**回章节代码拆 step**。

#### 2.D 退化路径

不要假装能合成。先按报错处理 API Key / 本地依赖；如果用户不想配置默认
火山 / 豆包 TTS，再问：

```text
当前默认火山 / 豆包 TTS 不可用。我可以：

  1. 配置火山 / 豆包 API Key（推荐）
     需要：export DOUBAO_TTS_API_KEY=...
     默认音色：刘飞 2.0

  2. 改用本机 MeloTTS
     需要：../../.venv-tts/bin/melotts、../../tts_samples/melotts_zh_standard.wav、ffmpeg
     运行：npm run synthesize-audio -- --engine=melotts

  3. 改用 MiniMax CLI
     需要：npm 全局安装 + 一个 API key
     运行：npm install -g mmx-cli && mmx auth login --api-key sk-xxxxx

  4. 用其它 TTS（你来提供）
     告诉我用什么 —— OpenAI TTS / 阿里云 / Azure / ElevenLabs / 其它
     最好附上调用方式（CLI 命令 / API endpoint + 参数）
     我会改 scripts/synthesize-audio.sh 让它调你的工具，
     输出文件路径仍按 audio-segments.json 的 audio 字段写

  5. 暂时跳过
     稿子和 narrations 都在，你自己用任意 TTS 录制即可
```

如果用户选其它 TTS，按相同的"读 audio-segments.json → 串行调用 → 落盘 →
校验"流程，把当前合成分支换成对方的命令即可。

---

## 用户自带 TTS 的最小契约

任何 TTS 后端只要满足三个能力即可接进来：

| 能力 | 输入 | 输出 |
|---|---|---|
| 单段合成 | 一段文字（≤ 5000 字符）+ 音色 id（可选） | 一个 mp3 / wav 文件 |
| 错误反馈 | —— | 失败时明确报错（rate limit / auth / 内容审核 / 网络） |
| 输出可指定路径 | 目标文件路径 | 直接写到该路径 |

不满足"输出可指定路径"的 API（比如返回二进制流）就在外面包一层 curl /
node script 把响应写到目标路径。

---

## 运行时如何使用合成的音频

合成完成后，**不需要任何额外配置**——脚手架的 `App.tsx` 已经接好：

| 模式 | 触发方式 | 行为 |
|---|---|---|
| **Manual**（默认） | 直接打开页面 | 不播音频，点击 / 方向键推进 |
| **Audio**（半自动） | URL `?audio=1` 或按 `M` 键 | 进入 step 自动播音频，但你手动推进（点鼠标） |
| **Auto**（全自动） | URL `?auto=1` 或按两次 `M` 键 | 进入 step 播音频 → 播完自动 next() → 进下个 step → ... |

Auto 模式首次需要按一次 `Space` 启动（绕过浏览器自动播放限制），之后
全自动跑。**录屏时打开屏幕录制 → 按 Space → 整片自动跑完 → stop**。

> **Auto 模式的推进规则就一句话**：优先连续播放 `master.mp3`，并按
> `timeline.json` 的毫秒 cue 切 HTML 节点。没有 master 时才退回分段 mp3
> 播放。
> **没有"等动画跑完"的兜底**——如果你写的视觉动画比口播长，会被当场切。
> 解决办法：写更长口播 / 拆 step / 调动画速度（详见
> [`CHAPTER-CRAFT.md`](CHAPTER-CRAFT.md) 「代码层最小约束」）。
>
> 音频文件缺失（还没合成 / 404）或 narration 是空串 → 退化到字数估时
> （`max(1500ms, 字数 × 250ms)`），保证预览也能整片跑通。

---

## 故障排查

| 现象 | 原因 / 修法 |
|---|---|
| `chapter id "X" registered but no matching folder found` | 章节文件夹应命名为 `NN-<id>`；id 必须等于 chapters.ts 里注册的 |
| `narrations.ts in X must export an array named "narrations"` | 该章节的 narrations.ts 没 export 名为 narrations 的数组 |
| `MeloTTS CLI not found` | 确认项目根目录有 `.venv-tts/bin/melotts`，或传 `--tts-bin=<path>` |
| `default MeloTTS voice sample not found` | 确认 `tts_samples/melotts_zh_standard.wav` 存在，或传 `--voice-sample=<path>` |
| `ffmpeg is required` | 安装 ffmpeg；MeloTTS 输出 wav，脚本需要转 mp3 |
| `mmx: command not found` | 只在 `--engine=mmx` 时需要；`npm install -g mmx-cli`，npm 全局 bin 不在 PATH 时 `npm config get prefix` 看一下 |
| `401 / unauthorized` | `mmx auth login --api-key sk-xxxxx` 重新登录 |
| 中间断了几条没合成 | `npm run synthesize-audio` 重跑 —— 已存在文件会跳过 |
| 中文音色不自然 | 默认先听 `tts_samples/melotts_zh_standard.wav`；要换 MiniMax 音色再用 `--engine=mmx --voice=<id>` |
| 整段合成被截断 | 单段过长。在 narrations.ts 里把这条拆成两条（也意味着该 step 应该拆成两个 step） |
| 浏览器没播音频 | Auto / Audio 模式下首次需要用户手势——确认你按了 SPACE 启动 Auto，或者点过页面 |
| 音频 404 但 Auto 模式还能跑 | 找不到 mp3 时 useAudioPlayer 退化到字数估时（4 字/秒），保证预览不中断 |

---

## 相关链接

- mmx-cli 仓库：<https://github.com/MiniMax-AI/cli>
- 官方文档：<https://platform.minimaxi.com/docs/token-plan/minimax-cli>
- 参数 / 音色查询：`mmx speech --help`
