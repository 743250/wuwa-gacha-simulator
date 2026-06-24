// 从库街区 API 拉取的 JSON 中提取每个角色的共鸣链 1-6
// 输出格式：直接可粘到 chains.js 的 CHAIN_OVERRIDES 字面量
//
// 用法：node scripts/extract-chains.js ~/char-data
//
// 期望文件：<dir>/<角色名>.json，里面是 getEntryDetail 的完整响应

const fs = require('fs');
const path = require('path');

const NAMES = ['忌炎','今汐','长离','椿','卡提希娅','菲比','嘉贝莉娜','卡卡罗','珂莱塔','守岸人'];

// 把官方 HTML 描述包装成模拟器用的高亮 + 简明文本
//   1. 多余空白合并
//   2. 把官方 <span class="Highlight"> 内容用 wrapTerm 染色
//   3. 额外识别 "共鸣技能/共鸣解放/共鸣回路/变奏技能/延奏技能/重击/普攻/空中攻击/闪避反击" 等动作前缀词
//   4. 删除 <img>、表格残留、行内 style
//   5. 数值类 (xx% / xx秒 / xx点 / xx层 / xx次) 全部高亮
function htmlToHighlighted(html) {
  let s = String(html);
  s = s.replace(/<img[^>]*>/g, '');
  s = s.replace(/&middot;/g, '·').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  // Highlight/Light：内部是术语名（如"枪扫风定"），按 wrapTerm 染色
  s = s.replace(/<span class="Highlight"[^>]*>([\s\S]*?)<\/span>/g, (_, t) => wrapTerm(stripAllTags(t)));
  s = s.replace(/<span class="Light"[^>]*>([\s\S]*?)<\/span>/g, (_, t) => wrapTerm(stripAllTags(t)));
  s = s.replace(/<\/?strong[^>]*>/g, '');
  s = s.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');
  s = s.replace(/<\/?p[^>]*>/g, ' ');
  s = s.replace(/<br\s*\/?>/g, '；');
  s = s.replace(/<[^>]+>/g, '');
  // 动作前缀词：染色（避免改写已包裹在 <b> 里的内容）
  s = wrapActionPrefixes(s);
  // 数值高亮（避开已经在 <b ...> 里的）
  s = wrapNumbers(s);
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function stripAllTags(t) {
  return String(t).replace(/<[^>]+>/g, '').replace(/&middot;/g, '·').trim();
}

// 仅在不属于 <b ...>...</b> 内的文本上做替换（先把 b 段抽出占位）
function safeReplace(s, pattern, replacer) {
  const slots = [];
  let placed = s.replace(/<b class="[^"]+">[\s\S]*?<\/b>/g, m => {
    slots.push(m); return `${slots.length-1}`;
  });
  placed = placed.replace(pattern, replacer);
  return placed.replace(/(\d+)/g, (_, i) => slots[+i]);
}

function wrapActionPrefixes(s) {
  // 注意顺序：先长后短，避免 "共鸣技能" 被 "重击" 之类先吃掉
  const map = [
    [/共鸣解放/g, 'term-burst'],
    [/共鸣技能/g, 'term-skill'],
    [/变奏技能/g, 'term-variation'],
    [/延奏技能/g, 'term-outro'],
    [/共鸣回路/g, 'term-forte'],
    [/空中攻击/g, 'term-heavy'],
    [/闪避反击/g, 'term-normal'],
    [/重击/g, 'term-heavy'],
    [/普攻/g, 'term-normal']
  ];
  let out = s;
  map.forEach(([re, cls]) => {
    out = safeReplace(out, re, (m) => `<b class="${cls}">${m}</b>`);
  });
  return out;
}

function wrapNumbers(s) {
  let out = s;
  // 百分比
  out = safeReplace(out, /(\d+(?:\.\d+)?%)/g, m => `<b class="term-num">${m}</b>`);
  // 秒/点/层/次/段
  out = safeReplace(out, /(\d+(?:\.\d+)?\s*(?:秒|点|层|次|段|分钟))/g, m => `<b class="term-num">${m}</b>`);
  return out;
}

// 给从 Highlight span 里抠出来的纯名（如"枪扫风定"、"破阵值"）单独染色
function wrapTerm(t) {
  const clean = t.replace(/<[^>]+>/g,'').trim();
  if (!clean) return '';
  let cls;
  if (/苍躣|移岁诛邪|芳华绽烬|致死以终|死兆|启明之誓愿|杀戮武装|看潮怒风哮之刃|听骑士从心祈愿|离火照丹心|终末回环/.test(clean)) cls = 'term-burst';
  else if (/枪扫风定|惊龙破空|逐天取月|赫羽三相|混沌理论|凭风斩浪破敌|掠袭|恶翼扬升|迫近|灭杀指令|暴力美学|示我璀璨/.test(clean)) cls = 'term-skill';
  else if (/攻其不备|蟠龙清辉|八千春秋|金色恩典|全境通缉|碎璃镜花|致辞|洞悉|此剑|必要的手段/.test(clean)) cls = 'term-variation';
  else if (/克己|缠绕|默祷|掠影奇袭/.test(clean)) cls = 'term-outro';
  else if (/焚身以火|炼羽裁决|限制性策略|末路见行|星辉|死告/.test(clean)) cls = 'term-heavy';
  else if (/凌霄|炽天猎杀/.test(clean)) cls = 'term-normal';
  else if (/一日花|永生花|演绎/.test(clean)) cls = 'term-forte';
  else if (/夏弥尔|罪业当涤|火狱暴雨/.test(clean)) cls = 'term-normal';
  else cls = 'term-resource';
  return `<b class="${cls}">${clean}</b>`;
}

function stripText(html) {
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&middot;/g, '·')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// 简短摘要：取第一个【中文句号】之前的部分，再按可见字符截到 110
function makeSummary(htmlDesc) {
  const full = htmlToHighlighted(htmlDesc.replace(/<br\s*\/?>/g, '。'));
  let head = full;
  const idx = head.indexOf('。');
  if (idx > 0) head = head.slice(0, idx);
  if (stripText(head).length > 110) {
    let visible = 0, cut = 0, inTag = false;
    for (let i = 0; i < head.length; i++) {
      const ch = head[i];
      if (ch === '<') inTag = true;
      if (!inTag) visible++;
      if (ch === '>') inTag = false;
      if (visible >= 110) { cut = i + 1; break; }
    }
    if (cut) head = head.slice(0, cut) + '…';
  }
  return head;
}

// 从原始 HTML 中按 <tr> 切分出每一链：[名称 HTML, 描述 HTML]
function parseChains(html) {
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = trRe.exec(html))) rows.push(m[1]);
  const out = [];
  rows.forEach(r => {
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const cells = [];
    let mm;
    while ((mm = tdRe.exec(r))) cells.push(mm[1]);
    if (cells.length < 2) return;
    out.push([cells[0], cells[1]]);
  });
  // 去除表头行
  return out.filter(([name]) => !/名称/.test(stripText(name)));
}

const dir = process.argv[2] || (process.env.HOME + '/char-data');

const result = {};
NAMES.forEach(n => {
  const file = path.join(dir, n + '.json');
  if (!fs.existsSync(file)) { console.error('missing:', file); return; }
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const c = d.data.content;
  let chainsHtml = null;
  c.modules.forEach(m => (m.components || []).forEach(co => {
    if (co.title === '共鸣链') chainsHtml = co.content;
  }));
  if (!chainsHtml) { console.error(n + ' has no chains'); return; }
  const rows = parseChains(chainsHtml);
  result[n] = rows.slice(0, 6).map(([nameHtml, descHtml]) => ({
    title: stripText(nameHtml),
    desc: htmlToHighlighted(descHtml),
    summary: makeSummary(descHtml)
  }));
});

// 输出 JSON（再由人工拷入 chains.js 的 CHAIN_OVERRIDES）
const outPath = path.join(dir, 'chains-extracted.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('wrote', outPath);

// 顺便打印每个角色第 1 链的预览
NAMES.forEach(n => {
  if (!result[n]) return;
  console.log('\n=== ' + n + ' ===');
  console.log('1.', result[n][0]?.title, '\n   summary:', result[n][0]?.summary, '\n   desc:', result[n][0]?.desc?.slice(0, 200));
});
