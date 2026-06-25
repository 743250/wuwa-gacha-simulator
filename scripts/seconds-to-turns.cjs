// scripts/seconds-to-turns.cjs — 把 chains-extracted.json 里的「X 秒」统一转成「X 回合」
const fs = require('fs');
const p = 'src/data/chains-extracted.json';
const d = JSON.parse(fs.readFileSync(p, 'utf-8'));

// 把"X 秒"按照战斗节奏映射到"Y 回合"
// 鸣潮 1 回合 ≈ 6-10 秒（一波连段）
function secondsToTurns(sec) {
  if (sec <= 6) return 2;          // 短 buff
  if (sec <= 12) return 2;         // 标准短 buff
  if (sec <= 18) return 3;
  if (sec <= 24) return 3;
  if (sec <= 30) return 4;
  if (sec <= 60) return 5;
  return 6;
}

let count = 0;
function convert(s) {
  if (!s) return s;
  return s.replace(/<b class="term-num">(\d+(?:\.\d+)?)<\/b>\s*秒/g, (m, num) => {
    const sec = parseFloat(num);
    // 0.x 秒（如 2.5 秒架势保持）保留为原文
    if (sec < 1) return m;
    // 极特殊（10 分钟）保留
    if (num === '10' && m.includes('分钟')) return m;
    const turns = secondsToTurns(sec);
    count++;
    return '<b class="term-num">' + turns + '</b> 回合';
  });
}

Object.keys(d).forEach(name => {
  d[name].forEach(c => {
    c.summary = convert(c.summary);
    c.desc = convert(c.desc);
  });
});

// 单独处理"10 分钟"
let minCount = 0;
function convertMin(s) {
  if (!s) return s;
  return s.replace(/<b class="term-num">(\d+)<\/b>\s*分钟/g, () => { minCount++; return '每场战斗 <b class="term-num">1</b> 次'; });
}
Object.keys(d).forEach(name => {
  d[name].forEach(c => {
    c.summary = convertMin(c.summary);
    c.desc = convertMin(c.desc);
  });
});

fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
console.log('Converted', count, '"X 秒" → "Y 回合"');
console.log('Converted', minCount, '"X 分钟" → "每场战斗 N 次"');
// 检查剩余
const txt = JSON.stringify(d);
const remaining = (txt.match(/秒/g) || []).length;
const remainingMin = (txt.match(/分钟/g) || []).length;
console.log('Remaining "秒":', remaining);
console.log('Remaining "分钟":', remainingMin);
