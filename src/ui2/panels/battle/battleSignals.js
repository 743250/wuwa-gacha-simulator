// 战斗 UI signals（.js 而非 .ts，使 src/ui/battle.js shim 也能 import）
import { signal } from '@preact/signals';

export const battleVisibleSignal = signal(false);
export const battleVersionSignal = signal(0);
export const battleToastSignal = signal([]);

// currentBattle 是 mutable 对象，靠 battleVersionSignal 的 bump 驱动 Preact 重渲染
export const currentBattleSignal = signal(null);
export const pendingDungeonSignal = signal(null);

export function bumpBattleVersion() {
  battleVersionSignal.value++;
}

export function pushBattleToast(text) {
  battleToastSignal.value = [...battleToastSignal.value, text];
}
