// scripts/seconds-to-turns-v2.cjs — 处理紧贴的「数字秒」
const fs = require('fs');
const p = 'src/data/chains-extracted.json';
const d = JSON.parse(fs.readFileSync(p, 'utf-8'));

function secondsToTurns(sec) {
  if (sec <= 6) return 2;
  if (sec <= 12) return 2;
  if (sec <= 18) return 3;
  if (sec <= 24) return 3;
  if (sec <= 30) return 4;
  if (sec <= 60) return 5;
  return 6;
}

let count = 0;
function convert(s) {
  if (!s) return s;
  // <b class="term-num">数字</b>秒（无空格）
  s = s.replace(/<b class="term-num">(\d+(?:\.\d+)?)<\/b>秒/g, (m, num) => {
    const sec = parseFloat(num);
    if (sec < 1) return m;
    count++;
    return '<b class="term-num">' + secondsToTurns(sec) + '</b> 回合';
  });
  // 裸"数字秒"（无 <b> 标签）—— 如"持续15秒"
  s = s.replace(/(\d+(?:\.\d+)?)秒/g, (m, num) => {
    const sec = parseFloat(num);
    if (sec < 1) return m;
    count++;
    return '<b class="term-num">' + secondsToTurns(sec) + '</b> 回合';
  });
  return s;
}

Object.keys(d).forEach(name => {
  d[name].forEach(c => {
    c.summary = convert(c.summary);
    c.desc = convert(c.desc);
  });
});

fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
console.log('Round 2: converted', count, 'more');
const txt = JSON.stringify(d);
const remaining = (txt.match(/秒/g) || []).length;
console.log('Remaining "秒":', remaining);
