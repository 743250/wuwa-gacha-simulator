// 折枝「墨鹤召唤师」冷凝音感仪副C
//
// 创作者思路：折枝是鸣潮唯一纯召唤师，核心为墨鹤协同攻击
//   共鸣解放「虚实境趣」：展开墨鹤领域（3 回合），每回合自动召唤 1 只墨鹤协同攻击
//   共鸣技能「以形写神/神来之笔」：在领域内额外召唤 1 只墨鹤
//   墨鹤：召唤物，每只对主目标造成 40% atk 冷凝伤害（共鸣解放伤害类型）
//   2 链：气韵生动 — 墨鹤上限 +6 只（基础 3 → 9）
//   5 链：经营位置 — 每召唤 3 只墨鹤，额外召唤 1 只（140% 伤害）
//   6 链：传移摹写 — 技能额外召唤白鹤（120% 技能伤害）

const BASE_CRANE_CAP = 3;

export function zhezhiSummonField(self, battle) {
  if (self.name !== '折枝') return;
  self.zhezhiFieldTurns = 4; // 含当回合，实际持续 3 个敌方回合
  self.zhezhiCranes = 0;
  self.zhezhiCraneCap = BASE_CRANE_CAP + (self.zhezhiCraneCapBonus || 0); // 2 链 +6

  // 解放瞬间召唤 3 只墨鹤
  const initialCranes = 3;
  self.zhezhiCranes = Math.min(self.zhezhiCraneCap, initialCranes);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `虚实境趣 · 墨鹤领域展开（${self.zhezhiFieldTurns - 1} 回合）· 初始墨鹤 ×${self.zhezhiCranes}`
  });
}

// 每回合墨鹤协同攻击（在 endTurn 中调用）
export function zhezhiCraneAttack(self, battle) {
  if (self.name !== '折枝' || !self.zhezhiFieldTurns || self.zhezhiFieldTurns <= 0) return;
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (!aliveEnemies.length) return;

  const primary = aliveEnemies[0];
  const craneCount = self.zhezhiCranes || 0;
  if (craneCount <= 0) return;

  // 每只墨鹤独立攻击（40% atk 冷凝伤害，视为共鸣解放伤害）
  let totalDmg = 0;
  for (let i = 0; i < craneCount; i++) {
    const craneMult = 0.4;
    const baseDmg = self.atk * craneMult;
    // 简化的伤害计算（不暴击）
    const dmg = Math.max(30, Math.round(baseDmg - primary.def * 0.3));
    primary.hp = Math.max(0, primary.hp - dmg);
    if (primary.hp <= 0) primary.alive = false;
    totalDmg += dmg;
    if (!primary.alive) break;
  }

  battle.log.push({
    type: 'attack', src: self.name, tgt: primary.name, dmg: totalDmg,
    crit: false, action: `墨鹤协同 ×${craneCount}`
  });

  // 5 链：每召唤 3 只额外召唤 1 只
  if (self.zhezhiExtraCrane && craneCount >= 3) {
    const extraCount = Math.floor(craneCount / 3);
    for (let i = 0; i < extraCount; i++) {
      if (!primary.alive) break;
      const extraDmg = Math.max(30, Math.round(self.atk * 0.4 * 1.4 - primary.def * 0.3));
      primary.hp = Math.max(0, primary.hp - extraDmg);
      if (primary.hp <= 0) primary.alive = false;
      totalDmg += extraDmg;
    }
    battle.log.push({
      type: 'attack', src: self.name, tgt: primary.name, dmg: totalDmg,
      crit: false, action: `经营位置 · 额外墨鹤 ×${extraCount}`
    });
  }
}

// 技能命中时额外召唤墨鹤（在白鹤/墨鹤领域内）
export function zhezhiSkillSummon(self, battle) {
  if (self.name !== '折枝' || !self.zhezhiFieldTurns || self.zhezhiFieldTurns <= 0) return;
  const cap = self.zhezhiCraneCap || BASE_CRANE_CAP;
  self.zhezhiCranes = Math.min(cap, (self.zhezhiCranes || 0) + 1);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `神来之笔 → 墨鹤 +1（${self.zhezhiCranes}/${cap}）`
  });

  // 6 链：额外召唤白鹤（120% 技能伤害）
  if (self.zhezhiWhiteCrane) {
    const aliveEnemies = battle.enemies.filter(e => e.alive);
    if (aliveEnemies.length) {
      const target = aliveEnemies[0];
      const whiteDmg = Math.max(50, Math.round(self.atk * 1.2 - target.def * 0.4));
      target.hp = Math.max(0, target.hp - whiteDmg);
      if (target.hp <= 0) target.alive = false;
      battle.log.push({
        type: 'attack', src: self.name, tgt: target.name, dmg: whiteDmg,
        crit: false, action: '传移摹写 · 白鹤（6 链）'
      });
    }
  }
}

// 领域结束清理
export function zhezhiTurnCleanup(self, battle) {
  if (self.name !== '折枝') return;
  if (self.zhezhiFieldTurns > 0) {
    self.zhezhiFieldTurns--;
    if (self.zhezhiFieldTurns === 0) {
      self.zhezhiCranes = 0;
      battle.log.push({ type: 'mechanic', src: self.name, msg: '墨鹤领域消散' });
    }
  }
}

export default {
  name: '折枝',
  hasHeavy: false,
  summonField: zhezhiSummonField,
  craneAttack: zhezhiCraneAttack,
  skillSummon: zhezhiSkillSummon,
  turnCleanup: zhezhiTurnCleanup
};
