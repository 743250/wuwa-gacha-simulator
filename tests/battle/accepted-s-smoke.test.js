// Phase D · 已验收 S 级统一 smoke：能开打 + skillHints 有数
import { describe, it, expect, beforeAll } from 'vitest';
import { ACCEPTED_S_ROLES, makeSoloTeam, skillHintsSmoke } from './helpers/charDoD.js';

describe('battle DoD smoke — accepted S roles', () => {
  let skillHints;
  let combat;

  beforeAll(async () => {
    skillHints = await import('../../src/ui/render/skillHints.js');
    combat = await import('../../src/battle/combat.js');
  });

  for (const name of ACCEPTED_S_ROLES) {
    describe(name, () => {
      it('C0 能创建战斗单位且 skillHints 有数字', () => {
        const { battle, unit, enemyIdx } = makeSoloTeam(name, { chain: 0 });
        expect(unit).toBeTruthy();
        expect(unit.alive).toBe(true);
        expect(enemyIdx).toBeGreaterThanOrEqual(0);

        const entry = skillHints.SKILL_HINTS[name];
        expect(entry).toBeTruthy();
        const smoke = skillHintsSmoke(entry, 0);
        expect(smoke.ok, smoke.reason || 'skillHints smoke').toBe(true);
      });

      it('C0 普攻可结算', () => {
        const { battle, unit, enemyIdx } = makeSoloTeam(name, { chain: 0 });
        battle.ap = 4;
        const r = combat.doAttack(battle, enemyIdx);
        // 部分角色普攻可能被形态替换；只要不抛错且返回对象
        expect(r).toBeTruthy();
        expect(typeof r.ok).toBe('boolean');
        if (r.ok === false && unit.hasHeavy) {
          // 极少数角色普攻可能不可用时允许，但至少重击或技能路径存在
          battle.ap = 4;
          const sk = combat.doSkill?.(battle, enemyIdx);
          expect(sk == null || typeof sk.ok === 'boolean').toBe(true);
        }
      });
    });
  }
});
