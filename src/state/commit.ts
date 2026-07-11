// 统一状态写入入口。收敛"改了 S 但忘记 bump 刷新/忘记落盘"。
//
// 用法:
//   commit(S => { S.astrite += 100; });              // 改完 bump + save(默认)
//   commit(S => { S.tab = 'x'; }, { save: false });  // 纯 UI 状态,不落盘
//
// 默认 save:true —— 安全优先。绝大部分 S 字段影响存档,默认落盘避免"刷新了但没持久化"
// 的隐蔽 bug。只有纯 UI 状态(当前 tab、roleModal 信号等)用 { save: false }。
//
// save 走 saveState() 的 1s 节流队列,连点写入不会每次同步写 localStorage,但保证 1s 内
// 落盘。卸载页面时 save.js 的 beforeunload flush 兜底最后一刻的写入。
//
// 不吞 mutator 抛错:抛了就不 bump、不落盘,让上层测试/调用方看见。

import { S } from '../state.js';
import { bumpStateVersion } from './version.ts';
import { saveState } from '../save.js';

export interface CommitOptions {
  save?: boolean;
}

export function commit<T>(mutator: (s: typeof S) => T, options?: CommitOptions): T {
  const result = mutator(S);
  bumpStateVersion();
  if (options?.save !== false) saveState();
  return result;
}
