// 抽卡核心逻辑
// Phase 3 步骤 B:不再 import rerenderAll/msg —— core 是纯领域层,UI 副作用由调用方承担。
// commit() 已自带 bumpStateVersion,Preact 信号自动响应;
// 旧字符串 UI(若调用方仍依赖)由调用方主动调 rerenderAll。
import { S, DAY, date, fmt, pickRng } from '../state.js';
import { phases } from '../data/phases.js';
import { standard5, fourAll, threeWeapons, fourWeapons, weapons, bannerNames, standardWeapons, newJourneyChars } from '../data/chars.js';
import {
  BASE_RATE, HARD_PITY, SOFT_PITY_KNOT, MID_PITY_KNOT, HIGH_PITY_KNOT,
  SOFT_SLOPE, MID_SLOPE, HIGH_SLOPE, SOFT_SPAN, MID_SPAN
} from './rateConfig.js';

export function activePhase() { return phases.filter(p => S.today >= p.start && S.today < p.end); }
export function isCollabRole(c) { return c === '露西' || c === '丽贝卡'; }
// 当前是否处于联动版本（用来控制商店/海市的联动资源显示）
export function isCollabActive() {
  return activePhase().some(p => p.chars.some(isCollabRole));
}

// 新旅池：第一次抽取时启动 30 天倒计时，到期后两个池都隐藏
// 30 天后过期 → 返回 true
function noviceExpired() {
  if (!S.noviceStarted) return false;
  return (S.today - S.noviceStarted) >= 30 * DAY;
}
export function noviceRemainDays() {
  if (!S.noviceStarted) return 30;
  return Math.max(0, Math.ceil((S.noviceStarted + 30 * DAY - S.today) / DAY));
}
// 由 pull() 内部启动新旅倒计时
function startNoviceIfNeeded() {
  if (!S.noviceStarted) S.noviceStarted = S.today;
}

export function activeBanners() {
  const eventChars = [], eventWeapons = [], permanent = [];
  activePhase().forEach(p => p.chars.forEach(c => {
    const cp = isCollabRole(c), charPool = cp ? 'collabChar' : 'eventChar', weaponPool = cp ? 'collabWeapon' : 'eventWeapon';
    eventChars.push({ id: charPool + '-' + p.v + '-' + c, pool: charPool, start: p.start, end: p.end, version: p.v, char: c,
      fours: p.fours, banner: bannerNames[c] || ('角色活动唤取 · ' + c), weapon: weapons[c] || '限定武器' });
    eventWeapons.push({ id: weaponPool + '-' + p.v + '-' + c, pool: weaponPool, start: p.start, end: p.end, version: p.v, char: c,
      fours: fourWeapons.slice(0, 3), banner: (cp ? '武器联动唤取 · ' : '浮声沉兵 · ') + (weapons[c] || '限定武器'), weapon: weapons[c] || '限定武器' });
  }));
  if (!S.beginnerDone) {
    permanent.push({ id: 'beginner', pool: 'beginner', start: date('2024-05-23'), end: Infinity, version: '新手', banner: '万象新声', char: S.beginnerTarget, weapon: null, fours: fourAll.slice(0, 3) });
  }
  // ★ 新旅池：拆角色 / 武器；30 天有效期
  if (!noviceExpired()) {
    permanent.push({ id: 'novice-choice', pool: 'noviceChoice', start: date('2024-05-23'), end: Infinity, version: '新旅', banner: '新旅如约 · 角色', char: S.noviceTarget, weapon: null, fours: fourAll.slice(0, 3) });
    permanent.push({ id: 'novice-weapon', pool: 'noviceWeapon', start: date('2024-05-23'), end: Infinity, version: '新旅', banner: '新旅如约 · 武器', char: null, weapon: S.noviceWeaponTarget, fours: fourWeapons.slice(0, 3) });
  }
  permanent.push({ id: 'standard-char', pool: 'standardChar', start: date('2024-05-23'), end: Infinity, version: '常驻', banner: '海上共潮生', char: null, weapon: null, fours: fourAll.slice(0, 3) });
  const stdWeapon = standardWeapons.find(w => w.name === S.standardWeaponTarget) || standardWeapons[0];
  permanent.push({ id: 'standard-weapon', pool: 'standardWeapon', start: date('2024-05-23'), end: Infinity, version: '常驻', banner: '武器常驻唤取', char: null, weapon: stdWeapon.name, weaponBanner: stdWeapon.banner, fours: fourWeapons.slice(0, 3) });
  return [...eventChars, ...eventWeapons, ...permanent];
}

// Phase 3 步骤 A:cur() 改为纯查询,不再隐式写 S.selected。
// 旧版的"无选择时回填 a[0].id"由显式 action ensureSelectedBanner() 承担,
// 在应用初始化、日期切换、卡池切换后调用。
export function cur() {
  const a = activeBanners();
  if (!a.length) return null;
  if (!S.selected) return a[0];
  return a.find(b => b.id === S.selected) || a[0];
}

// 显式回填 selected:当当前 selected 不在 activeBanners 中时,写入 a[0].id。
// 返回是否发生写入(便于调用方决定是否 bump)。
export function ensureSelectedBanner() {
  const a = activeBanners();
  if (!a.length) return false;
  if (!S.selected || !a.some(b => b.id === S.selected)) {
    S.selected = a[0].id;
    return true;
  }
  return false;
}

// 概率曲线常量已外提至 rateConfig.js。
// 改动需同步 tests/gacha/core.test.js:19-54 的锁定值。

export function rate(p) {
  if (p >= HARD_PITY) return 1;
  if (p <= SOFT_PITY_KNOT) return BASE_RATE;
  if (p <= MID_PITY_KNOT) return Math.min(1, BASE_RATE + (p - SOFT_PITY_KNOT) * SOFT_SLOPE);
  if (p <= HIGH_PITY_KNOT) return Math.min(1, BASE_RATE + SOFT_SPAN * SOFT_SLOPE + (p - MID_PITY_KNOT) * MID_SLOPE);
  return Math.min(1, BASE_RATE + SOFT_SPAN * SOFT_SLOPE + MID_SPAN * MID_SLOPE + (p - HIGH_PITY_KNOT) * HIGH_SLOPE);
}

export function poolTide(pool) {
  if (pool === 'eventChar' || pool === 'noviceChoice') return ['radiant', '浮金波纹', 'r'];
  if (pool === 'eventWeapon' || pool === 'noviceWeapon') return ['forging', '铸潮波纹', 'f'];
  if (pool === 'collabChar') return ['dream', '捕梦波纹', 'r'];
  if (pool === 'collabWeapon') return ['mirage', '铭影波纹', 'f'];
  return ['lustrous', '唤声涡纹', 'l'];
}
export function tideKey(pool) { return poolTide(pool)[0]; }
export function tideName(pool) { return poolTide(pool)[1]; }
export function tideLetter(pool) { return poolTide(pool)[2]; }
export function poolKind(pool) {
  return pool === 'eventWeapon' || pool === 'collabWeapon' || pool === 'standardWeapon' || pool === 'noviceWeapon' ? 'weapon' : 'char';
}

export function poolTitle(b) {
  if (!b) return '';
  if (b.pool === 'eventChar') return '角色活动唤取';
  if (b.pool === 'eventWeapon') return '武器活动唤取';
  if (b.pool === 'collabChar') return '角色联动唤取';
  if (b.pool === 'collabWeapon') return '武器联动唤取';
  if (b.pool === 'standardChar') return '角色常驻唤取';
  if (b.pool === 'standardWeapon') return '武器常驻唤取';
  if (b.pool === 'beginner') return '新手唤取';
  if (b.pool === 'noviceWeapon') return '武器新旅唤取';
  return '角色新旅唤取';
}

export function targetOptions(b) {
  if (!b) return null;
  let opts = [];
  if (b.pool === 'standardWeapon') opts = standardWeapons.map(w => ({ label: w.banner, target: w.name, active: w.name === S.standardWeaponTarget }));
  if (b.pool === 'beginner') opts = standard5.map(c => ({ label: c, target: c, active: c === S.beginnerTarget }));
  if (b.pool === 'noviceChoice') {
    if (S.noviceStarted) return { pool: b.pool, opts: [], locked: S.noviceTarget };
    opts = newJourneyChars.map(c => ({ label: c, target: c, active: c === S.noviceTarget }));
  }
  if (b.pool === 'noviceWeapon') {
    if (S.noviceStarted) return { pool: b.pool, opts: [], locked: S.noviceWeaponTarget };
    opts = newJourneyChars.map(c => ({ label: `${weapons[c]}（${c}）`, target: weapons[c], active: weapons[c] === S.noviceWeaponTarget }))
      .filter(o => o.target);
  }
  if (!opts.length) return null;
  return { pool: b.pool, opts, locked: null };
}

// Phase 3 步骤 C:selectTarget / selectBanner / upgrade 已迁到 actions.js
// 这些是"用户动作"层(对应 UI 点击),需要 commit() 触发状态写入;
// core.js 是纯领域函数层,不再 import commit。

// 支付
function payOne(pool) {
  const key = tideKey(pool);
  if (S[key] > 0) { S[key]--; return true; }
  if (S.astrite >= 160) { S.astrite -= 160; S.astriteSpent = (S.astriteSpent || 0) + 160; return true; }
  return false;
}
export function payBeginnerTen() {
  const key = tideKey('beginner');
  let need = 8;
  const useTide = Math.min(need, S[key]);
  S[key] -= useTide; need -= useTide;
  const cost = need * 160;
  if (S.astrite >= cost) { S.astrite -= cost; S.astriteSpent = (S.astriteSpent || 0) + cost; return true; }
  S[key] += useTide;
  return false;
}

// Phase 3 步骤 C:pullOne 是可注入随机源的单抽纯领域函数。
//   · state   —— 接收可变状态对象(应用层传 S;测试可传副本)
//   · banner  —— 当前选中卡池对象(cur() 的返回值)
//   · pool    —— 池子 key(同 pull 第一参数)
//   · rng     —— 返回 [0,1) 的随机函数,默认 Math.random
//   · free    —— 是否免费(免费不扣资源)
// 允许原地修改 state(任务书 7.4 不要求不可变);返回单次抽卡结果或 null(资源不足)。
// 关键约束:不读取全局 S、不保存、不刷新、不弹窗;随机调用顺序与 pull() 旧版完全一致。
export function pullOne(state, banner, pool, rng = Math.random, free = false) {
  if (!banner) return null;
  if (!free && !payOneFor(state, pool)) return null;
  if (pool === 'noviceChoice' || pool === 'noviceWeapon') {
    if (!state.noviceStarted) state.noviceStarted = state.today;
  }
  state.total++; state.pity[pool]++; state.p4[pool]++;
  if (pool === 'beginner') {
    state.beginnerPulls++;
    if (state.beginnerPulls >= 50) state.beginnerDone = true;
  }
  const r = rng(), fr = pool === 'beginner' && state.beginnerPulls >= 50 ? 1 : rate(state.pity[pool]);
  if (r < fr) return five(state, pool, banner, rng);
  if (state.p4[pool] >= 10 || r < fr + .06) return four(state, pool, banner, rng);
  state.oscillated += 15;
  return mk(state, 3, pickRng(threeWeapons, rng), '三星武器', pool);
}

// 旧版 pull(pool, free) 保留作为应用层 wrapper:全 state = S,rng = Math.random,
// 保持与历史调用方完全一致的行为(原地修改 S、commit 由调用方做)。
export function pull(pool, free = false) {
  return pullOne(S, cur(), pool, Math.random, free);
}

// payOne 的 state 注入版:扣波纹/星声。返回是否成功扣资源。
function payOneFor(state, pool) {
  const key = tideKey(pool);
  if (state[key] > 0) { state[key]--; return true; }
  if (state.astrite >= 160) { state.astrite -= 160; state.astriteSpent = (state.astriteSpent || 0) + 160; return true; }
  return false;
}

function charCoral(r, pulled) {
  if (r === 5) return pulled === 1 ? 15 : (pulled <= 7 ? 15 : 40);
  if (r === 4) return pulled === 1 ? 3 : (pulled <= 7 ? 3 : 8);
  return 0;
}

function five(state, pool, b, rng) {
  const pity = state.pity[pool];
  state.pity[pool] = 0; state.p4[pool] = 0; state.five++;
  let name, type, up = false, coral = 15;
  if (pool === 'eventWeapon' || pool === 'collabWeapon' || pool === 'standardWeapon') {
    name = b.weapon; type = pool === 'standardWeapon' ? '定向常驻五星武器' : (pool === 'collabWeapon' ? '目标联动五星武器' : '目标五星武器'); up = true;
    addWeaponFor(state, name, 5);
    coral = 15;
  } else if (pool === 'noviceWeapon') {
    // ★ 新旅武器池：100% 出自选武器
    up = true; name = b.weapon || state.noviceWeaponTarget; type = '新旅目标五星武器';
    addWeaponFor(state, name, 5);
    coral = 15;
  } else if (pool === 'noviceChoice') {
    // 新旅角色池：与活动角色池同款 50/50 + 大保底（state.g.noviceChoice）
    up = state.g[pool] || rng() < .5;
    name = up ? (b.char || state.noviceTarget) : pickRng(standard5, rng);
    type = up ? '新旅目标五星角色' : '常驻五星角色';
    state.g[pool] = !up;
    const r = addRoleFor(state, name, 5);
    coral = charCoral(5, r.pulled);
    if (!up) coral += 30;
  } else if (pool === 'beginner') {
    // 新手池支持 5 选 1 定向(b.char 由 activeBanners 从 S.beginnerTarget 带入);未选则 5 选 1 等概率
    name = b.char || pickRng(standard5, rng); type = '新手五星角色'; up = false;
    // 50 抽用完才永久关闭（不再因首五星就关池）
    const r = addRoleFor(state, name, 5);
    coral = charCoral(5, r.pulled);
  } else if (pool === 'standardChar') {
    // 常驻角色池不可定向,5 选 1 等概率
    name = pickRng(standard5, rng); type = '常驻五星角色'; up = false;
    const r = addRoleFor(state, name, 5);
    coral = charCoral(5, r.pulled);
  } else if (pool === 'collabChar') {
    up = true; name = b.char; type = '概率提升联动五星角色';
    const r = addRoleFor(state, name, 5);
    coral = charCoral(5, r.pulled);
  } else {
    up = state.g[pool] || rng() < .5;
    name = up ? b.char : pickRng(standard5, rng);
    type = up ? '概率提升五星角色' : '常驻五星角色';
    state.g[pool] = !up;
    const r = addRoleFor(state, name, 5);
    coral = charCoral(5, r.pulled);
    if (!up) coral += 30;
  }
  if (up) { type += ' · 命中提升'; state.upHits++; }
  state.afterglow += coral;
  return mk(state, 5, name, type, pool, pity, up);
}

function four(state, pool, b, rng) {
  state.four++; state.p4[pool] = 0;
  const up = state.g4[pool] || rng() < .5;
  let name, type, coral = 3;
  if (up) {
    name = poolKind(pool) === 'weapon' ? pickRng(b.fours, rng) : pickRng(b.fours, rng);
    type = poolKind(pool) === 'weapon' ? '概率提升四星武器' : '概率提升四星角色';
  } else {
    name = poolKind(pool) === 'weapon' || rng() < .5 ? pickRng(fourWeapons, rng) : pickRng(fourAll, rng);
    type = fourWeapons.includes(name) ? '四星武器' : '四星角色';
  }
  if (fourWeapons.includes(name)) {
    addWeaponFor(state, name, 4); coral = 3;
  } else {
    const r = addRoleFor(state, name, 4); coral = charCoral(4, r.pulled);
  }
  state.g4[pool] = !up;
  state.afterglow += coral;
  return mk(state, 4, name, type, pool, state.pity[pool], up);
}

function mk(state, r, n, t, pool, pity, up) {
  return { r, n, t, pool, pity: pity ?? state.pity[pool], up: !!up, no: state.total, date: fmt(state.today) };
}

// addRole / addWeapon 的 state 注入版 —— Phase 3 步骤 C
// 旧版仍 export 给外部调用方(addRole/addWeapon 调 S);内部 pullOne 调注入版以保持纯函数性。
// 字段防御与旧 addRole/addWeapon 逐字一一对应,确保行为零变化。
export function addRoleFor(state, n, r) {
  const o = state.roles[n] || {
    n, r, owned: 0, chain: 0, spare: 0, bought: 0, pulled: 0,
    level: 1,
    exp: 0,
    equipWeapon: null,
    equipEchoes: [null, null, null, null, null],  // 5 个声骸槽，存声骸 id
    skillLevels: { 普攻: 1, 技能: 1, 解放: 1, 回路: 1 }
  };
  o.pulled = (o.pulled || 0) + 1;
  if (o.owned === 0) o.owned = 1;
  else if (o.pulled <= 7) o.spare++;
  if (o.level === undefined) o.level = 1;
  if (o.skillLevels === undefined) o.skillLevels = { 普攻: 1, 技能: 1, 解放: 1, 回路: 1 };
  if (o.equipWeapon === undefined) o.equipWeapon = null;
  if (!Array.isArray(o.equipEchoes)) o.equipEchoes = [null, null, null, null, null];
  if (o.exp === undefined) o.exp = 0;
  state.roles[n] = o; return o;
}

export function addWeaponFor(state, name, r) {
  const o = state.weapons[name] || {
    n: name, r, pulled: 0,
    level: 1,
    refine: 1,
    spareRefine: 0,
    equippedBy: null
  };
  o.pulled = (o.pulled || 0) + 1;
  // 重复武器不再自动精炼，改为积攒待精炼素材，玩家在背包里手动使用。
  if (o.pulled > 1) o.spareRefine = (o.spareRefine || 0) + 1;
  if (o.level === undefined) o.level = 1;
  if (o.refine === undefined) o.refine = 1;
  if (o.spareRefine === undefined) o.spareRefine = Math.max(0, (o.pulled || 1) - (o.refine || 1));
  if (o.equippedBy === undefined) o.equippedBy = null;
  state.weapons[name] = o; return o;
}

export function addRole(n, r) { return addRoleFor(S, n, r); }
export function addWeapon(n, r) { return addWeaponFor(S, n, r); }

export function getPool() { const b = cur(); return b ? b.pool : 'eventChar'; }

export function canAffordPulls(n) {
  const k = getPool(), tide = S[tideKey(k)];
  if (k === 'beginner' && n === 10) {
    const fromTide = Math.min(8, tide);
    const cost = (8 - fromTide) * 160;
    const missing = Math.max(0, cost - S.astrite);
    return { ok: S.astrite >= cost, okWithLunite: S.astrite + S.lunite >= cost, tide: fromTide, astrite: cost, missing, total: n, possible: S.beginnerPulls >= 50 ? 0 : 10 };
  }
  const fromTide = Math.min(n, tide);
  const remain = n - fromTide;
  const cost = remain * 160;
  const missing = Math.max(0, cost - S.astrite);
  return {
    ok: S.astrite >= cost,
    okWithLunite: S.astrite + S.lunite >= cost,
    tide: fromTide,
    astrite: cost,
    missing,
    total: n,
    possible: tide + Math.floor((S.astrite + S.lunite) / 160)
  };
}

// Phase 3 步骤 C:upgrade 已迁到 actions.js(需要 commit 写入)。
// 旧调用方 src/ui/render/roleModal.js 已改从 actions.js 导入。