# Comic Panels Mode

把已经切好的漫画 panels 做成 16:9 HTML motion comic。这个模式不是另起
一套 workflow，而是 `web-video-presentation` 的输入分支：仍然产出
`script.md`、`outline.md`、`presentation/`，仍然用 `narrations.ts` 作为
step 和音频的唯一真相源。

## 触发条件

用户给了一个 panels 目录，目录至少包含：

```text
comic-panels/
├── manifest.json
├── panel_001.png
├── panel_002.png
└── ...
```

`manifest.json` 应记录原图尺寸、panel 文件名、裁切框、宽高。没有 manifest
时也可以按文件名排序继续，但必须在 `outline.md` 里标注这是弱输入。

## 输入到产出的映射

| 输入 | 产出里怎么用 |
|---|---|
| `manifest.json` | panel 顺序、尺寸、构图比例、素材清单 |
| `panel_*.png` | `presentation/public/assets/panels/` 里的真实画面素材 |
| 用户补充剧情 / 台词 | `script.md` 的旁白和对白 |
| 没有补充文案 | 按 panel 顺序写短旁白，不擅自扩展世界观 |

## Phase 1 写法

1. 先读 `manifest.json`，确认 panel 数量、文件名、尺寸和阅读顺序。
2. 生成 `script.md`：每个 panel 至少对应一段旁白或对白；信息不足时写短句，
   不要脑补复杂剧情。
3. 生成 `outline.md`：每个 panel 可拆成 1-N 个 step。大 panel 可以拆成
   "全景建立 → 局部放大 → 对白/细节 → 情绪停顿"；小 panel 通常 1 step。
4. 素材清单必须列出每个 panel 文件、尺寸、建议用途、是否需要放大局部。
5. 自检重点：panel 顺序不能乱；`script.md` 节拍必须能对上 `outline.md`
   每个 step；不要把全部 panels 一屏铺开。

## Phase 2 实现规则

### 视觉原则

- 每步只服务一个观看动作：看整格、看局部、读对白、看情绪、看转折。
- 允许使用 camera pan、zoom-in、mask reveal、panel slide、speech bubble、
  caption bar、SFX typography、speed lines、focus ring。
- 禁止把漫画图居中放大后只做淡入淡出；至少要有镜头选择或阅读顺序设计。
- 仍然遵守 16:9 固定舞台、全局 step 计数器、每步独占整屏。
- 字幕 / 旁白文字不要遮住关键画面；遮挡不可避免时用底部 caption band 或
  侧边 annotation rail。

### Step 拆分建议

| Panel 类型 | Step 拆法 |
|---|---|
| 横向长 panel | 全景 1 step + 左到右/右到左阅读推进 1-2 step |
| 竖向窄 panel | 先放进版面关系，再局部放大关键表情或动作 |
| 多角色对白 | 1 句对白 = 1 step；用气泡高亮或字幕推进 |
| 动作 / 冲突 | 先建立位置，再放大动作线 / 接触点 / 结果 |
| 情绪停顿 | 保留留白和慢镜头，不加多余装饰 |

### 代码边界

- panel 路径统一使用 `/assets/panels/<file>`。
- 每章仍然独立 CSS 前缀，避免污染其它章节。
- 如果一个漫画只有 7-12 个 panels，可以做成单章；超过 12 个 panels，按
  场景或情绪转折拆章。
- `narrations.length` 必须等于章节内 step 数。没有旁白的静默 step 也要写
  简短 narration，例如 `"（停顿）"`，方便后续音频或时间线处理。

## 素材导入

脚手架完成后运行：

```bash
scripts/import-comic-panels.sh <panels_dir> ./presentation
```

导入后确认：

```text
presentation/public/assets/panels/
├── manifest.json
├── panel_001.png
└── ...
```

不要移动或删除用户原始 panels 目录；它是素材来源和后续重切的依据。

## 完工自检

- `manifest.json` 的 panel 数量和导入后的 png 数量一致。
- `outline.md` 的素材清单覆盖所有使用到的 panels。
- 每个 step 都能指出正在看哪个 panel 或哪个局部。
- 画面不是静态图库轮播：至少有阅读路径、镜头推进或局部信息揭示。
- 字幕、对白、SFX 没有压住关键人物脸、动作点或文字气泡。
