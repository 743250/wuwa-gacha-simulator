// 副本配置（鸣潮 3.5 校准 · 2026-06-25 重命名对齐官方）
//
// 命名对齐官方：
//   - 模拟战训   (40 波片) — 共鸣经验（角色升级）
//   - 锻造挑战   (40 波片) — 武器/技能材料（官方名：Forgery Challenge）
//   - 无音区     (60 波片) — 声骸养成（官方名：Tacet Field · 模拟器折算为共鸣促剂/武器石）
//   - 世界BOSS   (不耗波片 · 每日限 3 次) — 角色突破材料
//   - 战歌重奏   (60 波片) — 高阶技能材料（官方名：Weekly Challenge · 模拟器折算为经验/武器石），周限 3 次（共享）
//
// 模拟器抽象（不照搬，保留创作者意图骨架）：
//   - 被模拟器去除的子系统（声骸/调谐器/密音筒/技能书/突破素材）统一折算为 exp 系列 + 武器石
//   - 单次副本回报 ≥ 玩家在战斗界面 5 分钟的成本，~升 1 级
//   - 80 波片档 = 双倍消耗 / 双倍产出（凝缩波片）
//
// import S 以便后续 helpers 使用
import { S } from '../state.js';
import { phases } from '../data/phases.js';
// 注：副本敌人强度不随版本变化（官方设计如此）

export const DUNGEONS = [
  // ===== 模拟战训（角色经验）=====
  // 40 波片 Lv30：杂兵组合,敌人等级随玩家等级微调
  {
    id: 'sim_exp_1', type: 'exp', name: '模拟战训·共鸣经验', cost: 40,
    enemies: ['幼狼×3', '飞兽×1'],
    enemyLevel: 30,
    encounterPool: [
      { enemies: ['幼狼×3', '飞兽×1'], enemyScale: 1.0, weight: 4, tag: '残象群' },
      { enemies: ['古老幽灵×2'], enemyScale: 1.1, weight: 3, tag: '幽影残响' },
      { enemies: ['剑齿野猪×2', '咔嚓×1'], enemyScale: 1.0, weight: 3, tag: '热熔冲锋' },
      { enemies: ['导电掠食者×2', '拂拂×1'], enemyScale: 1.05, weight: 3, tag: '雷风小队' },
      { enemies: ['吞吞×2', '折折×1'], enemyScale: 1.0, weight: 3, tag: '冰光幻象' },
      { enemies: ['滴答×2'], enemyScale: 1.1, weight: 2, tag: '湮灭发条' },
      { enemies: ['聚械机偶'], enemyScale: 0.45, weight: 1, tag: '机械训练靶' }
    ],
    drops: { exp_high: 5, exp_mid: 5 },                  // 55k exp，~31 次满级（~5.2 天）
    minLevel: 1, desc: '高级×5 中级×5 · 40 波片'
  },
  // 80 波片 Lv70：精英 + BOSS 混合,凝缩双倍档
  {
    id: 'sim_exp_2', type: 'exp', name: '模拟战训·共鸣经验（凝缩）', cost: 80,
    enemies: ['燎照之骑'],
    enemyLevel: 70,
    encounterPool: [
      { enemies: ['紫羽鹭', '青羽鹭'], enemyScale: 0.9, weight: 3, tag: '双鹭疾袭' },
      { enemies: ['碧焰蜥×2'], enemyScale: 0.95, weight: 3, tag: '焰蜥群' },
      { enemies: ['石壁护腕'], enemyScale: 0.85, weight: 2, tag: '巨岩护腕' },
      { enemies: ['鼓手', '自走傀儡斥候'], enemyScale: 0.9, weight: 2, tag: '湮冷双形' },
      { enemies: ['坚岩守护者'], enemyScale: 0.85, weight: 2, tag: '光岩守护' },
      { enemies: ['燎照之骑'], enemyScale: 1.05, weight: 1, tag: '热熔骑士' },
      { enemies: ['飞廉之猩'], enemyScale: 1.05, weight: 1, tag: '气动强敌' },
      { enemies: ['朔雷之鳞'], enemyScale: 1.0, weight: 1, tag: '导电强敌' },
      { enemies: ['无常凶鹭'], enemyScale: 1.15, weight: 1, tag: '湮灭飞行' },
      { enemies: ['无妄者'], enemyScale: 1.05, weight: 1, tag: '护盾强敌' }
    ],
    drops: { exp_super: 4, exp_high: 4 },                // 112k exp，凝缩双倍档
    minLevel: 40, enemyScale: 1.5, desc: '特级×4 高级×4 · 80 波片（凝缩）'
  },

  // ===== 锻造挑战（武器/技能材料 · 官方名 Forgery Challenge）=====
  // 40 波片 Lv40：构造体 + 杂兵混编
  {
    id: 'tacet_1', type: 'weapon', name: '锻造挑战·武器养成', cost: 40,
    enemies: ['聚械机偶'],
    enemyLevel: 40,
    encounterPool: [
      { enemies: ['聚械机偶'], enemyScale: 0.75, weight: 4, tag: '机械核心' },
      { enemies: ['异构武装'], enemyScale: 0.9, weight: 3, tag: '构造体护盾' },
      { enemies: ['云闪之鳞'], enemyScale: 1.05, weight: 2, tag: '导电突进' },
      { enemies: ['自走傀儡斥候×2'], enemyScale: 0.9, weight: 3, tag: '冰属玩偶' },
      { enemies: ['石壁护腕', '剑齿野猪×2'], enemyScale: 0.85, weight: 2, tag: '巨岩护腕' },
      { enemies: ['紫羽鹭', '导电掠食者×2'], enemyScale: 0.95, weight: 2, tag: '雷羽群' },
      { enemies: ['古老幽灵×2', '飞兽×1'], enemyScale: 1.25, weight: 2, tag: '混编残响' }
    ],
    drops: { weapon_book: 16 },
    minLevel: 20, enemyScale: 1.3, desc: '武器石×16 · 40 波片'
  },
  // 80 波片 Lv80：周本影 + 高阶精英
  {
    id: 'tacet_2', type: 'weapon', name: '锻造挑战·武器养成（凝缩·双倍）', cost: 80,
    enemies: ['赫卡忒'],
    enemyLevel: 80,
    encounterPool: [
      { enemies: ['赫卡忒'], enemyScale: 1.8, weight: 3, tag: '湮灭周本影' },
      { enemies: ['无归的谬误'], enemyScale: 1.65, weight: 3, tag: '数据封锁' },
      { enemies: ['异构武装'], enemyScale: 1.45, weight: 2, tag: '冷凝护盾' },
      { enemies: ['鸣式·利维亚坦'], enemyScale: 1.55, weight: 1, tag: '鸣式残响' },
      { enemies: ['坚岩守护者', '碧焰蜥×2'], enemyScale: 1.3, weight: 2, tag: '光焰混编' },
      { enemies: ['鼓手', '紫羽鹭×2'], enemyScale: 1.35, weight: 2, tag: '湮雷混编' }
    ],
    drops: { weapon_book: 32 },
    minLevel: 40, enemyScale: 1.8, desc: '武器石×32 · 80 波片（凝缩）'
  },

  // ===== 无音区（声骸 · 官方名 Tacet Field · 60 波片）=====
  // 模拟器抽象：声骸 → 星声 + 武器石 + 高级促剂
  // 注：星声产出折半（v0.2 校准），避免主线副本越打越富
  // 60 波片 Lv50：杂兵 + 精英 + 偶现 BOSS
  {
    id: 'silent_1', type: 'echo', name: '无音区·常规', cost: 60,
    enemies: ['古老幽灵×2', '幻象×1'],
    enemyLevel: 50,
    encounterPool: [
      { enemies: ['古老幽灵×2', '幻象×1'], enemyScale: 1.0, weight: 4, tag: '声骸残响' },
      { enemies: ['飞兽×2', '幼狼×2'], enemyScale: 1.1, weight: 3, tag: '野外残象群' },
      { enemies: ['哀声鸷'], enemyScale: 0.85, weight: 2, tag: '衍射飞行' },
      { enemies: ['辉萤军势'], enemyScale: 0.8, weight: 2, tag: '冷凝群体' },
      { enemies: ['青羽鹭×2', '拂拂×1'], enemyScale: 0.95, weight: 3, tag: '风翼群' },
      { enemies: ['吞吞×2', '自走傀儡斥候'], enemyScale: 0.9, weight: 2, tag: '冰属玩偶群' },
      { enemies: ['碧焰蜥×2', '咔嚓×2'], enemyScale: 0.95, weight: 2, tag: '焰蜥混编' },
      { enemies: ['鼓手', '滴答×2'], enemyScale: 0.9, weight: 2, tag: '湮灭乐师' }
    ],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: ['frost','fire','thunder','wind','spectro','havoc','heal','energy','atk'], echo_count: 1, echo_tuner: 1 },
    minLevel: 1, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · 声骸×1 · 60 波片'
  },
  // 60 波片 Lv70：BOSS + 精英组合
  {
    id: 'silent_2', type: 'echo', name: '无音区·高阶', cost: 60,
    enemies: ['无妄者', '飞廉之猩'],
    enemyLevel: 70,
    encounterPool: [
      { enemies: ['无妄者', '飞廉之猩'], enemyScale: 1.1, weight: 3, tag: '双强敌' },
      { enemies: ['无常凶鹭'], enemyScale: 1.4, weight: 3, tag: '湮灭压制' },
      { enemies: ['海之女'], enemyScale: 1.25, weight: 2, tag: '反弹潮汐' },
      { enemies: ['叹息古龙'], enemyScale: 1.35, weight: 2, tag: '热熔龙息' },
      { enemies: ['角'], enemyScale: 1.15, weight: 1, tag: '岁主残响' },
      { enemies: ['伤痕·梦魇形态'], enemyScale: 1.05, weight: 1, tag: '湮灭梦魇' },
      { enemies: ['梦魇亚当·重锤'], enemyScale: 1.25, weight: 1, tag: '联动重锤' },
      { enemies: ['石壁护腕', '坚岩守护者'], enemyScale: 1.2, weight: 2, tag: '巨岩双守' },
      { enemies: ['紫羽鹭', '青羽鹭', '碧焰蜥'], enemyScale: 1.15, weight: 2, tag: '三色精英' }
    ],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: ['havoc_new','coord','energy_new','lost_dream','glory_forge','sync_law'], echo_count: 1, echo_tuner: 2 },
    minLevel: 40, enemyScale: 1.6, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · 声骸×1 · 60 波片'
  },

  // ===== 2.0+ 角色专属套 · 对应无音区副本（60 波片）=====
  // 每副本对应一套角色专属声骸，掉落按套装筛选并生成 1 个 COST 声骸入库。
  // 注：因模拟器未把部分新声骸补入 ECHO_CATALOG（如辛吉勒姆/达妮娅/无铭探索者/莳植熊蜂等），
  //     套内 catalog 为空时这几个副本仅产出经验/武器石，留作占位直到 catalog 完整。
  // 卡提希娅 ID 16「流云逝尽之空」
  {
    id: 'silent_cartethyia_wind', type: 'echo', name: '无音区·卡提希娅·流云', cost: 60,
    enemies: ['飞廉之猩'],
    enemyLevel: 80,
    encounterPool: [
      { enemies: ['飞廉之猩'], enemyScale: 1.0, weight: 3, tag: '气动残响' },
      { enemies: ['云闪之鳞'], enemyScale: 1.05, weight: 2, tag: '雷鳞护盾' }
    ],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: 'cartethyia_wind', echo_count: 1, echo_tuner: 1 },
    minLevel: 50, enemyScale: 1.5, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · +流云之举声骸 · 60 波片'
  },
  // 卡提希娅 ID 17「愿戴荣光之旅」
  {
    id: 'silent_cartethyia_glory', type: 'echo', name: '无音区·卡提希娅·荣光', cost: 60,
    enemies: ['飞廉之猩'],
    enemyLevel: 80,
    encounterPool: [
      { enemies: ['飞廉之猩'], enemyScale: 1.0, weight: 3, tag: '气动残响' }
    ],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: 'cartethyia_glory', echo_count: 1, echo_tuner: 1 },
    minLevel: 50, enemyScale: 1.5, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · +荣光之旅声骸 · 60 波片'
  },
  // 珂莱塔 ID 10「凌冽决断之心」
  {
    id: 'silent_carlotta_skill', type: 'echo', name: '无音区·珂莱塔·凌冽决断', cost: 60,
    enemies: ['聚械机偶'],
    enemyLevel: 80,
    encounterPool: [
      { enemies: ['聚械机偶'], enemyScale: 0.9, weight: 3, tag: '机械核心' },
      { enemies: ['辉萤军势'], enemyScale: 1.0, weight: 2, tag: '冷凝群体' }
    ],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: 'carlotta_skill', echo_count: 1, echo_tuner: 1 },
    minLevel: 40, enemyScale: 1.45, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · +凌冽决断声骸 · 60 波片'
  },
  // 菲比 ID 11「此间永驻之光」
  {
    id: 'silent_phoebe_lightnoise', type: 'echo', name: '无音区·菲比·光噪长眠', cost: 60,
    enemies: ['哀声鸷'],
    enemyLevel: 80,
    encounterPool: [
      { enemies: ['哀声鸷'], enemyScale: 1.0, weight: 3, tag: '衍射飞行' },
      { enemies: ['无冠者'], enemyScale: 1.1, weight: 2, tag: '湮灭护盾' }
    ],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: 'phoebe_lightnoise', echo_count: 1, echo_tuner: 1 },
    minLevel: 40, enemyScale: 1.45, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · +此间永驻声骸 · 60 波片'
  },
  // 布兰特 ID 18「奔狼燎原之焰」
  {
    id: 'silent_brant_burst', type: 'echo', name: '无音区·布兰特·奔狼', cost: 60,
    enemies: ['燎照之骑'],
    enemyLevel: 80,
    encounterPool: [
      { enemies: ['燎照之骑'], enemyScale: 1.0, weight: 3, tag: '焰骑残响' },
      { enemies: ['巨龙·热熔'], enemyScale: 1.10, weight: 2, tag: '熔龙吐息' }
    ],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: 'brant_burst', echo_count: 1, echo_tuner: 1 },
    minLevel: 40, enemyScale: 1.5, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · +奔狼燎原声骸 · 60 波片'
  },
  // 坎特蕾拉 ID 23「命理崩毁之弦」（3件套结构）
  {
    id: 'silent_cantarella_void', type: 'echo', name: '无音区·坎特蕾拉·虚湮', cost: 60,
    enemies: ['无常凶鹭'],
    enemyLevel: 80,
    encounterPool: [
      { enemies: ['无常凶鹭'], enemyScale: 1.0, weight: 3, tag: '湮灭飞行' }
    ],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: 'cantarella_void', echo_count: 1, echo_tuner: 1 },
    minLevel: 40, enemyScale: 1.45, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · +命理崩毁声骸 · 60 波片'
  },
  // 布兰特 ID 27「长路启航之星」 + ID 28「斑驳粉饰之沫」合用同区
  {
    id: 'silent_brant_path', type: 'echo', name: '无音区·布兰特·长路启航', cost: 60,
    enemies: ['燎照之骑'],
    enemyLevel: 80,
    encounterPool: [
      { enemies: ['燎照之骑'], enemyScale: 1.0, weight: 3, tag: '焰骑残响' }
    ],
    // 掉落长路启航 + 斑驳粉饰（两套同源布兰特，50/50 概率）
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: ['brant_path', 'brant_mottle'], echo_count: 1, echo_tuner: 1 },
    minLevel: 40, enemyScale: 1.5, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · +长路启航/斑驳粉饰声骸 · 60 波片'
  },
  // 绯雪 ID 30「雪落无声之愿」
  {
    id: 'silent_feixue_snow', type: 'echo', name: '无音区·绯雪·落日堤屿', cost: 60,
    enemies: ['辉萤军势'],
    enemyLevel: 80,
    encounterPool: [
      { enemies: ['辉萤军势'], enemyScale: 1.0, weight: 3, tag: '冷凝群体' },
      { enemies: ['朔雷之鳞'], enemyScale: 0.95, weight: 2, tag: '导电突进' }
    ],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: 'feixue_snow', echo_count: 1, echo_tuner: 1 },
    minLevel: 50, enemyScale: 1.5, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · +雪落无声声骸 · 60 波片'
  },
  // 洛瑟菈 ID 31「剪心辑梦之影」
  {
    id: 'silent_lumera_chord', type: 'echo', name: '无音区·洛瑟菈·剪心辑梦', cost: 60,
    enemies: ['无冠者'],
    enemyLevel: 80,
    encounterPool: [
      { enemies: ['无冠者'], enemyScale: 1.0, weight: 3, tag: '湮灭护盾' }
    ],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 12, astrite: 10, echo_set: 'lumera_chord', echo_count: 1, echo_tuner: 1 },
    minLevel: 50, enemyScale: 1.5, desc: '特级×1 高级×2 · 武器石×12 · 星声+10 · +剪心辑梦声骸 · 60 波片'
  },

  // ===== 世界BOSS（60 波片 · 无次数限制 · 大世界探索）=====
  // 每个 Overlord 敌人一个固定入口，名字和敌人一致（不再用轮换池）
  // Tier 1 — 推荐 30+，初级世界BOSS（base HP ≤ 33000）
  {
    id: 'world_ju_xie_ji_ou', type: 'worldBoss', name: '聚械机偶', cost: 60,
    enemies: ['聚械机偶'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 10, astrite: 20 },
    minLevel: 30, enemyScale: 1.6, desc: '高级×3 中级×2 · 武器石×10 · 星声+20'
  },
  {
    id: 'world_fei_lian_zhi_xing', type: 'worldBoss', name: '飞廉之猩', cost: 60,
    enemies: ['飞廉之猩'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 10, astrite: 20 },
    minLevel: 30, enemyScale: 1.6, desc: '高级×3 中级×2 · 武器石×10 · 星声+20'
  },
  {
    id: 'world_shuo_lei_zhi_lin', type: 'worldBoss', name: '朔雷之鳞', cost: 60,
    enemies: ['朔雷之鳞'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 10, astrite: 20 },
    minLevel: 30, enemyScale: 1.6, desc: '高级×3 中级×2 · 武器石×10 · 星声+20'
  },
  {
    id: 'world_yun_shan_zhi_lin', type: 'worldBoss', name: '云闪之鳞', cost: 60,
    enemies: ['云闪之鳞'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 10, astrite: 20 },
    minLevel: 30, enemyScale: 1.6, desc: '高级×3 中级×2 · 武器石×10 · 星声+20'
  },
  {
    id: 'world_liao_zhao_zhi_qi', type: 'worldBoss', name: '燎照之骑', cost: 60,
    enemies: ['燎照之骑'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 10, astrite: 20 },
    minLevel: 30, enemyScale: 1.55, desc: '高级×3 中级×2 · 武器石×10 · 星声+20'
  },

  // Tier 2 — 推荐 40+，中级世界BOSS（base HP 34000-40000）
  {
    id: 'world_ai_sheng_shi', type: 'worldBoss', name: '哀声鸷', cost: 60,
    enemies: ['哀声鸷'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 12, astrite: 20 },
    minLevel: 40, enemyScale: 1.45, desc: '高级×3 中级×2 · 武器石×12 · 星声+20'
  },
  {
    id: 'world_wu_chang_xiong_lu', type: 'worldBoss', name: '无常凶鹭', cost: 60,
    enemies: ['无常凶鹭'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 12, astrite: 20 },
    minLevel: 40, enemyScale: 1.5, desc: '高级×3 中级×2 · 武器石×12 · 星声+20'
  },
  {
    id: 'world_hui_ying_jun_shi', type: 'worldBoss', name: '辉萤军势', cost: 60,
    enemies: ['辉萤军势'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 12, astrite: 20 },
    minLevel: 40, enemyScale: 1.5, desc: '高级×3 中级×2 · 武器石×12 · 星声+20'
  },
  {
    id: 'world_luo_lei_lai', type: 'worldBoss', name: '罗蕾莱', cost: 60,
    enemies: ['罗蕾莱'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 12, astrite: 20 },
    minLevel: 40, enemyScale: 1.55, desc: '高级×3 中级×2 · 武器石×12 · 星声+20'
  },
  {
    id: 'world_rong_yao_shi_xiang', type: 'worldBoss', name: '荣耀狮像', cost: 60,
    enemies: ['荣耀狮像'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 12, astrite: 20 },
    minLevel: 40, enemyScale: 1.45, desc: '高级×3 中级×2 · 武器石×12 · 星声+20'
  },
  {
    id: 'world_wu_wang_zhe', type: 'worldBoss', name: '无妄者', cost: 60,
    enemies: ['无妄者'],
    drops: { exp_high: 3, exp_mid: 2, weapon_book: 12, astrite: 20 },
    minLevel: 40, enemyScale: 1.45, desc: '高级×3 中级×2 · 武器石×12 · 星声+20'
  },

  // Tier 3 — 推荐 50+，高级世界BOSS（base HP ≥ 40000）
  {
    id: 'world_yi_gou_wu_zhuang', type: 'worldBoss', name: '异构武装', cost: 60,
    enemies: ['异构武装'],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 14, astrite: 20 },
    minLevel: 50, enemyScale: 1.55, desc: '特级×1 高级×2 · 武器石×14 · 星声+20'
  },
  {
    id: 'world_wu_gui_de_miu_wu', type: 'worldBoss', name: '无归的谬误', cost: 60,
    enemies: ['无归的谬误'],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 14, astrite: 20 },
    minLevel: 50, enemyScale: 1.6, desc: '特级×1 高级×2 · 武器石×14 · 星声+20'
  },
  {
    id: 'world_hai_zhi_nv', type: 'worldBoss', name: '海之女', cost: 60,
    enemies: ['海之女'],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 14, astrite: 20 },
    minLevel: 50, enemyScale: 1.55, desc: '特级×1 高级×2 · 武器石×14 · 星声+20'
  },
  {
    id: 'world_ming_zhong_zhi_gui', type: 'worldBoss', name: '鸣钟之龟', cost: 60,
    enemies: ['鸣钟之龟'],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 14, astrite: 20 },
    minLevel: 50, enemyScale: 1.55, desc: '特级×1 高级×2 · 武器石×14 · 星声+20'
  },
  {
    id: 'world_tan_xi_gu_long', type: 'worldBoss', name: '叹息古龙', cost: 60,
    enemies: ['叹息古龙'],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 14, astrite: 20 },
    minLevel: 55, enemyScale: 1.5, desc: '特级×1 高级×2 · 武器石×14 · 星声+20'
  },
  {
    id: 'world_meng_yan_ya_dang', type: 'worldBoss', name: '梦魇亚当·重锤', cost: 60,
    enemies: ['梦魇亚当·重锤'],
    drops: { exp_super: 1, exp_high: 2, weapon_book: 14, astrite: 20 },
    minLevel: 55, enemyScale: 1.35, desc: '特级×1 高级×2 · 武器石×14 · 星声+20'
  }
];

// 战歌重奏（周本技能升级材料，60 波片，周限 3 次共享）
// 模拟器抽象：技能升级材料 → 高级促剂 + 武器石 + 星声
export const WEEKLY_BOSS = [
  {
    id: 'boss_loulou', type: 'weekly', name: '战歌重奏·罗蕾莱', cost: 60, weeklyLimit: true,
    enemies: ['罗蕾莱'],
    encounterPool: [
      { enemies: ['罗蕾莱'], enemyScale: 2.5, weight: 1, tag: '导电护盾' }
    ],
    drops: { exp_high: 8, weapon_book: 14 },
    minLevel: 40, enemyScale: 2.5, desc: '高级×8 · 武器石×14 · 周限 3 次'
  },
  {
    id: 'boss_imperator', type: 'weekly', name: '战歌重奏·无冠者', cost: 60, weeklyLimit: true,
    enemies: ['无冠者'],
    encounterPool: [
      { enemies: ['无冠者'], enemyScale: 2.5, weight: 1, tag: '湮灭狂暴' }
    ],
    drops: { exp_high: 8, weapon_book: 14 },
    minLevel: 40, enemyScale: 2.5, desc: '高级×8 · 武器石×14 · 周限 3 次'
  },
  {
    id: 'boss_hecate', type: 'weekly', name: '战歌重奏·赫卡忒', cost: 60, weeklyLimit: true,
    enemies: ['赫卡忒'],
    encounterPool: [
      { enemies: ['赫卡忒'], enemyScale: 2.8, weight: 1, tag: '幻象召唤' }
    ],
    drops: { exp_super: 4, exp_high: 6, weapon_book: 16 },
    minLevel: 60, enemyScale: 2.8, desc: '特级×4 · 高级×6 · 武器石×16 · 周限 3 次'
  }
];

// 解析敌人字符串 "幼狼×3" → { name, count }
export function parseEnemyStr(str) {
  const m = str.match(/^(.+?)(?:×(\d+))?$/);
  if (!m) return { name: str, count: 1 };
  return { name: m[1], count: parseInt(m[2] || '1') };
}

export function flattenEnemies(enemyStrs) {
  const result = [];
  enemyStrs.forEach(s => {
    const parsed = parseEnemyStr(s);
    for (let i = 0; i < parsed.count; i++) result.push(parsed.name);
  });
  return result;
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickWeighted(pool, seed) {
  const total = pool.reduce((sum, item) => sum + (item.weight || 1), 0);
  let roll = seed % total;
  for (const item of pool) {
    roll -= item.weight || 1;
    if (roll < 0) return item;
  }
  return pool[0];
}

export function currentVersion(today = S.today) {
  const p = phases.find(x => today >= x.start && today < x.end)
    || phases.slice().reverse().find(x => today >= x.start)
    || phases[0];
  return p?.v || '1.0';
}

export function getDungeonEncounter(d, today = S.today) {
  const pool = d.encounterPool && d.encounterPool.length
    ? d.encounterPool
    : [{ enemies: d.enemies || [], enemyScale: d.enemyScale || 1.0, tag: '固定敌情' }];
  const dayKey = new Date(today).toISOString().slice(0, 10);
  const picked = pickWeighted(pool, hashString(`${d.id}|${dayKey}`));
  return {
    enemies: picked.enemies || d.enemies || [],
    enemyScale: picked.enemyScale || d.enemyScale || 1.0,
    tag: picked.tag || '今日敌情'
  };
}

// ===== 周本周限 3 次（共享计数）=====
export const WEEKLY_BOSS_LIMIT = 3;

export function getWeeklyBossUsed() {
  return (S.weeklyBoss && S.weeklyBoss.used && S.weeklyBoss.used.shared) || 0;
}
export function canUseWeeklyBoss() {
  return getWeeklyBossUsed() < WEEKLY_BOSS_LIMIT;
}
export function consumeWeeklyBoss() {
  if (!S.weeklyBoss) S.weeklyBoss = { used: {}, lastReset: '' };
  if (!S.weeklyBoss.used) S.weeklyBoss.used = {};
  S.weeklyBoss.used.shared = (S.weeklyBoss.used.shared || 0) + 1;
}
export function resetWeeklyBossIfNeeded(today) {
  if (!S.weeklyBoss) S.weeklyBoss = { used: {}, lastReset: '' };
  const d = new Date(today);
  const dayOfWeek = d.getUTCDay();
  const daysFromMon = (dayOfWeek + 6) % 7;
  const mondayMs = d.getTime() - daysFromMon * 86400000;
  const mondayKey = new Date(mondayMs).toISOString().slice(0, 10);
  if (S.weeklyBoss.lastReset !== mondayKey) {
    S.weeklyBoss.used = {};
    S.weeklyBoss.lastReset = mondayKey;
  }
}

// ===== 世界BOSS（60 波片 · 无次数限制 · 改为波片闸门）=====
// 旧的日限 3 次逻辑已取消，世界 BOSS 和其它副本一样用波片消耗控制频率

// ===== 索拉世界等级（SOL3 Phase · 简化 3 档）=====
// 模拟器抽象：官方 SOL3 Phase 1-8 → 模拟器 1-3 档
// 世界等级决定 BOSS 取 Lv90 基准的百分比
export const SOL3_LEVELS = {
  1: { name: '索拉Ⅰ', worldTierMult: 0.30, dropMult: 1.0 },
  2: { name: '索拉Ⅱ', worldTierMult: 0.40, dropMult: 2.0 },
  3: { name: '索拉Ⅲ', worldTierMult: 0.50, dropMult: 3.0 }
};

export function getSol3Level() {
  return S.materials?.sol3Level || 1;
}

export function setSol3Level(lv) {
  const l = Math.max(1, Math.min(3, lv));
  if (!S.materials) S.materials = {};
  S.materials.sol3Level = l;
  return l;
}

export function getSol3Config(lv) {
  return SOL3_LEVELS[lv || getSol3Level()] || SOL3_LEVELS[1];
}

// ===== 世界 BOSS 讨伐等级 =====
export function getBossLevel(bossName) {
  if (!S.bossLevels) S.bossLevels = {};
  return S.bossLevels[bossName] || 40;
}

export function increaseBossLevel(bossName) {
  if (!S.bossLevels) S.bossLevels = {};
  const cur = S.bossLevels[bossName] || 40;
  S.bossLevels[bossName] = Math.min(90, cur + 10);
  return S.bossLevels[bossName];
}

export function decreaseBossLevel(bossName) {
  if (!S.bossLevels) S.bossLevels = {};
  const cur = S.bossLevels[bossName] || 40;
  S.bossLevels[bossName] = Math.max(40, cur - 20);
  return S.bossLevels[bossName];
}

// 获取世界 BOSS 的 spawnEnemy 参数
export function getWorldBossSpawnOpts(bossName) {
  const tier = getSol3Level();
  const level = getBossLevel(bossName);
  const tierMult = SOL3_LEVELS[tier]?.worldTierMult || 0.30;
  return { worldTier: tier, bossLevel: level, tierMult };
}
