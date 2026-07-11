// 边界测试 · Phase 6:src/ui/panels/** 不得直接 import save.js
//
// UI 面板只该调领域 action,不该直接读写存档。
// 存档读写是 save.js 的职责,由 main.js 启动序列 + commit()/saveState() 节奏统一管。
// 面板直接 import save.js 会绕过 commit 的版本号/保存节流,导致状态和存档不同步。

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

const GUARD_DIR = join(ROOT, 'ui/panels');

describe('lint · 边界:ui/panels 不直接 import save', () => {
  it('提醒:src/ui/panels/** 不得 from ../save 或 from ../../save', () => {
    const files = walk(GUARD_DIR);
    const violations = [];
    for (const f of files) {
      const rel = relativeSourcePath(ROOT, f);
      const txt = readFileSync(f, 'utf8');
      const lines = txt.split('\n');
      lines.forEach((line, i) => {
        // 匹配 from '...save.js' 或 from '...save'(任意层级相对路径)
        const m = line.match(/from\s+['"](\.\.?\/[^'"]*\/save(?:\.js)?)['"]/) ||
                  line.match(/from\s+['"](\.\.\/\.\.\/save(?:\.js)?)['"]/) ||
                  line.match(/from\s+['"](\.\.\/save(?:\.js)?)['"]/);
        if (m) {
          violations.push({ file: rel, line: i + 1, snippet: line.trim() });
        }
      });
    }
    lintWarn({
      rule: '边界:ui/panels 不直接 import save',
      reason: '存档读写是 save.js 的职责,由 main.js 启动序列 + commit()/saveState() 统一管。面板直接 import save.js 会绕过版本号/保存节流,导致状态和存档不同步。',
      violations,
      fix: '面板调领域 action(commit 内部会触发 save);若真需要导出/导入存档,通过 AppShell 的存档管理按钮走,不在面板里直接 import save.js。',
    });
  });
});
