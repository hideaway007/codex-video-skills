# Codex Video Skills

一组面向中文 HyperFrames 视频和网页视频演示生产的 Codex skills。

这个仓库是从本地生产环境整理出的 clean snapshot：只包含可复用的 skill、参考文档、脚手架模板和安装/校验脚本，不包含视频成片、账号草稿、浏览器缓存、本地日志或私有运行记录。

## Skills

| Skill | 用途 |
|---|---|
| `hyperframes-teaching-video` | 用 HyperFrames 制作中文通用视频，支持 Doubao / Edge TTS、字幕、动画、封面和发布草稿准备 |
| `web-video-presentation` | 把文章、口播稿或漫画 panels 做成可录屏的 16:9 网页视频演示 |

## Install

安装全部 skills 到当前用户的 Codex skills 目录：

```bash
./scripts/install.sh
```

安装到自定义目录：

```bash
CODEX_SKILLS_DIR="$HOME/.codex/skills" ./scripts/install.sh
```

只想手动安装时，也可以把某个目录复制到 `~/.codex/skills/`：

```bash
cp -R skills/hyperframes-teaching-video "$HOME/.codex/skills/"
```

## Validate

如果本机有 Codex 的 `skill-creator` validator：

```bash
./scripts/validate-skills.sh
```

脚本会优先使用 `CODEX_SKILL_VALIDATOR`，其次尝试常见的本地 validator 路径。

## Layout

```text
skills/
  hyperframes-teaching-video/
  web-video-presentation/
archive/
docs/
  skill-inventory.md
scripts/
  install.sh
  validate-skills.sh
```

## Notes

- Skills 内部只保留 agent 使用时需要的 `SKILL.md`、`agents/`、`references/`、`scripts/`、`templates/` 和 `themes/` 等资源。
- 发布前已移除本地绝对路径和 `.DS_Store`。
- 这些 skills 主要服务中文内容生产；代码标识、API 名称和必要英文术语保持英文。

## License

MIT
