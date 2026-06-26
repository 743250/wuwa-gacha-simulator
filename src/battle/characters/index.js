// 角色机制注册表
//
// import 各角色的 default export（纯数据 + 可选 hook 函数），
// 对外提供统一的 getCharacterMechanic / fireCharacterHook / hasHeavyAttack / renderCharacterBattleStatus。

import jiyan from './jiyan.js';
import shorekeeper from './shorekeeper.js';
import yinlin from './yinlin.js';
import encore from './encore.js';
import cartethyia from './cartethyia.js';

// 硬编码在此的角色元数据（未做成独立文件的轻量角色直接写在这里）
const LIGHTWEIGHT = {
  '长离': { hasHeavy: true },
  '珂莱塔': { hasHeavy: true },
  '菲比': { hasHeavy: true },
  '嘉贝莉娜': { hasHeavy: true },
  '卡卡罗': { hasHeavy: true }
};

const FULL = { '忌炎': jiyan, '守岸人': shorekeeper, '吟霖': yinlin, '安可': encore, '卡提希娅': cartethyia };

const ALL = { ...LIGHTWEIGHT, ...FULL };

export function getCharacterMechanic(roleName) {
  return ALL[roleName] || null;
}

export function hasHeavyAttack(roleName) {
  return !!getCharacterMechanic(roleName)?.hasHeavy;
}

export function renderCharacterBattleStatus(unit) {
  const render = getCharacterMechanic(unit?.name)?.renderBattleStatus;
  return render ? render(unit) : '';
}

// 通用调派：避免 combat.js 直接 import 各角色模块
export function fireCharacterHook(self, hookName, ctx) {
  const fn = getCharacterMechanic(self.name)?.[hookName];
  if (typeof fn === 'function') fn(self, ctx);
}
