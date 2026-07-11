// 边界测试 · Phase 2 步骤 C/D:state 层不反向依赖 UI
//
// 目标依赖方向:data → domain → application → ui,反向不允许。
// state/commit.ts、state/version.ts、state.js 写状态 + 通知版本号,但不应主动 import ui 层
// —— UI 是 state 的消费者,不是 state 的依赖。
// 如果 state → ui 反向依赖成立,Preact 卸载或 ui 重构会让 state 单元测试崩盘。
//
// 同时:state.js 不再出现 document/window(Phase 2 步骤 B 后,msg/$ 已迁到 ui/services/toast.ts)。

import { describe, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lintWarn, relativeSourcePath } from './helpers.js';

const ROOT = resolve(__dirname, '../../src');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(js|ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

describe('lint · 边界:state 不反向依赖 UI', () => {
  it('提醒:src/state/** 不得 from .../ui/...(反向依赖禁令)', () => {
    const files = walk(join(ROOT, 'state'));
    const violations = [];
    for (const f of files) {
      const rel = relativeSourcePath(ROOT, f);
      const txt = readFileSync(f, 'utf8');
      const lines = txt.split('\n');
      lines.forEach((line, i) => {
        // 跳过注释行
        if (/^\s*\/\//.test(line)) return;
        // 匹配 from '../ui/...' 或 from '../../ui/...' 等
        const m = line.match(/from\s+['"](\.\.?\/)+ui\/[^'"]*['"]/);
        if (m) violations.push({ file: rel, line: i + 1, snippet: line.trim() });
      });
    }
    lintWarn({
      rule: '边界:state 不反向依赖 UI',
      reason: '依赖方向必须是 UI → state,不能相反。源:任务书 Phase 2 步骤 C,state/commit.ts 直接 import ui/signals.ts 形成反向依赖,通过把 stateVersion 下沉到 state/version.ts 切断。若再次引入,会让 state 单元测试在 ui 卸载时崩盘。',
      violations,
      fix: '把 UI 层下沉用的 signal/helper 上移到 state 层或 shared 层,然后两边 import。如果真要 UI 注入 hook,做成显式参数注入,不要让 state 静默 import ui。',
    });
  });

  it('提醒:src/state.js 不得出现 document/window(DOM 访问禁令)', () => {
    const f = join(ROOT, 'state.js');
    const rel = relativeSourcePath(ROOT, f);
    const txt = readFileSync(f, 'utf8');
    const lines = txt.split('\n');
    const violations = [];
    lines.forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return;
      if (/\bdocument\.(createElement|getElementById|querySelector|body|head)\b/.test(line) ||
          /\bwindow\.\w+\s*=/.test(line) ||
          /\bwindow\.(location|localStorage|sessionStorage)\b/.test(line)) {
        violations.push({ file: rel, line: i + 1, snippet: line.trim() });
      }
    });
    lintWarn({
      rule: '边界:state.js 不访问 DOM',
      reason: 'state.js 是可持久化游戏状态的唯一定义,不该直接操作 DOM。$msg/$ 已迁到 ui/services/toast.ts(Phase 2 步骤 B),animating 已迁到 ui/gachaAnimationState.js(步骤 D)。残余 DOM 访问会让 state.js 在无 DOM 环境失败。',
      violations,
      fix: 'DOM 操作挪到 ui/services/toast.ts(若误回迁 msg/$);UI 瞬时状态挪到 ui/*Signal.js;若确需 SSR 守卫,用 typeof window === "undefined" 早返回但不要赋值 window.xxx。',
    });
  });
});