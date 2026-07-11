// 边界测试 · Phase 2 步骤 A:src/shared/** 必须是纯工具
//
// shared 层(date/random/将来的纯函数)只提供无状态无副作用的工具,
// 不得 import state、ui 或访问 DOM。任何反向 import 会让 shared 在无 DOM 环境失败,
// 也破坏依赖方向:data/shared → domain → application → ui。

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

const GUARD_DIR = join(ROOT, 'shared');

describe('lint · 边界:shared 是纯工具层', () => {
  it('提醒:src/shared/** 不得 import state/ui 或访问 DOM', () => {
    const files = walk(GUARD_DIR);
    const violations = [];
    for (const f of files) {
      const rel = relativeSourcePath(ROOT, f);
      const txt = readFileSync(f, 'utf8');
      const lines = txt.split('\n');
      lines.forEach((line, i) => {
        if (/^\s*\/\//.test(line)) return;
        // import state.js / state/ 或 ui/ 或访问 document/window
        if (/from\s+['"][^'"]*\/(state|state\.js|state\/)['"]/.test(line) ||
            /from\s+['"](\.\.?\/)+ui\/[^'"]*['"]/.test(line) ||
            /\bdocument\.(createElement|getElementById|querySelector|body|head)\b/.test(line) ||
            /\bwindow\.(location|localStorage|sessionStorage)\b/.test(line)) {
          violations.push({ file: rel, line: i + 1, snippet: line.trim() });
        }
      });
    }
    lintWarn({
      rule: '边界:shared 是纯工具层',
      reason: 'shared/date、shared/random 等是纯工具,不应依赖状态或 UI。反向 import 会让 shared 在不同环境(SSR、Node 测试、Preact 卸载)里失败,也破坏 data/shared → domain → application → ui 依赖方向。',
      violations,
      fix: '把需要的逻辑改写成纯函数(参数传入),或上移到调用方。shared 不该有副作用。',
    });
  });
});