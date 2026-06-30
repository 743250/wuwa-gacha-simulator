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
    // 战斗内实际数值（精炼缩放后）
    html += renderWeaponRuntime(data, refineMult, refine);
  } else {
    // 老格式回退：堆 passive + triggers 行
    const staticPassives = (data.passive || []).map(p => {
      const v = (p.value * refineMult * 100).toFixed(0);
      return `${PASSIVE_TYPE_LABEL[p.type] || p.type}${p.element ? ' · ' + p.element : ''} +${v}%`;
    });
    if (staticPassives.length) {
      html += `<div style="color:var(--accent);margin-top:2px">▸ ${staticPassives.join(' · ')}</div>`;
    }
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

// 战斗实时数值：常驻被动 + 触发被动（带精炼数值 + 公式 tooltip）
function renderWeaponRuntime(data, refineMult, refine = 1) {
  const ABSOLUTE_VALUE_EFFECTS = new Set(['concerto_refund']);
  const lines = [];
  (data.passive || []).forEach(p => {
    const origPct = (p.value * 100).toFixed(1).replace(/\.0$/, '');
    const v = p.value * refineMult * 100;
    const vStr = v.toFixed(v % 1 === 0 ? 0 : 1);
    const tip = tipAttrEsc(`<b style="color:var(--gold)">精炼公式</b><br>= 原值 <b>${origPct}%</b> × 精 倍率 <b>${refineMult.toFixed(2)}</b><br>= <b style="color:var(--accent)">${vStr}%</b>`);
    const valStr = refineMult === 1.0
      ? `<b>+${vStr}%</b>`
      : `<span class="tip" data-tip='${tip}'><b>+${vStr}%</b></span>`;
    lines.push(`<div style="color:var(--accent);font-size:10px">▸ ${PASSIVE_TYPE_LABEL[p.type] || p.type}${p.element ? '·' + p.element : ''} ${valStr}（常驻）</div>`);
  });
  (data.triggers || []).forEach(t => {
    const trig = TRIGGER_LABEL[t.on] || t.on;
    const eff = EFFECT_LABEL[t.effect] || t.effect;
    const stacks = t.maxStacks > 1 ? ` ×${t.maxStacks} 层` : '';
    const dur = t.duration && t.duration < 99 ? ` · ${t.duration} 回合` : '';
    const isAbsolute = ABSOLUTE_VALUE_EFFECTS.has(t.effect);
    const v = t.value * refineMult;
    let origLabel, scaledLabel;
    if (isAbsolute) {
      origLabel = `${Math.round(t.value)} 点`;
      scaledLabel = `${Math.round(v)} 点`;
    } else {
      origLabel = `${(t.value * 100).toFixed(0)}%`;
      const pct = v * 100;
      scaledLabel = `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
    }
    const tip = tipAttrEsc(`<b style="color:var(--gold)">精炼公式</b><br>= 原值 <b>${origLabel}</b> × 精 倍率 <b>${refineMult.toFixed(2)}</b><br>= <b style="color:var(--accent)">${scaledLabel}</b>`);
    const valStr = refineMult === 1.0
      ? `<b>+${scaledLabel}</b>`
      : `<span class="tip" data-tip='${tip}'><b>+${scaledLabel}</b></span>`;
    lines.push(`<div style="color:var(--gold2);font-size:10px">⚡ ${trig} → ${eff}${t.element ? '(' + t.element + ')' : ''} ${valStr}${stacks}${dur}</div>`);
  });
  if (!lines.length) return '';
  // 精炼倍率 tooltip：解释 1.0 / 1.25 / 1.5 / 1.75 / 2.0 怎么算出来的
  const refineTip = tipAttrEsc(`<b style="color:var(--gold)">精炼倍率</b><br>= 1 + (精炼 ${refine} − 1) × 0.25<br>= <b style="color:var(--accent)">${refineMult.toFixed(2)}</b><br><span style="color:var(--muted);font-size:10px">精 1: ×1.00 · 精 2: ×1.25 · 精 3: ×1.50 · 精 4: ×1.75 · 精 5: ×2.00</span>`);
  return `<div style="margin-top:5px;padding-top:5px;border-top:1px dashed var(--line)">
    <div style="font-size:9px;color:var(--muted);letter-spacing:1.5px;margin-bottom:3px">战 斗 内 数 值（含精炼 <span class="tip" data-tip='${refineTip}'>×${refineMult.toFixed(2)}</span>）</div>
    ${lines.join('')}
  </div>`;
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

// 对原版共鸣链文案做关键词高亮（不改语义，只加 <b class="term-xxx">）
// 顺序要从长到短，避免"共鸣解放"被"共鸣"先匹配。
const CHAIN_TERM_PATTERNS = [
  // 数值百分比 / 数值秒数（最先匹配，避免影响后续文本）
  { re: /(\d+(?:\.\d+)?%)/g,                                                  cls: 'term-num' },
  { re: /(\d+(?:\.\d+)?\s*(?:秒|回合|层|点|次))/g,                            cls: 'term-num' },
  // 招式术语（长串优先 — 角色专属技能名先匹配，防止贪心截断）
  { re: /(看潮怒风哮之刃|听骑士从心祈愿)/g,                                    cls: 'term-burst' },
  { re: /(共鸣解放[··]终末回环|共鸣解放|终末回环)/g,                       cls: 'term-burst' },
  { re: /(共鸣技能[··][一-龥]{2,6}|共鸣技能)/g,                   cls: 'term-skill' },
  { re: /(共鸣回路|延奏技能|变奏技能|变奏|延奏|协奏)/g, replaceCls: dynamicTermCls },
  { re: /(重击)/g,                                                            cls: 'term-heavy' },
  { re: /(普攻)/g,                                                            cls: 'term-normal' },
  // 角色独有资源/状态名
  { re: /(星蝶|星域|破阵值|破阵|离火|韶光|晶体|红椿|杀意|猎杀阈值|决意|气动侵蚀|衍射失序|心眼模式|心眼[··][征劫冲]|心眼|焰羽)/g, cls: 'term-resource' },
  // 折枝 专属术语（长串优先 — 墨鹤领域需排在墨鹤之前）
  { re: /(墨鹤领域|墨鹤|白鹤|点睛|鹤影)/g, cls: 'term-resource' },
  // 卡提希娅 专属术语
  { re: /(风蚀效应|芙露德莉斯)/g, cls: 'term-resource' },
  { re: /(人权|神权|异权)/g, cls: 'term-resource' },
  // 弗洛洛 专属术语（长串优先 — 谱曲终末需排在乐声/余响前）
  { re: /(谱曲终末|往日深渊的圆舞曲)/g, cls: 'term-heavy' },
  { re: /(指挥状态|定音|赫卡忒|乐声|余响)/g, cls: 'term-resource' },
  { re: /(形态之力)/g, cls: 'term-forte' }
];

function dynamicTermCls(t) {
  if (t.includes('变奏')) return 'term-variation';
  if (t.includes('延奏')) return 'term-outro';
  if (t.includes('协奏')) return 'term-concerto';
  if (t.includes('回路')) return 'term-forte';
  return 'term-normal';
}

// 先把已经是 <b ...> 的部分锁住（占位），高亮完再换回去
function highlightChainTerms(text) {
  if (!text) return '';
  // 已经含 <b>，跳过避免双重包裹
  if (/<b\s+class="term-/.test(text)) return text;
  let out = String(text);
  CHAIN_TERM_PATTERNS.forEach(p => {
    out = out.replace(p.re, (m) => {
      const cls = p.replaceCls ? p.replaceCls(m) : p.cls;
      return `<b class="${cls}">${m}</b>`;
    });
  });
  return out;
}

export { renderWeaponDetail, highlightChainTerms };
