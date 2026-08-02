// 快速批量抓取:单次导航过 CF 后,停留在同一页,用同源 /api.php 逐个角色拉画廊图片信息
// 用法: node cdp-all.mjs '角色1,角色2,...' [port] > out.json  (stderr 走日志)
const titles = (process.argv[2] || '忌炎').split(',').map(s => s.trim()).filter(Boolean);
const PORT = process.argv[3] || '9333';
const { setTimeout: sleep } = (await import('node:timers/promises'));
const START = Date.now();
const DEADLINE = 400000; // 400s 总预算

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36';
const getJson = async (p) => (await fetch(`http://127.0.0.1:${PORT}${p}`)).json();

let tabs = null;
for (let i = 0; i < 40; i++) {
  try { tabs = await getJson('/json/list'); if (tabs?.length) break; } catch {}
  if (Date.now() - START > DEADLINE) break;
  await sleep(400);
}
if (!tabs?.length) { console.error('CDP not ready'); process.exit(1); }
const page = tabs.find(t => t.type === 'page');
if (!page) { console.error('no page tab'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
const openOk = await new Promise(r => {
  const t = setTimeout(() => r(false), 10000);
  ws.onopen = () => { clearTimeout(t); r(true); };
  ws.onerror = () => { clearTimeout(t); r(false); };
});
if (!openOk) { console.error('ws open fail'); process.exit(1); }
let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}, ms = 20000) => new Promise((res, rej) => {
  const id = ++msgId;
  const timer = setTimeout(() => { pending.delete(id); rej(new Error(`${method} timeout`)); }, ms);
  pending.set(id, (m) => { clearTimeout(timer); m.error ? rej(new Error(m.error.message)) : res(m.result); });
  try { ws.send(JSON.stringify({ id, method, params })); } catch (e) { clearTimeout(timer); rej(e); }
});

await send('Network.enable').catch(() => {});
await send('Emulation.setUserAgentOverride', { userAgent: MOBILE_UA }).catch(() => {});
await send('Emulation.setDeviceMetricsOverride', {
  width: 412, height: 915, deviceScaleFactor: 3, mobile: true, screenWidth: 412, screenHeight: 915,
}).catch(() => {});

// 首次导航过 CF
await send('Page.navigate', { url: `https://wuwa.huijiwiki.com/index.php?title=${encodeURIComponent(titles[0] + '/画廊')}` }).catch(() => {});
let cf = false;
for (let i = 0; i < 50; i++) {
  try {
    const r = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true }, 5000);
    const t = r?.result?.value || '';
    if (!/Just a moment|Attention Required|checking/i.test(t)) { cf = true; break; }
  } catch {}
  await sleep(800);
}
if (!cf) { console.error('CF not passed'); process.exit(2); }
await sleep(2000);

const evalJS = async (expr) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, 20000);
      const v = r?.result?.value;
      if (Array.isArray(v) || v !== undefined) return v;
    } catch (e) { console.error('evalJS err: ' + e.message); }
    await sleep(400);
  }
  return undefined;
};

const gallery = async (name) => {
  const pageTitle = name + '/画廊';
  const filesExpr = `(async () => {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 10000);
    try {
      const p = new URLSearchParams({action:'query',titles:${JSON.stringify(pageTitle)},prop:'images',imlimit:'500',format:'json',formatversion:'2'});
      const j = await (await fetch('/api.php?'+p.toString(), {signal: ctl.signal})).json();
      return (j?.query?.pages?.[0]?.images || []).map(i => i.title);
    } catch (e) { return []; } finally { clearTimeout(t); }
  })()`;
  const files = (await evalJS(filesExpr)) || [];
  const urls = [];
  for (let i = 0; i < files.length; i += 10) {
    const chunk = files.slice(i, i + 10);
    const infoExpr = `(async () => {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 10000);
      try {
        const p = new URLSearchParams({action:'query',prop:'imageinfo',iiprop:'url|size',iiurlwidth:'1280',titles:${JSON.stringify(chunk.join('|'))},format:'json',formatversion:'2'});
        const j = await (await fetch('/api.php?'+p.toString(), {signal: ctl.signal})).json();
        const out = [];
        for (const pg of j?.query?.pages || []) { const info = pg.imageinfo?.[0]; if (info) out.push({title:pg.title,width:info.width,height:info.height,thumb:info.thumburl,url:info.url}); }
        return out;
      } catch (e) { return []; } finally { clearTimeout(t); }
    })()`;
    const val = await evalJS(infoExpr);
    if (Array.isArray(val)) urls.push(...val);
  }
  return urls;
};

const out = {};
for (const name of titles) {
  if (Date.now() - START > DEADLINE) { console.error('DEADLINE hit at ' + name); break; }
  out[name] = await gallery(name);
  console.error(`DONE ${name}: ${out[name].length}`);
}
console.log(JSON.stringify(out, null, 1));
try { ws.close(); } catch {}
process.exit(0);
