// 背包面板：统一展示玩家所有持有物（货币 / 抽卡资源 / 材料 / 药剂 / 武器 / 特殊道具）
import { S, $, msg } from '../state.js';
import { usePotion, useAllPotions, POTIONS, buyStaminaWithAstrite } from '../daily/stamina.js';
import { WEAPON_BOX_OPTIONS } from '../data/podcast-rewards.js';
import { openModal } from '../modal.js';

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
        <div style="font-size:9px;color:var(--dim);margin:3px 0 6px;letter-spacing:.3px">用于精炼 4★ 自选武器（需先领武器箱）</div>
        <button class="mbtn" style="width:100%;font-size:10px;padding:5px" onclick="window.__bagUseRefineStone()" ${pendingBox > 0 ? '' : ''}>使用 1 块</button>
      </div>`;
    }
    html += '</div>';
  }

  // 已拥有武器列表
  const weapons = Object.entries(S.weapons || {});
  if (weapons.length > 0) {
    html += `<div style="font-size:10px;color:var(--muted);letter-spacing:2px;margin:14px 0 6px">已 拥 有 武 器 (${weapons.length})</div>`;
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
    weapons.sort((a, b) => (b[1].r || 0) - (a[1].r || 0))
      .forEach(([name, w]) => {
        const star = '★'.repeat(w.r || 0);
        const starColor = w.r === 5 ? 'var(--gold)' : w.r === 4 ? 'var(--purple)' : 'var(--accent)';
        const eqTag = w.equippedBy ? `<span style="font-size:9px;color:var(--green);margin-left:4px">装备中</span>` : '';
        html += `<div style="border:1px solid var(--line);border-radius:8px;padding:8px 11px;background:rgba(255,255,255,.02)">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <span style="font-size:12px;font-weight:600">${name}${eqTag}</span>
            <span style="font-size:11px;color:${starColor}">${star}</span>
          </div>
          <div style="font-size:10px;color:var(--dim);margin-top:3px">Lv ${w.level || 1} · R${w.refine || 1}${w.equippedBy ? ` · ${w.equippedBy}` : ''}</div>
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
    body: `<div style="color:var(--muted);font-size:12px;margin-bottom:10px">从下面 5 把 4 星武器中任选 1 把（已持有则精炼 +1）</div>
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
  S.podcast.pendingRefine--;
  const target = owned[0];
  const w = S.weapons[target];
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
