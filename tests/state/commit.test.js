// Unit tests for src/state/commit.ts — 统一状态写入入口
// AI safety net: 验证 commit 不吞异常、推进版本、{save:true} 触发 saveState
//
// 注意:不能 vi.resetModules() —— S 是模块级单例,signals 的 stateVersion 也是单例,
// resetModules 会让 commit.ts import 一份新的 S 和 stateVersion,与生产 import 不同步。
// 测试靠 beforeEach Object.assign(S, state0()) 把字段重置回初值,模块引用保持稳定。
// saveState 用 vi.mock 顶层桩,每个 beforeEach mockClear 隔离调用计数。
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/save.js', () => ({
  saveState: vi.fn(),
}));

import { state0, S } from '../../src/state.js';
import { stateVersion } from '../../src/ui/signals.ts';
import { commit } from '../../src/state/commit.ts';
import { saveState } from '../../src/save.js';

describe('state/commit', () => {
  beforeEach(() => {
    Object.assign(S, state0());
    saveState.mockClear();
  });

  it('runs mutator and applies writes to S', () => {
    const before = S.astrite;
    commit(s => { s.astrite += 50; });
    expect(S.astrite).toBe(before + 50);
  });

  it('bumps stateVersion each call', () => {
    const v0 = stateVersion.value;
    commit(s => { s.today += 1; });
    expect(stateVersion.value).toBe(v0 + 1);
    commit(s => { s.today += 1; });
    expect(stateVersion.value).toBe(v0 + 2);
  });

  it('returns mutator return value', () => {
    const r = commit(() => 42);
    expect(r).toBe(42);
  });

  it('saves by default (safe-first)', () => {
    commit(s => { s.astrite = 0; });
    expect(saveState).toHaveBeenCalledTimes(1);
  });

  it('does NOT save when {save:false}', () => {
    commit(s => { s.tab = 'x'; }, { save: false });
    expect(saveState).not.toHaveBeenCalled();
  });

  it('calls saveState when {save:true} (explicit)', () => {
    commit(s => { s.today = 0; }, { save: true });
    expect(saveState).toHaveBeenCalledTimes(1);
  });

  it('does NOT swallow mutator errors', () => {
    expect(() => commit(() => { throw new Error('boom'); })).toThrow('boom');
  });

  it('does NOT bump or save when mutator throws', () => {
    const v0 = stateVersion.value;
    expect(() => commit(() => { throw new Error('boom'); }, { save: true })).toThrow('boom');
    expect(stateVersion.value).toBe(v0);
    expect(saveState).not.toHaveBeenCalled();
  });
});