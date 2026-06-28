// 折枝「墨鹤召唤师」冷凝音感仪副C
//
// 改造版核心：从"叠层 + 每回合自动结算"改造为真正的"召唤物"
//   共鸣解放「虚实境趣」：展开墨鹤领域（3 回合），释放瞬间召唤 6 只墨鹤
//   墨鹤追击（被动）：领域内己方角色每次攻击命中时，消耗 1 只墨鹤对主目标造成 atk × 35% 冷凝追击
//   共鸣技能「以形写神」：领域内技能命中 +1 墨鹤补货（钳制 cap）
//   重击「点睛」：折枝在场时消耗 ⌊墨鹤/2⌋ 只（至少 1 只），每只转化为 atk × 50% 全队护盾
//   2 链：气韵生动 — 墨鹤上限 +6（基础 6 → 12）
//   3 链：应物象形 — 共鸣技能后攻击 +15% × 3 层
//   4 链：随类赋彩 — 解放时全队攻击 +20%（与领域同寿）
//   5 链：经营位置 — 累计召唤 3 只 +1 只 140% 协同墨鹤（不含解放瞬间初召 6 只）
//   6 链：传移摹写 — 共鸣技能额外召唤白鹤 atk × 120% 共鸣技能伤害
//
// 字段挂在 unit 上：
//   zhezhiFieldTurns  墨鹤领域剩余回合（含释放回合，初始 4）
//   zhezhiCranes      当前墨鹤数
//   zhezhiCraneCap    当前墨鹤上限（6 或 2 链后 12）
//   zhezhiSummonCount 累计召唤计数（5 链阈值用，不含解放瞬间初召）
//   zhezhiCraneCapBonus  2 链加成（常驻，不吃领域消散）
//   zhezhiExtraCrane  5 链已激活
//   zhezhiWhiteCrane  6 链已激活

const BASE_CRANE_CAP = 6;
const CRANE_MULT = 0.35;          // 墨鹤追击倍率 atk × 35%
const EXTRA_CRANE_MULT = 1.4;     // 5 链额外墨鹤 × 140%
const SHIELD_PER_CRANE = 0.50;    // 重击「点睛」每只 atk × 50% 护盾
const WHITE_CRANE_MULT = 1.20;    // 6 链白鹤 atk × 120%

// 解放瞬间召唤
export function zhezhiSummonField(self, battle) {
  if (self.name !== '折枝') return;
  self.zhezhiFieldTurns = 4; // 含当回合，实际持续 3 个敌方回合
  self.zhezhiCranes = 0;
  self.zhezhiCraneCap = BASE_CRANE_CAP + (self.zhezhiCraneCapBonus || 0); // 2 链 +6
  self.zhezhiSummonCount = 0; // 解放瞬间初召 6 只不计入累计阈值

  // 解放瞬间召唤 6 只墨鹤（不触发 5 链累计阈值，按设计边界 #3）
  const initialCranes = 6;
  self.zhezhiCranes = Math.min(self.zhezhiCraneCap, initialCranes);

  // 4 链：解放时全队攻击 +20%（与领域同寿，作为 buff 持续 3 回合）
  if (self.zhezhiTeamAtk4Chain) {
    battle.team.forEach(t => {
      if (t.alive) {
        t.buffs = t.buffs || [];
        t.buffs.push({ type: 'atkUp', value: 0.20, duration: 3, src: '随类赋彩' });
      }
    });
    battle.log.push({ type: 'mechanic', src: self.name, msg: '随类赋彩 · 全队攻击 +20%（3 回合）' });
  }

  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `虚实境趣 · 墨鹤领域展开（${self.zhezhiFieldTurns - 1} 回合）· 初始墨鹤 ×${self.zhezhiCranes}`
  });
}

// 共鸣技能命中时 +1 墨鹤补货 + 6 链白鹤
export function zhezhiSkillSummon(self, battle) {
  if (self.name !== '折枝') return;
  // 6 链白鹤：不依赖领域，共鸣技能命中即可触发
  if (self.zhezhiWhiteCrane) {
    const aliveEnemies = battle.enemies.filter(e => e.alive);
    if (aliveEnemies.length) {
      const target = aliveEnemies[0];
      const whiteDmg = Math.max(50, Math.round(self.atk * WHITE_CRANE_MULT - target.def * 0.4));
      const real = dealDamageToEnemy(target, whiteDmg);
      battle.log.push({
        type: 'attack', src: self.name, tgt: target.name, dmg: real,
        crit: false, action: '传移摹写 · 白鹤（6 链）'
      });
    }
  }

  // 领域内技能命中 +1 墨鹤补货
  if (!self.zhezhiFieldTurns || self.zhezhiFieldTurns <= 0) return;
  const cap = self.zhezhiCraneCap || BASE_CRANE_CAP;
  self.zhezhiCranes = Math.min(cap, (self.zhezhiCranes || 0) + 1);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `神来之笔 → 墨鹤 +1（${self.zhezhiCranes}/${cap}）`
  });

  // 累计召唤计数 +1（5 链阈值用；额外墨鹤本身不计入）
  self.zhezhiSummonCount = (self.zhezhiSummonCount || 0) + 1;

  // 5 链：每累计召唤 3 只 +1 只额外墨鹤（140% 伤害）
  if (self.zhezhiExtraCrane && self.zhezhiSummonCount >= 3) {
    const extraCount = Math.floor(self.zhezhiSummonCount / 3);
    // 累计计量已用掉，计入阈值后清零对应部分
    self.zhezhiSummonCount = self.zhezhiSummonCount % 3;
    const aliveEnemies = battle.enemies.filter(e => e.alive);
    if (aliveEnemies.length) {
      const target = aliveEnemies[0];
      let totalExtraDmg = 0;
      for (let i = 0; i < extraCount; i++) {
        const extraDmg = Math.max(30, Math.round(self.atk * CRANE_MULT * EXTRA_CRANE_MULT - target.def * 0.3));
        const real = dealDamageToEnemy(target, extraDmg);
        totalExtraDmg += real;
        if (!target.alive) break;
      }
      if (totalExtraDmg > 0) {
        battle.log.push({
          type: 'attack', src: self.name, tgt: target.name, dmg: totalExtraDmg,
          crit: false, action: `经营位置 · 额外墨鹤 ×${extraCount}`
        });
      }
    }
  }
}

// 墨鹤追击：己方角色每次攻击命中主目标时消耗 1 只墨鹤追击
// 在 doAttack / doSkill / doBurst 命中后由 combat.js 调用
// 此函数不依赖 self 是折枝 —— 遍历全队找折枝（召唤物：不依赖折枝在场）
export function zhezhiCraneAssist(battle, primaryTarget) {
  const zhezhi = battle.team.find(t => t.name === '折枝' && t.alive);
  if (!zhezhi) return;
  if (!zhezhi.zhezhiFieldTurns || zhezhi.zhezhiFieldTurns <= 0) return;
  if (!zhezhi.zhezhiCranes || zhezhi.zhezhiCranes <= 0) return;
  if (!primaryTarget || !primaryTarget.alive) return;

  const craneCount = zhezhi.zhezhiCranes;
  const craneDmg = Math.max(30, Math.round(zhezhi.atk * CRANE_MULT - primaryTarget.def * 0.3));
  const real = dealDamageToEnemy(primaryTarget, craneDmg);
  zhezhi.zhezhiCranes -= 1;

  battle.log.push({
    type: 'attack', src: zhezhi.name, tgt: primaryTarget.name, dmg: real,
    crit: false, action: `墨鹤追击（剩 ${zhezhi.zhezhiCranes}）`
  });
}

// 重击「点睛」：折枝在场时消耗 ⌊墨鹤/2⌋ 只（至少 1 只）转全队护盾
// 由 combat.js doHeavy 在折枝重击时调用，返回 true 表示已处理（doHeavy 跳过常规伤害结算）
export function zhezhiInkShield(self, battle) {
  if (self.name !== '折枝') return false;
  if (!self.zhezhiFieldTurns || self.zhezhiFieldTurns <= 0) return false;
  const cranes = self.zhezhiCranes || 0;
  if (cranes <= 0) return false;

  // 消耗半数向下取整，至少 1 只
  const consume = Math.max(1, Math.floor(cranes / 2));
  const shieldPerCrane = Math.round(self.atk * SHIELD_PER_CRANE);
  const totalShield = shieldPerCrane * consume;

  self.zhezhiCranes -= consume;

  // 全队护盾：与既有 buff 独立叠加
  battle.team.forEach(t => {
    if (t.alive) {
      t.shield = (t.shield || 0) + totalShield;
    }
  });

  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `点睛 · 消耗墨鹤 ×${consume} → 全队护盾 ${totalShield}（墨鹤剩 ${self.zhezhiCranes}）`
  });
  return true;
}

// 领域结束清理（endTurn 调用）
export function zhezhiTurnCleanup(self, battle) {
  if (self.name !== '折枝') return;
  if (self.zhezhiFieldTurns > 0) {
    self.zhezhiFieldTurns--;
    if (self.zhezhiFieldTurns === 0) {
      self.zhezhiCranes = 0;
      self.zhezhiSummonCount = 0;
      // 清理 4 链全队 atkUp buff（领域同寿）
      battle.team.forEach(t => {
        if (t.buffs) {
          t.buffs = t.buffs.filter(b => b.src !== '随类赋彩');
        }
      });
      battle.log.push({ type: 'mechanic', src: self.name, msg: '墨鹤领域消散' });
    }
  }
}

// 简化伤害结算（不走暴击、不走 calcDamage 全套，避免追击/白鹤/额外墨鹤触发武器/印记回调）
// 调用方需自行扣血
function dealDamageToEnemy(target, dmg) {
  if (!target || !target.alive || dmg <= 0) return 0;
  // 护盾优先扣减
  if (target.shield && target.shield > 0) {
    if (dmg <= target.shield) { target.shield -= dmg; return 0; }
    else { dmg -= target.shield; target.shield = 0; }
  }
  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp <= 0) target.alive = false;
  return dmg;
}

export default {
  name: '折枝',
  hasHeavy: true,
  summonField: zhezhiSummonField,
  skillSummon: zhezhiSkillSummon,
  craneAssist: zhezhiCraneAssist,
  inkShield: zhezhiInkShield,
  turnCleanup: zhezhiTurnCleanup
};