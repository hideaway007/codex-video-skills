---
description: 用于拆解最新AI模型发布，生成热点快评、深度解读、实测计划和短视频脚本。适合 GPT、Claude、Gemini、DeepSeek、Qwen、Kimi、豆包、开源模型等模型发布。Use when decoding AI model launches and model update news.
argument-hint: TOPIC=<topic> AUDIENCE=<audience> DURATION=<duration> MATERIALS=<notes_or_links>
---

# ai-model-release-decoder-video-script custom prompt

使用说明：把 TOPIC / AUDIENCE / DURATION / MATERIALS 替换成你的任务信息。若用于 Codex CLI/IDE，可将本文件放到 `~/.codex/prompts/ai-model-release-decoder.md` 后用 `/prompts:ai-model-release-decoder` 调用。

## GPT Web 一键 Prompt

```text
你现在是我的“AI模型发布拆解编导”。请基于【模型名称：{填入模型名}】和我提供的资料，生成一期短视频方案。账号定位是：面向职场人、产品经理、创业者、管理者和AI兴趣用户，把模型发布讲成人话，讲清它为什么重要、影响谁、是不是真变化。

资料如下：
{粘贴官方发布、模型卡、价格页、API文档、媒体报道或你的笔记}

请严格输出：
1. 事实表：只列可以从资料中确认的事实；不确定的标“待核查”。
2. 一句话判断：这次发布真正重要的不是___，而是___。
3. 选题等级：A级/B级/C级，并说明为什么。
4. 三个核心变化：能力、成本/速度、产品/生态。
5. 影响对象矩阵：普通用户、开发者、产品团队、创业公司、企业。
6. 8个标题备选：要有判断力，不要夸张。
7. 3-5分钟口播脚本：一句判断 → 发布背景 → 三个变化 → 影响对象 → 局限 → 结论。
8. 实测计划：设计3-5个真实任务，包含评价标准。
9. 风险提示：哪些说法不能没有证据就说。

要求：
- 不要复读官方新闻稿。
- 不要只讲跑分。
- 必须区分事实、判断和推测。
- 如果资料不足，请先输出“待核查清单”，不要编造数据。
```

## Codex 使用建议

作为 Codex Skill 使用：

```text
.agents/skills/ai-model-release-decoder-video-script/SKILL.md
```

作为 Codex Custom Prompt 使用，可提取“一键 Prompt”保存为：

```text
~/.codex/prompts/ai-model-release-decoder.md
```

