// 共鸣链战斗效果数据（纯数据，无逻辑）
// Phase 3: CHAIN_BATTLE_EFFECTS 已迁到 src/data/chains/registry.ts(ChainDef 单结构)
// Phase 4: FALLBACK_CHAIN 已删(registry.ts 覆盖全部 50 角色,兜底分支不可达)。
// 本文件只保留 FORTE_BOOST(6 链 forte 倍率加成),由 chains.js 导入使用。

export const FORTE_BOOST = {
  '忌炎': { atChain: 6, bonus: 0.5 },
  '吟霖': { atChain: 6, bonus: 0.4 },
  '今汐': { atChain: 6, bonus: 0.4 },
  '折枝': { atChain: 6, bonus: 0.4 },
  '相里要': { atChain: 6, bonus: 0.4 },
  // 椿 6 链酣梦 ×2.5 由 camellia.js 状态机控制，不走 FORTE_BOOST
  '珂莱塔': { atChain: 6, bonus: 0.5 },
  '洛可可': { atChain: 6, bonus: 0.3 },
  '菲比': { atChain: 6, bonus: 0.4 },
  '布兰特': { atChain: 6, bonus: 0.4 },
  '坎特蕾拉': { atChain: 6, bonus: 0.5 },
  '维里奈': { atChain: 6, bonus: 0.4 },
  '安可': { atChain: 6, bonus: 0.4 },
  '凌阳': { atChain: 6, bonus: 0.4 },
  '鉴心': { atChain: 6, bonus: 0.3 },
  '卡提希娅': { atChain: 6, bonus: 0.5 },
  '嘉贝莉娜': { atChain: 6, bonus: 0.5 },
  '卡卡罗': { atChain: 6, bonus: 0.5 },
  // 赞妮 6 链重斩 ×1.4 由 zanyan.js 状态机控制（heavyDmg + 0.4），不走 FORTE_BOOST
  '夏空': { atChain: 6, bonus: 0.3 },
  '露帕': { atChain: 6, bonus: 0.4 },
  '弗洛洛': { atChain: 6, bonus: 0.5 },
  '奥古斯塔': { atChain: 6, bonus: 0.5 },
  '尤诺': { atChain: 6, bonus: 0.4 },
  '仇远': { atChain: 6, bonus: 0.5 },
  '千咲': { atChain: 6, bonus: 0.4 },
  '琳奈': { atChain: 6, bonus: 0.4 },
  '莫宁': { atChain: 6, bonus: 0.4 },
  '爱弥斯': { atChain: 6, bonus: 0.5 },
  '陆·赫斯': { atChain: 6, bonus: 0.3 },
  '西格莉卡': { atChain: 6, bonus: 0.4 },
  '绯雪': { atChain: 6, bonus: 0.4 },
  '达妮娅': { atChain: 6, bonus: 0.4 },
  '露西': { atChain: 6, bonus: 0.4 },
  '丽贝卡': { atChain: 6, bonus: 0.3 },
  '洛瑟菈': { atChain: 6, bonus: 0.3 }
};
