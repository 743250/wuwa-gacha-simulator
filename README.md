# 鸣潮 · 唤取模拟器

基于 Vite + ES Modules 的鸣潮主题抽卡、养成和 AP 回合制战斗模拟器。
它不是官方战斗复刻，战斗、敌人和共鸣链效果是项目自定义的简化模拟。

## 文档入口

- `AGENTS.md`：协作纪律和高风险边界。
- `SPEC.md`：项目蓝图。
- `log.md`：工程决策与历史记录。
- `CLAUDE.md`：代码地图、设计文档优先级和角色实现规则。
- `docs/plans/`：设计方案和验收标准。

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
