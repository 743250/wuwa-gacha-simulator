// Regression tests: equip actions that mutate saved state must go through commit().
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/save.js', () => ({
  saveState: vi.fn(),
}));

import { S } from '../../src/state.js';
import { resetState } from '../helpers.js';
import { addWeapon } from '../../src/gacha/core.js';
import { saveState } from '../../src/save.js';
import {
  levelUpRole,
  levelUpWeapon,
  equipWeapon,
  unequipWeapon,
  refineWeapon,
} from '../../src/equip/actions.js';

describe('equip/actions persistence', () => {
  beforeEach(() => {
    resetState();
    saveState.mockClear();
    S.materials.exp_super = 10;
    S.materials.weapon_book = 10;
    S.roles['忌炎'].level = 1;
    addWeapon('苍鳞千嶂', 5);
    saveState.mockClear();
  });

  it('saves successful role level changes', () => {
    expect(levelUpRole('忌炎')).toBe(true);
    expect(saveState).toHaveBeenCalledTimes(1);
  });

  it('does not save failed role level changes', () => {
    S.materials.exp_super = 0;
    S.materials.exp_high = 0;
    S.materials.exp_mid = 0;
    S.materials.exp_low = 0;
    expect(levelUpRole('忌炎')).toBe(false);
    expect(saveState).not.toHaveBeenCalled();
  });

  it('saves successful weapon level changes', () => {
    expect(levelUpWeapon('苍鳞千嶂')).toBe(true);
    expect(saveState).toHaveBeenCalledTimes(1);
  });

  it('saves equip and unequip changes', () => {
    expect(equipWeapon('忌炎', '苍鳞千嶂')).toBe(true);
    expect(unequipWeapon('忌炎')).toBe(true);
    expect(saveState).toHaveBeenCalledTimes(2);
  });

  it('saves successful refine changes', () => {
    S.weapons['苍鳞千嶂'].spareRefine = 1;
    expect(refineWeapon('苍鳞千嶂').ok).toBe(true);
    expect(saveState).toHaveBeenCalledTimes(1);
  });

  it('does not save failed refine changes', () => {
    S.weapons['苍鳞千嶂'].spareRefine = 0;
    expect(refineWeapon('苍鳞千嶂').ok).toBe(false);
    expect(saveState).not.toHaveBeenCalled();
  });
});
