// 安可「失序值 / 黑咩大暴走」状态机
//
// 原版思路：安可不是单纯解放 AOE，而是「失序值满 → 特殊重击」+「解放进入黑咩强化形态」。
// 模拟器抽象：
//   · 失序值 0-100：普攻 +20 / 共鸣技能 +35 / 普通重击 +20 / 变奏 +30；黑咩窗口内命中额外 +10
//   · 失序值满时施放重击：消耗 100 失序值，改为白咩·失控之炎 / 黑咩·暴走之炎（按共鸣解放伤害结算）
//   · 共鸣解放·黑咩大暴走：进入黑咩窗口（释放当回合 + 后续 3 个完整我方回合），普攻/技能/重击强化

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

// 解放后进入黑咩形态
export function encoreStartBlackSheep(self, battle) {
  self.encoreBlackTurns = 4;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: '黑咩大暴走 · 进入黑咩形态（后续 3 回合），普攻/技能/重击获得强化'
  });
}

// endTurn 清理
export function encoreTurnCleanup(self, battle) {
  if (self.encoreBlackTurns > 0) {
    self.encoreBlackTurns--;
    if (self.encoreBlackTurns === 0) {
      battle.log.push({ type: 'mechanic', src: self.name, msg: '黑咩大暴走结束 · 回到白咩形态' });
    }
  }
}

export default {
  name: '安可',
  hasHeavy: true,
  gainDisorder: encoreGainDisorder,
  startBlackSheep: encoreStartBlackSheep,
  turnCleanup: encoreTurnCleanup
};
