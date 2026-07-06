// 副本 actions · Phase 5 从 src/ui/dungeon.js shim 迁入
// 包含 WEEKLY_BOSS 合入 DUNGEONS 的副作用(其他模块依赖此行为)
import { DUNGEONS, WEEKLY_BOSS, setSol3Level } from '../../../battle/dungeon.js';
import { bumpStateVersion } from '../../signals';

// 副作用:WEEKLY_BOSS 合入 DUNGEONS(原 src/ui/dungeon.js 模块加载时执行)
WEEKLY_BOSS.forEach(b => {
  if (!DUNGEONS.find(x => x.id === b.id)) DUNGEONS.push(b);
});

let _dungeonTab = 'exp';

export function setDungeonTab(key: string) { _dungeonTab = key; }
export function getDungeonTab() { return _dungeonTab; }

export function dungeonSwitchTab(key: string) {
  _dungeonTab = key;
  bumpStateVersion();
}

export function setSol3(lv: number) {
  setSol3Level(lv);
  bumpStateVersion();
}
