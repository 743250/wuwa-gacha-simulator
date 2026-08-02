// 连上 proot chrome,渲染任意 URL,抽出所有图片 URL + 页面标题
// 用法: node cdp-dom.mjs <url> [port]
const url = process.argv[2];
const PORT = process.argv[3] || '9333';
const { setTimeout: sleep } = (await import('node:timers/promises'));

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36';

const getJson = async (p) => (await fetch(`http://127.0.0.1:${PORT}${p}`)).json();
let tabs = null;
for (let i = 0; i < 40; i++) {
  try { tabs = await getJson('/json/list'); if (tabs?.length) break; } catch {}
  await sleep(500);
}
if (!tabs?.length) { console.error('CDP not ready'); process.exit(1); }
const page = tabs.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++msgId; pending.set(id, (m) => m.error ? rej(new Error(m.error.message)) : res(m.result));
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Network.enable');
await send('Emulation.setUserAgentOverride', { userAgent: MOBILE_UA });
await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 3, mobile: true });

await send('Page.navigate', { url });
let title = '', bodyLen = 0;
for (let i = 0; i < 60; i++) {
  await sleep(1000);
  const t = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true }).catch(() => ({}));
  title = t?.result?.value || '';
  const bl = await send('Runtime.evaluate', { expression: 'document.body ? document.body.innerHTML.length : 0', returnByValue: true }).catch(() => ({}));
  bodyLen = bl?.result?.value || 0;
  if (!/Just a moment|Attention Required/i.test(title) && bodyLen > 500) break;
}
console.error('title=' + title + ' bodyLen=' + bodyLen);

// 抽出所有图片相关 URL:img src, background-image, 以及 alicdn/huiji 域名引用
const r = await send('Runtime.evaluate', {
  expression: `(() => {
    const out = { title: document.title, url: location.href, imgs: [], bgs: [], alicdn: [] };
    const seen = new Set();
    for (const el of document.querySelectorAll('img')) { const s = el.currentSrc || el.src; if (s && !seen.has(s)) { seen.add(s); out.imgs.push({src:s, w:el.naturalWidth, h:el.naturalHeight}); } }
    for (const el of document.querySelectorAll('*')) {
      const b = getComputedStyle(el).backgroundImage;
      if (b && b.startsWith('url(')) { const m = b.match(/url\\(["']?(.*?)["']?\\)/); if (m) { const s = m[1]; if (!seen.has(s)) { seen.add(s); out.bgs.push(s); } } }
    }
    const txt = document.documentElement.outerHTML;
    const re = /https?:\\/\\/[a-z0-9.-]*alicdn[a-z0-9./_%-]*/gi;
    for (const m of txt.match(re) || []) if (!seen.has(m)) { seen.add(m); out.alicdn.push(m); }
    return out;
  })()`,
  returnByValue: true,
});
console.log(JSON.stringify(r?.result?.value, null, 1));
ws.close();
