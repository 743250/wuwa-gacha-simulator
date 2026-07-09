---
name: 项目索引
description: 4 个项目(buriedtown_mod/dol_mod/wuwa-gacha-simulator/流浪日记mod)的位置与熟悉入口
type: reference
originSessionId: 521e918b-6186-4fc9-8dae-80f3745fb6c6
---
# 项目索引

工作区根: `/data/data/com.termux/files/home/AI code工作区/`(termux 与 proot ubuntu 共享)

## buriedtown_mod(死亡日记 mod)
- 位置: `~/AI code工作区/buriedtown_mod`
- 性质: Cocos2d JS 旧游戏,边扩内容边做结构收口(不是重写)
- 熟悉入口: `CLAUDE.md`(协作说明 + §5 高风险入口清单 + §7 UI 改动规则) → `PLAN.md`(渐进式重构计划 + §3 当前阶段 + §4 关键清单) → `assets/src/jsList.js`(装配启动顺序,高风险边界)
- AGENTS.md 与 CLAUDE.md 同源异口径,**以 CLAUDE.md 为准**
- 当前阶段从 PLAN.md §3 实读(不依赖记忆):Phase 3 主线 3A-3F 已完成,3G(restore/migration 分层)为下一步主线
- 启动前 3G 必须先输出三张清单(restore 调用图、migration 规则、热路径副作用),清单未出不动代码

## dol_mod(Degrees of Lewdity mod 工作区)
- 位置: `~/AI code工作区/dol_mod`
- 性质: 已打包运行时 + 独立 mod 工作区,最终交付可手动导入的 zip
- 熟悉入口: `AGENTS.md`(项目边界 + 工作方式 + 已确认运行时信息)
- 关键边界: `assets/www/index.html` 是运行时参考区**不动**;新逻辑放 `mod_workspace/`
- 当前 mod: `mod_workspace/coffee_trait_mod`(咖啡特质)
- 稳定挂点: `:storyready` / `:passagedisplay` / `Macro.get(...)` / `window.statChange.*`

## wuwa-gacha-simulator(鸣潮唤取模拟器)
- 位置: `~/AI code工作区/wuwa-gacha-simulator`
- 性质: Vite + ES Modules 网页版抽卡/养成/战斗模拟器(非官方战斗复刻)
- 熟悉入口: `CLAUDE.md`(架构总览 + 核心玩法闭环) + `package.json`(scripts)
- 启动: `npm run dev` 或 `开始游戏.bat`(自动检测依赖)
- 架构入口: `index.html` ← `styles/main.css` ← `src/main.js`(事件绑定)

## 流浪日记mod
- 位置: `~/AI code工作区/流浪日记mod`
- 性质: 流浪日记 APK 解包 mod,Cocos Creator 导出,主逻辑 Browserify 打包在 `assets/src/project.js`(不是常规源码工程)
- 熟悉入口: `AGENTS.md`(标准工作流程 + §5 需求索引 + §6 字段约定)
- 工作流: 先在 `tests/cases.md` 写测试案例,再改实现;改 project.js 必做语法解析
- 关键文件: `assets/src/project.js`、`更新日志.md`、`tests/cases.md`、`tests/mod-tests.js`

## 跨项目共用资源
- APK 存放: `~/AI code工作区/死亡日记游戏版本存放/`(1.4.3 正式版 39M / 成就点版 / 旧版 / T版-41.β 35M)
- 死亡日记破解手记: `~/AI code工作区/死亡日记1破解手记.txt`(pvr.ccz UNTP 密钥 `B29B3886543224E471BDF6E39275C626`、SQLCipher 存档密钥 `1a2b3c4d5fberrytown`、NOP 位置 `libcocos2djs.so` E0EB68-E0EB6B)
