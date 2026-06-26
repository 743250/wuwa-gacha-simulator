// 角色定位模板 + 元素映射 + 属性计算
// 数据校准（2026-06-26 · encore.moe API 全量校准）
//   OVERRIDE_STATS: 48 个角色 Lv90 HP/ATK/DEF 来自 encore.moe
//   TEMPLATES: 仅用于无 encore 数据的角色（渊武/白芷/忌炎/坎特蕾拉/鉴心）作为 fallback
export const TEMPLATES = {
  '主C':  { hp: 10500, atk: 425, def: 1200, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 },
  '副C':  { hp: 10000, atk: 410, def: 1150, crate: 0.10, cdmg: 1.40, energy: 130, dodge: 0.14 },
  '辅助': { hp: 11500, atk: 310, def: 1100, crate: 0.05, cdmg: 1.20, energy: 130, dodge: 0.10 },
  '治疗': { hp: 13500, atk: 335, def: 1050, crate: 0.05, cdmg: 1.20, energy: 130, dodge: 0.08 }
};

// 每个角色的定位 + 元素 + 武器类型
export const ROLE_META = {
  // 5 星限定
  '忌炎':      { type: '主C',  element: '气动', weaponType: '长刃' },
  '吟霖':      { type: '副C',  element: '导电', weaponType: '音感仪' },
  '今汐':      { type: '主C',  element: '衍射', weaponType: '长刃' },
  '长离':      { type: '主C',  element: '热熔', weaponType: '迅刀' },
  '折枝':      { type: '副C',  element: '冷凝', weaponType: '音感仪' },
  '相里要':    { type: '副C',  element: '导电', weaponType: '臂铠' },
  '守岸人':    { type: '辅助', element: '衍射', weaponType: '音感仪' },
  '椿':        { type: '主C',  element: '湮灭', weaponType: '迅刀' },
  '珂莱塔':    { type: '主C',  element: '冷凝', weaponType: '佩枪' },
  '洛可可':    { type: '副C',  element: '湮灭', weaponType: '臂铠' },
  '菲比':      { type: '主C',  element: '衍射', weaponType: '音感仪' },
  '布兰特':    { type: '辅助', element: '热熔', weaponType: '迅刀' },
  '坎特蕾拉':  { type: '副C',  element: '湮灭', weaponType: '音感仪' },
  '赞妮':      { type: '主C',  element: '衍射', weaponType: '臂铠' },
  '夏空':      { type: '辅助', element: '气动', weaponType: '佩枪' },
  '卡提希娅':  { type: '主C',  element: '气动', weaponType: '迅刀' },
  '露帕':      { type: '副C',  element: '热熔', weaponType: '长刃' },
  '弗洛洛':    { type: '主C',  element: '湮灭', weaponType: '音感仪' },
  '奥古斯塔':  { type: '主C',  element: '导电', weaponType: '长刃' },
  '尤诺':      { type: '主C',  element: '气动', weaponType: '臂铠' },
  '嘉贝莉娜':  { type: '主C',  element: '热熔', weaponType: '佩枪' },
  '仇远':      { type: '主C',  element: '气动', weaponType: '迅刀' },
  '千咲':      { type: '主C',  element: '湮灭', weaponType: '长刃' },
  '琳奈':      { type: '副C',  element: '衍射', weaponType: '佩枪' },
  '莫宁':      { type: '主C',  element: '热熔', weaponType: '长刃' },
  '爱弥斯':    { type: '主C',  element: '热熔', weaponType: '迅刀' },
  '陆·赫斯':   { type: '辅助', element: '衍射', weaponType: '臂铠' },
  '西格莉卡':  { type: '主C',  element: '气动', weaponType: '臂铠' },
  '绯雪':      { type: '主C',  element: '冷凝', weaponType: '迅刀' },
  '达妮娅':    { type: '主C',  element: '热熔', weaponType: '音感仪' },
  '露西':      { type: '主C',  element: '衍射', weaponType: '佩枪' },
  '丽贝卡':    { type: '副C',  element: '导电', weaponType: '佩枪' },
  '洛瑟菈':    { type: '副C',  element: '冷凝', weaponType: '音感仪' },

  // 常驻 5 星
  '维里奈':    { type: '治疗', element: '衍射', weaponType: '音感仪' },
  '卡卡罗':    { type: '主C',  element: '导电', weaponType: '长刃' },
  '安可':      { type: '主C',  element: '热熔', weaponType: '音感仪' },
  '凌阳':      { type: '主C',  element: '冷凝', weaponType: '臂铠' },
  '鉴心':      { type: '辅助', element: '气动', weaponType: '臂铠' },

  // 4 星
  '丹瑾':      { type: '副C',  element: '湮灭', weaponType: '迅刀' },
  '炽霞':      { type: '副C',  element: '热熔', weaponType: '佩枪' },
  '秋水':      { type: '副C',  element: '气动', weaponType: '佩枪' },
  '渊武':      { type: '辅助', element: '导电', weaponType: '臂铠' },
  '桃祈':      { type: '辅助', element: '湮灭', weaponType: '长刃' },
  '散华':      { type: '副C',  element: '冷凝', weaponType: '迅刀' },
  '秧秧':      { type: '副C',  element: '气动', weaponType: '迅刀' },
  '莫特斐':    { type: '副C',  element: '热熔', weaponType: '佩枪' },
  '白芷':      { type: '治疗', element: '冷凝', weaponType: '音感仪' },
  '釉瑚':      { type: '副C',  element: '冷凝', weaponType: '臂铠' },
  '灯灯':      { type: '副C',  element: '导电', weaponType: '长刃' },
  '卜灵':      { type: '辅助', element: '导电', weaponType: '音感仪' }
};

// 90 级真实面板覆盖（encore.moe API 全量校准 · 2026-06-26）
// stats: Lv90 HP/ATK/DEF 来自 encore.moe；无 encore 数据的角色保留原值
// 所有 4★ 角色已补全独立面板，不再依赖 5★ 模板
export const OVERRIDE_STATS = {
  // ─── 1.0 限定 ───
  '忌炎': {
    stats: { hp: 10487, atk: 437, def: 1185, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '吟霖': {
    stats: { hp: 11000, atk: 400, def: 1283, crate: 0.1, cdmg: 1.4, energy: 130, dodge: 0.14 }
  },

  // ─── 1.1 限定 ───
  '今汐': {
    stats: { hp: 10825, atk: 412, def: 1259, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '长离': {
    stats: { hp: 10388, atk: 462, def: 1100, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

  // ─── 1.2 限定 ───
  '折枝': {
    stats: { hp: 12250, atk: 375, def: 1198, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '相里要': {
    stats: { hp: 10625, atk: 425, def: 1222, crate: 0.1, cdmg: 1.4, energy: 130, dodge: 0.14 }
  },

  // ─── 1.3 限定 ───
  '守岸人': {
    stats: { hp: 16712, atk: 288, def: 1100, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.08 },
    bonuses: { healBonus: 0.216 }
  },

  // ─── 1.4 限定 ───
  '椿': {
    stats: { hp: 10325, atk: 450, def: 1161, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '洛可可': {
    stats: { hp: 12250, atk: 375, def: 1198, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

  // ─── 2.0 限定 ───
  '珂莱塔': {
    stats: { hp: 12450, atk: 462, def: 1198, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

  // ─── 2.1 限定 ───
  '菲比': {
    stats: { hp: 10825, atk: 412, def: 1259, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '布兰特': {
    stats: { hp: 11675, atk: 375, def: 1308, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

  // ─── 2.2 限定 ───
  '坎特蕾拉': {
    stats: { hp: 11600, atk: 400, def: 1099, crate: 0.1, cdmg: 1.4, energy: 130, dodge: 0.14 }
  },

  // ─── 2.3 限定 ───
  '赞妮': {
    stats: { hp: 10775, atk: 438, def: 1137, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 },
    bonuses: { elemBonusFixed: 0.12 } // 固有技能：衍射伤害加成 +12%
  },
  '夏空': {
    stats: { hp: 12238, atk: 375, def: 1198, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.1 },
    bonuses: { atkBonusFixed: 0.12 }
  },

  // ─── 2.4 限定 ───
  '卡提希娅': {
    stats: { hp: 14800, atk: 312, def: 611, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 },
    bonuses: { hpScaling: true }  // 标记：伤害基于 HP 而非 ATK（combat.js 据此调整）
  },
  '露帕': {
    stats: { hp: 11912, atk: 388, def: 1186, crate: 0.1, cdmg: 1.4, energy: 130, dodge: 0.14 }
  },

  // ─── 2.5 限定 ───
  '弗洛洛': {
    stats: { hp: 10775, atk: 438, def: 1137, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

  // ─── 2.6 限定 ───
  '奥古斯塔': {
    stats: { hp: 10300, atk: 462, def: 1112, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '尤诺': {
    stats: { hp: 10525, atk: 450, def: 1124, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

  // ─── 2.7 限定 ───
  '嘉贝莉娜': {
    stats: { hp: 10300, atk: 462, def: 1112, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '仇远': {
    stats: { hp: 12238, atk: 375, def: 1198, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

  // ─── 2.8 限定 ───
  '千咲': {
    stats: { hp: 10775, atk: 438, def: 1137, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

  // ─── 3.0 限定 ───
  '琳奈': {
    stats: { hp: 12238, atk: 375, def: 1198, crate: 0.1, cdmg: 1.4, energy: 130, dodge: 0.14 }
  },
  '莫宁': {
    stats: { hp: 15375, atk: 288, def: 1357, crate: 0.05, cdmg: 1.5, energy: 175, dodge: 0.18 }
  },

  // ─── 3.1 限定 ───
  '爱弥斯': {
    stats: { hp: 11025, atk: 425, def: 1149, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '陆·赫斯': {
    stats: { hp: 10300, atk: 462, def: 1112, crate: 0.05, cdmg: 1.2, energy: 125, dodge: 0.1 }
  },

  // ─── 3.2 限定 ───
  '西格莉卡': {
    stats: { hp: 10775, atk: 438, def: 1137, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

  // ─── 3.3 限定 ───
  '绯雪': {
    stats: { hp: 10300, atk: 462, def: 1112, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '达妮娅': {
    stats: { hp: 11025, atk: 425, def: 1149, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

  // ─── 3.4 限定 ───
  '露西': {
    stats: { hp: 11025, atk: 425, def: 1149, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '丽贝卡': {
    stats: { hp: 11600, atk: 400, def: 1173, crate: 0.1, cdmg: 1.4, energy: 130, dodge: 0.14 }
  },
  '洛瑟菈': {
    stats: { hp: 12238, atk: 375, def: 1198, crate: 0.1, cdmg: 1.4, energy: 130, dodge: 0.14 }
  },

  // ─── 常驻 5★ ───
  '维里奈': {
    stats: { hp: 14238, atk: 338, def: 1100, crate: 0.05, cdmg: 1.2, energy: 130, dodge: 0.08 },
    bonuses: { healBonus: 0.216 }
  },
  '卡卡罗': {
    stats: { hp: 10500, atk: 438, def: 1186, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '安可': {
    stats: { hp: 10512, atk: 425, def: 1247, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '凌阳': {
    stats: { hp: 10388, atk: 438, def: 1210, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '鉴心': {
    stats: { hp: 14112, atk: 337, def: 1124, crate: 0.05, cdmg: 1.2, energy: 130, dodge: 0.1 }
  },

  // ─── 4★ ───
  '秧秧': {
    stats: { hp: 10200, atk: 250, def: 1100, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '炽霞': {
    stats: { hp: 9088, atk: 300, def: 953, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '丹瑾': {
    stats: { hp: 9438, atk: 262, def: 1149, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '秋水': {
    stats: { hp: 9850, atk: 262, def: 1076, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '散华': {
    stats: { hp: 10062, atk: 275, def: 941, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '莫特斐': {
    stats: { hp: 10025, atk: 250, def: 1137, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '釉瑚': {
    stats: { hp: 9975, atk: 262, def: 1051, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '灯灯': {
    stats: { hp: 8500, atk: 338, def: 880, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '卜灵': {
    stats: { hp: 10625, atk: 225, def: 1259, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },
  '桃祈': {
    stats: { hp: 8950, atk: 225, def: 1564, crate: 0.05, cdmg: 1.5, energy: 125, dodge: 0.18 }
  },

};

// 默认元数据（找不到时用）
const DEFAULT_META = { type: '副C', element: '湮灭', weaponType: '长刃' };

export function getMeta(roleName) {
  return ROLE_META[roleName] || DEFAULT_META;
}

// 按角色等级计算基础属性
// 共鸣链效果统一在 battle/chains.js 中按原文折算，避免混入泛用每链加成。
export function getStats(roleName, level = 1, chain = 0) {
  const meta = getMeta(roleName);
  const tpl = TEMPLATES[meta.type];
  const scale = 0.08 + (level - 1) * (0.92 / 89);    // Lv1 ≈ 8%, Lv90 = 100%

  // 真实数值覆盖：等级 < 90 时按 scale 衰减
  const override = OVERRIDE_STATS[roleName];
  if (override) {
    const s = override.stats;
    const lvScale = level >= 90 ? 1.0 : scale;
    return {
      hp:   Math.round(s.hp  * lvScale),
      atk:  Math.round(s.atk * lvScale),
      def:  Math.round(s.def * lvScale),
      crate: s.crate,
      cdmg:  s.cdmg,
      dodge: s.dodge,
      maxEnergy: s.energy,
      element: meta.element,
      type: meta.type,
      weaponType: meta.weaponType,
      // 突破属性加成（不走 scale，每级都有）
      healBonus: override.bonuses?.healBonus || 0,
      atkBonusFixed: override.bonuses?.atkBonusFixed || 0,
      cdmgBonusFixed: override.bonuses?.cdmgBonusFixed || 0,
      crateBonusFixed: override.bonuses?.crateBonusFixed || 0,
      elemBonusFixed: override.bonuses?.elemBonusFixed || 0,
      forteStart: override.forteStart || 0
    };
  }

  return {
    hp: Math.round(tpl.hp * scale),
    atk: Math.round(tpl.atk * scale),
    def: Math.round(tpl.def * scale),
    crate: tpl.crate,
    cdmg: tpl.cdmg,
    dodge: tpl.dodge,
    maxEnergy: tpl.energy,
    element: meta.element,
    type: meta.type,
    weaponType: meta.weaponType
  };
}

// 升级所需经验书数量（累计经验 = sum(needForLevel(i) for i in 1..lv)）
// 简化：每级需要 level 本经验书
export function expBookForLevel(targetLevel) {
  return targetLevel; // 升到 N 级需要 N 本
}
