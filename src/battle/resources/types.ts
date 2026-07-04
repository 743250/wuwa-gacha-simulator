// 角色资源统一模型类型 · Stage 7 框架
//
// 现状(2026-07-03):5 种资源实现并存
//   · layer   — stacks.js 注册表(忌炎锐意 / 卡提希娅决意 / 长离离火)
//   · gauge   — forte.current 散写(椿·蕊 0-100 / 赞妮焰光 0-100)
//   · buff    — buffs[] 数组(守岸人星域 / 焰羽)
//   · form    — forms.js 注册表(卡提希娅芙露德莉斯 / 安可黑咩 / 菲比赦罪)
//   · side-effect layer — 角色文件散写(弗洛洛乐声/余响,带 buff 刷新副作用)
//
// 问题:forms/stacks 注册表只覆盖 3/16 角色,其余散写;新角色不知道该用哪种。
//
// 目标:一个 ResourceDef 顶层类型,4 种 kind 各自子实现。stacks.js / forms.js 成为它的子实现。
// 迁移是逐角色工程,需要碰战斗逻辑,分多会话推进。
//
// 当前文件**只定义类型**,不改任何现有数据。

// ===== 顶层资源类型 =====

export type ResourceKind = 'gauge' | 'layer' | 'buff' | 'form';

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
  onGain?: (unit: any, n: number, before: number) => void;
  onConsume?: (unit: any, n: number) => void;
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
  onEnter?: (unit: any, battle: any, opts?: any) => void;
  /** 退出形态 hook */
  onExit?: (unit: any, battle: any) => void;
  /** 进入时显示名覆写 */
  enterName?: string | ((unit: any, battle: any) => string);
}

export type ResourceDef =
  | LayerResourceDef
  | GaugeResourceDef
  | BuffResourceDef
  | FormResourceDef;

// ===== 注册表(未来用) =====

/**
 * 资源注册表。未来 stacks.js / forms.js 都改成往这里注册,
 * 组件读 RESOURCE_REGISTRY 拿统一接口。
 * 当前为空,迁移时逐个加。
 */
export const RESOURCE_REGISTRY: Record<string, ResourceDef> = {};

export function registerResource(def: ResourceDef): void {
  RESOURCE_REGISTRY[def.id] = def;
}

export function getResource(id: string): ResourceDef | undefined {
  return RESOURCE_REGISTRY[id];
}

// ===== 迁移状态追踪 =====

/**
 * 已迁到 ResourceDef 单结构的资源 id 清单。
 * 空数组 = 全部还在散写状态。
 */
export const MIGRATED_RESOURCES: string[] = [];

export {};
