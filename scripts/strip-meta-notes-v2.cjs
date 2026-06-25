// scripts/strip-meta-notes-v2.cjs — 第二轮清理
const fs = require('fs');
const p = 'src/data/chains-extracted.json';
const d = JSON.parse(fs.readFileSync(p, 'utf-8'));

function clean(s) {
  if (!s) return s;
  let t = s;
  // "<br>简化模拟器实装为..." / "简化模拟器实装为..." 末尾
  t = t.replace(/<br>简化模拟器(实装|简化)为[^<。]*。?/g, '');
  t = t.replace(/简化模拟器(实装|简化)为[^。]*。?/g, '');
  // "（模拟器折算..)" / "（模拟器无 xx）" 这种括号
  t = t.replace(/[（(]模拟器[^）)]+[)）]/g, '');
  // 兜底：所有还包含 "模拟器" 的句子
  t = t.replace(/[^。]*模拟器[^。]*。/g, '');
  // 清理多余 <br>
  t = t.replace(/<br>\s*<br>/g, '<br>');
  t = t.replace(/<br>\s*$/, '').replace(/\s+$/, '');
  return t;
}

let changed = 0;
Object.keys(d).forEach(name => {
  d[name].forEach(c => {
    const oldDesc = c.desc, oldSum = c.summary;
    c.desc = clean(c.desc);
    c.summary = clean(c.summary);
    if (oldDesc !== c.desc || oldSum !== c.summary) changed++;
  });
});

fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
console.log('Round 2 cleaned', changed, 'entries');
['模拟器','折算','简化'].forEach(k => {
  const m = JSON.stringify(d).match(new RegExp(k, 'g'));
  console.log('  remaining "'+k+'":', m?m.length:0);
});
