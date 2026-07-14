# 角色实装状态与进度

> 设计指导见 [README.md](README.md)。本页只管"谁做了 / 谁没做 / 调了什么"。
>
> **两列含义**（2026-07-13 起）：
> - **代码落地**：机制/registry/skillHints/terms 已挂上，能进战斗。
> - **战斗验收**：过 DoD（核心循环 / AP / 关键路径有数 / tooltip 数字=代码）。规则见 [../architecture/project-management-optimization.md](../architecture/project-management-optimization.md)。
> - 旧「✅ 已实装」一律拆成「落地 ✅ / 验收 未」除非本表另写。

## 限定 5★(1.0 → 2.8, 21 个 + 3.0-3.4 10 个)

| 角色 | 元素 | 武器 | 类型 | 上线 | 移植级别 | 强度 Tier | 代码落地 | 战斗验收 | 计划文件 |
|---|---|---|---|---|---|---|---|---|---|
| 忌炎 | 气动 | 长刃 | 主C | 1.0 | S | **A** | ✅ | ✅ 锐意攒放×(1+层)/破阵强化普攻×2/C2通变·C4奇正·C5明断·C6 cap3×1.2+skillHints 对账（2026-07-13） | [忌炎.md](忌炎.md) |
| 吟霖 | 导电 | 音感仪 | 副C | 1.0 | S | **B** | ✅ | ✅ 审判值→审判之雷挂印记/C1·C3·C5 印记增伤/C4 全队 atk/C6 疾霆+skillHints 对账；forte 去双算（2026-07-13） | [吟霖.md](吟霖.md) |
| 今汐 | 衍射 | 长刃 | 主C | 1.1 | A → 工厂 | **S** | ✅ | ✅ 韶光→惊龙破空×1.8/C6×2.2/C3 谪仙变奏/C4 全队 allDmg 状态机占位不双算+skillHints（2026-07-13） | [今汐.md](今汐.md) |
| 长离 | 热熔 | 迅刀 | 副C | 1.1 | **S 级专属** | **S** | ✅ | ✅ 离火/心眼·征劫冲/焰羽+C1/C4/C6 状态机占位不双算（2026-07-13） | [长离.md](长离.md) |
| 折枝 | 冷凝 | 音感仪 | 副C | 1.2 | A → 工厂 | **A** | ✅ | ✅ 解放墨鹤领域/追击/点睛护盾/C2 cap12·C4 全队 atk·C6 白鹤；forte 去假墨韵（2026-07-13） | [折枝.md](折枝.md) |
| 相里要 | 导电 | 臂铠 | 副C | 1.2 | A → 工厂 | **A** | ✅ | ✅ 衍构满解放 burstWindow×1.5（forteEnhances 接线）+最小 DoD（2026-07-13） | [相里要.md](相里要.md) |
| 守岸人 | 衍射 | 音感仪 | 辅助 | 1.3 | S | **SS** | ✅ | ✅ 星域 HOT/暴击暴伤/C1–C6 参数对齐+技能×80%+skillHints 对账（2026-07-13） | [守岸人.md](守岸人.md) |
| 椿 | 湮灭 | 迅刀 | 主C | 1.4 | **S 级专属** | **S** | ✅ | ✅ 红椿·蕊/永生花/含苞+链占位不双算+skillHints 250/400（2026-07-13） | [椿.md](椿.md) |
| 珂莱塔 | 冷凝 | 佩枪 | 主C | 2.0 | A → 工厂 | **S** | ✅ | ✅ 晶体强化技能/解离变彩/C1 crate hook/C4 重击全队 skillDmgUp+最小 DoD（2026-07-13） | — (重击型) |
| 洛可可 | 湮灭 | 臂铠 | 副C | 2.0 | A → 工厂 | **B** | ✅ | ✅ 想象力满强化解放+最小 DoD（2026-07-13） | — (数值压低) |
| 菲比 | 衍射 | 音感仪 | 主C | 2.1 | A → 工厂 | **S** | ✅ | ✅ 技能 toggle 赦罪/告解+最小 DoD（2026-07-13） | — (重击型 + 双形态) |
| 布兰特 | 热熔 | 迅刀 | 辅助 | 2.1 | A → 工厂 | **S** | ✅ | ✅ 航路满解放治疗路径+最小 DoD（2026-07-13） | — |
| 坎特蕾拉 | 湮灭 | 音感仪 | 副C | 2.2 | A → 工厂 | **S** | ✅ | ✅ 迷离满强化解放+最小 DoD（2026-07-13） | — |
| 赞妮 | 衍射 | 臂铠 | 主C | 2.3 | **S** | **A** | ✅ | ✅ 灼焰/重斩/终绝+HP核 skill/heavy+链不双算（2026-07-13） | [赞妮.md](赞妮.md) |
| 夏空 | 气动 | 佩枪 | 辅助 | 2.3 | **S** | **S** | ✅ | ✅ 音律/四拍重奏/独奏气动光环/演绎+链占位不双算+skillHints 150/350/200（2026-07-13） | [夏空.md](夏空.md) |
| 卡提希娅 | 气动 | 迅刀 | 主C | 2.4 | **S** | **SS** | ✅ | ✅ 0AP 进芙露/决意/风蚀 wind_erosion/二次解放有数+skillHints HP 对账（2026-07-13） | [卡提希娅.md](卡提希娅.md) |
| 露帕 | 热熔 | 长刃 | 副C | 2.4 | **S** | **S** | ✅ | ✅ 狼焰/狼舞·决意·极/追猎荣光+链占位不双算+skillHints 320/400（2026-07-13） | [露帕.md](露帕.md) |
| 弗洛洛 | 湮灭 | 音感仪 | 主C | 2.5 | **S** | **SS** | ✅ | ✅ 乐声/谱曲终末/0AP 指挥·赫卡忒+C1 亡与死的乐章/永不消逝的梦呓专属倍率+技能名 tooltip+skillHints DoD（2026-07-14） | [弗洛洛.md](弗洛洛.md) |
| 奥古斯塔 | 导电 | 长刃 | 主C | 2.6 | **S** | **SS** | ✅ | ✅ 威慑/冕层/赫日威临+skillMult/禁切/skillHints（2026-07-13） | [奥古斯塔.md](奥古斯塔.md) |
| 尤诺 | 气动 | 臂铠 | 主C | 2.6 | **S** | **S** | ✅ | ✅ 灵性/月相/满月/至臻+链占位不双算+skillHints×400/2000（2026-07-13） | [尤诺.md](尤诺.md) |
| 嘉贝莉娜 | 热熔 | 佩枪 | 主C | 2.7 | B → 阈值 | **SS** | ✅ | ✅ 猎杀阈值满解放×1.6/C6×2.1+C4解放后全队allDmg+skillHints 炼净对账（2026-07-13） | [嘉贝莉娜.md](嘉贝莉娜.md) |
| 仇远 | 气动 | 迅刀 | 主C | 2.7 | **S** | **S** | ✅ | ✅ ATK 核挑灯/淋漓/答剑+竹照/且从容+链占位不双算（2026-07-13） | [仇远.md](仇远.md) |
| 千咲 | 湮灭 | 长刃 | 主C | 2.8 | **S** | **S** | ✅ | ✅ 残响/电锯/锯环/万缕+绞痕增伤+链占位不双算（2026-07-13） | [千咲.md](千咲.md) |

## 常驻 5★(4 个,卡卡罗在限定批已做)

| 角色 | 元素 | 武器 | 类型 | Tier | 核心机制(模拟器版) | 状态 |
|---|---|---|---|---|---|---|
| 卡卡罗 | 导电 | 长刃 | 主C | A | 重击型 | ✅ 已实装 |
| 维里奈 | 衍射 | 音感仪 | 治疗 | S | 光合标记持续治疗 + 全队衍射 buff | ✅ 已实装 |
| 安可 | 热熔 | 音感仪 | 主C | A | 羊咩双形态 + 重击爆发 | ✅ 已实装 |
| 凌阳 | 冷凝 | 臂铠 | 主C | A | 行狮形态强化普攻 | ✅ 已实装 |
| 鉴心 | 气动 | 臂铠 | 辅助 | B | 静气循行架势 + 行气反击 | ✅ 已实装 |

## 4★(12 个)

| 角色 | 元素 | 武器 | 类型 | Tier | 核心 | 状态 |
|---|---|---|---|---|---|---|
| 莫特斐 | 热熔 | 佩枪 | 副C | A | 浮翼狂想协同攻击 | ✅ 已实装 |
| 散华 | 冷凝 | 迅刀 | 副C | A | 重击爆裂 + 5 段普攻 | ✅ 已实装 |
| 卜灵 | 导电 | 音感仪 | 辅助 | A | 雷阵全队<b>共鸣技能 +30%</b>(6 链) | ✅ 已实装 |
| 丹瑾 | 湮灭 | 迅刀 | 副C | B | 朱蚀之刻 debuff + 彤华暴击 | ✅ 已实装 |
| 白芷 | 冷凝 | 音感仪 | 治疗 | B | 念意频隙回响 | ✅ 已实装 |
| 秋水 | 气动 | 佩枪 | 副C | B | 雾化分身嘲讽 + 雾化子弹 | ✅ 已实装 |
| 炽霞 | 热熔 | 佩枪 | 副C | B | 炽烈焰火 60 弹 + 重置 CD | ✅ 已实装 |
| 秧秧 | 气动 | 迅刀 | 副C | C | 流息 + 空中释羽 | ✅ 已实装 |
| 桃祈 | 湮灭 | 长刃 | 辅助 | C | 磐岩护壁 + 攻防转换反击 | ✅ 已实装 |
| 渊武 | 导电 | 臂铠 | 辅助 | C | 雷之楔协同 + 解放护盾 | ✅ 已实装 |
| 釉瑚 | 冷凝 | 臂铠 | 副C | C | 诗中物对偶/联珠 | ✅ 已实装 |
| 灯灯 | 衍射 | 臂铠 | 副C | C | 强化前扑/后撤无视防御 | ✅ 已实装 |

**4★ 都用工厂版 customLines + chainEffects.js 标准 effect**,不写专属 helper。

## 限定 5★(3.0 → 3.4, 10 个)

| 角色 | 元素 | 武器 | 类型 | 上线 | 移植级别 | 强度 Tier | 代码落地 | 战斗验收 | 计划文件 |
|---|---|---|---|---|---|---|---|---|---|
| 琳奈 | 衍射 | 佩枪 | 副C | 3.0 | A → 工厂(重击型) | **SS** | ✅ | ✅ 最小 DoD（开打/flat/skillHints，2026-07-13） | [琳奈.md](琳奈.md) |
| 莫宁 | 冷凝 | 迅刀 | 主C | 3.0 | A → 工厂 | **SS** | ✅ | ✅ 最小 DoD（2026-07-13） | [莫宁.md](莫宁.md) |
| 爱弥斯 | 导电 | 长刃 | 主C | 3.1 | A → 工厂(重击型) | **S** | ✅ | ✅ 最小 DoD（2026-07-13） | [爱弥斯.md](爱弥斯.md) |
| 陆·赫斯 | 冷凝 | 臂铠 | 辅助 | 3.1 | A → 工厂 | **S** | ✅ | ✅ 最小 DoD（2026-07-13） | [陆·赫斯.md](陆·赫斯.md) |
| 西格莉卡 | 衍射 | 音感仪 | 主C | 3.2 | A → 工厂(重击型) | **S** | ✅ | ✅ 最小 DoD（2026-07-13） | [西格莉卡.md](西格莉卡.md) |
| 绯雪 | 冷凝 | 迅刀 | 主C | 3.3 | A → 工厂(重击型) | **S** | ✅ | ✅ 最小 DoD（2026-07-13） | [绯雪.md](绯雪.md) |
| 达妮娅 | 热熔 | 佩枪 | 主C | 3.3 | A → 工厂 | **S** | ✅ | ✅ 最小 DoD（2026-07-13） | [达妮娅.md](达妮娅.md) |
| 露西 | 衍射 | 佩枪 | 主C | 3.4 | A → 工厂(重击型) | **S** | ✅ | ✅ 最小 DoD（2026-07-13） | [露西.md](露西.md) |
| 丽贝卡 | 导电 | 佩枪 | 副C | 3.4 | A → 工厂(重击型) | **S** | ✅ | ✅ 最小 DoD（2026-07-13） | [丽贝卡.md](丽贝卡.md) |
| 洛瑟菈 | 湮灭 | 音感仪 | 副C | 3.4 | A → 工厂 | **S** | ✅ | ✅ 最小 DoD（2026-07-13） | [洛瑟菈.md](洛瑟菈.md) |

## 剩余待移植(按版本顺序)

- 3.4 之后新角色(若有) — 待官方上线

## 进度日志

| 2026-07-13 | 优化计划尾债收口 | ① 卡提/弗洛洛「部分」→ 全 DoD：`cartethyia.test.js` + frolo DoD 门禁 ② §8：hook 约定文档、damage buff 审计、skill charge 立项、forte/enemy 旧 erosion→wind_erosion ③ 3.x 十人最小 DoD：`factory-3x-smoke.test.js` ④ `project-management-optimization.md` 收口；大 refactor 仍冻结 |
| 2026-07-13 | 工厂剩余最小 DoD | 相里要 burstWindow 接线；珂莱塔 C1/C4 状态机+crateBonus 进 damage；洛可/菲比/布兰/坎特 开打+满 gauge 解放有数；`tests/battle/factory-s-remaining.test.js` |
| 2026-07-13 | 折枝战斗验收 | DoD 过：解放领域初召 6、普攻墨鹤追击消耗、技能补货、点睛护盾、C2 cap12/C4 随类赋彩/C6 白鹤；forte 假墨韵→墨鹤且 gain0；`tests/battle/zhezhi.test.js` 4 项 |
| 2026-07-13 | 今汐战斗验收 | DoD 过：韶光攒 4→惊龙破空×1.8、C6 FORTE_BOOST×2.2、C3 谪仙变奏 atk+50%、C4 惊龙/解放全队 allDmgUp 改状态机占位、C1 skillDmg/C5 burstDmg；skillHints 手写对账；`tests/battle/jinhsi.test.js` 4 项 |
| 2026-07-13 | 吟霖战斗验收 | DoD 过：普攻+15/技能+30 审判值满触发审判之雷挂印记、解放挂印、C1/C3/C5 印记增伤、C4 前行的鼓舞、C6 疾霆；forte gain 置 0 防双算+verdict 同步 UI；`tests/battle/yinlin.test.js` 5 项 |
| 2026-07-13 | 忌炎战斗验收 | DoD 过：技能/重击+锐意 cap2、解放消耗×(1+层)、破阵满强化普攻、C6 cap3/1.2 与 skillHints 满锐意数对账、C2/C5 变奏 atk、C4 解放全队 heavyDmgUp；C0 无 flat typeBonus；`tests/battle/jiyan.test.js` 5 项 |
| 2026-07-13 | 守岸人战斗验收 | DoD 过：星域 3/5 回 HOT+暴击+暴伤、C2 全队攻击、C4 仅技能治疗、C6 变奏×6；修 skillMult 80% 与 HOT 误吃 C4；skillHints 对账；`tests/battle/shorekeeper.test.js` 4 项 |
| 2026-07-13 | 长离战斗验收 | DoD 过：离火满进心眼·征/劫/冲、离火抵 AP、焰羽 atk/pierce；C1 skill/heavy、C4 变奏全队 atk、C6 extraPierce 去 flat 双算；链/技能文案按官方口吻；`tests/battle/changli.test.js` 4 项 + 全 battle 348 绿 |
| 2026-07-13 | 椿战斗验收 | DoD 过：满蕊+协奏永生花进含苞×1.5、C2×5.5/C6 续窗×2.5、C1/C3/C4 改状态机占位、damage 接 normalDmgUp；skillHints 手写；`tests/battle/camellia.test.js` 3 项 |
| 2026-07-13 | 嘉贝莉娜战斗验收 | DoD 过（B 级阈值）：猎杀阈值满解放×1.6（C6 FORTE→×2.1）、C4 改解放后全队 allDmgUp 占位、skillHints/terms 对齐炼净+阈值；`tests/battle/gaberina.test.js` 3 项 + 全 battle 341 绿 |
| 2026-07-13 | 露帕战斗验收 | DoD 过（ATK 核热熔副C）：狼焰攒条→满技能狼舞×320% burst、解放回满+追猎 elemFusionUp/荣光 elemResistIgnore；C1–C6 改状态机占位防双算；damage 接 fusion/resistIgnore；skillHints 手写；`tests/battle/lupa.test.js` 4 项 |
| 2026-07-13 | 夏空战斗验收 | DoD 过（ATK 核风蚀辅）：普攻+音律叠风蚀进独奏 elemAeroUp、满音律四拍×200% heavy、技能×150%只叠蚀、解放演绎+盾 350%/175%；C1/C2/C4 占位不双算、C3+2 音律、C6 独奏 AOE；修 spawnEnemy.debuffs 与 addEffect 空 debuffs 早退；skillHints 手写对账；`tests/battle/xiakong.test.js` 5 项 + 全 battle 334 绿 |
| 2026-07-13 | 尤诺战斗验收 | DoD 过（ATK 核）：技能告终进月相、灵性满开满月、至臻完满×400%/C6×2000%后清空或重置；C1/C2/C3/C4/C6 改状态机占位防双算；damage.js 接 allDmgUp；skillHints 手写对账；terms 补灵性/月相/满月等；`tests/battle/younuo.test.js` 4 项 + 全 battle 329 绿 |
| 2026-07-13 | 仇远战斗验收 | DoD 过（ATK 核，非 HP 流水线）：挑灯+10/技能+25→满进淋漓+且从容×1.5+竹照 elemAllUp、答剑后清空退出、C3 荷蓑 finishSkill/解放 900%/答剑×7 无 flat burstDmg、C2 竹照 60%、C6 停滞+退出 AOE 无 flat cdmg；修 calmActive、onAttack/onSkill 接线、doSkill finishSkill、registry 链2/3/6 占位；`tests/battle/chouyuan.test.js` 4 项 + 全 battle 325 绿 |
| 2026-07-13 | 赞妮战斗验收 | DoD 过：解放进灼焰+50焰光、重斩耗20、形态结束终绝、skill/heavy HP%、C2技能×1.8/C5重燃×2.2/C3终绝焰光/C6重斩×1.4+致死；修 registry 链1/4/5/6 占位防双算、pendingFinal explicitHpMult、onSkill 链1 衍射 buff、skillHints 改 HP 核 customLines；`tests/battle/zanyan.test.js` 5 项绿 |
| 2026-07-13 | 千咲战斗验收 | DoD 过：残响+技能 HP×7.3%+绞痕、齿轨→电锯3回、锯环疾攻/终结、万缕+120%与链3加法、C5 解放×2、C6 终焉×1.4+致死不倒；修 getMarkDamageBonus 接线、registry 6 链改状态机占位防双算、skillHints 技能名对齐、forte 同步；`tests/battle/qianxiao.test.js` 7 项绿 |
| 2026-07-13 | 奥古斯塔战斗验收 | DoD 过：威慑开局1/延奏+1可叠2→赫日威临 keepEnergy、俯首之刻禁切+禁重击+烈阳、skill 走 HP×8.1%（skillMult+explicitHpMult）、C1 变奏叠冕 skillMult×1.5、窗口结束清冕/威慑；修 doSkill/doHeavy 不吃 hook 倍率、switchOut 叠威慑、canSwitch/canBurst、skillHints 倍率对账；`tests/battle/aogusita.test.js` 6 项 + 全 battle 309 绿 |
| 2026-07-13 | 项目管理 + HP 核变奏横切 | ① 新增 [project-management-optimization.md](../architecture/project-management-optimization.md)：角色 DoD、看板规则、P0 横切优先 ② 新增 [copy-ownership.md](../copy-ownership.md)：registry/skillHints/terms/plans 职责 ③ status 表拆「代码落地 / 战斗验收」；卡提/弗洛洛标部分验收，其余 S 级未验收 ④ CLAUDE.md 补交付铁律 5–8 ⑤ 修 HP 核变奏：`doSwitch` 改 `dmgType:'variation'`，damage.js 用设计 HP%×(multiplier/0.8) 保留协奏 0.8→1.6；卡提/弗洛洛/奥古/千咲/赞妮补 variation 倍率 |
| 2026-07-12 | 3.0-3.4 10 角色实装 | 10 个 3.x 限定 5★ 全部实装到工厂级（A级）：① docs/plans/characters/*.md 10 份设计文档从 stub 扩到完整 8 节范式(每份 220-280 行)，按守岸人范式整理 §1官方面板+6技能+6共鸣链 / §2官方分析 / §3模拟器取舍 / §4招式数值表 / §5共鸣链模拟器版 / §6文案UI / §7设计边界 / §8开放问题 ② 修 8 份文档 [[FFFD]] 占位符 + 1 个真实 U+FFFD，§1 从 clean-extract 模板恢复原文，§2-§8 散文清 8 处损坏(伤害伤害/度破坏/冷却间/谐·偏移 等关键术语) ③ forte.js 注册 10 条 FORTE 条目 ④ characters/index.js LIGHTWEIGHT 补 10 条 hasHeavy 标记 ⑤ terms.js 新增 3.0-3.4 专属段 ~30 条 TERM_DICT 条目 ⑥ skillHints.js 10 角色全 SKILL_HINTS 注册(琳奈/莫宁/爱弥斯 customLines 手写完整公式，其余 7 角色走 makeSkillLines 工厂) + 修 1 处违规 debuff→标记 |
| 2026-07-12 | registry.ts 60 链文案官方原文→模拟器版重写 | registry.ts 1413-1763 行 10 角色 × 6 链 = 60 条 chain text.desc 全部按 §5 模拟器版设计文档重写：① 秒数换算为回合（14秒→2回合/30秒→3回合等）② 套 term-class HTML 标签（term-skill/term-burst/term-heavy/term-normal/term-variation/term-resource/term-state/term-num）③ 删繁杂官方原文（如达妮娅链2 原文 200+字→55字，爱弥斯链6 原文 280+字→88字）④ 与 effect 实际效果对齐（如西格莉卡链1 effect skillDmg+0.7 → desc 写"技能 +70%"而非"普攻|闪反|技能 +70%"含 ACT 维度）⑤ 清【】方括号标签全部转 <b class="term-resource"> ⑥ 保留 2 处官方机制秒数（绯雪非战斗 4 秒回复锻雪/进入编队 2 秒后雪锈），因模拟器无对应回合映射，§5 设计文档同款保留。build 通过 663.20 kB |
| 2026-07-12 | registry.ts 全局文案债清理 | 用户警示"管理一定要管好"后做第二轮全局审计并按真实 effect 对齐收口：① 1.0-1.x 6 角色（嘉贝莉娜/卡卡罗/折枝/相里要/维里奈/安可）共 36 条 desc 秒数+【】+官方触发条件繁杂描述 → 改为运行时真实 effect 直陈（如卡卡罗链1 effect energyRefund → "技能额外回 10 点能量"，不再写"每20秒1次"未实装冷却）② 奥古斯塔 3 处 effect.label 内部【以众愿为冕】去【】（玩家不见 label 但保持纯净）③ 珂莱塔链2/链6/守岸人链2/链4 删除"倍率 ×2.26/×2.866/×2.5/常驻被动/forte 倍率加成"等工程口径 ④ 3.x 十人二轮重审：发现首轮仅清关键词、文案仍写设计稿的形态/触发/派生（如琳奈链1"光致变染持续+1回合"、绯雪链3"进入编队2秒后雪锈"、达妮娅链3"黯核倍率+1200%" 等 effect 未实现的内容）→ 60 条全改为"玩家可见=真实 effect"简版，避免假承诺 ⑤ 全文件扫描归零：秒/【】/buff/debuff/core/叠层/草稿/HP核/倍率 ×/常驻被动/forte 倍率 共 0 处。build 通过 162 模块 / 655.37 kB |
| 日期 | 角色 | 操作 |
|---|---|---|
| 2026-07-10 | 1.0-2.8 全版本 Bug 修复 | 玩家流程链梳理 + 13 项 Bug 修复：① 流程链断裂：silent_feixue_snow/silent_lumera_chord 版本标签错标 2.5（应为 3.3/3.4，提前暴露未上线角色）→ 已改 ② 4 个 2.5-2.8 世界 BOSS desc 暴露"XX 突破材料"角色名 → 已清理 ③ 仇远链3 burstDmg 0.5→5.0（+500%） ④ 赞妮链3 补 zanyanBurstFinaleBoost effect 占位 ⑤ 弗洛洛链5 补 furoloCommandDefense effect 占位 ⑥ 尤诺专武望月冷凝→气动（与角色元素对齐，官方6处技能描述都为气动） ⑦ 弗洛洛链2 标注三重效果（furoloDirgeBoost） ⑧ 赞妮链2 补集中压制/破袭反击+80%（zanyan.js zanYanHpMult 链2分支） ⑨ 夏空链6 还原 220% 伤害（xiakongSoloEntryDmg value 2.2，对齐状态机已实装） ⑩ 今汐 skillHints 补重击定义 + forteDesc gauge/stacks 矛盾修正 ⑪ 灯灯/凌阳/散华 intro 武器对齐 template.js（灯灯 衍射·臂铠→导电·长刃 / 凌阳 冷凝·迅刀→冷凝·臂铠 / 散华 冷凝·长刃→冷凝·迅刀）+ 灯灯 forteDesc 衍射→导电 ⑫ 洛可可/坎特蕾拉 skillHints 补重击定义（heavyMech+hasHeavy:true） ⑬ 尤诺链2/3 value 对齐官方（0.2→0.4 / 0.35→0.65） ⑭ 布兰特 skillName '空中攻击'→'起锚！'（空中攻击是普攻分支不是技能）+ 补重击狂想即兴 ⑮ 吟霖 terms 审判印 2链+30%→3链+10%/层+1链×1.7+5链×1.5（B-Tier 下调后值）。删 weapons.js 重复 '光与影' 条目。build 通过 150 模块 |
| 2026-07-10 | 1.0-2.8 全面体检补完 | 全版本内容核查：① 声骸套装31套齐全（弗洛洛有沉日劫明/幽夜隐匿之帷/失序彼岸之梦等湮灭适配套）② 武器23限定专武+5常驻齐全 ③ 补4个2.5-2.8世界BOSS：虚诞虫(2.5湮灭)/阿列夫一造物(2.6)/万囮牢·朽躯(2.7)/千傀重楼(2.8)，enemies.js+enemyMechanics.js+dungeon.js全套 ④ 周本BOSS补注册：鸣式·利维亚坦+共鸣回响·芬莱克加入WEEKLY_BOSS（3→5） ⑤ characters/index.js补3角色：相里要/维里奈/凌阳 ⑥ status.md武器列修正4处（安可/凌阳/散华/丹瑾对齐template.js）+4★状态更新3处（卜灵/釉瑚/灯灯改已实装） ⑦ skillHints.js intro格式修7处（折枝/吟霖/赞妮/卡提希娅/秧秧/桃祈/布兰特标准化「核心机制名」）。build通过 |
| 2026-07-10 | 2.3-2.8 全版本补完 | 6 个角色一次性实装，游戏内容推进到 2.8：夏空（S级音律/风蚀/四拍重奏状态机）、露帕（A级工厂狼焰/追猎/荣光）、奥古斯塔（S级HP核以众愿为冕/威慑/赫日威临状态机）、尤诺（S级灵性/月相流转/满月领域/至臻完满状态机）、仇远（S级挑灯问剑/淋漓醉墨/答剑三连状态机）、千咲（S级HP核锯环残响/电锯模式/锯环疾攻/终结状态机）。每角色 forte.js + terms.js + skillHints.js + registry.ts + characters/index.js 全套注册。奥古斯塔链5占位符替换为 defense:0.30 并在 chains.js 加 defense case。render.js CHAIN_TERM_PATTERNS 补全 5 角色术语。修文案 bug：夏空 followUp 缺分隔符、露帕 intro 缺"追"字、仇远 intro 缺"刀"字+格式错、千咲 intro 暴露"HP核"、forte.js 千咲 desc 含 `<x>` HTML 残留、terms.js 3 条键名缺字/缺间隔符。build 通过 150 模块。9 项集成检查全绿，零功能 bug |
| 2026-07-10 | 弗洛洛 | 余韵机制删除：frolo.js 移除 ECHO_DURATION/furoloInEcho/furoloEchoTurns；terms.js 移除余韵条目；skillHints.js 移除 forteDesc/burst desc 中余韵；弗洛洛.md §3/§4/§7 同步清理。修复 U+FFFD 损坏字符。dev server 验证通过 |
| 2026-06-30 | 2.x 文档清理 | 6 个 2.x 角色设计文档（露帕/弗洛洛/奥古斯塔/尤诺/仇远/千咲）清理代码思维残留：删除「字段命名」段（self.forte.current/xxxStacks 等代码字段名）；「切人 carrying」→「切人交互」、「buff 叠加规则」→「加成叠加规则」；FORTE/endTurn/tickStacks/stacks/gauge/unit 自身等代码术语按设计师口吻替换；buff→增益、debuff→减益、→→转为/接/变为。夏空.md 已干净无需改 |
| 2026-06-30 | 2.x 占位 chainEffects 校准 | 6 处清晰差异已修：弗洛洛链2 burstDmg→heavyDmg（谱曲终末是重击替换）+ 链3 0.40→0.80；仇远链2 0.15→0.30；千咲链2 0.30→0.50、链3 0.60→1.20、链6 0.30→0.40。**5 处需新增 effect 类型，留待实装时定**：① 弗洛洛链5 减伤 30%（无 dmgReduce 类型）② 奥古斯塔链5 护盾 +50%（无 shield 类型）③ 千咲链2 无视 10% 湮灭抗性 + 露帕链3 elemPierce（无 elemPierce 类型，当前死代码）④ 千咲链5 叠层加速（需专用 effect）⑤ 露帕链4 倍率 +125% 与 skillDmg:0.60 机制不等价（×2.25 vs ×1.6，需 skillMult 类型或设计决策）。另：奥古斯塔 FORTE_BOOST={atChain:6,bonus:0.5} 对 stacks 型 FORTE 生效方式存疑，实装时复核 |
| 2026-06-30 | 赞妮 | S 级状态机实装：zanyan.js（灼焰形态 3 回合 / 焰光 gauge / 重斩 HP×12% 消耗 20 焰光 / 终绝将至之刻 HP×20% 3 链按消耗 +2%/点）；combat.js 加 HP 核分支（HP/ATK=24.6×）+ doAttack 重斩路径 + doBurst 重燃倍率 + dealDamage 6 链致死不倒 + turnCleanup 终绝结算；forte.js 焰光 gauge；chainEffects 5 链 burstDmg 0.7→1.2、3 链移入状态机、6 链移出 FORTE_BOOST；template.js hpScaling；skillHints/terms 文案同步；45 项逻辑测试通过 |
| 2026-06-30 | 守岸人 | 守岸人.md 重写为 8 节设计师口吻（旧版 effect key 表清掉），对齐 shorekeeper.js 实装：星域 3 回合 / HOT (hp×0.08+atk×0.8) / 暴击 +20% / 暴伤 +30% / 1 链 +2 回合且切人不消失 / 2 链全队 atk +40% / 4 链技能治疗 ×1.7 / 6 链变奏 ×6 |
| 2026-06-30 | 椿 | S 级状态机重做：camellia.js 实装永生花触发(红椿·蕊满100+协奏≥50)+含苞酣梦(×1.5/6链×2.5)+6链续窗；forte.js effectType 改为 chunHanbao；combat.js doSkill/calcDamage/turnCleanup 接入；chainEffects 移除 2/3-atk/6链 flat 加成（移入状态机）；椿.md 重写为 8 节设计师口吻；skillHints 同步官方技能名+正确数值；11 项逻辑测试通过 |
| 2026-06-30 | 长离 | S 级状态机实装：changli.js 心眼+离火抵AP+焰羽；combat.js 抽 resolveActionCost 薄入口+calcDamage pierceUp buff；forte.js mindEye 类型；chainEffects FORTE_BOOST 清理；skillHints/terms/weaponDetail 文案同步 |
| 2026-06-27 | 全局 | 3.0+ 10 个角色(琳奈/莫宁/爱弥斯/陆·赫斯/西格莉卡/绯雪/达妮娅/露西/丽贝卡/洛瑟菈)chainEffects 标准加成批量注册 + 9 个 1.x-2.x 专属机制源文件入库（brant/camellia/cantarella/carlotta/changli/jinhsi/kakaro/phoebe/zhezhi 等） |
| 2026-06-27 | 项目 | CLAUDE.md 精简重整（工作纪律上移、文档分层四层、代码地图修正路径、删除过期"已完成"清单与重复工作纪律段） |
| 2026-06-24 | 全局 | 共鸣解放基础倍率 300% → 主 400% / 副 200%(修复"解放不如普攻"的设计 bug)|
| 2026-06-24 | tier 表 | 按 pockettactics 2026.6.18 tier list 大幅修正:椿/今汐/长离 T0→S;吟霖 T1.5→B;卡提希娅 T0→SS;3.x 新角色(奥古斯塔/嘉贝莉娜/莫宁/弗洛洛 等)补回 SS |
| 2026-06-24 | 吟霖 | 数值下调到 B-Tier:3 链 +10%/层,5 链 ×1.5,6 链疾霆 ×70%,4 链全队 atk +15%(chains.js / render.js / chains-extracted.json / terms.js 四处同步)|
| 2026-06-24 | 吟霖 | ✅ **已实装**(chains.js / combat.js / chains-extracted.json / render.js / terms.js 五处全改)|
| 2026-06-24 | 今汐 / 长离 / 折枝 / 相里要 / 椿 | 设计草稿,待用户确认 |
