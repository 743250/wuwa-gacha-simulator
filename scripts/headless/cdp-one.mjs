// 单角色稳健抓取:WS 连接 + 每次 CDP send + 页面内 fetch 都带超时,保证 60s 内退出
// 用法: node cdp-one.mjs "角色名" [port]
const title = process.argv[2] || '忌炎';
const PORT = process.argv[3] || '9333';
const { setTimeout: sleep } = (await import('node:timers/promises'));
const START = Date.now();
const DEADLINE = 60000;

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36';
const getJson = async (p) => (await fetch(`http://127.0.0.1:${PORT}${p}`)).json();
const timeLeft = () => DEADLINE - (Date.now() - START);

let tabs = null;
for (let i = 0; i < 40; i++) {
  try { tabs = await getJson('/json/list'); if (tabs?.length) break; } catch {}
  if (Date.now() - START > DEADLINE) break;
  await sleep(500);
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
const send = (method, params = {}, ms = 15000) => new Promise((res, rej) => {
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

const target = `https://wuwa.huijiwiki.com/index.php?title=${encodeURIComponent(title + '/画廊')}`;
await send('Page.navigate', { url: target }).catch(() => {});
// 等 CF 挑战过去即可,不强制等 .mw-parser-output(有些画廊页渲染很慢会白等)
let ok = false, lastTitle = '';
for (let i = 0; i < 40; i++) {
  if (timeLeft() < 0) break;
  try {
    const r = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true }, 5000);
    lastTitle = r?.result?.value || '';
    if (!/Just a moment|Attention Required|checking/i.test(lastTitle)) { ok = true; break; }
  } catch {}
  await sleep(800);
}
if (!ok) { console.error('page load fail lastTitle=' + lastTitle); process.exit(2); }

const evalJS = async (expr) => {
  try {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, 15000);
    return r?.result?.value;
  } catch (e) { console.error('evalJS err: ' + e.message); return undefined; }
};

// CF 通过后稍等,让页面 JS 上下文就绪
await sleep(1500);

let files = [];
try {
  files = (await evalJS(`(async () => {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    try {
      const p = new URLSearchParams({action:'query',titles:${JSON.stringify(title + '/画廊')},prop:'images',imlimit:'200',format:'json',formatversion:'2'});
      const j = await (await fetch('/api.php?'+p.toString(), {signal: ctl.signal})).json();
      return (j?.query?.pages?.[0]?.images || []).map(i => i.title);
    } catch (e) { return []; } finally { clearTimeout(t); }
  })()`)) || [];
} catch (e) { console.error('images list err: ' + e.message); }

const urls = [];
for (let i = 0; i < files.length && timeLeft() > 0; i += 10) {
  const chunk = files.slice(i, i + 10);
  const expr = `(async () => {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    try {
      const p = new URLSearchParams({action:'query',prop:'imageinfo',iiprop:'url|size',iiurlwidth:'1280',titles:${JSON.stringify(chunk.join('|'))},format:'json',formatversion:'2'});
      const j = await (await fetch('/api.php?'+p.toString(), {signal: ctl.signal})).json();
      const out = [];
      for (const pg of j?.query?.pages || []) { const info = pg.imageinfo?.[0]; if (info) out.push({title:pg.title,width:info.width,height:info.height,thumb:info.thumburl,url:info.url}); }
      return out;
    } catch (e) { return []; } finally { clearTimeout(t); }
  })()`;
  // 失败重试一次(目标导航导致 context 失效时常见)
  let val = await evalJS(expr);
  if (!Array.isArray(val) || val.length === 0) { await sleep(500); val = await evalJS(expr); }
  if (Array.isArray(val)) urls.push(...val);
}
console.log(JSON.stringify(urls, null, 1));
try { ws.close(); } catch {}
process.exit(0);
