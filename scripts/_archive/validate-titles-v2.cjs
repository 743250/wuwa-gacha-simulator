// scripts/validate-titles-v2.cjs — 通过 dynamic import seq.js 来精确读取官方数据
// 因为 seq.js 是 ES module，用 child_process node --input-type=module
const { execSync } = require('child_process');
const out = execSync('node --input-type=module -e "import(\'./src/data/seq.js\').then(m=>console.log(JSON.stringify(m.seqText)))"', {encoding:'utf-8'});
const seqText = JSON.parse(out.trim());
const d = require('../src/data/chains-extracted.json');

const myRewrites = ['折枝','相里要','洛可可','布兰特','坎特蕾拉','维里奈','安可','凌阳','鉴心',
                    '莫特斐','散华','卜灵','丹瑾','白芷','秋水','炽霞','秧秧','桃祈','渊武','釉瑚','灯灯'];

let totalErr = 0;
myRewrites.forEach(name => {
  if (!seqText[name]) { console.log('? ' + name + ': not in seq.js'); return; }
  const officialTitles = seqText[name].map(x => x[0]);
  const myTitles = d[name].map(c => c.title);
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
console.log('\n共 ' + totalErr + ' 处标题错误');
