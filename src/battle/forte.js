// 共鸣回路（Forte Circuit）
// 数据校准（2026-06，第三轮联网 AI）：
//   每个角色独有的资源条/状态机制，是角色差异化核心
//   AI 警告："不要把简化描述当官方技能原文"，这里全部走简化建模
//
// 设计：每个角色一个 forte 配置
//   - kind: 'gauge' (资源条积累) / 'stacks' (层数) / 'state' (形态切换) / 'threshold' (阈值)
//   - resourceName: UI 显示名
//   - max: 满值
//   - gainPerSkill: 每次技能积累多少
//   - gainPerNormal: 每次普攻积累多少
//   - gainPerBurst: 解放给多少
//   - effectAtFull: 满值时的效果说明（战斗中可触发）
//   - effectType: 满值效果实际类型（影响战斗逻辑）

import { S } from '../state.js';

export const FORTE = {
  // ===== 第三轮 AI 校准的 10 个重点角色 =====
  '忌炎': {
    kind: 'gauge', resourceName: '破阵值', max: 100,
    gainPerNormal: 12, gainPerSkill: 25, gainPerBurst: 40,
    effectType: 'enhancedNormal',  // 满后下一次普攻强化（大范围长枪连段）
    effectMult: 2.0,
    desc: '攒满破阵值后，下次普攻进入强化形态（×2 段伤害）'
  },
  '今汐': {
    kind: 'stacks', resourceName: '韶光层数', max: 4,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 2,
    effectType: 'enhancedSkill',
    effectMult: 1.8,
    desc: '韶光满层时共鸣技能进入强化形态（×1.8 伤害）'
  },
  '长离': {
    kind: 'stacks', resourceName: '离火', max: 6,
    gainPerNormal: 1, gainPerSkill: 2, gainPerBurst: 3,
    effectType: 'enhancedNormal',
    effectMult: 2.2,
    desc: '攒满离火，普攻进入心眼派生（×2.2 重击）'
  },
  '守岸人': {
    kind: 'gauge', resourceName: '协奏', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 30,
    effectType: 'shorekeeperField',           // 仅作 UI 标识，实际效果在 doBurst 里
    desc: '共鸣解放·终末回环展开「星域」：全队每回合回血 + 暴击 +20% + 暴伤 +30%（3 回合）。守岸人是治疗位，所有共鸣链都用来加强星域'
  },
  '椿': {
    kind: 'gauge', resourceName: '红椿', max: 100,
    gainPerNormal: 10, gainPerSkill: 15, gainPerBurst: 30,
    effectType: 'enhancedNormal',
    effectMult: 1.7,
    desc: '红椿满时进入强化形态（普攻 ×1.7）'
  },
  '珂莱塔': {
    kind: 'stacks', resourceName: '晶体层数', max: 5,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 2,
    effectType: 'enhancedSkill',
    effectMult: 2.0,
    desc: '晶体满层强化共鸣技能（×2.0 冷凝爆发）'
  },
  '菲比': {
    kind: 'state', resourceName: '衍射形态', max: 1,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 0,
    effectType: 'toggleForm',
    effectMult: 1.5,
    desc: '使用技能切换衍射形态，普攻附带衍射状态（×1.5 元素伤害）'
  },
  '卡提希娅': {
    kind: 'stacks', resourceName: '决意', max: 3,
    gainPerNormal: 1, gainPerSkill: 1, gainPerBurst: 0,
    effectType: 'resolveBuff',
    effectMult: 0.10,
    desc: '普攻/重击/共鸣技能获得 1 层【决意】（上限 3 层），每层气动伤害 +10%，持续 2 回合。满决意时共鸣解放消耗全部决意获得形态之力进入芙露德莉斯形态。'
  },
  '嘉贝莉娜': {
    kind: 'threshold', resourceName: '猎杀阈值', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'enhancedBurst',
    effectMult: 1.6,
    desc: '阈值满时共鸣解放伤害 ×1.6'
  },
  '安可': {
    kind: 'gauge', resourceName: '失序值', max: 100,
    // 安可失序值由 combat.js 的 encoreGainDisorder 专门控制，避免 generic gainForte 双算
    gainPerNormal: 0, gainPerSkill: 0, gainPerBurst: 0, gainPerHeavy: 0,
    effectType: 'encoreDisorder',
    effectMult: 1.0,
    desc: '普攻/技能/变奏积攒失序值，满 100 时重击触发白咩·失控之炎；黑咩大暴走期间触发黑咩·暴走之炎'
  },
  '卡卡罗': {
    kind: 'state', resourceName: '杀意', max: 100,
    gainPerNormal: 5, gainPerSkill: 15, gainPerBurst: 100,  // 解放期间杀意拉满
    effectType: 'burstWindow',
    effectMult: 1.5,
    desc: '解放期间进入 Deathblade 形态，普攻/技能伤害 +50%'
  },

  // ── 限定 5★（补）──
  '吟霖': {
    kind: 'gauge', resourceName: '审判值', max: 100,
    gainPerNormal: 15, gainPerSkill: 30, gainPerBurst: 40,
    effectType: 'judgmentMark',
    effectMult: 1.0,
    desc: '满审判值触发审判之雷，给主目标挂审判印记（3 层上限，命中印记目标增伤）'
  },
  '折枝': {
    kind: 'gauge', resourceName: '墨韵', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 1.8,
    desc: '墨韵满时共鸣技能强化，召唤墨鹤协同攻击（×1.8）'
  },
  '相里要': {
    kind: 'gauge', resourceName: '衍构', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'burstWindow',
    effectMult: 1.5,
    desc: '满衍构时进入「思维矩阵」，攻击/技能伤害 +50%，持续 2 回合'
  },
  '洛可可': {
    kind: 'gauge', resourceName: '想象力', max: 100,
    gainPerNormal: 8, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedBurst',
    effectMult: 1.6,
    desc: '想象力满时共鸣解放「即兴喜剧」伤害 ×1.6'
  },
  '布兰特': {
    kind: 'gauge', resourceName: '航路', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'enhancedBurst',
    effectMult: 1.6,
    desc: '航路满时「火焰归亡曲」伤害 +60% + 全队治疗'
  },
  '坎特蕾拉': {
    kind: 'gauge', resourceName: '迷离', max: 100,
    gainPerNormal: 8, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedBurst',
    effectMult: 1.8,
    desc: '迷离满时进入「蜃境」，解放伤害 ×1.8'
  },

  // ── 常驻 5★（补）──
  '维里奈': {
    kind: 'gauge', resourceName: '光合', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'healField',
    effectMult: 0.8,
    desc: '光合满时展开持续治疗领域（3 回合，每回合恢复 atk×80%）'
  },
  '凌阳': {
    kind: 'gauge', resourceName: '狮势', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 40,
    effectType: 'burstWindow',
    effectMult: 1.3,
    desc: '狮势满时进入「狮子奋迅」，普攻 +20% / 技能 +10%，持续 2 回合'
  },
  '鉴心': {
    kind: 'gauge', resourceName: '气', max: 100,
    gainPerNormal: 12, gainPerSkill: 25, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 2.0,
    desc: '气满时「行气反击」伤害 ×2.0'
  },

  // ── 4★ ──
  '丹瑾': {
    kind: 'gauge', resourceName: '彤华', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 1.7,
    desc: '彤华满时共鸣技能伤害 ×1.7（消耗彤华触发缭乱/纷落）'
  },
  '炽霞': {
    kind: 'stacks', resourceName: '热压弹', max: 60,
    gainPerNormal: 3, gainPerSkill: 10, gainPerBurst: 60,
    effectType: 'enhancedBurst',
    effectMult: 1.5,
    desc: '热压弹满 60 时共鸣解放伤害 ×1.5（加麻加辣满层额外攻击 +30%）'
  },
  '秋水': {
    kind: 'gauge', resourceName: '迷雾', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 25,
    effectType: 'enhancedSkill',
    effectMult: 1.6,
    desc: '迷雾满时共鸣技能·雾化子弹伤害 ×1.6（潜行状态气动 +25%）'
  },
  '渊武': {
    kind: 'gauge', resourceName: '雷势', max: 100,
    gainPerNormal: 10, gainPerSkill: 15, gainPerBurst: 30,
    effectType: 'enhancedBurst',
    effectMult: 1.5,
    desc: '雷势满时共鸣解放伤害 ×1.5（雷之楔在场额外 +50%）'
  },
  '桃祈': {
    kind: 'gauge', resourceName: '守势', max: 100,
    gainPerNormal: 8, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 1.6,
    desc: '守势满时「攻防转换」伤害 ×1.6 + 获得护盾'
  },
  '散华': {
    kind: 'gauge', resourceName: '冰棘', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedHeavy',
    effectMult: 1.8,
    desc: '冰棘满时重击·爆裂伤害 ×1.8（引爆冰棱/冰川范围伤害）'
  },
  '秧秧': {
    kind: 'gauge', resourceName: '流息', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 25,
    effectType: 'enhancedSkill',
    effectMult: 1.6,
    desc: '流息满时共鸣技能伤害 ×1.6（风场牵引范围扩大）'
  },
  '莫特斐': {
    kind: 'gauge', resourceName: '音律', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 30,
    effectType: 'enhancedBurst',
    effectMult: 1.5,
    desc: '音律满时共鸣解放伤害 ×1.5（浮翼狂想持续期间加强音协同）'
  },
  '白芷': {
    kind: 'stacks', resourceName: '念意', max: 4,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 2,
    effectType: 'enhancedHeal',
    effectMult: 1.5,
    desc: '念意满 4 层时治疗加成 ×1.5（消耗念意触发频隙回响强化）'
  },
  '釉瑚': {
    kind: 'gauge', resourceName: '奇珍', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'enhancedSkill',
    effectMult: 1.6,
    desc: '奇珍满时共鸣技能伤害 ×1.6（霁青层数额外暴伤）'
  },
  '灯灯': {
    kind: 'gauge', resourceName: '光能', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 1.7,
    desc: '光能满时「强光穿射」伤害 ×1.7（快件已签收）'
  },
  '卜灵': {
    kind: 'gauge', resourceName: '符法', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'enhancedHeal',
    effectMult: 1.5,
    desc: '符法满时治疗加成 ×1.5（五雷荡煞阵 + 三才合一强化）'
  }
};

// 通用回路（其他 5 星角色）：简化攻击堆叠
const GENERIC_FORTE = {
  kind: 'gauge', resourceName: '专注', max: 100,
  gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 30,
  effectType: 'enhancedNormal',
  effectMult: 1.5,
  desc: '专注满时下次普攻 ×1.5'
};

export function getForte(roleName) {
  return FORTE[roleName] || GENERIC_FORTE;
}

// 战斗中给单位添加 forte 状态
export function initForte(unit) {
  const f = getForte(unit.name);
  // 起始值（如守岸人开局自带 50 坍缩核，避免裸打第一次技能）
  const start = unit.forteStart || 0;
  unit.forte = {
    ...f,
    current: Math.min(start, f.max),
    ready: start >= f.max          // 满值标志（满后下次相应操作触发效果，触发后清空）
  };
}

// 角色出手后增加资源
export function gainForte(unit, actionType /* 'normal'|'skill'|'burst'|'heavy' */) {
  if (!unit.forte) return;
  const f = unit.forte;
  let gain = 0;
  if (actionType === 'normal') gain = f.gainPerNormal;
  else if (actionType === 'skill') gain = f.gainPerSkill;
  else if (actionType === 'burst') gain = f.gainPerBurst;
  else if (actionType === 'heavy') gain = (f.gainPerHeavy ?? f.gainPerNormal * 1.5);
  f.current = Math.min(f.max, f.current + gain);
  if (f.current >= f.max) f.ready = true;
}

// 消费 forte（满值后释放强化效果时调用）
export function consumeForte(unit) {
  if (!unit.forte) return false;
  if (!unit.forte.ready) return false;
  unit.forte.current = 0;
  unit.forte.ready = false;
  return true;
}

// 检查 forte 满后该不该自动强化当前动作
export function forteEnhances(unit, actionType) {
  if (!unit.forte?.ready) return null;
  const t = unit.forte.effectType;
  // 强化对应动作？
  if (actionType === 'normal' && (t === 'enhancedNormal' || t === 'toggleForm')) return unit.forte;
  if (actionType === 'skill' && t === 'enhancedSkill') return unit.forte;
  if (actionType === 'burst' && t === 'enhancedBurst') return unit.forte;
  return null;
}
