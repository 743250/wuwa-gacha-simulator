// 稳健版批量抓取:给页面内 fetch 加 AbortController 超时 + CDP 调用加 Promise.race 超时
// 用法: node cdp-fetch-robust.mjs '角色1,角色2,...' [port] > out.json   (stderr 走日志)
const titles = (process.argv[2] || '忌炎').split(',').map(s => s.trim()).filter(Boolean);
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
const send = (method, params = {}, ms = 20000) => new Promise((res, rej) => {
  const id = ++msgId;
  const timer = setTimeout(() => { pending.delete(id); rej(new Error(`${method} timeout`)); }, ms);
  pending.set(id, (m) => { clearTimeout(timer); m.error ? rej(new Error(m.error.message)) : res(m.result); });
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Network.enable').catch(() => {});
await send('Emulation.setUserAgentOverride', { userAgent: MOBILE_UA }).catch(() => {});
await send('Emulation.setDeviceMetricsOverride', {
  width: 412, height: 915, deviceScaleFactor: 3, mobile: true, screenWidth: 412, screenHeight: 915,
}).catch(() => {});

const waitPage = async (target) => {
  await send('Page.navigate', { url: target }).catch(() => {});
  let ok = false, lastTitle = '';
  for (let i = 0; i < 50; i++) {
    try {
      const r = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true }, 5000);
      lastTitle = r?.result?.value || '';
      const r2 = await send('Runtime.evaluate', { expression: 'document.querySelector(".mw-parser-output,#mw-content-text,#firstHeading") ? 1 : 0', returnByValue: true }, 5000);
      if (!/Just a moment|Attention Required|checking/i.test(lastTitle) && r2?.result?.value) { ok = true; break; }
    } catch {}
    await sleep(600);
  }
  return ok;
};

const evalJSON = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, 15000);
  return r?.result?.value;
};

const gallery = async (title) => {
  const ok = await waitPage(`https://wuwa.huijiwiki.com/index.php?title=${encodeURIComponent(title)}`);
  if (!ok) return { title, error: 'page load fail' };
  // 页面内 fetch 统一带 10s AbortController 超时,避免单个 api.php 请求挂死
  const fetchImages = `(async () => {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 10000);
    try {
      const p = new URLSearchParams({action:'query',titles:${JSON.stringify(title)},prop:'images',imlimit:'200',format:'json',formatversion:'2'});
      const j = await (await fetch('/api.php?'+p.toString(), {signal: ctl.signal})).json();
      const pages = j?.query?.pages || [];
      return pages[0]?.images?.map(i => i.title) || [];
    } catch(e) { return []; } finally { clearTimeout(t); }
  })()`;
  const files = (await evalJSON(fetchImages)) || [];
  const urls = [];
  for (let i = 0; i < files.length; i += 10) {
    const chunk = files.slice(i, i + 10);
    const expr = `(async () => {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 10000);
      try {
        const p = new URLSearchParams({action:'query',prop:'imageinfo',iiprop:'url|size',iiurlwidth:'1280',titles:${JSON.stringify(chunk.join('|'))},format:'json',formatversion:'2'});
        const j = await (await fetch('/api.php?'+p.toString(), {signal: ctl.signal})).json();
        const out = [];
        for (const pg of j?.query?.pages || []) { const info = pg.imageinfo?.[0]; if (info) out.push({title:pg.title,width:info.width,height:info.height,thumb:info.thumburl,url:info.url}); }
        return out;
      } catch(e) { return []; } finally { clearTimeout(t); }
    })()`;
    const val = await evalJSON(expr);
    if (Array.isArray(val)) urls.push(...val);
  }
  return { title, files: urls };
};

const out = {};
for (const t of titles) {
  const g = await gallery(t + '/画廊');
  out[t] = g;
  console.error(`DONE ${t}: ${g.files?.length ?? g.error}`);
}
console.log(JSON.stringify(out, null, 1));
ws.close();
