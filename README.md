# 鸣潮 · 唤取模拟器

基于 Vite + ES Modules 的鸣潮主题抽卡、养成和 AP 回合制战斗模拟器。
它不是官方战斗复刻，战斗、敌人和共鸣链效果是项目自定义的简化模拟。

根目录文档只留三份：本文件、`SPEC.md`（做成什么样）、`log.md`（为什么这么改）。找目录时看 **[docs/MAP.md](docs/MAP.md)**。

## 运行与验证

```bash
env -u NODE_OPTIONS npm install
env -u NODE_OPTIONS npm run dev
env -u NODE_OPTIONS npm run build
```

E2E/headless 工具必须在 Ubuntu 26 内运行；浏览器按需安装，不把浏览器缓存当
项目源码或发布资产。

## 重要边界

- 已实装角色的数值和设计决策不能擅自修改。
- 设计文档优先于官方资料和临时推测。
- 未提交改动属于活跃开发内容，清理前必须先确认。
