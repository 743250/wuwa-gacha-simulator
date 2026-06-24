// 共鸣链 → 战斗效果
// 这里不再使用统一模板，而是从 src/data/seq.js 的原版共鸣链文案中提取可折算的数值。
// 复杂机制会保留原文展示；战斗中只折算当前模拟器已有的属性/伤害/团队光环字段。
//
// ★ 文案数据：src/data/chains-extracted.json 由 scripts/extract-chains.cjs 从
//   库街区官方 API（/wiki/core/catalogue/item/getEntryDetail）批量抓取，
//   含 10 个核心角色的官方共鸣链 title / desc / summary（已染色）。
// ★ 战斗折算：CHAIN_BATTLE_EFFECTS 是结构化机制覆盖，
//   10 个核心角色全部按官方文案做了战斗折算（按版本顺序：忌炎/今汐/长离/椿/守岸人/
//   珂莱塔/菲比/卡提希娅/嘉贝莉娜/卡卡罗），守岸人单独走 combat.js 的星域特殊路径，
//   其他 9 个用标准 effect 字段（atk/skillDmg/burstDmg/teamAllDmg 等）折算。
//   未在 CHAIN_BATTLE_EFFECTS 中列出的角色，战斗折算仍走文案正则（parseChainLine 兜底分支）。

import { seqText } from '../data/seq.js';
import { getMeta } from './template.js';
import OFFICIAL_CHAINS from '../data/chains-extracted.json' with { type: 'json' };

const ELEMENTS = ['热熔', '冷凝', '导电', '气动', '衍射', '湮灭'];

// 10 个核心角色 1-6 链结构化战斗机制
// 说明：
// · 共鸣链官方文案（chains-extracted.json）作为 UI 展示与提示语
// · 这里只列战斗折算的【模拟器可用字段】，把"层数 / 状态 / 触发 / CD"统一近似为
//   永久 buff 或一次性强化，以贴合 AP 回合制
// · 守岸人单独走 combat.js 里的「星域 · 终末回环」特殊路径（fieldExtend 等专用 effect）
// · 其余 9 个角色字段都来自 applyChainBonuses / applyTeamAuras 已支持的标准 case
const CHAIN_BATTLE_EFFECTS = {
  // ─────────────────────────────────────────────────────────────
  // 1.0 · 忌炎（主C 气动 长刃）— 「锐意之势」爆发解放机
  // 创作者思路：
  //   忌炎在原版是「攒势 → 终结」的爆发型主C：
  //     变奏起手 → 重击/技能积"锐意之势" → 共鸣解放消耗锐意放大终结伤害
  //   做一个专属状态机：锐意之势（默认上限 2，6 链 3），每次重击/技能/变奏积 1 层
  //   释放解放时消耗所有锐意，每层放大解放伤害（默认 +100%，6 链 +120%）
  //   所有共鸣链都围绕这个循环加强 —— 不再是泛用层数 × 数值
  '忌炎': [
    [{ effect: 'jiyanSkillChargeFaster' }],                                    // 1 链 济世：共鸣技能 CD -1
    [{ effect: 'jiyanTongBian', forteGain: 30, atkUp: 0.28, dur: 2 }],         // 2 链 通变：变奏入场送破阵 + 攻击
    [{ effect: 'jiyanGuanShi', crate: 0.16, cdmg: 0.32, dur: 2 }],             // 3 链 观势：每次出手 暴击/暴伤 buff
    [{ effect: 'jiyanQiZheng', value: 0.25, dur: 2 }],                         // 4 链 奇正：解放后全队重击 +25%
    [{ effect: 'jiyanMingDuan', value: 0.45, dur: 2 }],                        // 5 链 明断：变奏入场 攻击 +45%
    [{ effect: 'jiyanRuiyiUpgrade', cap: 3, perStack: 1.2 }]                   // 6 链 移山：锐意 2→3 + 每层 +120%
  ],

  // ─────────────────────────────────────────────────────────────
  // 1.1 · 今汐（主C 衍射 长刃）
  '今汐': [
    [{ effect: 'skillDmg', value: 0.80, label: '惊蛰 4 层 × 20% = 共鸣技能伤害 +80%' }],
    [{ effect: 'atk', value: 0.05, label: '韶光自动回复（折算为攻击 +5%）' }],
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
    [{ effect: 'heavyDmg', value: 1.0, label: '重击倍率 +50% & 重击伤害 +50% ≈ +100%' }],
    [{ effect: 'defPierce', value: 0.40, label: '无视目标 40% 防御' }]
  ],

  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // 2.0 · 珂莱塔（主C 冷凝 佩枪）
  '珂莱塔': [
    [{ effect: 'crate', value: 0.125, label: '对解离目标暴击 +12.5%' }],
    [{ effect: 'burstDmg', value: 1.26, label: '共鸣解放伤害 +126%' }],
    [{ effect: 'skillDmg', value: 0.93, label: '共鸣技能伤害 +93%' }],
    [{ effect: 'teamSkillDmg', value: 0.25, label: '全队共鸣技能伤害 +25%' }],
    [{ effect: 'heavyDmg', value: 0.47, label: '末路见行（重击）伤害 +47%' }],
    [{ effect: 'burstDmg', value: 1.866, label: '死兆伤害 +186.6%' }]
  ],

  // ─────────────────────────────────────────────────────────────
  // 2.1 · 菲比（主C 衍射 音感仪）
  '菲比': [
    [{ effect: 'burstDmg', value: 2.25, label: '赦罪状态解放 255%→480%（折算 +225%）' }],
    [{ effect: 'allDmg', value: 1.20, label: '对光噪目标全伤害 +120%' }],
    [{ effect: 'heavyDmg', value: 0.91, label: '重击星辉伤害 +91%' }],
    [{ effect: 'teamElemDmg', value: 0.10, element: '衍射', label: '全队衍射伤害 +10%（折算抗性降低）' }],
    [{ effect: 'elemDmg', value: 0.12, element: '衍射', label: '自身衍射伤害 +12%' }],
    [{ effect: 'atk', value: 0.10, label: '镜之环召唤时攻击 +10%' }]
  ],

  // ─────────────────────────────────────────────────────────────
  // 2.4 · 卡提希娅（主C 气动 迅刀）
  '卡提希娅': [
    [{ effect: 'cdmg', value: 1.00, label: '决意 4 层 × 25% = 暴击伤害 +100%' }],
    [{ effect: 'normalDmg', value: 0.50, label: '普攻/重击/闪反/变奏倍率 +50%' },
     { effect: 'heavyDmg', value: 2.0,  label: '空中攻击倍率 +200%' }],
    [{ effect: 'burstDmg', value: 1.0, label: '看潮怒风哮之刃 +100%' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '附加属性效应时全队伤害 +20%' }],
    [{ effect: 'hp', value: 0.20, label: '致命伤害护盾（折算为生命上限 +20%）' }],
    [{ effect: 'allDmg', value: 0.40, label: '芙露德莉斯受伤增伤 ≈ 自身伤害 +40%' }]
  ],

  // ─────────────────────────────────────────────────────────────
  // 2.7 · 嘉贝莉娜（主C 热熔 佩枪）
  '嘉贝莉娜': [
    [{ effect: 'cdmg', value: 0.80, label: '余火 10 点 × 8% = 暴击伤害 +80%' }],
    [{ effect: 'atk', value: 1.50, label: '内燃烧攻击加成 +150%（折算）' }],
    [{ effect: 'burstDmg', value: 1.30, label: '共鸣解放伤害 +130%' }],
    [{ effect: 'teamAllDmg', value: 0.20, label: '声骸技能后全队伤害 +20%' }],
    [{ effect: 'skillDmg', value: 1.50, label: '共鸣技能伤害 +150%' }],
    [{ effect: 'allDmg', value: 0.60, label: '永恒位格自身伤害 +60%' },
     { effect: 'elemDmg', value: 0.35, element: '热熔', label: '余火 10 点 × 3.5% = 热熔加深 +35%' }]
  ],

  // ─────────────────────────────────────────────────────────────
  // 常驻 · 卡卡罗（主C 导电 长刃）
  '卡卡罗': [
    [{ effect: 'energyRefund', value: 10, label: '共鸣技能命中额外回 10 能量' }],
    [{ effect: 'skillDmg', value: 0.30, label: '共鸣技能伤害 +30%' }],
    [{ effect: 'elemDmg', value: 0.25, element: '导电', label: '杀戮武装时自身导电 +25%' }],
    [{ effect: 'teamElemDmg', value: 0.20, element: '导电', label: '延奏后全队导电 +20%' }],
    [{ effect: 'variationDmg', value: 0.50, label: '变奏伤害 +50%' }],
    [{ effect: 'burstDmg', value: 1.00, label: '召唤 2 个猎杀影协同（折算解放 +100%）' }]
  ],

  // ─────────────────────────────────────────────────────────────
  // 1.3 · 守岸人（辅助 衍射 音感仪）— 走 combat.js 特殊路径
  // · 1 链：浅析星域持续 +3 回合（默认 2 → 5）+ 切人不消散 + 增益强度 ×2.5
  // · 2 链：星域内全队攻击 +40%
  // · 3 链：共鸣解放后额外回 20 能量（CD 2 回合）
  // · 4 链：共鸣技能治疗 +70%
  // · 5 链：普攻额外打一个相邻敌人
  // · 6 链：变奏暴击伤害 +500%（折算为变奏倍率 ×6）
  '守岸人': [
    [{ effect: 'fieldExtend', duration: 2, persistOnSwitch: true }],
    [{ effect: 'fieldTeamAtk', value: 0.4 }],
    [{ effect: 'burstEnergyRefund', value: 20, cooldown: 2 }],
    [{ effect: 'shorekeeperHeal4', value: 0.7 }],
    [{ effect: 'normalSplit', value: 2 }],
    [{ effect: 'variationDmg', value: 5.0 }]
  ]
};

const FALLBACK_CHAIN = [
  { effect: 'atk', value: 0.06, label: '攻击 +6%' },
  { effect: 'skillDmg', value: 0.10, label: '共鸣技能伤害 +10%' },
  { effect: 'skillDmg', value: 0.06, label: '共鸣技能伤害 +6%' },
  { effect: 'teamAtk', value: 0.08, label: '全队攻击 +8%' },
  { effect: 'burstDmg', value: 0.06, label: '共鸣解放伤害 +6%' },
  { effect: 'burstDmg', value: 0.50, label: '共鸣解放伤害 +50%' }
];

// 守岸人 1-6 链结构化机制（库街区官方文案 · API: /wiki/core/catalogue/item/getEntryDetail id=1286814658335739904）
// 数值与文案均为国服官方原文，只在末尾补 summary（一句话 UI 摘要）。
// 兼容旧调用：把 CHAIN_BATTLE_EFFECTS 转回旧的 [{effect,value,label}] 形式给 parseChainLine 用
function overrideToEffects(roleName, idx) {
  const arr = CHAIN_BATTLE_EFFECTS[roleName];
  if (!arr) return null;
  const entry = OFFICIAL_CHAINS[roleName]?.[idx];
  const effs = arr[idx] || [];
  return effs.map(e => ({
    ...e,
    label: e.label || stripTags(entry?.summary || '')
  }));
}

function stripTags(html) {
  return String(html || '').replace(/<[^>]+>/g, '');
}

// 给外部 UI 用：取链的 title / summary / desc（来自官方文案）
export function getOverrideMeta(roleName, idx) {
  return OFFICIAL_CHAINS[roleName]?.[idx] || null;
}
// 是否有完整官方文案（10 个核心角色都有）
export function hasChainOverride(roleName) {
  return !!OFFICIAL_CHAINS[roleName];
}
// 是否有结构化战斗折算（10 个核心角色 全部有）
export function hasChainBattleEffects(roleName) {
  return !!CHAIN_BATTLE_EFFECTS[roleName];
}

const FORTE_BOOST = {
  '忌炎': { atChain: 6, bonus: 0.5 },
  '今汐': { atChain: 6, bonus: 0.4 },
  '长离': { atChain: 6, bonus: 0.5 },
  '椿': { atChain: 6, bonus: 0.5 },
  '珂莱塔': { atChain: 6, bonus: 0.5 },
  '菲比': { atChain: 6, bonus: 0.4 },
  '卡提希娅': { atChain: 6, bonus: 0.3 },
  '嘉贝莉娜': { atChain: 6, bonus: 0.5 },
  '卡卡罗': { atChain: 6, bonus: 0.5 }
};

function isTeamText(desc) {
  return /队伍中|队伍中的|附近队伍|所有角色|登场角色/.test(desc);
}

function pct(n) {
  return Number(n) / 100;
}

function fmtPct(v) {
  return (v * 100).toFixed(v * 100 % 1 === 0 ? 0 : 1) + '%';
}

function stackMult(desc) {
  const m = desc.match(/(?:可叠加|最多可叠加|最多可以叠加)(\d+)层/);
  return m ? Math.min(Number(m[1]), 6) : 1;
}

function maxPct(desc, patterns) {
  let best = 0;
  patterns.forEach(pattern => {
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    const re = new RegExp(pattern.source, flags);
    let m;
    while ((m = re.exec(desc))) {
      const n = Number(m[1] || m[2] || m[3] || 0);
      if (Number.isFinite(n)) best = Math.max(best, n);
    }
  });
  return best ? pct(best) : 0;
}

function firstNumber(desc, patterns) {
  for (const pattern of patterns) {
    const m = desc.match(pattern);
    if (m) return Number(m[1] || m[2] || 0);
  }
  return 0;
}

function add(effects, effect, value, label) {
  if (!value) return;
  effects.push({ effect, value, label });
}

function damageEffect(desc, team, selfEffect, teamEffect, label, patterns) {
  const value = maxPct(desc, patterns);
  if (!value) return null;
  return {
    effect: team ? teamEffect : selfEffect,
    value,
    label: `${team ? '全队' : '自身'}${label} +${fmtPct(value)}`
  };
}

function parseChainLine(roleName, index) {
  // 有结构化战斗机制就走它（守岸人）
  if (CHAIN_BATTLE_EFFECTS[roleName]) {
    return overrideToEffects(roleName, index) || [];
  }

  const seq = seqText[roleName];
  if (!seq?.[index]) return FALLBACK_CHAIN[index] ? [FALLBACK_CHAIN[index]] : [];

  const meta = getMeta(roleName);
  const desc = seq[index][1] || '';
  const team = isTeamText(desc);
  const effects = [];
  const stacks = stackMult(desc);

  const atk = maxPct(desc, [
    /(?:攻击|攻击力)(?:加成)?(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/,
    /每层使攻击(?:力)?(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, team ? 'teamAtk' : 'atk', atk * stacks, `${team ? '全队' : '自身'}攻击 +${fmtPct(atk * stacks)}`);

  const def = maxPct(desc, [
    /防御(?:力)?(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, team ? 'teamDef' : 'def', def * stacks, `${team ? '全队' : '自身'}防御 +${fmtPct(def * stacks)}`);

  const hp = maxPct(desc, [
    /生命(?:值)?上限(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, 'hp', hp, `生命上限 +${fmtPct(hp)}`);

  const crate = maxPct(desc, [
    /暴击(?:率)?(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/,
    /每层使暴击(?:率)?(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, 'crate', crate * stacks, `暴击率 +${fmtPct(crate * stacks)}`);

  const cdmg = maxPct(desc, [
    /暴击伤害(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/,
    /每层使暴击伤害(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, 'cdmg', cdmg * stacks, `暴击伤害 +${fmtPct(cdmg * stacks)}`);

  const normal = damageEffect(desc, team, 'normalDmg', 'teamNormalDmg', '普攻伤害', [
    /(?:普攻|常态攻击)[^。；;]*?(?:伤害(?:加成|倍率)?|倍率)(?:额外)?(?:提升|增加|加深)(\d+(?:\.\d+)?)%/
  ]);
  if (normal) effects.push(normal);

  const skill = damageEffect(desc, team, 'skillDmg', 'teamSkillDmg', '共鸣技能伤害', [
    /(?:共鸣技能|技能)[^。；;]*?(?:伤害(?:加成|倍率)?|倍率)(?:额外)?(?:提升|增加|加深)(\d+(?:\.\d+)?)%/
  ]);
  if (skill) effects.push(skill);

  const heavy = damageEffect(desc, team, 'heavyDmg', 'teamHeavyDmg', '重击伤害', [
    /(?:重击|空中攻击)[^。；;]*?(?:伤害(?:加成|倍率)?|倍率)(?:额外)?(?:提升|增加|加深)(\d+(?:\.\d+)?)%/
  ]);
  if (heavy) effects.push(heavy);

  const burst = damageEffect(desc, team, 'burstDmg', 'teamBurstDmg', '共鸣解放伤害', [
    /(?:共鸣解放|解放)[^。；;]*?(?:伤害(?:加成|倍率)?|倍率)(?:额外)?(?:提升|增加|加深)(\d+(?:\.\d+)?)%/
  ]);
  if (burst) effects.push(burst);

  const allDmg = maxPct(desc, [
    /全属性伤害加成(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/,
    /全伤害加深(\d+(?:\.\d+)?)%/,
    /造成的伤害(?:额外)?(?:提升|增加|加深)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, team ? 'teamAllDmg' : 'allDmg', allDmg, `${team ? '全队' : '自身'}全伤害 +${fmtPct(allDmg)}`);

  ELEMENTS.forEach(element => {
    const elemDmg = maxPct(desc, [
      new RegExp(`${element}伤害(?:加成|加深)?(?:额外)?(?:提升|增加|加深)(\\d+(?:\\.\\d+)?)%`)
    ]);
    if (!elemDmg) return;
    add(
      effects,
      team ? 'teamElemDmg' : 'elemDmg',
      elemDmg,
      `${team ? '全队' : '自身'}${element}伤害 +${fmtPct(elemDmg)}`
    );
    effects[effects.length - 1].element = element;
  });

  const heal = maxPct(desc, [
    /治疗效果加成(?:额外)?(?:提升|增加)(\d+(?:\.\d+)?)%/
  ]);
  add(effects, team ? 'teamHeal' : 'heal', heal, `${team ? '全队' : '自身'}治疗效果 +${fmtPct(heal)}`);

  const pierce = maxPct(desc, [
    /(?:无视|忽视)(?:目标|对方)?(\d+(?:\.\d+)?)%的?防御/,
    /无视目标(\d+(?:\.\d+)?)%防御/,
    /防御穿透(?:提升|增加)?(\d+(?:\.\d+)?)%/
  ]);
  add(effects, 'defPierce', pierce, `无视防御 +${fmtPct(pierce)}`);

  const energy = firstNumber(desc, [
    /(?:额外)?回复(\d+(?:\.\d+)?)点共鸣能量/,
    /回复(\d+(?:\.\d+)?)点协奏能量/
  ]);
  if (energy) add(effects, 'energyRefund', energy, `额外回复能量 +${energy}`);

  const cdReduce = firstNumber(desc, [
    /冷却时间减少(\d+(?:\.\d+)?)秒/
  ]);
  if (cdReduce) add(effects, 'skillCdReduce', Math.max(1, Math.round(cdReduce / 4)), '共鸣技能冷却 -1 回合');

  if (/免疫伤害和受击|闪避反击|免疫打断/.test(desc)) {
    add(effects, 'dodge', 0.03, '操作容错/闪避率 +3%');
  }

  if (!effects.length) {
    effects.push({
      effect: 'textOnly',
      value: 0,
      label: '保留原文机制（当前战斗模型不额外折算）'
    });
  }
  return effects;
}

export function getChainEffects(roleName, chain) {
  const count = Math.max(0, Math.min(6, chain || 0));
  const effects = [];
  for (let i = 0; i < count; i++) effects.push(...parseChainLine(roleName, i));
  return effects;
}

export function applyChainBonuses(unit) {
  const effects = getChainEffects(unit.name, unit.chain);
  effects.forEach(e => {
    switch (e.effect) {
      case 'atk':
        unit.atk = Math.round(unit.atk * (1 + e.value));
        break;
      case 'def':
        unit.def = Math.round(unit.def * (1 + e.value));
        break;
      case 'hp':
        unit.hp = Math.round(unit.hp * (1 + e.value));
        unit.hpMax = Math.round(unit.hpMax * (1 + e.value));
        break;
      case 'crate':
        unit.crate += e.value;
        break;
      case 'cdmg':
        unit.cdmg += e.value;
        break;
      case 'normalDmg':
        unit.normalBonus = (unit.normalBonus || 0) + e.value;
        break;
      case 'skillDmg':
        unit.skillBonus = (unit.skillBonus || 0) + e.value;
        break;
      case 'burstDmg':
        unit.burstBonus = (unit.burstBonus || 0) + e.value;
        break;
      case 'heavyDmg':
        unit.heavyBonus = (unit.heavyBonus || 0) + e.value;
        break;
      case 'allDmg':
        unit.normalBonus = (unit.normalBonus || 0) + e.value;
        unit.skillBonus = (unit.skillBonus || 0) + e.value;
        unit.burstBonus = (unit.burstBonus || 0) + e.value;
        unit.heavyBonus = (unit.heavyBonus || 0) + e.value;
        break;
      case 'elemDmg':
        unit.elemBonus[e.element || unit.element] = (unit.elemBonus[e.element || unit.element] || 0) + e.value;
        break;
      case 'heal':
        unit.healBonus = (unit.healBonus || 0) + e.value;
        break;
      case 'defPierce':
        unit.pierceDef = (unit.pierceDef || 0) + e.value;
        break;
      case 'dodge':
        unit.dodge = Math.min(0.6, (unit.dodge || 0) + e.value);
        break;
      case 'skillCdReduce':
        unit.skillCdReduce = Math.max(unit.skillCdReduce || 0, e.value);
        break;
      // ===== 守岸人结构化机制 =====
      case 'normalSplit':
        // 5 链：普攻额外打一个相邻敌人
        unit.normalSplit = Math.max(unit.normalSplit || 1, e.value);
        break;
      case 'variationDmg':
        // 6 链：变奏伤害 +500%
        unit.variationBonus = (unit.variationBonus || 0) + e.value;
        break;
      case 'burstEnergyRefund':
        // 3 链：解放后额外回 20 能量，CD 2 回合（运行时由 combat 控制 cd）
        unit.burstEnergyRefund = (unit.burstEnergyRefund || 0) + e.value;
        unit.burstEnergyRefundCd = Math.max(unit.burstEnergyRefundCd || 0, e.cooldown || 2);
        break;
      case 'burstHealBuff':
        // 1 链：标记角色拥有"解放治疗 +150%/2 回合 切人不结束"机制
        unit.burstHealBuffValue = (unit.burstHealBuffValue || 0) + e.value;
        unit.burstHealBuffDur = Math.max(unit.burstHealBuffDur || 0, e.duration || 2);
        break;
      case 'skillTeamAtkBuff':
        // 2 链：技能后全队攻击 +40%/2 回合
        unit.skillTeamAtkBuffValue = (unit.skillTeamAtkBuffValue || 0) + e.value;
        unit.skillTeamAtkBuffDur = Math.max(unit.skillTeamAtkBuffDur || 0, e.duration || 2);
        break;
      // ===== 守岸人 浅析星域 =====
      case 'fieldExtend':
        // 1 链：星域持续 +3 回合 + 切人不消散
        unit.fieldExtendDur = (unit.fieldExtendDur || 0) + (e.duration || 0);
        if (e.persistOnSwitch) unit.fieldPersistOnSwitch = true;
        break;
      case 'fieldTeamAtk':
        // 2 链：星域内附近角色攻击 +40%
        unit.fieldExtraAtk = (unit.fieldExtraAtk || 0) + e.value;
        break;
      case 'shorekeeperHeal4':
        // 4 链：共鸣技能治疗 +70%
        unit.healBuff4Chain = (unit.healBuff4Chain || 0) + e.value;
        break;
      // ===== 忌炎「锐意之势」=====
      case 'jiyanSkillChargeFaster':
        // 1 链 济世：共鸣技能 CD -1
        unit.skillCdReduce = Math.max(unit.skillCdReduce || 0, 1);
        break;
      case 'jiyanTongBian':
        // 2 链 通变：变奏入场 → 破阵 +N + 攻击 buff
        unit.jiyanTongBian = { forteGain: e.forteGain || 30, atkUp: e.atkUp || 0.28, dur: e.dur || 2 };
        break;
      case 'jiyanGuanShi':
        // 3 链 观势：技能/重击/变奏/解放后 暴击 + 暴伤 buff（自身 2 回合）
        unit.jiyanGuanShi = { crate: e.crate || 0.16, cdmg: e.cdmg || 0.32, dur: e.dur || 2 };
        break;
      case 'jiyanQiZheng':
        // 4 链 奇正：解放后全队重击 +25% / 2 回合
        unit.jiyanQiZheng = { value: e.value || 0.25, dur: e.dur || 2 };
        break;
      case 'jiyanMingDuan':
        // 5 链 明断：变奏入场 攻击 +45% / 2 回合（与 2 链 atkUp 同源叠加）
        unit.jiyanMingDuan = { value: e.value || 0.45, dur: e.dur || 2 };
        break;
      case 'jiyanRuiyiUpgrade':
        // 6 链 移山：锐意上限 2→3，每层 +120%
        unit.jiyanRuiyiCap = e.cap || 3;
        unit.jiyanRuiyiPerStack = e.perStack || 1.2;
        break;
    }
  });

  const boost = FORTE_BOOST[unit.name];
  if (boost && unit.chain >= boost.atChain && unit.forte) {
    unit.forte.effectMult = (unit.forte.effectMult || 1) + boost.bonus;
  }
}

export function applyTeamAuras(team) {
  team.forEach(member => {
    const effects = getChainEffects(member.name, member.chain);
    effects.forEach(e => {
      switch (e.effect) {
        case 'teamAtk':
          team.forEach(t => { t.atk = Math.round(t.atk * (1 + e.value)); });
          break;
        case 'teamDef':
          team.forEach(t => { t.def = Math.round(t.def * (1 + e.value)); });
          break;
        case 'teamAllDmg':
          team.forEach(t => {
            t.normalBonus = (t.normalBonus || 0) + e.value;
            t.skillBonus = (t.skillBonus || 0) + e.value;
            t.burstBonus = (t.burstBonus || 0) + e.value;
            t.heavyBonus = (t.heavyBonus || 0) + e.value;
          });
          break;
        case 'teamElemDmg':
          team.forEach(t => {
            t.elemBonus[e.element] = (t.elemBonus[e.element] || 0) + e.value;
          });
          break;
        case 'teamNormalDmg':
          team.forEach(t => { t.normalBonus = (t.normalBonus || 0) + e.value; });
          break;
        case 'teamSkillDmg':
          team.forEach(t => { t.skillBonus = (t.skillBonus || 0) + e.value; });
          break;
        case 'teamBurstDmg':
          team.forEach(t => { t.burstBonus = (t.burstBonus || 0) + e.value; });
          break;
        case 'teamHeavyDmg':
          team.forEach(t => { t.heavyBonus = (t.heavyBonus || 0) + e.value; });
          break;
        case 'teamHeal':
          team.forEach(t => { t.healBonus = (t.healBonus || 0) + e.value; });
          break;
      }
    });

    if (member._weaponTeamAtk) {
      team.forEach(t => { t.atk = Math.round(t.atk * (1 + member._weaponTeamAtk)); });
    }
  });
}

export function getEnergyRefund(unit) {
  return getChainEffects(unit.name, unit.chain)
    .filter(e => e.effect === 'energyRefund')
    .reduce((sum, e) => sum + e.value, 0);
}

export function getChainLabels(roleName) {
  return Array.from({ length: 6 }, (_, i) => {
    // 覆写优先：直接用结构化 summary（含 HTML 高亮）
    const meta = getOverrideMeta(roleName, i);
    if (meta) return meta.summary;
    const effects = parseChainLine(roleName, i);
    return effects.map(e => e.label).join(' · ');
  });
}
