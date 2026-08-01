// 弗洛洛 C6 实战 DPS 模拟：声骸（湮灭 + 重击）+ 全链 + 必暴
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { S } from '../../src/state.js';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

function mkEcho({ catalogId, name, cost, set, main, secondary, subs }) {
  const id = S.echoNextId++;
  const echo = {
    id,
    catalogId,
    name,
    cost,
    set,
    element: '湮灭',
    level: 25,
    exp: 999999,
    mainStat: { ...main, maxValue: main.value },
    secondaryStat: secondary ? { ...secondary, maxValue: secondary.value } : null,
    subStats: (subs || []).map(s => ({ ...s, locked: false, unlocked: true })),
    lock: true,
    equippedBy: null,
    equipSlot: null,
  };
  S.echos.push(echo);
  return echo;
}

function equipFuroloEchoes() {
  // 沉日劫明 5 件：2 件湮灭+10%，5 件条件折半约 +3.75% 湮灭
  // 主词条：暴击 / 双湮灭 / 双攻击%
  // 副词条：每件带重击% + 暴伤（抬谱曲终末 typeBonus 与 cdmg）
  const pieces = [
    mkEcho({
      catalogId: 'nm_crownless', name: '梦魇·无冠者', cost: 4, set: 'havoc',
      main: { key: 'crate', label: '暴击率', value: 0.22 },
      secondary: { key: 'atk_flat', label: '攻击', value: 150 },
      subs: [
        { key: 'cdmg', label: '暴击伤害', value: 0.21 },
        { key: 'heavy_dmg', label: '重击伤害%', value: 0.116 },
        { key: 'atk_pct', label: '攻击%', value: 0.116 },
        { key: 'crate', label: '暴击率', value: 0.105 },
        { key: 'atk_flat', label: '攻击(固定)', value: 70 },
      ],
    }),
    mkEcho({
      catalogId: 'dark_wolf', name: '暗鬃狼', cost: 3, set: 'havoc',
      main: { key: 'elem_dmg_havoc', label: '湮灭伤害%', value: 0.30 },
      secondary: { key: 'atk_flat', label: '攻击', value: 100 },
      subs: [
        { key: 'cdmg', label: '暴击伤害', value: 0.21 },
        { key: 'heavy_dmg', label: '重击伤害%', value: 0.116 },
        { key: 'atk_pct', label: '攻击%', value: 0.116 },
        { key: 'crate', label: '暴击率', value: 0.105 },
        { key: 'atk_flat', label: '攻击(固定)', value: 70 },
      ],
    }),
    mkEcho({
      catalogId: 'thorn_mush', name: '刺玫菇', cost: 3, set: 'havoc',
      main: { key: 'elem_dmg_havoc', label: '湮灭伤害%', value: 0.30 },
      secondary: { key: 'atk_flat', label: '攻击', value: 100 },
      subs: [
        { key: 'cdmg', label: '暴击伤害', value: 0.21 },
        { key: 'heavy_dmg', label: '重击伤害%', value: 0.116 },
        { key: 'atk_pct', label: '攻击%', value: 0.116 },
        { key: 'crate', label: '暴击率', value: 0.105 },
        { key: 'atk_flat', label: '攻击(固定)', value: 70 },
      ],
    }),
    mkEcho({
      catalogId: 'havoc_prism', name: '湮灭棱镜', cost: 1, set: 'havoc',
      main: { key: 'atk_pct', label: '攻击%', value: 0.18 },
      secondary: { key: 'hp_flat', label: '生命', value: 2280 },
      subs: [
        { key: 'cdmg', label: '暴击伤害', value: 0.21 },
        { key: 'heavy_dmg', label: '重击伤害%', value: 0.116 },
        { key: 'atk_pct', label: '攻击%', value: 0.116 },
        { key: 'crate', label: '暴击率', value: 0.084 },
        { key: 'atk_flat', label: '攻击(固定)', value: 50 },
      ],
    }),
    mkEcho({
      catalogId: 'judge_warrior', name: '审判战士', cost: 1, set: 'havoc',
      main: { key: 'atk_pct', label: '攻击%', value: 0.18 },
      secondary: { key: 'hp_flat', label: '生命', value: 2280 },
      subs: [
        { key: 'cdmg', label: '暴击伤害', value: 0.21 },
        { key: 'heavy_dmg', label: '重击伤害%', value: 0.116 },
        { key: 'atk_pct', label: '攻击%', value: 0.116 },
        { key: 'crate', label: '暴击率', value: 0.084 },
        { key: 'atk_flat', label: '攻击(固定)', value: 50 },
      ],
    }),
  ];
  const role = S.roles['弗洛洛'];
  role.equipEchoes = pieces.map((e, i) => {
    e.equippedBy = '弗洛洛';
    e.equipSlot = i;
    return e.id;
  });
  return pieces;
}

function sumDmgFromLog(log, pred) {
  return log.filter(pred).reduce((a, l) => a + (l.dmg || 0), 0);
}

describe('battle/frolo-dps-sim — C6 + 沉日劫明 + 重击/湮灭', () => {
  let combat;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
  });

  beforeEach(() => {
    resetState({
      team: ['弗洛洛'],
      roles: {
        '弗洛洛': { level: 90, chain: 6, equipWeapon: '往日深渊的圆舞曲' },
      },
    });
    equipFuroloEchoes();
  });

  it('整轮循环打同属湮灭怪，打印面板与关键伤害', () => {
    // 高血量湮灭怪，避免中途打死
    const battle = quickBattle(['弗洛洛'], [{ name: '梦魇·赫卡忒', scale: { hp: 50, atk: 1, def: 1 } }]);
    expect(battle).toBeTruthy();
    const f = battle.team[0];
    // 必暴，排除随机
    f.crate = 1;

    const enemy = battle.enemies[0];
    const ei = 0;
    console.log('\n=== 面板 ===');
    console.log({
      atk: f.atk,
      cdmg: f.cdmg,
      crate: f.crate,
      heavyBonus: f.heavyBonus,
      normalBonus: f.normalBonus,
      skillBonus: f.skillBonus,
      elemHavoc: f.elemBonus?.['湮灭'] || 0,
      elemAll: f.elemAllBonus || 0,
      enemy: enemy.name,
      enemyElem: enemy.element,
      enemyHp: enemy.hp,
      enemyDef: enemy.def,
    });

    const hp0 = enemy.hp;
    const dmgHits = [];
    const track = (label) => {
      const last = [...battle.log].reverse().find(l => l.dmg != null && l.tgt === enemy.name);
      if (last) dmgHits.push({ label: label || last.action || last.type, dmg: last.dmg, crit: last.crit, type: last.type });
    };

    // T1: 技能 + 普攻 + 谱曲(2AP) = 4AP；解放 0AP
    expect(combat.doSkill(battle, ei).ok).toBe(true);
    track('技能');
    expect(combat.doAttack(battle, ei).ok).toBe(true);
    track('普攻');
    expect(f.furoloNotes).toBe(6);
    expect(combat.doHeavy(battle, ei).ok).toBe(true);
    track('谱曲终末#1');
    const dirge1 = dmgHits[dmgHits.length - 1];
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(f.furoloCommandTurns).toBe(3);

    // 指挥 3 回合：每回合尽量 技能/普攻填满，满乐声再谱曲
    for (let t = 1; t <= 3; t++) {
      combat.endTurn(battle);
      // 敌人可能反击扣血，忽略
      let guard = 0;
      while (battle.ap > 0 && guard++ < 8 && enemy.alive) {
        if ((f.furoloNotes || 0) >= 6 && battle.ap >= 2) {
          const r = combat.doHeavy(battle, ei);
          if (r.ok) { track(`T${t}谱曲`); continue; }
        }
        if ((f.cd?.skill || 0) <= 0 && battle.ap >= 1) {
          const r = combat.doSkill(battle, ei);
          if (r.ok) { track(`T${t}技能`); continue; }
        }
        const r = combat.doAttack(battle, ei);
        if (r.ok) track(`T${t}普攻`);
        else break;
      }
    }

    const totalFromEnemy = hp0 - enemy.hp;
    // log 里所有对敌伤害（含追击，有的记 type mechanic 不进 dmg 字段时用血量差）
    const logDmg = battle.log.filter(l => l.dmg && l.tgt === enemy.name).reduce((a, l) => a + l.dmg, 0);
    const mechDmg = battle.log
      .filter(l => l.type === 'mechanic' && /伤害/.test(l.msg || '') && (l.src === '弗洛洛' || l.src === '赫卡忒'))
      .map(l => {
        const m = String(l.msg).match(/（(\d[\d,]*) 伤害）/);
        return m ? Number(m[1].replace(/,/g, '')) : 0;
      })
      .reduce((a, n) => a + n, 0);

    console.log('\n=== 关键命中（主日志 dmg 字段）===');
    dmgHits.forEach(h => console.log(`  ${h.label}: ${h.dmg.toLocaleString()} crit=${h.crit}`));
    console.log('\n=== 汇总 ===');
    console.log({
      首发谱曲: dirge1?.dmg,
      主日志dmg合计: logDmg,
      机械追击解析: mechDmg,
      敌HP下降: totalFromEnemy,
      余响: f.furoloEchoes,
      指挥: f.furoloCommandTurns,
    });

    // 必须打出可观谱曲伤害；具体数值随武器/声骸面板浮动
    // 重设计后谱曲不再吃 3/6 链、敌人 DEF 对齐官方(1512)，首发谱曲 ~92k（设计目标 ~84k）
    expect(dirge1.dmg).toBeGreaterThan(80_000);
    expect(totalFromEnemy).toBeGreaterThan(dirge1.dmg);
  });
});
