// 敌人机制执行注册表 · 2026-06-25 世界 BOSS 移植
//
// enemies.js 负责数据，这里负责战斗中触发。
// combat.js 的 endTurn 调用 threshold / periodic / onHit 三个 hook。

function isMechanicTurn(m, turn) {
  return !!(m?.cycle && turn % m.cycle === 0);
}

function summonNameFor(enemy) {
  if (enemy.name === '聚械机偶') return '机偶小弟';
  if (enemy.name === '鸣式·利维亚坦') return '鸣式残响';
  return '幻象';
}

// ===== 共享 helper =====

function pickAliveTeam(battle) {
  const alives = battle.team.filter(t => t.alive);
  return alives.length ? alives : [];
}

function randomTeamTarget(battle) {
  const alives = pickAliveTeam(battle);
  return alives.length ? alives[Math.floor(Math.random() * alives.length)] : null;
}

// ===== 原有机制（保留） =====

const LEGACY_MECHANICS = {
  enrage: {
    threshold({ battle, enemy }) {
      const m = enemy.mechanic;
      if (enemy.enraged || enemy.hp / enemy.hpMax > m.threshold) return;
      enemy.atk = Math.round(enemy.atk * (1 + (m.atkBonus || 0.3)));
      enemy.enraged = true;
      // 梦魇亚当：狂暴 + 双动（splash/defDown 在 onHit 中处理）
      if (m.splash || m.defDown) {
        enemy._frenzyDouble = true;
      }
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `狂暴！攻击 +${((m.atkBonus||0.3)*100).toFixed(0)}%${enemy._frenzyDouble ? ' · 双动' : ''}` });
    }
  },
  shield: {
    threshold({ battle, enemy }) {
      const m = enemy.mechanic;
      if (enemy._shielded || enemy.hp / enemy.hpMax > m.threshold) return;
      enemy.shield = m.value;
      enemy._shielded = true;
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `生成护盾 ${m.value}！${m.airPhase ? ' · 进入空中阶段（近战伤害 -30%）' : ''}` });
      if (m.airPhase) enemy._airPhase = true;
    }
  },
  burn_team: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      if (!isMechanicTurn(m, battle.turn)) return;
      battle.team.forEach(t => {
        if (!t.alive) return;
        const dmg = Math.round(t.hpMax * (m.dmgPct || 0.05));
        const real = helpers.dealDamage(t, dmg);
        battle.log.push({ type: 'burn', src: enemy.name, tgt: t.name, dmg: real });
      });
    }
  },
  freeze: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      if (!isMechanicTurn(m, battle.turn)) return;
      const alives = pickAliveTeam(battle);
      if (!alives.length) return;
      const tgt = alives[Math.floor(Math.random() * alives.length)];
      helpers.inflictFreeze(tgt, 1);
      battle.log.push({ type: 'freeze', src: enemy.name, tgt: tgt.name });
    }
  },
  minion: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      if (!isMechanicTurn(m, battle.turn)) return;
      const sName = summonNameFor(enemy);
      const minion = helpers.spawnEnemy(sName, 1);
      if (!minion) return;
      minion.idx = 100 + battle.enemies.length;
      minion.isMinion = true;
      battle.enemies.push(minion);
      battle.log.push({ type: 'summon', src: enemy.name, tgt: sName });
    }
  },
  thunder_chain: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      if (!isMechanicTurn(m, battle.turn)) return;
      // 雷霆墙：锁切换
      if (m.wallLock) {
        const active = battle.team[battle.active];
        if (active?.alive) {
          active._wallLocked = (active._wallLocked || 0) + 2; // +2 因为回合末会 -1
          battle.log.push({ type: 'mechanic', src: enemy.name, msg: `雷霆墙！${active.name} 被锁定，1 回合内不可切换` });
        }
      }
      // 雷电连段
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '释放雷电连段' });
      const hits = m.wallLock ? 4 : 3;
      for (let i = 0; i < hits; i++) {
        const tgt = helpers.pickTeamTarget(battle, i === 0);
        if (!tgt) break;
        helpers.enemyAttack(battle, enemy, tgt, { mult: m.mult || 0.6, action: i === 0 ? '雷霆墙·首段' : '雷击' });
      }
    }
  },
  dive: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      if (!isMechanicTurn(m, battle.turn)) return;
      const tgt = helpers.pickTeamTarget(battle);
      if (!tgt) return;
      // 叹息古龙：俯冲可弹反
      if (m.diveMult && battle._heavyUsedThisTurn) {
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: `俯冲被 ${battle.team[battle.active]?.name} 弹反！眩晕 1 回合` });
        enemy._stunned = 1;
        return;
      }
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '俯冲压制' });
      helpers.enemyAttack(battle, enemy, tgt, { mult: m.diveMult || m.mult || 1.4, action: '俯冲' });
    }
  },
  aoe_freeze: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      // 冰翼盾（辉萤军势扩展）
      if (m.iceShieldCycle && battle.turn % m.iceShieldCycle === 0 && !enemy._iceShielded) {
        const shieldVal = Math.round(enemy.hpMax * (m.iceShieldPct || 0.25));
        enemy.shield = (enemy.shield || 0) + shieldVal;
        enemy._iceShielded = true;
        enemy._iceShieldDmgReduc = m.iceShieldDmgReduc || 0.5;
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: `展开冰翼盾 +${shieldVal}（减伤 ${((m.iceShieldDmgReduc||0.5)*100).toFixed(0)}%）！需削韧破盾` });
      }
      // 原 aoe_freeze 逻辑
      if (!isMechanicTurn(m, battle.turn)) return;
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '释放冰雾，全队受击并冻结当前角色' });
      battle.team.forEach(t => {
        if (!t.alive) return;
        helpers.enemyAttack(battle, enemy, t, { mult: m.mult || 0.45, action: '冰雾' });
      });
      const tgt = helpers.pickTeamTarget(battle);
      if (!tgt) return;
      helpers.inflictFreeze(tgt, 1);
      battle.log.push({ type: 'freeze', src: enemy.name, tgt: tgt.name });
    }
  },
  data_lock: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      if (!isMechanicTurn(m, battle.turn)) return;
      const alives = pickAliveTeam(battle);
      if (!alives.length) return;
      const tgt = alives[Math.floor(Math.random() * alives.length)];
      helpers.lockSkill(tgt, 1);
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `数据封锁 ${tgt.name} 的技能` });
    }
  },
  aero_erosion: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      if (!isMechanicTurn(m, battle.turn)) return;
      const tgt = helpers.pickTeamTarget(battle);
      if (!tgt) return;
      tgt.debuffs = tgt.debuffs || [];
      tgt.debuffs.push({ type: 'erosion', element: '气动', value: m.value || 0.15, duration: m.duration || 2 });
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `${tgt.name} 受到气动侵蚀` });
    }
  }
};

// ===== 新增机制 =====

const NEW_MECHANICS = {
  // 01 燎照之骑 · 灼伤标记
  inferno_mark: {
    threshold({ battle, enemy }) {
      const m = enemy.mechanic;
      if (enemy._phase2 || enemy.hp / enemy.hpMax > (m.threshold || 0.75)) return;
      enemy._phase2 = true;
      enemy.phase = 2;
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '燎照之骑踢飞摩托，进入步行阶段！攻击变为全队灼伤' });
    },
    onHit({ battle, enemy, target }) {
      const m = enemy.mechanic;
      if (!target?.alive) return;
      const stacks = m.phase1Stacks || 2;
      if (enemy._phase2) {
        // P2：全队各 1 层
        battle.team.forEach(t => {
          if (!t.alive) return;
          enemy.marks = enemy.marks || {};
          enemy.marks[t.idx] = (enemy.marks[t.idx] || 0) + 1;
        });
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: `步行阶段：全队各 +1 层灼伤` });
      } else {
        // P1：当前目标 +2 层
        enemy.marks = enemy.marks || {};
        enemy.marks[target.idx] = (enemy.marks[target.idx] || 0) + stacks;
        battle.log.push({ type: 'mechanic', src: enemy.name, tgt: target.name, msg: `+${stacks} 层灼伤（${enemy.marks[target.idx]}/${m.maxStacks || 5}）` });
      }
    },
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      const maxS = m.maxStacks || 5;
      // 回合末：每层灼伤 dot + 检查满层爆炸
      battle.team.forEach(t => {
        if (!t.alive) return;
        const stacks = (enemy.marks || {})[t.idx] || 0;
        if (stacks <= 0) return;
        // dot
        const dotDmg = Math.round(enemy.atk * (m.markDmgPct || 0.8) * stacks);
        const real = helpers.dealDamage(t, dotDmg);
        if (real > 0) battle.log.push({ type: 'burn', src: enemy.name, tgt: t.name, dmg: real, msg: `灼伤 ×${stacks}` });
        // 满层爆炸
        if (stacks >= maxS) {
          const burstDmg = Math.round(enemy.atk * (m.burstMult || 3.0));
          const burstReal = helpers.dealDamage(t, burstDmg);
          enemy.marks[t.idx] = 0;
          battle.log.push({ type: 'mechanic', src: enemy.name, tgt: t.name, msg: `💥 灼伤满层爆炸！${burstReal} 伤害` });
        }
      });
    }
  },

  // 05 哀声鸷 · 追踪弹 + 弹反俯冲
  parry_dive: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      // 追踪弹
      if (isMechanicTurn({ cycle: m.shotCycle || 3 }, battle.turn)) {
        const count = m.shotCount || 3;
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: `发射 ${count} 发追踪弹` });
        for (let i = 0; i < count; i++) {
          const tgt = randomTeamTarget(battle);
          if (!tgt) break;
          helpers.enemyAttack(battle, enemy, tgt, { mult: m.shotMult || 0.7, action: '追踪弹' });
        }
      }
      // 俯冲（弹反窗口）
      if (isMechanicTurn({ cycle: m.cycle || 5 }, battle.turn)) {
        if (battle._heavyUsedThisTurn) {
          const who = battle.team[battle.active];
          battle.log.push({ type: 'mechanic', src: enemy.name, msg: `俯冲被 ${who?.name} 弹反！BOSS 瘫痪 1 回合，受伤 +50%` });
          enemy._stunned = 1;
          enemy._vulnerable = 1; // 受伤 +50%
        } else {
          const tgt = helpers.pickTeamTarget(battle);
          if (tgt) helpers.enemyAttack(battle, enemy, tgt, { mult: m.diveMult || 2.0, action: '俯冲' });
        }
      }
    }
  },

  // 06 无常凶鹭 · 湮灭之蚀
  havoc_erosion: {
    onHit({ battle, enemy, target }) {
      if (!target?.alive) return;
      const m = enemy.mechanic;
      target.debuffs = target.debuffs || [];
      // 叠加湮灭之蚀
      let erosion = target.debuffs.find(d => d.type === 'havoc_erosion');
      if (!erosion) {
        erosion = { type: 'havoc_erosion', stacks: 0, duration: 3, dotPct: m.dotPct || 0.03 };
        target.debuffs.push(erosion);
      } else {
        erosion.duration = 3; // 刷新
      }
      erosion.stacks = Math.min((erosion.stacks || 0) + 1, m.maxStacks || 5);
      battle.log.push({ type: 'mechanic', src: enemy.name, tgt: target.name, msg: `湮灭之蚀 ${erosion.stacks}/${m.maxStacks || 5}` });
    },
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      // 回合末 dot + 满层蚀爆
      battle.team.forEach(t => {
        if (!t.alive) return;
        const erosion = (t.debuffs || []).find(d => d.type === 'havoc_erosion');
        if (!erosion || erosion.stacks <= 0) return;
        const dotDmg = Math.round(t.hpMax * (m.dotPct || 0.03) * erosion.stacks);
        const real = helpers.dealDamage(t, dotDmg);
        if (real > 0) battle.log.push({ type: 'mechanic', src: enemy.name, tgt: t.name, dmg: real, msg: `湮灭之蚀 ×${erosion.stacks}` });
        if (erosion.stacks >= (m.maxStacks || 5)) {
          const burstDmg = Math.round(enemy.atk * (m.burstMult || 2.0));
          const burstReal = helpers.dealDamage(t, burstDmg);
          erosion.stacks = 0;
          battle.log.push({ type: 'mechanic', src: enemy.name, tgt: t.name, msg: `💥 蚀爆！${burstReal} 伤害` });
        }
      });
      // 俯冲
      if (isMechanicTurn({ cycle: m.diveCycle || 5 }, battle.turn)) {
        if (battle._heavyUsedThisTurn) {
          battle.log.push({ type: 'mechanic', src: enemy.name, msg: `俯冲被弹反！BOSS 瘫痪 1 回合` });
          enemy._stunned = 1;
        } else {
          const tgt = helpers.pickTeamTarget(battle);
          if (tgt) helpers.enemyAttack(battle, enemy, tgt, { mult: m.diveMult || 1.8, action: '俯冲' });
        }
      }
      // 羽毛弹幕
      if (isMechanicTurn({ cycle: m.featherCycle || 3 }, battle.turn)) {
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: '羽毛弹幕 ×3' });
        for (let i = 0; i < 3; i++) {
          const tgt = randomTeamTarget(battle);
          if (!tgt) break;
          helpers.enemyAttack(battle, enemy, tgt, { mult: 0.6, action: '羽毛' });
        }
      }
    }
  },

  // 11 鸣钟之龟 · 反击姿态
  turtle_reflect: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      // 反击姿态
      if (isMechanicTurn({ cycle: m.cycle || 4 }, battle.turn)) {
        enemy._deflectActive = true;
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: '敲响龟壳钟！进入反击姿态（受到伤害反弹 40%）' });
      } else {
        enemy._deflectActive = false;
      }
      // 回旋 AOE
      if (isMechanicTurn({ cycle: m.spinCycle || 3 }, battle.turn)) {
        battle.team.forEach(t => {
          if (!t.alive) return;
          helpers.enemyAttack(battle, enemy, t, { mult: m.spinMult || 1.0, action: '回旋攻击' });
        });
      }
      // 冰息
      if (isMechanicTurn({ cycle: m.iceBreathCycle || 5 }, battle.turn)) {
        const tgt = helpers.pickTeamTarget(battle);
        if (tgt) {
          helpers.enemyAttack(battle, enemy, tgt, { mult: m.iceBreathMult || 1.4, action: '冰霜吐息' });
          helpers.inflictFreeze(tgt, 1);
        }
      }
    }
  },

  // 12 聚械机偶 · 残骸眩晕
  debris_stun: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      // 残骸掉落
      if (isMechanicTurn({ cycle: m.cycle || 5 }, battle.turn)) {
        enemy._debrisReady = true;
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: '金属残骸掉落！下回合可使用"投掷残骸"（0 AP，眩晕 BOSS 1 回合）' });
      }
      // 风壁
      if (isMechanicTurn({ cycle: m.windWallCycle || 4 }, battle.turn)) {
        enemy._windWallDmgReduc = m.windWallDmgReduc || 0.4;
        enemy._windWallTurns = m.windWallDuration || 2;
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: `召唤风壁！减伤 ${((m.windWallDmgReduc||0.4)*100).toFixed(0)}%，持续 ${m.windWallDuration||2} 回合` });
      }
      // 回旋 AOE
      if (isMechanicTurn({ cycle: m.spinCycle || 3 }, battle.turn)) {
        battle.team.forEach(t => {
          if (!t.alive) return;
          helpers.enemyAttack(battle, enemy, t, { mult: m.spinMult || 0.9, action: '旋转 AOE' });
        });
        enemy._spinRecovery = true; // 下回合攻击 -30%
      }
    }
  },

  // 13 罗蕾莱 · 自疗绿泡（不可弹反）
  bubble_heal: {
    threshold({ battle, enemy }) {
      const m = enemy.mechanic;
      if (enemy._phase2 || enemy.hp / enemy.hpMax > (m.threshold || 0.5)) return;
      enemy._phase2 = true;
      enemy.phase = 2;
      // Siren Song：首次进入 P2 召唤 3 泡
      if (m.sirenOnce && !enemy._sirenDone) {
        enemy._bubbleCount = 3;
        enemy._sirenDone = true;
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: '🎵 Siren Song！同时召唤 3 个绿泡' });
      }
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '进入第二阶段，泡泡频率翻倍' });
    },
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      const effCycle = enemy._phase2 ? Math.max(2, Math.floor((m.cycle || 4) / 2)) : (m.cycle || 4);
      if (battle.turn % effCycle !== 0) return;
      // 召唤绿泡
      const count = enemy._bubbleCount || 1;
      enemy._bubbleCount = 0; // 仅 Siren Song 用
      const bubbleHp = Math.round(enemy.atk * (m.bubbleHpMult || 2.0));
      enemy._bubbleHp = bubbleHp * count;
      enemy._bubbleHealAmt = Math.round(enemy.hpMax * (m.healPct || 0.15) * count);
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `召唤 ${count} 个绿泡（HP ${enemy._bubbleHp}，回合末回复 ${enemy._bubbleHealAmt}）· 攻击绿泡可抢治疗` });
    }
  },

  // 15 海之女 · 飞空无敌 + 延迟水洼
  flight_tide: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      // 飞空
      if (isMechanicTurn({ cycle: m.flightCycle || 5 }, battle.turn)) {
        enemy._flightTurns = 2; // +2 因为回合末 -1 = 实际 1 回合
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: '海之女飞空！1 回合内无敌' });
      }
      // 落地 AOE（飞空结束回合触发）
      if (enemy._flightTurns === 1 && !enemy._flightLanded) {
        enemy._flightLanded = true;
        battle.team.forEach(t => {
          if (!t.alive) return;
          helpers.enemyAttack(battle, enemy, t, { mult: m.landMult || 1.3, action: '落地水爆' });
        });
      }
      if (enemy._flightTurns <= 0) enemy._flightLanded = false;
      // 水洼
      const puddleCycle = enemy._phase2 ? Math.max(2, Math.floor((m.puddleCycle || 3) / 2)) : (m.puddleCycle || 3);
      if (battle.turn % puddleCycle === 0) {
        const tgt = helpers.pickTeamTarget(battle);
        if (tgt) {
          enemy._puddleTarget = tgt.idx;
          enemy._puddleDmg = Math.round(enemy.atk * (m.puddleMult || 1.2));
          battle.log.push({ type: 'mechanic', src: enemy.name, tgt: tgt.name, msg: `脚下水面发光…下回合爆炸` });
        }
      }
      // 水洼爆炸（上回合设置的）
      if (enemy._puddleTarget !== undefined && enemy._puddleDmg) {
        const tgt = battle.team[enemy._puddleTarget];
        if (tgt?.alive) {
          const real = helpers.dealDamage(tgt, enemy._puddleDmg);
          battle.log.push({ type: 'mechanic', src: enemy.name, tgt: tgt.name, dmg: real, msg: '水洼爆炸！' });
        }
        enemy._puddleTarget = undefined;
        enemy._puddleDmg = 0;
      }
      // 黑潮
      if (isMechanicTurn({ cycle: m.tideCycle || 4 }, battle.turn)) {
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: '黑潮！全队受击并眩晕' });
        battle.team.forEach(t => {
          if (!t.alive) return;
          helpers.enemyAttack(battle, enemy, t, { mult: m.tideMult || 0.8, action: '黑潮' });
          helpers.inflictFreeze(t, 1); // 复用冻结 = 眩晕
        });
      }
    }
  },

  // 14 无妄者 · 三阶段
  dreamless: {
    threshold({ battle, enemy }) {
      const m = enemy.mechanic;
      const hpPct = enemy.hp / enemy.hpMax;
      // P1→P2
      if (!enemy._p2 && hpPct <= (m.p1Threshold || 0.70) && hpPct > (m.p2Threshold || 0.40)) {
        enemy._p2 = true;
        enemy.phase = 2;
        enemy._transition = 1; // 过渡减伤 1 回合
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: '进入阶段二「剑·镰」！切换武器模式' });
      }
      // P2→P3
      if (!enemy._p3 && hpPct <= (m.p2Threshold || 0.40)) {
        enemy._p3 = true;
        enemy.phase = 3;
        enemy._transition = 1;
        enemy.atk = Math.round(enemy.atk * (1 + (m.p3AtkBonus || 0.3)));
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: `进入阶段三「红温」！攻击 +${((m.p3AtkBonus||0.3)*100).toFixed(0)}% · 双动` });
      }
    },
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      const tgt = helpers.pickTeamTarget(battle);
      if (!tgt) return;
      if (enemy.phase === 1 || !enemy._p2) {
        // P1 战戟：重戟攻击（endTurn 中已攻击一次，这里额外处理周期技）
        if (isMechanicTurn({ cycle: m.p1GrabCycle || 4 }, battle.turn)) {
          if (battle._heavyUsedThisTurn) {
            battle.log.push({ type: 'mechanic', src: enemy.name, msg: '重力拉人被挣脱！' });
          } else {
            helpers.enemyAttack(battle, enemy, tgt, { mult: m.p1GrabMult || 1.8, action: '重力拉人+戟降' });
            tgt._wallLocked = (tgt._wallLocked || 0) + 2; // 锁切换
          }
        }
      } else if (enemy.phase === 2) {
        // P2 剑镰：每回合 combo 2 段，虚空裂隙可弹反
        if (isMechanicTurn({ cycle: m.p2VoidCycle || 4 }, battle.turn)) {
          if (battle._heavyUsedThisTurn) {
            const reflectDmg = Math.round(tgt.atk * 1.5);
            helpers.dealDamage(enemy, reflectDmg);
            battle.log.push({ type: 'mechanic', src: tgt.name, msg: `弹反虚空戟！对 BOSS 造成 ${reflectDmg} 反伤` });
            enemy.vibration = Math.max(0, (enemy.vibration || 100) - 30);
          } else {
            helpers.enemyAttack(battle, enemy, tgt, { mult: m.p2VoidMult || 2.0, action: '虚空裂隙射戟' });
          }
        }
      } else if (enemy.phase === 3) {
        // P3 红温双动 + AOE
        if (isMechanicTurn({ cycle: m.p3AoeCycle || 3 }, battle.turn)) {
          battle.log.push({ type: 'mechanic', src: enemy.name, msg: '全屏爆炸！' });
          battle.team.forEach(t => {
            if (!t.alive) return;
            const mult = (t === tgt) ? (m.p3AoeMult || 1.5) : (m.p3AoeMult || 1.5) * 0.7;
            helpers.enemyAttack(battle, enemy, t, { mult, action: '全屏爆炸' });
          });
        }
      }
    }
  },

  // 16 荣耀狮像 · 浮空剑
  blade_turrets: {
    periodic({ battle, enemy, helpers }) {
      const m = enemy.mechanic;
      // 浮空剑射击
      if (isMechanicTurn({ cycle: m.turretCycle || 2 }, battle.turn)) {
        const count = m.turretCount || 2;
        for (let i = 0; i < count; i++) {
          const tgt = randomTeamTarget(battle);
          if (!tgt) break;
          helpers.enemyAttack(battle, enemy, tgt, { mult: m.turretMult || 0.5, action: '浮空剑射击' });
        }
      }
      // 矛雨
      if (isMechanicTurn({ cycle: m.spearCycle || 4 }, battle.turn)) {
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: '天降矛雨！' });
        battle.team.forEach(t => {
          if (!t.alive) return;
          helpers.enemyAttack(battle, enemy, t, { mult: m.spearMult || 0.9, action: '矛雨' });
        });
      }
      // 推刺（弹反窗口）
      if (isMechanicTurn({ cycle: m.thrustCycle || 5 }, battle.turn)) {
        if (battle._heavyUsedThisTurn) {
          battle.log.push({ type: 'mechanic', src: enemy.name, msg: '推刺被弹反！BOSS 瘫痪 1 回合' });
          enemy._stunned = 1;
          enemy.vibration = Math.max(0, (enemy.vibration || 100) - 40);
        } else {
          const tgt = helpers.pickTeamTarget(battle);
          if (tgt) helpers.enemyAttack(battle, enemy, tgt, { mult: m.thrustMult || 2.2, action: '蓄力推刺' });
        }
      }
    }
  }
};

// ===== 注册表合并 =====
const ALL_MECHANICS = { ...LEGACY_MECHANICS, ...NEW_MECHANICS };

// ===== 对外接口 =====

export function applyEnemyThresholdMechanic(ctx) {
  const type = ctx.enemy?.mechanic?.type;
  ALL_MECHANICS[type]?.threshold?.(ctx);
}

export function applyEnemyPeriodicMechanic(ctx) {
  const type = ctx.enemy?.mechanic?.type;
  ALL_MECHANICS[type]?.periodic?.(ctx);
}

// 新增：敌方攻击命中后的 hook（叠 mark / 叠 dot / 溅射 / 降防 / 冻结追踪）
export function applyEnemyOnHitMechanic(ctx) {
  const type = ctx.enemy?.mechanic?.type;
  ALL_MECHANICS[type]?.onHit?.(ctx);
}

// 新增：敌方被攻击时的 hook（反击姿态反弹 / 冰翼盾减伤）
export function applyEnemyDefendHook(enemy, dmg) {
  const m = enemy?.mechanic;
  if (!m || dmg <= 0) return dmg;
  // 冰翼盾减伤（辉萤军势 / 异构武装）
  if (enemy._iceShieldDmgReduc && enemy.shield > 0) {
    dmg = Math.round(dmg * (1 - enemy._iceShieldDmgReduc));
  }
  // 风壁减伤（聚械机偶）
  if (enemy._windWallDmgReduc && enemy._windWallTurns > 0) {
    dmg = Math.round(dmg * (1 - enemy._windWallDmgReduc));
  }
  // 过渡减伤（无妄者阶段切换）
  if (enemy._transition > 0) {
    dmg = Math.round(dmg * 0.5);
  }
  // 飞空无敌（海之女）
  if (enemy._flightTurns > 0 && enemy._flightTurns >= 2) {
    return 0; // 完全无敌
  }
  // 眩晕中（被弹反/残骸砸晕）
  if (enemy._stunned > 0) {
    dmg = Math.round(dmg * (1 + (enemy._vulnerable ? 0.5 : 0))); // 弹反瘫痪 +50% 易伤
  }
  return dmg;
}

// 新增：检查敌人是否可被攻击/命中
export function canTargetEnemy(enemy) {
  if (!enemy?.alive) return false;
  // 飞空无敌期间不可攻击
  if (enemy._flightTurns >= 2) return false;
  return true;
}
