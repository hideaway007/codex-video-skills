---
name: if-you-become-x-voiceover
description: Use when creating, expanding, revising, or scoring Chinese “假如你成为 X” second-person oral video scripts for historical figures, jobs, identities, factions, creatures, organizations, or fictional roles in this Web vidio project.
---

# 假如你成为 X 口播

## 定位

用于写 B 站式“假如你成为 X”中文口播稿：第二人称代入、幻想入口、奇幻经历、爽点升级、世界规则、身份变形和反讽闭环。目标是同赛道原创读感，不复刻任何具体创作者的本人声音。

## 硬边界

- 不使用具体创作者的自称、观众称呼、私人梗、固定口癖或原句。
- 不把目标写成“贴脸复刻”“让人听不出不是某人”。
- 相似只保留结构、节奏、第二人称压力、奇幻经历递进和反讽收束。
- 默认娱乐奇幻体验优先，不把“真实苦难”“现实账单”当核心卖点。
- 现实、历史、当代行业题材只有在用户明确要求时才保留事实边界；否则按幻想化、传说化、异世界化处理。

## 默认工作流

1. 先把题目填成选题输入卡：`X 是什么 / 观众原本以为 / 奇幻经历 / 能力或身份升级 / 碾压力量 / 结尾命运`。
2. 选择主发动机：爽点升级型、奇幻冒险型、怪物自洽型、权力迷宫型、命运反噬型。
3. 按长度选择结构：
   - 1000 字开头：只完成幻想入口、幻想升级、投放、低处落点、日常压入世界观。
   - 2000-3000 字短稿：压缩 12 拍，但必须有小胜、奇幻反转、大事件、身份变形和反讽闭环。
   - 7000-11000 字长稿：按完整 12 拍生成，至少 5 次认知反转。
4. 生成正文时让知识点通过“你正在遭遇什么”出现，不写百科段落。
5. 交付前做三类检查：结构检查、机器指标检查、反贴脸风险检查。

## 12 拍结构

1. 观众幻想入口。
2. 幻想升级。
3. 本期投放。
4. 低处落点。
5. 日常细节压入世界观。
6. 第一次身份红利或小胜。
7. 小胜触发新的奇幻副作用、权限升级或命运反噬。
8. 世界规则荒诞但有效。
9. 大事件集中爆发。
10. 身份或人格变形。
11. 后日谈、档案或命运延长。
12. 反讽闭环，回扣开头幻想。

## 生成要求

- 第二人称“你”必须是主轴，前 500 字进入具体处境。
- 每 150-250 字让“你”做动作、判断或承受结果。
- 每 800-1200 字至少出现一次“爽点升级 / 奇幻副作用 / 规则反转”。
- 小胜要先让观众觉得爽，再把故事推向更离谱、更危险或更有想象力的阶段。
- 压力优先来自神明、魔法、怪物生态、诅咒、世界规则、阵营任务、命运选择或组织规则，不靠现实苦难堆惨。
- 身份变形要写出“你开始接受这个世界的玩法”，而不是只写受苦。
- 结尾必须回扣开头刻板印象。

## Reference 路由

完整资源在 `references/if-you-become-x-writing-system/`。按需读取，不要一次加载全部。

| 需求 | 优先读取 |
|---|---|
| 快速理解系统 | `README.md` |
| 写新题材 | `blank-template.md`、`fantasy-experience-mode.md`、`style-dna.md` |
| 写正式长稿 | `prompts/deep-generator-prompt.md`、`deep-checklist.md` |
| 先写 1000 字开头 | `prompts/calibrated-generation-prompt.md` |
| 口播太正式 | `prompts/rough-oralize-prompt.md` |
| 初稿返修 | `prompts/style-revision-prompt.md`、`90-percent-calibration.md` |
| 风格句式 | `style-pattern-library.md`、`original-narrator-voice.md` |
| 避免贴脸 | `anti-clone-checklist.md` |
| 参考样稿 | `samples/`、`drafts/` |
| 语料指标 | `analysis/metrics.md` |

## 旧资料解释规则

reference 里部分旧文档仍会出现旧版“现实苦难 / 现实成本”取向。使用本 skill 时，把这些旧表达统一理解为“奇幻副作用 / 爽点反噬 / 命运变味”，不要按现实苦难去写。若旧 reference 与本 `SKILL.md` 冲突，以本文件为准。

## 评分与验证

机器形状评分：

```bash
python3 .codex/skills/if-you-become-x-voiceover/references/if-you-become-x-writing-system/scripts/evaluate_style.py path/to/draft.md
```

解释分数时要区分：

- `Opening calibration`：1000-3000 字开头或短稿的局部校准参考。
- `Machine shape score`：7000-11000 字完整稿的形状参考。
- 人工 90 分判断仍以 `90-percent-calibration.md` 和 `deep-checklist.md` 为准。

如果用户要求“打分”“让 subagent 打分”，派独立 reviewer，只读稿件和评分表，不让 reviewer 改文件。评分至少包含：总分、A-G 七项、12 拍强弱、反贴脸风险、优先返修建议。

## 默认输出

用户要求写稿时，直接输出可口播正文；如果在项目内落盘，文件放到合适的 `drafts/`、`scripts/` 或用户指定位置。除非用户要求方法说明，不要先长篇解释模板。

用户要求选题时，输出题名、观众幻想、奇幻经历、爽点变化、适配度和推荐优先级。
