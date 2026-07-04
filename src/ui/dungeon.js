// Preact 已接管 #paneDungeon,这里只保留 tab 状态 + action handler 注册 + 空 export
//
// 保持 WEEKLY_BOSS 合入 DUNGEONS 的副作用(其他模块依赖此行为)
import { DUNGEONS, WEEKLY_BOSS, setSol3Level } from '../battle/dungeon.js';
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
window.__dungeonSwitchTab = (key) => {
  _dungeonTab = key;
  window.__render();
};

window.__setSol3 = (lv) => {
  setSol3Level(lv);
  window.__render();
};
