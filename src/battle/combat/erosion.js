// 风蚀效应兼容层 —— re-export effects.js 的 wrapper（签名与 addEffect 不同，不能直接 re-export addEffect）

export {
  addErosion,
  getErosionStacks,
  consumeAllErosion,
  doubleErosionStacks,
  erosionTick,
  getErosionEntry,
  erosionDebuffBonus,
  EROSION_PER_STACK,
  EROSION_DURATION,
  EROSION_MAX_STACKS
} from './effects.js';
