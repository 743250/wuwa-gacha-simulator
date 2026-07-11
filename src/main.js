// 入口：加载存档 → 旧 render → 挂 Preact 根。
// Phase 2.2:顶部时间线 / 重置 / 存档管理 / 选版本 / 弹窗外部关闭 / 全局 tooltip
// 全部迁到 src/ui/AppShell.tsx 的 useEffect,本文件只保留启动序列。
// Phase 3:side-effect import 收口为 initApp() 显式调用,见 src/init.ts。
import './state.js';
import { render } from './ui/render.js';
import { resetDailyIfNeeded } from './daily/commission.js';
import { initApp } from './init.ts';
import { mountPreactRoot } from './ui/root.tsx';
import { loadState, saveState } from './save.js';
import { reconcilePeriodPullTasksFromLog } from './podcast/core.js';

(async () => {
  await loadState();
  if (reconcilePeriodPullTasksFromLog()) saveState();
  initApp();
  resetDailyIfNeeded();
  render();
  mountPreactRoot();
})();
