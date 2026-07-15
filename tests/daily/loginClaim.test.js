// 上线补给：月卡 + 特别感恩回馈
import { describe, it, expect, beforeEach } from 'vitest';
import { resetState } from '../helpers.js';
import { S, date } from '../../src/state.js';
import {
  listPendingLoginClaims,
  claimAllLoginClaims,
  GRATITUDE_STAGES,
  resetLoginClaimPromptSession,
} from '../../src/daily/loginClaim.js';
import { deliverDueMails, getMailDef } from '../../src/mail/mailbox.js';

describe('daily/loginClaim', () => {
  beforeEach(() => {
    resetState();
    resetLoginClaimPromptSession();
    S.astrite = 0;
    S.radiant = 0;
    S.forging = 0;
    S.lustrous = 0;
    S.days = 0;
    S.lastMonthlyClaim = '';
    S.gratitudeClaimed = {};
  });

  it('月卡当日可领 90 星声，同日不重复', () => {
    S.days = 10;
    S.today = date('2024-07-01');
    const list = listPendingLoginClaims();
    expect(list.some(x => x.kind === 'monthly')).toBe(true);
    const r = claimAllLoginClaims();
    expect(r.ok).toBe(true);
    expect(S.astrite).toBe(90);
    expect(S.days).toBe(9);
    expect(listPendingLoginClaims().some(x => x.kind === 'monthly')).toBe(false);
    expect(claimAllLoginClaims().ok).toBe(false);
  });

  it('7/2 先收到预告邮件；7/4 才可上线领浮金', () => {
    S.today = date('2024-07-02');
    deliverDueMails(S.today);
    expect(listPendingLoginClaims().some(x => x.kind === 'gratitude')).toBe(false);
    expect(S.mailbox.delivered['mail_1_1_gratitude_preview']).toBeTruthy();

    S.today = date('2024-07-04');
    deliverDueMails(S.today);
    const list = listPendingLoginClaims();
    expect(list.map(x => x.stageId).filter(Boolean)).toEqual(['radiant']);
    const r = claimAllLoginClaims();
    expect(r.ok).toBe(true);
    expect(S.radiant).toBe(10);
    expect(S.gratitudeClaimed.radiant).toBe(true);
    // 领取后预告邮件标已阅
    expect(S.mailbox.claimed['mail_1_1_gratitude_preview']).toBe(true);
  });

  it('7/10 可一次领齐三阶段', () => {
    S.today = date('2024-07-10');
    const r = claimAllLoginClaims();
    expect(r.count).toBe(3);
    expect(S.radiant).toBe(10);
    expect(S.forging).toBe(10);
    expect(S.lustrous).toBe(10);
    expect(listPendingLoginClaims()).toHaveLength(0);
  });

  it('活动结束后不可再领感恩回馈', () => {
    S.today = date('2024-08-14');
    expect(listPendingLoginClaims().some(x => x.kind === 'gratitude')).toBe(false);
  });

  it('7/2 预告邮件无附件 notice', () => {
    const def = getMailDef('mail_1_1_gratitude_preview');
    expect(def.category).toBe('notice');
    expect(Object.keys(def.rewards || {})).toHaveLength(0);
    expect(GRATITUDE_STAGES).toHaveLength(3);
  });
});
