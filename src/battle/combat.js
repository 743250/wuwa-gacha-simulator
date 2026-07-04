// 战斗引擎 · re-export 门面
//
// Stage 4 拆分后 combat.js 只做一件事:把所有 combat/ 子模块的 export 集中透出,
// 让外部调用方(daily/abyss/wastes/ui/battle/tests) 保持原来的 `from './combat.js'` 契约不变。
//
// 内部结构(见 combat/):
//   · setup.js    - createBattle / startEncounter / getCombatTeamNames
//   · damage.js   - calcDamage / dealDamage / summon 相关 + setCurrentBattle
//   · helpers.js  - resolveActionCost / gainConcerto / reduceVibration / finishIfBattleEnded 等
//   · enemyAI.js  - enemyAttack / BOSS 机制 handlers
//   · actions.js  - canAttack/canSkill/canHeavy/canBurst + doAttack/doSkill/doHeavy/doBurst/doDebris/doSwitch
//   · turnEnd.js  - endTurn(敌方回合 + 清理 + 回合切换)
//   · results.js  - evaluateStars / isWin / isLose

export { getCombatTeamNames, createBattle, startEncounter } from './combat/setup.js';
export {
  calcDamage, dealDamage,
  setCurrentBattle, getCurrentBattle,
  damageSummon, spawnSummon, removeSummon, tickSummons, tickSummonsDuration,
} from './combat/damage.js';
export {
  canAttack, canSkill, canHeavy, canBurst,
  doAttack, doSkill, doHeavy, doBurst, doDebris, doSwitch,
} from './combat/actions.js';
export { endTurn } from './combat/turnEnd.js';
export { evaluateStars, isWin, isLose } from './combat/results.js';
