import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { state0, S } from '../../src/state.js';
import { setAnimating } from '../../src/ui/gachaAnimationState.js';

vi.mock('../../src/modal.js', () => ({ openModal: vi.fn() }));
vi.mock('../../src/ui/gacha/animation.js', () => ({ showResult: vi.fn() }));
vi.mock('../../src/rerender.js', () => ({ rerenderAll: vi.fn() }));
vi.mock('../../src/save.js', () => ({ saveState: vi.fn() }));

import { openModal } from '../../src/modal.js';
import { showResult } from '../../src/ui/gacha/animation.js';
import { doPullN, toFive } from '../../src/gacha/actions.js';
import { activeBanners } from '../../src/gacha/core.js';

// invariant:S.selected 必须为 null 或指向 activeBanners() 中的某个 banner
function selectedInvariant() {
  const a = activeBanners();
  if (!a.length) return S.selected === null;
  if (S.selected === null) return true; // null 是合法值,cur() 会 fallback
  return a.some(b => b.id === S.selected);
}

function setupGuaranteedFive() {
  Object.assign(S, state0());
  setAnimating(false);
  S.selected = 'standard-char';
  S.pity.standardChar = 79;
  S.podcast.tasks.period.p_pull50 = 11;
  S.podcast.tasks.period.p_pull200 = 11;
}

beforeEach(() => {
  setupGuaranteedFive();
  vi.clearAllMocks();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gacha/actions', () => {
  it('保留试手唤取行为并同步电台任务', () => {
    const lustrousBefore = S.lustrous;

    doPullN(1, true);

    expect(S.lustrous).toBe(lustrousBefore);
    expect(S.total).toBe(1);
    expect(S.podcast.tasks.daily.d_pull).toBe(true);
    expect(S.podcast.tasks.period.p_pull50).toBe(12);
    expect(S.podcast.tasks.period.p_pull200).toBe(12);
    expect(S.podcast.tasks.period.p_five).toBe(true);
  });

  it('抽到下个五星会同步累计唤取与五星任务', () => {
    S.lustrous = 1;

    toFive();
    const confirm = openModal.mock.calls[0][0].actions.find(a => a.cls === 'primary');
    confirm.fn();

    expect(S.total).toBe(1);
    expect(S.five).toBe(1);
    expect(S.log).toHaveLength(1);
    expect(S.log[0].r).toBe(5);
    expect(S.podcast.tasks.daily.d_pull).toBe(true);
    expect(S.podcast.tasks.period.p_pull50).toBe(12);
    expect(S.podcast.tasks.period.p_pull200).toBe(12);
    expect(S.podcast.tasks.period.p_five).toBe(true);
    expect(showResult).toHaveBeenCalledTimes(1);
  });

  it('抽到下个五星支持仅使用月相，并只转换实际消耗量', () => {
    S.lustrous = 0;
    S.astrite = 0;
    S.lunite = 320;

    toFive();
    const confirm = openModal.mock.calls[0][0].actions.find(a => a.cls === 'primary');
    confirm.fn();

    expect(S.total).toBe(1);
    expect(S.five).toBe(1);
    expect(S.lunite).toBe(160);
    expect(S.astrite).toBe(0);
  });

  // ===== 代码审核回归:新手池第 50 抽关闭后 S.selected 必须回填 =====
  it('新手池抽到 50 次后 beginnerDone=true,selected 自动回填到 active banner', () => {
    // 准备:把 selected 设成 beginner,beginnerPulls 已经 49,
    // 这样下一次抽到第 50 抽就关闭新手池
    S.selected = 'beginner';
    S.beginnerPulls = 49;
    S.pity.beginner = 0;
    S.p4.beginner = 0;
    S.lustrous = 10; // 资源充足
    S.astrite = 1_000_000;

    // 新手池只支持十连,所以 doPullN(10) 会触发
    // 但 beginnerPulls=49,十连的第一抽就到 50 关池,后续 9 抽会用 freePull=true
    // (payBeginnerTen 已经付过一次的钱)
    doPullN(10);

    expect(S.beginnerDone).toBe(true);
    expect(S.beginnerPulls).toBeGreaterThanOrEqual(50);
    // 关键断言:selected 必须被 ensureSelectedBanner 回填到 active 集合里
    expect(selectedInvariant()).toBe(true);
    // 更具体:不能再停在 'beginner',因为 activeBanners 已不含它
    expect(S.selected).not.toBe('beginner');
  });

  // ===== invariant 测试:抽卡动作完成后 selected 必须满足 invariant =====
  it('invariant: 单抽完成后 !S.selected || active 含 selected', () => {
    S.selected = 'standard-char';
    doPullN(1, true);
    expect(selectedInvariant()).toBe(true);
  });

  it('invariant: 十连完成后 !S.selected || active 含 selected', () => {
    S.selected = 'standard-char';
    S.astrite = 1_000_000;
    doPullN(10, true);
    expect(selectedInvariant()).toBe(true);
  });
});
