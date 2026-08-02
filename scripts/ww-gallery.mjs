// 用无头 Chromium 模拟手机访问灰机wiki,提取画廊页图片 URL
import { chromium } from 'playwright';

const title = process.argv[2] || '弗洛洛/画廊';
const url = `https://wuwa.huijiwiki.com/index.php?title=${encodeURIComponent(title)}`;

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
});
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36',
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: 'zh-CN',
});
const page = await ctx.newPage();

// 先直接走 API(同源 fetch,绕 CORS),列出页面所有图片文件
const imgs = await page.evaluate(async (t) => {
  const params = new URLSearchParams({
    action: 'query',
    titles: t,
    prop: 'images',
    imlimit: '200',
    format: 'json',
    formatversion: '2',
  });
  const r = await fetch('/api.php?' + params.toString());
  const j = await r.json();
  const pages = j?.query?.pages || [];
  return pages[0]?.images?.map(i => i.title) || [];
}, title);

// 再拿每个图片文件的真实 URL + 尺寸
const urls = await page.evaluate(async (files) => {
  const out = [];
  for (let i = 0; i < files.length; i += 10) {
    const chunk = files.slice(i, i + 10);
    const params = new URLSearchParams({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|size',
      iiurlwidth: '1280',
      titles: chunk.join('|'),
      format: 'json',
      formatversion: '2',
    });
    const r = await fetch('/api.php?' + params.toString());
    const j = await r.json();
    for (const p of j?.query?.pages || []) {
      const info = p.imageinfo?.[0];
      if (info) out.push({ title: p.title, width: info.width, height: info.height, thumb: info.thumburl, url: info.url });
    }
  }
  return out;
}, imgs);

console.log(JSON.stringify(urls, null, 2));
await browser.close();
