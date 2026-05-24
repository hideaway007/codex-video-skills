# Rich HTML / React / SVG Toolkit

这份文件把三个参考仓库里适合本工作流的部分抽成可执行规则：

- `frontend-slides`：单 HTML 的 viewport fitting、样式预览、防溢出、PPT 转换思路
- `slide-deck-generator`：React/Vite 组件化、固定舞台、progressive reveal、图表/图标依赖边界
- `marp-slides`：SVG 图表、metric cards、dashboard primitives、流程图和信息组件

本文件不是新的主流程。写章节时先按 [`CHAPTER-CRAFT.md`](CHAPTER-CRAFT.md)
判断内容关系，再从这里选 1-3 个视觉 primitive 强化画面。

---

## 使用边界

### 可以吸收

- React 组件化：把复杂视觉物件拆成 `MetricCard` / `SvgGauge` /
  `FlowMap` / `BrowserMock` 等本章内组件。
- SVG 图表：bar / line / donut / gauge / radar / path flow / connector。
- 数据仪表：数字卡、趋势箭头、状态点、进度条、对比标签。
- 互动状态：hover / focus / selected / active step，用来让录屏前检查更直观。
- 固定 16:9 舞台：沿用本项目 1920x1080 stage，不改成滚动 slide。
- density guard：一屏一个主意，文本过多就拆 step。

### 不要直接搬

- 不要把工作流改成 Marp / Markdown slide。
- 不要把 `frontend-slides` 的滚动型单 HTML 替换掉当前 React/Vite 架构。
- 不要为了“丰富”默认加 Tailwind / Framer Motion / Recharts。
- 不要复制第三方主题 palette 覆盖当前主题 token。
- 不要做 PPT header / footer / 页码 / logo 水印。

依赖原则：默认用 React + CSS + SVG 原生能力。只有当一章明确需要复杂曲线图、
大规模图表或图标集时，才允许增加依赖，并同步改 `package.json`、验证 build。

---

## 章节富组件基线

每章至少选一类作为主视觉，不要只做文字排版：

| 内容关系 | 推荐 primitive | 适合表现 |
|---|---|---|
| 数字变化 | `MetricCard` + count-up + sparkline | 增长、下滑、对比、成本 |
| 排名 / 份额 | SVG bar / stacked bar / donut | 市场份额、占比、预算分配 |
| 阶段推进 | `FlowMap` + SVG connector path | pipeline、工作流、时间线 |
| 概念旅程 / 工具链 | SVG 分镜小剧场 + CSS camera | 想法到 Markdown、HTML、Video、Voice 的推进 |
| 系统结构 | browser / terminal / file tree mock | AI coding、产品界面、工具链 |
| 判断 / 取舍 | before-after split + verdict tag | 方案比较、优缺点、是否采用 |
| 风险 / 信号 | gauge / status dots / alert ledger | 风险等级、健康度、状态监控 |
| 叙事转折 | document wall / archive board | 案例、证据、引用、历史演化 |

每章不是所有 primitive 都要用。选 1 个主视觉 + 1 个辅助信息组件通常够。

---

## SVG 分镜小剧场 primitive

这是概念解释、工具链讲解和流程推进的默认高优先级方案。目标不是做一张漂亮
SVG 插画，而是做一个可录屏的微型场景：观众看到信息被生产、加工、转译和收束。

### 1. 推荐结构

- 背景层：纸面网格、淡噪声、手绘云线、坐标线、轻微阴影。
- 中景层：主流程路径、节点、connector、阶段标签、状态灯。
- 前景层：小人、文档、浏览器窗口、视频窗口、声音节点、字幕焦点。
- 叙事线：从 idea / note 推到 Markdown，再滑到 HTML，最后收束到
  Video + Voice；具体命名按本章内容替换。

### 2. CSS 档动效

- 镜头：外层 `.scene-camera` 跟 step 切换 `transform: translate(...) scale(...)`，
  做轻微 pan / zoom / slide，不要让整页只靠元素淡入。
- 自绘：路径线、窗口边框、波形、图表线条用 `stroke-dasharray` +
  `stroke-dashoffset`；bar / progress 用宽度或 scale 生长。
- 节点：统一支持 `active` / `done` / `muted` 三态。active 放大并提亮，
  done 降低对比但保留，muted 半透明等待。
- 局部动作：Markdown 行数增长、HTML 图表生长、Video 声波出现、底部
  bandwidth / progress 条推进，都由 step class 触发。
- 人物：默认用简单 SVG / CSS 小人，做指向、观看、递交、站位变化即可。
  不默认做骨骼、IK 或真实踩踏。

### 3. 边界

默认保持 React + CSS + SVG，无需新依赖、无需 `setInterval`。只有用户明确要求
自行车踩踏、机械联动、布娃娃、真实骨骼或更连续的物理运动时，再进入 JS /
IK 档；否则先把复杂度放在镜头、层级、线条自绘和局部状态上。

---

## SVG 图表规则

### 1. 图表必须服务口播节拍

- 口播说一个数字：数字卡独占焦点，图表只是背景证据。
- 口播说多个项：一项一个 step，bar / node / card 跟 step 逐个点亮。
- 口播说因果链：用 path flow 或 pipeline，不要用静态列表。
- 口播说对比：用左右 split / 双柱 / 差值标签，不要把两段文字并排。

### 2. SVG 写法

- 用 `viewBox` 固定内部坐标，外层通过 CSS 控制尺寸。
- 动态线条用 `stroke-dasharray` + `stroke-dashoffset`。
- bar / progress 可用 div 实现，复杂路径用 SVG。
- 图表颜色必须来自 `--accent` / `--accent-soft` / `--text-*` /
  `--rule`，不要硬编码 palette。
- 数据未知时用真实 placeholder，并写明缺什么，不编假数字。

### 3. 推荐 SVG primitives

```tsx
function StatusDot({ state }: { state: "ok" | "warn" | "bad" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle
        cx="6"
        cy="6"
        r="5"
        className={`status-dot status-dot--${state}`}
      />
    </svg>
  );
}
```

```tsx
function ConnectorPath({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 640 160" className="flow-path" aria-hidden="true">
      <path
        d="M20 90 C160 20 260 140 400 70 S560 40 620 100"
        className={active ? "flow-path__line is-active" : "flow-path__line"}
      />
    </svg>
  );
}
```

---

## React 组件组织

复杂章节不要把所有 JSX 堆在一个 return 里。本章内部可以拆小组件：

```text
src/chapters/03-market-map/
├── MarketMap.tsx
├── MarketMap.css
└── narrations.ts
```

`MarketMap.tsx` 内部结构建议：

```tsx
function MetricCard(...) {}
function ShareBars(...) {}
function FlowMap(...) {}

export function MarketMap({ step }: { step: number }) {
  if (step === 0) return <OpeningSignal />;
  if (step === 1) return <ShareBars active="model" />;
  if (step === 2) return <FlowMap active="inference" />;
  return <FinalTakeaway />;
}
```

规则：

- 小组件只服务本章，不跨章 import。
- `step` 决定场景，不在组件里另建时间线状态。
- 可交互控件必须加 `data-no-advance`。
- 复杂数据放本章文件顶部常量，避免散在 JSX 里。

---

## 动效层级

优先级从高到低：

1. 内容动作：bar 生长、path 自绘、节点点亮、账本增加、窗口切换。
2. 结构动作：左右 split、镜头推进、mask reveal、局部放大。
3. 入场动作：fade / blur / translate，仅作为兜底。
4. 持续微动：只用于活物件，如光标、扫描线、仪表脉冲；不要全屏漂。

默认不要引入 Framer Motion。CSS keyframes 足够时保持轻量；如果项目已经引入
Framer Motion，可以用于 slide enter / stagger / layout transitions，但仍要保证
动画时长不超过 narration 时长。

---

## 参考仓库的具体可用点

### `slide-deck-generator`

可借鉴：

- 章节/slide 组件分文件组织。
- 固定 16:9 canvas + 外层 scale。
- `slides/index.ts` 的有序注册思路。
- progress bar / counter / keyboard navigation 的轻量实现。
- `slide-guidelines.md` 的“Problem -> Discussion -> Concept -> Example
  -> Takeaway”教学结构。
- Recharts / lucide-react 作为明确需求下的可选依赖。

不要借鉴：

- Tailwind 作为默认样式系统。
- 每页都像 slide deck 的页码 / counter。
- 把 1280x720 改成当前项目的舞台基准。

### `frontend-slides`

可借鉴：

- density limit：标题页、内容页、图表页各自限制信息量。
- 视觉风格先 preview 再定稿的协作方式。
- viewport fitting 和防 overflow 的检查意识。
- PPTX 提取为素材和文字的 pipeline 思路。
- PDF 导出脚本思路。

不要借鉴：

- 滚动 snap slide 模型。
- 单 HTML 作为默认交付模型。
- 让用户反复填抽象风格偏好。

### `marp-slides`

可借鉴：

- dashboard 组件：metric card、status dot、verdict tag、hover row。
- SVG 图表：line / area / donut / gauge / sparkline / stacked bar / radar。
- layout primitive：terminal mock、browser mock、chat bubbles、timeline、
  flowchart。
- 参考示例按类别读取：data/dashboard、editorial、guide、showcase。

不要借鉴：

- Markdown / Marp 作为主生产格式。
- 依赖 VS Code Marp preview。
- 相对路径图片规则直接套到 Vite public assets。

---

## 完工检查补充

章节自检时额外问三句：

- 这一章有没有至少一个“React 富组件”承担主视觉，而不是只有文本和卡片？
- 如果讲到数字 / 流程 / 对比，是否用了 SVG / chart / path / gauge 表达？
- 增强组件是否仍然符合 `d2-editorial-grid` 或当前主题的 token，而不是跑成通用
  dark dashboard / SaaS landing page？

任一答案是否定，就回 [`CHAPTER-CRAFT.md`](CHAPTER-CRAFT.md) 重新选视觉关系。
