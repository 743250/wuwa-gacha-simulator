// 稳定区结算：胜利至少 ★1 并发首通星声；超时不再 0 星 0 奖
import { describe, it, expect, beforeEach } from 'vitest';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import {
  startAbyssFloor,
  settleAbyss,
  getAbyssStars,
  grantStableZoneMissedRewardOnce,
} from '../../src/daily/abyss.js';

function winBattle(battle, { turn = 10, hpRatio = 1 } = {}) {
  battle.result = 'win';
  battle.finished = true;
  battle.turn = turn;
  for (const t of battle.team) {
    if (t.hpMax > 0) t.hp = Math.max(1, Math.floor(t.hpMax * hpRatio));
  }
}

describe('daily/abyss · 稳定区结算', () => {
  beforeEach(() => {
    resetState({ team: ['忌炎', '安可', '守岸人'] });
  });

  it('超时通关（turn>20）仍 ★1 且发 200 星声', () => {
    const b = startAbyssFloor('s1');
    expect(b).toBeTruthy();
    winBattle(b, { turn: 25, hpRatio: 1 });
    const before = S.astrite;
    const r = settleAbyss(b);
    expect(r.stars).toBe(1);
    expect(r.reward).toBe(200);
    expect(r.repeated).toBeFalsy();
    expect(S.astrite - before).toBe(200);
    expect(getAbyssStars().s1).toBe(1);
  });

  it('快通满血 ★3', () => {
    const b = startAbyssFloor('s1');
    winBattle(b, { turn: 10, hpRatio: 1 });
    const r = settleAbyss(b);
    expect(r.stars).toBe(3);
    expect(r.reward).toBe(200);
  });

  it('失败不写星、可再开', () => {
    const b = startAbyssFloor('s1');
    b.result = 'lose';
    b.finished = true;
    expect(settleAbyss(b)).toBe(0);
    expect(getAbyssStars().s1).toBeUndefined();
    expect(startAbyssFloor('s1')).toBeTruthy();
  });

  it('oneShot 已领后再打无重复奖励', () => {
    const b = startAbyssFloor('s1');
    winBattle(b, { turn: 10 });
    settleAbyss(b);
    expect(startAbyssFloor('s1')).toBeNull();
  });

  it('补偿 200 只发一次', () => {
    const a0 = S.astrite;
    const r1 = grantStableZoneMissedRewardOnce();
    expect(r1.ok).toBe(true);
    expect(S.astrite - a0).toBe(200);
    const r2 = grantStableZoneMissedRewardOnce();
    expect(r2.ok).toBe(false);
    expect(S.astrite - a0).toBe(200);
  });
});
