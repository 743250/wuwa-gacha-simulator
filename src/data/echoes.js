/**
 * 声骸图鉴与套装数据
 *
 * 数据来源:
 *   - encore.moe API (https://api-v2.encore.moe/api/zh-Hans/echo)
 *   - mc.appfeng.com 交叉核验
 *   - 游戏内数据交叉核验
 *
 * 采集日期: 2026-06-29
 *
 * 注意:
 *   - 声骸可属于多个套装 (FetterGroups)
 *   - 同名异相版本 (异相·) 套装与普通版可能不同
 *   - 梦魇版本 (梦魇·) 套装与原版可能不同
 *   - API Element 字段对部分声骸误标, 已按实际属性手动修正
 */

// ==================== 声骸图鉴 ====================

export const ECHO_CATALOG = [

  // --- COST 4 ---
  { id: 'heron', name: '哀声鸷', cost: 4, set: 'spectro', element: '衍射', source: '世界BOSS' },
  { id: 'brant_echo', name: '布兰特', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'camellia_echo', name: '椿', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'feilian', name: '飞廉之猩', cost: 4, set: 'wind', element: '气动', source: '世界BOSS' },
  { id: 'phoebe_echo', name: '菲比', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'echo_dania', name: '共鸣回响·达妮娅', cost: 4, set: 'brant_mottle', element: '热熔', source: '周本BOSS' },
  { id: 'rm_finlake', name: '共鸣回响·芬莱克', cost: 4, set: ['lost_dream', 'sync_law'], element: '湮灭', source: '周本BOSS' },
  { id: 'fludeer_formless', name: '共鸣回响·芙露德莉斯', cost: 4, set: ['cartethyia_wind', 'cartethyia_glory'], element: '导电', source: '周本BOSS' },
  { id: 'rm_adam_hammer', name: '共鸣回响·梦魇亚当·重锤', cost: 4, set: 'ghost_nightmare', element: '湮灭', source: '周本BOSS' },
  { id: 'rm_leviathan', name: '共鸣回响·鸣式·利维亚坦', cost: 4, set: ['hunt_shadow', 'cantarella_void'], element: '湮灭', source: '周本BOSS' },
  { id: 'rm_virtual_god', name: '共鸣回响·鸣式·虚造神型', cost: 4, set: 'feixue_snow', element: '冷凝', source: '周本BOSS' },
  { id: 'havia', name: '海维夏', cost: 4, set: ['backlight_vow', 'gold_truth'], element: '衍射', source: '世界BOSS' },
  { id: 'sea_maiden', name: '海之女', cost: 4, set: 'glory_forge', element: '冷凝', source: '世界BOSS' },
  { id: 'hectate', name: '赫卡忒', cost: 4, set: 'coord', element: '湮灭', source: '周本BOSS' },
  { id: 'glacio_prism', name: '辉萤军势', cost: 4, set: 'frost', element: '冷凝', source: '世界BOSS' },
  { id: 'jue', name: '角', cost: 4, set: ['spectro', 'energy_new', 'coord'], element: '衍射', source: '周本BOSS' },
  { id: 'jinxi_echo', name: '今汐', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'mech', name: '聚械机偶', cost: 4, set: 'atk', element: '导电', source: '世界BOSS' },
  { id: 'kakaro_echo', name: '卡卡罗', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'cartethyia_echo', name: '卡提希娅', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'cantarella_echo', name: '坎特蕾拉', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'carlotta_echo', name: '珂莱塔', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'rider', name: '燎照之骑', cost: 4, set: 'fire', element: '热熔', source: '世界BOSS' },
  { id: 'core_machine', name: '炉芯机骸', cost: 4, set: ['star_ring', 'brant_mottle'], element: '热熔', source: '世界BOSS' },
  { id: 'lorelei', name: '罗蕾莱', cost: 4, set: 'havoc_new', element: '导电', source: '世界BOSS' },
  { id: 'rococo_echo', name: '洛可可', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'nm_heron', name: '梦魇·哀声鸷', cost: 4, set: 'phoebe_lightnoise', element: '衍射', source: '梦魇副本' },
  { id: 'nm_feilian', name: '梦魇·飞廉之猩', cost: 4, set: 'wind', element: '气动', source: '梦魇副本' },
  { id: 'nm_hectate', name: '梦魇·赫卡忒', cost: 4, set: 'lost_dream', element: '湮灭', source: '梦魇副本' },
  { id: 'nm_glaze', name: '梦魇·辉萤军势', cost: 4, set: ['carlotta_skill', 'coord'], element: '冷凝', source: '梦魇副本' },
  { id: 'nm_kelpie', name: '梦魇·凯尔匹', cost: 4, set: ['cartethyia_wind', 'cartethyia_glory'], element: '冷凝', source: '梦魇副本' },
  { id: 'nm_rider', name: '梦魇·燎照之骑', cost: 4, set: 'fire', element: '热熔', source: '梦魇副本' },
  { id: 'nm_thunder', name: '梦魇·朔雷之鳞', cost: 4, set: ['thunder', 'coord'], element: '导电', source: '梦魇副本' },
  { id: 'nm_aix', name: '梦魇·无常凶鹭', cost: 4, set: 'havoc_new', element: '湮灭', source: '梦魇副本' },
  { id: 'nm_crownless', name: '梦魇·无冠者', cost: 4, set: 'havoc', element: '湮灭', source: '梦魇副本' },
  { id: 'nm_lumiscale', name: '梦魇·云闪之鳞', cost: 4, set: 'thunder', element: '导电', source: '梦魇副本' },
  { id: 'turtle', name: '鸣钟之龟', cost: 4, set: ['energy', 'heal'], element: '冷凝', source: '周本BOSS' },
  { id: 'brant_lion', name: '荣耀狮像', cost: 4, set: 'brant_burst', element: '热熔', source: '世界BOSS' },
  { id: 'shorekeeper_echo', name: '守岸人', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'thunder', name: '朔雷之鳞', cost: 4, set: ['thunder', 'coord'], element: '导电', source: '世界BOSS' },
  { id: 'sigh_dragon', name: '叹息古龙', cost: 4, set: 'energy_new', element: '导电', source: '世界BOSS' },
  { id: 'fake_god_king', name: '伪作的神王', cost: 4, set: 'glory_forge', element: '湮灭', source: '世界BOSS' },
  { id: 'aix', name: '无常凶鹭', cost: 4, set: 'energy', element: '湮灭', source: '世界BOSS' },
  { id: 'crownless', name: '无冠者', cost: 4, set: 'havoc', element: '湮灭', source: '世界BOSS' },
  { id: 'fallacy', name: '无归的谬误', cost: 4, set: 'heal', element: '衍射', source: '世界BOSS' },
  { id: 'nameless_seeker', name: '无铭探索者', cost: 4, set: ['echo_wish', 'lumera_chord'], element: '气动', source: '世界BOSS' },
  { id: 'dreamless', name: '无妄者', cost: 4, set: ['havoc', 'energy_new'], element: '湮灭', source: '周本BOSS' },
  { id: 'xingleim', name: '辛吉勒姆', cost: 4, set: 'brant_path', element: '热熔', source: '世界BOSS' },
  { id: 'mecha_armed', name: '异构武装', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'alt_heron', name: '异相·哀声鸷', cost: 4, set: 'spectro', element: '衍射', source: '世界BOSS' },
  { id: 'alt_feilian', name: '异相·飞廉之猩', cost: 4, set: ['wind', 'heal'], element: '气动', source: '世界BOSS' },
  { id: 'alt_rider', name: '异相·燎照之骑', cost: 4, set: 'fire', element: '热熔', source: '世界BOSS' },
  { id: 'alt_core_machine', name: '异相·炉芯机骸', cost: 4, set: ['star_ring', 'brant_mottle'], element: '热熔', source: '世界BOSS' },
  { id: 'alt_lorelei', name: '异相·罗蕾莱', cost: 4, set: 'havoc_new', element: '湮灭', source: '世界BOSS' },
  { id: 'alt_nm_rider', name: '异相·梦魇·燎照之骑', cost: 4, set: 'fire', element: '导电', source: '世界BOSS' },
  { id: 'alt_nm_crownless', name: '异相·梦魇·无冠者', cost: 4, set: 'havoc', element: '导电', source: '世界BOSS' },
  { id: 'alt_fake_god_king', name: '异相·伪作的神王', cost: 4, set: 'glory_forge', element: '衍射', source: '世界BOSS' },
  { id: 'alt_aix', name: '异相·无常凶鹭', cost: 4, set: 'energy', element: '湮灭', source: '世界BOSS' },
  { id: 'alt_crownless', name: '异相·无冠者', cost: 4, set: 'havoc', element: '湮灭', source: '世界BOSS' },
  { id: 'alt_fallacy', name: '异相·无归的谬误', cost: 4, set: 'heal', element: '衍射', source: '世界BOSS' },
  { id: 'alt_dreamless', name: '异相·无妄者', cost: 4, set: 'havoc', element: '湮灭', source: '世界BOSS' },
  { id: 'alt_xingleim', name: '异相·辛吉勒姆', cost: 4, set: 'brant_path', element: '热熔', source: '世界BOSS' },
  { id: 'alt_mecha_armed', name: '异相·异构武装', cost: 4, set: 'thunder', element: '导电', source: '世界BOSS' },
  { id: 'alt_lumiscale', name: '异相·云闪之鳞', cost: 4, set: 'thunder', element: '导电', source: '世界BOSS' },
  { id: 'lumiscale', name: '云闪之鳞', cost: 4, set: 'thunder', element: '导电', source: '世界BOSS' },
  { id: 'zani_echo', name: '赞妮', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },
  { id: 'changli_echo', name: '长离', cost: 4, set: 'carlotta_skill', element: '导电', source: '世界BOSS' },

  // --- COST 3 ---
  { id: 'knight_dark', name: '暗夜骑士', cost: 3, set: ['havoc_new', 'coord'], element: '导电', source: '精英' },
  { id: 'dark_wolf', name: '暗鬃狼', cost: 3, set: ['fire', 'havoc'], element: '湮灭', source: '精英' },
  { id: 'wind_rider', name: '车刃镰', cost: 3, set: ['energy', 'wind'], element: '气动', source: '精英' },
  { id: 'blade_noble', name: '持刃贵族', cost: 3, set: ['energy_new', 'havoc_new', 'cantarella_void'], element: '导电', source: '精英' },
  { id: 'preach_remnant', name: '传道者的遗形', cost: 3, set: ['cartethyia_glory', 'brant_burst'], element: '衍射', source: '精英' },
  { id: 'thorn_mush', name: '刺玫菇', cost: 3, set: ['frost', 'havoc'], element: '湮灭', source: '精英' },
  { id: 'noble_poison', name: '毒冠贵族', cost: 3, set: ['coord', 'carlotta_skill'], element: '导电', source: '精英' },
  { id: 'wind_scale_shell', name: '风鳞蜃甲', cost: 3, set: ['gold_truth', 'feixue_snow'], element: '衍射', source: '精英' },
  { id: 'float_doll', name: '浮灵偶', cost: 3, set: ['energy_new', 'coord', 'lost_dream'], element: '导电', source: '精英' },
  { id: 'gromma_diagram', name: '格洛犸图', cost: 3, set: ['brant_path', 'feixue_snow'], element: '衍射', source: '精英' },
  { id: 'echo_crown_falcon', name: '共鸣回响·冠顶苍隼', cost: 3, set: ['brant_path', 'brant_mottle'], element: '气动', source: '周本BOSS' },
  { id: 'crown_mech_falcon', name: '冠顶械隼', cost: 3, set: ['brant_path', 'brant_mottle'], element: '热熔', source: '精英' },
  { id: 'knight_light', name: '幻昼骑士', cost: 3, set: ['phoebe_lightnoise', 'energy_new'], element: '导电', source: '精英' },
  { id: 'rock_fighter', name: '坚岩斗士', cost: 3, set: ['heal', 'energy'], element: '物理', source: '精英' },
  { id: 'arrow_bear', name: '箭簇熊', cost: 3, set: ['atk', 'energy'], element: '物理', source: '精英' },
  { id: 'horned_croc', name: '角鳄', cost: 3, set: ['cartethyia_glory', 'brant_burst', 'hunt_shadow'], element: '衍射', source: '精英' },
  { id: 'giant_doll', name: '巨布偶', cost: 3, set: ['fire', 'thunder'], element: '导电', source: '精英' },
  { id: 'wind_baby_dragon', name: '飓力熊', cost: 3, set: ['energy_new', 'cartethyia_wind', 'glory_forge'], element: '气动', source: '精英' },
  { id: 'saw_iron_shadow', name: '锯袭铁影', cost: 3, set: ['backlight_vow', 'star_ring', 'echo_wish'], element: '衍射', source: '精英' },
  { id: 'mine_elk', name: '矿岩机麋', cost: 3, set: ['backlight_vow', 'lumera_chord'], element: '衍射', source: '精英' },
  { id: 'glass_blade', name: '琉璃刀伶', cost: 3, set: ['coord', 'phoebe_lightnoise'], element: '导电', source: '精英' },
  { id: 'green_lava', name: '绿熔蜥', cost: 3, set: ['energy', 'fire'], element: '热熔', source: '精英' },
  { id: 'nm_thorn_mush', name: '梦魇·刺玫菇', cost: 3, set: 'cantarella_void', element: '湮灭', source: '梦魇副本' },
  { id: 'nm_green_lava', name: '梦魇·绿熔蜥', cost: 3, set: 'hunt_shadow', element: '热熔', source: '梦魇副本' },
  { id: 'nm_green_heron', name: '梦魇·青羽鹭', cost: 3, set: 'sync_law', element: '气动', source: '梦魇副本' },
  { id: 'nm_echo_bard', name: '梦魇·振铎乐师', cost: 3, set: 'lost_dream', element: '湮灭', source: '梦魇副本' },
  { id: 'nm_purple_heron', name: '梦魇·紫羽鹭', cost: 3, set: 'glory_forge', element: '导电', source: '梦魇副本' },
  { id: 'mirage_moth', name: '迷胧幻蛾', cost: 3, set: 'lumera_chord', element: '衍射', source: '精英' },
  { id: 'abyss_guard', name: '冥渊守卫', cost: 3, set: ['atk', 'heal'], element: '湮灭', source: '精英' },
  { id: 'water_noble', name: '凝水贵族', cost: 3, set: ['carlotta_skill', 'phoebe_lightnoise'], element: '导电', source: '精英' },
  { id: 'rock_guard', name: '磐石守卫', cost: 3, set: ['heal', 'spectro'], element: '衍射', source: '精英' },
  { id: 'green_heron', name: '青羽鹭', cost: 3, set: ['wind', 'spectro'], element: '气动', source: '精英' },
  { id: 'glory_envoy_3', name: '荣光节使', cost: 3, set: ['cartethyia_wind', 'phoebe_lightnoise', 'cartethyia_glory'], element: '气动', source: '精英' },
  { id: 'spine_dragon', name: '蚀脊龙', cost: 3, set: ['brant_burst', 'hunt_shadow'], element: '热熔', source: '精英' },
  { id: 'plant_elk', name: '莳植机麋', cost: 3, set: ['gold_truth', 'lumera_chord'], element: '衍射', source: '精英' },
  { id: 'dual_star_gun', name: '双极·星升辉铳', cost: 3, set: ['gold_truth', 'brant_mottle'], element: '衍射', source: '精英' },
  { id: 'dual_abyss_blade', name: '双极·渊陨重锋', cost: 3, set: ['gold_truth', 'brant_path', 'echo_wish'], element: '衍射', source: '精英' },
  { id: 'frost_scale_shell', name: '霜鳞蜃甲', cost: 3, set: ['star_ring', 'feixue_snow'], element: '冷凝', source: '精英' },
  { id: 'beast', name: '踏光兽', cost: 3, set: 'spectro', element: '衍射', source: '精英' },
  { id: 'tunnel_heavy', name: '探隧重机', cost: 3, set: ['star_ring', 'brant_mottle', 'echo_wish'], element: '衍射', source: '精英' },
  { id: 'play_ape', name: '戏猿', cost: 3, set: ['heal', 'wind'], element: '气动', source: '精英' },
  { id: 'snow_wolf', name: '雪鬃狼', cost: 3, set: ['energy', 'frost'], element: '冷凝', source: '精英' },
  { id: 'patrol_mech', name: '巡哨机傀', cost: 3, set: ['spectro', 'frost'], element: '冷凝', source: '精英' },
  { id: 'tour_knight', name: '巡游骑士', cost: 3, set: ['carlotta_skill', 'havoc_new'], element: '导电', source: '精英' },
  { id: 'alt_float_doll', name: '异相·浮灵偶', cost: 3, set: ['energy_new', 'coord', 'lost_dream'], element: '导电', source: '精英' },
  { id: 'alt_gromma', name: '异相·格洛犸图', cost: 3, set: ['brant_path', 'feixue_snow'], element: '衍射', source: '精英' },
  { id: 'alt_crown_falcon', name: '异相·冠顶苍隼', cost: 3, set: ['brant_path', 'brant_mottle'], element: '热熔', source: '精英' },
  { id: 'alt_horned_croc', name: '异相·角鳄', cost: 3, set: ['cartethyia_glory', 'brant_burst'], element: '衍射', source: '精英' },
  { id: 'alt_giant_doll', name: '异相·巨布偶', cost: 3, set: ['havoc_new', 'carlotta_skill'], element: '导电', source: '精英' },
  { id: 'alt_glass_blade', name: '异相·琉璃刀伶', cost: 3, set: ['fire', 'thunder'], element: '导电', source: '精英' },
  { id: 'alt_rock_guard', name: '异相·磐石守卫', cost: 3, set: ['heal', 'spectro', 'carlotta_skill'], element: '衍射', source: '精英' },
  { id: 'alt_glory_envoy', name: '异相·荣光节使', cost: 3, set: ['cartethyia_wind', 'phoebe_lightnoise'], element: '气动', source: '精英' },
  { id: 'alt_dual_star_gun', name: '异相·双极·星升辉铳', cost: 3, set: 'gold_truth', element: '衍射', source: '精英' },
  { id: 'alt_dual_abyss_blade', name: '异相·双极·渊陨重锋', cost: 3, set: 'gold_truth', element: '衍射', source: '精英' },
  { id: 'alt_beast', name: '异相·踏光兽', cost: 3, set: 'havoc', element: '湮灭', source: '精英' },
  { id: 'alt_tour_knight', name: '异相·巡游骑士', cost: 3, set: ['fire', 'thunder'], element: '导电', source: '精英' },
  { id: 'alt_swim_mech', name: '异相·游鳞机枢', cost: 3, set: ['thunder', 'frost'], element: '冷凝', source: '精英' },
  { id: 'stealth_iron_shadow', name: '隐迹铁影', cost: 3, set: ['backlight_vow', 'star_ring', 'echo_wish'], element: '衍射', source: '精英' },
  { id: 'swim_mech', name: '游鳞机枢', cost: 3, set: ['thunder', 'frost'], element: '冷凝', source: '精英' },
  { id: 'echo_bard', name: '振铎乐师', cost: 3, set: ['frost', 'havoc'], element: '湮灭', source: '精英' },
  { id: 'heavy_iron_hoof', name: '重工铁蹄', cost: 3, set: ['backlight_vow', 'feixue_snow', 'lumera_chord'], element: '衍射', source: '精英' },
  { id: 'statue_fist', name: '重塑雕像的拳砾', cost: 3, set: ['phoebe_lightnoise', 'cartethyia_wind', 'sync_law'], element: '衍射', source: '精英' },
  { id: 'purple_heron', name: '紫羽鹭', cost: 3, set: ['fire', 'thunder'], element: '导电', source: '精英' },
  { id: 'hymn_bard', name: '奏谕乐师', cost: 3, set: ['atk', 'thunder', 'havoc_new', 'phoebe_lightnoise'], element: '湮灭', source: '精英' },

  // --- COST 1 ---
  { id: 'a_zizi', name: '阿嗞嗞', cost: 1, set: ['energy', 'atk', 'spectro', 'havoc_new', 'coord', 'carlotta_skill'], element: '衍射', source: '普通' },
  { id: 'ice_dancer', name: '冰盈舞者', cost: 1, set: ['brant_path', 'feixue_snow', 'lumera_chord'], element: '衍射', source: '普通' },
  { id: 'shock_tremor', name: '颤栗战士', cost: 1, set: ['star_ring', 'brant_mottle', 'feixue_snow'], element: '衍射', source: '普通' },
  { id: 'mercy_envoy', name: '慈悲节使', cost: 1, set: ['cartethyia_wind', 'cartethyia_glory'], element: '气动', source: '普通' },
  { id: 'thorn_mush_juv', name: '刺玫菇（稚形）', cost: 1, set: ['wind', 'havoc'], element: '湮灭', source: '普通' },
  { id: 'dingdong', name: '叮咚咚', cost: 1, set: ['spectro', 'frost'], element: '冷凝', source: '普通' },
  { id: 'burrow_rat', name: '遁地鼠', cost: 1, set: ['frost', 'havoc'], element: '湮灭', source: '普通' },
  { id: 'windmane_wolf', name: '风鬃狼', cost: 1, set: ['carlotta_skill', 'coord'], element: '冷凝', source: '普通' },
  { id: 'pup_haid', name: '浮灵偶·海德', cost: 1, set: ['phoebe_lightnoise', 'energy_new'], element: '衍射', source: '普通' },
  { id: 'pup_lite', name: '浮灵偶·莱特', cost: 1, set: ['energy_new', 'carlotta_skill'], element: '冷凝', source: '普通' },
  { id: 'pup_lieve', name: '浮灵偶·蕾弗', cost: 1, set: ['carlotta_skill', 'energy_new'], element: '冷凝', source: '普通' },
  { id: 'puppet_fore', name: '工头布偶', cost: 1, set: ['phoebe_lightnoise', 'energy_new'], element: '衍射', source: '普通' },
  { id: 'coo_puffer', name: '咕咕河豚', cost: 1, set: ['spectro', 'frost', 'havoc_new'], element: '冷凝', source: '普通' },
  { id: 'frost_turtle', name: '寒霜陆龟', cost: 1, set: ['spectro', 'frost'], element: '冷凝', source: '普通' },
  { id: 'hoo_hoo', name: '呼咻咻', cost: 1, set: ['heal', 'energy', 'wind'], element: '气动', source: '普通' },
  { id: 'fire_wolf', name: '火鬃狼', cost: 1, set: ['heal', 'fire'], element: '热熔', source: '普通' },
  { id: 'miss_lonely', name: '寂寞小姐', cost: 1, set: ['energy', 'atk', 'spectro'], element: '衍射', source: '普通' },
  { id: 'shock_hunter', name: '惊蛰猎手', cost: 1, set: ['fire', 'thunder'], element: '导电', source: '普通' },
  { id: 'scorpion', name: '晶螯蝎', cost: 1, set: ['energy', 'atk'], element: '物理', source: '普通' },
  { id: 'pufferfish', name: '啾啾河豚', cost: 1, set: ['havoc', 'wind'], element: '气动', source: '普通' },
  { id: 'kacha', name: '咔嚓嚓', cost: 1, set: ['atk', 'heal', 'fire'], element: '热熔', source: '普通' },
  { id: 'faith_puppet', name: '苦信者的作俑', cost: 1, set: ['cartethyia_wind', 'cartethyia_glory', 'brant_burst'], element: '衍射', source: '普通' },
  { id: 'mine_bee', name: '矿岩熊蜂', cost: 1, set: ['star_ring', 'gold_truth', 'echo_wish', 'lumera_chord'], element: '衍射', source: '普通' },
  { id: 'thunder_wolf', name: '雷鬃狼', cost: 1, set: ['coord', 'havoc_new'], element: '湮灭', source: '普通' },
  { id: 'frost_prism', name: '冷凝棱镜', cost: 1, set: ['havoc', 'energy', 'frost'], element: '冷凝', source: '普通' },
  { id: 'fission_rock', name: '裂变幼岩', cost: 1, set: ['energy', 'thunder', 'heal'], element: '物理', source: '普通' },
  { id: 'green_lava_juv', name: '绿熔蜥（稚形）', cost: 1, set: ['atk', 'thunder', 'fire'], element: '热熔', source: '普通' },
  { id: 'nm_thorn_mush_juv', name: '梦魇·刺玫菇（稚形）', cost: 1, set: 'hunt_shadow', element: '湮灭', source: '梦魇副本' },
  { id: 'nm_coo_puffer', name: '梦魇·咕咕河豚', cost: 1, set: 'sync_law', element: '冷凝', source: '梦魇副本' },
  { id: 'nm_shock_hunter', name: '梦魇·惊蛰猎手', cost: 1, set: 'glory_forge', element: '导电', source: '梦魇副本' },
  { id: 'nm_chirp_puffer', name: '梦魇·啾啾河豚', cost: 1, set: 'sync_law', element: '气动', source: '梦魇副本' },
  { id: 'nm_green_lava_juv', name: '梦魇·绿熔蜥（稚形）', cost: 1, set: 'hunt_shadow', element: '热熔', source: '梦魇副本' },
  { id: 'nm_frost_hunter', name: '梦魇·破霜猎手', cost: 1, set: 'lost_dream', element: '冷凝', source: '梦魇副本' },
  { id: 'nm_judge_warrior', name: '梦魇·审判战士', cost: 1, set: 'lost_dream', element: '湮灭', source: '梦魇副本' },
  { id: 'nm_roar_croak', name: '梦魇·呜咔咔', cost: 1, set: 'cantarella_void', element: '湮灭', source: '梦魇副本' },
  { id: 'nm_patrol_hunter', name: '梦魇·巡徊猎手', cost: 1, set: 'glory_forge', element: '气动', source: '梦魇副本' },
  { id: 'nm_ostrich', name: '梦魇·侏侏鸵', cost: 1, set: 'cantarella_void', element: '物理', source: '梦魇副本' },
  { id: 'cry_warrior', name: '鸣泣战士', cost: 1, set: ['wind', 'thunder', 'fire'], element: '热熔', source: '普通' },
  { id: 'magician', name: '魔术先生', cost: 1, set: ['carlotta_skill', 'coord'], element: '冷凝', source: '普通' },
  { id: 'doc_pipip', name: '噼啪啪', cost: 1, set: ['backlight_vow', 'gold_truth', 'brant_mottle', 'echo_wish'], element: '衍射', source: '普通' },
  { id: 'frost_hunter', name: '破霜猎手', cost: 1, set: ['spectro', 'frost'], element: '冷凝', source: '普通' },
  { id: 'treasure', name: '欺诈奇藏', cost: 1, set: ['havoc_new', 'coord', 'carlotta_skill'], element: '衍射', source: '普通' },
  { id: 'wind_prism', name: '气动棱镜', cost: 1, set: ['phoebe_lightnoise', 'energy_new'], element: '气动', source: '普通' },
  { id: 'fire_prism', name: '热熔棱镜', cost: 1, set: ['frost', 'atk', 'fire'], element: '热熔', source: '普通' },
  { id: 'fire_bug', name: '融火虫', cost: 1, set: ['atk', 'fire'], element: '热熔', source: '普通' },
  { id: 'pardon_envoy_1', name: '赦罪节使', cost: 1, set: ['cartethyia_wind', 'phoebe_lightnoise', 'brant_burst'], element: '衍射', source: '普通' },
  { id: 'judge_warrior', name: '审判战士', cost: 1, set: ['spectro', 'havoc'], element: '湮灭', source: '普通' },
  { id: 'plant_bee', name: '莳植熊蜂', cost: 1, set: ['backlight_vow', 'gold_truth', 'echo_wish', 'lumera_chord'], element: '衍射', source: '普通' },
  { id: 'frost_wolf_phoebe', name: '霜鬃狼', cost: 1, set: ['havoc_new', 'phoebe_lightnoise'], element: '衍射', source: '普通' },
  { id: 'tusk_boar', name: '碎獠猪', cost: 1, set: ['energy', 'wind', 'frost'], element: '物理', source: '普通' },
  { id: 'light_doll', name: '通行灯偶', cost: 1, set: ['thunder', 'wind', 'fire'], element: '物理', source: '普通' },
  { id: 'crown_envoy', name: '卫冕节使', cost: 1, set: ['cartethyia_wind', 'havoc_new', 'brant_burst'], element: '衍射', source: '普通' },
  { id: 'roar_croak', name: '呜咔咔', cost: 1, set: ['atk', 'heal', 'havoc', 'spectro', 'frost'], element: '湮灭', source: '普通' },
  { id: 'vanguard_rock', name: '先锋幼岩', cost: 1, set: ['heal', 'thunder', 'atk'], element: '物理', source: '普通' },
  { id: 'thunder_whelp', name: '小翼龙·导电', cost: 1, set: ['cartethyia_wind', 'havoc_new', 'brant_burst'], element: '导电', source: '普通' },
  { id: 'ice_whelp', name: '小翼龙·冷凝', cost: 1, set: ['cartethyia_wind', 'cartethyia_glory'], element: '冷凝', source: '普通' },
  { id: 'air_whelp', name: '小翼龙·气动', cost: 1, set: ['cartethyia_wind', 'energy_new', 'brant_burst'], element: '气动', source: '普通' },
  { id: 'fire_whelp', name: '小翼龙·热熔', cost: 1, set: ['brant_burst', 'cartethyia_glory'], element: '热熔', source: '普通' },
  { id: 'havoc_whelp', name: '小翼龙·湮灭', cost: 1, set: ['brant_burst', 'cartethyia_glory', 'cantarella_void'], element: '湮灭', source: '普通' },
  { id: 'light_whelp', name: '小翼龙·衍射', cost: 1, set: ['brant_burst', 'cartethyia_glory'], element: '衍射', source: '普通' },
  { id: 'patrol_hunter', name: '巡徊猎手', cost: 1, set: ['thunder', 'wind'], element: '气动', source: '普通' },
  { id: 'havoc_prism', name: '湮灭棱镜', cost: 1, set: ['thunder', 'spectro', 'havoc'], element: '湮灭', source: '普通' },
  { id: 'rock_spider', name: '岩蛛S4型', cost: 1, set: ['backlight_vow', 'star_ring', 'brant_path'], element: '衍射', source: '普通' },
  { id: 'light_prism', name: '衍射棱镜', cost: 1, set: ['fire', 'thunder', 'spectro'], element: '衍射', source: '普通' },
  { id: 'alt_ice_dancer', name: '异相·冰盈舞者', cost: 1, set: 'brant_path', element: '热熔', source: '普通' },
  { id: 'alt_dingdong', name: '异相·叮咚咚', cost: 1, set: ['spectro', 'frost'], element: '冷凝', source: '普通' },
  { id: 'alt_puppet_fore', name: '异相·工头布偶', cost: 1, set: ['energy', 'atk', 'spectro'], element: '衍射', source: '普通' },
  { id: 'alt_coo_puffer', name: '异相·咕咕河豚', cost: 1, set: ['spectro', 'frost'], element: '冷凝', source: '普通' },
  { id: 'alt_frost_turtle', name: '异相·寒霜陆龟', cost: 1, set: ['spectro', 'frost', 'carlotta_skill', 'coord'], element: '冷凝', source: '普通' },
  { id: 'alt_pipip', name: '异相·噼啪啪', cost: 1, set: ['backlight_vow', 'gold_truth'], element: '衍射', source: '普通' },
  { id: 'alt_treasure', name: '异相·欺诈奇藏', cost: 1, set: ['havoc_new', 'coord', 'carlotta_skill'], element: '衍射', source: '普通' },
  { id: 'alt_shadow_fire', name: '异相·幽翎火', cost: 1, set: ['havoc_new', 'phoebe_lightnoise'], element: '衍射', source: '普通' },
  { id: 'alt_cloud_fairy', name: '异相·云海妖精', cost: 1, set: ['coord', 'havoc_new'], element: '湮灭', source: '普通' },
  { id: 'shadow_glim', name: '影烁者', cost: 1, set: ['brant_path', 'brant_mottle', 'feixue_snow'], element: '衍射', source: '普通' },
  { id: 'shadow_fire', name: '幽翎火', cost: 1, set: ['havoc_new', 'phoebe_lightnoise', 'lost_dream'], element: '衍射', source: '普通' },
  { id: 'drift_butterfly', name: '游弋蝶', cost: 1, set: ['heal', 'energy', 'spectro'], element: '衍射', source: '普通' },
  { id: 'baby_ape', name: '幼猿', cost: 1, set: ['atk', 'wind'], element: '气动', source: '普通' },
  { id: 'glaze_rock', name: '釉变幼岩', cost: 1, set: ['energy_new', 'coord', 'glory_forge'], element: '冷凝', source: '普通' },
  { id: 'fancy_gold_rock', name: '愚金幼岩', cost: 1, set: ['phoebe_lightnoise', 'carlotta_skill', 'sync_law'], element: '衍射', source: '普通' },
  { id: 'cloud_fairy', name: '云海妖精', cost: 1, set: ['coord', 'havoc_new', 'hunt_shadow'], element: '衍射', source: '普通' },
  { id: 'ostrich', name: '侏侏鸵', cost: 1, set: ['wind', 'heal'], element: '物理', source: '普通' },
];

// ==================== 套装效果 ====================

export const ECHO_SETS = [
  // ======== 1.0 基础元素套装 (9套) ========
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
    bonus5: { type: 'elem_dmg_cond', value: 0.30, elem: '衍射', cond: '变奏入场后,持续15秒' } },

  { id: 'havoc',    name: '沉日劫明', element: '湮灭',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '湮灭' },
    bonus5: { type: 'elem_dmg_cond', value: 0.075, elem: '湮灭', cond: '普攻或重击命中,可叠4层,持续15秒' } },

  { id: 'heal',     name: '隐世回光', element: null,
    bonus2: { type: 'heal_bonus', value: 0.10 },
    bonus5: { type: 'atk_team_flat', value: 0.15, cond: '为队友治疗后,全队攻击+15%,持续30秒' } },

  { id: 'energy',   name: '轻云出月', element: null,
    bonus2: { type: 'resonance_efficiency', value: 0.10 },
    bonus5: { type: 'atk_next_flat', value: 0.225, cond: '延奏后下一登场角色攻击+22.5%,持续15秒' } },

  { id: 'atk',      name: '不绝余音', element: null,
    bonus2: { type: 'atk_pct', value: 0.10 },
    bonus5: { type: 'atk_pct_stack', value: 0.05, cond: '在场时每1.5秒+5%,可叠4层' } },

  // ======== 2.0 套装 ========
  { id: 'havoc_new', name: '幽夜隐匿之帷', element: '湮灭',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '湮灭' },
    bonus5: { type: 'havoc_veil_cond', value: 4.80, valueAlt: 0.15, elem: '湮灭', cond: '延奏离场时额外480%湮灭伤害(延奏技能伤害),下一位登场角色湮灭+15%,持续15秒' } },

  { id: 'coord', name: '高天共奏之曲', element: null,
    bonus2: { type: 'resonance_efficiency', value: 0.10 },
    bonus5: { type: 'coord_dmg', value: 0.80, cond: '协同攻击伤害+80%;协同攻击命中暴击时,登场角色攻击+20%,持续4秒' } },

  { id: 'energy_new', name: '无惧浪涛之勇', element: null,
    bonus2: { type: 'resonance_efficiency', value: 0.10 },
    bonus5: { type: 'atk_pct_elem', value: 0.15, cond: '攻击+15%,共鸣效率达250%后全属性伤害+30%' } },

  // ======== 角色专属套装 (2.0+) ========
  // ID 10 · 珂莱塔专属「凌冽决断之心」
  { id: 'carlotta_skill', name: '凌冽决断之心', element: '冷凝',
    bonus2: { type: 'skill_dmg', value: 0.12 },
    bonus5: { type: 'carlotta_skill_cond', value: 0.225, valueAlt: 0.18, elem: '冷凝', cond: '施放共鸣技能时自身冷凝+22.5%(15秒) / 施放共鸣解放时共鸣技能+18%(5秒,可叠2层)' } },

  // ID 11 · 菲比专属「此间永驻之光」
  { id: 'phoebe_lightnoise', name: '此间永驻之光', element: '衍射',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '衍射' },
    bonus5: { type: 'phoebe_lightnoise_cond', value: 0.20, valueAlt: 0.15, crate: 0.20, elem: '衍射', cond: '添加光噪效应时自身暴击+20%(15秒) / 攻击10层光噪目标时自身衍射+15%(15秒)' } },

  // ID 16 · 卡提希娅专属「流云逝尽之空」
  { id: 'cartethyia_wind', name: '流云逝尽之空', element: '气动',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '气动' },
    bonus5: { type: 'cartethyia_wind_team', value: 0.15, extraSelf: 0.15, elem: '气动', cond: '添加风蚀效应时全队气动+15% / 自身额外+15%,持续20秒' } },

  // ID 17 · 卡提希娅专属「愿戴荣光之旅」
  { id: 'cartethyia_glory', name: '愿戴荣光之旅', element: '气动',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '气动' },
    bonus5: { type: 'cartethyia_glory_self', value: 0.30, crate: 0.10, elem: '气动', cond: '命中风蚀目标时自身暴击+10% / 气动+30%,持续10秒' } },

  // ID 18 · 布兰特专属「奔狼燎原之焰」
  { id: 'brant_burst', name: '奔狼燎原之焰', element: '热熔',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '热熔' },
    bonus5: { type: 'brant_burst_cond', value: 0.15, valueSelf: 0.20, elem: '热熔', cond: '施放共鸣解放时全队热熔+15% / 自身解放+20%,持续35秒' } },

  // ID 23 · 坎特蕾拉专属「命理崩毁之弦」(3件套)
  { id: 'cantarella_void', name: '命理崩毁之弦', element: '湮灭',
    bonus2: null,
    bonus5: { type: 'cantarella_void_cond', value: 0.20, valueAlt: 0.30, elem: '湮灭', cond: '添加虚湮效应时自身攻击+20% / 共鸣解放+30%,持续5秒' },
    tier: 3 },

  // ID 27 · 布兰特专属「长路启航之星」
  { id: 'brant_path', name: '长路启航之星', element: '热熔',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '热熔' },
    bonus5: { type: 'brant_path_cond', value: 0.20, elem: '热熔', crate: 0.20, cond: '添加聚爆效应或震谐偏移时自身暴击+20% / 热熔+20%,持续8秒' } },

  // ID 28 · 布兰特专属「斑驳粉饰之沫」
  { id: 'brant_mottle', name: '斑驳粉饰之沫', element: '热熔',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '热熔' },
    bonus5: { type: 'brant_mottle_cond', value: 0.10, valueNext: 0.25, elem: '热熔', cond: '添加聚爆效应时热熔+10%(15秒) / 持续期间延奏后下一位变奏登场角色热熔+25%(15秒)' } },

  // ID 30 · 绯雪专属「雪落无声之愿」
  { id: 'feixue_snow', name: '雪落无声之愿', element: '冷凝',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '冷凝' },
    bonus5: { type: 'feixue_snow_cond', value: 0.10, valueAlt: 0.25, elem: '冷凝', cond: '添加霜渐效应时冷凝+10%(15秒)+获【落雪】11秒(25秒CD) / 落雪+解放时暴击+25%(6秒可续) 或 落雪+延奏时下位冷凝+25%(15秒)' } },

  // ID 31 · 洛瑟菈专属「剪心辑梦之影」(谐度破坏系)
  { id: 'lumera_chord', name: '剪心辑梦之影', element: null,
    bonus2: { type: 'atk_pct', value: 0.10 },
    bonus5: { type: 'lumera_chord_cond', value: 20, elem: null, flat: true, cond: '添加震谐偏移或集谐偏移时全队谐度破坏增幅+20点,持续30秒(同名不叠加)' } },

  // ======== 2.6 新增套装 (9套) ========
  // ID 19 · 失序彼岸之梦 (3件套)
  { id: 'lost_dream', name: '失序彼岸之梦', element: null,
    bonus2: null,
    bonus5: { type: 'lost_dream_cond', value: 0.20, valueAlt: 0.35, cond: '共鸣能量为0时自身暴击率+20%,声骸技能伤害加成+35%' },
    tier: 3 },

  // ID 20 · 荣斗铸锋之冠 (3件套)
  { id: 'glory_forge', name: '荣斗铸锋之冠', element: null,
    bonus2: null,
    bonus5: { type: 'glory_forge_cond', value: 0.06, cdmg: 0.04, stacks: 5, cond: '获得护盾时攻击+6%/暴击伤害+4%,可叠5层,持续4秒,每0.5秒可触发一次' },
    tier: 3 },

  // ID 21 · 息界同调之律 (3件套)
  { id: 'sync_law', name: '息界同调之律', element: null,
    bonus2: null,
    bonus5: { type: 'sync_law_cond', value: 0.30, valueAlt: 0.04, stacks: 4, cond: '施放声骸技能时重击+30%(4秒) / 全队声骸技能+4%(可叠4层,30秒)' },
    tier: 3 },

  // ID 22 · 焚羽猎魔之影 (3件套)
  { id: 'hunt_shadow', name: '焚羽猎魔之影', element: '热熔',
    bonus2: null,
    bonus5: { type: 'hunt_shadow_cond', value: 0.20, valueAlt: 0.16, elem: '热熔', cond: '声骸技能伤害时重击暴击+20%(6秒) / 重击时声骸技能暴击+20%(6秒) / 双效果时热熔+16%' },
    tier: 3 },

  // ID 24 · 逆光跃彩之约 (2+5)
  { id: 'backlight_vow', name: '逆光跃彩之约', element: '衍射',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '衍射' },
    bonus5: { type: 'backlight_vow_cond', value: 0.15, perPoint: 0.003, cap: 0.15, cond: '延奏后下一变奏登场角色攻击+15%,每点谐度破坏增幅额外+0.3%,上限15%,持续15秒' } },

  // ID 25 · 星构寻辉之环 (2+5)
  { id: 'star_ring', name: '星构寻辉之环', element: null,
    bonus2: { type: 'heal_bonus', value: 0.10 },
    bonus5: { type: 'star_ring_cond', value: 0.002, cap: 0.25, cond: '为队友治疗时每1%偏谐值累积效率使全队攻击+0.2%,上限25%,持续4秒(同名不叠加)' } },

  // ID 26 · 流金溯真之式 (2+5)
  { id: 'gold_truth', name: '流金溯真之式', element: '衍射',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '衍射' },
    bonus5: { type: 'gold_truth_cond', value: 0.10, valueAlt: 0.40, stacks: 3, elem: '衍射', cond: '普攻时衍射+10%(可叠3层,5秒) / 叠至3层时解放后普攻+40%' } },

  // ID 29 · 听唤语义之愿 (2+5)
  { id: 'echo_wish', name: '听唤语义之愿', element: '气动',
    bonus2: { type: 'elem_dmg', value: 0.10, elem: '气动' },
    bonus5: { type: 'echo_wish_cond', value: 0.20, valueAlt: 0.15, elem: '气动', cond: '声骸技能伤害时声骸技能暴击+20% / 自身气动+15%,持续5秒' } },

  // ID 32 · 碎梦亡鬼之魇 (1件套)
  { id: 'ghost_nightmare', name: '碎梦亡鬼之魇', element: null,
    bonus2: null,
    bonus5: { type: 'ghost_nightmare_cond', value: 0.35, cond: '添加骇破·偏移时自身普攻伤害和重击伤害+35%,持续15秒' },
    tier: 1 },
];

// ==================== 主词条池 ====================

/**
 * COST 4 主属性池 (5★ Lv.15 数值)
 * 来源: 文档第五节 + encore.moe API 交叉核验
 */
export const MAIN_STAT_POOL = {
  4: [
    { key: 'crate',       label: '暴击率',    value: 0.22 },
    { key: 'cdmg',        label: '暴击伤害',  value: 0.44 },
    { key: 'atk_pct',     label: '攻击%',     value: 0.33 },
    { key: 'hp_pct',      label: '生命%',     value: 0.33 },
    { key: 'def_pct',     label: '防御%',     value: 0.33 },
    { key: 'heal_bonus',  label: '治疗加成',  value: 0.22 },
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
    { key: 'resonance_efficiency',      label: '共鸣效率%',    value: 0.32 },
  ],
  1: [
    { key: 'atk_pct',   label: '攻击%',   value: 0.18 },
    { key: 'hp_pct',    label: '生命%',   value: 0.18 },
    { key: 'def_pct',   label: '防御%',   value: 0.18 },
  ],
};

// ==================== 副词条池 ====================

export const SUB_STAT_POOL = [
  { key: 'crate',            label: '暴击率',      min: 0.063, max: 0.105 },
  { key: 'cdmg',             label: '暴击伤害',    min: 0.126, max: 0.210 },
  { key: 'atk_pct',          label: '攻击%',       min: 0.063, max: 0.105 },
  { key: 'hp_pct',           label: '生命%',       min: 0.063, max: 0.105 },
  { key: 'def_pct',          label: '防御%',       min: 0.079, max: 0.132 },
  { key: 'atk_flat',         label: '攻击(固定)',  min: 30,    max: 50 },
  { key: 'hp_flat',          label: '生命(固定)',  min: 450,   max: 750 },
  { key: 'def_flat',         label: '防御(固定)',  min: 30,    max: 50 },
  { key: 'resonance_efficiency',     label: '共鸣效率%',   min: 0.056, max: 0.093 },
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

export const MAX_LEVEL_EXP = 540000;
export const MAX_LEVEL_COST = 270000;

// ==================== 套装ID查找辅助 ====================

export function getSetById(id) {
  return ECHO_SETS.find(s => s.id === id);
}

export function getEchoById(id) {
  return ECHO_CATALOG.find(e => e.id === id);
}

export function getEchoesBySet(setId) {
  return ECHO_CATALOG.filter(e => {
    if (Array.isArray(e.set)) return e.set.includes(setId);
    return e.set === setId;
  });
}

export function getEchoesByElement(element) {
  return ECHO_CATALOG.filter(e => e.element === element);
}

export function getEchoesByCost(cost) {
  return ECHO_CATALOG.filter(e => e.cost === cost);
}

const FLAT_STAT_KEYS = new Set(['atk_flat', 'hp_flat', 'def_flat']);

export function formatEchoStatValue(key, value) {
  if (FLAT_STAT_KEYS.has(key)) return String(Math.round(value));
  return (value * 100).toFixed(1) + '%';
}

const SET_BONUS_TYPE_LABEL = {
  elem_dmg:           (b) => `${b.elem ?? ''}伤害加成`,
  elem_dmg_cond:      (b) => `${b.elem ?? ''}伤害加成`,
  heal_bonus:         () => '治疗加成',
  resonance_efficiency:       () => '共鸣效率',
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
  havoc_veil_cond:        (b) => `延奏湮灭伤害 / ${b.elem ?? ''}伤害加成（接力）`,
  lost_dream_cond:        () => '暴击率加成 / 声骸技能伤害加成',
  glory_forge_cond:       () => '攻击加成 / 暴击伤害加成（叠层）',
  sync_law_cond:          () => '重击伤害加成 / 声骸技能伤害加成（叠层）',
  hunt_shadow_cond:       (b) => `重击暴击加成 / 声骸技能暴击加成 / ${b.elem ?? ''}伤害加成`,
  backlight_vow_cond:     (b) => `${b.elem ?? ''}伤害加成 / 攻击加成（接力·谐度增幅）`,
  star_ring_cond:         () => '攻击加成（治疗·偏谐值）',
  gold_truth_cond:        (b) => `${b.elem ?? ''}伤害加成（叠层） / 普攻伤害加成`,
  echo_wish_cond:         (b) => `声骸技能暴击加成 / ${b.elem ?? ''}伤害加成`,
  ghost_nightmare_cond:   () => '普攻伤害加成 / 重击伤害加成',
};

export function formatSetBonus(bonus) {
  if (!bonus || !bonus.type) return '';
  const label = SET_BONUS_TYPE_LABEL[bonus.type];
  const prefix = label ? label(bonus) : bonus.type;
  const valueStr = bonus.flat ? `+${bonus.value} 点` : `+${(bonus.value * 100).toFixed(0)}%`;
  const condStr = bonus.cond ? `（${bonus.cond}）` : '';
  return `${prefix} ${valueStr}${condStr}`;
}
