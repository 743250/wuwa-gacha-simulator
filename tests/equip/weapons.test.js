// Unit tests for equip/weapons.js (weapon DB + leveling books) + equip/actions.js (upgrade/equip/unequip/refine)
// + gacha/core.js addWeapon (spareRefine accumulation)
//
// TODO / observed behavior notes (no code changes made):
//   - weaponBookForLevel(targetLevel) returns Math.ceil(targetLevel * 1.5), e.g. 135 for Lv90.
//     This is NOT used by levelUpWeapon (which uses weaponToNext from stats.js), so it's a
//     separate cost curve that may be intended for a different system (e.g. crafting/breakthrough).
//     weaponToNext uses floor((lv+5)/25) with total ~154 books for 1→90. The two curves disagree.
//     This test file validates both independently but does NOT claim they are consistent.
//   - addWeapon sets spareRefine = max(0, pulled - refine) after incrementing pulled,
//     which means the first spare copy yields spareRefine=1 (correct).
//   - equipWeapon does NOT enforce weapon type compatibility (type matching is in
//     getEquippableWeapons only, used by UI). This is a potential UX bug: a blade character
//     could equip a pistol via equipWeapon(). Marked as observation, not changed.

import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../../src/state.js';
import { resetState } from '../helpers.js';
import { addWeapon } from '../../src/gacha/core.js';
import {
  levelUpWeapon, levelUpWeaponMax,
  equipWeapon, unequipWeapon,
  refineWeapon,
} from '../../src/equip/actions.js';
import { weaponToNext } from '../../src/battle/stats.js';
import { weaponBookForLevel, WEAPON_DATA } from '../../src/equip/weapons.js';

describe('equip/weapons — weapon leveling & refinement', () => {
  beforeEach(() => {
    resetState();
    // Ensure default weapon_book for upgrade tests & a 5★ weapon in inventory
    S.materials.weapon_book = 500;
    addWeapon('苍鳞千嶂', 5);
  });

  // ===== 1. Weapon level 1→90 total book cost curve =====
  describe('leveling cost curve', () => {
    it('weaponToNext cumulative 1→90 = 154 books', () => {
      let total = 0;
      for (let lv = 1; lv < 90; lv++) {
        total += weaponToNext({ level: lv });
      }
      expect(total).toBe(154);
    });

    it('weaponToNext tiers: Lv1-44 cost 1, Lv45-69 cost 2, Lv70-89 cost 3', () => {
      for (let lv = 1; lv <= 44; lv++) expect(weaponToNext({ level: lv })).toBe(1);
      for (let lv = 45; lv <= 69; lv++) expect(weaponToNext({ level: lv })).toBe(2);
      for (let lv = 70; lv <= 89; lv++) expect(weaponToNext({ level: lv })).toBe(3);
    });

    it('weaponBookForLevel target 90 = 135 (separate curve)', () => {
      expect(weaponBookForLevel(90)).toBe(135);
      expect(weaponBookForLevel(1)).toBe(2);
      // NOTE: this function is NOT used by levelUpWeapon; see TODO at top of file.
    });
  });

  // ===== 2. Single upgradeWeapon consumes books & increments level =====
  describe('levelUpWeapon', () => {
    it('consumes weapon_book and increments level by 1', () => {
      const before = S.materials.weapon_book;
      const beforeLv = S.weapons['苍鳞千嶂'].level;
      const ok = levelUpWeapon('苍鳞千嶂');
      expect(ok).toBe(true);
      // Level 1→2 costs 1 book
      expect(S.materials.weapon_book).toBe(before - 1);
      expect(S.weapons['苍鳞千嶂'].level).toBe(beforeLv + 1);
    });

    it('returns false when weapon_book insufficient', () => {
      S.materials.weapon_book = 0;
      const ok = levelUpWeapon('苍鳞千嶂');
      expect(ok).toBe(false);
      expect(S.weapons['苍鳞千嶂'].level).toBe(1);
    });

    it('returns false when weapon already at Lv90', () => {
      S.weapons['苍鳞千嶂'].level = 90;
      const ok = levelUpWeapon('苍鳞千嶂');
      expect(ok).toBe(false);
    });

    it('levelUpWeaponMax stops at Lv90 or resource exhaustion', () => {
      const n = levelUpWeaponMax('苍鳞千嶂');
      expect(n).toBeGreaterThan(0);
      expect(S.weapons['苍鳞千嶂'].level).toBe(90);
      // Can no longer upgrade
      expect(levelUpWeapon('苍鳞千嶂')).toBe(false);
    });
  });

  // ===== 3. weaponBookForLevel curve (already tested above) =====
  // Covered by "weaponBookForLevel target 90 = 135" test above.

  // ===== 4. Repeated 5★ weapon addWeapon accumulates spareRefine =====
  describe('addWeapon spareRefine accumulation', () => {
    it('first pull: no spareRefine', () => {
      const wp = addWeapon('时和岁稔', 5);
      expect(wp.pulled).toBe(1);
      expect(wp.refine).toBe(1);
      expect(wp.spareRefine).toBe(0);
    });

    it('second pull: spareRefine becomes 1', () => {
      addWeapon('时和岁稔', 5);
      const wp = addWeapon('时和岁稔', 5);
      expect(wp.pulled).toBe(2);
      expect(wp.refine).toBe(1);  // NOT auto-refined
      expect(wp.spareRefine).toBe(1);
    });

    it('third pull: spareRefine becomes 2', () => {
      addWeapon('时和岁稔', 5);
      addWeapon('时和岁稔', 5);
      const wp = addWeapon('时和岁稔', 5);
      expect(wp.pulled).toBe(3);
      expect(wp.spareRefine).toBe(2);
      expect(wp.refine).toBe(1);  // Still base refine
    });
  });

  // ===== 5. refineWeapon consumes spareRefine, max refine 5 =====
  describe('refineWeapon', () => {
    it('consumes 1 spareRefine and increments refine', () => {
      // Set up a weapon with 4 spareRefine
      S.weapons['苍鳞千嶂'].spareRefine = 4;
      const r = refineWeapon('苍鳞千嶂', 1);
      expect(r.ok).toBe(true);
      expect(r.used).toBe(1);
      expect(r.refine).toBe(2);
      expect(r.spare).toBe(3);
      expect(S.weapons['苍鳞千嶂'].refine).toBe(2);
      expect(S.weapons['苍鳞千嶂'].spareRefine).toBe(3);
    });

    it('can consume multiple spareRefine at once', () => {
      S.weapons['苍鳞千嶂'].spareRefine = 4;
      const r = refineWeapon('苍鳞千嶂', 3);
      expect(r.ok).toBe(true);
      expect(r.used).toBe(3);
      expect(r.refine).toBe(4);
      expect(r.spare).toBe(1);
    });

    it('stops at max refine 5', () => {
      S.weapons['苍鳞千嶂'].spareRefine = 10;
      S.weapons['苍鳞千嶂'].refine = 3;
      const r = refineWeapon('苍鳞千嶂', 10);
      expect(r.ok).toBe(true);
      expect(r.used).toBe(2);  // Only 2 more needed to reach 5
      expect(r.refine).toBe(5);
      expect(r.spare).toBe(8); // leftover
    });

    it('returns error when no spareRefine available', () => {
      S.weapons['苍鳞千嶂'].spareRefine = 0;
      const r = refineWeapon('苍鳞千嶂', 1);
      expect(r.ok).toBe(false);
      expect(r.err).toMatch(/无可精炼次数/);
    });

    it('returns error when already max refine', () => {
      // NOTE: refineWeapon checks spareRefine <= 0 BEFORE checking refine >= 5,
      // so with spareRefine=0 you get "暂无可精炼次数" even at max refine.
      // This is per the current code behavior.
      S.weapons['苍鳞千嶂'].refine = 5;
      S.weapons['苍鳞千嶂'].spareRefine = 1; // Give it spareRefine so it passes the first guard
      const r = refineWeapon('苍鳞千嶂', 1);
      expect(r.ok).toBe(false);
      expect(r.err).toMatch(/已满精炼/);
    });
  });

  // ===== 6. equipWeapon/unequipWeapon field linkage =====
  describe('equipWeapon / unequipWeapon', () => {
    beforeEach(() => {
      // Ensure "忌炎" and "守岸人" roles exist
      S.roles['忌炎'].equipWeapon = null;
      S.roles['守岸人'].equipWeapon = null;
    });

    it('equipWeapon sets role.equipWeapon and weapon.equippedBy', () => {
      const ok = equipWeapon('忌炎', '苍鳞千嶂');
      expect(ok).toBe(true);
      expect(S.roles['忌炎'].equipWeapon).toBe('苍鳞千嶂');
      expect(S.weapons['苍鳞千嶂'].equippedBy).toBe('忌炎');
    });

    it('unequipWeapon clears both fields', () => {
      equipWeapon('忌炎', '苍鳞千嶂');
      const ok = unequipWeapon('忌炎');
      expect(ok).toBe(true);
      expect(S.roles['忌炎'].equipWeapon).toBeNull();
      expect(S.weapons['苍鳞千嶂'].equippedBy).toBeNull();
    });

    it('unequipWeapon on a role with no weapon returns false', () => {
      S.roles['忌炎'].equipWeapon = null;
      expect(unequipWeapon('忌炎')).toBe(false);
    });
  });

  // ===== 7. Cross-equip: weapon moves from role A to role B =====
  describe('cross-equip', () => {
    beforeEach(() => {
      S.roles['忌炎'].equipWeapon = null;
      S.roles['守岸人'].equipWeapon = null;
      S.weapons['苍鳞千嶂'].equippedBy = null;
    });

    it('equipping a weapon owned by role A to role B clears role A', () => {
      equipWeapon('忌炎', '苍鳞千嶂');
      equipWeapon('守岸人', '苍鳞千嶂');
      // Role A should have weapon slot cleared
      expect(S.roles['忌炎'].equipWeapon).toBeNull();
      // Role B should now own the weapon
      expect(S.roles['守岸人'].equipWeapon).toBe('苍鳞千嶂');
      expect(S.weapons['苍鳞千嶂'].equippedBy).toBe('守岸人');
    });

    it('equipping a weapon to role B when role A had a different weapon does not mess up', () => {
      // Given role A has weapon W1 and role B has weapon W2
      addWeapon('千古洑流', 5);
      equipWeapon('忌炎', '苍鳞千嶂');
      equipWeapon('守岸人', '千古洑流');
      // Steal 千古洑流 for 忌炎
      equipWeapon('忌炎', '千古洑流');
      expect(S.roles['忌炎'].equipWeapon).toBe('千古洑流');
      expect(S.roles['守岸人'].equipWeapon).toBeNull();
      expect(S.weapons['千古洑流'].equippedBy).toBe('忌炎');
      expect(S.weapons['苍鳞千嶂'].equippedBy).toBeNull();
    });
  });

  // ===== 8. 3★ and 5★ weapon spareRefine independently tracked =====
  describe('spareRefine separated by weapon name', () => {
    it('3★ and 5★ weapons do not share spareRefine state', () => {
      addWeapon('训练迅刀', 3);  // 1st pull of 3★
      addWeapon('训练迅刀', 3);  // 2nd pull — spareRefine=1
      addWeapon('苍鳞千嶂', 5);  // duplicate 5★
      addWeapon('苍鳞千嶂', 5);  // duplicate 5★ — pulled=2, spareRefine=1
      expect(S.weapons['训练迅刀'].spareRefine).toBe(1);
      expect(S.weapons['训练迅刀'].refine).toBe(1);
      expect(S.weapons['苍鳞千嶂'].spareRefine).toBe(2); // pulled=3 (1st in beforeEach + 2 here)
      expect(S.weapons['苍鳞千嶂'].refine).toBe(1);
      // Each weapon's spareRefine is independently counted — no cross-contamination
    });

    it('different 5★ weapons have independent spareRefine', () => {
      addWeapon('千古洑流', 5);
      addWeapon('千古洑流', 5); // spareRefine=1
      addWeapon('苍鳞千嶂', 5); // already exists from beforeEach
      addWeapon('苍鳞千嶂', 5); // pulled=3, spareRefine=2 (initially 1 from beforeEach, +1)
      expect(S.weapons['千古洑流'].spareRefine).toBe(1);
      expect(S.weapons['千古洑流'].pulled).toBe(2);
      expect(S.weapons['苍鳞千嶂'].spareRefine).toBe(2);
      expect(S.weapons['苍鳞千嶂'].pulled).toBe(3);
    });
  });

  // ===== WEAPON_DATA integrity smoke =====
  describe('WEAPON_DATA integrity', () => {
    it('all 5★ weapons have required fields', () => {
      const fivers = Object.entries(WEAPON_DATA).filter(([, v]) => v.r === 5);
      expect(fivers.length).toBeGreaterThan(20);
      for (const [name, w] of fivers) {
        expect(w.atk90).toBeGreaterThan(0);
        expect(w.sub).toBeTruthy();
        expect(Array.isArray(w.passive)).toBe(true);
        expect(typeof w.desc).toBe('string');
      }
    });
  });
});
