// 边界测试 · Phase 6:src/battle/** 不得 import src/ui/**
//
// 领域层不该依赖 UI 层。battle 是纯计算/状态机,UI 只读不写。
// 违反这条边界会让 battle 模块无法在无 DOM 环境跑(如 SSR、单测),也阻塞未来把 battle 拆成独立包。

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

const GUARD_DIR = join(ROOT, 'battle');

describe('lint · 边界:battle 不依赖 ui', () => {
  it('提醒:src/battle/** 不得 import src/ui/**', () => {
    const files = walk(GUARD_DIR);
    const violations = [];
    for (const f of files) {
      const txt = readFileSync(f, 'utf8');
      const lines = txt.split('\n');
      lines.forEach((line, i) => {
        // import ... from '...ui/...' 或 import '...ui/...'
        const m = line.match(/from\s+['"](\.\.?\/[^'"]*\/ui\/[^'"]*)['"]/) ||
                  line.match(/^import\s+['"](\.\.?\/[^'"]*\/ui\/[^'"]*)['"]/);
        if (m) {
          violations.push({ file: relativeSourcePath(ROOT, f), line: i + 1, snippet: line.trim() });
        }
      });
    }
    lintWarn({
      rule: '边界:battle 不依赖 ui',
      reason: 'battle 是领域层(纯计算/状态机),依赖 UI 会破坏可测性,也让 battle 无法在无 DOM 环境运行。',
      violations,
      fix: '把 UI 渲染逻辑挪到 src/ui/,battle 只 export 数据和函数;若 battle 真需要 UI 信号,用 signal/callback 反向解耦。',
    });
  });
});
