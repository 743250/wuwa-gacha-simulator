// 副本面板（左 Tab 切换五类副本）
import { S, $ } from '../state.js';
import { DUNGEONS, WEEKLY_BOSS, parseEnemyStr, getWeeklyBossUsed, WEEKLY_BOSS_LIMIT, canUseWeeklyBoss, getDungeonEncounter, getSol3Level, getSol3Config, setSol3Level, SOL3_LEVELS, getBossLevel, getWorldBossSpawnOpts } from '../battle/dungeon.js';
import { getCombatTeamNames } from '../battle/combat.js';
import { ENEMIES, formatEnemyMechanic } from '../battle/enemies.js';
import { ELEMENT_COLOR } from '../battle/elements.js';
import { getSetById } from '../data/echoes.js';
import './battle.js';

WEEKLY_BOSS.forEach(b => {
  if (!DUNGEONS.find(x => x.id === b.id)) DUNGEONS.push(b);
});

const DROP_LABEL = {
  exp_super: { name: '特级共鸣促剂', color: 'var(--gold)' },
  exp_high:  { name: '高级共鸣促剂', color: '#fff' },
  exp_mid:   { name: '中级共鸣促剂', color: 'var(--accent)' },
  exp_low:   { name: '初级共鸣促剂', color: 'var(--green)' },
  weapon_book: { name: '武器突破石', color: 'var(--gold)' },
  astrite:   { name: '星声', color: 'var(--gold)' },
  echo_tuner: { name: '声骸调谐器', color: 'var(--accent)' }
};

function formatDrops(drops) {
  if (!drops) return '';
  const parts = [];
  for (const [k, v] of Object.entries(drops)) {
    if (k === 'echo_set' || k === 'echo_count') continue;
    const d = DROP_LABEL[k];
    if (!d) continue;
    parts.push(`<span style="color:${d.color}">${d.name} ×${v}</span>`);
  }
  if (drops.echo_set) {
    const setIds = Array.isArray(drops.echo_set) ? drops.echo_set : [drops.echo_set];
    const names = setIds.map(sid => getSetById(sid)?.name || sid).filter(Boolean);
    const cnt = drops.echo_count || 1;
    if (names.length) parts.push(`<span style="color:var(--accent)">声骸 ×${cnt}（${names.join(' / ')}）</span>`);
  }
  return parts.join(' · ');
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

function renderDungeonCard(d, canAfford, isWeekly = false) {
  const encounter = getDungeonEncounter(d, S.today);
  const minLv = d.minLevel ? `<span>推荐 ${d.minLevel}+</span>` : '';
  const poolSize = d.encounterPool?.length || 1;
  const enemyHtml = formatEnemies(encounter.enemies);
  const mechanicHtml = formatMechanics(encounter.enemies);
  const dropHtml = formatDrops(d.drops);
  const isWorldBoss = d.type === 'worldBoss';
  const bossName = isWorldBoss ? (d.enemies?.[0] || d.name) : null;
  const bossLv = bossName ? getBossLevel(bossName) : null;
  const spawnOpts = bossName ? getWorldBossSpawnOpts(bossName) : null;
  const costLine = d.cost > 0 ? `<b>${d.cost}</b> 波片` : '不耗波片';
  const disabledLabel = S.stamina < d.cost
    ? `缺 ${d.cost - S.stamina} 体力`
    : (isWeekly && !canUseWeeklyBoss() ? '本周已满' : '需编队');

  return `<article class="dng-card ${isWeekly ? 'weekly' : ''}">
    <div class="dng-card-top">
      <div>
        <div class="dng-card-name">${d.name}</div>
        <div class="dng-card-meta">${costLine}${minLv}</div>
      </div>
      <button class="mbtn gold" onclick="window.__startDungeon('${d.id}')" ${!canAfford ? 'disabled' : ''}>${canAfford ? '挑战' : disabledLabel}</button>
    </div>
    <div class="dng-encounter">
      <div class="dng-label">今日敌情</div>
      <div class="dng-enemies">${enemyHtml}</div>
      ${mechanicHtml ? `<div class="dng-mechanics">${mechanicHtml}</div>` : ''}
      ${isWorldBoss && spawnOpts
        ? `<div class="dng-pool">讨伐等级 <b style="color:var(--gold)">Lv${bossLv}</b> · ${SOL3_LEVELS[spawnOpts.worldTier]?.name || '索拉Ⅰ'} · 强度 ×${(spawnOpts.tierMult * bossLv / 90).toFixed(2)}（Lv90基准）</div>`
        : (d.encounterPool && d.encounterPool.length
          ? `<div class="dng-pool">${encounter.tag} · 敌池 ${poolSize} 组 · 敌强 ×${encounter.enemyScale.toFixed(2)} · 隔日刷新</div>`
          : `<div class="dng-pool">固定敌情 · 敌强 ×${encounter.enemyScale.toFixed(2)}</div>`)
      }
    </div>
    <div class="dng-drops">
      <div class="dng-label">奖励</div>
      <div>${dropHtml}</div>
    </div>
  </article>`;
}

// ===== 主渲染 =====
const DUNGEON_GROUPS = [
  { type: 'exp',       key: 'exp',     label: '模拟战训', sub: '角色经验' },
  { type: 'weapon',    key: 'weapon',  label: '锻造挑战', sub: '武器材料' },
  { type: 'echo',      key: 'echo',    label: '无音区',   sub: '声骸养成' },
  { type: 'worldBoss', key: 'boss',    label: '世界BOSS', sub: '60波片/次' },
  { type: 'weekly',    key: 'weekly',  label: '战歌重奏', sub: '周限3次' }
];

let _dungeonTab = 'exp';

export function renderDungeon() {
  const container = $('paneDungeon');
  if (!container) return;
  const teamCount = getCombatTeamNames().length;
  let html = '';

  // 体力条
  const solvent = S.materials.crystal_solvent || 0;
  const condensed = S.materials.condensed_waveplate || 0;
  const POT_CAP = 480;
  html += `<div class="dng-top">
    <div class="dng-stamina">
      <div class="dng-stamina-label">结晶波片</div>
      <div class="dng-stamina-value">${S.stamina} / ${S.staminaMax}</div>
      <div class="dng-stamina-bar"><i style="width:${(S.stamina/S.staminaMax*100).toFixed(1)}%"></i></div>
      <div class="dng-stamina-note">推进到下一日补满 · 药剂超充上限 ${POT_CAP}</div>
    </div>
    <div class="dng-actions">
      <button class="mbtn" onclick="window.__usePotion('condensed_waveplate',1)" ${condensed <= 0 || S.stamina >= POT_CAP ? 'disabled' : ''}>凝缩 ${condensed}/5</button>
      <button class="mbtn gold" onclick="window.__usePotion('crystal_solvent',1)" ${solvent <= 0 || S.stamina >= POT_CAP ? 'disabled' : ''}>溶剂 ×${solvent}</button>
      <button class="mbtn" onclick="window.__buyStamina()" ${S.astrite < 60 || S.stamina >= POT_CAP ? 'disabled' : ''}>60⭐ 补体力</button>
    </div>
  </div>`;

  const paidDungeons = DUNGEONS.filter(d => d.cost > 0);
  const minCost = paidDungeons.length ? Math.min(...paidDungeons.map(d => d.cost)) : 0;
  if (minCost > 0 && S.stamina < minCost) {
    html += `<div class="dng-alert">⚠ 当前结晶波片不足，至少需要 ${minCost} 点。可使用凝缩波片 / 结晶溶剂，或推进到下一日补满。</div>`;
  }
  if (teamCount === 0) {
    html += '<div class="dng-alert red">⚠ 编队为空或队员已失效，先去【编队】面板组队</div>';
  }

  const weeklyUsed = getWeeklyBossUsed();
  const weeklyLeft = Math.max(0, WEEKLY_BOSS_LIMIT - weeklyUsed);

  // SOL3 世界等级选择器
  const curSol3 = getSol3Level();
  const curSol3Cfg = getSol3Config(curSol3);
  html += '<div class="dng-sol3" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
  html += '<span style="font-size:11px;color:var(--muted);letter-spacing:1px">世界等级</span>';
  Object.entries(SOL3_LEVELS).forEach(([lv, cfg]) => {
    const active = Number(lv) === curSol3;
    html += `<button class="mbtn ${active ? 'gold' : ''}" style="font-size:10px;padding:4px 10px" onclick="window.__setSol3(${lv})" ${active ? 'disabled' : ''}>${cfg.name}</button>`;
  });
  html += `<span style="font-size:10px;color:var(--muted)">BOSS取Lv90的 ×${((curSol3Cfg.worldTierMult||0.3)*100).toFixed(0)}% · 掉落 ×${curSol3Cfg.dropMult.toFixed(1)}</span>`;
  html += '</div>';

  // 左右布局：左侧 Tab + 右侧卡片
  html += '<div style="display:flex;gap:12px">';

  // 左侧 Tab 列
  html += '<div style="display:flex;flex-direction:column;gap:5px;min-width:80px">';
  DUNGEON_GROUPS.forEach(g => {
    const active = _dungeonTab === g.key;
    const color = g.key === 'weekly' ? 'var(--gold)' : g.key === 'boss' ? '#ff8c5e' : 'var(--accent)';
    const count = DUNGEONS.filter(d => d.type === g.type).length;
    html += `<div onclick="window.__dungeonSwitchTab('${g.key}')" style="cursor:pointer;border:2px solid ${active ? color : 'var(--line)'};border-radius:10px;padding:9px 6px;text-align:center;background:${active ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)'};transition:.15s">
      <div style="font-size:12px;font-weight:700;letter-spacing:2px;color:${active ? color : 'var(--text)'}">${g.label}</div>
      <div style="font-size:9px;color:var(--muted);margin-top:2px">${g.key === 'weekly' ? `剩余 ${weeklyLeft}/${WEEKLY_BOSS_LIMIT}` : `${count} 个副本`}</div>
    </div>`;
  });
  html += '</div>';

  // 右侧内容
  html += '<div style="flex:1;min-width:0;overflow-y:auto;max-height:55vh">';
  const group = DUNGEON_GROUPS.find(g => g.key === _dungeonTab);
  if (group) {
    const list = DUNGEONS.filter(d => d.type === group.type);
    if (list.length) {
      list.forEach(d => {
        const isWeekly = !!d.weeklyLimit;
        const canAfford = S.stamina >= d.cost && teamCount > 0 && (!isWeekly || canUseWeeklyBoss());
        html += renderDungeonCard(d, canAfford, isWeekly);
      });
    }
  }
  html += '</div>';

  html += '</div>'; // 左右布局结束

  container.innerHTML = html;
}

window.__dungeonSwitchTab = (key) => {
  _dungeonTab = key;
  renderDungeon();
};

window.__setSol3 = (lv) => {
  setSol3Level(lv);
  renderDungeon();
};
