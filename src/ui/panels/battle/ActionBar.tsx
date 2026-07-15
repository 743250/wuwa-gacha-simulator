// 动作按钮 + 技能面板
import { h } from 'preact';
import { canAttack, canSkill, canHeavy, canBurst, evaluateStars } from '../../../battle/combat.js';
import { STAR_CRITERIA } from '../../../battle/balance.js';
import { bAtk, bSkill, bHeavy, bBurst, bDebris, bEndTurn, bClose, bSettle } from '../../../ui/battle/battleActions.js';
import { displayName } from './helpers';

interface ActionBarProps {
  battle: any;
  pendingDungeon: any;
}

function SkillPanel({ cur }: { cur: any }) {
  if (!cur) return null;
  const f = cur.forte;
  const wName = cur.weapon?.name;
  let fStatus: any = '';
  if (f) {
    if (!f.ready) {
      fStatus = `${f.resourceName} ${f.current}/${f.max}`;
    } else if (f.effectType === 'shorekeeperField') {
      fStatus = <span class="bf-skill-ready">✦ {f.resourceName}已就绪 · 解放可展开星域</span>;
    } else {
      const actionName = f.effectType === 'enhancedSkill' ? '技能'
        : f.effectType === 'enhancedBurst' ? '解放' : '普攻';
      const multText = Number.isFinite(f.effectMult) ? ` ×${f.effectMult.toFixed(1)}` : '';
      fStatus = <span class="bf-skill-ready">✦ {f.resourceName}已就绪 · 下次{actionName}强化{multText}</span>;
    }
  }

  return (
    <div class="bf-skill-panel">
      <div class="bf-skill-head">
        <span class="bf-skill-name">{displayName(cur)}</span>
        <span class="bf-skill-meta">
          {cur.element} · {cur.type}{wName ? ` · ${wName}` : ''}
        </span>
      </div>
      {f && (
        <>
          <div class="bf-skill-status">{fStatus}</div>
          {f.desc && <div class="bf-skill-desc">{f.desc}</div>}
        </>
      )}
    </div>
  );
}

export function ActionBar({ battle, pendingDungeon }: ActionBarProps) {
  if (battle.finished) {
    if (battle.result === 'win') {
      const isDungeon = pendingDungeon?.kind === 'dungeon';
      let starStr: string | null = null, starLabel: string | null = null;
      if (!isDungeon) {
        // 深塔/海墟：用 STAR_CRITERIA（与 settleAbyss 一致）；勿用 evaluateStars 默认 turnLimit=3
        const isAbyss = pendingDungeon?.kind === 'abyss';
        let stars = 1;
        if (isAbyss) {
          const alive = battle.team.filter((t: any) => t.alive);
          const pool = alive.length ? alive : battle.team;
          const hpPct = pool.length
            ? pool.reduce((a: number, t: any) => a + (t.hpMax > 0 ? t.hp / t.hpMax : 0), 0) / pool.length
            : 0;
          const turn = battle.turn || 0;
          if (turn <= STAR_CRITERIA.threeStar.turn && hpPct >= STAR_CRITERIA.threeStar.hp) stars = 3;
          else if (turn <= STAR_CRITERIA.twoStar.turn && hpPct >= STAR_CRITERIA.twoStar.hp) stars = 2;
          else stars = 1;
        } else {
          stars = evaluateStars(battle, STAR_CRITERIA.oneStar.turn, STAR_CRITERIA.twoStar.hp);
        }
        starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        starLabel = stars === 3 ? '完美通关' : stars === 2 ? '高效通关' : '通关';
      }
      return (
        <div class="bf-result win">
          <div class="bf-result-title">胜 利</div>
          {starStr && <div class="bf-result-stars">{starStr}</div>}
          <div class="bf-result-sub">
            用 {battle.turn} 回合通关{starLabel ? ` · ${starLabel}` : ''}
          </div>
          <button class="bf-result-btn primary" onClick={() => bSettle()}>
            领 取 奖 励
          </button>
        </div>
      );
    }
    return (
      <div class="bf-result lose">
        <div class="bf-result-title">战 斗 失 败</div>
        <button class="bf-result-btn" onClick={() => bClose()}>
          关 闭
        </button>
      </div>
    );
  }

  const cur = battle.team[battle.active];
  if (!cur) return null;

  if (battle.targetIdx == null || !battle.enemies[battle.targetIdx]?.alive) {
    battle.targetIdx = battle.enemies.findIndex((e: any) => e.alive);
  }
  const enemyIdx = battle.targetIdx;
  const hasTarget = enemyIdx >= 0;
  const canAtk = canAttack(cur, battle, enemyIdx).ok;
  const canSkillOk = canSkill(cur, battle, enemyIdx).ok;
  const canHeavyOk = canHeavy(cur, battle, enemyIdx).ok;
  const canBurstOk = canBurst(cur, battle).ok;
  const showHeavy = !!cur.hasHeavy;
  const cols = showHeavy ? 4 : 3;

  const isFurolo = cur.name === '弗洛洛';
  const furoloBurstReady = isFurolo && !!cur.furoloDirge;
  const hasDebris = battle.enemies.some((e: any) => e.alive && e._debrisReady);

  const blocker = (() => {
    if (cur && !cur.alive) return '当前角色已倒下，请切换队员';
    if (cur && cur.frozenTurns > 0) return `${displayName(cur)} 被冻结（剩余 ${cur.frozenTurns} 回合），请切换队员或结束回合`;
    if (cur && cur.skillLockedTurns > 0) return `${displayName(cur)} 技能被封锁（剩余 ${cur.skillLockedTurns} 回合）`;
    if (!hasTarget) return '当前没有活着的敌人';
    if (battle.ap <= 0) return `AP 已耗尽（0/${battle.apMax}），请点击「结束回合」`;
    return '';
  })();

  const burstSub = isFurolo
    ? (furoloBurstReady ? '定音 · 可解放' : '需定音')
    : `3 AP · ${cur.energy}/${cur.energyMax}`;

  const burstHint = isFurolo
    ? '弗洛洛 · 0 AP · 需定音状态 · 进入指挥状态 + 赫卡忒召唤'
    : '主目标 400% · 副目标 200% · AOE · 需能量满 · 削破韧 30';

  return (
    <div class="bf-action-bar">
      <SkillPanel cur={cur} />

      {blocker && (
        <div class="bf-blocker">⚠ {blocker}</div>
      )}

      <div class="bf-action-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        <button
          class={`bbtn bf-act ${canAtk ? 'lit atk' : ''}`}
          onClick={() => bAtk(enemyIdx)}
          disabled={!canAtk}
          title="100% 攻击 · +12 能量 · 削破韧 8"
        >
          <span class="bf-act-main">⚔ 普攻</span>
          <span class="bf-act-sub">1 AP</span>
        </button>

        <button
          class={`bbtn bf-act ${canSkillOk ? 'lit skill' : ''}`}
          onClick={() => bSkill(enemyIdx)}
          disabled={!canSkillOk}
          title="180% 攻击 · CD 3 回合 · +22 能量 · 削破韧 20"
        >
          <span class="bf-act-main">✦ 技能</span>
          <span class="bf-act-sub">1 AP{cur.cd.skill > 0 ? ` · CD${cur.cd.skill}` : ''}</span>
        </button>

        {showHeavy && (
          <button
            class={`bbtn bf-act ${canHeavyOk ? 'lit heavy' : ''}`}
            onClick={() => bHeavy(enemyIdx)}
            disabled={!canHeavyOk}
            title="220% 攻击 · 重击伤害类型 · CD 1 回合 · +15 能量 · 削破韧 25"
          >
            <span class="bf-act-main">💢 重击</span>
            <span class="bf-act-sub">2 AP{cur.cd.heavy > 0 ? ` · CD${cur.cd.heavy}` : ''}</span>
          </button>
        )}

        <button
          class={`bbtn bf-act ${canBurstOk ? 'lit burst' : ''}`}
          onClick={() => bBurst()}
          disabled={!canBurstOk}
          title={burstHint}
        >
          <span class="bf-act-main">⚡ 解放</span>
          <span class="bf-act-sub">{burstSub}</span>
        </button>
      </div>

      {hasDebris && (
        <button class="bf-debris-btn" onClick={() => bDebris()}>
          ⚙ 投掷残骸（0 AP · 眩晕 BOSS 1 回合）
        </button>
      )}

      <button class="bf-end-btn" onClick={() => bEndTurn()}>
        结 束 回 合
      </button>
    </div>
  );
}
