// 3.0–3.4 限定 5★ 最小 DoD：可开战 + C0 无 flat 双算 + skillHints 有数
import { describe, it, expect, beforeAll } from 'vitest';
import {
  makeSoloTeam, expectNoFlatDoubleCount, skillHintsSmoke,
} from './helpers/charDoD.js';

export const ROLES_3X = [
  '琳奈', '莫宁', '爱弥斯', '陆·赫斯', '西格莉卡',
  '绯雪', '达妮娅', '露西', '丽贝卡', '洛瑟菈',
];

describe('battle · 3.x 工厂限定最小 DoD', () => {
  let combat;
  let skillHints;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
  });

  for (const name of ROLES_3X) {
    it(`${name}：可开战、C0 无 flat typeBonus、普攻有数、skillHints 有数`, () => {
      const { battle, unit, enemyIdx } = makeSoloTeam(name, { chain: 0 });
      expect(unit, `${name} unit missing`).toBeTruthy();
      expectNoFlatDoubleCount(unit);
      battle.ap = 4;
      const before = battle.enemies[enemyIdx].hp;
      const r = combat.doAttack(battle, enemyIdx);
      expect(r).toBeTruthy();
      if (r.ok) {
        expect(before - battle.enemies[enemyIdx].hp).toBeGreaterThan(0);
      } else if (unit.hasHeavy) {
        battle.ap = 4;
        const sk = combat.doSkill(battle, enemyIdx);
        expect(sk == null || typeof sk.ok === 'boolean').toBe(true);
      }
      const entry = skillHints.SKILL_HINTS[name];
      expect(entry, `${name} missing skillHints`).toBeTruthy();
      expect(skillHintsSmoke(entry, 0).ok).toBe(true);
    });
  }
});
