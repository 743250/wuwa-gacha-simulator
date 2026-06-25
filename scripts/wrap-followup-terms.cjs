// scripts/wrap-followup-terms.cjs — 把 render.js 中 followUp 里的裸术语用 <b class="term-..."> 包起来
const fs = require('fs');
const path = 'src/ui/render.js';
let src = fs.readFileSync(path, 'utf-8');

// 术语 → 包装类型 (term-resource/skill/heavy/normal/burst/variation)
// 思路：按"类别"对术语分类
const WRAP = {
  // 资源/状态/buff/debuff/召唤物 → term-resource
  '空中释羽': 'heavy',           // 重击类派生
  '空中攻击空翻': 'heavy',
  '空中攻击': 'heavy',
  '闪避反击': 'variation',       // 变奏类派生
  '强化·前扑': 'skill',
  '强化·后撤': 'skill',
  '行气反击': 'skill',
  '白咩失控之炎': 'heavy',
  '黑咩暴走之炎': 'heavy',
  '风场鸣声': 'skill',
  '牵引': 'resource',
  '停滞': 'resource',
  '嘲讽': 'resource',
  '协同攻击': 'resource',
  '再燃': 'normal',              // 文案标记为普攻类型
  '解离': 'resource',
  '变彩': 'resource',
  '虚实之门': 'resource',
  '迷雾潜行': 'resource',
  '阴阳相生': 'resource',
  '五雷荡煞阵': 'skill',
  '雷法·三才合一': 'resource',
  '电磁效应': 'resource',
  '加麻加辣': 'resource',
  '霁青': 'resource',
  '天籁': 'resource',
  '念意': 'resource',
  '频隙回响': 'skill',
  '攻防转换': 'resource',
  '猎杀影': 'resource',
  '白鹤': 'resource',
  '衍构模体': 'resource',
  '织梦水母': 'resource',
  '雷之楔': 'skill',
  '镜之环': 'resource',
  '光合能量': 'resource',
  '光合标记': 'resource',
  '迷失羔羊': 'resource',
  '冰绽': 'resource',
  '焕彩': 'resource',
  '对偶': 'skill',
  '联珠': 'skill',
  '合说': 'skill',
};

// 颜色映射（仅做记录，实际 attachTermTips 用 class）
// 按长度排序，长的优先（避免"空中攻击"先于"空中攻击空翻"）
const orderedKeys = Object.keys(WRAP).sort((a, b) => b.length - a.length);

let totalWrapped = 0;

// 只在 followUp 字符串内部替换 —— 避免误伤 forteDesc / intro 等其他文案
src = src.replace(/(?<=FollowUp:\s*')([^']*)(?=')/g, (text) => {
  let updated = text;
  for (const key of orderedKeys) {
    // 跳过已经包过 term 的，用负向断言
    const re = new RegExp(`(?<!<b class="term-[a-z]+">)${escapeRegex(key)}(?!</b>)`, 'g');
    const before = (updated.match(re) || []).length;
    if (before === 0) continue;
    updated = updated.replace(re, `<b class="term-${WRAP[key]}">${key}</b>`);
    totalWrapped += before;
  }
  return updated;
});

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

fs.writeFileSync(path, src, 'utf-8');
console.log('Wrapped', totalWrapped, 'naked term references in followUps');
