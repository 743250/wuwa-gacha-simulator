// Shared test utilities — construct minimal state, teams, battles.
import { state0, S } from '../src/state.js';
import { addRole, addWeapon } from '../src/gacha/core.js';
import { createBattle } from '../src/battle/combat.js';

/**
 * Reset S to default state, optionally set team and resources.
 * @param {object} overrides
 * @param {string[]} [overrides.team] - role names for the 3-person team
 * @param {object} [overrides.roles] - { name: { level?, chain?, equipWeapon? } }
 */
export function resetState(overrides = {}) {
  Object.assign(S, state0());
  S.astrite = 0;
  S.radiant = 0;
  S.forging = 0;
  S.lustrous = 0;

  const team = overrides.team || ['忌炎', '守岸人', '安可'];
  S.team = team;

  for (const name of team) {
    if (!S.roles[name]) {
      addRole(name, 5);
      S.roles[name].level = 90;
      S.roles[name].chain = 0;
    }
  }

  if (overrides.roles) {
    for (const [name, cfg] of Object.entries(overrides.roles)) {
      if (!S.roles[name]) addRole(name, 5);
      if (cfg.level !== undefined) S.roles[name].level = cfg.level;
      if (cfg.chain !== undefined) S.roles[name].chain = cfg.chain;
      if (cfg.equipWeapon) S.roles[name].equipWeapon = cfg.equipWeapon;
      // auto-add weapon to S.weapons
      if (cfg.equipWeapon && !S.weapons[cfg.equipWeapon]) {
        addWeapon(cfg.equipWeapon, 5);
        S.weapons[cfg.equipWeapon].level = 90;
      }
    }
  }
}

/**
 * Create a battle with the given team names and enemy spec.
 * @param {string[]|null} [teamNames] - defaults to S.team
 * @param {Array<{name:string, scale?:number}>} enemies
 * @returns {object} battle state
 */
export function quickBattle(teamNames, enemies) {
  const tn = teamNames || S.team;
  const enemySpecs = enemies || [{ name: '幼狼', scale: 1 }];
  const enemyNames = [];
  const opts = { enemyScale: 1 };
  for (const e of enemySpecs) {
    if (typeof e === 'string') {
      enemyNames.push(e);
    } else {
      enemyNames.push(e.name);
      if (e.scale) opts.enemyScale = e.scale;
    }
  }
  return createBattle(tn, enemyNames, opts);
}

/**
 * Find index of first alive enemy.
 */
export function firstEnemy(battle) {
  return battle.enemies.findIndex(e => e.alive);
}

/**
 * Assert with a message.
 */
export function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

/**
 * Assert two numbers are approximately equal.
 */
export function assertClose(actual, expected, delta = 1, msg) {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(`${msg || 'assertClose failed'}: expected ${expected} ±${delta}, got ${actual}`);
  }
}
