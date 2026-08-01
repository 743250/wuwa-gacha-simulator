// roleModal state signals — Stage 5.1
// This is a .js file so both .js shim and .tsx components can import it
// (playbook rule 10: .js shim must not import .ts).
import { signal } from '@preact/signals';

/** Whether the role modal is currently open */
export const roleModalOpenSignal = signal(false);

/** The role name displayed in the modal */
export const roleModalNameSignal = signal(null);

/** Current active tab ID: 'basic'|'weapon'|'echo'|'chain'|'skill'|'levelup'|'lore' */
export const roleModalTabSignal = signal('basic');

/** Preview mode (show 90/0-chain/no-weapon reference stats) */
export const roleModalPreviewSignal = signal(false);

/**
 * Per-role selected echo slot index, keyed by role name.
 * Mutated via signal.value = { ...signal.value, [roleName]: idx }.
 */
export const echoSelectedSlotSignal = signal({});

/**
 * Force re-render tick — bumped when a non-S UI state changes
 * (e.g. encore burst mode toggle, sub-modal overwriting #modalBox).
 */
export const roleModalRenderTick = signal(0);

/**
 * 安可共鸣解放形态：'white'（白咩）| 'black'（黑咩）。
 * 替代旧的 window.__encoreBurstMode 全局状态。
 */
export const encoreBurstModeSignal = signal('white');

/** 切换安可黑/白咩形态，并触发 roleModalRenderTick 兜底非 Preact 订阅方 */
export function toggleEncoreBurstMode() {
  encoreBurstModeSignal.value = encoreBurstModeSignal.value === 'black' ? 'white' : 'black';
  roleModalRenderTick.value = roleModalRenderTick.value + 1;
}

/** Element accent colors shared across tabs */
export const ELEMENT_COLORS = {
  '热熔': '#ff8c5e',
  '冷凝': '#7bd6ff',
  '导电': '#b58cff',
  '气动': '#8de6a6',
  '衍射': '#fff0b0',
  '湮灭': '#c39bff',
};

/** Tab definitions used by Shell */
export const TABS = [
  { id: 'basic',  icon: '🧍', label: '基本属性' },
  { id: 'weapon', icon: '⚔', label: '武器' },
  { id: 'echo',   icon: '💠', label: '声骸' },
  { id: 'chain',  icon: '🔗', label: '共鸣链' },
  { id: 'skill',  icon: '✦', label: '技能介绍' },
  { id: 'levelup',icon: '🎯', label: '突破升级' },
  { id: 'lore',    icon: '📖', label: '故事语音' },
];
