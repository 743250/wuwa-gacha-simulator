// Preact 已接管 #paneDungeon,这里只保留 tab 状态 + export 纯函数 + 空 export
//
// 保持 WEEKLY_BOSS 合入 DUNGEONS 的副作用(其他模块依赖此行为)
import { DUNGEONS, WEEKLY_BOSS, setSol3Level } from '../battle/dungeon.js';
import { bumpStateVersion } from '../ui2/signals.ts';
import './battle.js';

WEEKLY_BOSS.forEach(b => {
  if (!DUNGEONS.find(x => x.id === b.id)) DUNGEONS.push(b);
});

// Tab 状态由本 shim 持有,Preact 组件通过 getDungeonTab 读取
let _dungeonTab = 'exp';

export function setDungeonTab(key) { _dungeonTab = key; }
export function getDungeonTab() { return _dungeonTab; }

export function renderDungeon() {}  // Preact 接管,no-op

// Action handler — 改了 tab 或 sol3 后全量重渲染(含 bumpStateVersion)
export function dungeonSwitchTab(key) {
  _dungeonTab = key;
  bumpStateVersion();
}

export function setSol3(lv) {
  setSol3Level(lv);
  bumpStateVersion();
}
