// 声骸养成动作：生成 / 装备 / 卸下 / 升级 / 分解
// 核心原则：不实现声骸主动技能，纯粹作为数据加成工具
import { S, msg, pick } from '../state.js';
import { ECHO_CATALOG, ECHO_SETS, MAIN_STAT_POOL, SUB_STAT_POOL, LEVEL_EXP, MAX_LEVEL_EXP, getEchoById, getSetById, mainStatAtLevel, ECHO_MAX_LEVEL } from '../data/echoes.js';
import { totalExp, consumeExp } from './actions.js';
import { EXP_VALUES } from '../battle/stats.js';
import { progressTask } from '../podcast/core.js';

// 声骸 COST 上限：固定 12（满配 4+4+3+1）
// 注：官方有数据坞等级系统逐步开放 COST 上限，模拟器取消该养成线，直接给满配
export const ECHO_COST_CAP = 12;

function rand(min, max) { return Math.random() * (max - min) + min; }

// 副词条数值随机：浮点型（暴击/攻击%/元素伤等）原样保留精度，固定值型（攻击固定/生命固定等）取整
const FLOAT_STAT_KEYS = new Set(['crate', 'cdmg', 'atk_pct', 'hp_pct', 'def_pct', 'resonance_efficiency', 'normal_atk_dmg', 'skill_dmg', 'burst_dmg', 'heavy_dmg']);
function randomStatValue(def) {
  const v = rand(def.min, def.max);
  return FLOAT_STAT_KEYS.has(def.key) ? Math.round(v * 1000) / 1000 : Math.round(v);
}

// 生成新声骸
// cost 决定主词条池，元素决定 COST3 属性词条池
// preferSetId：声骸可属多套装时优先归属的套装 id（无音区按目标套装掉落用）；
//   仅当该 id 确实在声骸的 set 列表内才生效，否则回退首位套装
export function generateEcho(echoId, preferSetId = null) {
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

  // set 字段可能是数组（多套装声骸），默认取首位；
  // 若传入 preferSetId 且该声骸确实归属此套装，则优先归到目标套装（修掉落归属错位）
  const setList = Array.isArray(data.set) ? data.set : [data.set];
  const setId = (preferSetId && setList.includes(preferSetId)) ? preferSetId : setList[0];

  const echo = {
    id: S.echoNextId++,
    catalogId: data.id,
    name: data.name,
    cost: data.cost,
    set: setId,
    element: data.element,
    level: 1,
    exp: 0,
    mainStat: { key: mainDef.key, label: mainDef.label, value: mainStatAtLevel(mainDef, 1), maxValue: mainDef.value },
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
  const cap = ECHO_COST_CAP;
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
  // 旧存档兼容：回填 maxValue（按 COST + 主词条类型查 MAIN_STAT_POOL）
  if (echo.mainStat && echo.mainStat.maxValue == null) {
    const pool = MAIN_STAT_POOL[echo.cost];
    const def = pool && pool.find(s => s.key === echo.mainStat.key);
    if (def) echo.mainStat.maxValue = def.value;
  }
  const cost = echoToNext(echo);
  if (totalExp() < cost) {
    msg(`经验不足（需 ${cost.toLocaleString()}）`);
    return false;
  }
  consumeExp(cost);
  echo.level++;
  echo.exp += cost;
  // 主词条随等级线性上涨（占位公式：满级值 × Lv/25）
  if (echo.mainStat && echo.mainStat.maxValue != null) {
    echo.mainStat.value = mainStatAtLevel({ value: echo.mainStat.maxValue }, echo.level);
  }
  // 每 5 级（5/10/15/20/25）激活下一个未解锁副词条槽位
  if (echo.level % 5 === 0) {
    const nextLocked = echo.subStats.find(s => !s.unlocked);
    if (nextLocked) nextLocked.unlocked = true;
  }
  // 电台任务：声骸升级（一键满级/喂料会循环调本函数，逐级累计）
  // d_upgrade 每日"升级角色/武器/声骸"；w_echo/p_echo 声骸累计升级次数
  progressTask('d_upgrade', 1);
  progressTask('w_echo', 1);
  progressTask('p_echo', 1);
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

// 喂料升级：把另一个声骸当作经验包，喂给目标声骸
// 被喂声骸的累计经验按 80% 折成特级共鸣促剂入账（与分解口径一致），目标声骸随后逐级消耗升级
// 不装、未锁定、自己不能喂自己；满级目标声骸拒绝；被喂声骸未升级时折算为 0（无经验产出）
// 返回 { ok, err, target, feed, exp_gained, levels_gained }
export function levelUpEchoWithFeed(targetId, feedId) {
  const target = S.echos.find(e => e.id === targetId);
  const feed = S.echos.find(e => e.id === feedId);
  if (!target || !feed) return { ok: false, err: '声骸不存在' };
  if (target.id === feed.id) return { ok: false, err: '不能把声骸喂给自己' };
  if (target.level >= 25) return { ok: false, err: '目标声骸已满级' };
  if (feed.equippedBy) return { ok: false, err: '被喂声骸已装备，无法作为材料' };
  if (feed.lock) return { ok: false, err: '被喂声骸已锁定，无法作为材料' };

  const expRefund = Math.floor(feed.exp * 0.8 / EXP_VALUES.exp_super);
  if (expRefund <= 0) {
    return { ok: false, err: '该声骸未投入经验，喂料无收益（请先分解或丢弃）' };
  }
  S.materials.exp_super = (S.materials.exp_super || 0) + expRefund;
  S.echos = S.echos.filter(e => e.id !== feedId);

  const beforeLevel = target.level;
  let levelsGained = 0;
  while (target.level < 25) {
    const cost = echoToNext(target);
    if (totalExp() < cost) break;
    if (!levelUpEcho(targetId)) break;
    levelsGained++;
  }
  return {
    ok: true,
    target: target.name,
    feed: feed.name,
    exp_gained: expRefund * EXP_VALUES.exp_super,
    exp_super_count: expRefund,
    levels_gained: levelsGained,
    final_level: target.level,
    level_cap_reached: target.level >= 25 && beforeLevel < 25
  };
}

// 预览喂料收益（不改变状态）
export function previewEchoFeed(targetId, feedId) {
  const target = S.echos.find(e => e.id === targetId);
  const feed = S.echos.find(e => e.id === feedId);
  if (!target || !feed) return { ok: false, err: '声骸不存在' };
  if (target.id === feedId) return { ok: false, err: '不能把声骸喂给自己' };
  if (target.level >= 25) return { ok: false, err: '目标声骸已满级' };
  if (feed.equippedBy) return { ok: false, err: '被喂声骸已装备，无法作为材料' };
  if (feed.lock) return { ok: false, err: '被喂声骸已锁定，无法作为材料' };
  const expRefund = Math.floor(feed.exp * 0.8 / EXP_VALUES.exp_super);
  if (expRefund <= 0) return { ok: false, err: '该声骸未投入经验，喂料无收益' };
  const expTotal = expRefund * EXP_VALUES.exp_super;
  // 估算能升几级
  let lvl = target.level;
  let expLeft = expTotal;
  let est = 0;
  while (lvl < 25 && expLeft > 0) {
    const phase = LEVEL_EXP.find(p => lvl >= p.from && lvl < p.to);
    if (!phase) break;
    const stepExp = Math.ceil(phase.exp / (phase.to - phase.from));
    if (expLeft < stepExp) break;
    expLeft -= stepExp;
    lvl++;
    est++;
  }
  return { ok: true, target: target.name, feed: feed.name, exp_gained: expTotal, exp_super_count: expRefund, est_levels: est, final_level: lvl };
}

// 分解声骸：返还部分经验 + 调谐器
// 已投入经验按 75% 返还（接近官方返还比例，向下取整到 20000 经验 / 1 特级促剂）
// 未升级（无投入经验）时按 COST 档给基础经验瓶，避免分解空手而归
// 调谐器返还：COST4=3 / COST3=2 / COST1=1，已升级声骸额外 +1（每 10 级）
// 返回结构化结果 { ok, err, returns: [{key,label,n}], parts: [string] }
//  - 不实际执行，仅在调用方确认后再 commit，预览用 previewRecycleEcho
const ECHO_BASE_EXP_REFUND = { 1: { exp_mid: 1 }, 3: { exp_high: 1 }, 4: { exp_super: 1 } };
const ECHO_TUNER_REFUND = { 1: 1, 3: 2, 4: 3 };

// 计算分解返还，不改变状态
export function previewRecycleEcho(echoId) {
  const echo = S.echos.find(e => e.id === echoId);
  if (!echo) return { ok: false, err: '声骸不存在' };
  if (echo.equippedBy) return { ok: false, err: '已装备的声骸无法分解' };
  if (echo.lock) return { ok: false, err: '已锁定的声骸无法分解' };

  const returns = [];
  if (echo.exp > 0) {
    const refund = Math.floor(echo.exp * 0.8 / 20000);
    if (refund > 0) returns.push({ key: 'exp_super', label: '特级共鸣促剂', n: refund });
  } else {
    const base = ECHO_BASE_EXP_REFUND[echo.cost] || { exp_low: 1 };
    const [[k, n]] = Object.entries(base);
    const label = base.exp_super ? '特级共鸣促剂' : base.exp_high ? '高级共鸣促剂' : base.exp_mid ? '中级共鸣促剂' : '初级共鸣促剂';
    returns.push({ key: k, label, n });
  }
  const tunerBase = ECHO_TUNER_REFUND[echo.cost] || 1;
  const tunerBonus = Math.floor((echo.level || 1) / 10);
  const tunerTotal = tunerBase + tunerBonus;
  if (tunerTotal > 0) returns.push({ key: 'echo_tuner', label: '声骸调谐器', n: tunerTotal });

  return { ok: true, returns };
}

// 执行分解（即旧 recycleEcho 行为，但返回 preview 同结构结果）
export function recycleEcho(echoId) {
  const preview = previewRecycleEcho(echoId);
  if (!preview.ok) { if (preview.err) msg(preview.err); return preview; }
  for (const r of preview.returns) {
    S.materials[r.key] = (S.materials[r.key] || 0) + r.n;
  }
  const parts = preview.returns.map(r => `${r.label} ×${r.n}`);
  msg('返还 ' + parts.join(' · '), false);
  S.echos = S.echos.filter(e => e.id !== echoId);
  return preview;
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