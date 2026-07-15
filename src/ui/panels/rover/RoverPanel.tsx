// 漂泊者 · topbar 入口：查看三形态 / 打开角色详情
import { h } from 'preact';
import { createPortal } from 'preact/compat';
import { useState, useEffect } from 'preact/hooks';
import { useS, bumpStateVersion } from '../../signals';
import { commit } from '../../../state/commit.ts';
import { ensureRover, listRoverForms } from '../../../rover/ensure.js';
import { openRoleModal } from '../../render/roleModal.js';

export function RoverBadgeButton({ onOpen }: { onOpen: () => void }) {
  useS();
  return (
    <button
      type="button"
      class="rover-btn"
      title="漂泊者"
      onClick={onOpen}
      aria-label="漂泊者"
    >
      <span class="rover-btn-icon">◈</span>
      <span class="rover-btn-label">漂泊者</span>
    </button>
  );
}

export function RoverModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useS();
  useEffect(() => {
    if (!open) return;
    commit(() => { ensureRover(); });
    bumpStateVersion();
  }, [open]);

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

  const forms = listRoverForms();

  const modal = (
    <div class="rover-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="漂泊者">
      <div class="rover-modal" onClick={e => e.stopPropagation()}>
        <div class="rover-modal-head">
          <div class="rover-modal-title">漂泊者</div>
          <button type="button" class="mbtn" onClick={onClose}>关闭</button>
        </div>
        <div class="rover-modal-body">
          <p class="rover-lead">
            免费迅刀主角 · 三属性调谐形态。开局自动拥有，不进入唤取卡池。
          </p>
          <div class="rover-form-list">
            {forms.map(f => (
              <button
                type="button"
                key={f.id}
                class="rover-form-card"
                onClick={() => {
                  openRoleModal(f.id);
                  onClose();
                }}
              >
                <div class="rover-form-name">{f.id}</div>
                <div class="rover-form-meta">
                  {f.element} · 迅刀 · Lv.{f.level}
                  {f.chain > 0 ? ` · ${f.chain} 链` : ''}
                </div>
                <div class="rover-form-hint">查看详情</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export function RoverEntry() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    commit(() => { ensureRover(); });
    bumpStateVersion();
  }, []);
  return (
    <div class="rover-entry">
      <RoverBadgeButton onOpen={() => setOpen(true)} />
      <RoverModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
