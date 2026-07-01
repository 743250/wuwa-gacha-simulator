// scripts/rewrite-followups.cjs — 重写 render.js 中所有角色的 followUp 文案
// 规则：
//   1. 凡共鸣链效果 → "N 链：xxx" 格式，renderFollowUp 按 chain 过滤
//   2. 基础机制说明（资源积累、形态切换）→ 无前缀，永久显示
//   3. 跟 chains.js 的 CHAIN_BATTLE_EFFECTS 和 seq.js 原文双对齐
//   4. 没"X 秒"，全部用"回合"或不提持续时间

const fs = require('fs');
const path = 'src/ui/render.js';
let src = fs.readFileSync(path, 'utf-8');

// 角色名 → { skillFollowUp, heavyFollowUp, burstFollowUp, varFollowUp（可选）}
// 注意：长离/今汐/椿/折枝/相里要 这些有结构化机制的，保留基础说明 + 共鸣链分开
const rewrites = {
  // 1.1 · 今汐（S）：核心循环说明 + 1/5/6 链
  '今汐': {
    skillFollowUp: '韶光满时强化为<b style="color:var(--gold)">惊龙破空</b>，叠 4 层<b class="term-resource">惊蛰</b>消耗后大幅放大伤害。 1 链：惊龙破空每层惊蛰 +25%（满 4 层 +100%）。 6 链：共鸣技能·惊龙破空倍率 +45%，消耗韶光时再 +45%。',
    burstFollowUp: '消耗全部<b class="term-resource">惊蛰</b>层数 + 韶光，主目标终结伤害。 5 链：解放·移岁诛邪倍率 +120%。'
  },
  // 1.1 · 长离（S）：核心循环 + 1/3/5/6 链
  '长离': {
    skillFollowUp: '+1 层<b class="term-resource">离火</b>（普攻每 3 段也 +1）。 2 链：获得离火时暴击 +25%。',
    heavyFollowUp: '消耗 1 层<b class="term-resource">离火</b>，每层使本次 +50%。 1 链：共鸣技能/重击伤害 +10%。 5 链：重击·焚身以火倍率 +50%。',
    burstFollowUp: '满层<b class="term-resource">离火</b>状态下解放是长离爆发的最高点。 3 链：共鸣解放·离火照丹心 +80%。 6 链：共鸣技能/重击/解放无视 40% 防御。'
  },
  // 1.4 · 椿（S）：核心循环 + 2/3/5/6 链
  '椿': {
    skillFollowUp: '<b class="term-resource">红椿蕊</b>满 100 时<b class="term-skill">共鸣技能</b>替换为<b style="color:var(--gold)">永生花</b>，进入<b class="term-resource">含苞</b>状态（普攻/技能 ×1.5）。 2 链：共鸣回路·一日花伤害倍率 +120%。 6 链：含苞强化倍率 1.5 → 2.5。',
    burstFollowUp: '含苞期间释放，伤害进一步放大。 3 链：解放·芳华绽烬 +50%，含苞期间攻击 +58%。',
    varFollowUp: '1 链：变奏后暴击伤害 +28%。 5 链：变奏倍率 +303%。'
  },
  // 1.2 · 折枝（A）：核心循环 + 4/6 链（1/2/3/5 是被动加成，已经吃进数值，不需重复显示）
  '折枝': {
    skillFollowUp: '6 链：额外召唤 <b>1</b> 只白鹤（共鸣技能伤害 +120%）。',
    burstFollowUp: '召唤 <b>6</b> 只<b class="term-resource">墨鹤</b>持续协同，是折枝后台输出的核心。 2 链：墨鹤上限 +6 → 12 只。 4 链：解放时全队攻击 +20%。 5 链：协同墨鹤额外 +40% 伤害。'
  },
  // 1.2 · 相里要（A）：核心循环 + 5/6 链
  '相里要': {
    skillFollowUp: '<b class="term-resource">邃古遗墟</b>可用时，每次共鸣技能消耗 1 次伤害 +63%（最多 5 次）。 1 链：额外 6 个衍构模体（伤害 +48%）。 6 链：幻方强化共鸣技能 +76%。',
    burstFollowUp: '释放后获得 <b>5</b> 次<b class="term-resource">邃古遗墟</b>叠层。 4 链：解放时全队共鸣解放 +25%。 5 链：解放·思维矩阵倍率 +100%。'
  },
  // 2.0 · 珂莱塔（S）：核心循环 + 1/4/6 链
  '珂莱塔': {
    skillFollowUp: '<b class="term-resource">灵萃</b>满时强化为<b style="color:var(--gold)">暴力美学</b>。 3 链：共鸣技能·示我璀璨 +93%。',
    heavyFollowUp: '5 链：重击·末路见行 +47%。 4 链：施放重击时全队<b class="term-skill">共鸣技能</b>伤害 +25%。',
    burstFollowUp: '射击命中附加<b class="term-resource">焕彩</b>停滞效果。 1 链：对解离目标暴击 +12.5%。 2 链：解放·致死以终 +126%。 6 链：死兆射击 + 晶体翻倍 = 解放 +186.6%。'
  },
  // 2.0 · 洛可可（B）：核心循环 + 2 链
  '洛可可': {
    skillFollowUp: '回复 100 想象力 + 10 协奏；普攻幻想照进现实免疫打断。 4 链：共鸣技能后普攻幻想照进现实 +60%。',
    burstFollowUp: '开场强化普攻 + 重击。 2 链：普攻每层给全队湮灭 +10%（满 3 层 +40%）。 3 链：变奏后暴击/暴伤 +10%/+30%。 5 链：解放开场 +20%，重击 +80%。 6 链：解放期间普攻无视 60% 防御。'
  },
  // 2.1 · 菲比（S）：核心循环 + 1/2/3 链
  '菲比': {
    skillFollowUp: '召唤<b class="term-resource">镜之环</b>对范围内目标附加<b class="term-resource">光噪效应</b>。 6 链：召唤镜之环时攻击 +10%。',
    heavyFollowUp: '消耗<b class="term-resource">福音</b>。 2 链：赦罪状态下延奏对光噪目标 +120%。 3 链：重击·星辉 +91%。',
    burstFollowUp: '赦罪 / 告解双形态切换。 1 链：赦罪状态解放倍率从 255% → 480%。 5 链：自身衍射伤害 +12%。'
  },
  // 2.4 · 卡提希娅（SS）：核心循环 + 1/2/3/4 链
  '卡提希娅': {
    skillFollowUp: '给目标附加<b class="term-resource">气动侵蚀</b>（受气动伤害 +15%）。',
    heavyFollowUp: '空中攻击是核心爆发段。 1 链：决意 4 层 × 25% = 暴击伤害 +100%。 2 链：普攻/重击/闪反/变奏倍率 +50%。',
    burstFollowUp: '进入强化形态扩散输出。 3 链：看潮怒风哮之刃 +100%。 4 链：附加属性效应时全队伤害 +20%。 6 链：芙露德莉斯受伤增伤 +40%。'
  },
  // 2.7 · 嘉贝莉娜（SS）：核心循环 + 1/3/5/6 链
  '嘉贝莉娜': {
    skillFollowUp: '积<b class="term-resource">余火</b>。 1 链：余火 10 点 × 8% = 暴击伤害 +80%。 5 链：共鸣技能伤害 +150%。',
    heavyFollowUp: '炼羽裁决是嘉贝主输出段。 2 链：内燃烧攻击 +150%。',
    burstFollowUp: '进入<b class="term-resource">永恒位格</b>，自身全面增益。 3 链：共鸣解放 +130%。 4 链：声骸后全队伤害 +20%。 6 链：永恒位格自身伤害 +60%，余火满层热熔加深 +35%。'
  },
  // 常驻 · 卡卡罗（A）：核心循环 + 1/3/6 链
  '卡卡罗': {
    skillFollowUp: '1 链：共鸣技能命中额外回 10 能量。 2 链：变奏后共鸣技能 +30%。',
    heavyFollowUp: '6 链：召唤 2 个猎杀影协同攻击。',
    burstFollowUp: '进入 <b style="color:var(--gold)">Deathblade</b> 形态：普攻/技能 +50%（持续 2 回合）。 3 链：解放期间导电 +25%。 4 链：延奏后全队导电 +20%。 5 链：变奏伤害 +50%。'
  },
  // 2.1 · 布兰特（S）：核心循环 + 1/2/3/5 链
  '布兰特': {
    skillFollowUp: '空中攻击是布兰特核心。 1 链：变奏/空中攻击 +20%，叠 3 层（满 +60%）。 6 链：空中攻击倍率 +30%。',
    burstFollowUp: '给全队上护盾。 2 链：空中攻击/火焰归亡曲暴击 +30%。 3 链：火焰归亡曲伤害 +42%。 4 链：护盾 +20% + 治疗全队。 5 链：普攻伤害 +15%。 6 链：解放后再燃 +30%。'
  },
  // 2.2 · 坎特蕾拉（S）：核心循环 + 1/2/3/4/6 链
  '坎特蕾拉': {
    skillFollowUp: '回 1 点<b class="term-resource">迷离</b>。 1 链：共鸣技能 +50%。',
    burstFollowUp: '附加<b class="term-resource">迷梦</b>状态，触发<b class="term-resource">惊醒</b>。 2 链：惊醒伤害倍率 +245%。 3 链：解放·陷溺 +370% + 直接进入蜃境。 4 链：蜃境治疗加成 +25%。 6 链：解放期间无视 30% 防御。'
  },

  // 常驻 5★
  '维里奈': {
    skillFollowUp: '回 <b class="term-resource">光合能量</b>。 2 链：技能额外回 1 光合 + 10 协奏。',
    burstFollowUp: '<b class="term-burst">解放</b>给全队挂<b class="term-resource">光合标记</b>（持续治疗）。 3 链：光合标记治疗加成 +12%。 4 链：重击/解放/延奏后全队衍射 +15%。 5 链：治疗低 HP 角色时治疗 +20%。 6 链：重击·星星花绽放 +20% + 协同攻击。'
  },
  '安可': {
    skillFollowUp: '1 链：普攻命中给自身热熔 +3%/层（最多 4 层）。 2 链：普攻/共鸣技能额外回 10 能量。 5 链：共鸣技能伤害加成 +35%。',
    heavyFollowUp: '3 链：白咩/黑咩重击 +40%。 4 链：重击·黑咩后全队热熔 +20%。',
    burstFollowUp: '6 链：解放·黑咩大暴走期间每段伤害叠 1 层<b class="term-resource">迷失羔羊</b>（攻击 +5%，最多 5 层）。'
  },
  '凌阳': {
    skillFollowUp: '6 链：行狮状态下，共鸣技能后下次普攻 +100%。',
    burstFollowUp: '开启<b style="color:var(--gold)">行狮形态</b>。 2 链：变奏额外回 10 能量。 3 链：解放期间普攻 +20% / 技能 +10%。 4 链：延奏给全队冷凝 +20%。 5 链：解放额外 atk × 200% 冷凝伤害。'
  },
  '鉴心': {
    skillFollowUp: '进入<b class="term-resource">架势</b>。 2 链：使用次数 +1。 3 链：架势保持后可打出<b class="term-skill">行气反击</b>。',
    burstFollowUp: '<b class="term-burst">涤净力场</b>清场。 4 链：重击·混元气旋时解放 +80%。 5 链：解放额外回 20 能量。 6 链：气动伤害 +20%。'
  },

  // 4★
  '莫特斐': {
    skillFollowUp: '4 链：技能命中后全队热熔 +12%。',
    burstFollowUp: '<b class="term-burst">浮翼狂想</b>协同窗口：主 C 用技能时莫特斐补刀。 1 链：解放期间共鸣技能触发协同。 2 链：声骸后额外回 10 能量。 3 链：加强音暴伤 +30%。 4 链：解放时长 +7 秒。 5 链：共鸣技能命中触发协同。 6 链：解放·暴烈终曲时全队攻击 +20%。'
  },
  '散华': {
    skillFollowUp: '1 链：第 5 段普攻后暴击 +15%。',
    heavyFollowUp: '4 链：解放后下次重击·爆裂 +120%。 6 链：重击·爆裂倍率 +50%。',
    burstFollowUp: '消耗<b class="term-resource">冰绽</b>。 4 链：解放回 10 能量。 5 链：冰绽暴击伤害 +100%，冰棘/冰棱/冰川消失时直接爆炸。 6 链：引爆冰棱/冰川后全队攻击 +10%×2 层。'
  },
  '卜灵': {
    skillFollowUp: '<b class="term-resource">五雷荡煞阵</b>给团队电磁 debuff + 治疗。 5 链：荡煞阵生成时附加 6 层电磁效应。',
    burstFollowUp: '<b class="term-burst">飞雷诀</b>清场。 1 链：解放暴击 +20%。 2 链：阴阳相生回 25 能量。 3 链：荡煞阵期间全队 HP <50% 时治疗。 4 链：治疗加成 +20%。 6 链：雷法·三才合一时全队共鸣技能 +50%。'
  },
  '丹瑾': {
    skillFollowUp: '给目标附加<b class="term-resource">朱蚀之刻</b>。 1 链：攻击带朱蚀目标 +5%/层（满 6 层 +30%）。 2 链：攻击带朱蚀目标伤害 +20%。',
    burstFollowUp: '3 链：共鸣解放伤害加成 +30%。 4 链：彤华 ≥ 60 时暴击 +15%。 5 链：湮灭伤害 +15%。 6 链：重击·缭乱后全队攻击 +20%。'
  },
  '白芷': {
    skillFollowUp: '消耗<b class="term-resource">念意</b>给自身回能量。 1 链：每念意回 2.5 能量。 2 链：满念意时冷凝/治疗 +15%。',
    burstFollowUp: '<b class="term-burst">刹那合弥</b>触发频隙回响。 3 链：变奏后生命上限 +12%。 4 链：频隙回响 +2 段 + 治疗 +20%。 5 链：复活倒下队友（每场战斗 1 次）。 6 链：拾取天籁时全队冷凝 +12%。'
  },
  '秋水': {
    skillFollowUp: '生成<b class="term-resource">雾化分身</b>嘲讽敌人。 1 链：技能冷却 -1 回合。 2 链：攻击被嘲讽目标时攻击 +15%。 3 链：穿虚实之门额外生成 2 颗子弹。 4 链：共鸣技能·雾化子弹 +30%。',
    burstFollowUp: '5 链：迷雾潜行时气动 +25%。 6 链：解放暴击 +8%；重击穿虚实之门 +50%。'
  },
  '炽霞': {
    skillFollowUp: '1 链：共鸣技能·轰轰必定暴击。 6 链：触发技能·轰轰后全队普攻 +25%。',
    burstFollowUp: '<b class="term-resource">热压弹</b> 60 发持续输出。 2 链：解放期间击败目标回 5 能量。 3 链：解放对低 HP 目标 +40%。 4 链：获 60 弹 + 重置技能 CD。 5 链：加麻加辣满层时攻击 +30%。'
  },
  '秧秧': {
    skillFollowUp: '<b class="term-skill">风场鸣声</b>牵引敌人。 3 链：共鸣技能 +40%。',
    heavyFollowUp: '空中释羽是核心输出段。 4 链：空中释羽 +95%。',
    burstFollowUp: '1 链：变奏后气动 +15%。 2 链：重击命中回 10 能量。 5 链：解放·朔风旋涌 +85%。 6 链：空中释羽后全队攻击 +20%。'
  },
  '桃祈': {
    skillFollowUp: '<b class="term-skill">磐岩护壁</b>给全队护盾。 3 链：磐岩护壁持续延长。 6 链：磐岩护壁期间普攻/重击 +40%。',
    burstFollowUp: '<b class="term-burst">不动如山</b>反击爆发。 1 链：护盾量 +40%。 2 链：解放暴击/暴伤 +20%。 4 链：重击发后制人触发时回血 + 防御 +50%。 5 链：攻防转换命中回 20 能量。'
  },
  '渊武': {
    skillFollowUp: '<b class="term-skill">雷之楔</b>召唤协同武器。 3 链：雷之楔命中按 20% 防御加伤。',
    burstFollowUp: '<b class="term-burst">寂土重明</b>给全队护盾。 1 链：雷厉风行状态攻速 +20%。 2 链：变奏·轰雷回 15 能量。 5 链：雷之楔在场时解放 +50%。 6 链：雷之楔范围内全队防御 +32%。'
  },
  '釉瑚': {
    skillFollowUp: '靠<b class="term-resource">诗中物</b>对偶/联珠/合说叠层。 1 链：技能·问祯有 10% 概率免伤。 2 链：对偶/联珠对诗中物效果二次触发。 4 链：20% 概率技能不进 CD。',
    burstFollowUp: '<b class="term-burst">诗中物·终幕</b>清场。 3 链：攻击 +20%。 5 链：变奏·遂心匣后暴击 +15%。 6 链：奇珍赏获霁青 4 层（暴击伤害 +60%）。'
  },
  '灯灯': {
    skillFollowUp: '<b class="term-skill">强化·前扑/后撤</b>无视防御。 1 链：强化·后撤回耐力。 2 链：强化·前扑/后撤无视 20% 防御。 5 链：光能满时强光穿射倍率 +100%。',
    burstFollowUp: '3 链：共鸣解放·啾啾专送 +30%。 4 链：普攻伤害加成 +30%。 6 链：解放时全队攻击 +20%。'
  }
};

// 把每个角色的 customLines: makeSkillLines({...}) 块里的 followUp 字段替换
let updated = 0;
Object.keys(rewrites).forEach(name => {
  const cfg = rewrites[name];

  // 找到该角色的 customLines: makeSkillLines({ ... }), 然后只在这段范围替换 followUp
  // 简化做法：定位 `'<name>': {` ... 下一个 `},` 之间的范围
  const startRe = new RegExp("'" + name + "': \\{");
  const sm = src.match(startRe);
  if (!sm) { console.log('? ' + name + ' not found'); return; }
  const startIdx = sm.index;
  // 找到下一个 `\n  },` 闭合
  const tail = src.slice(startIdx);
  // 找闭合：第一个出现的"\n  },\n"
  const closeMatch = tail.match(/\n  \},/);
  if (!closeMatch) { console.log('? ' + name + ' no close'); return; }
  const endIdx = startIdx + closeMatch.index;
  let block = src.slice(startIdx, endIdx);

  let blockChanged = false;
  ['skillFollowUp', 'heavyFollowUp', 'burstFollowUp', 'varFollowUp'].forEach(key => {
    if (cfg[key] == null) return;
    // 把 key: 'xxx', 改成 key: '新内容',
    const re = new RegExp("(" + key + ": ')([^']*)(',?)");
    if (re.test(block)) {
      block = block.replace(re, (m, p1, _old, p3) => p1 + cfg[key].replace(/'/g, "\\'") + p3);
      blockChanged = true;
    } else {
      // 不存在该字段 → 插入到 makeSkillLines({ 块尾巴前
      // 找 `\n    })` 闭合
      const insertRe = /(\s+)\}\)\,\n/;
      block = block.replace(insertRe, (m, indent) => {
        return indent + key + ": '" + cfg[key].replace(/'/g, "\\'") + "',\n" + m.slice(indent.length);
      });
      blockChanged = true;
    }
  });

  if (blockChanged) {
    src = src.slice(0, startIdx) + block + src.slice(endIdx);
    updated++;
    console.log('✅ ' + name);
  } else {
    console.log('— ' + name + ' no change');
  }
});

fs.writeFileSync(path, src, 'utf-8');
console.log('Updated', updated, '/', Object.keys(rewrites).length);
