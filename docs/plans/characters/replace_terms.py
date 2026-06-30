#!/usr/bin/env python3
"""
Mechanical string replacement for character design documents.
Rules A, B, C as specified.
"""
import re
import sys

FILES = [
    "/data/data/com.termux/files/home/AI code工作区/wuwa-gacha-simulator/docs/plans/characters/弗洛洛.md",
    "/data/data/com.termux/files/home/AI code工作区/wuwa-gacha-simulator/docs/plans/characters/奥古斯塔.md",
    "/data/data/com.termux/files/home/AI code工作区/wuwa-gacha-simulator/docs/plans/characters/尤诺.md",
    "/data/data/com.termux/files/home/AI code工作区/wuwa-gacha-simulator/docs/plans/characters/仇远.md",
    "/data/data/com.termux/files/home/AI code工作区/wuwa-gacha-simulator/docs/plans/characters/千咲.md",
]

# Rule A: buff/debuff (order matters, longest first)
BUFF_RULES = [
    ('双buff', '双增益'),
    ('独立buff', '独立增益'),
    ('团队buff', '团队增益'),
    ('全队buff', '全队增益'),
    ('前一次buff', '前一次增益'),
    ('荣光buff', '荣光增益'),
    ('热熔buff', '热熔增益'),
    ('延奏buff', '延奏增益'),
    ('增益buff', '增益'),
    ('buff开关', '增益开关'),
    ('buff持续时间', '增益持续时间'),
    ('buff', '增益'),
    ('debuff类型', '减益类型'),
    ('debuff', '减益'),
]


def is_skip_line(stripped):
    """Check if line should be skipped for replacements."""
    if stripped.startswith('- ❌'):
        return True
    return False


def apply_rule_a(text):
    """Apply buff/debuff replacements."""
    for old, new in BUFF_RULES:
        text = text.replace(old, new)
    return text


def apply_rule_c(text):
    """Apply other shorthand replacements."""
    # 'core' standalone - word boundary
    text = re.sub(r'\bcore\b', '核心', text)
    # 爆发解放机
    text = text.replace('爆发解放机', '爆发解放机制')
    # carrying
    text = text.replace('carrying', '携带')
    return text


def has_numeric_context(segment, max_len=20):
    """Check if segment contains numeric/percentage content."""
    check = segment[:max_len] if len(segment) > max_len else segment
    return bool(re.search(r'[\d.%]', check))


def count_chinese_chars(s):
    """Count Chinese characters in a string."""
    return len(re.findall(r'[\u4e00-\u9fff]', s))


def is_skill_chain_item(item):
    """Check if an item looks like a skill name (mostly Chinese, short)."""
    # Trim whitespace and leading/trailing punct
    item = item.strip()
    # Remove common prefixes like '进入' or '获得'
    # Pure Chinese skill name: mostly Chinese chars, short, no special chars
    has_special = bool(re.search(r'[a-zA-Z0-9/+%]', item))
    if has_special:
        return False
    # Short skill names are typically 2-6 Chinese chars
    cc = count_chinese_chars(item)
    total_len = len(item.replace(' ', '').replace('·', ''))
    if cc > 0 and total_len <= 12:
        return True
    return False


def replace_arrows_in_line(text):
    """
    Rule B: Replace → based on context.
    Returns (new_text, counts_dict).
    """
    counts = {'转为': 0, '接': 0, '变为': 0, '然后': 0}

    # Count arrows
    arrow_count = text.count('→')
    if arrow_count == 0:
        return text, counts

    # Split line by →
    # But we need to handle potential spaces around → like "A → B"
    # Normalize: replace " → " with "→" for consistent processing
    normalized = text.replace(' → ', '→')

    segments = normalized.split('→')

    if len(segments) <= 1:
        return text, counts

    # Determine replacement type based on segments
    # For 2 segments (1 arrow): check context
    # For 3+ segments (2+ arrows): determine chain type

    if len(segments) >= 3:
        # 2+ arrows - determine if it's a skill chain or process step

        # Check if all items look like skill chain items
        # Also check if any item has numeric/special content
        any_numeric = any(has_numeric_context(s) for s in segments)

        # Count non-empty items
        non_empty = [s for s in segments if s.strip()]

        # Check if items look like skill names (short, Chinese-only)
        all_short_chinese = all(
            is_skill_chain_item(s) for s in non_empty
        )

        if all_short_chinese and not any_numeric:
            # Skill chain → use 接
            joiner = '接'
            counts['接'] = len(non_empty) - 1
        else:
            # Process step → use ，然后
            # But the pattern from the example: "入场，标记，然后追击"
            # So first → becomes "，" (comma+space), and subsequent → become "，然后"
            # But for simplicity, and since this is a mechanical rule, let me just use "，然后"
            # Actually the example: `入场→标记→追击` → `入场，标记，然后追击`
            # First arrow → "，", second → "，然后"
            # For 4+ items: first → → "，", rest → "，然后"
            joiner = '，然后'
            counts['然后'] = len(non_empty) - 1

        # Rebuild the line with the joiner
        result = segments[0]
        for i in range(1, len(segments)):
            if i == 1 and len(segments) >= 3 and all_short_chinese and not any_numeric:
                # Skill chain: all use 接
                result += joiner + segments[i]
            elif i == 1 and len(segments) >= 3:
                # Process step: first → becomes "，"
                # Restore any spaces that were around the original arrow
                result += '，' + segments[i]
                counts['然后'] = len(non_empty) - 1
            elif len(segments) >= 3 and not (all_short_chinese and not any_numeric):
                result += joiner + segments[i]
            else:
                result += joiner + segments[i]

        # Adjust counts for process step: first arrow is "，", rest are "，然后"
        if not (all_short_chinese and not any_numeric) and len(segments) >= 3:
            counts['然后'] = len(segments) - 2  # one less since first is "，"
            # We'll count "，" as "分隔" but actually it's also 然后-type
            # Actually for counting purposes, first arrow is 然后 type too
            counts['然后'] = len(segments) - 1  # all arrows are 然后 type

        return result, counts

    else:
        # Exactly 2 segments (1 arrow)
        left = segments[0]
        right = segments[1]

        left_has_num = has_numeric_context(left, 25)
        right_has_num = has_numeric_context(right, 25)

        # Heuristic 1: numeric change
        if left_has_num or right_has_num:
            repl = '变为'
            counts['变为'] = 1
        # Heuristic 2: check for state-related keywords
        elif any(kw in left[-10:] for kw in ['满', '进入', '达到', '处于']):
            repl = '转为'
            counts['转为'] = 1
        # Heuristic 3: check if it looks like a state conversion (resource→resource)
        elif (len(left.strip()) <= 8 and len(right.strip()) <= 8
              and not re.search(r'[+\-/*]', left[-5:] + right[:5])):
            # Could be skill chain or state conversion
            # If both sides are purely Chinese short names → state conversion → 转为
            if (count_chinese_chars(left[-10:]) > 0 and
                count_chinese_chars(right[:10]) > 0):
                repl = '转为'
                counts['转为'] = 1
            else:
                repl = '转为'
                counts['转为'] = 1
        else:
            repl = '转为'
            counts['转为'] = 1

        # Rebuild, preserving original spacing
        # Find original arrow with spaces
        if ' → ' in text:
            result = left + '转为' + right
        elif '→ ' in text:
            result = left + repl + ' ' + right
        elif ' →' in text:
            result = left + ' ' + repl + right
        else:
            result = left + repl + right

        return result, counts


def process_file(filepath):
    """Process a single file and return statistics."""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    total_buff = 0
    total_arrow = 0
    arrow_转为 = 0
    arrow_接 = 0
    arrow_变为 = 0
    arrow_然后 = 0

    output_lines = []
    in_code_block = False
    in_frontmatter = False

    for line in lines:
        stripped = line.lstrip()

        # Track code blocks
        if stripped.rstrip() == '```':
            in_code_block = not in_code_block
            output_lines.append(line)
            continue

        # Skip replacements for code block content
        if in_code_block:
            output_lines.append(line)
            continue

        # Skip ❌ lines (but keep them in output unchanged)
        if is_skip_line(stripped):
            output_lines.append(line)
            continue

        original = line

        # Rule A
        new_line = apply_rule_a(line)

        # Count buff replacements
        for old, new in BUFF_RULES:
            if old in original:
                # Count how many times
                cnt = original.count(old)
                total_buff += cnt

        # Rule C
        new_line = apply_rule_c(new_line)

        # Rule B - → replacement
        # But skip if → is inside backtick inline code
        # Simple heuristic: if line has backtick with → inside, skip
        # Actually: inline code is `text`, the → could be inside ``
        # Let me check: lines like `（`→` 是开发者速记）` have backtick-wrapped arrows

        has_arrow = '→' in new_line
        if has_arrow:
            # Check if ALL arrows are in backtick-wrapped sections
            # Simple approach: check if line is just explaining the arrow notation
            if '`→`' not in new_line:  # Not an "arrow is shorthand" explanation
                result, counts = replace_arrows_in_line(new_line)
                new_line = result
                total_arrow += sum(counts.values())
                arrow_转为 += counts['转为']
                arrow_接 += counts['接']
                arrow_变为 += counts['变为']
                arrow_然后 += counts['然后']

        output_lines.append(new_line)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(output_lines)

    return {
        'total_buff': total_buff,
        'total_arrow': total_arrow,
        'arrow_转为': arrow_转为,
        'arrow_接': arrow_接,
        'arrow_变为': arrow_变为,
        'arrow_然后': arrow_然后,
    }


def main():
    all_stats = {}
    for fp in FILES:
        basename = fp.split('/')[-1]
        print(f"\n=== Processing: {basename} ===")
        stats = process_file(fp)
        all_stats[basename] = stats
        print(f"  buff/debuff replacements: {stats['total_buff']}")
        print(f"  → replacements total: {stats['total_arrow']}")
        print(f"    → 转为: {stats['arrow_转为']}")
        print(f"    → 接: {stats['arrow_接']}")
        print(f"    → 变为: {stats['arrow_变为']}")
        print(f"    → 然后: {stats['arrow_然后']}")

    # Verification: grep for remaining buff/debuff/→/carrying
    print("\n\n=== Verification ===")
    print("Remaining matches (should be near 0, except ❌ lines and code blocks):")
    for fp in FILES:
        basename = fp.split('/')[-1]
        print(f"\n--- {basename} ---")
        # Simulate grep
        with open(fp, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        for i, line in enumerate(lines, 1):
            stripped = line.lstrip()
            in_skip = stripped.startswith('- ❌') or line.strip().startswith('```')
            if in_skip:
                continue
            if re.search(r'buff|debuff|→|carrying', line):
                print(f"  L{i}: {line.rstrip()}")


if __name__ == '__main__':
    main()