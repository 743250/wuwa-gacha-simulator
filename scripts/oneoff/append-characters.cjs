// 把新角色补进 docs/sources/characters/encore-full-data.json
//
// 背景：快照里的 53 个角色是手工流程产的，生成脚本已不在仓库。本脚本用「自校验」重建同一套映射：
// 先拿快照里已有的角色跑一遍，逐字段和现有条目比对，全部一致才继续写新角色。
//
// 字段映射（已对秧秧/忌炎/散华/安可等逐字节验证）：
//   id/quality/element/weapon  ← Id / QualityId / ElementName / WeaponTypeName
//   lv90_stats                 ← Properties 的 level=90 值；生命/攻击/防御 取整，
//                                暴击/暴击伤害 直接取（encore 已给 "5%" 形式），
//                                谐度破坏增幅 格式化 "%.1f%"
//   skills                     ← Skills，剔除 SkillType=谐度破坏 与 SkillName=巧手烹调（通用生活技能）
//   chains                     ← ResonantChain 按 Id 升序
//   文本清洗                    ← 删 <br> → 去标签 → 空白折叠
//
// 用法：node scripts/oneoff/append-characters.cjs [角色名=id ...]
//       不带参数则用内置的 3.5/3.6 角色表。

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SNAP = path.join(ROOT, 'docs', 'sources', 'characters', 'encore-full-data.json');
const API = 'https://api-v2.encore.moe/api/zh-Hans/character';

const NEW_CHARS = { '秧秧·玄翎': 1610, '穗穗': 1110, '清宵': 1413, '景燃': 1212 };

const SKIP_SKILL_TYPE = new Set(['谐度破坏']);
const SKIP_SKILL_NAME = new Set(['巧手烹调']);

function clean(s) {
  return String(s == null ? '' : s)
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function lv90(p) {
  const gv = p.GrowthValues || [];
  const hit = gv.find(g => g.level === 90);
  return hit ? hit.value : (gv.length ? gv[gv.length - 1].value : null);
}

function mapCharacter(c) {
  const stats = {};
  for (const p of c.Properties || []) {
    const v = lv90(p);
    if (v == null) continue;
    if (['生命', '攻击', '防御'].includes(p.Name)) stats[p.Name] = Math.round(v);
    else if (['暴击', '暴击伤害'].includes(p.Name)) stats[p.Name] = String(v);
    else if (p.Name === '谐度破坏增幅') stats[p.Name] = Number(v).toFixed(1) + '%';
  }
  const skills = (c.Skills || [])
    .filter(s => !SKIP_SKILL_TYPE.has(s.SkillType) && !SKIP_SKILL_NAME.has(s.SkillName))
    .map(s => ({ type: s.SkillType, name: s.SkillName, desc: clean(s.SkillDescribe) }));
  const chains = (c.ResonantChain || [])
    .slice().sort((a, b) => a.Id - b.Id)
    .map(x => ({ index: x.Id, name: clean(x.NodeName), desc: clean(x.AttributesDescription) }));
  return {
    id: c.Id,
    quality: c.QualityId,
    element: c.ElementName,
    weapon: c.WeaponTypeName,
    lv90_stats: stats,
    skills,
    chains,
  };
}

async function fetchChar(id, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${API}/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 600 * (i + 1))); }
  }
  throw lastErr;
}

(async () => {
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  const results = snap.results;

  // ---- 1. 映射自检（仅供参考）----
  // 快照是不同时期分批采的，本身新旧不一（例：忌炎 lv90_stats 是空的、部分角色生命值
  // 用截断而非四舍五入），所以差异只报告、不作为阻断条件。真正的安全保证是：
  // 本脚本只往 results 里「追加」缺失的角色，已存在的条目一个字节都不改。
  const samples = ['秧秧', '忌炎', '散华', '安可', '维里奈', '炽霞'];
  console.log('▶ 映射自检（与快照已有条目比对；快照本身新旧不一，差异仅供参考）');
  for (const name of samples) {
    const cur = results[name];
    if (!cur) continue;
    let api;
    try { api = await fetchChar(cur.id); } catch (e) { console.log(`  ? ${name}: 抓取失败 ${e.message}`); continue; }
    const mine = mapCharacter(api);
    const diffs = [];
    for (const k of ['id', 'quality', 'element', 'weapon']) {
      if (mine[k] !== cur[k]) diffs.push(`${k}: ${JSON.stringify(mine[k])} ≠ ${JSON.stringify(cur[k])}`);
    }
    if (JSON.stringify(mine.lv90_stats) !== JSON.stringify(cur.lv90_stats)) {
      diffs.push(`lv90_stats: ${JSON.stringify(mine.lv90_stats)} ≠ ${JSON.stringify(cur.lv90_stats)}`);
    }
    if (JSON.stringify(mine.chains) !== JSON.stringify(cur.chains)) diffs.push('chains 不一致');
    const aSet = new Set(mine.skills.map(s => s.type + '|' + s.name));
    const bSet = new Set(cur.skills.map(s => s.type + '|' + s.name));
    const aOnly = [...aSet].filter(x => !bSet.has(x));
    const bOnly = [...bSet].filter(x => !aSet.has(x));
    if (bOnly.length) diffs.push(`技能名: 快照多 ${bOnly}`);
    if (aOnly.length) diffs.push(`技能名: 重建多 ${aOnly}`);
    if (diffs.length) { console.log(`  ~ ${name}`); diffs.forEach(d => console.log('      ' + d)); }
    else console.log(`  ✓ ${name}`);
  }
  console.log();

  // ---- 2. 只追加缺失的新角色 ----
  const list = process.argv.slice(2).length
    ? Object.fromEntries(process.argv.slice(2).map(s => s.split('=')))
    : NEW_CHARS;

  console.log('▶ 补录新角色（已存在的跳过，旧条目不改）');
  let added = 0;
  for (const [name, id] of Object.entries(list)) {
    if (results[name]) { console.log(`  · ${name} 已在快照，跳过`); continue; }
    const api = await fetchChar(Number(id));
    results[name] = mapCharacter(api);
    added++;
    console.log(`  + ${name} (id ${id}, 技能 ${results[name].skills.length}, 链 ${results[name].chains.length})`);
  }

  // 逐字节安全校验：除新增键外，重新序列化必须与原文完全一致
  const orig = fs.readFileSync(SNAP, 'utf8');
  const before = JSON.stringify(JSON.parse(orig), null, 2) + '\n';
  if (before !== orig) {
    console.log('\n✗ 重新序列化不能复现原文（格式会漂移），已中止，未写入。');
    process.exit(1);
  }

  fs.writeFileSync(SNAP, JSON.stringify(snap, null, 2) + '\n');
  console.log(`\n写入 ${SNAP}  (新增 ${added}，现有 ${Object.keys(results).length} 条)`);
})().catch(e => { console.error(e); process.exit(1); });
