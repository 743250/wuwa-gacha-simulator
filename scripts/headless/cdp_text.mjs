const url = process.argv[2] || 'about:blank';
const PORT = process.argv[3] || '9333';
const { setTimeout: sleep } = (await import('node:timers/promises'));
const getJson = async (p) => (await fetch(`http://127.0.0.1:${PORT}${p}`)).json();
let tabs = null;
for (let i = 0; i < 40; i++) { try { tabs = await getJson('/json/list'); if (tabs?.length) break; } catch {} await sleep(500); }
if (!tabs?.length) { console.error('CDP not ready'); process.exit(1); }
const page = tabs.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, m => m.error ? rej(new Error(m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id, method, params })); });
await send('Network.enable');
await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36' });
await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 3, mobile: true });
await send('Page.navigate', { url });
let title = '', bodyLen = 0;
for (let i = 0; i < 90; i++) {
  await sleep(1000);
  const t = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true }).catch(() => ({}));
  title = t?.result?.value || '';
  const bl = await send('Runtime.evaluate', { expression: 'document.body ? document.body.innerText.length : 0', returnByValue: true }).catch(() => ({}));
  bodyLen = bl?.result?.value || 0;
  if (!/Just a moment|Attention Required/i.test(title) && bodyLen > 200) break;
}
console.error('title=' + title + ' textLen=' + bodyLen);
const r = await send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true });
const txt = (r?.result?.value || '');
const lines = txt.split('\n');
const kw = /血|HP|万|塔|深|怪物|首领|BOSS/i;
const hits = lines.filter(l => kw.test(l));
console.log(JSON.stringify(hits.slice(0, 300), null, 0));
ws.close();
