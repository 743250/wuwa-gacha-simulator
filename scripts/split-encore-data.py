#!/usr/bin/env python3
"""拆分 encore-full-data.json 为单个文件。

角色：docs/sources/characters/<角色名>.json
武器：docs/sources/weapons/by-type/<类型>.json
"""
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ============================================================
# 角色
# ============================================================
char_src = os.path.join(BASE, 'docs/sources/characters/encore-full-data.json')
char_dir = os.path.join(BASE, 'docs/sources/characters/individual')
os.makedirs(char_dir, exist_ok=True)

with open(char_src, 'r', encoding='utf-8') as f:
    chars = json.load(f)

for name, data in chars['results'].items():
    out_path = os.path.join(char_dir, f'{name}.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'✓ 角色: {name}.json')

print(f'\n角色拆分完成: {len(chars["results"])} 个 → {char_dir}')

# ============================================================
# 武器（按类型）
# ============================================================
weapon_src = os.path.join(BASE, 'docs/sources/weapons/encore-full-data.json')
weapon_dir = os.path.join(BASE, 'docs/sources/weapons/by-type')
os.makedirs(weapon_dir, exist_ok=True)

with open(weapon_src, 'r', encoding='utf-8') as f:
    weapons = json.load(f)

by_type = {}
for name, data in weapons['results'].items():
    t = data['type']
    by_type.setdefault(t, {})[name] = data

type_order = ['长刃', '迅刀', '佩枪', '臂铠', '音感仪']
for t in type_order:
    if t in by_type:
        items = by_type[t]
        out_path = os.path.join(weapon_dir, f'{t}.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f'✓ 武器类型 {t}: {len(items)} 把 → {t}.json')

# 也输出一个按品质分组的摘要
summary = {}
for t in type_order:
    if t in by_type:
        q5 = sum(1 for w in by_type[t].values() if w['quality'] == 5)
        q4 = sum(1 for w in by_type[t].values() if w['quality'] == 4)
        summary[t] = {'5星': q5, '4星': q4, '合计': q4 + q5}

print(f'\n武器拆分完成: {len(weapons["results"])} 把 → {weapon_dir}')
print('\n武器类型分布:')
for t, s in summary.items():
    print(f'  {t}: 5★×{s["5星"]} + 4★×{s["4星"]} = {s["合计"]}')
