// 运营邮箱 · 投递 / 领取 / 查询
// 目录仅含已公开核实条目，见 src/data/mails.js
// 默认有效期 90 天（约三个月）；单封可配 expiresOn / validDays 覆盖（如潮声答谢券）
// 容量 99（过满清最旧）
import { S, DAY, date, fmt } from '../state.js';
import { phases } from '../data/phases.js';
import { MAIL_CATALOG, MAIL_SENDER_DEFAULT, RECIPROCAL_STANDARD_OPTIONS } from '../data/mails.js';
import { addRole } from '../gacha/core.js';

/** 邮件默认有效期（天），自发送日起算；约三个月 */
export const MAIL_VALID_DAYS = 90;
/** 收件箱可见上限 */
export const MAIL_INBOX_CAP = 99;

export function ensureMailbox() {
  if (!S.mailbox || typeof S.mailbox !== 'object') {
    S.mailbox = { delivered: {}, claimed: {} };
  }
  if (!S.mailbox.delivered) S.mailbox.delivered = {};
  if (!S.mailbox.claimed) S.mailbox.claimed = {};
  return S.mailbox;
}

function resolveSendAt(id, meta) {
  const def = getMailDef(id);
  const catalogAt = def ? mailSendAt(def) : null;
  if (catalogAt != null) {
    if (meta && meta.at !== catalogAt) meta.at = catalogAt;
    return catalogAt;
  }
  return meta?.at ?? null;
}

/**
 * 过期时刻（ms，UTC 日界）。today >= 返回值 即视为已过期。
 * 优先 def.expiresOn（YYYY-MM-DD，该自然日仍可领）→ def.validDays → 默认 MAIL_VALID_DAYS。
 */
export function mailExpiresAt(sendAt, def = null) {
  if (def?.expiresOn) {
    const endDay = date(def.expiresOn);
    if (Number.isFinite(endDay)) return endDay + DAY;
  }
  const days = def?.validDays != null ? Number(def.validDays) : MAIL_VALID_DAYS;
  if (sendAt == null || !Number.isFinite(sendAt)) return null;
  if (!Number.isFinite(days) || days < 0) return null;
  return sendAt + days * DAY;
}

export function isMailExpired(sendAt, today = S.today, def = null) {
  const exp = mailExpiresAt(sendAt, def);
  if (exp == null) return false;
  return today >= exp;
}

/**
 * 清理超容邮件 + 兼容旧存档的「过期永久 purged」。
 * - 过期：不再永久 purged；可见性按当前日历实时算，回跳日期后可再看见
 * - 超 99：仅对「当前日历下仍可见」的邮件，按发送时间从旧到新 purged（cap）
 * - 旧存档 purgeReason==='expire'：清除 purged，改由 isMailExpired 判定
 */
export function pruneMailbox(today = S.today) {
  const box = ensureMailbox();
  let changed = false;

  // 兼容：以前把过期永久 purged 掉，时间回跳后邮箱会空；解冻 expire 标记
  for (const meta of Object.values(box.delivered)) {
    if (meta?.purged && meta.purgeReason === 'expire') {
      delete meta.purged;
      delete meta.purgeReason;
      changed = true;
    }
  }

  // 容量：只对当前可见（未过期、未 cap 清）的邮件计数
  const active = Object.entries(box.delivered)
    .filter(([id, m]) => isVisibleMail(id, m, today))
    .map(([id, meta]) => ({ id, meta, at: resolveSendAt(id, meta) || 0 }))
    .sort((a, b) => a.at - b.at); // 旧 → 新

  if (active.length > MAIL_INBOX_CAP) {
    const drop = active.length - MAIL_INBOX_CAP;
    for (let i = 0; i < drop; i++) {
      active[i].meta.purged = true;
      active[i].meta.purgeReason = 'cap';
      changed = true;
    }
  }
  return changed;
}

function isVisibleMail(id, meta, today = S.today) {
  if (!meta || meta.purged) return false;
  const at = resolveSendAt(id, meta);
  if (at == null || at > today) return false;
  const def = getMailDef(id);
  if (isMailExpired(at, today, def)) return false;
  return true;
}

/** 版本号 → 该版本首个卡池 start（ms） */
const versionStartCache = new Map();
export function versionStartMs(ver) {
  if (versionStartCache.has(ver)) return versionStartCache.get(ver);
  const p = phases.find(x => x.v === ver);
  const t = p ? p.start : null;
  versionStartCache.set(ver, t);
  return t;
}

export function mailSendAt(mail) {
  if (mail.date) return date(mail.date);
  if (mail.version != null) {
    const base = versionStartMs(mail.version);
    if (base == null) return null;
    return base + (mail.sendDayOffset || 0) * DAY;
  }
  return null;
}

export function getMailDef(id) {
  return MAIL_CATALOG.find(m => m.id === id) || null;
}

/**
 * 按日历投递 sendAt ≤ today 的邮件。
 * - 已投递的不重复写（claimed / read 永久保留，时间来回跳不丢）
 * - 即使当前已过有效期也写入 delivered：回跳到有效期内仍可再看见 / 已领状态仍在
 * - 「新邮件」toast 只计当前可见且未领的
 */
export function deliverDueMails(today = S.today) {
  const box = ensureMailbox();
  pruneMailbox(today);
  const newly = [];
  for (const mail of MAIL_CATALOG) {
    if (box.delivered[mail.id]) continue;
    const at = mailSendAt(mail);
    if (at == null || at > today) continue;
    box.delivered[mail.id] = {
      at,
      deliveredOn: fmt(today),
      read: false,
    };
    newly.push(mail.id);
  }
  pruneMailbox(today);
  // 仅当前可见且未领的算「收到新邮件」
  return newly.filter(id => {
    if (box.claimed[id]) return false;
    return isVisibleMail(id, box.delivered[id], today);
  });
}

export function listInbox() {
  const box = ensureMailbox();
  pruneMailbox(S.today);
  const rows = [];
  for (const [id, meta] of Object.entries(box.delivered)) {
    const def = getMailDef(id);
    if (!def) continue;
    if (!isVisibleMail(id, meta, S.today)) continue;
    const catalogAt = mailSendAt(def);
    if (catalogAt != null && meta.at !== catalogAt) meta.at = catalogAt;
    const sendAt = catalogAt != null ? catalogAt : meta.at;
    rows.push({
      id,
      sender: def.sender || MAIL_SENDER_DEFAULT,
      title: def.title,
      body: def.body,
      rewards: def.rewards || {},
      category: def.category,
      sendAt,
      expiresAt: mailExpiresAt(sendAt, def),
      deliveredOn: meta.deliveredOn,
      read: !!meta.read,
      claimed: !!box.claimed[id],
      needsPick: !!(def.rewards && def.rewards.standard_selector),
    });
  }
  rows.sort((a, b) => (b.sendAt || 0) - (a.sendAt || 0));
  return rows;
}

/** 角标：未领取数量（仅收件箱可见） */
export function countUnreadMails() {
  const box = ensureMailbox();
  pruneMailbox(S.today);
  return Object.keys(box.delivered).filter(id => {
    if (box.claimed[id]) return false;
    return isVisibleMail(id, box.delivered[id], S.today);
  }).length;
}

export function markMailRead(id) {
  const box = ensureMailbox();
  if (box.delivered[id]) box.delivered[id].read = true;
}

function applyRewards(rewards) {
  if (!rewards) return [];
  const lines = [];
  if (rewards.astrite) {
    S.astrite = (S.astrite || 0) + rewards.astrite;
    lines.push(`星声 ×${rewards.astrite}`);
  }
  if (rewards.lunite) {
    S.lunite = (S.lunite || 0) + rewards.lunite;
    lines.push(`月相 ×${rewards.lunite}`);
  }
  if (rewards.lustrous) {
    S.lustrous = (S.lustrous || 0) + rewards.lustrous;
    lines.push(`唤声涡纹 ×${rewards.lustrous}`);
  }
  if (rewards.radiant) {
    S.radiant = (S.radiant || 0) + rewards.radiant;
    lines.push(`浮金波纹 ×${rewards.radiant}`);
  }
  if (rewards.forging) {
    S.forging = (S.forging || 0) + rewards.forging;
    lines.push(`铸潮波纹 ×${rewards.forging}`);
  }
  if (rewards.shell_credit) {
    S.shellCredit = (S.shellCredit || 0) + rewards.shell_credit;
    lines.push(`贝币 ×${rewards.shell_credit}`);
  }
  if (rewards.stamina) {
    S.stamina = Math.min(
      (S.staminaMax || 240) + 120,
      (S.stamina || 0) + rewards.stamina,
    );
    lines.push(`结晶波片 ×${rewards.stamina}`);
  }
  if (rewards.crystal_solvent) {
    S.materials = S.materials || {};
    S.materials.crystal_solvent = (S.materials.crystal_solvent || 0) + rewards.crystal_solvent;
    lines.push(`结晶溶剂 ×${rewards.crystal_solvent}`);
  }
  if (rewards.exp_high) {
    S.materials = S.materials || {};
    S.materials.exp_high = (S.materials.exp_high || 0) + rewards.exp_high;
    lines.push(`高级共鸣促剂 ×${rewards.exp_high}`);
  }
  if (rewards.weapon_book) {
    S.materials = S.materials || {};
    S.materials.weapon_book = (S.materials.weapon_book || 0) + rewards.weapon_book;
    lines.push(`武器石 ×${rewards.weapon_book}`);
  }
  return lines;
}

export function mailNeedsStandardPick(id) {
  const def = getMailDef(id);
  return !!(def && def.rewards && def.rewards.standard_selector);
}

/** 领取单封。潮声答谢券须传 pickName（常驻五星名） */
export function claimMail(id, { pickName } = {}) {
  const box = ensureMailbox();
  pruneMailbox(S.today);
  const def = getMailDef(id);
  if (!def) return { ok: false, err: '邮件不存在' };
  if (!box.delivered[id]) return { ok: false, err: '尚未收到该邮件' };
  if (!isVisibleMail(id, box.delivered[id], S.today)) {
    return { ok: false, err: '邮件已过期或已清理' };
  }
  if (box.claimed[id]) return { ok: false, err: '已领取' };

  const needPick = !!(def.rewards && def.rewards.standard_selector);
  if (needPick) {
    if (!pickName) {
      return {
        ok: false,
        needPick: true,
        options: RECIPROCAL_STANDARD_OPTIONS.slice(),
        err: '请选择一名常驻五星共鸣者',
      };
    }
    if (!RECIPROCAL_STANDARD_OPTIONS.includes(pickName)) {
      return {
        ok: false,
        needPick: true,
        options: RECIPROCAL_STANDARD_OPTIONS.slice(),
        err: '无效的自选角色',
      };
    }
  }

  const lines = applyRewards(def.rewards);
  if (needPick) {
    addRole(pickName, 5);
    lines.push(`潮声答谢券 · 自选 ${pickName}`);
  }
  const isNotice = def.category === 'notice' || !lines.length;
  if (isNotice && !lines.length) lines.push('已阅 · 无附件');
  box.claimed[id] = true;
  if (box.delivered[id]) box.delivered[id].read = true;
  return { ok: true, lines, title: def.title, pickName: needPick ? pickName : undefined, notice: isNotice };
}

/** 一键领取：跳过需自选的邮件（避免误领）；不含已过期/已清理 */
export function claimAllMails() {
  const box = ensureMailbox();
  pruneMailbox(S.today);
  const ids = Object.keys(box.delivered).filter(
    id => !box.claimed[id] && isVisibleMail(id, box.delivered[id], S.today),
  );
  const allLines = [];
  let n = 0;
  let skippedPick = 0;
  for (const id of ids) {
    if (mailNeedsStandardPick(id)) {
      skippedPick++;
      continue;
    }
    const r = claimMail(id);
    if (r.ok) {
      n++;
      allLines.push(...(r.lines || []));
    }
  }
  return { ok: true, count: n, lines: allLines, skippedPick };
}

export function formatRewardPreview(rewards) {
  if (!rewards || !Object.keys(rewards).length) return '（无附件 · 活动提醒）';
  const parts = [];
  if (rewards.astrite) parts.push(`星声 ×${rewards.astrite}`);
  if (rewards.stamina) parts.push(`结晶波片 ×${rewards.stamina}`);
  if (rewards.lustrous) parts.push(`唤声涡纹 ×${rewards.lustrous}`);
  if (rewards.radiant) parts.push(`浮金波纹 ×${rewards.radiant}`);
  if (rewards.forging) parts.push(`铸潮波纹 ×${rewards.forging}`);
  if (rewards.shell_credit) parts.push(`贝币 ×${rewards.shell_credit}`);
  if (rewards.lunite) parts.push(`月相 ×${rewards.lunite}`);
  if (rewards.crystal_solvent) parts.push(`结晶溶剂 ×${rewards.crystal_solvent}`);
  if (rewards.exp_high) parts.push(`高级共鸣促剂 ×${rewards.exp_high}`);
  if (rewards.weapon_book) parts.push(`武器突破石 ×${rewards.weapon_book}`);
  if (rewards.standard_selector) parts.push(`潮声答谢券 ×${rewards.standard_selector}（常驻五星自选）`);
  return parts.join(' · ');
}
