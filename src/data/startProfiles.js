// 开局入坑方式配置表
//
// 三种入坑方式 × 5 个版本档位的初始参数集中表。
// UI 层只调用 getTier / resolveProfile / collectUPTChars / collectUPTWeapons,
// 逻辑层调用 generateFillerPulls + applyStartSetup 组装 S.log。

import { phases } from './phases.js';
import { fourAll, fourWeapons, threeWeapons, weapons } from './chars.js';
import { DAY, fmt, pick } from '../state.js';

// 5 个版本档位的归属表
export const VERSION_TIERS = [
  { key: '1.0-1.2', versions: ['1.0', '1.1', '1.2'] },
  { key: '1.3-1.4', versions: ['1.3', '1.4'] },
  { key: '2.0-2.4', versions: ['2.0', '2.1', '2.2', '2.3', '2.4'] },
  { key: '2.5-2.8', versions: ['2.5', '2.6', '2.7', '2.8'] },
  { key: '3.0-3.4', versions: ['3.0', '3.1', '3.2', '3.3', '3.4'] },
];

// 新手入坑:无论选哪个版本都接近空号
export const NEWBIE = {
  astrite: 1600, stamina: 240, spent: 0, days: 0, chainMax: 0, logCount: 0, price: 0,
};

// 自抽号入坑:科技号刷深塔资源,星声 6-8 万,市场价 ¥40-50
// spent=0(没走官方充值,钱给卖家)
export const SELF_REROLL = {
  '1.0-1.2': { astrite: 60000, stamina: 240, spent: 0, days: 0, chainMax: 0, logCount: 0, price: 40 },
  '1.3-1.4': { astrite: 65000, stamina: 240, spent: 0, days: 0, chainMax: 0, logCount: 0, price: 45 },
  '2.0-2.4': { astrite: 70000, stamina: 240, spent: 0, days: 0, chainMax: 0, logCount: 0, price: 45 },
  '2.5-2.8': { astrite: 75000, stamina: 240, spent: 0, days: 0, chainMax: 0, logCount: 0, price: 50 },
  '3.0-3.4': { astrite: 80000, stamina: 240, spent: 0, days: 0, chainMax: 0, logCount: 0, price: 50 },
};

// 买号入坑:模拟一个"被玩到这个版本"的账号
// days = 账号累计登录天数(决定角色等级/武器/声骸累积进度,而非简单档位)
// price = 市场价(给卖家),spent = 账号官方充值累计
// logCount = 抽卡记录总数(按 days 推出来的"老玩家抽卡量")
// chainMax = 共鸣链最高(老号能堆起更高共鸣)
export const BUY_ACCOUNT = {
  '1.0-1.2': { astrite: 2000, stamina: 240, spent: 2000,  days: 30,  chainMax: 0, logCount: 60,   price: 200 },
  '1.3-1.4': { astrite: 3000, stamina: 240, spent: 5000,  days: 120, chainMax: 1, logCount: 240,  price: 500 },
  '2.0-2.4': { astrite: 5000, stamina: 240, spent: 12000, days: 270, chainMax: 2, logCount: 600,  price: 1200 },
  '2.5-2.8': { astrite: 8000, stamina: 240, spent: 18000, days: 420, chainMax: 3, logCount: 900,  price: 1800 },
  '3.0-3.4': { astrite: 12000, stamina: 240, spent: 25000, days: 600, chainMax: 6, logCount: 1400, price: 2500 },
};

export function getTier(versionId) {
  for (const t of VERSION_TIERS) {
    if (t.versions.includes(versionId)) return t.key;
  }
  return '1.0-1.2';
}

export function resolveProfile(type, versionId) {
  const tierKey = getTier(versionId);
  if (type === 'newbie') return { ...NEWBIE, tier: tierKey };
  if (type === 'self')   return { ...SELF_REROLL[tierKey], tier: tierKey };
  if (type === 'buy')    return { ...BUY_ACCOUNT[tierKey], tier: tierKey };
  return { ...NEWBIE, tier: tierKey };
}

// 累积所有 v <= versionId 的 phases[].chars 去重(UP 5★ 角色)
export function collectUPTChars(versionId) {
  const seen = new Set();
  const out = [];
  for (const p of phases) {
    if (!isVersionLTE(p.v, versionId)) continue;
    for (const c of p.chars) {
      if (!seen.has(c)) { seen.add(c); out.push(c); }
    }
  }
  return out;
}

// 累积截至 versionId 的 UP 5★ 武器(从 chars.js 的 weapons 映射推算)
// weapons 字典是 角色 → 武器名;UP 武器 = 该版本及之前所有 UP 角色的专属武器
export function collectUPTWeapons(versionId) {
  const chars = collectUPTChars(versionId);
  const seen = new Set();
  const out = [];
  for (const c of chars) {
    const w = weapons[c];
    if (w && w !== '限定武器' && !seen.has(w)) { seen.add(w); out.push(w); }
  }
  return out;
}

// 版本号比较:"3.4" <= "3.4" → true;"2.0" <= "3.0" → true
function isVersionLTE(a, b) {
  const [an, am] = a.split('.').map(Number);
  const [bn, bm] = b.split('.').map(Number);
  if (an !== bn) return an < bn;
  return am <= bm;
}

// 生成 N 条 4★/3★ 填充抽卡记录(均匀分布在 today - days ~ today)
// pool 在 eventChar / standardChar / eventWeapon 之间随机
export function generateFillerPulls(count, today, days) {
  const out = [];
  const pools = ['eventChar', 'standardChar', 'eventWeapon'];
  for (let i = 0; i < count; i++) {
    const pool = pick(pools);
    const r = Math.random();
    let rarity, name, type;
    if (r < 0.05) {
      // 5% 概率给 4★ 武器(只在 weapon 池)
      rarity = 4;
      name = pick(fourWeapons);
      type = '四星武器';
    } else if (r < 0.5) {
      // 45% 概率给 4★ 角色
      rarity = 4;
      name = poolKindIsWeapon(pool) ? pick(fourWeapons) : pick(fourAll);
      type = poolKindIsWeapon(pool) ? '四星武器' : '四星角色';
    } else {
      // 50% 概率给 3★ 武器
      rarity = 3;
      name = pick(threeWeapons);
      type = '三星武器';
    }
    const offset = -Math.floor((i + 1) * days / (count + 1));
    const tstamp = today + offset * DAY;
    out.push({
      r: rarity, n: name, t: type, pool,
      pity: 1 + Math.floor(Math.random() * 79),
      up: false,
      no: i + 1,
      date: fmt(tstamp),
    });
  }
  return out;
}

function poolKindIsWeapon(pool) {
  return pool === 'eventWeapon' || pool === 'collabWeapon' || pool === 'standardWeapon' || pool === 'noviceWeapon';
}

// 由偏移天数算出日期字符串(相对传入的 today 时间戳)
export function dateFromOffset(today, offsetDays) {
  return fmt(today + offsetDays * DAY);
}