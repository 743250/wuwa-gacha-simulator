// scripts/dedupe-terms.cjs — 删除 TERM_DICT 中重复 key 的旧条目，保留最后一个
const fs = require('fs');
const path = 'src/ui/terms.js';
const src = fs.readFileSync(path, 'utf-8');

// 解析 TERM_DICT = { ... }; 块
const startIdx = src.indexOf('TERM_DICT = {');
const endIdx = src.indexOf('};', startIdx);
if (startIdx < 0 || endIdx < 0) throw new Error('TERM_DICT block not found');

const before = src.slice(0, startIdx);
const after = src.slice(endIdx);
const body = src.slice(startIdx + 'TERM_DICT = {'.length, endIdx);

// 每行格式：  '<key>': '...'  或 多行字符串。我们行内匹配 'key': 后续整段
// 先把所有"  '<key>':"位置标记
const lines = body.split('\n');

// 记录每个 key 出现的最后一个起始行
const keyToLastLine = {};
lines.forEach((line, i) => {
  const m = line.match(/^\s*'([^']+)':\s*'/);
  if (m) keyToLastLine[m[1]] = i;
});

// 标记需要删除的行：key 出现了多次但不是最后一次
const keepLines = new Set();
lines.forEach((line, i) => {
  const m = line.match(/^\s*'([^']+)':\s*'/);
  if (!m) { keepLines.add(i); return; } // 不是 key 行（注释/空行等）
  if (keyToLastLine[m[1]] === i) keepLines.add(i);
  // 否则：丢弃（被后面的版本覆盖）
});

const out = lines.filter((_, i) => keepLines.has(i)).join('\n');
const newSrc = before + 'TERM_DICT = {' + out + after;

fs.writeFileSync(path, newSrc, 'utf-8');

// 再次检查
const reCheck = fs.readFileSync(path, 'utf-8');
const re = /^\s*'([^']+)':\s*'/gm;
const counts = {};
let m;
while ((m = re.exec(reCheck))) counts[m[1]] = (counts[m[1]] || 0) + 1;
const dupes = Object.entries(counts).filter(([, c]) => c > 1);
console.log('After dedupe, duplicates:', dupes.length);
dupes.forEach(([k, c]) => console.log('  ' + k + ' × ' + c));
