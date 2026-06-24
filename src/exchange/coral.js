// 海市兑换 + 顶部资源条 +号
import { S, msg } from '../state.js';
import { cur } from '../gacha/core.js';
import { standard5 } from '../data/chars.js';
import { openModal } from '../modal.js';

export function openExchangeModal(tideKeyArg, tideNameArg, coralType) {
  const coralName = coralType === 'afterglow' ? '余波珊瑚' : '残振珊瑚';
  const unit = coralType === 'afterglow' ? 8 : 70;
  const have = S[coralType];
  const maxByCoral = Math.floor(have / unit);
  let limit = Infinity;
  if (coralType === 'oscillated') {
    limit = 7 - (S.oscBuy[tideKeyArg] || 0);
  }
  const maxN = Math.min(maxByCoral, limit);
  if (maxN <= 0) {
    msg(coralType === 'oscillated' && limit <= 0 ? '本版本该波纹已 7/7' : `${coralName}不足`); return;
  }
  let qty = Math.min(1, maxN);
  openModal({
    title: `兑换 ${tideNameArg}`,
    body: `持有 <b class="a">${have}</b> ${coralName}（每 <b>${unit}</b> 换 1 个 ${tideNameArg}）<br>
${coralType === 'oscillated' ? `本版本已兑换 <b>${S.oscBuy[tideKeyArg] || 0}/7</b><br>` : ''}
最多可换 <b>${maxN}</b> 次`,
    qty: { min: 1, max: maxN, init: qty, presets: [1, 5, maxN].filter((v, i, a) => v > 0 && v <= maxN && a.indexOf(v) === i) },
    actions: [
      { label: '取消', cls: '', fn: () => {} },
      { label: '确认兑换', cls: 'primary', fn: (n) => {
          const cost = n * unit;
          if (S[coralType] < cost) return msg('珊瑚不足');
          S[coralType] -= cost; S[tideKeyArg] += n;
          if (coralType === 'oscillated') S.oscBuy[tideKeyArg] = (S.oscBuy[tideKeyArg] || 0) + n;
          msg(`已获得 ${n} 个 ${tideNameArg}`, false); window.__render();
        }
      }
    ]
  });
}
window.openExchangeModal = openExchangeModal;

export function openWaveModal() {
  const b = cur(); if (!b) return msg('无卡池');
  const n = b.char, std = standard5.some(x => x.startsWith(n)), cost = std ? 270 : 360;

  // ★ #10：角色波段按缺链上限兑换
  // 规则：必须拥有该角色（否则去抽完整角色再说），且角色未满 6 链
  // 缺的链数 = 6 - 当前链数
  //   差 1 件（缺 1 链） → 只能换 1
  //   差 2 件及以上 → 可以一次买到 2 个
  // 同时保持版本期内 waveBuy[n] ≤ 2 的上限（鸣潮商店原始限制）
  const realName = Object.keys(S.roles).find(x => x === n || x.includes(n)) || n;
  const owned = S.roles[realName];
  if (!owned || owned.owned <= 0) {
    return msg(`没有 ${n}，无法兑换其回音频段`);
  }
  if (owned.chain >= 6) return msg(`${n} 已满 6 链，无需兑换`);

  const lackingChains = 6 - owned.chain;            // 还差几链
  const perVersionLeft = 2 - (S.waveBuy[n] || 0);   // 本版本剩余 2/2 上限
  // 按"差 1 → 1 次"、"差 2+ → 2 次"换算单次最多
  const lackingLimit = lackingChains >= 2 ? 2 : 1;
  const maxByLogic = Math.min(perVersionLeft, lackingLimit);
  if (maxByLogic <= 0) {
    if (perVersionLeft <= 0) return msg('本版本该角色波段已 2/2');
    return msg('该角色已无可激活的共鸣链');
  }
  const maxByCoral = Math.floor(S.afterglow / cost);
  const maxN = Math.min(maxByCoral, maxByLogic);
  if (maxN <= 0) return msg(`余波不足，每个回音频段需 ${cost}`);
  openModal({
    title: `兑换 ${n} 回音频段`,
    body: `持有 <b class="a">${S.afterglow}</b> 余波珊瑚<br>
单个回音频段消耗 <b>${cost}</b> 余波（${std ? '常驻' : '限定'} 五星）<br>
${n} 当前链数 <b>${owned.chain}/6</b> · 还差 <b style="color:var(--gold)">${lackingChains}</b> 链<br>
${lackingChains >= 2 ? '差 2 及以上链 → 本次最多可换 <b>2</b> 个' : '只差 1 链 → 本次最多可换 <b>1</b> 个'}<br>
本版本累计已购 <b>${S.waveBuy[n] || 0}/2</b> · 综合可换 <b>${maxN}</b> 个`,
    qty: { min: 1, max: maxN, init: 1, presets: [1, 2].filter(v => v <= maxN) },
    actions: [
      { label: '取消', cls: '', fn: () => {} },
      { label: '确认兑换', cls: 'primary', fn: (num) => {
          const total = num * cost;
          if (S.afterglow < total) return msg('余波不足');
          // 二次校验（防 modal 期间数据变化）
          const o2 = S.roles[realName];
          if (!o2 || o2.chain >= 6) return msg('已满 6 链');
          S.afterglow -= total; S.waveBuy[n] = (S.waveBuy[n] || 0) + num;
          o2.spare += num; o2.bought = (o2.bought || 0) + num;
          S.roles[realName] = o2;
          msg(`已获得 ${num} 个回音频段`, false); window.__render();
        }
      }
    ]
  });
}
window.openWaveModal = openWaveModal;

const RES_META = {
  radiant: { n: '浮金波纹', from: '星声', rate: 160, desc: '1 个 = 160 星声' },
  forging: { n: '铸潮波纹', from: '星声', rate: 160, desc: '1 个 = 160 星声' },
  lustrous: { n: '唤声涡纹', from: '星声', rate: 160, desc: '1 个 = 160 星声' },
  astrite: { n: '星声', from: '月相', rate: 1, desc: '1 月相 = 1 星声' },
  lunite: { n: '月相', from: '充值', rate: 0, desc: '仅可通过商店充值获得' }
};

export function openTopup(key) {
  const m = RES_META[key]; if (!m) return;
  if (key === 'lunite') {
    openModal({
      title: '补充月相',
      body: `月相只能在商店充值获得。<br>当前持有 <b class="g">${S.lunite}</b>，累计充值 <b class="r">¥${S.spent}</b>。<br><br>点击下方"打开商店"前往月相充值档位。`,
      actions: [
        { label: '取消', cls: '', fn: () => {} },
        { label: '打开商店', cls: 'primary', fn: () => { const t = document.querySelector('.s-tab[data-s="shop"]'); if (t) t.click(); } }
      ]
    });
    return;
  }
  if (key === 'astrite') {
    const have = S.lunite;
    if (have <= 0) {
      openModal({
        title: '兑换星声',
        body: `星声可由月相 1:1 兑换。<br>当前月相 <b class="r">0</b>，无法兑换。<br><br>请先在商店充值月相。`,
        actions: [
          { label: '取消', cls: '', fn: () => {} },
          { label: '打开商店', cls: 'primary', fn: () => { const t = document.querySelector('.s-tab[data-s="shop"]'); if (t) t.click(); } }
        ]
      });
      return;
    }
    openModal({
      title: '月相 → 星声',
      body: `持有 <b class="g">${have}</b> 月相，最多可换 <b class="a">${have}</b> 星声（1:1）。<br>当前星声 <b class="a">${S.astrite.toLocaleString()}</b>。`,
      qty: { min: 1, max: have, init: have, presets: [Math.min(60, have), Math.min(300, have), have].filter((v, i, a) => v > 0 && a.indexOf(v) === i) },
      actions: [
        { label: '取消', cls: '', fn: () => {} },
        { label: '确认兑换', cls: 'primary', fn: (n) => {
            if (S.lunite < n) return msg('月相不足');
            S.lunite -= n; S.astrite += n;
            msg(`兑换 ${n} 星声`, false); window.__render();
          }
        }
      ]
    });
    return;
  }
  // 三色波纹
  const haveAst = S.astrite, haveLun = S.lunite;
  const maxByAst = Math.floor(haveAst / 160);
  const maxByAll = Math.floor((haveAst + haveLun) / 160);
  if (maxByAll <= 0) {
    openModal({
      title: `兑换 ${m.n}`,
      body: `需要 <b class="g">160</b> 星声兑换 1 个 ${m.n}。<br>当前星声 <b class="a">${haveAst.toLocaleString()}</b>、月相 <b class="g">${haveLun}</b>，资源不足。<br><br>可前往商店补充月相。`,
      actions: [
        { label: '取消', cls: '', fn: () => {} },
        { label: '打开商店', cls: 'primary', fn: () => { const t = document.querySelector('.s-tab[data-s="shop"]'); if (t) t.click(); } }
      ]
    });
    return;
  }
  openModal({
    title: `兑换 ${m.n}`,
    body: `<b>160</b> 星声 → <b>1</b> 个 ${m.n}<br>
当前 <b class="a">${haveAst.toLocaleString()}</b> 星声、<b class="g">${haveLun}</b> 月相<br>
仅星声最多换 <b>${maxByAst}</b> 个，含月相补足最多 <b>${maxByAll}</b> 个`,
    qty: { min: 1, max: maxByAll, init: Math.min(1, maxByAll), presets: [1, 10, Math.min(80, maxByAll), maxByAll].filter((v, i, a) => v > 0 && a.indexOf(v) === i) },
    actions: [
      { label: '取消', cls: '', fn: () => {} },
      { label: '确认兑换', cls: 'primary', fn: (n) => {
          const cost = n * 160;
          if (haveAst + haveLun < cost) return msg('资源不足');
          let pay = cost;
          const fromAst = Math.min(pay, S.astrite); S.astrite -= fromAst; pay -= fromAst;
          if (pay > 0) { S.lunite -= pay; }
          S[key] += n;
          msg(`兑换 ${n} 个 ${m.n}`, false); window.__render();
        }
      }
    ]
  });
}
window.openTopup = openTopup;

// 顶部体力 + 号：弹"补充体力"面板（药剂 + 60 星声急救）
export function openStaminaModal() {
  const have = (id) => S.materials[id] || 0;
  const hasCond = have('condensed_waveplate');
  const hasSolv = have('crystal_solvent');
  const POTION_CAP = 480;
  const canDoAnything = S.stamina < POTION_CAP;

  const rows = [];
  rows.push(`<div style="font-size:12px;color:var(--muted);margin-bottom:10px">当前体力 <b class="g">${S.stamina}/${S.staminaMax}</b>（药剂上探至 ${POTION_CAP}）</div>`);

  rows.push(`<div style="display:grid;grid-template-columns:1fr;gap:6px">
    <div style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:rgba(141,230,166,.04)">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:12px;font-weight:600">凝缩波片</span>
        <span style="font-size:14px;color:var(--green)">${hasCond}/5</span>
      </div>
      <div style="font-size:10px;color:var(--dim);margin:3px 0 6px">+60 体力 · 上限 5</div>
      <button class="mbtn" style="width:100%;font-size:11px;padding:5px" onclick="window.__staminaUse('condensed_waveplate',1)" ${hasCond > 0 && canDoAnything ? '' : 'disabled'}>使用 1 个</button>
    </div>
    <div style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:rgba(141,230,166,.04)">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:12px;font-weight:600">结晶溶剂</span>
        <span style="font-size:14px;color:var(--green)">×${hasSolv}</span>
      </div>
      <div style="font-size:10px;color:var(--dim);margin:3px 0 6px">+60 体力 · 无上限</div>
      <div style="display:flex;gap:4px">
        <button class="mbtn" style="flex:1;font-size:11px;padding:5px" onclick="window.__staminaUse('crystal_solvent',1)" ${hasSolv > 0 && canDoAnything ? '' : 'disabled'}>用 1 个</button>
        <button class="mbtn gold" style="flex:1;font-size:11px;padding:5px" onclick="window.__staminaUse('crystal_solvent',${hasSolv})" ${hasSolv > 0 && canDoAnything ? '' : 'disabled'}>用全部</button>
      </div>
    </div>
    <div style="border:1px solid rgba(245,207,107,.3);border-radius:8px;padding:9px 11px;background:rgba(245,207,107,.04)">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:12px;font-weight:600">紧急补充</span>
        <span style="font-size:14px;color:var(--gold)">60 星声</span>
      </div>
      <div style="font-size:10px;color:var(--dim);margin:3px 0 6px">60 星声 → 60 波片（鸣潮紧急通道）</div>
      <button class="mbtn gold" style="width:100%;font-size:11px;padding:5px" onclick="window.__staminaBuy()" ${S.astrite >= 60 && canDoAnything ? '' : 'disabled'}>购买 1 次</button>
    </div>
  </div>`);

  openModal({
    title: '补充体力',
    body: rows.join(''),
    actions: [{ label: '关闭', cls: '', fn: () => {} }]
  });
}
window.openStaminaModal = openStaminaModal;

// 嗑药 / 买体力的桥接（renderBag 已经有 __usePotion，这里独立一份以便 modal 关闭后重渲染）
window.__staminaUse = (id, n) => {
  if (window.__usePotion) {
    window.__usePotion(id, n);
    // 重开 modal 刷新数字
    setTimeout(() => { document.getElementById('modal').classList.remove('on'); openStaminaModal(); }, 50);
  }
};
window.__staminaBuy = () => {
  if (window.__buyStamina) {
    window.__buyStamina();
    setTimeout(() => { document.getElementById('modal').classList.remove('on'); openStaminaModal(); }, 50);
  }
};