// scripts/strip-meta-notes.cjs — 清洗 chains-extracted.json 里所有"模拟器实装/折算"元注释
// 玩家看到的应该是官方口吻的角色文案，不是开发账本
const fs = require('fs');
const p = 'src/data/chains-extracted.json';
const d = JSON.parse(fs.readFileSync(p, 'utf-8'));

// 待清洗的模式（按出现频率排序）
// 1. "...。模拟器实装为 xxx。"             → 删掉整个尾句
// 2. "...。模拟器简化为 xxx。"             → 删掉
// 3. "(折算 +xxx)"   或 "（折算 +xxx）"     → 删括号内容
// 4. "（次数折算）" / "（机动性折算）" 等   → 删括号内容
// 5. "<span ...font-size:10px ...">※ B-Tier ...</span>"  → 删整段（吟霖的 B-Tier 标注）
// 6. 行内"，模拟器折算 / 模拟器简化"       → 删该子句

function cleanText(s) {
  if (!s) return s;
  let t = s;
  // 删元注释整句（结尾）
  t = t.replace(/<br>模拟器(实装|简化)为[^<。]*。?/g, '');
  t = t.replace(/。\s*模拟器(实装|简化)为[^。]*。?/g, '。');
  t = t.replace(/^模拟器(实装|简化)为[^。]*。?/g, '');
  // 删括号内"折算"说明
  t = t.replace(/[（(]折算[^）)]*[)）]/g, '');
  t = t.replace(/[（(][^）)]{0,12}折算[)）]/g, '');
  // 删 B-Tier 标注
  t = t.replace(/<span style="color:var\(--muted\)[^"]*font-size:10px[^"]*">[^<]*B-Tier[^<]*<\/span>/g, '');
  t = t.replace(/<span style="[^"]*font-size:10px[^"]*">[^<]*Tier[^<]*<\/span>/g, '');
  // 兜底：清掉孤立的 <br> 结尾、双连 <br><br>
  t = t.replace(/<br>\s*<br>/g, '<br>');
  t = t.replace(/<br>\s*$/g, '');
  t = t.replace(/^\s*<br>/, '');
  t = t.replace(/\s+$/, '');
  return t;
}

let changed = 0;
Object.keys(d).forEach(name => {
  d[name].forEach(c => {
    const oldDesc = c.desc;
    const oldSum  = c.summary;
    c.desc    = cleanText(c.desc);
    c.summary = cleanText(c.summary);
    if (oldDesc !== c.desc || oldSum !== c.summary) changed++;
  });
});

fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
console.log('Cleaned', changed, 'chain entries across', Object.keys(d).length, 'characters');

// 检查剩余的可疑模式
const txt = JSON.stringify(d);
['模拟器','折算','简化','B-Tier'].forEach(k => {
  const m = txt.match(new RegExp(k, 'g'));
  console.log('  still has "' + k + '":', (m ? m.length : 0));
});
