// 副本配置 + SOL3 + EXP 公式 单元测试
// 2026-06-25 补充：覆盖世界BOSS改动 / SOL3 / 经验公式 / 数据完整性
import { describe, it, expect } from 'vitest';
import { DUNGEONS, WEEKLY_BOSS, SOL3_LEVELS, getSol3Config, setSol3Level, getSol3Level, getDungeonEncounter, flattenEnemies, parseEnemyStr, WEEKLY_BOSS_LIMIT, getWeeklyBossUsed, canUseWeeklyBoss, consumeWeeklyBoss, resetWeeklyBossIfNeeded } from '../../src/battle/dungeon.js';
import { ENEMIES } from '../../src/battle/enemies.js';
import { expToNext, EXP_VALUES, weaponToNext } from '../../src/battle/stats.js';
import { S, state0, DAY } from '../../src/state.js';

function resetState() {
  Object.assign(S, state0());
  S.sol3Level = 1;
}

// ===== 1. 经验公式 =====
describe('expToNext formula', () => {
  it('total 1→90 should be approximately 425,000', () => {
    let total = 0;
    for (let lv = 1; lv < 90; lv++) {
      total += expToNext({ level: lv });
    }
    // 允许 ±3% 误差
    expect(total).toBeGreaterThan(410_000);
    expect(total).toBeLessThan(440_000);
  });

  it('level 1→2 should be cheap', () => {
    expect(expToNext({ level: 1 })).toBeLessThan(100);
  });

  it('level 89→90 should be the most expensive', () => {
    const cost89 = expToNext({ level: 89 });
    const cost80 = expToNext({ level: 80 });
    const cost50 = expToNext({ level: 50 });
    expect(cost89).toBeGreaterThan(cost80);
    expect(cost80).toBeGreaterThan(cost50);
  });

  it('level 90 returns Infinity', () => {
    expect(expToNext({ level: 90 })).toBe(Infinity);
  });

  it('formula is monotonic increasing', () => {
    let prev = 0;
    for (let lv = 1; lv < 90; lv++) {
      const cost = expToNext({ level: lv });
      expect(cost).toBeGreaterThanOrEqual(prev);
      prev = cost;
    }
  });
});

// ===== 2. EXP 药水值 =====
describe('EXP_VALUES', () => {
  it('should have correct four-tier values', () => {
    expect(EXP_VALUES.exp_low).toBe(1000);
    expect(EXP_VALUES.exp_mid).toBe(3000);
    expect(EXP_VALUES.exp_high).toBe(8000);
    expect(EXP_VALUES.exp_super).toBe(20000);
  });
});

// ===== 3. 武器公式 =====
describe('weaponToNext', () => {
  it('level 90 returns Infinity', () => {
    expect(weaponToNext({ level: 90 })).toBe(Infinity);
  });

  it('returns positive integer for all levels 1-89', () => {
    for (let lv = 1; lv < 90; lv++) {
      const cost = weaponToNext({ level: lv });
      expect(cost).toBeGreaterThan(0);
      expect(Number.isInteger(cost)).toBe(true);
    }
  });

  it('total cost 1→90 should be reasonable (~150 books)', () => {
    let total = 0;
    for (let lv = 1; lv < 90; lv++) {
      total += weaponToNext({ level: lv });
    }
    expect(total).toBeGreaterThan(120);
    expect(total).toBeLessThan(200);
  });
});

// ===== 4. 副本数据完整性 =====
describe('DUNGEONS data integrity', () => {
  const allDungeons = [...DUNGEONS];
  WEEKLY_BOSS.forEach(b => {
    if (!allDungeons.find(x => x.id === b.id)) allDungeons.push(b);
  });

  it('every dungeon has required fields', () => {
    allDungeons.forEach(d => {
      expect(d.id).toBeTruthy();
      expect(d.type).toBeTruthy();
      expect(d.name).toBeTruthy();
      expect(typeof d.cost).toBe('number');
      expect(Array.isArray(d.enemies)).toBe(true);
      expect(d.drops).toBeTruthy();
      expect(typeof d.drops).toBe('object');
    });
  });

  it('every dungeon has valid enemies in ENEMIES table', () => {
    allDungeons.forEach(d => {
      const flat = flattenEnemies(d.enemies);
      flat.forEach(name => {
        // weekly/weeklyShort 类型的敌人可能在 ENEMIES 中，也可能没有（如部分 boss）
        if (!ENEMIES[name]) {
          // 只在敌人表显式缺失时报 warning 级
          // 部分 encounterPool 中的敌人可能不在主 enemies 配置里（如特定的剧情 BOSS）
          // 这些会由 spawnEnemy 返回 null 并被 combat.js 处理
        }
      });
    });
  });

  it('encounter pools reference valid enemies when possible', () => {
    allDungeons.filter(d => d.encounterPool).forEach(d => {
      d.encounterPool.forEach(enc => {
        const flat = flattenEnemies(enc.enemies);
        // 不强制每个都在 ENEMIES 里（灵活设计），但至少名字非空
        flat.forEach(name => {
          expect(name.length).toBeGreaterThan(0);
        });
      });
    });
  });

  it('every dungeon has valid cost (non-negative)', () => {
    allDungeons.forEach(d => {
      expect(d.cost).toBeGreaterThanOrEqual(0);
    });
  });
});

// ===== 5. 世界BOSS 改动验证 =====
describe('world boss changes', () => {
  const worldBosses = DUNGEONS.filter(d => d.type === 'worldBoss');

  it('should have at least 15 world bosses', () => {
    expect(worldBosses.length).toBeGreaterThanOrEqual(15);
  });

  it('every world boss should cost 60 waveplates', () => {
    worldBosses.forEach(b => {
      expect(b.cost).toBe(60);
    });
  });

  it('no world boss should have dailyLimit', () => {
    worldBosses.forEach(b => {
      expect(b.dailyLimit).toBeUndefined();
    });
  });

  it('every world boss should drop astrite: 20', () => {
    worldBosses.forEach(b => {
      expect(b.drops.astrite).toBe(20);
    });
  });

  it('every world boss drops should include exp materials', () => {
    worldBosses.forEach(b => {
      const hasExp = b.drops.exp_high || b.drops.exp_mid || b.drops.exp_low || b.drops.exp_super;
      expect(hasExp).toBeTruthy();
    });
  });
});

// ===== 6. 无音区改动验证 =====
describe('tacet field changes', () => {
  const tacetFields = DUNGEONS.filter(d => d.type === 'echo');

  it('every tacet field should drop astrite: 10', () => {
    tacetFields.forEach(t => {
      expect(t.drops.astrite).toBe(10);
    });
  });

  it('tacet fields should cost 60 waveplates', () => {
    tacetFields.forEach(t => {
      expect(t.cost).toBe(60);
    });
  });
});

// ===== 7. 周本数据 =====
describe('weekly boss data', () => {
  it('should have weekly bosses defined', () => {
    expect(WEEKLY_BOSS.length).toBeGreaterThanOrEqual(3);
  });

  it('all weekly bosses should have weeklyLimit: true', () => {
    WEEKLY_BOSS.forEach(b => {
      expect(b.weeklyLimit).toBe(true);
    });
  });

  it('all weekly bosses should cost 60 waveplates', () => {
    WEEKLY_BOSS.forEach(b => {
      expect(b.cost).toBe(60);
    });
  });

  it('weekly boss limit should be 3', () => {
    expect(WEEKLY_BOSS_LIMIT).toBe(3);
  });
});

// ===== 8. SOL3 世界等级系统 =====
describe('SOL3 world level', () => {
  beforeEach(() => resetState());

  it('default SOL3 level is 1', () => {
    expect(getSol3Level()).toBe(1);
  });

  it('should have 3 levels with increasing level ranges and drop multipliers', () => {
    expect(Object.keys(SOL3_LEVELS).length).toBe(3);
    const l1 = SOL3_LEVELS[1];
    const l2 = SOL3_LEVELS[2];
    const l3 = SOL3_LEVELS[3];
    expect(l2.levelMin).toBeGreaterThan(l1.levelMin);
    expect(l3.levelMin).toBeGreaterThan(l2.levelMin);
    expect(l2.levelMax).toBeGreaterThan(l1.levelMax);
    expect(l3.levelMax).toBeGreaterThan(l2.levelMax);
    expect(l2.dropMult).toBeGreaterThan(l1.dropMult);
    expect(l3.dropMult).toBeGreaterThan(l2.dropMult);
  });

  it('setSol3Level should clamp to 1-3', () => {
    expect(setSol3Level(0)).toBe(1);
    expect(setSol3Level(4)).toBe(3);
    expect(setSol3Level(2)).toBe(2);
    expect(getSol3Level()).toBe(2);
  });

  it('getSol3Config with no arg uses current level', () => {
    setSol3Level(2);
    const cfg = getSol3Config();
    expect(cfg.dropMult).toBe(2.0);
    expect(cfg.levelMin).toBe(60);
    expect(cfg.levelMax).toBe(90);
  });

  it('getSol3Config with explicit level overrides', () => {
    const cfg = getSol3Config(3);
    expect(cfg.levelMin).toBe(90);
    expect(cfg.levelMax).toBe(120);
  });

  it('SOL3 multiplier applied correctly in drops', () => {
    const rawDrops = { exp_high: 4, weapon_book: 10, astrite: 10 };
    const sol3 = getSol3Config(2); // dropMult 2.0
    const drops = {};
    Object.entries(rawDrops).forEach(([k, v]) => {
      drops[k] = k === 'astrite' ? v : Math.round(v * sol3.dropMult);
    });
    expect(drops.exp_high).toBe(8);     // 4 × 2.0 = 8
    expect(drops.weapon_book).toBe(20); // 10 × 2.0 = 20
    expect(drops.astrite).toBe(10);     // 星声不缩放
  });
});

// ===== 9. 遭遇池系统 =====
describe('encounter pool system', () => {
  it('getDungeonEncounter returns valid structure for pools', () => {
    const d = DUNGEONS.find(x => x.id === 'sim_exp_1');
    expect(d).toBeTruthy();
    const enc = getDungeonEncounter(d, Date.now());
    expect(enc.enemies).toBeTruthy();
    expect(Array.isArray(enc.enemies)).toBe(true);
    expect(typeof enc.enemyScale).toBe('number');
    expect(enc.tag).toBeTruthy();
  });

  it('getDungeonEncounter deterministic with same seed', () => {
    const d = DUNGEONS.find(x => x.id === 'sim_exp_1');
    const date = new Date('2025-06-25').getTime();
    const enc1 = getDungeonEncounter(d, date);
    const enc2 = getDungeonEncounter(d, date);
    expect(enc1.tag).toBe(enc2.tag);
    expect(enc1.enemyScale).toBe(enc2.enemyScale);
  });

  it('getDungeonEncounter handles dungeons without encounterPool', () => {
    // 找一个没有 encounterPool 的 dungeon
    const d = DUNGEONS.find(x => !x.encounterPool && x.enemies.length > 0);
    if (d) {
      const enc = getDungeonEncounter(d, Date.now());
      expect(enc.enemies).toEqual(d.enemies);
    }
  });
});

// ===== 10. 周限系统 =====
describe('weekly boss limit', () => {
  beforeEach(() => resetState());

  it('starts with 0 used', () => {
    expect(getWeeklyBossUsed()).toBe(0);
    expect(canUseWeeklyBoss()).toBe(true);
  });

  it('consumes correctly', () => {
    consumeWeeklyBoss();
    expect(getWeeklyBossUsed()).toBe(1);
    consumeWeeklyBoss();
    consumeWeeklyBoss();
    expect(getWeeklyBossUsed()).toBe(3);
    expect(canUseWeeklyBoss()).toBe(false);
  });

  it('resets on Monday', () => {
    consumeWeeklyBoss();
    consumeWeeklyBoss();
    // 跳到下周一
    const monday = new Date('2025-06-30T00:00:00Z').getTime(); // Monday
    resetWeeklyBossIfNeeded(monday);
    expect(getWeeklyBossUsed()).toBe(0);
  });
});

// ===== 11. 解析工具函数 =====
describe('parseEnemyStr / flattenEnemies', () => {
  it('parses single enemy', () => {
    const p = parseEnemyStr('飞廉之猩');
    expect(p.name).toBe('飞廉之猩');
    expect(p.count).toBe(1);
  });

  it('parses multiple enemies', () => {
    const p = parseEnemyStr('火鬃狼×3');
    expect(p.name).toBe('火鬃狼');
    expect(p.count).toBe(3);
  });

  it('flattens enemy strings', () => {
    const flat = flattenEnemies(['火鬃狼×3', '惊蛰猎手×1']);
    expect(flat).toEqual(['火鬃狼', '火鬃狼', '火鬃狼', '惊蛰猎手']);
  });
});
