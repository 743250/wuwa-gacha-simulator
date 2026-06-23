// 背包面板：统一展示玩家所有持有物
import { S, $, msg } from '../state.js';
import { usePotion, useAllPotions, POTIONS } from '../daily/stamina.js';

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
    html += `<div style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:rgba(141,230,166,.04)">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:12px;font-weight:600">${p.name}</span>
        <span style="font-size:15px;font-weight:700;color:var(--green)">×${have}</span>
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

  // 角色和武器数量统计
  const roleTotal = Object.values(S.roles).filter(r => r.owned > 0).length;
  const role5 = Object.values(S.roles).filter(r => r.owned > 0 && r.r === 5).length;
  const role4 = Object.values(S.roles).filter(r => r.owned > 0 && r.r === 4).length;
  const weaponTotal = Object.keys(S.weapons).length;
  const weapon5 = Object.values(S.weapons).filter(w => w.r === 5).length;
  const weapon4 = Object.values(S.weapons).filter(w => w.r === 4).length;
  html += `<div style="font-size:10px;color:var(--muted);letter-spacing:2px;margin:14px 0 6px">收 藏</div>`;
  html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
    <div style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:rgba(255,255,255,.02)">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:12px;font-weight:600">已拥有角色</span>
        <span style="font-size:15px;font-weight:700;color:var(--gold)">${roleTotal}</span>
      </div>
      <div style="font-size:9px;color:var(--dim);margin-top:3px">★5 × ${role5} · ★4 × ${role4}</div>
    </div>
    <div style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:rgba(255,255,255,.02)">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:12px;font-weight:600">已拥有武器</span>
        <span style="font-size:15px;font-weight:700;color:var(--accent)">${weaponTotal}</span>
      </div>
      <div style="font-size:9px;color:var(--dim);margin-top:3px">★5 × ${weapon5} · ★4 × ${weapon4}</div>
    </div>
  </div>`;

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
