// 声骸养成动作：生成 / 装备 / 卸下 / 升级 / 分解
// 核心原则：不实现声骸主动技能，纯粹作为数据加成工具
import { S, msg, pick } from '../state.js';
import { ECHO_CATALOG, ECHO_SETS, MAIN_STAT_POOL, SUB_STAT_POOL, LEVEL_EXP, MAX_LEVEL_EXP, getEchoById, getSetById } from '../data/echoes.js';
import { totalExp, consumeExp } from './actions.js';

// 数据坞等级 → COST 上限映射
// 默认 8 级 = COST 12，满级 10 = COST 12（鸣潮官方 21 级满 = COST 12）
// 模拟器简化为 8/9/10 三档对应 11/12/12
export function dataBankCostCap(level) {
  if (level >= 9) return 12;
  if (level >= 8) return 12;
  if (level >= 7) return 11;
  return 10 + Math.floor(level / 3);
}

function rand(min, max) { return Math.random() * (max - min) + min; }

// 副词条数值随机：浮点型（暴击/攻击%/元素伤等）原样保留精度，固定值型（攻击固定/生命固定等）取整
const FLOAT_STAT_KEYS = new Set(['crate', 'cdmg', 'atk_pct', 'hp_pct', 'def_pct', 'resonance_efficiency', 'normal_atk_dmg', 'skill_dmg', 'burst_dmg', 'heavy_dmg']);
function randomStatValue(def) {
  const v = rand(def.min, def.max);
  return FLOAT_STAT_KEYS.has(def.key) ? Math.round(v * 1000) / 1000 : Math.round(v);
}

// 生成新声骸
// cost 决定主词条池，元素决定 COST3 属性词条池
export function generateEcho(echoId) {
  const data = typeof echoId === 'string' ? getEchoById(echoId) : echoId;
  if (!data) return null;
  const mainPool = MAIN_STAT_POOL[data.cost];
  if (!mainPool) return null;

  // COST3 主词条：优先选与声骸元素一致的属性伤害，未命中则全池随机
  let mainPoolFiltered = mainPool;
  if (data.cost === 3 && data.element) {
    const elemKey = {
      '热熔': 'elem_dmg_fire', '导电': 'elem_dmg_thunder',
      '冷凝': 'elem_dmg_frost', '气动': 'elem_dmg_wind',
      '衍射': 'elem_dmg_spectro', '湮灭': 'elem_dmg_havoc'
    }[data.element];
    if (elemKey && mainPool.some(s => s.key === elemKey)) {
      // 50% 概率用元素伤，否则随机
      if (Math.random() < 0.5) {
        mainPoolFiltered = [mainPool.find(s => s.key === elemKey)];
      }
    }
  }
  const mainDef = pick(mainPoolFiltered);

  // 副词条：金色声骸共 5 个槽位，初始 0 条解锁，每升 5 级（5/10/15/20/25）解锁 1 条
  // 数值在 min~max 间随机；未解锁槽位 unlocked=false，UI 渲染为 ??? 占位
  // 升级到 5/10/15/20/25 时激活下一个未解锁槽位
  const TOTAL_SUBS = 5;
  const INIT_UNLOCKED = 0;
  const subKeys = new Set();
  const subPool = SUB_STAT_POOL.slice();
  while (subKeys.size < TOTAL_SUBS && subPool.length) {
    const idx = Math.floor(Math.random() * subPool.length);
    subKeys.add(subPool[idx].key);
    subPool.splice(idx, 1);
  }
  const subStats = [...subKeys].map((k, i) => {
    const def = SUB_STAT_POOL.find(s => s.key === k);
    const value = randomStatValue(def);
    return { key: def.key, label: def.label, value, locked: false, unlocked: i < INIT_UNLOCKED };
  });

  // set 字段可能是数组（鸣钟之龟），用第一项作为主套装
  const setId = Array.isArray(data.set) ? data.set[0] : data.set;

  const echo = {
    id: S.echoNextId++,
    catalogId: data.id,
    name: data.name,
    cost: data.cost,
    set: setId,
    element: data.element,
    level: 1,
    exp: 0,
    mainStat: { key: mainDef.key, label: mainDef.label, value: mainDef.value },
    subStats,
    lock: false,
    equippedBy: null,
    equipSlot: null
  };
  S.echos.push(echo);
  return echo;
}

// 计算指定角色已装备声骸总 COST
export function calcTotalCost(roleName) {
  const r = S.roles[roleName];
  if (!r || !Array.isArray(r.equipEchoes)) return 0;
  return r.equipEchoes.reduce((sum, id) => {
    if (id == null) return sum;
    const e = S.echos.find(x => x.id === id);
    return sum + (e ? e.cost : 0);
  }, 0);
}

// 装备声骸到角色第 slot 格（0-4）
export function equipEcho(roleName, slot, echoId) {
  const role = S.roles[roleName];
  const echo = S.echos.find(e => e.id === echoId);
  if (!role || !echo) return { ok: false, err: '数据缺失' };
  if (echo.equippedBy && echo.equippedBy !== roleName) {
    return { ok: false, err: '该声骸已被其他角色装备' };
  }
  if (!Array.isArray(role.equipEchoes)) role.equipEchoes = [null, null, null, null, null];
  if (slot < 0 || slot > 4) return { ok: false, err: '槽位非法' };

  // 若该声骸已装备在本角色其他槽位，先清掉原槽位，避免同一声骸出现在两个槽位
  if (echo.equippedBy === roleName && echo.equipSlot != null && echo.equipSlot !== slot) {
    role.equipEchoes[echo.equipSlot] = null;
  }

  // 计算装备后总 COST（扣除本槽位旧声骸 + 当前声骸若已在别槽的 cost 重复算一次要扣掉）
  const oldEchoId = role.equipEchoes[slot];
  const oldCost = oldEchoId != null ? (S.echos.find(e => e.id === oldEchoId)?.cost || 0) : 0;
  // 已在本角色其他槽位时，calcTotalCost 已计入 echo.cost，需扣除避免重复
  const selfAlreadyEquipped = echo.equippedBy === roleName;
  const newTotal = calcTotalCost(roleName) - oldCost - (selfAlreadyEquipped ? echo.cost : 0) + echo.cost;
  const cap = dataBankCostCap(S.dataBankLevel);
  if (newTotal > cap) {
    return { ok: false, err: `总 COST ${newTotal} 超过上限 ${cap}` };
  }

  // 卸下旧槽位
  if (oldEchoId != null && oldEchoId !== echoId) {
    const old = S.echos.find(e => e.id === oldEchoId);
    if (old) { old.equippedBy = null; old.equipSlot = null; }
  }
  role.equipEchoes[slot] = echoId;
  echo.equippedBy = roleName;
  echo.equipSlot = slot;
  return { ok: true };
}

// 卸下指定声骸
export function unequipEcho(echoId) {
  const echo = S.echos.find(e => e.id === echoId);
  if (!echo || !echo.equippedBy) return false;
  const role = S.roles[echo.equippedBy];
  if (role && Array.isArray(role.equipEchoes) && role.equipEchoes[echo.equipSlot] === echoId) {
    role.equipEchoes[echo.equipSlot] = null;
  }
  echo.equippedBy = null;
  echo.equipSlot = null;
  return true;
}

// 卸下角色某槽位
export function unequipSlot(roleName, slot) {
  const role = S.roles[roleName];
  if (!role || !Array.isArray(role.equipEchoes)) return false;
  const id = role.equipEchoes[slot];
  if (id == null) return false;
  const echo = S.echos.find(e => e.id === id);
  if (echo) { echo.equippedBy = null; echo.equipSlot = null; }
  role.equipEchoes[slot] = null;
  return true;
}

// 获取可装备的声骸（未装备或已装备给本角色）
export function getEquippableEchoes(roleName) {
  return S.echos.filter(e => !e.equippedBy || e.equippedBy === roleName);
}

// 升级声骸到下一级
export function echoToNext(echo) {
  const lv = echo.level || 1;
  if (lv >= 25) return Infinity;
  const phase = LEVEL_EXP.find(p => lv >= p.from && lv < p.to);
  if (!phase) return Infinity;
  // 按等级线性分摊该阶段总经验
  const stepExp = Math.ceil(phase.exp / (phase.to - phase.from));
  return stepExp;
}

// 升级一次（消耗经验书）
export function levelUpEcho(echoId) {
  const echo = S.echos.find(e => e.id === echoId);
  if (!echo) return false;
  if (echo.level >= 25) { msg('声骸已满级'); return false; }
  const cost = echoToNext(echo);
  if (totalExp() < cost) {
    msg(`经验不足（需 ${cost.toLocaleString()}）`);
    return false;
  }
  consumeExp(cost);
  echo.level++;
  echo.exp += cost;
  // 每 5 级（5/10/15/20/25）激活下一个未解锁副词条槽位
  if (echo.level % 5 === 0) {
    const nextLocked = echo.subStats.find(s => !s.unlocked);
    if (nextLocked) nextLocked.unlocked = true;
  }
  return true;
}

// 一键升满
export function levelUpEchoMax(echoId) {
  const echo = S.echos.find(e => e.id === echoId);
  if (!echo) return 0;
  let count = 0;
  while (echo.level < 25) {
    const cost = echoToNext(echo);
    if (totalExp() < cost) break;
    if (!levelUpEcho(echoId)) break;
    count++;
  }
  return count;
}

// 分解声骸：返还部分经验 + 调谐器
// 已投入经验按 75% 返还（接近官方返还比例，向下取整到 20000 经验 / 1 特级促剂）
// 未升级（无投入经验）时按 COST 档给基础经验瓶，避免分解空手而归
// 调谐器返还：COST4=3 / COST3=2 / COST1=1，已升级声骸额外 +1（每 10 级）
const ECHO_BASE_EXP_REFUND = { 1: { exp_mid: 1 }, 3: { exp_high: 1 }, 4: { exp_super: 1 } };
const ECHO_TUNER_REFUND = { 1: 1, 3: 2, 4: 3 };
export function recycleEcho(echoId) {
  const echo = S.echos.find(e => e.id === echoId);
  if (!echo) return false;
  if (echo.equippedBy) { msg('已装备的声骸无法分解'); return false; }
  if (echo.lock) { msg('已锁定的声骸无法分解'); return false; }
  const parts = [];
  if (echo.exp > 0) {
    const refund = Math.floor(echo.exp * 0.8 / 20000);
    if (refund > 0) {
      S.materials.exp_super = (S.materials.exp_super || 0) + refund;
      parts.push(`特级共鸣促剂 ×${refund}`);
    }
  } else {
    const base = ECHO_BASE_EXP_REFUND[echo.cost] || { exp_low: 1 };
    for (const [k, n] of Object.entries(base)) {
      S.materials[k] = (S.materials[k] || 0) + n;
    }
    const label = base.exp_super ? '特级共鸣促剂' : base.exp_high ? '高级共鸣促剂' : base.exp_mid ? '中级共鸣促剂' : '初级共鸣促剂';
    parts.push(`${label} ×${Object.values(base)[0]}`);
  }
  const tunerBase = ECHO_TUNER_REFUND[echo.cost] || 1;
  const tunerBonus = Math.floor((echo.level || 1) / 10);
  const tunerTotal = tunerBase + tunerBonus;
  if (tunerTotal > 0) {
    S.materials.echo_tuner = (S.materials.echo_tuner || 0) + tunerTotal;
    parts.push(`声骸调谐器 ×${tunerTotal}`);
  }
  msg('返还 ' + parts.join(' · '), false);
  S.echos = S.echos.filter(e => e.id !== echoId);
  return true;
}

// 锁定/解锁
export function toggleEchoLock(echoId) {
  const echo = S.echos.find(e => e.id === echoId);
  if (!echo) return false;
  echo.lock = !echo.lock;
  return true;
}

// 调谐：重 roll 单个已解锁副词条的数值（不换词条类型）
// 官方机制：消耗 1 调谐器，词条类型不变，数值在 min~max 范围内重新随机
export function retuneEchoSubStat(echoId, subIdx) {
  const echo = S.echos.find(e => e.id === echoId);
  if (!echo) return { ok: false, err: '声骸不存在' };
  const sub = echo.subStats?.[subIdx];
  if (!sub) return { ok: false, err: '副词条不存在' };
  if (sub.unlocked === false) return { ok: false, err: '副词条未解锁' };
  if ((S.materials.echo_tuner || 0) < 1) return { ok: false, err: '调谐器不足' };
  const def = SUB_STAT_POOL.find(s => s.key === sub.key);
  if (!def) return { ok: false, err: '词条定义缺失' };
  S.materials.echo_tuner -= 1;
  const oldVal = sub.value;
  sub.value = randomStatValue(def);
  return { ok: true, oldVal, newVal: sub.value, label: sub.label };
}