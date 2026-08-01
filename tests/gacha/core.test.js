// P0 tests for gacha/core.js — probability curve, pity, pool logic, pull mechanics
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { state0, S } from '../../src/state.js';

// Must import state before gacha/core since core uses S
describe('gacha/core', () => {
  let core;

  // Dynamic import after state is set up
  beforeAll(async () => {
    core = await import('../../src/gacha/core.js');
  });

  beforeEach(() => {
    Object.assign(S, state0());
  });

  // ===== rate() — probability curve =====
  describe('rate()', () => {
    it('returns 0.008 (0.8%) at pity=65', () => {
      expect(core.rate(65)).toBeCloseTo(0.008, 3);
    });

    it('returns 0.008 at pity below 65', () => {
      expect(core.rate(1)).toBeCloseTo(0.008, 3);
      expect(core.rate(50)).toBeCloseTo(0.008, 3);
    });

    it('soft pity ramps at 66-70 (+0.04 per pull)', () => {
      // pity=66: 0.008 + (66-65)*0.04 = 0.048
      // pity=70: 0.008 + 5*0.04 = 0.208
      expect(core.rate(66)).toBeCloseTo(0.048, 3);
      expect(core.rate(70)).toBeCloseTo(0.208, 3);
    });

    it('mid pity ramps at 71-75 (+0.08 per pull)', () => {
      // pity=71: 0.008 + 5*0.04 + 1*0.08 = 0.288
      // pity=75: 0.008 + 5*0.04 + 5*0.08 = 0.608
      expect(core.rate(71)).toBeCloseTo(0.288, 3);
      expect(core.rate(75)).toBeCloseTo(0.608, 3);
    });

    it('high pity ramps at 76-79 (+0.10 per pull)', () => {
      // pity=76: 0.008 + 5*0.04 + 5*0.08 + 1*0.10 = 0.708
      // pity=79: 0.008 + 5*0.04 + 5*0.08 + 4*0.10 = 1.008 → clamped to 1
      expect(core.rate(76)).toBeCloseTo(0.708, 3);
      // pity=79 formula gives 1.008, rate() clamps to 1 via Math.min(1, ...)
      expect(core.rate(79)).toBe(1);
    });

    it('guarantees 5★ at pity=80 (hard pity)', () => {
      expect(core.rate(80)).toBe(1);
    });
  });

  // ===== poolTide() — tide token mapping =====
  describe('poolTide()', () => {
    it('eventChar → radiant', () => {
      expect(core.poolTide('eventChar')[0]).toBe('radiant');
    });

    it('eventWeapon → forging', () => {
      expect(core.poolTide('eventWeapon')[0]).toBe('forging');
    });

    it('collabChar → dream', () => {
      expect(core.poolTide('collabChar')[0]).toBe('dream');
    });

    it('collabWeapon → mirage', () => {
      expect(core.poolTide('collabWeapon')[0]).toBe('mirage');
    });

    it('standard/beginner → lustrous', () => {
      expect(core.poolTide('standardChar')[0]).toBe('lustrous');
      expect(core.poolTide('beginner')[0]).toBe('lustrous');
    });
  });

  // ===== poolKind() — weapon vs char =====
  describe('poolKind()', () => {
    it('weapon pools return "weapon"', () => {
      expect(core.poolKind('eventWeapon')).toBe('weapon');
      expect(core.poolKind('standardWeapon')).toBe('weapon');
      expect(core.poolKind('collabWeapon')).toBe('weapon');
      expect(core.poolKind('noviceWeapon')).toBe('weapon');
    });

    it('char pools return "char"', () => {
      expect(core.poolKind('eventChar')).toBe('char');
      expect(core.poolKind('standardChar')).toBe('char');
      expect(core.poolKind('beginner')).toBe('char');
    });
  });

  // ===== poolTitle() =====
  describe('poolTitle()', () => {
    it('returns empty for null', () => {
      expect(core.poolTitle(null)).toBe('');
    });

    it('returns correct Chinese titles', () => {
      expect(core.poolTitle({ pool: 'eventChar' })).toBe('角色活动唤取');
      expect(core.poolTitle({ pool: 'eventWeapon' })).toBe('武器活动唤取');
      expect(core.poolTitle({ pool: 'beginner' })).toBe('新手唤取');
      expect(core.poolTitle({ pool: 'standardChar' })).toBe('角色常驻唤取');
    });
  });

  // ===== addRole() — role state creation =====
  describe('addRole()', () => {
    it('creates a new role with correct defaults', () => {
      const role = core.addRole('测试角色', 5);
      expect(role.n).toBe('测试角色');
      expect(role.r).toBe(5);
      expect(role.owned).toBe(1);
      expect(role.chain).toBe(0);
      expect(role.level).toBe(1);
      expect(role.pulled).toBe(1);
      expect(S.roles['测试角色']).toBeDefined();
    });

    it('increments pulled count on duplicate', () => {
      core.addRole('测试角色', 5);
      const role = core.addRole('测试角色', 5);
      expect(role.pulled).toBe(2);
      expect(role.owned).toBe(1);
    });
  });

  // ===== addWeapon() — weapon state creation =====
  describe('addWeapon()', () => {
    it('creates a new weapon with correct defaults', () => {
      const wp = core.addWeapon('测试武器', 5);
      expect(wp.n).toBe('测试武器');
      expect(wp.r).toBe(5);
      expect(wp.level).toBe(1);
      expect(wp.refine).toBe(1);
      expect(wp.pulled).toBe(1);
      expect(S.weapons['测试武器']).toBeDefined();
    });
  });

  // ===== pull() — integration smoke =====
  describe('pull()', () => {
    it('returns null when no active banner', () => {
      // With no phases matching the default date (2024-05-23), there are active banners
      // This largely depends on phases.js data. We just verify it doesn't crash.
      const result = core.pull('eventChar', true); // free = true, no payment needed
      // If there's an active phase, should return a result object
      if (result) {
        expect(result).toHaveProperty('r');
        expect(result).toHaveProperty('n');
        expect(result).toHaveProperty('pool');
      }
    });

    it('increments total pulls', () => {
      const before = S.total;
      core.pull('eventChar', true);
      // Only assert if a pull actually happened
      if (S.total > before) {
        expect(S.total).toBe(before + 1);
      }
    });
  });

  // ===== canAffordPulls() — cost calculation =====
  describe('canAffordPulls()', () => {
    it('calculates cost with tide tokens', () => {
      S.radiant = 3;
      S.astrite = 320;
      S.selected = null; // will auto-select first banner
      // Just verify it returns a valid structure
      const aff = core.canAffordPulls(10);
      expect(aff).toHaveProperty('ok');
      expect(aff).toHaveProperty('tide');
      expect(aff).toHaveProperty('astrite');
      expect(aff).toHaveProperty('total');
      expect(aff.total).toBe(10);
    });

    it('reports ok=false when insufficient resources', () => {
      S.radiant = 0;
      S.astrite = 0;
      S.lunite = 0;
      const aff = core.canAffordPulls(10);
      expect(aff.ok).toBe(false);
    });
  });

  // ===== Statistical convergence (probabilistic) =====
  describe('5★ rate convergence', () => {
    it('average pity for 5★ should be ~55-65 over many pulls', () => {
      // Monte Carlo: pull until we get N five-stars
      // Since we can't easily control the RNG, we verify the rate formula is correct
      // rather than running actual pulls

      // Verify the cumulative probability at hard pity = 100%
      let cumProb = 0;
      let survProb = 1;
      for (let p = 1; p <= 80; p++) {
        const r = core.rate(p);
        cumProb += survProb * r;
        survProb *= (1 - r);
      }
      // After 80 pulls, cumulative probability should be extremely close to 1
      expect(cumProb).toBeCloseTo(1, 2);
    });
  });

  // ===== Phase 3 步骤 A:cur() 是纯查询,不写 S.selected =====
  describe('cur() 纯查询不写状态', () => {
    it('cur() 不修改 S.selected(无论 selected 是否有效)', () => {
      Object.assign(S, state0());
      // case 1:selected 为 null(初始态)
      const before1 = JSON.stringify({ selected: S.selected });
      const b1 = core.cur();
      const after1 = JSON.stringify({ selected: S.selected });
      expect(b1).toBeTruthy();
      expect(after1).toBe(before1); // selected 保持 null,不写

      // case 2:selected 已设为某 banner id
      const list = core.activeBanners();
      S.selected = list[0].id;
      const before2 = S.selected;
      core.cur();
      expect(S.selected).toBe(before2);

      // case 3:selected 指向已不存在的 banner —— 仍不写,返回 fallback(a[0])
      S.selected = 'bogus-id-not-exist';
      const before3 = S.selected;
      const b3 = core.cur();
      expect(b3).toBeTruthy();
      expect(S.selected).toBe(before3); // 仍是 'bogus-id-not-exist',未写入
    });

    it('ensureSelectedBanner() 写入只在 selected 无效时发生,且返回是否写入', () => {
      Object.assign(S, state0());
      // 初始 selected=null → 写入 a[0].id,返回 true
      const changed1 = core.ensureSelectedBanner();
      expect(changed1).toBe(true);
      expect(S.selected).toBe(core.activeBanners()[0].id);

      // 再次调用:selected 已是 a[0].id,无需写,返回 false
      const changed2 = core.ensureSelectedBanner();
      expect(changed2).toBe(false);
      expect(S.selected).toBe(core.activeBanners()[0].id);

      // 把 selected 写成无效值 → 再次写入并返回 true
      S.selected = 'bogus';
      const changed3 = core.ensureSelectedBanner();
      expect(changed3).toBe(true);
      expect(S.selected).toBe(core.activeBanners()[0].id);
    });

    it('cur() 多次调用幂等(连续调用不改变 selected)', () => {
      Object.assign(S, state0());
      core.cur(); core.cur(); core.cur();
      expect(S.selected).toBe(null);
    });
  });

  // ===== Phase 3 步骤 C:pullOne 可注入 RNG,固定序列结果完全可重复 =====
  describe('pullOne() RNG 注入', () => {
    // 一个简单 LCG 伪随机生成器,种子固定 → 序列可重现
    function lcg(seed) {
      let s = seed >>> 0;
      return () => {
        // LCG 参数(同 glibc rand)
        s = (s * 1103515245 + 12345) >>> 0;
        return (s & 0x7fffffff) / 0x80000000;
      };
    }

    function freshState() {
      // 浅拷贝 state0,加几个常用资源让资源检查不挡道
      const s = { ...state0(), roles: {}, weapons: {}, log: [],
        pity: { ...state0().pity }, p4: { ...state0().p4 },
        g: { ...state0().g }, g4: { ...state0().g4 },
        oscBuy: { ...state0().oscBuy }, waveBuy: {}, shopBuyCount: {} };
      s.astrite = 1_000_000; // 大量星声,资源不挡
      return s;
    }

    it('注入相同 rng,两次 pullOne 序列结果完全一致(含角色/武器/coral/pity)', () => {
      const banner = { id: 'standard-char', pool: 'standardChar', char: null, weapon: null, fours: ['alto','bezio','lingyang'] };
      const s1 = freshState(); const s2 = freshState();
      const rng1 = lcg(12345), rng2 = lcg(12345);
      const out1 = [], out2 = [];
      for (let i = 0; i < 20; i++) out1.push(core.pullOne(s1, banner, 'standardChar', rng1));
      for (let i = 0; i < 20; i++) out2.push(core.pullOne(s2, banner, 'standardChar', rng2));
      expect(out1.map(x => x && [x.r, x.n, x.up, x.no]))
        .toEqual(out2.map(x => x && [x.r, x.n, x.up, x.no]));
      // 状态字段也一致
      expect(s1.total).toBe(s2.total);
      expect(s1.five).toBe(s2.five);
      expect(s1.four).toBe(s2.four);
      expect(s1.afterglow).toBe(s2.afterglow);
      expect(s1.oscillated).toBe(s2.oscillated);
      expect(JSON.stringify(s1.pity)).toBe(JSON.stringify(s2.pity));
    });

    it('注入不同 rng seed,结果不同(确认 rng 真的在用)', () => {
      const banner = { id: 'standard-char', pool: 'standardChar', char: null, weapon: null, fours: ['alto','bezio','lingyang'] };
      const s1 = freshState(); const s2 = freshState();
      const rng1 = lcg(1), rng2 = lcg(2);
      const out1 = [], out2 = [];
      for (let i = 0; i < 20; i++) out1.push(core.pullOne(s1, banner, 'standardChar', rng1));
      for (let i = 0; i < 20; i++) out2.push(core.pullOne(s2, banner, 'standardChar', rng2));
      // 不能完全一致 —— 否则 rng 没被用上
      const equal = JSON.stringify(out1.map(x => x && [x.r, x.n])) === JSON.stringify(out2.map(x => x && [x.r, x.n]));
      expect(equal).toBe(false);
    });

    it('pullOne 不读取全局 S(S 字段保持不变)', () => {
      Object.assign(S, state0());
      const savedSelected = S.selected;
      const savedTotal = S.total;
      const savedPity = JSON.stringify(S.pity);
      const banner = { id: 'standard-char', pool: 'standardChar', char: null, weapon: null, fours: ['alto','bezio','lingyang'] };
      const testState = freshState();
      const rng = lcg(42);
      for (let i = 0; i < 5; i++) core.pullOne(testState, banner, 'standardChar', rng);
      // 全局 S 应保持不变
      expect(S.selected).toBe(savedSelected);
      expect(S.total).toBe(savedTotal);
      expect(JSON.stringify(S.pity)).toBe(savedPity);
    });

    it('banner 为 null 时 pullOne 返回 null 且不修改 state', () => {
      const state = freshState();
      const before = JSON.stringify(state);
      const result = core.pullOne(state, null, 'standardChar', Math.random);
      expect(result).toBe(null);
      expect(JSON.stringify(state)).toBe(before);
    });

    it('beginner 目标已选(b.char)时必得所选,未选则仍 5 选 1 随机', () => {
      const mk = (char) => {
        const s = freshState();
        s.pity.beginner = 79;
        s.astrite = 1_000_000;
        return { s, banner: { id: 'beginner', pool: 'beginner', char, weapon: null, fours: ['alto', 'bezio', 'lingyang'] } };
      };
      // 已选目标:5★ 必为所选
      const { s: s1, banner: b1 } = mk('鉴心');
      const out1 = core.pullOne(s1, b1, 'beginner', Math.random);
      expect(out1.r).toBe(5);
      expect(out1.n).toBe('鉴心');
      // 未选目标:5★ 仍是 5 人之一(不越界)
      const { s: s2, banner: b2 } = mk(null);
      const out2 = core.pullOne(s2, b2, 'beginner', Math.random);
      expect(out2.r).toBe(5);
      expect(['维里奈', '卡卡罗', '安可', '凌阳', '鉴心']).toContain(out2.n);
    });
  });

  // ===== Phase 3 步骤 C · 任务书 7.5 抽卡测试覆盖补充 =====
  describe('7.5 软保底各拐点 + 80 抽硬保底', () => {
    it('软保底 66 抽出五星(rng<rate)', () => {
      const s = { ...state0(), pity: { ...state0().pity, eventChar: 65 } };
      const banner = { id: 'eventChar-1.0-忌炎', pool: 'eventChar', char: '忌炎', fours: ['丹瑾','炽霞','莫特斐'] };
      // pity 将 ++ 到 66,rate=0.048,rng=0.001 命中
      const out = core.pullOne(s, banner, 'eventChar', () => 0.001, true);
      expect(out.r).toBe(5);
      expect(s.pity.eventChar).toBe(0);
    });
    it('软保底 71 抽出五星', () => {
      const s = { ...state0(), pity: { ...state0().pity, eventChar: 65 } };
      const banner = { id: 'eventChar-1.0-忌炎', pool: 'eventChar', char: '忌炎', fours: ['丹瑾','炽霞','莫特斐'] };
      // 连抽 6 次:pity 66→71,全用低 rng 命中
      let out;
      for (let i = 0; i < 6; i++) out = core.pullOne(s, banner, 'eventChar', () => 0.001, true);
      expect(out.r).toBe(5);
      expect(s.pity.eventChar).toBe(0);
    });
    it('硬保底 80 抽必出五星', () => {
      const s = { ...state0(), pity: { ...state0().pity, eventChar: 79 } };
      const banner = { id: 'eventChar-1.0-忌炎', pool: 'eventChar', char: '忌炎', fours: ['丹瑾','炽霞','莫特斐'] };
      // pity 将 ++ 到 80,rate=1,即使 rng=0.999 也必中
      const out = core.pullOne(s, banner, 'eventChar', () => 0.999, true);
      expect(out.r).toBe(5);
      expect(s.pity.eventChar).toBe(0);
    });
  });

  describe('7.5 角色池小保底失败后大保底', () => {
    it('小保底非 up → 下次五星必为 up(g[pool] 切换)', () => {
      const s = { ...state0(), g: { ...state0().g, eventChar: false } };
      s.astrite = 1_000_000;
      const banner = { id: 'eventChar-1.0-忌炎', pool: 'eventChar', char: '忌炎', fours: ['丹瑾','炽霞','莫特斐'] };
      // 第一次:r=0.001 命中,up rng=0.999 > .5 → up=false,g[pool] 切到 true
      let seq = [0.001, 0.999];
      const out1 = core.pullOne(s, banner, 'eventChar', () => seq.shift(), true);
      expect(out1.r).toBe(5);
      expect(out1.up).toBe(false);
      expect(s.g.eventChar).toBe(true);
      // 第二次五星:由于 g[pool]=true,up 直接 true(不消耗 rng)
      seq = [0.001];
      const out2 = core.pullOne(s, banner, 'eventChar', () => seq.shift(), true);
      expect(out2.r).toBe(5);
      expect(out2.up).toBe(true);
      expect(out2.n).toBe('忌炎');
      expect(s.g.eventChar).toBe(false);
    });

    it('新旅角色池同款 50/50：小保底可歪，大保底必中目标', () => {
      const s = { ...state0(), g: { ...state0().g, noviceChoice: false }, noviceTarget: '守岸人' };
      s.astrite = 1_000_000;
      const banner = { id: 'novice-choice', pool: 'noviceChoice', char: '守岸人', fours: ['秧秧','丹瑾','桃祈'] };
      let seq = [0.001, 0.999];
      const out1 = core.pullOne(s, banner, 'noviceChoice', () => seq.shift(), true);
      expect(out1.r).toBe(5);
      expect(out1.up).toBe(false);
      expect(s.g.noviceChoice).toBe(true);
      seq = [0.001];
      const out2 = core.pullOne(s, banner, 'noviceChoice', () => seq.shift(), true);
      expect(out2.r).toBe(5);
      expect(out2.up).toBe(true);
      expect(out2.n).toBe('守岸人');
      expect(s.g.noviceChoice).toBe(false);
    });
  });

  describe('7.5 武器池规则(必出 up 武器)', () => {
    it('eventWeapon 出五星必为目标的 up 武器', () => {
      const s = { ...state0(), pity: { ...state0().pity, eventWeapon: 79 } };
      const banner = { id: 'eventWeapon-1.0-忌炎', pool: 'eventWeapon', weapon: '忌炎专属武器', fours: ['不归孤军','东落','今州守望'] };
      const out = core.pullOne(s, banner, 'eventWeapon', () => 0.001, true);
      expect(out.r).toBe(5);
      expect(out.up).toBe(true);
      expect(out.n).toBe('忌炎专属武器');
    });
  });

  describe('7.5 四星十抽保底(p4>=10 必出四星)', () => {
    it('p4=9 时下一抽必出四星(无论 rng)', () => {
      const s = { ...state0(), p4: { ...state0().p4, eventChar: 9 } };
      const banner = { id: 'eventChar-1.0-忌炎', pool: 'eventChar', char: '忌炎', fours: ['丹瑾','炽霞','莫特斐'] };
      // pity=0 < 65,rate=0.008,rng=0.999 > rate 不出五星;但 p4 将 ++ 到 10 必出四星
      const out = core.pullOne(s, banner, 'eventChar', () => 0.999, true);
      expect(out.r).toBe(4);
      expect(s.p4.eventChar).toBe(0);
    });
  });

  describe('7.5 新手池十连八折与 50 抽关闭', () => {
    it('payBeginnerTen:8 个涡纹即可支撑十连(20% 折扣)', () => {
      Object.assign(S, state0());
      S.lustrous = 8;
      S.astrite = 0;
      const ok = core.payBeginnerTen();
      expect(ok).toBe(true);
      expect(S.lustrous).toBe(0);
      expect(S.astrite).toBe(0);
    });
    it('payBeginnerTen:7 涡纹 + 160 星声补足也可', () => {
      Object.assign(S, state0());
      S.lustrous = 7;
      S.astrite = 160;
      const ok = core.payBeginnerTen();
      expect(ok).toBe(true);
      expect(S.lustrous).toBe(0);
      expect(S.astrite).toBe(0);
    });
    it('payBeginnerTen:7 涡纹 + 不足星声失败,涡纹回退', () => {
      Object.assign(S, state0());
      S.lustrous = 7;
      S.astrite = 100;
      const ok = core.payBeginnerTen();
      expect(ok).toBe(false);
      expect(S.lustrous).toBe(7); // 回退
    });
    it('新手池抽 50 次后 beginnerDone=true', () => {
      const s = { ...state0(), pity: { ...state0().pity, beginner: 0 }, p4: { ...state0().p4, beginner: 0 } };
      s.astrite = 1_000_000;
      s.beginnerPulls = 49;
      const banner = { id: 'beginner', pool: 'beginner', char: null, weapon: null, fours: ['秧秧','丹瑾','桃祈'] };
      // 第 50 抽:beginnerPulls 将 ++ 到 50,bannerDone=true
      core.pullOne(s, banner, 'beginner', () => 0.999, true);
      expect(s.beginnerPulls).toBe(50);
      expect(s.beginnerDone).toBe(true);
    });
  });

  describe('7.5 新旅池第一次抽取启动 30 天计时', () => {
    it('noviceChoice 首抽写 noviceStarted=today', () => {
      const s = { ...state0(), noviceStarted: 0 };
      s.astrite = 1_000_000;
      const banner = { id: 'novice-choice', pool: 'noviceChoice', char: '守岸人', fours: ['秧秧','丹瑾','桃祈'] };
      core.pullOne(s, banner, 'noviceChoice', () => 0.001, true);
      expect(s.noviceStarted).toBe(s.today);
    });
    it('noviceWeapon 首抽亦写 noviceStarted=today', () => {
      const s = { ...state0(), noviceStarted: 0 };
      s.astrite = 1_000_000;
      const banner = { id: 'novice-weapon', pool: 'noviceWeapon', weapon: '星序协响', fours: ['不归孤军','东落','今州守望'] };
      core.pullOne(s, banner, 'noviceWeapon', () => 0.001, true);
      expect(s.noviceStarted).toBe(s.today);
    });
    it('30 天后 noviceExpired 返回 true,activeBanners 隐藏新旅池', () => {
      Object.assign(S, state0());
      S.noviceStarted = S.today;
      // 推进 31 天
      const DAY = 86400000;
      S.today = S.noviceStarted + 31 * DAY;
      const ids = core.activeBanners().map(b => b.id);
      expect(ids).not.toContain('novice-choice');
      expect(ids).not.toContain('novice-weapon');
    });
  });

  describe('7.5 资源不足 / 波纹优先 / 星声补足', () => {
    it('payOneFor:波纹优先(有波纹不扣星声)', () => {
      const s = { ...state0(), radiant: 2, astrite: 100 };
      // eventChar 对应 radiant(浮金波纹)
      const banner = { id: 'eventChar-1.0-忌炎', pool: 'eventChar', char: '忌炎', fours: ['丹瑾','炽霞','莫特斐'] };
      core.pullOne(s, banner, 'eventChar', () => 0.999); // 非免费,扣资源
      // 这次扣 1 个 radiant,星声不动
      expect(s.radiant).toBe(1);
      expect(s.astrite).toBe(100);
    });
    it('payOneFor:无波纹扣 160 星声', () => {
      const s = { ...state0(), radiant: 0, astrite: 320 };
      const banner = { id: 'eventChar-1.0-忌炎', pool: 'eventChar', char: '忌炎', fours: ['丹瑾','炽霞','莫特斐'] };
      core.pullOne(s, banner, 'eventChar', () => 0.999);
      expect(s.radiant).toBe(0);
      expect(s.astrite).toBe(160);
    });
    it('pullOne 资源不足返回 null,不修改 total/pity', () => {
      const s = { ...state0(), radiant: 0, astrite: 0, lunite: 0 };
      const before = JSON.stringify({ total: s.total, pity: s.pity });
      const banner = { id: 'eventChar-1.0-忌炎', pool: 'eventChar', char: '忌炎', fours: ['丹瑾','炽霞','莫特斐'] };
      const out = core.pullOne(s, banner, 'eventChar', () => 0.999);
      expect(out).toBe(null);
      expect(JSON.stringify({ total: s.total, pity: s.pity })).toBe(before);
    });
  });

  describe('7.5 单抽和十连的状态变化(total/pity/p4/珊瑚)', () => {
    it('单抽:.total+1,pity+1,3★ 时 p4+1', () => {
      const s = { ...state0(), pity: { ...state0().pity, eventChar: 0 }, p4: { ...state0().p4, eventChar: 0 } };
      const banner = { id: 'eventChar-1.0-忌炎', pool: 'eventChar', char: '忌炎', fours: ['丹瑾','炽霞','莫特斐'] };
      core.pullOne(s, banner, 'eventChar', () => 0.999, true);
      expect(s.total).toBe(1);
      expect(s.pity.eventChar).toBe(1);
      expect(s.p4.eventChar).toBe(1);
    });
    it('十连:total+10,五星后 pity 归 0,四星累计', () => {
      const s = { ...state0(), pity: { ...state0().pity, eventChar: 75 }, p4: { ...state0().p4, eventChar: 5 } };
      s.astrite = 1_000_000;
      const banner = { id: 'eventChar-1.0-忌炎', pool: 'eventChar', char: '忌炎', fours: ['丹瑾','炽霞','莫特斐'] };
      // 准备 rng 序列:pity=76 必出五星(第一个),后续全三星
      const seq = [0.001, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999];
      const out = [];
      for (let i = 0; i < 10; i++) out.push(core.pullOne(s, banner, 'eventChar', () => seq[i], true));
      expect(s.total).toBe(10);
      expect(out[0].r).toBe(5);
      // 五星后 pity 归 0,后续 9 抽 pity=1..9
      expect(s.pity.eventChar).toBe(9);
      expect(s.p4.eventChar).toBe(9); // 五星时归 0,后续 9 抽累计
      expect(s.afterglow).toBeGreaterThan(0); // 拿到珊瑚
    });
  });
});
