// 副本 actions · Phase 5 从 src/ui/dungeon.js shim 迁入
// setSol3Level 已通过 commit() 自带 bump,dungeonSwitchTab 仍用 bump(纯 UI 切 tab)
// WEEKLY_BOSS 合入 DUNGEONS 的副作用已移至 src/battle/dungeon.js 的 initDungeonMerge(),
// 由 src/init.ts 调用,保持 battle 领域自包含,UI 层不掺合。
import { setSol3Level } from '../../../battle/dungeon.js';
import { bumpStateVersion } from '../../signals';

let _dungeonTab = 'exp';

export function setDungeonTab(key: string) { _dungeonTab = key; }
export function getDungeonTab() { return _dungeonTab; }

export function dungeonSwitchTab(key: string) {
  _dungeonTab = key;
  bumpStateVersion();
}

export function setSol3(lv: number) {
  setSol3Level(lv);
}
