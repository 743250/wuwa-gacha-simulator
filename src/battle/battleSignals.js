// 战斗 UI signals（.js 而非 .ts，使 src/ui/battle.js 等 .js shim 也能 import）
// 注意:本文件位于 src/battle/ 而非 src/ui/,落入 index chunk(默认)。
// 这样 src/ui/battle.js(index chunk)→ 本文件 是同 chunk 引用,打破 battle ↔ ui2 循环。
import { signal } from '@preact/signals';

export const battleVisibleSignal = signal(false);
export const battleVersionSignal = signal(0);
export const battleToastSignal = signal([]);

// currentBattle 是 mutable 对象,靠 battleVersionSignal 的 bump 驱动 Preact 重渲染
export const currentBattleSignal = signal(null);
export const pendingDungeonSignal = signal(null);

export function bumpBattleVersion() {
  battleVersionSignal.value++;
}

export function pushBattleToast(text) {
  battleToastSignal.value = [...battleToastSignal.value, text];
}
