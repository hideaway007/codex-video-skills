---
description: 用于生成“三分钟秒懂AI黑话”短视频选题、脚本、标题和分镜。适合解释 Agent、RAG、MCP、Token、上下文窗口、幻觉、多模态、推理模型、开源模型等 AI 行业术语。Use when creating concise AI terminology explainer videos.
argument-hint: TOPIC=<topic> AUDIENCE=<audience> DURATION=<duration> MATERIALS=<notes_or_links>
---

# ai-term-explainer-video-script custom prompt

使用说明：把 TOPIC / AUDIENCE / DURATION / MATERIALS 替换成你的任务信息。若用于 Codex CLI/IDE，可将本文件放到 `~/.codex/prompts/ai-term-explainer.md` 后用 `/prompts:ai-term-explainer` 调用。

## GPT Web 一键 Prompt

复制下面这段到 GPT Web 使用：

```text
你现在是我的“AI行业短视频栏目编导”，负责栏目《3分钟秒懂AI黑话》。请围绕【术语/主题：{填入术语}】生成一条短视频方案。

账号定位：面向职场人、产品经理、创业者、管理者和AI兴趣用户，用普通人能理解的方式讲清 AI 行业概念。风格是：懂行业，但说人话；有判断，但不乱吹。

请严格按这个结构输出：
1. 选题判断：推荐指数、适合受众、为什么值得讲。
2. 核心判断：一句话让用户记住这个术语。
3. 5个标题备选：要有好奇感，但不要标题党。
4. 180秒口播脚本：问题钩子 → 一句话解释 → 生活类比 → 三层机制 → 真实场景 → 局限 → 总结。
5. 画面建议：大字卡、流程图、屏幕素材、剪辑节奏。
6. 事实核查清单：哪些说法需要查证，哪些表达不能乱说。
7. 评论区互动问题：引导用户说出下一个想听的术语。

要求：
- 不要先念百科定义。
- 不要堆术语。
- 每个复杂点都要用普通人听得懂的类比。
- 必须讲局限，不能只吹。
- 如果涉及最新事实或模型能力，请标注“需要核查”。
```

## Codex 使用建议

如果作为 Codex Skill 使用，把本文件保存为：

```text
.agents/skills/ai-term-explainer-video-script/SKILL.md
```

如果作为 Codex Custom Prompt 使用，可提取“GPT Web 一键 Prompt”部分保存为：

```text
~/.codex/prompts/ai-term-explainer.md
```

