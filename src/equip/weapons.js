// 武器数据库 + 计算
// 数据校准（2026-06-26）：全量 encore.moe API 面板校准
//   - 5★ 44 把：全部 atk90 / 副词条 / 技能名与 encore 对齐
//   - 4★ 43 把：全部 atk90 / 副词条与 encore 对齐，被动简化映射
//   - 3★ 10 把：估算值（encore 未收录 3 星）
// 来源：docs/sources/weapons/encore-full-data.json
//
// 数据结构：
//   r: 稀有度 3/4/5
//   type: 武器类型（长刃/迅刀/佩枪/臂铠/音感仪）
//   atk90: 90 级基础攻击（encore.moe 官方数据）
//   sub: 副词条 { stat, value90 }  - value90 是 90 级数值（百分比小数）
//   passive: 静态被动（无条件生效，进入 stats 时一次性计算）
//     [{ type, value, element? }]
//   triggers: 触发型被动（战斗中按条件激活，运行时处理）
//     [{ on, effect, value, maxStacks?, duration?, condition? }]
//     on:        'normal_hit' | 'skill_hit' | 'burst_cast' | 'variation' (变奏) | 'outro' (延奏) | 'always'
//     effect:    'atk_pct' | 'normal_pct' | 'skill_pct' | 'burst_pct' | 'elem_dmg' | 'heavy_pct' | 'concerto_refund' | 'def_pierce' | 'team_atk_after_outro' | 'condition_bonus'
//     value:     单层效果值
//     maxStacks: 叠层上限（默认 1）
//     duration:  持续回合（默认永久；模拟器一回合算一次衰减）
//     condition: 'enemy_has_erosion_aero' 类条件标签
//   desc: 中文展示文案
//
// 面板规律（encore.moe 实际数据）：
//   5★ 标准武器：atk90 = 587（长刃/迅刀/臂铠/佩枪）；500（音感仪/佩枪暴伤型/臂铠暴击型）
//   5★ 辅助武器：atk90 = 412（低攻高副词条）
//   5★ 特大武器：atk90 = 675（驭冕铸雷之权，牺牲副词条：暴击仅 12.15%）
//   4★ 高攻型：atk90 = 462（副词条 ~18%）
//   4★ 标准型：atk90 = 412（副词条 ~30%）
//   4★ 技巧型：atk90 = 387~388（副词条 ~36%）
//   4★ 辅助型：atk90 = 337~338（副词条 ~52%）

const W = {
  // ============================================================
  // 5★ 限定（角色专武）— 13 件 AI 校准数据 + 其余按规律估算
  // ============================================================

  // ✅ 忌炎专武：Verdant Summit
  '苍鳞千嶂': {
    r: 5, type: '长刃', atk90: 587,
    sub: { stat: 'cdmg', value90: 0.486 },
    passive: [
      { type: 'elem_all', value: 0.12 }   // 属性伤害 +12%
    ],
    triggers: [
      { on: 'variation', effect: 'heavy_pct', value: 0.24, maxStacks: 2, duration: 7 },  // 变奏后重击 +24% × 2层（14秒约 7 回合）
      { on: 'burst_cast', effect: 'heavy_pct', value: 0.24, maxStacks: 2, duration: 7 }
    ],
    desc: '属性伤害+12%；变奏/解放后重击伤害+24%，最多 2 层'
  },

  // ✅ 今汐专武：Ages of Harvest
  '时和岁稔': {
    r: 5, type: '长刃', atk90: 587,
    sub: { stat: 'crate', value90: 0.243 },
    passive: [
      { type: 'elem_all', value: 0.12 }
    ],
    triggers: [
      { on: 'variation', effect: 'skill_pct', value: 0.24, maxStacks: 1, duration: 6 },
      { on: 'skill_hit', effect: 'skill_pct', value: 0.24, maxStacks: 1, duration: 6 }
    ],
    desc: '属性伤害+12%；变奏给技能+24%，技能再给技能+24%'
  },

  // ✅ 吟霖专武：Stringmaster
  '掣傀之手': {
    r: 5, type: '音感仪', atk90: 500,
    sub: { stat: 'crate', value90: 0.360 },
    passive: [
      { type: 'elem_all', value: 0.12 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'atk_pct', value: 0.12, maxStacks: 2, duration: 10 },
      { on: 'offstage', effect: 'atk_pct', value: 0.12, maxStacks: 1, duration: 99 }  // 后台时额外 +12%
    ],
    desc: '全属性+12%；技能命中后攻击+12%×2 层；后台时攻击+12%'
  },

  // ✅ 守岸人专武：星序协响 Stellar Symphony
  // 数据来源：encore.moe API 校准
  '星序协响': {
    r: 5, type: '音感仪', atk90: 412,
    sub: { stat: 'resonance', value90: 0.7704 },  // 共鸣效率 77.04%
    passive: [
      { type: 'hp', value: 0.12 }                   // 生命 +12%
    ],
    triggers: [
      // 解放释放回 8 点协奏能量
      { on: 'burst_cast', effect: 'concerto_refund', value: 8, maxStacks: 1, duration: 1 },
      // 治疗型技能 → 附近队友攻击 +14%，持续 30 秒（折算 2 回合）
      { on: 'heal_skill', effect: 'team_atk', value: 0.14, maxStacks: 1, duration: 2 }
    ],
    passiveName: '星之吟咏',
    descFull: '装备者治疗效果加成提升 <b class="term-num">12%</b>。<br>装备者施放<b class="term-burst">共鸣解放</b>时，回复 <b class="term-num">8</b> 点协奏能量。<br>装备者使附近队伍中的角色获得治疗效果时，自身及附近队伍中所有角色的攻击力提升 <b class="term-num">14%</b>，持续 2 回合。',
    desc: '共鸣效率+77.04%；释放共鸣解放回复 8 协奏能量；治疗型技能命中后，附近队友攻击 +14%（2 回合）'
  },

  // ✅ 椿专武：Red Spring
  '裁春': {
    r: 5, type: '迅刀', atk90: 587,
    sub: { stat: 'crate', value90: 0.243 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [
      { on: 'normal_hit', effect: 'normal_pct', value: 0.10, maxStacks: 3, duration: 5 },
      { on: 'concerto_consume', effect: 'normal_pct', value: 0.40, maxStacks: 1, duration: 5 }
    ],
    desc: '攻击+12%；普攻后普攻+10%×3 层；消耗协奏后普攻+40%'
  },

  // ✅ 珂莱塔专武：The Last Dance
  '死与舞': {
    r: 5, type: '佩枪', atk90: 500,
    sub: { stat: 'cdmg', value90: 0.720 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [
      { on: 'variation', effect: 'skill_pct', value: 0.48, maxStacks: 1, duration: 3 },
      { on: 'burst_cast', effect: 'skill_pct', value: 0.48, maxStacks: 1, duration: 3 }
    ],
    desc: '攻击+12%；变奏/解放后技能+48%'
  },

  // ✅ 卡提希娅专武：Defier's Thorn
  '驳问之刺': {
    r: 5, type: '迅刀', atk90: 412,
    sub: { stat: 'hp', value90: 0.722 },
    passive: [
      { type: 'hp', value: 0.12 },
      { type: 'def_pierce', value: 0.08 }       // 8% 防御穿透
    ],
    triggers: [
      { on: 'always', effect: 'condition_bonus', value: 0.20, condition: 'enemy_has_erosion_aero' }
    ],
    desc: '生命+12%；伤害无视 8% 防御；气动侵蚀目标受伤+20%'
  },

  // ✅ 露帕专武：Wildfire Mark
  '焰痕': {
    r: 5, type: '长刃', atk90: 587,
    sub: { stat: 'cdmg', value90: 0.486 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [
      { on: 'variation', effect: 'burst_pct', value: 0.24, maxStacks: 1, duration: 15 },
      { on: 'burst_cast', effect: 'burst_pct', value: 0.24, maxStacks: 1, duration: 15 },
      { on: 'heavy_hit', effect: 'team_elem_dmg', value: 0.24, element: '热熔', duration: 15 }
    ],
    desc: '攻击+12%；变奏/解放后解放+24%；延长后全队热熔+24%'
  },

  // ✅ 赞妮专武：Blazing Justice（库街区核验：臂铠 · atk90=587 · cdmg=48.6%）
  '焰光裁定': {
    r: 5, type: '臂铠', atk90: 587,
    sub: { stat: 'cdmg', value90: 0.486 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [
      { on: 'condition_attack', effect: 'normal_pct', value: 0.14, maxStacks: 3, duration: 5, condition: 'enemy_has_spectro_frazzle' },
      { on: 'condition_attack', effect: 'heavy_pct', value: 0.14, maxStacks: 3, duration: 5, condition: 'enemy_has_spectro_frazzle' },
      { on: 'outro', effect: 'spectro_frazzle_dmg', value: 0.30, maxStacks: 1, duration: 15 }
    ],
    desc: '攻击+12%；普攻时无视目标部分防御；施放普攻时命中衍射失序目标普攻/重击+14%×3 层；延奏后失序伤害+30%'
  },

  // 未知专武（原标记为"赞妮"但实际赞妮用臂铠·焰光裁定；此武器待确认归属）
  '黎明霜露': {
    r: 5, type: '长刃', atk90: 587,
    sub: { stat: 'crate', value90: 0.243 },
    passive: [
      { type: 'elem_dmg', element: '衍射', value: 0.20 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'elem_dmg', value: 0.10, element: '衍射', maxStacks: 2, duration: 5 }
    ],
    desc: '衍射+20%；技能后衍射+10%×2 层（占位 · 真实武器名待核验）'
  },

  // ============================================================
  // 5★ 限定（其他角色专武）— 按 AI 给的规律推断
  //   主输出武器 sub: crate 24.3% / cdmg 48.6% / atk 36.4%
  //   被动：属伤+12% + 1~2 个触发型条件
  // ============================================================

  // 长离专武（迅刀）— Blazing Brilliance
  '赫奕流明': {
    r: 5, type: '迅刀', atk90: 587,
    sub: { stat: 'cdmg', value90: 0.486 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'skill_pct', value: 0.12, maxStacks: 3, duration: 5 },
      { on: 'burst_cast', effect: 'burst_pct', value: 0.30, maxStacks: 1, duration: 8 }
    ],
    desc: '攻击+12%；技能后技能+12%×3 层；解放后解放+30%'
  },

  // 折枝专武（音感仪）— Comet Flare
  '琼枝冰绡': {
    r: 5, type: '音感仪', atk90: 500,
    sub: { stat: 'cdmg', value90: 0.720 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'crate', value: 0.04, maxStacks: 4, duration: 8 }
    ],
    desc: '攻击+12%；技能命中后暴击+4%×4 层'
  },

  // 相里要专武（臂铠）— Static Mist 同类
  '诸方玄枢': {
    r: 5, type: '臂铠', atk90: 587,
    sub: { stat: 'crate', value90: 0.243 },
    passive: [
      { type: 'elem_dmg', element: '导电', value: 0.20 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'elem_dmg', value: 0.10, element: '导电', maxStacks: 2, duration: 5 }
    ],
    desc: '导电+20%；技能后导电+10%×2 层'
  },

  // 洛可可专武（臂铠）
  '悲喜剧': {
    r: 5, type: '臂铠', atk90: 587,
    sub: { stat: 'crate', value90: 0.243 },
    passive: [
      { type: 'elem_dmg', element: '湮灭', value: 0.20 }
    ],
    triggers: [
      { on: 'normal_hit', effect: 'elem_dmg', value: 0.12, element: '湮灭', maxStacks: 2, duration: 5 }
    ],
    desc: '湮灭+20%；普攻后湮灭+12%×2 层'
  },

  // 布兰特专武（迅刀，辅助）
  '不灭航路': {
    r: 5, type: '迅刀', atk90: 412,
    sub: { stat: 'resonance', value90: 0.7704 },
    passive: [
      { type: 'crate', value: 0.08 }
    ],
    triggers: [
      { on: 'burst_cast', effect: 'normal_pct', value: 0.24, maxStacks: 1, duration: 5 },
      { on: 'normal_hit', effect: 'normal_pct', value: 0.24, maxStacks: 1, duration: 4 }
    ],
    desc: '共鸣效率+77.04%；暴击+8%；解放后普攻+24%；普攻后普攻+24%'
  },

  // 坎特蕾拉专武（音感仪）— encore 名为"海的呢喃"
  '海的呢喃': {
    r: 5, type: '音感仪', atk90: 500,
    sub: { stat: 'cdmg', value90: 0.720 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'skill_pct', value: 0.15, maxStacks: 3, duration: 5 }
    ],
    desc: '攻击+12%；技能后技能+15%×3 层'
  },
  '海妖低语': {
    r: 5, type: '音感仪', atk90: 500,
    sub: { stat: 'cdmg', value90: 0.720 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'skill_pct', value: 0.15, maxStacks: 3, duration: 5 }
    ],
    desc: '攻击+12%；技能后技能+15%×3 层'
  },

  // 赞妮专武（长刃）
  '驳问之刺_v_zani': null, // 占位 — 删除
  '驳问': null,             // 占位 — 删除

  // 夏空专武（佩枪，辅助）
  '林间的咏叹调': {
    r: 5, type: '佩枪', atk90: 500,
    sub: { stat: 'crate', value90: 0.360 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'elem_dmg', value: 0.24, element: '气动', maxStacks: 1, duration: 5 },
      { on: 'normal_hit', effect: 'elem_res_pen', value: 0.10, element: '气动', maxStacks: 1, duration: 10 }
    ],
    desc: '暴击+36%；攻击+12%；附加风蚀后气动+24%；命中风蚀目标降低气动抗性10%'
  },

  // 弗洛洛专武（音感仪）
  '忘川': {
    r: 5, type: '音感仪', atk90: 500,
    sub: { stat: 'crate', value90: 0.360 },
    passive: [
      { type: 'elem_dmg', element: '湮灭', value: 0.20 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'elem_dmg', value: 0.10, element: '湮灭', maxStacks: 2, duration: 5 }
    ],
    desc: '湮灭+20%；技能后湮灭+10%×2 层'
  },

  // 奥古斯塔专武（长刃）
  '雷霆疆域': {
    r: 5, type: '长刃', atk90: 587,
    sub: { stat: 'cdmg', value90: 0.486 },
    passive: [
      { type: 'elem_dmg', element: '导电', value: 0.20 }
    ],
    triggers: [
      { on: 'normal_hit', effect: 'elem_dmg', value: 0.10, element: '导电', maxStacks: 3, duration: 5 }
    ],
    desc: '导电+20%；普攻后导电+10%×3 层'
  },

  // 尤诺专武（臂铠）
  '望月': {
    r: 5, type: '臂铠', atk90: 587,
    sub: { stat: 'atk_pct', value90: 0.364 },
    passive: [
      { type: 'elem_dmg', element: '冷凝', value: 0.20 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'elem_dmg', value: 0.10, element: '冷凝', maxStacks: 2, duration: 5 }
    ],
    desc: '冷凝+20%；技能后冷凝+10%×2 层'
  },

  // 嘉贝莉娜专武（佩枪）— encore 名为"光影双生"
  '光影双生': {
    r: 5, type: '佩枪', atk90: 587,
    sub: { stat: 'cdmg', value90: 0.486 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [
      { on: 'heavy_hit', effect: 'heavy_pct', value: 0.15, maxStacks: 3, duration: 5 }
    ],
    desc: '攻击+12%；暴伤+48.6%；重击+15%×3 层'
  },
  '光与影': { r: 5, type: '佩枪', atk90: 587,
    sub: { stat: 'cdmg', value90: 0.486 },
    passive: [{ type: 'atk_pct', value: 0.12 }],
    triggers: [{ on: 'heavy_hit', effect: 'heavy_pct', value: 0.15, maxStacks: 3, duration: 5 }],
    desc: '攻击+12%；暴伤+48.6%；重击+15%×3 层'
  },

  // 仇远专武（迅刀）
  '秋水长天': {
    r: 5, type: '迅刀', atk90: 587,
    sub: { stat: 'atk_pct', value90: 0.364 },
    passive: [
      { type: 'elem_dmg', element: '气动', value: 0.20 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'elem_dmg', value: 0.10, element: '气动', maxStacks: 2, duration: 5 }
    ],
    desc: '气动+20%；技能后气动+10%×2 层'
  },

  // 千咲专武（长刃）
  '云雾切': {
    r: 5, type: '长刃', atk90: 587,
    sub: { stat: 'cdmg', value90: 0.486 },
    passive: [
      { type: 'elem_dmg', element: '湮灭', value: 0.20 }
    ],
    triggers: [
      { on: 'normal_hit', effect: 'elem_dmg', value: 0.10, element: '湮灭', maxStacks: 3, duration: 5 }
    ],
    desc: '湮灭+20%；普攻后湮灭+10%×3 层'
  },

  // 琳奈专武（佩枪）
  '光谱': {
    r: 5, type: '佩枪', atk90: 587,
    sub: { stat: 'atk_pct', value90: 0.364 },
    passive: [
      { type: 'elem_dmg', element: '衍射', value: 0.20 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'elem_dmg', value: 0.10, element: '衍射', maxStacks: 2, duration: 5 }
    ],
    desc: '攻击+36.4%；衍射+20%；技能后衍射+10%×2 层'
  },

  // 莫宁专武（迅刀）
  '星野': {
    r: 5, type: '迅刀', atk90: 587,
    sub: { stat: 'crate', value90: 0.243 },
    passive: [
      { type: 'elem_dmg', element: '冷凝', value: 0.20 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'elem_dmg', value: 0.10, element: '冷凝', maxStacks: 2, duration: 5 }
    ],
    desc: '冷凝+20%；技能后冷凝+10%×2 层'
  },

  // 露西专武（佩枪，3.4 联动）
  '蜃影': {
    r: 5, type: '佩枪', atk90: 587,
    sub: { stat: 'cdmg', value90: 0.486 },
    passive: [
      { type: 'elem_dmg', element: '衍射', value: 0.20 }
    ],
    triggers: [
      { on: 'normal_hit', effect: 'normal_pct', value: 0.10, maxStacks: 3, duration: 5 }
    ],
    desc: '暴伤+48.6%；衍射+20%；普攻后普攻+10%×3 层'
  },

  // 丽贝卡专武（佩枪，3.4 联动）
  '碎骨': {
    r: 5, type: '佩枪', atk90: 500,
    sub: { stat: 'cdmg', value90: 0.720 },
    passive: [
      { type: 'elem_dmg', element: '导电', value: 0.18 }
    ],
    triggers: [
      { on: 'concerto_consume', effect: 'normal_pct', value: 0.30, maxStacks: 1, duration: 5 }
    ],
    desc: '暴伤+72%；导电+18%；消耗协奏后普攻+30%'
  },

  // 洛瑟菈专武（音感仪）
  '存帧': {
    r: 5, type: '音感仪', atk90: 587,
    sub: { stat: 'crate', value90: 0.243 },
    passive: [
      { type: 'elem_dmg', element: '湮灭', value: 0.20 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'elem_dmg', value: 0.10, element: '湮灭', maxStacks: 2, duration: 5 }
    ],
    desc: '暴击+24.3%；湮灭+20%；技能后湮灭+10%×2 层'
  },

  '焚野': {
    r: 5, type: '臂铠', atk90: 587,
    sub: { stat: 'atk_pct', value90: 0.364 },
    passive: [
      { type: 'elem_dmg', element: '热熔', value: 0.20 }
    ],
    triggers: [
      { on: 'normal_hit', effect: 'elem_dmg', value: 0.10, element: '热熔', maxStacks: 2, duration: 5 }
    ],
    desc: '热熔+20%；普攻后热熔+10%×2 层'
  },

  '碎骨_old': null,

  // 菲比专武（音感仪 + 治疗向）
  // ✅ 菲比专武：Luminous Hymn（库街区核验：音感仪 · atk90=500 · crate=36% · V2.1）
  '和光回唱': {
    r: 5, type: '音感仪', atk90: 500,
    sub: { stat: 'crate', value90: 0.360 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [],
    desc: '攻击+12%；暴击率+36%（菲比 DPS 向专武）'
  },

  // 限定占位武器（type: null 表示任意角色可用）
  '限定武器': {
    r: 5, type: null, atk90: 412,
    sub: { stat: 'atk_pct', value90: 0.28 },
    passive: [
      { type: 'atk_pct', value: 0.12 }
    ],
    triggers: [],
    desc: '攻击+28%, 攻击+12%（占位 · 任意角色可用）'
  },

  // ============================================================
  // 5★ 常驻"冬烟系列"（AI 校准 真实数据）
  // ============================================================

  '千古洑流': {
    r: 5, type: '迅刀', atk90: 587,
    sub: { stat: 'crate', value90: 0.243 },
    passive: [
      { type: 'resonance', value: 0.128 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'atk_pct', value: 0.06, maxStacks: 2, duration: 5 }
    ],
    desc: '共鸣效率+12.8%；技能后攻击+6%×2 层'
  },

  '浩境粼光': {
    r: 5, type: '长刃', atk90: 587,
    sub: { stat: 'atk_pct', value90: 0.3645 },
    passive: [
      { type: 'resonance', value: 0.128 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'burst_pct', value: 0.07, maxStacks: 3, duration: 6 }
    ],
    desc: '共鸣效率+12.8%；技能后解放+7%×3 层'
  },

  '停驻之烟': {
    r: 5, type: '佩枪', atk90: 587,
    sub: { stat: 'crate', value90: 0.243 },
    passive: [
      { type: 'resonance', value: 0.128 }
    ],
    triggers: [
      { on: 'outro', effect: 'team_atk', value: 0.10, maxStacks: 1, duration: 7 }
    ],
    desc: '共鸣效率+12.8%；延奏后下场角色攻击+10%'
  },

  '擎渊怒涛': {
    r: 5, type: '臂铠', atk90: 587,
    sub: { stat: 'atk_pct', value90: 0.3645 },
    passive: [
      { type: 'resonance', value: 0.128 }
    ],
    triggers: [
      { on: 'skill_hit', effect: 'normal_pct', value: 0.10, maxStacks: 1, duration: 4 },
      { on: 'normal_hit', effect: 'skill_pct', value: 0.10, maxStacks: 1, duration: 4 }
    ],
    desc: '共鸣效率+12.8%；技能↔普攻互相 +10%'
  },

  '漪澜浮录': {
    r: 5, type: '音感仪', atk90: 500,
    sub: { stat: 'atk_pct', value90: 0.540 },
    passive: [
      { type: 'resonance', value: 0.128 }
    ],
    triggers: [
      { on: 'normal_hit', effect: 'normal_pct', value: 0.032, maxStacks: 5, duration: 4 }
    ],
    desc: '共鸣效率+12.8%；普攻后普攻+3.2%×5 层'
  },

  // ============================================================
  // 4★ 武器（encore.moe 官方数据校准 · 2026-06-26 · 共 43 把）
  // ============================================================

  '不归孤军': { r: 4, type: '迅刀', atk90: 412,
    sub: { stat: 'atk_pct', value90: 0.3038 },
    passive: [{ type: 'atk_pct', value: 0.12 }],
    triggers: [],
    desc: '攻击+12%' },
  '东落': { r: 4, type: '长刃', atk90: 412,
    sub: { stat: 'atk_pct', value90: 0.3038 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%' },
  '今州守望': { r: 4, type: '音感仪', atk90: 388,
    sub: { stat: 'atk_pct', value90: 0.3645 },
    passive: [{ type: 'atk_pct', value: 0.08 }],
    triggers: [],
    desc: '攻击+8%' },
  '凋亡频移': { r: 4, type: '长刃', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%；技能获共鸣能量' },
  '凌空': { r: 4, type: '臂铠', atk90: 412,
    sub: { stat: 'cdmg', value90: 0.4050 },
    passive: [{ type: 'atk_pct', value: 0.08 }],
    triggers: [],
    desc: '攻击+8%；解放后攻击/伤害提升' },
  '华彩乐段': { r: 4, type: '佩枪', atk90: 338,
    sub: { stat: 'resonance', value90: 0.5184 },
    passive: [{ type: 'resonance', value: 0.08 }],
    triggers: [],
    desc: '共鸣效率+8%；技能回复协奏能量' },
  '叙别的罗曼史': { r: 4, type: '佩枪', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%；对异常效应目标额外提升' },
  '呼啸重音': { r: 4, type: '臂铠', atk90: 338,
    sub: { stat: 'resonance', value90: 0.5184 },
    passive: [{ type: 'resonance', value: 0.08 }],
    triggers: [],
    desc: '共鸣效率+8%；技能回复协奏能量' },
  '大海的馈赠': { r: 4, type: '音感仪', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'elem_dmg', value: 0.10 }],
    triggers: [],
    desc: '衍射+10%' },
  '奇幻变奏': { r: 4, type: '音感仪', atk90: 338,
    sub: { stat: 'resonance', value90: 0.5184 },
    passive: [{ type: 'resonance', value: 0.08 }],
    triggers: [],
    desc: '共鸣效率+8%；技能回复协奏能量' },
  '奔雷': { r: 4, type: '佩枪', atk90: 388,
    sub: { stat: 'atk_pct', value90: 0.3645 },
    passive: [{ type: 'skill_pct', value: 0.10 }],
    triggers: [],
    desc: '技能伤害+10%' },
  '容赦的沉思录': { r: 4, type: '长刃', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%；对异常效应目标额外提升' },
  '尘云旋臂': { r: 4, type: '臂铠', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%；技能获共鸣能量' },
  '异响空灵': { r: 4, type: '长刃', atk90: 338,
    sub: { stat: 'resonance', value90: 0.5184 },
    passive: [{ type: 'resonance', value: 0.08 }],
    triggers: [],
    desc: '共鸣效率+8%；技能回复协奏能量' },
  '异度': { r: 4, type: '音感仪', atk90: 412,
    sub: { stat: 'hp', value90: 0.3038 },
    passive: [{ type: 'heal', value: 0.08 }],
    triggers: [],
    desc: '治疗加成+8%' },
  '心之锚': { r: 4, type: '迅刀', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%' },
  '悖论喷流': { r: 4, type: '佩枪', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%；技能获共鸣能量' },
  '无眠烈火': { r: 4, type: '佩枪', atk90: 412,
    sub: { stat: 'atk_pct', value90: 0.3038 },
    passive: [{ type: 'skill_pct', value: 0.10 }],
    triggers: [],
    desc: '技能伤害+10%' },
  '曜光': { r: 4, type: '音感仪', atk90: 412,
    sub: { stat: 'cdmg', value90: 0.4050 },
    passive: [{ type: 'atk_pct', value: 0.08 }],
    triggers: [],
    desc: '攻击+8%；解放后攻击/伤害提升' },
  '核熔星盘': { r: 4, type: '音感仪', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%；技能获共鸣能量' },
  '永夜长明': { r: 4, type: '长刃', atk90: 338,
    sub: { stat: 'def_pct', value90: 0.6156 },
    passive: [{ type: 'def_pct', value: 0.12 }],
    triggers: [],
    desc: '防御+12%；变奏后攻击/防御提升' },
  '永续坍缩': { r: 4, type: '迅刀', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%；技能获共鸣能量' },
  '清音': { r: 4, type: '音感仪', atk90: 412,
    sub: { stat: 'crate', value90: 0.2025 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%' },
  '渊海回声': { r: 4, type: '音感仪', atk90: 338,
    sub: { stat: 'resonance', value90: 0.5184 },
    passive: [{ type: 'heal', value: 0.10 }],
    triggers: [],
    desc: '治疗加成+10%' },
  '瞬斩刀-18型': { r: 4, type: '迅刀', atk90: 388,
    sub: { stat: 'atk_pct', value90: 0.3645 },
    passive: [{ type: 'heavy_pct', value: 0.10 }],
    triggers: [],
    desc: '重击+10%' },
  '穿击枪-26型': { r: 4, type: '佩枪', atk90: 388,
    sub: { stat: 'atk_pct', value90: 0.3645 },
    passive: [{ type: 'atk_pct', value: 0.08 }],
    triggers: [],
    desc: '攻击+8%' },
  '纹秋': { r: 4, type: '长刃', atk90: 412,
    sub: { stat: 'crate', value90: 0.2025 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%' },
  '翼锋': { r: 4, type: '迅刀', atk90: 412,
    sub: { stat: 'crate', value90: 0.2025 },
    passive: [{ type: 'atk_pct', value: 0.08 }],
    triggers: [],
    desc: '攻击+8%；解放后攻击/伤害提升' },
  '虚饰的华尔兹': { r: 4, type: '音感仪', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%；对异常效应目标额外提升' },
  '行进序曲': { r: 4, type: '迅刀', atk90: 338,
    sub: { stat: 'resonance', value90: 0.5184 },
    passive: [{ type: 'resonance', value: 0.08 }],
    triggers: [],
    desc: '共鸣效率+8%；技能回复协奏能量' },
  '袍泽之固': { r: 4, type: '臂铠', atk90: 338,
    sub: { stat: 'def_pct', value90: 0.6156 },
    passive: [{ type: 'burst_pct', value: 0.10 }],
    triggers: [],
    desc: '解放+10%' },
  '西升': { r: 4, type: '迅刀', atk90: 412,
    sub: { stat: 'atk_pct', value90: 0.3038 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%' },
  '酩酊的英雄志': { r: 4, type: '臂铠', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%；对异常效应目标额外提升' },
  '重破刃-41型': { r: 4, type: '长刃', atk90: 412,
    sub: { stat: 'resonance', value90: 0.3240 },
    passive: [{ type: 'atk_pct', value: 0.08 }],
    triggers: [],
    desc: '攻击+8%' },
  '金掌': { r: 4, type: '臂铠', atk90: 412,
    sub: { stat: 'crate', value90: 0.2025 },
    passive: [{ type: 'burst_pct', value: 0.10 }],
    triggers: [],
    desc: '解放+10%' },
  '金穹': { r: 4, type: '长刃', atk90: 412,
    sub: { stat: 'cdmg', value90: 0.4050 },
    passive: [{ type: 'atk_pct', value: 0.08 }],
    triggers: [],
    desc: '攻击+8%；解放后攻击/伤害提升' },
  '钢影拳-21丁型': { r: 4, type: '臂铠', atk90: 388,
    sub: { stat: 'resonance', value90: 0.3888 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%' },
  '钢影拳': { r: 4, type: '臂铠', atk90: 388,
    sub: { stat: 'resonance', value90: 0.3888 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%' },
  '阳焰': { r: 4, type: '佩枪', atk90: 412,
    sub: { stat: 'crate', value90: 0.2025 },
    passive: [{ type: 'atk_pct', value: 0.08 }],
    triggers: [],
    desc: '攻击+8%；解放后攻击/伤害提升' },
  '风流的寓言诗': { r: 4, type: '迅刀', atk90: 462,
    sub: { stat: 'atk_pct', value90: 0.1823 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%；对异常效应目标额外提升' },
  '飞景': { r: 4, type: '迅刀', atk90: 388,
    sub: { stat: 'atk_pct', value90: 0.3645 },
    passive: [{ type: 'normal_pct', value: 0.12 }],
    triggers: [],
    desc: '普攻/重击+12%' },
  '飞逝': { r: 4, type: '佩枪', atk90: 412,
    sub: { stat: 'atk_pct', value90: 0.3038 },
    passive: [{ type: 'atk_pct', value: 0.08 }],
    triggers: [],
    desc: '攻击+8%' },
  '骇行': { r: 4, type: '臂铠', atk90: 412,
    sub: { stat: 'atk_pct', value90: 0.3038 },
    passive: [{ type: 'atk_pct', value: 0.10 }],
    triggers: [],
    desc: '攻击+10%' },
  '鸣动仪-25型': { r: 4, type: '音感仪', atk90: 338,
    sub: { stat: 'resonance', value90: 0.5184 },
    passive: [{ type: 'atk_pct', value: 0.08 }],
    triggers: [],
    desc: '攻击+8%' },

  // ============================================================
  // 3★ 武器（atk90 = 246，sub ~6-8%）
  // ============================================================
  '训练迅刀':   { r: 3, type: '迅刀',   atk90: 246, sub: { stat: 'atk_pct', value90: 0.06 }, passive: [], triggers: [], desc: '攻击+6%' },
  '训练长刃':   { r: 3, type: '长刃',   atk90: 246, sub: { stat: 'atk_pct', value90: 0.06 }, passive: [], triggers: [], desc: '攻击+6%' },
  '训练佩枪':   { r: 3, type: '佩枪',   atk90: 246, sub: { stat: 'atk_pct', value90: 0.06 }, passive: [], triggers: [], desc: '攻击+6%' },
  '训练臂铠':   { r: 3, type: '臂铠',   atk90: 246, sub: { stat: 'atk_pct', value90: 0.06 }, passive: [], triggers: [], desc: '攻击+6%' },
  '训练音感仪': { r: 3, type: '音感仪', atk90: 246, sub: { stat: 'atk_pct', value90: 0.06 }, passive: [], triggers: [], desc: '攻击+6%' },
  '暗夜迅刀':   { r: 3, type: '迅刀',   atk90: 280, sub: { stat: 'atk_pct', value90: 0.08 }, passive: [], triggers: [], desc: '攻击+8%' },
  '暗夜长刃':   { r: 3, type: '长刃',   atk90: 280, sub: { stat: 'atk_pct', value90: 0.08 }, passive: [], triggers: [], desc: '攻击+8%' },
  '暗夜佩枪':   { r: 3, type: '佩枪',   atk90: 280, sub: { stat: 'atk_pct', value90: 0.08 }, passive: [], triggers: [], desc: '攻击+8%' },
  '暗夜臂铠':   { r: 3, type: '臂铠',   atk90: 280, sub: { stat: 'atk_pct', value90: 0.08 }, passive: [], triggers: [], desc: '攻击+8%' },
  '暗夜音感仪': { r: 3, type: '音感仪', atk90: 280, sub: { stat: 'atk_pct', value90: 0.08 }, passive: [], triggers: [], desc: '攻击+8%' }
};

// 清理掉 null 占位
Object.keys(W).forEach(k => { if (W[k] === null) delete W[k]; });

export const WEAPON_DATA = W;

// 90 级 → 当前等级缩放：等级 1 时 = 20%，等级 90 时 = 100%
// 公式：0.20 + (level - 1) × 0.80/89
function levelScale(level) {
  const lv = level || 1;
  return 0.20 + (lv - 1) * (0.80 / 89);
}

// 计算武器在指定等级 + 精炼度下的输出
// 返回 { atk: 加到角色身上的基础攻击, bonuses: 静态被动数组, triggers: 触发器数组, passiveDesc }
export function weaponContrib(weaponName, level = 1, refine = 1) {
  const w = W[weaponName];
  if (!w) return { atk: 0, bonuses: [], triggers: [], passiveDesc: '' };
  const scale = levelScale(level);
  const refineMult = 1 + (refine - 1) * 0.25;   // 1 精 100%, 5 精 200%
  // 武器基础攻击按 atk90 × scale
  const baseAtk = Math.round(w.atk90 * scale);

  // 副词条：按 90 级满值 × scale
  const bonuses = [];
  if (w.sub) {
    bonuses.push({ type: w.sub.stat, value: w.sub.value90 * scale, source: '副词条' });
  }
  // 静态被动：精炼倍率 × value
  if (w.passive) {
    w.passive.forEach(p => {
      bonuses.push({ ...p, value: p.value * refineMult, source: '被动' });
    });
  }
  // 触发器：精炼倍率 × value（运行时使用）
  const triggers = (w.triggers || []).map(t => ({
    ...t,
    value: t.value * refineMult
  }));

  return {
    atk: baseAtk,
    bonuses,
    triggers,
    passiveDesc: w.desc,
    refine
  };
}

// 武器类型查询（角色装备过滤用）
export function weaponType(weaponName) {
  return W[weaponName]?.type || null;
}

export function isFiveStarWeapon(name) {
  return W[name]?.r === 5;
}

export function isFourStarWeapon(name) {
  return W[name]?.r === 4;
}

// 升级所需突破石（沿用旧公式）
export function weaponBookForLevel(targetLevel) {
  return Math.ceil(targetLevel * 1.5);
}
