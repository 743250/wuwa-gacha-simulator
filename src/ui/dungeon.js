// 副本面板（含日常副本 + 周本）
import { S, $ } from '../state.js';
import { DUNGEONS, WEEKLY_BOSS, parseEnemyStr, getWeeklyBossUsed, WEEKLY_BOSS_LIMIT, canUseWeeklyBoss } from '../battle/dungeon.js';
import { getCombatTeamNames } from '../battle/combat.js';
import { ENEMIES } from '../battle/enemies.js';
import { ELEMENT_COLOR } from '../battle/elements.js';
import './battle.js';   // 副作用：注册 window.__startDungeon

// 把周本合并到查找池（battle.js 通过 DUNGEONS.find 来取配置）
WEEKLY_BOSS.forEach(b => {
  if (!DUNGEONS.find(x => x.id === b.id)) DUNGEONS.push(b);
});

// 奖励字段 → 中文 + 颜色映射
const DROP_LABEL = {
  exp_super: { name: '特级共鸣促剂', color: 'var(--gold)' },
  exp_high:  { name: '高级共鸣促剂', color: '#fff' },
  exp_mid:   { name: '中级共鸣促剂', color: 'var(--accent)' },
  exp_low:   { name: '初级共鸣促剂', color: 'var(--green)' },
  weapon_book: { name: '武器突破石', color: 'var(--gold)' },
  astrite:   { name: '星声',         color: 'var(--gold)' }
};

function formatDrops(drops) {
  if (!drops) return '';
  return Object.entries(drops).map(([k, v]) => {
    const d = DROP_LABEL[k];
    if (!d) return `${k} ×${v}`;
    return `<span style="color:${d.color}">${d.name} ×${v}</span>`;
  }).join(' · ');
}

function formatEnemies(enemyStrs) {
  return enemyStrs.map(s => {
    const p = parseEnemyStr(s);
    const e = ENEMIES[p.name];
    if (!e) return `${p.name}${p.count > 1 ? '×' + p.count : ''}`;
    const ec = ELEMENT_COLOR[e.element] || '#fff';
    return `<span style="color:${ec}">${p.name}</span>${p.count > 1 ? `<span style="color:var(--muted)">×${p.count}</span>` : ''}`;
  }).join(' · ');
}

export function renderDungeon() {
  const container = $('paneDungeon');
  if (!container) return;
  const teamCount = getCombatTeamNames().length;
  let html = '';

  // 体力条 + 凝缩波片 + 结晶溶剂 + 星声补体力
  const solvent = S.materials.crystal_solvent || 0;
  const condensed = S.materials.condensed_waveplate || 0;
  const POT_CAP = 480;
  html += `<div style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:12px;background:rgba(141,230,166,.04)">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:11px;color:var(--muted);letter-spacing:2px">结晶波片</span>
      <span style="font-size:16px;font-weight:700;color:var(--green)">${S.stamina} / ${S.staminaMax}</span>
    </div>
    <div style="height:5px;background:rgba(255,255,255,.06);border-radius:3px;margin-top:6px;overflow:hidden">
      <div style="height:100%;width:${(S.stamina/S.staminaMax*100).toFixed(1)}%;background:linear-gradient(90deg,var(--green),#cff7d6)"></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;flex-wrap:wrap;gap:6px">
      <div style="font-size:10px;color:var(--muted)">推进到下一日可补满 · 上限 480（含药剂超充）</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button class="mbtn" style="font-size:10px;padding:4px 8px" onclick="window.__usePotion('condensed_waveplate',1)" ${condensed <= 0 || S.stamina >= POT_CAP ? 'disabled' : ''} title="官方上限 5">凝缩波片 ${condensed}/5</button>
        <button class="mbtn gold" style="font-size:10px;padding:4px 8px" onclick="window.__usePotion('crystal_solvent',1)" ${solvent <= 0 || S.stamina >= POT_CAP ? 'disabled' : ''}>结晶溶剂 ×${solvent}</button>
        <button class="mbtn" style="font-size:10px;padding:4px 8px" onclick="window.__buyStamina()" ${S.astrite < 60 || S.stamina >= POT_CAP ? 'disabled' : ''} title="紧急补救 · 60 星声换 60 波片">60⭐ → 60 波片</button>
      </div>
    </div>
  </div>`;

  const minCost = Math.min(...DUNGEONS.map(d => d.cost).filter(Boolean));
  if (S.stamina < minCost) {
    html += `<div style="color:var(--gold);text-align:center;padding:9px 10px;font-size:12px;border:1px dashed rgba(245,207,107,.55);border-radius:8px;margin-bottom:12px;background:rgba(245,207,107,.05)">
      ⚠ 当前结晶波片不足，至少需要 ${minCost} 点。可先使用上方凝缩波片 / 结晶溶剂，或推进到下一日补满。
    </div>`;
  }

  if (teamCount === 0) {
    html += '<div style="color:var(--red);text-align:center;padding:10px;font-size:12px;border:1px dashed var(--red);border-radius:8px;margin-bottom:12px">⚠ 编队为空或队员已失效，先去【编队】面板组队</div>';
  }

  // 经验本
  const expDungeons = DUNGEONS.filter(d => d.type === 'exp');
  if (expDungeons.length) {
    html += '<h2 class="col-head" style="margin-top:0">模 拟 战 训 <span style="font-size:10px;color:var(--dim);font-weight:400;letter-spacing:1px;margin-left:6px">共鸣经验 · 升级角色</span></h2>';
    expDungeons.forEach(d => {
      const canAfford = S.stamina >= d.cost && teamCount > 0;
      html += renderDungeonCard(d, canAfford);
    });
  }

  // 武器本
  const wpDungeons = DUNGEONS.filter(d => d.type === 'weapon');
  if (wpDungeons.length) {
    html += '<h2 class="col-head" style="margin-top:14px">凝 素 领 域 <span style="font-size:10px;color:var(--dim);font-weight:400;letter-spacing:1px;margin-left:6px">武器/技能材料 · 升级武器</span></h2>';
    wpDungeons.forEach(d => {
      const canAfford = S.stamina >= d.cost && teamCount > 0;
      html += renderDungeonCard(d, canAfford);
    });
  }

  // 无音清剿（声骸）
  const echoDungeons = DUNGEONS.filter(d => d.type === 'echo');
  if (echoDungeons.length) {
    html += '<h2 class="col-head" style="margin-top:14px">无 音 清 剿 <span style="font-size:10px;color:var(--dim);font-weight:400;letter-spacing:1px;margin-left:6px">声骸 · 60 波片（模拟器抽象为星声+材料）</span></h2>';
    echoDungeons.forEach(d => {
      const canAfford = S.stamina >= d.cost && teamCount > 0;
      html += renderDungeonCard(d, canAfford);
    });
  }

  // 讨伐强敌（大世界 BOSS）
  const overlordDungeons = DUNGEONS.filter(d => d.type === 'overlord');
  if (overlordDungeons.length) {
    html += '<h2 class="col-head" style="margin-top:14px">讨 伐 强 敌 <span style="font-size:10px;color:var(--dim);font-weight:400;letter-spacing:1px;margin-left:6px">大世界 BOSS · 60 波片 · 角色突破素材</span></h2>';
    overlordDungeons.forEach(d => {
      const canAfford = S.stamina >= d.cost && teamCount > 0;
      html += renderDungeonCard(d, canAfford);
    });
  }

  // 战歌重奏（周本）
  const weeklyDungeons = DUNGEONS.filter(d => d.type === 'weekly');
  if (weeklyDungeons.length) {
    const used = getWeeklyBossUsed();
    const left = Math.max(0, WEEKLY_BOSS_LIMIT - used);
    const limitTag = left > 0
      ? `<span style="font-size:11px;color:var(--gold);margin-left:8px">本周剩余 ${left} / ${WEEKLY_BOSS_LIMIT} 次（共享）</span>`
      : `<span style="font-size:11px;color:var(--red);margin-left:8px">本周已用完（${WEEKLY_BOSS_LIMIT}/${WEEKLY_BOSS_LIMIT}）</span>`;
    html += `<h2 class="col-head" style="margin-top:14px">战 歌 重 奏 ${limitTag}</h2>`;
    weeklyDungeons.forEach(d => {
      const canAfford = S.stamina >= d.cost && teamCount > 0 && canUseWeeklyBoss();
      html += renderDungeonCard(d, canAfford, true);
    });
  }

  container.innerHTML = html;
}

function renderDungeonCard(d, canAfford, isWeekly = false) {
  const titleColor = isWeekly ? 'var(--gold)' : 'var(--text)';
  const borderColor = isWeekly ? 'rgba(245,207,107,.5)' : 'var(--line)';
  const bg = isWeekly ? 'rgba(245,207,107,.05)' : 'rgba(255,255,255,.02)';
  const minLv = d.minLevel ? `<span style="color:var(--dim);font-size:9px">推荐等级 ${d.minLevel}+</span>` : '';
  const staminaTag = `<span style="color:var(--green);font-size:11px;font-weight:600">体力 ${d.cost}</span>`;
  const enemyHtml = formatEnemies(d.enemies);
  const dropHtml = formatDrops(d.drops);
  const disabledLabel = S.stamina < d.cost
    ? `缺 ${d.cost - S.stamina} 体力`
    : (isWeekly && !canUseWeeklyBoss() ? '本周已满' : '需编队');

  return `<div style="border:1px solid ${borderColor};border-radius:10px;padding:11px 13px;margin-bottom:7px;background:${bg};border-bottom:2px solid ${borderColor}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">
          <span style="font-size:13px;font-weight:700;color:${titleColor};letter-spacing:1px">${d.name}</span>
          ${staminaTag}
          ${minLv}
        </div>
      </div>
      <button class="mbtn gold" onclick="window.__startDungeon('${d.id}')" ${!canAfford ? 'disabled' : ''}>${canAfford ? '挑 战' : disabledLabel}</button>
    </div>
    <div style="font-size:10px;color:var(--muted);line-height:1.6;border-top:1px dashed var(--line);padding-top:5px">
      <div>⚔ <span style="color:var(--dim)">敌人：</span>${enemyHtml}</div>
      <div style="margin-top:2px">🎁 <span style="color:var(--dim)">奖励：</span>${dropHtml}</div>
    </div>
  </div>`;
}
