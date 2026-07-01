// 弗洛洛状态机逻辑测试
// 验证：乐声/余响积累 → 谱曲终末 → 定音 → 解放(0AP) → 指挥状态 → 赫卡忒召唤/挡刀/死亡退出
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { S } from '../../src/state.js';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/frolo — 弗洛洛状态机', () => {
  let combat;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
  });

  beforeEach(() => {
    resetState({
      team: ['弗洛洛', '守岸人', '安可'],
      roles: {
        '弗洛洛': { level: 90, chain: 0, equipWeapon: '往日深渊的圆舞曲' },
        '守岸人': { level: 90, chain: 0, equipWeapon: '星序协响' },
        '安可': { level: 90, chain: 0, equipWeapon: '漪澜浮录' },
      },
    });
  });

  // 找到弗洛洛在队伍中的 idx
  function furoloIdx(battle) {
    return battle.team.findIndex(t => t.name === '弗洛洛');
  }
  function getFurolo(battle) {
    return battle.team[furoloIdx(battle)];
  }

  // ===== 固有·八重奏：战斗开始送 4 乐声 + 10 余响 =====
  describe('固有·八重奏（战斗开始）', () => {
    it('战斗开始时乐声=4, 余响=10', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      expect(f.furoloNotes).toBe(4);
      expect(f.furoloEchoes).toBe(10);
      expect(f.furoloDirge).toBe(false);
      expect(f.furoloCommandTurns).toBe(0);
    });

    it('余响同步到 forte.current 给 UI 资源条', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      expect(f.forte?.current).toBe(10);
    });

    it('余响暴伤 buff 已挂（10 层 × 2.5% = +25% cdmg）', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      const cdmgBuff = (f.buffs || []).find(b => b.src === '弗洛洛余响暴伤');
      expect(cdmgBuff).toBeTruthy();
      expect(cdmgBuff.value).toBeCloseTo(0.25, 2);
    });
  });

  // ===== 普攻：+1 乐声 +3 余响 =====
  describe('普攻命中', () => {
    it('普攻后乐声 +1, 余响 +3', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      const notesBefore = f.furoloNotes;
      const echoesBefore = f.furoloEchoes;
      combat.doAttack(battle, firstEnemy(battle));
      expect(f.furoloNotes).toBe(notesBefore + 1);
      expect(f.furoloEchoes).toBe(echoesBefore + 3);
    });

    it('乐声上限 6（不会超过）', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      // 战斗开始 4 乐声, 普攻 2 次到 6
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      expect(f.furoloNotes).toBe(6);
      // 再普攻一次不会溢出
      combat.endTurn(battle);
      combat.doAttack(battle, firstEnemy(battle));
      expect(f.furoloNotes).toBe(6);
    });
  });

  // ===== 技能：+1 乐声 +5 余响 =====
  describe('技能命中', () => {
    it('技能后乐声 +1, 余响 +5', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      const notesBefore = f.furoloNotes;
      const echoesBefore = f.furoloEchoes;
      combat.doSkill(battle, firstEnemy(battle));
      expect(f.furoloNotes).toBe(notesBefore + 1);
      expect(f.furoloEchoes).toBe(echoesBefore + 5);
    });
  });

  // ===== 谱曲终末：满 6 乐声时重击替换 =====
  describe('谱曲终末（重击替换）', () => {
    it('乐声未满 6 时无法重击', () => {
      const battle = quickBattle();
      const r = combat.doHeavy(battle, firstEnemy(battle));
      expect(r.ok).toBe(false);
    });

    it('满 6 乐声时重击变为谱曲终末, 消耗乐声, 进入定音', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      // 凑 6 乐声: 开局 4 + 2 次普攻 = 6
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      expect(f.furoloNotes).toBe(6);
      // 重击 = 谱曲终末
      const r = combat.doHeavy(battle, firstEnemy(battle));
      expect(r.ok).toBe(true);
      expect(f.furoloNotes).toBe(0);
      expect(f.furoloDirge).toBe(true);
    });

    it('谱曲终末造成伤害（敌人血量下降）', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const enemyIdx = firstEnemy(battle);
      const hpBefore = battle.enemies[enemyIdx].hp;
      const f = getFurolo(battle);
      combat.doAttack(battle, enemyIdx);
      combat.doAttack(battle, enemyIdx);
      // AP 只剩 2, 重击需 2 AP
      combat.doHeavy(battle, enemyIdx);
      expect(battle.enemies[enemyIdx].hp).toBeLessThan(hpBefore);
    });
  });

  // ===== 共鸣解放：0AP, 需定音状态, 进入指挥状态 + 召唤赫卡忒 =====
  describe('共鸣解放（0AP · 指挥状态）', () => {
    it('未处定音状态时解放失败', () => {
      const battle = quickBattle();
      const r = combat.doBurst(battle);
      expect(r.ok).toBe(false);
    });

    it('定音后解放: 0AP, 进入指挥状态, 召唤赫卡忒', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      // 进定音: 2 普攻(2AP) + 重击(2AP) = 4 AP 全消耗
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      expect(f.furoloDirge).toBe(true);
      const apBeforeBurst = battle.ap;  // 应为 0
      // 解放
      const r = combat.doBurst(battle);
      expect(r.ok).toBe(true);
      expect(battle.ap).toBe(apBeforeBurst);  // 0AP: AP 不变（不再消耗）
      expect(f.furoloDirge).toBe(false);  // 退出定音
      expect(f.furoloCommandTurns).toBe(3);  // 指挥状态 3 回合
      // 赫卡忒已召唤
      expect(battle.summons.length).toBeGreaterThan(0);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      expect(hecate).toBeTruthy();
      expect(hecate.alive).toBe(true);
      expect(hecate.hp).toBe(f.hp);  // HP = 弗洛洛 HP
      // 攻击 +120% buff
      const atkBuff = (f.buffs || []).find(b => b.src === '弗洛洛指挥状态');
      expect(atkBuff).toBeTruthy();
      expect(atkBuff.value).toBeCloseTo(1.20, 2);
    });

    it('解放后定音标志已清除, 不能再次解放', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      expect(f.furoloCommandTurns).toBeGreaterThan(0);
      // 此时定音已退出, 再次解放应失败
      const r = combat.doBurst(battle);
      expect(r.ok).toBe(false);
    });
  });

  // ===== 赫卡忒挡刀 =====
  describe('赫卡忒挡刀', () => {
    it('弗洛洛受伤时由赫卡忒承担, overflow 才打弗洛洛', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      // 进指挥状态
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      const hecateHpBefore = hecate.hp;
      const furoloHpBefore = f.hp;
      // 模拟敌人攻击弗洛洛: 直接调用 dealDamage
      // 找一个能造成伤害的数值
      const dmg = 5000;
      combat.dealDamage(f, dmg);
      // 赫卡忒承担了伤害
      expect(hecate.hp).toBeLessThan(hecateHpBefore);
      // 弗洛洛未受伤（如果赫卡忒吃完了）
      if (hecate.alive) {
        expect(f.hp).toBe(furoloHpBefore);
      }
    });

    it('赫卡忒 HP 归零时死亡, 指挥状态立即结束', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      // 用超大伤害打死赫卡忒
      combat.dealDamage(f, hecate.hp + 10000);
      expect(hecate.alive).toBe(false);
      expect(f.furoloCommandTurns).toBe(0);
      // 攻击 buff 已清除
      const atkBuff = (f.buffs || []).find(b => b.src === '弗洛洛指挥状态');
      expect(atkBuff).toBeFalsy();
    });
  });

  // ===== 赫卡忒协同攻击（弗洛洛普攻触发） =====
  describe('赫卡忒协同攻击', () => {
    it('指挥状态期间弗洛洛普攻触发赫卡忒协同攻击', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      // 进指挥状态: 2 普攻 + 重击(谱曲终末) + 解放
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      expect(hecate._attackCount || 0).toBe(0);
      const enemy = battle.enemies[firstEnemy(battle)];
      const enemyHpBefore = enemy.hp;
      // 新回合有 AP, 普攻触发赫卡忒协同
      combat.endTurn(battle);
      combat.doAttack(battle, firstEnemy(battle));
      expect(hecate._attackCount).toBe(1);
      expect(enemy.hp).toBeLessThan(enemyHpBefore);
    });

    it('每 2 次协同后替换为强化攻击·赫卡忒', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      // 第 1 次（普通协同）
      combat.endTurn(battle);
      combat.doAttack(battle, firstEnemy(battle));
      expect(hecate._attackCount).toBe(1);
      // 第 2 次 → 强化攻击
      combat.endTurn(battle);
      combat.doAttack(battle, firstEnemy(battle));
      expect(hecate._attackCount).toBe(2);
    });
  });

  // ===== 共鸣链 5 链：减伤 30% =====
  describe('5 链 · 减伤', () => {
    beforeEach(() => {
      S.roles['弗洛洛'].chain = 5;
    });

    it('指挥状态期间弗洛洛和赫卡忒都获得 defense buff', () => {
      // 用 scale:5 把 BOSS 拉厚,避免谱曲终末一击秒杀导致 burst 时已无目标
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 5 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      const r = combat.doBurst(battle);
      expect(r.ok).toBe(true);
      const fDef = (f.buffs || []).find(b => b.src === '弗洛洛5链');
      expect(fDef).toBeTruthy();
      expect(fDef.value).toBeCloseTo(0.30, 2);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      const hDef = (hecate.buffs || []).find(b => b.src === '弗洛洛5链');
      expect(hDef).toBeTruthy();
    });
  });

  // ===== 共鸣链 2 链：谱曲终末 +14 余响 =====
  describe('2 链 · 谱曲终末额外余响', () => {
    beforeEach(() => {
      S.roles['弗洛洛'].chain = 2;
    });

    it('施放谱曲终末后 +14 余响', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      const echoesBeforeDirge = f.furoloEchoes;
      combat.doHeavy(battle, firstEnemy(battle));
      // 2 链 +14 余响（受 24 上限 clamp）
      const expected = Math.min(24, echoesBeforeDirge + 14);
      expect(f.furoloEchoes).toBe(expected);
    });
  });

  // ===== 切人退出指挥状态 =====
  describe('切人退场', () => {
    it('切人时赫卡忒消失, 指挥状态结束', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      expect(battle.summons.length).toBeGreaterThan(0);
      // 切到守岸人 (idx 1)
      const r = combat.doSwitch(battle, 1);
      expect(r.ok).toBe(true);
      expect(f.furoloCommandTurns).toBe(0);
      expect(battle.summons.length).toBe(0);
    });
  });
});
