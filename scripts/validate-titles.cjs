// scripts/validate-titles.cjs — 把我手写的 21 个角色的标题与 seq.js 官方对比
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('src/data/chains-extracted.json', 'utf-8'));
const seqRaw = fs.readFileSync('src/data/seq.js', 'utf-8');

const myRewrites = ['折枝','相里要','洛可可','布兰特','坎特蕾拉','维里奈','安可','凌阳','鉴心',
                    '莫特斐','散华','卜灵','丹瑾','白芷','秋水','炽霞','秧秧','桃祈','渊武','釉瑚','灯灯'];

let totalErr = 0;
myRewrites.forEach(name => {
  const re = new RegExp('"' + name + '":\\s*\\[([\\s\\S]*?)\\]\\s*,?\\s*$', 'm');
  const m = seqRaw.match(re);
  if (!m) { console.log(name + ': seq.js NOT FOUND'); return; }
  const officialTitles = [...m[1].matchAll(/\["([^"]+)"/g)].map(x => x[1]);
  const myTitles = d[name].map(c => c.title);
  if (officialTitles.length !== 6) console.log('⚠ ' + name + ' seq.js 链数: ' + officialTitles.length);
  const mismatch = [];
  for (let i = 0; i < 6; i++) {
    if (officialTitles[i] !== myTitles[i]) {
      mismatch.push('  链' + (i+1) + ': 官方「' + officialTitles[i] + '」 ≠ 我写「' + myTitles[i] + '」');
    }
  }
  if (mismatch.length) {
    totalErr += mismatch.length;
    console.log('❌ ' + name + ' (' + mismatch.length + ' 处错):');
    mismatch.forEach(x => console.log(x));
  } else {
    console.log('✅ ' + name);
  }
});
console.log('\n总共: ' + totalErr + ' 处标题错误');
