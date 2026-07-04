// Unit tests for exchange/coral.js — 海市珊瑚兑换、波段购买、波纹购买
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { state0, S } from '../../src/state.js';

// Mock modal.js to capture config instead of touching DOM
vi.mock('../../src/modal.js', () => ({
  openModal: vi.fn(),
  closeModal: vi.fn(),
}));

describe('exchange/coral', () => {
  let coral;
  let openModal;

  beforeAll(async () => {
    coral = await import('../../src/exchange/coral.js');
    openModal = (await import('../../src/modal.js')).openModal;
  });

  beforeEach(() => {
    Object.assign(S, state0());
    S.afterglow = 80;    // 余波珊瑚: 80 (可换 10 抽, 80/8)
    S.oscillated = 210;   // 残振珊瑚: 210 (可换 3 抽, 210/70)
    S.radiant = 0;
    S.forging = 0;
    S.lustrous = 0;
    S.dream = 0;
    S.mirage = 0;
    vi.clearAllMocks();
  });

  // ============================================================
  // Test 1: 余波珊瑚兑换指定资源 — 扣除珊瑚 + 增加对应资源
  // ============================================================
  describe('余波珊瑚兑换指定波纹', () => {
    it('余波珊瑚 → 浮金波纹: 扣除余波, 增加浮金', () => {
      coral.openExchangeModal('radiant', '浮金波纹', 'afterglow');
      expect(openModal).toHaveBeenCalledTimes(1);
      const config = openModal.mock.calls[0][0];

      const confirm = config.actions.find(a => a.label === '确认兑换');
      expect(confirm).toBeDefined();

      confirm.fn(3); // 换 3 个
      expect(S.afterglow).toBe(80 - 3 * 8); // 56
      expect(S.radiant).toBe(3);
    });

    it('余波珊瑚 → 铸潮波纹: 扣除余波, 增加铸潮', () => {
      coral.openExchangeModal('forging', '铸潮波纹', 'afterglow');
      const config = openModal.mock.calls[0][0];
      const confirm = config.actions.find(a => a.label === '确认兑换');
      confirm.fn(2);

      expect(S.afterglow).toBe(80 - 2 * 8); // 64
      expect(S.forging).toBe(2);
    });

    it('余波珊瑚 → 唤声涡纹: 扣除余波, 增加唤声', () => {
      coral.openExchangeModal('lustrous', '唤声涡纹', 'afterglow');
      const config = openModal.mock.calls[0][0];
      const confirm = config.actions.find(a => a.label === '确认兑换');
      confirm.fn(5);

      expect(S.afterglow).toBe(80 - 5 * 8); // 40
      expect(S.lustrous).toBe(5);
    });
  });

  // ============================================================
  // Test 2: 残振珊瑚兑换共鸣链 (通过回音频段兑换)
  // ============================================================
  describe('残振珊瑚 → 波段购买(共鸣链) via openWaveModal', () => {
    it('五星角色链数 +1: spare 和 waveBuy 增加', () => {
      // 添加已拥有、未满链的五星角色
      S.roles['维里奈'] = { n: '维里奈', r: 5, owned: 1, chain: 2, level: 90, pulled: 1, spare: 0 };
      S.afterglow = 540; // 常驻五星 270/个, 540 可换 2 个

      coral.openWaveModal();
      expect(openModal).toHaveBeenCalledTimes(1);
      const config = openModal.mock.calls[0][0];

      const confirm = config.actions.find(a => a.label === '确认兑换');
      expect(confirm).toBeDefined();

      confirm.fn(1);
      expect(S.afterglow).toBe(540 - 270);
      expect(S.roles['维里奈'].spare).toBe(1);
      expect(S.waveBuy['维里奈']).toBe(1);
      expect(S.roles['维里奈'].bought).toBe(1);
    });

    it('限定五星角色兑换消耗 360 余波', () => {
      S.roles['忌炎'] = { n: '忌炎', r: 5, owned: 1, chain: 0, level: 1, pulled: 1, spare: 0 };
      S.afterglow = 360;

      coral.openWaveModal();
      const config = openModal.mock.calls[0][0];
      const confirm = config.actions.find(a => a.label === '确认兑换');
      confirm.fn(1);

      expect(S.afterglow).toBe(0);
      expect(S.roles['忌炎'].spare).toBe(1);
      expect(S.waveBuy['忌炎']).toBe(1);
    });

    it('无候选角色时弹窗不应被调用', () => {
      // 没有已拥有且未满链的五星角色
      coral.openWaveModal();
      expect(openModal).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Test 3: 珊瑚不足时兑换失败
  // ============================================================
  describe('珊瑚不足时兑换应失败/返回错误', () => {
    it('余波不足: afterglow < 8 时弹窗不应出现', () => {
      S.afterglow = 4; // < 8
      coral.openExchangeModal('radiant', '浮金波纹', 'afterglow');
      expect(openModal).not.toHaveBeenCalled();
    });

    it('残振不足: oscillated < 70 时弹窗不应出现', () => {
      S.oscillated = 60; // < 70
      coral.openExchangeModal('radiant', '浮金波纹', 'oscillated');
      expect(openModal).not.toHaveBeenCalled();
    });

    it('余波不足时 openSingleWave 应返回错误(不开确认模态)', () => {
      S.roles['维里奈'] = { n: '维里奈', r: 5, owned: 1, chain: 2, level: 90, pulled: 1, spare: 0 };
      S.afterglow = 100; // 不够买 1 个回音频段 (270)

      coral.openWaveModal();
      // 单一候选且 maxN<=0 → openSingleWave 直接 msg() 返回, 不调 openModal
      expect(openModal).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Test 4: 残振珊瑚兑换波段 — 购买流程 + oscBuy 跟踪
  // ============================================================
  describe('残振珊瑚兑换波段(oscillated)', () => {
    it('残振珊瑚 → 浮金波纹: 扣除残振, 记录 oscBuy', () => {
      coral.openExchangeModal('radiant', '浮金波纹', 'oscillated');
      expect(openModal).toHaveBeenCalledTimes(1);
      const config = openModal.mock.calls[0][0];

      const confirm = config.actions.find(a => a.label === '确认兑换');
      confirm.fn(2);

      expect(S.oscillated).toBe(210 - 2 * 70); // 70
      expect(S.radiant).toBe(2);
      expect(S.oscBuy.radiant).toBe(2);
    });

    it('残振珊瑚 → 铸潮波纹: 扣除残振, 记录 oscBuy', () => {
      coral.openExchangeModal('forging', '铸潮波纹', 'oscillated');
      const config = openModal.mock.calls[0][0];
      const confirm = config.actions.find(a => a.label === '确认兑换');
      confirm.fn(1);

      expect(S.oscillated).toBe(210 - 70); // 140
      expect(S.forging).toBe(1);
      expect(S.oscBuy.forging).toBe(1);
    });
  });

  // ============================================================
  // Test 5: 波纹买断的限购 — oscBuy 每版本 7 次 + waveBuy 每版本 2 次
  // ============================================================
  describe('波段买断限购', () => {
    it('oscBuy 已满 7/7: 残振兑换不可用', () => {
      S.oscBuy.radiant = 7;
      coral.openExchangeModal('radiant', '浮金波纹', 'oscillated');
      expect(openModal).not.toHaveBeenCalled();
    });

    it('oscBuy 6/7 时仍可兑换 1 次', () => {
      S.oscBuy.radiant = 6;
      coral.openExchangeModal('radiant', '浮金波纹', 'oscillated');
      expect(openModal).toHaveBeenCalledTimes(1);
    });

    it('waveBuy 每版本 2/2 时不能再兑换回音频段', () => {
      S.roles['维里奈'] = { n: '维里奈', r: 5, owned: 1, chain: 2, level: 90, pulled: 1, spare: 0 };
      S.waveBuy['维里奈'] = 2; // 已满
      S.afterglow = 540;

      coral.openWaveModal();
      // 单一候选且 maxN<=0 → openSingleWave 直接 msg() 返回, 不调 openModal
      expect(openModal).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Test 6: 联动版本珊瑚/波纹 — dream/mirage 通过 openExchangeModal
  // ============================================================
  describe('联动珊瑚/波纹 (dream/mirage)', () => {
    it('捕梦波纹(dream)可通过余波珊瑚兑换', () => {
      S.afterglow = 80;
      coral.openExchangeModal('dream', '捕梦波纹', 'afterglow');
      expect(openModal).toHaveBeenCalledTimes(1);
      const config = openModal.mock.calls[0][0];

      const confirm = config.actions.find(a => a.label === '确认兑换');
      expect(confirm).toBeDefined();

      confirm.fn(2);
      expect(S.afterglow).toBe(80 - 2 * 8); // 64
      expect(S.dream).toBe(2);
    });

    it('铭影波纹(mirage)可通过余波珊瑚兑换', () => {
      S.afterglow = 24;
      coral.openExchangeModal('mirage', '铭影波纹', 'afterglow');
      const config = openModal.mock.calls[0][0];
      const confirm = config.actions.find(a => a.label === '确认兑换');
      confirm.fn(3);

      expect(S.afterglow).toBe(0);
      expect(S.mirage).toBe(3);
    });

    it('捕梦波纹可通过残振珊瑚兑换(含 oscBuy 跟踪)', () => {
      S.oscillated = 280;
      S.oscBuy.dream = 0;
      coral.openExchangeModal('dream', '捕梦波纹', 'oscillated');
      const config = openModal.mock.calls[0][0];
      const confirm = config.actions.find(a => a.label === '确认兑换');
      confirm.fn(2);

      expect(S.oscillated).toBe(280 - 2 * 70); // 140
      expect(S.dream).toBe(2);
      expect(S.oscBuy.dream).toBe(2);
    });
  });
});
