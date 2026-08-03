// 弗洛洛状态机逻辑测试
// 验证：乐声/余响积累 → 谱曲终末 → 定音 → 解放(0AP) → 指挥状态 → 赫卡忒召唤/共伤/协同
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { S } from '../../src/state.js';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/frolo — 弗洛洛状态机', () => {
  let combat;
  let frolo;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    frolo = await import('../../src/battle/characters/frolo.js');
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

  // ===== 普攻：+1 乐声（不叠余响） =====
  describe('普攻命中', () => {
    it('普攻后乐声 +1, 余响不变', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      const notesBefore = f.furoloNotes;
      const echoesBefore = f.furoloEchoes;
      combat.doAttack(battle, firstEnemy(battle));
      expect(f.furoloNotes).toBe(notesBefore + 1);
      expect(f.furoloEchoes).toBe(echoesBefore);
    });

    it('C0/C5 普攻日志只有乐声、无余响获得', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      f.chain = 5;
      const beforeLen = battle.log.length;
      combat.doAttack(battle, firstEnemy(battle));
      const msgs = battle.log.slice(beforeLen).map(e => e.msg || '').join('\n');
      expect(msgs).toMatch(/乐声 \+1/);
      expect(msgs).not.toMatch(/余响 \+/);
      expect(f.furoloEchoes).toBe(10);
    });

    it('6 链大招前普攻：不加余响、不触发立刻协同', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      f.chain = 6;
      const echoesBefore = f.furoloEchoes;
      const beforeLen = battle.log.length;
      combat.doAttack(battle, firstEnemy(battle));
      expect(f.furoloEchoes).toBe(echoesBefore);
      expect(battle.summons?.some(s => s.name === '赫卡忒' && s.alive)).toBeFalsy();
      const msgs = battle.log.slice(beforeLen).map(e => e.msg || '').join('\n');
      expect(msgs).not.toMatch(/重世幻象/);
      expect(msgs).not.toMatch(/余响 \+/);
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

  describe('1 链 · 亡与死的乐章 / 永不消逝的梦呓', () => {
    it('只把合并后的普攻与技能 ATK 倍率提升到 1.8 倍', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      f.chain = 1;

      expect(frolo.furoloNormalMult(f)).toBeCloseTo(5.05 * 1.8, 6);
      expect(frolo.furoloSkillMult(f)).toBeCloseTo(4.64 * 1.8, 6);
      expect(frolo.furoloVariationMult(f)).toBeCloseTo(2.02, 6);
    });

    it('C0 普攻/技能为设计锚点 ATK 倍率', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      f.chain = 0;
      expect(frolo.furoloNormalMult(f)).toBeCloseTo(5.05, 6);
      expect(frolo.furoloSkillMult(f)).toBeCloseTo(4.64, 6);
    });
  });

  describe('谱曲终末倍率（ATK 绝对加点 · 官方每层 82.55%）', () => {
    it('C0 满 0 余响为 6.6016，每层 +0.8255', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      f.chain = 0;
      f.furoloEchoes = 0;
      expect(frolo.furoloDirgeMult(f)).toBeCloseTo(6.6016, 4);
      f.furoloEchoes = 10;
      expect(frolo.furoloDirgeMult(f)).toBeCloseTo(6.6016 + 10 * 0.8255, 4);
    });

    it('C2 满层 24 余响：两系数均 ×1.75 → 26.41×1.75', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      f.chain = 2;
      f.furoloEchoes = 24;
      expect(frolo.furoloDirgeMult(f)).toBeCloseTo((6.6016 + 24 * 0.8255) * 1.75, 3);
    });
  });

  // ===== 技能：+1 乐声（不叠余响） =====
  describe('技能命中', () => {
    it('技能后乐声 +1, 余响不变', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      const notesBefore = f.furoloNotes;
      const echoesBefore = f.furoloEchoes;
      combat.doSkill(battle, firstEnemy(battle));
      expect(f.furoloNotes).toBe(notesBefore + 1);
      expect(f.furoloEchoes).toBe(echoesBefore);
    });

    it('C0/C5 技能日志只有乐声、无余响获得', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      f.chain = 5;
      const beforeLen = battle.log.length;
      combat.doSkill(battle, firstEnemy(battle));
      const msgs = battle.log.slice(beforeLen).map(e => e.msg || '').join('\n');
      expect(msgs).toMatch(/乐声 \+1/);
      expect(msgs).not.toMatch(/余响 \+/);
      expect(f.furoloEchoes).toBe(10);
    });

    it('6 链大招前技能：不加余响、不触发立刻协同', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      f.chain = 6;
      const echoesBefore = f.furoloEchoes;
      const beforeLen = battle.log.length;
      combat.doSkill(battle, firstEnemy(battle));
      expect(f.furoloEchoes).toBe(echoesBefore);
      expect(battle.summons?.some(s => s.name === '赫卡忒' && s.alive)).toBeFalsy();
      const msgs = battle.log.slice(beforeLen).map(e => e.msg || '').join('\n');
      expect(msgs).not.toMatch(/重世幻象/);
      expect(msgs).not.toMatch(/余响 \+/);
    });
  });

  // ===== 6 链立刻协同仅指挥内 =====
  describe('6 链 · 普攻/技能立刻协同门控', () => {
    it('解放进指挥后普攻才触发赫卡忒立刻协同', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 0.1 }]);
      const f = getFurolo(battle);
      f.chain = 6;
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      // 6 链含 2 链：谱曲清空后再 +14
      expect(f.furoloEchoes).toBe(14);
      combat.doBurst(battle);
      expect(battle.summons.some(s => s.name === '赫卡忒' && s.alive)).toBe(true);
      // 前序已耗尽本回合 AP，进入新回合再普攻
      combat.endTurn(battle);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      const countAfterTurn = hecate._attackCount || 0; // 回合末已触发 1 次
      const echoesBefore = f.furoloEchoes;
      const beforeLen = battle.log.length;
      const r = combat.doAttack(battle, firstEnemy(battle));
      expect(r.ok).toBe(true);
      // 指挥内 6 链: 普攻立刻触发赫卡忒攻击（+1 余响）
      expect(f.furoloEchoes).toBe(Math.min(24, echoesBefore + 1));
      expect(hecate._attackCount).toBe(countAfterTurn + 1);
      const msgs = battle.log.slice(beforeLen).map(e => e.msg || '').join('\n');
      expect(msgs).toMatch(/追击 · 攻击/);
    });

    it('0-5 链指挥内普攻不触发赫卡忒立刻协同', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 0.1 }]);
      const f = getFurolo(battle);
      f.chain = 0;
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      expect(hecate).toBeTruthy();
      combat.endTurn(battle);
      const countAfterTurn = hecate._attackCount || 0; // 回合末触发 1 次
      const echoesBefore = f.furoloEchoes;
      const beforeLen = battle.log.length;
      combat.doAttack(battle, firstEnemy(battle));
      // 普攻本身不叠余响, 0-5 链也不触发立刻协同（回合末之外无新增）
      expect(f.furoloEchoes).toBe(echoesBefore);
      expect(hecate._attackCount).toBe(countAfterTurn);
      const msgs = battle.log.slice(beforeLen).map(e => e.msg || '').join('\n');
      expect(msgs).not.toMatch(/追击 · 攻击/);
    });
  });

  // ===== 谱曲终末：满 6 乐声时重击替换 =====
  describe('谱曲终末（重击替换）', () => {
    it('乐声未满 6 时无法重击', () => {
      const battle = quickBattle();
      const r = combat.doHeavy(battle, firstEnemy(battle));
      expect(r.ok).toBe(false);
    });

    it('满 6 乐声时重击变为谱曲终末, 消耗乐声与余响, 进入定音', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      // 凑 6 乐声: 开局 4 + 2 次普攻 = 6
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      expect(f.furoloNotes).toBe(6);
      expect(f.furoloEchoes).toBe(10); // 开战余响仍在
      // 重击 = 谱曲终末
      const r = combat.doHeavy(battle, firstEnemy(battle));
      expect(r.ok).toBe(true);
      expect(f.furoloNotes).toBe(0);
      expect(f.furoloEchoes).toBe(0); // 谱曲终末消耗全部余响
      expect(f.furoloDirge).toBe(true);
    });

    it('谱曲终末后重击冷却 = 3 回合（覆盖引擎默认 1）', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      expect(f.cd.heavy).toBe(3);
      expect(f.heavyCd).toBe(3); // 供战斗 UI 重击 tooltip 显示
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

  // ===== 3 链 / 6 链：乘区归属（谱曲不叠，指挥窗吃） =====
  describe('3 链 / 6 链 · 乘区归属', () => {
    it('3 链: 谱曲终末不再吃重击加深; 赫卡忒攻击 ×1.8', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 0.1 }]);
      const f = getFurolo(battle);
      f.chain = 3;
      // 满 6 乐声 → 谱曲终末
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      // 谱曲不吃 3 链重击加深: C3 与 C2 的 dirgeMult 相同（只吃 C2 的 ×1.75）
      f.furoloEchoes = 10;
      const c3Mult = frolo.furoloDirgeMult(f);
      f.chain = 2;
      expect(c3Mult).toBeCloseTo(frolo.furoloDirgeMult(f), 6);
      expect(c3Mult).toBeCloseTo((6.6016 + 10 * 0.8255) * 1.75, 4);
      f.chain = 3;
      // 进指挥；0-5 链普攻不触发赫卡忒，回合末攻击才触发（56% × 1.8 = 100.8%）
      combat.doBurst(battle);
      expect(battle.summons.some(s => s.name === '赫卡忒' && s.alive)).toBe(true);
      const beforeLen = battle.log.length;
      combat.doAttack(battle, firstEnemy(battle));
      const msgsAfterAttack = battle.log.slice(beforeLen).map(e => e.msg || '').join('\n');
      expect(msgsAfterAttack).not.toMatch(/追击 · 攻击/);
      combat.endTurn(battle);
      const msgs = battle.log.slice(beforeLen).map(e => e.msg || '').join('\n');
      expect(msgs).toMatch(/追击 · 攻击×100\.8%/);
    });

    it('6 链: 湮灭 +60% 仅指挥状态内生效', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      f.chain = 6;
      // 大招前无常驻湮灭 buff
      expect((f.buffs || []).some(b => b.src === '弗洛洛6链')).toBe(false);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const c6Buff = (f.buffs || []).find(b => b.src === '弗洛洛6链');
      expect(c6Buff).toBeTruthy();
      expect(c6Buff.type).toBe('echoElemDmg');
      expect(c6Buff.element).toBe('湮灭');
      expect(c6Buff.value).toBe(0.60);
      expect(c6Buff.duration).toBe(3); // 只持续指挥窗口，非常驻
      // 切人退场 → 指挥结束 → 湮灭 buff 移除
      frolo.furoloSwitchOut({ from: f, battle });
      expect(f.furoloCommandTurns).toBe(0);
      expect((f.buffs || []).some(b => b.src === '弗洛洛6链')).toBe(false);
    });
  });

  // ===== 赫卡忒共伤（非挡刀） =====
  describe('赫卡忒共伤', () => {
    it('登场指挥时同额伤害同时扣赫卡忒与弗洛洛', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      const dmg = 5000;
      const hecateHpBefore = hecate.hp;
      const furoloHpBefore = f.hp;
      combat.dealDamage(f, dmg);
      // 共伤:双方都掉血,且掉血量相同(无5链)
      expect(hecate.hp).toBe(Math.max(0, hecateHpBefore - dmg));
      expect(f.hp).toBe(Math.max(0, furoloHpBefore - dmg));
      expect(hecateHpBefore - hecate.hp).toBe(furoloHpBefore - f.hp);
    });

    it('赫卡忒 HP 归零只消散召唤物,指挥不因此立刻结束', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      // 共伤同额:先单独把赫卡忒压到 1,再共伤 1,只杀赫卡忒
      hecate.hp = 1;
      const fBefore = f.hp;
      combat.dealDamage(f, 1);
      expect(hecate.alive).toBe(false);
      expect(f.alive).toBe(true);
      expect(f.hp).toBe(fBefore - 1);
      expect(f.furoloCommandTurns).toBeGreaterThan(0);
      const atkBuff = (f.buffs || []).find(b => b.src === '弗洛洛指挥状态');
      expect(atkBuff).toBeTruthy();
    });
  });

  // ===== 赫卡忒协同攻击（回合末 / 重击触发） =====
  describe('赫卡忒协同攻击', () => {
    it('指挥状态期间每回合结束触发赫卡忒协同攻击', () => {
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
      // 回合结束触发赫卡忒攻击
      combat.endTurn(battle);
      expect(hecate._attackCount).toBe(1);
      expect(enemy.hp).toBeLessThan(enemyHpBefore);
    });

    it('指挥状态期间弗洛洛重击（谱曲终末）触发赫卡忒协同攻击', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 0.1 }]);
      const f = getFurolo(battle);
      // 进指挥: 2 普攻 + 重击 + 解放
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      combat.endTurn(battle);
      const before = hecate._attackCount || 0; // 回合末已触发 1 次
      // 新回合攒满 6 乐声 → 重击替换为谱曲终末（指挥内）触发赫卡忒；清 CD
      f.furoloNotes = 6;
      f.cd.heavy = 0;
      combat.doHeavy(battle, firstEnemy(battle));
      expect(hecate._attackCount).toBeGreaterThan(before);
    });

    it('每 2 次协同后替换为强化攻击·赫卡忒', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const hecate = battle.summons.find(s => s.name === '赫卡忒');
      // 第 1 次（回合末普通协同）
      combat.endTurn(battle);
      expect(hecate._attackCount).toBe(1);
      // 第 2 次（回合末）→ 强化攻击
      combat.endTurn(battle);
      expect(hecate._attackCount).toBe(2);
    });
  });

  // ===== 共鸣链 5 链：减伤 30% =====
  describe('5 链 · 减伤', () => {
    beforeEach(() => {
      S.roles['弗洛洛'].chain = 5;
    });

    it('指挥状态期间弗洛洛和赫卡忒都获得 defense buff, 共伤同减 30%', () => {
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
      const dmg = 1000;
      const hBefore = hecate.hp;
      const fBefore = f.hp;
      combat.dealDamage(f, dmg);
      const expected = Math.round(dmg * 0.7);
      expect(hBefore - hecate.hp).toBe(expected);
      expect(fBefore - f.hp).toBe(expected);
    });
  });

  // ===== 共鸣链 2 链：谱曲终末 +14 余响 =====
  describe('2 链 · 谱曲终末额外余响', () => {
    beforeEach(() => {
      S.roles['弗洛洛'].chain = 2;
    });

    it('施放谱曲终末先清空余响, 再 +14 余响', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      expect(f.furoloEchoes).toBeGreaterThan(0);
      combat.doHeavy(battle, firstEnemy(battle));
      // 消耗全部后 2 链 +14
      expect(f.furoloEchoes).toBe(14);
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

  // ===== 赫卡忒攻击 +1 余响 =====
  describe('赫卡忒余响', () => {
    it('协同追击后余响 +1', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doAttack(battle, firstEnemy(battle));
      combat.doAttack(battle, firstEnemy(battle));
      combat.doHeavy(battle, firstEnemy(battle));
      combat.doBurst(battle);
      const echoesBefore = f.furoloEchoes;
      combat.endTurn(battle);
      combat.doAttack(battle, firstEnemy(battle));
      expect(f.furoloEchoes).toBe(Math.min(24, echoesBefore + 1));
    });
  });

  // ===== 不上场 3 回合余响消散 =====
  describe('余响不上场消散', () => {
    it('切人后第 3 个回合结束清零余响', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      expect(f.furoloEchoes).toBe(10);
      const r = combat.doSwitch(battle, 1);
      expect(r.ok).toBe(true);
      expect(f.furoloEchoesOffFieldTurns).toBe(3);
      combat.endTurn(battle);
      expect(f.furoloEchoes).toBe(10);
      expect(f.furoloEchoesOffFieldTurns).toBe(2);
      combat.endTurn(battle);
      expect(f.furoloEchoes).toBe(10);
      expect(f.furoloEchoesOffFieldTurns).toBe(1);
      combat.endTurn(battle);
      expect(f.furoloEchoes).toBe(0);
      expect(f.furoloEchoesOffFieldTurns).toBe(0);
    });

    it('切回上场会重置消散计时', () => {
      const battle = quickBattle(null, [{ name: '飞廉之猩', scale: 1 }]);
      const f = getFurolo(battle);
      combat.doSwitch(battle, 1);
      combat.endTurn(battle);
      expect(f.furoloEchoesOffFieldTurns).toBe(2);
      combat.doSwitch(battle, 0);
      expect(f.furoloEchoesOffFieldTurns).toBe(0);
      expect(f.furoloEchoes).toBe(10);
    });
  });

  // ===== DoD 收口：C0 flat 双算 + skillHints 有数 =====
  describe('DoD 门禁', () => {
    let skillHints;
    let charDoD;
    beforeAll(async () => {
      skillHints = await import('../../src/ui/panels/roleModal/skillHints/index.js');
      charDoD = await import('./helpers/charDoD.js');
    });

    it('C0 无常驻 typeBonus 双算嫌疑', () => {
      const battle = quickBattle();
      const f = getFurolo(battle);
      expect(charDoD.expectNoFlatDoubleCount(f)).toBe(true);
    });

    it('skillHints customLines 有数字', () => {
      const entry = skillHints.SKILL_HINTS['弗洛洛'];
      expect(entry).toBeTruthy();
      const smoke = charDoD.skillHintsSmoke(entry, 0);
      expect(smoke.ok, smoke.reason).toBe(true);
    });

    it('技能标题使用1链对应招式名并提供 tooltip 术语标签', () => {
      const entry = skillHints.SKILL_HINTS['弗洛洛'];
      const lines = entry.customLines({ atk: 1000, hp: 10000 }, { chain: 1 });
      expect(lines[0].name).toContain('亡与死的乐章');
      expect(lines[0].nameHtml).toContain('term-skill');
      expect(lines[1].name).toContain('永不消逝的梦呓');
      expect(lines[1].nameHtml).toContain('term-skill');
      expect(lines[0].desc).toMatch(/9090|攻击/);
    });
  });
});
