// P0 tests for battle/combat.js — AP turn-based combat engine
import { describe, it, expect, beforeEach } from 'vitest';
import { state0, S } from '../../src/state.js';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/combat', () => {
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
        '安可': { level: 90, chain: 0, equipWeapon: '焰光裁定' },
      },
    });
  });

  // ===== getCombatTeamNames() =====
  describe('getCombatTeamNames()', () => {
    it('returns valid team members from state', () => {
      const names = combat.getCombatTeamNames();
      expect(names.length).toBeGreaterThanOrEqual(1);
      expect(names).toContain('忌炎');
    });

    it('filters out unowned roles', () => {
      S.team = ['忌炎', '不存在的角色', '安可'];
      const names = combat.getCombatTeamNames();
      expect(names.length).toBe(2);
      expect(names).not.toContain('不存在的角色');
    });

    it('filters duplicates', () => {
      S.team = ['忌炎', '忌炎', '安可'];
      const names = combat.getCombatTeamNames();
      expect(names.length).toBe(2);
    });
  });

  // ===== createBattle() =====
  describe('createBattle()', () => {
    it('creates a valid battle structure', () => {
      const battle = quickBattle(null, [{ name: '幼狼', scale: 1 }]);
      expect(battle).toBeTruthy();
      expect(battle.turn).toBe(1);
      expect(battle.ap).toBe(4);
      expect(battle.apMax).toBe(4);
      expect(battle.team.length).toBeGreaterThanOrEqual(1);
      expect(battle.enemies.length).toBe(1);
      expect(battle.finished).toBe(false);
      expect(battle.result).toBeNull();
    });

    it('returns null for empty team', () => {
      S.team = [null, null, null];
      const battle = combat.createBattle([], ['幼狼']);
      expect(battle).toBeNull();
    });

    it('returns null for empty enemies', () => {
      const battle = combat.createBattle(['忌炎'], []);
      expect(battle).toBeNull();
    });
  });

  // ===== doAttack() — normal attack =====
  describe('doAttack()', () => {
    it('consumes 1 AP and deals damage', () => {
      const battle = quickBattle();
      const targetIdx = firstEnemy(battle);
      const result = combat.doAttack(battle, targetIdx);

      expect(result.ok).toBe(true);
      expect(battle.ap).toBe(3); // 4 - 1
      expect(battle.log.length).toBeGreaterThan(1);
      // Check that a damage log entry exists
      const atkLog = battle.log.find(l => l.type === 'attack');
      expect(atkLog).toBeTruthy();
      expect(atkLog.dmg).toBeGreaterThan(0);
    });

    it('rejects when AP insufficient', () => {
      const battle = quickBattle();
      battle.ap = 0;
      const result = combat.doAttack(battle, firstEnemy(battle));
      expect(result.ok).toBe(false);
      expect(result.err).toContain('AP');
    });

    it('generates energy on hit', () => {
      const battle = quickBattle();
      const self = battle.team[battle.active];
      const before = self.energy;
      combat.doAttack(battle, firstEnemy(battle));
      expect(self.energy).toBeGreaterThan(before);
    });
  });

  // ===== doSkill() — resonance skill =====
  describe('doSkill()', () => {
    it('consumes 1 AP and sets 3-turn CD', () => {
      const battle = quickBattle();
      const self = battle.team[battle.active];
      const result = combat.doSkill(battle, firstEnemy(battle));

      expect(result.ok).toBe(true);
      expect(battle.ap).toBe(3);
      expect(self.cd.skill).toBeGreaterThanOrEqual(2); // 3 - skillCdReduce
      expect(battle.log.some(l => l.type === 'skill')).toBe(true);
    });

    it('rejects when skill on cooldown', () => {
      const battle = quickBattle();
      battle.team[battle.active].cd.skill = 2;
      const result = combat.doSkill(battle, firstEnemy(battle));
      expect(result.ok).toBe(false);
      expect(result.err).toContain('冷却');
    });
  });

  // ===== doBurst() — resonance liberation =====
  describe('doBurst()', () => {
    it('consumes 3 AP and full energy for AOE', () => {
      const battle = quickBattle(null, [
        { name: '幼狼', scale: 1 },
        { name: '幼狼', scale: 1 },
      ]);
      const self = battle.team[battle.active];
      self.energy = self.energyMax; // fill energy

      const result = combat.doBurst(battle);
      expect(result.ok).toBe(true);
      expect(battle.ap).toBe(1); // 4 - 3
      expect(self.energy).toBe(0);
      // Should have hit both enemies
      const burstLog = battle.log.find(l => l.type === 'burst');
      expect(burstLog).toBeTruthy();
      expect(burstLog.results.length).toBeGreaterThanOrEqual(1);
    });

    it('rejects when energy insufficient', () => {
      const battle = quickBattle();
      battle.team[battle.active].energy = 0;
      const result = combat.doBurst(battle);
      expect(result.ok).toBe(false);
      expect(result.err).toContain('能量');
    });

    it('rejects when AP insufficient', () => {
      const battle = quickBattle();
      battle.ap = 2;
      battle.team[battle.active].energy = battle.team[battle.active].energyMax;
      const result = combat.doBurst(battle);
      expect(result.ok).toBe(false);
      expect(result.err).toContain('AP');
    });
  });

  // ===== doSwitch() — character switch =====
  describe('doSwitch()', () => {
    it('switches active character and deals variation damage', () => {
      const battle = quickBattle();
      const prevActive = battle.active;

      const result = combat.doSwitch(battle, (prevActive + 1) % battle.team.length);
      expect(result.ok).toBe(true);
      expect(battle.active).not.toBe(prevActive);
      expect(battle.switchUsedThisTurn).toBe(true);
    });

    it('rejects switching to same character', () => {
      const battle = quickBattle();
      const result = combat.doSwitch(battle, battle.active);
      expect(result.ok).toBe(false);
    });

    it('rejects second switch in same turn', () => {
      const battle = quickBattle();
      combat.doSwitch(battle, (battle.active + 1) % battle.team.length);
      const result = combat.doSwitch(battle, (battle.active + 1) % battle.team.length);
      expect(result.ok).toBe(false);
      expect(result.err).toContain('已经切换');
    });
  });

  // ===== doHeavy() — heavy attack =====
  describe('doHeavy()', () => {
    it('works for roles with hasHeavy=true', () => {
      // 忌炎 should have heavy attack
      const battle = quickBattle();
      // Make sure active is 忌炎
      while (battle.team[battle.active].name !== '忌炎') {
        combat.doSwitch(battle, (battle.active + 1) % battle.team.length);
        // Reset switch flag
        battle.switchUsedThisTurn = false;
        battle.ap = 4;
      }

      const self = battle.team[battle.active];
      if (self.hasHeavy) {
        const result = combat.doHeavy(battle, firstEnemy(battle));
        expect(result.ok).toBe(true);
        expect(battle.ap).toBe(2); // 4 - 2
        expect(self.cd.heavy).toBe(1);
      }
    });

    it('rejects for roles without hasHeavy', () => {
      const battle = quickBattle();
      // Find a team member without heavy
      const noHeavyIdx = battle.team.findIndex(t => !t.hasHeavy);
      if (noHeavyIdx >= 0 && noHeavyIdx !== battle.active) {
        combat.doSwitch(battle, noHeavyIdx);
        battle.switchUsedThisTurn = false;
        battle.ap = 4;
      }

      const self = battle.team[battle.active];
      if (!self.hasHeavy) {
        const result = combat.doHeavy(battle, firstEnemy(battle));
        expect(result.ok).toBe(false);
        expect(result.err).toContain('没有重击');
      }
    });
  });

  // ===== endTurn() — enemy phase =====
  describe('endTurn()', () => {
    it('advances turn counter', () => {
      const battle = quickBattle();
      combat.endTurn(battle);
      expect(battle.turn).toBeGreaterThanOrEqual(2);
    });

    it('resets AP to max', () => {
      const battle = quickBattle();
      combat.doAttack(battle, firstEnemy(battle));
      expect(battle.ap).toBe(3);
      combat.endTurn(battle);
      expect(battle.ap).toBe(battle.apMax);
    });

    it('resets switch flag', () => {
      const battle = quickBattle();
      combat.doSwitch(battle, (battle.active + 1) % battle.team.length);
      expect(battle.switchUsedThisTurn).toBe(true);
      combat.endTurn(battle);
      expect(battle.switchUsedThisTurn).toBe(false);
    });

    it('ticks down skill cooldowns', () => {
      const battle = quickBattle();
      const self = battle.team[battle.active];
      combat.doSkill(battle, firstEnemy(battle));
      const cdBefore = self.cd.skill;
      expect(cdBefore).toBeGreaterThan(0);
      combat.endTurn(battle);
      // CD should decrease by 1
      // (but active might have switched, so check the original unit)
      const origUnit = battle.team.find(t => t.name === self.name);
      expect(origUnit.cd.skill).toBeLessThan(cdBefore);
    });
  });

  // ===== Win/Lose detection =====
  describe('battle resolution', () => {
    it('detects win when all enemies dead', () => {
      const battle = quickBattle();
      // Kill the enemy directly via damage
      const target = battle.enemies[firstEnemy(battle)];
      target.hp = 1; // leave 1 HP so it's still a valid target
      combat.doAttack(battle, firstEnemy(battle));
      // Attack should kill it and trigger win check
      expect(battle.finished).toBe(true);
      expect(battle.result).toBe('win');
    });

    it('detects lose when all team dead', () => {
      const battle = quickBattle();
      // Kill all team members
      battle.team.forEach(t => { t.hp = 0; t.alive = false; });
      combat.endTurn(battle);
      expect(battle.finished).toBe(true);
      expect(battle.result).toBe('lose');
    });
  });

  // ===== evaluateStars() =====
  describe('evaluateStars()', () => {
    it('returns 0 for lost battle', () => {
      const battle = quickBattle();
      battle.result = 'lose';
      expect(combat.evaluateStars(battle)).toBe(0);
    });

    it('returns at least 1 for won battle', () => {
      const battle = quickBattle();
      battle.result = 'win';
      battle.turn = 10;
      const stars = combat.evaluateStars(battle, 15, 0.7);
      expect(stars).toBeGreaterThanOrEqual(1);
    });
  });
});
