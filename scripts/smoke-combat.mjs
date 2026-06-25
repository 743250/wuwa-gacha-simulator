globalThis.window = { __render() {} };
globalThis.document = { getElementById() { return null; } };

const { state0, S } = await import('../src/state.js');
const { addRole, addWeapon } = await import('../src/gacha/core.js');
const { createBattle, doAttack, doSkill, doHeavy, doBurst, doSwitch, endTurn, getCombatTeamNames } = await import('../src/battle/combat.js');
const { startAbyssFloor } = await import('../src/daily/abyss.js');
const { DUNGEONS, flattenEnemies } = await import('../src/battle/dungeon.js');

function reset() {
  Object.assign(S, state0());
  S.astrite = 0;
  S.radiant = 0;
  S.forging = 0;
  S.lustrous = 0;
  S.team = ['忌炎', '守岸人', '安可'];
  addRole('忌炎', 5);
  addRole('守岸人', 5);
  addRole('安可', 5);
  addWeapon('苍鳞千嶂', 5);
  addWeapon('星序协响', 5);
  addWeapon('焰光裁定', 5);
  S.roles['忌炎'].level = 90;
  S.roles['守岸人'].level = 90;
  S.roles['安可'].level = 90;
  S.roles['忌炎'].chain = 6;
  S.roles['守岸人'].chain = 1;
  S.roles['安可'].chain = 0;
  S.roles['忌炎'].equipWeapon = '苍鳞千嶂';
  S.roles['守岸人'].equipWeapon = '星序协响';
  S.roles['安可'].equipWeapon = '焰光裁定';
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function firstAliveEnemy(battle) {
  return battle.enemies.findIndex(e => e.alive);
}

function runAction(label, fn) {
  const result = fn();
  assert(result && result.ok !== false, `${label} failed: ${result?.err || 'unknown'}`);
}

reset();
assert(getCombatTeamNames().length === 3, 'expected 3 valid combat team members');

const dungeon = DUNGEONS.find(d => d.id === 'sim_exp_1');
assert(dungeon, 'missing smoke dungeon sim_exp_1');
const battle = createBattle(getCombatTeamNames(), flattenEnemies(dungeon.enemies), { enemyScale: dungeon.enemyScale || 1 });
assert(battle && battle.team.length === 3 && battle.enemies.length > 0, 'failed to create dungeon battle');

runAction('normal attack', () => doAttack(battle, firstAliveEnemy(battle)));
runAction('skill', () => doSkill(battle, firstAliveEnemy(battle)));
runAction('switch', () => doSwitch(battle, 2));
runAction('heavy', () => doHeavy(battle, firstAliveEnemy(battle)));

battle.ap = battle.apMax;
const active = battle.team[battle.active];
active.energy = active.energyMax;
runAction('burst', () => doBurst(battle));

endTurn(battle);
assert(battle.turn >= 2 || battle.finished, 'endTurn did not advance or finish battle');

const abyss = startAbyssFloor('hl1');
assert(abyss && abyss._abyssFloor === 'hl1', 'failed to create abyss battle');

console.log('[smoke] combat/dungeon/abyss checks passed');
