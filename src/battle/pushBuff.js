// 统一的范围 buff 推送工具
//
// 设计意图：让"全队 buff"在数据层就是"单一 buff 挂在释放者身上 + scope 字段标识作用范围"，
// 不再 forEach 给每个队员 push 一份。但现有战斗结算大量依赖 unit.buffs.find(...)（反查"该角色有没有吃这条 buff"），
// 因此工具在内部按 scope 把 buff 展开到每个目标，附带 installer=<释放者 idx> 元数据：
//   · UI 渲染只看 installer === unit.idx（卡内联显示在释放者头像下）
//   · 战斗结算照旧遍历 unit.buffs，无需改 push 侧以外任何代码
//
// scope 取值（可主动限定）：
//   'self'        : 仅自己（退化为单 buff，非全队）
//   'team'        : 全队存活队友（含自己）
//   'allAllies'   : 同 'team'，别名
//   'allEnemies'  : 全体敌人
//   'everyone'    : 所有存活角色 + 所有敌人
// 未实装的 scope（暂不实装结算侧）当前等价于 team 的语义扩展，调用方应在结算前确认 buff.type 已被支持。

export const BUFF_SCOPES = new Set(['self', 'team', 'allAllies', 'allEnemies', 'everyone']);

function listTargets(self, battle, scope) {
  const allies = (battle?.team || []).filter(t => t.alive);
  const enemies = (battle?.enemies || []).filter(e => e.alive);
  switch (scope) {
    case 'self':       return [self];
    case 'team':
    case 'allAllies':  return allies;
    case 'allEnemies': return enemies;
    case 'everyone':   return [...allies, ...enemies];
    default:           return allies;
  }
}

// pushSingleBuff: 单目标 push，含 src 去重（与 echoSetTriggers.pushBuff 一致语义）
function pushSingle(target, buff, srcKey, installerIdx) {
  if (!target || !target.alive) return;
  if (!target.buffs) target.buffs = [];
  const existing = target.buffs.find(b =>
    b.src === srcKey &&
    b.type === buff.type &&
    (buff.element == null || b.element === buff.element)
  );
  if (existing) {
    existing.duration = buff.duration;
    existing.value = buff.value;
    // 范围元数据保留刷新
    existing.scope = buff.scope || existing.scope;
    existing.installer = installerIdx ?? existing.installer;
    return;
  }
  target.buffs.push({ ...buff, src: srcKey, installer: installerIdx });
}

// pushTeamBuff: 范围 buff 推送主入口
//   self   : 释放者（角色 unit）
//   battle : 战斗对象
//   buff   : { type, value, duration, src, scope, element?, persistent?, ... }
//   opts   : { installerIdx? } 默认 self.idx
export function pushTeamBuff(self, battle, buff, opts = {}) {
  if (!self || !battle) return;
  const scope = buff.scope || 'team';
  if (!BUFF_SCOPES.has(scope)) {
    console.warn(`[pushTeamBuff] unknown scope "${scope}" fallback to 'team'`);
  }
  const installerIdx = opts.installerIdx ?? self.idx;
  const srcKey = buff.src || `scope:${scope}:${buff.type}`;
  const targets = listTargets(self, battle, scope);
  for (const t of targets) {
    pushSingle(t, buff, srcKey, installerIdx);
  }
  return { scope, srcKey, targets: targets.length };
}

// pushTeamBuffs: 一次性 push 多条（同 scope 或各自带 scope）
export function pushTeamBuffs(self, battle, buffs, commonScope) {
  for (const b of buffs) {
    if (commonScope && !b.scope) b.scope = commonScope;
    pushTeamBuff(self, battle, b);
  }
}

// 工具：把"老式 forEach push"（手动遍历）转换为 pushTeamBuff 调用是否安全？
// ——本身不需要重写历史调用点，新代码用 pushTeamBuff 即可。
export default pushTeamBuff;