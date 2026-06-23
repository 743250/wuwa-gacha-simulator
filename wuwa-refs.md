# 鸣潮模拟器 · 参考链接索引

用于把当前鸣潮抽卡模拟器交接给不能联网的 AI。优先校准顺序：

1. 抽卡概率 / 保底 / 卡池共享规则
2. 海市兑换、余波珊瑚、残振珊瑚、波段兑换
3. 充值、月卡、先约电台、礼包
4. 卡池时间线、角色 / 武器 / 共鸣链文本

可信度从高到低：官方 > Wiki > 游民星空搬运 > 巴哈/4399/知乎/视频攻略。社区统计只能用于软保底曲线近似，不要当官方公示。

## 1. 抽卡概率 / 保底

| 链接 | 用途 |
|---|---|
| https://mc.kurogames.com/main/news/detail/984 | 官方今汐池公告。可确认浮金波纹、10 抽 4 星、角色活动唤取共享 5 星保底等活动池规则 |
| https://wutheringwaves.fandom.com/zh/wiki/%E8%A7%92%E8%89%B2%E6%B4%BB%E5%8A%A8%E5%94%A4%E5%8F%96 | Fandom 角色活动唤取。结构化列出 5 星基础概率 0.8%、综合概率 1.8%、80 抽保底、50/50、4 星 10 抽保底、4 星基础 6% / 综合 12% |
| https://news.17173.com/content/06032024/141530213.shtml | 17173 保底机制整理。适合作为不能联网 AI 的规则速读材料 |
| https://www.bilibili.com/opus/936615544201674759 | B 站专栏「鸣潮抽卡系统简析」。用于参考软保底统计：约 65 抽后概率递增，79 抽附近接近/达到出金。非官方，只能当模拟曲线参考 |
| https://wuwatracker.com/zh-CN/tracker | WuWa Tracker。可参考实际工具如何区分角色活动池、武器活动池、常驻池、联动池的 80 抽 / 10 抽统计 |

实现备注：

- 角色活动池：80 抽五星，五星基础概率 0.8%，含保底综合 1.8%；首次五星 50% 为 UP，歪后下个五星必为 UP。
- 武器活动池：80 抽五星，目标武器 100%。
- 四星：10 抽至少 1 个四星或以上。
- 软保底没有官方逐抽概率表，模拟器里的 `rate()` 只能用社区统计近似，后续要标注为“模拟曲线”。

## 2. 海市 / 珊瑚 / 兑换

| 链接 | 用途 |
|---|---|
| https://wutheringwaves.fandom.com/zh/wiki/%E4%BD%99%E6%B3%A2%E7%8F%8A%E7%91%9A | Fandom 余波珊瑚。用于校准抽卡获得珊瑚、重复角色/武器返还 |
| https://forum.gamer.com.tw/C.php?bsn=74934&snA=2168 | 巴哈海市/残振讨论。用于辅助确认版本/月度刷新存在，不应单独作为价格最终来源 |
| https://www.bilibili.com/video/BV1XX3ce1Er8/ | B 站残振珊瑚商店刷新视频。辅助资料 |
| https://www.bilibili.com/video/BV1En4y197F4/ | B 站余波/残振攻略视频。辅助资料 |

当前已采用/待复核规则：

- 5 星角色第 1-7 次：15 余波珊瑚。
- 5 星角色第 8 次及以后：40 余波珊瑚。
- 获得常驻 5 星角色额外：30 余波珊瑚。
- 4 星角色第 1-7 次：3 余波珊瑚。
- 4 星角色第 8 次及以后：8 余波珊瑚。
- 4 星武器：3 余波珊瑚。
- 残振珊瑚兑换抽数目前按 70:1、每版本每类波纹 7 个实现；需要继续用游戏内截图或 Wiki 复核。
- 余波珊瑚换抽目前按 8:1 实现；需要继续复核是否不限量、是否有版本刷新边界。
- 角色波段海市兑换目前按最多 2 个实现；价格和不同角色档位仍需继续核对。

## 3. 充值 / 月卡 / 商店

| 链接 | 用途 |
|---|---|
| https://wutheringwaves.fandom.com/zh/wiki/%E6%9C%88%E7%9B%B8 | Fandom 月相。用于确认月相是付费货币、可 1:1 兑换星声、可购买礼包 |
| https://store.playstation.com/zh-hant-hk/product/EB1238-PPSA24686_00-0039297268247085 | PlayStation 港服月相观测卡。明确购买得 300 月相，30 天每日 90 星声；月相可换星声，星声可换浮金/铸潮/唤声 |
| https://wutheringwaves.fandom.com/zh/wiki/%E5%85%88%E7%BA%A6%E7%94%B5%E5%8F%B0 | Fandom 先约电台。用于确认大月卡/电台结构：70 级、寰宇频道 / 寰宇特约、每版本重新购买 |
| https://mc.kurogames.com/main/news/detail/641 | 官方充值返还规则。可证明月相、月相观测卡、先约电台是官方付费项，并给出 1 元 = 10 月相的测试返还口径 |
| https://www.midasbuy.com/midasbuy/hk/buy/wuwa | Midasbuy 鸣潮充值页。用于辅助核对月相充值档位和首充双倍 |
| https://forum.gamer.com.tw/C.php?bsn=74934&snA=14470 | 巴哈课金礼包 CP 表。可用于补 3.4 礼包模拟，非官方 |

当前模拟器实现备注：

- 月相观测卡：购买后给 300 月相，30 天每日 90 星声。
- 月相可 1:1 转星声。
- 十连资源不足时：先提示是否用星声补抽；星声不足但月相足够时，提示是否用月相转星声补足。
- 充值档位、礼包、电台目前是模拟值，需要按 Midasbuy / 游戏内截图继续校准。

## 4. 官方 / 库洛

| 链接 | 用途 |
|---|---|
| https://mc.kurogames.com/main/news/detail/4772 | 3.4 版本更新维护预告 |
| https://wutheringwaves.kurogames.com/zh-tw/main/news/detail/4768 | 3.4 维护预告 · 繁中 |
| https://wutheringwaves.kurogames.com/zh-tw/main/news/detail/4783 | 3.4「未选择的梦」6/8 更新 |
| https://wutheringwaves.kurogames.com/zh-tw/main/news/detail/4788 | 3.4 内容说明 |
| https://wutheringwaves.kurogames.com/zh-tw/main/news/detail/4758 | × 赛博朋克：边缘行者 联动公告 |
| https://www.kurobbs.com/mc/post/1513576210570625024 | 库街区 · 3.4 联动开启 |
| https://media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/zh/ArticleMenu.json | 官网文章菜单 JSON，可按 article id 拉正文 |

注：库洛官网有 SPA/接口混用情况。浏览器能看正文时，命令行 fetch 可能只能拿到壳页面；可优先使用官方 JSON 接口或库街区。

## 5. Wiki / 资料站

| 链接 | 用途 |
|---|---|
| https://wiki.biligame.com/wutheringwaves/api.php?action=query&list=categorymembers&cmtitle=分类:共鸣者&cmlimit=200&format=json | BWIKI 共鸣者分类 API |
| https://wiki.biligame.com/wutheringwaves/共鸣者/忌炎 | BWIKI 角色页（其他角色同 pattern） |
| https://wiki.biligame.com/wutheringwaves/共鸣者/_露西 | BWIKI 露西 |
| https://wutheringwaves.fandom.com/zh/wiki/露西 | Fandom 露西 |
| https://wutheringwaves.fandom.com/zh/wiki/丽贝卡 | Fandom 丽贝卡 |
| https://wutheringwaves.fandom.com/zh/wiki/洛瑟菈 | Fandom 洛瑟菈 |

备注：BWIKI 的部分新角色页可能已建角色页但共鸣链表为空，例如当前抓到的露西页就是这种状态；不要为了“补全”硬编共鸣链。

## 6. 版本 / 卡池时间表（搬运 / 攻略）

| 链接 | 用途 |
|---|---|
| https://www.gamersky.com/handbook/202510/2024008.shtml | 2.7 卡池：嘉贝莉娜/露帕、仇远/赞妮 |
| https://www.taptap.cn/moment/724319616276367937 | 2.7 抽卡建议（含上下半） |
| https://www.lootbar.com/blog/zh-Hant/wuwa-2-7-banners.html | 2.7 嘉贝莉娜、仇远 |
| https://www.lootbar.com/blog/zh-Hant/wuwa-2-8-banners.html | 2.8 千咲、菲比 |
| https://www.gamersky.com/handbook/202512/2065601.shtml | 3.0 上下半角色 |
| https://www.gamersky.com/handbook/202512/2066094.shtml | 3.0 更新时间 |
| https://www.gamersky.com/handbook/202601/2072714.shtml | 3.0 下半：莫宁/奥古斯塔/尤诺 |
| https://www.gamersky.com/handbook/202602/2089566.shtml | 3.1：爱弥斯/露帕/千咲、陆·赫斯/嘉贝莉娜 |
| https://www.4399.com/pcgame/topic/52460854.html | 3.2：西格莉卡、仇远复刻 |
| https://www.gamersky.com/handbook/202604/2133558.shtml | 3.3 周年活动时间 |
| https://www.gamersky.com/handbook/202605/2134514.shtml | 3.3：绯雪、达妮娅、莫宁、千咲 |
| https://www.gamersky.com/handbook/202605/2148584.shtml | 3.4 前瞻：联动池 / 露西 / 丽贝卡 / 洛瑟菈 / 卡提希娅 |
| https://www.4399.com/pcgame/topic/53145886.html | 3.4 露西 / 丽贝卡 / 洛瑟菈 |
| https://a.4399.cn/gl/53118258_359305.html | 3.4 联动卡池规则 |

## 7. 社区 / 交叉校验

| 链接 | 用途 |
|---|---|
| https://forum.gamer.com.tw/C.php?bsn=74934&snA=17219 | 巴哈 · 3.4 联动卡池整理 |
| https://forum.gamer.com.tw/C.php?bsn=74934&snA=5258 | 巴哈 · 3.4 活动日程 |
| https://forum.gamer.com.tw/C.php?bsn=74934&snA=13797 | 巴哈 · 2.8 上半千咲 |
| https://forum.gamer.com.tw/C.php?bsn=74934&snA=15266 | 巴哈 · 3.1 上半爱弥斯 |
| https://forum.gamer.com.tw/C.php?bsn=74934&snA=17002 | 巴哈 · 3.3 下半达妮娅 |
| https://zhuanlan.zhihu.com/p/2001981590138553134 | 知乎 · 3.1 卡池解析 |
| https://zhuanlan.zhihu.com/p/2047284382415827069 | 知乎 · 3.4 露西/丽贝卡/洛瑟菈 |
| https://zhuanlan.zhihu.com/p/2047842015564632968 | 知乎 · 丽贝卡攻略（含共鸣链片段） |

## 8. 工具调用经验

- 库洛官网（mc.kurogames.com / wutheringwaves.kurogames.com）→ 可能需要官方 JSON 接口或浏览器渲染
- 库街区（kurobbs.com）→ 可作为官方社区来源
- BWIKI / Fandom → 可读，但新角色页面可能缺字段
- 游民星空（gamersky.com）→ 可读，能拿到搬运原文，是卡池时间线辅助源
- 4399（4399.com）→ 可读
- 巴哈（forum.gamer.com.tw）→ 可读
- 知乎专栏（zhuanlan.zhihu.com）→ 适合攻略和软保底讨论，但不要单独作为最终事实源

## 9. 当前模拟器待校准项

- `rate()` 软保底曲线：当前为社区统计近似，不是官方逐抽概率。
- `shopItems`：当前为模拟值，需对照游戏内真实商店、Midasbuy、月卡/电台页面复刻。
- 海市价格：余波 8:1、残振 70:1、角色波段价格和版本限购仍需用游戏内截图或更完整 Wiki 继续复核。
- `phases[]`：已补到 2026-06-23 的 3.4 联动版本，但 1.0-3.3 的部分四星陪跑和具体结束日期仍建议二次校验。
- 3.4 新角色共鸣链：露西、丽贝卡、洛瑟菈当前没有写入，原因是可抓到的 Wiki 页暂缺完整共鸣链文本。
