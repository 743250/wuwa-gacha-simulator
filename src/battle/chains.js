// 共鸣链 → 战斗效果（逻辑层）
// 数据层见 chainEffects.js
//
// ★ 文案数据：src/data/chains-extracted.json 由 scripts/extract-chains.cjs 从
//   库街区官方 API（/wiki/core/catalogue/item/getEntryDetail）批量抓取，
//   含 10 个核心角色的官方共鸣链 title / desc / summary（已染色）。
// ★ 战斗折算：CHAIN_BATTLE_EFFECTS（chainEffects.js）是结构化机制覆盖，
//   未在 CHAIN_BATTLE_EFFECTS 中列出的角色，战斗折算仍走文案正则（parseChainLine 兜底分支）。

import { seqText } from '../data/seq.js';
import { getMeta } from './template.js';
import OFFICIAL_CHAINS from '../data/chains-extracted.json' with { type: 'json' };
import { CHAIN_BATTLE_EFFECTS, FALLBACK_CHAIN, FORTE_BOOST } from './chainEffects.js';

// 守岸人 1-6 链结构化机制（库街区官方文案 · API: /wiki/core/catalogue/item/getEntryDetail id=1286814658335739904）
// 数值与文案均为国服官方原文，只在末尾补 summary（一句话 UI 摘要）。
// 兼容旧调用：把 CHAIN_BATTLE_EFFECTS 转回旧的 [{effect,value,label}] 形式给 parseChainLine 用
function overrideToEffects(roleName, idx) {
  const arr = CHAIN_BATTLE_EFFECTS[roleName];
  if (!arr) return null;
  const entry = OFFICIAL_CHAINS[roleName]?.[idx];
  const effs = arr[idx] || [];
  return effs.map(e => ({
    ...e,
    label: e.label || stripTags(entry?.summary || '')
  }));
}

function stripTags(html) {
  return String(html || '').replace(/<[^>]+>/g, '');
}

// 给外部 UI 用：取链的 title / summary / desc（来自官方文案）
export function getOverrideMeta(roleName, idx) {
  return OFFICIAL_CHAINS[roleName]?.[idx] || null;
}
// 是否有完整官方文案（10 个核心角色都有）
export function hasChainOverride(roleName) {
  return !!OFFICIAL_CHAINS[roleName];
}
// 是否有结构化战斗折算（10 个核心角色 全部有）
export function hasChainBattleEffects(roleName) {
  return !!CHAIN_BATTLE_EFFECTS[roleName];
}


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
  // 有结构化战斗机制就走它（守岸人）
  if (CHAIN_BATTLE_EFFECTS[roleName]) {
    return overrideToEffects(roleName, index) || [];
  }

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
      // ===== 守岸人结构化机制 =====
      case 'normalSplit':
        // 5 链：普攻额外打一个相邻敌人
        unit.normalSplit = Math.max(unit.normalSplit || 1, e.value);
        break;
      case 'variationDmg':
        // 6 链：变奏伤害 +500%
        unit.variationBonus = (unit.variationBonus || 0) + e.value;
        break;
      case 'burstEnergyRefund':
        // 3 链：解放后额外回 20 能量，CD 2 回合（运行时由 combat 控制 cd）
        unit.burstEnergyRefund = (unit.burstEnergyRefund || 0) + e.value;
        unit.burstEnergyRefundCd = Math.max(unit.burstEnergyRefundCd || 0, e.cooldown || 2);
        break;
      case 'burstHealBuff':
        // 1 链：标记角色拥有"解放治疗 +150%/2 回合 切人不结束"机制
        unit.burstHealBuffValue = (unit.burstHealBuffValue || 0) + e.value;
        unit.burstHealBuffDur = Math.max(unit.burstHealBuffDur || 0, e.duration || 2);
        break;
      case 'skillTeamAtkBuff':
        // 2 链：技能后全队攻击 +40%/2 回合
        unit.skillTeamAtkBuffValue = (unit.skillTeamAtkBuffValue || 0) + e.value;
        unit.skillTeamAtkBuffDur = Math.max(unit.skillTeamAtkBuffDur || 0, e.duration || 2);
        break;
      // ===== 守岸人 浅析星域 =====
      case 'fieldExtend':
        // 1 链：星域持续 +3 回合 + 切人不消散
        unit.fieldExtendDur = (unit.fieldExtendDur || 0) + (e.duration || 0);
        if (e.persistOnSwitch) unit.fieldPersistOnSwitch = true;
        break;
      case 'fieldTeamAtk':
        // 2 链：星域内附近角色攻击 +40%
        unit.fieldExtraAtk = (unit.fieldExtraAtk || 0) + e.value;
        break;
      case 'shorekeeperHeal4':
        // 4 链：共鸣技能治疗 +70%
        unit.healBuff4Chain = (unit.healBuff4Chain || 0) + e.value;
        break;
      // ===== 忌炎「锐意之势」=====
      case 'jiyanSkillChargeFaster':
        // 1 链 济世：共鸣技能 CD -1
        unit.skillCdReduce = Math.max(unit.skillCdReduce || 0, 1);
        break;
      case 'jiyanTongBian':
        // 2 链 通变：变奏入场 → 破阵 +N + 攻击 buff
        unit.jiyanTongBian = { forteGain: e.forteGain || 30, atkUp: e.atkUp || 0.28, dur: e.dur || 2 };
        break;
      case 'jiyanGuanShi':
        // 3 链 观势：技能/重击/变奏/解放后 暴击 + 暴伤 buff（自身 2 回合）
        unit.jiyanGuanShi = { crate: e.crate || 0.16, cdmg: e.cdmg || 0.32, dur: e.dur || 2 };
        break;
      case 'jiyanQiZheng':
        // 4 链 奇正：解放后全队重击 +25% / 2 回合
        unit.jiyanQiZheng = { value: e.value || 0.25, dur: e.dur || 2 };
        break;
      case 'jiyanMingDuan':
        // 5 链 明断：变奏入场 攻击 +45% / 2 回合（与 2 链 atkUp 同源叠加）
        unit.jiyanMingDuan = { value: e.value || 0.45, dur: e.dur || 2 };
        break;
      case 'jiyanRuiyiUpgrade':
        // 6 链 移山：锐意上限 2→3，每层 +120%
        unit.jiyanRuiyiCap = e.cap || 3;
        unit.jiyanRuiyiPerStack = e.perStack || 1.2;
        break;
      // ===== 吟霖「审判印记」=====
      case 'yinlinMarkSkillBonus':
        // 1 链 矛盾的抉择：共鸣技能/解放对印记目标 ×(1 + value)
        unit.yinlinMarkSkillBonus = (unit.yinlinMarkSkillBonus || 0) + e.value;
        break;
      case 'yinlinMarkRefund':
        // 2 链 牵绊的俘虏：命中印记目标 +5 审判 +5 能量
        unit.yinlinMarkRefund = { verdict: e.verdict || 5, energy: e.energy || 5 };
        break;
      case 'yinlinMarkVuln':
        // 3 链 无情的断罪：印记每层使目标受到伤害 +15%（挂在敌人身上，命中时读取）
        unit.yinlinMarkVulnPerStack = (unit.yinlinMarkVulnPerStack || 0) + e.value;
        break;
      case 'yinlinJudgmentTeamAtk':
        // 4 链 前行的鼓舞：触发审判之雷时全队攻击 +20% / 2 回合
        unit.yinlinJudgmentTeamAtk = { value: e.value || 0.20, dur: e.dur || 2 };
        break;
      case 'yinlinMarkBurstBonus':
        // 5 链 决意的回响：解放对印记目标额外 ×(1 + value)
        unit.yinlinMarkBurstBonus = (unit.yinlinMarkBurstBonus || 0) + e.value;
        break;
      case 'yinlinJiTing':
        // 6 链 正义的践行：解放后 N 回合内，普攻命中印记目标额外触发 疾霆昭彰
        unit.yinlinJiTing = { value: e.value || 1.0, dur: e.dur || 2 };
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
    // 覆写优先：直接用结构化 summary（含 HTML 高亮）
    const meta = getOverrideMeta(roleName, i);
    if (meta) return meta.summary;
    const effects = parseChainLine(roleName, i);
    return effects.map(e => e.label).join(' · ');
  });
}
