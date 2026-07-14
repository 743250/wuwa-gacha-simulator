// 体力系统 + 结晶单质 / 结晶溶剂
//
// 官方（鸣潮）：
//   1. 结晶单质（Waveplate Crystal）：波片自然恢复溢出时 1:1 压缩存储
//      - 使用时 1 点单质 → 1 点结晶波片（兑回，不可超 staminaMax）
//      - 持有上限约 480
//   2. 结晶溶剂（Crystal Solvent）：真正的体力药
//      - 使用后 +60 结晶波片（可临时超过 staminaMax，模拟器上探到 POTION_CAP）
//      - 持有无实质硬顶（模拟器不 cap）
//   3. 60 星声直接换 60 波片（紧急补救）
//
// 历史错误：曾把单质误做成「凝缩波片 +60 / 上限 5」的第二种药。
import { S } from '../state.js';
import { progressTask } from '../podcast/core.js';
import { commit } from '../state/commit.ts';

export const POTION_CAP = 480;
export const WAVEPLATE_CRYSTAL_CAP = 480;
/** @deprecated 旧名，等于 WAVEPLATE_CRYSTAL_CAP */
export const CONDENSED_CAP = WAVEPLATE_CRYSTAL_CAP;

export const STAMINA_BUY_COST = 60;
export const STAMINA_BUY_VALUE = 60;

export const POTIONS = {
  waveplate_crystal: {
    id: 'waveplate_crystal',
    name: '结晶单质',
    kind: 'crystal',
    value: 1,
    desc: '溢出结晶波片的压缩存储 · 1 点单质兑换 1 点波片（兑至体力上限）',
    hardCap: WAVEPLATE_CRYSTAL_CAP
  },
  crystal_solvent: {
    id: 'crystal_solvent',
    name: '结晶溶剂',
    kind: 'potion',
    value: 60,
    desc: '使用后回复 60 点结晶波片（可临时超过日常上限）',
    hardCap: null
  }
};

// 兼容旧 id：存档迁移前若有残留调用，映射到结晶单质
const ID_ALIASES = {
  condensed_waveplate: 'waveplate_crystal'
};

function resolvePotionId(id) {
  return ID_ALIASES[id] || id;
}

export function tickStamina() {
  // 不用真实时钟，日期推进时结算溢出 → 单质
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

/** 发放结晶单质（受 WAVEPLATE_CRYSTAL_CAP 截断），返回实际入账数量 */
export function grantWaveplateCrystal(count) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (!n) return 0;
  if (!S.materials) S.materials = {};
  const cur = S.materials.waveplate_crystal || 0;
  const next = Math.min(WAVEPLATE_CRYSTAL_CAP, cur + n);
  const gained = next - cur;
  S.materials.waveplate_crystal = next;
  return gained;
}

/** @deprecated 旧 API 名 → grantWaveplateCrystal */
export function grantCondensedWaveplate(count) {
  // 旧调用按「个数」发药（每个约 60 体）；新体系按点数，兼容：count 视作点数
  return grantWaveplateCrystal(count);
}

/**
 * 推进 days 天时的自然恢复结算：
 * - 体力未满：先补到 staminaMax，剩余恢复量转为结晶单质
 * - 体力已满或超充：当日恢复量全部转为结晶单质
 * - 超充（> staminaMax）本身不因跨日下降
 */
export function applyNaturalRecovery(daysPassed) {
  const days = Math.max(0, Math.floor(Number(daysPassed) || 0));
  if (!days) return { filled: 0, crystal: 0 };
  const recover = days * (S.staminaMax || 240);
  if (S.stamina >= S.staminaMax) {
    const crystal = grantWaveplateCrystal(recover);
    return { filled: 0, crystal };
  }
  const room = S.staminaMax - S.stamina;
  const filled = Math.min(room, recover);
  S.stamina += filled;
  const overflow = recover - filled;
  const crystal = overflow > 0 ? grantWaveplateCrystal(overflow) : 0;
  return { filled, crystal };
}

/**
 * 使用药剂 / 兑换单质
 * - crystal_solvent: count = 个数，每个 +60，可超充到 POTION_CAP
 * - waveplate_crystal: count = 兑换点数（1:1），只补到 staminaMax
 */
export function usePotion(potionId, count = 1) {
  return commit(() => {
    const id = resolvePotionId(potionId);
    const p = POTIONS[id];
    if (!p) return { ok: false, err: '未知药剂' };
    const n = Math.max(1, Math.floor(Number(count) || 1));
    const have = S.materials[id] || 0;

    if (p.kind === 'crystal') {
      if (have <= 0) return { ok: false, err: `${p.name}不足（持有 ${have}）` };
      if (S.stamina >= S.staminaMax) {
        return { ok: false, err: '结晶波片已满，单质仅可兑至日常上限' };
      }
      const room = S.staminaMax - S.stamina;
      const take = Math.min(n, have, room);
      if (take <= 0) return { ok: false, err: '无法兑换' };
      S.materials[id] = have - take;
      S.stamina += take;
      return { ok: true, gained: take, kind: 'crystal' };
    }

    // potion
    if (have < n) return { ok: false, err: `${p.name}不足（持有 ${have}）` };
    S.materials[id] = have - n;
    const gained = p.value * n;
    S.stamina = Math.min(POTION_CAP, S.stamina + gained);
    return { ok: true, gained, kind: 'potion' };
  });
}

/** 一键：先兑满单质到日常上限，再嗑光溶剂（可超充） */
export function useAllPotions() {
  return commit(() => {
    let totalGained = 0;

    // 1) 结晶单质 1:1 兑到 staminaMax
    const crystalHave = S.materials.waveplate_crystal || 0;
    if (crystalHave > 0 && S.stamina < S.staminaMax) {
      const take = Math.min(crystalHave, S.staminaMax - S.stamina);
      S.materials.waveplate_crystal = crystalHave - take;
      S.stamina += take;
      totalGained += take;
    }

    // 2) 溶剂全嗑，可超充
    const solv = POTIONS.crystal_solvent;
    const solvHave = S.materials.crystal_solvent || 0;
    if (solvHave > 0) {
      const gained = solv.value * solvHave;
      S.materials.crystal_solvent = 0;
      S.stamina = Math.min(POTION_CAP, S.stamina + gained);
      totalGained += gained;
    }

    return totalGained;
  });
}

export function buyStaminaWithAstrite() {
  return commit(() => {
    if (S.astrite < STAMINA_BUY_COST) {
      return { ok: false, err: `星声不足（需 ${STAMINA_BUY_COST}）` };
    }
    if (S.stamina >= POTION_CAP) {
      return { ok: false, err: '体力已达上限' };
    }
    S.astrite -= STAMINA_BUY_COST;
    S.stamina = Math.min(POTION_CAP, S.stamina + STAMINA_BUY_VALUE);
    return { ok: true, gained: STAMINA_BUY_VALUE };
  });
}
