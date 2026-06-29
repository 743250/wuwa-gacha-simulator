// 商店
// 数据校准（2026-06）：按鸣潮真实商店档位实装
import { S, msg, fmt } from '../state.js';
import { openModal } from '../modal.js';
import { unlockPaid, unlockPremium } from '../podcast/core.js';

export const shopCatalog = {
  // ===== 月相充值（六档，鸣潮真实档位） =====
  topup: [
    { id: 't60',   name: '月相 × 60',   price: 6,   lunite: 60,   firstDouble: true,
      desc: '入门级 · 适合首充' },
    { id: 't300',  name: '月相 × 300',  price: 30,  lunite: 300,  firstDouble: true,
      desc: '小额补充档位' },
    { id: 't980',  name: '月相 × 980',  price: 98,  lunite: 980,  firstDouble: true,
      desc: '玩家主流档位' },
    { id: 't1980', name: '月相 × 1980', price: 198, lunite: 1980, firstDouble: true,
      desc: '高额档位' },
    { id: 't3280', name: '月相 × 3280', price: 328, lunite: 3280, firstDouble: true,
      desc: '高额档位' },
    { id: 't6480', name: '月相 × 6480', price: 648, lunite: 6480, firstDouble: true,
      desc: '最高档位' }
  ],

  // ===== 月卡：月相观测卡（Lunite Subscription） =====
  // 上限 180 天：超出时不延长天数，而是补 +330 月相（一次性）
  monthly: [
    { id: 'monthly', name: '月相观测卡', price: 30,
      lunite: 300, days: 30, dailyAstrite: 90,
      desc: '立即 300 月相 + 30 天每日 90 星声（合计 2700 星声）<br>可叠加延长，时长上限 180 天；超出上限购买改为 +330 月相，不延长天数<br><b style="color:var(--gold)">购买当天会立即领取一份每日星声</b>' }
  ],

  // ===== 战令：先约电台（Pioneer Podcast）· 按 3.4 官方 =====
  // 改为"解锁付费奖励轨"模型（70 级 BP），购买后已达成等级可追领
  pass: [
    { id: 'bp_basic', name: '先约电台 · 内幕频道', price: 68,
      unlocksPodcast: true,
      desc: '解锁本期付费奖励轨（70 级双线）<br>满级合计：680 星声 + 浮金 ×5 + 唤声 ×2 + 结晶溶剂 ×7 + 4★ 武器自选箱 + 大量养成料<br><b style="color:var(--gold)">需在本期满级才能取得全部</b>',
      limit: 1, period: 'version' },
    { id: 'bp_premium', name: '先约电台 · 寰宇频道', price: 128,
      unlocksPodcast: true, premiumPodcast: true,
      desc: '解锁付费轨 + 立即 +10 级<br>额外赠：浮金 ×8 / 唤声 ×4 / 特级促剂 ×4 / 头像挂件<br><span style="color:var(--muted);font-size:11px">含内幕频道全部内容（从内幕升级差价 ¥60）</span>',
      limit: 1, period: 'version' }
  ],

  // ===== 礼包（鸣潮 3.4 国服 · 按用户提供的官方口径）=====
  bundle: [
    // ---- 求索系列（角色/武器卡池资源，版本限购）----
    { id: 'qsfj_1', name: '求索的浮金珍藏 I', price: 68, type: 'gold',
      astrite: 400, radiant: 5,
      desc: '400 星声 + 浮金波纹 ×5<br>角色卡池抽卡资源 · 版本限购 1 次',
      limit: 1, period: 'version' },
    { id: 'qsfj_2', name: '求索的浮金珍藏 II', price: 198, type: 'gold',
      astrite: 900, radiant: 15,
      desc: '900 星声 + 浮金波纹 ×15<br>角色卡池抽卡资源 · 版本限购 1 次',
      limit: 1, period: 'version' },
    { id: 'qscc_1', name: '求索的铸潮珍藏 I', price: 68, type: 'gold',
      astrite: 400, forging: 5,
      desc: '400 星声 + 铸潮波纹 ×5<br>武器卡池抽卡资源 · 版本限购 1 次',
      limit: 1, period: 'version' },
    { id: 'qscc_2', name: '求索的铸潮珍藏 II', price: 198, type: 'gold',
      astrite: 900, forging: 15,
      desc: '900 星声 + 铸潮波纹 ×15<br>武器卡池抽卡资源 · 版本限购 1 次',
      limit: 1, period: 'version' },

    // ---- 叛客系列（联动卡池资源，仅联动版本可见）----
    { id: 'pkbm_1', name: '叛客的捕梦珍藏', price: 98, type: 'red', collab: true,
      astrite: 400, dream: 10,
      desc: '400 星声 + 捕梦波纹 ×10<br>联动角色卡池资源 · 版本限购 1 次',
      limit: 1, period: 'version' },
    { id: 'pkmy_1', name: '叛客的铭影珍藏 I', price: 30, type: 'red', collab: true,
      astrite: 0, mirage: 5,
      desc: '铭影波纹 ×5<br>联动武器卡池资源 · 版本限购 1 次',
      limit: 1, period: 'version' },
    { id: 'pkmy_2', name: '叛客的铭影珍藏 II', price: 98, type: 'red', collab: true,
      astrite: 400, mirage: 10,
      desc: '400 星声 + 铭影波纹 ×10<br>联动武器卡池资源 · 版本限购 1 次',
      limit: 1, period: 'version' },

    // ---- 准时宝的月度驰援（¥128 月限）----
    // ⚠ 官方定价：¥128 仅 500 星声 + 5 浮金 + 5 铸潮
    //   性价比远低于 ¥30 月卡（30→3000）。模拟器忠实呈现，玩家自行判断
    { id: 'zsb_monthly', name: '准时宝的月度驰援', price: 128, type: 'gold',
      astrite: 500, radiant: 5, forging: 5,
      desc: '500 星声 + 浮金波纹 ×5 + 铸潮波纹 ×5<br>每月限购 1 次',
      limit: 1, period: 'month' },

    // ---- 常驻养成礼包（每月刷新一次）----
    { id: 'rg_exp_pack', name: '共鸣促剂 · 月度补给', price: 30, type: 'green', regular: true,
      astrite: 0, exp_super: 8, exp_high: 20, weapon_book: 0,
      desc: '特级促剂 ×8 + 高级促剂 ×20<br>常驻 · 每月可购买 1 次',
      limit: 1 },
    { id: 'rg_weapon_pack', name: '武器突破石 · 月度补给', price: 30, type: 'green', regular: true,
      astrite: 0, weapon_book: 60,
      desc: '武器突破石 ×60<br>常驻 · 每月可购买 1 次',
      limit: 1 },
    { id: 'rg_mix_pack', name: '养成大礼包 · 月度', price: 68, type: 'green', regular: true,
      astrite: 380, exp_super: 12, weapon_book: 50, crystal_solvent: 4,
      desc: '380 星声 + 特级促剂 ×12 + 武器石 ×50 + 结晶溶剂 ×4<br>常驻 · 每月可购买 1 次',
      limit: 1 },

    // ---- 新手成长礼包（真·永久限购一次）----
    { id: 'newbie_basic', name: '新旅启程礼包', price: 6, type: 'green',
      astrite: 60, exp_mid: 5, weapon_book: 5,
      desc: '60 星声 + 中级促剂 ×5 + 武器石 ×5<br>新手专属 · 永久限购 1 次',
      limit: 1 },
    { id: 'newbie_growth', name: '新旅进阶礼包', price: 30, type: 'green',
      astrite: 300, exp_high: 8, weapon_book: 15, radiant: 3,
      desc: '300 星声 + 高级促剂 ×8 + 武器石 ×15 + 浮金 ×3<br>新手专属 · 永久限购 1 次',
      limit: 1 },
    { id: 'newbie_pro', name: '新旅远征礼包', price: 98, type: 'green',
      astrite: 980, exp_super: 10, weapon_book: 30, radiant: 8,
      desc: '980 星声 + 特级促剂 ×10 + 武器石 ×30 + 浮金 ×8<br>新手专属 · 永久限购 1 次',
      limit: 1 }
  ]
};

// 购买次数判断
function isExhausted(it) {
  if (!it.limit) return false;
  const used = S.shopBuyCount?.[it.id] || 0;
  return used >= it.limit;
}

function recordPurchase(it) {
  if (!S.shopBuyCount) S.shopBuyCount = {};
  S.shopBuyCount[it.id] = (S.shopBuyCount[it.id] || 0) + 1;
}

// 限购剩余次数
function remainingPurchases(it) {
  if (!it.limit) return Infinity;
  const used = S.shopBuyCount?.[it.id] || 0;
  return Math.max(0, it.limit - used);
}

export function applyShopItem(it) {
  if (it.lunite) {
    let amt = it.lunite;
    if (it.firstDouble && S.shopFirstTime[it.id]) { amt *= 2; S.shopFirstTime[it.id] = false; }
    S.lunite += amt;
  }
  if (it.astrite) S.astrite += it.astrite;
  if (it.radiant) S.radiant += it.radiant;
  if (it.forging) S.forging += it.forging;
  if (it.lustrous) S.lustrous += it.lustrous;
  if (it.dream) S.dream = (S.dream || 0) + it.dream;
  if (it.mirage) S.mirage = (S.mirage || 0) + it.mirage;
  // 月卡天数：上限 180 天，超出部分按 1 天换 11 月相返还（≈330/30）
  if (it.days) {
    const beforeDays = S.days;
    const wouldBe = beforeDays + it.days;
    if (wouldBe <= 180) {
      S.days = wouldBe;
    } else if (beforeDays >= 180) {
      // 已经满 180，全部转月相
      S.lunite += 330;
      msg(`月卡已达 180 天上限 · 补偿 330 月相`, false);
    } else {
      // 部分能延，部分转月相
      const canExtend = 180 - beforeDays;
      const overflow = it.days - canExtend;
      S.days = 180;
      S.lunite += Math.round(overflow * 11);
      msg(`月卡延长至上限 180 天 · 超出 ${overflow} 天补偿 ${Math.round(overflow*11)} 月相`, false);
    }
    // ★ 月卡新需求 #15：购买当天也会自动领一份每日星声（如果今天还没领）
    const today = fmt(S.today);
    if (S.days > 0 && S.lastMonthlyClaim !== today) {
      S.days--;
      S.astrite += 90;
      S.lastMonthlyClaim = today;
    }
  }
  // 养成材料
  if (it.exp_low) S.materials.exp_low = (S.materials.exp_low || 0) + it.exp_low;
  if (it.exp_mid) S.materials.exp_mid = (S.materials.exp_mid || 0) + it.exp_mid;
  if (it.exp_high) S.materials.exp_high = (S.materials.exp_high || 0) + it.exp_high;
  if (it.exp_super) S.materials.exp_super = (S.materials.exp_super || 0) + it.exp_super;
  if (it.weapon_book) S.materials.weapon_book = (S.materials.weapon_book || 0) + it.weapon_book;
  if (it.crystal_solvent) S.materials.crystal_solvent = (S.materials.crystal_solvent || 0) + it.crystal_solvent;
  // 先约电台
  if (it.unlocksPodcast) unlockPaid();
  if (it.premiumPodcast) unlockPremium();
  recordPurchase(it);
}

function formatShopReward(it) {
  const parts = [];
  if (it.firstDouble) {
    const first = S.shopFirstTime[it.id];
    parts.push(first ? `<span style="color:var(--gold)">首充翻倍：${it.lunite * 2} 月相</span>` : `${it.lunite} 月相`);
  } else if (it.lunite) parts.push(`${it.lunite} 月相`);
  if (it.astrite) parts.push(`${it.astrite} 星声`);
  if (it.radiant) parts.push(`浮金波纹×${it.radiant}`);
  if (it.forging) parts.push(`铸潮波纹×${it.forging}`);
  if (it.lustrous) parts.push(`唤声涡纹×${it.lustrous}`);
  if (it.dream) parts.push(`捕梦波纹×${it.dream}`);
  if (it.mirage) parts.push(`铭影波纹×${it.mirage}`);
  if (it.exp_super) parts.push(`特级促剂×${it.exp_super}`);
  if (it.exp_high) parts.push(`高级促剂×${it.exp_high}`);
  if (it.exp_mid) parts.push(`中级促剂×${it.exp_mid}`);
  if (it.exp_low) parts.push(`初级促剂×${it.exp_low}`);
  if (it.weapon_book) parts.push(`武器石×${it.weapon_book}`);
  if (it.crystal_solvent) parts.push(`结晶溶剂×${it.crystal_solvent}`);
  if (it.days) parts.push(`30 天每日 ${it.dailyAstrite || 90} 星声`);
  return parts.join(' · ');
}

function findShopItem(id) {
  for (const cat in shopCatalog) {
    const it = shopCatalog[cat].find(x => x.id === id);
    if (it) return it;
  }
  return null;
}

export function buyShop(id) {
  const it = findShopItem(id); if (!it) return;
  if (isExhausted(it)) {
    msg(`已达购买上限（${it.limit} 次）`);
    return;
  }
  const reward = formatShopReward(it);
  const extra = it.firstDouble
    ? `<br><span style="color:var(--dim);font-size:12px">${S.shopFirstTime[id] ? '首次购买可享双倍月相' : '首充双倍已用完'}</span>`
    : '';
  const limitInfo = it.limit
    ? `<br><span style="color:var(--accent);font-size:12px">剩余购买 ${remainingPurchases(it)}/${it.limit} 次</span>`
    : '';
  openModal({
    title: `购买 ${it.name}`,
    body: `<b>¥${it.price}</b><br>${reward}${extra}${limitInfo}<br><br>当前累计已充值 <b class="r">¥${S.spent}</b>`,
    actions: [
      { label: '取消', cls: '', fn: () => {} },
      { label: `确认购买 ¥${it.price}`, cls: 'primary', fn: () => {
        S.spent += it.price;
        applyShopItem(it);
        msg('购买成功', false);
        window.__render();
      }}
    ]
  });
}
window.buyShop = buyShop;

export function convertLunite() {
  if (S.lunite <= 0) return msg('无月相可转');
  openModal({
    title: '月相转星声', body: `将 <b class="g">${S.lunite}</b> 月相全部转为星声（1:1）`,
    actions: [
      { label: '取消', cls: '', fn: () => {} },
      { label: '确认', cls: 'primary', fn: () => { S.astrite += S.lunite; S.lunite = 0; msg('转换成功', false); window.__render(); } }
    ]
  });
}

// 暴露给 UI
export { remainingPurchases };
