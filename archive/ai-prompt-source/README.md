# AI行业视频账号：五大栏目 Prompt / Skill 包

> 版本：v1.0  
> 日期：2026-05-11  
> 用途：把“五个内容栏目”整理成可直接给 GPT Web、Custom GPT、Codex 使用的 Markdown Prompt / Skill 文档。

## 你拿到的文件

```text
AI行业视频账号_PromptSkill包/
├── README.md
├── standalone_docs/
│   ├── 01_3分钟秒懂AI黑话_prompt_skill.md
│   ├── 02_新模型发布拆解_prompt_skill.md
│   ├── 03_AI公司和产业链地图_prompt_skill.md
│   ├── 04_AI产品实测与产品拆解_prompt_skill.md
│   └── 05_AI行业月度复盘_prompt_skill.md
├── .agents/skills/
│   ├── ai-term-explainer-video-script/SKILL.md
│   ├── ai-model-release-decoder-video-script/SKILL.md
│   ├── ai-industry-map-video-script/SKILL.md
│   ├── ai-product-review-video-script/SKILL.md
│   └── ai-monthly-review-video-script/SKILL.md
└── codex_prompts/
    ├── ai-term-explainer.md
    ├── ai-model-release-decoder.md
    ├── ai-industry-map.md
    ├── ai-product-review.md
    └── ai-monthly-review.md
```

## 推荐使用方式

### 方式一：GPT Web 直接使用

打开 `standalone_docs/` 里的任意文件，复制其中的 **“GPT Web 一键 Prompt”**，把变量替换成你的选题即可。

适合场景：

- 快速生成一条视频脚本。
- 快速做选题判断。
- 快速写标题、口播稿、分镜和事实核查清单。

### 方式二：做成 Custom GPT

建议把这五个文件作为知识材料上传，把下面这段作为 GPT Instructions 的核心：

```text
你是“AI行业短视频内容编导”。账号定位是：三分钟看懂AI行业。面向职场人、产品经理、创业者、管理者和AI兴趣用户，用普通人能理解的方式讲清 AI 模型、产品、公司、产业链和关键概念。

工作方式：根据用户给出的主题，先判断它属于五个栏目中的哪一个：3分钟秒懂AI黑话、新模型发布拆解、AI公司和产业链地图、AI产品实测与产品拆解、AI行业月度复盘。然后调用对应栏目文档里的结构、工作流和输出格式生成内容。

风格：懂行业，但说人话；有判断，但不乱吹。必须区分事实、判断和推测。涉及最新模型、公司、产品、价格、融资、政策、Benchmark 时，优先查官方来源或提醒用户提供来源，不编造数据。

输出必须适合短视频生产：标题、核心判断、口播脚本、画面建议、事实核查清单、评论区互动问题。
```

### 方式三：作为 Codex Skills 使用

把 `.agents/skills/` 整个目录复制到你的项目根目录。结构应保持为：

```text
项目根目录/
└── .agents/
    └── skills/
        └── ai-term-explainer-video-script/
            └── SKILL.md
```

之后在 Codex 里可以显式提到：

```text
使用 $ai-term-explainer-video-script，帮我围绕 Agent 写一条3分钟短视频脚本。
```

也可以让 Codex 根据任务描述自动匹配相应 Skill。

### 方式四：作为 Codex Custom Prompts 使用

把 `codex_prompts/` 里的 Markdown 文件复制到：

```text
~/.codex/prompts/
```

然后在 Codex CLI/IDE 中用 slash command 调用，例如：

```text
/prompts:ai-term-explainer TOPIC="Agent" AUDIENCE="职场人" DURATION="180秒"
```

## 五个 Skill 的职责分工

| 文件 | 栏目 | 最适合解决的问题 |
|---|---|---|
| 01_3分钟秒懂AI黑话_prompt_skill.md | 3分钟秒懂AI黑话 | 把 AI 术语讲成人话 |
| 02_新模型发布拆解_prompt_skill.md | 新模型发布拆解 | 判断新模型发布到底重要在哪 |
| 03_AI公司和产业链地图_prompt_skill.md | AI公司和产业链地图 | 讲清公司、产业链、商业模式和利益关系 |
| 04_AI产品实测与产品拆解_prompt_skill.md | AI产品实测与产品拆解 | 测评 AI 产品，判断适合谁、不适合谁 |
| 05_AI行业月度复盘_prompt_skill.md | AI行业月度复盘 | 从一个月热点中提炼真正趋势 |

## 使用建议

1. 起号阶段优先用栏目一和栏目四：更容易拉新和获得用户收藏。
2. 遇到重大模型发布，用栏目二承接热点，但不要只复述官方新闻。
3. 每周至少做一条栏目三，建立专业度。
4. 每月固定做栏目五，把碎片内容沉淀成体系。
5. 同一个主题可以五个栏目联动，例如 Agent：术语解释 → 新模型 Agent 能力 → 大厂入口之争 → Agent 产品实测 → 月度复盘。

## 统一质量标准

每条内容发布前自检：

- 用户看完能不能记住一句话？
- 有没有讲清“为什么现在重要”？
- 有没有讲影响谁？
- 有没有事实来源或待核查清单？
- 有没有避免夸张结论？
- 能不能直接口播？
- 有没有画面建议？
- 有没有评论区互动问题？

## 注意

这些文档不是为了让模型“写得更花”，而是为了让输出更稳定：每次都有选题判断、核心观点、脚本结构、画面建议和事实核查。
