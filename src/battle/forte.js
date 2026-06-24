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
    kind: 'stacks', resourceName: '气动侵蚀', max: 3,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 1,
    effectType: 'erosion',          // 给敌人施加气动侵蚀（debuff）
    effectMult: 0.15,                // 敌人受到气动伤害 +15%
    desc: '攒满气动侵蚀，给当前目标施加气动易伤（受气动伤害 +15%）'
  },
  '嘉贝莉娜': {
    kind: 'threshold', resourceName: '猎杀阈值', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'enhancedBurst',
    effectMult: 1.6,
    desc: '阈值满时共鸣解放伤害 ×1.6'
  },
  '卡卡罗': {
    kind: 'state', resourceName: '杀意', max: 100,
    gainPerNormal: 5, gainPerSkill: 15, gainPerBurst: 100,  // 解放期间杀意拉满
    effectType: 'burstWindow',
    effectMult: 1.5,
    desc: '解放期间进入 Deathblade 形态，普攻/技能伤害 +50%'
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
