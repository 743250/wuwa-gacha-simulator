// 运营邮箱面板 · 左上角入口
// 弹层 portal 到 body：topbar sticky + backdrop-filter 会裁切 fixed 子层
import { h } from 'preact';
import { createPortal } from 'preact/compat';
import { useState, useEffect } from 'preact/hooks';
import { useS, bumpStateVersion } from '../../signals';
import { fmt } from '../../../state';
import { msg } from '../../services/toast.ts';
import { commit } from '../../../state/commit.ts';
import { RECIPROCAL_STANDARD_OPTIONS } from '../../../data/mails.js';
import {
  listInbox,
  claimMail,
  claimAllMails,
  markMailRead,
  formatRewardPreview,
  deliverDueMails,
  countUnreadMails,
  mailNeedsStandardPick,
} from '../../../mail/mailbox.js';

export function MailBadgeButton({ onOpen }: { onOpen: () => void }) {
  useS();
  const n = countUnreadMails();
  return (
    <button
      type="button"
      class="mail-btn"
      title="邮箱"
      onClick={onOpen}
      aria-label="邮箱"
    >
      <span class="mail-btn-icon">✉</span>
      <span class="mail-btn-label">邮箱</span>
      {n > 0 && <span class="mail-badge">{n > 99 ? '99+' : n}</span>}
    </button>
  );
}

export function MailModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const S = useS();
  const [selected, setSelected] = useState<string | null>(null);
  const [pickName, setPickName] = useState(RECIPROCAL_STANDARD_OPTIONS[0]);

  useEffect(() => {
    if (!open) return;
    commit(() => { deliverDueMails(S.today); });
    bumpStateVersion();
  }, [open, S.today]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const inbox = listInbox();
  const cur = selected ? inbox.find(m => m.id === selected) : inbox[0] || null;
  const activeId = cur?.id || null;
  const needsPick = cur ? mailNeedsStandardPick(cur.id) : false;

  const doClaim = (id: string) => {
    const opts = mailNeedsStandardPick(id) ? { pickName } : {};
    const r = commit(() => claimMail(id, opts));
    if (r?.needPick) {
      msg(r.err || '请先选择常驻五星');
    } else if (!r?.ok) {
      msg(r?.err || '领取失败');
    } else {
      msg(`已领取 · ${(r.lines || []).join(' · ')}`, false);
    }
    bumpStateVersion();
  };

  const doClaimAll = () => {
    const r = commit(() => claimAllMails());
    if (!r?.count) {
      if (r?.skippedPick) msg('请单独领取需自选的邮件（潮声答谢券）', false);
      else msg('没有可领取的邮件', false);
    } else {
      const extra = r.skippedPick ? ` · 另有 ${r.skippedPick} 封需自选` : '';
      msg(`一键领取 ${r.count} 封${extra}`, false);
    }
    bumpStateVersion();
  };

  const select = (id: string) => {
    setSelected(id);
    commit(() => markMailRead(id));
    bumpStateVersion();
  };

  const modal = (
    <div class="mail-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="邮箱">
      <div class="mail-modal" onClick={e => e.stopPropagation()}>
        <div class="mail-modal-head">
          <div class="mail-modal-title">邮箱</div>
          <div class="mail-modal-actions">
            <button type="button" class="mbtn gold" onClick={doClaimAll}>一键领取</button>
            <button type="button" class="mbtn" onClick={onClose}>关闭</button>
          </div>
        </div>

        <div class="mail-body">
          <div class="mail-list">
            {inbox.length === 0 && (
              <div class="mail-empty">暂无邮件</div>
            )}
            {inbox.map(m => (
              <button
                type="button"
                key={m.id}
                class={`mail-item${activeId === m.id ? ' on' : ''}${m.claimed ? ' claimed' : ''}`}
                onClick={() => select(m.id)}
              >
                <div class="mail-item-top">
                  <span class="mail-item-title">{m.title}</span>
                  {!m.claimed && <span class="mail-dot" />}
                </div>
                <div class="mail-item-meta">
                  {m.sender} · {fmt(m.sendAt)}
                  {m.claimed ? ' · 已领' : ' · 待领'}
                </div>
              </button>
            ))}
          </div>

          <div class="mail-detail">
            {!cur && <div class="mail-empty">选择左侧邮件查看</div>}
            {cur && (
              <>
                <div class="mail-detail-title">{cur.title}</div>
                <div class="mail-detail-meta">
                  发件人 {cur.sender} · {fmt(cur.sendAt)}
                  {cur.expiresAt != null && ` · 有效期至 ${fmt(cur.expiresAt)}`}
                </div>
                <div class="mail-detail-body">{cur.body}</div>
                <div class="mail-detail-reward">
                  <div class="mail-reward-label">附件</div>
                  <div class="mail-reward-val">{formatRewardPreview(cur.rewards)}</div>
                </div>
                {!cur.claimed && needsPick && (
                  <div class="mail-pick">
                    <div class="mail-reward-label">自选常驻五星</div>
                    <div class="mail-pick-row">
                      {RECIPROCAL_STANDARD_OPTIONS.map(name => (
                        <button
                          type="button"
                          key={name}
                          class={`mbtn${pickName === name ? ' gold' : ''}`}
                          onClick={() => setPickName(name)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div class="mail-detail-foot">
                  {cur.claimed ? (
                    <span class="mail-claimed-tag">{cur.category === 'notice' || !Object.keys(cur.rewards || {}).length ? '已阅' : '已领取'}</span>
                  ) : (
                    <button type="button" class="mbtn gold" onClick={() => doClaim(cur.id)}>
                      {needsPick
                        ? '确认自选并领取'
                        : (cur.category === 'notice' || !Object.keys(cur.rewards || {}).length)
                          ? '已阅'
                          : '领取附件'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

/** 挂到 topbar 左上：按钮 + 弹层 */
export function MailEntry() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    commit(() => { deliverDueMails(); });
    bumpStateVersion();
  }, []);
  return (
    <div class="mail-entry">
      <MailBadgeButton onOpen={() => setOpen(true)} />
      <MailModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
