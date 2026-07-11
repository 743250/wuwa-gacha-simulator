// UI toast 工具 · Phase 2 步骤 B
//
// 历史:msg/$ 原本在 src/state.js,但它们直接操作 DOM,违反"state 层不访问 DOM"边界。
// 移到 UI 域后,state.js 不再出现 document.getElementById。
//
// 领域核心(gacha/core 等)在本阶段(Phase 2)仍可 import 此处 msg —— 真正解耦在 Phase 3:
// gacha/core 不再 import toast,action 返回错误代码由 UI 决定显示文案。

export const $ = (id: string) => document.getElementById(id);

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function msg(t: string, err = true): void {
  const e = $('toast');
  if (!e) return;
  e.textContent = t || '';
  e.style.color = err ? 'var(--red)' : 'var(--green)';
  if (toastTimer) clearTimeout(toastTimer);
  if (t) toastTimer = setTimeout(() => { e.textContent = ''; }, 2500);
}