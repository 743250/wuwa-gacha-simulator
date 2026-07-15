// 今汐「韶光层数」爆发型主C
//
//   技能 +1 / 解放 +2 / 变奏 +2 韶光（上限 4）；满层下次技能 = 惊龙破空 ×effectMult（基 1.8，6 链 FORTE_BOOST）
//   3 链谪仙：变奏入场 atk +50%（registry 占位 jinhsiZheXian）
//   4 链：惊龙破空或解放后全队 allDmgUp +20% · 2 回合（registry 占位 jinhsiTeamAllDmg）

import { registerSwitchHook } from '../switchHooks.js';

const SRC_C4 = '自甘佑凡尘';
const C4_ALL_DMG = 0.20;
const C4_TURNS = 2;

function applyC4TeamAllDmg(self, battle, source) {
  if (!self.jinhsiTeamAllDmg || !battle) return;
  battle.team.forEach(t => {
    if (!t.alive) return;
    t.buffs = (t.buffs || []).filter(b => b.src !== SRC_C4);
    t.buffs.push({
      type: 'allDmgUp',
      value: C4_ALL_DMG,
      duration: C4_TURNS + 1,
      src: SRC_C4,
      installer: self.idx
    });
  });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `${source} · 全队全伤害 +${(C4_ALL_DMG * 100).toFixed(0)}%（${C4_TURNS} 回合）`
  });
}

export function jinhsiSwitchIn(self, battle) {
  if (self.name !== '今汐') return;
  if (self.jinhsiZheXian) {
    self.buffs = (self.buffs || []).filter(b => b.src !== '谪仙');
    self.buffs.push({ type: 'atkUp', value: 0.50, duration: 21, src: '谪仙' });
    battle.log.push({ type: 'mechanic', src: self.name, msg: '谪仙 · 攻击 +50%' });
  }
  if (self.forte && self.forte.resourceName === '韶光层数') {
    self.forte.current = Math.min(self.forte.max, self.forte.current + 2);
    if (self.forte.current >= self.forte.max) self.forte.ready = true;
  }
}

export function jinhsiOnSkill(self, ctx) {
  if (self.name !== '今汐') return;
  // actions 传入 forteEnh：满韶光惊龙破空时非 null
  if (ctx?.forteEnh) applyC4TeamAllDmg(self, ctx.battle, '惊龙破空');
}

export function jinhsiOnBurst(self, ctx) {
  if (self.name !== '今汐') return;
  applyC4TeamAllDmg(self, ctx?.battle, '移岁诛邪');
}

// 2 链：不在场时每回合结束 +1 韶光
export function jinhsiTurnCleanup(self, ctx) {
  if (self.name !== '今汐' || !self.jinhsiC2OffstageShaoguang) return;
  const battle = ctx?.battle;
  if (!battle || !self.alive) return;
  if (battle.team[battle.active] === self) return;
  if (!self.forte || self.forte.resourceName !== '韶光层数') return;
  const gain = self.jinhsiC2OffstageShaoguang || 1;
  const before = self.forte.current || 0;
  self.forte.current = Math.min(self.forte.max, before + gain);
  if (self.forte.current >= self.forte.max) self.forte.ready = true;
  if (self.forte.current !== before) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `绒雪凝屏息 · 离场韶光 +${gain}（${before} → ${self.forte.current}/${self.forte.max}）`
    });
  }
}

// Phase 3 倍率：流光 160% / 惊龙 = skillMult × effectMult(3.0) = 480% / 解放 1000%/500%
export function jinhsiNormalMult(self) {
  return self.name === '今汐' ? 1.1 : null;
}
export function jinhsiSkillMult(self) {
  return self.name === '今汐' ? 1.6 : null;
}
export function jinhsiHeavyMult(self) {
  return self.name === '今汐' ? 4.0 : null;
}
export function jinhsiVariationMult(self) {
  return self.name === '今汐' ? 1.6 : null;
}
export function jinhsiResolveBurstMult(self) {
  if (self.name !== '今汐') return null;
  return { baseMain: 10.0, baseSide: 5.0 };
}

registerSwitchHook('今汐', ({ to, battle }) => jinhsiSwitchIn(to, battle));

export default {
  name: '今汐',
  hasHeavy: true,
  switchIn: jinhsiSwitchIn,
  onSkill: jinhsiOnSkill,
  onBurst: jinhsiOnBurst,
  turnCleanup: jinhsiTurnCleanup,
  normalMult: jinhsiNormalMult,
  skillMult: jinhsiSkillMult,
  heavyMult: jinhsiHeavyMult,
  variationMult: jinhsiVariationMult,
  resolveBurstMult: jinhsiResolveBurstMult
};
