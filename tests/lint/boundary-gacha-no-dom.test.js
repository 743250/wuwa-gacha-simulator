// 边界测试 · Phase 6 + Phase 3 步骤 B/C:src/gacha/** 不得访问 DOM,
// 且 src/gacha/core.js 不得 import state.js/commit/rerender/modal/ui。
//
// gacha 是抽卡概率/保底/卡池解析的领域层,不该有 DOM 操作。
// Phase 3 步骤 B 后 animation.js 已迁出 src/gacha/,无白名单。
// Phase 3 步骤 C 后 core.js 已是纯领域函数,不再 import UI/save/render。

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

const GUARD_DIR = join(ROOT, 'gacha');

// Phase 3 步骤 B 后无历史例外,白名单空。
const WHITELIST = [];

// Phase 3 步骤 C:core.js 禁用的 import 路径模式
// 允许:state.js(只取 S/DAY/date/fmt/pick/pickRng)、data/*、./rateConfig.js、./core.js 自身
// 禁止:commit、rerender、modal、ui/*、save.js、../rerender.js、../modal.js、../ui/**、../state/commit.ts
const CORE_FORBIDDEN_IMPORT_PATTERNS = [
  /\.\.\/state\/commit/,
  /\.\.\/rerender/,
  /\.\.\/modal/,
  /\.\.\/save\b/,
  /\.\.\/ui\//,
  /\.\.\/podcast\//,    // core 不该反向依赖 podcast(上层 action 才调 pull)
  /\.\.\/time\//,
  /\.\.\/shop\//,
  /\.\.\/exchange\//,
  /\.\.\/daily\//,
  /\.\.\/equip\//,
];

describe('lint · 边界:gacha 不访问 DOM', () => {
  it('提醒:src/gacha/** 不得访问 document/window(零白名单)', () => {
    const files = walk(GUARD_DIR);
    const violations = [];
    for (const f of files) {
      const rel = relativeSourcePath(ROOT, f);
      if (WHITELIST.includes(rel)) continue;
      const txt = readFileSync(f, 'utf8');
      const lines = txt.split('\n');
      lines.forEach((line, i) => {
        if (/^\s*\/\//.test(line)) return;
        if (/\bdocument\.(createElement|getElementById|querySelector|body|head)\b/.test(line) ||
            /\bwindow\.\w+\s*=/.test(line) ||
            /\bwindow\.(location|localStorage|sessionStorage)\b/.test(line)) {
          violations.push({ file: rel, line: i + 1, snippet: line.trim() });
        }
      });
    }
    lintWarn({
      rule: '边界:gacha 不访问 DOM',
      reason: 'gacha 是概率/保底/卡池解析的领域层,DOM 操作属于 UI 层。混在一起会让 gacha 无法在无 DOM 环境单测,也模糊领域/UI 边界。Phase 3 步骤 B 后 animation.js 已迁出,无白名单。',
      violations,
      fix: '把 DOM 操作挪到 src/ui/gacha/ 或 src/ui/panels/gacha/;不允许再加白名单。',
    });
  });

  it('提醒:src/gacha/core.js 不得 import commit/rerender/modal/ui/save/上层模块', () => {
    const corePath = join(GUARD_DIR, 'core.js');
    const rel = relativeSourcePath(ROOT, corePath);
    const txt = readFileSync(corePath, 'utf8');
    const lines = txt.split('\n');
    const violations = [];
    lines.forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return;
      // 只检查 import 语句
      if (!/\bimport\b/.test(line)) return;
      // state.js 允许(S/DAY/date/fmt/pick/pickRng),data/** 允许,./rateConfig.js 允许,./core.js 允许
      if (/\.\.\/state\.js\b/.test(line)) return;
      if (/\.\.\/data\//.test(line)) return;
      if (/\.\.\/shared\//.test(line)) return;
      if (/\.\/rateConfig\b/.test(line)) return;
      if (/\.\/core\b/.test(line)) return;
      for (const pat of CORE_FORBIDDEN_IMPORT_PATTERNS) {
        if (pat.test(line)) {
          violations.push({ file: rel, line: i + 1, snippet: line.trim() });
          break;
        }
      }
    });
    lintWarn({
      rule: '边界:core.js 不依赖 UI/save/commit/上层模块',
      reason: 'Phase 3 步骤 C 后 core.js 是抽卡领域纯函数层,不应直接调用 commit、刷新 UI、弹窗、保存、或反向依赖 podcast/time/shop 等上层模块。这些副作用应由调用方(actions.js 等)承担。',
      violations,
      fix: '从 core.js 删除禁用的 import,把副作用挪到 actions.js 或 UI 层。允许的 import:state.js(S/工具)、data/**、shared/**、./rateConfig.js、./core.js。',
    });
  });
});
