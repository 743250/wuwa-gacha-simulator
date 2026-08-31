// 资源统一注册表 · Phase 4 适配器
//
// 把 forte.js FORTE + stacks.js STACK_DEFS + forms.js FORM_DEFS 适配注册到 RESOURCE_REGISTRY。
// 现有消费者(forte.js / stacks.js / forms.js 的逻辑)不改,保持向后兼容。
// RESOURCE_REGISTRY 作为统一视图供未来新代码使用(如 UI 一次性列出角色所有资源)。
//
// Phase 3:副作用收口为显式 initBattleResources(),由 src/init.ts 调用。
import { FORTE } from '../forte.js';
import { STACK_DEFS } from '../stacks.js';
import { FORM_DEFS } from '../forms.js';
import { RESOURCE_REGISTRY, registerResource, type ResourceDef } from './types';

let _initialized = false;

export function initBattleResources(): void {
  if (_initialized) return;
  _initialized = true;

  // 1. forte.js FORTE → RESOURCE_REGISTRY
  for (const [roleName, def] of Object.entries(FORTE)) {
    const id = `forte_${roleName}`;
    registerResource({
      id,
      name: def.resourceName,
      kind: def.kind,
      cap: def.max,
      character: roleName,
      max: def.max,
      gainPerNormal: def.gainPerNormal,
      gainPerSkill: def.gainPerSkill,
      gainPerBurst: def.gainPerBurst,
      gainPerHeavy: def.gainPerHeavy,
      effectType: def.effectType,
      effectMult: def.effectMult,
      desc: def.desc,
    } as ResourceDef);
  }

  // 2. stacks.js STACK_DEFS → RESOURCE_REGISTRY(kind='layer')
  for (const [id, def] of Object.entries(STACK_DEFS)) {
    registerResource({
      id,
      name: (def as any).name || id,
      kind: 'layer',
      character: (def as any).character,
      ...(def as object),
    } as ResourceDef);
  }

  // 3. forms.js FORM_DEFS → RESOURCE_REGISTRY(kind='form')
  for (const [id, def] of Object.entries(FORM_DEFS)) {
    registerResource({
      id,
      name: (def as any).name || id,
      kind: 'form',
      ...(def as object),
    } as ResourceDef);
  }
}

// 迁移状态追踪(从 RESOURCE_REGISTRY 派生)。惰性计算,避免在 init 前返空。
export function getMigratedResources(): string[] {
  return Object.keys(RESOURCE_REGISTRY);
}

// ===== 查询 API · Phase 5 =====
// 给未来新代码用的统一入口。现有 UI 仍读 unit.forte 运行时字段(已含定义),
// 不强行迁——见 plan.md Phase 5 决策。新代码读 resource API,旧代码保持稳定。

// 返回某角色的所有资源定义(别名,语义更清晰)
export function getRoleResources(roleName: string): ResourceDef[] {
  return Object.values(RESOURCE_REGISTRY).filter(def => def.character === roleName);
}

// 向后兼容别名
export function getResourcesForCharacter(roleName: string): ResourceDef[] {
  return getRoleResources(roleName);
}

// 返回 unit 当前可见的资源(已激活/有值/未消耗)。
// 当前实现:forte 资源恒可见(只要有 unit.forte),layer/form 资源需 unit 上有对应运行时字段。
// Phase 5 暂只覆盖 forte + form,layer 待 stacks 运行时字段稳定后再补。
export function getVisibleResources(unit: any): ResourceDef[] {
  if (!unit || !unit.name) return [];
  const all = getRoleResources(unit.name);
  return all.filter(def => {
    if (def.id.startsWith('forte_')) return !!unit.forte;
    if (def.kind === 'form') return !!unit.activeForm;
    if (def.kind === 'layer') return (unit._stacks && unit._stacks[def.id]) || (unit as any)[def.id] > 0;
    return false;
  });
}

// 格式化资源当前值展示串。读 unit 运行时字段。
export function formatResourceValue(unit: any, resourceId: string): string {
  const def = RESOURCE_REGISTRY[resourceId];
  if (!def || !unit) return '';
  if (def.id.startsWith('forte_') && unit.forte) {
    const f = unit.forte;
    return `${f.current}/${f.max}${f.ready ? ' · 强化就绪' : ''}`;
  }
  if (def.kind === 'form') {
    return unit.activeForm ? '激活' : '未激活';
  }
  if (def.kind === 'layer') {
    const v = (unit._stacks && unit._stacks[def.id]) || (unit as any)[def.id] || 0;
    return `${v}/${def.cap ?? '?'}`;
  }
  return '';
}

// 资源 tooltip 结构化数据 · UI 层负责渲染。
// battle 层只产数据,不产 HTML/CSS,避免 var(--muted) 等主题变量渗入。
export interface ResourceTooltipData {
  name: string;
  kind: string;
  desc?: string;
  effectType?: string;
  effectMult?: number;
}

export function getResourceTooltip(resourceId: string): ResourceTooltipData | null {
  const def = RESOURCE_REGISTRY[resourceId];
  if (!def) return null;
  const data: ResourceTooltipData = { name: def.name, kind: def.kind };
  if (def.desc) data.desc = def.desc;
  if (def.effectType) {
    data.effectType = def.effectType;
    if (def.effectMult) data.effectMult = def.effectMult;
  }
  return data;
}

