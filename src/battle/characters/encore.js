// 安可「失序值 / 黑咩大暴走」状态机
//
// 原版思路：安可不是单纯解放 AOE，而是「失序值满 → 特殊重击」+「解放进入黑咩强化形态」。
// 模拟器抽象：
//   · 失序值 0-100：普攻 +20 / 共鸣技能 +35 / 普通重击 +20 / 变奏 +30；黑咩窗口内命中额外 +10
//   · 失序值满时施放重击：消耗 100 失序值，改为白咩·失控之炎 / 黑咩·暴走之炎（按共鸣解放伤害结算）
//   · 共鸣解放·黑咩大暴走：进入黑咩窗口（释放当回合 + 后续 3 个完整我方回合），普攻/技能/重击强化

import { registerForm, enterForm, exitForm, hasForm } from '../forms.js';
import { registerSwitchHook } from '../switchHooks.js';

// 黑咩形态：进入时 displayName → 黑咩，carryOnSwitch=true 场地态
registerForm('encore_black', {
  enterName: '黑咩',
  carryOnSwitch: true,
  onEnter(unit, battle) {
    unit.encoreBlackTurns = 4;
  },
  onExit(unit, battle) {
    unit.encoreBlackTurns = 0;
  }
});

export function encoreGainDisorder(self, amount, source, battle) {
  if (self.name !== '安可') return;
  const extra = (self.encoreBlackTurns || 0) > 0 ? 10 : 0;
  const gain = amount + extra;
  const before = self.encoreDisorder || 0;
  self.encoreDisorder = Math.min(100, before + gain);
  if (self.forte?.resourceName === '失序值') {
    self.forte.current = self.encoreDisorder;
    self.forte.ready = self.encoreDisorder >= 100;
  }
  if (self.encoreDisorder > before) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `${source} → 失序值 ${self.encoreDisorder}/100${extra ? '（黑咩 +10）' : ''}`
    });
  }
}

// onAttack hook：普攻命中积失序（黑咩窗口内视为胡闹并额外 +10，由 gainDisorder 内部处理）
export function encoreOnAttack(self, ctx) {
  if (self.name !== '安可') return;
  const battle = ctx.battle;
  const source = (self.encoreBlackTurns || 0) > 0 ? '普攻·黑咩·胡闹' : '普攻·羊咩出击';
  encoreGainDisorder(self, 20, source, battle);
}

// 解放后进入黑咩形态
export function encoreStartBlackSheep(self, battle) {
  if (self.name !== '安可') return;
  enterForm(self, 'encore_black', battle);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: '黑咩大暴走 · 进入黑咩形态（后续 3 回合），普攻/技能/重击获得强化'
  });
}

// endTurn 清理
export function encoreTurnCleanup(self, ctx) {
  if (self.name !== '安可' || !hasForm(self, 'encore_black')) return;
  const battle = ctx.battle;
  self.encoreBlackTurns--;
  if (self.encoreBlackTurns <= 0) {
    exitForm(self, 'encore_black', battle);
    battle.log.push({ type: 'mechanic', src: self.name, msg: '黑咩大暴走结束 · 回到白咩形态' });
  }
}

// Step E：切人入场钩子（变奏·咩咩帮手 +30 失序）
registerSwitchHook('安可', ({ to, battle }) => encoreGainDisorder(to, 30, '变奏·咩咩帮手', battle));

export default {
  name: '安可',
  hasHeavy: true,
  gainDisorder: encoreGainDisorder,
  onAttack: encoreOnAttack,
  startBlackSheep: encoreStartBlackSheep,
  turnCleanup: encoreTurnCleanup
};
