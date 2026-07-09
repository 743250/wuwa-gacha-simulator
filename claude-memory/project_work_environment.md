---
name: 工作环境总纲
description: termux + proot ubuntu 双环境,跨环境符号链接共享 .claude/工作区/ccs 配置,shell 入口决定 cwd,符号链接断裂是"改不掉"根因
type: project
originSessionId: 90e417ad-57c1-4e46-a2a4-959d2875d298
---
设备:Android 14,arm64,小米内核 6.1.138-android14-11-g965475777129-mi

## 双运行环境

| 环境 | 根目录 | 用途 |
|---|---|---|
| termux 原生 | `/data/data/com.termux/files/home` | 跑 termux 包、SillyTavern、install.sh |
| proot ubuntu rootfs | `/data/data/com.termux/files/usr/var/lib/proot-distro/installed-rootfs/ubuntu/root`(proot 内即 `/root`) | 跑 node/npm/ccs/claude code 主力开发 |

两个环境通过 `proot-distro login ubuntu` 互通。

## 跨环境符号链接(关键)

proot `/root` 下的这些条目是符号链接,指向 termux home,实现配置共享:
- `.claude` → termux `home/.claude` —— 共享 settings.json 和 memory
- `AI code工作区` → termux `home/AI code工作区` —— 项目仓库共享
- `CLAUDE.md` / `AGENTS.md` → termux `home/AI code工作区/` —— 全局指令共享
- `.bashrc` / `.bash_history` → termux `home/AI code工作区/` —— shell 历史共享

例外:`.ccs` 在 proot `/root` 下是**实体目录**(ccs 配置实际存这里),termux `AI code工作区/.ccs` 软链到它。

## Shell & cwd

- Shell:bash
- Claude Code 通过 ccs 启动,本会话当前模型 `xopglm52`(讯飞渠道)
- **primary cwd 由启动 shell 的 cwd 决定**,settings.json 的 `additionalDirectories` 只控制文件访问权不控制 cwd
- 改 cwd 要在 shell rc 里加 `cd`,用 `if [[ "$-" == *i* ]]` 守卫避免干扰 non-interactive(如 install.sh 的 `proot-distro login -- bash -lc "cd '$workdir' && exec $*"`)
- 改 settings.json 解决不了 cwd 问题

### 符号链接断裂是"改不掉"根因

proot `/root/.bashrc` 是符号链接指向 `AI code工作区/.bashrc`,但目标文件被改名成 `.bashrc.bak` 时链接就断了,proot shell 启动时 `test -f ~/.bashrc` 对断链接返回 false,跳过 source,所以里面任何 cd 配置都没加载。用户多次说"改过改不掉",根因正是这个。

排查方法:用户说"工作区改到 X"时,先查启动 shell 的 rc 文件链路(`ls -la ~/.bashrc ~/.bash_profile`),确认链接没断、文件被 source。

## 工作区项目(切换工作区后看对应 CLAUDE.md 即懂,不在此详述)

termux `home/`:
- `AI code工作区/` —— 主项目仓(wuwa-gacha-simulator / buriedtown_mod / dol_mod / 流浪日记mod 等)
- `SillyTavern/` —— 酒馆前端
- `clewdr/` —— clewd 反代
- `install.sh` —— ccs 安装/渠道管理脚本

proot `/root/`(散落辅助数据/脚本):
- `char-data/` `char-data-all/` `char-data-full/` —— 角色数据
- `gen_char_docs*.py` —— 角色文档生成脚本
- `echo_data.json` —— 声骸数据(427KB)
- `both.json` `bt.json` `et.json` `direct_tool.json` —— 讯飞调试残留
