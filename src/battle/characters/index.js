// 角色机制注册表
//
// import 各角色的 default export（纯数据 + 可选 hook 函数），
// 对外提供统一的 getCharacterMechanic / fireCharacterHook / hasHeavyAttack / renderCharacterBattleStatus。

import jiyan from './jiyan.js';
import shorekeeper from './shorekeeper.js';
import yinlin from './yinlin.js';
import encore from './encore.js';
import cartethyia from './cartethyia.js';
import jinhsi from './jinhsi.js';
import changli from './changli.js';
import camellia from './camellia.js';
import carlotta from './carlotta.js';
import phoebe from './phoebe.js';
import brant from './brant.js';
import cantarella from './cantarella.js';
import kakaro from './kakaro.js';
import zhezhi from './zhezhi.js';

// 轻量角色：仅标记 hasHeavy，无完整 mechanic 文件
const LIGHTWEIGHT = {
  '嘉贝莉娜': { hasHeavy: true },
  '洛可可':   { hasHeavy: true },
  '鉴心':     { hasHeavy: true }
};

const FULL = {
  '忌炎': jiyan, '守岸人': shorekeeper, '吟霖': yinlin, '安可': encore, '卡提希娅': cartethyia,
  '今汐': jinhsi, '长离': changli, '椿': camellia, '珂莱塔': carlotta, '菲比': phoebe,
  '布兰特': brant, '坎特蕾拉': cantarella, '卡卡罗': kakaro, '折枝': zhezhi
};

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
