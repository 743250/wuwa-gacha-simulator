// 共鸣链 → 战斗效果（逻辑层）
// Phase 3: 数据源迁到 src/data/chains/registry.ts(ChainDef 单结构)
// Phase 4: FALLBACK_CHAIN 已删,registry.ts 覆盖全部 50 角色,parseChainLine 只走 ChainDef 路径。
// 未找到角色时返回空数组(明确无 effect),不再隐式解析旧数据。

import { FORTE_BOOST } from './chainEffects.js';
import { getChainDef } from '../data/chains/index.ts';

function stripTags(html) {
  return String(html || '').replace(/<[^>]+>/g, '');
}

// 从 ChainDef 提取 effect 数组
// label 缺失时用 text.desc 去标签兜底
function overrideToEffects(roleName, idx) {
  const def = getChainDef(roleName);
  if (!def) return [];
  const c = def.chains[idx];
  if (!c || !c.effect) return [];
  return [{
    ...c.effect,
    label: c.effect.label || stripTags(c.text.desc),
  }];
}

function parseChainLine(roleName, index) {
  return overrideToEffects(roleName, index);
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
        if (e.cdmg) unit.cdmg += e.cdmg;
        break;
      case 'cdmg':
        unit.cdmg += e.value;
        break;
      case 'normalDmg':
        unit.normalBonus = (unit.normalBonus || 0) + e.value;
        if (e.defPierce) unit.pierceDef = (unit.pierceDef || 0) + e.defPierce;
        break;
      case 'skillDmg':
        unit.skillBonus = (unit.skillBonus || 0) + e.value;
        break;
      case 'burstDmg':
        unit.burstBonus = (unit.burstBonus || 0) + e.value;
        if (e.heavyDmg) unit.heavyBonus = (unit.heavyBonus || 0) + e.heavyDmg;
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
        unit.normalSplit = Math.max(unit.normalSplit || 1, e.value);
        break;
      case 'defense':
        unit.buffs = unit.buffs || [];
        unit.buffs.push({ type: 'defense', value: e.value, duration: 999, src: `${unit.name}链防御` });
        break;
      case 'variationDmg':
        unit.variationBonus = (unit.variationBonus || 0) + e.value;
        break;
      case 'burstEnergyRefund':
        unit.burstEnergyRefund = (unit.burstEnergyRefund || 0) + e.value;
        unit.burstEnergyRefundCd = Math.max(unit.burstEnergyRefundCd || 0, e.cooldown || 2);
        break;
      case 'burstHealBuff':
        unit.burstHealBuffValue = (unit.burstHealBuffValue || 0) + e.value;
        unit.burstHealBuffDur = Math.max(unit.burstHealBuffDur || 0, e.duration || 2);
        break;
      case 'skillTeamAtkBuff':
        unit.skillTeamAtkBuffValue = (unit.skillTeamAtkBuffValue || 0) + e.value;
        unit.skillTeamAtkBuffDur = Math.max(unit.skillTeamAtkBuffDur || 0, e.duration || 2);
        break;
      // ===== 卡提希娅·共鸣链 =====
      case 'cartethyiaBurstHpBonus':
        unit.cartethyiaBurstHpBonus = (unit.cartethyiaBurstHpBonus || 0) + e.value;
        break;
      case 'cartethyiaErosionOnBreak':
        unit.cartethyiaErosionOnBreak = true;
        break;
      case 'cartethyiaErosionOnSwitchIn':
        unit.cartethyiaErosionOnSwitchIn = true;
        break;
      case 'cartethyiaErosionTeamBuff':
        unit.cartethyiaErosionTeamBuff = e.value;
        unit.cartethyiaErosionTeamBuffDur = Math.max(unit.cartethyiaErosionTeamBuffDur || 0, e.duration || 2);
        break;
      case 'cartethyiaLethalShield':
        unit.cartethyiaLethalShield = e.value;
        break;
      case 'cartethyiaBurst2DoubleErosion':
        unit.cartethyiaBurst2DoubleErosion = true;
        break;
      // ===== 守岸人 浅析星域 =====
      case 'fieldExtend':
        unit.fieldExtendDur = (unit.fieldExtendDur || 0) + (e.duration || 0);
        if (e.persistOnSwitch) unit.fieldPersistOnSwitch = true;
        break;
      case 'fieldTeamAtk':
        unit.fieldExtraAtk = (unit.fieldExtraAtk || 0) + e.value;
        break;
      case 'shorekeeperHeal4':
        unit.healBuff4Chain = (unit.healBuff4Chain || 0) + e.value;
        break;
      // ===== 忌炎「锐意之势」=====
      case 'jiyanSkillChargeFaster':
        unit.skillCdReduce = Math.max(unit.skillCdReduce || 0, 1);
        break;
      case 'jiyanTongBian':
        unit.jiyanTongBian = { forteGain: e.forteGain || 30, atkUp: e.atkUp || 0.28, dur: e.dur || 2 };
        break;
      case 'jiyanGuanShi':
        unit.jiyanGuanShi = { crate: e.crate || 0.16, cdmg: e.cdmg || 0.32, dur: e.dur || 2 };
        break;
      case 'jiyanQiZheng':
        unit.jiyanQiZheng = { value: e.value || 0.25, dur: e.dur || 2 };
        break;
      case 'jiyanMingDuan':
        unit.jiyanMingDuan = { value: e.value || 0.45, dur: e.dur || 2 };
        break;
      case 'jiyanRuiyiUpgrade':
        unit.jiyanRuiyiCap = e.cap || 3;
        unit.jiyanRuiyiPerStack = e.perStack || 1.2;
        break;
      // ===== 吟霖「审判印记」=====
      case 'yinlinMarkSkillBonus':
        unit.yinlinMarkSkillBonus = (unit.yinlinMarkSkillBonus || 0) + e.value;
        break;
      case 'yinlinMarkRefund':
        unit.yinlinMarkRefund = { verdict: e.verdict || 5, energy: e.energy || 5 };
        break;
      case 'yinlinMarkVuln':
        unit.yinlinMarkVulnPerStack = (unit.yinlinMarkVulnPerStack || 0) + e.value;
        break;
      case 'yinlinJudgmentTeamAtk':
        unit.yinlinJudgmentTeamAtk = { value: e.value || 0.20, dur: e.dur || 2 };
        break;
      case 'yinlinMarkBurstBonus':
        unit.yinlinMarkBurstBonus = (unit.yinlinMarkBurstBonus || 0) + e.value;
        break;
      case 'yinlinJiTing':
        unit.yinlinJiTing = { value: e.value || 1.0, dur: e.dur || 2 };
        break;
      // ===== 今汐「韶光 / 谪仙」=====
      case 'jinhsiZheXian':
        unit.jinhsiZheXian = true;
        break;
      case 'jinhsiTeamAllDmg':
        unit.jinhsiTeamAllDmg = true;
        break;
      // ===== 珂莱塔「解离 / 重击拐」=====
      case 'carlottaCrateVsDebuff':
        unit.carlottaCrateVsDebuff = (unit.carlottaCrateVsDebuff || 0) + (e.value || 0);
        break;
      case 'carlottaTeamSkillAfterHeavy':
        unit.carlottaTeamSkillAfterHeavy = e.value || 0.25;
        break;
      // ===== 折枝「墨鹤召唤」=====
      case 'zhezhiCraneCapBonus':
        unit.zhezhiCraneCapBonus = (unit.zhezhiCraneCapBonus || 0) + (e.value || 6);
        break;
      case 'zhezhiTeamAtk4Chain':
        unit.zhezhiTeamAtk4Chain = true;
        break;
      case 'zhezhiExtraCrane':
        unit.zhezhiExtraCrane = true;
        break;
      case 'zhezhiWhiteCrane':
        unit.zhezhiWhiteCrane = true;
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
