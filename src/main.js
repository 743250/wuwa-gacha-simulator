// 入口：组装所有事件绑定 + 启动渲染
import './state.js';
import { S, resetState, msg, date } from './state.js';
import { render } from './ui/render.js';
import { tryPull, doPullN, toFive } from './gacha/actions.js';
import { advanceDay, nextPhase, nextVersion, jumpToday, dailyTick, jumpToVersion, jumpToDate } from './time/timeline.js';
import { convertLunite } from './shop/actions.js';
import { openModal } from './modal.js';
import { loadState, saveState, exportSave, importSave, clearSave, saveStateNow } from './save.js';
import { renderTeamBuilder } from './ui/teambuilder.js';
import { renderBag } from './ui/bag.js';
import { renderDungeon } from './ui/dungeon.js';
import { renderAbyss } from './ui/abyss.js';
import { renderDaily } from './ui/daily.js';
import { renderWastes } from './ui/wastes.js';
import { renderPodcast } from './ui/podcast.js';
import './ui/battle.js';   // 副作用：注册战斗弹窗
import './exchange/coral.js'; // 副作用：注册海市兑换 onclick
import { resetDailyIfNeeded } from './daily/commission.js';
import { noviceRemainDays } from './gacha/core.js';
import { phases } from './data/phases.js';

// 必要的全局桥接（onclick 调用）
window.__render = render;
window.__noviceRemainDays = noviceRemainDays;
window.exportSave = exportSave;
window.importSaveFile = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = () => {
    if (input.files[0]) importSave(input.files[0], (ok, err) => {
      if (ok) { msg('导入成功', false); rerenderAll(); }
      else msg('导入失败：' + err);
    });
  };
  input.click();
};

// 全部面板重渲染
function rerenderAll() {
  render();
  renderTeamBuilder();
  renderBag();
  renderDaily();
  renderDungeon();
  renderAbyss();
  renderWastes();
  renderPodcast();
}
window.__rerenderAll = rerenderAll;

// 顶部时间线按钮
document.getElementById('nextDay').onclick = () => { advanceDay(); rerenderAll(); };
document.getElementById('todayBtn').onclick = () => { jumpToday(); rerenderAll(); };
document.getElementById('nextPhase').onclick = () => { nextPhase(); rerenderAll(); };
document.getElementById('nextVersion').onclick = () => { nextVersion(); rerenderAll(); };
document.getElementById('reset').onclick = () => {
  openModal({
    title: '重置全部进度',
    body: '此操作将清空所有抽卡记录、资源、共鸣链、充值记录。<br><b class="r">不可恢复</b>。',
    actions: [
      { label: '取消', cls: '', fn: () => {} },
      { label: '确认重置', cls: 'warn', fn: () => { resetState(); clearSave(); rerenderAll(); msg('已重置', false); } }
    ]
  });
};

// 选版本/选日期（#13）
document.getElementById('pickVersion').onclick = () => {
  // 收集所有版本（含其首个 phase 起点）
  const versionMap = new Map();
  phases.forEach(p => { if (!versionMap.has(p.v)) versionMap.set(p.v, p.start); });
  const allVersions = [...versionMap.entries()];
  const today = S.today;
  const fmtDate = t => new Date(t).toISOString().slice(0,10);
  // 用一个 modal 展示版本网格 + 日期 input
  const grid = allVersions.map(([v, t]) => {
    const isPast = t < today;
    const isCur = t <= today && phases.some(p => p.v === v && today >= p.start && today < p.end);
    const cls = isCur ? 'gold' : '';
    const disabled = isPast && !isCur;
    return `<button class="mbtn ${cls}" style="margin:3px" ${disabled ? 'disabled title="不能回到过去"' : ''} onclick="window.__pickVer('${v}')">${v}<br><span style="font-size:9px;opacity:.7">${fmtDate(t)}</span></button>`;
  }).join('');
  openModal({
    title: '选择版本 / 日期',
    body: `<div style="font-size:11px;color:var(--muted);line-height:1.6;margin-bottom:8px">
      点击版本号跳到该版本起始日；或在下面输入具体日期跳转。<br>
      <b style="color:var(--gold)">注意：仅能向后推进</b>，途中会自动结算月卡 / 体力 / 礼包刷新。
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;margin-bottom:10px">${grid}</div>
    <div style="text-align:center;font-size:11px;color:var(--muted)">
      跳到日期：<input type="date" id="pvDate" value="${fmtDate(today)}" min="${fmtDate(today)}" style="background:rgba(255,255,255,.06);color:var(--text);border:1px solid var(--line2);border-radius:6px;padding:4px 8px;font:inherit"/>
      <button class="mbtn gold" style="margin-left:6px" onclick="window.__pickDate()">跳转</button>
    </div>`,
    actions: [{ label: '关闭', cls: '', fn: () => {} }]
  });
};
window.__pickVer = (v) => {
  if (jumpToVersion(v)) { rerenderAll(); msg(`跳到版本 ${v}`, false); document.getElementById('modal').classList.remove('on'); }
};
window.__pickDate = () => {
  const inp = document.getElementById('pvDate');
  if (!inp || !inp.value) return;
  const t = new Date(inp.value + 'T00:00:00Z').getTime();
  if (jumpToDate(t)) { rerenderAll(); msg(`跳到 ${inp.value}`, false); document.getElementById('modal').classList.remove('on'); }
};

// 抽卡按钮
document.getElementById('pull1').onclick = () => tryPull(1);
document.getElementById('pull10').onclick = () => tryPull(10);
document.getElementById('free10').onclick = () => doPullN(10, true);
document.getElementById('toFive').onclick = toFive;

// 商店底部按钮
document.getElementById('convertLunite').onclick = convertLunite;
document.getElementById('dailyLunite').onclick = () => {
  if (S.days <= 0) return msg('无月卡天数');
  if (!dailyTick()) return msg('今天已领过');
  msg('+90 星声', false); render();
};

// 清空日志
document.getElementById('clearLog').onclick = () => { S.log = []; msg('已清空', false); render(); };

// 侧栏 tab 切换：分 3 个视图
// 视图 1（唤取）：stat / ex / log
// 视图 2（冒险）：team / daily / dungeon / abyss
// 视图 3（仓库）：bag / shop
function bindSubTabs(selector, panes, onSwitch) {
  document.querySelectorAll(selector).forEach(t => t.onclick = () => {
    document.querySelectorAll(selector).forEach(x => x.classList.toggle('on', x === t));
    const key = t.dataset.s || t.dataset.a || t.dataset.b;
    panes.forEach(p => {
      const el = document.getElementById('pane' + p[0].toUpperCase() + p.slice(1));
      if (el) el.style.display = p === key ? '' : 'none';
    });
    if (onSwitch) onSwitch(key);
  });
}

bindSubTabs('.s-tab', ['stat', 'ex', 'log']);
bindSubTabs('.a-tab', ['team', 'daily', 'dungeon', 'abyss', 'wastes'], k => {
  if (k === 'team') renderTeamBuilder();
  if (k === 'daily') renderDaily();
  if (k === 'dungeon') renderDungeon();
  if (k === 'abyss') renderAbyss();
  if (k === 'wastes') renderWastes();
});
bindSubTabs('.b-tab', ['podcast', 'shop'], k => {
  if (k === 'podcast') renderPodcast();
});

// 商店内部分类 tab（特惠/常驻/凝刻月相）
document.querySelectorAll('.sct').forEach(t => t.onclick = () => {
  document.querySelectorAll('.sct').forEach(x => x.classList.toggle('on', x === t));
  const key = t.dataset.sc;
  const map = { featured: 'scFeatured', regular: 'scRegular', topup: 'scTopup' };
  Object.keys(map).forEach(k => {
    const el = document.getElementById(map[k]);
    if (el) el.style.display = k === key ? '' : 'none';
  });
});

// 顶层视图切换：gacha / adventure / bag / storage
const VIEWS = { gacha: 'viewGacha', adventure: 'viewAdventure', bag: 'viewBag', storage: 'viewStorage' };
document.querySelectorAll('.vtab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.vtab').forEach(x => x.classList.toggle('on', x === t));
  const key = t.dataset.v;
  Object.keys(VIEWS).forEach(v => {
    const el = document.getElementById(VIEWS[v]);
    if (el) el.style.display = v === key ? '' : 'none';
  });
  // 切到非唤取视图时，触发对应的初次渲染
  if (key === 'adventure') renderTeamBuilder();
  if (key === 'bag') renderBag();
  if (key === 'storage') renderPodcast();
});

// 弹窗点击外部关闭
document.getElementById('modal').onclick = e => {
  if (e.target === document.getElementById('modal')) document.getElementById('modal').classList.remove('on');
};

// 全局 tooltip：.tip[data-tip] / .tip-term[data-tip] 悬停时弹浮窗（data-tip 内容是 HTML 字符串）
let __tipEl = null;
document.body.addEventListener('mouseover', e => {
  const t = e.target.closest && e.target.closest('.tip[data-tip], .tip-term[data-tip]');
  if (!t) return;
  if (!__tipEl) {
    __tipEl = document.createElement('div');
    __tipEl.className = 'tip-pop';
    document.body.appendChild(__tipEl);
  }
  __tipEl.innerHTML = t.dataset.tip;
  __tipEl.style.display = 'block';
  const r = t.getBoundingClientRect();
  let top = r.bottom + 6;
  let left = r.left;
  const popH = __tipEl.offsetHeight;
  const popW = __tipEl.offsetWidth;
  if (top + popH > window.innerHeight - 8) top = r.top - popH - 6;
  if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
  if (left < 8) left = 8;
  __tipEl.style.top = top + 'px';
  __tipEl.style.left = left + 'px';
});
document.body.addEventListener('mouseout', e => {
  if (!e.target.closest) return;
  const t = e.target.closest('.tip[data-tip], .tip-term[data-tip]');
  if (!t) return;
  if (__tipEl) __tipEl.style.display = 'none';
});

// 启动前加载存档
loadState();

// 启动后初始化日常委托（如果今天没刷新过）
resetDailyIfNeeded();

render();