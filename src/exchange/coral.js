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
  const n = b.char, std = standard5.some(x => x.startsWith(n)), cost = std ? 270 : 360, used = S.waveBuy[n] || 0;
  const remain = 2 - used;
  if (remain <= 0) return msg('该角色回音频段已 2/2');
  const maxByCoral = Math.floor(S.afterglow / cost);
  const maxN = Math.min(maxByCoral, remain);
  if (maxN <= 0) return msg(`余波不足，每个回音频段需 ${cost}`);
  openModal({
    title: `兑换 ${n} 回音频段`,
    body: `持有 <b class="a">${S.afterglow}</b> 余波珊瑚<br>
单个回音频段消耗 <b>${cost}</b> 余波（${std ? '常驻' : '限定'} 五星）<br>
已购 <b>${used}/2</b> · 最多可再换 <b>${maxN}</b> 个`,
    qty: { min: 1, max: maxN, init: 1, presets: [1, 2].filter(v => v <= maxN) },
    actions: [
      { label: '取消', cls: '', fn: () => {} },
      { label: '确认兑换', cls: 'primary', fn: (num) => {
          const total = num * cost;
          if (S.afterglow < total) return msg('余波不足');
          S.afterglow -= total; S.waveBuy[n] = used + num;
          const realName = Object.keys(S.roles).find(x => x.includes(b.char)) || b.char;
          const o = S.roles[realName] || { n: realName, r: 5, owned: 1, chain: 0, spare: 0, bought: 0, pulled: 0 };
          o.spare += num; o.bought = (o.bought || 0) + num;
          S.roles[realName] = o;
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