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
import { deliverDueMails } from './mail/mailbox.js';
import { maybePromptLoginClaims } from './daily/loginClaim.js';
import { ensureRover } from './rover/ensure.js';
import { commit } from './state/commit.ts';
import { unlock } from './ui/assets/audio.ts';

(async () => {
  await loadState();
  // 读档后补发漂泊者三形态（免费主角，不进卡池）
  commit(() => { ensureRover(); });
  if (reconcilePeriodPullTasksFromLog()) saveState();
  // 读档后按当前日期补投邮箱（不 toast，避免启动刷屏）
  deliverDueMails();
  initApp();
  resetDailyIfNeeded();
  render();
  mountPreactRoot();
  // 上线补给：月卡每日星声 + 特别感恩回馈等（与月卡同节奏弹窗）
  setTimeout(() => { try { maybePromptLoginClaims(); } catch (_) { /* ignore */ } }, 0);
})();

// 首次用户手势解锁音频(浏览器自动播放策略);只执行一次
(() => {
  const unlockOnce = () => { unlock(); window.removeEventListener('pointerdown', unlockOnce); window.removeEventListener('keydown', unlockOnce); };
  window.addEventListener('pointerdown', unlockOnce);
  window.addEventListener('keydown', unlockOnce);
})();
