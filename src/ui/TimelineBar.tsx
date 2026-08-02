// 顶部时间线栏 · AppShell 去 headless（Phase 3）
// 原 index.html .timeline 静态节点 + AppShell bind* 事件绑定全部迁为 Preact 组件，
// 弹窗 body 走 VNode（modal.js dual-mode），不再拼接 HTML 字符串 + 事件委托。

import { h } from 'preact';
import { useRef } from 'preact/hooks';
import { useS, bumpStateVersion } from './signals';
import { S, resetState, fmt } from '../state.js';
import { msg } from './services/toast.ts';
import { advanceDay, nextPhase, nextVersion, jumpToday, jumpToVersion, jumpToDate } from '../time/timeline.js';
import { ensureSelectedBanner, activePhase } from '../gacha/core.js';
import { commit } from '../state/commit.ts';
import { openModal } from '../modal.js';
import { saveState, exportSave, importSave, clearSave, saveStateNow, pickSaveFolder, isFsSaveActive, isFsSupported } from '../save.js';
import { phases, VERSION_NAMES } from '../data/phases.js';
import { openStartSetupModal } from './setup/StartSetupModal';

function rerenderAll() {
  saveState();
  bumpStateVersion();
}

// ============ 存档管理 ============
function importSaveDialog() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    importSave(file, (ok: boolean, err?: string) => {
      if (ok) {
        // 导入存档可能让 S.selected 指向已失效 banner，显式回填首个可用 banner
        commit(() => { ensureSelectedBanner(); });
        rerenderAll();
        msg('存档导入成功', false);
      }
      else msg('导入失败:' + (err || '格式错误'));
    });
  };
  input.click();
}

function openSaveMgmt() {
  const supported = isFsSupported();
  const active = isFsSaveActive();
  const body = h('div', null,
    h('div', { style: 'font-size:11px;color:var(--muted);line-height:1.6;margin-bottom:10px' },
      h('b', { style: 'color:var(--gold)' }, '本地文件存档'),
      h('span', null, '（File System Access API）'),
      h('br', null),
      '授权一个文件夹后,存档直接写到本地真实文件,不再受浏览器隔离限制。',
      h('br', null),
      '可在资源管理器看到、可云盘同步、可手动备份。',
    ),
    h('div', { style: 'font-size:11px;margin-bottom:8px' },
      '状态:',
      supported
        ? (active
          ? h('b', { style: 'color:var(--green)' }, '已授权本地文件夹')
          : h('b', { style: 'color:var(--gold)' }, '未授权(仅 localStorage)'))
        : h('b', { style: 'color:var(--red)' }, '当前浏览器不支持(将仅用 localStorage)'),
    ),
  );
  const actions: any[] = [{ label: '关闭', cls: '', fn: () => {} }];
  if (supported) {
    actions.unshift({ label: active ? '重新选择文件夹' : '授权本地文件夹', cls: 'gold', fn: async () => {
      const ok = await pickSaveFolder();
      if (ok) {
        await saveStateNow();
        msg('已授权并保存到本地', false);
      }
      rerenderAll();
    }});
  }
  actions.unshift({ label: '导入存档', cls: '', fn: importSaveDialog });
  actions.unshift({ label: '导出存档', cls: '', fn: () => exportSave() });
  openModal({ title: '存档管理', body, actions });
}

// ============ 选版本 / 选日期 ============
const fmtDate = (t: number) => new Date(t).toISOString().slice(0, 10);

function VersionJumpRow({ today }: { today: number }) {
  const ref = useRef<HTMLInputElement>(null);
  return h('div', { style: 'text-align:center;font-size:11px;color:var(--muted)' },
    '跳到日期：',
    h('input', { ref, type: 'date', value: fmtDate(today), style: 'background:rgba(255,255,255,.06);color:var(--text);border:1px solid var(--line2);border-radius:6px;padding:4px 8px;font:inherit' }),
    h('button', {
      class: 'mbtn gold pick-date-btn',
      style: 'margin-left:6px',
      onClick: () => {
        const inp = ref.current;
        if (inp?.value) {
          const t = new Date(inp.value + 'T00:00:00Z').getTime();
          if (jumpToDate(t)) { rerenderAll(); msg(`跳到 ${inp.value}`, false); }
        }
      },
    }, '跳转'),
  );
}

function openPickVersion() {
  const versionMap = new Map<string, number>();
  phases.forEach(p => { if (!versionMap.has(p.v)) versionMap.set(p.v, p.start); });
  const allVersions = [...versionMap.entries()];
  const today = S.today;
  const body = h('div', null,
    h('div', { style: 'font-size:11px;color:var(--muted);line-height:1.6;margin-bottom:8px' },
      '点击版本号跳到该版本起始日；或在下面输入具体日期跳转。',
      h('br', null),
      h('b', { style: 'color:var(--gold)' }, '可前后切换时间'),
      '；向后推进会自动结算月卡 / 体力 / 礼包刷新，向前切换只改变当前日期与版本环境。',
    ),
    h('div', { style: 'display:flex;flex-wrap:wrap;justify-content:center;margin-bottom:10px' },
      allVersions.map(([v, t]) => {
        const isCur = t <= today && phases.some(p => p.v === v && today >= p.start && today < p.end);
        return h('button', {
          class: `mbtn pick-ver-btn ${isCur ? 'gold' : ''}`,
          style: 'margin:3px',
          onClick: () => { if (jumpToVersion(v)) { rerenderAll(); msg(`跳到版本 ${v}`, false); } },
        }, v, h('br', null), h('span', { style: 'font-size:9px;opacity:.7' }, fmtDate(t)));
      }),
    ),
    h(VersionJumpRow, { today }),
  );
  openModal({
    title: '选择版本 / 日期',
    body,
    actions: [{ label: '关闭', cls: '', fn: () => {} }],
  });
}

// ============ 重置 ============
function openReset() {
  openModal({
    title: '重置全部进度',
    body: '此操作将清空所有抽卡记录、资源、共鸣链、充值记录。<br><b class="r">不可恢复</b>。',
    actions: [
      { label: '取消', cls: '', fn: () => {} },
      { label: '确认重置', cls: 'warn', fn: () => {
        resetState();
        clearSave();
        // 回填首个 banner，维持 cur()/banner tab 一致性
        commit(() => { ensureSelectedBanner(); });
        rerenderAll();
        msg('已重置,请重新设置开局', false);
        openStartSetupModal();
      } },
    ],
  });
}

export function TimelineBar() {
  useS();
  const today = S.today;
  const phasesActive = activePhase();
  const vs = phasesActive.map((p: any) => p.v).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(' · ') || '无';
  const vName = VERSION_NAMES[vs] || '';
  const bannerCount = phasesActive.length;

  return (
    <div class="timeline">
      <div class="ti">
        <div class="now" id="dateNow">{fmt(today)}</div>
        <div class="meta" id="dateMeta">
          版本 {vs}{vName ? ' · ' + vName : ''} · 开放卡池 {bannerCount}
        </div>
      </div>
      <div class="t-actions">
        <button class="tbtn" id="nextDay" onClick={() => { advanceDay(); rerenderAll(); }}>＋1 日</button>
        <button class="tbtn" id="nextPhase" onClick={() => { nextPhase(); rerenderAll(); }}>下一期</button>
        <button class="tbtn" id="todayBtn" onClick={() => { jumpToday(); rerenderAll(); }}>今 天</button>
        <span class="t-sep"></span>
        <button class="tbtn" id="nextVersion" onClick={() => { nextVersion(); rerenderAll(); }}>下版本</button>
        <button class="tbtn" id="pickVersion" onClick={openPickVersion}>选版本</button>
        <span class="t-sep"></span>
        <button class="tbtn" id="saveMgmt" onClick={openSaveMgmt}>存 档</button>
        <button class="tbtn danger" id="reset" onClick={openReset}>重 置</button>
      </div>
    </div>
  );
}
