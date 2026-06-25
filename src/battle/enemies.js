// 敌人数据库 · 2026-06-25 世界 BOSS 移植
//
// 数值基准：官方 wuthering.wiki Lv90 数据（原始值，未缩放）
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

// 副本池中的世界 BOSS 缩放（模拟战训/无音区等，非正式讨伐）
const POOL_BOSS_SCALE = 0.10;

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
    blade_turrets: () => `2把浮空剑每${m.turretCycle||2}回合自动射击 & 弹反推刺`,
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
  ['热熔', '湮灭', '气动', '冷凝', '衍射', '导电'].forEach(e => {
    out[e] = e === selfElement ? 0.40 : 0.10;
  });
  return out;
}

// ===== 世界 BOSS 数据（Lv90 官方原始值）=====
export const ENEMIES = {
  // ===== 小怪 =====
  '幼狼': {
    hp: 2500, atk: 280, def: 200, element: '气动',
    resist: res('气动'), mechanic: { type: 'none' },
    description: '咬人型小怪', class: null
  },
  '飞兽': {
    hp: 2200, atk: 260, def: 180, element: '导电',
    resist: res('导电'), mechanic: { type: 'none' },
    description: '飞行高速生物', class: null
  },
  '古老幽灵': {
    hp: 6500, atk: 420, def: 350, element: '衍射',
    resist: res('衍射'), mechanic: { type: 'none' },
    description: '虚幻型小怪', class: null
  },

  // ================================================================
  // 17 世界 BOSS（2026-06-25 移植）
  // ================================================================

  // 01 燎照之骑 · 灼伤标记 + 双阶段
  '燎照之骑': {
    hp: 468488, atk: 8912, def: 1512, element: '热熔', class: 'Overlord',
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
  '飞廉之猩': {
    hp: 453257, atk: 11592, def: 1512, element: '气动', class: 'Overlord',
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
  '朔雷之鳞': {
    hp: 459297, atk: 13200, def: 1512, element: '导电', class: 'Overlord',
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
  '云闪之鳞': {
    hp: 369486, atk: 10051, def: 1512, element: '导电', class: 'Overlord',
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
  '哀声鸷': {
    hp: 435137, atk: 10386, def: 1512, element: '衍射', class: 'Overlord',
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
  '无常凶鹭': {
    hp: 419906, atk: 10721, def: 1512, element: '湮灭', class: 'Overlord',
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
  '辉萤军势': {
    hp: 460348, atk: 13669, def: 1512, element: '冷凝', class: 'Overlord',
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
  '异构武装': {
    hp: 584823, atk: 13401, def: 1512, element: '冷凝', class: 'Overlord',
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
  '无归的谬误': {
    hp: 435137, atk: 8375, def: 1512, element: '衍射', class: 'Overlord',
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
  '叹息古龙': {
    hp: 535716, atk: 11726, def: 1512, element: '热熔', class: 'Overlord',
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
  '鸣钟之龟': {
    hp: 423058, atk: 8040, def: 2268, element: '冷凝', class: 'Calamity',
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
  '聚械机偶': {
    hp: 460348, atk: 12999, def: 1512, element: '导电', class: 'Overlord',
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
  '罗蕾莱': {
    hp: 558562, atk: 10386, def: 1512, element: '湮灭', class: 'Overlord',
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
  '无妄者': {
    hp: 564602, atk: 11056, def: 1512, element: '湮灭', class: 'Calamity',
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
  '海之女': {
    hp: 535716, atk: 10386, def: 1512, element: '气动', class: 'Calamity',
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
  '荣耀狮像': {
    hp: 535716, atk: 11726, def: 1512, element: '热熔', class: 'Calamity',
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
  '梦魇亚当·重锤': {
    hp: 500000, atk: 11000, def: 1512, element: '物理', class: 'Overlord',
    resist: { 物理: 0.40, 热熔: 0.10, 湮灭: 0.10, 气动: 0.10, 冷凝: 0.10, 衍射: 0.10, 导电: 0.10 },
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

  // ===== 剧情 / 周本 BOSS（保留）=====
  '角': {
    hp: 60000, atk: 1100, def: 1650, element: '衍射', class: 'Calamity',
    resist: res('衍射'),
    mechanic: { type: 'minion', cycle: 5, hp: 8000, atk: 600 },
    description: '今汐相关岁主，每 5 回合召唤分身'
  },
  '伤痕': {
    hp: 65000, atk: 1200, def: 1680, element: '热熔', class: 'Calamity',
    resist: res('热熔'),
    mechanic: { type: 'enrage', threshold: 0.5, atkBonus: 0.6 },
    description: '剧情 / 周本 BOSS（热熔+物理），HP 低于 50% 狂暴'
  },
  '伤痕·梦魇形态': {
    hp: 80000, atk: 1300, def: 1720, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: { type: 'enrage', threshold: 0.4, atkBonus: 0.7 },
    description: '伤痕的湮灭变体，HP 低于 40% 狂暴'
  },
  '鸣式·利维亚坦': {
    hp: 75000, atk: 1250, def: 1700, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: { type: 'minion', cycle: 4, hp: 10000, atk: 700 },
    description: '后续版本周本 BOSS，每 4 回合召唤鸣式残响'
  },
  '无冠者': {
    hp: 25000, atk: 820, def: 1480, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: { type: 'enrage', threshold: 0.5, atkBonus: 0.3 },
    description: '剧情 BOSS，HP 低于 50% 狂暴'
  },
  '赫卡忒': {
    hp: 45000, atk: 1000, def: 1650, element: '湮灭', class: 'Calamity',
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
  }
};

// DEF 表（通用公式 800 + (lv/10)×80）
function defForLevel(lv) {
  return 800 + Math.floor(lv / 10) * 80;
}

// 获取 BOSS 讨伐等级
export function getBossLevel(bossName) {
  // S 由调用方传入，避免循环依赖
  if (typeof window !== 'undefined' && window.__S) {
    const levels = window.__S.bossLevels || {};
    return levels[bossName] || 40;
  }
  return 40;
}

// 世界等级倍率
export function worldTierMult(tier) {
  return { 1: 0.30, 2: 0.40, 3: 0.50 }[tier] || 0.30;
}

// 按敌人名生成战斗实例
// 支持三种模式：
//   1. levelScale (旧版兼容，直接乘)
//   2. { worldTier, bossLevel } (新版世界 BOSS)
//   3. 无参数 → 默认 Lv90 满值
export function spawnEnemy(name, opts = 1.0) {
  const data = ENEMIES[name];
  if (!data) return null;

  let hpMult, atkMult, defMult;
  const isWorldBoss = data.class === 'Overlord' || data.class === 'Calamity';

  if (typeof opts === 'number') {
    // 副本池（模拟战训等）：世界 BOSS 额外缩放到训练强度
    const poolScale = isWorldBoss ? POOL_BOSS_SCALE : 1.0;
    hpMult = opts * poolScale;
    atkMult = opts * poolScale;
    defMult = opts;
  } else if (opts && (opts.worldTier || opts.bossLevel)) {
    // ★ 世界 BOSS 讨伐战：直接取官方 Lv90 数值 × 世界等级 × 讨伐等级（不缩放）
    // 新版世界 BOSS 缩放
    const tier = opts.worldTier || 1;
    const level = opts.bossLevel || 40;
    const tierMult = worldTierMult(tier);
    const levelRatio = level / 90;
    hpMult = tierMult * levelRatio;
    atkMult = tierMult * levelRatio;
    // DEF 按通用公式查表
    defMult = 1.0; // DEF 不用 scale，直接用 defForLevel
  } else if (opts && typeof opts.hp === 'number') {
    // 细粒度 scale
    hpMult = opts.hp ?? opts.all ?? 1;
    atkMult = opts.atk ?? opts.all ?? 1;
    defMult = opts.def ?? opts.all ?? 1;
  } else {
    hpMult = 1.0;
    atkMult = 1.0;
    defMult = 1.0;
  }

  const bossLv = (opts && opts.bossLevel) ? opts.bossLevel : 90;
  const useDef = isWorldBoss ? defForLevel(bossLv) : Math.round(data.def * defMult);

  return {
    name,
    hp: Math.round(data.hp * hpMult),
    hpMax: Math.round(data.hp * hpMult),
    atk: Math.round(data.atk * atkMult),
    def: useDef,
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
    vibrationBroken: 0,
    // 新版 BOSS 运行时状态
    phase: 1,                    // 当前阶段（1/2/3）
    marks: {},                   // 标记追踪 { teamIdx: count }
    bossLevel: bossLv,
    _shielded: false,
    _brokenFresh: false,
    _overclockTurns: 0,          // Overclock 剩余回合
    _turrets: null,              // 浮空剑/电锯 召唤物数据
    _bubbleHp: 0,                // 绿泡 HP
    _debrisReady: false,         // 残骸可投掷
    _flightTurns: 0,             // 飞空剩余回合
    _deflectActive: false,       // 反击姿态
    _hitTracker: {}              // 冰冻累积追踪 { teamIdx: count }
  };
}
