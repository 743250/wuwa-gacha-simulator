// 体力系统 + 体力药剂
import { S, msg } from '../state.js';

const RECOVER_MS = 6 * 60 * 1000; // 6 分钟/点（模拟器加速后通过时间推进补满）

export function tickStamina() {
  // 不用真实时钟，日期推进时自动补满
}

export function spendStamina(cost) {
  if (S.stamina < cost) return false;
  S.stamina -= cost;
  return true;
}

export function refillStamina() {
  S.stamina = S.staminaMax;
}

// 体力药剂配置（官方名：结晶溶剂 / Crystal Solvent，单档 +60）
// 来源：https://wutheringwaves.fandom.com/wiki/Crystal_Solvent
// 模拟器简化：使用后直接加体力，可超过 staminaMax（最多到 480）
export const POTION_CAP = 480;

export const POTIONS = {
  crystal_solvent: {
    id: 'crystal_solvent',
    name: '结晶溶剂',
    value: 60,
    desc: '使用后回复 60 点结晶波片'
  }
};

// 使用药剂
export function usePotion(potionId, count = 1) {
  const p = POTIONS[potionId];
  if (!p) return { ok: false, err: '未知药剂' };
  const have = S.materials[potionId] || 0;
  if (have < count) return { ok: false, err: `药剂不足（持有 ${have}）` };
  S.materials[potionId] = have - count;
  const gained = p.value * count;
  S.stamina = Math.min(POTION_CAP, S.stamina + gained);
  return { ok: true, gained };
}

// 一键嗑光所有药剂
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
