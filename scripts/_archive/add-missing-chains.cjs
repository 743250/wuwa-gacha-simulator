// scripts/add-missing-chains.cjs — 给 chains-extracted.json 补齐 5 个缺失角色的模拟器版文案
const fs = require('fs');
const p = 'src/data/chains-extracted.json';
const d = JSON.parse(fs.readFileSync(p, 'utf-8'));

// 折枝（A · 衍射 · 迅刀 · 副C · 墨鹤召唤型）
d['折枝'] = [
  { title: "骨法用笔",
    summary: "<b class=\"term-skill\">共鸣技能·极意</b>回复 <b class=\"term-num\">15</b> 能量，自身暴击 +<b class=\"term-num\">10%</b>。",
    desc: "折枝施放<b class=\"term-skill\">共鸣技能·极意·神来之笔</b>时：<br>· 立即回复 <b class=\"term-num\">15</b> 点共鸣能量<br>· 自身暴击 +<b class=\"term-num\">10%</b>，持续 <b class=\"term-num\">2</b> 回合<br>简化模拟器实装为永久暴击 +10%。" },
  { title: "气韵生动",
    summary: "<b class=\"term-burst\">共鸣解放</b>召唤的<b class=\"term-resource\">墨鹤</b>上限 <b class=\"term-num\">+6</b>（6 → 12 只）。",
    desc: "<b class=\"term-burst\">共鸣解放·虚实境趣</b>召唤的<b class=\"term-resource\">墨鹤</b>最大数量从 <b class=\"term-num\">6</b> 提升到 <b class=\"term-num\">12</b>。<br>模拟器实装为<b class=\"term-burst\">解放伤害 +60%</b>（每只墨鹤约 10% 输出比重）。" },
  { title: "应物象形",
    summary: "<b class=\"term-skill\">共鸣技能</b>命中后攻击 +<b class=\"term-num\">15%</b>，可叠 <b class=\"term-num\">3</b> 层（最高 +45%）。",
    desc: "折枝释放<b class=\"term-skill\">共鸣技能·以形写神</b>、<b class=\"term-skill\">神来之笔</b>或<b class=\"term-skill\">极意·神来之笔</b>时：<br>· 攻击 +<b class=\"term-num\">15%</b>，可叠 <b class=\"term-num\">3</b> 层，持续 27 秒<br>模拟器实装为永久攻击 +<b class=\"term-num\">45%</b>（满层）。" },
  { title: "随类赋彩",
    summary: "<b class=\"term-burst\">共鸣解放</b>时<b class=\"term-resource\">附近队伍中角色</b>攻击 +<b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">2</b> 回合。",
    desc: "折枝释放<b class=\"term-burst\">共鸣解放·虚实境趣</b>时，全队攻击 +<b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">2</b> 回合（模拟器折算为 30 秒）。" },
  { title: "经营位置",
    summary: "墨鹤伤害倍率 +<b class=\"term-num\">40%</b>（额外召唤 1/3 协同墨鹤）。",
    desc: "<b class=\"term-burst\">共鸣解放·虚实境趣</b>持续期间，每召唤 <b class=\"term-num\">3</b> 只墨鹤会额外召唤 <b class=\"term-num\">1</b> 只协同攻击，造成墨鹤 <b class=\"term-num\">140%</b> 的伤害。<br>模拟器实装为<b class=\"term-burst\">解放伤害 +40%</b>。" },
  { title: "传移摹写",
    summary: "<b class=\"term-skill\">共鸣技能·神来之笔</b>额外召唤 <b class=\"term-num\">1</b> 只白鹤（120% 倍率）。",
    desc: "折枝施放<b class=\"term-skill\">共鸣技能·神来之笔</b>或<b class=\"term-skill\">极意·神来之笔</b>时，额外召唤 <b class=\"term-num\">1</b> 只白鹤，造成<b class=\"term-skill\">共鸣技能·神来之笔</b> <b class=\"term-num\">120%</b> 的伤害。<br>模拟器实装为<b class=\"term-skill\">共鸣技能伤害 +120%</b>。" }
];

// 相里要（A · 导电 · 臂铠 · 副C · 思维矩阵叠层）
d['相里要'] = [
  { title: "卓异的门生",
    summary: "<b class=\"term-skill\">共鸣技能·万方法则</b>额外生成 <b class=\"term-num\">6</b> 个衍构模体（8% 倍率/个）。",
    desc: "相里要释放<b class=\"term-skill\">共鸣技能·万方法则</b>时，额外生成 <b class=\"term-num\">6</b> 个衍构模体，每个造成<b class=\"term-skill\">万方法则</b> <b class=\"term-num\">8%</b> 的伤害。<br>模拟器实装为<b class=\"term-skill\">共鸣技能伤害 +48%</b>。" },
  { title: "前人的行迹",
    summary: "<b class=\"term-skill\">共鸣技能</b>/<b class=\"term-burst\">解放</b>后暴击伤害 +<b class=\"term-num\">30%</b>。",
    desc: "施放<b class=\"term-skill\">共鸣技能</b>或<b class=\"term-burst\">共鸣解放·思维矩阵</b>时，自身暴击伤害 +<b class=\"term-num\">30%</b>，持续 8 秒。<br>模拟器实装为永久暴击伤害 +30%。" },
  { title: "邃古的遗墟",
    summary: "<b class=\"term-burst\">共鸣解放</b>后<b class=\"term-resource\">遗墟</b>触发 <b class=\"term-num\">5</b> 次共鸣技能 +<b class=\"term-num\">63%</b>。",
    desc: "释放<b class=\"term-burst\">共鸣解放·思维矩阵</b>后获得 <b class=\"term-num\">5</b> 次「邃古遗墟」：每次<b class=\"term-skill\">共鸣技能</b>消耗 1 次，让本次伤害 +<b class=\"term-num\">63%</b>（24 秒内有效）。<br>模拟器实装为<b class=\"term-skill\">共鸣技能伤害 +63%</b>（永久 5 次 ≈ 大部分循环吃满）。" },
  { title: "再塑的躯骸",
    summary: "<b class=\"term-burst\">共鸣解放</b>时全队<b class=\"term-burst\">共鸣解放伤害加成</b> +<b class=\"term-num\">25%</b>，持续 <b class=\"term-num\">2</b> 回合。",
    desc: "施放<b class=\"term-burst\">共鸣解放·思维矩阵</b>时，附近队伍中所有角色<b class=\"term-burst\">共鸣解放伤害加成</b> +<b class=\"term-num\">25%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
  { title: "群星的止境",
    summary: "<b class=\"term-burst\">共鸣解放·思维矩阵</b>伤害倍率 +<b class=\"term-num\">100%</b>。",
    desc: "<b class=\"term-burst\">共鸣解放·思维矩阵</b>伤害倍率 +<b class=\"term-num\">100%</b>。延奏技能链式倍率 +222%（模拟器无延奏倍率字段，仅折算解放部分）。" },
  { title: "坊市的烟火",
    summary: "<b class=\"term-skill\">共鸣技能·万方法则</b>伤害倍率 +<b class=\"term-num\">76%</b>。",
    desc: "强化施放<b class=\"term-burst\">共鸣解放·思维矩阵</b>时获得的幻方，使<b class=\"term-skill\">共鸣技能·万方法则</b>伤害倍率 +<b class=\"term-num\">76%</b>。" }
];

// 洛可可（B · 湮灭 · 臂铠 · 副C · 想象力增益）
d['洛可可'] = [
  { title: "沉闷的灰暗涌进船舱",
    summary: "<b class=\"term-skill\">共鸣技能·高难度设计</b>额外回 100 想象力 + <b class=\"term-num\">10</b> 协奏能量。",
    desc: "施放<b class=\"term-skill\">共鸣技能·高难度设计</b>时：<br>· 额外回 <b class=\"term-num\">100</b> 点【想象力】<br>· +<b class=\"term-num\">10</b> 协奏能量<br>普攻幻想照进现实免疫打断（模拟器实装为<b class=\"term-skill\">共鸣技能 +20%</b>）。" },
  { title: "海萤石闪烁着微弱光芒",
    summary: "普攻命中给全队<b class=\"term-resource\">湮灭伤害加成</b> +<b class=\"term-num\">10%</b>/层，满 3 层再 +10%（合计 +40%）。",
    desc: "施放<b class=\"term-normal\">普攻·幻想照进现实</b>时，全队湮灭伤害 +<b class=\"term-num\">10%</b>，可叠 <b class=\"term-num\">3</b> 层。满层时全队湮灭再 +<b class=\"term-num\">10%</b>。<br>模拟器实装为<b class=\"term-resource\">全队湮灭伤害 +40%</b>。" },
  { title: "用心观察，以手丈量",
    summary: "<b class=\"term-variation\">变奏</b>后暴击 +<b class=\"term-num\">10%</b>、暴击伤害 +<b class=\"term-num\">30%</b>。",
    desc: "施放<b class=\"term-variation\">变奏技能·佩洛，来帮忙</b>时，洛可可暴击 +<b class=\"term-num\">10%</b>、暴击伤害 +<b class=\"term-num\">30%</b>，持续 15 秒。<br>模拟器实装为永久暴击 +10% / 暴击伤害 +30%。" },
  { title: "千万「奇藏」于箱中汇聚",
    summary: "<b class=\"term-skill\">共鸣技能</b>后<b class=\"term-normal\">普攻幻想照进现实</b>伤害 +<b class=\"term-num\">60%</b>。",
    desc: "施放<b class=\"term-skill\">共鸣技能·高难度设计</b>时，<b class=\"term-normal\">普攻·幻想照进现实</b>伤害倍率 +<b class=\"term-num\">60%</b>，持续 12 秒。<br>模拟器实装为<b class=\"term-normal\">普攻伤害 +60%</b>。" },
  { title: "重建乐土，在舞台上",
    summary: "<b class=\"term-burst\">解放</b>开场 +<b class=\"term-num\">20%</b>、<b class=\"term-heavy\">重击</b> +<b class=\"term-num\">80%</b>。",
    desc: "<b class=\"term-burst\">共鸣解放·即兴喜剧</b>，开场伤害 +<b class=\"term-num\">20%</b>，重击伤害 +<b class=\"term-num\">80%</b>。<br>模拟器实装为<b class=\"term-burst\">解放伤害 +20%</b> + <b class=\"term-heavy\">重击伤害 +80%</b>。" },
  { title: "飞吧，乘着金色的翅膀",
    summary: "<b class=\"term-burst\">解放</b>后无视目标 <b class=\"term-num\">60%</b> 防御 + 飞跃<b class=\"term-heavy\">普攻构筑现实</b>（重击类型）。",
    desc: "施放<b class=\"term-burst\">共鸣解放·即兴喜剧</b>开场时，12 秒内：<br>· 普攻无视目标 <b class=\"term-num\">60%</b> 防御<br>· 普攻第 3 段进入飞跃幻想，可施放<b class=\"term-heavy\">普攻·构筑现实</b>（重击类型，100% 倍率）<br>模拟器实装为<b class=\"term-resource\">无视防御 +60%</b>。" }
];

// 布兰特（S · 热熔 · 迅刀 · 辅助 · 火焰归亡曲护盾辅助）
d['布兰特'] = [
  { title: "跟随洋流和信风",
    summary: "<b class=\"term-variation\">变奏</b>/空中攻击 +<b class=\"term-num\">20%</b>，可叠 <b class=\"term-num\">3</b> 层（满 +60%）。",
    desc: "施放<b class=\"term-burst\">火焰归亡曲</b>期间短暂停滞目标。施放<b class=\"term-variation\">变奏技能·为我！</b>或空中攻击空翻时，伤害 +<b class=\"term-num\">20%</b>，可叠 <b class=\"term-num\">3</b> 层。<br>模拟器实装为永久攻击 +<b class=\"term-num\">60%</b>。" },
  { title: "掠夺欢声与笑颜",
    summary: "空中攻击/<b class=\"term-burst\">火焰归亡曲</b>暴击 +<b class=\"term-num\">30%</b>。<b class=\"term-burst\">延奏</b>触发爆炸（atk × 440% 热熔）。",
    desc: "施放空中攻击和<b class=\"term-burst\">火焰归亡曲</b>时暴击 +<b class=\"term-num\">30%</b>。<br>延奏技能<b class=\"term-burst\">航向确定！</b>后 20 秒内，登场角色施放<b class=\"term-skill\">共鸣技能</b>命中时，布兰特发动爆炸 attack 440% 热熔，每秒 1 次最多 2 次。<br>模拟器实装为永久暴击 +<b class=\"term-num\">30%</b>。" },
  { title: "无惧惊涛骇浪",
    summary: "<b class=\"term-burst\">火焰归亡曲</b>伤害倍率 +<b class=\"term-num\">42%</b>。",
    desc: "<b class=\"term-burst\">火焰归亡曲</b>伤害倍率 +<b class=\"term-num\">42%</b>。" },
  { title: "纵情放声歌唱",
    summary: "<b class=\"term-burst\">火焰归亡曲</b>护盾量 +<b class=\"term-num\">20%</b>，并回复全队生命。",
    desc: "<b class=\"term-burst\">火焰归亡曲</b>获得的护盾量 +<b class=\"term-num\">20%</b>。施放<b class=\"term-burst\">火焰归亡曲</b>时回复全队生命（每 1% 共鸣效率回 6.6 点生命）。<br>模拟器实装为治疗加成 +<b class=\"term-num\">25%</b>。" },
  { title: "演员说：生活皆舞台",
    summary: "<b class=\"term-normal\">普攻</b>伤害 +<b class=\"term-num\">15%</b>。",
    desc: "造成<b class=\"term-normal\">普攻</b>伤害时，<b class=\"term-normal\">普攻</b>伤害加成 +<b class=\"term-num\">15%</b>，持续 10 秒。<br>模拟器实装为永久<b class=\"term-normal\">普攻 +15%</b>。" },
  { title: "船长答：狂欢即世界！",
    summary: "空中攻击倍率 +<b class=\"term-num\">30%</b>；<b class=\"term-burst\">火焰归亡曲</b>后再燃（30% 倍率二段）。",
    desc: "空中攻击倍率 +<b class=\"term-num\">30%</b>。施放<b class=\"term-burst\">火焰归亡曲</b>后产生再燃，造成 30% 倍率的热熔（普攻类型）。<br>模拟器实装为<b class=\"term-burst\">解放伤害 +30%</b>。" }
];

// 坎特蕾拉（S · 湮灭 · 音感仪 · 副C · 蜃境召唤）
d['坎特蕾拉'] = [
  { title: "在无尽展开的波涛里",
    summary: "<b class=\"term-skill\">共鸣技能</b>/感知汲取伤害倍率 +<b class=\"term-num\">50%</b>。",
    desc: "施放<b class=\"term-skill\">共鸣技能</b>时回复 1 点【迷离】。<b class=\"term-skill\">共鸣技能·翩跹</b>、<b class=\"term-skill\">斑驳幻梦</b>、<b class=\"term-skill\">感知汲取</b>伤害倍率 +<b class=\"term-num\">50%</b>。<b class=\"term-skill\">感知汲取</b>免疫打断。" },
  { title: "坠入迷离幻梦",
    summary: "<b class=\"term-burst\">共鸣解放·陷溺</b>触发惊醒伤害倍率 +<b class=\"term-num\">245%</b>。",
    desc: "<b class=\"term-burst\">共鸣解放·陷溺</b>使目标进入迷梦，触发<b class=\"term-resource\">惊醒</b>的伤害倍率 +<b class=\"term-num\">245%</b>。<br>模拟器实装为<b class=\"term-burst\">解放伤害 +245%</b>。" },
  { title: "凝视着深渊",
    summary: "<b class=\"term-burst\">共鸣解放·陷溺</b>伤害倍率 +<b class=\"term-num\">370%</b>；解放后直接进入蜃境状态。",
    desc: "<b class=\"term-burst\">共鸣解放·陷溺</b>伤害倍率 +<b class=\"term-num\">370%</b>。施放<b class=\"term-burst\">解放</b>后直接进入蜃境状态。" },
  { title: "就像凝视自己的灵魂",
    summary: "蜃境状态期间治疗加成 +<b class=\"term-num\">25%</b>。",
    desc: "蜃境状态期间，治疗效果加成 +<b class=\"term-num\">25%</b>。" },
  { title: "投到倒影的怀里",
    summary: "<b class=\"term-burst\">共鸣解放·弥漫</b>的织梦水母最大召唤数 +<b class=\"term-num\">5</b>。",
    desc: "<b class=\"term-burst\">共鸣解放·弥漫</b>的织梦水母最大召唤数 +<b class=\"term-num\">5</b>。模拟器实装为<b class=\"term-burst\">解放伤害 +50%</b>。" },
  { title: "下坠、下坠……坠入更深的幻梦",
    summary: "<b class=\"term-normal\">普攻·蛰幻</b>伤害倍率 +<b class=\"term-num\">80%</b>，无视目标 <b class=\"term-num\">30%</b> 防御。",
    desc: "<b class=\"term-normal\">普攻·蛰幻</b>伤害倍率 +<b class=\"term-num\">80%</b>。施放<b class=\"term-burst\">共鸣解放·陷溺</b>时，坎特蕾拉的伤害无视目标 <b class=\"term-num\">30%</b> 防御。" }
];

fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
console.log('Added 5 character chains. Total keys now:', Object.keys(d).length);
