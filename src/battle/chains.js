// 共鸣链 → 战斗效果
// 这里不再使用统一模板，而是从 src/data/seq.js 的原版共鸣链文案中提取可折算的数值。
// 复杂机制会保留原文展示；战斗中只折算当前模拟器已有的属性/伤害/团队光环字段。

import { seqText } from '../data/seq.js';
import { getMeta } from './template.js';

const ELEMENTS = ['热熔', '冷凝', '导电', '气动', '衍射', '湮灭'];

const FALLBACK_CHAIN = [
  { effect: 'atk', value: 0.06, label: '攻击 +6%' },
  { effect: 'skillDmg', value: 0.10, label: '共鸣技能伤害 +10%' },
  { effect: 'skillDmg', value: 0.06, label: '共鸣技能伤害 +6%' },
  { effect: 'teamAtk', value: 0.08, label: '全队攻击 +8%' },
  { effect: 'burstDmg', value: 0.06, label: '共鸣解放伤害 +6%' },
  { effect: 'burstDmg', value: 0.50, label: '共鸣解放伤害 +50%' }
];

const FORTE_BOOST = {
  '忌炎': { atChain: 6, bonus: 0.5 },
  '今汐': { atChain: 6, bonus: 0.4 },
  '长离': { atChain: 6, bonus: 0.5 },
  '椿': { atChain: 6, bonus: 0.5 },
  '珂莱塔': { atChain: 6, bonus: 0.5 },
  '菲比': { atChain: 6, bonus: 0.4 },
  '卡提希娅': { atChain: 6, bonus: 0.3 },
  '嘉贝莉娜': { atChain: 6, bonus: 0.5 },
  '卡卡罗': { atChain: 6, bonus: 0.5 }
};

function isTeamText(desc) {
  return /队伍中|队伍中的|附近队伍|所有角色|登场角色/.test(desc);
}

function pct(n) {
  return Number(n) / 100;
}

function fmtPct(v) {
  return (v * 100).toFixed(v * 100 % 1 === 0 ? 0 : 1) + '%';
}

function stackMult(desc) {
  const m = desc.match(/(?:可叠加|最多可叠加|最多可以叠加)(\d+)层/);
  return m ? Math.min(Number(m[1]), 6) : 1;
}

function maxPct(desc, patterns) {
  let best = 0;
  patterns.forEach(pattern => {
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    const re = new RegExp(pattern.source, flags);
    let m;
    while ((m = re.exec(desc))) {
      const n = Number(m[1] || m[2] || m[3] || 0);
      if (Number.isFinite(n)) best = Math.max(best, n);
    }
  });
  return best ? pct(best) : 0;
}

function firstNumber(desc, patterns) {
  for (const pattern of patterns) {
    const m = desc.match(pattern);
    if (m) return Number(m[1] || m[2] || 0);
  }
  return 0;
}

function add(effects, effect, value, label) {
  if (!value) return;
  effects.push({ effect, value, label });
}

function damageEffect(desc, team, selfEffect, teamEffect, label, patterns) {
  const value = maxPct(desc, patterns);
  if (!value) return null;
  return {
    effect: team ? teamEffect : selfEffect,
    value,
    label: `${team ? '全队' : '自身'}${label} +${fmtPct(value)}`
  };
}

function parseChainLine(roleName, index) {
  const seq = seqText[roleName];
  if (!seq?.[index]) return FALLBACK_CHAIN[index] ? [FALLBACK_CHAIN[index]] : [];

  const meta = getMeta(roleName);
  const desc = seq[index][1] || '';
  const team = isTeamText(desc);
  const effects = [];
  const stacks = stackMult(desc);

  const atk = maxPct(desc, [
    /(?:攻击|攻击力)(?:加成)?(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/,
    /每层使攻击(?:力)?(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, team ? 'teamAtk' : 'atk', atk * stacks, `${team ? '全队' : '自身'}攻击 +${fmtPct(atk * stacks)}`);

  const def = maxPct(desc, [
    /防御(?:力)?(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, team ? 'teamDef' : 'def', def * stacks, `${team ? '全队' : '自身'}防御 +${fmtPct(def * stacks)}`);

  const hp = maxPct(desc, [
    /生命(?:值)?上限(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, 'hp', hp, `生命上限 +${fmtPct(hp)}`);

  const crate = maxPct(desc, [
    /暴击(?:率)?(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/,
    /每层使暴击(?:率)?(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, 'crate', crate * stacks, `暴击率 +${fmtPct(crate * stacks)}`);

  const cdmg = maxPct(desc, [
    /暴击伤害(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/,
    /每层使暴击伤害(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, 'cdmg', cdmg * stacks, `暴击伤害 +${fmtPct(cdmg * stacks)}`);

  const normal = damageEffect(desc, team, 'normalDmg', 'teamNormalDmg', '普攻伤害', [
    /(?:普攻|常态攻击)[^。；;]*?(?:伤害(?:加成|倍率)?|倍率)(?:额外)?(?:提升|增加|加深)(\d+(?:\.\d+)?)%/
  ]);
  if (normal) effects.push(normal);

  const skill = damageEffect(desc, team, 'skillDmg', 'teamSkillDmg', '共鸣技能伤害', [
    /(?:共鸣技能|技能)[^。；;]*?(?:伤害(?:加成|倍率)?|倍率)(?:额外)?(?:提升|增加|加深)(\d+(?:\.\d+)?)%/
  ]);
  if (skill) effects.push(skill);

  const heavy = damageEffect(desc, team, 'heavyDmg', 'teamHeavyDmg', '重击伤害', [
    /(?:重击|空中攻击)[^。；;]*?(?:伤害(?:加成|倍率)?|倍率)(?:额外)?(?:提升|增加|加深)(\d+(?:\.\d+)?)%/
  ]);
  if (heavy) effects.push(heavy);

  const burst = damageEffect(desc, team, 'burstDmg', 'teamBurstDmg', '共鸣解放伤害', [
    /(?:共鸣解放|解放)[^。；;]*?(?:伤害(?:加成|倍率)?|倍率)(?:额外)?(?:提升|增加|加深)(\d+(?:\.\d+)?)%/
  ]);
  if (burst) effects.push(burst);

  const allDmg = maxPct(desc, [
    /全属性伤害加成(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/,
    /全伤害加深(\d+(?:\.\d+)?)%/,
    /造成的伤害(?:额外)?(?:提升|增加|加深)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, team ? 'teamAllDmg' : 'allDmg', allDmg, `${team ? '全队' : '自身'}全伤害 +${fmtPct(allDmg)}`);

  ELEMENTS.forEach(element => {
    const elemDmg = maxPct(desc, [
      new RegExp(`${element}伤害(?:加成|加深)?(?:额外)?(?:提升|增加|加深)(\\d+(?:\\.\\d+)?)%`)
    ]);
    if (!elemDmg) return;
    add(
      effects,
      team ? 'teamElemDmg' : 'elemDmg',
      elemDmg,
      `${team ? '全队' : '自身'}${element}伤害 +${fmtPct(elemDmg)}`
    );
    effects[effects.length - 1].element = element;
  });

  const heal = maxPct(desc, [
    /治疗效果加成(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, team ? 'teamHeal' : 'heal', heal, `${team ? '全队' : '自身'}治疗效果 +${fmtPct(heal)}`);

  const pierce = maxPct(desc, [
    /(?:无视|忽视)(?:目标|对方)?(\d+(?:\.\d+)?)%的?防御/,
    /无视目标(\d+(?:\.\d+)?)%防御/,
    /防御穿透(?:提升|增加)?(\d+(?:\.\d+)?)%/
  ]);
  add(effects, 'defPierce', pierce, `无视防御 +${fmtPct(pierce)}`);

  const energy = firstNumber(desc, [
    /(?:额外)?回复(\d+(?:\.\d+)?)点共鸣能量/,
    /回复(\d+(?:\.\d+)?)点协奏能量/
  ]);
  if (energy) add(effects, 'energyRefund', energy, `额外回复能量 +${energy}`);

  const cdReduce = firstNumber(desc, [
    /冷却时间减少(\d+(?:\.\d+)?)秒/
  ]);
  if (cdReduce) add(effects, 'skillCdReduce', Math.max(1, Math.round(cdReduce / 4)), '共鸣技能冷却 -1 回合');

  if (/免疫伤害和受击|闪避反击|免疫打断/.test(desc)) {
    add(effects, 'dodge', 0.03, '操作容错/闪避率 +3%');
  }

  if (!effects.length) {
    effects.push({
      effect: 'textOnly',
      value: 0,
      label: '保留原文机制（当前战斗模型不额外折算）'
    });
  }
  return effects;
}

export function getChainEffects(roleName, chain) {
  const count = Math.max(0, Math.min(6, chain || 0));
  const effects = [];
  for (let i = 0; i < count; i++) effects.push(...parseChainLine(roleName, i));
  return effects;
}

export function applyChainBonuses(unit) {
  const effects = getChainEffects(unit.name, unit.chain);
  effects.forEach(e => {
    switch (e.effect) {
      case 'atk':
        unit.atk = Math.round(unit.atk * (1 + e.value));
        break;
      case 'def':
        unit.def = Math.round(unit.def * (1 + e.value));
        break;
      case 'hp':
        unit.hp = Math.round(unit.hp * (1 + e.value));
        unit.hpMax = Math.round(unit.hpMax * (1 + e.value));
        break;
      case 'crate':
        unit.crate += e.value;
        break;
      case 'cdmg':
        unit.cdmg += e.value;
        break;
      case 'normalDmg':
        unit.normalBonus = (unit.normalBonus || 0) + e.value;
        break;
      case 'skillDmg':
        unit.skillBonus = (unit.skillBonus || 0) + e.value;
        break;
      case 'burstDmg':
        unit.burstBonus = (unit.burstBonus || 0) + e.value;
        break;
      case 'heavyDmg':
        unit.heavyBonus = (unit.heavyBonus || 0) + e.value;
        break;
      case 'allDmg':
        unit.normalBonus = (unit.normalBonus || 0) + e.value;
        unit.skillBonus = (unit.skillBonus || 0) + e.value;
        unit.burstBonus = (unit.burstBonus || 0) + e.value;
        unit.heavyBonus = (unit.heavyBonus || 0) + e.value;
        break;
      case 'elemDmg':
        unit.elemBonus[e.element || unit.element] = (unit.elemBonus[e.element || unit.element] || 0) + e.value;
        break;
      case 'heal':
        unit.healBonus = (unit.healBonus || 0) + e.value;
        break;
      case 'defPierce':
        unit.pierceDef = (unit.pierceDef || 0) + e.value;
        break;
      case 'dodge':
        unit.dodge = Math.min(0.6, (unit.dodge || 0) + e.value);
        break;
      case 'skillCdReduce':
        unit.skillCdReduce = Math.max(unit.skillCdReduce || 0, e.value);
        break;
    }
  });

  const boost = FORTE_BOOST[unit.name];
  if (boost && unit.chain >= boost.atChain && unit.forte) {
    unit.forte.effectMult = (unit.forte.effectMult || 1) + boost.bonus;
  }
}

export function applyTeamAuras(team) {
  team.forEach(member => {
    const effects = getChainEffects(member.name, member.chain);
    effects.forEach(e => {
      switch (e.effect) {
        case 'teamAtk':
          team.forEach(t => { t.atk = Math.round(t.atk * (1 + e.value)); });
          break;
        case 'teamDef':
          team.forEach(t => { t.def = Math.round(t.def * (1 + e.value)); });
          break;
        case 'teamAllDmg':
          team.forEach(t => {
            t.normalBonus = (t.normalBonus || 0) + e.value;
            t.skillBonus = (t.skillBonus || 0) + e.value;
            t.burstBonus = (t.burstBonus || 0) + e.value;
            t.heavyBonus = (t.heavyBonus || 0) + e.value;
          });
          break;
        case 'teamElemDmg':
          team.forEach(t => {
            t.elemBonus[e.element] = (t.elemBonus[e.element] || 0) + e.value;
          });
          break;
        case 'teamNormalDmg':
          team.forEach(t => { t.normalBonus = (t.normalBonus || 0) + e.value; });
          break;
        case 'teamSkillDmg':
          team.forEach(t => { t.skillBonus = (t.skillBonus || 0) + e.value; });
          break;
        case 'teamBurstDmg':
          team.forEach(t => { t.burstBonus = (t.burstBonus || 0) + e.value; });
          break;
        case 'teamHeavyDmg':
          team.forEach(t => { t.heavyBonus = (t.heavyBonus || 0) + e.value; });
          break;
        case 'teamHeal':
          team.forEach(t => { t.healBonus = (t.healBonus || 0) + e.value; });
          break;
      }
    });

    if (member._weaponTeamAtk) {
      team.forEach(t => { t.atk = Math.round(t.atk * (1 + member._weaponTeamAtk)); });
    }
  });
}

export function getEnergyRefund(unit) {
  return getChainEffects(unit.name, unit.chain)
    .filter(e => e.effect === 'energyRefund')
    .reduce((sum, e) => sum + e.value, 0);
}

export function getChainLabels(roleName) {
  return Array.from({ length: 6 }, (_, i) => {
    const effects = parseChainLine(roleName, i);
    return effects.map(e => e.label).join(' · ');
  });
}
