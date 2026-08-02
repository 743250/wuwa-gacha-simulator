// 纯 CDP 客户端(Termux node26,原生 WebSocket),连 proot 里跑着的 chrome
// 用法: node cdp-fetch.mjs "弗洛洛/画廊" [port]
const title = process.argv[2] || '弗洛洛/画廊';
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

// 伪装移动设备:UA + 视口 + 触摸
await send('Network.enable');
await send('Emulation.setUserAgentOverride', { userAgent: MOBILE_UA });
await send('Emulation.setDeviceMetricsOverride', {
  width: 412, height: 915, deviceScaleFactor: 3, mobile: true, screenWidth: 412, screenHeight: 915,
});

const target = `https://wuwa.huijiwiki.com/index.php?title=${encodeURIComponent(title)}`;
await send('Page.navigate', { url: target });

// 等 CF 挑战过去 + 页面正文出现
let ok = false, lastTitle = '';
for (let i = 0; i < 50; i++) {
  try {
    const r = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
    lastTitle = r?.result?.value || '';
    const r2 = await send('Runtime.evaluate', { expression: 'document.querySelector(".mw-parser-output,#mw-content-text,#firstHeading") ? 1 : 0', returnByValue: true });
    if (!/Just a moment|Attention Required|checking/i.test(lastTitle) && r2?.result?.value) { ok = true; break; }
  } catch {}
  await sleep(1000);
}
if (!ok) { console.error('CF not passed / page not loaded. lastTitle=' + lastTitle); ws.close(); process.exit(2); }
console.error('PAGE OK title=' + lastTitle);

// 同源 API 列图片文件
const imgs = await send('Runtime.evaluate', {
  expression: `(async () => {
    const p = new URLSearchParams({action:'query',titles:${JSON.stringify(title)},prop:'images',imlimit:'200',format:'json',formatversion:'2'});
    const j = await (await fetch('/api.php?'+p.toString())).json();
    const pages = j?.query?.pages || [];
    return pages[0]?.images?.map(i => i.title) || [];
  })()`,
  awaitPromise: true, returnByValue: true,
});
const files = imgs?.result?.value || [];
console.error('image files: ' + files.length);

const urls = [];
for (let i = 0; i < files.length; i += 10) {
  const chunk = files.slice(i, i + 10);
  const expr = `(async () => {
    const p = new URLSearchParams({action:'query',prop:'imageinfo',iiprop:'url|size',iiurlwidth:'1280',titles:${JSON.stringify(chunk.join('|'))},format:'json',formatversion:'2'});
    const j = await (await fetch('/api.php?'+p.toString())).json();
    const out = [];
    for (const pg of j?.query?.pages || []) { const info = pg.imageinfo?.[0]; if (info) out.push({title:pg.title,width:info.width,height:info.height,thumb:info.thumburl,url:info.url}); }
    return out;
  })()`;
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  const val = r?.result?.value;
  if (Array.isArray(val)) urls.push(...val);
  else console.log('non-array chunk:', JSON.stringify(val).slice(0, 200));
}
console.log(JSON.stringify(urls, null, 1));
ws.close();
