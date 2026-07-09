// 边界测试 · Phase 6:src/gacha/** 不得访问 DOM(document/window)
//
// gacha 是抽卡概率/保底/卡池解析的领域层,不该有 DOM 操作。
// 例外:src/gacha/animation.js 是抽卡翻牌动画的 UI 渲染层,历史放在 gacha 目录,
// 直接操作 DOM 是其本职。Phase 6 不搬迁它(避免改 import 路径影响稳定代码),
// 在白名单里豁免。未来若整体迁到 src/ui/panels/gacha/,可删掉白名单。

import { describe, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lintWarn } from './helpers.js';

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

const GUARD_DIR = join(ROOT, 'gacha');

// animation.js 是 UI 渲染层错放 gacha,豁免到 Phase 7+ 搬迁
const WHITELIST = ['gacha/animation.js'];

describe('lint · 边界:gacha 不访问 DOM', () => {
  it('提醒:src/gacha/** 不得访问 document/window(白名单:animation.js)', () => {
    const files = walk(GUARD_DIR);
    const violations = [];
    for (const f of files) {
      const rel = f.replace(ROOT + '/', '');
      if (WHITELIST.includes(rel)) continue;
      const txt = readFileSync(f, 'utf8');
      const lines = txt.split('\n');
      lines.forEach((line, i) => {
        // 跳过注释行
        if (/^\s*\/\//.test(line)) return;
        // 检测 document.xxx / window.xxx = / window.xxx 调用
        if (/\bdocument\.(createElement|getElementById|querySelector|body|head)\b/.test(line) ||
            /\bwindow\.\w+\s*=/.test(line) ||
            /\bwindow\.(location|localStorage|sessionStorage)\b/.test(line)) {
          violations.push({ file: rel, line: i + 1, snippet: line.trim() });
        }
      });
    }
    lintWarn({
      rule: '边界:gacha 不访问 DOM',
      reason: 'gacha 是概率/保底/卡池解析的领域层,DOM 操作属于 UI 层。混在一起会让 gacha 无法在无 DOM 环境单测,也模糊领域/UI 边界。',
      violations,
      fix: '把 DOM 操作挪到 src/ui/panels/gacha/;若是历史遗留的 UI 渲染(gacha/animation.js),加白名单豁免并在 PR 说明。',
    });
  });
});
