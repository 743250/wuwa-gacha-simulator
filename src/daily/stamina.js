// 体力系统 + 体力药剂
//
// 鸣潮官方有两个独立"体力补充"道具：
//   1. 凝缩波片（Condensed Waveplate）：上限 5，每个 = 60 波片
//      - 来自日常上线/联合等级奖励/部分活动
//      - 满 5 个时不再产生（防囤积）→ 模拟器以 cap=5 实现
//   2. 结晶溶剂（Crystal Solvent）：上限无（实际无 cap）
//      - 来自周本/活动/月卡/通行证
//      - 单个 = 60 波片
//
// 此外鸣潮还允许 60 星声直接换 60 波片（紧急补救通道，QoL）
//
// 模拟器：体力上限 240，使用药剂可临时上探到 480（POTION_CAP）
import { S, msg } from '../state.js';
import { progressTask } from '../podcast/core.js';

const RECOVER_MS = 6 * 60 * 1000; // 6 分钟/点（模拟器通过推日补满）

export function tickStamina() {
  // 不用真实时钟，日期推进时自动补满
}

export function spendStamina(cost) {
  if (S.stamina < cost) return false;
  S.stamina -= cost;
  progressTask('d_stamina', cost);
  return true;
}

export function refillStamina() {
  S.stamina = S.staminaMax;
}

// 药剂上限：使用后可超过 staminaMax，但不超过 POTION_CAP
export const POTION_CAP = 480;
// 凝缩波片"持有上限"：官方就是 5
export const CONDENSED_CAP = 5;

export const POTIONS = {
  condensed_waveplate: {
    id: 'condensed_waveplate',
    name: '凝缩波片',
    value: 60,
    desc: '使用后回复 60 点结晶波片',
    hardCap: CONDENSED_CAP
  },
  crystal_solvent: {
    id: 'crystal_solvent',
    name: '结晶溶剂',
    value: 60,
    desc: '使用后回复 60 点结晶波片',
    hardCap: null
  }
};

// 使用药剂
export function usePotion(potionId, count = 1) {
  const p = POTIONS[potionId];
  if (!p) return { ok: false, err: '未知药剂' };
  const have = S.materials[potionId] || 0;
  if (have < count) return { ok: false, err: `${p.name}不足（持有 ${have}）` };
  S.materials[potionId] = have - count;
  const gained = p.value * count;
  S.stamina = Math.min(POTION_CAP, S.stamina + gained);
  return { ok: true, gained };
}

// 一键嗑光所有药剂（凝缩 + 溶剂都用）
export function useAllPotions() {
  let totalGained = 0;
  Object.values(POTIONS).forEach(p => {
    const have = S.materials[p.id] || 0;
    if (have > 0) {
      const gained = p.value * have;
      S.materials[p.id] = 0;
      totalGained += gained;
    }
  });
  S.stamina = Math.min(POTION_CAP, S.stamina + totalGained);
  return totalGained;
}

// 60 星声直接补 60 波片（鸣潮的紧急补救通道）
export const STAMINA_BUY_COST = 60;
export const STAMINA_BUY_VALUE = 60;

export function buyStaminaWithAstrite() {
  if (S.astrite < STAMINA_BUY_COST) {
    return { ok: false, err: `星声不足（需 ${STAMINA_BUY_COST}）` };
  }
  if (S.stamina >= POTION_CAP) {
    return { ok: false, err: '体力已达上限' };
  }
  S.astrite -= STAMINA_BUY_COST;
  S.stamina = Math.min(POTION_CAP, S.stamina + STAMINA_BUY_VALUE);
  return { ok: true, gained: STAMINA_BUY_VALUE };
}

// 奖励发放时给凝缩波片：受 5 个 cap
export function grantCondensedWaveplate(count) {
  const cur = S.materials.condensed_waveplate || 0;
  const newAmt = Math.min(CONDENSED_CAP, cur + count);
  const actualGained = newAmt - cur;
  S.materials.condensed_waveplate = newAmt;
  return actualGained; // 真实拿到的数量（可能因 cap 被截掉）
}
