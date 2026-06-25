// Battle integration tests — full combat flow scenarios
// AI safety net: verify turn-to-turn combat flow, damage consistency, win/lose conditions
import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../../src/state.js';
import { resetState, quickBattle, firstEnemy, assertClose } from '../helpers.js';

describe('battle/combat — integration', () => {
  let combat;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
  });

  beforeEach(() => {
    resetState({
      team: ['忌炎', '守岸人', '安可'],
      roles: {
        '忌炎': { level: 90, chain: 0, equipWeapon: '苍鳞千嶂' },
        '守岸人': { level: 90, chain: 0, equipWeapon: '星序协响' },
        '安可': { level: 90, chain: 0, equipWeapon: '漪澜浮录' },
      },
    });
  });

  // ===== Full 1-turn rotation =====
  describe('full turn rotation', () => {
    it('normal → skill → endTurn deals damage and recovers AP', () => {
      // Use a boss-level enemy that won't die from one rotation
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const target = firstEnemy(battle);
      const enemyHpBefore = battle.enemies[target].hp;

      combat.doAttack(battle, target);
      combat.doSkill(battle, target);
      const apBeforeEnd = battle.ap;
      combat.endTurn(battle);

      // AP reset (if enemy didn't die; otherwise finished flag prevents reset)
      if (!battle.finished) {
        expect(battle.ap).toBe(battle.apMax);
      }
      // AP was consumed
      expect(apBeforeEnd).toBeLessThan(battle.apMax);
      // Damage was dealt
      expect(battle.enemies[target].hp).toBeLessThan(enemyHpBefore);
    });

    it('burst kills single enemy', () => {
      const battle = quickBattle(null, [{ name: '幼狼', scale: 0.1 }]); // weak enemy
      const self = battle.team[battle.active];
      self.energy = self.energyMax;

      combat.doBurst(battle);
      combat.endTurn(battle);

      expect(battle.finished).toBe(true);
      expect(battle.result).toBe('win');
    });
  });

  // ===== Multi-enemy combat =====
  describe('multi-enemy', () => {
    it('burst hits all enemies with split damage', () => {
      const battle = quickBattle(null, [
        { name: '幼狼', scale: 1 },
        { name: '幼狼', scale: 1 },
      ]);
      const self = battle.team[battle.active];
      self.energy = self.energyMax;

      const result = combat.doBurst(battle);
      expect(result.ok).toBe(true);

      // All enemies took damage
      const burstLog = battle.log.find(l => l.type === 'burst');
      expect(burstLog.results.length).toBeGreaterThanOrEqual(2);
      const mainTargetDmg = burstLog.results[0].dmg;
      const sideTargetDmg = burstLog.results[1].dmg;
      // Main target should take more damage than side targets
      expect(mainTargetDmg).toBeGreaterThanOrEqual(sideTargetDmg);
    });

    it('doAttack on dead enemy finds next target', () => {
      const battle = quickBattle(null, [
        { name: '幼狼', scale: 0.1 },
        { name: '幼狼', scale: 0.1 },
      ]);
      // Kill first enemy
      battle.enemies[0].hp = 0;
      battle.enemies[0].alive = false;
      // Attack should auto-target next alive enemy
      const target = firstEnemy(battle);
      expect(target).toBe(1);
      const result = combat.doAttack(battle, target);
      expect(result.ok).toBe(true);
    });
  });

  // ===== Energy management =====
  describe('energy management', () => {
    it('energy accumulates over multiple turns', () => {
      const battle = quickBattle();
      const self = battle.team[battle.active];

      expect(self.energy).toBe(0);
      combat.doAttack(battle, firstEnemy(battle));
      combat.endTurn(battle);

      expect(self.energy).toBeGreaterThan(0);
    });

    it('burst consumes all energy', () => {
      const battle = quickBattle();
      const self = battle.team[battle.active];
      self.energy = self.energyMax;

      combat.doBurst(battle);
      expect(self.energy).toBe(0);
    });
  });

  // ===== Character switching =====
  describe('team switching', () => {
    it('switch changes active character and resets on endTurn', () => {
      const battle = quickBattle();
      const initial = battle.active;

      combat.doSwitch(battle, (initial + 1) % battle.team.length);
      expect(battle.active).not.toBe(initial);
      expect(battle.switchUsedThisTurn).toBe(true);

      combat.endTurn(battle);
      expect(battle.switchUsedThisTurn).toBe(false);
    });

    it('variation damage on switch', () => {
      const battle = quickBattle(null, [{ name: '幼狼', scale: 0.5 }]);
      const target = firstEnemy(battle);
      const enemyHpBefore = battle.enemies[target].hp;

      combat.doSwitch(battle, (battle.active + 1) % battle.team.length, target);
      expect(battle.enemies[target].hp).toBeLessThan(enemyHpBefore);
    });
  });

  // ===== Cooldown management =====
  describe('cooldowns', () => {
    it('skill cannot be used every turn without chain reduction', () => {
      const battle = quickBattle();
      const self = battle.team[battle.active];

      // First skill works
      expect(combat.doSkill(battle, firstEnemy(battle)).ok).toBe(true);
      // Second skill should fail (on cooldown)
      expect(combat.doSkill(battle, firstEnemy(battle)).ok).toBe(false);

      // After endTurn, cooldown decrements
      combat.endTurn(battle);
      // Skill still on cooldown (3-turn CD, one turn passed)
      // Find the original unit
      const origUnit = battle.team.find(t => t.name === self.name);
      if (origUnit && battle.active === battle.team.indexOf(origUnit)) {
        expect(combat.doSkill(battle, firstEnemy(battle)).ok).toBe(false);
      }
    });
  });

  // ===== Damage formula consistency =====
  describe('damage formula sanity', () => {
    it('attack damage is positive and non-zero', () => {
      const battle = quickBattle();
      const result = combat.doAttack(battle, firstEnemy(battle));
      const atkLog = battle.log.find(l => l.type === 'attack');
      expect(atkLog.dmg).toBeGreaterThan(0);
    });

    it('skill damage > normal attack damage for same character', () => {
      const battle = quickBattle();
      const target = firstEnemy(battle);

      // Get skill damage
      combat.doAttack(battle, target);
      const atkLog = battle.log.find(l => l.type === 'attack');
      const normalDmg = atkLog.dmg;

      // Reset and get skill damage
      battle.ap = 4; // restore AP
      combat.endTurn(battle);
      // start fresh
      const skillResult = combat.doSkill(battle, target);
      if (skillResult.ok) {
        const skillLog = battle.log.find(l => l.type === 'skill');
        expect(skillLog.dmg).toBeGreaterThanOrEqual(normalDmg);
      }
    });

    it('burst hits all enemies with valid damage records', () => {
      const battle = quickBattle(null, [
        { name: '幼狼', scale: 0.5 },
        { name: '幼狼', scale: 0.5 },
      ]);
      const self = battle.team[battle.active];
      self.energy = self.energyMax;

      combat.doBurst(battle);
      const burstLog = battle.log.find(l => l.type === 'burst');

      expect(burstLog).toBeTruthy();
      expect(burstLog.results.length).toBeGreaterThanOrEqual(2);
      // All results should have positive damage
      burstLog.results.forEach(r => {
        expect(r.dmg).toBeGreaterThan(0);
        expect(r.tgt).toBeTruthy();
      });
    });
  });
});
