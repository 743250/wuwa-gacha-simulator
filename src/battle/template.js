// 角色定位模板 + 元素映射 + 属性计算
// 按官方 Lv90 数据校准（2026-06-25 · B站 wiki + 库街区实测）
//   5★ 主C：忌炎 437 / 今汐 412 / 安可 425 → ATK 平均 425
//   5★ 副C：吟霖 400 / 相里要 425 / 坎特蕾拉 400 → ATK 平均 408 → 模板 410
//   5★ 治疗：维里奈 337 → ATK 335
//   DEF：忌炎 1185 / 今汐 1258 / 维里奈 1099 → 模板平均 ~1150
//   4★ 角色约为 5★ 的 85% HP / 80% ATK
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
  '折枝':      { type: '副C',  element: '衍射', weaponType: '音感仪' },
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
  '尤诺':      { type: '主C',  element: '冷凝', weaponType: '臂铠' },
  '嘉贝莉娜':  { type: '主C',  element: '热熔', weaponType: '佩枪' },
  '仇远':      { type: '主C',  element: '气动', weaponType: '迅刀' },
  '千咲':      { type: '主C',  element: '湮灭', weaponType: '长刃' },
  '琳奈':      { type: '副C',  element: '衍射', weaponType: '佩枪' },
  '莫宁':      { type: '主C',  element: '冷凝', weaponType: '迅刀' },
  '爱弥斯':    { type: '主C',  element: '导电', weaponType: '长刃' },
  '陆·赫斯':   { type: '辅助', element: '冷凝', weaponType: '臂铠' },
  '西格莉卡':  { type: '主C',  element: '衍射', weaponType: '音感仪' },
  '绯雪':      { type: '主C',  element: '冷凝', weaponType: '迅刀' },
  '达妮娅':    { type: '主C',  element: '热熔', weaponType: '佩枪' },
  '露西':      { type: '主C',  element: '衍射', weaponType: '佩枪' },
  '丽贝卡':    { type: '副C',  element: '导电', weaponType: '佩枪' },
  '洛瑟菈':    { type: '副C',  element: '湮灭', weaponType: '音感仪' },

  // 常驻 5 星
  '维里奈':    { type: '治疗', element: '衍射', weaponType: '音感仪' },
  '卡卡罗':    { type: '主C',  element: '导电', weaponType: '长刃' },
  '安可':      { type: '主C',  element: '热熔', weaponType: '音感仪' },
  '凌阳':      { type: '主C',  element: '冷凝', weaponType: '迅刀' },
  '鉴心':      { type: '辅助', element: '气动', weaponType: '臂铠' },

  // 4 星
  '丹瑾':      { type: '副C',  element: '湮灭', weaponType: '长刃' },
  '炽霞':      { type: '副C',  element: '热熔', weaponType: '佩枪' },
  '秋水':      { type: '副C',  element: '气动', weaponType: '佩枪' },
  '渊武':      { type: '辅助', element: '导电', weaponType: '臂铠' },
  '桃祈':      { type: '辅助', element: '衍射', weaponType: '臂铠' },
  '散华':      { type: '副C',  element: '冷凝', weaponType: '长刃' },
  '秧秧':      { type: '副C',  element: '气动', weaponType: '音感仪' },
  '莫特斐':    { type: '副C',  element: '热熔', weaponType: '佩枪' },
  '白芷':      { type: '治疗', element: '冷凝', weaponType: '音感仪' },
  '釉瑚':      { type: '副C',  element: '冷凝', weaponType: '臂铠' },
  '灯灯':      { type: '副C',  element: '衍射', weaponType: '臂铠' },
  '卜灵':      { type: '辅助', element: '导电', weaponType: '音感仪' }
};

// 90 级真实面板覆盖（按库街区角色页 90 级满突属性，逐角色覆盖默认模板）
// 后续角色按此格式继续补：
//   stats:    90 级满突核心面板
//   bonuses:  突破属性自带的伤害/治疗加成
// 90 级真实面板（B站 wiki + 库街区 · 2026-06-25 批量抓取）
// stats: 官方 Lv90 满突 HP/ATK/DEF/crate/cdmg/energy/dodge
// 未列入的使用 TEMPLATES 默认值（已对齐官方平均）
export const OVERRIDE_STATS = {
  // ─── 1.0 限定 ───
  '忌炎': {
    stats: { hp: 10487, atk: 437, def: 1185, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 }
  },
  '吟霖': {
    stats: { hp: 11000, atk: 400, def: 1283, crate: 0.10, cdmg: 1.40, energy: 130, dodge: 0.14 }
  },
  // ─── 1.1 限定 ───
  '今汐': {
    stats: { hp: 10825, atk: 412, def: 1258, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 }
  },
  '长离': {
    stats: { hp: 10387, atk: 462, def: 1099, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 }
  },
  // ─── 1.2 限定 ───
  '相里要': {
    stats: { hp: 10625, atk: 425, def: 1222, crate: 0.10, cdmg: 1.40, energy: 130, dodge: 0.14 }
  },
  // ─── 1.3 限定 ───
  '守岸人': {
    stats: { hp: 12508, atk: 309, def: 1180, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.08 },
    bonuses: { healBonus: 0.216 }
  },
  // ─── 1.4 限定 ───
  '椿': {
    stats: { hp: 10325, atk: 450, def: 1161, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 }
  },
  // ─── 2.0 限定 ───
  '珂莱塔': {
    stats: { hp: 12450, atk: 462, def: 1197, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 }
  },
  // ─── 2.1 限定 ───
  '菲比': {
    stats: { hp: 11075, atk: 412, def: 1258, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 }
  },
  // ─── 2.2 限定 ───
  '坎特蕾拉': {
    stats: { hp: 11600, atk: 400, def: 1099, crate: 0.10, cdmg: 1.40, energy: 130, dodge: 0.14 }
  },
  // ─── 2.4 限定（HP 核·特殊模板）───
  '卡提希娅': {
    stats: { hp: 14800, atk: 312, def: 611, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 },
    bonuses: { hpScaling: true }  // 标记：伤害基于 HP 而非 ATK（combat.js 据此调整）
  },
  // ─── 常驻 5★ ───
  '维里奈': {
    stats: { hp: 14237, atk: 337, def: 1099, crate: 0.05, cdmg: 1.20, energy: 130, dodge: 0.08 },
    bonuses: { healBonus: 0.216 }
  },
  '安可': {
    stats: { hp: 10512, atk: 425, def: 1246, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 }
  },
  '凌阳': {
    stats: { hp: 10387, atk: 437, def: 1209, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 }
  },
  '鉴心': {
    stats: { hp: 14112, atk: 337, def: 1124, crate: 0.05, cdmg: 1.20, energy: 130, dodge: 0.10 }
  },
  '卡卡罗': {
    stats: { hp: 10500, atk: 437, def: 1185, crate: 0.05, cdmg: 1.50, energy: 125, dodge: 0.18 }
  }
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
  const scale = 0.20 + (level - 1) * (0.80 / 89);    // 1 级 = 20%, 90 级 = 100%

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
