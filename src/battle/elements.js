// 元素属性 + 抗性模型
// 数据校准（2026-06，第三轮）：
//   鸣潮无通用元素克制环。Fandom 敌人 Stats 表显示：
//   敌人对自身属性约 40% 抗性、对其他元素约 10% 抗性。
//   所以伤害修正改为 (1 - resist[attackerElem])，不再用"弱点 ×1.5"。

export const ELEMENTS = ['热熔', '湮灭', '气动', '冷凝', '衍射', '导电'];

export const ELEMENT_COLOR = {
  '热熔': '#ff8c5e',
  '湮灭': '#c39bff',
  '气动': '#8de6a6',
  '冷凝': '#7bd6ff',
  '衍射': '#fff0b0',
  '导电': '#b58cff',
  '物理': '#cccccc'
};

// 抗性修正（敌方对此元素的减免）
// 返回 0..1 的乘数（1 = 无抗性，0.6 = 减伤 40%）
// defender 通常携带 resist 字段（来自 enemies.js）；
// 兼容旧 weaknesses 字段：命中 weakness 视为 1.0（无抗），否则按 element 自身 0.4 抗
export function resistMultiplier(attackerElem, defender) {
  if (!defender) return 1.0;
  if (defender.resist && typeof defender.resist[attackerElem] === 'number') {
    return 1.0 - defender.resist[attackerElem];
  }
  // 兼容旧数据
  if (defender.weaknesses?.includes(attackerElem)) return 1.0;
  if (defender.element === attackerElem) return 0.6;
  return 0.9;
}

// 易伤态：敌人破韧（vibration 削空）后 1 回合受到伤害额外 ×1.3
export function vibrationMultiplier(defender) {
  if (defender && defender.vibrationBroken > 0) return 1.3;
  return 1.0;
}

// 旧接口（向后兼容）：仍然返回总乘数，内部走新模型
export function elementMultiplier(attackerElem, defenderElem, defenderWeaknesses) {
  // 旧调用模式（不带敌人对象），按兼容口径计算
  const fakeDefender = { element: defenderElem, weaknesses: defenderWeaknesses || [] };
  return resistMultiplier(attackerElem, fakeDefender);
}

export function elementLabel(elem) {
  if (!elem) return '';
  return `<span style="color:${ELEMENT_COLOR[elem] || '#fff'};font-weight:600">${elem}</span>`;
}
