// 共鸣链战斗效果数据（纯数据，无逻辑）
// 由 chains.js 导入使用。
//
// 说明：
// · 共鸣链官方文案（chains-extracted.json）作为 UI 展示与提示语
// · 这里只列战斗折算的【模拟器可用字段】，把"层数 / 状态 / 触发 / CD"统一近似为
//   永久 buff 或一次性强化，以贴合 AP 回合制
// · 守岸人/忌炎/吟霖/安可 单独走 combat.js 的特殊路径
// · 其余角色字段都来自 applyChainBonuses / applyTeamAuras 已支持的标准 case

export const CHAIN_BATTLE_EFFECTS = {
  // ─────────────────────────────────────────────────────────────
  // 1.0 · 忌炎（主C 气动 长刃）— 「锐意之势」爆发解放机
  '忌炎': [
    [{ effect: 'jiyanSkillChargeFaster' }],                                    // 1 链 济世：共鸣技能 CD -1
    [{ effect: 'jiyanTongBian', forteGain: 30, atkUp: 0.28, dur: 2 }],         // 2 链 通变：变奏入场送破阵 + 攻击
    [{ effect: 'jiyanGuanShi', crate: 0.16, cdmg: 0.32, dur: 2 }],             // 3 链 观势：每次出手 暴击/暴伤 buff
    [{ effect: 'jiyanQiZheng', value: 0.25, dur: 2 }],                         // 4 链 奇正：解放后全队重击 +25%
    [{ effect: 'jiyanMingDuan', value: 0.45, dur: 2 }],                        // 5 链 明断：变奏入场 攻击 +45%
    [{ effect: 'jiyanRuiyiUpgrade', cap: 3, perStack: 1.2 }]                   // 6 链 移山：锐意 2→3 + 每层 +120%
  ],

  // 1.0 · 吟霖（副C 导电 音感仪）— 「审判印记」标记型副C
  '吟霖': [
    [{ effect: 'yinlinMarkSkillBonus', value: 0.7 }],                            // 1 链 矛盾的抉择
    [{ effect: 'yinlinMarkRefund', verdict: 5, energy: 5 }],                     // 2 链 牵绊的俘虏
    [{ effect: 'yinlinMarkVuln', value: 0.10 }],                                 // 3 链 无情的断罪
    [{ effect: 'yinlinJudgmentTeamAtk', value: 0.15, dur: 2 }],                  // 4 链 前行的鼓舞
    [{ effect: 'yinlinMarkBurstBonus', value: 0.5 }],                            // 5 链 决意的回响
    [{ effect: 'yinlinJiTing', value: 0.7, dur: 2 }]                             // 6 链 正义的践行
  ],

  // 1.1 · 今汐（主C 衍射 长刃）
  '今汐': [
    [{ effect: 'skillDmg', value: 0.80, label: '惊蛰 4 层 × 20% = 共鸣技能伤害 +80%' }],
    [{ effect: 'atk', value: 0.05, label: '攻击 +5%' }],
    [{ effect: 'atk', value: 0.50, label: '谪仙 2 层 × 25% = 攻击 +50%' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '全队全属性伤害 +20%' }],
    [{ effect: 'burstDmg', value: 1.2, label: '共鸣解放伤害 +120%' }],
    [{ effect: 'skillDmg', value: 0.45, label: '共鸣技能伤害 +45%（消耗韶光时再 +45%）' }]
  ],

  // 1.1 · 长离（主C 热熔 迅刀）
  '长离': [
    [{ effect: 'allDmg', value: 0.10, label: '技能/重击造成伤害 +10%' }],
    [{ effect: 'crate', value: 0.25, label: '获得离火时暴击 +25%' }],
    [{ effect: 'burstDmg', value: 0.80, label: '共鸣解放伤害 +80%' }],
    [{ effect: 'teamAtk', value: 0.20, label: '全队攻击 +20%' }],
    [{ effect: 'heavyDmg', value: 1.0, label: '重击伤害 +100%' }],
    [{ effect: 'defPierce', value: 0.40, label: '无视目标 40% 防御' }]
  ],

  // 1.4 · 椿（主C 湮灭 迅刀）
  '椿': [
    [{ effect: 'cdmg', value: 0.28, label: '变奏后暴击伤害 +28%' }],
    [{ effect: 'skillDmg', value: 1.2, label: '共鸣回路一日花倍率 +120%' }],
    [{ effect: 'burstDmg', value: 0.50, label: '共鸣解放伤害 +50%' },
     { effect: 'atk',      value: 0.58, label: '含苞状态攻击 +58%' }],
    [{ effect: 'teamNormalDmg', value: 0.25, label: '全队普攻伤害 +25%' }],
    [{ effect: 'variationDmg', value: 3.03, label: '变奏倍率 +303%' }],
    [{ effect: 'skillDmg', value: 1.50, label: '酣梦倍率额外 +150%' }]
  ],

  // 2.0 · 珂莱塔（主C 冷凝 佩枪）
  '珂莱塔': [
    [{ effect: 'crate', value: 0.125, label: '对解离目标暴击 +12.5%' }],
    [{ effect: 'burstDmg', value: 1.26, label: '共鸣解放伤害 +126%' }],
    [{ effect: 'skillDmg', value: 0.93, label: '共鸣技能伤害 +93%' }],
    [{ effect: 'teamSkillDmg', value: 0.25, label: '全队共鸣技能伤害 +25%' }],
    [{ effect: 'heavyDmg', value: 0.47, label: '末路见行（重击）伤害 +47%' }],
    [{ effect: 'burstDmg', value: 1.866, label: '死兆伤害 +186.6%' }]
  ],

  // 2.1 · 菲比（主C 衍射 音感仪）
  '菲比': [
    [{ effect: 'burstDmg', value: 2.25, label: '解放伤害 +225%' }],
    [{ effect: 'allDmg', value: 1.20, label: '对光噪目标全伤害 +120%' }],
    [{ effect: 'heavyDmg', value: 0.91, label: '重击星辉伤害 +91%' }],
    [{ effect: 'teamElemDmg', value: 0.10, element: '衍射', label: '全队衍射伤害 +10%' }],
    [{ effect: 'elemDmg', value: 0.12, element: '衍射', label: '自身衍射伤害 +12%' }],
    [{ effect: 'atk', value: 0.10, label: '镜之环召唤时攻击 +10%' }]
  ],

  // 2.4 · 卡提希娅（主C 气动 迅刀）— 双形态 · 风蚀主线 · HP 核
  // 1 链「因命运戴上冠冕」/ 2 链「听风潮斩断利刃」/ 6 链「尽一线挣扎自由」绑回风蚀主线
  // 3 链定值 +60% 最大生命作为第二次解放伤害加成（不再用 +100% 比例）
  '卡提希娅': [
    [{ effect: 'cartethyiaErosionOnBreak', label: '破韧瞬间 → 主目标 +1 层风蚀' }],
    [{ effect: 'cartethyiaErosionOnSwitchIn', label: '变奏上场 → 主目标 +1 层风蚀' }],
    [{ effect: 'cartethyiaBurstHpBonus', value: 0.60, label: '看潮怒风哮之刃倍率 +60% 最大生命' }],
    [{ effect: 'cartethyiaErosionTeamBuff', value: 0.20, dur: 2, label: '附加风蚀时全队元素伤害 +20%/2 回合（不叠加）' }],
    [{ effect: 'cartethyiaLethalShield', value: 0.20, dur: 2, label: '致命伤不倒 + 20% 生命护盾 / 2 回合（每场 1 次）' }],
    [{ effect: 'cartethyiaBurst2DoubleErosion', label: '第二次解放：风蚀层数翻倍 + 立即结算 1 次 + 不清空' }]
  ],

  // 2.7 · 嘉贝莉娜（主C 热熔 佩枪）
  '嘉贝莉娜': [
    [{ effect: 'cdmg', value: 0.80, label: '余火 10 点 × 8% = 暴击伤害 +80%' }],
    [{ effect: 'atk', value: 1.50, label: '攻击 +150%' }],
    [{ effect: 'burstDmg', value: 1.30, label: '共鸣解放伤害 +130%' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '声骸技能后全队伤害 +20%' }],
    [{ effect: 'skillDmg', value: 1.50, label: '共鸣技能伤害 +150%' }],
    [{ effect: 'allDmg', value: 0.60, label: '永恒位格自身伤害 +60%' },
     { effect: 'elemDmg', value: 0.35, element: '热熔', label: '余火 10 点 × 3.5% = 热熔加深 +35%' }]
  ],

  // 常驻 · 卡卡罗（主C 导电 长刃）
  '卡卡罗': [
    [{ effect: 'energyRefund', value: 10, label: '共鸣技能命中额外回 10 能量' }],
    [{ effect: 'skillDmg', value: 0.30, label: '共鸣技能伤害 +30%' }],
    [{ effect: 'elemDmg', value: 0.25, element: '导电', label: '杀戮武装时自身导电 +25%' }],
    [{ effect: 'teamElemDmg', value: 0.20, element: '导电', label: '延奏后全队导电 +20%' }],
    [{ effect: 'variationDmg', value: 0.50, label: '变奏伤害 +50%' }],
    [{ effect: 'burstDmg', value: 1.00, label: '解放伤害 +100%' }]
  ],

  // 1.2 · 折枝（副C 冷凝 音感仪）— A 级（改造版 · 召唤物）
  '折枝': [
    [{ effect: 'crate', value: 0.10, label: '共鸣技能后暴击 +10%（持续整场）' }],
    [{ effect: 'zhezhiCraneCapBonus', value: 6, label: '墨鹤上限 +6（6 → 12）' }],
    [{ effect: 'atk', value: 0.45, label: '共鸣技能后攻击 +15%×3 = +45%（持续整场）' }],
    [{ effect: 'zhezhiTeamAtk4Chain', value: 0.20, label: '解放时全队攻击 +20%（与领域同寿 3 回合）' }],
    [{ effect: 'zhezhiExtraCrane', value: 0.40, label: '每累计召唤 3 只墨鹤 → 额外 +1 只（140% 追击伤害）' }],
    [{ effect: 'zhezhiWhiteCrane', value: 1.20, label: '共鸣技能额外白鹤 = 共鸣技能 120% 伤害' }]
  ],

  // 1.2 · 相里要（副C 导电 臂铠）— A 级
  '相里要': [
    [{ effect: 'skillDmg', value: 0.48, label: '衍构模体 6×8% = 共鸣技能 +48%' }],
    [{ effect: 'cdmg', value: 0.30, label: '技能/解放后暴击伤害 +30%' }],
    [{ effect: 'skillDmg', value: 0.63, label: '邃古遗墟 5 次 × 63%' }],
    [{ effect: 'teamBurstDmg', value: 0.25, label: '解放时全队共鸣解放 +25%' }],
    [{ effect: 'burstDmg', value: 1.00, label: '共鸣解放伤害倍率 +100%' }],
    [{ effect: 'skillDmg', value: 0.76, label: '幻方加强共鸣技能 +76%' }]
  ],

  // 2.0 · 洛可可（副C 湮灭 臂铠）— B 级
  '洛可可': [
    [{ effect: 'skillDmg', value: 0.20, label: '共鸣技能 +20%（含 100 想象力 / +10 协奏）' }],
    [{ effect: 'teamElemDmg', value: 0.40, element: '湮灭', label: '全队湮灭伤害 +40%（满 3 层 + 加成）' }],
    [{ effect: 'crate', value: 0.10, label: '变奏后暴击 +10%' },
     { effect: 'cdmg', value: 0.30, label: '变奏后暴击伤害 +30%' }],
    [{ effect: 'normalDmg', value: 0.60, label: '共鸣技能后普攻 +60%' }],
    [{ effect: 'burstDmg', value: 0.20, label: '解放开场 +20%' },
     { effect: 'heavyDmg', value: 0.80, label: '解放期间重击 +80%' }],
    [{ effect: 'defPierce', value: 0.60, label: '解放期间普攻无视 60% 防御' }]
  ],

  // 2.1 · 布兰特（辅助 热熔 迅刀）— S 级
  '布兰特': [
    [{ effect: 'atk', value: 0.60, label: '变奏/空中攻击 +20%×3 = +60%' }],
    [{ effect: 'crate', value: 0.30, label: '空中攻击/解放暴击 +30%' }],
    [{ effect: 'burstDmg', value: 0.42, label: '火焰归亡曲伤害倍率 +42%' }],
    [{ effect: 'heal', value: 0.25, label: '治疗加成 +25%' }],
    [{ effect: 'normalDmg', value: 0.15, label: '普攻伤害 +15%' }],
    [{ effect: 'burstDmg', value: 0.30, label: '空中 +30% + 再燃 = 解放伤害 +30%' }]
  ],

  // 2.2 · 坎特蕾拉（副C 湮灭 音感仪）— S 级
  '坎特蕾拉': [
    [{ effect: 'skillDmg', value: 0.50, label: '共鸣技能/感知汲取 +50%' }],
    [{ effect: 'burstDmg', value: 2.45, label: '解放伤害 +245%' }],
    [{ effect: 'burstDmg', value: 3.70, label: '共鸣解放·陷溺伤害 +370%' }],
    [{ effect: 'heal', value: 0.25, label: '蜃境治疗加成 +25%' }],
    [{ effect: 'burstDmg', value: 0.50, label: '解放伤害 +50%' }],
    [{ effect: 'normalDmg', value: 0.80, label: '普攻·蛰幻 +80%' },
     { effect: 'defPierce', value: 0.30, label: '解放期间无视 30% 防御' }]
  ],

  // 常驻 5★ · 维里奈（治疗 衍射 音感仪）— S 级 Tier
  '维里奈': [
    [{ effect: 'heal', value: 0.20, label: '治疗加成 +20%' }],
    [{ effect: 'energyRefund', value: 10, label: '共鸣技能额外回 10 能量 + 1 光合' }],
    [{ effect: 'heal', value: 0.12, label: '光合标记治疗加成 +12%' }],
    [{ effect: 'teamElemDmg', value: 0.15, element: '衍射', label: '重击/解放/延奏后全队衍射 +15%' }],
    [{ effect: 'heal', value: 0.20, label: '结果的奇迹：治疗低 HP 角色时治疗 +20%' }],
    [{ effect: 'heavyDmg', value: 0.20, label: '丰收的喜悦：重击星星花绽放 +20% + 协同攻击' }]
  ],

  // 常驻 5★ · 安可（主C 热熔 佩枪/拳套）— A 级
  '安可': [
    [{ effect: 'elemDmg', value: 0.12, element: '热熔', label: '普攻热熔伤害 +3%×4 = +12%' }],
    [{ effect: 'energyRefund', value: 10, label: '技能/普攻额外回 10 能量' }],
    [{ effect: 'heavyDmg', value: 0.40, label: '重击·失控/暴走伤害 +40%' }],
    [{ effect: 'teamElemDmg', value: 0.20, element: '热熔', label: '重击后全队热熔 +20%' }],
    [{ effect: 'skillDmg', value: 0.35, label: '聚光灯：共鸣技能伤害加成 +35%' }],
    [{ effect: 'atk', value: 0.25, label: '攻击 +25%' }]
  ],

  // 常驻 5★ · 凌阳（主C 冷凝 迅刀）— A 级
  '凌阳': [
    [{ effect: 'burstDmg', value: 0.10, label: '解放伤害 +10%' }],
    [{ effect: 'energyRefund', value: 10, label: '变奏额外回 10 能量' }],
    [{ effect: 'normalDmg', value: 0.20, label: '解放期间普攻 +20%' },
     { effect: 'skillDmg', value: 0.10, label: '解放期间技能 +10%' }],
    [{ effect: 'teamElemDmg', value: 0.20, element: '冷凝', label: '延奏全队冷凝 +20%' }],
    [{ effect: 'burstDmg', value: 2.00, label: '解放额外 atk×200% 冷凝' }],
    [{ effect: 'normalDmg', value: 1.00, label: '行狮状态技能后下次普攻 +100%' }]
  ],

  // 常驻 5★ · 鉴心（辅助 气动 臂铠）— B 级
  '鉴心': [
    [{ effect: 'normalDmg', value: 0.20, label: '变奏后普攻 +20%' }],
    [{ effect: 'skillDmg', value: 0.30, label: '共鸣技能伤害 +30%' }],
    [{ effect: 'skillDmg', value: 0.15, label: '架势打出行气反击 +15%' }],
    [{ effect: 'burstDmg', value: 0.80, label: '重击·混元气旋时解放 +80%' }],
    [{ effect: 'burstDmg', value: 0.10, label: '解放伤害 +10%' }],
    [{ effect: 'heavyDmg', value: 0.80, label: '重击伤害 +80%' }]
  ],

  // ─────────────────────────────────────────────────────────────
  // 4★ 角色
  '莫特斐': [
    [{ effect: 'burstDmg', value: 0.50, label: '解放期间协同伤害 +50%' }],
    [{ effect: 'energyRefund', value: 10, label: '声骸技能额外回 10 能量' }],
    [{ effect: 'burstDmg', value: 0.30, label: '预热宣叙调：加强音暴伤 +30%' }],
    [{ effect: 'burstDmg', value: 0.40, label: '解放伤害 +40%' }],
    [{ effect: 'skillDmg', value: 0.50, label: '共鸣技能协同伤害 +50%' }],
    [{ effect: 'teamAtk', value: 0.20, label: '盛怒无言歌：解放时全队攻击 +20%' }]
  ],

  '散华': [
    [{ effect: 'crate', value: 0.15, label: '普攻第 5 段后暴击 +15%' }],
    [{ effect: 'heavyDmg', value: 0.20, label: '重击伤害 +20%' }],
    [{ effect: 'allDmg', value: 0.20, label: '伤害 +20%' }],
    [{ effect: 'heavyDmg', value: 0.50, label: '解放后重击·爆裂 +50%' }],
    [{ effect: 'cdmg', value: 1.00, label: '暴击伤害 +100%' }],
    [{ effect: 'teamAtk', value: 0.20, label: '曙色天光：引爆冰棱/冰川后全队攻击 +10%×2 层 = +20%' }]
  ],

  '卜灵': [
    [{ effect: 'burstDmg', value: 0.15, label: '暴击率 +15%' }],
    [{ effect: 'energyRefund', value: 25, label: '阴阳相生回 25 能量' }],
    [{ effect: 'heal', value: 0.25, label: '治疗加成 +25%' }],
    [{ effect: 'heal', value: 0.20, label: '治疗效果加成 +20%' }],
    [{ effect: 'skillDmg', value: 0.40, label: '共鸣技能伤害 +40%' }],
    [{ effect: 'teamSkillDmg', value: 0.30, label: '雷法三才合一时全队共鸣技能 +30%' }]
  ],

  '丹瑾': [
    [{ effect: 'atk', value: 0.30, label: '攻击朱蚀目标 +5%×6 = +30%' }],
    [{ effect: 'allDmg', value: 0.20, label: '攻击朱蚀目标伤害 +20%' }],
    [{ effect: 'burstDmg', value: 0.30, label: '共鸣解放伤害加成 +30%' }],
    [{ effect: 'crate', value: 0.15, label: '彤华≥60 时暴击 +15%' }],
    [{ effect: 'elemDmg', value: 0.15, element: '湮灭', label: '湮灭伤害加成 +15%' }],
    [{ effect: 'teamAtk', value: 0.20, label: '重击·缭乱后全队攻击 +20%' }]
  ],

  '白芷': [
    [{ effect: 'energyRefund', value: 5, label: '共鸣技能每念意回 2.5 能量' }],
    [{ effect: 'elemDmg', value: 0.15, element: '冷凝', label: '满念意时冷凝 +15%' },
     { effect: 'heal', value: 0.15, label: '满念意时治疗 +15%' }],
    [{ effect: 'hp', value: 0.12, label: '变奏后生命上限 +12%' }],
    [{ effect: 'heal', value: 0.20, label: '解放强化频隙回响治疗 +20%' }],
    [{ effect: 'heal', value: 0.10, label: '治疗加成 +10%' }],
    [{ effect: 'teamElemDmg', value: 0.12, element: '冷凝', label: '闻道者觉悟：拾取天籁全队冷凝 +12%' }]
  ],

  '秋水': [
    [{ effect: 'skillCdReduce', value: 1, label: '共鸣技能 CD -1 回合' }],
    [{ effect: 'atk', value: 0.15, label: '攻击雾化分身嘲讽目标 +15% 攻击' }],
    [{ effect: 'normalDmg', value: 0.30, label: '普攻伤害 +30%' }],
    [{ effect: 'skillDmg', value: 0.30, label: '共鸣技能·雾化子弹 +30%' }],
    [{ effect: 'elemDmg', value: 0.25, element: '气动', label: '迷途者喝彩：潜行时气动 +25%' }],
    [{ effect: 'crate', value: 0.08, label: '幕后卖家：解放暴击 +8%' },
     { effect: 'heavyDmg', value: 0.50, label: '幕后卖家：重击穿门 +50%' }]
  ],

  '炽霞': [
    [{ effect: 'crate', value: 0.20, label: '暴击率 +20%' }],
    [{ effect: 'energyRefund', value: 5, label: '解放期间击败目标回 5 能量' }],
    [{ effect: 'burstDmg', value: 0.25, label: '解放伤害 +25%' }],
    [{ effect: 'burstDmg', value: 0.30, label: '解放伤害 +30%' }],
    [{ effect: 'atk', value: 0.30, label: '胜利的枪弹焰火：加麻加辣满层攻击 +30%' }],
    [{ effect: 'teamNormalDmg', value: 0.25, label: '剧终彩蛋：技能·轰轰后全队普攻 +25%' }]
  ],

  '秧秧': [
    [{ effect: 'elemDmg', value: 0.15, element: '气动', label: '变奏后气动 +15%' }],
    [{ effect: 'energyRefund', value: 10, label: '重击命中回 10 能量' }],
    [{ effect: 'skillDmg', value: 0.40, label: '共鸣技能 +40%' }],
    [{ effect: 'heavyDmg', value: 0.95, label: '空中释羽（重击）+95%' }],
    [{ effect: 'burstDmg', value: 0.85, label: '绪风于此响彻：解放·朔风旋涌 +85%' }],
    [{ effect: 'teamAtk', value: 0.20, label: '致美好以颂歌：空中释羽后全队攻击 +20%' }]
  ],

  '桃祈': [
    [{ effect: 'hp', value: 0.12, label: '生命上限 +12%' }],
    [{ effect: 'crate', value: 0.10, label: '暴击率 +10%' },
     { effect: 'cdmg', value: 0.20, label: '解放暴击伤害 +20%' }],
    [{ effect: 'skillDmg', value: 0.20, label: '共鸣技能伤害 +20%' }],
    [{ effect: 'def', value: 0.20, label: '重击发后制人触发，防御 +20%' }],
    [{ effect: 'energyRefund', value: 20, label: '解市井民忧：攻防转换命中回 20 能量' }],
    [{ effect: 'normalDmg', value: 0.40, label: '护城邦：磐岩护壁期间普攻 +40%' },
     { effect: 'heavyDmg', value: 0.40, label: '护城邦：磐岩护壁期间重击 +40%' }]
  ],

  '渊武': [
    [{ effect: 'atk', value: 0.10, label: '攻击 +10%' }],
    [{ effect: 'energyRefund', value: 15, label: '变奏·轰雷回 15 能量' }],
    [{ effect: 'skillDmg', value: 0.20, label: '共鸣技能·雷之楔 +20%' }],
    [{ effect: 'burstDmg', value: 0.30, label: '解放伤害 +30%' }],
    [{ effect: 'burstDmg', value: 0.50, label: '顾一方天地：雷之楔在场时解放 +50%' }],
    [{ effect: 'teamDef', value: 0.32, label: '保八方平安：雷之楔范围内全队防御 +32%' }]
  ],

  '釉瑚': [
    [{ effect: 'hp', value: 0.06, label: '生命上限 +6%' }],
    [{ effect: 'skillDmg', value: 0.20, label: '共鸣技能伤害 +20%' }],
    [{ effect: 'atk', value: 0.20, label: '攻击 +20%' }],
    [{ effect: 'skillDmg', value: 0.20, label: '共鸣技能伤害 +20%' }],
    [{ effect: 'crate', value: 0.15, label: '万里浅眠：变奏·遂心匣后暴击 +15%' }],
    [{ effect: 'cdmg', value: 0.60, label: '千秋一枕：奇珍赏获霁青 4 层 × 15% = +60% 暴伤' }]
  ],

  '灯灯': [
    [{ effect: 'skillDmg', value: 0.15, label: '共鸣技能伤害 +15%' }],
    [{ effect: 'defPierce', value: 0.20, label: '强化·前扑/后撤无视 20% 防御' }],
    [{ effect: 'burstDmg', value: 0.30, label: '共鸣解放·啾啾专送 +30%' }],
    [{ effect: 'normalDmg', value: 0.30, label: '普攻伤害加成 +30%' }],
    [{ effect: 'skillDmg', value: 1.00, label: '快件已顺利签收：光能满时强光穿射 +100%' }],
    [{ effect: 'teamAtk', value: 0.20, label: '给个五星好评哦：解放时全队攻击 +20%' }]
  ],

  // 1.3 · 守岸人（辅助 衍射 音感仪）— 走 combat.js 特殊路径
  '守岸人': [
    [{ effect: 'fieldExtend', duration: 2, persistOnSwitch: true }],
    [{ effect: 'fieldTeamAtk', value: 0.4 }],
    [{ effect: 'burstEnergyRefund', value: 20, cooldown: 2 }],
    [{ effect: 'shorekeeperHeal4', value: 0.7 }],
    [{ effect: 'normalSplit', value: 2 }],
    [{ effect: 'variationDmg', value: 5.0 }]
  ],

  // 2.3 · 赞妮（主C 衍射 臂铠）— 光噪效应·灼焰形态·重斩连段
  '赞妮': [
    [{ effect: 'elemDmg', value: 0.50, element: '衍射', label: '集中压制/破袭反击时衍射伤害 +50%' }],
    [{ effect: 'crate', value: 0.20, label: '暴击 +20%' },
     { effect: 'skillDmg', value: 0.80, label: '集中压制/破袭反击倍率 +80%' }],
    [{ effect: 'burstDmg', value: 0.50, label: '灼焰形态消耗焰光使解放最后一击 +50%' }],
    [{ effect: 'teamAtk', value: 0.20, label: '变奏·即刻执行时全队攻击 +20%' }],
    [{ effect: 'burstDmg', value: 0.70, label: '共鸣解放·重燃倍率 +120%' }],
    [{ effect: 'heavyDmg', value: 0.40, label: '重斩·破晓/将明/终夜/闪裂倍率 +40%' }]
  ],

  // 2.3 · 夏空（辅助 气动 佩枪）— 合奏音影·风蚀效应
  '夏空': [
    [{ effect: 'atk', value: 0.35, label: '施放普攻时攻击 +35%' }],
    [{ effect: 'teamElemDmg', value: 0.40, element: '气动', label: '解放持续期间全队气动伤害 +40%' }],
    [{ effect: 'skillDmg', value: 0.15, label: '共鸣技能可使用次数 +1' }],
    [{ effect: 'defPierce', value: 0.45, label: '重击/解放无视 45% 防御' }],
    [{ effect: 'burstDmg', value: 0.40, label: '共鸣解放伤害 +40%' }],
    [{ effect: 'allDmg', value: 0.15, label: '音律独奏状态额外伤害' }]
  ],

  // 2.4 · 露帕（副C 热熔 长刃）— 狼焰·荣光·追猎
  '露帕': [
    [{ effect: 'crate', value: 0.20, label: '解放时暴击 +20%' }],
    [{ effect: 'teamElemDmg', value: 0.40, element: '热熔', label: '全队热熔伤害 +40%（可叠 2 层至 +40%）' }],
    [{ effect: 'elemPierce', value: 0.15, label: '荣光：全队攻击无视 15% 热熔抗性' }],
    [{ effect: 'skillDmg', value: 0.60, label: '狼舞·决意·极倍率 +125%' }],
    [{ effect: 'burstDmg', value: 0.15, label: '变奏时解放伤害 +15%' }],
    [{ effect: 'defPierce', value: 0.30, label: '狼舞/解放/变奏无视 30% 防御' }]
  ],

  // 2.5 · 弗洛洛（主C 湮灭 音感仪）— 乐声·指挥·赫卡忒
  '弗洛洛': [
    [{ effect: 'skillDmg', value: 0.80, label: '亡与死的乐章/梦呓伤害倍率 +80%' }],
    [{ effect: 'burstDmg', value: 0.75, label: '谱曲终末伤害倍率 +75%' }],
    [{ effect: 'skillDmg', value: 0.40, label: '声骸技能伤害加深 80%（折算）' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '声骸技能时全队全属性伤害 +20%' }],
    [{ effect: 'allDmg', value: 0.15, label: '指挥状态减伤 30%' }],
    [{ effect: 'elemDmg', value: 0.60, element: '湮灭', label: '指挥状态时湮灭伤害 +60%' }]
  ],

  // 2.6 · 奥古斯塔（主C 导电 长刃）— 以众愿为冕
  '奥古斯塔': [
    [{ effect: 'cdmg', value: 0.30, label: '【以众愿为冕】暴击伤害 +15%/层 × 2 层' }],
    [{ effect: 'crate', value: 0.20, label: '【以众愿为冕】每层暴击 +20%' }],
    [{ effect: 'skillDmg', value: 0.25, label: '重击/闪反/技能/解放倍率 +25%' }],
    [{ effect: 'teamAtk', value: 0.20, label: '变奏·灼金的巡行时全队攻击 +20%' }],
    [{ effect: 'allDmg', value: 0.05, label: '护盾量 +50%' }],
    [{ effect: 'cdmg', value: 0.60, label: '【以众愿为冕】上限 4 层，暴击伤害 +60%' }]
  ],

  // 2.6 · 尤诺（主C 冷凝 臂铠）— 月相流转·满月领域
  '尤诺': [
    [{ effect: 'atk', value: 0.40, label: '月相流转时攻击 +40%' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '苍白死光的祝颂 10 层时全伤害加深 40%' }],
    [{ effect: 'allDmg', value: 0.35, label: '月弓普攻/技能/闪反伤害加深 65%' }],
    [{ effect: 'teamAtk', value: 0.10, label: '至臻完满时全队护盾效果' }],
    [{ effect: 'burstDmg', value: 0.20, label: '共鸣解放伤害 +20%' }],
    [{ effect: 'heavyDmg', value: 1.00, label: '至臻完满倍率 +1600%' }]
  ],

  // 2.7 · 仇远（主C 气动 迅刀）— 淋漓醉墨·竹照·且从容
  '仇远': [
    [{ effect: 'crate', value: 0.20, label: '暴击 +20%' }],
    [{ effect: 'teamAllDmg', value: 0.15, label: '全队声骸技能伤害加深 30%' }],
    [{ effect: 'burstDmg', value: 0.50, label: '解放倍率 +500%' }],
    [{ effect: 'atk', value: 0.20, label: '攻击 +20%' }],
    [{ effect: 'defPierce', value: 0.15, label: '无视目标 15% 防御' }],
    [{ effect: 'cdmg', value: 1.00, label: '荷蓑出林时暴击伤害 +100%' }]
  ],

  // 2.8 · 千咲（主C 湮灭 长刃）— 虚无绞痕·电锯模式
  '千咲': [
    [{ effect: 'atk', value: 0.30, label: '附加虚无绞痕时攻击 +30%' }],
    [{ effect: 'teamAllDmg', value: 0.30, label: '虚湮之线状态全属性伤害 +50%' }],
    [{ effect: 'skillDmg', value: 0.60, label: '锯环疾攻/终结/闪反倍率 +120%' }],
    [{ effect: 'allDmg', value: 0.15, label: '虚无绞痕→附加虚湮效应' }],
    [{ effect: 'burstDmg', value: 1.00, label: '共鸣解放·即刻·归无伤害 +100%' }],
    [{ effect: 'allDmg', value: 0.30, label: '虚无绞痕·终焉：千咲伤害 +40%' }]
  ],

  // 3.0 · 琳奈（副C 衍射 佩枪）— 颜料·流光·绮彩巡游
  '琳奈': [
    [{ effect: 'skillDmg', value: 0.30, label: '普攻·幻光折跃倍率 +120%' }],
    [{ effect: 'allDmg', value: 0.25, label: '全伤害加深 25%' }],
    [{ effect: 'normalDmg', value: 0.45, label: '视觉冲击/虹彩飞溅倍率 +90%' }],
    [{ effect: 'atk', value: 0.20, label: '攻击 +20%' }],
    [{ effect: 'burstDmg', value: 0.70, label: '共鸣解放·爆炸喷涂倍率 +70%' }],
    [{ effect: 'normalDmg', value: 0.60, label: '心之彩 3 层：虹彩飞溅/视觉冲击伤害 +90%' }]
  ],

  // 3.0 · 莫宁（主C 冷凝 迅刀）— 干涉标记·谐振场
  '莫宁': [
    [{ effect: 'allDmg', value: 0.15, label: '干涉标记伤害提升' }],
    [{ effect: 'teamCdmg', value: 0.32, label: '全队对干涉目标暴击伤害 +32%' }],
    [{ effect: 'skillDmg', value: 0.20, label: '谐振场额外效果' }],
    [{ effect: 'hp', value: 0.06, label: '强谐振场治疗量 +30%' }],
    [{ effect: 'burstDmg', value: 0.50, label: '共鸣解放伤害 +120%（含粒子射流）' }],
    [{ effect: 'burstDmg', value: 0.80, label: '共鸣解放·临界协议伤害强化' }]
  ],

  // 3.1 · 爱弥斯（主C 导电 长刃）— 震谐/聚爆双模态
  '爱弥斯': [
    [{ effect: 'heavyDmg', value: 0.50, label: '重击暴击伤害 +300%（折算）' }],
    [{ effect: 'skillDmg', value: 1.00, label: '共鸣技能光翼共奏倍率 +100%' }],
    [{ effect: 'burstDmg', value: 0.50, label: '共鸣解放倍率 +100%' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '全队全属性伤害 +20%' }],
    [{ effect: 'hp', value: 0.10, label: '受致命伤时护盾效果' }],
    [{ effect: 'elemDmg', value: 0.40, element: '导电', label: '共鸣解放伤害加深 40%' }]
  ],

  // 3.1 · 陆·赫斯（辅助 冷凝 臂铠）— 黄金的裁量·谐度破坏
  '陆·赫斯': [
    [{ effect: 'allDmg', value: 0.10, label: '空中攻击伤害 +150%（折算）' }],
    [{ effect: 'burstDmg', value: 0.60, label: '共鸣解放伤害倍率 +60%' }],
    [{ effect: 'skillDmg', value: 0.50, label: '斩杀日冕倍率 +136%' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '全队谐度破坏后伤害 +20%' }],
    [{ effect: 'skillDmg', value: 0.50, label: '共鸣技能·流金回潮伤害 +50%' }],
    [{ effect: 'allDmg', value: 0.30, label: '全队谐度破坏时目标受陆·赫斯伤害 +30%' }]
  ],

  // 3.2 · 西格莉卡（主C 衍射 音感仪）— 语义·凝语·天赋
  '西格莉卡': [
    [{ effect: 'skillDmg', value: 0.70, label: '普攻/闪反/技能倍率 +70%' }],
    [{ effect: 'skillDmg', value: 0.60, label: '共鸣回路·我即语义倍率 +120%' }],
    [{ effect: 'skillDmg', value: 0.25, label: '「天赋？」上限 4 层强化' }],
    [{ effect: 'teamAtk', value: 0.20, label: '声骸技能时全队攻击 +20%' }],
    [{ effect: 'burstDmg', value: 0.30, label: '共鸣解放伤害 +30%' }],
    [{ effect: 'allDmg', value: 0.30, label: '目标受西格莉卡伤害 +30%' }]
  ],

  // 3.3 · 绯雪（主C 冷凝 迅刀）— 预求身·居合·霜渐效应
  '绯雪': [
    [{ effect: 'skillDmg', value: 0.60, label: '普攻/重击/空中/闪反倍率 +120%' }],
    [{ effect: 'skillDmg', value: 0.60, label: '普攻·居合倍率 +125%' }],
    [{ effect: 'heavyDmg', value: 0.80, label: '重击·寒簇/枯霜倍率 +160%' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '全队伤害 +20%' }],
    [{ effect: 'skillDmg', value: 0.80, label: '共鸣技能·常世身/白玉切/落华倍率 +80%' }],
    [{ effect: 'elemDmg', value: 0.40, element: '冷凝', label: '预求我身·见心/归刃暴伤 +500%' }]
  ],

  // 3.3 · 达妮娅（主C 热熔 佩枪）— 布景/幻灭双形态·黯核
  '达妮娅': [
    [{ effect: 'cdmg', value: 0.30, label: '暴击伤害 +30%' }],
    [{ effect: 'teamElemDmg', value: 0.30, element: '热熔', label: '全队热熔伤害 +50%' }],
    [{ effect: 'burstDmg', value: 0.80, label: '共鸣解放·帷幕终景倍率 +80%' }],
    [{ effect: 'allDmg', value: 0.10, label: '蚀域攻击间隔缩短' }],
    [{ effect: 'burstDmg', value: 0.50, label: '共鸣解放·布景之形伤害 +100%' }],
    [{ effect: 'atk', value: 0.60, label: '熵变强化时攻击 +60%' },
     { effect: 'elemDmg', value: 0.60, element: '热熔', label: '熵变强化时热熔伤害 +60%' }]
  ],

  // 3.4 · 露西（主C 衍射 佩枪）— 欺骗程式·骇破
  '露西': [
    [{ effect: 'atk', value: 0.20, label: '变奏·过时幻觉时攻击 +20%' }],
    [{ effect: 'heavyDmg', value: 0.50, label: '共鸣回路·黑墙深度强化' }],
    [{ effect: 'burstDmg', value: 0.50, label: '共鸣解放伤害倍率 +50%' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '全队全属性伤害 +20%' }],
    [{ effect: 'hp', value: 0.10, label: '光学欺骗护盾效果' }],
    [{ effect: 'allDmg', value: 0.30, label: '目标受露西重击/骇破伤害 +40%' }]
  ],

  // 3.4 · 丽贝卡（副C 导电 佩枪）— 街头直觉·手感火热
  '丽贝卡': [
    [{ effect: 'skillDmg', value: 0.50, label: '普攻/重击/闪反倍率 +50%' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '全队全属性伤害 +20%' }],
    [{ effect: 'burstDmg', value: 0.60, label: '共鸣解放倍率 +60%' }],
    [{ effect: 'allDmg', value: 0.30, label: '小孩子才做选择！属性加成 +60%' }],
    [{ effect: 'normalDmg', value: 0.20, label: '附加骇破·偏移时普攻伤害 +20%' }],
    [{ effect: 'normalDmg', value: 0.40, label: '普攻伤害加成数值 +40%' }]
  ],

  // 3.4 · 洛瑟菈（副C 湮灭 音感仪）— 追忆·聚焦·照片
  '洛瑟菈': [
    [{ effect: 'crate', value: 0.20, label: '共鸣技能·追光时暴击 +20%' }],
    [{ effect: 'elemDmg', value: 0.40, element: '湮灭', label: '霜渐效应伤害加深 80%' }],
    [{ effect: 'skillDmg', value: 0.50, label: '断舍离倍率 +100%' }],
    [{ effect: 'atk', value: 0.30, label: '施放遗忘时攻击 +10%/层 × 3 层' }],
    [{ effect: 'skillDmg', value: 0.50, label: '遗忘倍率 +50%' }],
    [{ effect: 'skillDmg', value: 1.00, label: '铭记 3 层：断舍离伤害 +600%' }]
  ]
};

export const FALLBACK_CHAIN = [
  { effect: 'atk', value: 0.06, label: '攻击 +6%' },
  { effect: 'skillDmg', value: 0.10, label: '共鸣技能伤害 +10%' },
  { effect: 'skillDmg', value: 0.06, label: '共鸣技能伤害 +6%' },
  { effect: 'teamAtk', value: 0.08, label: '全队攻击 +8%' },
  { effect: 'burstDmg', value: 0.06, label: '共鸣解放伤害 +6%' },
  { effect: 'burstDmg', value: 0.50, label: '共鸣解放伤害 +50%' }
];

export const FORTE_BOOST = {
  '忌炎': { atChain: 6, bonus: 0.5 },
  '吟霖': { atChain: 6, bonus: 0.4 },
  '今汐': { atChain: 6, bonus: 0.4 },
  '长离': { atChain: 6, bonus: 0.5 },
  '折枝': { atChain: 6, bonus: 0.4 },
  '相里要': { atChain: 6, bonus: 0.4 },
  '椿': { atChain: 6, bonus: 0.5 },
  '珂莱塔': { atChain: 6, bonus: 0.5 },
  '洛可可': { atChain: 6, bonus: 0.3 },
  '菲比': { atChain: 6, bonus: 0.4 },
  '布兰特': { atChain: 6, bonus: 0.4 },
  '坎特蕾拉': { atChain: 6, bonus: 0.5 },
  '维里奈': { atChain: 6, bonus: 0.4 },
  '安可': { atChain: 6, bonus: 0.4 },
  '凌阳': { atChain: 6, bonus: 0.4 },
  '鉴心': { atChain: 6, bonus: 0.3 },
  '卡提希娅': { atChain: 6, bonus: 0.5 },
  '嘉贝莉娜': { atChain: 6, bonus: 0.5 },
  '卡卡罗': { atChain: 6, bonus: 0.5 },
  '赞妮': { atChain: 6, bonus: 0.4 },
  '夏空': { atChain: 6, bonus: 0.3 },
  '露帕': { atChain: 6, bonus: 0.4 },
  '弗洛洛': { atChain: 6, bonus: 0.5 },
  '奥古斯塔': { atChain: 6, bonus: 0.5 },
  '尤诺': { atChain: 6, bonus: 0.4 },
  '仇远': { atChain: 6, bonus: 0.5 },
  '千咲': { atChain: 6, bonus: 0.4 },
  '琳奈': { atChain: 6, bonus: 0.4 },
  '莫宁': { atChain: 6, bonus: 0.4 },
  '爱弥斯': { atChain: 6, bonus: 0.5 },
  '陆·赫斯': { atChain: 6, bonus: 0.3 },
  '西格莉卡': { atChain: 6, bonus: 0.4 },
  '绯雪': { atChain: 6, bonus: 0.4 },
  '达妮娅': { atChain: 6, bonus: 0.4 },
  '露西': { atChain: 6, bonus: 0.4 },
  '丽贝卡': { atChain: 6, bonus: 0.3 },
  '洛瑟菈': { atChain: 6, bonus: 0.3 }
};
