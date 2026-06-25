// scripts/fix-titles-and-mechanics.cjs
// 修复 13 个角色被瞎编的 5、6 链，按 seq.js 官方文案重写
const fs = require('fs');
const p = 'src/data/chains-extracted.json';
const d = JSON.parse(fs.readFileSync(p, 'utf-8'));

// 每个角色：[ {title, summary, desc} × 2 ] 替换 5、6 链
const fixes = {
  '维里奈': {
    5: { title: '结果的奇迹',
         summary: '治疗生命低于 <b class="term-num">50%</b> 角色时，治疗加成 +<b class="term-num">20%</b>。',
         desc: '治疗生命值低于 <b class="term-num">50%</b> 的角色时，维里奈的治疗效果加成 +<b class="term-num">20%</b>。' },
    6: { title: '丰收的喜悦',
         summary: '<b class="term-heavy">重击·星星花绽放</b>/空中攻击 +<b class="term-num">20%</b>，命中时触发协同攻击 + 全队回血。',
         desc: '<b class="term-heavy">重击·星星花绽放</b>及空中攻击星星花绽放的伤害 +<b class="term-num">20%</b>，命中目标时触发 <b class="term-num">1</b> 次协同攻击，并为附近队伍中所有角色回复生命值，此次协同攻击伤害和回复生命值等同于<b class="term-burst">共鸣解放·光合标记</b>。' }
  },
  '安可': {
    5: { title: '聚光灯，勇士登场！',
         summary: '<b class="term-skill">共鸣技能伤害加成</b> +<b class="term-num">35%</b>。',
         desc: '<b class="term-skill">共鸣技能伤害加成</b> +<b class="term-num">35%</b>。' },
    6: { title: '羊咩，拯救世界！',
         summary: '<b class="term-burst">共鸣解放·黑咩大暴走</b>期间，每次造成伤害叠 1 层<b class="term-resource">迷失羔羊</b>（攻击 +<b class="term-num">5%</b>，最多 5 层）。',
         desc: '<b class="term-burst">共鸣解放·黑咩大暴走</b>期间，每次造成伤害为自身叠加 <b class="term-num">1</b> 层【迷失羔羊】，每层使攻击 +<b class="term-num">5%</b>，效果持续 <b class="term-num">10</b> 秒，最多可叠加 <b class="term-num">5</b> 层。' }
  },
  '鉴心': {
    5: { title: '经世自鉴',
         summary: '<b class="term-burst">共鸣解放·涤净力场</b>范围 +<b class="term-num">33%</b>。',
         desc: '<b class="term-burst">共鸣解放·涤净力场</b>范围 +<b class="term-num">33%</b>。' },
    6: { title: '向己而生',
         summary: '<b class="term-heavy">重击·混元气旋</b>期间冲拳，可施放强化<b class="term-skill">特殊行气反击</b>（atk × <b class="term-num">556.67%</b> 气动 / 重击伤害类型 + 大周天护盾）。',
         desc: '共鸣回路<b class="term-heavy">重击·混元气旋</b>期间施展冲拳，获得强化<b class="term-skill">共鸣技能·特殊行气反击</b>，<b class="term-num">5</b> 秒内可施放 <b class="term-num">1</b> 次。特殊行气反击：造成鉴心 <b class="term-num">556.67%</b> 攻击的<b class="term-resource">气动伤害</b>，此次伤害为重击伤害，同时获得达到大周天·外阶段的护盾。' }
  },
  '莫特斐': {
    3: { title: '预热的宣叙调',
         summary: '<b class="term-burst">共鸣解放·浮翼狂想</b>期间，<b class="term-burst">共鸣解放加强音</b>暴击伤害 +<b class="term-num">30%</b>。',
         desc: '<b class="term-burst">共鸣解放·浮翼狂想</b>持续期间，<b class="term-burst">共鸣解放加强音</b>的暴击伤害 +<b class="term-num">30%</b>。' },
    4: { title: '宣泄的华尔兹',
         summary: '<b class="term-burst">共鸣解放·浮翼狂想</b>持续时间 +<b class="term-num">7</b> 秒。',
         desc: '<b class="term-burst">共鸣解放·浮翼狂想</b>的持续时间 +<b class="term-num">7</b> 秒。' },
    5: { title: '葬送的四重奏',
         summary: '<b class="term-skill">共鸣技能·激昂变奏</b>/<b class="term-skill">怒火赋格</b>命中触发协同攻击（4 发<b class="term-burst">加强音</b>，倍率 -50%）。',
         desc: '<b class="term-skill">共鸣技能·激昂变奏</b>和<b class="term-skill">共鸣技能·怒火赋格</b>命中目标时，进行协同攻击，打出 <b class="term-num">4</b> 发<b class="term-burst">共鸣解放加强音</b>，造成<b class="term-resource">热熔伤害</b>，此次<b class="term-burst">共鸣解放加强音</b>伤害降低 <b class="term-num">50%</b>。' },
    6: { title: '盛怒的无言歌',
         summary: '<b class="term-burst">共鸣解放·暴烈终曲</b>时，全队攻击 +<b class="term-num">20%</b>，持续 <b class="term-num">20</b> 秒。',
         desc: '施放<b class="term-burst">共鸣解放·暴烈终曲</b>时，队伍中所有角色攻击 +<b class="term-num">20%</b>，持续 <b class="term-num">20</b> 秒。' }
  },
  '散华': {
    5: { title: '颠覆无常',
         summary: '共鸣回路<b class="term-resource">冰绽</b>暴击伤害 +<b class="term-num">100%</b>，【冰棘】/【冰棱】/【冰川】消失时直接爆炸。',
         desc: '共鸣回路<b class="term-resource">冰绽</b>的暴击伤害 +<b class="term-num">100%</b>。即使没有成功引爆，【冰棘】、【冰棱】、【冰川】也会在消失时直接爆炸。' },
    6: { title: '曙色天光',
         summary: '引爆【冰棱】/【冰川】后，全队攻击 +<b class="term-num">10%</b>，可叠 <b class="term-num">2</b> 层。',
         desc: '引爆【冰棱】或【冰川】后，队伍中所有角色攻击 +<b class="term-num">10%</b>，持续 <b class="term-num">20</b> 秒，可叠 <b class="term-num">2</b> 层。' }
  },
  '白芷': {
    5: { title: '被回应的祈愿',
         summary: '队友失去意识时，立刻为该角色恢复意识并回复生命上限 <b class="term-num">100%</b>（每 <b class="term-num">10</b> 分钟 1 次）。',
         desc: '队伍中的白芷存活时，若队伍中的角色（不包含白芷）失去意识，立刻为该角色恢复意识并回复该角色生命上限 <b class="term-num">100%</b> 的生命值，该效果每 <b class="term-num">10</b> 分钟可触发 <b class="term-num">1</b> 次。' },
    6: { title: '闻道者的觉悟',
         summary: '角色拾取固有技能<b class="term-resource">天籁</b>时，附近全队<b class="term-resource">冷凝伤害加成</b> +<b class="term-num">12%</b>。',
         desc: '角色拾取固有技能<b class="term-resource">天籁</b>时，附近队伍中所有角色的<b class="term-resource">冷凝伤害加成</b> +<b class="term-num">12%</b>，持续 <b class="term-num">20</b> 秒。' }
  },
  '秋水': {
    5: { title: '迷途者喝彩',
         summary: '<b class="term-resource">迷雾潜行</b>时，<b class="term-resource">气动伤害加成</b> +<b class="term-num">25%</b>。',
         desc: '处于共鸣回路<b class="term-resource">迷雾潜行</b>时，秋水的<b class="term-resource">气动伤害加成</b> +<b class="term-num">25%</b>，效果持续 <b class="term-num">6</b> 秒。' },
    6: { title: '幕后卖家',
         summary: '<b class="term-burst">共鸣解放·雾里观花</b>暴击额外 +<b class="term-num">8%</b>；<b class="term-heavy">重击</b>穿<b class="term-resource">虚实之门</b>额外 +<b class="term-num">50%</b>。',
         desc: '<b class="term-burst">共鸣解放·雾里观花</b>的效果会使暴击额外 +<b class="term-num">8%</b>，秋水的<b class="term-heavy">重击</b>穿过【虚实之门】时，伤害额外 +<b class="term-num">50%</b>。' }
  },
  '炽霞': {
    5: { title: '胜利的枪弹焰火',
         summary: '固有技能<b class="term-resource">加麻加辣</b>满层时，攻击额外 +<b class="term-num">30%</b>。',
         desc: '固有技能<b class="term-resource">加麻加辣</b>叠加至满层时，炽霞攻击额外 +<b class="term-num">30%</b>。' },
    6: { title: '剧终的回归彩蛋',
         summary: '<b class="term-skill">共鸣技能·轰轰</b>触发后，全队<b class="term-normal">普攻伤害加成</b> +<b class="term-num">25%</b>。',
         desc: '触发<b class="term-skill">共鸣技能·轰轰</b>后，队伍中所有角色<b class="term-normal">普攻伤害加成</b> +<b class="term-num">25%</b>，持续 <b class="term-num">15</b> 秒。' }
  },
  '秧秧': {
    5: { title: '绪风于此响彻',
         summary: '<b class="term-burst">共鸣解放·朔风旋涌</b>伤害 +<b class="term-num">85%</b>。',
         desc: '<b class="term-burst">共鸣解放·朔风旋涌</b>的伤害 +<b class="term-num">85%</b>。' },
    6: { title: '致美好以颂歌',
         summary: '施放空中攻击释羽后，全队攻击 +<b class="term-num">20%</b>，持续 <b class="term-num">20</b> 秒。',
         desc: '施放空中攻击释羽后，队伍中所有角色的攻击 +<b class="term-num">20%</b>，效果持续 <b class="term-num">20</b> 秒。' }
  },
  '桃祈': {
    5: { title: '解市井民忧',
         summary: '<b class="term-resource">攻防转换</b>伤害 +<b class="term-num">50%</b>，命中目标回 <b class="term-num">20</b> 共鸣能量。',
         desc: '共鸣回路<b class="term-resource">攻防转换</b>的伤害 +<b class="term-num">50%</b>，<b class="term-resource">攻防转换</b>命中目标时，回复 <b class="term-num">20</b> 点共鸣能量。' },
    6: { title: '护城邦安危',
         summary: '<b class="term-skill">磐岩护壁</b>护盾期间，<b class="term-normal">普攻</b>/<b class="term-heavy">重击</b>伤害 +<b class="term-num">40%</b>。',
         desc: '<b class="term-skill">共鸣技能·磐岩护壁</b>获得的护盾持续期间，桃祈<b class="term-normal">普攻</b>和<b class="term-heavy">重击</b>的伤害 +<b class="term-num">40%</b>。' }
  },
  '渊武': {
    5: { title: '顾一方天地',
         summary: '<b class="term-skill">共鸣技能·雷之楔</b>在场时，<b class="term-burst">共鸣解放伤害加成</b> +<b class="term-num">50%</b>。',
         desc: '<b class="term-skill">共鸣技能·雷之楔</b>在场时，渊武的<b class="term-burst">共鸣解放伤害加成</b> +<b class="term-num">50%</b>。' },
    6: { title: '保八方平安',
         summary: '<b class="term-skill">雷之楔</b>范围内全队防御 +<b class="term-num">32%</b>。',
         desc: '处在<b class="term-skill">共鸣技能·雷之楔</b>范围内的附近队伍中所有角色将持续获得效果：防御 +<b class="term-num">32%</b>，效果持续 <b class="term-num">3</b> 秒。' }
  },
  '釉瑚': {
    5: { title: '万里浅眠',
         summary: '<b class="term-variation">变奏·遂心匣</b>后暴击 +<b class="term-num">15%</b>，持续 <b class="term-num">14</b> 秒。',
         desc: '施放<b class="term-variation">变奏技能·遂心匣</b>时，釉瑚的暴击 +<b class="term-num">15%</b>，持续 <b class="term-num">14</b> 秒。' },
    6: { title: '千秋一枕',
         summary: '<b class="term-skill">共鸣技能·奇珍赏</b>获得 <b class="term-resource">霁青</b>，每层暴击伤害 +<b class="term-num">15%</b>，最多 4 层。',
         desc: '施放<b class="term-skill">共鸣技能·奇珍赏</b>时，获得 <b class="term-num">1</b> 层<b class="term-resource">霁青</b>，最多叠加 <b class="term-num">4</b> 层，持续 <b class="term-num">7</b> 秒，每层<b class="term-resource">霁青</b>使釉瑚的暴击伤害 +<b class="term-num">15%</b>。' }
  },
  '灯灯': {
    5: { title: '快件已顺利签收',
         summary: '<b class="term-resource">光能</b>充满时，<b class="term-skill">强光穿射</b>伤害倍率 +<b class="term-num">100%</b>。',
         desc: '【<b class="term-resource">光能</b>】充满时，<b class="term-skill">强光穿射</b>造成的伤害倍率 +<b class="term-num">100%</b>。' },
    6: { title: '给个五星好评哦',
         summary: '<b class="term-burst">共鸣解放·啾啾专送</b>时，全队攻击 +<b class="term-num">20%</b>，持续 <b class="term-num">20</b> 秒。',
         desc: '施放<b class="term-burst">共鸣解放·啾啾专送</b>时，队伍中所有角色的攻击 +<b class="term-num">20%</b>，持续 <b class="term-num">20</b> 秒。' }
  }
};

// 顺便修一个引号差异：洛可可链 4 标题
d['洛可可'][3].title = '千万"奇藏"于箱中汇聚';

Object.keys(fixes).forEach(name => {
  Object.keys(fixes[name]).forEach(idxStr => {
    const idx = parseInt(idxStr) - 1;
    d[name][idx] = fixes[name][idxStr];
  });
});

fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
console.log('Fixed', Object.keys(fixes).length, 'characters');
