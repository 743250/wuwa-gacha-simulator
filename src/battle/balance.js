// 战斗与关卡平衡配置中心
//
// 这里集中放“会影响水温/副本强度/基础动作收益”的常量。
// 后续调深塔、副本、基础倍率时优先改这里，避免 dungeon/abyss/combat 多处漂移。

export const ACTION_COST = {
  normal: 1,
  skill: 1,
  heavy: 2,
  burst: 3
};

export const ACTION_MULTIPLIER = {
  normal: 1.0,
  skill: 1.8,
  heavy: 2.2,
  burstMain: 4.0,
  burstSide: 2.0,
  variation: 0.8,
  concertoVariation: 1.6
};

export const VIBRATION_DAMAGE = {
  normal: 8,
  normalForteBonus: 12,
  skill: 20,
  skillForteBonus: 20,
  heavy: 25,
  heavySpecial: 35,
  burst: 30,
  variation: 10,
  concertoVariation: 25,
  normalSplit: 6
};

export const STAR_CRITERIA = {
  oneStar:   { turn: 20, hp: 0    },
  twoStar:   { turn: 18, hp: 0.70 },
  threeStar: { turn: 15, hp: 0.70 }
};

export function parseVersion(v) {
  const [majorRaw, minorRaw] = String(v).split('.');
  return { major: Number(majorRaw) || 1, minor: Number(minorRaw) || 0 };
}

export function versionOrder(v) {
  const x = parseVersion(v);
  return x.major * 100 + x.minor;
}

// 深塔”水温”：照抄官方中一血量膨胀曲线（2026-06-25）
//
// 官方实测数据点：
//   1.0 开服：中一 ~160 万 → 1.00 基准
//   1.4 末期：中一 ~214 万 → 1.34
//   2.7 末期：中一 ~291 万 → 1.82
//   3.4 当前：中一 ~550 万 → 3.44
//
// 曲线特征：1.x 平缓，2.x 温和，3.x 加速
// 角色面板同样照抄官方（3.x 角色 ATK 高于 1.x 角色，通过 OVERRIDE_STATS 区分）
// 旧角色打不动新深塔 = 逼你抽新角色 = 逼氪闭环
export const ABYSS_TEMPERATURE_TABLE = [
  { v: '1.0', hp: 1.00, atk: 1.00, def: 1.00, label: '开服基准 160万' },
  { v: '1.1', hp: 1.06, atk: 1.03, def: 1.02, label: '初次升温' },
  { v: '1.2', hp: 1.13, atk: 1.06, def: 1.04, label: '练度筛选' },
  { v: '1.3', hp: 1.22, atk: 1.09, def: 1.06, label: '环境定向' },
  { v: '1.4', hp: 1.34, atk: 1.13, def: 1.09, label: '一代末期 214万' },
  { v: '2.0', hp: 1.52, atk: 1.20, def: 1.13, label: '大版本跃迁' },
  { v: '2.1', hp: 1.60, atk: 1.24, def: 1.15, label: '新体系抬压' },
  { v: '2.2', hp: 1.68, atk: 1.28, def: 1.17, label: '双队压力' },
  { v: '2.3', hp: 1.76, atk: 1.32, def: 1.19, label: '中塔升温' },
  { v: '2.4', hp: 1.85, atk: 1.36, def: 1.21, label: '输出门槛' },
  { v: '2.5', hp: 1.94, atk: 1.40, def: 1.23, label: '末期膨胀' },
  { v: '2.6', hp: 2.04, atk: 1.44, def: 1.25, label: '深境扩层' },
  { v: '2.7', hp: 2.14, atk: 1.48, def: 1.27, label: '二代末期 291万' },
  { v: '2.8', hp: 2.25, atk: 1.52, def: 1.29, label: '三代前夕' },
  { v: '3.0', hp: 2.48, atk: 1.60, def: 1.33, label: '三代跃迁' },
  { v: '3.1', hp: 2.68, atk: 1.66, def: 1.36, label: '环境筛卡' },
  { v: '3.2', hp: 2.90, atk: 1.72, def: 1.40, label: '高压轮替' },
  { v: '3.3', hp: 3.15, atk: 1.80, def: 1.44, label: '末端追赶' },
  { v: '3.4', hp: 3.44, atk: 1.86, def: 1.48, label: '当前高水温 550万' }
];

export function getAbyssTemperatureForVersion(version) {
  const key = versionOrder(version);
  return ABYSS_TEMPERATURE_TABLE
    .slice()
    .reverse()
    .find(x => versionOrder(x.v) <= key) || ABYSS_TEMPERATURE_TABLE[0];
}

// ===== 深塔环境轮换（每 28 天周期随机元素 buff/debuff）=====
// 官方每期深塔有：推荐元素（敌抗 -10%）、抗性元素（敌抗 +10%）、战斗增益
// 用周期 key 的 hash 做确定性随机，保证同一周期内环境一致

const ENV_ELEMENTS = ['热熔', '冷凝', '导电', '气动', '衍射', '湮灭'];
const ENV_BUFFS = [
  { type: 'skillDmg',   label: '共鸣技能伤害 +25%', value: 0.25 },
  { type: 'burstDmg',   label: '共鸣解放伤害 +30%', value: 0.30 },
  { type: 'normalDmg',  label: '普攻伤害 +25%',      value: 0.25 },
  { type: 'heavyDmg',   label: '重击伤害 +30%',      value: 0.30 },
  { type: 'allDmg',     label: '全伤害 +18%',        value: 0.18 },
  { type: 'crate_cdmg', label: '暴击率 +12% · 暴伤 +20%', value: 0.12 }
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

export function getAbyssEnvironment(cycleKey) {
  const h = hashStr(cycleKey);
  const favor = ENV_ELEMENTS[h % ENV_ELEMENTS.length];
  const resist = ENV_ELEMENTS[(h + 3) % ENV_ELEMENTS.length]; // 对面元素
  const buff = ENV_BUFFS[h % ENV_BUFFS.length];
  return {
    favorElement: favor,
    resistElement: resist,
    buffType: buff.type,
    buffLabel: buff.label,
    buffValue: buff.value,
    cycleKey
  };
}
