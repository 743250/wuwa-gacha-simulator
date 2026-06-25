import { ACTION_COST, ACTION_MULTIPLIER, VIBRATION_DAMAGE, STAR_CRITERIA, ABYSS_TEMPERATURE_TABLE } from '../src/battle/balance.js';

console.log('=== Battle Baselines ===');
console.table({
  actionCost: ACTION_COST,
  multiplier: ACTION_MULTIPLIER,
  vibration: VIBRATION_DAMAGE
});

console.log('\n=== Star Criteria ===');
console.table(STAR_CRITERIA);

console.log('\n=== Abyss Temperature ===');
console.table(ABYSS_TEMPERATURE_TABLE.map(x => ({ version: x.v, hp: x.hp, atk: x.atk, def: x.def, label: x.label })));
