// 战斗结果判定 · 从 combat.js 拆出(Stage 4)
// 纯读取 battle 对象,无 side-effect,不依赖其他 combat/ 子模块。

// 评星(深渊/副本用)
//   1 星: 胜利
//   2 星: 胜利 + 回合数不超 turnLimit
//   3 星: 上面两项 + 队伍平均 HP 百分比 >= hpThreshold
export function evaluateStars(battle, turnLimit = 3, hpThreshold = 0.6) {
  if (battle.result !== 'win') return 0;
  let stars = 1;
  if (battle.turn <= turnLimit) stars++;
  const hpPct = battle.team.reduce((a, t) => a + t.hp / t.hpMax, 0) / battle.team.length;
  if (hpPct >= hpThreshold) stars++;
  return stars;
}

export function isWin(battle) { return battle.result === 'win'; }
export function isLose(battle) { return battle.result === 'lose'; }
