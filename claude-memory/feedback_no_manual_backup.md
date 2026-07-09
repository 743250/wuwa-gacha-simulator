---
name: 不手动备份 settings/conf/keys
description: 改 ccs 的 settings.json/conf/keys/install.sh 等文件时不要 cp .bak/.backup,出错靠 git/memory 回滚;用户厌烦积压备份
type: feedback
originSessionId: 711b4f68-7eb3-4d28-9f21-19c180bdaec4
---
改 `~/.ccs/` 下任何文件(settings.json / *.conf / *.keys / config.yaml)、`~/install.sh`、反代脚本等,**不要手动 `cp` 出 `.bak` / `.backup` / `.bak.before_xxx` / `.backup.before_xxx`**。

**Why:** 用户 2026-07-08 反馈:`~/.ccs/` 里看到十几二十个 `.bak.before_replace_xxx` / `.backup.before_model_fix_xxx` / `.bak.<timestamp>` 这种积压备份,每隔一段时间要手动清,很烦。这些备份都是历史会话(Claude/codex)改文件前 `cp` 留下的,ccs/install.sh 本身不会在切渠道时主动写这种命名。用户已经确认以后不要这种备份。

**How to apply:**
- 改文件前**不备份**,直接 Edit/Write。
- 出错回滚靠:git(如果有仓库)、memory 里记的旧值、或用户记忆。ccs 渠道文件都是可重建的(keys 能重新生成、conf 能从 install.sh 重建、settings.json 能 ccs apply 重写)。
- 极少数确实需要回滚保险的场景(比如大改 install.sh 逻辑、删关键函数),可以临时备份一份到 `/tmp/`(不是 `~/.ccs/` 或 `~/`),改完确认 OK 立刻删。绝不留在 `~/.ccs/` / `~/` 积压。
- ccs 自己写的 `.bak`(settings.json 损坏时,见 droid-config-manager.js:320)和 `.pre-v16-...bak`(cliproxy 升级时)是 ccs 内部行为,不是我们手动加的,不用管。
