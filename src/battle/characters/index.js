// 角色机制注册表
//
// import 各角色的 default export（纯数据 + 可选 hook 函数），
// 对外提供统一的 getCharacterMechanic / fireCharacterHook / hasHeavyAttack / renderCharacterBattleStatus。

import jiyan from './jiyan.js';
import { pushTeamBuffs } from '../pushBuff.js';
import shorekeeper from './shorekeeper.js';
import yinlin from './yinlin.js';
import encore from './encore.js';
import cartethyia from './cartethyia.js';
import jinhsi from './jinhsi.js';
import changli from './changli.js';
import camellia from './camellia.js';
import carlotta from './carlotta.js';
import phoebe from './phoebe.js';
import brant from './brant.js';
import cantarella from './cantarella.js';
import kakaro from './kakaro.js';
import zhezhi from './zhezhi.js';
import zanyan from './zanyan.js';
import frolo from './frolo.js';
import chouyuan from './chouyuan.js';
import qianxiao from './qianxiao.js';
import aogusita from './aogusita.js';
import xiakong from './xiakong.js';
import younuo from './younuo.js';
import lupa from './lupa.js';
import gaberina from './gaberina.js';
import sanhua from './sanhua.js';

// 轻量角色：仅标记 hasHeavy + 可选倍率 hook（Phase 3 校准）
const LIGHTWEIGHT = {
  // Phase 3 · 洛可可：N100/S180/H400/变奏170；解放开场 835·417.5（WIKI）；满想象力 ×1.6 烘焙进 resolveBurst
  '洛可可': {
    hasHeavy: true,
    normalMult: () => 1.0,
    skillMult: () => 1.8,
    heavyMult: () => 4.0,
    variationMult: () => 1.7,
    // resolveBurst 跳过 enhancedBurst 再乘，故 ready 侧手写 ×1.6
    resolveBurstMult: (self) => self.forte?.ready
      ? { baseMain: 13.36, baseSide: 6.68 }
      : { baseMain: 8.35, baseSide: 4.175 },
  },
  // Phase 3 · 鉴心：N110/S300/H400/解放650·325/变奏100
  '鉴心': {
    hasHeavy: true,
    normalMult: () => 1.1,
    skillMult: () => 3.0,
    heavyMult: () => 4.0,
    variationMult: () => 1.0,
    resolveBurstMult: () => ({ baseMain: 6.5, baseSide: 3.25 }),
    // 1 链 · 林间青枝：变奏后 2 回合普攻积气 ×2
    onVariation: (self, ctx) => {
      if (!self.jianxinQiDouble) return;
      const cfg = self.jianxinQiDouble;
      const mult = cfg.mult || 2;
      const dur = cfg.dur || 2;
      self.buffs = (self.buffs || []).filter(b => b.src !== '林间青枝');
      self.buffs.push({
        type: 'jianxinQiDouble',
        value: mult,
        duration: dur + 1,
        src: '林间青枝',
      });
      ctx?.battle?.log.push({
        type: 'mechanic', src: self.name,
        msg: `林间青枝 · 普攻积气 ×${mult}（${dur} 回合）`,
      });
    },
  },
  // Phase 3 · 相里要：N130/S200/H400/变奏100/解放思维矩阵 1466·733（WIKI）
  '相里要': {
    hasHeavy: true,
    normalMult: () => 1.3,
    skillMult: () => 2.0,
    heavyMult: () => 4.0,
    variationMult: () => 1.0,
    resolveBurstMult: () => ({ baseMain: 14.66, baseSide: 7.33 }),
  },
  // Phase 3 · 维里奈治疗位：N100/S120/解放200·100/变奏100
  '维里奈': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 1.2,
    variationMult: () => 1.0,
    resolveBurstMult: () => ({ baseMain: 2.0, baseSide: 1.0 }),
  },
  // 漂泊者三形态 · A 级工厂（B-Tier 温和）
  '漂泊者·衍射': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 2.0,
    variationMult: () => 1.2,
    resolveBurstMult: () => ({ baseMain: 6.0, baseSide: 3.0 }),
  },
  '漂泊者·湮灭': {
    hasHeavy: true,
    normalMult: () => 1.1,
    skillMult: () => 2.2,
    heavyMult: () => 4.0,
    variationMult: () => 1.2,
    resolveBurstMult: () => ({ baseMain: 6.5, baseSide: 3.25 }),
  },
  '漂泊者·气动': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 2.4,
    variationMult: () => 1.2,
    resolveBurstMult: () => ({ baseMain: 6.2, baseSide: 3.1 }),
  },
  // Phase 3 · 凌阳：N125/S210/解放400·200/变奏100；无重击
  '凌阳': {
    hasHeavy: false,
    normalMult: () => 1.25,
    skillMult: () => 2.1,
    variationMult: () => 1.0,
    resolveBurstMult: () => ({ baseMain: 4.0, baseSide: 2.0 }),
  },
  // ── 4★ 工厂（encore Lv10 抽象 · 2026-07-15）──
  // 散华 → FULL sanhua.js（冰棘·重击爆裂）
  // 桃祈盾辅：低伤 S130/H220/B450·225/V210
  '桃祈': {
    hasHeavy: true,
    normalMult: () => 1.1,
    skillMult: () => 1.3,
    heavyMult: () => 2.2,
    variationMult: () => 2.1,
    resolveBurstMult: () => ({ baseMain: 4.5, baseSide: 2.25 }),
  },
  // 炽霞：S250 / 解放 950·475（热压弹叙事）
  '炽霞': {
    hasHeavy: false,
    normalMult: () => 1.2,
    skillMult: () => 2.5,
    variationMult: () => 1.0,
    resolveBurstMult: () => ({ baseMain: 9.5, baseSide: 4.75 }),
  },
  // 白芷治疗位：伤害压低
  '白芷': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 0.2,
    variationMult: () => 0.8,
    resolveBurstMult: () => ({ baseMain: 0.5, baseSide: 0.25 }),
  },
  // 丹瑾：技能多段压 S350 / 解放 790·395 / 变奏 200
  '丹瑾': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 3.5,
    variationMult: () => 2.0,
    resolveBurstMult: () => ({ baseMain: 7.9, baseSide: 3.95 }),
  },
  // 秧秧：S140 / 释羽 H220 / B560·280 / V160
  '秧秧': {
    hasHeavy: true,
    normalMult: () => 1.1,
    skillMult: () => 1.4,
    heavyMult: () => 2.2,
    variationMult: () => 1.6,
    resolveBurstMult: () => ({ baseMain: 5.6, baseSide: 2.8 }),
  },
  // 渊武盾辅
  '渊武': {
    hasHeavy: false,
    normalMult: () => 1.1,
    skillMult: () => 2.0,
    variationMult: () => 0.6,
    resolveBurstMult: () => ({ baseMain: 3.5, baseSide: 1.75 }),
  },
  // 莫特斐：解放直伤低，协同为主
  '莫特斐': {
    hasHeavy: false,
    normalMult: () => 1.2,
    skillMult: () => 2.1,
    variationMult: () => 1.7,
    resolveBurstMult: () => ({ baseMain: 3.2, baseSide: 1.6 }),
  },
  // 灯灯：S360 / 解放 950·475
  '灯灯': {
    hasHeavy: false,
    normalMult: () => 1.1,
    skillMult: () => 3.6,
    variationMult: () => 1.7,
    resolveBurstMult: () => ({ baseMain: 9.5, baseSide: 4.75 }),
  },
  // 釉瑚：诗中物技能核 S370 / B330·165
  '釉瑚': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 3.7,
    variationMult: () => 0.9,
    resolveBurstMult: () => ({ baseMain: 3.3, baseSide: 1.65 }),
  },
  // 卜灵辅助
  '卜灵': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 0.6,
    variationMult: () => 1.3,
    resolveBurstMult: () => ({ baseMain: 5.4, baseSide: 2.7 }),
  },
  // 秋水：技能召唤向 / B400·200 / V200
  '秋水': {
    hasHeavy: false,
    normalMult: () => 1.2,
    skillMult: () => 0.6,
    variationMult: () => 2.0,
    resolveBurstMult: () => ({ baseMain: 4.0, baseSide: 2.0 }),
  },
  // ── 3.0-3.4 限定 5★（设计 §4 基底 · 2026-07-15；状态机仍工厂/未专属）──
  // 琳奈：N100/S180·加色200/H满流光400/B280·140/V80
  '琳奈': {
    hasHeavy: true,
    normalMult: () => 1.0,
    skillMult: () => 1.8,
    heavyMult: () => 4.0,
    variationMult: () => 0.8,
    resolveBurstMult: () => ({ baseMain: 2.8, baseSide: 1.4 }),
  },
  // 莫宁：N100/S150（阵列）/B400·200/V80；无重击
  '莫宁': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 1.5,
    variationMult: () => 0.8,
    resolveBurstMult: () => ({ baseMain: 4.0, baseSide: 2.0 }),
  },
  // 爱弥斯：N100/S180/H300 聚爆/B400·200/V80
  '爱弥斯': {
    hasHeavy: true,
    normalMult: () => 1.0,
    skillMult: () => 1.8,
    heavyMult: () => 3.0,
    variationMult: () => 0.8,
    resolveBurstMult: () => ({ baseMain: 4.0, baseSide: 2.0 }),
  },
  // 陆·赫斯治疗辅：S150/B300·150/V60；无重击
  '陆·赫斯': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 1.5,
    variationMult: () => 0.6,
    resolveBurstMult: () => ({ baseMain: 3.0, baseSide: 1.5 }),
  },
  // 西格莉卡：S180/H220/B400·200/V80；重击黄语义入口
  '西格莉卡': {
    hasHeavy: true,
    normalMult: () => 1.0,
    skillMult: () => 1.8,
    heavyMult: () => 2.2,
    variationMult: () => 0.8,
    resolveBurstMult: () => ({ baseMain: 4.0, baseSide: 2.0 }),
  },
  // 绯雪：S180/B400·200/V80；重击进预求身（伤害 0，居合走普攻键）
  '绯雪': {
    hasHeavy: true,
    normalMult: () => 1.0,
    skillMult: () => 1.8,
    heavyMult: () => 0.01, // 入口无伤，占位避免 0 被当缺省
    variationMult: () => 0.8,
    resolveBurstMult: () => ({ baseMain: 4.0, baseSide: 2.0 }),
  },
  // 达妮娅：S180/B400·200/V80；重击键形态切换无伤
  '达妮娅': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 1.8,
    variationMult: () => 0.8,
    resolveBurstMult: () => ({ baseMain: 4.0, baseSide: 2.0 }),
  },
  // 露西：S180/H220/B450·225/V80
  '露西': {
    hasHeavy: true,
    normalMult: () => 1.0,
    skillMult: () => 1.8,
    heavyMult: () => 2.2,
    variationMult: () => 0.8,
    resolveBurstMult: () => ({ baseMain: 4.5, baseSide: 2.25 }),
  },
  // 丽贝卡：S180/B400·200/V80；重击进铁胆
  '丽贝卡': {
    hasHeavy: true,
    normalMult: () => 1.0,
    skillMult: () => 1.8,
    heavyMult: () => 2.2,
    variationMult: () => 0.8,
    resolveBurstMult: () => ({ baseMain: 4.0, baseSide: 2.0 }),
  },
  // 洛瑟菈：S160/V80；解放无直接伤害（追忆窗），爆发在断舍离
  '洛瑟菈': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 1.6,
    variationMult: () => 0.8,
    resolveBurstMult: () => ({ baseMain: 0, baseSide: 0 }),
  },
  // 3.5 · 秧秧·玄翎（SP 主C 湮灭 迅刀）— 苍翎满 2 层强化重击
  '秧秧·玄翎': {
    hasHeavy: true,
    normalMult: () => 1.2,
    skillMult: () => 1.8,
    // 苍翎满时重击 ×2.0（atk×800%），命中后由 onHeavy 消耗苍翎
    heavyMult: (self) => (self.forte?.ready ? 8.0 : 4.0),
    variationMult: () => 1.2,
    resolveBurstMult: () => ({ baseMain: 7.0, baseSide: 3.5 }),
    // 变奏入场 +1 苍翎（官方羽挟苍空回复 1 点苍翎）
    onVariation: (self) => {
      if (!self.forte) return;
      self.forte.current = Math.min(self.forte.max, self.forte.current + 1);
      if (self.forte.current >= self.forte.max) self.forte.ready = true;
    },
    // 强化重击命中后消耗全部苍翎
    onHeavy: (self) => {
      if (self.forte?.ready) {
        self.forte.current = 0;
        self.forte.ready = false;
      }
    },
  },
  // 3.5 · 穗穗（辅助 冷凝 音感仪）— 山河水境：解放展开治疗领域 + 全队全伤害加深
  '穗穗': {
    hasHeavy: false,
    normalMult: () => 1.0,
    skillMult: () => 0.6,
    variationMult: () => 1.0,
    resolveBurstMult: () => ({ baseMain: 0, baseSide: 0 }),
    skipGenericBurstHeal: () => true,
    // 共鸣技能·醒春潮：全队治疗（润物/春生简化）
    onSkill: (self, ctx) => {
      const battle = ctx?.battle;
      if (!battle) return;
      const healUp = 1 + (self.healBonus || 0);
      const baseHeal = Math.round((self.hpMax || self.hp) * 0.05 * healUp);
      battle.team.forEach(t => {
        if (!t.alive) return;
        const healUpT = (t.buffs || []).reduce((a, b) => b.type === 'healUp' ? a + (b.value || 0) : a, 0);
        const finalHeal = Math.round(baseHeal * (1 + healUpT));
        const healed = Math.min(t.hpMax - t.hp, finalHeal);
        t.hp += healed;
        if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed, msg: '醒春潮治疗' });
      });
    },
    // 共鸣解放·康衢之谣：展开山河水境 4 回合（立即回血 + 每回合回血 + 全队全伤害加深 25%）
    onBurst: (self, ctx) => {
      const battle = ctx?.battle;
      if (!battle) return;
      const healUp = 1 + (self.healBonus || 0);
      const hot = Math.round(((self.hpMax || self.hp) * 0.05 + self.atk * 0.5) * healUp);
      // 展开立即回一跳
      battle.team.forEach(t => {
        if (!t.alive) return;
        const healUpT = (t.buffs || []).reduce((a, b) => b.type === 'healUp' ? a + (b.value || 0) : a, 0);
        const finalHeal = Math.round(hot * (1 + healUpT));
        const healed = Math.min(t.hpMax - t.hp, finalHeal);
        t.hp += healed;
        if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed, msg: '山河水境展开回复' });
      });
      pushTeamBuffs(self, battle, [
        { type: 'healOverTime', value: hot, duration: 4, src: '山河水境', scope: 'team' },
        { type: 'allDmgUp', value: 0.25, duration: 4, src: '山河水境·渌水盈盈', scope: 'team' },
      ]);
      battle.log.push({ type: 'mechanic', src: self.name, msg: '山河水境展开：全队每回合治疗 + 全伤害加深 25%（4 回合）' });
    },
  },
};

const FULL = {
  '忌炎': jiyan, '守岸人': shorekeeper, '吟霖': yinlin, '安可': encore, '卡提希娅': cartethyia,
  '今汐': jinhsi, '长离': changli, '椿': camellia, '珂莱塔': carlotta, '菲比': phoebe,
  '布兰特': brant, '坎特蕾拉': cantarella, '卡卡罗': kakaro, '折枝': zhezhi, '赞妮': zanyan,
  '弗洛洛': frolo,
  '仇远': chouyuan,
  '千咲': qianxiao,
  '奥古斯塔': aogusita,
  '夏空': xiakong,
  '尤诺': younuo,
  '露帕': lupa,
  '嘉贝莉娜': gaberina,
  '散华': sanhua
};

const ALL = { ...LIGHTWEIGHT, ...FULL };

export function getCharacterMechanic(roleName) {
  return ALL[roleName] || null;
}

export function hasHeavyAttack(roleName) {
  return !!getCharacterMechanic(roleName)?.hasHeavy;
}

export function renderCharacterBattleStatus(unit) {
  const render = getCharacterMechanic(unit?.name)?.renderBattleStatus;
  return render ? render(unit) : '';
}

// 统一徽章收集：返回角色专属资源 badge 数组（供战斗 UI 卡片下方状态行使用）
export function collectCharacterBadges(unit) {
  const collect = getCharacterMechanic(unit?.name)?.collectBadges;
  if (typeof collect !== 'function') return [];
  return collect(unit) || [];
}

// 通用调派：避免 combat.js 直接 import 各角色模块
export function fireCharacterHook(self, hookName, ctx) {
  const fn = getCharacterMechanic(self.name)?.[hookName];
  if (typeof fn === 'function') fn(self, ctx);
}

// 直查模式：返回值型 hook（resolveCost / inMindEye / mindEyeForm 等）通过这里查询
// 调用方无需 import 角色模块，也无需写 `if (self.name === 'X')` 硬编码
export function queryCharacterHook(self, hookName, ...args) {
  const fn = getCharacterMechanic(self.name)?.[hookName];
  return typeof fn === 'function' ? fn(self, ...args) : undefined;
}
