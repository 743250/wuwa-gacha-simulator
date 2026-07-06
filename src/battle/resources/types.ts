// 角色资源统一模型类型 · Stage 7 框架
//
// 现状(2026-07-05 Phase 4):5 种资源实现并存
//   · layer   — stacks.js 注册表(忌炎锐意 / 卡提希娅决意 / 长离离火)
//   · gauge   — forte.js FORTE 字典的 kind='gauge'(椿·蕊 / 赞妮焰光 / 忌炎破阵值 等)
//   · stacks  — forte.js FORTE 字典的 kind='stacks'(今汐韶光 / 珂莱塔晶体 等)
//   · state   — forte.js FORTE 字典的 kind='state'(菲比衍射形态 / 卡卡罗杀意)
//   · threshold — forte.js FORTE 字典的 kind='threshold'(嘉贝莉娜猎杀阈值)
//   · buff    — buffs[] 数组(守岸人星域 / 焰羽,散写未迁)
//   · form    — forms.js 注册表(卡提希娅芙露德莉斯 / 安可黑咩 / 菲比赦罪)
//   · side-effect layer — 角色文件散写(弗洛洛乐声/余响,带 buff 刷新副作用,未迁)
//
// Phase 4 做法:resources/index.ts 适配器把 forte.js FORTE + stacks.js STACK_DEFS +
//   forms.js FORM_DEFS 注册到 RESOURCE_REGISTRY。buff / side-effect 后续再迁。
//   现有消费者(forte.js / stacks.js / forms.js 的逻辑)不改,保持向后兼容。
//   RESOURCE_REGISTRY 作为统一视图供未来新代码使用。

// ===== 顶层资源类型 =====

export type ResourceKind = 'gauge' | 'layer' | 'buff' | 'form' | 'stacks' | 'state' | 'threshold';

export interface ResourceDefBase {
  /** 资源唯一 id,如 'jiyan_ruiyi' / 'chun_rui' / 'shorekeeper_starfield' */
  id: string;
  /** 资源名(玩家可见),如"锐意之势" / "红椿·蕊" / "星域" */
  name: string;
  /** 资源类型 */
  kind: ResourceKind;
  /** 上限(0 表示无上限,gauge 类常用) */
  cap?: number | ((unit: any) => number);
  /** 角色名(归属) */
  character?: string;
  /** UI 渲染回调(返回 JSX 或 HTML 字符串) */
  render?: (unit: any) => any;
  // ===== forte.js 字段(Phase 4 适配,gauge/stacks/state/threshold 共享) =====
  /** forte.js 的 max 字段(= cap) */
  max?: number;
  gainPerNormal?: number;
  gainPerSkill?: number;
  gainPerBurst?: number;
  gainPerHeavy?: number;
  effectType?: string;
  effectMult?: number;
  desc?: string;
  /** 兜底:角色专属字段 */
  [key: string]: any;
}

// ===== 子类型 =====

/** layer 型:离散层数,有衰减 */
export interface LayerResourceDef extends ResourceDefBase {
  kind: 'layer';
  cap: number;
  /** 衰减间隔(回合),0 = 不衰减 */
  decayCooldown?: number;
  /** 加层时是否刷新衰减计时 */
  resetDecayOnGain?: boolean;
  onGain?: (unit: any, ...args: any[]) => void;
  onConsume?: (unit: any, ...args: any[]) => void;
  onDecay?: (unit: any) => void;
  onExhaust?: (unit: any) => void;
}

/** gauge 型:0-cap 连续值,无衰减 */
export interface GaugeResourceDef extends ResourceDefBase {
  kind: 'gauge';
  cap: number;
  /** 满 gauge 触发 */
  onFull?: (unit: any) => void;
  /** 消费值 */
  onConsume?: (unit: any, n: number) => void;
}

/** buff 型:挂在 unit.buffs[] 数组,有 duration */
export interface BuffResourceDef extends ResourceDefBase {
  kind: 'buff';
  /** buff type 键,如 'starfield' / 'flame_feather' */
  buffType: string;
  /** 默认持续回合 */
  defaultDuration?: number;
  /** 是否全队 buff */
  teamWide?: boolean;
}

/** form 型:形态切换,有进/退 hook */
export interface FormResourceDef extends ResourceDefBase {
  kind: 'form';
  /** 切人时是否保留(carryOnSwitch) */
  carryOnSwitch?: boolean;
  /** 进入形态 hook */
  onEnter?: (unit: any, ...args: any[]) => void;
  /** 退出形态 hook */
  onExit?: (unit: any, ...args: any[]) => void;
  /** 进入时显示名覆写 */
  enterName?: string | ((unit: any, battle: any) => string);
}

/** forte 型:forte.js FORTE 字典的 stacks/state/threshold kind */
export interface ForteResourceDef extends ResourceDefBase {
  kind: 'stacks' | 'state' | 'threshold';
  max: number;
}

export type ResourceDef =
  | LayerResourceDef
  | GaugeResourceDef
  | BuffResourceDef
  | FormResourceDef
  | ForteResourceDef;

// ===== 注册表 =====

/**
 * 资源注册表。Phase 4 适配器(resources/index.ts)启动时把
 * forte.js FORTE + stacks.js STACK_DEFS + forms.js FORM_DEFS 注册到这里。
 */
export const RESOURCE_REGISTRY: Record<string, ResourceDef> = {};

export function registerResource(def: ResourceDef): void {
  RESOURCE_REGISTRY[def.id] = def;
}

export function getResource(id: string): ResourceDef | undefined {
  return RESOURCE_REGISTRY[id];
}

// ===== 迁移状态追踪 =====
// MIGRATED_RESOURCES 已移到 src/battle/resources/index.ts(运行时从 RESOURCE_REGISTRY 派生)

export {};
