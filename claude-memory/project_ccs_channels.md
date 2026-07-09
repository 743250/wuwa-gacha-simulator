---
name: ccs 反代与渠道管理总纲
description: ccs(Claude Code Switcher)通过 install.sh 管理 8 个渠道,两个反代(thinking-proxy 43543 / xunfei_oai-proxy 43545)承载对话,鉴权契约 KEY_<NAME>↔ACTIVE_CCS_KEY 大小写必须一致,503 反代层重试,讯飞 thinking 协议有偏差
type: project
originSessionId: 90e417ad-57c1-4e46-a2a4-959d2875d298
---
## ccs(Claude Code Switcher)

管理 Claude Code 多渠道启动。入口脚本 `/data/data/com.termux/files/home/install.sh`(31KB,2026-07-05 最新)。

- 渠道配置:`~/.ccs/channels/<channel>.conf` + `~/.ccs/channels/<channel>.keys`
- `.ccs` 实体目录在 proot `/root/.ccs`,termux 侧 `AI code工作区/.ccs` 软链过去
- 切换渠道:用户在 CC 内 `/channel <name>`,或 ccs 命令行

### install.sh helper 契约(禁手搓)

加新渠道**必须复用** helper:`write_channel_conf` / `set_stored_ccs_channel_key` / `ensure_ccs_channel_key_store`,**禁 heredoc 手写** .conf/.keys。

跳过 helper 手搓会踩坑:`KEY_<NAME>`(大写)和 `ACTIVE_CCS_KEY=<name>`(小写)对不上,`get_stored_ccs_channel_key` 的 `grep "^KEY_${name}="` 找不到 key,渠道应用时报"没有可用 key"。helper 会自动处理大小写、权限(.keys 文件 600)、回填 ACTIVE_CCS_KEY。

加新渠道步骤:
1. 先 grep 同类渠道(如 cline)的 seed 模式,照搬它的写法
2. 写 key 用 `set_stored_ccs_channel_key "$channel" "$name" "$value"`
3. 写 conf 用 `write_channel_conf`
4. 关键变量名(`KEY_<NAME>` 和 `ACTIVE_CCS_KEY=<NAME>`)的大小写必须一致

## 渠道列表(9 个,proot /root/.ccs/channels/ 实测 2026-07-06)

| 渠道 | 类型 | 状态 |
|---|---|---|
| `any` | 通用 | active |
| `ark_volcengine` | 直连(火山方舟) | active |
| `cline` | 代理(cline 中转) | active |
| `deepseek` | 直连 | keys 空,未配 |
| `free` | 免费渠道 | active |
| `glm_official` | 直连(智谱) | keys 空,未配 |
| `opencode` | 代理 | active |
| `xunfei` | 讯飞 anthropic 端点 | active,走 thinking-proxy 43543 |
| `xunfei_oai` | 讯飞 OpenAI 端点 | active,走 xunfei_oai-proxy 43545 |

## 反代/代理服务

整体链路:CC → ccs 选渠道 → 走反代(若该渠道需要) → 上游 API。

| 端口 | 服务 | 用途 | 危险点 |
|---|---|---|---|
| 43543 | thinking-proxy | CC 对话承载通道 + 503 重试层 | **绝不能 pkill**——kill=断当前对话 |
| 43545 | xunfei_oai-proxy | 讯飞 OpenAI 协议转换(Anthropic↔OpenAI),`reasoning_content`→`thinking_delta` | 同上,daemon 类都不能 pkill |

### pkill 禁忌(两次断对话的教训)

thinking-proxy(43543)是 CC 对话的承载通道。pkill 这个进程 = 杀掉当前对话。

- 改 `thinking-proxy.mjs` 后要让改动生效,只能两条路:1) 让用户主动重启 CC/ccs;2) 用另一个端口(如 43544)起测试实例,不动 43543
- 绝对禁止 `pkill -f thinking-proxy.mjs` 或 `kill <43543 的 PID>` 来"重启"——即使本意是加载新代码,代价是对话中断
- 测试新代码用 `THINKING_PROXY_PORT=43544` + 独立日志路径起并行实例,验证通过后再让用户切换
- 用户问"什么时候能生效"时,如实告诉对方"需要重启 CC/ccs,会断当前对话",让用户决定时机,不要自作主张杀进程

### 改运行中服务脚本的通用规则

修改运行中的服务脚本(thinking-proxy / xunfei_oai-proxy / 任何 daemon)时,**禁止 pkill 老进程再重启**。一旦新脚本有语法错误或逻辑 bug,用户 Claude Code 会直接断联,无法继续修复。

正确做法:
1. 修改前先用 `node --check`(或对应语言的语法检查)验证新脚本语法正确
2. 启动新进程后,先 curl 自测一次(打本地端口验证转发 OK),确认无误后再杀老进程
3. 更稳的做法:新版本起一个临时端口,验证 OK 再把配置切过去
4. 永远假设新脚本可能跑不起来——留老进程作为兜底,直到新版本确认可用

## 鉴权契约

### KEY_<NAME> ↔ ACTIVE_CCS_KEY 大小写

`KEY_<NAME>` 大写 ↔ `ACTIVE_CCS_KEY=<NAME>` 大小写必须一致(helper 自动处理,手搓会踩坑)。

### 鉴权冲突要查两层

告警 `Both ANTHROPIC_AUTH_TOKEN and ANTHROPIC_API_KEY set` 必须查**两层**:
1. settings.json 文件层
2. claude 进程实际继承的 OS env 层(`echo $ANTHROPIC_API_KEY` / `$ANTHROPIC_AUTH_TOKEN`)

install.sh `start_claude_code` 的 `env -u` 清理必须**成对**:proxy 渠道清 API_KEY,direct 渠道清 AUTH_TOKEN。

排查时只验证 settings.json 文件层是不够的——shell 里残留的 ANTHROPIC_API_KEY 在进程 env 层和 settings.json 的 AUTH_TOKEN 并存,告警仍在。交互式 TUI 无法在本会话最终肉眼确认时,要诚实说明并请用户实跑确认,不要凭文件层验证就断言"修好了"。

## 503 重试策略(讯飞上游繁忙)

讯飞 maas-coding-api 端点返回 503 / code 10310 "The system is busy, please try again later" 时,**就是上游繁忙,反代层一直重试到成功为止**。

- 不要直连验证(直连是浪费时间,质疑自己代码)
- 不要把 503 透传给 CC 让 CC 重试(反代层把 503 吃掉,CC 看到的应该是最终成功响应)
- 字段位置错误返回的是 400 不是 503,所以 503 永远不是字段问题

### thinking-proxy 重试实现

改 `~/.ccs/thinking-proxy/thinking-proxy.mjs`,加 `fetchWithRetry` 函数包裹 fetch 调用:
- 检测 429/503/529 状态码,自动重试上游
- 退避:500ms 起步 ×1.5 递增,上限 2s,±100ms 抖动
- 最多 10 次(约 10s 总等待)
- claude 完全感知不到 503,只收到代理返回的最终 200

env 配置(`~/.ccs/channels/xunfei.keys` 或环境变量):
- `THINKING_PROXY_RETRY_MAX=10`
- `THINKING_PROXY_RETRY_BASE_MS=500`
- `THINKING_PROXY_RETRY_CAP_MS=2000`

改 thinking-proxy.mjs 后必须重启代理进程(但**不能 pkill**,见上文 pkill 禁忌)。验证:代理日志 `~/.ccs/thinking-proxy/thinking-proxy.log` 启动行带 `retry_max=10` 说明新代码加载,触发 503 时日志会出现 `upstream 503, retry N/10 in Xms`。

### 历史 monkey-patch(已弃用)

`~/.claude/retry-patch.js` + `NODE_OPTIONS=--require=...` + `CLAUDE_CODE_MAX_RETRIES=15` —— monkey-patch cli.js 退避公式,已停用但仍生效(settings.json 里还在)。如果以后想关掉,删 settings.json env 里的 `NODE_OPTIONS` 行即可。`~/.claude/retry-patch.log` 是旧 patch 的诊断日志,可删。

## 讯飞 thinking 协议偏差(2026-07-05 实测)

讯飞 maas-coding-api 两个端点的思维链行为差异:

| 端点 | URL | 大 input_tokens 时 thinking block |
|---|---|---|
| anthropic | `/anthropic/v1/messages` | **稳定不返回**(input_tokens > ~1000 就不返回) |
| OpenAI | `/v2/chat/completions` | **有时返回** reasoning_content(随机) |

这是讯飞两个端点的行为差异,不是 proxy 的问题。

### thinking-proxy injectThinking 修复(2026-07-05)

1. **判断逻辑**:`if (!j.thinking)` 改成 `if (!(j.thinking && j.thinking.type === 'enabled'))` —— "值不是 enabled 就覆盖",处理 adaptive/disabled/null 全部情况
2. **fetchWithRetry 503 重试**:见上文
3. **dump 逻辑**:bodyLen>10000 时 dump 到 cc-req.json 供调试
4. 备份在 `~/.ccs/thinking-proxy/thinking-proxy.mjs.bak.20260705-141551`

简化请求体(input_tokens<200)经 thinking-proxy 全部返回 thinking block ✓。proxy 层修复有效。但 CC 真实请求体(input_tokens=26295)经 thinking-proxy 不返回 thinking block ✗(上游限制,绕不过)。

### 讯飞 OpenAI 端点 thinking 配置

```json
{
  "model": "xopglm52",
  "messages": [...],
  "enable_thinking": true,
  "thinking": {"type": "enabled", "budget_tokens": 64000}
}
```

- `enable_thinking` 和 `thinking` 都必须放**请求体顶层**,不能嵌在 `options` 里
- 字段名是 snake_case 的 `budget_tokens`,不是 camelCase 的 `budgetTokens`
- `budget_tokens: 64000` 是验证过能用的值
- 返回思维链走 `message.reasoning_content` 字段(流式 SSE 里是 `delta.reasoning_content`)
- `usage.completion_tokens_details.reasoning_tokens` 会非零(实测 998)

### 解决方案现状

**方案 A(推荐)**:把 xunfei.conf BASE_URL 从 43543(thinking-proxy)改成 43545(xunfei_oai-proxy),讯飞 anthropic 渠道走 xunfei_oai-proxy 做协议转换(Anthropic→OpenAI),讯飞 OpenAI 端点有时返回 reasoning_content,xunfei_oai-proxy 转成 thinking_delta。缺点:两个渠道一样了;cache_control 会被丢弃(xunfei_oai-proxy 把 system 数组转成字符串)。

**方案 C:接受现状**:CC 用讯飞 anthropic 渠道时不显示思维链,thinking-proxy 已修复到极限。

### 排查讯飞 thinking 问题

- 先 curl 直打上游验证返回,再看 proxy 注入
- thinking-proxy 进程不自动启动,需 `nohup node ~/.ccs/thinking-proxy/thinking-proxy.mjs >> ~/.ccs/thinking-proxy/thinking-proxy.log 2>&1 &` 手动起(但**不能 pkill** 老进程)
- 验证 proxy 跑着:log 启动行带 `retry_max=10`,ps 有 thinking-proxy 进程
- 切讯飞 anthropic 渠道实测思维链显示,需用户 `/channel xunfei` 切换交互验证(claude --print 不显示思维链)
- 讯飞 OpenAI 端点的 reasoning_content 返回是**随机的**,xunfei_oai-proxy 的 StreamConverter 逻辑(`delta.reasoning_content → thinking_delta`)在 reasoning_content 出现时能正确转换

### xunfei_oai-proxy effort 透传(2026-07-05 加)

xunfei_oai-proxy 第 194-196 行原本**无条件覆盖** `budget_tokens: BUDGET`(keys.THINKING_BUDGET),CC 发的 thinking 全被截胡。改成:proxy 主动读 `~/.claude/settings.json` 的 `effortLevel`,按映射表转 budget_tokens:

| effortLevel | budget_tokens |
|---|---|
| low | 1024 |
| medium | 2048 |
| high | 4096 |
| xhigh | 8192 |
| max | 16000 |

- CC 不发 effort 给 API(effort 是 UI/telemetry 概念,cli.js grep 找不到 effort→budget 映射,请求体只有 `thinking:{type:enabled,budget_tokens:Jz7}` 或 `adaptive`)
- 讯飞也不认 effort 字段,只认 `enable_thinking + thinking.budget_tokens`——所以 proxy 主动读 settings.json
- 改 `/effort high` → proxy 下次请求读到新 effortLevel → budget 立即生效,不用动 keys+重启 proxy
- `readEffortBudget()` 带 mtime 缓存(文件没变就用缓存,不重复读)
- keys.THINKING_BUDGET 现在是 **fallback**(settings.json 没 effortLevel 或映射失败时才用)
- 启动 log 带 `effort_budget=...` 显示当前映射值
- 调 thinking budget 用 `/effort <level>` 或改 settings.json effortLevel,keys.THINKING_BUDGET 不用动(仅 fallback)
- 历史值参考:64000(最初偏大)、16000(仍偏大反噬)、2048(小可用)、8192(xhigh 映射当前默认)
