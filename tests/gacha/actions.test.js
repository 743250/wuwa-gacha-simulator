import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { state0, S, setAnimating } from '../../src/state.js';

vi.mock('../../src/modal.js', () => ({ openModal: vi.fn() }));
vi.mock('../../src/gacha/animation.js', () => ({ showResult: vi.fn() }));
vi.mock('../../src/rerender.js', () => ({ rerenderAll: vi.fn() }));
vi.mock('../../src/save.js', () => ({ saveState: vi.fn() }));

import { openModal } from '../../src/modal.js';
import { showResult } from '../../src/gacha/animation.js';
import { doPullN, toFive } from '../../src/gacha/actions.js';

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
});
