---
name: ccs proxy daemon 固定 authToken
description: @kaitranntt/ccs 的 proxy-daemon.js generateProxyAuthToken() 被改成固定返回 '193734760',所有 proxy 渠道(opencode/cline/free/xunfei_oai)共用这个 token,npm 重装会覆盖
type: project
originSessionId: 711b4f68-7eb3-4d28-9f21-19c180bdaec4
---
`@kaitranntt/ccs` 的 `dist/proxy/proxy-daemon.js:47-49` 原本 `crypto.randomBytes(24).toString('hex')` 生成随机 48 位 hex token,2026-07-08 改成固定返回 `'193734760'`。

**Why:** 用户要 CC→反代(43527 ccs proxy-daemon)这一段的 authToken 固定不变,不要再每次 apply 随机生成。用户指定的值是 `193734760`。所有 proxy 渠道共用,不再逐渠道区分。

**How to apply:**
- 生效时机:`ccs apply` / 重启 CC 时新 daemon 启动读这个函数返回值 → 写进 `~/.ccs/proxy/<channel>.session.json` 的 `authToken` 和 `.token` 文件。当前跑着的 daemon 还是旧随机 token,不重启不会变。
- 改动位置只一处(源码 generateProxyAuthToken),所有 proxy 渠道自动生效。
- **npm 重装 `@kaitranntt/ccs` 会覆盖这个改动**——重装后必须重新把 `crypto.randomBytes(24).toString('hex')` 改回 `'193734760'`。重装场景包括 `ccs` 升级、`npm i -g @kaitranntt/ccs` 等。
- 验证:apply 后 `cat ~/.ccs/proxy/opencode.session.json` 看 authToken 字段是否为 `193734760`。
- 链路三层(改 token 时不要搞混):
  1. CC→43527 ccs proxy-daemon:authToken = `193734760`(本改动控制)
  2. 43527→43540 opencode-keypool:无鉴权(keypool 不校验 incoming)
  3. 43540→上游 opencode.ai:轮换 `~/.ccs/channels/opencode.keys` 里 10 个 sk-xxx
