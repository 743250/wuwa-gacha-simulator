// 运营邮箱：仅核实条目 · 日历投递 · 一次性领取
import { describe, it, expect, beforeEach } from 'vitest';
import { resetState } from '../helpers.js';
import { S, date } from '../../src/state.js';
import {
  deliverDueMails,
  claimMail,
  claimAllMails,
  listInbox,
  countUnreadMails,
  mailSendAt,
  getMailDef,
  pruneMailbox,
  ensureMailbox,
  MAIL_INBOX_CAP,
  MAIL_VALID_DAYS,
} from '../../src/mail/mailbox.js';
import { MAIL_CATALOG } from '../../src/data/mails.js';
import { DAY } from '../../src/state.js';

describe('mail/mailbox · 核实目录', () => {
  beforeEach(() => {
    resetState();
    S.today = date('2024-05-24');
    S.astrite = 0;
    S.lustrous = 0;
    S.radiant = 0;
    S.forging = 0;
    S.materials.crystal_solvent = 0;
  });

  it('目录不含虚构周年/问卷包', () => {
    expect(MAIL_CATALOG.some(m => /anni|survey|festival|新春|周年/.test(m.id + m.category + m.title))).toBe(false);
    // 有附件的条目必须有 rewards；notice 允许空附件
    expect(MAIL_CATALOG.every(m => m.rewards && (m.category === 'notice' || Object.keys(m.rewards).length > 0))).toBe(true);
  });

  it('特别感恩回馈 7/2 先发预告邮件、无附件；阶段奖励不在邮件', () => {
    const def = getMailDef('mail_1_1_gratitude_preview');
    expect(def).toBeTruthy();
    expect(def.date).toBe('2024-07-02');
    expect(def.category).toBe('notice');
    expect(Object.keys(def.rewards || {})).toHaveLength(0);
    expect(def.title).toBe('《鸣潮》活动预告丨<特别感恩回馈>限时签到活动即将开始！');
    // TapTap 原文段落齐全
    expect(def.body).toContain('指定领取时间后登录游戏，即可免费领取浮金波纹*10、铸潮波纹*10、唤声涡纹*10！');
    expect(def.body).toContain('✦活动时间✦');
    expect(def.body).toContain('2024年7月4日04:00 ~ 2024年8月13日03:59');
    expect(def.body).toContain('✦奖励内容✦');
    expect(def.body).toContain('浮金波纹*10，铸潮波纹*10，唤声涡纹*10。');
    expect(def.body).toContain('✦开放条件✦');
    expect(def.body).toContain('联觉等级达到8级。');
    expect(def.body).toContain('✦活动说明✦');
    expect(def.body).toContain('本次活动奖励将分为三个阶段领取');
    expect(def.body).toContain('7月4日04:00 · 浮金波纹*10');
    expect(def.body).toContain('7月6日04:00 · 铸潮波纹*10');
    expect(def.body).toContain('7月10日04:00 · 唤声涡纹*10');
    expect(def.body).toContain('不会通过邮件进行补发');
    expect(getMailDef('mail_1_1_gratitude_notice_radiant')).toBeNull();

    S.today = date('2024-07-02');
    deliverDueMails(S.today);
    expect(listInbox().some(m => m.id === 'mail_1_1_gratitude_preview')).toBe(true);
    const r = claimMail('mail_1_1_gratitude_preview');
    expect(r.ok).toBe(true);
    expect(S.radiant).toBe(0);
    expect(S.lustrous).toBe(0);
    expect(S.forging).toBe(0);
  });

  it('5/24 同日两封：性能唤声 + 体验浮金；答谢券未来不投', () => {
    const newly = deliverDueMails(S.today);
    expect(newly).toContain('mail_1_0_experience_lustrous');
    expect(newly).toContain('mail_1_0_official_apology_0525');
    expect(newly).not.toContain('mail_1_0_reciprocal_voucher');
    expect(getMailDef('mail_1_0_experience_lustrous').rewards.lustrous).toBe(10);
    expect(getMailDef('mail_1_0_official_apology_0525').rewards.radiant).toBe(10);
    expect(getMailDef('mail_1_0_official_apology_0525').date).toBe('2024-05-24');
  });

  it('6/3 致歉为一封合并附件，非拆分', () => {
    const def = getMailDef('mail_1_0_official_apology_0603');
    expect(def.rewards).toEqual({ radiant: 10, forging: 5, crystal_solvent: 20 });
    expect(MAIL_CATALOG.filter(m => m.date === '2024-06-03' && m.category === 'apology')).toHaveLength(1);
  });

  it('声骸回收追加补偿贝币 100 万可领', () => {
    S.today = date('2024-06-06');
    deliverDueMails(S.today);
    const r = claimMail('mail_1_0_echo_shell_extra');
    expect(r.ok).toBe(true);
    expect(S.shellCredit).toBe(1000000);
  });

  it('维护补偿为 300 星声 + 溶剂 2', () => {
    const def = getMailDef('mail_2_0_maint');
    expect(def.rewards).toEqual({ astrite: 300, crystal_solvent: 2 });
    expect(mailSendAt(def)).toBeTruthy();
  });

  it('领取资源仅一次', () => {
    deliverDueMails(S.today);
    const r = claimMail('mail_1_0_experience_lustrous');
    expect(r.ok).toBe(true);
    expect(S.lustrous).toBe(10);
    expect(claimMail('mail_1_0_experience_lustrous').ok).toBe(false);
  });

  it('潮声答谢券须自选常驻五星', () => {
    S.today = date('2024-05-26');
    deliverDueMails(S.today);
    const need = claimMail('mail_1_0_reciprocal_voucher');
    expect(need.needPick).toBe(true);
    expect(need.ok).toBe(false);
    const r = claimMail('mail_1_0_reciprocal_voucher', { pickName: '维里奈' });
    expect(r.ok).toBe(true);
    expect(S.roles['维里奈']).toBeTruthy();
  });

  it('一键领取跳过需自选邮件', () => {
    S.today = date('2024-05-26');
    deliverDueMails(S.today);
    const r = claimAllMails();
    expect(r.count).toBeGreaterThan(0);
    expect(r.skippedPick).toBeGreaterThan(0);
    expect(listInbox().some(m => m.id === 'mail_1_0_reciprocal_voucher' && !m.claimed)).toBe(true);
    expect(countUnreadMails()).toBeGreaterThan(0);
  });

  it('超过 30 天有效期后不可见且不可领', () => {
    S.today = date('2024-05-24');
    deliverDueMails(S.today);
    expect(listInbox().some(m => m.id === 'mail_1_0_experience_lustrous')).toBe(true);
    // 发送日 + 30 天起过期
    S.today = date('2024-06-23');
    expect(listInbox().some(m => m.id === 'mail_1_0_experience_lustrous')).toBe(false);
    expect(claimMail('mail_1_0_experience_lustrous').ok).toBe(false);
    expect(S.lustrous).toBe(0);
  });

  it('有效期内可领，过期后角标不计', () => {
    S.today = date('2024-05-24');
    deliverDueMails(S.today);
    const before = countUnreadMails();
    expect(before).toBeGreaterThan(0);
    S.today = date('2024-06-23');
    pruneMailbox(S.today);
    expect(countUnreadMails()).toBe(0);
  });

  it('收件箱上限 99：最旧被清', () => {
    S.today = date('2024-05-24');
    const box = ensureMailbox();
    // 塞 100 封伪造投递（旧 → 新）
    for (let i = 0; i < 100; i++) {
      const id = `fake_mail_${i}`;
      box.delivered[id] = {
        at: date('2024-05-01') + i * DAY,
        deliveredOn: '2024-05-24',
        read: false,
      };
    }
    pruneMailbox(S.today);
    const visible = Object.values(box.delivered).filter(m => !m.purged).length;
    expect(visible).toBe(MAIL_INBOX_CAP);
    expect(box.delivered.fake_mail_0.purged).toBe(true);
    expect(box.delivered.fake_mail_99.purged).toBeFalsy();
  });
});
