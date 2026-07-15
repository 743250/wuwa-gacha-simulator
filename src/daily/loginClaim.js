// 上线可领 · 月卡每日星声 + 限时签到（特别感恩回馈等）
// 节奏对齐月卡：上线弹窗列出可领项 → 一点领取
import { S, date, fmt } from '../state.js';
import { msg } from '../ui/services/toast.ts';
import { commit } from '../state/commit.ts';
import { openModal } from '../modal.js';
import { ensureMailbox } from '../mail/mailbox.js';

/** 7/2 预告邮件；奖励不走邮箱附件，阶段解锁后上线签到领 */
export const GRATITUDE_PREVIEW_MAIL_ID = 'mail_1_1_gratitude_preview';

/** 特别感恩回馈 · 三阶段（服务器时间 04:00 解锁；模拟器按自然日） */
export const GRATITUDE_STAGES = [
  {
    id: 'radiant',
    unlockDate: '2024-07-04',
    label: '特别感恩回馈 · 第一阶段',
    detail: '浮金波纹 ×10',
    rewards: { radiant: 10 },
  },
  {
    id: 'forging',
    unlockDate: '2024-07-06',
    label: '特别感恩回馈 · 第二阶段',
    detail: '铸潮波纹 ×10',
    rewards: { forging: 10 },
  },
  {
    id: 'lustrous',
    unlockDate: '2024-07-10',
    label: '特别感恩回馈 · 第三阶段',
    detail: '唤声涡纹 ×10',
    rewards: { lustrous: 10 },
  },
];

/** 活动结束：2024-08-13 03:59 → 日粒度含 8/13 */
export const GRATITUDE_END = date('2024-08-13');

function ensureGratitudeState() {
  if (!S.gratitudeClaimed || typeof S.gratitudeClaimed !== 'object') {
    S.gratitudeClaimed = {};
  }
  return S.gratitudeClaimed;
}

function applyRewardBag(rewards, lines) {
  if (!rewards) return;
  if (rewards.astrite) {
    S.astrite = (S.astrite || 0) + rewards.astrite;
    lines.push(`星声 ×${rewards.astrite}`);
  }
  if (rewards.radiant) {
    S.radiant = (S.radiant || 0) + rewards.radiant;
    lines.push(`浮金波纹 ×${rewards.radiant}`);
  }
  if (rewards.forging) {
    S.forging = (S.forging || 0) + rewards.forging;
    lines.push(`铸潮波纹 ×${rewards.forging}`);
  }
  if (rewards.lustrous) {
    S.lustrous = (S.lustrous || 0) + rewards.lustrous;
    lines.push(`唤声涡纹 ×${rewards.lustrous}`);
  }
}

/** 当前日期可领列表（不写入状态） */
export function listPendingLoginClaims(today = S.today) {
  const items = [];
  const todayStr = fmt(today);

  if ((S.days || 0) > 0 && S.lastMonthlyClaim !== todayStr) {
    items.push({
      kind: 'monthly',
      id: 'monthly',
      title: '月相观测卡 · 每日补给',
      detail: '星声 ×90',
      rewards: { astrite: 90 },
    });
  }

  const claimed = ensureGratitudeState();
  if (today <= GRATITUDE_END) {
    for (const st of GRATITUDE_STAGES) {
      const unlock = date(st.unlockDate);
      if (today < unlock) continue;
      if (claimed[st.id]) continue;
      items.push({
        kind: 'gratitude',
        id: `gratitude_${st.id}`,
        stageId: st.id,
        title: st.label,
        detail: st.detail,
        rewards: st.rewards,
      });
    }
  }

  return items;
}

/** 领完感恩回馈后，把 7/2 预告邮件标为已阅（若仍在收件箱） */
function markGratitudePreviewRead() {
  const box = ensureMailbox();
  const id = GRATITUDE_PREVIEW_MAIL_ID;
  if (box.delivered[id]) {
    box.delivered[id].read = true;
    box.claimed[id] = true;
  }
}

/**
 * 一键领取全部待领。返回 { ok, count, lines }
 * 月卡：扣 1 天 +90 星声；感恩回馈：按阶段发波纹
 */
export function claimAllLoginClaims(today = S.today) {
  return commit(() => {
    const pending = listPendingLoginClaims(today);
    if (!pending.length) return { ok: false, count: 0, lines: [] };

    const lines = [];
    let n = 0;
    const todayStr = fmt(today);
    const claimed = ensureGratitudeState();

    for (const it of pending) {
      if (it.kind === 'monthly') {
        if ((S.days || 0) <= 0 || S.lastMonthlyClaim === todayStr) continue;
        S.days -= 1;
        applyRewardBag(it.rewards, lines);
        S.lastMonthlyClaim = todayStr;
        n++;
        continue;
      }
      if (it.kind === 'gratitude') {
        if (claimed[it.stageId]) continue;
        applyRewardBag(it.rewards, lines);
        claimed[it.stageId] = true;
        n++;
      }
    }
    if (n > 0 && pending.some(p => p.kind === 'gratitude')) {
      markGratitudePreviewRead();
    }

    return { ok: n > 0, count: n, lines };
  });
}

/** 同日同会话只自动弹一次 */
let lastAutoPromptKey = '';

/**
 * 若有待领则弹窗；force=true 时忽略同日去重（手动入口用）
 */
export function maybePromptLoginClaims({ force = false } = {}) {
  const pending = listPendingLoginClaims(S.today);
  if (!pending.length) return false;

  const key = `${fmt(S.today)}|${pending.map(p => p.id).join(',')}`;
  if (!force && key === lastAutoPromptKey) return false;
  lastAutoPromptKey = key;

  const rows = pending
    .map(p =>
      `<div style="margin:0 0 10px">` +
      `<div style="font-weight:600">${p.title}</div>` +
      `<div style="color:var(--gold);margin-top:2px">附件：${p.detail}</div>` +
      `</div>`,
    )
    .join('');

  openModal({
    title: '上线补给',
    body:
      `<div style="font-size:12px;line-height:1.7;color:var(--text)">` +
      `今日可领取以下内容：<br><br>${rows}` +
      `<span style="color:var(--muted);font-size:11px">点击领取后入账；未领可稍后再次打开本提示。</span>` +
      `</div>`,
    actions: [
      {
        label: '领取',
        cls: 'gold',
        fn: () => {
          const r = claimAllLoginClaims();
          if (r.ok) msg(`已领取 · ${r.lines.join(' · ')}`, false);
          else msg('没有可领取的内容', false);
        },
      },
      { label: '稍后', cls: '', fn: () => {} },
    ],
  });
  return true;
}

/** 测试/重置会话弹窗去重 */
export function resetLoginClaimPromptSession() {
  lastAutoPromptKey = '';
}
