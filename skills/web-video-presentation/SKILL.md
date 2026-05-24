---
name: web-video-presentation
description: 把文章、口播稿或已切好的漫画 panels，做成"看起来像视频"的点击驱动 16:9 网页演示，并在 HTML 验证完成后默认直接合成口播音频。流程：原始文章 / 口播稿 / panels manifest → **一次产出**口播稿 + outline 开发计划 → 用户**一次对齐**稿子 / outline / 素材 / 开发模式 → 网页开发（逐章 / 顺序 / 并行）→ 自动音频合成（默认火山/豆包语音合成，刘飞 2.0）。Phase 1 写稿唯一参考 `references/CODE-GARDEN-VOICEOVER.md`；不使用其它写作规则。Comic Panels Mode 适用于 `manifest.json + panel_*.png` 的 motion comic HTML 视频：每个 panel 可拆成 1-N 个 step，做镜头推进、局部放大、对白/字幕和转场。适用场景：网页视频、动态 PPT、漫画视频 HTML 版、技术教程 / talk demo 录屏。本项目默认视觉锚点为 d2-editorial-grid 纸面档案编辑风；用户明确指定时仍可切换其它主题。
---

# Web Video Presentation

把一篇文章或口播稿，一步步做成可录屏的"伪装成网页的视频"，HTML
验证完成后默认直接合成口播音频。产出物 = Vite + React + TS 项目 +
按章节切分的音频。

## 适用场景

- "我有口播稿 / 一篇文章，帮我做成视频" —— 口播驱动的内容
- 想做 "动态 PPT"
- 16:9 横屏录屏，大字、留白、每屏都要有动效
- 教学 / 产品演示 / keynote 想要电影感
- 技术教程 / talk demo 录屏内容
- 已切好的漫画 panels 做成 motion comic / 漫画视频 HTML 版

本 Skill **以方法论 + 协作流程为核心**。在本项目中，默认视觉锚点是
`d2-editorial-grid`：暖白网格纸面、深棕宋体大标题、锈红强调、等宽
metadata、浏览器 / 档案卡 / 流程胶囊组件。除非用户明确指定其它主题，
脚手架、章节实现和后续章节续写都优先沿用这套"纸面档案编辑风"。

---

## 工作流总览

```
Phase 1   内容编写
   1.1  识别用户输入
   1.2  一次产出 script.md + outline.md
        （口播稿 + 开发计划）
   ▼
[Checkpoint Plan]      ← 必须停。一次对齐 4 件事：
                         稿子 / outline / 素材 / 开发模式
                         主题默认 d2-editorial-grid；用户明确指定时才切换
   ▼
Phase 2   网页开发
   2.1  脚手架（按选定主题）
   2.2  第 1 章 = 主线程 + 完整版本（强制 anchor）
        ▼
        [硬节点] 用户验收第 1 章 ← 不可跳过
        ▼
   2.3  第 2~N 章（按选定模式：A 逐章 / B 顺序 / C 并行）
   ▼
Phase 3   自动音频合成
   ▼
Phase 4   录屏 + 后期
```

工作目录约定（agent 在用户当前目录下创建 / 编辑）：

```
my-video/
├── article.md          # 用户给原文时必有 —— 不删！开发阶段画面信息源
├── script.md           # 必有：code秘密花园式技术口播稿（决定节拍）
├── outline.md          # 必有：开发计划（章节切分 + 每步内容 + 信息池）
├── comic-panels/        # 可选：Comic Panels Mode 的 manifest + panel_*.png
└── presentation/       # 脚手架产出的 Vite + React + TS 项目
    ├── src/chapters/<NN>-<id>/
    │   ├── <Chapter>.tsx     # 视觉实现
    │   ├── <Chapter>.css
    │   └── narrations.ts     # ★ step 数 + 口播文本的唯一真相源
    ├── scripts/
    │   ├── extract-narrations.ts   # 扫所有 narrations.ts → audio-segments.json
    │   ├── synthesize-audio.sh     # 默认火山/豆包 TTS 合成分段 mp3
    │   └── build-master-audio.mjs  # 拼接 master.mp3 + timeline.json
    ├── audio-segments.json         # extract 产出（合成前 review）
    └── public/audio/               # 分段 mp3 + master.mp3 + timeline.json
```

> **关键**：`narrations.ts` 是 step 数和音频合成的**唯一真相源**。
> 章节 `.tsx` 里的 `if (step === N)` 出现的最大 N + 1 必须等于
> `narrations.length`。这保证 5 处地方（script / outline / 章节代码 /
> chapters.ts / 音频文件）永远不会漂。

---

## 硬性自检协议（贯穿整个 Skill）

下面三个产出，每一个**完成后必须走自检 → 修复 → 再汇报 / 推进**：

| 产出 | 自检清单出处 |
|---|---|
| `script.md` | [`CODE-GARDEN-VOICEOVER.md`](references/CODE-GARDEN-VOICEOVER.md) 自检 |
| `outline.md` | [`OUTLINE-FORMAT.md`](references/OUTLINE-FORMAT.md) 自检 |
| 单章实现完成 | [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) 完工自检 |

**执行方式**（按能力降级，**优先用更隔离的方式**）：

1. **Agent Teams（最优）**：开一个独立的 reviewer agent，给它"产出文件
   路径 + 对应清单 + 关键上下文"，让它逐项核查并**严格汇报结论**
   （哪几条 pass / 哪几条 fail + 证据 + 改写建议）。
2. **subAgent（次优）**：没有 Teams 能力但能开 subagent 就用 subagent
   走同样流程。
3. **自检（兜底）**：当前 agent 都没有上述能力，就自己**严格逐项**
   核查 —— 不允许目测一遍就放行。

**铁律**：拿到结论后**先按 fail 项把产出改完**，再向用户汇报"做完了
+ 自检结论 + 改了什么"。**直接拿原始结论汇报但不修复 = 违规**。

---

## 各阶段文件读取指南

不同阶段读不同的文件。**长会话里 agent 容易遗忘原则**，特别是
Phase 2.4 的"实现单章"会重复 N 次 —— 每次都要回看核心约束。

| 阶段 | 必读（每次都看） | 一次性看完 / 按需查 |
|---|---|---|
| Phase 1.1-1.2 内容编写 | `references/CODE-GARDEN-VOICEOVER.md` + `references/OUTLINE-FORMAT.md` + `article.md`（用户原文，如有） | —— |
| **Comic Panels Mode** | `references/COMIC-PANELS.md` + panels `manifest.json` | `scripts/import-comic-panels.sh`（需要把素材复制进 `presentation/public/assets/panels/` 时） |
| **Checkpoint Plan 主题处理** | —— | 默认主题为 `d2-editorial-grid`；只有用户明确要求换主题时，才读 `themes/*/theme.json` 和 `references/THEMES.md` |
| Phase 2.1 脚手架 | —— | SKILL.md 本节看一次；默认主题为 `d2-editorial-grid` |
| **Phase 2.4 实现单章（×N 次，被 2.2 / 2.3 调用）** | **`references/CHAPTER-CRAFT.md`** 主入口 —— Part 0 十条原则 / Part 1 开工 5 问 / Part 2 关系→动作决策树 / Part 3 视觉工具箱 / Part 4 时长参考 / Part 5 反 AI 味反模式 / Part 6 代码硬规则（**含 narrations.ts 强制约束**）/ Part 7 完工自检 / Part 8 反馈速查 + 当前主题的 `themes/<id>/theme.json` + 当前章节的 outline.md 段落 + **`article.md` 本章对应段落** + 素材清单 | `references/RICH-HTML-TOOLKIT.md`（React 富组件 / SVG 图表 / dashboard primitives）；`references/EXAMPLES/`（结构示意，不是抄袭模板）；`references/THEMES.md` 完整 token 契约 |
| Phase 3 自动音频合成 | `references/AUDIO.md`（含 narrations.ts → segments.json → 火山 / 豆包默认刘飞 2.0 流程） | —— |
| Phase 4 录屏 + 后期 | `references/RECORDING.md`（含 `?auto=1` 自动录屏） | —— |
| 选 / 造 / 切主题 | —— | `references/THEMES.md` |

> **写章节时先读 `CHAPTER-CRAFT.md`**。十条原则 / 开工 self-prompting /
> 决策树 / 反 AI 味反模式 / 完工自检全部并入这一份单一入口。需要数字、
> 流程、对比、状态、dashboard 或更丰富 React/SVG 组件时，翻
> `RICH-HTML-TOOLKIT.md` 选 primitive。`EXAMPLES/` **不是必读** ——
> 先按内容自由设计，卡壳才翻（按 anchor 翻"形"，不要照搬）。

---

## Phase 1 —— 内容编写（一次产出）

### 1.1 识别用户输入

| 用户给的东西 | 该做的 |
|---|---|
| 原始文章 / 文档 / 教程素材 | 一次产出 `script.md` + `outline.md`（1.2），过 Checkpoint Plan |
| 直接的口播稿 / 视频脚本 | 落盘成 `script.md`，一次产出 `outline.md`（1.2 简化版），过 Checkpoint Plan |
| 已切好的漫画 panels 目录（`manifest.json` + `panel_*.png`） | 进入 **Comic Panels Mode**：读 [`references/COMIC-PANELS.md`](references/COMIC-PANELS.md)，把 panel 顺序转成 `script.md` + `outline.md`；保留原 panels 目录，并在 Phase 2.1 后导入到 `presentation/public/assets/panels/` |
| 啥都没有，只说"帮我做个 X 主题的视频" | **反问**：先给一段素材或大纲。Skill 不替用户构思内容 |

### 1.2 一次产出 script.md + outline.md

**两份产出物在一次思考中完成**：

1. **生成 `script.md`**：先按
   [`references/CODE-GARDEN-VOICEOVER.md`](references/CODE-GARDEN-VOICEOVER.md)
   生成 code秘密花园式技术口播稿。它是 Phase 1 写稿的**唯一参考**：
   不再读取其它写作规则。
   **保留 `article.md` 不删**——它是 outline 写信息池和章节实现画面时的
   细节源（双源原则）。
2. **生成 `outline.md`**：按 [`references/OUTLINE-FORMAT.md`](references/OUTLINE-FORMAT.md)
   规则切章节 + 切 step + 每章首段抽**信息池**。`script.md` 的开场第一
   节拍必须进入第 1 章第 1 个 step，不要在 outline 里吞掉。

**outline 的边界**（关键）：

| outline 必须写 | outline 不要写 |
|---|---|
| 章节切分 / 每章 step 数 / 估时 | 具体动画类型（blur clear / wipe / 弹簧） |
| 每步屏幕内容（hero / 数据 / 标语 / 列表项） | CSS 实现手段（filter / SVG / clip-path） |
| 章节级**信息池**：从 article 抽的数字 / 引用 / 案例 / 标签 | 时长数值（不写 ~2.5s / 80~120ms） |
| 步级关系名前缀（"反差对照" / "递进列表" / "金句" 等可选 hint） | 持续微动 / 错峰量等微观节奏 |

> **outline 不写动画的理由**：写死动画 = chapter agent 退化为翻译机；
> 留白让 chapter agent 在每步开工时按 [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md)
> 的"内容驱动决策树"自由设计，才有真正的视频感。详见
> [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) Part 0 原则 7。

**落盘后必须先走自检再进 Checkpoint Plan**：按上文「硬性自检协议」分别
对 `script.md` / `outline.md` 执行（优先 Agent Teams → subAgent → 自检），
按结论修复完成后再进入 Checkpoint Plan。

---

## Checkpoint Plan —— 4 件事一次对齐（**硬节点**）

`script.md` + `outline.md` 写完后必须停下来。**用户在这一个节点同时确认
4 件事**。主题不再作为默认必问项：除非用户明确指定其它主题，直接使用
`d2-editorial-grid`。

### agent 此时要做的预备工作

1. 默认主题直接写入 `d2-editorial-grid`；只有用户明确说要换主题，才读
   `themes/*/theme.json` 拿 `nameZh` / `descriptionZh` / `bestFor` / `mood`
   并给 2~3 套推荐
2. 扫一遍 `outline.md` 末尾"素材清单"部分

### 总结模板（骨架，agent 按情况填充）

```
内容计划写完，产出文件：
  📄 article.md     {若用户给原文则保留}
  🖼 comic-panels/  {Comic Panels Mode 时列 manifest + panel 数}
  📄 script.md      {X} 字 / ~{T} 分钟
  📄 outline.md     {N} 章 / {M} 步 + 每章信息池 + 末尾素材清单

章节速览：
  1. <id>     <章节标题>    <S> 步 ~<T>s
  2. ...

接下来一次对齐 4 件事：

  1. 稿子 (script.md) 要不要改？
     可以直接编辑文件，或口头告诉我修改方向。

  2. 开发计划 (outline.md) 要不要改？重点看：
     - 章节切分 / step 数 / 估时是否合理（合理判断：每章 30~60s）
     - 每步屏幕内容是否清晰
     - 每章首段「信息池」是否有足够的 article 细节供画面挂
     - 末尾素材清单是否完整

  3. 真素材怎么准备？粗看本视频要的图：<列粗略清单>
     a) 我从 <现有素材路径> 帮你挑   b) 你自己提供   c) 全部 placeholder

  4. 开发模式选哪个？

     **第 1 章无论哪种模式都必须主线程做完 + 用户验收**（强制 anchor）。
     差异在第 2 章及之后：

     A) 默认 · 逐章确认（推荐）
        每章做完都暂停验收 → 风险可控 / 节奏最稳
     B) 第 1 章后顺序开发（不并行）
        第 2~N 章主线程顺序做完后统一验收 → 速度中 / 适合 agent 不支持并行
     C) 第 1 章后并行开发（subagent）
        第 2~N 章用 subagent 并行 → 最快 / 用户控并行数（一次几章）
        ⚠️ 风格各章会有差异（这是预期，主题禁区兜底）
```

收到反馈后：
- 稿子 / outline 要改：直接编辑文件，编辑完 ping 一次（或口头描述 agent 改）
- 主题默认 `d2-editorial-grid`，不再等待用户选择；用户明确指定其它主题时，
  先确认主题 id 再进入 Phase 2
- 模式选定 → 进 Phase 2

---

## Phase 2 —— 网页开发

### 2.1 脚手架

```bash
bash .cursor/skills/web-video-presentation/scripts/scaffold.sh \
  ./presentation \
  --theme=<用户选的主题 id>

bash .cursor/skills/web-video-presentation/scripts/scaffold.sh --list-themes
```

> 自定义主题 → 先按 [`references/THEMES.md`](references/THEMES.md)
> "创作新主题"流程做一个 `themes/<my-theme>/`，再 `--theme=<my-theme>`。
> Comic Panels Mode 在脚手架完成后，用
> `scripts/import-comic-panels.sh <panels_dir> ./presentation` 把素材复制到
> `presentation/public/assets/panels/`。

脚手架带一个 `01-example` demo。在写第一章真实内容前**删掉**：

```bash
rm -rf presentation/src/chapters/01-example
```

并把 `presentation/src/registry/chapters.ts` 里 `EXAMPLE_CHAPTER`
的 import 和数组项移除。

### 2.2 第 1 章 —— 主线程 + 强制验收

**核心**：第 1 章 = 完整版本一次到位（节奏 + 视觉 + 真素材齐全）。
**没有"骨架版"概念** —— 第一章就要做出**用户能直接验收**的样板。

为什么第 1 章必须主线程：

- 它是 [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) 这套指引在**当前
  主题 + 当前题材**下的第一次落地
- 如果指引有盲区 / 主题颜色 / 字体 token 不够用，第 1 章一定会暴露 ——
  这时候有人类反馈就能修指引 / 调主题，**早改成本最低**
- 后续章节（无论顺序 / 并行）都要参考第 1 章的代码模式，所以第 1 章 =
  当次项目的"风格锚点（不强求章节间一致，但单章自身得有完整说服力）"

**做完第 1 章后必须停下来**等用户验收：

```
第 1 章 <id> 做完了，dev server 在 localhost:5173 运行。

验收重点：
  □ 视觉气质对不对？默认应接近 `d2-editorial-grid` 的暖白纸面档案风；
     如果用户给了参考图，以第 1 章验收后的参考图为后续 anchor。
  □ 节奏对不对？某些步太快 / 太慢 / 信息太薄？
  □ 内容驱动动画是否到位？还是有几步是无脑入场动画？
  □ 双源原则：屏幕画面有没有"口播没念但 article 能挂"的细节？
  □ 反 AI 味检查：紫粉渐变 / 圆角彩色边框 / 假插画 / emoji 是否有？

问题告诉我，我针对性改。OK 了告诉我"继续"，我按选定模式做第 2 章及之后。
```

### 2.3 第 2~N 章 —— 按选定模式

**所有模式下的共同规则**：每章独立按 [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md)
开发。默认用 `d2-editorial-grid` 的纸面档案编辑风统一视觉气质：暖白网格、
深棕大字、锈红强调、等宽 metadata、浏览器窗口、档案卡、流程胶囊、波形
或时间线。章节之间可以有不同构图，但不能跑回黑板风、蓝紫渐变、泛 SaaS
卡片风或纯文本 PPT。

#### 模式 A · 默认 · 逐章确认

第 2 章做完 → 暂停验收 → OK → 第 3 章 → 暂停 → ... → 第 N 章。**每章
独立验收**，问题随时改，**风险最低，节奏最稳**。**用户不明确选模式时
默认走这个**。

#### 模式 B · 第 1 章后顺序开发

第 2 章 → 第 3 章 → ... → 第 N 章 **主线程顺序做完，最后统一验收**。
速度中等，适合 agent 不支持并行任务的环境。

#### 模式 C · 第 1 章后并行开发（subagent）

用 subagent 把第 2~N 章并行做完，最大并行数由用户控制（"一次 4 章"
/ "一次 2 章"）。**最快，但风格各章会有差异** —— 这是预期，因为：

1. 每个 subagent 看不到别的 subagent 产出，无法机械对齐
2. 章节代码物理分离（每章一个文件夹 / 自己的 CSS 前缀），不会互相
   破坏
3. 主题 token 兜底视觉统一（颜色 / 字体 / hero 数字 / 卡片 / 分割线
   性格 / 装饰），气质不会跑偏
4. **风格不一致 = 人手写视频的呼吸感**（多 voice / 多视角）

并行 subagent 的 prompt 必须包含：

- 当前章节 outline 段落（含信息池）
- `references/CHAPTER-CRAFT.md` 的路径（**章节主入口** —— 视觉演示要求 +
  逐步揭示 + 双源原则 + 反 AI 味 + 代码红线 + 完工自检全部在这一份里）
- `references/RICH-HTML-TOOLKIT.md` 的路径（React 富组件 / SVG 图表 /
  dashboard primitives；需要数字、流程、对比、状态时优先参考）
- 当前主题 `theme.json` 的 `descriptionZh` / `mood` / `bestFor`（参考气质
  即可，动画 / 时长 / 字号 / emoji 由 chapter agent 自由决定）
- **第 1 章代码作为"代码风格"参考**（不是"视觉抄袭对象"）
- 若用户验收了第 1 章视觉，则第 2~N 章必须把第 1 章当作视觉 anchor：
  复用纸面网格、深棕 / 锈红配色、宋体大标题、等宽 metadata、浏览器窗口 /
  档案卡 / 流程胶囊等组件语汇。
- 硬规则：每章独立 CSS 前缀（`.cd-` / `.mg-` / `.pm-` / ...）；
  不修改 `chapters.ts`；完工跑 `npx tsc --noEmit`

**重要**：无论选哪种模式，**用户随时可以中途切换模式**。第 2 章 OK
后用户说"剩下的并行" / "剩下的逐章" 都行。

### 2.4 实现单章（每章必走）

详细指引见 [`references/CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) ——
**章节主入口**，覆盖：视觉演示要求 / 逐步揭示 / 内容取舍 / 双源原则
/ 视频演示基本审美 / 反 AI 味 / 代码红线 / 完工自检。

**核心要点**（CHAPTER-CRAFT.md 详述）：

- **每章必须有 CSS / SVG / Canvas / JS 视觉演示**，禁纯文字章节
- **每章至少一个富 HTML 主视觉**：优先用本章内 React 小组件 + SVG 图表 /
  仪表 / 流程线 / browser mock / terminal mock / metric dashboard 承担解释，
  不要只做大标题 + 普通卡片
- **默认优先 CSS 档 SVG 分镜小剧场**：遇到概念旅程、工具链、输入输出、
  流程、演化、对比时，先考虑多层 SVG 小剧场，而不是静态插画或卡片堆。
  背景用纸面网格 / 手绘云线，中景用路径线 / 节点，前景用小人 / 文档 /
  浏览器 / 视频节点；用 CSS keyframes、transition、`stroke-dashoffset`
  和 step class 做轻微 pan / zoom、自绘线、active / done / muted 状态、
  局部小动画。默认不上 JS / IK，只有用户明确要求机械、骨骼或真实踩踏等
  连续运动真实性时再加 JS。
- **每个关键对象要有独立主视觉**：当一章介绍不同层面 / 角色 / 产业环节 /
  概念时，不能整章复用同一张页面只换标题、高亮或小组件；统一的是主题
  语言，不是版式模板
- **标题必须有冲击力和层级**：hero 标题要足够大；长标题要拆行、拆大小，
  并用主题 accent 色强调关键词，不能整段都是同一种黑色大字
- **空画面必须补视觉信息**：任何一屏出现大面积空白时，要补流程、账本、
  仪表、工单、剖面、地图、卡片组等可视化信息，而不是只靠留白撑节奏
- **长口播要主动拆页**：单个 step 口播明显过长时，要拆成多个 HTML step，
  并同步 `narrations.ts`、音频文件编号、`audio-segments.json`、master timeline
  和 `useStepper` 的 `STORAGE_KEY`
- **动画节奏贴口播**：出场动画宁可慢一点，跟口播推进同步；不要 300ms
  全部弹完后让画面静止等很久
- **逐步揭示**：清单 / 列表必须 1 项 = 1 step，禁一次全展示
- **双源原则**：节奏跟口播稿（顺序不能乱），细节回原文章抽（信息池 +
  本章 article 段落）
- Comic Panels Mode 下，视觉密度来自 panel 本身：按
  [`COMIC-PANELS.md`](references/COMIC-PANELS.md) 做 panel reveal、镜头推进、
  局部放大、对白/字幕和 SFX；不要把漫画图只当静态配图贴在舞台中央
- **完工自检逐项过**，不达标回去改 —— 按上文「硬性自检协议」执行
  （优先 Agent Teams → subAgent → 自检），**改完再向用户汇报本章交付**

### 2.5 大改后 bump STORAGE_KEY

改动 `chapters.ts`（增加 / 删除 / 重排章节，或某章 `narrations.ts`
长度变化）后，**bump** `presentation/src/hooks/useStepper.ts` 的
`STORAGE_KEY`（如 `v4` → `v5`），避免持久化游标落到不存在的 step 上。

---

## Phase 3 —— 自动音频合成

详细流程见 [`references/AUDIO.md`](references/AUDIO.md)。简版：

```bash
cd presentation
npm run extract-narrations   # 扫所有 narrations.ts → audio-segments.json
npm run synthesize-audio     # 默认火山/豆包：刘飞 2.0；增量、跳过已存在
npm run normalize-audio      # 统一分段响度 + 轻量降噪，输出 public/audio-normalized/
npm run build-master-audio -- \
  --audio-dir=public/audio-normalized \
  --master-name=master-normalized.mp3 \
  --timeline-name=timeline-normalized.json
```

**默认不要停下来问是否合成音频**。Phase 2 全部 HTML 已完成且验证通过后，
agent 直接进入本阶段。只有在以下情况才停下来收口：

- 用户明确说不要合成音频 / 只要 HTML
- 默认火山 / 豆包 TTS 鉴权或依赖缺失，且无法从本机 env 文件读取
- 用户明确要求换成本地 MeloTTS、MiniMax 或其它 TTS

默认 TTS 配置固定为：

```text
engine=volcengine
resource_id=seed-tts-2.0
voice_type=zh_male_liufei_uranus_bigtts
voice_name=刘飞 2.0
speed=1.2
speech_rate=20
```

合成完告诉用户：输出位置 / 总段数 / 哪些段时长异常（太长 = 该 step 拆
分；太短 = 文案太薄）/ 标准化前后响度差距。然后进入 Phase 4。

---

## Phase 4 —— 录屏 + 后期

详见 [`references/RECORDING.md`](references/RECORDING.md)。两种路径：

| 场景 | 推荐路径 |
|---|---|
| Phase 3 已合成并标准化音频 | **CDP 自动录制默认路径**：`npm run record-cdp -- --duration=<timeline+1.2> --viewport=1920x1080 --fps=30 --audio=public/audio-normalized/master-normalized.mp3 ...` |
| 需要烧录字幕 | **默认字幕后期**：`npm run burn-subtitles -- --input=<final.mp4> --output=<final-subtitled.mp4>`；白色大字、无背景框、按断句和口播速度分段 |
| 需要 2x 母版 | Playwright / browser automation 用 3840×2160 录视觉，再 ffmpeg 合标准化 master |
| 人工正式录屏 | Screen Studio / CleanShot 录 `?auto=1&record=1`，按 Space 启动，导出 1080p/60fps |
| 用户明确跳过 Phase 3 | 默认 Manual 模式手动点击推进 → 后期任意剪辑工具配音 |

> agent 在 Phase 3 后**主动告诉用户**适合的录屏路径。
> 默认不要用 screencli 做本流程：它会启动 AI agent、消耗 tokens，而本 skill
> 的页面已经可以自播放，CDP/Playwright/人工录屏更可控。

---

## 十条原则（一句话清单）

完整展开见 [`references/CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md)
Part 0 —— **写章节时回那里查**，下面只是索引。

| # | 原则 | 一句话 |
|---|---|---|
| 1 | 16:9 固定舞台 | 内容 1920×1080 + transform scale，没有响应式 |
| 2 | 全局 step 计数器 | 章节是 step 的纯函数，无定时器 |
| 3 | 每步独占整屏 | `if (step === N) return <FullScene />` |
| 4 | 口播节拍 = step | 一节拍 = 一 step = 一聚焦想法 |
| 5 | 隐藏的边角控件 | 进度条 / 翻页器默认 opacity 0 |
| 6 | 舞台无 chrome | 没有 header / footer / 页码 / 品牌条 |
| 7 | **内容驱动动画** | 先找内在动作，找不到才入场动画兜底；持续微动慎用 |
| 8 | 多点逐个揭示 | 1 项 = 1 step，禁同步 stagger 上 N 项 |
| 9 | 整片同一主题 | 章节间不翻表面色；**颜色 / 字体走 token**，其它尺度章节自由 |
| 10 | 双源原则 | script 定节拍，**article 定画面密度**（落到信息池） |

---

## 常见用户反馈速查

简化表见 [`references/CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md)
Part 8「常见反馈速查」。**关键**：先定位是哪一层（节奏 / 视觉 / 内容
/ 代码），再改最小切片，**不要重做整章**。

---

## 相关资源

按"何时读"标注，避免一次性全读：

| 文件 | 何时读 | 内容 |
|---|---|---|
| [`references/CODE-GARDEN-VOICEOVER.md`](references/CODE-GARDEN-VOICEOVER.md) | Phase 1.2 必读 | code秘密花园式技术口播稿唯一参考 |
| [`references/OUTLINE-FORMAT.md`](references/OUTLINE-FORMAT.md) | Phase 1.2 必读 | outline.md 字段 spec、命名约定、章节切分、信息池 |
| [`references/COMIC-PANELS.md`](references/COMIC-PANELS.md) | Comic Panels Mode 必读 | panels manifest → script / outline / motion comic 章节实现规则 |
| [`references/CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) | **Phase 2.4 每章主入口** | Part 0 十条原则 / Part 1 开工 5 问 / Part 2 关系→动作决策树 / Part 3 视觉工具箱 / Part 4 时长 / Part 5 反 AI 味反模式 / Part 6 代码硬规则 / Part 7 完工自检 / Part 8 反馈速查 |
| [`references/RICH-HTML-TOOLKIT.md`](references/RICH-HTML-TOOLKIT.md) | Phase 2.4 需要更丰富 React/SVG 表现时 | 从 `frontend-slides` / `slide-deck-generator` / `marp-slides` 抽出的富组件、SVG 图表、dashboard primitives 与依赖边界 |
| [`references/EXAMPLES/`](references/EXAMPLES/) | **可选** —— 看结构 | 章节结构示意（hook / list-reveal / case-tech-review）；**不是抄袭模板** |
| [`references/THEMES.md`](references/THEMES.md) | 选 / 造 / 切主题时 | 完整 token 契约 + 内置主题清单 + 创作流程 |
| [`references/AUDIO.md`](references/AUDIO.md) | Phase 3 才读 | 火山/豆包默认刘飞 2.0、MeloTTS / MiniMax 可选路径、故障排查 |
| [`references/RECORDING.md`](references/RECORDING.md) | Phase 4 才读 | 录屏工具 + 后期合成 |
| [`themes/`](themes) | Checkpoint Plan / Phase 1.2 时翻 | 内置主题（每个含 `theme.json` + `tokens.css`） |
| [`scripts/scaffold.sh`](scripts/scaffold.sh) | Phase 2.1 跑一次 | 一键项目脚手架 |
