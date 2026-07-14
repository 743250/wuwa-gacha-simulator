// 全局状态管理
//
// 纯工具已外移:date/fmt/DAY → src/shared/date.js,pick → src/shared/random.js。
// 本文件 re-export 它们以兼容现有 73 处 import(Phase 2 步骤 A 中间态,新代码请直接 import shared/);
// state0() 内部用 date(...),所以同时 import 进本文件作用域。
//
// $ 和 msg 已外移到 src/ui/services/toast.ts(Phase 2 步骤 B):
// state 层不再直接操作 DOM。
//
// animating/setAnimating 已外移到 src/ui/gachaAnimationState.js(Phase 2 步骤 D)。

import { DAY, fmt, date } from './shared/date.js';
import { pick } from './shared/random.js';
export { DAY, fmt, date } from './shared/date.js';
export { pick, pickRng } from './shared/random.js';

export const state0 = () => ({
  today: date('2024-05-23'), selected: null,
  total: 0, five: 0, four: 0, upHits: 0, astriteSpent: 0,
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
  // ===== 声骸系统 =====
  echos: [],                 // [{ id, name, cost, set, element, level, mainStat:{key,label,value}, subStats:[{key,label,value}], lock, equippedBy, equipSlot }]
  echoNextId: 1,             // 声骸自增 ID

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
    // 声骸调谐器（重 roll 副词条数值）
    echo_tuner: 5,
    // 结晶溶剂（体力药，每个 +60，可超充）
    crystal_solvent: 3,
    // 结晶单质（溢出波片 1:1 存储，上限 480）
    waveplate_crystal: 60,
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
