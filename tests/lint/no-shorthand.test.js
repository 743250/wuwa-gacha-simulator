// 铁律 8 提醒:玩家空间文案禁用速记符
//
// 禁词场景:`→` `buff` `debuff` `core` `叠层` `爆发解放机` 出现在给玩家看的字符串字面量里
// 这些是工作笔记速记,不应出现在玩家文案里(应用"增益"/"减益"/中文连接符等)。
//
// 守卫范围:**只查 src/ui/ 新 Preact 组件的字符串字面量**(不查变量名/属性名/注释)。
// 老代码(src/ui/render/)历史已有用法,不强清,留作后续逐个修。
// 迁移到 panels/ 的 skillHints/skillLines/terms 属老数据文件,同样豁免。
// 战斗日志 helpers.ts 的 "A 攻击 → B" 是流式动作描述,行业惯例,豁免。

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lintWarn } from './helpers.js';

const ROOT = resolve(__dirname, '../../src/ui/panels');

// 从 src/ui/render/ 迁来的老数据文件:文案为历史遗留,不强清(与迁移前 no-shorthand 不扫 render/ 一致)
const EXEMPT_SUBPATHS = [
  'roleModal/skillHints/',
  'roleModal/skillLines.js',
  'roleModal/terms.js',
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts|js)$/.test(name)) out.push(p);
  }
  return out;
}

function isExempt(file) {
  const rel = file.replace(ROOT + '/', '');
  return EXEMPT_SUBPATHS.some(prefix => rel.startsWith(prefix));
}

const FORBIDDEN_WORDS = ['buff', 'debuff', 'core', '叠层', '爆发解放机'];

function extractPlayerStrings(content) {
  const out = [];
  const re = /(['"`])([^'"`\n]*[\u4e00-\u9fa5][^'"`\n]*)\1/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    out.push(m[2]);
  }
  return out;
}

describe('lint · 铁律 8:ui/panels/ 玩家文案禁速记', () => {
  it('提醒:ui/panels/ 玩家文案字符串里不出现 buff/debuff/core/叠层/爆发解放机', () => {
    const files = walk(ROOT).filter(f => !isExempt(f));
    const violations = [];
    for (const f of files) {
      const content = readFileSync(f, 'utf8');
      const strings = extractPlayerStrings(content);
      for (const s of strings) {
        for (const word of FORBIDDEN_WORDS) {
          if (s.toLowerCase().includes(word)) {
            violations.push({ file: f.replace(ROOT, ''), phrase: word, snippet: s.slice(0, 60) });
          }
        }
      }
    }
    lintWarn({
      rule: '铁律 8:玩家文案禁速记符 buff/debuff/core/叠层/爆发解放机',
      reason: `玩家空间文案 ≠ 工作笔记。这些是 AI 协作时的速记,玩家看不懂。
intro 只写身份(元素 · 武器 · 定位 · 「核心机制名」),不替玩家分析强度。
通用机制(如风蚀效应)不标角色专属。详见 CLAUDE.md 铁律 8。`,
      violations,
      fix: '改用中文:"buff"→"增益","debuff"→"减益","core"→"核心","叠层"→"层数","爆发解放机"→具体机制名。',
    });
    expect(violations.length).toBeGreaterThanOrEqual(0);
  });

  it('提醒:ui/panels/ 玩家文案字符串里不出现 → 箭头(战斗日志 helpers.ts 豁免)', () => {
    const files = walk(ROOT).filter(f => !isExempt(f));
    const violations = [];
    for (const f of files) {
      if (f.endsWith('helpers.ts')) continue;
      const content = readFileSync(f, 'utf8');
      const strings = extractPlayerStrings(content);
      for (const s of strings) {
        if (s.includes('→')) {
          violations.push({ file: f.replace(ROOT, ''), snippet: s.slice(0, 60) });
        }
      }
    }
    lintWarn({
      rule: '铁律 8:玩家文案禁 → 箭头',
      reason: `→ 是工作笔记速记,玩家文案应用中文连接符(逗号/句号/破折号)。
战斗日志 "A 攻击 → B" 是流式动作描述,行业惯例,helpers.ts 豁免。`,
      violations,
      fix: '改用中文逗号/破折号,或拆成两句。例:"被冻结(剩余 2 回合)→ 请切换" → "被冻结(剩余 2 回合),请切换"。',
    });
    expect(violations.length).toBeGreaterThanOrEqual(0);
  });
});
