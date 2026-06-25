// 深塔面板（3 区结构：稳定 / 实验 / 危险）
import { S, $, DAY, fmt } from '../state.js';
import { ABYSS_ZONES, STAR_CRITERIA, getAbyssStars, getHazardProgress, nextHazardResetDate, getAbyssVersionInfo, getAbyssFloorScale } from '../daily/abyss.js';
import { parseEnemyStr } from '../battle/dungeon.js';
import { getCombatTeamNames } from '../battle/combat.js';
import { ENEMIES } from '../battle/enemies.js';
import { ELEMENT_COLOR } from '../battle/elements.js';
import './battle.js';   // 副作用：注册 window.__startAbyss

function formatEnemies(enemyStrs) {
  return enemyStrs.map(s => {
    const p = parseEnemyStr(s);
    const e = ENEMIES[p.name];
    if (!e) return `${p.name}${p.count > 1 ? '×' + p.count : ''}`;
    const ec = ELEMENT_COLOR[e.element] || '#fff';
    return `<span style="color:${ec}">${p.name}</span>${p.count > 1 ? `<span style="color:var(--muted)">×${p.count}</span>` : ''}`;
  }).join(' · ');
}

function renderFloor(f, opts) {
  const stars = getAbyssStars();
  const earned = stars[f.id] || 0;
  const isLocked = opts.lockable && opts.prevId && (stars[opts.prevId] || 0) === 0;
  const isCleared = earned >= 3;
  const isOneShotDone = f.oneShot && earned > 0;
  const isFullStarDone = !f.oneShot && earned >= 3;
  const isDone = isOneShotDone || isFullStarDone;
  const starHtml = '★'.repeat(earned) + '☆'.repeat(3 - earned);
  const teamCount = getCombatTeamNames().length;
  const scale = getAbyssFloorScale(f, S.today);
  const scaleLine = f.zone === 'hazard'
    ? `水温 HP ×${scale.hp.toFixed(2)} / 攻 ×${scale.atk.toFixed(2)} / 防 ×${scale.def.toFixed(2)}`
    : `敌方强度 ×${scale.hp.toFixed(2)}`;

  const oneShotTag = f.oneShot
    ? (isOneShotDone
        ? '<span style="font-size:10px;color:var(--green);margin-left:6px">已通关</span>'
        : '<span style="font-size:10px;color:var(--accent);margin-left:6px">首通领奖</span>')
    : '';

  const btn = isDone
    ? `<button class="mbtn" disabled>${isOneShotDone ? '已通关' : '已满星'}</button>`
    : `<button class="mbtn gold" onclick="window.__startAbyss('${f.id}')" ${isLocked || teamCount === 0 ? 'disabled' : ''}>${isLocked ? '🔒 锁定' : (earned > 0 ? '补 星' : '挑 战')}</button>`;

  const rewardLine = f.oneShot
    ? `🎁 <span style="color:var(--dim)">首通奖励：</span><span style="color:var(--gold)">${f.baseReward} 星声</span>（一次性 · 通关后永久保留）`
    : `🎁 <span style="color:var(--dim)">满星奖励：</span><span style="color:var(--gold)">${f.baseReward} 星声</span> · <span style="color:var(--muted)">补星只发新增差额</span> · <span style="color:var(--gold)">★3 特级促剂×2 + 武器石×4</span>`;

  return `<div style="border:1px solid ${isCleared ? 'rgba(245,207,107,.5)' : 'var(--line)'};border-radius:10px;padding:11px 13px;margin-bottom:6px;background:${isCleared ? 'rgba(245,207,107,.05)' : 'rgba(255,255,255,.02)'};opacity:${isLocked ? '.4' : '1'};border-bottom:2px solid ${isCleared ? 'rgba(245,207,107,.5)' : 'var(--line)'}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">
          <span style="font-size:13px;font-weight:700;letter-spacing:1px">${f.name}</span>
          ${oneShotTag}
          <span style="font-size:12px;color:var(--gold)">${starHtml}</span>
        </div>
      </div>
      ${btn}
    </div>
    <div style="font-size:10px;color:var(--muted);line-height:1.6;border-top:1px dashed var(--line);padding-top:5px">
      <div>⚔ <span style="color:var(--dim)">敌人：</span>${formatEnemies(f.enemies)}</div>
      <div style="margin-top:2px;color:${f.zone === 'hazard' ? 'var(--accent)' : 'var(--muted)'}">🌡 <span style="color:var(--dim)">强度：</span>${scaleLine}</div>
      <div style="margin-top:2px">${rewardLine}</div>
    </div>
  </div>`;
}

function renderZone(zoneKey) {
  const z = ABYSS_ZONES[zoneKey];
  if (!z) return '';
  const stars = getAbyssStars();
  const totalStars = z.floors.reduce((a, f) => a + (stars[f.id] || 0), 0);
  const maxStars = z.floors.length * 3;
  const headColor = zoneKey === 'hazard' ? 'var(--gold)' : zoneKey === 'experiment' ? 'var(--accent)' : 'var(--green)';
  let html = `<div style="margin-top:14px">
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--line);padding-bottom:5px;margin-bottom:8px">
      <span style="font-size:14px;letter-spacing:3px;color:${headColor};font-weight:700">${z.name}</span>
      <span style="font-size:11px;color:var(--muted)">${z.desc} · ★ ${totalStars}/${maxStars}</span>
    </div>`;
  z.floors.forEach((f, i) => {
    const lockable = zoneKey === 'hazard';
    const prevId = lockable && i > 0 ? z.floors[i - 1].id : null;
    html += renderFloor(f, { lockable, prevId });
  });
  html += '</div>';
  return html;
}

export function renderAbyss() {
  const container = $('paneAbyss');
  if (!container) return;
  const teamCount = getCombatTeamNames().length;
  const stars = getAbyssStars();

  let html = '';

  const hazardTotal = ABYSS_ZONES.hazard.floors.reduce((a, f) => a + (stars[f.id] || 0), 0);
  const hazardMax = ABYSS_ZONES.hazard.floors.length * 3;
  const oneShotZoneKeys = Object.keys(ABYSS_ZONES).filter(k => ABYSS_ZONES[k].oneShot);
  const oneShotTotal = oneShotZoneKeys.reduce((sum, k) =>
    sum + ABYSS_ZONES[k].floors.reduce((a, f) => a + (stars[f.id] || 0), 0), 0);
  const oneShotMax = oneShotZoneKeys.reduce((sum, k) => sum + ABYSS_ZONES[k].floors.length * 3, 0);

  const nextReset = nextHazardResetDate(S.today);
  const daysLeft = Math.max(0, Math.ceil((nextReset - S.today) / DAY));
  const versionInfo = getAbyssVersionInfo(S.today);

  html += `<div style="text-align:center;margin-bottom:14px;padding:12px;border:1px solid rgba(245,207,107,.3);border-radius:10px;background:linear-gradient(135deg,rgba(245,207,107,.06),rgba(195,155,255,.03))">
    <div style="font-size:15px;letter-spacing:4px;color:var(--gold);font-weight:700">逆 境 深 塔</div>
    <div style="font-size:11px;color:var(--muted);margin-top:5px;line-height:1.7">
      <span style="color:var(--accent)">★1：${STAR_CRITERIA.oneStar.turn} 回合内通关</span> ·
      <span style="color:var(--accent)">★2：${STAR_CRITERIA.twoStar.turn} 回合内 + HP ≥ ${(STAR_CRITERIA.twoStar.hp*100).toFixed(0)}%</span> ·
      <span style="color:var(--gold)">★3：${STAR_CRITERIA.threeStar.turn} 回合内 + HP ≥ ${(STAR_CRITERIA.threeStar.hp*100).toFixed(0)}%</span>
    </div>
    <div style="margin-top:8px;display:flex;justify-content:center;gap:20px;font-size:11px">
      <span>稳定/实验 一次性区 <b style="color:var(--green)">★ ${oneShotTotal}/${oneShotMax}</b></span>
      <span>危险区 <b style="color:var(--gold)">★ ${hazardTotal}/${hazardMax}</b> · 满星 800 星声</span>
    </div>
    <div style="margin-top:6px;font-size:10px;color:var(--accent);letter-spacing:1px">
      ⏳ 危险区下一次重置：${fmt(nextReset)}（剩余 ${daysLeft} 天） · 水温 ${versionInfo.version}：HP ×${versionInfo.hp.toFixed(2)} / 攻 ×${versionInfo.atk.toFixed(2)} / 防 ×${versionInfo.def.toFixed(2)} · ${versionInfo.label}
    </div>
  </div>`;

  if (teamCount === 0) {
    html += '<div style="color:var(--red);text-align:center;padding:10px;font-size:12px;border:1px dashed var(--red);border-radius:8px;margin-bottom:12px">⚠ 编队为空或队员已失效，先去【编队】面板组队</div>';
  }

  html += renderZone('stable');
  html += renderZone('experiment');
  html += renderZone('hazard');

  container.innerHTML = html;
}
