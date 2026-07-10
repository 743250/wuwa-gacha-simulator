// 开局入坑设置模态
//
// 调用 openStartSetupModal() 弹出,两步选完 → 调用 applyStartSetup 应用
// 第一次进游戏 + 重置存档时自动触发

import { h, render as preactRender } from 'preact';
import { useState } from 'preact/hooks';
import { phases, VERSION_NAMES } from '../../data/phases.js';
import { resolveProfile, collectUPTChars } from '../../data/startProfiles.js';
import { applyStartSetup, StartType, isSetupDone } from './applyStartSetup.js';
import { hasLocalStorageSave } from '../../save.js';

function openModalPreact(node: any) {
  const modal = document.getElementById('modal');
  const box = document.getElementById('modalBox');
  if (!modal || !box) return;
  box.className = 'modal-box start-setup-modal';
  box.innerHTML = '';
  const root = document.createElement('div');
  box.appendChild(root);
  preactRender(node, root);
  modal.classList.add('on');
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

function closeModal() {
  const modal = document.getElementById('modal');
  const box = document.getElementById('modalBox');
  if (modal) {
    modal.classList.remove('on');
    modal.onclick = null;
  }
  if (box) box.innerHTML = '';
}

const TYPE_CARDS: Array<{ key: StartType; label: string; icon: string; desc: string; }> = [
  {
    key: 'newbie',
    label: '新手入坑',
    icon: '🌱',
    desc: '纯萌新号,初始资源少,一切从头开始',
  },
  {
    key: 'self',
    label: '自抽号入坑',
    icon: '🎲',
    desc: '科技号刷深塔资源,6-8 万星声,无任何角色 · ¥40-50',
  },
  {
    key: 'buy',
    label: '买号入坑',
    icon: '💎',
    desc: '带内容的成品号,有角色武器和充值记录',
  },
];

function StartSetupInner() {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<StartType | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  // 版本列表(去重,按 v 顺序)
  const versionList: Array<{ v: string; start: number }> = [];
  const seen = new Set<string>();
  for (const p of phases) {
    if (!seen.has(p.v)) {
      seen.add(p.v);
      versionList.push({ v: p.v, start: p.start });
    }
  }

  function handleConfirm() {
    if (!type || !version) return;
    applyStartSetup(type, version);
    closeModal();
  }

  // Step 1: 选入坑方式
  if (step === 1) {
    return (
      <div>
        <h3>游戏开局设置 · 选择入坑方式</h3>
        <div class="start-intro">
          第一次进入游戏,请选择你的入坑方式。不同入坑方式的初始资源、角色、充值记录都不同。
        </div>
        <div class="start-type-grid">
          {TYPE_CARDS.map((c) => (
            <button
              key={c.key}
              class={`start-type-card ${type === c.key ? 'active' : ''}`}
              onClick={() => { setType(c.key); setStep(2); }}
            >
              <div class="start-type-icon">{c.icon}</div>
              <div class="start-type-label">{c.label}</div>
              <div class="start-type-desc">{c.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: 选入坑版本
  const profile = type ? resolveProfile(type, version || '1.0') : null;

  return (
    <div>
      <h3>游戏开局设置 · 选择入坑版本</h3>
      <div class="start-intro">
        入坑方式:<b style={{ color: 'var(--gold)' }}>{TYPE_CARDS.find((c) => c.key === type)?.label}</b>
        <button class="mbtn" style={{ marginLeft: 8, padding: '2px 10px', fontSize: 10 }} onClick={() => setStep(1)}>返回</button>
      </div>
      <div class="start-version-grid">
        {versionList.map((v) => {
          const chars = type === 'buy' ? collectUPTChars(v.v) : [];
          const prof = resolveProfile(type || 'newbie', v.v);
          const isCur = version === v.v;
          return (
            <button
              key={v.v}
              class={`start-version-card ${isCur ? 'active' : ''}`}
              onClick={() => setVersion(v.v)}
            >
              <div class="start-ver-num">{v.v}</div>
              <div class="start-ver-name">{VERSION_NAMES[v.v] || v.v}</div>
              {type === 'buy' && (
                <div class="start-ver-preview">
                  <span style={{ color: 'var(--gold)' }}>已玩 {prof.days} 天</span>
                  <span class="dim">·</span>
                  <span>¥{prof.price.toLocaleString()}</span>
                </div>
              )}
              {type === 'self' && (
                <div class="start-ver-preview">
                  <span style={{ color: 'var(--gold)' }}>{prof.astrite.toLocaleString()} 星声</span>
                  <span class="dim">·</span>
                  <span>市场价 ¥{prof.price}</span>
                </div>
              )}
              {type === 'newbie' && (
                <div class="start-ver-preview">
                  <span class="dim">纯萌新,无任何 5★</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {type === 'buy' && version && (
        <div class="start-buy-summary">
          <div class="dim">账号预览(版本 {version} · 已玩 {profile!.days} 天):</div>
          <div>
            <span class="dim">起始角色:</span>
            <b style={{ color: 'var(--gold)' }}>{collectUPTChars(version)[0] || '—'}</b>
            <span class="dim" style={{ marginLeft: 6 }}>· 每天概率抽到新 UP 角色/武器/声骸 + 升级</span>
          </div>
          <div>
            <span class="dim">共鸣链上限:</span>
            <b>+{profile!.chainMax}/6</b>
            <span class="dim" style={{ marginLeft: 6 }}>· 抽卡记录约 {profile!.logCount} 条</span>
          </div>
          <div>
            <b style={{ color: 'var(--red)' }}>市场价 ¥{profile!.price.toLocaleString()}</b>
            <span class="dim" style={{ marginLeft: 6 }}>· 官方充值累计 ¥{profile!.spent.toLocaleString()}</span>
          </div>
        </div>
      )}
      <div class="modal-acts">
        <button class="mbtn" onClick={() => setStep(1)}>返回</button>
        <button
          class="mbtn gold"
          disabled={!version}
          onClick={handleConfirm}
        >
          确定开始
        </button>
      </div>
    </div>
  );
}

export function openStartSetupModal() {
  openModalPreact(<StartSetupInner />);
}

// 第一次进入游戏(无 localStorage 存档 + 未标记 setup_done)时返回 true
// 用于首屏自动弹开局设置
export function isStartSetupNeeded(): boolean {
  if (isSetupDone()) return false;
  if (hasLocalStorageSave()) return false;
  return true;
}
