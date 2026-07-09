// 全局 Preact 层 · Phase 2 修正
//
// 把 RoleModalManager + AppShell 合并到同一个 Preact 树,
// 避免在 root.tsx 里对 #preact-root 重复 preactRender(后者覆盖前者,
// 靠"第一次 render 时副作用已执行"的隐式假设工作,不健康)。
//
// 两个子组件都是 headless(返回 null/Fragment),只靠副作用工作:
//   · RoleModalManager:initRoleModalSubscription() 订阅 roleModal 信号
//   · AppShell:useEffect 绑定顶层 DOM 事件
//
// 合并后 #preact-root 只 render 一次,树结构清晰,副作用顺序明确。

import { h, Fragment } from 'preact';
import { RoleModalManager } from './panels/roleModal/RoleModal';
import { AppShell } from './AppShell';

export function GlobalLayer() {
  return (
    <Fragment>
      <RoleModalManager />
      <AppShell />
    </Fragment>
  );
}
