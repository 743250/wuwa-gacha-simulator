// 资源统一注册表 · Phase 4 适配器
//
// 把 forte.js FORTE + stacks.js STACK_DEFS + forms.js FORM_DEFS 适配注册到 RESOURCE_REGISTRY。
// 现有消费者(forte.js / stacks.js / forms.js 的逻辑)不改,保持向后兼容。
// RESOURCE_REGISTRY 作为统一视图供未来新代码使用(如 UI 一次性列出角色所有资源)。
//
// 副作用:本模块被 import 时立即跑适配器。需在 src/main.js 顶部 side-effect import。
import { FORTE } from '../forte.js';
import { STACK_DEFS } from '../stacks.js';
import { FORM_DEFS } from '../forms.js';
import { RESOURCE_REGISTRY, registerResource, type ResourceDef } from './types';

// 1. forte.js FORTE → RESOURCE_REGISTRY
//    id = `forte_${roleName}`,kind 沿用 FORTE 的 kind('gauge'|'stacks'|'state'|'threshold')
for (const [roleName, def] of Object.entries(FORTE)) {
  const id = `forte_${roleName}`;
  const resourceDef: ResourceDef = {
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
  };
  registerResource(resourceDef);
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

// 迁移状态追踪(从 RESOURCE_REGISTRY 派生)
export const MIGRATED_RESOURCES: string[] = Object.keys(RESOURCE_REGISTRY);

// 查询 API:返回某角色的所有资源定义
export function getResourcesForCharacter(roleName: string): ResourceDef[] {
  return Object.values(RESOURCE_REGISTRY).filter(def => def.character === roleName);
}
