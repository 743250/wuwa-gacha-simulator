// 抽卡核心逻辑
import { S, DAY, date, fmt, pick, msg } from '../state.js';
import { phases } from '../data/phases.js';
import { standard5, fourAll, threeWeapons, fourWeapons, weapons, bannerNames, standardWeapons, newJourneyChars } from '../data/chars.js';

export function activePhase() { return phases.filter(p => S.today >= p.start && S.today < p.end); }
export function isCollabRole(c) { return c === '露西' || c === '丽贝卡'; }

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
    permanent.push({ id: 'beginner', pool: 'beginner', start: date('2024-05-23'), end: Infinity, version: '新手', banner: '万象新声', char: null, weapon: null, fours: fourAll.slice(0, 3) });
  }
  permanent.push({ id: 'novice-choice', pool: 'noviceChoice', start: date('2024-05-23'), end: Infinity, version: '新旅', banner: '新旅如约', char: S.noviceTarget, weapon: weapons[S.noviceTarget] || null, fours: fourAll.slice(0, 3) });
  permanent.push({ id: 'standard-char', pool: 'standardChar', start: date('2024-05-23'), end: Infinity, version: '常驻', banner: '海上共潮生', char: null, weapon: null, fours: fourAll.slice(0, 3) });
  const stdWeapon = standardWeapons.find(w => w.name === S.standardWeaponTarget) || standardWeapons[0];
  permanent.push({ id: 'standard-weapon', pool: 'standardWeapon', start: date('2024-05-23'), end: Infinity, version: '常驻', banner: '武器常驻唤取', char: null, weapon: stdWeapon.name, weaponBanner: stdWeapon.banner, fours: fourWeapons.slice(0, 3) });
  return [...eventChars, ...eventWeapons, ...permanent];
}

export function cur() {
  const a = activeBanners();
  if (!a.length) return null;
  if (!S.selected || !a.some(b => b.id === S.selected)) S.selected = a[0].id;
  return a.find(b => b.id === S.selected);
}

// 概率曲线
export function rate(p) {
  if (p >= 80) return 1;
  if (p <= 65) return .008;
  if (p <= 70) return Math.min(1, .008 + (p - 65) * .04);
  if (p <= 75) return Math.min(1, .008 + 5 * .04 + (p - 70) * .08);
  return Math.min(1, .008 + 5 * .04 + 5 * .08 + (p - 75) * .10);
}

export function poolTide(pool) {
  if (pool === 'eventChar' || pool === 'noviceChoice') return ['radiant', '浮金波纹', 'r'];
  if (pool === 'eventWeapon') return ['forging', '铸潮波纹', 'f'];
  if (pool === 'collabChar') return ['dream', '捕梦波纹', 'r'];
  if (pool === 'collabWeapon') return ['mirage', '铭影波纹', 'f'];
  return ['lustrous', '唤声涡纹', 'l'];
}
export function tideKey(pool) { return poolTide(pool)[0]; }
export function tideName(pool) { return poolTide(pool)[1]; }
export function tideLetter(pool) { return poolTide(pool)[2]; }
export function poolKind(pool) { return pool === 'eventWeapon' || pool === 'collabWeapon' || pool === 'standardWeapon' ? 'weapon' : 'char'; }

export function poolTitle(b) {
  if (!b) return '';
  if (b.pool === 'eventChar') return '角色活动唤取';
  if (b.pool === 'eventWeapon') return '武器活动唤取';
  if (b.pool === 'collabChar') return '角色联动唤取';
  if (b.pool === 'collabWeapon') return '武器联动唤取';
  if (b.pool === 'standardChar') return '角色常驻唤取';
  if (b.pool === 'standardWeapon') return '武器常驻唤取';
  if (b.pool === 'beginner') return '新手唤取';
  return '角色新旅唤取';
}

export function targetOptions(b) {
  if (!b) return '';
  let opts = [];
  if (b.pool === 'standardWeapon') opts = standardWeapons.map(w => ({ label: w.banner, target: w.name, active: w.name === S.standardWeaponTarget }));
  if (b.pool === 'noviceChoice') opts = newJourneyChars.map(c => ({ label: c, target: c, active: c === S.noviceTarget }));
  if (!opts.length) return '';
  return `<div class="ba-weapon" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
    ${opts.map(o => `<button class="mbtn ${o.active ? 'gold' : ''}" onclick="selectTarget('${b.pool}','${o.target}')">${o.label}</button>`).join('')}
  </div>`;
}

export function selectTarget(pool, target) {
  if (pool === 'standardWeapon') S.standardWeaponTarget = target;
  if (pool === 'noviceChoice') S.noviceTarget = target;
  window.__render();
}
window.selectTarget = selectTarget;

// 支付
function payOne(pool) {
  const key = tideKey(pool);
  if (S[key] > 0) { S[key]--; return true; }
  if (S.astrite >= 160) { S.astrite -= 160; return true; }
  return false;
}
export function payBeginnerTen() {
  const key = tideKey('beginner');
  let need = 8;
  const useTide = Math.min(need, S[key]);
  S[key] -= useTide; need -= useTide;
  const cost = need * 160;
  if (S.astrite >= cost) { S.astrite -= cost; return true; }
  S[key] += useTide;
  return false;
}

export function pull(pool, free = false) {
  const b = cur(); if (!b) return null;
  if (!free && !payOne(pool)) return null;
  S.total++; S.pity[pool]++; S.p4[pool]++;
  if (pool === 'beginner') S.beginnerPulls++;
  const r = Math.random(), fr = pool === 'beginner' && S.beginnerPulls >= 50 ? 1 : rate(S.pity[pool]);
  if (r < fr) return five(pool, b);
  if (S.p4[pool] >= 10 || r < fr + .06) return four(pool, b);
  S.oscillated += 15;
  return mk(3, pick(threeWeapons), '三星武器', pool);
}

function charCoral(r, pulled) {
  if (r === 5) return pulled === 1 ? 15 : (pulled <= 7 ? 15 : 40);
  if (r === 4) return pulled === 1 ? 3 : (pulled <= 7 ? 3 : 8);
  return 0;
}

function five(pool, b) {
  const pity = S.pity[pool];
  S.pity[pool] = 0; S.p4[pool] = 0; S.five++;
  let name, type, up = false, coral = 15;
  if (pool === 'eventWeapon' || pool === 'collabWeapon' || pool === 'standardWeapon') {
    name = b.weapon; type = pool === 'standardWeapon' ? '定向常驻五星武器' : (pool === 'collabWeapon' ? '目标联动五星武器' : '目标五星武器'); up = true;
    addWeapon(name, 5);
    coral = 15;
  } else if (pool === 'noviceChoice') {
    up = true; name = b.char; type = '新旅目标五星角色';
    const r = addRole(name, 5);
    coral = charCoral(5, r.pulled);
    // 新旅卡池：附送配套五星武器（模拟器福利，让玩家拿到角色就能用）
    const matchedWeapon = weapons[b.char];
    if (matchedWeapon && matchedWeapon !== '限定武器') {
      addWeapon(matchedWeapon, 5);
    }
  } else if (pool === 'beginner') {
    name = pick(standard5); type = '新手五星角色'; up = false; S.beginnerDone = true;
    const r = addRole(name, 5);
    coral = charCoral(5, r.pulled);
  } else if (pool === 'standardChar') {
    name = pick(standard5); type = '常驻五星角色'; up = false;
    const r = addRole(name, 5);
    coral = charCoral(5, r.pulled);
  } else if (pool === 'collabChar') {
    up = true; name = b.char; type = '概率提升联动五星角色';
    const r = addRole(name, 5);
    coral = charCoral(5, r.pulled);
  } else {
    up = S.g[pool] || Math.random() < .5;
    name = up ? b.char : pick(standard5);
    type = up ? '概率提升五星角色' : '常驻五星角色';
    S.g[pool] = !up;
    const r = addRole(name, 5);
    coral = charCoral(5, r.pulled);
    if (!up) coral += 30;
  }
  if (up) { type += ' · 命中提升'; S.upHits++; }
  S.afterglow += coral;
  return mk(5, name, type, pool, pity, up);
}

function four(pool, b) {
  S.four++; S.p4[pool] = 0;
  const up = S.g4[pool] || Math.random() < .5;
  let name, type, coral = 3;
  if (up) {
    name = poolKind(pool) === 'weapon' ? pick(b.fours) : pick(b.fours);
    type = poolKind(pool) === 'weapon' ? '概率提升四星武器' : '概率提升四星角色';
  } else {
    name = poolKind(pool) === 'weapon' || Math.random() < .5 ? pick(fourWeapons) : pick(fourAll);
    type = fourWeapons.includes(name) ? '四星武器' : '四星角色';
  }
  if (fourWeapons.includes(name)) {
    addWeapon(name, 4); coral = 3;
  } else {
    const r = addRole(name, 4); coral = charCoral(4, r.pulled);
  }
  S.g4[pool] = !up;
  S.afterglow += coral;
  return mk(4, name, type, pool, S.pity[pool], up);
}

function mk(r, n, t, pool, pity, up) { return { r, n, t, pool, pity: pity ?? S.pity[pool], up: !!up, no: S.total, date: fmt(S.today) }; }

export function addRole(n, r) {
  const o = S.roles[n] || {
    n, r, owned: 0, chain: 0, spare: 0, bought: 0, pulled: 0,
    level: 1,
    exp: 0,
    equipWeapon: null,
    skillLevels: { 普攻: 1, 技能: 1, 解放: 1, 回路: 1 }
  };
  o.pulled = (o.pulled || 0) + 1;
  if (o.owned === 0) o.owned = 1;
  else if (o.pulled <= 7) o.spare++;
  if (o.level === undefined) o.level = 1;
  if (o.skillLevels === undefined) o.skillLevels = { 普攻: 1, 技能: 1, 解放: 1, 回路: 1 };
  if (o.equipWeapon === undefined) o.equipWeapon = null;
  if (o.exp === undefined) o.exp = 0;
  S.roles[n] = o; return o;
}

export function addWeapon(n, r) {
  const o = S.weapons[n] || {
    n, r, pulled: 0,
    level: 1,
    refine: 1,
    equippedBy: null
  };
  o.pulled = (o.pulled || 0) + 1;
  // 同武器精炼
  if (o.pulled > 1 && o.refine < 5) o.refine++;
  if (o.level === undefined) o.level = 1;
  if (o.refine === undefined) o.refine = 1;
  if (o.equippedBy === undefined) o.equippedBy = null;
  S.weapons[n] = o; return o;
}

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

export function upgrade(n) {
  const o = S.roles[n]; if (!o || o.spare <= 0 || o.chain >= 6) return;
  o.spare--; o.chain++; window.__render();
}
window.upgrade = upgrade;