import { describe, it, expect, beforeEach } from 'vitest';
import { S, resetState } from '../../src/state.js';
import { ensureRover, listRoverForms, ROVER_FORMS } from '../../src/rover/ensure.js';

describe('ensureRover', () => {
  beforeEach(() => {
    resetState();
  });

  it('grants three free forms once', () => {
    const n = ensureRover();
    expect(n).toBe(3);
    for (const f of ROVER_FORMS) {
      const r = S.roles[f.id];
      expect(r?.owned).toBeTruthy();
      expect(r.owned).toBe(1);
      expect(r.spare || 0).toBe(0);
    }
    expect(ensureRover()).toBe(0);
  });

  it('listRoverForms returns level/chain', () => {
    const list = listRoverForms();
    expect(list).toHaveLength(3);
    expect(list.every(x => x.owned && x.level >= 1)).toBe(true);
  });
});
