import { WEAPON_DATA } from '../../equip/weapons.js';

// 武器详情面板：90 级数值 + 副词条 + 静态被动 + 触发器
function renderWeaponDetail(weaponName, wObj) {
  const data = WEAPON_DATA[weaponName];
  if (!data) return '';
  const lv = wObj?.level || 1;
  const refine = wObj?.refine || 1;
  const scale = 0.20 + (lv - 1) * (0.80 / 89);   // 1 级 = 20%, 90 级 = 100%
  const refineMult = 1 + (refine - 1) * 0.25;

  // 实时攻击 + 副词条数值
  const baseAtk = Math.round(data.atk90 * scale);
  const sub = data.sub;
  const subText = sub ? `${SUB_STAT_LABEL[sub.stat] || sub.stat} ${formatStatValue(sub.stat, sub.value90 * scale)}` : '';

  // 副词条 tooltip：解释计算公式 + 明确不受精炼影响
  let subTip;
  if (sub) {
    if (sub.stat === 'resonance') {
      subTip = `<span class="tip" data-tip='${'<b style=\"color:var(--gold)\">共鸣效率</b><br>提升<b style=\"color:var(--accent)\">共鸣解放充能</b>积累速度。<br>能量值积累 ×(1 + 共鸣效率)。<br>当前 +'+(sub.value90*scale*100).toFixed(1)+'%（90 级满值 '+(sub.value90*100).toFixed(1)+'% × 等级缩放 '+(scale*100).toFixed(1)+'%）。<br><span style=\"color:var(--muted);font-size:10px\">副词条只受等级影响，<b>不受精炼影响</b>；精炼只放大武器被动。</span>'}'>${subText} ⓘ</span>`;
    } else {
      const subName = SUB_STAT_LABEL[sub.stat] || sub.stat;
      const formatted = formatStatValue(sub.stat, sub.value90 * scale);
      const fullVal = formatStatValue(sub.stat, sub.value90);
      const tip = `<b style="color:var(--gold)">${subName}（副词条）</b><br>= 90 级满值 <b>${fullVal}</b> × 等级缩放 <b>${(scale*100).toFixed(1)}%</b><br>= <b style="color:var(--accent)">${formatted}</b><br><span style="color:var(--muted);font-size:10px">副词条只受等级影响，<b>不受精炼影响</b>；精炼只放大武器被动。</span>`;
      subTip = `<span class="tip" data-tip='${tipAttrEsc(tip)}'>${subText} ⓘ</span>`;
    }
  } else {
    subTip = subText;
  }

  // 攻击 tooltip：90 级 × 当前等级缩放
  const atkTip = `<b style="color:var(--gold)">基础攻击公式</b><br>= 90 级满值 <b>${data.atk90}</b> × 等级缩放 <b>${(scale*100).toFixed(1)}%</b><br>= <b style="color:var(--red)">${baseAtk}</b><br><span style="color:var(--muted);font-size:10px">等级 1 = 20% · 等级 90 = 100%（线性）</span>`;

  let html = `<div style="font-size:11px;color:var(--muted);margin-top:5px;line-height:1.6">
    <div style="margin-bottom:6px"><b style="color:var(--text)">基础攻击</b> <span class="tip" data-tip='${tipAttrEsc(atkTip)}'><b style="color:var(--red)">${baseAtk}</b></span>${subText ? ` · ${subTip}` : ''}</div>`;

  // 武器被动名 + 完整官方文案（按精炼度把数值改写）
  if (data.descFull) {
    const passiveName = data.passiveName || '武器被动';
    const refinedDesc = applyRefineToDesc(data.descFull, refineMult);
    html += `<div style="border-top:1px dashed var(--line);padding-top:6px;margin-top:4px">
      <div style="font-size:10px;color:var(--gold);letter-spacing:1.5px;margin-bottom:4px">▸ ${passiveName}${refine > 1 ? ` · 精炼 <b>${refine}</b>/5（数值 ×${refineMult.toFixed(2)}）` : ' · 精炼 1/5'}</div>
      <div style="color:var(--muted);font-size:11px;line-height:1.7">${refinedDesc}</div>
    </div>`;
    html += renderWeaponRuntime(data, refineMult, refine);
  } else {
    html += renderWeaponRuntime(data, refineMult, refine);
  }
  html += '</div>';
  return html;
}

// HTML 属性单引号转义（给 data-tip='...' 用）
function tipAttrEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;');
}

// 把官方文案 descFull 中的所有数值按精炼倍率改写，并加 tooltip 显示"原值 × 精炼倍率 = 当前"
// 处理两类 token：
//   1) <b class="term-num">12%</b>     → 百分比，按 ×refineMult
//   2) <b class="term-num">8</b>       → 整数（点数），按 ×refineMult 四舍五入
// 注：descFull 是 1 精原文，精炼 1 时 refineMult = 1.0，不改动
function applyRefineToDesc(html, refineMult) {
  if (refineMult === 1.0) return html;        // 1 精时不动
  // 收集 data.passive / data.triggers 上"绝对值"型 effect（如 concerto_refund 是点数，按整数缩放）
  // 简化：按 b 标签内文本判定 — 含 "%" 当百分比，纯数字当整数
  return String(html).replace(/<b class="term-num">([^<]+)<\/b>/g, (full, txt) => {
    const t = String(txt).trim();
    // 百分比："12%" / "12.5%"
    const pctM = t.match(/^([0-9]+(?:\.[0-9]+)?)\s*%$/);
    if (pctM) {
      const orig = Number(pctM[1]);
      const scaled = orig * refineMult;
      const scaledStr = (scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1)) + '%';
      const tip = tipAttrEsc(`<b style="color:var(--gold)">精炼公式</b><br>= 原值 <b>${orig}%</b> × 精 ${(refineMult===1?1:Math.round(refineMult*100)/100)} 倍率 <b>${refineMult.toFixed(2)}</b><br>= <b style="color:var(--accent)">${scaledStr}</b>`);
      return `<span class="tip" data-tip='${tip}'><b class="term-num">${scaledStr}</b></span>`;
    }
    // 整数："8 点" / "8" / "2 回合"——回合数 / 秒数不缩放（只缩"点"或纯数）
    const intM = t.match(/^([0-9]+)\s*(点|个)?$/);
    if (intM && (intM[2] === '点' || intM[2] === '个' || !intM[2])) {
      // 纯数 + "点"才认为是数值；纯整数（如"2 回合"已经在外层文字里"回合"不在 b 内）也按数值缩放
      const orig = Number(intM[1]);
      const scaled = Math.round(orig * refineMult);
      if (scaled === orig) return full;
      const unit = intM[2] || '';
      const tip = tipAttrEsc(`<b style="color:var(--gold)">精炼公式</b><br>= 原值 <b>${orig}${unit}</b> × 精 倍率 <b>${refineMult.toFixed(2)}</b><br>= <b style="color:var(--accent)">${scaled}${unit}</b>`);
      return `<span class="tip" data-tip='${tip}'><b class="term-num">${scaled}${unit}</b></span>`;
    }
    // 时间 / 秒 / 回合 等不缩放
    return full;
  });
}

// 战斗实时数值：按 (type, element) 分组,每组一个文案标签 + 一个数值标签
// 文案标签 tooltip 写详细机制,数值标签 tooltip 写精炼公式
function renderWeaponRuntime(data, refineMult, refine = 1) {
  const ABSOLUTE_VALUE_EFFECTS = new Set(['concerto_refund']);
  const groups = new Map();
  const key = (type, element) => `${type}|${element || ''}`;
  const fmtPct = v => (v * 100).toFixed(v * 100 % 1 === 0 ? 0 : 1) + '%';
  const fmtVal = (t, v) => ABSOLUTE_VALUE_EFFECTS.has(t.effect) ? `${Math.round(v)} 点` : fmtPct(v);
  (data.passive || []).forEach(p => {
    const k = key(p.type, p.element);
    if (!groups.has(k)) groups.set(k, { type: p.type, element: p.element, passive: null, triggers: [] });
    groups.get(k).passive = p;
  });
  (data.triggers || []).forEach(t => {
    const k = key(t.effect, t.element);
    if (!groups.has(k)) groups.set(k, { type: t.effect, element: t.element, passive: null, triggers: [] });
    groups.get(k).triggers.push(t);
  });
  const parts = [];
  for (const g of groups.values()) {
    const typeLabel = PASSIVE_TYPE_LABEL[g.type] || EFFECT_LABEL[g.type] || g.type;
    const labelName = `${typeLabel}${g.element ? ' · ' + g.element : ''}`;
    const mechLines = [];
    let displayValue;
    let formulaLines = [];
    if (g.passive) {
      const orig = g.passive.value;
      const v = orig * refineMult;
      displayValue = fmtPct(v);
      mechLines.push(`常驻 +${fmtPct(v)}`);
      formulaLines.push(`常驻 = 原值 ${fmtPct(orig)} × 精炼倍率 ${refineMult.toFixed(2)} = <b style="color:var(--accent)">${fmtPct(v)}</b>`);
    }
    g.triggers.forEach(t => {
      const trig = TRIGGER_LABEL[t.on] || t.on;
      const orig = t.value;
      const v = orig * refineMult;
      const vStr = fmtVal(t, v);
      const origStr = fmtVal(t, orig);
      const stacksN = t.maxStacks > 1 ? t.maxStacks : 1;
      if (!g.passive) {
        const peak = ABSOLUTE_VALUE_EFFECTS.has(t.effect) ? Math.round(orig * stacksN) : orig * stacksN;
        const peakScaled = peak * refineMult;
        displayValue = ABSOLUTE_VALUE_EFFECTS.has(t.effect) ? `${Math.round(peakScaled)} 点` : fmtPct(peakScaled);
      }
      const stacks = t.maxStacks > 1 ? `，最多 ${t.maxStacks} 层` : '';
      const dur = t.duration && t.duration < 99 ? `，持续 ${t.duration} 回合` : '';
      mechLines.push(`${trig}时叠加 +${vStr}${stacks}${dur}`);
      formulaLines.push(`${trig}时 = 原值 ${origStr} × 精炼倍率 ${refineMult.toFixed(2)} = <b style="color:var(--accent)">${vStr}</b>${stacks}${dur}`);
    });
    const mechTip = tipAttrEsc(`<b style="color:var(--gold)">${labelName}</b><br>${mechLines.join('<br>')}`);
    const formulaTip = tipAttrEsc(`<b style="color:var(--gold)">精炼公式</b><br>${formulaLines.join('<br>')}`);
    const prefix = (!g.passive && g.triggers.length) ? '最多 +' : '+';
    parts.push(`<span class="tip" data-tip='${mechTip}'><b>${labelName}</b></span> <span class="tip" data-tip='${formulaTip}'><b>${prefix}${displayValue}</b></span>`);
  }
  if (!parts.length) return '';
  return `<div style="margin-top:5px;padding-top:5px;border-top:1px dashed var(--line);color:var(--accent);font-size:10px;line-height:1.7">▸ ${parts.join(' · ')}</div>`;
}

const SUB_STAT_LABEL = {
  atk_pct: '攻击', crate: '暴击率', cdmg: '暴击伤害',
  hp: '生命', def_pct: '防御',
  resonance: '共鸣效率', heal: '治疗效果'
};
const PASSIVE_TYPE_LABEL = {
  atk_pct: '攻击', atk: '攻击', hp: '生命', def_pct: '防御',
  crate: '暴击', cdmg: '暴伤',
  elem_dmg: '元素伤害', elem_all: '全属性伤害',
  normal_pct: '普攻', skill_pct: '技能', burst_pct: '解放', heavy_pct: '重击',
  team_atk: '全队攻击', teamAtk: '全队攻击',
  resonance: '共鸣效率', heal: '治疗', def_pierce: '防御穿透'
};
const TRIGGER_LABEL = {
  normal_hit: '普攻命中',
  skill_hit: '技能命中',
  burst_cast: '解放释放',
  heavy_hit: '重击命中',
  variation: '变奏',
  outro: '延奏',
  concerto_consume: '消耗协奏',
  heal_skill: '治疗技能',
  condition_attack: '攻击带状态敌人',
  offstage: '后台时',
  always: '常驻'
};
const EFFECT_LABEL = {
  atk_pct: '攻击', normal_pct: '普攻伤害', skill_pct: '技能伤害',
  burst_pct: '解放伤害', heavy_pct: '重击伤害',
  elem_dmg: '元素伤害', def_pierce: '防御穿透',
  team_atk: '全队攻击', concerto_refund: '协奏值',
  condition_bonus: '条件加成', crate: '暴击率'
};

function formatStatValue(stat, value) {
  if (stat === 'atk_pct' || stat === 'def_pct' || stat === 'hp' || stat === 'crate' || stat === 'cdmg' || stat === 'resonance' || stat === 'heal') {
    return (value * 100).toFixed(1) + '%';
  }
  return value.toString();
}

export { renderWeaponDetail };
