// Lint 提醒共用 helper
//
// 设计哲学:
//   lint 不是阻断,是提醒。提醒里带"为什么不允许"的理由。
//   新任务看了提醒仍选择做,说明有充足理由 —— 在 commit/PR 里说明即可。
//   想严格?设置 LINT_STRICT=1 环境变量,违规变硬错(用于 CI)。
//
// 用法:
//   import { lintWarn } from './helpers.js';
//   lintWarn({
//     rule: '铁律 11:无声骸技能作为独立伤害类型',
//     reason: '模拟器 dmgType 只有 normal/skill/heavy/burst 四类...',
//     violations: [{ file: '...', snippet: '...' }],
//     fix: '改用 "声骸套装伤害" 替代,或在 commit message 说明例外原因',
//   });

export function lintWarn({ rule, reason, violations, fix }) {
  if (!violations || violations.length === 0) return;
  const strict = process.env.LINT_STRICT === '1';
  const lines = [
    '',
    '⚠️  ' + rule,
    '',
    '为什么不允许:',
    '  ' + reason.split('\n').join('\n  '),
    '',
    `当前违规 ${violations.length} 处:`,
    ...violations.map(v => {
      const loc = v.file ? `  - ${v.file}${v.line ? ':' + v.line : ''}` : '  - (unknown location)';
      const detail = v.phrase ? ` [${v.phrase}]` : (v.snippet ? ` "${v.snippet.slice(0, 80)}"` : '');
      return loc + detail;
    }),
    '',
    '如何处理:',
    '  ' + (fix || '看了提醒仍要做,在 commit message / PR 描述里说明原因即可。'),
    '  想严格检查?设置 LINT_STRICT=1 让此条变硬错(用于 CI)。',
    '',
  ];
  const msg = lines.join('\n');
  if (strict) {
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
}
