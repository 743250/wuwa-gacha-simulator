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
        unit.atk = Math.round(unit.atk * (1 + (e.value || 0)));
        break;
      case 'def':
        unit.def = Math.round(unit.def * (1 + (e.value || 0)));
        break;
      case 'hp':
        unit.hp = Math.round(unit.hp * (1 + (e.value || 0)));
        unit.hpMax = Math.round(unit.hpMax * (1 + (e.value || 0)));
        break;
      case 'crate':
        unit.crate += (e.value || 0);
        if (e.cdmg) unit.cdmg += e.cdmg;
        break;
      case 'cdmg':
        unit.cdmg += (e.value || 0);
        break;
      case 'normalDmg':
        unit.normalBonus = (unit.normalBonus || 0) + (e.value || 0);
        if (e.defPierce) unit.pierceDef = (unit.pierceDef || 0) + e.defPierce;
        break;
      case 'skillDmg':
        unit.skillBonus = (unit.skillBonus || 0) + (e.value || 0);
        break;
      case 'burstDmg':
        unit.burstBonus = (unit.burstBonus || 0) + (e.value || 0);
        if (e.heavyDmg) unit.heavyBonus = (unit.heavyBonus || 0) + e.heavyDmg;
        break;
      case 'heavyDmg':
        unit.heavyBonus = (unit.heavyBonus || 0) + (e.value || 0);
        break;
      case 'allDmg':
        unit.normalBonus = (unit.normalBonus || 0) + (e.value || 0);
        unit.skillBonus = (unit.skillBonus || 0) + (e.value || 0);
        unit.burstBonus = (unit.burstBonus || 0) + (e.value || 0);
        unit.heavyBonus = (unit.heavyBonus || 0) + (e.value || 0);
        break;
      case 'elemDmg':
        unit.elemBonus[e.element || unit.element] = (unit.elemBonus[e.element || unit.element] || 0) + (e.value || 0);
        break;
      case 'heal':
        unit.healBonus = (unit.healBonus || 0) + (e.value || 0);
        break;
      case 'defPierce':
        unit.pierceDef = (unit.pierceDef || 0) + (e.value || 0);
        break;
      case 'dodge':
        unit.dodge = Math.min(0.6, (unit.dodge || 0) + (e.value || 0));
        break;
      case 'skillCdReduce':
        unit.skillCdReduce = Math.max(unit.skillCdReduce || 0, (e.value || 0));
        break;
      // ===== 守岸人结构化机制 =====
      case 'normalSplit':
        unit.normalSplit = Math.max(unit.normalSplit || 1, (e.value || 0));
        break;
      case 'defense':
        unit.buffs = unit.buffs || [];
        unit.buffs.push({ type: 'defense', value: (e.value || 0), duration: 999, src: `${unit.name}链防御` });
        break;
      case 'variationDmg':
        unit.variationBonus = (unit.variationBonus || 0) + (e.value || 0);
        break;
      case 'burstEnergyRefund':
        unit.burstEnergyRefund = (unit.burstEnergyRefund || 0) + (e.value || 0);
        unit.burstEnergyRefundCd = Math.max(unit.burstEnergyRefundCd || 0, e.cooldown || 2);
        break;
      case 'burstHealBuff':
        unit.burstHealBuffValue = (unit.burstHealBuffValue || 0) + (e.value || 0);
        unit.burstHealBuffDur = Math.max(unit.burstHealBuffDur || 0, e.duration || 2);
        break;
      case 'skillTeamAtkBuff':
        unit.skillTeamAtkBuffValue = (unit.skillTeamAtkBuffValue || 0) + (e.value || 0);
        unit.skillTeamAtkBuffDur = Math.max(unit.skillTeamAtkBuffDur || 0, e.duration || 2);
        break;
      // ===== 卡提希娅·共鸣链 =====
      case 'cartethyiaBurstHpBonus':
        unit.cartethyiaBurstHpBonus = (unit.cartethyiaBurstHpBonus || 0) + (e.value || 0);
        break;
      case 'cartethyiaErosionOnBreak':
        unit.cartethyiaErosionOnBreak = true;
        break;
      case 'cartethyiaErosionOnSwitchIn':
        unit.cartethyiaErosionOnSwitchIn = true;
        break;
      case 'cartethyiaErosionTeamBuff':
        unit.cartethyiaErosionTeamBuff = (e.value || 0);
        unit.cartethyiaErosionTeamBuffDur = Math.max(unit.cartethyiaErosionTeamBuffDur || 0, e.duration || 2);
        break;
      case 'cartethyiaLethalShield':
        unit.cartethyiaLethalShield = (e.value || 0);
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
        unit.fieldExtraAtk = (unit.fieldExtraAtk || 0) + (e.value || 0);
        break;
      case 'shorekeeperHeal4':
        unit.healBuff4Chain = (unit.healBuff4Chain || 0) + (e.value || 0);
        break;
      // ===== 忌炎「锐意之势」=====
      case 'jiyanSkillChargeFaster':
      case 'jiyanSkillCharges':
      case 'xiakongSkillCharges':
        // 忌炎1链 / 夏空3链：技能充能上限 2
        unit.skillChargesMax = Math.max(unit.skillChargesMax || 1, e.max || 2);
        unit.skillCharges = unit.skillChargesMax;
        break;
      case 'jiyanTongBian':
        unit.jiyanTongBian = { forteGain: e.forteGain || 30, atkUp: e.atkUp || 0.28, dur: e.dur || 2 };
        break;
      case 'jiyanGuanShi':
        unit.jiyanGuanShi = { crate: e.crate || 0.16, cdmg: e.cdmg || 0.32, dur: e.dur || 2 };
        break;
      case 'jiyanQiZheng':
        unit.jiyanQiZheng = { value: (e.value || 0) || 0.25, dur: e.dur || 2 };
        break;
      case 'jiyanMingDuan':
        unit.jiyanMingDuan = {
          perStack: e.perStack != null ? e.perStack : 0.03,
          cap: e.cap || 15,
          dur: e.dur || 2,
          // 兼容旧 value=0.45 满层写法
          value: (e.value || 0),
        };
        break;
      case 'jiyanRuiyiUpgrade':
        unit.jiyanRuiyiCap = e.cap || 3;
        unit.jiyanRuiyiPerStack = e.perStack || 1.2;
        break;
      // ===== 吟霖「审判印记」=====
      case 'yinlinMarkSkillBonus':
        unit.yinlinMarkSkillBonus = (unit.yinlinMarkSkillBonus || 0) + (e.value || 0);
        break;
      case 'yinlinMarkRefund':
        unit.yinlinMarkRefund = { verdict: e.verdict || 5, energy: e.energy || 5 };
        break;
      case 'yinlinMarkVuln':
        // 旧易伤链已废止；保留字段兼容旧存档
        unit.yinlinMarkVulnPerStack = (unit.yinlinMarkVulnPerStack || 0) + (e.value || 0);
        break;
      case 'yinlinJudgmentBoost':
        unit.yinlinJudgmentBoost = (unit.yinlinJudgmentBoost || 0) + (e.value || 0.55);
        break;
      case 'yinlinJudgmentTeamAtk':
        unit.yinlinJudgmentTeamAtk = { value: (e.value || 0) || 0.20, dur: e.dur || 2 };
        break;
      case 'yinlinMarkBurstBonus':
        unit.yinlinMarkBurstBonus = (unit.yinlinMarkBurstBonus || 0) + (e.value || 0);
        break;
      case 'yinlinJiTing':
        unit.yinlinJiTing = { value: (e.value || 0) || 1.0, dur: e.dur || 2 };
        break;
      // ===== 今汐「韶光 / 谪仙」=====
      case 'jinhsiZheXian':
        unit.jinhsiZheXian = true;
        break;
      case 'jinhsiTeamAllDmg':
        unit.jinhsiTeamAllDmg = true;
        break;
      case 'jinhsiC2OffstageShaoguang':
        unit.jinhsiC2OffstageShaoguang = e.value || 1;
        break;
      // ===== 珂莱塔「解离 / 重击拐」=====
      case 'carlottaCrateVsDebuff':
        unit.carlottaCrateVsDebuff = (unit.carlottaCrateVsDebuff || 0) + (e.value || 0);
        break;
      case 'carlottaTeamSkillAfterHeavy':
        unit.carlottaTeamSkillAfterHeavy = e.value || 0.25;
        break;
      case 'carlottaC3':
        unit.skillBonus = (unit.skillBonus || 0) + (e.skillDmg || 0.93);
        unit.carlottaOutroMult = e.outroMult || 10.32;
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
      case 'zhezhiC1Skill':
        unit.zhezhiC1Skill = {
          energy: e.energy || 15,
          crate: e.crate || 0.1,
          dur: e.dur || 3,
        };
        break;
      case 'jianxinQiDouble':
        unit.jianxinQiDouble = { mult: e.mult || 2, dur: e.dur || 2 };
        break;
      case 'shorekeeperC6':
        unit.variationBonus = (unit.variationBonus || 0) + (e.variationBonus || 0.42);
        unit.shorekeeperC6Cdmg = { value: e.cdmg || 5, dur: e.dur || 2 };
        break;
      
      // ===== 散华「冰棘·重击爆裂」=====
      case 'sanhuaC1':
        unit.sanhuaC1 = true;
        break;
      case 'sanhuaC3':
        unit.sanhuaC3 = e.value != null ? e.value : 0.35;
        break;
      case 'sanhuaC4':
        unit.sanhuaC4 = {
          energy: e.energy != null ? e.energy : 10,
          heavyBonus: e.heavyBonus != null ? e.heavyBonus : 1.2,
          dur: e.dur != null ? e.dur : 2,
        };
        break;
      case 'sanhuaC5':
        unit.sanhuaC5 = e.value != null ? e.value : 1.0;
        break;
      case 'sanhuaC6':
        unit.sanhuaC6 = {
          value: (e.value || 0) != null ? e.value : 0.1,
          cap: e.cap != null ? e.cap : 2,
          dur: e.dur != null ? e.dur : 3,
        };
        break;
      case 'younuoC4Shield':
        unit.younuoC4Shield = { value: (e.value || 0) || 1.6, duration: e.duration || 3 };
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
          team.forEach(t => { t.atk = Math.round(t.atk * (1 + (e.value || 0))); });
          break;
        case 'teamDef':
          team.forEach(t => { t.def = Math.round(t.def * (1 + (e.value || 0))); });
          break;
        case 'teamAllDmg':
          team.forEach(t => {
            t.normalBonus = (t.normalBonus || 0) + (e.value || 0);
            t.skillBonus = (t.skillBonus || 0) + (e.value || 0);
            t.burstBonus = (t.burstBonus || 0) + (e.value || 0);
            t.heavyBonus = (t.heavyBonus || 0) + (e.value || 0);
          });
          break;
        case 'teamElemDmg':
          team.forEach(t => {
            t.elemBonus[e.element] = (t.elemBonus[e.element] || 0) + (e.value || 0);
          });
          break;
        case 'teamNormalDmg':
          team.forEach(t => { t.normalBonus = (t.normalBonus || 0) + (e.value || 0); });
          break;
        case 'teamSkillDmg':
          team.forEach(t => { t.skillBonus = (t.skillBonus || 0) + (e.value || 0); });
          break;
        case 'teamBurstDmg':
          team.forEach(t => { t.burstBonus = (t.burstBonus || 0) + (e.value || 0); });
          break;
        case 'teamHeavyDmg':
          team.forEach(t => { t.heavyBonus = (t.heavyBonus || 0) + (e.value || 0); });
          break;
        case 'teamHeal':
          team.forEach(t => { t.healBonus = (t.healBonus || 0) + (e.value || 0); });
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
    .reduce((sum, e) => sum + (e.value || 0), 0);
}
