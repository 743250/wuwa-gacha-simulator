/**
 * 声骸图鉴与套装数据
 *
 * 数据来源:
 *   - encore.moe API (https://api-v2.encore.moe/api/zh-Hans/echo)
 *   - docs/sources/mechanisms/echo-system.md
 *   - 游戏内数据交叉核验
 *
 * 采集日期: 2026-06-28
 *
 * 注意:
 *   - 声骸可属于多个套装 (FetterGroups), 此处仅列主要套装
 *   - 同名异相版本 (异相·) 套装与普通版一致, 不重复列出
 *   - 梦魇版本 (梦魇·) 套装与原版可能不同
 *   - 标记 "unknown" 的表示 API 未返回或无法确认
 */

// ==================== 声骸图鉴 ====================

export const ECHO_CATALOG = [
  // ============================================================
  // COST 4 — BOSS 级 (Overlord Rarity=2 / Calamity Rarity=3)
  // ============================================================

  // --- 1.0 世界BOSS ---
  { id: 'feilian',       name: '飞廉之猩',     cost: 4, set: 'wind',      element: '气动', source: '世界BOSS' },
  { id: 'aix',           name: '无常凶鹭',     cost: 4, set: 'energy',    element: '湮灭', source: '世界BOSS' },
  { id: 'rider',         name: '燎照之骑',     cost: 4, set: 'fire',      element: '热熔', source: '世界BOSS' },
  { id: 'thunder',       name: '朔雷之鳞',     cost: 4, set: 'thunder',   element: '导电', source: '世界BOSS' },
  { id: 'turtle',        name: '鸣钟之龟',     cost: 4, set: ['energy','heal'],  element: '冷凝', source: '世界BOSS' },
  // 注: 鸣钟之龟双重套 (轻云出月+隐世回光), 默认按 heal 处理
  { id: 'heron',         name: '哀声鸷',       cost: 4, set: 'spectro',   element: '衍射', source: '世界BOSS' },
  { id: 'lumiscale',     name: '云闪之鳞',     cost: 4, set: 'thunder',   element: '导电', source: '世界BOSS' },
  { id: 'crownless',     name: '无冠者',       cost: 4, set: 'havoc',     element: '湮灭', source: '世界BOSS' },
  { id: 'mech',          name: '聚械机偶',     cost: 4, set: 'atk',       element: '导电', source: '世界BOSS' },
  { id: 'dreamless',     name: '无妄者',       cost: 4, set: 'havoc',     element: '湮灭', source: '周本BOSS' },
  { id: 'jue',           name: '角',           cost: 4, set: 'spectro',   element: '衍射', source: '周本BOSS' },
  { id: 'hectate',       name: '赫卡忒',       cost: 4, set: 'coord',     element: '衍射', source: '周本BOSS' },

  // --- 1.0 其他COST4 ---
  { id: 'glacio_prism',  name: '辉萤军势',     cost: 4, set: 'frost',     element: '冷凝', source: '世界BOSS' },
  { id: 'beast',         name: '踏光兽',       cost: 4, set: 'spectro',   element: '衍射', source: '世界BOSS' },
  { id: 'fallacy',       name: '无归的谬误',   cost: 4, set: 'heal',      element: '衍射', source: '世界BOSS' },

  // --- 2.0+ 世界BOSS ---
  { id: 'lorelei',       name: '罗蕾莱',       cost: 4, set: 'havoc_new', element: '导电', source: '世界BOSS' },
  // 注: 罗蕾莱套装归"幽夜隐匿之帷"(encore.moe API id=12) — 2件+湮灭 / 5件延奏湮灭, 复用 havoc_new 字段
  { id: 'sentinel',      name: '哨兵机偶',     cost: 4, set: 'spectro_new', element: '衍射', source: '世界BOSS' },
  { id: 'dragon',        name: '巨龙·气动',    cost: 4, set: 'wind_new',  element: '气动', source: '世界BOSS' },
  { id: 'dragon_fire',   name: '巨龙·热熔',    cost: 4, set: 'fire_new',  element: '热熔', source: '世界BOSS' },

  // --- 梦魇版 (COST 4) ---
  { id: 'nm_feilian',    name: '梦魇·飞廉之猩', cost: 4, set: 'wind',     element: '导电', source: '梦魇副本' },
  { id: 'nm_aix',        name: '梦魇·无常凶鹭', cost: 4, set: 'havoc_new',element: '导电', source: '梦魇副本' },
  { id: 'nm_lumiscale',  name: '梦魇·云闪之鳞', cost: 4, set: 'thunder',  element: '导电', source: '梦魇副本' },
  { id: 'nm_thunder',    name: '梦魇·朔雷之鳞', cost: 4, set: 'thunder',  element: '导电', source: '梦魇副本' },
  { id: 'nm_crownless',  name: '梦魇·无冠者',   cost: 4, set: 'havoc',    element: '湮灭', source: '梦魇副本' },
  { id: 'nm_rider',      name: '梦魇·燎照之骑', cost: 4, set: 'fire',     element: '热熔', source: '梦魇副本' },
  { id: 'nm_heron',      name: '梦魇·哀声鸷',   cost: 4, set: 'spectro',  element: '衍射', source: '梦魇副本' },
  { id: 'nm_turtle',     name: '梦魇·鸣钟之龟', cost: 4, set: 'heal',     element: '冷凝', source: '梦魇副本' },

  // ============================================================
  // COST 3 — 精英级 (Elite Rarity=1)
  // ============================================================

  // --- 热熔 ---
  { id: 'redheron',      name: '红羽鹭',       cost: 3, set: 'fire',      element: '热熔', source: '精英' },
  { id: 'lava_walker',   name: '熔岩行者',     cost: 3, set: 'fire',      element: '热熔', source: '精英' },

  // --- 导电 ---
  { id: 'purple_heron',  name: '紫羽鹭',       cost: 3, set: 'thunder',   element: '导电', source: '精英' },
  { id: 'stone_gate',    name: '石像守门人',   cost: 3, set: 'thunder',   element: '导电', source: '精英' },

  // --- 冷凝 ---
  { id: 'ice_heron',     name: '冰羽鹭',       cost: 3, set: 'frost',     element: '冷凝', source: '精英' },
  { id: 'ice_walker',    name: '冰晶行者',     cost: 3, set: 'frost',     element: '冷凝', source: '精英' },
  { id: 'snow_wolf',     name: '雪鬃狼',       cost: 3, set: 'frost',     element: '冷凝', source: '精英' },

  // --- 气动 ---
  { id: 'green_heron',   name: '绿羽鹭',       cost: 3, set: 'wind',      element: '气动', source: '精英' },
  { id: 'wind_rider',    name: '车刃镰',       cost: 3, set: 'wind',      element: '气动', source: '精英' },

  // --- 衍射 ---
  { id: 'light_heron',   name: '衍射羽鹭',     cost: 3, set: 'spectro',   element: '衍射', source: '精英' },
  { id: 'light_spirit',  name: '光灵',         cost: 3, set: 'spectro',   element: '衍射', source: '精英' },

  // --- 湮灭 ---
  { id: 'dark_heron',    name: '湮灭羽鹭',     cost: 3, set: 'havoc',     element: '湮灭', source: '精英' },
  { id: 'dark_spirit',   name: '暗灵',         cost: 3, set: 'havoc',     element: '湮灭', source: '精英' },

  // --- 物理/通用 ---
  { id: 'big_shield',    name: '大盾哥',       cost: 3, set: 'unknown',   element: '物理', source: '精英' },
  { id: 'dancer_tacet',  name: '舞者',         cost: 3, set: 'unknown',   element: '物理', source: '精英' },
  { id: 'boxer_tacet',   name: '拳击手',       cost: 3, set: 'unknown',   element: '物理', source: '精英' },

  // --- 2.0 精英 ---
  { id: 'knight_light',  name: '幻昼骑士',     cost: 3, set: 'spectro_new', element: '导电', source: '精英' },
  { id: 'knight_dark',   name: '暗夜骑士',     cost: 3, set: 'havoc_new', element: '导电', source: '精英' },
  { id: 'noble_poison',  name: '毒冠贵族',     cost: 3, set: 'havoc_new', element: '导电', source: '精英' },
  { id: 'float_doll',    name: '浮灵偶',       cost: 3, set: 'energy_new', element: '导电', source: '精英' },
  { id: 'glass_blade',   name: '琉璃刀伶',     cost: 3, set: 'coord',     element: '导电', source: '精英' },
  { id: 'giant_doll',    name: '巨布偶',       cost: 3, set: 'unknown',   element: '导电', source: '精英' },
  { id: 'patrol_mech',   name: '巡哨机傀',     cost: 3, set: 'frost',     element: '冷凝', source: '精英' },
  { id: 'swim_mech',     name: '游鳞机枢',     cost: 3, set: 'frost',     element: '冷凝', source: '精英' },
  { id: 'play_ape',      name: '戏猿',         cost: 3, set: 'heal',      element: '气动', source: '精英' },

  // ============================================================
  // COST 1 — 普通级 (Common Rarity=0)
  // ============================================================

  // --- 热熔 ---
  { id: 'fire_bug',      name: '融火虫',       cost: 1, set: 'fire',      element: '热熔', source: '普通' },
  { id: 'fire_whelp',    name: '小翼龙·热熔',   cost: 1, set: 'fire',      element: '热熔', source: '普通' },

  // --- 导电 ---
  { id: 'thunder_whelp', name: '小翼龙·导电',   cost: 1, set: 'thunder',   element: '导电', source: '普通' },

  // --- 冷凝 ---
  { id: 'dingdong',      name: '叮咚咚',       cost: 1, set: 'frost',     element: '冷凝', source: '普通' },
  { id: 'ice_whelp',     name: '小翼龙·冷凝',   cost: 1, set: 'frost',     element: '冷凝', source: '普通' },

  // --- 气动 ---
  { id: 'air_whelp',     name: '小翼龙·气动',   cost: 1, set: 'wind',      element: '气动', source: '普通' },
  { id: 'baby_ape',      name: '幼猿',         cost: 1, set: 'wind',      element: '气动', source: '普通' },
  { id: 'pufferfish',    name: '啾啾河豚',     cost: 1, set: 'wind',      element: '气动', source: '普通' },

  // --- 衍射 ---
  { id: 'light_whelp',   name: '小翼龙·衍射',   cost: 1, set: 'spectro',   element: '衍射', source: '普通' },
  { id: 'magician',      name: '魔术先生',     cost: 1, set: 'spectro',   element: '衍射', source: '普通' },

  // --- 湮灭 ---
  { id: 'havoc_whelp',   name: '小翼龙·湮灭',   cost: 1, set: 'havoc',     element: '湮灭', source: '普通' },

  // --- 物理/通用 ---
  { id: 'scorpion',      name: '晶螯蝎',       cost: 1, set: 'unknown',   element: '物理', source: '普通' },
  { id: 'light_doll',    name: '通行灯偶',     cost: 1, set: 'unknown',   element: '物理', source: '普通' },
  { id: 'ostrich',       name: '侏侏鸵',       cost: 1, set: 'unknown',   element: '物理', source: '普通' },
  { id: 'treasure',      name: '欺诈奇藏',     cost: 1, set: 'unknown',   element: '物理', source: '普通' },

  // --- 2.0 普通 ---
  { id: 'wind_prism',    name: '气动棱镜',     cost: 1, set: 'wind_new',  element: '气动', source: '普通' },
  { id: 'frost_prism',   name: '冷凝棱镜',     cost: 1, set: 'frost_new', element: '冷凝', source: '普通' },
  { id: 'fire_prism',    name: '热熔棱镜',     cost: 1, set: 'fire_new',  element: '热熔', source: '普通' },
  { id: 'thunder_prism', name: '导电棱镜',     cost: 1, set: 'unknown',   element: '导电', source: '普通' },
  { id: 'light_prism',   name: '衍射棱镜',     cost: 1, set: 'spectro_new', element: '衍射', source: '普通' },
  { id: 'havoc_prism',   name: '湮灭棱镜',     cost: 1, set: 'havoc_new', element: '湮灭', source: '普通' },

  // ============================================================
  // 2.0+ 角色专属套 · 对应声骸（encore.moe API FetterGroups ID 10/11/16/17/18/23/27/28/30/31）
  // 采集: 2026-06-29 (echoes-compact.json 266 条全量)
  // 注: API Element 字段对 1-cost 普遍误标「衍射」，按声骸本身特性手动修正
  // ============================================================================

  // --- 珂莱塔 · 凌冽决断之心 (ID 10) ---
  { id: 'windmane_wolf',   name: '风鬃狼',         cost: 1, set: 'carlotta_skill', element: '冷凝', source: '普通' },
  { id: 'pup_lieve',       name: '浮灵偶·蕾弗',     cost: 1, set: 'carlotta_skill', element: '冷凝', source: '普通' },
  { id: 'pup_lite',        name: '浮灵偶·莱特',     cost: 1, set: 'carlotta_skill', element: '冷凝', source: '普通' },
  { id: 'magic_song',      name: '魔术先生',       cost: 1, set: 'carlotta_skill', element: '冷凝', source: '普通' },
  { id: 'tour_knight',     name: '巡游骑士',       cost: 3, set: 'carlotta_skill', element: '导电', source: '精英' },
  { id: 'poison_noble',    name: '毒冠贵族',       cost: 3, set: 'carlotta_skill', element: '导电', source: '精英' },
  { id: 'water_noble',     name: '凝水贵族',       cost: 3, set: 'carlotta_skill', element: '导电', source: '精英' },
  { id: 'mecha_armed',     name: '异构武装',       cost: 4, set: 'carlotta_skill', element: '冷凝', source: '世界BOSS' },
  { id: 'nm_glaze',        name: '梦魇·辉萤军势',  cost: 4, set: 'carlotta_skill', element: '冷凝', source: '梦魇副本' },

  // --- 菲比 · 此间永驻之光 (ID 11) ---
  { id: 'frost_wolf_phoebe', name: '霜鬃狼',       cost: 1, set: 'phoebe_lightnoise', element: '衍射', source: '普通' },
  { id: 'pup_haid',          name: '浮灵偶·海德',   cost: 1, set: 'phoebe_lightnoise', element: '衍射', source: '普通' },
  { id: 'shadow_fire',       name: '幽翎火',         cost: 1, set: 'phoebe_lightnoise', element: '衍射', source: '普通' },
  { id: 'puppet_fore',       name: '工头布偶',       cost: 1, set: 'phoebe_lightnoise', element: '衍射', source: '普通' },
  { id: 'fancy_gold_rock',   name: '愚金幼岩',       cost: 1, set: 'phoebe_lightnoise', element: '衍射', source: '普通' },
  { id: 'pardon_envoy_1',   name: '赦罪节使',       cost: 1, set: ['phoebe_lightnoise','cartethyia_wind','brant_burst'], element: '气动', source: '普通' },
  { id: 'arc_knight',        name: '幻昼骑士',       cost: 3, set: 'phoebe_lightnoise', element: '衍射', source: '精英' },
  { id: 'colored_glass_knife', name: '琉璃刀伶',    cost: 3, set: 'phoebe_lightnoise', element: '衍射', source: '精英' },
  { id: 'statue_fist',       name: '重塑雕像的拳砾', cost: 3, set: ['phoebe_lightnoise','cartethyia_wind'], element: '衍射', source: '精英' },
  { id: 'glory_envoy_3',     name: '荣光节使',       cost: 3, set: ['phoebe_lightnoise','cartethyia_wind','cartethyia_glory'], element: '气动', source: '精英' },
  { id: 'nm_heron',          name: '梦魇·哀声鸷',    cost: 4, set: 'phoebe_lightnoise', element: '衍射', source: '梦魇副本' },

  // --- 卡提希娅 · 流云逝尽之空 (ID 16) ---
  { id: 'crown_envoy',       name: '卫冕节使',       cost: 1, set: ['cartethyia_wind','brant_burst'], element: '气动', source: '普通' },
  { id: 'mercy_envoy',       name: '慈悲节使',       cost: 1, set: ['cartethyia_wind','cartethyia_glory'], element: '气动', source: '普通' },
  { id: 'faith_puppet',      name: '苦信者的作俑',   cost: 1, set: ['cartethyia_wind','cartethyia_glory','brant_burst'], element: '气动', source: '普通' },
  { id: 'wind_baby_dragon',  name: '飓力熊',         cost: 3, set: 'cartethyia_wind', element: '气动', source: '精英' },
  { id: 'fludeer_formless',  name: '共鸣回响·芙露德莉斯', cost: 4, set: ['cartethyia_wind','cartethyia_glory'], element: '气动', source: '周本BOSS' },
  { id: 'nm_kelpie',         name: '梦魇·凯尔匹',    cost: 4, set: ['cartethyia_wind','cartethyia_glory'], element: '冷凝', source: '梦魇副本' },

  // --- 卡提希娅 · 愿戴荣光之旅 (ID 17) ---
  { id: 'preach_remnant',   name: '传道者的遗形',   cost: 3, set: ['cartethyia_glory','brant_burst'], element: '气动', source: '精英' },
  { id: 'horned_croc',      name: '角鳄',           cost: 3, set: 'cartethyia_glory', element: '气动', source: '精英' },

  // --- 布兰特 · 奔狼燎原之焰 (ID 18) ---
  { id: 'spine_dragon',     name: '蚀脊龙',         cost: 3, set: 'brant_burst', element: '热熔', source: '精英' },
  { id: 'brant_lion',       name: '荣耀狮像',       cost: 4, set: 'brant_burst', element: '热熔', source: '世界BOSS' },

  // --- 坎特蕾拉 · 命理崩毁之弦 (ID 23 · 3件套) ---
  { id: 'blade_noble',      name: '持刃贵族',       cost: 3, set: 'cantarella_void', element: '湮灭', source: '精英' },
  { id: 'nm_roar_croak',    name: '梦魇·呜咔咔',    cost: 1, set: 'cantarella_void', element: '湮灭', source: '梦魇副本' },
  { id: 'nm_ostrich',       name: '梦魇·侏侏鸵',    cost: 1, set: 'cantarella_void', element: '物理', source: '梦魇副本' },
  { id: 'nm_thorn_mush',    name: '梦魇·刺玫菇',    cost: 3, set: 'cantarella_void', element: '湮灭', source: '梦魇副本' },
  { id: 'rm_leviathan',     name: '共鸣回响·鸣式·利维亚坦', cost: 4, set: 'cantarella_void', element: '湮灭', source: '周本BOSS' },

  // --- 布兰特 · 长路启航之星 (ID 27) ---
  { id: 'shock_tremor',     name: '颤栗战士',       cost: 1, set: ['brant_path','brant_mottle','feixue_snow'], element: '导电', source: '普通' },
  { id: 'ice_dancer',       name: '冰盈舞者',       cost: 1, set: ['brant_path','brant_mottle','feixue_snow','lumera_chord'], element: '冷凝', source: '普通' },
  { id: 'shadow_glim',      name: '影烁者',         cost: 1, set: ['brant_path','brant_mottle','feixue_snow'], element: '湮灭', source: '普通' },
  { id: 'doc_pipip',        name: '噼啪啪',         cost: 1, set: 'brant_mottle', element: '气动', source: '普通' },
  { id: 'crown_mech_falcon', name: '冠顶械隼',      cost: 3, set: ['brant_path','brant_mottle'], element: '热熔', source: '精英' },
  { id: 'echo_crown_falcon', name: '共鸣回响·冠顶苍隼', cost: 3, set: ['brant_path','brant_mottle'], element: '气动', source: '精英' },
  { id: 'gromma_diagram',   name: '格洛犸图',       cost: 3, set: ['brant_path','feixue_snow'], element: '气动', source: '精英' },
  { id: 'xingleim',         name: '辛吉勒姆',      cost: 4, set: 'brant_path', element: '热熔', source: '世界BOSS' },

  // --- 布兰特 · 斑驳粉饰之沫 (ID 28) ---
  { id: 'tunnel_heavy',     name: '探隧重机',       cost: 3, set: 'brant_mottle', element: '热熔', source: '精英' },
  { id: 'core_machine',     name: '炉芯机骸',       cost: 4, set: 'brant_mottle', element: '热熔', source: '世界BOSS' },
  { id: 'echo_dania',       name: '共鸣回响·达妮娅', cost: 4, set: 'brant_mottle', element: '热熔', source: '周本BOSS' },

  // --- 绯雪 · 雪落无声之愿 (ID 30) ---
  { id: 'heavy_iron_hoof',  name: '重工铁蹄',       cost: 3, set: ['feixue_snow','lumera_chord'], element: '热熔', source: '精英' },
  { id: 'frost_scale_shell', name: '霜鳞蜃甲',      cost: 3, set: 'feixue_snow', element: '冷凝', source: '精英' },
  { id: 'wind_scale_shell', name: '风鳞蜃甲',       cost: 3, set: 'feixue_snow', element: '气动', source: '精英' },
  { id: 'rm_virtual_god',   name: '共鸣回响·鸣式·虚造神型', cost: 4, set: 'feixue_snow', element: '冷凝', source: '周本BOSS' },

  // --- 洛瑟菈 · 剪心辑梦之影 (ID 31) ---
  { id: 'plant_bee',        name: '莳植熊蜂',       cost: 1, set: 'lumera_chord', element: '气动', source: '普通' },
  { id: 'mine_bee',         name: '矿岩熊蜂',       cost: 1, set: 'lumera_chord', element: '物理', source: '普通' },
  { id: 'plant_elk',        name: '莳植机麋',       cost: 3, set: 'lumera_chord', element: '气动', source: '精英' },
  { id: 'mine_elk',         name: '矿岩机麋',       cost: 3, set: 'lumera_chord', element: '物理', source: '精英' },
  { id: 'mirage_moth',      name: '迷胧幻蛾',       cost: 3, set: 'lumera_chord', element: '衍射', source: '精英' },
  { id: 'nameless_seeker', name: '无铭探索者',     cost: 4, set: 'lumera_chord', element: '气动', source: '世界BOSS' },
];

// ==================== 套装效果 ====================

export const ECHO_SETS = [
  // ======== 1.0 套装 (10套) ========
  { id: 'frost',    name: '凝夜白霜', element: '冷凝',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '冷凝' },
    bonus5: { type: 'elem_dmg_cond', value: 0.10, elem: '冷凝', cond: '普攻或重击命中,可叠3层' } },

  { id: 'fire',     name: '熔山裂谷', element: '热熔',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '热熔' },
    bonus5: { type: 'elem_dmg_cond', value: 0.30, elem: '热熔', cond: '技能命中后,持续15秒' } },

  { id: 'thunder',  name: '彻空冥雷', element: '导电',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '导电' },
    bonus5: { type: 'elem_dmg_cond', value: 0.15, elem: '导电', cond: '重击/技能命中,可叠2层,各持续15秒' } },

  { id: 'wind',     name: '啸谷长风', element: '气动',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '气动' },
    bonus5: { type: 'elem_dmg_cond', value: 0.30, elem: '气动', cond: '变奏入场后,持续15秒' } },

  { id: 'spectro',  name: '浮星祛暗', element: '衍射',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '衍射' },
    bonus5: { type: 'elem_dmg_cond', value: 0.15, elem: '衍射', cond: '普攻命中,可叠2层,各持续15秒' } },

  { id: 'havoc',    name: '沉日劫明', element: '湮灭',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '湮灭' },
    bonus5: { type: 'elem_dmg_cond', value: 0.30, elem: '湮灭', cond: '使用解放后,持续15秒' } },

  { id: 'heal',     name: '隐世回光', element: null,
    bonus2: { type: 'heal_bonus', value: 0.10 },
    bonus5: { type: 'atk_team_flat', value: 0.15, cond: '为队友治疗后,全队攻击+15%,持续30秒' } },

  { id: 'energy',   name: '轻云出月', element: null,
    bonus2: { type: 'energy_regen', value: 0.10 },
    bonus5: { type: 'atk_next_flat', value: 0.225, cond: '延奏后下一登场角色攻击+22.5%,持续15秒' } },

  { id: 'atk',      name: '不绝余音', element: null,
    bonus2: { type: 'atk_pct', value: 0.10 },
    bonus5: { type: 'atk_pct_stack', value: 0.05, cond: '在场时每1.5秒+5%,可叠4层' } },

  { id: 'normal_atk', name: '出谷黄莺', element: null,
    bonus2: { type: 'normal_atk_dmg', value: 0.10 },
    bonus5: { type: 'normal_atk_dmg_cond', value: 0.10, cond: '释放技能后普攻伤害+10%,持续15秒' } },

  // ======== 2.0 新套装 (6套, 巴哈姆特/encore.moe API 确认) ========
  { id: 'frost_new',    name: '凛冽寒渊',   element: '冷凝',
    bonus2: { type: 'skill_dmg', value: 0.10 },
    bonus5: { type: 'elem_dmg_cond', value: 0.30, elem: '冷凝', cond: '释放技能后冷凝伤害+30%' } },

  { id: 'fire_new',     name: '焚焰灼天',   element: '热熔',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '热熔' },
    bonus5: { type: 'elem_dmg_cond', value: 0.25, elem: '热熔', cond: 'dot目标技能伤害+25%' } },

  { id: 'thunder_new',  name: '雷音贯宇',   element: '导电',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '导电' },
    bonus5: { type: 'elem_dmg_cond', value: 0.25, elem: '导电', cond: '延奏后导电伤害+25%' } },

  { id: 'wind_new',     name: '岚息流转',   element: '气动',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '气动' },
    bonus5: { type: 'elem_dmg_cond', value: 0.30, elem: '气动', cond: '风蚀目标伤害+30%' } },

  { id: 'spectro_new',  name: '永辉圣域',   element: '衍射',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '衍射' },
    bonus5: { type: 'elem_dmg_cond', value: 0.25, elem: '衍射', cond: '光噪目标额外伤害+25%' } },

  { id: 'havoc_new',    name: '深渊暗流',   element: '湮灭',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '湮灭' },
    bonus5: { type: 'elem_dmg_cond', value: 0.30, elem: '湮灭', cond: '暗涌状态目标伤害+30%' } },

  // ======== 2.2+ 新增套装 (encore.moe API 确认) ========
  { id: 'coord',        name: '高天共奏之曲', element: null,
    bonus2: { type: 'energy_regen', value: 0.10 },
    bonus5: { type: 'coord_dmg', value: 0.30, cond: '协同攻击伤害+30%' } },

  { id: 'energy_new',   name: '无惧浪涛之勇', element: null,
    bonus2: { type: 'energy_regen', value: 0.10 },
    bonus5: { type: 'atk_pct_elem', value: 0.15, cond: '攻击+15%,能效达标后全属伤+15%' } },

  // ======== 卡提希娅专属套装 (2.0+ · encore.moe API FetterGroups ID 16/17) ========
  // 流云逝尽之空：角色为敌人添加「风蚀效应」时全队气动+15% / 自身额外+15%（官方文案）
  { id: 'cartethyia_wind', name: '流云逝尽之空', element: '气动',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '气动' },
    bonus5: { type: 'cartethyia_wind_team', value: 0.15, extraSelf: 0.15, elem: '气动', cond: '添加风蚀效应时全队气动+15% / 自身额外+15%，持续20秒' } },

  // 愿戴荣光之旅：攻击命中风蚀目标时自身暴击+10% / 气动+30%（官方文案）
  { id: 'cartethyia_glory', name: '愿戴荣光之旅', element: '气动',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '气动' },
    bonus5: { type: 'cartethyia_glory_self', value: 0.30, crate: 0.10, elem: '气动', cond: '命中风蚀目标时自身暴击+10% / 气动+30%，持续10秒' } },

  // ======== 2.0+ 角色专属套装（encore.moe API FetterGroups ID 10/11/18/23/27/28/30/31）========
  // 数据来源：encore.moe API + mc.appfeng.com 交叉核验（采集 2026-06-29）

  // --- ID 10 · 珂莱塔专属「凌冽决断之心」---
  { id: 'carlotta_skill', name: '凌冽决断之心', element: '冷凝',
    bonus2: { type: 'skill_dmg', value: 0.12 },
    bonus5: { type: 'carlotta_skill_cond', value: 0.225, valueAlt: 0.18, elem: '冷凝', cond: '施放共鸣技能时自身冷凝+22.5%(15秒) / 施放共鸣解放时共鸣技能+18%(5秒,可叠2层)' } },

  // --- ID 11 · 菲比专属「此间永驻之光」---
  { id: 'phoebe_lightnoise', name: '此间永驻之光', element: '衍射',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '衍射' },
    bonus5: { type: 'phoebe_lightnoise_cond', value: 0.20, valueAlt: 0.15, crate: 0.20, elem: '衍射', cond: '添加光噪效应时自身暴击+20%(15秒) / 攻击10层光噪目标时自身衍射+15%(15秒)' } },

  // --- ID 18 · 布兰特专属「奔狼燎原之焰」---
  { id: 'brant_burst', name: '奔狼燎原之焰', element: '热熔',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '热熔' },
    bonus5: { type: 'brant_burst_cond', value: 0.15, valueSelf: 0.20, elem: '热熔', cond: '施放共鸣解放时全队热熔+15% / 自身解放+20%，持续35秒' } },

  // --- ID 23 · 坎特蕾拉专属「命理崩毁之弦」(3 件套结构)---
  // 注意：3 件套而非 2+5，bonus2 留空由 stats.js 处理
  { id: 'cantarella_void', name: '命理崩毁之弦', element: '湮灭',
    bonus2: null,
    bonus5: { type: 'cantarella_void_cond', value: 0.20, valueAlt: 0.30, elem: '湮灭', cond: '添加虚湮效应时自身攻击+20% / 共鸣解放+30%，持续5秒' },
    tier: 3 },

  // --- ID 27 · 布兰特专属「长路启航之星」---
  { id: 'brant_path', name: '长路启航之星', element: '热熔',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '热熔' },
    bonus5: { type: 'brant_path_cond', value: 0.20, elem: '热熔', crate: 0.20, cond: '添加聚爆效应或震谐偏移时自身暴击+20% / 热熔+20%，持续8秒' } },

  // --- ID 28 · 布兰特专属「斑驳粉饰之沫」---
  { id: 'brant_mottle', name: '斑驳粉饰之沫', element: '热熔',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '热熔' },
    bonus5: { type: 'brant_mottle_cond', value: 0.10, valueNext: 0.25, elem: '热熔', cond: '添加聚爆效应时热熔+10%(15秒) / 持续期间延奏后下一位变奏登场角色热熔+25%(15秒)' } },

  // --- ID 30 · 绯雪专属「雪落无声之愿」---
  { id: 'feixue_snow', name: '雪落无声之愿', element: '冷凝',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '冷凝' },
    bonus5: { type: 'feixue_snow_cond', value: 0.10, valueAlt: 0.25, elem: '冷凝', cond: '添加霜渐效应时冷凝+10%(15秒)+获【落雪】11秒(25秒CD) / 落雪+解放时暴击+25%(6秒可续) 或 落雪+延奏时下位冷凝+25%(15秒)' } },

  // --- ID 31 · 洛瑟菈专属「剪心辑梦之影」(谐度破坏系)---
  { id: 'lumera_chord', name: '剪心辑梦之影', element: null,
    bonus2: { type: 'atk_pct', value: 0.10 },
    bonus5: { type: 'lumera_chord_cond', value: 20, elem: null, flat: true, cond: '添加震谐偏移或集谐偏移时全队谐度破坏增幅+20点，持续30秒（同名不叠加）' } },
];

// ==================== 主词条池 ====================

/**
 * COST 4 主属性池 (5★ Lv.15 数值)
 * 来源: 文档第五节 + encore.moe API 交叉核验
 */
export const MAIN_STAT_POOL = {
  4: [
    { key: 'crate',       label: '暴击率',    value: 0.22 },   // 22.0%
    { key: 'cdmg',        label: '暴击伤害',  value: 0.44 },   // 44.0%
    { key: 'atk_pct',     label: '攻击%',     value: 0.33 },   // 33.0%
    { key: 'hp_pct',      label: '生命%',     value: 0.33 },   // 33.0%
    { key: 'def_pct',     label: '防御%',     value: 0.33 },   // 33.0%
    { key: 'heal_bonus',  label: '治疗加成',  value: 0.22 },   // 22.0%
  ],
  3: [
    { key: 'elem_dmg_fire',     label: '热熔伤害%',    value: 0.30 },
    { key: 'elem_dmg_thunder',  label: '导电伤害%',    value: 0.30 },
    { key: 'elem_dmg_frost',    label: '冷凝伤害%',    value: 0.30 },
    { key: 'elem_dmg_wind',     label: '气动伤害%',    value: 0.30 },
    { key: 'elem_dmg_spectro',  label: '衍射伤害%',    value: 0.30 },
    { key: 'elem_dmg_havoc',    label: '湮灭伤害%',    value: 0.30 },
    { key: 'atk_pct',           label: '攻击%',        value: 0.30 },
    { key: 'hp_pct',            label: '生命%',        value: 0.30 },
    { key: 'def_pct',           label: '防御%',        value: 0.30 },
    { key: 'energy_regen',      label: '能量回复%',    value: 0.32 },
  ],
  1: [
    { key: 'atk_pct',   label: '攻击%',   value: 0.18 },   // 18.0% (2.0+ 统一为百分比)
    { key: 'hp_pct',    label: '生命%',   value: 0.18 },
    { key: 'def_pct',   label: '防御%',   value: 0.18 },
  ],
};

// ==================== 副词条池 ====================

/**
 * 副词条类型与数值范围 (每档最低~最高)
 * 来源: 文档第六节
 */
export const SUB_STAT_POOL = [
  { key: 'crate',            label: '暴击率',      min: 0.063, max: 0.105 },
  { key: 'cdmg',             label: '暴击伤害',    min: 0.126, max: 0.210 },
  { key: 'atk_pct',          label: '攻击%',       min: 0.063, max: 0.105 },
  { key: 'hp_pct',           label: '生命%',       min: 0.063, max: 0.105 },
  { key: 'def_pct',          label: '防御%',       min: 0.079, max: 0.132 },
  { key: 'atk_flat',         label: '攻击(固定)',  min: 30,    max: 50 },
  { key: 'hp_flat',          label: '生命(固定)',  min: 450,   max: 750 },
  { key: 'def_flat',         label: '防御(固定)',  min: 30,    max: 50 },
  { key: 'energy_regen',     label: '能量回复%',   min: 0.056, max: 0.093 },
  { key: 'normal_atk_dmg',   label: '普攻伤害%',   min: 0.063, max: 0.105 },
  { key: 'skill_dmg',        label: '技能伤害%',   min: 0.063, max: 0.105 },
  { key: 'burst_dmg',        label: '解放伤害%',   min: 0.063, max: 0.105 },
  { key: 'heavy_dmg',        label: '重击伤害%',   min: 0.063, max: 0.105 },
];

// ==================== 升级经验 ====================

export const LEVEL_EXP = [
  { from: 1, to: 5,  exp: 10000,  cost: 5000 },
  { from: 5, to: 10, exp: 30000,  cost: 15000 },
  { from: 10, to: 15, exp: 60000,  cost: 30000 },
  { from: 15, to: 20, exp: 120000, cost: 60000 },
  { from: 20, to: 25, exp: 320000, cost: 160000 },
];

/** 金色声骸 0→25 总计 */
export const MAX_LEVEL_EXP = 540000;
export const MAX_LEVEL_COST = 270000;

// ==================== 套装ID查找辅助 ====================

/** 根据套装id获取套装信息 */
export function getSetById(id) {
  return ECHO_SETS.find(s => s.id === id);
}

/** 根据声骸id获取声骸信息 */
export function getEchoById(id) {
  return ECHO_CATALOG.find(e => e.id === id);
}

/** 获取某套装的所有声骸 */
export function getEchoesBySet(setId) {
  return ECHO_CATALOG.filter(e => e.set === setId);
}

/** 获取某元素的所有声骸 */
export function getEchoesByElement(element) {
  return ECHO_CATALOG.filter(e => e.element === element);
}

/** 获取某COST的所有声骸 */
export function getEchoesByCost(cost) {
  return ECHO_CATALOG.filter(e => e.cost === cost);
}

// 主/副词条值格式化：固定值（atk_flat/hp_flat/def_flat）显示为整数，百分比显示为 N.N%
const FLAT_STAT_KEYS = new Set(['atk_flat', 'hp_flat', 'def_flat']);

/** 把声骸词条 value 按 key 渲染成展示字符串：固定值整数，百分比给 N.N% */
export function formatEchoStatValue(key, value) {
  if (FLAT_STAT_KEYS.has(key)) return String(Math.round(value));
  return (value * 100).toFixed(1) + '%';
}

// 套装 bonus 类型 → 中文描述前缀（不含数值）
const SET_BONUS_TYPE_LABEL = {
  elem_dmg:           (b) => `${b.elem ?? ''}伤害加成`,
  elem_dmg_cond:      (b) => `${b.elem ?? ''}伤害加成`,
  heal_bonus:         () => '治疗加成',
  energy_regen:       () => '能量回复',
  atk_pct:            () => '攻击加成',
  atk_pct_stack:      () => '攻击加成（叠层）',
  atk_team_flat:      () => '全队攻击加成',
  atk_next_flat:      () => '延奏后下一角色攻击加成',
  normal_atk_dmg:     () => '普攻伤害加成',
  normal_atk_dmg_cond:() => '普攻伤害加成',
  skill_dmg:          () => '技能伤害加成',
  coord_dmg:          () => '协同攻击伤害加成',
  atk_pct_elem:       () => '攻击加成 / 全元素伤害加成',
  cartethyia_wind_team: (b) => `${b.elem ?? ''}伤害加成（全队+自身额外）`,
  cartethyia_glory_self: (b) => `${b.elem ?? ''}伤害加成 / 暴击率加成`,
  carlotta_skill_cond:    (b) => `${b.elem ?? ''}伤害加成 / 共鸣技能伤害加成`,
  phoebe_lightnoise_cond:(b) => `暴击率加成 / ${b.elem ?? ''}伤害加成`,
  brant_burst_cond:       (b) => `${b.elem ?? ''}伤害加成（全队） / 共鸣解放伤害加成`,
  cantarella_void_cond:   (b) => `攻击加成 / 共鸣解放伤害加成`,
  brant_path_cond:        (b) => `暴击率加成 / ${b.elem ?? ''}伤害加成`,
  brant_mottle_cond:      (b) => `${b.elem ?? ''}伤害加成 / 延奏接力${b.elem ?? ''}伤害加成`,
  feixue_snow_cond:       (b) => `${b.elem ?? ''}伤害加成 / 落雪暴击或接力${b.elem ?? ''}伤害加成`,
  lumera_chord_cond:      () => '谐度破坏增幅（全队点数）',
};

/** 把套装 bonus 渲染成中文效果描述一行字 */
export function formatSetBonus(bonus) {
  if (!bonus || !bonus.type) return '';
  const label = SET_BONUS_TYPE_LABEL[bonus.type];
  const prefix = label ? label(bonus) : bonus.type;
  const valueStr = bonus.flat ? `+${bonus.value} 点` : `+${(bonus.value * 100).toFixed(0)}%`;
  const condStr = bonus.cond ? `（${bonus.cond}）` : '';
  return `${prefix} ${valueStr}${condStr}`;
}
