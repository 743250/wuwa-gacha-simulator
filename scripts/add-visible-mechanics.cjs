// scripts/add-visible-mechanics.cjs
// 给剩余形态/派生角色补 normalMech/skillMech/heavyMech/burstMech/forteDesc，使切换条件不只藏在 tooltip 里
const fs = require('fs');
const path = 'src/ui/render.js';
let src = fs.readFileSync(path, 'utf-8');

function replaceInRole(name, replacements) {
  const start = src.indexOf(`'${name}': {`);
  if (start < 0) { console.log('not found', name); return; }
  const rest = src.slice(start);
  const endRel = rest.indexOf('\n  },');
  if (endRel < 0) { console.log('no end', name); return; }
  let block = rest.slice(0, endRel);

  for (const [key, value] of Object.entries(replacements)) {
    if (key === 'forteDesc') {
      const re = /forteDesc: '[^']*'/;
      if (re.test(block)) block = block.replace(re, `forteDesc: '${value.replace(/'/g, "\\'")}'`);
      else block = block.replace(/(forteName: '[^']*',)/, `$1\n    forteDesc: '${value.replace(/'/g, "\\'")}'`);
      continue;
    }
    const line = `${key}: '${value.replace(/'/g, "\\'")}',`;
    const re = new RegExp(`${key}: '[^']*',?`);
    if (re.test(block)) {
      block = block.replace(re, line);
    } else {
      // 插入到 makeSkillLines config 的 normalName 行之后
      block = block.replace(/(normalName:[^\n]*\n)/, `$1      ${line}\n`);
    }
  }

  src = src.slice(0, start) + block + src.slice(start + endRel);
  console.log('patched', name);
}

replaceInRole('珂莱塔', {
  skillMech: '<span style="color:var(--muted)">强化条件：</span>命中带<b class="term-resource">解离</b>/<b class="term-resource">变彩</b>的目标会回复<b class="term-resource">灵萃</b>。灵萃满时，共鸣技能进入<b style="color:var(--gold)">暴力美学</b>强化形态（高倍率冷凝伤害）。',
  heavyMech: '<span style="color:var(--muted)">重击派生：</span><b class="term-heavy">重击·末路见行</b>是珂莱塔的爆发段；4 链时施放后全队共鸣技能 +25%。',
  burstMech: '<span style="color:var(--muted)">控制效果：</span><b class="term-burst">共鸣解放·死兆</b>射击命中附加<b class="term-resource">焕彩</b>，使目标短暂停滞。',
  forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 强化条件</span><br>· 共鸣技能命中带<b class="term-resource">解离</b>/<b class="term-resource">变彩</b>的目标 → 回复<b class="term-resource">灵萃</b><br>· 灵萃满后，下次共鸣技能进入<b style="color:var(--gold)">暴力美学</b>强化形态<br>· <b class="term-heavy">重击·末路见行</b>是主要爆发段（4 链给全队共鸣技能 +25%）<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能挂解离/变彩 → 继续技能回灵萃 → 灵萃满释放暴力美学 → 重击末路见行 → 共鸣解放死兆附加焕彩停滞。'
});

replaceInRole('卡卡罗', {
  burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">共鸣解放·杀戮武装</b>后进入<b class="term-resource">Deathblade</b>形态 <b>2</b> 回合；期间普攻/技能 +50%，结束后自动退出。',
  heavyMech: '<span style="color:var(--muted)">解放形态内：</span><b class="term-heavy">重击·死告</b>是 Deathblade 形态的终结段；6 链会召唤<b class="term-resource">猎杀影</b>协同。',
  forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普攻/技能攒能量<br>· 释放<b class="term-burst">共鸣解放·杀戮武装</b> → 进入<b class="term-resource">Deathblade</b>形态 <b>2</b> 回合<br>· Deathblade 期间：普攻/技能 +50%；重击·死告是爆发终结段；6 链召唤猎杀影协同<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能攒能量 → 满能量开杀戮武装 → 2 回合内普攻/技能输出 → 重击·死告收尾。'
});

replaceInRole('嘉贝莉娜', {
  skillMech: '<span style="color:var(--muted)">资源积累：</span>普攻/技能积攒<b class="term-resource">余火</b>（0-10 点），余火越高暴击伤害越高（1 链）。',
  burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">共鸣解放·永恒位格</b>后进入<b class="term-resource">永恒位格</b>强化状态；6 链时自身伤害 +60%，余火满层热熔加深 +35%。',
  heavyMech: '<span style="color:var(--muted)">爆发段：</span><b class="term-heavy">重击·炼羽裁决</b>是永恒位格期间的主输出。',
  forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普攻/技能积攒<b class="term-resource">余火</b>（0-10）<br>· 释放<b class="term-burst">共鸣解放·永恒位格</b> → 进入永恒位格强化状态<br>· 永恒位格期间：自身伤害提升（6 链 +60%），重击·炼羽裁决主输出；余火越高，热熔加深越高<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻/技能积余火 → 余火接近满层 → 共鸣解放进入永恒位格 → 重击·炼羽裁决爆发。'
});

replaceInRole('凌阳', {
  burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">共鸣解放·狮子奋迅</b>后进入<b class="term-resource">行狮</b>形态；期间普攻/技能获得强化，6 链时技能后下次普攻 +100%。',
  skillMech: '<span style="color:var(--muted)">行狮期间：</span>共鸣技能后下次普攻会获得 6 链强化（若已激活）。',
  forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普通普攻/技能循环<br>· 释放<b class="term-burst">共鸣解放·狮子奋迅</b> → 进入<b class="term-resource">行狮</b>形态<br>· 行狮期间：3 链给普攻 +20% / 技能 +10%；6 链每次技能后下次普攻 +100%<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>变奏入场 → 共鸣解放进入行狮 → 技能 → 强化普攻 → 重复循环。'
});

replaceInRole('鉴心', {
  skillMech: '<span style="color:var(--muted)">派生条件：</span>施放<b class="term-skill">静气循行</b>进入<b class="term-resource">架势</b>，保持 <b>1</b> 回合后下次技能变为<b class="term-skill">行气反击</b>。',
  burstMech: '<span style="color:var(--muted)">重击联动：</span>施放<b class="term-heavy">重击·混元气旋</b>后，4 链会让<b class="term-burst">涤净力场</b>伤害 +80%。',
  forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 派生条件</span><br>· 施放<b class="term-skill">共鸣技能·静气循行</b> → 进入<b class="term-resource">架势</b><br>· 架势保持 <b>1</b> 回合后，再次施放技能 → <b class="term-skill">行气反击</b><br>· 6 链：重击·混元气旋期间可施放特殊行气反击（atk×557% 重击类型）<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能进入架势 → 等 1 回合/或技能派生 → 行气反击 → 重击·混元气旋 → 共鸣解放·涤净力场。'
});

replaceInRole('坎特蕾拉', {
  skillMech: '<span style="color:var(--muted)">资源积累：</span>施放共鸣技能回复 <b>1</b> 点<b class="term-resource">迷离</b>。迷离满后配合解放·陷溺进入<b class="term-resource">蜃境</b>。',
  burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">陷溺</b>给目标附加<b class="term-resource">迷梦</b>，触发<b class="term-resource">惊醒</b>爆发；3 链时释放后直接进入<b class="term-resource">蜃境</b>。',
  forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 共鸣技能每次 +1 <b class="term-resource">迷离</b><br>· 释放<b class="term-burst">共鸣解放·陷溺</b>给目标附加<b class="term-resource">迷梦</b>，后续命中触发<b class="term-resource">惊醒</b><br>· 3 链：释放陷溺后直接进入<b class="term-resource">蜃境</b>；无 3 链时需迷离满才进入<br>· 蜃境期间治疗 +25%（4 链）并强化输出<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能积迷离 → 共鸣解放·陷溺挂迷梦 → 触发惊醒 → 进入蜃境继续输出。'
});

replaceInRole('白芷', {
  skillMech: '<span style="color:var(--muted)">资源消耗：</span>消耗<b class="term-resource">念意</b>治疗队友；满 4 点念意时治疗/冷凝加成更高。',
  burstMech: '<span style="color:var(--muted)">治疗派生：</span>释放<b class="term-burst">刹那合弥</b>触发<b class="term-skill">频隙回响</b>多段治疗。',
  forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 治疗循环</span><br>· <b class="term-resource">念意</b> 0-4：普攻积攒，技能消耗念意治疗队友<br>· 满 4 念意时，共鸣技能治疗更强（2 链：冷凝/治疗 +15%）<br>· 释放<b class="term-burst">共鸣解放·刹那合弥</b> → 触发<b class="term-skill">频隙回响</b>多段治疗<br>· 5 链：白芷存活时可复活一次倒下队友<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻积念意 → 共鸣技能治疗 → 能量满放解放持续回血 → 切主 C 输出。'
});

replaceInRole('秋水', {
  skillMech: '<span style="color:var(--muted)">召唤物：</span>施放共鸣技能召唤<b class="term-resource">雾化分身</b>并生成<b class="term-resource">虚实之门</b>；分身会<b class="term-resource">嘲讽</b>目标。',
  burstMech: '<span style="color:var(--muted)">潜行窗口：</span>释放解放后进入<b class="term-resource">迷雾潜行</b>，期间减伤并获得气动增益（5 链）。',
  forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 机制说明</span><br>· <b class="term-skill">共鸣技能·移位戏法</b>召唤<b class="term-resource">雾化分身</b>，分身嘲讽目标<br>· <b class="term-resource">虚实之门</b>：普攻/重击穿过门时获得额外子弹/伤害<br>· <b class="term-resource">迷雾潜行</b>：释放解放后进入，期间减伤；5 链气动伤害 +25%<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能召分身 + 虚实之门 → 普攻穿门追加子弹 → 共鸣解放进入迷雾潜行 → 重击穿门爆发。'
});

fs.writeFileSync(path, src, 'utf-8');
console.log('done');
