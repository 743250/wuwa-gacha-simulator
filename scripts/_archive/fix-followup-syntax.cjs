// scripts/fix-followup-syntax.cjs — 修复 rewrite-followups 引入的 makeSkillLines({ ... }) 结尾语法错
// 症状：最后一个 FollowUp 字段没逗号 + 后面新插入的字段没缩进
const fs = require('fs');
const path = 'src/ui/render.js';
let src = fs.readFileSync(path, 'utf-8');

// 找到 `XXFollowUp: 'YYY'\n    XXFollowUp: '...'` 这种缺逗号的位置
// 模式：'\nXXX:'前的引号后面没有逗号
let changes = 0;

// pass 1: 修缺逗号 —— 前一行以"',"或"'"结尾，下一行又是 followUp 字段
src = src.replace(/(FollowUp: '[^']*')\n(    [a-z]+FollowUp:)/g, (m, a, b) => {
  changes++;
  return a + ',\n' + b.replace(/^    /, '      ');
});

// pass 2: 修结尾的 `\n}),` 应为 `\n    }),`
src = src.replace(/\n\}\),\n    forteName/g, () => { changes++; return '\n    }),\n    forteName'; });
src = src.replace(/\n\}\),\n    forteDesc/g, () => { changes++; return '\n    }),\n    forteDesc'; });

fs.writeFileSync(path, src, 'utf-8');
console.log('Fixed', changes, 'syntax issues');
