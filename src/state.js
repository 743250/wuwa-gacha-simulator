// 全局状态管理
export const DAY = 86400000;
export const fmt = d => new Date(d).toISOString().slice(0, 10);
export const date = s => new Date(s + 'T00:00:00Z').getTime();
export const $ = id => document.getElementById(id);
export const pick = a => a[Math.floor(Math.random() * a.length)];

let toastTimer;
export function msg(t, err = true) {
  const e = $('toast');
  e.textContent = t || '';
  e.style.color = err ? 'var(--red)' : 'var(--green)';
  clearTimeout(toastTimer);
  if (t) toastTimer = setTimeout(() => e.textContent = '', 2500);
}

export let animating = false;
export function setAnimating(v) { animating = v; }

export const state0 = () => ({
  today: date('2024-05-23'), selected: null,
  total: 0, five: 0, four: 0, upHits: 0,
  pity: { eventChar: 0, eventWeapon: 0, collabChar: 0, collabWeapon: 0, standardChar: 0, standardWeapon: 0, beginner: 0, noviceChoice: 0, noviceWeapon: 0 },
  p4: { eventChar: 0, eventWeapon: 0, collabChar: 0, collabWeapon: 0, standardChar: 0, standardWeapon: 0, beginner: 0, noviceChoice: 0, noviceWeapon: 0 },
  g: { eventChar: false, collabChar: false, noviceChoice: false },
  g4: { eventChar: false, eventWeapon: false, collabChar: false, collabWeapon: false, standardChar: false, standardWeapon: false, beginner: false, noviceChoice: false, noviceWeapon: false },
  beginnerPulls: 0, beginnerDone: false,
  // 新旅池目标：分角色 / 武器
  noviceTarget: '守岸人',
  noviceWeaponTarget: '星序协响',
  // 新旅池启用时间戳：开始用第一抽时记录，过 30 天后两个池都隐藏
  noviceStarted: 0,
  standardWeaponTarget: '千古洑流',
  astrite: 16000, lunite: 0, radiant: 0, forging: 0, lustrous: 0, dream: 0, mirage: 0,
  afterglow: 0, oscillated: 0, spent: 0, days: 0,
  oscBuy: { radiant: 0, forging: 0, lustrous: 0 }, waveBuy: {},
  shopFirstTime: { t60: true, t300: true, t980: true, t1980: true, t3280: true, t6480: true },
  shopBuyCount: {},               // 商店礼包购买次数 {id: count}
  lastMonthlyClaim: '',           // 月卡上次领取日期（防止同一天重复领）
  roles: {}, weapons: {}, log: [],

  // ===== P1 战斗养成 =====
  team: [null, null, null],          // 3 人编队，存角色名
  materials: {
    // 共鸣促剂四档（提供经验数）
    exp_low:   20,        // 初级共鸣促剂 = 1000 经验
    exp_mid:   10,        // 中级共鸣促剂 = 3000 经验
    exp_high:  5,         // 高级共鸣促剂 = 8000 经验
    exp_super: 2,         // 特级共鸣促剂 = 20000 经验
    // 武器突破石（统一）
    weapon_book: 30,
    // 结晶溶剂（高级药剂，无上限）
    crystal_solvent: 3,
    // 凝缩波片（普通药剂，官方上限 5）
    condensed_waveplate: 2,
    // 索拉世界等级 1-3（越高敌人越强、掉落越多）
    sol3Level: 1
  },

  // ===== P3 体力/日常/深渊（先埋字段） =====
  stamina: 240,
  staminaMax: 240,
  lastStaminaTick: 0,
  dailyCommissions: [],
  lastDailyReset: '',
  abyss: { stars: {}, lastReset: '' },
  weeklyBoss: { used: {}, lastReset: '' },
  bossLevels: {},               // 世界 BOSS 讨伐等级 { '燎照之骑': 50, ... }

  // ===== 先约电台（70 级 BP，双线，每版本重置）=====
  podcast: {
    version: '1.0',
    exp: 0,
    level: 0,
    paid: false,                       // 内幕频道（付费轨解锁）
    premium: false,                    // 寰宇频道（内幕 + 立即 +10 级）
    claimedFree: [],                   // 已领免费轨等级
    claimedPaid: [],                   // 已领付费轨等级
    tasks: { daily: {}, weekly: {}, period: {} },
    lastDailyReset: '',
    lastWeeklyReset: ''
  }
});

export let S = state0();

export function resetState() {
  Object.assign(S, state0());
}

// 这些函数需要挂到 window 供 onclick 使用
if (typeof window !== 'undefined') window.animating = animating;
