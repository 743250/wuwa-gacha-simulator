import { getForte } from '../../battle/forte.js';
import { attachTermTips } from '../terms.js';
import { SKILL_HINTS } from './skillHints.js';

function stripSkillPageNoise(html) {
  return String(html || '')
    .replace(/<br><br><span[^>]*>▸ 推荐战斗节奏<\/span><br>[\s\S]*$/g, '')
    .replace(/<br><span[^>]*>▸ 推荐战斗节奏<\/span><br>[\s\S]*$/g, '')
    .replace(/<span[^>]*>▸ 推荐战斗节奏<\/span><br>[\s\S]*$/g, '');
}

function renderForteBlock(forteName, forteDesc) {
  if (!forteDesc) return '';
  return `<div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--line);font-size:13px;line-height:1.75">
    <div><b style="color:#c39bff;font-size:14px">🌀 ${forteName}</b></div>
    <div style="color:var(--dim);padding-left:16px;margin-top:4px">${forteDesc}</div>
  </div>`;
}

export function renderSkillsBlock(roleName, meta, { stats = {}, roleOverride = null, burstMode = 'white' } = {}) {
  const f = getForte(roleName);
  const s = SKILL_HINTS[roleName];

  const isMC = meta.type === '主C' || meta.type === '副C';
  const intro = s?.intro || `${meta.element}${meta.weaponType}${meta.type}`;
  const forteName = s?.forteName || f.resourceName;
  const forteDesc = stripSkillPageNoise(s?.forteDesc || f.desc);
  const forteBlock = renderForteBlock(forteName, forteDesc);
  const skillModeToggle = s?.showSkillModeToggle
    ? `<button class="mbtn" style="padding:5px 11px;font-size:12px;line-height:1.2" title="切换普攻 / 技能 / 重击文案" onclick="event.stopPropagation();window.__toggleEncoreBurstMode()">${burstMode === 'black' ? '黑咩版' : '白咩版'}</button>`
    : '';

  let linesHtml;
  if (s?.customLines) {
    const lines = typeof s.customLines === 'function' ? s.customLines(stats, roleOverride || {}) : s.customLines;
    linesHtml = lines.map(L => `
      <div style="margin-bottom:8px">
        <b style="color:${L.color};min-width:70px;display:inline-block;font-size:14px">${L.icon} ${L.name}</b>
        <span style="color:var(--muted);font-size:12px"> · ${L.cost}</span>
        <div style="color:var(--dim);padding-left:22px;margin-top:4px;font-size:13px;line-height:1.65">${attachTermTips(L.desc)}</div>
      </div>
    `).join('');
  } else {
    const normal = s?.normal || '基础打击';
    const skill = s?.skill || (isMC ? '元素技能（180% atk · CD 3回合）' : '增益/治疗技能（180% atk）');
    const burst = s?.burst || (meta.type === '辅助' || meta.type === '治疗' ? '展开领域 / 全队治疗（能量满激活）' : '元素范围爆发（主 400% / 副 200% · 能量满激活）');
    linesHtml = `
      <div><b style="color:var(--text);min-width:70px;display:inline-block;font-size:14px">⚔ 普攻</b><span style="color:var(--muted);font-size:12px"> · 1 AP</span><br><span style="color:var(--dim);padding-left:22px;font-size:13px;line-height:1.65">${normal} · 100% 攻击 · +12 能量 · 削破韧 8</span></div>
      <div><b style="color:var(--accent);min-width:70px;display:inline-block;font-size:14px">✦ 技能</b><span style="color:var(--muted);font-size:12px"> · 1 AP · CD 3回合</span><br><span style="color:var(--dim);padding-left:22px;font-size:13px;line-height:1.65">${skill} · +22 能量 · 削破韧 20</span></div>
      ${s?.hasHeavy ? `<div><b style="color:#ff8c5e;min-width:70px;display:inline-block;font-size:14px">💢 重击</b><span style="color:var(--muted);font-size:12px"> · 2 AP · CD 1回合</span><br><span style="color:var(--dim);padding-left:22px;font-size:13px;line-height:1.65">重击伤害类型 · 220% 攻击 · +15 能量 · 削破韧 25</span></div>` : ''}
      <div><b style="color:var(--gold);min-width:70px;display:inline-block;font-size:14px">⚡ 解放</b><span style="color:var(--muted);font-size:12px"> · 3 AP · 能量满</span><br><span style="color:var(--dim);padding-left:22px;font-size:13px;line-height:1.65">${burst} · AOE · 削破韧 30</span></div>
    `;
  }

  return `<div style="border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:rgba(245,207,107,.03);margin-bottom:10px;border-bottom:2px solid rgba(245,207,107,.2)">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px">
      <div style="font-size:12px;color:var(--gold);letter-spacing:2px">技 能 介 绍</div>
      ${skillModeToggle}
    </div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:12px;letter-spacing:.3px">▸ ${intro}</div>

    <div style="display:grid;grid-template-columns:1fr;gap:8px;font-size:13px;line-height:1.65">
      ${linesHtml}
    </div>

    ${forteBlock}
  </div>`;
}
