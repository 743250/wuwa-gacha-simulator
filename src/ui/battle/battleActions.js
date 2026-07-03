// 战斗全屏 UI 的 window handler 组（普攻/技能/重击/解放/切换/结算等）
import { S, msg } from '../../state.js';
import { doAttack, doSkill, doHeavy, doBurst, doSwitch, doDebris, endTurn } from '../../battle/combat.js';
import { onBattleResult, getSol3Config, getSol3Level } from '../../battle/dungeon.js';
import { spendStamina } from '../../daily/stamina.js';
import { generateEcho } from '../../equip/echoActions.js';
import { getEchoesBySet } from '../../data/echoes.js';
import { settleAbyss } from '../../daily/abyss.js';
import { settleWastes } from '../../daily/wastes.js';
import { progressTask } from '../../podcast/core.js';
import { consumeWeeklyBoss } from '../../battle/dungeon.js';

export function registerBattleActions({
  getCurrentBattle,
  getPendingDungeon,
  refreshAll,
  hideBattleScreen,
  rerenderAfterBattle,
}) {
  window.__bAtk = (idx) => {
    const r = doAttack(getCurrentBattle(), idx);
    if (!r.ok) msg(r.err);
    else refreshAll();
  };
  window.__bTarget = (idx) => {
    const cb = getCurrentBattle();
    if (!cb || cb.finished) return;
    if (cb.enemies[idx]?.alive) {
      cb.targetIdx = idx;
      refreshAll();
    }
  };
  window.__bSkill = (idx) => {
    const r = doSkill(getCurrentBattle(), idx);
    if (!r.ok) msg(r.err);
    else refreshAll();
  };
  window.__bHeavy = (idx) => {
    const r = doHeavy(getCurrentBattle(), idx);
    if (!r.ok) msg(r.err);
    else refreshAll();
  };
  window.__bBurst = () => {
    const r = doBurst(getCurrentBattle());
    if (!r.ok) msg(r.err);
    else refreshAll();
  };
  window.__bDebris = () => {
    const r = doDebris(getCurrentBattle());
    if (!r.ok) msg(r.err);
    else refreshAll();
  };
  window.__bSwitch = (i) => {
    const r = doSwitch(getCurrentBattle(), i);
    if (!r.ok) msg(r.err);
    else refreshAll();
  };
  window.__bEndTurn = () => {
    endTurn(getCurrentBattle());
    refreshAll();
  };
  window.__bClose = () => {
    // 三档机制：失败 -20 级
    const pd = getPendingDungeon();
    const cb = getCurrentBattle();
    if (pd && pd.kind === 'dungeon' && cb && cb.result === 'lose') {
      const newLv = onBattleResult(pd.d, 'lose');
      msg(`${pd.d.name} 敌人等级降至 Lv${newLv}`, false);
    }
    hideBattleScreen();
    rerenderAfterBattle();
  };
  window.__bSettle = () => {
    const pd = getPendingDungeon();
    const cb = getCurrentBattle();
    if (!pd) { hideBattleScreen(); return; }
    if (pd.kind === 'dungeon') {
      if (!pd.paidCost) {
        spendStamina(pd.d.cost);
        if (pd.d.weeklyLimit) consumeWeeklyBoss();
        pd.paidCost = true;
      }
      const rawDrops = pd.d.drops || {};
      const sol3 = getSol3Config(getSol3Level());
      const dropMult = sol3.dropMult;
      const drops = {};
      Object.entries(rawDrops).forEach(([k, v]) => {
        // 星声不收世界等级加成，其余材料按 SOL3 倍率缩放
        // echo_set/echo_count 是元字段（字符串/数组/整数），不参与倍率缩放
        if (k === 'astrite' || k === 'echo_set' || k === 'echo_count') { drops[k] = v; return; }
        drops[k] = Math.round(v * dropMult);
      });
      const rewardText = [];
      if (drops.exp_super) { S.materials.exp_super += drops.exp_super; rewardText.push(`特级共鸣促剂 ×${drops.exp_super}`); }
      if (drops.exp_high) { S.materials.exp_high += drops.exp_high; rewardText.push(`高级共鸣促剂 ×${drops.exp_high}`); }
      if (drops.exp_mid) { S.materials.exp_mid += drops.exp_mid; rewardText.push(`中级共鸣促剂 ×${drops.exp_mid}`); }
      if (drops.exp_low) { S.materials.exp_low += drops.exp_low; rewardText.push(`初级共鸣促剂 ×${drops.exp_low}`); }
      if (drops.weapon_book) { S.materials.weapon_book += drops.weapon_book; rewardText.push(`武器石 ×${drops.weapon_book}`); }
      if (drops.echo_tuner) { S.materials.echo_tuner += drops.echo_tuner; rewardText.push(`声骸调谐器 ×${drops.echo_tuner}`); }
      if (drops.astrite) { S.astrite += drops.astrite; rewardText.push(`星声 +${drops.astrite}`); }
      // 声骸掉落：按套装筛选并生成 echo（echo_set 支持数组 → 多套随机选一）
      // pool 存 { echo, setId } 对，掉落时把声骸归到该无音区目标套装（多套装声骸不再错位）
      if (drops.echo_set) {
        const setIds = Array.isArray(drops.echo_set) ? drops.echo_set : [drops.echo_set];
        const pool = [];
        for (const sid of setIds) {
          const part = getEchoesBySet(sid);
          for (const echo of part) pool.push({ echo, setId: sid });
        }
        if (pool.length) {
          const n = drops.echo_count || 1;
          const rolled = [];
          for (let i = 0; i < n; i++) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            const e = generateEcho(pick.echo.id, pick.setId);
            if (e) rolled.push(e.name);
          }
          if (rolled.length) rewardText.push(`声骸 ×${rolled.length}: ${rolled.join(' · ')}`);
        }
      }
      // 电台任务：副本完成
      progressTask('d_dungeon', 1);
      progressTask('w_dungeon', 1);
      if (pd.d.weeklyLimit) {
        progressTask('w_weeklyboss', 1);
        progressTask('p_weeklyboss', 1);
      }
      msg('获得 ' + rewardText.join(' · '), false);
      // 三档机制：所有副本胜负都调整敌人等级
      if (cb) {
        if (cb.result === 'win') {
          const newLv = onBattleResult(pd.d, 'win');
          msg(`🏆 ${pd.d.name} 敌人等级提升至 Lv${newLv}`, false);
        } else if (cb.result === 'lose') {
          const newLv = onBattleResult(pd.d, 'lose');
          msg(`${pd.d.name} 敌人等级降至 Lv${newLv}`, false);
        }
      }
    } else if (pd.kind === 'abyss') {
      const r = settleAbyss(cb);
      if (r) {
        progressTask('w_abyss', 1);
        progressTask('p_abyss', 1);
        if (r.repeated) msg(`${r.name} · 本次未更新评星，无重复奖励`, false);
        else msg(`${r.name} ★${r.stars} · +${r.reward} 星声`, false);
      }
    } else if (pd.kind === 'wastes') {
      const r = settleWastes(cb);
      if (r) {
        if (r.repeated) msg(`${r.name} · 本次未刷新最高分`, false);
        else {
          const tierTxt = r.tierReward > 0 ? ` · 🎁 积分档位 +${r.tierReward} 星声` : '';
          msg(`${r.name} · ${r.score.toLocaleString()} 分（累计 ${r.cumulative.toLocaleString()}）${tierTxt}`, false);
        }
      }
    }
    hideBattleScreen();
    rerenderAfterBattle();
  };
}
