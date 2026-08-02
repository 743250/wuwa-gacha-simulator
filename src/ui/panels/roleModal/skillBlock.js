// 技能介绍 block · Stage 6.1 Preact 化
// renderSkillsBlock 返回 Preact VNode,SkillTab.tsx 直接渲染(无 dangerouslySetInnerHTML)
// attachTermTips 仍返回 HTML 字符串,customLines.desc / forteDesc 用 dangerouslySetInnerHTML 兜住(渐进迁移)
import { h } from 'preact';
import { getForte } from '../../../battle/forte.js';
import { attachTermTips } from './terms.js';
import { SKILL_HINTS } from './skillHints/index.js';
import { toggleEncoreBurstMode } from './signals.js';

function stripSkillPageNoise(html) {
  return String(html || '')
    .replace(/<br><br><span[^>]*>▸ 推荐战斗节奏<\/span><br>[\s\S]*$/g, '')
    .replace(/<br><span[^>]*>▸ 推荐战斗节奏<\/span><br>[\s\S]*$/g, '')
    .replace(/<span[^>]*>▸ 推荐战斗节奏<\/span><br>[\s\S]*$/g, '');
}

function ForteBlock({ forteName, forteDesc }) {
  if (!forteDesc) return null;
  return h('div', { style: { marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--line)', fontSize: '13px', lineHeight: '1.75' } },
    h('div', null,
      h('b', { style: { color: '#c39bff', fontSize: '14px' } }, `🌀 ${forteName}`)
    ),
    h('div', {
      style: { color: 'var(--dim)', paddingLeft: '16px', marginTop: '4px' },
      dangerouslySetInnerHTML: { __html: forteDesc },
    })
  );
}

export function renderSkillsBlock(roleName, meta, { stats = {}, roleOverride = null, burstMode = 'white' } = {}) {
  const f = getForte(roleName);
  const s = SKILL_HINTS[roleName];

  const isMC = meta.type === '主C' || meta.type === '副C';
  const intro = s?.intro || `${meta.element}${meta.weaponType}${meta.type}`;
  const forteName = s?.forteName || f.resourceName;
  const forteDesc = stripSkillPageNoise(s?.forteDesc || f.desc);

  const skillModeToggle = s?.showSkillModeToggle
    ? h('button', {
        class: 'mbtn',
        style: { padding: '5px 11px', fontSize: '12px', lineHeight: '1.2' },
        title: '切换普攻 / 技能 / 重击文案',
        onClick: (e) => { e.stopPropagation(); toggleEncoreBurstMode(); },
      }, burstMode === 'black' ? '黑咩版' : '白咩版')
    : null;

  let linesContent;
  if (s?.customLines) {
    const lines = typeof s.customLines === 'function' ? s.customLines(stats, roleOverride || {}) : s.customLines;
    linesContent = lines.map((L, i) => h('div', { key: i, style: { marginBottom: '8px' } },
      L.nameHtml
        ? h('span', {
            style: { color: L.color, minWidth: '70px', display: 'inline-block', fontSize: '14px', fontWeight: '700' },
            dangerouslySetInnerHTML: { __html: `${L.icon} ${attachTermTips(L.nameHtml)}` }
          })
        : h('b', { style: { color: L.color, minWidth: '70px', display: 'inline-block', fontSize: '14px' } }, `${L.icon} ${L.name}`),
      h('span', { style: { color: 'var(--muted)', fontSize: '12px' } }, ` · ${L.cost}`),
      h('div', {
        style: { color: 'var(--dim)', paddingLeft: '22px', marginTop: '4px', fontSize: '13px', lineHeight: '1.65' },
        dangerouslySetInnerHTML: { __html: attachTermTips(L.desc) },
      })
    ));
  } else {
    const normal = s?.normal || '基础打击';
    const skill = s?.skill || (isMC ? '元素技能（180% atk · CD 3回合）' : '增益/治疗技能（180% atk）');
    const burst = s?.burst || (meta.type === '辅助' || meta.type === '治疗' ? '展开领域 / 全队治疗（能量满激活）' : '元素范围爆发（主 400% / 副 200% · 能量满激活）');
    linesContent = [
      h('div', null,
        h('b', { style: { color: 'var(--text)', minWidth: '70px', display: 'inline-block', fontSize: '14px' } }, '⚔ 普攻'),
        h('span', { style: { color: 'var(--muted)', fontSize: '12px' } }, ' · 1 AP'),
        h('br'),
        h('span', { style: { color: 'var(--dim)', paddingLeft: '22px', fontSize: '13px', lineHeight: '1.65' } }, `${normal} · 100% 攻击 · +12 能量 · 削破韧 8`)
      ),
      h('div', null,
        h('b', { style: { color: 'var(--accent)', minWidth: '70px', display: 'inline-block', fontSize: '14px' } }, '✦ 技能'),
        h('span', { style: { color: 'var(--muted)', fontSize: '12px' } }, ' · 1 AP · CD 3回合'),
        h('br'),
        h('span', { style: { color: 'var(--dim)', paddingLeft: '22px', fontSize: '13px', lineHeight: '1.65' } }, `${skill} · +22 能量 · 削破韧 20`)
      ),
      s?.hasHeavy ? h('div', null,
        h('b', { style: { color: '#ff8c5e', minWidth: '70px', display: 'inline-block', fontSize: '14px' } }, '💢 重击'),
        h('span', { style: { color: 'var(--muted)', fontSize: '12px' } }, ' · 2 AP · CD 1回合'),
        h('br'),
        h('span', { style: { color: 'var(--dim)', paddingLeft: '22px', fontSize: '13px', lineHeight: '1.65' } }, '重击伤害类型 · 220% 攻击 · +15 能量 · 削破韧 25')
      ) : null,
      h('div', null,
        h('b', { style: { color: 'var(--gold)', minWidth: '70px', display: 'inline-block', fontSize: '14px' } }, '⚡ 解放'),
        h('span', { style: { color: 'var(--muted)', fontSize: '12px' } }, ' · 3 AP · 能量满'),
        h('br'),
        h('span', { style: { color: 'var(--dim)', paddingLeft: '22px', fontSize: '13px', lineHeight: '1.65' } }, `${burst} · AOE · 削破韧 30`)
      ),
    ];
  }

  return h('div', {
    style: {
      border: '1px solid var(--line)', borderRadius: '10px', padding: '14px 16px',
      background: 'rgba(245,207,107,.03)', marginBottom: '10px',
      borderBottom: '2px solid rgba(245,207,107,.2)',
    },
  },
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' } },
      h('div', { style: { fontSize: '12px', color: 'var(--gold)', letterSpacing: '2px' } }, '技 能 介 绍'),
      skillModeToggle
    ),
    h('div', { style: { fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', letterSpacing: '.3px' } }, `▸ ${intro}`),
    h('div', { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '13px', lineHeight: '1.65' } }, linesContent),
    h(ForteBlock, { forteName, forteDesc })
  );
}
