import { describe, it, expect, beforeEach } from 'vitest';
import { state0, S, date, fmt } from '../../src/state.js';
import { phases } from '../../src/data/phases.js';
import { reconcilePeriodPullTasksFromLog } from '../../src/podcast/core.js';

beforeEach(() => {
  Object.assign(S, state0());
});

describe('podcast/core 抽卡日志校准', () => {
  it('按当前版本日志补齐累计任务并补发完成经验', () => {
    const version = '1.0';
    const versionStart = Math.min(...phases.filter(p => p.v === version).map(p => p.start));
    S.podcast.version = version;
    S.today = versionStart;
    S.podcast.tasks.period.p_pull50 = 11;
    S.podcast.tasks.period.p_pull200 = 11;
    S.log = Array.from({ length: 60 }, (_, i) => ({
      r: 3,
      date: fmt(versionStart),
      no: i + 1,
    }));

    expect(reconcilePeriodPullTasksFromLog()).toBe(true);
    expect(S.podcast.tasks.period.p_pull50).toBe(true);
    expect(S.podcast.tasks.period.p_pull200).toBe(60);
    expect(S.podcast.level).toBe(4);
    expect(S.podcast.exp).toBe(200);
  });

  it('忽略其他版本日志且不会让已有进度倒退', () => {
    S.podcast.version = '1.0';
    S.podcast.tasks.period.p_pull50 = 20;
    S.podcast.tasks.period.p_pull200 = 20;
    S.log = [{ r: 5, date: fmt(date('2025-01-01')), no: 1 }];

    expect(reconcilePeriodPullTasksFromLog()).toBe(false);
    expect(S.podcast.tasks.period.p_pull50).toBe(20);
    expect(S.podcast.tasks.period.p_pull200).toBe(20);
  });
});
