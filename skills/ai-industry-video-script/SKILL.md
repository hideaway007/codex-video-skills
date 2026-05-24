---
name: ai-industry-video-script
description: 用于生成 AI 行业短视频、长视频或图文脚本；适合解释 AI 术语、拆解新模型发布、分析 AI 公司和产业链、实测 AI 产品、整理 AI 行业月度复盘。Use when creating AI industry video scripts, explainers, product reviews, company analysis, model launch decoding, or monthly recap content.
---

# AI Industry Video Script

## 定位

账号定位：三分钟看懂 AI 行业。

面向职场人、产品经理、创业者、管理者和 AI 兴趣用户，用普通人能理解的方式讲清 AI 模型、产品、公司、产业链和关键概念。

账号人格：懂行业，但说人话；有判断，但不乱吹。

## 统一原则

1. 不做 AI 资讯搬运，做 AI 行业解释。
2. 不只回答“是什么”，还要回答“为什么现在重要”“影响谁”“和用户有什么关系”。
3. 事实、判断、推测分开写。
4. 涉及最新模型、公司动作、产品功能、价格、融资、政策、Benchmark、开源许可时，优先联网查官方来源；不能查证时明确写入待核查清单。
5. 不使用“彻底替代、全面碾压、必然死亡、遥遥领先、史诗级革命”等无证据绝对化表达。
6. 输出要适合短视频生产：能口播、能剪辑、有画面、有标题、有结论。

## 栏目路由

先判断用户需求属于哪个栏目，再读取对应 reference。若用户没有指定栏目，按主题和任务自动选择。

| 用户意图 | 栏目 | 读取 |
|---|---|---|
| 解释 Agent、RAG、MCP、Token、上下文窗口、幻觉、多模态、MoE、推理模型等术语 | 3 分钟秒懂 AI 黑话 | `references/term-explainer.md` |
| 拆解 GPT、Claude、Gemini、DeepSeek、Qwen、Kimi、豆包等模型发布、降价、开源、能力更新 | 新模型发布拆解 | `references/model-release-decoder.md` |
| 分析 OpenAI、Anthropic、Google、Meta、DeepSeek、阿里、字节、腾讯、英伟达、云厂商、应用公司和产业链关系 | AI 公司和产业链地图 | `references/industry-map.md` |
| 测评或横评 AI 搜索、AI 办公、AI 写作、AI 编程、AI 视频、AI 浏览器、Agent、知识库等产品 | AI 产品实测与产品拆解 | `references/product-review.md` |
| 整理某月 AI 行业热点、趋势、真变化、假热闹、模型/产品/公司/生态复盘 | AI 行业月度复盘 | `references/monthly-review.md` |

## 默认工作流

1. 识别主题、目标受众、视频长度、平台和素材来源。
2. 判断栏目；如果可能属于多个栏目，选择最适合当前传播目标的一个，不要同时展开五套结构。
3. 读取对应 reference，并按该栏目结构产出。
4. 对最新事实做 source-based verification；无法确认的内容放入“待核查清单”。
5. 输出时优先给可直接生产的稿件，而不是解释方法。

## 默认输出

除非用户指定格式，否则输出：

1. 选题判断：属于哪个栏目，为什么适合。
2. 标题：3-5 个，避免夸张标题党。
3. 核心判断：一句话说清这期内容的主结论。
4. 口播稿：按时间节奏分段，可直接念。
5. 画面建议：每段对应画面、字幕或图示。
6. 事实核查清单：哪些事实已确认，哪些还需要来源。
7. 评论区互动问题：1-3 个。

## 组合规则

- 用户要“一期视频”：只选一个主栏目。
- 用户要“系列选题”：可以把同一主题拆成多个栏目，例如 Agent 可拆成术语解释、产品实测、产业链分析、月度复盘。
- 用户给了链接、新闻或发布稿：优先做模型发布拆解或产品/公司分析，不要默认做术语科普。
- 用户要实测：先定义测试任务和评分维度，再写脚本。
- 用户要月报：先筛选事件重要性，再写脚本；不要堆新闻列表。

## Reference 使用

只读取本次需要的一个 reference。除非用户明确要求多栏目联动，不要一次读取全部。

- `references/term-explainer.md`
- `references/model-release-decoder.md`
- `references/industry-map.md`
- `references/product-review.md`
- `references/monthly-review.md`

## 质量底线

每次交付前自检：

- 用户看完能不能记住一句话？
- 有没有讲清“为什么现在重要”？
- 有没有讲影响谁？
- 有没有区分事实、判断和推测？
- 有没有事实来源或待核查清单？
- 能不能直接口播？
- 有没有画面建议？
