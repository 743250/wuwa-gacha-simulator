// Unit tests for battle/elements.js — element resistance, vibration multipliers
// AI safety net: verify damage multiplier invariants after element system changes
import { describe, it, expect } from 'vitest';

describe('battle/elements', () => {
  let elem;

  beforeAll(async () => {
    elem = await import('../../src/battle/elements.js');
  });

  // ===== ELEMENTS list =====
  describe('ELEMENTS', () => {
    it('has exactly 6 elements', () => {
      expect(elem.ELEMENTS).toHaveLength(6);
    });

    it('contains all expected elements', () => {
      expect(elem.ELEMENTS).toContain('热熔');
      expect(elem.ELEMENTS).toContain('湮灭');
      expect(elem.ELEMENTS).toContain('气动');
      expect(elem.ELEMENTS).toContain('冷凝');
      expect(elem.ELEMENTS).toContain('衍射');
      expect(elem.ELEMENTS).toContain('导电');
    });

    it('has colors for all elements', () => {
      elem.ELEMENTS.forEach(e => {
        expect(elem.ELEMENT_COLOR[e]).toBeTruthy();
      });
    });

    it('has color for 物理', () => {
      expect(elem.ELEMENT_COLOR['物理']).toBeTruthy();
    });
  });

  // ===== resistMultiplier() =====
  describe('resistMultiplier()', () => {
    it('returns 1.0 for null defender', () => {
      expect(elem.resistMultiplier('热熔', null)).toBe(1.0);
    });

    it('returns 1.0 for undefined defender', () => {
      expect(elem.resistMultiplier('热熔', undefined)).toBe(1.0);
    });

    it('uses resist field when present', () => {
      const defender = { resist: { '热熔': 0.4 } };
      expect(elem.resistMultiplier('热熔', defender)).toBeCloseTo(0.6);
    });

    it('falls back to default 0.9 when attacker element not in resist map', () => {
      // resistMultiplier checks typeof defender.resist[attackerElem] === 'number'
      // If the attacker's element isn't a key in the resist map, it falls through to default (10% resist)
      const defender = { resist: { '冷凝': 0.4 } };
      expect(elem.resistMultiplier('热熔', defender)).toBeCloseTo(0.9);
    });

    it('compatibility: weakness returns 1.0', () => {
      const defender = { element: '冷凝', weaknesses: ['热熔'] };
      expect(elem.resistMultiplier('热熔', defender)).toBe(1.0);
    });

    it('same element gives 0.6 (40% resist)', () => {
      const defender = { element: '热熔', weaknesses: [] };
      expect(elem.resistMultiplier('热熔', defender)).toBeCloseTo(0.6);
    });

    it('different element gives 0.9 (10% resist)', () => {
      const defender = { element: '热熔', weaknesses: [] };
      expect(elem.resistMultiplier('冷凝', defender)).toBeCloseTo(0.9);
    });

    it('resist field takes priority over element-based fallback', () => {
      const defender = { element: '热熔', resist: { '热熔': 0.2 } };
      expect(elem.resistMultiplier('热熔', defender)).toBeCloseTo(0.8);
    });
  });

  // ===== vibrationMultiplier() =====
  describe('vibrationMultiplier()', () => {
    it('returns 1.0 for null defender', () => {
      expect(elem.vibrationMultiplier(null)).toBe(1.0);
    });

    it('returns 1.0 for non-broken defender', () => {
      expect(elem.vibrationMultiplier({})).toBe(1.0);
    });

    it('returns 1.3 when vibration is broken', () => {
      expect(elem.vibrationMultiplier({ vibrationBroken: 1 })).toBeCloseTo(1.3);
    });
  });

  // ===== elementMultiplier() — backward compatibility =====
  describe('elementMultiplier()', () => {
    it('returns 0.6 for same element', () => {
      expect(elem.elementMultiplier('热熔', '热熔', [])).toBeCloseTo(0.6);
    });

    it('returns 1.0 when attacker element is in weaknesses', () => {
      expect(elem.elementMultiplier('热熔', '冷凝', ['热熔'])).toBe(1.0);
    });

    it('returns 0.9 for different element without weakness', () => {
      expect(elem.elementMultiplier('热熔', '冷凝', [])).toBeCloseTo(0.9);
    });
  });

  // ===== elementLabel() =====
  describe('elementLabel()', () => {
    it('returns empty string for null/undefined', () => {
      expect(elem.elementLabel(null)).toBe('');
      expect(elem.elementLabel(undefined)).toBe('');
    });

    it('returns HTML span with color', () => {
      const label = elem.elementLabel('热熔');
      expect(label).toContain('span');
      expect(label).toContain('color:');
      expect(label).toContain('热熔');
    });
  });
});
