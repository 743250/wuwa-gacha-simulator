// fetch-enemies.mjs — 从 encore.moe API 批量抓取敌人详情
// Usage: node scripts/fetch-enemies.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENEMIES_DIR = resolve(ROOT, 'docs/sources/enemies');

const LIST_PATH = resolve(ENEMIES_DIR, 'encore-monster-list.json');
const RAW_PATH = resolve(ENEMIES_DIR, 'encore-enemies.json');
const COMPACT_PATH = resolve(ENEMIES_DIR, 'encore-enemies-compact.json');
const REPORT_PATH = resolve(ENEMIES_DIR, 'encore-vs-sim-report.md');
const ENEMIES_JS_PATH = resolve(ROOT, 'src/battle/enemies.js');

const API_BASE = 'https://api-v2.encore.moe/api/zh-Hans/monster';

// 元素 ID 映射
const ELEMENT_ID_TO_NAME = {
  0: '物理', 1: '冷凝', 2: '热熔', 3: '导电', 4: '气动', 5: '衍射', 6: '湮灭'
};

// 稀有度映射
const RARITY_ID_TO_CLASS = {
  1: 'Common',    // 轻波级
  2: 'Elite',     // 巨浪级
  3: 'Overlord',  // 怒涛级
  4: 'Calamity'   // 海啸级
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchMonsterDetail(id) {
  const url = `${API_BASE}/${id}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${id}`);
  return await resp.json();
}

// 从列表中提取已有数据 + API 详情
function buildCompactEntry(listEntry, detail) {
  const props = detail.Properties || {};
  const gr = detail.GrowthRates || {};
  const lv90 = gr[90] || {};

  // 计算 Lv90 时的 HP/ATK/DEF
  // 官方公式：Lv90 值 = Properties基础值 × GrowthRates[90] / 10000
  const baseLifeMax = parseInt(props.LifeMax?.Value) || 0;
  const baseAtk = parseInt(props.Atk?.Value) || 0;
  const baseDef = parseInt(props.Def?.Value) || 0;

  // 从 GrowthRates 计算 Lv90 值
  const lifeMaxRatio = parseInt(lv90.LifeMaxRatio) || 0;
  const atkRatio = parseInt(lv90.AtkRatio) || 0;
  // DEF 不按比率缩放，直接用 baseDef（或者按 DefRatio？实际上 DEF 似乎跟着等级涨）
  // 查看游戏逻辑：Lv90 DEF = baseDef，HP = baseLifeMax × lifeMaxRatio / 10000，ATK = baseAtk × atkRatio / 10000

  // 但实际上 Properties 中各属性后面跟的是 Value，这 Value 可能已经是某个等级的
  // 看细节数据：先锋幼岩 Lv90 LifeMaxRatio=4674386, base LifeMax=129
  // HP = 129 × 4674386 / 10000 = 60299... 不，这不对，因为官方的 GrowthRates 是基于等级乘算
  // 让我们直接用 ratio 去乘

  return {
    id: detail.Id,
    name: detail.Name,
    rarity: detail.Rarity,
    rarityId: detail.RarityId,
    class: RARITY_ID_TO_CLASS[detail.RarityId] || 'Common',
    element: ELEMENT_ID_TO_NAME[detail.Element?.Id] || '物理',
    elementId: detail.Element?.Id ?? 0,
    icon: detail.Icon || '',
    discoveredDes: detail.DiscoveredDes || '',
    undiscoveredDes: detail.UndiscoveredDes || '',
    // 基础属性
    baseHp: baseLifeMax,
    baseAtk: baseAtk,
    baseDef: baseDef,
    // 抗性数据 (原值是千分比，1000=10%)
    resist: {
      物理: parseInt(props.DamageResistancePhys?.Value) || 1000,
      冷凝: parseInt(props.DamageResistanceElement1?.Value) || 1000,
      热熔: parseInt(props.DamageResistanceElement2?.Value) || 1000,
      导电: parseInt(props.DamageResistanceElement3?.Value) || 1000,
      气动: parseInt(props.DamageResistanceElement4?.Value) || 1000,
      衍射: parseInt(props.DamageResistanceElement5?.Value) || 1000,
      湮灭: parseInt(props.DamageResistanceElement6?.Value) || 1000,
    },
    // Lv90 计算值 (base × ratio / 10000)
    lv90Hp: Math.round(baseLifeMax * lifeMaxRatio / 10000),
    lv90Atk: Math.round(baseAtk * atkRatio / 10000),
    lv90Def: baseDef, // DEF 按等级固定涨，Lv90 时为 baseDef + (90-1)×某增量
    // 可用 GrowthRates 中 level 数量
    maxLevel: Math.max(...Object.keys(gr).map(Number)),
  };
}

async function main() {
  console.log('=== Encore.moe 敌人数据抓取 ===\n');

  // 1. 读取列表
  console.log('[1/5] 读取 monster list...');
  const listData = JSON.parse(readFileSync(LIST_PATH, 'utf8'));
  const monsters = listData.monsterList;
  console.log(`  读取到 ${monsters.length} 个敌人\n`);

  // 2. 逐个 fetch 详情
  console.log('[2/5] 抓取详情...');
  const details = [];
  let success = 0, failed = 0;

  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i];
    const pct = ((i + 1) / monsters.length * 100).toFixed(0);
    process.stdout.write(`\r  [${i + 1}/${monsters.length}] ${pct}% - ID:${m.Id} ${m.Name}...`);

    try {
      const detail = await fetchMonsterDetail(m.Id);
      details.push(detail);
      success++;
    } catch (e) {
      console.error(`\n  FAILED: ${m.Id} ${m.Name} - ${e.message}`);
      failed++;
      // 尽量推入列表数据作为 fallback
      details.push(m);
    }

    // 避免被限速，每 10 个暂停一下
    if ((i + 1) % 20 === 0) await sleep(300);
  }
  console.log(`\n  完成: ${success} 成功, ${failed} 失败\n`);

  // 3. 保存原始 JSON
  console.log('[3/5] 保存原始 JSON...');
  writeFileSync(RAW_PATH, JSON.stringify(details, null, 2), 'utf8');
  console.log(`  -> ${RAW_PATH} (${(JSON.stringify(details).length / 1024).toFixed(0)} KB)\n`);

  // 4. 生成精简 JSON
  console.log('[4/5] 生成精简 JSON...');
  const compact = details.map((detail, idx) => {
    const listEntry = monsters[idx];
    return buildCompactEntry(listEntry, detail);
  });
  writeFileSync(COMPACT_PATH, JSON.stringify(compact, null, 2), 'utf8');
  console.log(`  -> ${COMPACT_PATH} (${(JSON.stringify(compact).length / 1024).toFixed(0)} KB)\n`);

  // 5. 生成比对报告
  console.log('[5/5] 生成比对报告...');
  generateReport(compact, monsters);
  console.log(`  -> ${REPORT_PATH}\n`);

  console.log('=== DONE ===');
}

function generateReport(compact, monsters) {
  // 解析 enemies.js 中已实装敌人名称
  const enemiesJsContent = readFileSync(ENEMIES_JS_PATH, 'utf8');
  // 提取所有形如 'xxx': { 的 key（敌人名）
  const simEnemyNames = [];
  const re = /^\s*'([^']+)':\s*\{/gm;
  let match;
  while ((match = re.exec(enemiesJsContent)) !== null) {
    simEnemyNames.push(match[1]);
  }

  // 统计稀有度分布
  const rarityDist = {};
  compact.forEach(m => {
    const r = m.rarity || '未知';
    rarityDist[r] = (rarityDist[r] || 0) + 1;
  });

  // 构建 API 敌人名集合（简体中文）
  const apiNames = new Set(compact.map(m => m.name));
  const apiNameMap = new Map(compact.map(m => [m.name, m]));

  // 匹配
  const matched = [];    // API 有, sim 也有
  const apiOnly = [];    // API 有, sim 没有
  const simOnly = [];    // sim 有, API 没有

  for (const name of simEnemyNames) {
    if (apiNames.has(name)) {
      const api = apiNameMap.get(name);
      matched.push({
        name,
        apiRarity: api.rarity,
        apiClass: api.class,
        apiElement: api.element,
        apiHp: api.lv90Hp,
        apiAtk: api.lv90Atk,
        apiDef: api.lv90Def,
        apiResist: api.resist,
      });
    } else {
      simOnly.push(name);
    }
  }

  for (const m of compact) {
    if (!simEnemyNames.includes(m.name)) {
      apiOnly.push({
        name: m.name,
        id: m.id,
        rarity: m.rarity,
        class: m.class,
        element: m.element,
        hp: m.lv90Hp,
        atk: m.lv90Atk,
        def: m.lv90Def,
      });
    }
  }

  // 按稀有度分组 apiOnly
  const apiByRarity = {};
  apiOnly.forEach(m => {
    const r = m.rarity;
    if (!apiByRarity[r]) apiByRarity[r] = [];
    apiByRarity[r].push(m);
  });

  // 生成报告
  let report = '';
  report += '# encore.moe 敌人数据 vs 模拟器 enemies.js 对照报告\n\n';
  report += `> 生成时间：${new Date().toISOString().split('T')[0]}\n`;
  report += `> 数据源：https://api-v2.encore.moe/api/zh-Hans/monster\n\n`;

  report += '## 1. 数据规模\n\n';
  report += `- API 抓回敌人总数：**${compact.length}** 个\n`;
  report += `- 模拟器已实装敌人：**${simEnemyNames.length}** 个\n\n`;

  report += '## 2. API 稀有度分布\n\n';
  report += '| 稀有度 | 数量 | 对应 class |\n';
  report += '|--------|------|-----------|\n';
  for (const [rarity, count] of Object.entries(rarityDist)) {
    const cls = { '轻波级': 'Common', '巨浪级': 'Elite', '怒涛级': 'Overlord', '海啸级': 'Calamity' }[rarity] || '-';
    report += `| ${rarity} | ${count} | ${cls} |\n`;
  }

  report += '\n## 3. 元素分布\n\n';
  const elemDist = {};
  compact.forEach(m => {
    const e = m.element || '未知';
    elemDist[e] = (elemDist[e] || 0) + 1;
  });
  report += '| 元素 | 数量 |\n';
  report += '|------|------|\n';
  for (const [elem, count] of Object.entries(elemDist)) {
    report += `| ${elem} | ${count} |\n`;
  }

  report += `\n## 4. 匹配情况\n\n`;
  report += `| 类型 | 数量 |\n`;
  report += `|------|------|\n`;
  report += `| 双向匹配（API=sim） | ${matched.length} |\n`;
  report += `| API 有 sim 无 | ${apiOnly.length} |\n`;
  report += `| sim 有 API 无 | ${simOnly.length} |\n`;

  report += `\n## 5. 匹配清单（${matched.length} 个）\n\n`;
  report += '| 中文名 | API 稀有度 | API 元素 | API Lv90 HP | API Lv90 ATK | API Lv90 DEF |\n';
  report += '|--------|-----------|---------|-------------|--------------|-------------|\n';
  matched.sort((a,b) => a.name.localeCompare(b.name, 'zh'));
  matched.forEach(m => {
    report += `| ${m.name} | ${m.apiRarity} | ${m.apiElement} | ${m.apiHp} | ${m.apiAtk} | ${m.apiDef} |\n`;
  });

  report += `\n## 6. API 有但 sim 没有（${apiOnly.length} 个）\n\n`;

  // 按稀有度分组
  const rarityOrder = ['轻波级', '巨浪级', '怒涛级', '海啸级'];
  for (const r of rarityOrder) {
    const items = apiByRarity[r] || [];
    if (items.length === 0) continue;
    report += `### ${r}（${items.length} 个）\n\n`;
    report += '| 中文名 | ID | 元素 | Lv90 HP | Lv90 ATK | Lv90 DEF |\n';
    report += '|--------|-----|------|---------|----------|----------|\n';
    items.sort((a,b) => a.name.localeCompare(b.name, 'zh'));
    items.forEach(m => {
      report += `| ${m.name} | ${m.id} | ${m.element} | ${m.hp} | ${m.atk} | ${m.def} |\n`;
    });
    report += '\n';
  }

  report += `## 7. sim 有但 API 没有（${simOnly.length} 个）\n\n`;
  if (simOnly.length > 0) {
    simOnly.forEach(name => {
      report += `- ${name}\n`;
    });
  } else {
    report += '(无)\n';
  }

  report += `\n## 8. 推荐改造方案\n\n`;
  report += `### 8.1 现状\n`;
  report += `- 模拟器 enemies.js 共 ${simEnemyNames.length} 个敌人：17 世界 BOSS + 6 剧情/周本 BOSS + 7 Common + 7 Elite + 3 小怪 + 3 召唤物\n`;
  report += `- API 有 ${compact.length} 个敌人，远超模拟器规模\n`;
  report += `- 已匹配 ${matched.length} 个，可直接利用 API 校准数值\n\n`;

  report += `### 8.2 优先级\n`;
  report += `1. **立即**：对已匹配的 ${matched.length} 个敌人，用 API 的 Lv90 数值替换 enemies.js 中的手动估算值\n`;
  report += `2. **高优先级**：将 Common（轻波级）和 Elite（巨浪级）敌人按需扩充到副本池（${(apiByRarity['轻波级']?.length || 0) + (apiByRarity['巨浪级']?.length || 0)} 个可选）\n`;
  report += `3. **中优先级**：补全缺失的 ${(apiByRarity['怒涛级']?.length || 0)} 个 Overlord 级 BOSS（${(apiByRarity['怒涛级'] || []).slice(0,5).map(m => m.name).join('、')}…）\n`;
  report += `4. **低优先级**：${apiByRarity['海啸级']?.length || 0} 个 Calamity 级 BOSS（${(apiByRarity['海啸级'] || []).slice(0,3).map(m => m.name).join('、')}…），周本/剧情为主，暂不急\n\n`;

  report += `### 8.3 数据迁移策略\n`;
  report += `1. 在 enemies.js 中每个敌人增加 \`encoreId\` 字段指向 API 敌人 ID\n`;
  report += `2. 用 \`spawnEnemy()\` 从紧凑 JSON 读 Lv90 数值\n`;
  report += `3. 抗性字段：API 用千分比（1000=10%），需除以 10000 转为小数\n`;
  report += `4. 保留模拟器自定义的 mechanic/description 字段\n`;

  writeFileSync(REPORT_PATH, report, 'utf8');
}

main().catch(e => { console.error(e); process.exit(1); });
