# 角色设计指导

## 模拟器定位

本模拟器叫**鸣潮抽卡模拟器**。主题是抽卡，战斗是附带的——战斗模拟只是为了让抽出来的强力角色和武器有相应体验，不是要把鸣潮的战斗系统完整复刻。

因此每个角色的移植力度不同。

---

## 强制工作流（顺序不可跳过）

每做一个角色，必须按以下顺序执行，**前面步骤完成前禁止写代码或设计文档**。

### 步骤 1：读取官方原始数据

```
docs/sources/characters/individual/<角色名>.json
```

这个 JSON 文件包含：

| 字段 | 内容 |
|---|---|
| `lv90_stats` | 官方 Lv90 生命/攻击/防御/暴击/暴伤/谐度破坏增幅 |
| `skills[]` | 每条技能的 type（常态攻击/共鸣技能/共鸣解放/共鸣回路/变奏技能/延奏技能/固有技能）、name、desc |
| `chains[]` | 每条共鸣链的 index、name、desc |

**技能名称、共鸣链名称、面板数值、机制描述——全部以这个文件为准。禁止凭记忆编造。**

### 步骤 2：对照强度榜确定移植级别

读 `docs/sources/tier-list.md`，找到该角色的 Tier（SS/S/A/B/C）。

| Tier | 移植级别 | 实装深度 |
|---|---|---|
| **SS** | S（专属状态机） | 5 文件全改：mechanic 文件 + combat.js 钩子 + chainEffects.js 专属 effect + customLines 手写函数 + chains.js 解析 |
| **S** | A → 工厂 | customLines（makeSkillLines）+ chainEffects.js 标准 effect，不写专属 combat helper |
| **A** | A → 工厂 | 同上 |
| **B** | A → 工厂（数值压低） | 同上，chain effect 数值按 B-Tier 天花板约束（满链 ×4） |
| **C** | A → 工厂（数值最小化） | 同上，满链 ×3.5，部分效果用 FALLBACK_CHAIN |

### 步骤 3：写设计文档

在 `docs/plans/characters/<角色名>.md` 写移植计划。**必须包含以下全部章节**（以卡提希娅.md 为模板）：

1. **Header**：状态 / Tier / 移植级别 / 定位（格式：`元素 · 武器 · 定位 · 「核心机制名」`）
2. **模拟器核心**：1-2 段完整循环描述
3. **模拟器保留**：表格式，左列官方系统名，右列模拟器抽象
4. **模拟器舍弃/合并**：明确写清哪些官方机制被舍弃、为什么
5. **关键数值**：招式倍率表（含 AP 列）+ 资源系统参数
6. **共鸣链方案**：每条链标注 official name + effect key + 实装位置 + 状态
7. **实装文件清单**：哪些文件需要改、改什么
8. **实施步骤**：编号清单 + ✅ 标记

**设计文档写完后，必须对照 JSON 源文件逐项核对：技能名是否正确、链效果是否与官方一致、面板数值是否准确。**

### 步骤 4：实装代码

按设计文档的实施步骤逐项完成，每完成一项标记 ✅。

### 步骤 5：验证

```bash
npm run build      # 构建无报错
npx vitest run     # 全部测试通过
```

---

## 前端文案规范（重要 · 玩家空间 vs 开发者空间）

前端文案（intro、共鸣链、技能描述、forteDesc）是**玩家阅读的空间**，不是开发者工作笔记。

1. **intro 行只写身份**：`元素 · 武器 · 定位 · 「核心机制名」`。不写箭头（→）、加号（+）、英文缩写（buff/debuff/core）、攻略提示。
   - ❌ `「决意叠层 → 双形态 · 风蚀爆发」`
   - ✅ `「决意」与「芙露德莉斯」双形态`
2. **技能名必须用官方原文**：从 `docs/sources/characters/individual/<角色名>.json` 的 `skills[].name` 取。禁止自己编造。
3. **共鸣链名称和效果必须来自官方 JSON**：从 `chains[].name` 取名称，从 `chains[].desc` 理解效果。模拟器数值如果有意下调，要在设计文档的"模拟器舍弃/合并"中明确说明"官方原值 X → 模拟器下调至 Y，原因：B-Tier 数值约束"。
4. **术语归属要准确**：通用游戏机制（如风蚀效应是气动属性效应）不标注为某个角色专属（如"卡提希娅 DoT"）。
5. **时间统一用回合**：官方秒数转换为回合（6-12s ≈ 2 回，14-24s ≈ 3 回，25-30s ≈ 4 回），特殊长 CD 写"每场战斗 1 次"。
6. **不用分析性语句**：不写"全部价值集中于""不依赖专属资源""这是主输出窗口"等替玩家分析的语言。只陈述事实。
7. **新术语同时加入 `TERM_DICT` 和 `CHAIN_TERM_PATTERNS`**：确保在共鸣链和技能描述中都能悬停。

---

## 设计文档自检清单

写完设计文档后，逐项核对：

- [ ] 技能名是否全部来自官方 JSON？
- [ ] 共鸣链名称和效果是否与官方 JSON 一致？
- [ ] 面板数值（HP/ATK/DEF）是否来自官方 JSON 的 `lv90_stats`？
- [ ] 如果有意下调数值，是否在"模拟器舍弃/合并"中写明了官方原值和下调原因？
- [ ] intro 行是否符合 `元素 · 武器 · 定位 · 「核心机制名」` 格式？
- [ ] 是否包含全部 8 个章节（Header → 实施步骤）？
- [ ] 共鸣链表中每条是否标注了 effect key + 实装位置 + 状态？
- [ ] 时间单位是否已从秒转换为回合？

---

## 数据文件速查

| 用途 | 路径 |
|---|---|
| 官方角色数据（技能/面板/链） | `docs/sources/characters/individual/<角色名>.json` |
| 强度榜 | `docs/sources/tier-list.md` |
| 角色面板覆盖（Lv90） | `src/battle/template.js` → `OVERRIDE_STATS` |
| 角色元数据（元素/武器/类型） | `src/battle/template.js` → `ROLE_META` |
| 共鸣链战斗效果 | `src/battle/chainEffects.js` → `CHAIN_BATTLE_EFFECTS` |
| 共鸣链文案 | `src/data/seq.js` → `seqText` |
| FORTE 回路配置 | `src/battle/forte.js` → `FORTE` |
| 角色机制文件 | `src/battle/characters/<角色名>.js` |
| 技能 UI 文案 | `src/ui/render/skillHints.js` → `SKILL_HINTS` |
| 技能工厂函数 | `src/ui/render/skillLines.js` → `makeSkillLines()` |

---

## 状态总表与进度

角色实装状态、剩余待移植、进度日志见 [status.md](status.md)。
