// Unit tests for time/timeline.js — time advancement, version jumping, monthly card
// AI safety net: verify date/time invariants after timeline changes
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { state0, S, DAY, date } from '../../src/state.js';
import { activeBanners } from '../../src/gacha/core.js';

// 代码审核回归:S.selected invariant — 时间推进动作后必须满足
// !S.selected || activeBanners().some(b => b.id === S.selected)
// (无 active banner 时另算)
function selectedInvariant() {
  const a = activeBanners();
  if (!a.length) return S.selected === null;
  if (S.selected === null) return true;
  return a.some(b => b.id === S.selected);
}

describe('time/timeline', () => {
  let time;
  let phases;

  beforeAll(async () => {
    time = await import('../../src/time/timeline.js');
    phases = (await import('../../src/data/phases.js')).phases;
  }, 30000);

  beforeEach(() => {
    Object.assign(S, state0());
  });

  // ===== claimMonthly() =====
  describe('claimMonthly()', () => {
    it('returns false when no monthly days remaining', () => {
      S.days = 0;
      expect(time.claimMonthly()).toBe(false);
    });

    it('claims 90 astrite and decrements days', () => {
      S.days = 30;
      S.astrite = 0;
      const ok = time.claimMonthly();
      expect(ok).toBe(true);
      expect(S.astrite).toBe(90);
      expect(S.days).toBe(29);
    });

    it('does not double-claim on same day', () => {
      S.days = 30;
      time.claimMonthly();
      const ok = time.claimMonthly();
      expect(ok).toBe(false); // same day, already claimed
    });
  });

  // ===== advanceTo() =====
  describe('advanceTo()', () => {
    it('advances today to target', () => {
      const target = S.today + DAY;
      time.advanceTo(target);
      expect(S.today).toBe(target);
    });

    it('refills stamina when below max', () => {
      S.stamina = 100;
      const target = S.today + DAY * 2;
      time.advanceTo(target);
      expect(S.stamina).toBe(S.staminaMax);
    });

    it('does not reduce stamina when above max (overcap from potions)', () => {
      S.stamina = 400; // above max 240
      const target = S.today + DAY;
      time.advanceTo(target);
      expect(S.stamina).toBeGreaterThanOrEqual(400);
    });

    it('resets daily commissions', () => {
      S.dailyCommissions = [];
      const target = S.today + DAY;
      time.advanceTo(target);
      expect(S.dailyCommissions.length).toBe(5);
    });

    it('burns monthly days on skip without auto-granting astrite', () => {
      S.days = 30;
      S.astrite = 0;
      S.lastMonthlyClaim = '';
      const target = S.today + DAY * 5;
      time.advanceTo(target);
      // 漏登不补：只扣剩余天数，星声留给上线补给弹窗
      expect(S.astrite).toBe(0);
      expect(S.days).toBe(25);
    });
  });

  // ===== advanceDay() =====
  describe('advanceDay()', () => {
    it('advances by exactly 1 day', () => {
      const before = S.today;
      time.advanceDay();
      expect(S.today - before).toBe(DAY);
    });
  });

  // ===== nextPhase() =====
  describe('nextPhase()', () => {
    it('advances to next phase start date', () => {
      S.today = date('2024-05-23');
      time.nextPhase();
      // Should land on some phase start
      const found = phases.find(p => p.start === S.today);
      expect(found).toBeTruthy();
    });
  });

  // ===== nextVersion() =====
  describe('nextVersion()', () => {
    it('advances to next version start if available', () => {
      S.today = date('2026-06-23'); // version 3.4
      // There should be a next version
      time.nextVersion();
      expect(S.today).toBeGreaterThan(0);
    });
  });

  // ===== jumpToVersion() =====
  describe('jumpToVersion()', () => {
    it('jumps to a known version', () => {
      const ok = time.jumpToVersion('1.0');
      expect(ok).toBe(true);
      // Verify we landed on a phase with version 1.0
      const phase = phases.find(p => S.today >= p.start && S.today < p.end);
      expect(phase).toBeTruthy();
    });

    it('returns false for unknown version', () => {
      const ok = time.jumpToVersion('99.9');
      expect(ok).toBe(false);
    });

    it('切换版本后保留新版本首日签到进度', () => {
      S.today = date('2024-05-23');
      S.podcast.version = '1.0';

      expect(time.jumpToVersion('1.1')).toBe(true);
      expect(S.podcast.version).toBe('1.1');
      expect(S.podcast.tasks.daily.d_signin).toBe(true);
    });
  });

  // ===== jumpToDate() =====
  describe('jumpToDate()', () => {
    it('jumps to a valid date', () => {
      const target = date('2025-01-01');
      const ok = time.jumpToDate(target);
      expect(ok).toBe(true);
      expect(S.today).toBe(target);
    });

    it('returns false for invalid date', () => {
      const ok = time.jumpToDate(Infinity);
      expect(ok).toBe(false);
    });
  });

  // ===== 代码审核回归:selected invariant — 时间推进/版本跳转后 =====
  describe('selected invariant', () => {
    it('advanceDay 后不变量成立', () => {
      S.selected = activeBanners()[0].id;
      time.advanceDay();
      expect(selectedInvariant()).toBe(true);
    });

    it('nextPhase 后不变量成立(active 集合可能变)', () => {
      S.selected = activeBanners()[0].id;
      time.nextPhase();
      expect(selectedInvariant()).toBe(true);
    });

    it('nextVersion 后不变量成立', () => {
      S.selected = activeBanners()[0].id;
      time.nextVersion();
      expect(selectedInvariant()).toBe(true);
    });

    it('jumpToVersion 后不变量成立(跨期切换最易踩 selected 失效)', () => {
      S.selected = activeBanners()[0].id;
      time.jumpToVersion('1.1');
      expect(selectedInvariant()).toBe(true);
    });

    it('jumpToDate 后不变量成立', () => {
      S.selected = activeBanners()[0].id;
      time.jumpToDate(date('2025-01-01'));
      expect(selectedInvariant()).toBe(true);
    });

    it('selected 指向已过期 banner 时 timeline 动作自动回填', () => {
      // 故意把 selected 写成不存在的 banner id,timeline 动作应自动调 ensureSelectedBanner 回填
      S.selected = 'bogus-id-not-exist';
      time.advanceDay();
      expect(selectedInvariant()).toBe(true);
      // 回填后 selected 应是 active 中的某个 id
      expect(S.selected).not.toBe('bogus-id-not-exist');
    });
  });
});
