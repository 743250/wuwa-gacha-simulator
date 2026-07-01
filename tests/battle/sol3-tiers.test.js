// SOL3 三档世界等级机制 — 等级追踪测试
// 设计：
//   - 三档：Ⅰ=30-60 / Ⅱ=60-90 / Ⅲ=90-120
//   - 每个副本独立追踪等级
//   - 初始等级 = 当前档下限
//   - 胜利 +10（不超本档上限）
//   - 失败 -20（不低于本档下限）
//   - 切换档位 → 重置到新档下限
//   - 覆盖世界 BOSS + 无音区 + 经验/武器副本
import { describe, it, expect, beforeEach } from 'vitest';
import { S, state0 } from '../../src/state.js';
import { resetState } from '../helpers.js';
import {
  SOL3_LEVELS,
  getSol3Level,
  setSol3Level,
  getSol3Config,
  getDungeonEnemyLevel,
  onBattleResult,
  DUNGEONS,
} from '../../src/battle/dungeon.js';

describe('SOL3 三档机制', () => {
  beforeEach(() => {
    Object.assign(S, state0());
    resetState({ team: ['忌炎', '守岸人', '安可'] });
  });

  describe('档位定义', () => {
    it('三档分别覆盖 30-60 / 60-90 / 90-120', () => {
      expect(SOL3_LEVELS[1].levelMin).toBe(30);
      expect(SOL3_LEVELS[1].levelMax).toBe(60);
      expect(SOL3_LEVELS[2].levelMin).toBe(60);
      expect(SOL3_LEVELS[2].levelMax).toBe(90);
      expect(SOL3_LEVELS[3].levelMin).toBe(90);
      expect(SOL3_LEVELS[3].levelMax).toBe(120);
    });

    it('没有 worldTierMult 字段（旧机制已移除）', () => {
      expect(SOL3_LEVELS[1].worldTierMult).toBeUndefined();
      expect(SOL3_LEVELS[2].worldTierMult).toBeUndefined();
      expect(SOL3_LEVELS[3].worldTierMult).toBeUndefined();
    });
  });

  describe('初始等级', () => {
    it('默认在 Ⅰ 档时，任意副本等级 = 30', () => {
      setSol3Level(1);
      const d = DUNGEONS.find(x => x.id === 'silent_frost');
      expect(getDungeonEnemyLevel(d)).toBe(30);
    });

    it('Ⅱ 档时，任意副本等级 = 60', () => {
      setSol3Level(2);
      const d = DUNGEONS.find(x => x.id === 'silent_frost');
      expect(getDungeonEnemyLevel(d)).toBe(60);
    });

    it('Ⅲ 档时，任意副本等级 = 90', () => {
      setSol3Level(3);
      const d = DUNGEONS.find(x => x.id === 'silent_frost');
      expect(getDungeonEnemyLevel(d)).toBe(90);
    });

    it('世界 BOSS 也走三档（不再是单独的 bossLevels）', () => {
      setSol3Level(1);
      const boss = DUNGEONS.find(x => x.id === 'world_boss_lib');
      expect(getDungeonEnemyLevel(boss)).toBe(30);
    });
  });

  describe('胜负调整', () => {
    it('胜利 +10', () => {
      setSol3Level(1);
      const d = DUNGEONS.find(x => x.id === 'silent_frost');
      onBattleResult(d, 'win');
      expect(getDungeonEnemyLevel(d)).toBe(40);
    });

    it('失败 -20', () => {
      setSol3Level(1);
      const d = DUNGEONS.find(x => x.id === 'silent_frost');
      onBattleResult(d, 'win'); // 30 → 40
      onBattleResult(d, 'win'); // 40 → 50
      onBattleResult(d, 'lose'); // 50 → 30
      expect(getDungeonEnemyLevel(d)).toBe(30);
    });

    it('胜利不超本档上限（Ⅰ 档 60 封顶）', () => {
      setSol3Level(1);
      const d = DUNGEONS.find(x => x.id === 'silent_frost');
      for (let i = 0; i < 10; i++) onBattleResult(d, 'win');
      expect(getDungeonEnemyLevel(d)).toBe(60);
    });

    it('失败不低于本档下限（Ⅰ 档 30 兜底）', () => {
      setSol3Level(1);
      const d = DUNGEONS.find(x => x.id === 'silent_frost');
      onBattleResult(d, 'lose');
      onBattleResult(d, 'lose');
      expect(getDungeonEnemyLevel(d)).toBe(30);
    });

    it('Ⅲ 档上限 120', () => {
      setSol3Level(3);
      const d = DUNGEONS.find(x => x.id === 'silent_frost');
      for (let i = 0; i < 10; i++) onBattleResult(d, 'win');
      expect(getDungeonEnemyLevel(d)).toBe(120);
    });
  });

  describe('副本独立追踪', () => {
    it('A 副本获胜不影响 B 副本等级', () => {
      setSol3Level(1);
      const a = DUNGEONS.find(x => x.id === 'silent_frost');
      const b = DUNGEONS.find(x => x.id === 'silent_fire');
      onBattleResult(a, 'win');
      expect(getDungeonEnemyLevel(a)).toBe(40);
      expect(getDungeonEnemyLevel(b)).toBe(30);
    });
  });

  describe('切换档位', () => {
    it('Ⅰ→Ⅱ 时所有副本等级重置到 60', () => {
      setSol3Level(1);
      const d = DUNGEONS.find(x => x.id === 'silent_frost');
      onBattleResult(d, 'win'); // 30 → 40
      onBattleResult(d, 'win'); // 40 → 50
      setSol3Level(2);
      expect(getDungeonEnemyLevel(d)).toBe(60);
    });

    it('Ⅱ→Ⅰ 时所有副本等级重置到 30', () => {
      setSol3Level(2);
      const d = DUNGEONS.find(x => x.id === 'silent_frost');
      onBattleResult(d, 'win'); // 60 → 70
      setSol3Level(1);
      expect(getDungeonEnemyLevel(d)).toBe(30);
    });
  });

  describe('UI 文案', () => {
    it('SOL3_LEVELS 不再含"索拉Ⅰ"这类自造词（用世界等级 N）', () => {
      expect(SOL3_LEVELS[1].name).not.toMatch(/索拉/);
      expect(SOL3_LEVELS[1].name).toMatch(/1|Ⅰ/);
    });
  });
});
