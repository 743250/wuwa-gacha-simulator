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
import zanyan from './zanyan.js';
import frolo from './frolo.js';
import chouyuan from './chouyuan.js';
import qianxiao from './qianxiao.js';
import aogusita from './aogusita.js';
import xiakong from './xiakong.js';
import younuo from './younuo.js';
import lupa from './lupa.js';
import gaberina from './gaberina.js';

// 轻量角色：仅标记 hasHeavy，无完整 mechanic 文
const LIGHTWEIGHT = {
  '洛可可':   { hasHeavy: true },
  '鉴心':     { hasHeavy: true },
  '相里要':   { hasHeavy: true },
  '维里奈':   { hasHeavy: false },
  '凌阳':     { hasHeavy: false },
  // ── 3.0-3.4 限定 5★（A 级工厂，暂无专属状态机）──
  '琳奈':     { hasHeavy: true },   // 蓄力重击 → 灵感碰撞
  '莫宁':     { hasHeavy: false },
  '爱弥斯':   { hasHeavy: true },   // 蓄力重击 → 同步率爆发
  '陆·赫斯':  { hasHeavy: false },
  '西格莉卡': { hasHeavy: true },   // 黄语义符文入口
  '绯雪':     { hasHeavy: true },   // 进入预求身入口
  '达妮娅':   { hasHeavy: false },  // 重击键替换为形态切换
  '露西':     { hasHeavy: true },   // 快速编码入口
  '丽贝卡':   { hasHeavy: true },   // 铁胆形态入口
  '洛瑟菈':   { hasHeavy: false }
};

const FULL = {
  '忌炎': jiyan, '守岸人': shorekeeper, '吟霖': yinlin, '安可': encore, '卡提希娅': cartethyia,
  '今汐': jinhsi, '长离': changli, '椿': camellia, '珂莱塔': carlotta, '菲比': phoebe,
  '布兰特': brant, '坎特蕾拉': cantarella, '卡卡罗': kakaro, '折枝': zhezhi, '赞妮': zanyan,
  '弗洛洛': frolo,
  '仇远': chouyuan,
  '千咲': qianxiao,
  '奥古斯塔': aogusita,
  '夏空': xiakong,
  '尤诺': younuo,
  '露帕': lupa,
  '嘉贝莉娜': gaberina
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

// 统一徽章收集：返回角色专属资源 badge 数组（供战斗 UI 卡片下方状态行使用）
export function collectCharacterBadges(unit) {
  const collect = getCharacterMechanic(unit?.name)?.collectBadges;
  if (typeof collect !== 'function') return [];
  return collect(unit) || [];
}

// 通用调派：避免 combat.js 直接 import 各角色模块
export function fireCharacterHook(self, hookName, ctx) {
  const fn = getCharacterMechanic(self.name)?.[hookName];
  if (typeof fn === 'function') fn(self, ctx);
}

// 直查模式：返回值型 hook（resolveCost / inMindEye / mindEyeForm 等）通过这里查询
// 调用方无需 import 角色模块，也无需写 `if (self.name === 'X')` 硬编码
export function queryCharacterHook(self, hookName, ...args) {
  const fn = getCharacterMechanic(self.name)?.[hookName];
  return typeof fn === 'function' ? fn(self, ...args) : undefined;
}
