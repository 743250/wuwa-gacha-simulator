# 无头浏览器抓图（灰机wiki 等 Cloudflare 站点）

2026-08-01 验证可行。curl 直连灰机 wiki（wuwa.huijiwiki.com）被 Cloudflare 人机挑战拦（HTTP 403/"Just a moment"），
但**无头 Chromium 模拟手机 UA 能过挑战**，且灰机图片 CDN `huiji-public.huijistatic.com` / `huiji-thumb.huijistatic.com`
**无防盗链、HTTP 200 直连**（模拟器可直接用原图 URL）。

## 环境（本机 Termux + proot Ubuntu）

- Playwright 在 Android 上直接拒绝（`Unsupported platform: android`），不可用。
- 方案：**Chromium 跑在 proot Ubuntu 里（glibc），CDP 客户端跑在 Termux（node 26 原生 WebSocket）**，
  两者共享 127.0.0.1，经 CDP 驱动。
- proot Ubuntu 真实 rootfs：`/data/data/com.termux/files/usr/var/lib/proot-distro/containers/ubuntu26/rootfs/`（不是 installed-rootfs/）。
- 当前环境不常驻 Playwright/Chromium；需要浏览器验证时按需在 Ubuntu 26 内安装，
  不把浏览器缓存当作项目资产提交。
  需要 proot 里 apt 装：`libatk1.0-0 libatk-bridge2.0-0 libxkbcommon0 libpango-1.0-0 libxdamage1 libatspi2.0-0`。
- 所有 node/npx 命令需 `env -u NODE_OPTIONS`（本会话 NODE_OPTIONS 指向缺失的 retry-patch.js，会崩）。

## 用法

### 1. 启动 chrome（proot，后台任务保活，每个实例一个端口）

```bash
proot-distro login ubuntu26 -- bash -lc '.../chrome --headless=new --no-sandbox --disable-gpu \
  --disable-blink-features=AutomationControlled --no-first-run --no-default-browser-check \
  --remote-debugging-port=9333 --user-data-dir=/root/pwscrape/profile \
  "https://wuwa.huijiwiki.com/index.php?title=夏空/画廊" 2>&1'
# 用 Bash 工具的 run_in_background=true 跑，避免 proot login 退出杀进程
```

### 2. 抓某页所有图片（cdp-fetch.mjs）

```bash
env -u NODE_OPTIONS node scripts/headless/cdp-fetch.mjs "角色名/画廊" 9333 2>/dev/null > out.json
# 输出 JSON 数组:{title,width,height,url,thumb},stdout 只有 JSON(日志走 stderr)
```

### 3. 渲染任意 URL 抽 DOM 图片（cdp-dom.mjs，库街区这种 SPA 用）

```bash
env -u NODE_OPTIONS node scripts/headless/cdp-dom.mjs "https://..." 9333
```

## 选图标准（角色卡池大图）

- 优先文件名含 **`唤取`**（官方卡池唤取图，3840×2160 横版）或 `壁纸-横`。
- 只要**角色本人**：文件名以角色名开头/含角色名。
- **避开**：`同人` `演唱会` `周年` `合影` `版本KV`（多人/联合图，容易串角色）。
- 直连原图 URL：`https://huiji-public.huijistatic.com/wuwa/uploads/<h1>/<h2>/<文件名>`（来自 JSON 的 `url` 字段）。

## 限制

- 库街区 wiki（wiki.kurobbs.com）item 内容**要 token**（localStorage `WIKI_USER_TOKEN`，需在 wiki.kurobbs.com 登录才有），
  匿名渲染只返回空壳。token 拿到前没法直接抓官方 wiki 图。
- 灰机 wiki 画廊图多为社区搬运官方图，按上面选图标准可保证是角色本人的官方卡池图。
