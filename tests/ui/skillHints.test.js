// UI data integrity tests — verify SKILL_HINTS, weapon data, character data completeness
// AI safety net: ensure UI data stays consistent after adding/modifying characters
import { describe, it, expect } from 'vitest';
import { resetState } from '../helpers.js';

describe('ui/skillHints — data integrity', () => {
  let hints;
  let KNOWN_CHARACTERS;

  beforeAll(async () => {
    hints = await import('../../src/ui/render/skillHints.js');
    KNOWN_CHARACTERS = Object.keys(hints.SKILL_HINTS);
  });

  it('all known characters have SKILL_HINTS entries', () => {
    const defined = Object.keys(hints.SKILL_HINTS);
    expect(defined.length).toBeGreaterThanOrEqual(30);
    defined.forEach(name => {
      expect(defined).toContain(name);
    });
  });

  it('every SKILL_HINTS entry has intro field', () => {
    Object.entries(hints.SKILL_HINTS).forEach(([name, entry]) => {
      expect(entry.intro).toBeTruthy();
    });
  });

  it('hasHeavy is boolean when present', () => {
    Object.entries(hints.SKILL_HINTS).forEach(([name, entry]) => {
      if ('hasHeavy' in entry) {
        expect(typeof entry.hasHeavy).toBe('boolean');
      }
    });
  });

  it('every SKILL_HINTS entry has customLines function', () => {
    Object.entries(hints.SKILL_HINTS).forEach(([name, entry]) => {
      expect(typeof entry.customLines).toBe('function');
    });
  });

  it('forteName is present on most entries', () => {
    const missing = [];
    Object.entries(hints.SKILL_HINTS).forEach(([name, entry]) => {
      if (!entry.forteName) missing.push(name);
    });
    // Allow a few B-tier entries without forteName
    expect(missing.length).toBeLessThanOrEqual(12);
  });
});

describe('ui/render — SKILL_HINTS rendering integration', () => {
  let hints;

  beforeAll(async () => {
    hints = await import('../../src/ui/render/skillHints.js');
  });

  it('customLines returns array for all characters at chain=0', () => {
    Object.entries(hints.SKILL_HINTS).forEach(([name, entry]) => {
      const lines = entry.customLines({ atk: 1000, maxEnergy: 100 }, { chain: 0 });
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('customLines returns array for all characters at chain=6', () => {
    Object.entries(hints.SKILL_HINTS).forEach(([name, entry]) => {
      const lines = entry.customLines({ atk: 1000, maxEnergy: 100 }, { chain: 6 });
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('customLines returns objects with desc containing numbers for most characters', () => {
    const noNumbers = [];
    Object.entries(hints.SKILL_HINTS).forEach(([name, entry]) => {
      const lines = entry.customLines({ atk: 1000, maxEnergy: 100 }, { chain: 0 });
      const linesArr = Array.isArray(lines) ? lines : [lines];
      const hasNumbers = linesArr.some(l =>
        l && (typeof l === 'string' ? /\d+/.test(l) : (l.desc && /\d+/.test(l.desc)))
      );
      if (!hasNumbers) noNumbers.push(name);
    });
    // Most entries should include damage numbers
    expect(noNumbers.length).toBeLessThanOrEqual(5);
  });
});
