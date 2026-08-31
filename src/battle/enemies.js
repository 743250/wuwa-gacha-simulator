// 敌人数据库 · 2026-06-25 世界 BOSS 移植
//
// 数值基准：官方 wuthering.wiki Lv90 数据（原始值，未缩放）
import { growthRatioTo90 } from '../data/enemiesGrowth.js';
import { S } from '../state.js';
import { ELEMENTS } from './elements.js';
// 世界 BOSS 战斗：世界等级 × 讨伐等级 → 直接取官方数值
//   索拉Ⅰ ×0.30 / 索拉Ⅱ ×0.40 / 索拉Ⅲ ×0.50
//   讨伐等级：初始 Lv40 → 击败 +10（封顶 90）→ 失败 -20（下限 40）
// 副本池（模拟战训等）：世界 BOSS 作为训练靶时自动 ×0.10
//
// mechanic.type 一览（含新增）：
//   none, burn_team, freeze, shield, enrage, reflect, minion,
//   thunder_chain, dive, aoe_freeze, data_lock, aero_erosion  ← 保留
//   inferno_mark, parry_dive, havoc_erosion, turtle_reflect,  ← 新增
//   debris_stun, bubble_heal, flight_tide, dreamless,          ← 新增
//   blade_turrets                                              ← 新增

export function formatEnemyMechanic(mechanic, opts = {}) {
  const m = mechanic;
  if (!m || m.type === 'none') return '';
  const desc = {
    // 原有
    burn_team: () => `每${m.cycle}回合点燃全队 ${(m.dmgPct * 100).toFixed(0)}% HP`,
    freeze: () => `每${m.cycle}回合冻结 1 人`,
    shield: () => `HP ≤ ${(m.threshold * 100).toFixed(0)}% 时生成 ${m.value} 护盾`,
    enrage: () => `HP ≤ ${(m.threshold * 100).toFixed(0)}% 时狂暴 +${(m.atkBonus * 100).toFixed(0)}%`,
    reflect: () => `每${m.cycle}回合反弹 ${(m.value * 100).toFixed(0)}% 受伤`,
    minion: () => `每${m.cycle}回合召唤小怪`,
    thunder_chain: () => `每${m.cycle}回合雷电连段`,
    dive: () => `每${m.cycle}回合俯冲压制`,
    aoe_freeze: () => `每${m.cycle}回合冰雾减速`,
    data_lock: () => `每${m.cycle}回合封锁 1 名技能`,
    aero_erosion: () => `每${m.cycle}回合施加气动侵蚀`,
    // 新增
    inferno_mark: () => `灼伤标记：被命中 +${m.phase1Stacks||2}层（P2全队+1），每层扣ATK×${((m.markDmgPct||0.8)*100).toFixed(0)}%，${m.maxStacks||5}层满爆ATK×${((m.burstMult||3)*100).toFixed(0)}%`,
    parry_dive: () => `每${m.cycle||5}回合俯冲（可重击弹反→瘫痪）& 每${m.shotCycle||3}回合追踪弹×${m.shotCount||3}`,
    havoc_erosion: () => `攻击附加湮灭之蚀：每层扣${((m.dotPct||0.03)*100).toFixed(0)}%HP，${m.maxStacks||5}层满触发蚀爆`,
    turtle_reflect: () => `每${m.cycle||4}回合反击姿态反弹${((m.value||0.4)*100).toFixed(0)}% & 高防`,
    debris_stun: () => `每${m.cycle||5}回合掉落残骸→投掷可眩晕BOSS 1回合`,
    bubble_heal: () => `每${m.cycle||4}回合自疗绿泡（可击破抢治疗）& 不可弹反`,
    flight_tide: () => `每${m.flightCycle||5}回合飞空无敌1回合 & 水洼延迟爆炸`,
    dreamless: () => `三阶段切换（≥70%/40-70%/<40%）& 弹反戟`,
    blade_turrets: () => `2把浮空剑每${m.turretCycle||2}回合自射击 & 弹反推刺`,
    // 2.5-2.8 新增
    void_decay: () => `命中叠虚蚀（ATK×${((m.dotPct||0.5)*100).toFixed(0)}%/层满${m.maxStacks||5}层）& 每${m.aoeCycle||3}回合虚质暗潮 AOE`,
    alev_rift: () => `每${m.riftCycle||3}回合维度裂缝单体高伤 & 每${m.quakeCycle||5}回合双界震荡 AOE·HP<${((m.threshold||0.6)*100).toFixed(0)}% 追加裂隙溅射`,
    decay_mark: () => `命中叠湮灭印记（受击+${((m.stackDmgPct||0.05)*100).toFixed(0)}%/层·满${m.maxStacks||5}层）& 每${m.consumeCycle||4}回印记爆发`,
    harmonic_disrupt: () => `命中叠谐度干涉（满${m.maxStacks||3}层受击+${((m.dmgAmpPct||0.25)*100).toFixed(0)}%）& 每${m.shotCycle||2}回合多段射击 & 每${m.impactCycle||4}回谐度冲击`,
  }[m.type];
  if (!desc) return '';
  const text = desc();
  if (!opts.includeNext || !m.cycle || !opts.turn) return text;
  const useCycle = m.cycle || 3;
  const left = useCycle - (opts.turn % useCycle);
  return `${text} · 下次：${left}回合后`;
}

function res(selfElement) {
  const out = {};
  ELEMENTS.forEach(e => {
    out[e] = e === selfElement ? 0.40 : 0.10;
  });
  return out;
}

// ===== 世界 BOSS 数据（Lv90 官方原始值）=====
export const ENEMIES = {
  // ===== 小怪（encore.moe 官方 Lv90 数值）=====
  '火鬃狼': { // ID: 310000280 · 轻波级 · 热熔
    hp: 106576, atk: 3417, def: 800, element: '热熔', class: 'Common',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '火鬃狼,轻波级热熔残象,烈焰鬃毛狼'
  },
  '惊蛰猎手': { // ID: 310000030 · 轻波级 · 导电
    hp: 85074, atk: 3417, def: 800, element: '导电', class: 'Common',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '惊蛰猎手,轻波级导电残象,雷电猎手'
  },
  '幽翎火': { // ID: 310000430 · 轻波级 · 湮灭
    hp: 106576, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '幽翎火,轻波级湮灭残象,幽翎火羽'
  },

  // ===== 普通级 Common（encore.moe 官方 Lv90 数值，副本池专用）=====
  '碎獠猪': { // ID: 310000190 · 轻波级 · 物理
    hp: 60300, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') },
    mechanic: { type: 'none' },
    description: '碎獠猪,轻波级物理残象,獠牙猛兽近战冲锋'
  },
  '雷鬃狼': { // ID: 310000380 · 轻波级 · 导电
    hp: 106576, atk: 3417, def: 800, element: '导电', class: 'Common',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '雷鬃狼,轻波级导电残象,雷电狼形掠食者'
  },
  '咕咕河豚': { // ID: 310000120 · 轻波级 · 冷凝
    hp: 60300, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '咕咕河豚,轻波级冷凝残象,圆胖冰属河豚'
  },
  '呼咻咻': { // ID: 310000100 · 轻波级 · 气动
    hp: 60300, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '呼咻咻,轻波级气动残象,浮空气团生物'
  },
  '咔嚓嚓': { // ID: 310000080 · 轻波级 · 热熔
    hp: 60300, atk: 3417, def: 800, element: '热熔', class: 'Common',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '咔嚓嚓,轻波级热熔残象,蟹钳形热熔兵卒'
  },
  '阿嗞嗞': { // ID: 310000090 · 轻波级 · 衍射
    hp: 60300, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '阿嗞嗞,轻波级衍射残象,折线形衍射生命'
  },
  '呜咔咔': { // ID: 310000110 · 轻波级 · 湮灭
    hp: 60300, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '呜咔咔,轻波级湮灭残象,发条机关湮灭造物'
  },

  // ===== 精英级 Elite（encore.moe 官方 Lv90 数值，副本池专用）=====
  '坚岩斗士': { // ID: 320000010 · 巨浪级 · 物理
    hp: 206140, atk: 4490, def: 800, element: '物理', class: 'Elite',
    resist: { 物理: 0.40, ...res('物理') },
    mechanic: { type: 'none' },
    description: '坚岩斗士,巨浪级物理残象,高防岩石战士'
  },
  '紫羽鹭': { // ID: 320000020 · 巨浪级 · 导电
    hp: 172017, atk: 5026, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '紫羽鹭,巨浪级导电残象,紫色羽翼雷电苍鹭'
  },
  '青羽鹭': { // ID: 320000030 · 巨浪级 · 气动
    hp: 172017, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '青羽鹭,巨浪级气动残象,青色羽翼疾风苍鹭'
  },
  '绿熔蜥': { // ID: 320000080 · 巨浪级 · 热熔
    hp: 114990, atk: 5026, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '绿熔蜥,巨浪级热熔残象,翠绿焰火蜥蜴'
  },
  '巡哨机傀': { // ID: 320000180 · 巨浪级 · 冷凝
    hp: 353851, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '巡哨机傀,巨浪级冷凝残象,冰属自走玩偶侦察兵'
  },
  '奏谕乐师': { // ID: 320000040 · 巨浪级 · 导电
    hp: 137427, atk: 6366, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '奏谕乐师,巨浪级导电残象,雷电乐章乐师'
  },
  '磐石守卫': { // ID: 320000060 · 巨浪级 · 衍射
    hp: 353851, atk: 5026, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '磐石守卫,巨浪级衍射残象,衍射岩石守护雕像'
  },

  // ================================================================
  // 17 世界 BOSS（2026-06-25 移植）
  // ================================================================

  // 01 燎照之骑 · 灼伤标记 + 双阶段
  '燎照之骑': { // encore.moe ID: 330000020 (Lv90)
    hp: 833910, atk: 4456, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'),
    mechanic: {
      type: 'inferno_mark',
      markDmgPct: 0.80,     // 每层回合末扣 ATK×80%
      maxStacks: 5,          // 满 5 层爆炸
      burstMult: 3.0,        // 爆炸倍率 ATK×300%
      phase1Stacks: 2,       // P1 攻击给 2 层
      threshold: 0.75         // HP<75% 进入 P2
    },
    description: '火系骑士，灼伤标记叠层满爆。P1 每次攻击给 2 层灼伤，P2（HP<75%）全队灼伤'
  },

  // 02 飞廉之猩 · 抓投 + 冲击波 + 狂暴
  '飞廉之猩': { // encore.moe ID: 330000050 (Lv90)
    hp: 806799, atk: 5796, def: 800, element: '气动', class: 'Overlord',
    resist: res('气动'),
    mechanic: {
      type: 'enrage',
      threshold: 0.4,
      atkBonus: 0.4,
      // 扩展字段：抓投（combat.js 的 grab hook 读取）
      grabCycle: 4,
      grabMult: 2.5,
      shockwaveCycle: 3,
      shockwaveMult: 0.8
    },
    description: '气动猩型 BOSS。每 4 回合抓投（只可重击弹反），每 3 回合冲击波 AOE。HP<40% 狂暴，抓投频率翻倍'
  },

  // 03 朔雷之鳞 · 雷霆墙（锁切换）+ 穿甲
  '朔雷之鳞': { // encore.moe ID: 330000010 (Lv90)
    hp: 657686, atk: 5026, def: 800, element: '导电', class: 'Overlord',
    resist: res('导电'),
    mechanic: {
      type: 'thunder_chain',
      cycle: 3,
      mult: 0.7,
      // 扩展：雷霆墙锁切换
      wallLock: true           // 触发雷霆墙时锁定当前角色 1 回合
    },
    description: '高速近战雷电 BOSS。每 3 回合释放雷霆墙（锁切换 1 回合）+ 雷电连段。攻击忽略 20% 防御'
  },

  // 04 云闪之鳞 · 蓄力激光 + 双段攻击
  '云闪之鳞': { // encore.moe ID: 340000080 (Lv90)
    hp: 817550, atk: 6600, def: 800, element: '导电', class: 'Overlord',
    resist: res('导电'),
    mechanic: {
      type: 'thunder_chain',
      cycle: 3,
      mult: 0.7,
      // 扩展：激光
      laserCycle: 4,
      laserMult: 2.8,
      laserWarn: true,        // 前摇警告
      dualStrike: true        // 每回合攻击 ×2 段
    },
    description: '高速突进 BOSS。每回合 2 段攻击，每 4 回合蓄力激光（高伤单段，前摇可切坦）。HP<50% 新增飞扑'
  },

  // 05 哀声鸷 · 追踪弹 + 弹反俯冲
  '哀声鸷': { // encore.moe ID: 330000060 (Lv90)
    hp: 774546, atk: 5193, def: 800, element: '衍射', class: 'Overlord',
    resist: res('衍射'),
    mechanic: {
      type: 'parry_dive',
      cycle: 5,              // 俯冲周期
      diveMult: 2.0,
      shotCycle: 3,          // 追踪弹周期
      shotCount: 3,
      shotMult: 0.7
    },
    description: '飞行 BOSS。每 3 回合 3 发追踪弹，每 5 回合俯冲（重击弹反成功→BOSS 瘫痪 1 回合 + 受伤 +50%）'
  },

  // 06 无常凶鹭 · 湮灭之蚀 DoT + 弹反俯冲
  '无常凶鹭': { // encore.moe ID: 330000030 (Lv90)
    hp: 747434, atk: 5361, def: 800, element: '湮灭', class: 'Overlord',
    resist: res('湮灭'),
    mechanic: {
      type: 'havoc_erosion',
      dotPct: 0.03,          // 每层回合末扣 3% 最大 HP
      maxStacks: 5,
      burstMult: 2.0,        // 满层蚀爆 ATK×200%
      diveCycle: 5,
      diveMult: 1.8,
      featherCycle: 3        // 羽毛弹幕
    },
    description: '湮灭三头鸟 BOSS。所有攻击附加湮灭之蚀（每层 -3%HP/回合，5 层满蚀爆）。每 5 回合俯冲（可弹反）'
  },

  // 07 辉萤军势 · 冰翼盾（强制削韧破盾）+ 冻结累积
  '辉萤军势': { // encore.moe ID: 330000040 (Lv90)
    hp: 819420, atk: 6835, def: 800, element: '冷凝', class: 'Overlord',
    resist: res('冷凝'),
    mechanic: {
      type: 'aoe_freeze',
      cycle: 4,
      mult: 0.5,
      // 扩展：冰翼盾
      iceShieldCycle: 5,
      iceShieldPct: 0.25,    // 盾 = HP×25%
      iceShieldDmgReduc: 0.5 // 持盾减伤 50%
    },
    description: '虫群型冷凝 BOSS。每 5 回合展开冰翼盾（减伤 50%，需削韧破盾）。3 次命中同一角色→冻结。每 4 回合冰雾 AOE'
  },

  // 08 异构武装 · 双阶段（地/空）+ 冰翼盾
  '异构武装': { // encore.moe ID: 330000120 (Lv90)
    hp: 1040986, atk: 6701, def: 800, element: '冷凝', class: 'Overlord',
    resist: res('冷凝'),
    mechanic: {
      type: 'shield',
      threshold: 0.5,
      value: 20000,
      // 扩展：空中阶段
      airPhase: true,         // HP<50% 飞空，近战伤害 -30%
      airStarCycle: 3,       // 空中弹幕周期
      airStarCount: 6,
      airStarMult: 0.4,
      iceShieldCycle: 5,     // 冰翼盾（同辉萤）
      iceShieldPct: 0.25
    },
    description: '构造体 BOSS。HP<50% 生成护盾 + 飞空（近战 -30%）。每 3 回合星弹 ×6，每 5 回合冰翼盾。冰冻累积'
  },

  // 09 无归的谬误 · 延迟爆破 + Overclock
  '无归的谬误': { // encore.moe ID: 340000230 (Lv90)
    hp: 774546, atk: 4188, def: 800, element: '衍射', class: 'Overlord',
    resist: res('衍射'),
    mechanic: {
      type: 'data_lock',
      cycle: 4,
      // 扩展：延迟爆破 + Overclock
      delayedBlastCycle: 3,
      delayedBlastMult: 1.3, // 全队 AOE
      overclockThreshold: 0.3,
      overclockAtkBonus: 0.5,
      overclockDuration: 3    // 双动持续回合
    },
    description: '黑海岸数据 BOSS。每 3 回合延迟爆破（下回合全队 AOE），每 4 回合数据封锁。HP<30% Overclock 双动 3 回合'
  },

  // 10 叹息古龙 · 多技能组合 + 电锯召唤
  '叹息古龙': { // encore.moe ID: 330000131 (Lv90)
    hp: 953575, atk: 5863, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'),
    mechanic: {
      type: 'burn_team',
      cycle: 3,
      dmgPct: 0.08,
      // 扩展：电锯 + 俯冲
      sawCycle: 5,           // 追踪电锯周期
      sawCount: 3,
      sawDuration: 2,        // 电锯持续回合
      sawMult: 0.5,          // 每锯每回合伤害倍率
      diveCycle: 6,          // 俯冲（可弹反）
      diveMult: 2.0
    },
    description: '龙形热熔 BOSS。每 3 回合火息全队，每 5 回合召唤 3 电锯（每回合自动攻击），每 6 回合俯冲（可弹反瘫痪）'
  },

  // 11 鸣钟之龟 · 反击姿态 + 高防
  '鸣钟之龟': { // encore.moe ID: 340000020 (Lv90)
    hp: 753044, atk: 4020, def: 800, element: '冷凝', class: 'Calamity',
    resist: res('冷凝'),   // DEF ×1.5（高防）
    mechanic: {
      type: 'turtle_reflect',
      cycle: 4,
      value: 0.40,           // 反弹 40%
      iceBreathCycle: 5,
      iceBreathMult: 1.4,
      spinCycle: 3,
      spinMult: 1.0
    },
    description: '高防龟型 BOSS（DEF ×1.5）。每 4 回合龟姿反弹 40% 伤害，每 5 回合冰息 + 减速，每 3 回合回旋 AOE'
  },

  // 12 聚械机偶 · 残骸眩晕 + 风壁
  '聚械机偶': { // encore.moe ID: 340000060 (Lv90)
    hp: 819420, atk: 6500, def: 800, element: '导电', class: 'Overlord',
    resist: res('导电'),
    mechanic: {
      type: 'debris_stun',
      cycle: 5,              // 残骸掉落周期
      windWallCycle: 4,
      windWallDmgReduc: 0.4,
      windWallDuration: 2,
      spinCycle: 3,
      spinMult: 0.9
    },
    description: '机械 BOSS（最弱 Overlord）。每 5 回合掉落残骸→投掷可眩晕 BOSS 1 回合。每 4 回合风壁减伤 40%。公认最弱'
  },

  // 13 罗蕾莱 · 自疗绿泡 + 不可弹反
  '罗蕾莱': { // encore.moe ID: 330000111 (Lv90)
    hp: 994242, atk: 5193, def: 800, element: '湮灭', class: 'Overlord',
    resist: res('湮灭'),
    mechanic: {
      type: 'bubble_heal',
      cycle: 4,              // 绿泡周期
      healPct: 0.15,         // 回复 HP×15%
      bubbleHpMult: 2.0,     // 绿泡 HP = ATK×2
      noParry: true,         // 全局不可弹反
      // P2: HP<50% 翻倍 + Siren Song
      threshold: 0.5,
      sirenOnce: true        // Siren Song 仅触发一次（3 绿泡）
    },
    description: '湮灭 BOSS（不可弹反）。每 4 回合召唤绿泡自疗（可击破抢治疗）。HP<50% 泡泡频率翻倍 + Siren Song（3 泡齐出）'
  },

  // 14 无妄者 · 三阶段 + 武器切换
  '无妄者': { // encore.moe ID: 340000070 (Lv90)
    hp: 1004993, atk: 5528, def: 800, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: {
      type: 'dreamless',
      // 三阶段阈值
      p1Threshold: 0.70,     // ≥70% P1 战戟
      p2Threshold: 0.40,     // 40-70% P2 剑镰
      // P1: 重戟
      p1Mult: 1.3,
      p1GrabCycle: 4,
      p1GrabMult: 1.8,
      // P2: 剑镰连段 + 戟弹反
      p2ComboMult: 0.75,
      p2VoidCycle: 4,
      p2VoidMult: 2.0,
      // P3: 红温双动
      p3AtkBonus: 0.3,
      p3AoeCycle: 3,
      p3AoeMult: 1.5,
      // 阶段过渡减伤
      transitionDmgReduc: 0.5
    },
    description: '湮灭·无妄者（最复杂世界 BOSS）。三阶段：P1 戟（≥70%）→ P2 剑镰（40-70%）→ P3 红温双动（<40%）。P2 戟可弹反'
  },

  // 15 海之女 · 飞空无敌 + 延迟水洼
  '海之女': { // encore.moe ID: 340000181 (Lv90) · class 对齐 compact Overlord
    hp: 953575, atk: 5193, def: 800, element: '气动', class: 'Overlord',
    resist: res('气动'),
    mechanic: {
      type: 'flight_tide',
      flightCycle: 5,        // 飞空周期
      landMult: 1.3,         // 落地 AOE 倍率
      puddleCycle: 3,        // 水洼周期
      puddleMult: 1.2,       // 水洼爆炸倍率
      tideCycle: 4,          // 黑潮周期
      tideMult: 0.8,         // 黑潮倍率
      threshold: 0.5         // HP<50% 水洼翻倍
    },
    description: '气动 BOSS。每 5 回合飞空 1 回合（无敌），落地 AOE。每 3 回合水洼延迟爆炸（可切人躲避）。HP<50% 水洼翻倍'
  },

  // 16 荣耀狮像 · 浮空剑双伤害源 + 弹反推刺
  '荣耀狮像': { // encore.moe ID: 340000141 (Lv90) · class 对齐 compact Overlord
    hp: 953575, atk: 5863, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'),
    mechanic: {
      type: 'blade_turrets',
      turretCount: 2,        // 浮空剑数量
      turretCycle: 2,        // 每把剑射击周期
      turretMult: 0.5,       // 每发伤害
      spearCycle: 4,         // 矛雨周期
      spearMult: 0.9,        // 全队 AOE
      thrustCycle: 5,        // 推刺周期（可弹反）
      thrustMult: 2.2
    },
    description: '竞技场守护石像。2 把浮空剑每 2 回合自动射击。每 4 回合矛雨 AOE，每 5 回合推刺（重击弹反→瘫痪 1 回合）'
  },

  // 17 梦魇亚当·重锤 · 溅射 + 降防 + 狂暴
  '梦魇亚当·重锤': { // encore.moe ID: 340000290 (Lv90)
    hp: 1040986, atk: 5026, def: 800, element: '物理', class: 'Overlord',
    resist: { 物理: 0.40, ...res('物理') },
    mechanic: {
      type: 'enrage',
      threshold: 0.4,
      atkBonus: 0.5,
      // 扩展：溅射 + 降防
      splash: true,          // 攻击溅射相邻 50%
      splashPct: 0.5,
      defDown: true,         // 命中降防 10%（叠乘，上限 3 层）
      defDownPct: 0.10,
      defDownMax: 3,
      defDownDuration: 2
    },
    description: '3.4 联动重型 BOSS。攻击溅射相邻 50%，命中降防 10%（上限 3 层）。HP<40% 狂暴双动 +50%'
  },

  // ================================================================
  // 18-21 2.5-2.8 新增世界 BOSS（2026-07-10 补）
  // ================================================================

  // 18 虚诞虫 · 虚质侵蚀（叠层 debuff + AOE 暗潮）
  '虚诞虫': { // encore.moe ID: 340000240 · Lv90 compact 对齐（2026-07-25）
    hp: 4674386, atk: 3350, def: 800, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: {
      type: 'void_decay',
      dotPct: 0.5,           // 每层回合末扣 ATK×50%
      maxStacks: 5,          // 满 5 层
      aoeCycle: 3,           // 每 3 回合潮 AOE
      aoeMult: 0.9,
      threshold: 0.5         // HP<50% 进入 P2（暗潮频率翻倍）
    },
    description: '虚诞虫。高维湮灭灾厄。命中附加虚蚀叠层（回合末 ATK×50%/层，满 5 层），每 3 回合虚质暗潮 AOE。HP<50% 暗潮+叠层频率翻倍'
  },

  // 19 阿列夫一造物 · 双元素维度裂隙
  '阿列夫一造物': { // encore.moe ID: 340000270 · Lv90 面板对齐 compact（2026-07-25）
    hp: 1040986, atk: 4188, def: 800, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: {
      type: 'alev_rift',
      riftCycle: 3,          // 每 3 回合理裂隙（单体高伤）
      riftMult: 1.8,
      quakeCycle: 5,         // 每 5 回合双界震荡AOE）
      quakeMult: 1.0,
      threshold: 0.6,        // HP<60% P2：额外裂隙溅射
      p2ExtraMult: 0.6
    },
    description: '阿列夫一造物。鸣式阿列夫一的高维造物。每 3 回合维度裂缝单体高伤，每 5 回合界震荡 AOE。HP<60% 进入 P2，每回合追加裂隙溅射'
  },

  // 20 万囮牢·朽躯 · 湮灭印记叠层爆发
  '万囮牢·朽躯': { // encore.moe ID: 340000300 (Lv90 · 模拟器简化版)
    hp: 770000, atk: 5200, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'),
    mechanic: {
      type: 'decay_mark',
      maxStacks: 5,          // 满 5 层
      stackDmgPct: 0.05,     // 每层受击 +5%
      consumeCycle: 4,       // 每 4 回合爆发印记
      consumeMult: 1.5,      // 爆发伤害倍率
      aoeCycle: 3,
      aoeMult: 0.8
    },
    description: '万囮牢·朽躯。残损巨影，把守净化谕令。命中附加湮灭印记（每层受击+5%，满 5 层），每 3 回合朽躯震荡 AOE，每 4 回合印记爆发额外伤害'
  },

  // 21 千傀重楼 · 谐度破坏叠层 + 多段射击
  '千傀重楼': { // encore.moe ID: 340000310 (Lv90 · 模拟器简化版)
    hp: 1000000, atk: 5800, def: 800, element: '湮灭', class: 'Overlord',
    resist: res('湮灭'),
    mechanic: {
      type: 'harmonic_disrupt',
      maxStacks: 3,          // 官方：3 层谐度干涉
      dmgAmpPct: 0.25,       // 满层受击 +25%
      shotCycle: 2,          // 每 2 回合多段射击
      shotCount: 2,
      shotMult: 0.6,
      impactCycle: 4,        // 每 4 回合谐度冲击
      impactMult: 1.2,
      ampMult: 0.5           // 满层目标额外 +50% 冲击伤害
    },
    description: '千傀重楼。巨型机傀。命中附加谐度干涉3 层受+25%），每 2 回合千傀射击×2，每 4 回合谐度冲击（满层目标额外+50%）'
  },

  // ===== 剧情 / 周本 BOSS（保留）=====
  '角': { // encore.moe ID: 340000090 (Lv90)
    hp: 962924, atk: 3551, def: 800, element: '衍射', class: 'Calamity',
    resist: res('衍射'),
    mechanic: { type: 'minion', cycle: 5, hp: 8000, atk: 600 },
    description: '今汐相关岁主，每 5 回合召唤分身'
  },
  // 本地旧名 → 对齐 compact「伤痕·光暗逆位 / 伤痕·异生梦魇」面板（API 无裸名「伤痕」）
  '伤痕': { // ≈ 伤痕·光暗逆位 330000100
    hp: 817550, atk: 4054, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'),
    mechanic: { type: 'enrage', threshold: 0.5, atkBonus: 0.6 },
    description: '剧情旧名「伤痕」· 面板同伤痕·光暗逆位（热熔怒涛）'
  },
  '伤痕·梦魇形态': { // ≈ 伤痕·异生梦魇 340000050（元素以 API 衍射为准）
    hp: 817550, atk: 4054, def: 800, element: '衍射', class: 'Calamity',
    resist: res('衍射'),
    mechanic: { type: 'enrage', threshold: 0.4, atkBonus: 0.7 },
    description: '剧情旧名「伤痕·梦魇形态」· 面板同伤痕·异生梦魇（衍射灾厄）'
  },
  '鸣式·利维亚坦': { // encore.moe ID: 340000200 (Lv90) · 元素以 compact 为准（气动；抗性表气动+湮灭双高）
    hp: 1402316, atk: 2513, def: 800, element: '气动', class: 'Calamity',
    resist: { 物理: 0.10, 热熔: 0.10, 湮灭: 0.40, 气动: 0.40, 冷凝: 0.10, 衍射: 0.10, 导电: 0.10 },
    mechanic: { type: 'minion', cycle: 4, hp: 10000, atk: 700 },
    description: '灾厄级周本 BOSS（气动主属性）。每 4 回合召唤鸣式残响'
  },
  '无冠者': { // encore.moe ID: 340000010 (Lv90) · class 对齐 compact Overlord
    hp: 322533, atk: 2010, def: 800, element: '湮灭', class: 'Overlord',
    resist: res('湮灭'),
    mechanic: { type: 'enrage', threshold: 0.5, atkBonus: 0.3 },
    description: '剧情 BOSS（怒涛级），HP 低于 50% 狂暴'
  },
  '赫卡忒': { // encore.moe ID: 340000190 (Lv90)
    hp: 993307, atk: 5863, def: 800, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: { type: 'minion', cycle: 4, hp: 6000, atk: 500 },
    description: '后期 BOSS，每 4 回合召唤幻象'
  },

  // ===== 召唤物 =====
  '幻象': {
    hp: 6000, atk: 500, def: 200, element: '湮灭',
    resist: res('湮灭'),
    mechanic: { type: 'none' },
    description: '被召唤的幻象', isMinion: true
  },
  '机偶小弟': {
    hp: 4000, atk: 400, def: 200, element: '导电',
    resist: res('导电'),
    mechanic: { type: 'none' },
    description: '被聚械机偶召唤的小弟', isMinion: true
  },
  '鸣式残响': {
    hp: 10000, atk: 700, def: 400, element: '湮灭',
    resist: res('湮灭'),
    mechanic: { type: 'none' },
    description: '被鸣式·利维亚坦召唤', isMinion: true
  },

  // ===== 无音区专属 BOSS（encore.moe Lv90 官方值 · 2.1+ 声骸套装守关）=====
  '梦魇·哀声鸷': { // encore ID: 330000200 · API 稀有度巨浪 Elite，但 HP/定位为无音区守关 → sim 仍 Overlord 缩放
    hp: 774546, atk: 5193, def: 800, element: '衍射', class: 'Overlord',
    resist: res('衍射'), mechanic: {type:'parry_dive',cycle:5,diveMult:2,shotCycle:3,shotCount:3,shotMult:0.7},
    description: '梦魇形态哀声鸷。此间永驻之光（菲比）声骸守关 BOSS'
  },
  '共鸣回响·芙露德莉斯': { // encore Lv90 · 灾厄级 · 气动
    hp: 1402316, atk: 4188, def: 800, element: '气动', class: 'Calamity',
    resist: res('气动'), mechanic: { type: 'aero_erosion', cycle: 4 },
    description: '灾厄级气动 BOSS。流云逝尽之空 / 愿戴荣光之旅（卡提希娅）声骸守关'
  },
  '共鸣回响·鸣式·利维亚坦': { // encore Lv90 · 灾厄级 · 气动
    hp: 1402316, atk: 2513, def: 800, element: '气动', class: 'Calamity',
    resist: res('气动'), mechanic: { type: 'minion', cycle: 4 },
    description: '灾厄级鸣式 BOSS。命理崩毁之弦 / 焚羽猎魔之影声骸守关。每 4 回合召唤鸣式残响'
  },
  '辛吉勒姆': { // encore Lv90 · 灾厄级 · 衍射
    hp: 1301349, atk: 4188, def: 800, element: '衍射', class: 'Calamity',
    resist: res('衍射'), mechanic: {type:'enrage',threshold:0.4,atkBonus:0.4},
    description: '灾厄级衍射 BOSS。长路启航之星 / 斑驳粉饰之沫（布兰特）声骸守关'
  },
  '格洛犸图': { // encore Lv90 · 精英 · 冷凝
    hp: 220631, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '精英冷凝构造体。雪落无声之愿（绯雪）声骸守关 BOSS'
  },
  '无铭探索者': { // encore Lv90 · 领主级 · 气动
    hp: 1040986, atk: 4188, def: 800, element: '气动', class: 'Overlord',
    resist: res('气动'), mechanic: {type:'enrage',threshold:0.5,atkBonus:0.35},
    description: '领主级气动 BOSS。剪心辑梦之影 / 听唤语义之愿声骸守关'
  },
  '梦魇·赫卡忒': { // encore Lv90 · 灾厄级 · 湮灭
    hp: 1213938, atk: 5863, def: 800, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'), mechanic: { type: 'minion', cycle: 4 },
    description: '梦魇形态赫卡忒。失序彼岸之梦声骸守关。每 4 回合召唤幻象'
  },
  '伪作的神王': { // encore Lv90 · 领主级 · 导电
    hp: 1213938, atk: 5863, def: 800, element: '导电', class: 'Overlord',
    resist: res('导电'), mechanic: { type: 'shield', threshold: 0.5, value: 30000 },
    description: '领主级导电 BOSS。荣斗铸锋之冠声骸守关。HP≤50% 生成护盾'
  },
  '共鸣回响·芬莱克': { // encore Lv90 · 领主级 · 气动
    hp: 1215340, atk: 5863, def: 800, element: '气动', class: 'Overlord',
    resist: res('气动'), mechanic: { type: 'aero_erosion', cycle: 4 },
    description: '领主级气动 BOSS。息界同调之律声骸守关'
  },
  '海维夏': { // encore Lv90 · 领主级 · 衍射
    hp: 774546, atk: 4188, def: 800, element: '衍射', class: 'Overlord',
    resist: res('衍射'), mechanic: {type:'enrage',threshold:0.45,atkBonus:0.4},
    description: '领主级衍射 BOSS。逆光跃彩之约 / 流金溯真之式声骸守关'
  },
  '炉芯机骸': { // encore Lv90 · 领主级 · 热熔
    hp: 1040986, atk: 4188, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'), mechanic: { type: 'enrage', threshold: 0.3, atkBonus: 0.5 },
    description: '领主级热熔机械 BOSS。星构寻辉之环声骸守关。HP≤30% 狂暴'
  },
  '共鸣回响·梦魇亚当·重锤': { // encore Lv90 · 领主级 · 物理
    hp: 1040986, atk: 5026, def: 800, element: '物理', class: 'Overlord',
    resist: res('物理'), mechanic: {type:'enrage',threshold:0.4,atkBonus:0.5,splash:true,splashPct:0.5,defDown:true,defDownPct:0.1,defDownMax:3,defDownDuration:2},
    description: '领主级物理 BOSS。碎梦亡鬼之魇声骸守关'
  },

  // ===== 2026-07-25：docs/sources/enemies/encore-enemies-compact 有、ENEMIES 缺 =====
  // 面板 = compact.lv90*；机制沿用同类 BOSS 简化模板（非 ACT 复刻）

  '达妮娅': { // ID: 340000280 · 海啸级 · 热熔
    hp: 1040986, atk: 4188, def: 800, element: '热熔', class: 'Calamity',
    resist: res('热熔'),
    mechanic: { type: 'enrage', threshold: 0.4, atkBonus: 0.5 },
    description: '灾厄级热熔 BOSS（达妮娅）。HP≤40% 狂暴'
  },
  '共鸣回响·达妮娅': { // ID: 340000281 · 周本/声骸回响
    hp: 1040986, atk: 4188, def: 800, element: '热熔', class: 'Calamity',
    resist: res('热熔'),
    mechanic: { type: 'enrage', threshold: 0.4, atkBonus: 0.5 },
    description: '共鸣回响·达妮娅。斑驳粉饰之沫相关周本/守关（热熔）'
  },
  '共鸣回响·鸣式·虚造神型': { // ID: 340000271 · 海啸级 · 湮灭
    hp: 1040986, atk: 4188, def: 800, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: { type: 'minion', cycle: 4, hp: 8000, atk: 600 },
    description: '共鸣回响·鸣式·虚造神型。每 4 回合召唤鸣式残响'
  },
  '伤痕·异生梦魇': { // ID: 340000050 · 海啸级 · 衍射
    hp: 817550, atk: 4054, def: 800, element: '衍射', class: 'Calamity',
    resist: res('衍射'),
    mechanic: { type: 'enrage', threshold: 0.45, atkBonus: 0.55 },
    description: '伤痕·异生梦魇。衍射灾厄变体，HP≤45% 狂暴'
  },
  '伤痕·光暗逆位': { // ID: 330000100 · 怒涛级 · 热熔
    hp: 817550, atk: 4054, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'),
    mechanic: { type: 'enrage', threshold: 0.5, atkBonus: 0.5 },
    description: '伤痕·光暗逆位。热熔领主变体，HP≤50% 狂暴'
  },
  // 本体名别名（dungeon/文案有时不写「共鸣回响·」前缀）
  '芙露德莉斯': { // → 与 共鸣回响·芙露德莉斯 同面板
    hp: 1402316, atk: 4188, def: 800, element: '气动', class: 'Calamity',
    resist: res('气动'), mechanic: { type: 'aero_erosion', cycle: 4 },
    description: '芙露德莉斯（本体名）。同共鸣回响·芙露德莉斯'
  },
  '芬莱克': { // → 与 共鸣回响·芬莱克 同面板
    hp: 1215340, atk: 5863, def: 800, element: '气动', class: 'Overlord',
    resist: res('气动'), mechanic: { type: 'aero_erosion', cycle: 4 },
    description: '芬莱克（本体名）。同共鸣回响·芬莱克'
  },

  // 异相·* / 梦魇变体（encore compact；无独立面板者回落本体 Lv90）
  '异相·哀声鸷': {
    hp: 774546, atk: 5193, def: 800, element: '衍射', class: 'Overlord',
    resist: res('衍射'), mechanic: { type: 'parry_dive', cycle: 5, diveMult: 2.0, shotCycle: 3, shotCount: 3, shotMult: 0.7 },
    description: '异相·哀声鸷。同哀声鸷面板'
  },
  '异相·云闪之鳞': {
    hp: 817550, atk: 6600, def: 800, element: '导电', class: 'Overlord',
    resist: res('导电'), mechanic: {type:'thunder_chain',cycle:3,mult:0.7,laserCycle:4,laserMult:2.8,laserWarn:true,dualStrike:true},
    description: '异相·云闪之鳞。同云闪之鳞面板'
  },
  '异相·飞廉之猩': {
    hp: 806799, atk: 5796, def: 800, element: '气动', class: 'Overlord',
    resist: res('气动'), mechanic: { type: 'enrage', threshold: 0.5, atkBonus: 0.5 },
    description: '异相·飞廉之猩。同飞廉之猩面板'
  },
  '异相·无常凶鹭': { // compact 有独立 Lv90
    hp: 747434, atk: 5361, def: 800, element: '湮灭', class: 'Overlord',
    resist: res('湮灭'), mechanic: { type: 'havoc_erosion', dotPct: 0.03, maxStacks: 5, burstMult: 2.0, diveCycle: 5, diveMult: 1.8, featherCycle: 3 },
    description: '异相·无常凶鹭'
  },
  '异相·无妄者': { // compact 有独立 Lv90
    hp: 1004993, atk: 5528, def: 800, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'), mechanic: {type:'dreamless',p1Threshold:0.7,p2Threshold:0.4,p1Mult:1.3,p1GrabCycle:4,p1GrabMult:1.8,p2ComboMult:0.75,p2VoidCycle:4,p2VoidMult:2,p3AtkBonus:0.3,p3AoeCycle:3,p3AoeMult:1.5,transitionDmgReduc:0.5},
    description: '异相·无妄者'
  },
  '异相·燎照之骑': { // compact 有独立 Lv90
    hp: 833910, atk: 4456, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'), mechanic: {type:'inferno_mark',markDmgPct:0.8,maxStacks:5,burstMult:3,phase1Stacks:2,threshold:0.75},
    description: '异相·燎照之骑'
  },
  '异相·异构武装': { // compact：热熔 / 833910·4456（本体异构武装为冷凝）
    hp: 833910, atk: 4456, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'), mechanic: {type:'shield',threshold:0.5,value:20000,airPhase:true,airStarCycle:3,airStarCount:6,airStarMult:0.4,iceShieldCycle:5,iceShieldPct:0.25},
    description: '异相·异构武装。热熔变体'
  },
  '异相·罗蕾莱': { // compact 有独立 Lv90
    hp: 994242, atk: 5193, def: 800, element: '湮灭', class: 'Overlord',
    resist: res('湮灭'), mechanic: {type:'bubble_heal',cycle:4,healPct:0.15,bubbleHpMult:2,noParry:true,threshold:0.5,sirenOnce:true},
    description: '异相·罗蕾莱'
  },
  '异相·无冠者': {
    hp: 322533, atk: 2010, def: 800, element: '湮灭', class: 'Overlord',
    resist: res('湮灭'), mechanic: {type:'enrage',threshold:0.5,atkBonus:0.3},
    description: '异相·无冠者。同无冠者面板'
  },
  '异相·无归的谬误': {
    hp: 774546, atk: 4188, def: 800, element: '衍射', class: 'Overlord',
    resist: res('衍射'), mechanic: {type:'data_lock',cycle:4,delayedBlastCycle:3,delayedBlastMult:1.3,overclockThreshold:0.3,overclockAtkBonus:0.5,overclockDuration:3},
    description: '异相·无归的谬误。同无归的谬误面板'
  },
  '异相·荣耀狮像': {
    hp: 953575, atk: 5863, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'), mechanic: {type:'blade_turrets',turretCount:2,turretCycle:2,turretMult:0.5,spearCycle:4,spearMult:0.9,thrustCycle:5,thrustMult:2.2},
    description: '异相·荣耀狮像。同荣耀狮像面板'
  },
  '异相·伪作的神王': {
    hp: 1213938, atk: 5863, def: 800, element: '导电', class: 'Overlord',
    resist: res('导电'), mechanic: { type: 'shield', threshold: 0.5 },
    description: '异相·伪作的神王。同伪作的神王面板'
  },
  '异相·辛吉勒姆': {
    hp: 1301349, atk: 4188, def: 800, element: '衍射', class: 'Calamity',
    resist: res('衍射'), mechanic: {type:'enrage',threshold:0.4,atkBonus:0.4},
    description: '异相·辛吉勒姆。同辛吉勒姆面板'
  },
  '异相·炉芯机骸': {
    hp: 1040986, atk: 4188, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'), mechanic: { type: 'enrage', threshold: 0.45, atkBonus: 0.5 },
    description: '异相·炉芯机骸。同炉芯机骸面板'
  },
  '梦魇·燎照之骑': { // compact 巨浪 Elite · 面板同燎照之骑
    hp: 833910, atk: 4456, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '梦魇·燎照之骑。巨浪级梦魇变体'
  },
  '异相·梦魇·燎照之骑': {
    hp: 833910, atk: 4456, def: 800, element: '热熔', class: 'Overlord',
    resist: res('热熔'), mechanic: {type:'inferno_mark',markDmgPct:0.8,maxStacks:5,burstMult:3,phase1Stacks:2,threshold:0.75},
    description: '异相·梦魇·燎照之骑。回落燎照面板'
  },
  '异相·梦魇·哀声鸷': {
    hp: 774546, atk: 5193, def: 800, element: '衍射', class: 'Overlord',
    resist: res('衍射'), mechanic: { type: 'parry_dive', cycle: 5, diveMult: 2.0, shotCycle: 3, shotCount: 3, shotMult: 0.7 },
    description: '异相·梦魇·哀声鸷。回落哀声鸷面板'
  },

  // 巨浪级精英（compact 有独立 Lv90，此前未入库）
  '巡游骑士': {
    hp: 701625, atk: 4020, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '巡游骑士。巨浪级导电精英'
  },
  '游鳞机枢': {
    hp: 353851, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '游鳞机枢。巨浪级冷凝精英'
  },
  '琉璃刀伶': {
    hp: 226708, atk: 5026, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '琉璃刀伶。巨浪级导电精英'
  },
  '踏光兽': {
    hp: 668437, atk: 5026, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '踏光兽。巨浪级衍射精英'
  },
  '异相·巡游骑士': {
    hp: 833910, atk: 4456, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '异相·巡游骑士。热熔变体'
  },
  '异相·游鳞机枢': {
    hp: 353851, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '异相·游鳞机枢'
  },
  '异相·琉璃刀伶': {
    hp: 833910, atk: 4456, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '异相·琉璃刀伶。热熔变体'
  },
  '异相·踏光兽': {
    hp: 668437, atk: 5026, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '异相·踏光兽'
  },
  '异相·磐石守卫': { // compact 面板显著低于本体
    hp: 106576, atk: 3417, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '异相·磐石守卫'
  },

  // ===== 巨浪级 Elite 补全（encore-enemies-compact Lv90 · 2026-07-25）=====
  '振铎乐师': { // ID: 320000050 · compact Lv90
    hp: 137427, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '振铎乐师。巨浪级·湮灭'
  },
  '冥渊守卫': { // ID: 320000070 · compact Lv90
    hp: 416488, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '冥渊守卫。巨浪级·湮灭'
  },
  '刺玫菇': { // ID: 320000090 · compact Lv90
    hp: 114990, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '刺玫菇。巨浪级·湮灭'
  },
  '暗鬃狼': { // ID: 320000100 · compact Lv90
    hp: 172017, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '暗鬃狼。巨浪级·湮灭'
  },
  '嚣风戏猿': { // ID: 320000110 · compact Lv90
    hp: 172017, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '嚣风戏猿。巨浪级·气动'
  },
  '箭簇熊': { // ID: 320000120 · compact Lv90
    hp: 295889, atk: 5026, def: 800, element: '物理', class: 'Elite',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '箭簇熊。巨浪级·物理'
  },
  '车刃镰': { // ID: 320000130 · compact Lv90
    hp: 172017, atk: 3417, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '车刃镰。巨浪级·气动'
  },
  '流放者首领': { // ID: 320000140 · compact Lv90
    hp: 175289, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '流放者首领。巨浪级·湮灭'
  },
  '流放者工匠': { // ID: 320000150 · compact Lv90
    hp: 175289, atk: 5026, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '流放者工匠。巨浪级·衍射'
  },
  '处刑人': { // ID: 320000160 · compact Lv90
    hp: 175289, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '处刑人。巨浪级·湮灭'
  },
  '躁乱戏猿': { // ID: 320000170 · compact Lv90
    hp: 172017, atk: 3417, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '躁乱戏猿。巨浪级·气动'
  },
  '戏猿': { // ID: 320000111 · compact Lv90
    hp: 172017, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '戏猿。巨浪级·气动'
  },
  '雪鬃狼': { // ID: 320000190 · compact Lv90
    hp: 172017, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '雪鬃狼。巨浪级·冷凝'
  },
  '幻昼骑士': { // ID: 320000230 · compact Lv90
    hp: 668437, atk: 4020, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '幻昼骑士。巨浪级·衍射'
  },
  '暗夜骑士': { // ID: 320000240 · compact Lv90
    hp: 668437, atk: 4020, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '暗夜骑士。巨浪级·湮灭'
  },
  '毒冠贵族': { // ID: 320000250 · compact Lv90
    hp: 238394, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '毒冠贵族。巨浪级·冷凝'
  },
  '持刃贵族': { // ID: 320000260 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '持刃贵族。巨浪级·冷凝'
  },
  '凝水贵族': { // ID: 320000270 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '凝水贵族。巨浪级·冷凝'
  },
  '浮灵偶': { // ID: 320000280 · compact Lv90
    hp: 223436, atk: 5026, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '浮灵偶。巨浪级·热熔'
  },
  '巨布偶': { // ID: 320000300 · compact Lv90
    hp: 223436, atk: 5026, def: 800, element: '物理', class: 'Elite',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '巨布偶。巨浪级·物理'
  },
  '梦魇·飞廉之猩': { // ID: 330000140 · compact Lv90
    hp: 806799, atk: 5796, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '梦魇·飞廉之猩。巨浪级·导电'
  },
  '梦魇·无常凶鹭': { // ID: 330000150 · compact Lv90
    hp: 747434, atk: 5361, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '梦魇·无常凶鹭。巨浪级·湮灭'
  },
  '梦魇·云闪之鳞': { // ID: 330000160 · compact Lv90
    hp: 817550, atk: 6600, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '梦魇·云闪之鳞。巨浪级·导电'
  },
  '梦魇·朔雷之鳞': { // ID: 330000170 · compact Lv90
    hp: 657686, atk: 5026, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '梦魇·朔雷之鳞。巨浪级·导电'
  },
  '梦魇·无冠者': { // ID: 330000180 · compact Lv90
    hp: 1003591, atk: 5897, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '梦魇·无冠者。巨浪级·湮灭'
  },
  '重塑雕像的拳砾': { // ID: 320000310 · compact Lv90
    hp: 206140, atk: 4490, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '重塑雕像的拳砾。巨浪级·衍射'
  },
  '飓力熊': { // ID: 320000320 · compact Lv90
    hp: 295889, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '飓力熊。巨浪级·气动'
  },
  '荣光节使': { // ID: 320000330 · compact Lv90
    hp: 223436, atk: 4188, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '荣光节使。巨浪级·衍射'
  },
  '梦魇·辉萤军势': { // ID: 340000130 · compact Lv90
    hp: 819420, atk: 6835, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '梦魇·辉萤军势。巨浪级·冷凝'
  },
  '角鳄': { // ID: 320000340 · compact Lv90
    hp: 668437, atk: 4020, def: 800, element: '物理', class: 'Elite',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '角鳄。巨浪级·物理'
  },
  '传道者的遗形': { // ID: 320000350 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '传道者的遗形。巨浪级·气动'
  },
  '梦魇·凯尔匹': { // ID: 340000110 · compact Lv90
    hp: 598321, atk: 3350, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '梦魇·凯尔匹。巨浪级·冷凝'
  },
  '炽冠角斗家': { // ID: 320000360 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '炽冠角斗家。巨浪级·热熔'
  },
  '羽冠角斗家': { // ID: 320000370 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '羽冠角斗家。巨浪级·气动'
  },
  '耀冠角斗家': { // ID: 320000380 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '耀冠角斗家。巨浪级·衍射'
  },
  '凛冠角斗家': { // ID: 320000390 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '凛冠角斗家。巨浪级·冷凝'
  },
  '雷冠角斗家': { // ID: 320000400 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '雷冠角斗家。巨浪级·导电'
  },
  '冥冠角斗家': { // ID: 320000410 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '冥冠角斗家。巨浪级·湮灭'
  },
  '裁夺者': { // ID: 320000420 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '裁夺者。巨浪级·湮灭'
  },
  '凯尔匹': { // ID: 340000112 · compact Lv90
    hp: 598321, atk: 3350, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '凯尔匹。巨浪级·冷凝'
  },
  '梦魇·振铎乐师': { // ID: 320000430 · compact Lv90
    hp: 233719, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '梦魇·振铎乐师。巨浪级·湮灭'
  },
  '蚀脊龙': { // ID: 320000440 · compact Lv90
    hp: 668437, atk: 4020, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '蚀脊龙。巨浪级·热熔'
  },
  '梦魇·紫羽鹭': { // ID: 320000450 · compact Lv90
    hp: 172017, atk: 5026, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '梦魇·紫羽鹭。巨浪级·导电'
  },
  '梦魇·青羽鹭': { // ID: 320000460 · compact Lv90
    hp: 172017, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '梦魇·青羽鹭。巨浪级·气动'
  },
  '梦魇·绿熔蜥': { // ID: 320000470 · compact Lv90
    hp: 114990, atk: 5026, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '梦魇·绿熔蜥。巨浪级·热熔'
  },
  '梦魇·刺玫菇': { // ID: 320000480 · compact Lv90
    hp: 114990, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '梦魇·刺玫菇。巨浪级·湮灭'
  },
  '双极·星升辉铳': { // ID: 320000490 · compact Lv90
    hp: 442197, atk: 5026, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '双极·星升辉铳。巨浪级·衍射'
  },
  '双极·渊陨重锋': { // ID: 320000500 · compact Lv90
    hp: 442197, atk: 5026, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '双极·渊陨重锋。巨浪级·导电'
  },
  '隐迹铁影': { // ID: 320000560 · compact Lv90
    hp: 121067, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '隐迹铁影。巨浪级·湮灭'
  },
  '霜鳞蜃甲': { // ID: 320000570 · compact Lv90
    hp: 212217, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '霜鳞蜃甲。巨浪级·冷凝'
  },
  '风鳞蜃甲': { // ID: 320000580 · compact Lv90
    hp: 212217, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '风鳞蜃甲。巨浪级·气动'
  },
  '莳植机麋': { // ID: 320000510 · compact Lv90
    hp: 212217, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '莳植机麋。巨浪级·气动'
  },
  '矿岩机麋': { // ID: 320000520 · compact Lv90
    hp: 212217, atk: 5026, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '矿岩机麋。巨浪级·导电'
  },
  '重工铁蹄': { // ID: 320000530 · compact Lv90
    hp: 331414, atk: 5026, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '重工铁蹄。巨浪级·热熔'
  },
  '探隧重机': { // ID: 320000540 · compact Lv90
    hp: 331414, atk: 5026, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '探隧重机。巨浪级·导电'
  },
  '锯袭铁影': { // ID: 320000550 · compact Lv90
    hp: 161266, atk: 5026, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '锯袭铁影。巨浪级·热熔'
  },
  '冠顶械隼': { // ID: 320000590 · compact Lv90
    hp: 294486, atk: 5026, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '冠顶械隼。巨浪级·导电'
  },
  '冠顶苍隼': { // ID: 320000600 · compact Lv90
    hp: 294486, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '冠顶苍隼。巨浪级·气动'
  },
  '残星·刑锯帽匠': { // ID: 320000620 · compact Lv90
    hp: 212217, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '残星·刑锯帽匠。巨浪级·湮灭'
  },
  '噬影人·喜忧': { // ID: 320000630 · compact Lv90
    hp: 442197, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '噬影人·喜忧。巨浪级·湮灭'
  },
  '噬影人·狂喜': { // ID: 320000640 · compact Lv90
    hp: 226708, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '噬影人·狂喜。巨浪级·湮灭'
  },
  '噬影人·悲戚': { // ID: 320000650 · compact Lv90
    hp: 442197, atk: 5026, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '噬影人·悲戚。巨浪级·湮灭'
  },
  '迷胧幻蛾': { // ID: 320000660 · compact Lv90
    hp: 212217, atk: 5026, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '迷胧幻蛾。巨浪级·衍射'
  },
  '共鸣回响·冠顶苍隼': { // ID: 320000601 · compact Lv90
    hp: 294486, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '共鸣回响·冠顶苍隼。巨浪级·气动'
  },

  // ===== 轻波级 Common 补全（encore-enemies-compact Lv90 · 2026-07-25）=====
  '先锋幼岩': { // ID: 310000010 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '先锋幼岩。轻波级·物理'
  },
  '裂变幼岩': { // ID: 310000020 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '裂变幼岩。轻波级·物理'
  },
  '破霜猎手': { // ID: 310000040 · compact Lv90
    hp: 85074, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '破霜猎手。轻波级·冷凝'
  },
  '巡徊猎手': { // ID: 310000050 · compact Lv90
    hp: 85074, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '巡徊猎手。轻波级·气动'
  },
  '鸣泣战士': { // ID: 310000060 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '热熔', class: 'Common',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '鸣泣战士。轻波级·热熔'
  },
  '审判战士': { // ID: 310000070 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '审判战士。轻波级·湮灭'
  },
  '啾啾河豚': { // ID: 310000130 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '啾啾河豚。轻波级·气动'
  },
  '冷凝棱镜': { // ID: 310000140 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '冷凝棱镜。轻波级·冷凝'
  },
  '热熔棱镜': { // ID: 310000150 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '热熔', class: 'Common',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '热熔棱镜。轻波级·热熔'
  },
  '衍射棱镜': { // ID: 310000160 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '衍射棱镜。轻波级·衍射'
  },
  '湮灭棱镜': { // ID: 310000170 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '湮灭棱镜。轻波级·湮灭'
  },
  '游弋蝶': { // ID: 310000180 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '游弋蝶。轻波级·衍射'
  },
  '遁地鼠': { // ID: 310000200 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '遁地鼠。轻波级·湮灭'
  },
  '绿熔蜥（稚形）': { // ID: 310000210 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '热熔', class: 'Common',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '绿熔蜥（稚形）。轻波级·热熔'
  },
  '刺玫菇（稚形）': { // ID: 310000220 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '刺玫菇（稚形）。轻波级·湮灭'
  },
  '流放者': { // ID: 310000230 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '流放者。轻波级·物理'
  },
  '抛石幼猿': { // ID: 310000250 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '抛石幼猿。轻波级·气动'
  },
  '晶螯蝎': { // ID: 310000260 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '晶螯蝎。轻波级·物理'
  },
  '寒霜陆龟': { // ID: 310000270 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '寒霜陆龟。轻波级·冷凝'
  },
  '残星·重锤造匠': { // ID: 310000290 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '残星·重锤造匠。轻波级·物理'
  },
  '锐爪幼猿': { // ID: 310000300 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '锐爪幼猿。轻波级·气动'
  },
  '残星·枭面造匠': { // ID: 310000310 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '残星·枭面造匠。轻波级·物理'
  },
  '残星·枪肢造匠': { // ID: 310000320 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '残星·枪肢造匠。轻波级·物理'
  },
  '通行灯偶': { // ID: 310000330 · compact Lv90
    hp: 106576, atk: 4490, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '通行灯偶。轻波级·衍射'
  },
  '叮咚咚': { // ID: 310000340 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '叮咚咚。轻波级·冷凝'
  },
  '异相·寒霜陆龟': { // ID: 350000030 · compact Lv90
    hp: 353851, atk: 5026, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '异相·寒霜陆龟。轻波级·冷凝'
  },
  '幼猿': { // ID: 310000251 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '幼猿。轻波级·气动'
  },
  '融火虫': { // ID: 310000350 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '热熔', class: 'Common',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '融火虫。轻波级·热熔'
  },
  '侏侏鸵': { // ID: 310000360 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '侏侏鸵。轻波级·物理'
  },
  '异相·叮咚咚': { // ID: 350000070 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '异相·叮咚咚。轻波级·冷凝'
  },
  '异相·咕咕河豚': { // ID: 350000100 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '异相·咕咕河豚。轻波级·冷凝'
  },
  '风鬃狼': { // ID: 310000370 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '风鬃狼。轻波级·气动'
  },
  '霜鬃狼': { // ID: 310000390 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '霜鬃狼。轻波级·冷凝'
  },
  '浮灵偶·海德': { // ID: 310000400 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '热熔', class: 'Common',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '浮灵偶·海德。轻波级·热熔'
  },
  '浮灵偶·蕾弗': { // ID: 310000410 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '浮灵偶·蕾弗。轻波级·衍射'
  },
  '浮灵偶·莱特': { // ID: 310000420 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '浮灵偶·莱特。轻波级·湮灭'
  },
  '云海妖精': { // ID: 310000440 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '云海妖精。轻波级·衍射'
  },
  '魔术先生': { // ID: 310000450 · compact Lv90
    hp: 130883, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '魔术先生。轻波级·湮灭'
  },
  '寂寞小姐': { // ID: 310000460 · compact Lv90
    hp: 130883, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '寂寞小姐。轻波级·衍射'
  },
  '工头布偶': { // ID: 310000470 · compact Lv90
    hp: 130883, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '工头布偶。轻波级·物理'
  },
  '欺诈奇藏': { // ID: 310000480 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '欺诈奇藏。轻波级·衍射'
  },
  '异相·工头布偶': { // ID: 350000130 · compact Lv90
    hp: 833910, atk: 4456, def: 800, element: '热熔', class: 'Common',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '异相·工头布偶。轻波级·热熔'
  },
  '愚金幼岩': { // ID: 310000490 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '愚金幼岩。轻波级·衍射'
  },
  '釉变幼岩': { // ID: 310000500 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '釉变幼岩。轻波级·冷凝'
  },
  '气动棱镜': { // ID: 310000510 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '气动棱镜。轻波级·气动'
  },
  '卫冕节使': { // ID: 310000520 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '卫冕节使。轻波级·物理'
  },
  '赦罪节使': { // ID: 310000530 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '赦罪节使。轻波级·衍射'
  },
  '慈悲节使': { // ID: 310000540 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '慈悲节使。轻波级·气动'
  },
  '小翼龙·气动': { // ID: 310000550 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '小翼龙·气动。轻波级·气动'
  },
  '小翼龙·导电': { // ID: 310000560 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '导电', class: 'Common',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '小翼龙·导电。轻波级·导电'
  },
  '小翼龙·冷凝': { // ID: 310000570 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '小翼龙·冷凝。轻波级·冷凝'
  },
  '小翼龙·热熔': { // ID: 310000580 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '热熔', class: 'Common',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '小翼龙·热熔。轻波级·热熔'
  },
  '小翼龙·衍射': { // ID: 310000590 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '小翼龙·衍射。轻波级·衍射'
  },
  '小翼龙·湮灭': { // ID: 310000600 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '小翼龙·湮灭。轻波级·湮灭'
  },
  '苦信者的作俑': { // ID: 310000610 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '苦信者的作俑。轻波级·气动'
  },
  '残星·深海造匠': { // ID: 310000620 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '残星·深海造匠。轻波级·冷凝'
  },
  '梦魇·审判战士': { // ID: 310000630 · compact Lv90
    hp: 130883, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '梦魇·审判战士。轻波级·湮灭'
  },
  '梦魇·破霜猎手': { // ID: 310000640 · compact Lv90
    hp: 112185, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '梦魇·破霜猎手。轻波级·冷凝'
  },
  '梦魇·惊蛰猎手': { // ID: 310000650 · compact Lv90
    hp: 85074, atk: 3417, def: 800, element: '导电', class: 'Common',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '梦魇·惊蛰猎手。轻波级·导电'
  },
  '梦魇·巡徊猎手': { // ID: 310000660 · compact Lv90
    hp: 85074, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '梦魇·巡徊猎手。轻波级·气动'
  },
  '梦魇·咕咕河豚': { // ID: 310000670 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '梦魇·咕咕河豚。轻波级·冷凝'
  },
  '梦魇·啾啾河豚': { // ID: 310000680 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '梦魇·啾啾河豚。轻波级·气动'
  },
  '夜归队员': { // ID: 310000690 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '夜归队员。轻波级·物理'
  },
  '帮派打手': { // ID: 310000710 · compact Lv90
    hp: 106576, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '帮派打手。轻波级·物理'
  },
  '梦魇·绿熔蜥（稚形）': { // ID: 310000720 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '热熔', class: 'Common',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '梦魇·绿熔蜥（稚形）。轻波级·热熔'
  },
  '梦魇·刺玫菇（稚形）': { // ID: 310000730 · compact Lv90
    hp: 75258, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '梦魇·刺玫菇（稚形）。轻波级·湮灭'
  },
  '梦魇·呜咔咔': { // ID: 310000750 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '梦魇·呜咔咔。轻波级·湮灭'
  },
  '梦魇·侏侏鸵': { // ID: 310000760 · compact Lv90
    hp: 60300, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '梦魇·侏侏鸵。轻波级·物理'
  },
  '颤栗战士': { // ID: 310000740 · compact Lv90
    hp: 100499, atk: 3417, def: 800, element: '导电', class: 'Common',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '颤栗战士。轻波级·导电'
  },
  '莳植熊蜂': { // ID: 310000770 · compact Lv90
    hp: 57028, atk: 3417, def: 800, element: '气动', class: 'Common',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '莳植熊蜂。轻波级·气动'
  },
  '矿岩熊蜂': { // ID: 310000780 · compact Lv90
    hp: 57028, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '矿岩熊蜂。轻波级·湮灭'
  },
  '岩蛛S4型': { // ID: 310000790 · compact Lv90
    hp: 71051, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '岩蛛S4型。轻波级·衍射'
  },
  '噼啪啪': { // ID: 310000820 · compact Lv90
    hp: 57028, atk: 3417, def: 800, element: '导电', class: 'Common',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '噼啪啪。轻波级·导电'
  },
  '执刃流民': { // ID: 310000800 · compact Lv90
    hp: 100499, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '执刃流民。轻波级·物理'
  },
  '雷杖流民': { // ID: 310000810 · compact Lv90
    hp: 71051, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '雷杖流民。轻波级·物理'
  },
  '冰盈舞者': { // ID: 310000830 · compact Lv90
    hp: 100499, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '冰盈舞者。轻波级·冷凝'
  },
  '影烁者': { // ID: 310000840 · compact Lv90
    hp: 71051, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '影烁者。轻波级·湮灭'
  },
  '残星·扼拊爪匠': { // ID: 310000850 · compact Lv90
    hp: 100499, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '残星·扼拊爪匠。轻波级·物理'
  },
  '残星·餮餍袖匠': { // ID: 310000860 · compact Lv90
    hp: 71051, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '残星·餮餍袖匠。轻波级·物理'
  },
  '梦魇·武装公司狗': { // ID: 310000870 · compact Lv90
    hp: 71051, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '梦魇·武装公司狗。轻波级·物理'
  },
  '梦魇·安保公司狗': { // ID: 310000880 · compact Lv90
    hp: 71051, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '梦魇·安保公司狗。轻波级·物理'
  },
  '梦魇·突击公司狗': { // ID: 310000890 · compact Lv90
    hp: 71051, atk: 3417, def: 800, element: '物理', class: 'Common',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '梦魇·突击公司狗。轻波级·物理'
  },

  // ===== 异相·* 零面板回落本体（API baseHp=0）=====
  '异相·荣光节使': { // 回落 荣光节使 · compact
    hp: 223436, atk: 4188, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '异相·荣光节使。回落荣光节使面板'
  },
  '异相·云海妖精': { // 回落 云海妖精 · compact
    hp: 106576, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '异相·云海妖精。回落云海妖精面板'
  },
  '异相·梦魇·无冠者': { // 回落 梦魇·无冠者 · compact
    hp: 1003591, atk: 5897, def: 800, element: '湮灭', class: 'Elite',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '异相·梦魇·无冠者。回落梦魇·无冠者面板'
  },
  '异相·欺诈奇藏': { // 回落 欺诈奇藏 · compact
    hp: 106576, atk: 3417, def: 800, element: '衍射', class: 'Common',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '异相·欺诈奇藏。回落欺诈奇藏面板'
  },
  '异相·幽翎火': { // 回落 幽翎火 · compact
    hp: 106576, atk: 3417, def: 800, element: '湮灭', class: 'Common',
    resist: res('湮灭'), mechanic: { type: 'none' },
    description: '异相·幽翎火。回落幽翎火面板'
  },
  '异相·巨布偶': { // 回落 巨布偶 · compact
    hp: 223436, atk: 5026, def: 800, element: '物理', class: 'Elite',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '异相·巨布偶。回落巨布偶面板'
  },
  '异相·角鳄': { // 回落 角鳄 · compact
    hp: 668437, atk: 4020, def: 800, element: '物理', class: 'Elite',
    resist: { 物理: 0.40, ...res('物理') }, mechanic: { type: 'none' },
    description: '异相·角鳄。回落角鳄面板'
  },
  '异相·双极·星升辉铳': { // 回落 双极·星升辉铳 · compact
    hp: 442197, atk: 5026, def: 800, element: '衍射', class: 'Elite',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '异相·双极·星升辉铳。回落双极·星升辉铳面板'
  },
  '异相·双极·渊陨重锋': { // 回落 双极·渊陨重锋 · compact
    hp: 442197, atk: 5026, def: 800, element: '导电', class: 'Elite',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '异相·双极·渊陨重锋。回落双极·渊陨重锋面板'
  },
  '异相·冰盈舞者': { // 回落 冰盈舞者 · compact
    hp: 100499, atk: 3417, def: 800, element: '冷凝', class: 'Common',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '异相·冰盈舞者。回落冰盈舞者面板'
  },
  '异相·浮灵偶': { // 回落 浮灵偶 · compact
    hp: 223436, atk: 5026, def: 800, element: '热熔', class: 'Elite',
    resist: res('热熔'), mechanic: { type: 'none' },
    description: '异相·浮灵偶。回落浮灵偶面板'
  },
  '异相·噼啪啪': { // 回落 噼啪啪 · compact
    hp: 57028, atk: 3417, def: 800, element: '导电', class: 'Common',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '异相·噼啪啪。回落噼啪啪面板'
  },
  '异相·冠顶苍隼': { // 回落 冠顶苍隼 · compact
    hp: 294486, atk: 5026, def: 800, element: '气动', class: 'Elite',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '异相·冠顶苍隼。回落冠顶苍隼面板'
  },
  '异相·格洛犸图': { // 回落 格洛犸图 · compact
    hp: 220631, atk: 5026, def: 800, element: '冷凝', class: 'Elite',
    resist: res('冷凝'), mechanic: { type: 'none' },
    description: '异相·格洛犸图。回落格洛犸图面板'
  },

};

// DEF 表（官方公式 792 + 8×等级，Lv90 = 1512）
function defForLevel(lv) {
  return 792 + 8 * lv;
}

// 按敌人名生成战斗实例
// 支持三种模式：
//   1. levelScale (旧版兼容，直接乘)
//   2. { worldTier, bossLevel } (新版世界 BOSS)
//   3. 无参数 → 默认 Lv90 满值
export function spawnEnemy(name, opts = 1.0) {
  const data = ENEMIES[name];
  if (!data) return null;

  let hpMult, atkMult;
  let enemyLv = 90;

  if (typeof opts === 'number') {
    // 兼容旧接口：number 参数直接当 scale 用（不再对世界 BOSS 额外压缩）
    hpMult = opts;
    atkMult = opts;
  } else if (opts && (opts.worldTier || opts.bossLevel)) {
    // 世界 BOSS 讨伐战：等级由三档机制决定（30-120），统一走 GrowthRates 非线性缩放
    // 允许外层传入 hp/atk 倍率（日常阶级压缩）
    const level = opts.bossLevel || 40;
    enemyLv = level;
    hpMult = typeof opts.hp === 'number' ? opts.hp : 1.0;
    atkMult = typeof opts.atk === 'number' ? opts.atk : 1.0;
  } else if (opts && typeof opts.hp === 'number') {
    // 细粒度 scale
    hpMult = opts.hp ?? opts.all ?? 1;
    atkMult = opts.atk ?? opts.all ?? 1;
    if (opts.enemyLevel) enemyLv = opts.enemyLevel;
  } else {
    hpMult = 1.0;
    atkMult = 1.0;
  }

  const bossLv = (opts && opts.bossLevel) ? opts.bossLevel : 90;
  // 所有敌人统一官方公式 DEF = 792 + 8×等级（世界 BOSS 走 bossLevel，其余走 enemyLevel）
  const useDef = defForLevel(enemyLv);
  // 所有敌人均按官方 GrowthRates 非线性曲线缩放（Lv90 为基准）
  // 公式：实际值 = 基础值 × growthRatioTo90(level)
  // 三档机制下：副本敌人用 enemyLevel，世界 BOSS 用 bossLevel
  let finalHp = data.hp * hpMult;
  let finalAtk = data.atk * atkMult;
  if (opts && typeof opts === 'object' && (opts.enemyLevel || opts.bossLevel)) {
    const lv = opts.enemyLevel || opts.bossLevel;
    const ratio = growthRatioTo90(lv);
    finalHp = data.hp * hpMult * ratio.hp;
    finalAtk = data.atk * atkMult * ratio.atk;
  }

  return {
    name,
    hp: Math.round(finalHp),
    hpMax: Math.round(finalHp),
    atk: Math.round(finalAtk),
    def: useDef,
    level: enemyLv,              // 攻击方等级，供防御乘区 (800 + 8×lv) 使用
    element: data.element,
    resist: { ...data.resist },
    mechanic: { ...data.mechanic },
    class: data.class || null,
    shield: 0,
    enraged: false,
    alive: true,
    description: data.description,
    isMinion: !!data.isMinion,
    vibration: 100,
    vibrationMax: 100,
    suppressed: 0,               // 破韧/弹反/残骸中断窗口（>0 时敌人不普攻 + periodic 静音）
    suppressedVuln: 0,           // suppressed 期间的易伤率（破韧默认 0.3 → ×1.3、弹反/残骸 0.5）
    _suppressedFresh: false,     // 本回合刚进入 suppressed，end-of-turn 不递减
    debuffs: [],                 // 风蚀/虚湮等元素异常 + 通用 debuff 容器
    // 新版 BOSS 运行时状态
    phase: 1,                    // 当前阶段（1/2/3）
    marks: {},                   // 标记追踪 { teamIdx: count }
    bossLevel: bossLv,
    _shielded: false,
    _overclockTurns: 0,          // Overclock 剩余回合
    _turrets: null,              // 浮空剑/电锯 召唤物数据
    _bubbleHp: 0,                // 绿泡 HP
    _debrisReady: false,         // 残骸可投掷
    _flightTurns: 0,             // 飞空剩余回合
    _deflectActive: false,       // 反击姿态
    _hitTracker: {}              // 冰冻累积追踪 { teamIdx: count }
  };
}
