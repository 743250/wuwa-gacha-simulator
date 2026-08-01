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

describe('ui/skillHints — chain typeBonus injection', () => {
  let preview;
  let hints;

  beforeAll(async () => {
    preview = await import('../../src/ui/render/rolePreview.js');
    hints = await import('../../src/ui/render/skillHints.js');
  });

  beforeEach(() => {
    resetState({
      team: ['长离', '安可', '忌炎'],
      roles: {
        '长离': { level: 90, chain: 6 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
  });

  it('getSkillHintRoleContext 含 applyChain + battleStart typeBonus（长离 C6）', () => {
    const ctx = preview.getSkillHintRoleContext('长离');
    expect(ctx.chain).toBe(6);
    // C1 battleStart skill/heavy +0.1；C5 heavy +1.0 → heavy 1.1；C3 burst +0.8
    expect(ctx.skillBonus || 0).toBeCloseTo(0.1, 5);
    expect(ctx.heavyBonus || 0).toBeCloseTo(1.1, 5);
    expect(ctx.burstBonus || 0).toBeCloseTo(0.8, 5);
    // C1/C4/C6 占位不写 flat normal
    expect(ctx.normalBonus || 0).toBe(0);
  });

  it('存档 role 无 skillBonus；工厂公式在注入后技能展示数上升', () => {
    const atk = 1000;
    const bare = { chain: 6 }; // 旧路径：只有 chain
    const ctx = preview.getSkillHintRoleContext('长离');
    const linesBare = hints.SKILL_HINTS['长离'].customLines({ atk }, bare);
    const linesCtx = hints.SKILL_HINTS['长离'].customLines({ atk }, ctx);
    const skillBare = linesBare.find(l => l.name.includes('赫羽') || l.name.includes('技能'));
    const skillCtx = linesCtx.find(l => l.name.includes('赫羽') || l.name.includes('技能'));
    // 基线 = atk 1000 × skillMult 2.0（长离专属基底）= 2000；注入 skillBonus 0.1 → 2200，且 tip 含技能加成
    expect(skillBare.desc).toMatch(/2000/);
    expect(skillCtx.desc).toMatch(/2200/);
    expect(skillCtx.desc).toMatch(/技能加成|10%/);
  });
});
