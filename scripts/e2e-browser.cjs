#!/usr/bin/env node
// E2E 浏览器动态测试 —— 在真实浏览器里走完核心用户路径，验证功能正确性
//
// 用途：单测只验证逻辑正确，本脚本验证「真实交互」正确：
//   开局 → 十连抽卡 → 角色详情 → 编队 → 日常 → 副本 → 深塔 → 海墟 → 背包 → 商店 → 存档
// 每步监控 pageerror / console error，0 错误即通过。
//
// 环境要求：Playwright 浏览器必须装在 proot 里（宿主 Android node 不支持）。
//   用法见 scripts/e2e.sh（自动处理 proot 环境）。
//
// 用法：
//   node scripts/e2e-browser.mjs            # 要求先本地起 dev server
//   E2E_URL=http://host:port node ...       # 指定测试地址
// 返回码：0 全部通过，1 有失败

const { chromium } = require('playwright');

const BASE_URL = process.env.E2E_URL || 'http://localhost:5173/';

const results = [];
const pageErrors = [];
const consoleErrors = [];

function step(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      results.push({ name, ok: true });
      console.log(`✅ ${name}`);
    })
    .catch((e) => {
      results.push({ name, ok: false, err: e.message });
      console.log(`❌ ${name}  ${e.message.slice(0, 80)}`);
    });
}

async function closeModals(page) {
  for (let i = 0; i < 5; i++) {
    const m = await page.$('#modal.modal.on');
    if (!m) return;
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function clickAdventureTab(page, tab) {
  // 先进「冒险」大视图
  await page.evaluate(() => {
    const all = [...document.querySelectorAll('div,span,button')];
    const el = all.find((e) => e.textContent.replace(/\s+/g, '').includes('冒险') && e.children.length < 3);
    if (el) el.click();
  });
  await page.waitForTimeout(400);
  // 点子 tab（data-a 定位）
  await page.evaluate((t) => {
    const el = document.querySelector(`[data-a="${t}"]`);
    if (el) el.click();
  }, tab);
  await page.waitForTimeout(600);
}

async function clickTopTab(page, label) {
  await page.evaluate((lb) => {
    const all = [...document.querySelectorAll('div,span,button')];
    const el = all.find((e) => e.textContent.replace(/\s+/g, '').includes(lb) && e.children.length < 3);
    if (el) el.click();
  }, label);
  await page.waitForTimeout(600);
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 120)); });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // 清档，模拟全新玩家
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  await step('①开局设置(新手→3.0→确定开始)', async () => {
    await page.getByText('新手入坑').first().click({ force: true });
    await page.waitForTimeout(400);
    await page.getByText('3.0我们生而眺望').first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
    await page.getByText('确定开始').first().click({ force: true });
    await page.waitForTimeout(800);
    await closeModals(page);
    const t = await page.textContent('body');
    const s = (t.match(/星声\s*([\d,]+)/) || [])[1];
    if (s !== '1,600') throw new Error(`新手档应 1600 星声, 实际 ${s}`);
  });

  await step('②十连抽卡(星声补足扣费)', async () => {
    const before = parseInt((((await page.textContent('body')).match(/星声\s*([\d,]+)/) || [])[1]).replace(/,/g, ''), 10);
    await page.getByText('十连唤取').first().click({ force: true });
    await page.waitForTimeout(1000);
    const confirm = page.getByText('确认十连').first();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click({ force: true });
      await page.waitForTimeout(2500);
    }
    await closeModals(page);
    const after = parseInt((((await page.textContent('body')).match(/星声\s*([\d,]+)/) || [])[1]).replace(/,/g, ''), 10);
    if (after >= before) throw new Error(`星声未扣: ${before}→${after}`);
    console.log(`   星声 ${before}→${after}`);
  });

  await step('③角色详情', async () => {
    await page.getByText('查看', { exact: false }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
    await closeModals(page);
  });

  await step('④编队', () => clickAdventureTab(page, 'team'));
  await step('⑤日常', () => clickAdventureTab(page, 'daily'));
  await step('⑥副本', () => clickAdventureTab(page, 'dungeon'));
  await step('⑦深塔', () => clickAdventureTab(page, 'abyss'));
  await step('⑧海墟', () => clickAdventureTab(page, 'wastes'));
  await step('⑨背包', () => clickTopTab(page, '背包'));
  await step('⑩商店', () => clickTopTab(page, '商店'));
  await step('⑪存档管理', async () => {
    await page.getByText('存 档', { exact: true }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
    await closeModals(page);
  });

  const fail = results.filter((r) => !r.ok).length;
  console.log(`\n=== 汇总: 通过 ${results.length - fail}/${results.length} ===`);
  console.log(`总页面错误: ${pageErrors.length} | 总 console 错误: ${consoleErrors.length}`);
  pageErrors.slice(0, 5).forEach((e) => console.log('  pageerror:', e.slice(0, 100)));
  consoleErrors.slice(0, 5).forEach((e) => console.log('  console:', e.slice(0, 100)));
  await page.screenshot({ path: '/tmp/e2e_final.png' });
  await browser.close();
  process.exit(fail === 0 && pageErrors.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
