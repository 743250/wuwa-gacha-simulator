// 副本面板（含日常副本 + 周本）
import { S, $ } from '../state.js';
import { DUNGEONS, WEEKLY_BOSS, parseEnemyStr, getWeeklyBossUsed, WEEKLY_BOSS_LIMIT, canUseWeeklyBoss, getDungeonEncounter } from '../battle/dungeon.js';
import { getCombatTeamNames } from '../battle/combat.js';
import { ENEMIES, formatEnemyMechanic } from '../battle/enemies.js';
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
  astrite:   { name: '星声', color: 'var(--gold)' }
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

function formatMechanics(enemyStrs) {
  const seen = new Set();
  const items = [];
  enemyStrs.forEach(s => {
    const p = parseEnemyStr(s);
    const e = ENEMIES[p.name];
    const text = formatEnemyMechanic(e?.mechanic);
    if (!text || seen.has(`${p.name}:${text}`)) return;
    seen.add(`${p.name}:${text}`);
    items.push(`<span>${p.name}：${text}</span>`);
  });
  return items.join(' · ');
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
  const versionInfo = getDungeonEncounter(DUNGEONS[0], S.today);
  html += `<div class="dng-top">
    <div class="dng-stamina">
      <div class="dng-stamina-label">结晶波片</div>
      <div class="dng-stamina-value">${S.stamina} / ${S.staminaMax}</div>
      <div class="dng-stamina-bar"><i style="width:${(S.stamina/S.staminaMax*100).toFixed(1)}%"></i></div>
      <div class="dng-stamina-note">推进到下一日补满 · 药剂超充上限 ${POT_CAP}</div>
    </div>
    <div class="dng-version">
      <div class="dng-stamina-label">版本敌方成长</div>
      <div class="dng-version-value">${versionInfo.version} · ×${versionInfo.versionScale.toFixed(2)}</div>
      <div class="dng-version-note">按当前版本自动抬高副本与深塔敌方数值</div>
    </div>
    <div class="dng-actions">
      <button class="mbtn" onclick="window.__usePotion('condensed_waveplate',1)" ${condensed <= 0 || S.stamina >= POT_CAP ? 'disabled' : ''} title="官方上限 5">凝缩 ${condensed}/5</button>
      <button class="mbtn gold" onclick="window.__usePotion('crystal_solvent',1)" ${solvent <= 0 || S.stamina >= POT_CAP ? 'disabled' : ''}>溶剂 ×${solvent}</button>
      <button class="mbtn" onclick="window.__buyStamina()" ${S.astrite < 60 || S.stamina >= POT_CAP ? 'disabled' : ''} title="紧急补救 · 60 星声换 60 波片">60⭐ 补体力</button>
    </div>
  </div>`;

  const minCost = Math.min(...DUNGEONS.map(d => d.cost).filter(Boolean));
  if (S.stamina < minCost) {
    html += `<div class="dng-alert">
      ⚠ 当前结晶波片不足，至少需要 ${minCost} 点。可先使用上方凝缩波片 / 结晶溶剂，或推进到下一日补满。
    </div>`;
  }

  if (teamCount === 0) {
    html += '<div class="dng-alert red">⚠ 编队为空或队员已失效，先去【编队】面板组队</div>';
  }

  const weeklyUsed = getWeeklyBossUsed();
  const weeklyLeft = Math.max(0, WEEKLY_BOSS_LIMIT - weeklyUsed);
  const groups = [
    { type: 'exp', title: '模拟战训', desc: '共鸣经验 · 升级角色' },
    { type: 'weapon', title: '凝素领域', desc: '武器/技能材料 · 升级武器' },
    { type: 'echo', title: '无音清剿', desc: '声骸养成 · 促剂与武器石' },
    { type: 'overlord', title: '讨伐强敌', desc: '大世界 Boss · 突破养成材料' },
    { type: 'weekly', title: '战歌重奏', desc: weeklyLeft > 0 ? `高阶技能材料 · 本周剩余 ${weeklyLeft}/${WEEKLY_BOSS_LIMIT}` : `高阶技能材料 · 本周已用完 ${WEEKLY_BOSS_LIMIT}/${WEEKLY_BOSS_LIMIT}`, weekly: true }
  ];

  html += '<div class="dng-sections">';
  groups.forEach(g => {
    const list = DUNGEONS.filter(d => d.type === g.type);
    if (!list.length) return;
    html += `<section class="dng-section ${g.weekly ? 'weekly' : ''}">
      <div class="dng-section-head">
        <div>
          <h2>${g.title}</h2>
          <p>${g.desc}</p>
        </div>
        <span>${list.length} 项</span>
      </div>
      <div class="dng-grid">`;
    list.forEach(d => {
      const isWeekly = !!d.weeklyLimit;
      const canAfford = S.stamina >= d.cost && teamCount > 0 && (!isWeekly || canUseWeeklyBoss());
      html += renderDungeonCard(d, canAfford, isWeekly);
    });
    html += '</div></section>';
  });
  html += '</div>';

  container.innerHTML = html;
}

function renderDungeonCard(d, canAfford, isWeekly = false) {
  const encounter = getDungeonEncounter(d, S.today);
  const minLv = d.minLevel ? `<span>推荐 ${d.minLevel}+</span>` : '';
  const poolSize = d.encounterPool?.length || 1;
  const enemyHtml = formatEnemies(encounter.enemies);
  const mechanicHtml = formatMechanics(encounter.enemies);
  const dropHtml = formatDrops(d.drops);
  const disabledLabel = S.stamina < d.cost
    ? `缺 ${d.cost - S.stamina} 体力`
    : (isWeekly && !canUseWeeklyBoss() ? '本周已满' : '需编队');

  return `<article class="dng-card ${isWeekly ? 'weekly' : ''}">
    <div class="dng-card-top">
      <div>
        <div class="dng-card-name">${d.name}</div>
        <div class="dng-card-meta"><b>${d.cost}</b> 波片${minLv}</div>
      </div>
      <button class="mbtn gold" onclick="window.__startDungeon('${d.id}')" ${!canAfford ? 'disabled' : ''}>${canAfford ? '挑战' : disabledLabel}</button>
    </div>
    <div class="dng-encounter">
      <div class="dng-label">今日敌情</div>
      <div class="dng-enemies">${enemyHtml}</div>
      ${mechanicHtml ? `<div class="dng-mechanics">${mechanicHtml}</div>` : ''}
      <div class="dng-pool">${encounter.tag} · 敌池 ${poolSize} 组 · ${encounter.version} 敌强 ×${encounter.versionScale.toFixed(2)} · 隔日刷新</div>
    </div>
    <div class="dng-drops">
      <div class="dng-label">奖励</div>
      <div>${dropHtml}</div>
    </div>
  </article>`;
}
