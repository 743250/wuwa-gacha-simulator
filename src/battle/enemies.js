// 敌人数据库
// 数据校准（2026-06，第三轮联网 AI）：
//   1. 15 个真实 BOSS 中文名（库街区 / Fandom）
//   2. 抗性模型：敌人对自身属性 40% 抗性、其他元素 10% 抗性
//      → resist 字段是数值，elements.js 用它扣减伤害
//      → 不再使用 weaknesses 数组 + ×1.5 这种自创规则
//   3. Class 分 Overlord（强敌）/ Calamity（剧情/周本）
//
// mechanic.type:
//   - none:    无机制
//   - burn_team: 每 cycle 回合点燃全队，造成 dmgPct% 当前生命
//   - freeze:  每 cycle 回合冻结随机 1 名（跳过 1 回合）
//   - shield:  HP 低于 threshold 时生成 value 护盾
//   - enrage:  HP 低于 threshold 时攻击 ×(1+atkBonus)
//   - reflect: 每 cycle 回合反弹 value 比例受伤
//   - minion:  每 cycle 回合召唤 1 个小弟（hp / atk）
//   - thunder_chain: 雷电连段，每 cycle 多段攻击
//   - dive:    俯冲攻击，每 cycle 高伤害
//   - aoe_freeze: 范围冰雾，每 cycle 全队减速
//   - data_lock: 数据封锁，每 cycle 锁定 1 名角色技能
//   - aero_erosion: 气动侵蚀（卡提希娅类敌人会用）

export function formatEnemyMechanic(mechanic, opts = {}) {
  const m = mechanic;
  if (!m || m.type === 'none') return '';
  const desc = {
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
    aero_erosion: () => `每${m.cycle}回合施加气动侵蚀`
  }[m.type];
  if (!desc) return '';
  const text = desc();
  if (!opts.includeNext || !m.cycle || !opts.turn) return text;
  const left = m.cycle - (opts.turn % m.cycle);
  return `${text} · 下次：${left}回合后`;
}

// 抗性生成器：对自身属性 40% 抗性、对其他元素 10% 抗性
function res(selfElement) {
  const out = {};
  ['热熔', '湮灭', '气动', '冷凝', '衍射', '导电'].forEach(e => {
    out[e] = e === selfElement ? 0.40 : 0.10;
  });
  return out;
}

export const ENEMIES = {
  // ===== 小怪（仅用于低层副本，无 class） =====
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

  // ===== Overlord 早期强敌（来自第三轮校准） =====
  '朔雷之鳞': {
    hp: 30000, atk: 850, def: 500, element: '导电', class: 'Overlord',
    resist: res('导电'),
    mechanic: { type: 'thunder_chain', cycle: 3, mult: 0.6 },
    description: '高速近战雷电连招型 BOSS，每 3 回合释放雷电连段'
  },
  '云闪之鳞': {
    hp: 32000, atk: 880, def: 520, element: '导电', class: 'Overlord',
    resist: res('导电'),
    mechanic: { type: 'thunder_chain', cycle: 3, mult: 0.8 },
    description: '高速突进型 BOSS，每 3 回合雷击连段'
  },
  '哀声鸷': {
    hp: 28000, atk: 800, def: 480, element: '衍射', class: 'Overlord',
    resist: res('衍射'),
    mechanic: { type: 'dive', cycle: 4, mult: 1.5 },
    description: '飞行 BOSS，每 4 回合俯冲范围光羽'
  },
  '无常凶鹭': {
    hp: 34000, atk: 900, def: 540, element: '湮灭', class: 'Overlord',
    resist: res('湮灭'),
    mechanic: { type: 'dive', cycle: 3, mult: 1.4 },
    description: '三头鸟 BOSS，每 3 回合俯冲压制'
  },
  '辉萤军势': {
    hp: 35000, atk: 850, def: 520, element: '冷凝', class: 'Overlord',
    resist: res('冷凝'),
    mechanic: { type: 'aoe_freeze', cycle: 4 },
    description: '群体型冷凝 BOSS，每 4 回合释放冰雾减速全队'
  },
  '无归的谬误': {
    hp: 36000, atk: 880, def: 560, element: '衍射', class: 'Overlord',
    resist: res('衍射'),
    mechanic: { type: 'data_lock', cycle: 4 },
    description: '黑海岸数据空间型 BOSS，每 4 回合封锁 1 名角色技能 1 回合'
  },
  '异构武装': {
    hp: 33000, atk: 850, def: 550, element: '冷凝', class: 'Overlord',
    resist: res('冷凝'),
    mechanic: { type: 'shield', threshold: 0.5, value: 14000 },
    description: '构造体型 BOSS，HP 低于 50% 生成护盾'
  },
  '叹息古龙': {
    hp: 42000, atk: 950, def: 580, element: '热熔', class: 'Overlord',
    resist: res('热熔'),
    mechanic: { type: 'burn_team', cycle: 3, dmgPct: 0.06 },
    description: '龙形热熔残象，每 3 回合喷射火焰压制全队'
  },
  '海之女': {
    hp: 40000, atk: 920, def: 570, element: '气动', class: 'Overlord',
    resist: res('气动'),
    mechanic: { type: 'reflect', cycle: 4, value: 0.30 },
    description: '海潮主题 BOSS，每 4 回合反弹 30% 受伤'
  },
  '荣耀狮像': {
    hp: 38000, atk: 900, def: 600, element: '热熔', class: 'Overlord',
    resist: res('热熔'),
    mechanic: { type: 'shield', threshold: 0.4, value: 16000 },
    description: '竞技场守护石像，HP 低于 40% 生成护盾'
  },
  '梦魇亚当·重锤': {
    hp: 50000, atk: 1100, def: 620, element: '物理', class: 'Overlord',
    resist: { 物理: 0.40, 热熔: 0.10, 湮灭: 0.10, 气动: 0.10, 冷凝: 0.10, 衍射: 0.10, 导电: 0.10 },
    mechanic: { type: 'enrage', threshold: 0.4, atkBonus: 0.5 },
    description: '3.4 赛博朋克联动重型敌人，HP 低于 40% 狂暴 +50%'
  },

  // ===== Calamity 剧情 / 周本 BOSS =====
  '角': {
    hp: 60000, atk: 1100, def: 650, element: '衍射', class: 'Calamity',
    resist: res('衍射'),
    mechanic: { type: 'minion', cycle: 5, hp: 8000, atk: 600 },
    description: '今汐相关岁主，每 5 回合召唤分身'
  },
  '伤痕': {
    hp: 65000, atk: 1200, def: 680, element: '热熔', class: 'Calamity',
    resist: res('热熔'),
    mechanic: { type: 'enrage', threshold: 0.5, atkBonus: 0.6 },
    description: '剧情 / 周本 BOSS（热熔+物理），HP 低于 50% 狂暴'
  },
  '伤痕·梦魇形态': {
    hp: 80000, atk: 1300, def: 720, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: { type: 'enrage', threshold: 0.4, atkBonus: 0.7 },
    description: '伤痕的湮灭变体（中文名待国服核验），HP 低于 40% 狂暴'
  },
  '鸣式·利维亚坦': {
    hp: 75000, atk: 1250, def: 700, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: { type: 'minion', cycle: 4, hp: 10000, atk: 700 },
    description: '后续版本周本 BOSS，每 4 回合召唤鸣式残响'
  },

  // ===== 原有的真实 BOSS（保留并补抗性） =====
  '无冠者': {
    hp: 30000, atk: 850, def: 500, element: '湮灭', class: 'Calamity',
    resist: res('湮灭'),
    mechanic: { type: 'enrage', threshold: 0.5, atkBonus: 0.3 },
    description: '剧情 BOSS，HP 低于 50% 狂暴'
  },
  '飞廉之猩': {
    hp: 28000, atk: 800, def: 480, element: '气动', class: 'Overlord',
    resist: res('气动'),
    mechanic: { type: 'enrage', threshold: 0.4, atkBonus: 0.4 },
    description: '气动猿型 BOSS，狂暴 +40%'
  },
  '燎照之骑': {
    hp: 32000, atk: 900, def: 550, element: '热熔', class: 'Overlord',
    resist: res('热熔'),
    mechanic: { type: 'burn_team', cycle: 3, dmgPct: 0.05 },
    description: '火系骑士 BOSS，每 3 回合点燃全队'
  },
  '聚械机偶': {
    hp: 24000, atk: 780, def: 450, element: '导电', class: 'Overlord',
    resist: res('导电'),
    mechanic: { type: 'minion', cycle: 5, hp: 4000, atk: 400 },
    description: '机械 BOSS，每 5 回合召唤小弟'
  },
  '无妄者': {
    hp: 38000, atk: 950, def: 600, element: '气动', class: 'Overlord',
    resist: res('气动'),
    mechanic: { type: 'shield', threshold: 0.5, value: 12000 },
    description: '气动 BOSS，HP 低于 50% 生成护盾'
  },
  '鸣钟之龟': {
    hp: 42000, atk: 750, def: 850, element: '衍射', class: 'Overlord',
    resist: res('衍射'),
    mechanic: { type: 'reflect', cycle: 4, value: 0.30 },
    description: '高防御龟型 BOSS，每 4 回合反弹 30% 伤害'
  },
  '罗蕾莱': {
    hp: 35000, atk: 880, def: 550, element: '导电', class: 'Overlord',
    resist: res('导电'),
    mechanic: { type: 'shield', threshold: 0.5, value: 15000 },
    description: '后期 BOSS，HP 低于 50% 生成 15000 护盾'
  },
  '赫卡忒': {
    hp: 45000, atk: 1000, def: 650, element: '湮灭', class: 'Calamity',
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

// 按敌人名生成战斗实例（深拷贝），可选 levelScale 调整难度
export function spawnEnemy(name, levelScale = 1.0) {
  const data = ENEMIES[name];
  if (!data) return null;
  const scale = typeof levelScale === 'number'
    ? { hp: levelScale, atk: levelScale, def: levelScale }
    : {
        hp: levelScale?.hp ?? levelScale?.all ?? 1,
        atk: levelScale?.atk ?? levelScale?.all ?? 1,
        def: levelScale?.def ?? levelScale?.all ?? 1
      };
  return {
    name,
    hp: Math.round(data.hp * scale.hp),
    hpMax: Math.round(data.hp * scale.hp),
    atk: Math.round(data.atk * scale.atk),
    def: Math.round(data.def * scale.def),
    element: data.element,
    resist: { ...data.resist },
    mechanic: { ...data.mechanic },
    class: data.class || null,
    shield: 0,
    enraged: false,
    alive: true,
    description: data.description,
    isMinion: !!data.isMinion,
    vibration: 100,             // 破韧值（共振度），削空后 1 回合易伤
    vibrationMax: 100,
    vibrationBroken: 0          // 易伤剩余回合
  };
}
