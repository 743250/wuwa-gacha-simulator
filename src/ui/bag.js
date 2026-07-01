// 背包面板：统一展示玩家所有持有物（货币 / 抽卡资源 / 材料 / 药剂 / 武器 / 声骸 / 特殊道具）
import { S, $, msg } from '../state.js';
import { usePotion, useAllPotions, POTIONS, buyStaminaWithAstrite } from '../daily/stamina.js';
import { WEAPON_BOX_OPTIONS } from '../data/podcast-rewards.js';
import { openModal, closeModal } from '../modal.js';
import { levelUpEcho, levelUpEchoMax, recycleEcho, previewRecycleEcho, toggleEchoLock, unequipEcho, echoToNext, ECHO_COST_CAP, retuneEchoSubStat, levelUpEchoWithFeed, previewEchoFeed } from '../equip/echoActions.js';
import { getSetById, formatEchoStatValue, formatSetBonus } from '../data/echoes.js';
import { totalExp } from '../equip/actions.js';

export function renderBag() {
  const container = $('paneBag');
  if (!container) return;

  // 各类资源分组
  const groups = [
    {
      title: '货 币',
      items: [
        { name: '星声',   value: S.astrite.toLocaleString(),    desc: '抽卡 / 商店主货币',    color: '#fff' },
        { name: '月相',   value: S.lunite,                      desc: '充值货币 · 可换星声',  color: 'var(--gold)' },
        { name: '累计充值', value: '¥' + S.spent,              desc: '历史充值总额',         color: 'var(--red)' },
        { name: '月卡剩余', value: S.days + ' 天',             desc: '月相观测卡天数',       color: 'var(--green)' }
      ]
    },
    {
      title: '抽 卡 资 源',
      items: [
        { name: '浮金波纹', value: S.radiant,  desc: '角色活动卡池抽卡券',   color: 'var(--r-radiant)' },
        { name: '铸潮波纹', value: S.forging,  desc: '武器活动卡池抽卡券',   color: 'var(--r-forging)' },
        { name: '唤声涡纹', value: S.lustrous, desc: '常驻卡池抽卡券',       color: 'var(--r-lustrous)' },
        { name: '捕梦波纹', value: S.dream || 0, desc: '联动角色卡池抽卡券', color: 'var(--purple)' },
        { name: '铭影波纹', value: S.mirage || 0, desc: '联动武器卡池抽卡券', color: 'var(--accent)' }
      ]
    },
    {
      title: '海 市 珊 瑚',
      items: [
        { name: '余波珊瑚', value: S.afterglow,  desc: '抽到角色武器获得 · 换波纹/回音频段', color: 'var(--accent)' },
        { name: '残振珊瑚', value: S.oscillated, desc: '抽到三星获得 · 换波纹',          color: 'var(--purple)' }
      ]
    },
    {
      title: '养 成 材 料',
      items: [
        { name: '特级共鸣促剂', value: S.materials.exp_super || 0, desc: '20000 共鸣者经验', color: 'var(--gold)' },
        { name: '高级共鸣促剂', value: S.materials.exp_high  || 0, desc: '8000 共鸣者经验',  color: '#fff' },
        { name: '中级共鸣促剂', value: S.materials.exp_mid   || 0, desc: '3000 共鸣者经验',  color: 'var(--accent)' },
        { name: '初级共鸣促剂', value: S.materials.exp_low   || 0, desc: '1000 共鸣者经验',  color: 'var(--green)' },
        { name: '武器突破石',   value: S.materials.weapon_book || 0, desc: '武器升级材料',   color: 'var(--gold)' }
      ]
    },
    {
      title: '体 力',
      items: [
        { name: '结晶波片', value: `${S.stamina} / ${S.staminaMax}`, desc: '副本消耗 · 跨日补满', color: 'var(--green)' }
      ]
    }
  ];

  let html = '<h2 class="col-head" style="margin-top:0">背 包</h2>';
  html += '<div style="font-size:11px;color:var(--muted);margin-bottom:10px;letter-spacing:.5px">所有当前持有的资源和材料</div>';

  groups.forEach(g => {
    html += `<div style="font-size:10px;color:var(--muted);letter-spacing:2px;margin:14px 0 6px">${g.title}</div>`;
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
    g.items.forEach(it => {
      html += `<div style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:rgba(255,255,255,.02)">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span style="font-size:12px;font-weight:600">${it.name}</span>
          <span style="font-size:15px;font-weight:700;color:${it.color}">${it.value}</span>
        </div>
        <div style="font-size:9px;color:var(--dim);margin-top:3px;letter-spacing:.3px">${it.desc}</div>
      </div>`;
    });
    html += '</div>';
  });

  // 体力药剂卡片（带使用按钮）
  html += `<div style="font-size:10px;color:var(--muted);letter-spacing:2px;margin:14px 0 6px">体 力 药 剂</div>`;
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
  Object.values(POTIONS).forEach(p => {
    const have = S.materials[p.id] || 0;
    const canUse = have > 0 && S.stamina < 480;
    const capTag = p.hardCap ? `<span style="font-size:9px;color:var(--muted);margin-left:4px">上限 ${p.hardCap}</span>` : '';
    html += `<div style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:rgba(141,230,166,.04)">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:12px;font-weight:600">${p.name}${capTag}</span>
        <span style="font-size:15px;font-weight:700;color:var(--green)">${p.hardCap ? `${have}/${p.hardCap}` : `×${have}`}</span>
      </div>
      <div style="font-size:9px;color:var(--dim);margin:3px 0 6px;letter-spacing:.3px">${p.desc}</div>
      <div style="display:flex;gap:4px">
        <button class="mbtn" style="flex:1;font-size:10px;padding:5px" onclick="window.__usePotion('${p.id}',1)" ${!canUse ? 'disabled' : ''}>用 1 个</button>
        <button class="mbtn gold" style="flex:1;font-size:10px;padding:5px" onclick="window.__usePotion('${p.id}',${have})" ${!canUse ? 'disabled' : ''}>用全部</button>
      </div>
    </div>`;
  });
  html += '</div>';

  // 一键嗑光按钮
  const totalPotions = Object.keys(POTIONS).reduce((a, k) => a + (S.materials[k] || 0), 0);
  if (totalPotions > 0 && S.stamina < 480) {
    html += `<button class="mbtn gold" style="width:100%;margin-top:8px" onclick="window.__useAllPotions()">
      🧪 一键嗑光所有药剂（${totalPotions} 个）
    </button>`;
  }

  // 特殊道具（电台武器箱 / 烙金银杏）
  const pendingBox = S.podcast?.pendingWeaponBox || 0;
  const pendingRefine = S.podcast?.pendingRefine || 0;
  if (pendingBox > 0 || pendingRefine > 0) {
    html += `<div style="font-size:10px;color:var(--muted);letter-spacing:2px;margin:14px 0 6px">特 殊 道 具</div>`;
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
    if (pendingBox > 0) {
      html += `<div style="border:1px solid rgba(245,207,107,.45);border-radius:8px;padding:9px 11px;background:rgba(245,207,107,.07)">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span style="font-size:12px;font-weight:600;color:var(--gold)">4★ 武器自选箱</span>
          <span style="font-size:15px;font-weight:700;color:var(--gold)">×${pendingBox}</span>
        </div>
        <div style="font-size:9px;color:var(--dim);margin:3px 0 6px;letter-spacing:.3px">来自先约电台 · 5 选 1</div>
        <button class="mbtn gold" style="width:100%;font-size:10px;padding:5px" onclick="window.__bagOpenWeaponBox()">开启</button>
      </div>`;
    }
    if (pendingRefine > 0) {
      html += `<div style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:rgba(195,155,255,.05)">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span style="font-size:12px;font-weight:600;color:var(--purple)">烙金银杏（精炼石）</span>
          <span style="font-size:15px;font-weight:700;color:var(--purple)">×${pendingRefine}</span>
        </div>
        <div style="font-size:9px;color:var(--dim);margin:3px 0 6px;letter-spacing:.3px">用于精炼 4★ 自选武器（从背包选择）</div>
        <button class="mbtn" style="width:100%;font-size:10px;padding:5px" onclick="window.__bagUseRefineStone()">选择武器</button>
      </div>`;
    }
    html += '</div>';
  }

  // 已拥有武器列表 — 小方块卡片（与角色卡片风格一致）
  const weapons = Object.entries(S.weapons || {});
  if (weapons.length > 0) {
    html += `<div style="font-size:10px;color:var(--muted);letter-spacing:2px;margin:14px 0 6px">已 拥 有 武 器 (${weapons.length})</div>`;
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(85px,1fr));gap:6px">';
    weapons.sort((a, b) => {
      const ra = b[1].r || 0, rb = a[1].r || 0;
      if (ra !== rb) return ra - rb;
      const la = b[1].level || 0, lb = a[1].level || 0;
      if (la !== lb) return la - lb;
      return (b[1].refine || 1) - (a[1].refine || 1);
    }).forEach(([name, w]) => {
        const r = w.r || 0;
        const stars = '★'.repeat(r);
        const is5 = r === 5;
        const is4 = r === 4;
        const eqTag = w.equippedBy ? `<div style="position:absolute;top:4px;left:5px;font-size:8px;font-weight:700;padding:1px 5px;border-radius:5px;background:rgba(100,220,140,.18);color:var(--green);letter-spacing:.3px">装</div>` : '';
        const refineBadge = (w.refine || 1) > 1
          ? `<div style="position:absolute;bottom:4px;right:5px;font-size:8px;font-weight:700;padding:1px 4px;border-radius:5px;background:rgba(255,255,255,.08);color:var(--gold);border:1px solid rgba(245,207,107,.3)">R${w.refine}</div>`
          : '';
        const spare = w.spareRefine || 0;
        const spareTag = spare > 0
          ? `<div style="position:absolute;bottom:4px;left:5px;font-size:7px;color:var(--accent);font-weight:600">+${spare}</div>`
          : '';
        html += `<div class="role r${r}" onclick="window.__openWeaponModal('${name.replace(/'/g, "\\'")}')" style="cursor:pointer;position:relative;aspect-ratio:1;border:1px solid var(--line);border-radius:10px;padding:8px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;${is5 ? 'border-color:rgba(245,207,107,.55);background:radial-gradient(circle at 50% 30%,rgba(245,207,107,.18),transparent 70%),rgba(74,54,20,.15);box-shadow:0 0 18px rgba(245,207,107,.18) inset,0 4px 14px rgba(245,207,107,.18)' : is4 ? 'border-color:rgba(195,155,255,.5);background:radial-gradient(circle at 50% 30%,rgba(195,155,255,.16),transparent 70%),rgba(51,35,90,.18);box-shadow:0 0 16px rgba(195,155,255,.16) inset,0 4px 12px rgba(195,155,255,.18)' : ''}">
          ${eqTag}${refineBadge}${spareTag}
          <div style="font-size:10px;letter-spacing:1px;text-align:center;line-height:1;${is5 ? 'color:var(--gold);text-shadow:0 0 6px rgba(245,207,107,.6)' : is4 ? 'color:var(--purple);text-shadow:0 0 6px rgba(195,155,255,.55)' : 'color:var(--accent)'}">${stars}</div>
          <div style="font-size:10px;font-weight:600;text-align:center;letter-spacing:.3px;line-height:1.2;word-break:break-all;${is5 ? 'color:var(--gold)' : is4 ? 'color:#dbc6ff' : 'color:var(--text)'}">${name}</div>
          <div style="font-size:8px;color:var(--muted);text-align:center;letter-spacing:.3px">Lv ${w.level || 1}</div>
        </div>`;
      });
    html += '</div>';
  }

  // 声骸仓库
  const echos = S.echos || [];
  const cap = ECHO_COST_CAP;
  html += `<div style="font-size:10px;color:var(--muted);letter-spacing:2px;margin:14px 0 6px;display:flex;justify-content:space-between;align-items:baseline">
    <span>声 骸 仓 库 (${echos.length})</span>
    <span style="font-size:9px;color:var(--gold)">COST 上限 ${cap}</span>
  </div>`;
  if (echos.length === 0) {
    html += `<div style="border:1px dashed var(--line2);border-radius:8px;padding:14px;text-align:center;color:var(--dim);font-size:11px">
      暂无声骸。前往「冒险 · 副本 · 无音区」战斗掉落获取。
    </div>`;
  } else {
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px">';
    echos.forEach(e => {
      const set = getSetById(Array.isArray(e.set) ? e.set[0] : e.set);
      const color = set?.element ? ({'热熔':'#ff8c5e','冷凝':'#7bd6ff','导电':'#b58cff','气动':'#8de6a6','衍射':'#fff0b0','湮灭':'#c39bff'}[set.element] || '#fff') : '#999';
      const lockIcon = e.lock ? '🔒' : '';
      const eqTag = e.equippedBy ? `<div style="position:absolute;top:3px;left:4px;font-size:8px;color:var(--green);font-weight:700">装:${e.equippedBy}</div>` : '';
      html += `<div class="echo-card" onclick="window.__bagEchoDetail(${e.id})" style="cursor:pointer;position:relative;border:1px solid ${color};border-radius:8px;padding:6px 5px;background:rgba(255,255,255,.02);${e.lock ? 'box-shadow:0 0 8px rgba(245,207,107,.25) inset' : ''}">
        ${eqTag}
        <div style="position:absolute;top:3px;right:4px;font-size:9px;color:var(--gold)">${lockIcon}C${e.cost}</div>
        <div style="font-size:11px;font-weight:700;color:${color};text-align:center;margin-top:10px;word-break:break-all;line-height:1.1">${e.name}</div>
        <div style="font-size:8px;color:var(--muted);text-align:center;margin-top:2px">LV ${e.level} · ${e.element || ''}</div>
        <div style="font-size:8px;color:var(--gold);text-align:center;margin-top:2px">${e.mainStat?.label || ''}</div>
        <div style="font-size:8px;color:var(--gold);text-align:center">${e.mainStat ? formatEchoStatValue(e.mainStat.key, e.mainStat.value) : ''}</div>
        <div style="font-size:8px;color:${color};text-align:center;margin-top:1px;letter-spacing:.3px">${set?.name || ''}</div>
        <div style="display:flex;gap:3px;margin-top:5px;flex-wrap:wrap;justify-content:center" onclick="event.stopPropagation()">
          <button class="mbtn" style="font-size:9px;padding:2px 6px" onclick="window.__bagEchoLevelUp(${e.id})">升级</button>
          <button class="mbtn gold" style="font-size:9px;padding:2px 6px" onclick="window.__bagEchoLevelUpMax(${e.id})">升满</button>
          <button class="mbtn" style="font-size:9px;padding:2px 6px" onclick="window.__bagEchoToggleLock(${e.id})">${e.lock?'解锁':'锁定'}</button>
        </div>
      </div>`;
    });
    html += '</div>';
  }

  container.innerHTML = html;
}

// 桥接到全局
window.__usePotion = (id, count) => {
  const r = usePotion(id, count);
  if (!r.ok) { msg(r.err); return; }
  msg(`回复 ${r.gained} 体力`, false);
  renderBag();
  window.__render();
};

window.__useAllPotions = () => {
  const gained = useAllPotions();
  if (gained === 0) { msg('没有药剂可用'); return; }
  msg(`回复 ${gained} 体力`, false);
  renderBag();
  window.__render();
};

window.__buyStamina = () => {
  const r = buyStaminaWithAstrite();
  if (!r.ok) { msg(r.err); return; }
  msg(`60 星声 → +${r.gained} 波片`, false);
  renderBag();
  window.__render();
};

// 打开待领武器箱
window.__bagOpenWeaponBox = () => {
  if (!S.podcast?.pendingWeaponBox) return msg('没有待开的武器箱');
  S.podcast.pendingWeaponBox--;
  const buttons = WEAPON_BOX_OPTIONS.map(n =>
    `<button class="mbtn" style="margin:4px;min-width:90px" onclick="window.__radioPickWeapon('${n}')">${n}</button>`
  ).join('');
  openModal({
    title: '4★ 武器自选箱',
    body: `<div style="color:var(--muted);font-size:12px;margin-bottom:10px">从下面 5 把 4 星武器中任选 1 把；已持有的武器会转为可精炼次数。</div>
<div style="text-align:center">${buttons}</div>`,
    actions: [{ label: '稍后再选', cls: '', fn: () => {
      S.podcast.pendingWeaponBox++; // 退回
      renderBag();
    }}]
  });
};

window.__bagUseRefineStone = () => {
  if (!S.podcast?.pendingRefine) return msg('没有精炼石');
  const owned = WEAPON_BOX_OPTIONS.filter(n => S.weapons[n]);
  if (owned.length === 0) {
    msg('需先领取 4★ 自选武器才能使用精炼石');
    return;
  }
  const buttons = owned.map(n => {
    const w = S.weapons[n];
    const disabled = (w.refine || 1) >= 5;
    return `<button class="mbtn ${disabled ? '' : 'gold'}" style="margin:4px;min-width:100px" onclick="window.__bagUseRefineStoneOn('${n.replace(/'/g, "\\'")}')" ${disabled ? 'disabled' : ''}>${n}<br><span style="font-size:9px;color:var(--muted)">R${w.refine || 1}/5</span></button>`;
  }).join('');
  openModal({
    title: '选择精炼武器',
    body: `<div style="color:var(--muted);font-size:12px;margin-bottom:10px">消耗 1 个烙金银杏，为一把电台 4★ 武器精炼 +1。</div><div style="text-align:center">${buttons}</div>`,
    actions: [{ label: '取消', cls: '', fn: () => {} }]
  });
};

window.__bagUseRefineStoneOn = (target) => {
  if (!S.podcast?.pendingRefine) return msg('没有精炼石');
  const w = S.weapons[target];
  if (!w) return msg('没有这把武器');
  S.podcast.pendingRefine--;
  if ((w.refine || 1) < 5) {
    w.refine = (w.refine || 1) + 1;
    msg(`${target} 精炼 +1（现 R${w.refine}）`, false);
  } else {
    S.materials.exp_super = (S.materials.exp_super || 0) + 2;
    msg(`${target} 已 5 精 · 补偿特级促剂 ×2`, false);
  }
  renderBag();
  window.__render();
};

// ========== 声骸仓库交互 ==========
// 标记详情 modal 是否从角色面板进入（关闭时回到角色声骸面板）
let _echoDetailFromRole = false;
window.__bagEchoDetail = (id, fromRole = false) => {
  _echoDetailFromRole = !!fromRole;
  const e = S.echos.find(x => x.id === id);
  if (!e) return;
  const box = document.getElementById('modalBox');
  const wasSameEcho = box && box.dataset.echoId === String(id);
  const set = getSetById(Array.isArray(e.set) ? e.set[0] : e.set);
  const subRows = (e.subStats && e.subStats.length
    ? e.subStats.map((s, idx) => {
        if (s.unlocked === false) {
          return `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;border-bottom:1px dashed var(--line);opacity:.5">
            <span style="color:var(--dim)">??? · 未解锁（升至 LV ${(idx+1)*5} 解锁）</span>
            <span style="color:var(--dim)">—</span></div>`;
        }
        const tuner = S.materials.echo_tuner || 0;
        return `<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;padding:2px 0;border-bottom:1px dashed var(--line)">
          <span style="color:var(--muted)">${s.label}</span>
          <span style="display:flex;align-items:center;gap:6px">
            <span style="color:var(--gold)">${formatEchoStatValue(s.key, s.value)}</span>
            <button class="mbtn" style="font-size:9px;padding:1px 5px" onclick="window.__bagEchoRetune(${e.id},${idx})" ${tuner < 1 ? 'disabled' : ''}>调谐</button>
          </span></div>`;
      }).join('')
    : '<div style="color:var(--dim);font-size:11px">无副词条</div>');
  const canLevel = e.level < 25;
  const nextCost = canLevel ? echoToNext(e) : 0;
  openModal({
    title: `${e.name} · LV ${e.level} · COST ${e.cost}`,
    keepScroll: wasSameEcho,
    body: `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">COST ${e.cost} · ${e.element} · ${set?.name || '无套装'}</div>
<div style="font-size:11px;color:var(--muted);margin-bottom:4px">主词条</div>
<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--line);margin-bottom:8px">
  <span>${e.mainStat?.label || ''}</span><span style="color:var(--gold)">${e.mainStat ? formatEchoStatValue(e.mainStat.key, e.mainStat.value) : ''}</span></div>
<div style="font-size:11px;color:var(--muted);margin-bottom:4px">副词条（${(e.subStats||[]).filter(s=>s.unlocked!==false).length}/${(e.subStats||[]).length}）</div>
${subRows}
${set ? `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed var(--line)">
  <div style="color:var(--gold);font-size:11px;margin-bottom:3px">套装效果 · ${set.name}</div>
  <div style="margin-left:10px;font-size:11px">
    <div>· <b>2 件</b>：${formatSetBonus(set.bonus2) || '—'}</div>
    <div>· <b>5 件</b>：${formatSetBonus(set.bonus5) || '—'}</div>
  </div>
</div>` : ''}
<div style="font-size:10px;color:var(--dim);margin-top:8px">累计经验 ${totalExp(e)} · ${e.equippedBy ? `装备于 ${e.equippedBy}` : '未装备'}</div>`,
    actions: [
      ...(canLevel ? [
        { label: `升级 (${nextCost.toLocaleString()} exp)`, cls: 'gold', fn: () => { window.__bagEchoLevelUp(id); } },
        { label: '一键升满', cls: '', fn: () => { window.__bagEchoLevelUpMax(id); } }
      ] : []),
      { label: e.lock ? '解锁' : '锁定', cls: '', fn: () => { window.__bagEchoToggleLock(id); } },
      ...(e.equippedBy ? [{ label: '卸下', cls: '', fn: () => { window.__bagEchoUnequip(id); } }] : []),
      ...(canLevel ? [{ label: '喂料升级', cls: '', fn: () => { window.__bagEchoFeedPick(id); } }] : []),
      ...(!e.lock && !e.equippedBy ? [{ label: '分解', cls: '', fn: () => {
        window.__bagEchoConfirmRecycle(id);
      } }] : []),
      { label: '关闭', cls: '', fn: () => { if (_echoDetailFromRole && typeof window.__reopenRoleEchoTab === 'function') window.__reopenRoleEchoTab(); } }
    ]
  });
  if (box) box.dataset.echoId = String(id);
};

window.__bagEchoLevelUp = (id) => {
  const e = S.echos.find(x => x.id === id);
  if (!e) return;
  const before = totalExp();
  const ok = levelUpEcho(id);
  if (ok) {
    const used = before - totalExp();
    const unlocked = (e.level % 5 === 0) ? ' · 新副词条槽位已解锁' : '';
    msg(`${e.name} 升至 LV ${e.level}（消耗 ${used.toLocaleString()} 经验${unlocked}）`, false);
    window.__bagEchoDetail(id, _echoDetailFromRole);
  }
  renderBag();
  window.__render();
};

window.__bagEchoLevelUpMax = (id) => {
  const e = S.echos.find(x => x.id === id);
  if (!e) return;
  const before = totalExp();
  const count = levelUpEchoMax(id);
  const used = before - totalExp();
  if (count > 0) {
    msg(`${e.name} 一键升至 LV ${e.level}（升 ${count} 级 · 消耗 ${used.toLocaleString()} 经验）`, false);
    window.__bagEchoDetail(id, _echoDetailFromRole);
  } else if (e.level >= 25) {
    msg('声骸已满级');
  } else {
    msg('经验不足，无法升级');
  }
  renderBag();
  window.__render();
};

window.__bagEchoRecycle = (id) => {
  const e = S.echos.find(x => x.id === id);
  if (!e) return;
  const res = recycleEcho(id);
  if (!res.ok) { if (res.err) msg(res.err); else msg('分解失败（已装备/已锁定？）'); }
  if (_echoDetailFromRole && typeof window.__reopenRoleEchoTab === 'function') {
    window.__reopenRoleEchoTab();
  } else {
    renderBag();
    window.__render();
  }
};

window.__bagEchoConfirmRecycle = (id) => {
  const e = S.echos.find(x => x.id === id);
  if (!e) return;
  const preview = previewRecycleEcho(id);
  if (!preview.ok) { if (preview.err) msg(preview.err); return; }
  const lines = preview.returns.map(r => `<div style="margin:2px 0">· ${r.label} ×${r.n}</div>`).join('');
  openModal({
    title: `分解 ${e.name}`,
    body: `<div style="font-size:11px;color:var(--dim)">LV ${e.level} · COST ${e.cost} · 累计经验 ${totalExp(e)}</div>
      <div style="margin-top:8px;font-size:12px">将返还：</div>
      <div style="font-size:12px;color:var(--gold)">${lines}</div>`,
    actions: [
      { label: '确认分解', cls: 'gold', fn: () => { window.__bagEchoRecycle(id); } },
      { label: '取消', cls: '', fn: () => {} }
    ]
  });
};

// 声骸喂料选料 modal
window.__bagEchoFeedPick = (id) => {
  const target = S.echos.find(x => x.id === id);
  if (!target) return;
  if (target.level >= 25) { msg('目标声骸已满级'); return; }
  const candidates = S.echos.filter(e => {
    if (e.id === target.id) return false;
    if (e.equippedBy) return false;
    if (e.lock) return false;
    return true;
  });
  if (candidates.length === 0) {
    openModal({
      title: '喂料升级',
      body: `<div style="font-size:12px;color:var(--dim)">没有可作为材料的备用声骸。
        <br>要求：未装备 / 未锁定 / 非目标声骸本身。
        <br>注：未投入经验的声骸喂料无收益。</div>`,
      actions: [{ label: '关闭', cls: '', fn: () => {} }]
    });
    return;
  }
  const rows = candidates.map(e => {
    const preview = previewEchoFeed(target.id, e.id);
    const tip = preview.ok
      ? `返还特级促剂 ×${preview.exp_super_count}（约升 ${preview.est_levels} 级）`
      : (preview.err || '不可用');
    const usable = preview.ok;
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px;border:1px solid var(--border);border-radius:6px;margin-bottom:4px${usable?'':';opacity:0.5'}">
      <div style="flex:1">
        <div style="font-weight:600;font-size:12px">${e.name} <span style="color:var(--muted);font-weight:400">C${e.cost}·Lv${e.level}</span></div>
        <div style="font-size:10px;color:var(--dim)">${tip}</div>
      </div>
      <button class="mbtn gold" style="font-size:11px;padding:5px 10px" ${usable?'':'disabled'} onclick="window.__bagEchoFeedDo(${target.id}, ${e.id})">喂料</button>
    </div>`;
  }).join('');
  openModal({
    title: `喂料升级 · ${target.name}`,
    body: `<div style="font-size:11px;color:var(--dim);margin-bottom:8px">选一个备用声骸作材料。被喂声骸累计经验的 80% 折成特级共鸣促剂入账，目标声骸随后逐级消耗升级。</div>
    <div style="max-height:50vh;overflow:auto">${rows}</div>`,
    className: 'role-modal',
    actions: [{ label: '取消', cls: '', fn: () => {} }]
  });
};

window.__bagEchoFeedDo = (targetId, feedId) => {
  const res = levelUpEchoWithFeed(targetId, feedId);
  if (!res.ok) { msg(res.err); return; }
  msg(`${res.target} 喂料 ${res.feed}：返还 ${res.exp_super_count} 特级促剂，连升 ${res.levels_gained} 级至 LV${res.final_level}`, false);
  renderBag();
  window.__render();
  // 升级完成后再打开一次目标详情
  if (typeof window.__bagEchoDetail === 'function') window.__bagEchoDetail(targetId, _echoDetailFromRole);
};

window.__bagEchoToggleLock = (id) => {
  toggleEchoLock(id);
  window.__bagEchoDetail(id, _echoDetailFromRole);
  renderBag();
};

window.__bagEchoUnequip = (id) => {
  const e = S.echos.find(x => x.id === id);
  if (!e) return;
  const ok = unequipEcho(id);
  if (ok) msg(`已卸下 ${e.name}`, false);
  if (_echoDetailFromRole && typeof window.__reopenRoleEchoTab === 'function') {
    window.__reopenRoleEchoTab();
  } else {
    renderBag();
    window.__render();
  }
};

window.__bagEchoRetune = (id, idx) => {
  const e = S.echos.find(x => x.id === id);
  if (!e) return;
  const r = retuneEchoSubStat(id, idx);
  if (!r.ok) { msg(r.err); return; }
  msg(`${e.name} · ${r.label} 调谐：${formatEchoStatValue(e.subStats[idx].key, r.oldVal)} → ${formatEchoStatValue(e.subStats[idx].key, r.newVal)}`, false);
  window.__bagEchoDetail(id, _echoDetailFromRole);
  renderBag();
  window.__render();
};
