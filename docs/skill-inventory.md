# Skill Inventory

日期：2026-05-25

## 发布范围

| Skill | 状态 | 说明 |
|---|---|---|
| `hyperframes-teaching-video` | loadable | 新的 HyperFrames 教学视频生产入口，替代旧 Web Video Engineer 路线 |
| `web-video-presentation` | loadable | 保留为网页演示 / motion comic / click-driven video 路线 |
| `ai-industry-video-script` | loadable | 从早期 AI Prompt 包整理出的单入口 AI 行业脚本 skill |
| `if-you-become-x-voiceover` | loadable | 中文第二人称“假如你成为 X”口播生产 skill |
| `archive/ai-prompt-source` | archive-only | 早期 prompt 资料归档，不作为可加载入口 |

## 整理规则

- 只把带顶层 `SKILL.md` 的目录放入 `skills/`。
- 每个 loadable skill 都补齐 `agents/openai.yaml`。
- 不复制视频输出、浏览器缓存、Playwright 日志、平台发布草稿、账号信息和 `.DS_Store`。
- 不把旧 `AI Prompt` 作为顶层 skill 暴露，避免和 `ai-industry-video-script` 重复触发。
- 保留 reference 文件，因为这些是 skill 执行时的渐进式上下文。

## 安装方式

默认安装到 `~/.codex/skills`：

```bash
./scripts/install.sh
```

指定目标目录：

```bash
CODEX_SKILLS_DIR=/path/to/skills ./scripts/install.sh
```

## 验证方式

```bash
./scripts/validate-skills.sh
```

也可以逐个运行：

```bash
python3 /path/to/quick_validate.py skills/hyperframes-teaching-video
python3 /path/to/quick_validate.py skills/web-video-presentation
python3 /path/to/quick_validate.py skills/ai-industry-video-script
python3 /path/to/quick_validate.py skills/if-you-become-x-voiceover
```
