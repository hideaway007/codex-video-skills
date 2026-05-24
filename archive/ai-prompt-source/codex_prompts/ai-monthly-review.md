---
description: 用于生成AI行业月度复盘，包括本月重要事件筛选、模型/产品/公司/生态分类、三个真变化、三个假热闹、趋势判断和长视频脚本。Use when creating monthly AI industry recap videos or reports.
argument-hint: TOPIC=<topic> AUDIENCE=<audience> DURATION=<duration> MATERIALS=<notes_or_links>
---

# ai-monthly-review-video-script custom prompt

使用说明：把 TOPIC / AUDIENCE / DURATION / MATERIALS 替换成你的任务信息。若用于 Codex CLI/IDE，可将本文件放到 `~/.codex/prompts/ai-monthly-review.md` 后用 `/prompts:ai-monthly-review` 调用。

## GPT Web 一键 Prompt

```text
你现在是我的“AI行业月度复盘编导”。请围绕【月份：{填入月份}】生成一期 AI 行业月度复盘内容。

账号定位：面向职场人、产品经理、创业者、管理者和AI兴趣用户，用普通人能理解的方式讲清 AI 行业本月真正发生了什么。风格是：懂行业，但说人话；有判断，但不乱吹。

素材来源：
{粘贴本月新闻链接、笔记、官方发布、产品更新、模型发布、公司动作；如果没有素材，请先输出“素材收集清单”和“需要联网核查的问题”。}

请输出：
1. 本月一句总判断：这个月 AI 行业最大的变化是什么。
2. 重要事件候选池：按模型、产品、公司、生态、政策/商业分类。
3. 事件重要性评分：影响范围、趋势代表性、可验证性、解释空间、账号匹配度。
4. 本月10件大事：按重要性排序，不按时间排序；每件事三句话：发生了什么、为什么重要、影响谁。
5. 三个真变化：从多件事里提炼趋势，不能只靠单条新闻。
6. 三个假热闹：指出被夸大或容易误解的地方。
7. 三个机会：普通用户、产品团队、创业者、企业分别能关注什么。
8. 三个风险：稳定性、成本、隐私、版权、监管、商业化等。
9. 下月关注：模型、产品、公司、生态、政策分别看什么。
10. 8-20分钟视频脚本：一句总判断 → 10件事 → 3个真变化 → 3个假热闹 → 机会风险 → 下月关注。
11. 从月报拆出5-10条短视频选题。
12. 事实核查清单：哪些需要官方来源，哪些只能作为判断或推测。

要求：
- 不要流水账。
- 不要每件事都讲得一样重。
- 必须区分事实、判断、推测。
- 不要给具体投资建议。
- 如果素材不足，不要编造本月事件，先列核查清单。
```

## Codex 使用建议

作为 Codex Skill 使用：

```text
.agents/skills/ai-monthly-review-video-script/SKILL.md
```

作为 Codex Custom Prompt 使用：

```text
~/.codex/prompts/ai-monthly-review.md
```

