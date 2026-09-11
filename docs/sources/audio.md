# 音频素材（角色语音 / 音效 / BGM）

> 入库日期：2026-09-11
> 用途：说清**哪些音频拿得到、怎么拿、哪些拿不到、拿不到怎么解**，避免以后重复调研或猜命名。
> 本页结论全部实测过（HTTP 200 + md5 交叉验证）。

## 1. 拿得到：角色语音（encore）

### URL 规律

```
https://api.encore.moe/resource/Data/Game/Aki/WwiseAudio/Events/{zh|ja|en|ko}/<事件名>.mp3
```

- 语言段：`zh` / `ja` / `en` / `ko`，同一事件名换语言段即可（已实测 ja 有独立文件，非回落）。
- 缓存策略：无防盗链、无鉴权，可直接 `<audio src>`。

### 事件名规律

前缀固定 `play_favor_word_`，中段是**角色罗马音**，后缀是事件类型。

中段有坑：新旧角色命名不统一。

| 角色 | 中段 | 备注 |
|---|---|---|
| 忌炎 | `jiyan` | 早期角色，后缀用 `_get_card` |
| 守岸人 | `shouanren_sys` | 较新角色，中段带 `_sys_`，后缀用 `_sys_gacha` |
| 弗洛洛 | `fuluoluo_sys` | |
| 清宵 | `qingxiao_sys` | |
| 景燃 | `jingran_sys` | |
| 秧秧·玄翎 | `yangyang2_sys` | 带数字尾，别写成 `xuanling` |

**不要按中文名或拼音猜**——一律以 `src/data/character-lore.json` 里已抓到的 `voiceZh` 为准。

### 已确认的事件类型

每个角色约 85 条，按标题分类（`title` → 后缀）：

| 中文标题 | 后缀 | 说明 |
|---|---|---|
| **初奏** | `_get_card` / `_sys_gacha` | **获得角色语音**——游戏里出货时播的那句 |
| 自我介绍 | `_introduction` / `_sys_introduction` | |
| 入队·一~三 | `_join_team_01~03` / `_sys_jointeam_01~03` | |
| 突破·一~五 | `_rankup01~05` | |
| 心声·一~五 | `_to_player01~05` | |
| 凝音·一/二 · 生日祝福 · 喜欢的食物 · 抱负和理想 · 闲趣 | | 好感语音 |

### 覆盖率

- **初奏（获得语音）：54 / 57**（4 语言齐全）。
- 缺的 3 个是**漂泊者·衍射 / 湮灭 / 气动**——它们不进卡池，拿不到也不影响。
- 也就是说：**所有能抽到的角色都有获得语音**。

### 数据落点

`src/data/character-lore.json` 的 `words[].voiceZh` 已经存了每条的 URL（只存 zh）。
要 ja/en/ko，把 URL 里的 `/Events/zh/` 换成对应语言段即可。

### 取数方法（补新角色时）

`build-character-lore.cjs` 抓 `Words` 时已把 `VoiceZh` 一并写进 lore，所以补角色后语音自动有，不需要额外脚本。

## 2. 拿不到（已验证，别再试）

| 目标 | 结论 | 验证方式 |
|---|---|---|
| **抽卡 UI 音效**（点击 / 翻牌 / 出货"叮"） | ❌ 该目录**只有 `play_favor_word_*`**，不含 UI 音效 | 试了 30+ 种命名（`play_ui_*` / `play_*_luckdraw_*` / `play_gacha_*` / `play_ui_click` …）全部 404 |
| **BGM** | ❌ 不在这个目录，encore 别处也没有 | 同上；且 `api/zh-Hans/{music,bgm,audio,sound}` 等路径都只是 SPA 兜底 HTML，不是真端点 |
| **技能演示视频** | ❌ 路径写了但文件没有 | `Skills[].SkillMedia` 给 `…/Data/Media/Role/<id>/<skillId>.mp4`，实测 **404** |
| 目录列举 | ❌ 不可列举 | `…/WwiseAudio/Events/zh/` 返回 404 |

### 验证时的两个坑

1. **别只看 HTTP 200 和文件大小**。曾出现「中日两份 `get_card` 字节数完全相同」，一度怀疑服务器对缺失文件返回兜底音频。**实际是巧合**——md5 发现三份各不相同，且伪造名返回的是 85 字节 `{"error":[{"code":404…` JSON。所以：**用 md5 交叉验证，并拿一个伪造名做对照**。
2. encore 对**未知 API 路径**一律返回 200 + SPA HTML，不能用状态码判断端点是否存在；只有 `/resource/` 下的静态资源才是真 404。

## 3. 想拿 UI 音效 / BGM 的唯一实路：解游戏音频包

encore 只镜像了角色语音。UI 音效和 BGM 只能从游戏本体的音频包里解。

```
.pak
  └─ FModel 解包（需鸣潮 AES key）
       ├─ WwiseAudio_Generated/Event/<语言>/*.bnk    ← 事件/行为定义
       └─ WwiseAudio_Generated/Media/<语言>/*.wem    ← 实际音频流
            └─ wwiser.pyz 解析 .bnk → Generate TXTP → 得到 .wem 文件名
                 └─ vgmstream 把 .wem 转 .wav / .ogg
```

要点：

- Wwise 不保留可读文件名，事件名会转成 32 位 Hash 才写进 `.bnk`，所以**必须靠 wwiser 反解事件表**，不能靠猜文件名（这正是第 2 节猜 30+ 次全 404 的原因）。
- 需要**游戏包文件**。Android 端可用 `adb pull` 或 MT管理器从安装目录取出；桌面端直接取 Steam/官服安装目录。
- 语言包分文件（如 `Lang_zh/…pakchunkNN-…pak`），找中文语音要取对应语言包。

## 4. 接入建议（未实施）

见根目录 [TODO.md](../../TODO.md)。分两步：

1. **先做「初奏」接进翻牌动画**：`src/ui/gacha/animation.js` 里 `sfx('reveal')` / `sfx('reveal_close')` 两个钩子已经埋好，`src/ui/assets/audio.ts` 的 `SOUNDS` 目前为空（静默 no-op）。接法是把「出货角色 → 该角色初奏 URL」查出来，用 `audio.ts` 已有的 `playUrl(url)` 播。
   - 需要新建一张 `名 → 初奏 URL` 的表（可从 `character-lore.json` 的 `words` 里按 `title === '初奏'` 生成），或直接查 lore。
   - 注意 `playUrl` 是**互斥单通道**（播新的会停旧的），十连出多金时只有最后一句会响——这是已定的行为，不是 bug。
2. **再考虑 UI 音效 / BGM**：走第 3 节的解包路线，需要先拿到游戏包。
