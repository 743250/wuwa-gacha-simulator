// 共鸣链 → 战斗效果（统一抽象版本）
// 数据校准（2026-06，第三轮联网 AI）：
//   AI 警告："1/4/6 逐条效果很容易写错，要么从库街区角色页逐条摘录，要么模拟器只做统一抽象"
//   → 当前选择统一抽象：
//      1 链：小幅手感/资源/技能次数 → 攻击 +6% / 暴击 +3% / 能量回复 +5
//      2 链：技能伤害提升 → +10%
//      3 链：技能等级 +2（折算为伤害 +6%）
//      4 链：团队增益或触发条件 → 队友 +8% 攻击
//      5 链：解放等级 +2（折算 +6%）
//      6 链：核心输出质变 → 自身解放伤害 +50% / forte 满层效率翻倍
//
//   特殊角色（守岸人 4 链给全队治疗加成、嘉贝莉娜 6 链强化阈值激活效果）保留个别 hook
//   不再用之前自创的精确数值（如忌炎 6 链 +120% burstDmg 这种）

const GENERIC_CHAIN = [
  { effect: 'atk',       value: 0.06 },     // 1 链
  { effect: 'skillDmg',  value: 0.10 },     // 2 链
  { effect: 'skillDmg',  value: 0.06 },     // 3 链：技能等级折算
  { effect: 'teamAtk',   value: 0.08 },     // 4 链
  { effect: 'burstDmg',  value: 0.06 },     // 5 链：解放等级折算
  { effect: 'burstDmg',  value: 0.50 }      // 6 链：核心质变
];

// 治疗位 / 辅助角色的链条偏团队（守岸人/维里奈/白芷/夏空/鉴心/陆·赫斯/桃祈/卜灵/布兰特）
const SUPPORT_CHAIN = [
  { effect: 'teamHeal',  value: 0.10 },     // 1 链：治疗效率 +10%
  { effect: 'energyRefund', value: 10 },    // 2 链：能量回复 +10
  { effect: 'teamAtk',   value: 0.10 },     // 3 链：全队攻击 +10%
  { effect: 'teamAllDmg', value: 0.15 },    // 4 链：全队伤害 +15%
  { effect: 'teamHeal',  value: 0.30 },     // 5 链：治疗 +30%
  { effect: 'teamAtk',   value: 0.30 }      // 6 链：全队攻击 +30%
];

// 特殊 hook（少量角色专属，影响 forte 或机制）
// 6 链时 forte 满层效果加成增强（effectMult 额外 +0.5）
const FORTE_BOOST = {
  '忌炎': { atChain: 6, bonus: 0.5 },        // 强化普攻倍率额外 +0.5
  '今汐': { atChain: 6, bonus: 0.4 },
  '长离': { atChain: 6, bonus: 0.5 },
  '椿':   { atChain: 6, bonus: 0.5 },
  '珂莱塔': { atChain: 6, bonus: 0.5 },
  '菲比': { atChain: 6, bonus: 0.4 },
  '卡提希娅': { atChain: 6, bonus: 0.3 },
  '嘉贝莉娜': { atChain: 6, bonus: 0.5 },
  '卡卡罗': { atChain: 6, bonus: 0.5 }
};

import { getMeta } from './template.js';

// 选择链条模板
export function getChainEffects(roleName, chain) {
  const meta = getMeta(roleName);
  const list = (meta?.type === '辅助' || meta?.type === '治疗') ? SUPPORT_CHAIN : GENERIC_CHAIN;
  return list.slice(0, chain || 0);
}

// 把共鸣链效果应用到战斗单位的属性上
export function applyChainBonuses(unit) {
  const effects = getChainEffects(unit.name, unit.chain);
  effects.forEach(e => {
    switch (e.effect) {
      case 'atk':
        unit.atk = Math.round(unit.atk * (1 + e.value));
        break;
      case 'crate':
        unit.crate += e.value;
        break;
      case 'cdmg':
        unit.cdmg += e.value;
        break;
      case 'skillDmg':
        unit.skillBonus = (unit.skillBonus || 0) + e.value;
        break;
      case 'burstDmg':
        unit.burstBonus = (unit.burstBonus || 0) + e.value;
        break;
      case 'normalDmg':
        unit.normalBonus = (unit.normalBonus || 0) + e.value;
        break;
    }
  });
  // 6 链 forte 增益
  const boost = FORTE_BOOST[unit.name];
  if (boost && unit.chain >= boost.atChain && unit.forte) {
    unit.forte.effectMult = (unit.forte.effectMult || 1) + boost.bonus;
  }
}

// 应用全队 buff（战斗开始时调用，遍历队员的共鸣链取 team* 效果）
export function applyTeamAuras(team) {
  team.forEach(member => {
    const effects = getChainEffects(member.name, member.chain);
    effects.forEach(e => {
      if (e.effect === 'teamAtk') {
        team.forEach(t => { t.atk = Math.round(t.atk * (1 + e.value)); });
      } else if (e.effect === 'teamAllDmg') {
        team.forEach(t => {
          t.normalBonus = (t.normalBonus || 0) + e.value;
          t.skillBonus = (t.skillBonus || 0) + e.value;
          t.burstBonus = (t.burstBonus || 0) + e.value;
        });
      } else if (e.effect === 'teamHeal') {
        team.forEach(t => { t.healBonus = (t.healBonus || 0) + e.value; });
      }
    });
    // 武器被动 teamAtk 加成
    if (member._weaponTeamAtk) {
      team.forEach(t => { t.atk = Math.round(t.atk * (1 + member._weaponTeamAtk)); });
    }
  });
}

// 获取角色共鸣链 energyRefund 总量
export function getEnergyRefund(unit) {
  const effects = getChainEffects(unit.name, unit.chain);
  let total = 0;
  effects.forEach(e => { if (e.effect === 'energyRefund') total += e.value; });
  return total;
}

// 用于 UI 展示的链条描述（统一抽象的人话版本）
export function getChainLabels(roleName) {
  const meta = getMeta(roleName);
  const isSupport = meta?.type === '辅助' || meta?.type === '治疗';
  if (isSupport) {
    return [
      '治疗效率 +10%',
      '能量回复 +10',
      '全队攻击 +10%',
      '全队伤害 +15%',
      '治疗效率额外 +30%',
      '全队攻击额外 +30%'
    ];
  }
  return [
    '攻击 +6%',
    '共鸣技能伤害 +10%',
    '共鸣技能等级 +2（伤害 +6%）',
    '全队攻击 +8%',
    '共鸣解放等级 +2（伤害 +6%）',
    '共鸣解放伤害 +50% · 共鸣回路强化效果增幅'
  ];
}
