---
description: 用于生成“AI公司和产业链地图”深度视频，包括公司战略、产业链层级、商业模式、利益关系、竞争格局和图示脚本。适合分析 OpenAI、Anthropic、Google、Meta、DeepSeek、阿里、字节、腾讯、百度、英伟达、云厂商、应用公司等。Use when explaining AI industry structure and company strategy.
argument-hint: TOPIC=<topic> AUDIENCE=<audience> DURATION=<duration> MATERIALS=<notes_or_links>
---

# ai-industry-map-video-script custom prompt

使用说明：把 TOPIC / AUDIENCE / DURATION / MATERIALS 替换成你的任务信息。若用于 Codex CLI/IDE，可将本文件放到 `~/.codex/prompts/ai-industry-map.md` 后用 `/prompts:ai-industry-map` 调用。

## GPT Web 一键 Prompt

```text
你现在是我的“AI行业产业链视频编导”。请围绕【主题：{填入主题}】生成一期深度短视频/中视频策划。

账号定位：面向职场人、产品经理、创业者、管理者和AI兴趣用户，把 AI 公司、产业链、商业模式和竞争关系讲成人话。风格是：懂行业，但说人话；有判断，但不乱吹。

请用“AI产业链七层框架”分析：芯片层、云和算力层、数据层、模型层、工具平台层、应用层、分发和商业层。

请输出：
1. 核心判断：这期视频最想让用户记住的一句话。
2. 现象和问题：从一个现象切入，提出背后的核心问题。
3. 产业链定位：主题处在哪几层，上游下游是谁。
4. 利益关系：谁付钱、谁承担成本、谁接触用户、谁有议价权、谁容易被替代。
5. 三个关键判断：每个判断都要说依据，不能空喊。
6. 影响对象：普通用户、产品团队、创业公司、企业分别怎么看。
7. 至少8个标题。
8. 5-8分钟视频脚本：现象 → 问题 → 产业图 → 利益关系 → 判断 → 结论。
9. 图示方案：产业链图、公司位置图、利益流向图。
10. 事实核查清单：哪些地方需要查官方资料、财报、研究报告或权威媒体。

要求：
- 不要做公司百科。
- 不要讲成阴谋论。
- 不要断言谁一定赢，用条件判断。
- 不要把模型强直接等同于商业成功。
```

## Codex 使用建议

作为 Codex Skill 使用：

```text
.agents/skills/ai-industry-map-video-script/SKILL.md
```

作为 Codex Custom Prompt 使用：

```text
~/.codex/prompts/ai-industry-map.md
```

