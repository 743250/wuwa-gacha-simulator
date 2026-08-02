// 铁律 11 提醒:dmgType 只有 normal/skill/heavy/burst 四类,没有 echoSkill
// 也禁止在角色文件 / combat 子模块里出现"声骸技能伤害"作为独立伤害类型的表述。
//
// 注:src/data/echoes.js 的 bonus5.cond 是官方套装描述的引文(给玩家看的原文),
// 不算违规 —— 这条 lint 只守 code 路径(src/battle/ + src/ui/ + 角色文件)。

import { describe, it, expect } from 'vitest';
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

const GUARD_DIRS = [
  join(ROOT, 'battle'),
  join(ROOT, 'ui/panels'),
];

const FORBIDDEN_PHRASES = [
  '声骸技能伤害',
  '视为声骸技能',
  '声骸技能时',
  "dmgType === 'echoSkill'",
  "dmgType: 'echoSkill'",
  "dmgType='echoSkill'",
];

describe('lint · 铁律 11:无声骸技能作为独立伤害类型', () => {
  it('提醒:battle/ 和 ui/panels/ 内不出现"声骸技能伤害"等禁词', () => {
    const files = GUARD_DIRS.flatMap(d => {
      try { return walk(d); } catch { return []; }
    });
    const violations = [];
    for (const f of files) {
      const content = readFileSync(f, 'utf8');
      for (const phrase of FORBIDDEN_PHRASES) {
        if (content.includes(phrase)) {
          violations.push({ file: f.replace(ROOT, ''), phrase });
        }
      }
    }
    lintWarn({
      rule: '铁律 11:无声骸技能作为独立伤害类型',
      reason: `模拟器 dmgType 只有 normal/skill/heavy/burst 四类,没有 echoSkill。
官方"视为声骸技能伤害"的招式归到四类之一(按动作类型);
"施放声骸技能时触发 X"的共鸣链把触发条件换成模拟器实际存在的招式
(如"施放谱曲终末时"/"共鸣解放时")。
详见 CLAUDE.md 铁律 11 + docs/plans/角色设计指南.md 第 4b 节。`,
      violations,
      fix: '改用 "声骸套装伤害" 替代 "声骸技能伤害"(指套装 5 件效果,不是独立 dmgType);或在 commit message 说明例外原因。',
    });
    // 始终 pass(除非 LINT_STRICT=1 时 helper 内部 throw)
    expect(violations.length).toBeGreaterThanOrEqual(0);
  });

  it('提醒:dmgType 字面量只有 normal/skill/heavy/burst/variation 五类', () => {
    const files = GUARD_DIRS.flatMap(d => {
      try { return walk(d); } catch { return []; }
    });
    // variation 是变奏技能伤害(actions.js:516 calcDamage(..., 'variation'),HP 核角色有专门分支),
    // 属合法第五类,不是声骸技能;铁律 11 禁的是 echoSkill 独立类型。
    const allowed = new Set(['normal', 'skill', 'heavy', 'burst', 'variation']);
    const violations = [];
    for (const f of files) {
      const content = readFileSync(f, 'utf8');
      const re = /dmgType(?:\s*[:=]+\s*['"]|===\s*['"])(\w+)['"]/g;
      let m;
      while ((m = re.exec(content)) !== null) {
        if (!allowed.has(m[1])) {
          violations.push({ file: f.replace(ROOT, ''), phrase: `dmgType=${m[1]}` });
        }
      }
    }
    lintWarn({
      rule: '铁律 11:dmgType 类型守卫',
      reason: `dmgType 是伤害计算流水线的核心字段,combat/damage.js 按 4 类分支处理。
引入新类型会破坏 calcDamage 的 typeBonus 分支,导致伤害计算错乱。`,
      violations,
      fix: '把新招式归到 normal/skill/heavy/burst 之一(按动作类型);不要新增 dmgType 值。',
    });
    expect(violations.length).toBeGreaterThanOrEqual(0);
  });
});
