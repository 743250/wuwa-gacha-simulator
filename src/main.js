// 入口：组装所有事件绑定 + 启动渲染
import './state.js';
import { S, resetState, msg, date } from './state.js';
import { render } from './ui/render.js';
import { tryPull, doPullN, toFive } from './gacha/actions.js';
import { advanceDay, nextPhase, nextVersion, jumpToday, dailyTick } from './time/timeline.js';
import { convertLunite } from './shop/actions.js';
import { openModal } from './modal.js';
import { loadState, saveState, exportSave, importSave, clearSave, saveStateNow } from './save.js';
import { renderTeamBuilder } from './ui/teambuilder.js';
import { renderBag } from './ui/bag.js';
import { renderDungeon } from './ui/dungeon.js';
import { renderAbyss } from './ui/abyss.js';
import { renderDaily } from './ui/daily.js';
import './ui/battle.js';   // 副作用：注册战斗弹窗
import './exchange/coral.js'; // 副作用：注册海市兑换 onclick
import { resetDailyIfNeeded } from './daily/commission.js';

// 必要的全局桥接（onclick 调用）
window.__render = render;
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
bindSubTabs('.a-tab', ['team', 'daily', 'dungeon', 'abyss'], k => {
  if (k === 'team') renderTeamBuilder();
  if (k === 'daily') renderDaily();
  if (k === 'dungeon') renderDungeon();
  if (k === 'abyss') renderAbyss();
});
bindSubTabs('.b-tab', ['bag', 'shop'], k => {
  if (k === 'bag') renderBag();
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

// 顶层视图切换：gacha / adventure / storage
const VIEWS = { gacha: 'viewGacha', adventure: 'viewAdventure', storage: 'viewStorage' };
document.querySelectorAll('.vtab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.vtab').forEach(x => x.classList.toggle('on', x === t));
  const key = t.dataset.v;
  Object.keys(VIEWS).forEach(v => {
    const el = document.getElementById(VIEWS[v]);
    if (el) el.style.display = v === key ? '' : 'none';
  });
  // 切到非唤取视图时，触发对应的初次渲染
  if (key === 'adventure') renderTeamBuilder();
  if (key === 'storage') renderBag();
});

// 弹窗点击外部关闭
document.getElementById('modal').onclick = e => {
  if (e.target === document.getElementById('modal')) document.getElementById('modal').classList.remove('on');
};

// 启动前加载存档
loadState();

// 启动后初始化日常委托（如果今天没刷新过）
resetDailyIfNeeded();

render();