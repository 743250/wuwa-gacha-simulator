// 深塔面板（左侧 Tab 切换三区）
import { S, $, DAY, fmt } from '../state.js';
import { ABYSS_ZONES, STAR_CRITERIA, getAbyssStars, nextHazardResetDate, getAbyssVersionInfo, getAbyssFloorScale, getCurrentAbyssEnvironment, HAZARD_TOWERS, VIGOR_MAX, getTeamVigor, canChallengeFloor } from '../daily/abyss.js';
import { parseEnemyStr } from '../battle/dungeon.js';
import { getCombatTeamNames } from '../battle/combat.js';
import { ENEMIES } from '../battle/enemies.js';
import { ELEMENT_COLOR } from '../battle/elements.js';
import './battle.js';

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

  // 活力检查（仅危险区）
  let vigorInfo = '';
  let canChallenge = teamCount > 0 && !isLocked && !isDone;
  if (f.zone === 'hazard' && !isDone && !isLocked && teamCount > 0) {
    const check = canChallengeFloor(f);
    if (!check.ok) {
      canChallenge = false;
      vigorInfo = `<span style="color:var(--red);font-size:11px">⚠ ${check.reason}</span>`;
    } else {
      const tv = getTeamVigor();
      vigorInfo = `<span style="color:var(--muted);font-size:11px">活力 ${tv.map(t => `${t.name} ${t.vigor}/${VIGOR_MAX}`).join(' · ')}</span>`;
    }
  }

  const scaleLine = f.zone === 'hazard'
    ? `水温 HP ×${scale.hp.toFixed(2)} / 攻 ×${scale.atk.toFixed(2)} / 防 ×${scale.def.toFixed(2)}${f.towerScale ? ` · 塔倍率 ×${f.towerScale.toFixed(2)}` : ''}`
    : `敌方强度 ×${scale.hp.toFixed(2)}`;

  const oneShotTag = f.oneShot
    ? (isOneShotDone
        ? '<span style="font-size:12px;color:var(--green);margin-left:6px">已通关</span>'
        : '<span style="font-size:12px;color:var(--accent);margin-left:6px">首通领奖</span>')
    : '';

  const rewardLine = f.oneShot
    ? `🎁 <span style="color:var(--dim)">首通奖励：</span><span style="color:var(--gold)">${f.baseReward} 星声</span>（一次性 · 通关后永久保留）`
    : `🎁 <span style="color:var(--dim)">满星奖励：</span><span style="color:var(--gold)">${f.baseReward} 星声</span> · <span style="color:var(--muted)">补星只发新增差额</span> · <span style="color:var(--gold)">★3 额外：特级促剂×2 + 武器石×4</span>`;

  const btn = isDone
    ? `<button class="mbtn" disabled>${isOneShotDone ? '已通关' : '已满星'}</button>`
    : `<button class="mbtn gold" onclick="window.__startAbyss('${f.id}')" ${!canChallenge ? 'disabled' : ''}>${isLocked ? '🔒 锁定' : (earned > 0 ? '补 星' : '挑 战')}</button>`;

  return `<div style="border:1px solid ${isCleared ? 'rgba(245,207,107,.5)' : 'var(--line)'};border-radius:10px;padding:11px 13px;margin-bottom:6px;background:${isCleared ? 'rgba(245,207,107,.05)' : 'rgba(255,255,255,.02)'};opacity:${isLocked ? '.4' : '1'};border-bottom:2px solid ${isCleared ? 'rgba(245,207,107,.5)' : 'var(--line)'}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">
          <span style="font-size:13px;font-weight:700;letter-spacing:1px">${f.name}</span>
          ${oneShotTag}
          <span style="font-size:12px;color:var(--gold)">${starHtml}</span>
        </div>
        ${vigorInfo ? `<div style="margin-top:3px">${vigorInfo}</div>` : ''}
      </div>
      ${btn}
    </div>
    <div style="font-size:11px;color:var(--muted);line-height:1.6;border-top:1px dashed var(--line);padding-top:5px">
      <div>⚔ <span style="color:var(--dim)">敌人：</span>${formatEnemies(f.enemies)}</div>
      <div style="margin-top:2px;color:${f.zone === 'hazard' ? 'var(--accent)' : 'var(--muted)'}">🌡 <span style="color:var(--dim)">强度：</span>${scaleLine}</div>
      <div style="margin-top:2px">${rewardLine}</div>
    </div>
  </div>`;
}

// 危险区三塔列布局（紧凑但信息完整）
function renderHazardTowers() {
  const tv = getCombatTeamNames().length > 0 ? getTeamVigor() : [];
  let html = '';

  if (tv.length > 0) {
    html += `<div style="margin-bottom:10px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.02);font-size:11px;color:var(--muted);letter-spacing:.5px">
      ⚡ 当前编队活力：${tv.map(t => {
        const pct = t.vigor / VIGOR_MAX;
        const c = pct >= 0.7 ? 'var(--green)' : pct >= 0.3 ? 'var(--gold)' : 'var(--red)';
        return `<span style="color:${c}">${t.name} <b>${t.vigor}/${VIGOR_MAX}</b></span>`;
      }).join(' · ')}
      <span style="color:var(--dim)">（第 N 层消耗 N 点 · 单塔通刷需 10 点/角色 · 失败不扣 · 三塔满星需 3 队）</span>
    </div>`;
  }

  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">';
  HAZARD_TOWERS.forEach(tower => {
    const stars = getAbyssStars();
    const totalStars = tower.floors.reduce((a, f) => a + (stars[f.id] || 0), 0);
    const maxStars = tower.floors.length * 3;
    const allCleared = totalStars >= maxStars;
    const totalReward = tower.floors.reduce((a, f) => a + f.baseReward, 0);

    html += `<div style="border:1px solid ${allCleared ? 'rgba(245,207,107,.35)' : 'var(--line)'};border-radius:10px;padding:9px 10px;background:${allCleared ? 'rgba(245,207,107,.04)' : 'rgba(255,255,255,.01)'}">
      <div style="text-align:center;font-weight:700;font-size:12px;color:${tower.color};letter-spacing:2px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px dashed var(--line)">
        ${tower.name} <span style="font-size:11px;color:var(--muted)">★ ${totalStars}/${maxStars} · ${totalReward} 星声</span>
      </div>`;
    tower.floors.forEach((f, i) => {
      const prevId = i > 0 ? tower.floors[i - 1].id : null;
      html += renderFloor(f, { lockable: true, prevId });
    });
    html += '</div>';
  });
  html += '</div>';
  return html;
}

// ===== 主渲染 =====
let _abyssZone = 'hazard';

export function renderAbyss() {
  const container = $('paneAbyss');
  if (!container) return;
  const teamCount = getCombatTeamNames().length;
  const stars = getAbyssStars();

  const hazardTotal = ABYSS_ZONES.hazard.floors.reduce((a, f) => a + (stars[f.id] || 0), 0);
  const hazardMax = ABYSS_ZONES.hazard.floors.length * 3;
  const oneShotZoneKeys = Object.keys(ABYSS_ZONES).filter(k => ABYSS_ZONES[k].oneShot);
  const oneShotTotal = oneShotZoneKeys.reduce((sum, k) =>
    sum + ABYSS_ZONES[k].floors.reduce((a, f) => a + (stars[f.id] || 0), 0), 0);
  const oneShotMax = oneShotZoneKeys.reduce((sum, k) => sum + ABYSS_ZONES[k].floors.length * 3, 0);

  const nextReset = nextHazardResetDate(S.today);
  const daysLeft = Math.max(0, Math.ceil((nextReset - S.today) / DAY));
  const versionInfo = getAbyssVersionInfo(S.today);
  const env = getCurrentAbyssEnvironment(S.today);

  // 顶部摘要
  let html = `<div style="text-align:center;margin-bottom:12px;padding:10px 12px;border:1px solid rgba(245,207,107,.3);border-radius:10px;background:linear-gradient(135deg,rgba(245,207,107,.06),rgba(195,155,255,.03))">
    <div style="font-size:15px;letter-spacing:4px;color:var(--gold);font-weight:700">逆 境 深 塔</div>
    <div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.7">
      <span style="color:var(--accent)">★1：${STAR_CRITERIA.oneStar.turn} 回合内通关</span> ·
      <span style="color:var(--accent)">★2：${STAR_CRITERIA.twoStar.turn} 回合内 + HP ≥ ${(STAR_CRITERIA.twoStar.hp*100).toFixed(0)}%</span> ·
      <span style="color:var(--gold)">★3：${STAR_CRITERIA.threeStar.turn} 回合内 + HP ≥ ${(STAR_CRITERIA.threeStar.hp*100).toFixed(0)}%</span>
    </div>
    <div style="margin-top:6px;display:flex;justify-content:center;gap:20px;font-size:11px">
      <span>稳定/实验 一次性区 <b style="color:var(--green)">★ ${oneShotTotal}/${oneShotMax}</b></span>
      <span>危险区 <b style="color:var(--gold)">★ ${hazardTotal}/${hazardMax}</b> · 三塔满星 800 星声</span>
    </div>
    <div style="margin-top:4px;font-size:11px;color:var(--accent);letter-spacing:1px">
      ⏳ 危险区下次重置：${fmt(nextReset)}（剩余 ${daysLeft} 天） · 水温 ${versionInfo.version} HP×${versionInfo.hp.toFixed(2)}
    </div>
    <div style="margin-top:3px;font-size:11px;letter-spacing:.5px">
      🌐 本期环境：<b style="color:var(--green)">${env.favorElement} −10%抗</b> · <b style="color:var(--red)">${env.resistElement} +10%抗</b> · <b style="color:var(--gold)">${env.buffLabel}</b>
    </div>
  </div>`;

  if (teamCount === 0) {
    html += '<div style="color:var(--red);text-align:center;padding:10px;font-size:12px;border:1px dashed var(--red);border-radius:8px;margin-bottom:12px">⚠ 编队为空或队员已失效，先去【编队】面板组队</div>';
  }

  // 左右布局：左侧 Tab 列 + 右侧内容区
  const zoneConfig = {
    stable:     { label: '稳定区',     desc: '一次性 4 关<br>满星 800 星声' },
    experiment: { label: '实验区',     desc: '一次性 5 关<br>满星 1000 星声' },
    hazard:     { label: '危险区',     desc: `28 天重置<br>12 关满星 800 星声` }
  };

  html += '<div style="display:flex;gap:12px">';

  // 左侧 Tab
  html += '<div style="display:flex;flex-direction:column;gap:6px;min-width:85px">';
  Object.entries(zoneConfig).forEach(([key, cfg]) => {
    const active = _abyssZone === key;
    const color = key === 'hazard' ? 'var(--gold)' : key === 'experiment' ? 'var(--accent)' : 'var(--green)';
    html += `<div onclick="window.__abyssSwitchZone('${key}')" style="cursor:pointer;border:2px solid ${active ? color : 'var(--line)'};border-radius:10px;padding:10px 8px;text-align:center;background:${active ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)'};transition:.15s">
      <div style="font-size:13px;font-weight:700;letter-spacing:2px;color:${active ? color : 'var(--text)'}">${cfg.label}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:3px;line-height:1.4">${cfg.desc}</div>
    </div>`;
  });

  // 危险区子信息
  if (_abyssZone === 'hazard') {
    html += `<div style="margin-top:4px;padding:8px;border-radius:8px;background:rgba(255,255,255,.02);font-size:10px;color:var(--muted);text-align:center;line-height:1.4">
      <div style="color:var(--gold);font-weight:600">三塔结构</div>
      回音 · 残响 · 深境<br>
      各 4 层 · 共 12 关<br>
      <span style="color:var(--dim)">第 N 层耗 N 活力</span>
    </div>`;
  }
  html += '</div>';

  // 右侧内容
  html += '<div style="flex:1;min-width:0;overflow-y:auto;max-height:60vh">';
  if (_abyssZone === 'hazard') {
    html += renderHazardTowers();
  } else if (_abyssZone === 'stable') {
    html += `<div style="font-size:11px;color:var(--muted);margin-bottom:8px;line-height:1.6">${ABYSS_ZONES.stable.desc}</div>`;
    ABYSS_ZONES.stable.floors.forEach(f => html += renderFloor(f, { lockable: false, prevId: null }));
  } else if (_abyssZone === 'experiment') {
    html += `<div style="font-size:11px;color:var(--muted);margin-bottom:8px;line-height:1.6">${ABYSS_ZONES.experiment.desc}</div>`;
    ABYSS_ZONES.experiment.floors.forEach(f => html += renderFloor(f, { lockable: false, prevId: null }));
  }
  html += '</div>';

  html += '</div>'; // 左右布局结束

  container.innerHTML = html;
}

window.__abyssSwitchZone = (key) => {
  _abyssZone = key;
  renderAbyss();
};
