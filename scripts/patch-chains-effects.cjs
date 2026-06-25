// scripts/patch-chains-effects.cjs — 用 JS 在线程内修改 chains.js 的 5/6 链 effect 值
// 通过精确替换每个角色的整个数组块
const fs = require('fs');
const path = 'src/battle/chains.js';
let src = fs.readFileSync(path, 'utf-8');

// 每个角色：[old, new]
// 注：这里我们只替换 chains.js 中 CHAIN_BATTLE_EFFECTS 对应角色的 6 行 effect 数组
// 安全做法：用角色名 anchor，匹配该名后的下一个 `]` 之前的所有行

const replacements = [
  // 白芷
  { name: '白芷', body: `[
    [{ effect: 'energyRefund', value: 5, label: '共鸣技能每念意回 2.5 能量' }],
    [{ effect: 'elemDmg', value: 0.15, element: '冷凝', label: '满念意时冷凝 +15%' },
     { effect: 'heal', value: 0.15, label: '满念意时治疗 +15%' }],
    [{ effect: 'hp', value: 0.12, label: '变奏后生命上限 +12%' }],
    [{ effect: 'heal', value: 0.20, label: '解放强化频隙回响治疗 +20%' }],
    [{ effect: 'heal', value: 0.10, label: '被回应的祈愿：复活队友（折算治疗 +10%）' }],
    [{ effect: 'teamElemDmg', value: 0.12, element: '冷凝', label: '闻道者觉悟：拾取天籁全队冷凝 +12%' }]
  ]` },
  { name: '秋水', body: `[
    [{ effect: 'skillCdReduce', value: 1, label: '共鸣技能 CD -1 回合' }],
    [{ effect: 'atk', value: 0.15, label: '攻击雾化分身嘲讽目标 +15% 攻击' }],
    [{ effect: 'normalDmg', value: 0.30, label: '穿门额外子弹（折算普攻 +30%）' }],
    [{ effect: 'skillDmg', value: 0.30, label: '共鸣技能·雾化子弹 +30%' }],
    [{ effect: 'elemDmg', value: 0.25, element: '气动', label: '迷途者喝彩：潜行时气动 +25%' }],
    [{ effect: 'crate', value: 0.08, label: '幕后卖家：解放暴击 +8%' },
     { effect: 'heavyDmg', value: 0.50, label: '幕后卖家：重击穿门 +50%' }]
  ]` },
  { name: '炽霞', body: `[
    [{ effect: 'crate', value: 0.20, label: '共鸣技能·轰轰必暴击（折算暴击 +20%）' }],
    [{ effect: 'energyRefund', value: 5, label: '解放期间击败目标回 5 能量' }],
    [{ effect: 'burstDmg', value: 0.25, label: '解放对低 HP 目标 +40%（折算 +25%）' }],
    [{ effect: 'burstDmg', value: 0.30, label: '解放获 60 弹 + 重置技能 CD（折算 +30%）' }],
    [{ effect: 'atk', value: 0.30, label: '胜利的枪弹焰火：加麻加辣满层攻击 +30%' }],
    [{ effect: 'teamNormalDmg', value: 0.25, label: '剧终彩蛋：技能·轰轰后全队普攻 +25%' }]
  ]` },
  { name: '秧秧', body: `[
    [{ effect: 'elemDmg', value: 0.15, element: '气动', label: '变奏后气动 +15%' }],
    [{ effect: 'energyRefund', value: 10, label: '重击命中回 10 能量' }],
    [{ effect: 'skillDmg', value: 0.40, label: '共鸣技能 +40%' }],
    [{ effect: 'heavyDmg', value: 0.95, label: '空中释羽（重击）+95%' }],
    [{ effect: 'burstDmg', value: 0.85, label: '绪风于此响彻：解放·朔风旋涌 +85%' }],
    [{ effect: 'teamAtk', value: 0.20, label: '致美好以颂歌：空中释羽后全队攻击 +20%' }]
  ]` },
  { name: '桃祈', body: `[
    [{ effect: 'hp', value: 0.12, label: '攻防转换护盾 +40%（折算 HP +12%）' }],
    [{ effect: 'crate', value: 0.10, label: '解放暴击 +20%（折算 +10%）' },
     { effect: 'cdmg', value: 0.20, label: '解放暴击伤害 +20%' }],
    [{ effect: 'skillDmg', value: 0.20, label: '磐岩护壁延长（折算技能 +20%）' }],
    [{ effect: 'def', value: 0.20, label: '重击发后制人触发，防御 +20%' }],
    [{ effect: 'energyRefund', value: 20, label: '解市井民忧：攻防转换命中回 20 能量' }],
    [{ effect: 'normalDmg', value: 0.40, label: '护城邦：磐岩护壁期间普攻 +40%' },
     { effect: 'heavyDmg', value: 0.40, label: '护城邦：磐岩护壁期间重击 +40%' }]
  ]` },
  { name: '渊武', body: `[
    [{ effect: 'atk', value: 0.10, label: '雷厉风行攻速 +20%（折算攻击 +10%）' }],
    [{ effect: 'energyRefund', value: 15, label: '变奏·轰雷回 15 能量' }],
    [{ effect: 'skillDmg', value: 0.20, label: '共鸣技能·雷之楔 +20%' }],
    [{ effect: 'burstDmg', value: 0.30, label: '解放·寂土重明给全队护盾（折算 +30%）' }],
    [{ effect: 'burstDmg', value: 0.50, label: '顾一方天地：雷之楔在场时解放 +50%' }],
    [{ effect: 'teamDef', value: 0.32, label: '保八方平安：雷之楔范围内全队防御 +32%' }]
  ]` },
  { name: '釉瑚', body: `[
    [{ effect: 'hp', value: 0.06, label: '共鸣技能 10% 免伤（折算 HP +6%）' }],
    [{ effect: 'skillDmg', value: 0.20, label: '对偶/联珠额外触发（折算技能 +20%）' }],
    [{ effect: 'atk', value: 0.20, label: '攻击 +20%' }],
    [{ effect: 'skillDmg', value: 0.20, label: '20% 概率技能不进 CD（折算技能 +20%）' }],
    [{ effect: 'crate', value: 0.15, label: '万里浅眠：变奏·遂心匣后暴击 +15%' }],
    [{ effect: 'cdmg', value: 0.60, label: '千秋一枕：奇珍赏获霁青 4 层 × 15% = +60% 暴伤' }]
  ]` },
  { name: '灯灯', body: `[
    [{ effect: 'skillDmg', value: 0.15, label: '强化·后撤回耐力（折算技能 +15%）' }],
    [{ effect: 'defPierce', value: 0.20, label: '强化·前扑/后撤无视 20% 防御' }],
    [{ effect: 'burstDmg', value: 0.30, label: '共鸣解放·啾啾专送 +30%' }],
    [{ effect: 'normalDmg', value: 0.30, label: '普攻伤害加成 +30%' }],
    [{ effect: 'skillDmg', value: 1.00, label: '快件已顺利签收：光能满时强光穿射 +100%' }],
    [{ effect: 'teamAtk', value: 0.20, label: '给个五星好评哦：解放时全队攻击 +20%' }]
  ]` }
];

let updated = 0;
replacements.forEach(({name, body}) => {
  // 匹配 `'XX': [\n ... \n  ],` 形式
  const re = new RegExp("'" + name + "':\\s*\\[[\\s\\S]*?^\\s*\\],", 'm');
  const newBlock = "'" + name + "': " + body + ",";
  if (re.test(src)) {
    src = src.replace(re, newBlock);
    updated++;
    console.log('✅ patched ' + name);
  } else {
    console.log('❌ no match for ' + name);
  }
});

fs.writeFileSync(path, src, 'utf-8');
console.log('updated', updated, '/', replacements.length);
