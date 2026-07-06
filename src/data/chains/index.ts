// 共鸣链 ChainDef 注册表 · Phase 3
// 数据由 scripts/generate-chain-defs.mjs 从 chainEffects.js + seq.js 自动生成。
// 改 chainEffects / seq 后重跑 codemod,本文件不要手改。
import type { CharacterChains } from './types';
import { REGISTRY } from './registry';

export const CHAIN_REGISTRY: Record<string, CharacterChains> = REGISTRY;

export function getChainDef(name: string): CharacterChains | undefined {
  return CHAIN_REGISTRY[name];
}
