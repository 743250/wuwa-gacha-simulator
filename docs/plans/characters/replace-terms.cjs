#!/usr/bin/env node
/**
 * Mechanical string replacement for character design documents.
 * Rules A, B, C as specified.
 */
const fs = require('fs');
const path = require('path');

const FILES = [
  "弗洛洛.md",
  "奥古斯塔.md",
  "尤诺.md",
  "仇远.md",
  "千咲.md",
];

const DIR = "/data/data/com.termux/files/home/AI code工作区/wuwa-gacha-simulator/docs/plans/characters";

// Rule A: buff/debuff (order matters, longest first)
const BUFF_RULES = [
  ['双buff', '双增益'],
  ['独立buff', '独立增益'],
  ['团队buff', '团队增益'],
  ['全队buff', '全队增益'],
  ['前一次buff', '前一次增益'],
  ['荣光buff', '荣光增益'],
  ['热熔buff', '热熔增益'],
  ['延奏buff', '延奏增益'],
  ['增益buff', '增益'],
  ['buff开关', '增益开关'],
  ['buff持续时间', '增益持续时间'],
  ['buff', '增益'],
  ['debuff类型', '减益类型'],
  ['debuff', '减益'],
];

function isSkipLine(stripped) {
  return stripped.startsWith('- ❌');
}

function applyRuleA(text) {
  for (const [old, next] of BUFF_RULES) {
    while (text.includes(old)) {
      text = text.replace(old, next);
    }
  }
  return text;
}

function applyRuleC(text) {
  // 'core' standalone - word boundary
  text = text.replace(/\bcore\b/g, '核心');
  // 爆发解放机
  text = text.replace(/爆发解放机/g, '爆发解放机制');
  // carrying
  text = text.replace(/carrying/g, '携带');
  return text;
}

function hasNumericContext(segment, maxLen) {
  const check = segment.slice(-maxLen) + segment.slice(0, maxLen);
  return /[\d.%]/.test(check);
}

function countChineseChars(s) {
  return (s.match(/[\u4e00-\u9fff]/g) || []).length;
}

function isSkillChainItem(item) {
  item = item.trim();
  // Check for special chars
  if (/[a-zA-Z0-9/+%]/.test(item)) return false;
  if (item.includes('·')) {
    // Items with · like "不败恒阳·迅击" are skill names
    return true;
  }
  const cc = countChineseChars(item);
  const totalLen = item.replace(/\s/g, '').length;
  // Short Chinese names: 2-8 chars
  return cc > 0 && totalLen <= 10;
}

/**
 * Replace → in a line based on context.
 */
function replaceArrowsInLine(text) {
  const counts = {转为: 0, 接: 0, 变为: 0, 然后: 0};

  const arrowCount = (text.match(/→/g) || []).length;
  if (arrowCount === 0) return [text, counts];

  // Skip if arrow is inside `→` (meta explanation)
  if (text.includes('`→`')) return [text, counts];

  // Normalize spaces around →
  const normalized = text.replace(/ → /g, '→').replace(/→ /g, '→').replace(/ →/g, '→');

  const segments = normalized.split('→');
  if (segments.length <= 1) return [text, counts];

  if (segments.length >= 3) {
    // 2+ arrows - determine chain type
    const nonEmpty = segments.filter(s => s.trim().length > 0);
    const anyNumeric = nonEmpty.some(s => hasNumericContext(s, 15));
    const allShortChinese = nonEmpty.every(s => isSkillChainItem(s));

    if (allShortChinese && !anyNumeric) {
      // Skill chain: all become 接
      // Find original pattern: was there spacing?
      if (text.includes(' → ')) {
        // With spaces: need to rebuild carefully
        const origSegs = text.split(' → ');
        let result = origSegs[0];
        for (let i = 1; i < origSegs.length; i++) {
          result += '接' + origSegs[i];
        }
        counts['接'] = origSegs.length - 1;
        return [result, counts];
      } else {
        let result = segments[0];
        for (let i = 1; i < segments.length; i++) {
          result += '接' + segments[i];
        }
        counts['接'] = segments.length - 1;
        return [result, counts];
      }
    } else {
      // Process step: all become ，然后
      if (text.includes(' → ')) {
        const origSegs = text.split(' → ');
        let result = origSegs[0];
        for (let i = 1; i < origSegs.length; i++) {
          result += '，然后' + origSegs[i];
        }
        counts['然后'] = origSegs.length - 1;
        return [result, counts];
      } else {
        let result = segments[0];
        for (let i = 1; i < segments.length; i++) {
          result += '，然后' + segments[i];
        }
        counts['然后'] = segments.length - 1;
        return [result, counts];
      }
    }
  } else {
    // Exactly 1 arrow (2 segments)
    // Need to split carefully - get the original left/right
    let left, right;
    if (text.includes(' → ')) {
      const parts = text.split(' → ');
      left = parts[0];
      right = parts[1];
    } else {
      const idx = text.indexOf('→');
      left = text.slice(0, idx);
      right = text.slice(idx + 1);
    }

    const leftHasNum = hasNumericContext(left, 25);
    const rightHasNum = hasNumericContext(right, 25);

    let repl = '转为'; // default
    counts['转为'] = 1;

    if (leftHasNum || rightHasNum) {
      repl = '变为';
      counts['转为'] = 0;
      counts['变为'] = 1;
    }

    // Rebuild preserving original spacing
    let result;
    const origIdx = text.indexOf('→');
    const beforeSpaces = text.slice(origIdx - 2, origIdx);
    const afterSpaces = text.slice(origIdx + 1, origIdx + 3);

    if (beforeSpaces === ' ' && text.includes(' →')) {
      // " →" pattern
      result = left + ' ' + repl + right;
    } else if (afterSpaces === ' ' && text.includes('→ ')) {
      // "→ " pattern
      result = left + repl + ' ' + right;
    } else if (text.includes(' → ')) {
      // " → " pattern
      result = left + '转为' + right;
    } else {
      // "→" pattern
      result = left + repl + right;
    }

    if (repl === '转为') {
      // But wait - check if it's actually a skill chain
      // For pure skill chains like "乐声→彩乐", it IS a conversion
      // Default stays 转为
    }

    return [result, counts];
  }
}

function processFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  let totalBuff = 0;
  let totalArrow = 0;
  let arrow转为 = 0;
  let arrow接 = 0;
  let arrow变为 = 0;
  let arrow然后 = 0;

  const outputLines = [];
  let inCodeBlock = false;

  for (let line of lines) {
    const stripped = line.trimStart();

    // Track code blocks
    if (stripped.trimEnd() === '```') {
      inCodeBlock = !inCodeBlock;
      outputLines.push(line);
      continue;
    }

    // Skip replacements in code blocks
    if (inCodeBlock) {
      outputLines.push(line);
      continue;
    }

    // Skip ❌ lines
    if (isSkipLine(stripped)) {
      outputLines.push(line);
      continue;
    }

    const original = line;

    // Rule A
    let newLine = applyRuleA(line);

    // Count buff replacements
    for (const [old,] of BUFF_RULES) {
      if (old === 'buff') continue; // Will overcount
    }
    // More accurate: count differences
    const buffBefore = (original.match(/buff/g) || []).length;
    const buffAfter = (newLine.match(/buff/g) || []).length;
    totalBuff += Math.max(0, buffBefore - buffAfter);
    const debuffBefore = (original.match(/debuff/g) || []).length;
    const debuffAfter = (newLine.match(/debuff/g) || []).length;
    totalBuff += Math.max(0, debuffBefore - debuffAfter);

    // Rule C
    newLine = applyRuleC(newLine);

    // Rule B - → replacement
    const hasArrow = newLine.includes('→');
    if (hasArrow) {
      const [result, counts] = replaceArrowsInLine(newLine);
      newLine = result;
      totalArrow += counts['转为'] + counts['接'] + counts['变为'] + counts['然后'];
      arrow转为 += counts['转为'];
      arrow接 += counts['接'];
      arrow变为 += counts['变为'];
      arrow然后 += counts['然后'];
    }

    outputLines.push(newLine);
  }

  fs.writeFileSync(filepath, outputLines.join('\n'), 'utf-8');

  return { totalBuff, totalArrow, arrow转为, arrow接, arrow变为, arrow然后 };
}

function main() {
  const allStats = {};

  for (const basename of FILES) {
    const fp = path.join(DIR, basename);
    console.log(`\n=== Processing: ${basename} ===`);
    const stats = processFile(fp);
    allStats[basename] = stats;
    console.log(`  buff/debuff replacements: ${stats.totalBuff}`);
    console.log(`  → replacements total: ${stats.totalArrow}`);
    console.log(`    → 转为: ${stats.arrow转为}`);
    console.log(`    → 接: ${stats.arrow接}`);
    console.log(`    → 变为: ${stats.arrow变为}`);
    console.log(`    → 然后: ${stats.arrow然后}`);
  }

  // Verification
  console.log("\n\n=== Verification ===");
  console.log("Remaining matches (should be near 0, except ❌ lines and code blocks):");
  for (const basename of FILES) {
    const fp = path.join(DIR, basename);
    const lines = fs.readFileSync(fp, 'utf-8').split('\n');
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const stripped = line.trimStart();
      if (stripped.startsWith('- ❌') || stripped.trimEnd() === '```') continue;
      if (/buff|debuff|→|carrying/.test(line)) {
        if (!found) {
          console.log(`\n--- ${basename} ---`);
          found = true;
        }
        console.log(`  L${i+1}: ${line}`);
      }
    }
    if (!found) {
      console.log(`\n--- ${basename} ---`);
      console.log("  (none)");
    }
  }
}

main();