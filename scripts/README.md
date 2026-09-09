# 脚本

这里的文件**不进网页运行时**。网页从 `src/` 走。

## 日常

| 命令 / 文件 | 做什么 |
|---|---|
| `npm run dev` / `build` / `test` | 见根目录 `package.json` |
| `scripts/build-single-html.mjs` | 打单文件 HTML（`npm run build:single`） |
| `scripts/push.mjs` | 打包单文件并推送（`npm run push`） |
| `scripts/build-character-lore.cjs` | 从 encore 拉故事/语音 → `src/data/character-lore.json` |
| `scripts/preview-char.mjs` | 预览单个角色技能/链文案 |
| `scripts/run-lint-strict.mjs` | 严格文案/边界 lint |
| `scripts/e2e.sh` | 浏览器冒烟 |
| `scripts/smoke-combat.mjs` | 战斗冒烟（纯抽卡线可忽略） |
| `scripts/check-balance.mjs` | 战斗数值体检 |

## 抓资料

| 文件 | 做什么 |
|---|---|
| `headless/` | 无头 Chrome 过灰机 wiki Cloudflare，见 [headless/README.md](headless/README.md) |
| `fetch-wiki-skill-mults.mjs` | B 站 wiki 技能倍率，缓存目录已 gitignore |
| `fetch-enemies.mjs` | encore 敌人快照 |
| `ww-gallery.mjs` | 画廊图 |
| `split-encore-data.py` | 拆 encore 汇总 JSON |

## 一次性

`oneoff/` 里是历史批处理（例如角色设计文档用词替换）。默认不要跑；要跑先读文件头。路径已改成相对仓库根，不再写死本机绝对路径。
