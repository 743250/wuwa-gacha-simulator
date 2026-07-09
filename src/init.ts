// 应用级初始化清单 · Phase 3
//
// 把过去靠 side-effect import 触发的初始化集中到显式函数,让启动流程可读、可测、可单测。
// 调用顺序:各 init 之间无依赖(都只往各自注册表 push 数据或 window 桥赋值),
// 但 initBattleUiBridge 必须在 Preact 战斗面板挂载前调,否则按钮 handler 的 _ctx 为 null。
import { initBattleResources } from './battle/resources/index';
import { initDungeonMerge } from './battle/dungeon.js';
import { initBattleUiBridge } from './ui/battle.js';
import { initExchange } from './exchange/coral.js';

let _initialized = false;

export function initApp(): void {
  if (_initialized) return;
  _initialized = true;
  initBattleResources();
  initDungeonMerge();
  initBattleUiBridge();
  initExchange();
}
