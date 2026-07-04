// 共鸣链单结构化目标类型 · Stage 7 框架
//
// 现状(2026-07-03):共鸣链数据在 4 处并写
//   1. src/battle/chainEffects.js  — 战斗 effect(数值版,84 角色 × 6 链)
//   2. src/data/seq.js             — 玩家文案(模拟器版,84 角色 × 6 链)
//   3. src/ui/render/skillHints.js — customLines(工厂版技能文案,部分角色)
//   4. src/ui/terms.js             — 术语高亮(CHAIN_TERM_PATTERNS)
//
// 问题:加/改一条链要碰 4 处,易失同步(CLAUDE.md 铁律 10 就是这个问题的补丁)。
//
// 目标:一个 ChainDef 包含 4 个消费面各自需要的数据,由 4 个渲染路径分别读取。
// 迁移是 codemod 工程(84 角色 × 4 处 = 数千行),分多会话推进。
//
// 当前文件**只定义类型**,不改任何现有数据。后续迁移按此结构聚合。

// ===== 类型定义 =====

/** 共鸣链战斗 effect 的标准类型(对应 chainEffects.js 现有 effect 字段) */
export type ChainEffectType =
  | 'atkUp' | 'crateUp' | 'cdmgUp' | 'elemDmg' | 'elemAllUp'
  | 'skillChargeFaster' | 'tongBian' | 'guanShi' | 'qiZheng' | 'mingDuan'
  | 'normalDmgUp' | 'skillDmgUp' | 'heavyDmgUp' | 'burstDmgUp'
  | 'pierceUp' | 'healUp' | 'energyRefund' | 'forteGain'
  | 'custom'; // 角色专属未归类的走 custom

/** 单条链的战斗 effect */
export interface ChainEffect {
  effect: ChainEffectType;
  value?: number;
  dur?: number;          // 持续回合
  stacks?: number;
  forteGain?: number;
  atkUp?: number;
  crate?: number;
  cdmg?: number;
  elem?: string;
  [key: string]: any;   // 角色专属字段开放
}

/** 单条链的玩家文案 */
export interface ChainText {
  name: string;          // 链名,如"丹心本如鉴"
  desc: string;          // 玩家看到的描述(模拟器版,带术语高亮 HTML)
}

/** 单条链的工厂版技能文案(skillHints customLines 用) */
export interface ChainFactoryLine {
  label: string;         // 显示标签,如"1 链"
  desc: string;          // 工厂版简述
  followUp?: string;     // 激活后的额外说明(N 链:效果 格式)
}

/** 单条链的术语高亮词 */
export interface ChainTerm {
  pattern: string;       // 正则或字面量
  termKey: string;       // 对应 TERM_DICT 的 key
}

/** 完整的一条共鸣链(6 链中的一个) */
export interface ChainDef {
  /** 链序号 1-6 */
  index: 1 | 2 | 3 | 4 | 5 | 6;
  /** 战斗 effect(数值版,chains.js 消费) */
  effect: ChainEffect;
  /** 玩家文案(seq.js 消费) */
  text: ChainText;
  /** 工厂版技能文案(skillHints customLines 消费,可选) */
  factoryLines?: ChainFactoryLine[];
  /** 术语高亮词(terms.js CHAIN_TERM_PATTERNS 消费,可选) */
  terms?: ChainTerm[];
}

/** 一个角色的完整 6 链定义 */
export interface CharacterChains {
  character: string;
  chains: [ChainDef, ChainDef, ChainDef, ChainDef, ChainDef, ChainDef];
}

// ===== 迁移状态追踪(供后续 codemod 用) =====

/**
 * 已迁到 ChainDef 单结构的角色清单。
 * 空数组 = 全部 84 角色还在 4 处并写状态。
 * 后续每会话迁一批,在这里加角色名,直到 84 全覆盖。
 */
export const MIGRATED_TO_CHAIN_DEF: string[] = [];

// ===== 消费方接口(供 4 个渲染路径未来切换时用) =====

/**
 * chainEffects.js 未来切换为:
 *   import { CharacterChains } from './types';
 *   export function getChainEffects(name: string): ChainEffect[][] {
 *     return (CHARACTERS[name]?.chains ?? []).map(c => [c.effect]);
 *   }
 *
 * seq.js 未来切换为:
 *   export function getChainText(name: string): ChainText[] {
 *     return (CHARACTERS[name]?.chains ?? []).map(c => c.text);
 *   }
 *
 * skillHints customLines 未来切换为读 factoryLines
 * terms.js CHAIN_TERM_PATTERNS 未来切换为读 terms
 */

export {};
