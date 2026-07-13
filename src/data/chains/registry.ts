// 共鸣链 ChainDef 注册表 · Phase 3
// 数据源:原 chainEffects.js(战斗 effect)+ seq.js(玩家文案),已合并到此
// 本文件是手维源(chainEffects/seq 已删,codemod 已退役)
// 50 个角色 × 6 链
import type { CharacterChains } from './types';

export const REGISTRY: Record<string, CharacterChains> = {
  // 忌炎 共鸣链文案 — 实装文案,机制依据 src/battle/characters/jiyan.js(锐意之势状态机)
  "忌炎": {
    character: "忌炎",
    chains: [
    {
      index: 1,
      effect: {"effect":"jiyanSkillChargeFaster"},
      text: { name: "济世", desc: "<b class=\"term-skill\">共鸣技能·枪扫风定</b>的冷却时间从 <b class=\"term-num\">3</b> 回合缩短为 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 2,
      effect: {"effect":"jiyanTongBian","forteGain":30,"atkUp":0.28,"dur":2},
      text: { name: "通变", desc: "忌炎变奏入场时，<b class=\"term-resource\">破阵值</b> +<b class=\"term-num\">30</b>，自身攻击 +<b class=\"term-num\">28%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 3,
      effect: {"effect":"jiyanGuanShi","crate":0.16,"cdmg":0.32,"dur":2},
      text: { name: "观势", desc: "忌炎施放<b class=\"term-skill\">共鸣技能</b>、<b class=\"term-heavy\">重击</b>、<b class=\"term-burst\">共鸣解放</b>或<b class=\"term-variation\">变奏</b>时，自身暴击 +<b class=\"term-num\">16%</b>、暴击伤害 +<b class=\"term-num\">32%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 4,
      effect: {"effect":"jiyanQiZheng","value":0.25,"dur":2},
      text: { name: "奇正", desc: "忌炎施放<b class=\"term-burst\">共鸣解放</b>后，全队所有存活角色<b class=\"term-heavy\">重击</b>伤害 +<b class=\"term-num\">25%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"jiyanMingDuan","value":0.45,"dur":2},
      text: { name: "明断", desc: "忌炎变奏入场时，自身攻击 +<b class=\"term-num\">45%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 6,
      effect: {"effect":"jiyanRuiyiUpgrade","cap":3,"perStack":1.2},
      text: { name: "移山", desc: "<b class=\"term-resource\">锐意之势</b>上限由 <b class=\"term-num\">2</b> 层提升至 <b class=\"term-num\">3</b> 层；每层锐意提供的<b class=\"term-burst\">共鸣解放</b>伤害倍率加成由 +<b class=\"term-num\">100%</b> 提升至 +<b class=\"term-num\">120%</b>。" },
    }
    ],
  },
  // 吟霖 共鸣链文案 — 实装文案,机制依据 src/battle/characters/yinlin.js(审判值/审判印记状态机)
  "吟霖": {
    character: "吟霖",
    chains: [
    {
      index: 1,
      effect: {"effect":"yinlinMarkSkillBonus","value":0.7},
      text: { name: "矛盾的抉择", desc: "吟霖的<b class=\"term-skill\">共鸣技能</b>与<b class=\"term-burst\">共鸣解放</b>命中带有<b class=\"term-resource\">审判印记</b>的目标时，伤害 +<b class=\"term-num\">70%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"yinlinMarkRefund","verdict":5,"energy":5},
      text: { name: "牵绊的俘虏", desc: "吟霖命中带有<b class=\"term-resource\">审判印记</b>的目标时，额外回复 <b class=\"term-num\">5</b> 点<b class=\"term-resource\">审判值</b>和 <b class=\"term-num\">5</b> 点共鸣能量。" },
    },
    {
      index: 3,
      effect: {"effect":"yinlinMarkVuln","value":0.1},
      text: { name: "无情的断罪", desc: "带有<b class=\"term-resource\">审判印记</b>的目标每层印记使受到的伤害额外 +<b class=\"term-num\">10%</b>（全队全伤害类型生效）。" },
    },
    {
      index: 4,
      effect: {"effect":"yinlinJudgmentTeamAtk","value":0.15,"dur":2},
      text: { name: "前行的鼓舞", desc: "<b class=\"term-resource\">审判之雷</b>触发时，全队所有存活角色攻击 +<b class=\"term-num\">15%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"yinlinMarkBurstBonus","value":0.5},
      text: { name: "决意的回响", desc: "吟霖<b class=\"term-burst\">共鸣解放</b>命中带有<b class=\"term-resource\">审判印记</b>的目标时，伤害额外 +<b class=\"term-num\">50%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"yinlinJiTing","value":0.7,"dur":2},
      text: { name: "正义的践行", desc: "施放<b class=\"term-burst\">共鸣解放</b>后 <b class=\"term-num\">2</b> 回合内，吟霖<b class=\"term-normal\">普攻</b>命中带<b class=\"term-resource\">审判印记</b>的目标时额外触发一次<b class=\"term-skill\">疾霆昭彰</b>，造成攻击 <b class=\"term-num\">70%</b> 的导电伤害，每回合最多触发 <b class=\"term-num\">1</b> 次。" },
    }
    ],
  },
  // 今汐 共鸣链文案 — 实装文案,机制依据 src/battle/characters/jinhsi.js(韶光/谪仙)
  "今汐": {
    character: "今汐",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillDmg","value":0.8,"label":"共鸣技能伤害 +80%"},
      text: { name: "沉海洄天溯", desc: "今汐<b class=\"term-skill\">共鸣技能·惊龙破空</b>伤害 +<b class=\"term-num\">80%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"atk","value":0.05,"label":"攻击 +5%"},
      text: { name: "绒雪凝屏息", desc: "今汐攻击 +<b class=\"term-num\">5%</b>。" },
    },
    {
      index: 3,
      // 谪仙由 jinhsiSwitchIn 挂 atkUp；勿写 flat atk 常驻双算
      effect: {"effect":"jinhsiZheXian","value":0.5,"label":"变奏入场谪仙攻击 +50%"},
      text: { name: "天定神子身", desc: "今汐<b class=\"term-variation\">变奏入场</b>后获得 <b class=\"term-num\">1</b> 层<b class=\"term-resource\">谪仙</b>，每层攻击 +<b class=\"term-num\">25%</b>，可叠 <b class=\"term-num\">2</b> 层；满层时攻击共 +<b class=\"term-num\">50%</b>。" },
    },
    {
      index: 4,
      // 惊龙/解放后全队 allDmgUp 由 jinhsi onSkill/onBurst；勿写 teamAllDmg 常驻
      effect: {"effect":"jinhsiTeamAllDmg","value":0.2,"label":"惊龙破空或解放后全队全伤害 +20%·2 回合"},
      text: { name: "自甘佑凡尘", desc: "今汐施放<b class=\"term-skill\">共鸣技能·惊龙破空</b>或<b class=\"term-burst\">共鸣解放·移岁诛邪</b>后，全队所有存活角色全属性伤害 +<b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":1.2,"label":"共鸣解放伤害 +120%"},
      text: { name: "流光化霜雪", desc: "今汐<b class=\"term-burst\">共鸣解放·移岁诛邪</b>伤害 +<b class=\"term-num\">120%</b>。" },
    },
    {
      index: 6,
      // 惊龙破空倍率由 FORTE_BOOST +0.4→×2.2；勿再写 skillDmg 常驻双算
      effect: {"effect":"jinhsiC6Forte","value":0.4,"label":"惊龙破空倍率额外 +0.4（FORTE_BOOST）"},
      text: { name: "寒尽又逢春", desc: "今汐<b class=\"term-skill\">共鸣技能·惊龙破空</b>伤害 +<b class=\"term-num\">45%</b>。" },
    }
    ],
  },
  // 长离 共鸣链文案 — 实装文案,机制依据 src/battle/characters/changli.js(离火/心眼状态机)
  "长离": {
    character: "长离",
    chains: [
    {
      index: 1,
      // battleStart 写 skillBonus/heavyBonus；勿写 allDmg 常驻（会双算普攻/解放）
      effect: {"effect":"changliC1SkillHeavy","value":0.1,"label":"共鸣技能与重击伤害 +10%"},
      text: { name: "隐我所思", desc: "施放<b class=\"term-skill\">共鸣技能·赫羽三相</b>或<b class=\"term-heavy\">重击·焚身以火</b>时，造成的伤害提升 <b class=\"term-num\">10%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"crate","value":0.25,"label":"持有离火时暴击 +25%"},
      text: { name: "循我所望", desc: "持有<b class=\"term-resource\">离火</b>时，暴击提升 <b class=\"term-num\">25%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":0.8,"label":"共鸣解放伤害 +80%"},
      text: { name: "据我所闻", desc: "<b class=\"term-burst\">共鸣解放·离火照丹心</b>造成的伤害提升 <b class=\"term-num\">80%</b>。" },
    },
    {
      index: 4,
      // switchIn 全队 atkUp 2 回合；勿写 teamAtk 常驻光环
      effect: {"effect":"changliC4SwitchAtk","value":0.2,"label":"变奏后全队攻击 +20%（2 回合）"},
      text: { name: "饰我所言", desc: "施放<b class=\"term-variation\">变奏技能</b>后，队伍中的角色攻击提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"heavyDmg","value":1,"label":"重击伤害 +100%"},
      text: { name: "舍我所得", desc: "<b class=\"term-heavy\">重击·焚身以火</b>造成的伤害提升 <b class=\"term-num\">100%</b>。" },
    },
    {
      index: 6,
      // extraPierce hook 仅 skill/heavy/burst；勿写 flat defPierce 常驻
      effect: {"effect":"changliC6Pierce","value":0.4,"label":"共鸣技能/重击/共鸣解放无视 40% 防御"},
      text: { name: "成我所谋", desc: "<b class=\"term-skill\">共鸣技能</b>、<b class=\"term-heavy\">重击</b>与<b class=\"term-burst\">共鸣解放</b>造成伤害时，额外忽视目标 <b class=\"term-num\">40%</b> 防御。" },
    }
    ],
  },
  // 椿 共鸣链文案 — 实装文案,机制依据 src/battle/characters/camellia.js(红椿·蕊/永生花/含苞酣梦状态机)
  "椿": {
    character: "椿",
    chains: [
    {
      index: 1,
      effect: {"effect":"chunC1Cdmg","value":0.28,"label":"变奏后暴伤 +28%"},
      text: { name: "在无人知晓的秘密小径", desc: "椿<b class=\"term-variation\">变奏入场</b>后，暴击伤害 +<b class=\"term-num\">28%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"chunC2Yongsheng","value":1.2,"label":"永生花倍率 +120%"},
      text: { name: "呼唤那沉默之花的芬芳", desc: "<b class=\"term-skill\">永生花</b>伤害倍率 +<b class=\"term-num\">120%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"chunC3Hanbao","value":0.5,"label":"含苞期间攻击 +58% / 解放 +50%"},
      text: { name: "一根荆棘胜过千颗花种", desc: "处于<b class=\"term-resource\">含苞·酣梦</b>状态期间，椿攻击 +<b class=\"term-num\">58%</b>，<b class=\"term-burst\">共鸣解放·芳华绽烬</b>伤害 +<b class=\"term-num\">50%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"chunC4TeamNormal","value":0.25,"label":"变奏后全队普攻 +25%·2回合"},
      text: { name: "它的根茎持续到永恒中", desc: "椿<b class=\"term-variation\">变奏入场</b>后，全队所有存活角色<b class=\"term-normal\">普攻</b>伤害 +<b class=\"term-num\">25%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"variationDmg","value":3.03,"label":"变奏倍率 +303%"},
      text: { name: "将那无限置于你的手掌", desc: "椿的<b class=\"term-variation\">变奏技能·八千春秋</b>伤害倍率 +<b class=\"term-num\">303%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"chunC6Refresh","value":2.5,"label":"含苞续窗永生花·酣梦×2.5"},
      text: { name: "为你的千千万万次盛放", desc: "处于<b class=\"term-resource\">含苞·酣梦</b>状态下双资源再次充满时，<b class=\"term-skill\">共鸣技能</b>替换为<b class=\"term-skill\">永生花</b>（每场战斗仅 <b class=\"term-num\">1</b> 次）：消耗 <b class=\"term-num\">50</b> <b class=\"term-resource\">红椿·蕊</b> 与 <b class=\"term-num\">50</b> 协奏，造成攻击 <b class=\"term-num\">250%</b> 的湮灭伤害，重置 <b class=\"term-num\">3</b> 回合含苞并将酣梦倍率加成提升至 ×<b class=\"term-num\">2.5</b>。" },
    }
    ],
  },
  // 珂莱塔 共鸣链文案 — 实装文案,机制依据 src/battle/characters/carlotta.js(晶体层数/解离/死兆)
  "珂莱塔": {
    character: "珂莱塔",
    chains: [
    {
      index: 1,
      // 对解离/变彩目标暴击由 carlottaCrateBonus；勿写常驻 crate
      effect: {"effect":"carlottaCrateVsDebuff","value":0.125,"label":"对解离目标暴击 +12.5%"},
      text: { name: "美或死，璀璨即凋零", desc: "珂莱塔攻击带有<b class=\"term-resource\">解离</b>效果的目标时，该次伤害暴击 +<b class=\"term-num\">12.5%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"burstDmg","value":1.26,"label":"共鸣解放伤害 +126%"},
      text: { name: "寂与亡，衰败亦新生", desc: "珂莱塔<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">126%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.93,"label":"共鸣技能伤害 +93%"},
      text: { name: "切步、向前，此为优雅的进行式", desc: "珂莱塔<b class=\"term-skill\">共鸣技能·暴力美学</b>与<b class=\"term-skill\">共鸣技能·示我璀璨</b>的伤害 +<b class=\"term-num\">93%</b>。" },
    },
    {
      index: 4,
      // 重击后全队 skillDmgUp 由 carlotta onHeavy；勿写 teamSkillDmg 常驻
      effect: {"effect":"carlottaTeamSkillAfterHeavy","value":0.25,"label":"重击后全队共鸣技能伤害 +25%·2 回合"},
      text: { name: "以旧雨，为颂赞的苦酒", desc: "珂莱塔施放<b class=\"term-heavy\">重击·末路见行</b>后，全队所有存活角色<b class=\"term-skill\">共鸣技能</b>伤害 +<b class=\"term-num\">25%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"heavyDmg","value":0.47,"label":"末路见行（重击）伤害 +47%"},
      text: { name: "敬昨夜、今日和彼时彼刻", desc: "珂莱塔<b class=\"term-heavy\">重击·末路见行</b>伤害 +<b class=\"term-num\">47%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"burstDmg","value":1.866,"label":"死兆伤害 +186.6%"},
      text: { name: "我依然故我，于终幕之上", desc: "珂莱塔<b class=\"term-burst\">共鸣解放·死兆</b>伤害提升 <b class=\"term-num\">186.6%</b>。" },
    }
    ],
  },
  "菲比": {
    character: "菲比",
    chains: [
    {
      index: 1,
      effect: {"effect":"burstDmg","value":2.25,"label":"解放伤害 +225%"},
      text: { name: "暖灯与枕边的祝愿", desc: "赦罪状态下，<b class=\"term-burst\">共鸣解放·启明之誓愿</b>伤害大幅提升。告解状态下，<b class=\"term-burst\">共鸣解放</b>命中目标时附加<b class=\"term-resource\">光噪效应</b>层数提升至目标可附加层数的上限。" },
    },
    {
      index: 2,
      effect: {"effect":"allDmg","value":1.2,"label":"对光噪目标全伤害 +120%"},
      text: { name: "泪水中飘摇的孤船", desc: "菲比的所有伤害类型对拥有<b class=\"term-resource\">光噪效应</b>的目标造成全伤害加深 <b class=\"term-num\">120%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"heavyDmg","value":0.91,"label":"重击星辉伤害 +91%"},
      text: { name: "雏菊编织花环与梦", desc: "赦罪状态下，<b class=\"term-heavy\">重击·星辉</b>伤害倍率提升 <b class=\"term-num\">91%</b>。告解状态下，<b class=\"term-heavy\">重击·星辉</b>伤害倍率提升 <b class=\"term-num\">249%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamElemDmg","value":0.1,"element":"衍射","label":"全队衍射伤害 +10%"},
      text: { name: "再次敲响振翅的钟声", desc: "<b class=\"term-normal\">普攻</b>、<b class=\"term-normal\">夏弥尔之星</b>、闪避反击、<b class=\"term-normal\">夏弥尔之星·闪避反击</b>命中目标时，全队衍射伤害加成提升 <b class=\"term-num\">10%</b>，持续 <b class=\"term-num\">4</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"elemDmg","value":0.12,"element":"衍射","label":"自身衍射伤害 +12%"},
      text: { name: "向遥远光辉虔声祈祷", desc: "施放<b class=\"term-variation\">变奏技能·金色恩典</b>时，菲比自身衍射伤害加成提升 <b class=\"term-num\">12%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 6,
      effect: {"effect":"atk","value":0.1,"label":"镜之环召唤时攻击 +10%"},
      text: { name: "于静寂窗边啁啾歌唱", desc: "赦罪状态或告解状态下，施放<b class=\"term-skill\">共鸣技能·镜之环</b>时，菲比攻击提升 <b class=\"term-num\">10%</b>。" },
    }
    ],
  },
  "卡提希娅": {
    character: "卡提希娅",
    chains: [
    {
      index: 1,
      effect: {"effect":"cartethyiaErosionOnBreak","label":"击破韧性时主目标 +1 层风蚀"},
      text: { name: "因命运戴上冠冕", desc: "卡提希娅击破敌人韧性时，给该敌人附加 <b class=\"term-num\">1</b> 层<b class=\"term-resource\">风蚀效应</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"cartethyiaErosionOnSwitchIn","label":"变奏上场时主目标 +1 层风蚀"},
      text: { name: "听风潮斩断利刃", desc: "卡提希娅<b class=\"term-variation\">变奏</b>上场时，给当前目标附加 <b class=\"term-num\">1</b> 层<b class=\"term-resource\">风蚀效应</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"cartethyiaBurstHpBonus","value":0.6,"label":"看潮怒风哮之刃倍率 +60% 最大生命"},
      text: { name: "以自身束悬高塔", desc: "<b class=\"term-burst\">看潮怒风哮之刃</b>造成伤害时，额外附加自身最大生命值 <b class=\"term-num\">60%</b> 的伤害。" },
    },
    {
      index: 4,
      effect: {"effect":"cartethyiaErosionTeamBuff","value":0.2,"dur":2,"label":"附加风蚀时全队元素伤害 +20%/2 回合（不叠加）"},
      text: { name: "为拯救舍弃其身", desc: "卡提希娅为敌人附加<b class=\"term-resource\">风蚀效应</b>时，全队元素伤害提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"cartethyiaLethalShield","value":0.2,"dur":2,"label":"致命伤不倒 + 20% 生命护盾 / 2 回合（每场 1 次）"},
      text: { name: "将烈风重塑希望", desc: "受到致命伤害时不会倒下，改为锁定 <b class=\"term-num\">1</b> 点生命并获得 <b class=\"term-num\">20%</b> 最大生命的护盾，持续 <b class=\"term-num\">2</b> 回合（每场战斗仅 <b class=\"term-num\">1</b> 次）。" },
    },
    {
      index: 6,
      effect: {"effect":"cartethyiaBurst2DoubleErosion","label":"第二次解放：风蚀层数翻倍 + 立即结算 1 次 + 不清空"},
      text: { name: "尽一线挣扎自由", desc: "芙露德莉斯释放<b class=\"term-burst\">看潮怒风哮之刃</b>时，主目标的<b class=\"term-resource\">风蚀效应</b>层数翻倍，并立即触发一次风蚀伤害，且此次解放不会清空风蚀效应层数。" },
    }
    ],
  },
  "嘉贝莉娜": {
    character: "嘉贝莉娜",
    chains: [
    {
      index: 1,
      effect: {"effect":"cdmg","value":0.8,"label":"暴击伤害 +80%"},
      text: { name: "不熄抵牾抗争之心", desc: "嘉贝莉娜暴击伤害提升 <b class=\"term-num\">80%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"atk","value":1.5,"label":"攻击 +150%"},
      text: { name: "行过烈狱与幽暗冥途", desc: "嘉贝莉娜攻击提升 <b class=\"term-num\">150%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":1.3,"label":"共鸣解放伤害 +130%"},
      text: { name: "再燃血狩死猎之誓", desc: "嘉贝莉娜<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">130%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"gaberinaC4TeamAllDmg","value":0.2,"label":"解放后全队全伤害 +20%·3回合"},
      text: { name: "承负无薪孤惧苦火", desc: "嘉贝莉娜施放<b class=\"term-burst\">共鸣解放</b>时，使队伍中所有角色造成的伤害提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">3</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"skillDmg","value":1.5,"label":"共鸣技能伤害 +150%"},
      text: { name: "纵使光明远去，厄难焚身", desc: "嘉贝莉娜<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">150%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"allDmg","value":0.6,"label":"自身伤害 +60%"},
      text: { name: "我仍炽耀不移，自有永有", desc: "嘉贝莉娜造成的伤害提升 <b class=\"term-num\">60%</b>。" },
    }
    ],
  },
  "卡卡罗": {
    character: "卡卡罗",
    chains: [
    {
      index: 1,
      effect: {"effect":"energyRefund","value":10,"label":"共鸣技能额外回复 10 点能量"},
      text: { name: "隐秘谈判", desc: "卡卡罗施放<b class=\"term-skill\">共鸣技能</b>时，额外回复 <b class=\"term-num\">10</b> 点共鸣能量。" },
    },
    {
      index: 2,
      effect: {"effect":"skillDmg","value":0.3,"label":"共鸣技能伤害 +30%"},
      text: { name: "零和博弈", desc: "卡卡罗<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"elemDmg","value":0.25,"element":"导电","label":"导电伤害 +25%"},
      text: { name: "铁腕外交", desc: "卡卡罗导电伤害加成提升 <b class=\"term-num\">25%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamElemDmg","value":0.2,"element":"导电","label":"全队导电伤害 +20%"},
      text: { name: "集群威胁", desc: "全队所有角色导电伤害加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"variationDmg","value":0.5,"label":"变奏伤害 +50%"},
      text: { name: "替代协议", desc: "卡卡罗<b class=\"term-variation\">变奏技能</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"burstDmg","value":1,"label":"共鸣解放伤害 +100%"},
      text: { name: "最后通牒", desc: "卡卡罗<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">100%</b>。" },
    }
    ],
  },
  "折枝": {
    character: "折枝",
    chains: [
    {
      index: 1,
      effect: {"effect":"crate","value":0.1,"label":"暴击 +10%"},
      text: { name: "骨法用笔", desc: "折枝暴击提升 <b class=\"term-num\">10%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"zhezhiCraneCapBonus","value":6,"label":"墨鹤上限 +6（合计 12）"},
      text: { name: "气韵生动", desc: "<b class=\"term-resource\">墨鹤</b>的召唤上限增加 <b class=\"term-num\">6</b> 只。" },
    },
    {
      index: 3,
      effect: {"effect":"atk","value":0.45,"label":"攻击 +45%"},
      text: { name: "应物象形", desc: "折枝攻击提升 <b class=\"term-num\">45%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"zhezhiTeamAtk4Chain","value":0.2,"label":"共鸣解放后全队攻击 +20%（3 回合）"},
      text: { name: "随类赋彩", desc: "折枝施放<b class=\"term-burst\">共鸣解放·虚实境趣</b>时，全队所有角色攻击提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">3</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"zhezhiExtraCrane","value":0.4,"label":"每召唤 3 只墨鹤，额外召唤 1 只"},
      text: { name: "经营位置", desc: "每累计召唤 <b class=\"term-num\">3</b> 只<b class=\"term-resource\">墨鹤</b>，额外召唤 <b class=\"term-num\">1</b> 只墨鹤，造成原墨鹤 <b class=\"term-num\">140%</b> 的伤害。" },
    },
    {
      index: 6,
      effect: {"effect":"zhezhiWhiteCrane","value":1.2,"label":"共鸣技能额外召唤白鹤"},
      text: { name: "传移摹写", desc: "折枝施放<b class=\"term-skill\">共鸣技能</b>时，额外召唤一只<b class=\"term-resource\">白鹤</b>，造成共鸣技能 <b class=\"term-num\">120%</b> 的伤害。" },
    }
    ],
  },
  "相里要": {
    character: "相里要",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillDmg","value":0.48,"label":"共鸣技能伤害 +48%"},
      text: { name: "卓异的门生", desc: "相里要<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">48%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"cdmg","value":0.3,"label":"暴击伤害 +30%"},
      text: { name: "前人的行迹", desc: "相里要暴击伤害提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.63,"label":"共鸣技能伤害 +63%"},
      text: { name: "邃古的遗墟", desc: "相里要<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">63%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamBurstDmg","value":0.25,"label":"全队共鸣解放伤害 +25%"},
      text: { name: "再塑的躯骸", desc: "全队所有角色<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">25%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":1,"label":"共鸣解放伤害 +100%"},
      text: { name: "群星的止境", desc: "相里要<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">100%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"skillDmg","value":0.76,"label":"共鸣技能伤害 +76%"},
      text: { name: "坊市的烟火", desc: "相里要<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">76%</b>。" },
    }
    ],
  },
  "洛可可": {
    character: "洛可可",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillDmg","value":0.2,"label":"共鸣技能 +20%（含 100 想象力 / +10 协奏）"},
      text: { name: "沉闷的灰暗涌进船舱", desc: "施放<b class=\"term-skill\">共鸣技能·高难度设计</b>时，额外回复<b class=\"term-resource\">想象力</b>至满层，并回复 <b class=\"term-num\">10</b> 点协奏能量。" },
    },
    {
      index: 2,
      effect: {"effect":"teamElemDmg","value":0.4,"element":"湮灭","label":"全队湮灭伤害 +40%（满 3 层 + 加成）"},
      text: { name: "海萤石闪烁着微弱光芒", desc: "施放<b class=\"term-skill\">共鸣技能·高难度设计</b>时，队伍中的角色湮灭伤害加成提升 <b class=\"term-num\">10%</b>，可叠加 <b class=\"term-num\">3</b> 层。满层时额外提升 <b class=\"term-num\">10%</b>，总计 <b class=\"term-num\">40%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"crate","value":0.1,"cdmg":0.3,"label":"变奏后暴击 +10% / 暴伤 +30%"},
      text: { name: "用心观察，以手丈量", desc: "施放<b class=\"term-variation\">变奏技能·佩洛，来帮忙</b>时，洛可可暴击提升 <b class=\"term-num\">10%</b>，暴击伤害提升 <b class=\"term-num\">30%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 4,
      effect: {"effect":"normalDmg","value":0.6,"label":"共鸣技能后普攻 +60%"},
      text: { name: "千万\"奇藏\"于箱中汇聚", desc: "施放<b class=\"term-skill\">共鸣技能·高难度设计</b>时，洛可可<b class=\"term-normal\">普攻</b>伤害倍率提升 <b class=\"term-num\">60%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":0.2,"heavyDmg":0.8,"label":"解放开场 +20% / 重击 +80%"},
      text: { name: "重建乐土，在舞台上", desc: "<b class=\"term-burst\">共鸣解放·即兴喜剧，开场</b>伤害倍率提升 <b class=\"term-num\">20%</b>，<b class=\"term-heavy\">重击</b>伤害倍率提升 <b class=\"term-num\">80%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"defPierce","value":0.6,"label":"解放期间普攻无视 60% 防御"},
      text: { name: "飞吧，乘着金色的翅膀", desc: "施放<b class=\"term-burst\">共鸣解放·即兴喜剧，开场</b>时，洛可可<b class=\"term-normal\">普攻</b>无视目标 <b class=\"term-num\">60%</b> 防御，持续 <b class=\"term-num\">2</b> 回合。" },
    }
    ],
  },
  "布兰特": {
    character: "布兰特",
    chains: [
    {
      index: 1,
      effect: {"effect":"atk","value":0.6,"label":"变奏/空中攻击 +20%×3 = +60%"},
      text: { name: "跟随洋流和信风", desc: "施放<b class=\"term-variation\">变奏技能·为我！</b>或每次<b class=\"term-heavy\">空中攻击</b>时，布兰特造成的伤害提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">2</b> 回合，可叠加 <b class=\"term-num\">3</b> 层。满层时伤害提升 <b class=\"term-num\">60%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"crate","value":0.3,"label":"空中攻击/解放暴击 +30%"},
      text: { name: "掠夺欢声与笑颜", desc: "施放<b class=\"term-heavy\">空中攻击</b>和<b class=\"term-burst\">火焰归亡曲</b>时，布兰特暴击提升 <b class=\"term-num\">30%</b>。同时布兰特的<b class=\"term-variation\">延奏技能·航向确定！</b>获得额外效果：下一位登场角色施放<b class=\"term-skill\">共鸣技能</b>命中目标时，布兰特将召唤一次爆炸，造成布兰特攻击 <b class=\"term-num\">440%</b> 的热熔伤害（<b class=\"term-normal\">普攻</b>伤害类型）。爆炸每回合可触发 <b class=\"term-num\">1</b> 次，最多可触发 <b class=\"term-num\">2</b> 次。切换至其他角色不会清除该额外效果的剩余次数。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":0.42,"label":"火焰归亡曲伤害倍率 +42%"},
      text: { name: "无惧惊涛骇浪", desc: "<b class=\"term-burst\">火焰归亡曲</b>造成的伤害倍率提升 <b class=\"term-num\">42%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"heal","value":0.25,"label":"治疗加成 +25%"},
      text: { name: "纵情放声歌唱", desc: "<b class=\"term-burst\">火焰归亡曲</b>为全队提供的治疗量提升 <b class=\"term-num\">25%</b>。布兰特施放<b class=\"term-burst\">火焰归亡曲</b>时，额外为全队回复生命值。" },
    },
    {
      index: 5,
      effect: {"effect":"normalDmg","value":0.15,"label":"普攻伤害 +15%"},
      text: { name: "演员说：生活皆舞台", desc: "布兰特造成<b class=\"term-normal\">普攻</b>伤害时，<b class=\"term-normal\">普攻</b>伤害加成提升 <b class=\"term-num\">15%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 6,
      effect: {"effect":"burstDmg","value":0.3,"label":"空中 +30% + 再燃 = 解放伤害 +30%"},
      text: { name: "船长答：狂欢即世界！", desc: "<b class=\"term-heavy\">空中攻击</b>造成的伤害倍率提升 <b class=\"term-num\">30%</b>。施放<b class=\"term-burst\">火焰归亡曲</b>后，会在原地产生一次<b class=\"term-resource\">再燃</b>，造成等同于<b class=\"term-burst\">火焰归亡曲</b><b class=\"term-num\">30%</b>的热熔伤害（<b class=\"term-normal\">普攻</b>伤害类型）。" },
    }
    ],
  },
  "坎特蕾拉": {
    character: "坎特蕾拉",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillDmg","value":0.5,"label":"共鸣技能/感知汲取 +50%"},
      text: { name: "在无尽展开的波涛里", desc: "施放<b class=\"term-skill\">共鸣技能</b>时，回复 <b class=\"term-num\">1</b> 点<b class=\"term-resource\">迷离</b>。<b class=\"term-skill\">共鸣技能·翩跹</b>、<b class=\"term-skill\">共鸣技能·斑驳幻梦</b>、<b class=\"term-skill\">共鸣回路·感知汲取</b>的伤害倍率提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"burstDmg","value":2.45,"label":"解放伤害 +245%"},
      text: { name: "坠入迷离幻梦", desc: "<b class=\"term-burst\">共鸣解放·陷溺</b>可使目标进入<b class=\"term-resource\">迷梦</b>，坎特蕾拉触发<b class=\"term-resource\">惊醒</b>的伤害倍率提升 <b class=\"term-num\">245%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":3.7,"label":"共鸣解放·陷溺伤害 +370%"},
      text: { name: "凝视着深渊", desc: "<b class=\"term-burst\">共鸣解放·陷溺</b>的伤害倍率提升 <b class=\"term-num\">370%</b>。施放<b class=\"term-burst\">共鸣解放·陷溺</b>后，直接进入<b class=\"term-resource\">蜃境</b>状态。若当前已处于<b class=\"term-resource\">蜃境</b>状态，则不会重复进入。" },
    },
    {
      index: 4,
      effect: {"effect":"heal","value":0.25,"label":"蜃境治疗加成 +25%"},
      text: { name: "就像凝视自己的灵魂", desc: "<b class=\"term-resource\">蜃境</b>状态期间，治疗效果加成提升 <b class=\"term-num\">25%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":0.5,"label":"解放伤害 +50%"},
      text: { name: "投到倒影的怀里", desc: "<b class=\"term-burst\">共鸣解放·弥漫</b>的<b class=\"term-resource\">织梦水母</b>最大召唤数增加 <b class=\"term-num\">5</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"normalDmg","value":0.8,"defPierce":0.3,"label":"普攻·蛰幻 +80% / 解放无视 30% 防御"},
      text: { name: "下坠、下坠…坠入更深的幻梦", desc: "<b class=\"term-normal\">普攻·蛰幻</b>的伤害倍率提升 <b class=\"term-num\">80%</b>。施放<b class=\"term-burst\">共鸣解放·陷溺</b>时，坎特蕾拉的伤害无视目标 <b class=\"term-num\">30%</b> 防御，持续 <b class=\"term-num\">2</b> 回合。<b class=\"term-resource\">迷梦</b>期间目标受到伤害时，若此次伤害没有附加<b class=\"term-normal\">迷梦</b>，则不会触发<b class=\"term-resource\">惊醒</b>。" },
    }
    ],
  },
  "维里奈": {
    character: "维里奈",
    chains: [
    {
      index: 1,
      effect: {"effect":"heal","value":0.2,"label":"治疗加成 +20%"},
      text: { name: "萌芽的一瞬", desc: "维里奈治疗效果加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"energyRefund","value":10,"label":"共鸣技能额外回复 10 点能量"},
      text: { name: "抽叶的思考", desc: "维里奈施放<b class=\"term-skill\">共鸣技能</b>时，额外回复 <b class=\"term-num\">10</b> 点共鸣能量。" },
    },
    {
      index: 3,
      effect: {"effect":"heal","value":0.12,"label":"治疗加成 +12%"},
      text: { name: "生长的选择", desc: "维里奈治疗效果加成提升 <b class=\"term-num\">12%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamElemDmg","value":0.15,"element":"衍射","label":"全队衍射伤害 +15%"},
      text: { name: "盛放的拥抱", desc: "全队所有角色衍射伤害加成提升 <b class=\"term-num\">15%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"heal","value":0.2,"label":"治疗加成 +20%"},
      text: { name: "结果的奇迹", desc: "维里奈治疗效果加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"heavyDmg","value":0.2,"label":"重击伤害 +20%"},
      text: { name: "丰收的喜悦", desc: "维里奈<b class=\"term-heavy\">重击</b>伤害提升 <b class=\"term-num\">20%</b>。" },
    }
    ],
  },
  "安可": {
    character: "安可",
    chains: [
    {
      index: 1,
      effect: {"effect":"elemDmg","value":0.12,"element":"热熔","label":"热熔伤害 +12%"},
      text: { name: "羊咩的童话书", desc: "安可热熔伤害加成提升 <b class=\"term-num\">12%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"energyRefund","value":10,"label":"共鸣技能额外回复 10 点能量"},
      text: { name: "数羊安眠曲", desc: "安可施放<b class=\"term-skill\">共鸣技能</b>时，额外回复 <b class=\"term-num\">10</b> 点共鸣能量。" },
    },
    {
      index: 3,
      effect: {"effect":"heavyDmg","value":0.4,"label":"重击伤害 +40%"},
      text: { name: "迷雾？黑海岸！", desc: "安可<b class=\"term-heavy\">重击</b>伤害提升 <b class=\"term-num\">40%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamElemDmg","value":0.2,"element":"热熔","label":"全队热熔伤害 +20%"},
      text: { name: "冒险？好有趣！", desc: "全队所有角色热熔伤害加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"skillDmg","value":0.35,"label":"共鸣技能伤害 +35%"},
      text: { name: "聚光灯，勇士登场！", desc: "安可<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">35%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"atk","value":0.25,"label":"攻击 +25%"},
      text: { name: "羊咩，拯救世界！", desc: "安可攻击提升 <b class=\"term-num\">25%</b>。" },
    }
    ],
  },
  "凌阳": {
    character: "凌阳",
    chains: [
    {
      index: 1,
      effect: {"effect":"burstDmg","value":0.1,"label":"解放伤害 +10%"},
      text: { name: "醒狮开光，如意吉祥", desc: "凌阳共鸣解放伤害加成提升 <b class=\"term-num\">10%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"energyRefund","value":10,"label":"变奏额外回 10 能量"},
      text: { name: "威风凛凛，四方张狂", desc: "凌阳施放<b class=\"term-variation\">变奏技能·出洞·睡狮蛰醒</b>时，额外回复 <b class=\"term-num\">10</b> 点共鸣能量。" },
    },
    {
      index: 3,
      effect: {"effect":"normalDmg","value":0.2,"label":"解放期间普攻 +20%"},
      text: { name: "瞠目顾盼，其声昂昂", desc: "凌阳处于<b class=\"term-resource\">行狮</b>状态期间，普攻伤害加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamElemDmg","value":0.2,"element":"冷凝","label":"延奏全队冷凝 +20%"},
      text: { name: "一跳三叫，众仙折腰", desc: "凌阳施放<b class=\"term-variation\">延奏技能·留痕·踏雪点星</b>时，队伍中所有角色冷凝伤害加成提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">3</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":2,"label":"解放额外 atk×200% 冷凝"},
      text: { name: "蹑罡踏斗，七星悬朗", desc: "凌阳施放<b class=\"term-burst\">共鸣解放·奋进·狮子奋迅,俱足万行</b>时，额外造成凌阳攻击 <b class=\"term-num\">200%</b> 的冷凝伤害。" },
    },
    {
      index: 6,
      effect: {"effect":"normalDmg","value":1,"label":"行狮状态技能后下次普攻 +100%"},
      text: { name: "神功盖世，百鬼震惶", desc: "凌阳处于<b class=\"term-resource\">行狮</b>状态期间，每次施放共鸣技能后，下次普攻伤害加成提升 <b class=\"term-num\">100%</b>。" },
    }
    ],
  },
  "鉴心": {
    character: "鉴心",
    chains: [
    {
      index: 1,
      effect: {"effect":"normalDmg","value":0.2,"label":"变奏后普攻 +20%"},
      text: { name: "林间青枝", desc: "鉴心<b class=\"term-variation\">变奏入场</b>后,<b class=\"term-normal\">普攻</b>伤害加成提升 <b class=\"term-num\">20%</b>,持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 2,
      effect: {"effect":"skillDmg","value":0.3,"label":"共鸣技能伤害 +30%"},
      text: { name: "道者稚徒", desc: "鉴心<b class=\"term-skill\">共鸣技能</b>伤害加成提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.15,"label":"架势打出行气反击 +15%"},
      text: { name: "无心无为", desc: "鉴心<b class=\"term-resource\">架势</b>期间施放<b class=\"term-skill\">行气反击</b>时,该次伤害加成提升 <b class=\"term-num\">15%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"burstDmg","value":0.8,"label":"重击·混元气旋时解放 +80%"},
      text: { name: "十问之思", desc: "鉴心施放<b class=\"term-heavy\">重击·混元气旋</b>时,<b class=\"term-burst\">共鸣解放·涤净力场</b>伤害加成提升 <b class=\"term-num\">80%</b>,持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":0.1,"label":"解放伤害 +10%"},
      text: { name: "经世自鉴", desc: "鉴心<b class=\"term-burst\">共鸣解放·涤净力场</b>伤害加成提升 <b class=\"term-num\">10%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"heavyDmg","value":0.8,"label":"重击伤害 +80%"},
      text: { name: "向己而生", desc: "鉴心<b class=\"term-heavy\">重击</b>伤害加成提升 <b class=\"term-num\">80%</b>。" },
    }
    ],
  },
  "莫特斐": {
    character: "莫特斐",
    chains: [
    {
      index: 1,
      effect: {"effect":"burstDmg","value":0.5,"label":"解放期间协同伤害 +50%"},
      text: { name: "孤独的练习曲", desc: "莫特斐<b class=\"term-burst\">共鸣解放·浮翼狂想</b>持续期间,<b class=\"term-burst\">共鸣解放·加强音</b>伤害加成提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"energyRefund","value":10,"label":"共鸣技能额外回 10 能量"},
      text: { name: "虚伪的赞美诗", desc: "莫特斐施放<b class=\"term-skill\">共鸣技能</b>后,额外回复 <b class=\"term-num\">10</b> 点共鸣能量。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":0.3,"label":"预热宣叙调：加强音暴伤 +30%"},
      text: { name: "预热的宣叙调", desc: "莫特斐<b class=\"term-burst\">共鸣解放·加强音</b>暴击伤害加成提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"burstDmg","value":0.4,"label":"解放伤害 +40%"},
      text: { name: "宣泄的华尔兹", desc: "莫特斐<b class=\"term-burst\">共鸣解放</b>伤害加成提升 <b class=\"term-num\">40%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"skillDmg","value":0.5,"label":"共鸣技能协同伤害 +50%"},
      text: { name: "葬送的四重奏", desc: "莫特斐<b class=\"term-skill\">共鸣技能</b>伤害加成提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"teamAtk","value":0.2,"label":"盛怒无言歌：解放时全队攻击 +20%"},
      text: { name: "盛怒的无言歌", desc: "莫特斐施放<b class=\"term-burst\">共鸣解放·暴烈终曲</b>时,队伍中所有角色攻击加成提升 <b class=\"term-num\">20%</b>,持续 <b class=\"term-num\">3</b> 回合。" },
    }
    ],
  },
  "散华": {
    character: "散华",
    chains: [
    {
      index: 1,
      effect: {"effect":"crate","value":0.15,"label":"普攻第 5 段后暴击 +15%"},
      text: { name: "孤身孑然", desc: "散华施放第 <b class=\"term-num\">5</b> 段普攻时，自身暴击加成提升 <b class=\"term-num\">15%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 2,
      effect: {"effect":"heavyDmg","value":0.2,"label":"重击伤害 +20%"},
      text: { name: "净雪明心", desc: "散华重击伤害加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"allDmg","value":0.2,"label":"伤害 +20%"},
      text: { name: "目视异常", desc: "散华造成的伤害加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"heavyDmg","value":0.5,"label":"解放后重击·爆裂 +50%"},
      text: { name: "剑修五蕴", desc: "散华施放<b class=\"term-burst\">共鸣解放·焦瞑冻土</b>后，下次<b class=\"term-heavy\">重击·爆裂</b>伤害加成提升 <b class=\"term-num\">50%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"cdmg","value":1,"label":"暴击伤害 +100%"},
      text: { name: "颠覆无常", desc: "散华暴击伤害加成提升 <b class=\"term-num\">100%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"teamAtk","value":0.2,"label":"曙色天光：引爆冰棱/冰川后全队攻击 +10%×2 层 = +20%"},
      text: { name: "曙色天光", desc: "散华施放<b class=\"term-heavy\">重击·爆裂</b>后，队伍中的角色攻击加成提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">3</b> 回合。" },
    }
    ],
  },
  "卜灵": {
    character: "卜灵",
    chains: [
    {
      index: 1,
      effect: {"effect":"burstDmg","value":0.15,"label":"暴击率 +15%"},
      text: { name: "百般法宝，借物打力", desc: "卜灵<b class=\"term-burst\">共鸣解放·飞雷诀·归一</b>造成伤害时，此次伤害暴击加成提升 <b class=\"term-num\">15%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"energyRefund","value":25,"label":"阴阳相生回 25 能量"},
      text: { name: "符法通玄，神鬼咸听", desc: "卜灵施放共鸣技能后，额外回复 <b class=\"term-num\">25</b> 点共鸣能量，每 <b class=\"term-num\">4</b> 回合可触发 <b class=\"term-num\">1</b> 次。" },
    },
    {
      index: 3,
      effect: {"effect":"heal","value":0.25,"label":"治疗加成 +25%"},
      text: { name: "召灵遣将，窥探天机", desc: "卜灵治疗效果加成提升 <b class=\"term-num\">25%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"heal","value":0.2,"label":"治疗效果加成 +20%"},
      text: { name: "索拉云游，气运加身", desc: "卜灵治疗效果加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"skillDmg","value":0.4,"label":"共鸣技能伤害 +40%"},
      text: { name: "论坛禁言，速换马甲", desc: "卜灵共鸣技能伤害加成提升 <b class=\"term-num\">40%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"teamSkillDmg","value":0.3,"label":"雷法三才合一时全队共鸣技能 +30%"},
      text: { name: "\"天地混元雷符水帖天尊\"", desc: "卜灵<b class=\"term-burst\">共鸣解放·飞雷诀·归一</b>展开<b class=\"term-resource\">五雷荡煞阵</b>时，队伍中角色共鸣技能伤害加成提升 <b class=\"term-num\">30%</b>，持续 <b class=\"term-num\">3</b> 回合。" },
    }
    ],
  },
  "丹瑾": {
    character: "丹瑾",
    chains: [
    {
      index: 1,
      effect: {"effect":"atk","value":0.3,"label":"攻击朱蚀目标 +5%×6 = +30%"},
      text: { name: "丹心本如鉴", desc: "丹瑾攻击携带<b class=\"term-resource\">朱蚀之刻</b>的目标时，自身攻击加成提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"allDmg","value":0.2,"label":"攻击朱蚀目标伤害 +20%"},
      text: { name: "明镜却蒙尘", desc: "丹瑾攻击携带<b class=\"term-resource\">朱蚀之刻</b>的目标时，造成的伤害额外提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":0.3,"label":"共鸣解放伤害加成 +30%"},
      text: { name: "刹那芳华不长久", desc: "丹瑾共鸣解放伤害加成提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"crate","value":0.15,"label":"彤华≥60 时暴击 +15%"},
      text: { name: "孤艳难红", desc: "丹瑾<b class=\"term-resource\">彤华</b> ≥ <b class=\"term-num\">60</b> 时，自身暴击加成提升 <b class=\"term-num\">15%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"elemDmg","value":0.15,"element":"湮灭","label":"湮灭伤害加成 +15%"},
      text: { name: "剑扫春秋", desc: "丹瑾湮灭伤害加成提升 <b class=\"term-num\">15%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"teamAtk","value":0.2,"label":"重击·缭乱后全队攻击 +20%"},
      text: { name: "绯染碧玉岂堪留", desc: "丹瑾施放<b class=\"term-resource\">彤华</b>满值强化<b class=\"term-skill\">共鸣技能(缭乱)</b>后，队伍中角色攻击加成提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">3</b> 回合。" },
    }
    ],
  },
  "白芷": {
    character: "白芷",
    chains: [
    {
      index: 1,
      effect: {"effect":"energyRefund","value":5,"label":"共鸣技能每念意回 2.5 能量"},
      text: { name: "极简与繁复", desc: "白芷施放<b class=\"term-skill\">共鸣技能·应急预案</b>时，每消耗 <b class=\"term-num\">1</b> 点<b class=\"term-resource\">念意</b>，额外回复 <b class=\"term-num\">2.5</b> 点共鸣能量。" },
    },
    {
      index: 2,
      effect: {"effect":"elemDmg","value":0.15,"element":"冷凝","label":"满念意时冷凝 +15%"},
      text: { name: "沉默的冰原", desc: "白芷施放<b class=\"term-skill\">共鸣技能·应急预案</b>时，若<b class=\"term-resource\">念意</b>满 <b class=\"term-num\">4</b> 层，白芷冷凝伤害加成提升 <b class=\"term-num\">15%</b>，治疗效果加成提升 <b class=\"term-num\">15%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 3,
      effect: {"effect":"hp","value":0.12,"label":"变奏后生命上限 +12%"},
      text: { name: "真理的崇奉", desc: "白芷施放<b class=\"term-variation\">变奏技能·覆雪流盈</b>后，生命上限提升 <b class=\"term-num\">12%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 4,
      effect: {"effect":"heal","value":0.2,"label":"解放强化频隙回响治疗 +20%"},
      text: { name: "被追溯的本源", desc: "白芷施放<b class=\"term-burst\">共鸣解放·刹那合弥</b>时，<b class=\"term-resource\">频隙回响</b>治疗倍率提升 <b class=\"term-num\">20%</b>，并额外增加 <b class=\"term-num\">2</b> 段治疗。" },
    },
    {
      index: 5,
      effect: {"effect":"heal","value":0.1,"label":"治疗加成 +10%"},
      text: { name: "被回应的祈愿", desc: "白芷治疗效果加成提升 <b class=\"term-num\">10%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"teamElemDmg","value":0.12,"element":"冷凝","label":"闻道者觉悟：拾取天籁全队冷凝 +12%"},
      text: { name: "闻道者的觉悟", desc: "白芷激活时，队伍中所有角色冷凝伤害加成提升 <b class=\"term-num\">12%</b>。" },
    }
    ],
  },
  "秋水": {
    character: "秋水",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillCdReduce","value":1,"label":"共鸣技能 CD -1 回合"},
      text: { name: "恶作剧开场", desc: "秋水<b class=\"term-skill\">共鸣技能·移位戏法</b>冷却时间减少 <b class=\"term-num\">1</b> 回合。" },
    },
    {
      index: 2,
      effect: {"effect":"atk","value":0.15,"label":"攻击雾化分身嘲讽目标 +15% 攻击"},
      text: { name: "织雾首秀", desc: "秋水攻击加成提升 <b class=\"term-num\">15%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"normalDmg","value":0.3,"label":"普攻伤害 +30%"},
      text: { name: "雾化转场", desc: "秋水普攻伤害加成提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"skillDmg","value":0.3,"label":"共鸣技能·雾化子弹 +30%"},
      text: { name: "终幕的黑花", desc: "秋水共鸣技能伤害加成提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"elemDmg","value":0.25,"element":"气动","label":"迷途者喝彩：潜行时气动 +25%"},
      text: { name: "迷途者喝彩", desc: "秋水气动伤害加成提升 <b class=\"term-num\">25%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"crate","value":0.08,"label":"幕后卖家：解放暴击 +8%"},
      text: { name: "幕后卖家", desc: "秋水暴击加成提升 <b class=\"term-num\">8%</b>，重击伤害加成提升 <b class=\"term-num\">50%</b>。" },
    }
    ],
  },
  "炽霞": {
    character: "炽霞",
    chains: [
    {
      index: 1,
      effect: {"effect":"crate","value":0.2,"label":"暴击率 +20%"},
      text: { name: "剧院的英雄戏", desc: "炽霞施放<b class=\"term-skill\">共鸣技能·轰轰</b>时,该次伤害必定暴击。" },
    },
    {
      index: 2,
      effect: {"effect":"energyRefund","value":5,"label":"解放期间击败目标回 5 能量"},
      text: { name: "跃动的火星", desc: "炽霞<b class=\"term-burst\">共鸣解放·炽烈焰火</b>持续期间,每击败 <b class=\"term-num\">1</b> 个目标,回复 <b class=\"term-num\">5</b> 点共鸣能量,单次解放最多回复 <b class=\"term-num\">20</b> 点。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":0.25,"label":"解放伤害 +25%"},
      text: { name: "不灭的火把", desc: "炽霞<b class=\"term-burst\">共鸣解放·炽烈焰火</b>伤害加成提升 <b class=\"term-num\">25%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"burstDmg","value":0.3,"label":"解放伤害 +30%"},
      text: { name: "英雄的绝招", desc: "炽霞<b class=\"term-burst\">共鸣解放·炽烈焰火</b>伤害加成额外提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"atk","value":0.3,"label":"胜利的枪弹焰火：加麻加辣满层攻击 +30%"},
      text: { name: "胜利的枪弹焰火", desc: "炽霞固有技能·<b class=\"term-resource\">加麻加辣</b>叠至满层时,攻击加成提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"teamNormalDmg","value":0.25,"label":"剧终彩蛋：技能·轰轰后全队普攻 +25%"},
      text: { name: "剧终的回归彩蛋", desc: "炽霞施放<b class=\"term-skill\">共鸣技能·轰轰</b>后,队伍中所有角色普攻伤害加成提升 <b class=\"term-num\">25%</b>,持续 <b class=\"term-num\">3</b> 回合。" },
    }
    ],
  },
  "秧秧": {
    character: "秧秧",
    chains: [
    {
      index: 1,
      effect: {"effect":"elemDmg","value":0.15,"element":"气动","label":"变奏后气动 +15%"},
      text: { name: "底色湛蓝如洗", desc: "秧秧施放<b class=\"term-variation\">变奏技能·湛蓝礼赞</b>后,气动伤害加成提升 <b class=\"term-num\">15%</b>,持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 2,
      effect: {"effect":"energyRefund","value":10,"label":"重击命中回 10 能量"},
      text: { name: "雀鸟衔枝而行", desc: "秧秧<b class=\"term-heavy\">重击</b>命中目标时,额外回复 <b class=\"term-num\">10</b> 点共鸣能量。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.4,"label":"共鸣技能 +40%"},
      text: { name: "流息声声不绝", desc: "秧秧<b class=\"term-skill\">共鸣技能</b>伤害加成提升 <b class=\"term-num\">40%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"heavyDmg","value":0.95,"label":"空中释羽（重击）+95%"},
      text: { name: "若可侧耳倾听", desc: "秧秧<b class=\"term-heavy\">重击</b>伤害加成提升 <b class=\"term-num\">95%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":0.85,"label":"绪风于此响彻：解放·朔风旋涌 +85%"},
      text: { name: "绪风于此响彻", desc: "秧秧<b class=\"term-burst\">共鸣解放·朔风旋涌</b>伤害加成提升 <b class=\"term-num\">85%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"teamAtk","value":0.2,"label":"致美好以颂歌：空中释羽后全队攻击 +20%"},
      text: { name: "致美好以颂歌", desc: "秧秧施放<b class=\"term-heavy\">重击</b>后,队伍中所有角色攻击加成提升 <b class=\"term-num\">20%</b>,持续 <b class=\"term-num\">3</b> 回合。" },
    }
    ],
  },
  "桃祈": {
    character: "桃祈",
    chains: [
    {
      index: 1,
      effect: {"effect":"hp","value":0.12,"label":"生命上限 +12%"},
      text: { name: "怀悠然之心", desc: "桃祈生命上限提升 <b class=\"term-num\">12%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"crate","value":0.1,"label":"暴击率 +10%"},
      text: { name: "假泯于众人", desc: "桃祈暴击加成提升 <b class=\"term-num\">10%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.2,"label":"共鸣技能伤害 +20%"},
      text: { name: "观万物之细", desc: "桃祈<b class=\"term-skill\">共鸣技能</b>伤害加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"def","value":0.2,"label":"重击发后制人触发，防御 +20%"},
      text: { name: "承负重之担", desc: "桃祈施放<b class=\"term-heavy\">重击·发后制人</b>后,防御加成提升 <b class=\"term-num\">20%</b>,持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"energyRefund","value":20,"label":"解市井民忧：攻防转换命中回 20 能量"},
      text: { name: "解市井民忧", desc: "桃祈<b class=\"term-heavy\">重击·发后制人</b>命中目标,额外回复 <b class=\"term-num\">20</b> 点共鸣能量。" },
    },
    {
      index: 6,
      effect: {"effect":"normalDmg","value":0.4,"label":"护城邦：磐岩护壁期间普攻 +40%"},
      text: { name: "护城邦安危", desc: "桃祈<b class=\"term-normal\">普攻</b>伤害加成提升 <b class=\"term-num\">40%</b>。" },
    }
    ],
  },
  "渊武": {
    character: "渊武",
    chains: [
    {
      index: 1,
      effect: {"effect":"atk","value":0.1,"label":"攻击 +10%"},
      text: { name: "点一盏清茗", desc: "渊武攻击加成提升 <b class=\"term-num\">10%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"energyRefund","value":15,"label":"变奏·轰雷回 15 能量"},
      text: { name: "敛狂戾之心", desc: "渊武施放变奏技能·<b class=\"term-variation\">轰雷</b>时，额外回复 <b class=\"term-num\">15</b> 点共鸣能量。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.2,"label":"共鸣技能·雷之楔 +20%"},
      text: { name: "正周身之气", desc: "渊武共鸣技能伤害加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"burstDmg","value":0.3,"label":"解放伤害 +30%"},
      text: { name: "挥刚猛之拳", desc: "渊武<b class=\"term-burst\">共鸣解放·寂土重明</b>伤害加成提升 <b class=\"term-num\">30%</b>，并给场上角色施加护盾，护盾量为渊武防御的 <b class=\"term-num\">200%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":0.5,"label":"顾一方天地：雷之楔在场时解放 +50%"},
      text: { name: "顾一方天地", desc: "场上存在 <b class=\"term-resource\">雷之楔</b>时，渊武<b class=\"term-burst\">共鸣解放·寂土重明</b>伤害加成额外提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"teamDef","value":0.32,"label":"保八方平安：雷之楔范围内全队防御 +32%"},
      text: { name: "保八方平安", desc: "场上存在 <b class=\"term-resource\">雷之楔</b>期间，队伍中所有角色防御加成提升 <b class=\"term-num\">32%</b>。" },
    }
    ],
  },
  "釉瑚": {
    character: "釉瑚",
    chains: [
    {
      index: 1,
      effect: {"effect":"hp","value":0.06,"label":"生命上限 +6%"},
      text: { name: "港边小憩", desc: "釉瑚生命上限提升 <b class=\"term-num\">6%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"skillDmg","value":0.2,"label":"共鸣技能伤害 +20%"},
      text: { name: "堂侧酣睡", desc: "釉瑚<b class=\"term-skill\">共鸣技能·匣中问祯</b>伤害加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"atk","value":0.2,"label":"攻击 +20%"},
      text: { name: "火中噩魇", desc: "釉瑚攻击加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"skillDmg","value":0.2,"label":"共鸣技能伤害 +20%"},
      text: { name: "雪夜迷寐", desc: "釉瑚施放<b class=\"term-skill\">共鸣技能·匣中问祯</b>时，有 <b class=\"term-num\">20%</b> 概率不进入冷却状态。" },
    },
    {
      index: 5,
      effect: {"effect":"crate","value":0.15,"label":"万里浅眠：变奏·遂心匣后暴击 +15%"},
      text: { name: "万里浅眠", desc: "釉瑚施放变奏技能·<b class=\"term-variation\">遂心匣</b>后，暴击加成提升 <b class=\"term-num\">15%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 6,
      effect: {"effect":"cdmg","value":0.6,"label":"千秋一枕：奇珍赏获霁青 4 层 × 15% = +60% 暴伤"},
      text: { name: "千秋一枕", desc: "釉瑚施放<b class=\"term-skill\">共鸣技能·奇珍赏</b>时，获得 <b class=\"term-num\">1</b> 层 <b class=\"term-resource\">霁青</b>效果，最多可叠加 <b class=\"term-num\">4</b> 层，每层 <b class=\"term-resource\">霁青</b>使釉瑚暴击伤害加成提升 <b class=\"term-num\">15%</b>（满 <b class=\"term-num\">4</b> 层暴伤 +<b class=\"term-num\">60%</b>）。" },
    }
    ],
  },
  "灯灯": {
    character: "灯灯",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillDmg","value":0.15,"label":"共鸣技能伤害 +15%"},
      text: { name: "包裹正等待揽收", desc: "灯灯共鸣技能伤害加成提升 <b class=\"term-num\">15%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"defPierce","value":0.2,"label":"强化·前扑/后撤无视 20% 防御"},
      text: { name: "呜呜物流已收件", desc: "灯灯施放强化·前扑或强化·后撤（<b class=\"term-resource\">光能</b>满时共鸣技能）时，无视目标 <b class=\"term-num\">20%</b> 防御。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":0.3,"label":"共鸣解放·啾啾专送 +30%"},
      text: { name: "特快专递运输中", desc: "灯灯<b class=\"term-burst\">共鸣解放·啾啾专送</b>伤害加成提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"normalDmg","value":0.3,"label":"普攻伤害加成 +30%"},
      text: { name: "灯灯正为您派送", desc: "灯灯普攻伤害加成提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"skillDmg","value":1,"label":"快件已顺利签收：光能满时强光穿射 +100%"},
      text: { name: "快件已顺利签收", desc: "<b class=\"term-resource\">光能</b>充满时，灯灯共鸣技能（强化·前扑/后撤）伤害倍率额外提升 <b class=\"term-num\">100%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"teamAtk","value":0.2,"label":"给个五星好评哦：解放时全队攻击 +20%"},
      text: { name: "给个五星好评哦", desc: "灯灯施放<b class=\"term-burst\">共鸣解放·啾啾专送</b>时，队伍中所有角色攻击加成提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">3</b> 回合。" },
    }
    ],
  },
  // 守岸人 共鸣链文案 — 实装文案,机制依据 src/battle/characters/shorekeeper.js + 设计稿 docs/plans/characters/守岸人.md §5
  "守岸人": {
    character: "守岸人",
    chains: [
    {
      index: 1,
      effect: {"effect":"fieldExtend","duration":2,"persistOnSwitch":true},
      text: { name: "不语者假想", desc: "<b class=\"term-burst\">共鸣解放·终末回环</b>展开的<b class=\"term-resource\">星域</b>获得加强：<br>· 持续时间由 <b class=\"term-num\">3</b> 回合延长至 <b class=\"term-num\">5</b> 回合。<br>· 星域内所有增益效果（治疗、暴击率、暴击伤害、攻击力）强度提升至原本的 <b class=\"term-num\">2.5</b> 倍。<br>· 切换角色后，<b class=\"term-resource\">星域</b>不再立即消散，将持续生效至剩余时间归零。" },
    },
    {
      index: 2,
      effect: {"effect":"fieldTeamAtk","value":0.4},
      text: { name: "夜幕的赠予与拒绝", desc: "<b class=\"term-resource\">星域</b>展开期间，全队所有角色的攻击力提升 <b class=\"term-num\">40%</b>。" }
    },
    {
      index: 3,
      effect: {"effect":"burstEnergyRefund","value":20,"cooldown":2},
      text: { name: "无限正将我等待", desc: "施放<b class=\"term-burst\">共鸣解放·终末回环</b>时，守岸人额外回复 <b class=\"term-num\">20</b> 点共鸣能量。该效果每 <b class=\"term-num\">2</b> 回合可触发 1 次。" },
    },
    {
      index: 4,
      effect: {"effect":"shorekeeperHeal4","value":0.7},
      text: { name: "万物寂静满溢", desc: "守岸人<b class=\"term-skill\">共鸣技能·混沌理论</b>的全队治疗效果加成提升 <b class=\"term-num\">70%</b>。" }
    },
    {
      index: 5,
      effect: {"effect":"normalSplit","value":2},
      text: { name: "来自缄默的回声", desc: "<b class=\"term-normal\">普攻·真源构演</b>命中目标后，对一名相邻敌人造成等同本次普攻的<b class=\"term-normal\">衍射伤害</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"variationDmg","value":5},
      text: { name: "我所驶向的新世界", desc: "协奏值满时切换角色，入场角色的<b class=\"term-variation\">变奏技能·洞悉</b>伤害倍率提升至原本的 <b class=\"term-num\">6</b> 倍。" },
    }
    ],
  },
  "赞妮": {
    character: "赞妮",
    chains: [
    {
      index: 1,
      // 状态机 onSkill：2 回合衍射 +50%；勿写常驻 elemDmg
      effect: {"effect":"zanyanSkillElemBuff","value":0.5,"duration":2,"label":"施放共鸣技能后衍射伤害 +50%（2 回合）"},
      text: { name: "当清晨闹钟响起时", desc: "赞妮施放<b class=\"term-skill\">共鸣技能</b>后，衍射伤害加成提升 <b class=\"term-num\">50%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 2,
      // crate 常驻；技能倍率 +80% 在 hpMult/skillMult 状态机
      effect: {"effect":"crate","value":0.2,"label":"暴击 +20%·共鸣技能倍率 +80%"},
      text: { name: "冷面包配饮料", desc: "赞妮暴击提升 <b class=\"term-num\">20%</b>。<b class=\"term-skill\">共鸣技能</b>倍率提升 <b class=\"term-num\">80%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"zanyanBurstFinaleBoost","value":0.02,"cap":2.0,"label":"灼焰形态:每消耗1焰光,终绝将至之刻倍率+2%(上限+200%)"},
      text: { name: "日复一日的通勤", desc: "赞妮处于<b class=\"term-state\">灼焰形态</b>时，每消耗 <b class=\"term-num\">1</b> 点<b class=\"term-resource\">焰光</b>，本次<b class=\"term-burst\">共鸣解放·终绝将至之刻</b>倍率提升 <b class=\"term-num\">2%</b>，最多提升 <b class=\"term-num\">200%</b>。" },
    },
    {
      index: 4,
      // 状态机 switchIn；勿写 teamAtk 常驻光环
      effect: {"effect":"zanyanVariationTeamAtk","value":0.2,"duration":2,"label":"变奏·即刻执行时全队攻击 +20%（2 回合）"},
      text: { name: "高效节能主义者", desc: "赞妮施放<b class=\"term-variation\">变奏技能·即刻执行</b>时，队伍中所有角色攻击加成提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      // 状态机 rekindle ×2.2；勿写 burstDmg 全局
      effect: {"effect":"zanyanRekindleBoost","value":1.2,"label":"共鸣解放·重燃倍率 +120%"},
      text: { name: "一切需求按时完成", desc: "赞妮<b class=\"term-burst\">共鸣解放·重燃</b>倍率提升 <b class=\"term-num\">120%</b>。" },
    },
    {
      index: 6,
      // 状态机重斩×1.4 + 焰光回复 + 致死不倒；勿写 heavyDmg 全局
      effect: {"effect":"zanyanHeavySlashBoost","value":0.4,"label":"重斩×1.4 · 焰光回复 · 致死不倒"},
      text: { name: "当务之急？下班！", desc: "赞妮<b class=\"term-heavy\">重斩</b>倍率提升 <b class=\"term-num\">40%</b>。<b class=\"term-state\">灼焰形态</b>期间<b class=\"term-resource\">焰光</b>低于 <b class=\"term-num\">70</b> 点时立即回复至 <b class=\"term-num\">70</b> 点，每场战斗可触发 <b class=\"term-num\">1</b> 次。灼焰形态期间受到致死伤害时不会倒下，最少保留 <b class=\"term-num\">1</b> 点生命值，每场战斗可触发 <b class=\"term-num\">1</b> 次。" },
    }
    ],
  },
  "夏空": {
    character: "夏空",
    chains: [
    {
      index: 1,
      // 进音律独奏时 atkUp 2 回由 xiakong.js；勿写 flat atk 常驻
      effect: {"effect":"xiakongC1Atk","value":0.35,"duration":2,"label":"进入音律独奏时攻击 +35%（2 回合）"},
      text: { name: "故风的吟游序曲", desc: "夏空进入<b class=\"term-resource\">音律独奏</b>时，自身攻击力 +<b class=\"term-num\">35%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 2,
      // 演绎期间全队 elemAeroUp 由 xiakong.js；勿写 teamElemDmg 常驻
      effect: {"effect":"xiakongC2Aero","value":0.4,"duration":2,"label":"演绎期间全队气动 +40%"},
      text: { name: "四季的连奏之音", desc: "夏空处于<b class=\"term-state\">演绎状态</b>期间，全队所有存活角色的气动伤害加成 +<b class=\"term-num\">40%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"skillCdReduce","value":1,"label":"共鸣技能冷却 -1 回合；普攻额外 +1 音律"},
      text: { name: "星烁此时的即兴演奏", desc: "<b class=\"term-normal\">普攻</b>额外获得 <b class=\"term-num\">1</b> 格<b class=\"term-resource\">音律</b>。<b class=\"term-skill\">共鸣技能</b>冷却时间从 <b class=\"term-num\">3</b> 回合缩短为 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 4,
      // extraPierce hook 仅 heavy/burst；勿写 flat defPierce 常驻
      effect: {"effect":"xiakongC4Pierce","value":0.45,"label":"四拍重奏/解放无视 45% 防御"},
      text: { name: "托卡塔与赋格", desc: "<b class=\"term-heavy\">重击·四拍重奏</b>和<b class=\"term-burst\">共鸣解放·歌者的三重华彩</b>无视敌人 <b class=\"term-num\">45%</b> 防御。" },
    },
    {
      index: 5,
      // burstDmg flat OK；全队 allDmgDown 由 onBurst 状态机
      effect: {"effect":"burstDmg","value":0.4,"label":"共鸣解放伤害 +40%；演绎期间全队减伤 30%"},
      text: { name: "献予长夏的永恒叙诗", desc: "<b class=\"term-burst\">共鸣解放</b>伤害 +<b class=\"term-num\">40%</b>。全队所有存活角色受到伤害 -<b class=\"term-num\">30%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 6,
      effect: {"effect":"xiakongSoloEntryDmg","value":2.2,"label":"进入音律独奏时造成 220% 气动伤害（视为共鸣解放伤害）"},
      text: { name: "终曲未终", desc: "夏空进入<b class=\"term-resource\">音律独奏</b>状态时，对周围目标造成攻击力 <b class=\"term-num\">220%</b> 的气动伤害（视为<b class=\"term-burst\">共鸣解放</b>伤害类型）。每回合最多触发 <b class=\"term-num\">1</b> 次。" },
    }
    ],
  },
  "露帕": {
    character: "露帕",
    chains: [
    {
      index: 1,
      effect: {"effect":"lupaC1Crate","value":0.2,"label":"解放时暴击 +20%"},
      text: { name: "看那无名之人", desc: "露帕施放<b class=\"term-burst\">共鸣解放·荣光欢酣于火</b>时，此次伤害的暴击率提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"lupaC2TeamFusion","value":0.4,"element":"热熔","label":"解放/重击/狼舞时全队热熔 +40%"},
      text: { name: "所处皆为猎场", desc: "露帕施放<b class=\"term-burst\">共鸣解放</b>、<b class=\"term-heavy\">重击</b>或<b class=\"term-heavy\">狼舞·决意·极</b>时，队伍中所有角色热熔伤害加成提升 <b class=\"term-num\">40%</b>，持续 <b class=\"term-num\">4</b> 回合。" },
    },
    {
      index: 3,
      effect: {"effect":"lupaC3GloryVar","value":0.15,"label":"荣光 15% + 变奏×2"},
      text: { name: "狼影随焰咆哮", desc: "露帕<b class=\"term-variation\">变奏技能</b>的伤害倍率提升 <b class=\"term-num\">100%</b>。<b class=\"term-resource\">荣光</b>对热熔抗性的无视效果提升至 <b class=\"term-num\">15%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"lupaC4Langwu","value":1.25,"label":"狼舞·决意·极倍率 +125%"},
      text: { name: "旗帜于火飞扬", desc: "露帕<b class=\"term-heavy\">狼舞·决意·极</b>的伤害倍率提升 <b class=\"term-num\">125%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"lupaC5BurstAfterVar","value":0.15,"label":"变奏后解放伤害 +15%"},
      text: { name: "胜利让掌声喝彩", desc: "露帕施放<b class=\"term-variation\">变奏技能</b>后，<b class=\"term-burst\">共鸣解放</b>伤害加成提升 <b class=\"term-num\">15%</b>，持续 <b class=\"term-num\">1</b> 回合。" },
    },
    {
      index: 6,
      effect: {"effect":"lupaC6PierceFlame","value":0.3,"label":"狼舞/解放/变奏穿防 + 凶噬回狼焰"},
      text: { name: "致那最闪耀的焰星", desc: "露帕的<b class=\"term-heavy\">狼舞·决意·极</b>、<b class=\"term-burst\">共鸣解放·荣光欢酣于火</b>和<b class=\"term-variation\">变奏技能</b>造成的伤害无视目标 <b class=\"term-num\">30%</b> 防御。<b class=\"term-skill\">共鸣技能·凶噬</b>命中时额外回复 <b class=\"term-num\">100</b> 点<b class=\"term-resource\">狼焰</b>，冷却 <b class=\"term-num\">2</b> 回合。施放<b class=\"term-variation\">变奏技能</b>不再清除<b class=\"term-resource\">追猎</b>和<b class=\"term-resource\">荣光</b>效果。" },
    }
    ],
  },
  "弗洛洛": {
    character: "弗洛洛",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillDmg","value":0.8,"label":"亡与死的乐章/梦呓伤害倍率 +80%"},
      text: { name: "钥匙，通往冥界的奥秘", desc: "亡与死的乐章、永不消逝的梦呓伤害倍率提升 <b class=\"term-num\">80%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"furoloDirgeBoost","valueMult":1.75,"echoBonusMult":1.75,"echoesGain":14,"label":"谱曲终末倍率 +75%；余响增益 +75%；施放时 +14 余响"},
      text: { name: "绳索，重生更新的纽带", desc: "<b class=\"term-heavy\">谱曲终末</b>伤害倍率提升 <b class=\"term-num\">75%</b>，<b class=\"term-resource\">余响</b>对谱曲终末的倍率增加效果提升 <b class=\"term-num\">75%</b>。施放<b class=\"term-heavy\">谱曲终末</b>时获得 <b class=\"term-num\">14</b> 层<b class=\"term-resource\">余响</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"heavyDmg","value":0.8,"label":"谱曲终末伤害 +80%"},
      text: { name: "匕首，消弭妄想的力量", desc: "<b class=\"term-heavy\">谱曲终末</b>的伤害加深 <b class=\"term-num\">80%</b>。<b class=\"term-heavy\">强化追击·赫卡忒</b>命中目标时，目标攻击力降低 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 4,
      effect: {"effect":"teamAllDmg","value":0.2,"label":"谱曲终末时全队全属性伤害 +20%"},
      text: { name: "火炬，新径启行的引导", desc: "施放<b class=\"term-heavy\">谱曲终末</b>时，队伍中的角色全属性伤害加成提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">4</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"furoloCommandDefense","value":0.30,"label":"指挥状态时弗洛洛与赫卡忒受伤 -30%"},
      text: { name: "岔路，穿越生命的要地", desc: "处于<b class=\"term-state\">指挥状态</b>时，弗洛洛与<b class=\"term-resource\">赫卡忒</b>受到的伤害降低 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"elemDmg","value":0.6,"element":"湮灭","label":"指挥状态时湮灭伤害 +60%"},
      text: { name: "深夜，走出安息与终结", desc: "<b class=\"term-heavy\">强化追击·赫卡忒</b>伤害倍率提升 <b class=\"term-num\">24%</b>。施放<b class=\"term-normal\">普攻</b>或<b class=\"term-skill\">共鸣技能</b>时召唤<b class=\"term-resource\">赫卡忒</b>追击 <b class=\"term-num\">1</b> 次（造成弗洛洛最大生命 <b class=\"term-num\">8%</b> 的湮灭伤害），并获得 <b class=\"term-num\">8</b> 层<b class=\"term-resource\">余响</b>。<b class=\"term-state\">指挥状态</b>期间，弗洛洛为登场角色时湮灭伤害加成提升 <b class=\"term-num\">60%</b>；弗洛洛为非登场角色时，目标受到<b class=\"term-resource\">赫卡忒</b>和弗洛洛的伤害提升 <b class=\"term-num\">40%</b>。" },
    }
    ],
  },
  "奥古斯塔": {
    character: "奥古斯塔",
    chains: [
    {
      index: 1,
      effect: {"effect":"cdmg","value":0.3,"label":"以众愿为冕：暴击伤害 +15%/层 × 2 层"},
      text: { name: "于焦壤中蒙垢", desc: "每层<b class=\"term-resource\">以众愿为冕</b>使暴击伤害提升 <b class=\"term-num\">15%</b>。<b class=\"term-resource\">以众愿为冕</b>的上限提高至 <b class=\"term-num\">2</b> 层。施放<b class=\"term-variation\">变奏技能·灼金的巡行</b>时获得 <b class=\"term-num\">1</b> 层<b class=\"term-resource\">以众愿为冕</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"crate","value":0.2,"label":"以众愿为冕：每层暴击 +20%"},
      text: { name: "于血戮中涤尘", desc: "每层<b class=\"term-resource\">以众愿为冕</b>使暴击提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.25,"label":"重击/闪反/技能/解放倍率 +25%"},
      text: { name: "于朽腐中砺骨", desc: "<b class=\"term-heavy\">烁雷</b>系列重击、<b class=\"term-skill\">不败恒阳·落袭</b>、<b class=\"term-burst\">赫日威临·烈阳</b>、<b class=\"term-burst\">赫日威临·不朽者之肃</b>的伤害倍率提升 <b class=\"term-num\">25%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamAtk","value":0.2,"label":"变奏·灼金的巡行时全队攻击 +20%"},
      text: { name: "于荣辉中孤行", desc: "施放<b class=\"term-variation\">变奏技能·灼金的巡行</b>时，队伍中所有角色的攻击提升 <b class=\"term-num\">20%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"defense","value":0.30,"label":"减伤30%"},
      text: { name: "于怒潮中卓立", desc: "获得减伤 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"cdmg","value":0.6,"label":"以众愿为冕：上限 4 层，暴击伤害 +60%"},
      text: { name: "于耀光中刻名", desc: "<b class=\"term-resource\">以众愿为冕</b>的上限提升至 <b class=\"term-num\">4</b> 层。施放<b class=\"term-heavy\">重击·烁雷</b>时，额外获得 <b class=\"term-num\">2</b> 层<b class=\"term-resource\">以众愿为冕</b>，并在原地引发<b class=\"term-heavy\">怒霆</b>，造成两次最大生命 <b class=\"term-num\">4.5%</b> 的导电伤害。" },
    }
    ],
  },
  "尤诺": {
    character: "尤诺",
    chains: [
    {
      index: 1,
      // 月相流转 atkUp 由 younuo.js 状态机挂；勿写 flat atk 常驻
      effect: {"effect":"younuoMoonAtk","value":0.4,"label":"月相流转时攻击 +40%"},
      text: { name: "圆与缺，皆替金枝镀色", desc: "尤诺处于<b class=\"term-resource\">月相流转</b>状态时，攻击提升 <b class=\"term-num\">40%</b>。" },
    },
    {
      index: 2,
      // 变奏/解放时 allDmgUp 由 younuo.js；勿写 teamAllDmg 常驻
      effect: {"effect":"younuoC2TeamAllDmg","value":0.4,"duration":2,"label":"变奏/解放时全队全伤害加深 40%（2 回合）"},
      text: { name: "昼或夜，且以它为永恒", desc: "尤诺施放<b class=\"term-variation\">变奏</b>或<b class=\"term-burst\">共鸣解放</b>时，队伍中的角色全伤害加深 <b class=\"term-num\">40%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 3,
      // 月相流转 allDmgUp 由 younuo.js；勿写 flat allDmg 常驻
      effect: {"effect":"younuoMoonAllDmg","value":0.65,"label":"月相流转中全伤害加深 65%"},
      text: { name: "我痛饮他者的遗忘", desc: "尤诺处于<b class=\"term-resource\">月相流转</b>状态时，造成的伤害加深 <b class=\"term-num\">65%</b>。" },
    },
    {
      index: 4,
      // 至臻完满后全队 atkUp 由 younuo.js；勿写 teamAtk 常驻
      effect: {"effect":"younuoC4TeamAtk","value":0.1,"duration":3,"label":"至臻完满时全队攻击 +10%（3 回合）"},
      text: { name: "任雨季栖息于眼眸", desc: "施放<b class=\"term-heavy\">重击·至臻的完满</b>时，队伍中的角色攻击提升 <b class=\"term-num\">10%</b>，持续 <b class=\"term-num\">3</b> 回合。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":0.2,"label":"共鸣解放伤害 +20%"},
      text: { name: "万千次虚掷的注视", desc: "<b class=\"term-burst\">共鸣解放</b>伤害加成提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 6,
      // 至臻完满 ×2000% + 重置循环由 younuo.js；勿写 flat heavyDmg
      effect: {"effect":"younuoZhenWanC6","value":16,"label":"至臻完满倍率 +1600%；施放后重置月相"},
      text: { name: "我所在，即为不变的独一", desc: "<b class=\"term-heavy\">重击·至臻的完满</b>伤害倍率增加 <b class=\"term-num\">1600%</b>。尤诺施放<b class=\"term-heavy\">重击·至臻的完满</b>时，会再次进入<b class=\"term-resource\">月相流转</b>状态，获得 <b class=\"term-num\">100</b> 点<b class=\"term-resource\">灵性</b>并重置<b class=\"term-skill\">共鸣技能·越限的弦引</b>的全部冷却。" },
    }
    ],
  },
  "仇远": {
    character: "仇远",
    chains: [
    {
      index: 1,
      effect: {"effect":"crate","value":0.2,"label":"暴击 +20%"},
      text: { name: "如剑不动，相由心生", desc: "仇远暴击提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 2,
      // 竹照额外 +30% 由 chouyuan.js applyBambooBuff 状态机挂 elemAllUp；勿写 teamAllDmg 常驻
      effect: {"effect":"chouyuanBambooC2","value":0.3,"label":"竹照时全队全属性伤害额外 +30%"},
      text: { name: "剑啊，谓我弃绝弦歌不辍", desc: "<b class=\"term-resource\">竹照</b>获得时增加额外效果：队伍中的角色全属性伤害加深 <b class=\"term-num\">30%</b>，持续 <b class=\"term-num\">3</b> 回合。" },
    },
    {
      index: 3,
      // 解放 +500% / 荷蓑出林 / 答剑+600% 均由 chouyuan.js 状态机；勿写 flat burstDmg
      effect: {"effect":"chouyuanC3HeSuo","value":5.0,"label":"解放倍率 +500%；荷蓑出林 / 答剑+600%"},
      text: { name: "剑啊，谓我弃绝割股之心", desc: "<b class=\"term-burst\">共鸣解放·万钧一断</b>伤害倍率增加 <b class=\"term-num\">500%</b>。协奏能量充满且不处于<b class=\"term-state\">淋漓醉墨</b>状态下时，<b class=\"term-skill\">共鸣技能</b>替换为<b class=\"term-skill\">荷蓑出林</b>，每场战斗可施放 <b class=\"term-num\">1</b> 次。施放<b class=\"term-skill\">荷蓑出林</b>时消耗 <b class=\"term-num\">60</b> 点协奏能量并回复<b class=\"term-resource\">挑灯问剑</b>至满值，对目标造成 <b class=\"term-num\">500%</b> 攻击的气动伤害。施放<b class=\"term-skill\">荷蓑出林</b>后下次进入<b class=\"term-state\">淋漓醉墨</b>时<b class=\"term-heavy\">答剑三连</b>伤害倍率增加 <b class=\"term-num\">600%</b>，延奏替换为<b class=\"term-variation\">新筠坠箨</b>（<b class=\"term-num\">500%</b> 攻击气动伤害）。" },
    },
    {
      index: 4,
      effect: {"effect":"atk","value":0.2,"label":"攻击 +20%"},
      text: { name: "剑啊，谓我弃绝忠烈死节", desc: "仇远攻击提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"defPierce","value":0.15,"label":"无视目标 15% 防御"},
      text: { name: "剑啊，如今我弹铗而歌", desc: "仇远无视目标 <b class=\"term-num\">15%</b> 的防御。" },
    },
    {
      index: 6,
      // 退出 AOE / 荷蓑暴伤 / 停滞 由 chouyuan.js；勿写 flat cdmg 常驻
      effect: {"effect":"chouyuanC6Exit","value":6.0,"label":"退出淋漓醉墨 600% AOE；荷蓑出林暴伤 +100%"},
      text: { name: "如是我闻、我见、我言", desc: "退出<b class=\"term-state\">淋漓醉墨</b>状态且为队伍中登场角色时，对范围内敌人造成自身 <b class=\"term-num\">600%</b> 攻击的气动伤害。施放<b class=\"term-skill\">荷蓑出林</b>时，仇远暴击伤害增加 <b class=\"term-num\">100%</b>，持续 <b class=\"term-num\">1</b> 回合。" },
    }
    ],
  },
  "千咲": {
    character: "千咲",
    chains: [
    {
      index: 1,
      // 状态机 onSkill：挂绞痕时 atkUp +30%×2 回；勿写 flat atk（会常驻双算）
      effect: {"effect":"qianxiaoMarkAtk","value":0.3,"duration":2,"label":"附加虚无绞痕时攻击 +30%（2 回合）"},
      text: { name: "穿行于荒芜长廊", desc: "千咲附加<b class=\"term-resource\">虚无绞痕</b>时，自身攻击提升 <b class=\"term-num\">30%</b>，持续 <b class=\"term-num\">2</b> 回合。" },
    },
    {
      index: 2,
      // 状态机挂虚湮之线 buff；勿写 teamAllDmg 常驻光环
      effect: {"effect":"qianxiaoVoidLine","value":0.5,"label":"虚湮之线：全队全属性伤害 +50%"},
      text: { name: "织作牵绊的弦网", desc: "队伍中的角色处于<b class=\"term-resource\">虚湮之线</b>状态时，全属性伤害加成提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 3,
      // 状态机锯环倍率 +120% 与万缕加法；勿写 skillDmg 全局
      effect: {"effect":"qianxiaoSawBoost","value":1.2,"label":"锯环疾攻/终结倍率 +120%"},
      text: { name: "踱过长夜的迷惘", desc: "<b class=\"term-normal\">锯环·疾攻</b>、<b class=\"term-heavy\">锯环·终结</b>的伤害倍率提升 <b class=\"term-num\">120%</b>，该倍率提升效果与<b class=\"term-resource\">万缕·汇终</b>的倍率提升效果相互叠加。" },
    },
    {
      index: 4,
      // 状态机 tick 每回叠 2 层；勿写 allDmg
      effect: {"effect":"qianxiaoErosionCap","value":2,"label":"虚湮效应每回叠加上限 2 层"},
      text: { name: "斩断循环的劫章", desc: "<b class=\"term-resource\">虚湮效应</b>每回合叠加上限提升至 <b class=\"term-num\">2</b> 层。" },
    },
    {
      index: 5,
      // 状态机 resolveBurstMult ×2；勿写 burstDmg 全局
      effect: {"effect":"qianxiaoBurstBoost","value":1,"label":"共鸣解放·即刻·归无伤害 +100%"},
      text: { name: "万盏灯火将照亮归途所向", desc: "<b class=\"term-burst\">共鸣解放·即刻·归无</b>伤害加成提升 <b class=\"term-num\">100%</b>。" },
    },
    {
      index: 6,
      // 状态机 onLethal + 终焉 mark×1.4；勿写 allDmg 常驻
      effect: {"effect":"qianxiaoTerminal","value":0.4,"label":"终焉：对标记目标伤害 +40% · 电锯致死不倒"},
      text: { name: "由此重铸希望，与天光", desc: "千咲施放<b class=\"term-normal\">锯环·疾攻</b>、<b class=\"term-heavy\">锯环·终结</b>期间受到致死伤害时不会倒下，最少保留 <b class=\"term-num\">1</b> 点生命（每场 <b class=\"term-num\">1</b> 次）。<b class=\"term-resource\">虚无绞痕</b>强化为<b class=\"term-resource\">虚无绞痕·终焉</b>：千咲对带有终焉标记的目标造成的伤害提升 <b class=\"term-num\">40%</b>。" },
    }
    ],
  },
  "琳奈": {
    character: "琳奈",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillDmg","value":0.3,"label":"共鸣技能伤害 +30%"},
      text: { name: "应是肆意挥洒的年华", desc: "琳奈<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"allDmg","value":0.25,"label":"自身伤害 +25%"},
      text: { name: "驶向光彩交绘的彼方", desc: "琳奈造成的伤害提升 <b class=\"term-num\">25%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"normalDmg","value":0.45,"label":"普攻伤害 +45%"},
      text: { name: "为一瞬的绚烂", desc: "琳奈<b class=\"term-normal\">普攻</b>伤害提升 <b class=\"term-num\">45%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"atk","value":0.2,"label":"攻击 +20%"},
      text: { name: "灰影随风呼啸而去", desc: "琳奈攻击提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":0.7,"label":"共鸣解放伤害 +70%"},
      text: { name: "不羁未来的映想", desc: "琳奈<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">70%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"normalDmg","value":0.6,"label":"普攻伤害 +60%"},
      text: { name: "以「我」为名的真彩", desc: "琳奈<b class=\"term-normal\">普攻</b>伤害提升 <b class=\"term-num\">60%</b>。" },
    }
    ],
  },
  "莫宁": {
    character: "莫宁",
    chains: [
    {
      index: 1,
      effect: {"effect":"allDmg","value":0.15,"label":"自身伤害 +15%"},
      text: { name: "缄默的观测者", desc: "莫宁造成的伤害提升 <b class=\"term-num\">15%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"teamCdmg","value":0.32,"label":"全队暴击伤害 +32%"},
      text: { name: "熵增的启明星", desc: "全队所有角色暴击伤害提升 <b class=\"term-num\">32%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.2,"label":"共鸣技能伤害 +20%"},
      text: { name: "递归的蓝图", desc: "莫宁<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"hp","value":0.06,"label":"生命上限 +6%"},
      text: { name: "宇宙的隐变量", desc: "莫宁生命上限提升 <b class=\"term-num\">6%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":0.5,"label":"共鸣解放伤害 +50%"},
      text: { name: "钟慢效应", desc: "莫宁<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"burstDmg","value":0.8,"label":"共鸣解放伤害 +80%"},
      text: { name: "直到群星的尽头", desc: "莫宁<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">80%</b>。" },
    }
    ],
  },
  "爱弥斯": {
    character: "爱弥斯",
    chains: [
    {
      index: 1,
      effect: {"effect":"heavyDmg","value":0.5,"label":"重击伤害 +50%"},
      text: { name: "如金粉般洒落的初煦", desc: "爱弥斯<b class=\"term-heavy\">重击</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"skillDmg","value":1,"label":"共鸣技能伤害 +100%"},
      text: { name: "如雪绒般漂浮的音符", desc: "爱弥斯<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">100%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":0.5,"label":"共鸣解放伤害 +50%"},
      text: { name: "炽烈在静默间延展如初", desc: "爱弥斯<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamAllDmg","value":0.2,"label":"全队伤害 +20%"},
      text: { name: "于无垠电子海间轻舞", desc: "全队所有角色造成的伤害提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"hp","value":0.1,"label":"生命上限 +10%"},
      text: { name: "远航至那星海尽处", desc: "爱弥斯生命上限提升 <b class=\"term-num\">10%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"elemDmg","value":0.4,"element":"导电","label":"导电伤害 +40%"},
      text: { name: "春风祝颂你的旅途", desc: "爱弥斯导电伤害加成提升 <b class=\"term-num\">40%</b>。" },
    }
    ],
  },
  "陆·赫斯": {
    character: "陆·赫斯",
    chains: [
    {
      index: 1,
      effect: {"effect":"allDmg","value":0.1,"label":"自身伤害 +10%"},
      text: { name: "流金于灰白中灼烧", desc: "陆·赫斯造成的伤害提升 <b class=\"term-num\">10%</b>。" }
    },
    {
      index: 2,
      effect: {"effect":"burstDmg","value":0.6,"label":"共鸣解放伤害 +60%"},
      text: { name: "眼底尚有雪崩未止", desc: "陆·赫斯<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">60%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.5,"label":"共鸣技能伤害 +50%"},
      text: { name: "金雨浇筑你的脊骨", desc: "陆·赫斯<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamAllDmg","value":0.2,"label":"全队伤害 +20%"},
      text: { name: "冻土之下，亦有新生", desc: "全队所有角色造成的伤害提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"skillDmg","value":0.5,"label":"共鸣技能伤害 +50%"},
      text: { name: "穿过风雪构筑的静场", desc: "陆·赫斯<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">50%</b>。" }
    },
    {
      index: 6,
      effect: {"effect":"allDmg","value":0.3,"label":"自身伤害 +30%"},
      text: { name: "冰原之上，铺开无垠曦光", desc: "陆·赫斯造成的伤害提升 <b class=\"term-num\">30%</b>。" },
    }
    ],
  },
  "西格莉卡": {
    character: "西格莉卡",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillDmg","value":0.7,"label":"共鸣技能伤害 +70%"},
      text: { name: "那本该闪耀的光辉", desc: "西格莉卡<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">70%</b>。" }
    },
    {
      index: 2,
      effect: {"effect":"skillDmg","value":0.6,"label":"共鸣技能伤害 +60%"},
      text: { name: "那深含期待的苦涩", desc: "西格莉卡<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">60%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.25,"label":"共鸣技能伤害 +25%"},
      text: { name: "逃避着，寻找着", desc: "西格莉卡<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">25%</b>。" }
    },
    {
      index: 4,
      effect: {"effect":"teamAtk","value":0.2,"label":"全队攻击 +20%"},
      text: { name: "失去着，收获着", desc: "全队所有角色攻击提升 <b class=\"term-num\">20%</b>。" }
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":0.3,"label":"共鸣解放伤害 +30%"},
      text: { name: "直到沉于影下", desc: "西格莉卡<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"allDmg","value":0.3,"label":"自身伤害 +30%"},
      text: { name: "语义点亮，光芒升起", desc: "西格莉卡造成的伤害提升 <b class=\"term-num\">30%</b>。" },
    }
    ],
  },
  "绯雪": {
    character: "绯雪",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillDmg","value":0.6,"label":"共鸣技能伤害 +60%"},
      text: { name: "不见春", desc: "绯雪<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">60%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"skillDmg","value":0.6,"label":"共鸣技能伤害 +60%"},
      text: { name: "于无声处冰冷燃烧", desc: "绯雪<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">60%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"heavyDmg","value":0.8,"label":"重击伤害 +80%"},
      text: { name: "我身无我亦无穷", desc: "绯雪<b class=\"term-heavy\">重击</b>伤害提升 <b class=\"term-num\">80%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamAllDmg","value":0.2,"label":"全队伤害 +20%"},
      text: { name: "有如苇草浮沉", desc: "全队所有角色造成的伤害提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"skillDmg","value":0.8,"label":"共鸣技能伤害 +80%"},
      text: { name: "千祈万愿尽求我身", desc: "绯雪<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">80%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"elemDmg","value":0.4,"element":"冷凝","label":"冷凝伤害 +40%"},
      text: { name: "纵使前路永夜无终", desc: "绯雪冷凝伤害加成提升 <b class=\"term-num\">40%</b>。" },
    }
    ],
  },
  "达妮娅": {
    character: "达妮娅",
    chains: [
    {
      index: 1,
      effect: {"effect":"cdmg","value":0.3,"label":"暴击伤害 +30%"},
      text: { name: "薄明梦中的寂静光辉", desc: "达妮娅暴击伤害提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"teamElemDmg","value":0.3,"element":"热熔","label":"全队热熔伤害 +30%"},
      text: { name: "坠入此世一片潮水", desc: "全队所有角色热熔伤害加成提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":0.8,"label":"共鸣解放伤害 +80%"},
      text: { name: "黑夜风中奔驰着赤杨", desc: "达妮娅<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">80%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"allDmg","value":0.1,"label":"自身伤害 +10%"},
      text: { name: "从远方，回到远方", desc: "达妮娅造成的伤害提升 <b class=\"term-num\">10%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"burstDmg","value":0.5,"label":"共鸣解放伤害 +50%"},
      text: { name: "若能以谎言缝补心脏", desc: "达妮娅<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"atk","value":0.6,"label":"攻击 +60%"},
      text: { name: "祝愿你于静默中，得到太阳", desc: "达妮娅攻击提升 <b class=\"term-num\">60%</b>。" },
    }
    ],
  },
  "露西": {
    character: "露西",
    chains: [
    {
      index: 1,
      effect: {"effect":"atk","value":0.2,"label":"攻击 +20%"},
      text: { name: "月球、船票与梦想", desc: "露西攻击提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"heavyDmg","value":0.5,"label":"重击伤害 +50%"},
      text: { name: "黑墙、过去与逃离", desc: "露西<b class=\"term-heavy\">重击</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":0.5,"label":"共鸣解放伤害 +50%"},
      text: { name: "赛博朋克", desc: "露西<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"teamAllDmg","value":0.2,"label":"全队伤害 +20%"},
      text: { name: "夜之城没有活着的传奇", desc: "全队所有角色造成的伤害提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"hp","value":0.1,"label":"生命上限 +10%"},
      text: { name: "前往地狱的断路", desc: "露西生命上限提升 <b class=\"term-num\">10%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"allDmg","value":0.3,"label":"自身伤害 +30%"},
      text: { name: "I Really Want to Stay At Your House", desc: "露西造成的伤害提升 <b class=\"term-num\">30%</b>。" },
    }
    ],
  },
  "丽贝卡": {
    character: "丽贝卡",
    chains: [
    {
      index: 1,
      effect: {"effect":"skillDmg","value":0.5,"label":"共鸣技能伤害 +50%"},
      text: { name: "请多指教咯~", desc: "丽贝卡<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"teamAllDmg","value":0.2,"label":"全队伤害 +20%"},
      text: { name: "哦，原来是你啊！", desc: "全队所有角色造成的伤害提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"burstDmg","value":0.6,"label":"共鸣解放伤害 +60%"},
      text: { name: "背后就交给我吧！", desc: "丽贝卡<b class=\"term-burst\">共鸣解放</b>伤害提升 <b class=\"term-num\">60%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"allDmg","value":0.3,"label":"自身伤害 +30%"},
      text: { name: "我会保护你的！", desc: "丽贝卡造成的伤害提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"normalDmg","value":0.2,"label":"普攻伤害 +20%"},
      text: { name: "边缘幻梦", desc: "丽贝卡<b class=\"term-normal\">普攻</b>伤害提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"normalDmg","value":0.4,"label":"普攻伤害 +40%"},
      text: { name: "也许……", desc: "丽贝卡<b class=\"term-normal\">普攻</b>伤害提升 <b class=\"term-num\">40%</b>。" },
    }
    ],
  },
  "洛瑟菈": {
    character: "洛瑟菈",
    chains: [
    {
      index: 1,
      effect: {"effect":"crate","value":0.2,"label":"暴击 +20%"},
      text: { name: "遥远的晌午", desc: "洛瑟菈暴击提升 <b class=\"term-num\">20%</b>。" },
    },
    {
      index: 2,
      effect: {"effect":"elemDmg","value":0.4,"element":"湮灭","label":"湮灭伤害 +40%"},
      text: { name: "酣睡的月光", desc: "洛瑟菈湮灭伤害加成提升 <b class=\"term-num\">40%</b>。" },
    },
    {
      index: 3,
      effect: {"effect":"skillDmg","value":0.5,"label":"共鸣技能伤害 +50%"},
      text: { name: "时间自无声处逝", desc: "洛瑟菈<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 4,
      effect: {"effect":"atk","value":0.3,"label":"攻击 +30%"},
      text: { name: "过去悄然沉默", desc: "洛瑟菈攻击提升 <b class=\"term-num\">30%</b>。" },
    },
    {
      index: 5,
      effect: {"effect":"skillDmg","value":0.5,"label":"共鸣技能伤害 +50%"},
      text: { name: "岁月如溪水", desc: "洛瑟菈<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">50%</b>。" },
    },
    {
      index: 6,
      effect: {"effect":"skillDmg","value":1,"label":"共鸣技能伤害 +100%"},
      text: { name: "在如烟的时间里张望", desc: "洛瑟菈<b class=\"term-skill\">共鸣技能</b>伤害提升 <b class=\"term-num\">100%</b>。" },
    }
    ],
  }
};
