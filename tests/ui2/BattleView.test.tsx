// @vitest-environment happy-dom

import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { h, render } from 'preact';
import { BattleView } from '../../src/ui2/panels/battle/BattleView';
import {
  currentBattleSignal, battleVisibleSignal, battleToastSignal,
  battleVersionSignal, pendingDungeonSignal, bumpBattleVersion,
} from '../../src/ui2/panels/battle/battleSignals';

let container: HTMLDivElement | null = null;

function mount(node: any): HTMLDivElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  render(node, container);
  return container;
}

afterEach(() => {
  if (container) {
    render(null, container);
    container.remove();
    container = null;
  }
  // Reset signals
  battleVisibleSignal.value = false;
  currentBattleSignal.value = null;
  pendingDungeonSignal.value = null;
  battleToastSignal.value = [];
  battleVersionSignal.value = 0;
});

// Minimal unit mock for canAttack/canSkill/canHeavy/canBurst
// These are imported from combat.js and need battle objects with correct structure
function makeBattle(opts: any = {}) {
  const team = opts.team || [
    { name: '漂泊者', displayName: '漂泊者', element: '湮灭', type: '湮灭', alive: true, hp: 1000, hpMax: 1000, energy: 100, energyMax: 100, cd: { skill: 0, heavy: 0 }, skillLockedTurns: 0, frozenTurns: 0, concerto: 50, dodge: 0.3, hasHeavy: false, idx: 0, _wallLocked: 0, buffs: [], debuffs: [], weaponStacks: {}, forte: null, weapon: null },
    { name: '秧秧', displayName: '秧秧', element: '气动', type: '气动', alive: true, hp: 800, hpMax: 800, energy: 50, energyMax: 100, cd: { skill: 0, heavy: 0 }, skillLockedTurns: 0, frozenTurns: 0, concerto: 30, dodge: 0, hasHeavy: false, idx: 1, _wallLocked: 0, buffs: [], debuffs: [], weaponStacks: {}, forte: null, weapon: null },
  ];
  const enemies = opts.enemies || [
    { name: '残星会刺客', displayName: '残星会刺客', element: '湮灭', class: '精英', alive: true, hp: 2000, hpMax: 2000, vibration: 100, vibrationMax: 100, suppressed: 0, suppressedVuln: 0.3, shield: 0, buffs: [], debuffs: [], marks: {}, _debrisReady: false, _deflectActive: false, _bubbleHp: 0, _overclockTurns: 0, _laserCharging: false, _saws: [], _delayedBlast: null, cartethyiaErosion: 0, phase: 1, _wallLocked: 0, mechanic: null },
  ];
  return {
    turn: opts.turn ?? 1,
    ap: 4,
    apMax: 4,
    active: 0,
    targetIdx: 0,
    finished: opts.finished || false,
    result: opts.result || null,
    team,
    enemies,
    log: opts.log || [
      { type: 'system', msg: '回合 1' },
      { type: 'attack', src: '漂泊者', action: '普攻', tgt: '残星会刺客', dmg: 320, crit: true },
    ],
    summons: opts.summons || [],
    switchUsedThisTurn: opts.switchUsedThisTurn || false,
    _abyssFloor: null,
  };
}

describe('BattleView', () => {
  it('renders nothing when battle is not visible', () => {
    battleVisibleSignal.value = false;
    currentBattleSignal.value = null;
    bumpBattleVersion();
    const el = mount(<BattleView />);
    expect(el.innerHTML).toBe('');
    expect(el.textContent).toBe('');
  });

  it('renders enemies and team when battle is active', () => {
    const b = makeBattle();
    currentBattleSignal.value = b;
    battleVisibleSignal.value = true;
    pendingDungeonSignal.value = { kind: 'dungeon', d: { name: '模拟战训·共鸣经验' } };
    bumpBattleVersion();

    const el = mount(<BattleView />);
    // Header with title
    expect(el.textContent).toContain('模拟战训·共鸣经验');
    // Turn info
    expect(el.textContent).toContain('回合 1');
    expect(el.textContent).toContain('AP 4/4');
    // Enemy name
    expect(el.textContent).toContain('残星会刺客');
    // Team name
    expect(el.textContent).toContain('漂泊者');
    expect(el.textContent).toContain('秧秧');
  });

  it('renders action bar buttons during battle', () => {
    const b = makeBattle();
    // Make sure current char has energy for burst
    b.team[0].energy = 100;
    currentBattleSignal.value = b;
    battleVisibleSignal.value = true;
    pendingDungeonSignal.value = { kind: 'dungeon', d: { name: '战斗' } };
    bumpBattleVersion();

    const el = mount(<BattleView />);
    const buttons = el.querySelectorAll('.bbtn');
    // At least 3 action buttons (普攻, 技能, 解放 for non-heavy chars)
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    expect(el.innerHTML).toContain('普攻');
    expect(el.innerHTML).toContain('技能');
    expect(el.innerHTML).toContain('解放');
    // Should NOT contain 重击 (no hasHeavy)
    expect(el.innerHTML).not.toContain('💢 重击');
    // End turn button
    expect(el.textContent).toContain('结 束 回 合');
  });

  it('shows victory state with settle button', () => {
    const b = makeBattle({ finished: true, result: 'win', turn: 5 });
    currentBattleSignal.value = b;
    battleVisibleSignal.value = true;
    bumpBattleVersion();

    const el = mount(<BattleView />);
    expect(el.textContent).toContain('胜 利');
    expect(el.textContent).toContain('5 回合');
    const settleBtn = el.querySelector('button');
    expect(settleBtn?.textContent).toContain('领 取 奖 励');
  });

  it('shows defeat state with close button', () => {
    const b = makeBattle({ finished: true, result: 'lose', turn: 3 });
    currentBattleSignal.value = b;
    battleVisibleSignal.value = true;
    bumpBattleVersion();

    const el = mount(<BattleView />);
    expect(el.textContent).toContain('战 斗 失 败');
    const closeBtn = el.querySelector('button');
    expect(closeBtn?.textContent).toContain('关 闭');
  });

  it('renders buff stripe with enemy badges', () => {
    const b = makeBattle();
    // Add a shield to make a badge appear
    b.enemies[0].shield = 500;
    currentBattleSignal.value = b;
    battleVisibleSignal.value = true;
    pendingDungeonSignal.value = { kind: 'dungeon', d: { name: '战斗' } };
    bumpBattleVersion();

    const el = mount(<BattleView />);
    // Should show the buff stripe
    const stripe = el.querySelector('.bf-buff-stripe');
    expect(stripe).not.toBeNull();
    if (stripe) {
      expect(stripe.textContent).toContain('护盾');
    }
  });

  it('renders enemy click-to-target interaction', () => {
    const b = makeBattle();
    currentBattleSignal.value = b;
    battleVisibleSignal.value = true;
    pendingDungeonSignal.value = { kind: 'dungeon', d: { name: '战斗' } };
    bumpBattleVersion();

    const el = mount(<BattleView />);
    // Enemy row should be clickable and show the target 🎯
    expect(el.textContent).toContain('🎯');
    expect(el.textContent).toContain('残星会刺客');
    // Enemy row receives onClick via Preact's virtual DOM — not serialized as HTML onclick attr
    // Verify there are clickable enemy divs with the target indicator
    const clickableEnemyDivs = el.querySelectorAll('[style*="cursor: pointer"]');
    expect(clickableEnemyDivs.length).toBeGreaterThanOrEqual(1);
  });

  it('responds to battleVersionSignal changes', async () => {
    const b = makeBattle();
    currentBattleSignal.value = b;
    battleVisibleSignal.value = true;
    pendingDungeonSignal.value = { kind: 'dungeon', d: { name: '战斗' } };
    bumpBattleVersion();

    const el = mount(<BattleView />);
    expect(el.textContent).toContain('回合 1');

    // Mutate the battle object and bump version
    b.turn = 3;
    bumpBattleVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));

    // The component should reflect the new turn (reads battleVersionSignal.value)
    // Since we re-render the component, the displayed value uses battle.turn directly
    const el2 = mount(<BattleView />);
    // Since Preact reuses the container, we check text content
    const text = el.textContent || '';
    // The component reads battle.turn directly (not a signal), so the text shows the new value
    expect(text).toContain('回合 3');
  });
});
