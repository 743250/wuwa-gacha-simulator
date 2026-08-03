// 战斗数值完整性测试 · 防 NaN/undefined 回归
//
// 背景：玩家反馈「弗洛洛血量有时候变 NaN」「长离上场 buff 变 undefined」。
// 根因分类：
//   1. buff/debuff 缺 value 字段 → damage.js / chains.js / turnEnd 累加出 NaN
//   2. 角色 collectBadges 返回字符串而非徽章对象 → UI 渲染 undefined
// 本套件守卫：入战 / 多轮战斗 / buff 渲染全链路数值完整。
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { S } from '../../src/state.js';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';
import { ENEMIES } from '../../src/battle/enemies.js';
import { collectUnitBadges, collectEnemyBadges } from '../../src/ui/battleRenderers/buffRenderers.js';

const ROOT = resolve(__dirname, '../../src/battle/characters');

const ALL_ROLES = () => readdirSync(ROOT)
  .filter(f => f.endsWith('.js') && f !== 'index.js')
  .map(f => f.replace(/\.js$/, ''));

const NUMERIC = /^[+-]?\d+(\.\d+)?$/;

function isNaNValue(v) {
  return typeof v === 'number' && (Number.isNaN(v) || !Number.isFinite(v));
}

describe('battle numeric integrity — 数值完整性（防 NaN）', () => {
  let combat;
  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
  });

  beforeEach(() => {
    resetState({
      team: ['弗洛洛', '守岸人', '安可'],
      roles: {
        '弗洛洛': { level: 90, chain: 6, equipWeapon: '往日深渊的圆舞曲' },
        '守岸人': { level: 90, chain: 6, equipWeapon: '星序协响' },
        '安可': { level: 90, chain: 6, equipWeapon: '漪澜浮录' },
      },
    });
  });

  it('入战所有单位 hp/atk/hpMax 非 NaN', () => {
    const battle = quickBattle();
    for (const u of battle.team) {
      expect(isNaNValue(u.hp), `${u.name} hp=${u.hp}`).toBe(false);
      expect(isNaNValue(u.hpMax), `${u.name} hpMax=${u.hpMax}`).toBe(false);
      expect(isNaNValue(u.atk), `${u.name} atk=${u.atk}`).toBe(false);
    }
  });

  it('多轮普攻/技能/重击/解放 + endTurn 后 hp 非 NaN', () => {
    const battle = quickBattle();
    for (let i = 0; i < 3; i++) {
      combat.doAttack(battle, firstEnemy(battle));
      combat.doSkill(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      combat.endTurn(battle);
    }
    for (const u of battle.team) {
      expect(isNaNValue(u.hp), `${u.name} 轮后 hp=${u.hp}`).toBe(false);
      expect(isNaNValue(u.atk), `${u.name} 轮后 atk=${u.atk}`).toBe(false);
    }
  });

  it('战斗中所有 buff/debuff 都有数值型 value（NaN 根因守卫）', () => {
    const battle = quickBattle();
    for (let i = 0; i < 3; i++) {
      combat.doAttack(battle, firstEnemy(battle));
      combat.doSkill(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      combat.endTurn(battle);
    }
    const badBuffs = [];
    for (const u of battle.team) {
      for (const b of (u.buffs || [])) {
        if (b.value !== undefined && (typeof b.value !== 'number' || isNaNValue(b.value))) {
          badBuffs.push(`${u.name} buff ${b.type} value=${b.value}`);
        }
      }
    }
    expect(badBuffs).toEqual([]);
  });

  it('buff 徽章渲染无 undefined/NaN（长离 undefined 回归）', () => {
    const battle = quickBattle();
    for (let i = 0; i < 3; i++) {
      combat.doAttack(battle, firstEnemy(battle));
      combat.doSkill(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      combat.endTurn(battle);
    }
    for (const u of battle.team) {
      const badges = collectUnitBadges(u, battle, {});
      for (const b of badges) {
        expect(typeof b.label, `${u.name} badge label undefined`).toBe('string');
        expect(b.label).not.toBe('undefined');
        expect(b.label).not.toMatch(/NaN/);
      }
    }
  });

  it('世界 BOSS 战斗多轮 hp 非 NaN（玩家反馈场景）', () => {
    const bosses = Object.keys(ENEMIES).filter(n => ENEMIES[n].class === 'Overlord');
    // 抽查有代表性的世界 BOSS
    const sample = ['飞廉之猩', '朔雷之鳞', '燎照之骑', '哀声鸷', '无冠者', '无归的谬误'].filter(b => bosses.includes(b));
    for (const boss of sample) {
      const battle = quickBattle(null, [{ name: boss, scale: 1 }]);
      for (let i = 0; i < 6; i++) {
        combat.doAttack(battle, firstEnemy(battle));
        combat.doSkill(battle, firstEnemy(battle));
        combat.doHeavy(battle, firstEnemy(battle));
        combat.doBurst(battle);
        combat.endTurn(battle);
      }
      for (const u of battle.team) {
        expect(isNaNValue(u.hp), `${boss}: ${u.name} hp=${u.hp}`).toBe(false);
        expect(isNaNValue(u.atk), `${boss}: ${u.name} atk=${u.atk}`).toBe(false);
      }
    }
  });
});
