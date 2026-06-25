# 鸣潮完整敌人数据库

> 采集日期：2026-06-25  
> 来源：wuthering.wiki 怪物数据（198 个条目 · 含逐级 HP/ATK/DEF） + Game8 / TheGamer 战斗机制指南  
> 状态：**全部敌人名称、元素、职业、抗性、逐级数值已采集**

## 元素映射

| 代码 | 中文 | 英文 |
|---|---|---|
| Physical | 物理 | Phys |
| Glacio | 冷凝 | Ice |
| Fusion | 热熔 | Fire |
| Electro | 导电 | Thunder |
| Aero | 气动 | Wind |
| Spectro | 衍射 | Light |
| Havoc | 湮灭 | Dark |

## 职业分类

| 职业 | ID 前缀 | 数量 | 说明 |
|---|---|---|---|
| Common（普通） | 31xxxxx | 89 | 最低级残象，无特殊机制 |
| Elite（精英） | 32xxxxx | 46 | 中型残象，部分有轻机制 |
| Overlord（怒涛/世界BOSS） | 33xxxxx | 20 | 世界 BOSS 级，完整机制 |
| Calamity（灾难/周本） | 34xxxxx | 23 | 剧情/周本 BOSS |
| Phantom（幻象/Echo） | 35xxxxx | 28 | Echo 掉落变体 |

---

## 数值缩放规则

> 来源：wuthering.wiki 逐级数据提取，17 个 BOSS + Common + Elite 核验

### DEF 缩放（所有敌人统一）
```
Lv1: 800 → Lv10: 872 → Lv20: 952 → Lv30: 1,032 → Lv40: 1,112
Lv50: 1,192 → Lv60: 1,272 → Lv70: 1,352 → Lv80: 1,432
Lv90: 1,512 → Lv100: 1,592 → Lv110: 1,672 → Lv120: 1,752
规律：每 10 级 +80
```

### ATK 缩放
```
ATK 在 Lv90 封顶，之后不再增长（Lv100/110/120 不变）
具体封顶值因敌人而异（见下表）
```

### HP 缩放
```
Lv1→50 约 ×20 · Lv50→90 约 ×12-13 · Lv90→100 约 ×1.39
Lv90→120 约 ×1.65（不同敌人略有偏差）
```

### 抗性（所有敌人统一）
```
自身元素：40%
其他 6 种元素：各 10%
物理：10%（除非自身为物理则 40%）
```

---

## 世界 BOSS 数值表（Overlord 级 · Lv90 基准）

| BOSS | 元素 | HP Lv90 | ATK Lv90（封顶） | DEF Lv90 | 抗性 |
|---|---|---|---|---|---|
| Tempest Mephis 云闪之鳞 | Electro | 369,486 | 10,051 | 1,512 | 电 40% |
| Inferno Rider 燎照之骑 | Fusion | 468,488 | 8,912 | 1,512 | 热熔 40% |
| Impermanence Heron 无常凶鹭 | Havoc | 419,906 | 10,721 | 1,512 | 湮灭 40% |
| Lampylumen Myriad 辉萤军势 | Glacio | 460,348 | 13,669 | 1,512 | 冷凝 40% |
| Feilian Beringal 飞廉之猩 | Aero | 453,257 | 11,592 | 1,512 | 气动 40% |
| Mourning Aix 哀声鸷 | Spectro | 435,137 | 10,386 | 1,512 | 衍射 40% |
| Fallacy of No Return 无归的谬误 | Spectro | 435,137 | 8,375 | 1,512 | 衍射 40% |
| Lorelei 罗蕾莱 | Havoc | 558,562 | 10,386 | 1,512 | 湮灭 40% |
| Sentry Construct 异构武装 | Glacio | 584,823 | 13,401 | 1,512 | 冷凝 40% |
| Dragon of Dirge 叹息古龙 | Fusion | 535,716 | 11,726 | 1,512 | 热熔 40% |
| Scar 伤痕（怒涛级） | Fusion | — | — | 1,512 | 热熔 40% |
| Lioness of Glory 荣耀狮像 | Fusion | 535,716 | 11,726 | 1,512 | 热熔 40% |
| Lady of the Sea 海之女 | Aero | 535,716 | 10,386 | 1,512 | 气动 40% |

## 周本/剧情 BOSS 数值表（Calamity 级 · Lv90 基准）

| BOSS | 元素 | HP Lv90 | ATK Lv90（封顶） | DEF Lv90 | 抗性 |
|---|---|---|---|---|---|
| Crownless 无冠者 | Havoc | 181,198 | 4,020 | 1,512 | 湮灭 40% |
| Bell-Borne Geochelone 鸣钟之龟 | Glacio | 423,058 | 8,040 | 1,512 | 冷凝 40% |
| Dreamless 无妄者 | Havoc | 564,602 | 11,056 | 1,512 | 湮灭 40% |
| Thundering Mephis 朔雷之鳞 | Electro | 459,297 | 13,200 | 1,512 | 导电 40% |
| Mech Abomination 聚械机偶 | Electro | 460,348 | 12,999 | 1,512 | 导电 40% |
| Hecate 赫卡忒 | Havoc | — | — | 1,512 | 湮灭 40% |
| Jué 角 | Spectro | — | — | 1,512 | 衍射 40% |

## 普通/精英怪物数值参考（Lv90 基准）

| 敌人 | 职业 | 元素 | HP Lv90 | ATK Lv90（封顶） | DEF Lv90 |
|---|---|---|---|---|---|
| Vanguard Junrock | Common | Physical | 33,876 | 6,834 | 1,512 |
| Stonewall Bracer | Elite | Physical | 115,809 | 8,979 | 1,512 |
| Viridblaze Saurian | Elite | Fusion | 64,601 | 10,051 | 1,512 |

### 数值规律总结
```
Common:  HP ~30K-40K,   ATK ~6,500-7,500
Elite:   HP ~60K-120K,  ATK ~9,000-10,000
Overlord: HP ~370K-585K, ATK ~8,400-13,700
Calamity: HP ~180K-565K, ATK ~4,000-13,200

DEF 全职业统一，仅随等级变化
抗性全职业统一：自身元素 40%，其他 10%
```

---

## 一、普通级 Common（89 个）

### Physical（物理）

| ID | 英文名 | 建议中文名 |
|---|---|---|
| 310000010 | Vanguard Junrock | 先锋岩块 |
| 310000020 | Fission Junrock | 裂变岩块 |
| 310000190 | Sabyr Boar | 剑齿野猪 |
| 310000230-245 | Exile（多属性变体） | 流放者 |
| 310000260 | Diamondclaw | 钻石爪 |
| 310000360 | Dwarf Cassowary | 矮鹤鸵 |
| 310000470 | Diggy Duggy | 掘掘 |
| 310000520 | La Guardia | 守卫者 |

### Electro（导电）

| ID | 英文名 | 建议中文名 |
|---|---|---|
| 310000030 | Electro Predator | 导电掠食者 |
| 310000380 | Voltscourge Stalker | 伏电潜行者 |
| 310000560 | Electro Drake | 导电幼龙 |

### Glacio（冷凝）

| ID | 英文名 | 建议中文名 |
|---|---|---|
| 310000040 | Glacio Predator | 冷凝掠食者 |
| 310000120 | Gulpuff | 吞吞 |
| 310000140 | Glacio Prism | 冷凝棱镜 |
| 310000270 | Hoartoise | 冰霜龟 |
| 310000340 | Clang Bang | 铛铛 |
| 310000390 | Frostscourge Stalker | 伏霜潜行者 |
| 310000500 | Calcified Junrock | 钙化岩块 |
| 310000570 | Glacio Drake | 冷凝幼龙 |

### Aero（气动）

| ID | 英文名 | 建议中文名 |
|---|---|---|
| 310000050 | Aero Predator | 气动掠食者 |
| 310000100 | Whiff Whaff | 拂拂 |
| 310000130 | Chirpuff | 啾啾 |
| 310000250-251 | Hooscamp / Hooscamp Flinger | 飞环投手 |
| 310000300 | Hooscamp Clapperclaw | 飞环拍击 |
| 310000370 | Galescourge Stalker | 伏风潜行者 |
| 310000510 | Aero Prism | 气动棱镜 |
| 310000540 | Sacerdos | 祭司 |
| 310000550 | Aero Drake | 气动幼龙 |
| 310000610 | Devotee's Flesh | 信徒之躯 |

### Fusion（热熔）

| ID | 英文名 | 建议中文名 |
|---|---|---|
| 310000060 | Fusion Warrior | 热熔武士 |
| 310000080 | Snip Snap | 咔嚓 |
| 310000150 | Fusion Prism | 热熔棱镜 |
| 310000210 | Baby Viridblaze Saurian | 碧焰幼蜥 |
| 310000280 | Fusion Dreadmane | 热熔恐鬃 |
| 310000350 | Lava Larva | 熔岩幼虫 |
| 310000400 | Chop Chop: Headless | 斩斩·无头 |
| 310000580 | Fusion Drake | 热熔幼龙 |

### Spectro（衍射）

| ID | 英文名 | 建议中文名 |
|---|---|---|
| 310000090 | Zig Zag | 折折 |
| 310000160 | Spectro Prism | 衍射棱镜 |
| 310000180 | Cruisewing | 巡航翼 |
| 310000330 | Traffic Illuminator | 交通信号灯 |
| 310000410 | Chop Chop: Leftless | 斩斩·无左 |
| 310000440 | Nimbus Wraith | 云灵 |
| 310000460 | Lottie Lost | 迷路的洛蒂 |
| 310000480 | Chest Mimic | 宝箱拟态 |
| 310000490 | Golden Junrock | 金色岩块 |
| 310000530 | Sagittario | 射手 |
| 310000590 | Spectro Drake | 衍射幼龙 |

### Havoc（湮灭）

| ID | 英文名 | 建议中文名 |
|---|---|---|
| 310000070 | Havoc Warrior | 湮灭武士 |
| 310000110 | Tick Tack | 滴答 |
| 310000170 | Havoc Prism | 湮灭棱镜 |
| 310000200 | Excarat | 掘地鼠 |
| 310000220 | Young Roseshroom | 幼玫瑰菇 |
| 310000420 | Chop Chop: Rightless | 斩斩·无右 |
| 310000430 | Fae Ignis | 火灵 |
| 310000450 | Hocus Pocus | 戏法灵 |
| 310000600 | Havoc Drake | 湮灭幼龙 |

### 多元素 / Nightmare 变体（普通级）

| ID | 英文名 | 元素 |
|---|---|---|
| 310000630 | Nightmare: Havoc Warrior | Havoc |
| 310000640 | Nightmare: Glacio Predator | Glacio |
| 310000650 | Nightmare: Electro Predator | Electro |
| 310000660 | Nightmare: Aero Predator | Aero |
| 310000670 | Nightmare: Gulpuff | Glacio |
| 310000680 | Nightmare: Chirpuff | Aero |

### 流放者/残响团（Fractsidus · 多属性）

| ID | 英文名 | 元素 |
|---|---|---|
| 310000290 | Fractsidus Thruster | Physical |
| 310000310 | Fractsidus Cannoneer | Physical |
| 310000320 | Fractsidus Gunmaster | Physical |
| 310000620 | Abyssal Gunmaster | Glacio |

---

## 二、精英级 Elite（46 个）

| ID | 英文名 | 元素 | 建议中文名 |
|---|---|---|---|
| 320000010 | Stonewall Bracer | Physical | 石壁护腕 |
| 320000020 | Violet-Feathered Heron | Electro | 紫羽鹭 |
| 320000030 | Cyan-Feathered Heron | Aero | 青羽鹭 |
| 320000040 | Flautist | Electro | 笛手 |
| 320000050 | Tambourinist | Havoc | 鼓手 |
| 320000060 | Rocksteady Guardian | Spectro | 坚岩守护者 |
| 320000070 | Chasm Guardian | Havoc | 深渊守护者 |
| 320000080 | Viridblaze Saurian | Fusion | 碧焰蜥 |
| 320000090 | Roseshroom | Havoc | 玫瑰菇 |
| 320000100 | Havoc Dreadmane | Havoc | 湮灭恐鬃 |
| 320000110-111 | Hoochief Cyclone | Aero | 旋风酋长 |
| 320000120 | Spearback | Physical | 矛背兽 |
| 320000130 | Carapace | Aero | 甲壳兽 |
| 320000140 | Exile Leader | Havoc | 流放者首领 |
| 320000150 | Exile Technician | Spectro | 流放者技师 |
| 320000160 | Fractsidus Executioner | Havoc | 残响团处刑者 |
| 320000170 | Hoochief Menace | Aero | 威胁酋长 |
| 320000180 | Autopuppet Scout | Glacio | 自走傀儡斥候 |
| 320000190 | Glacio Dreadmane | Glacio | 冷凝恐鬃 |
| 320000200 | Lumiscale Construct | Glacio | 辉萤军势 |
| 320000210 | Lightcrusher | Spectro | 碎光者 |
| 320000220 | Questless Knight | Electro | 无求骑士 |
| 320000230 | Diurnus Knight | Spectro | 昼骑士 |
| 320000240 | Nocturnus Knight | Havoc | 夜骑士 |
| 320000250 | Abyssal Patricius | Glacio | 深渊贵族 |
| 320000260 | Abyssal Gladius | Glacio | 深渊剑士 |
| 320000270 | Abyssal Mercator | Glacio | 深渊商人 |
| 320000280 | Chop Chop | Fusion | 斩斩 |
| 320000290 | Vitreum Dancer | Electro | 琉璃舞者 |
| 320000300 | Cuddle Wuddle | Physical | 抱抱 |
| 320000310 | Rage Against the Statue | Spectro | 荣耀狮像（精英变体）|
| 320000320 | Hurriclaw | Aero | 飓风爪 |
| 320000330 | Capitaneus | Spectro | 队长 |
| 320000340 | Kerasaur | Physical | 角龙 |
| 320000350 | Pilgrim's Shell | Aero | 朝圣者之壳 |
| 320000360 | Flamecrest Gladiator | Fusion | 焰冠角斗士 |
| 320000370 | Galecrest Gladiator | Aero | 风冠角斗士 |
| 320000380 | Lightcrest Gladiator | Spectro | 光冠角斗士 |
| 320000390 | Frostcrest Gladiator | Glacio | 霜冠角斗士 |
| 320000400 | Thundercrest Gladiator | Electro | 雷冠角斗士 |
| 320000410 | Abysscrest Gladiator | Havoc | 渊冠角斗士 |
| 320000420 | Fractsidus Inspector | Havoc | 残响团督查 |
| 320000430 | Nightmare: Tambourinist | Havoc | 梦魇鼓手 |
| 320000440 | Corrosaurus | Fusion | 腐蚀龙 |
| 320000450 | Nightmare: Violet-Feathered Heron | Electro | 梦魇紫羽鹭 |
| 320000460 | Nightmare: Cyan-Feathered Heron | Aero | 梦魇青羽鹭 |

---

## 三、世界 BOSS 级 Overlord（20 个）

> 详细机制见 [世界BOSS机制文档](world-boss-mechanics.md)

| ID | 英文名 | 中文名 | 元素 |
|---|---|---|---|
| 330000010 | Tempest Mephis | 云闪之鳞 | Electro |
| 330000020 | Inferno Rider | 燎照之骑 | Fusion |
| 330000030 | Impermanence Heron | 无常凶鹭 | Havoc |
| 330000040 | Lampylumen Myriad | 辉萤军势 | Glacio |
| 330000050 | Feilian Beringal | 飞廉之猩 | Aero |
| 330000060 | Mourning Aix | 哀声鸷 | Spectro |
| 330000070 | Fallacy of No Return | 无归的谬误 | Spectro |
| 330000100 | Scar（怒涛级） | 伤痕 | Fusion |
| 330000110 | Lorelei | 罗蕾莱 | Havoc |
| 330000120 | Sentry Construct | 异构武装 | Glacio |
| 330000130 | Dragon of Dirge | 叹息古龙 | Fusion |
| 330000140 | Nightmare: Feilian Beringal | 梦魇·飞廉之猩 | Electro |
| 330000150 | Nightmare: Impermanence Heron | 梦魇·无常凶鹭 | Havoc |
| 330000160 | Nightmare: Thundering Mephis | 梦魇·朔雷之鳞 | Electro |
| 330000170 | Nightmare: Tempest Mephis | 梦魇·云闪之鳞 | Electro |
| 330000180 | Nightmare: Crownless | 梦魇·无冠者 | Havoc |
| 330000190 | Nightmare: Inferno Rider | 梦魇·燎照之骑 | Fusion |
| 330000200 | Nightmare: Mourning Aix | 梦魇·哀声鸷 | Spectro |

---

## 四、周本 / 剧情 BOSS Calamity（23 个）

| ID | 英文名 | 中文名 | 元素 | 类型 |
|---|---|---|---|---|
| 340000010 | Crownless | 无冠者 | Havoc | 剧情 |
| 340000020 | Bell-Borne Geochelone | 鸣钟之龟 | Glacio | 周本 |
| 340000050 | Scar | 伤痕 | Spectro | 剧情/周本 |
| 340000060 | Mech Abomination | 聚械机偶 | Electro | 世界BOSS（Calamity级） |
| 340000070 | Dreamless | 无妄者 | Havoc | 周本 |
| 340000080 | Thundering Mephis | 朔雷之鳞 | Electro | 世界BOSS |
| 340000090 | Jué | 角 | Spectro | 岁主/周本 |
| 340000100 | Hecate | 赫卡忒 | Havoc | 周本 |
| 340000110-112 | Kelpie / Nightmare: Kelpie | 凯尔派 | Glacio | 周本 |
| 340000120-122 | Fleurdelys | 弗莱德莉丝 | Aero | 周本 |
| 340000130 | Nightmare: Lampylumen Myriad | 梦魇·辉萤军势 | Glacio | 梦魇周本 |
| 340000140-141 | Lioness of Glory | 荣耀狮像 | Fusion | 世界BOSS |
| 340000150-151 | Fenrico | 芬里科 | Aero | 周本 |
| 340000160 | Nightmare: Hecate | 梦魇·赫卡忒 | Havoc | 梦魇周本 |
| 340000170 | The False Sovereign | 伪王 | Electro | 剧情/周本 |
| 340000180-181 | Lady of the Sea | 海之女 | Aero | 世界BOSS |

---

## 五、无音区敌人 · 按元素映射

基于声骸套装 → 元素 → 匹配对应敌人池：

| 无音区位置 | 套装元素 | Common 池（示例） | Elite 池（示例） |
|---|---|---|---|
| 荒石高地 I（Aero + Electro） | 气动 + 导电 | Aero Predator, Electro Predator, Whiff Whaff, Zig Zag | Cyan-Feathered Heron, Violet-Feathered Heron, Hoochief, Flautist |
| 虎口山脉（Glacio + Spectro） | 冷凝 + 衍射 | Glacio Predator, Gulpuff, Spectro Prism, Cruisewing | Autopuppet Scout, Lumiscale Construct, Rocksteady Guardian, Lightcrusher |
| 归墟港（Fusion） | 热熔 | Fusion Warrior, Snip Snap, Baby Viridblaze Saurian, Fusion Prism | Viridblaze Saurian, Chop Chop, Fusion Dreadmane |
| 无光之森（Havoc + Aero） | 湮灭 + 气动 | Havoc Warrior, Tick Tack, Whiff Whaff, Aero Predator | Tambourinist, Chasm Guardian, Hoochief, Roseshroom |
| 怨鸟泽（Spectro） | 衍射 | Spectro Prism, Cruisewing, Zig Zag, Nimbus Wraith | Rocksteady Guardian, Lightcrusher, Diurnus Knight |
| ... | ... | ... | ... |

完整 20 个无音区的敌人映射表需要逐一定义。这类映射建议放模拟器代码里而非本文档。

---

## 六、模拟器当前敌人覆盖度

| 维度 | 官方 | 模拟器 | 差距 |
|---|---|---|---|
| 普通残象 | 89 种，6 元素全覆盖 | 3 种（幼狼/飞兽/古老幽灵=气动/导电/衍射） | ⚠️ 缺热熔/冷凝/湮灭/物理小怪 |
| 精英残象 | 46 种 | 0 种 | ❌ 完全缺失 |
| Overlord BOSS | 20 个（含 Nightmare） | 18 个（含部分 Calamity） | 缺 Nightmare 变体 |
| Calamity BOSS | 23 个 | 6 个 | 缺 17 个 |
| 元素覆盖率 | 7 元素 | 3 元素 | 缺物理/热熔/冷凝/湮灭 |

---

## 来源

- wuthering.wiki 怪物数据库（198 条目，含 ID/名称/元素/等级）
- Game8 — All Enemies List: https://game8.co/games/Wuthering-Waves/archives/453459
- TheGamer / GameRant — BOSS 战斗指南（17 个世界 BOSS 详细机制）
