# claude-memory 迁移说明

本目录是手机 termux+proot 环境下 Claude Code 的 auto-memory 快照,迁移到 PC 时由对应 Claude 放到正确位置后即可删除本目录。

## 放到哪

把本目录下**所有 `*.md`(除本 README)**复制到 PC 上 Claude Code 的 memory 目录:

- 路径形如 `~/.claude/projects/<项目签名目录>/memory/`(具体项目签名目录以 PC 上 `~/.claude/projects/` 中对应本工作区的目录为准)
- 该目录下若已存在同名 `MEMORY.md`,**用本目录的覆盖**(本目录是最新版)
- 其余 `*.md` 是记忆正文,直接铺到该 memory 目录根

## CLAUDE.md

各项目的 `CLAUDE.md` 已随对应仓库 git 克隆带到 PC,无需从本目录迁移。本工作区根的 `CLAUDE.md` 在手机端是软链且目标文件不存在,PC 上不需要重建。

## 迁移完成后

确认 PC 上 Claude 能读到记忆(首次会话可问"你有 auto-memory 吗")后,删除本 `claude-memory/` 目录即可。