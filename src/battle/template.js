// 角色定位模板 + 元素映射 + 属性计算
// 4 个定位的基础属性模板（满级 90 + 5 突破后的数值）
// dodge 闪避率：模拟玩家操作躲避，主C 操作多闪避高，治疗站桩低
export const TEMPLATES = {
  '主C':  { hp: 8500,  atk: 380, def: 600,  crate: 0.05, cdmg: 1.50, energy: 100, dodge: 0.18 },
  '副C':  { hp: 9500,  atk: 340, def: 700,  crate: 0.10, cdmg: 1.40, energy: 130, dodge: 0.14 },
  '辅助': { hp: 11000, atk: 250, def: 850,  crate: 0.05, cdmg: 1.20, energy: 130, dodge: 0.10 },
  '治疗': { hp: 13000, atk: 220, def: 950,  crate: 0.05, cdmg: 1.20, energy: 130, dodge: 0.08 }
};

// 每个角色的定位 + 元素 + 武器类型
export const ROLE_META = {
  // 5 星限定
  '忌炎':      { type: '主C',  element: '气动', weaponType: '长刃' },
  '吟霖':      { type: '副C',  element: '导电', weaponType: '音感仪' },
  '今汐':      { type: '主C',  element: '衍射', weaponType: '长刃' },
  '长离':      { type: '主C',  element: '热熔', weaponType: '迅刀' },
  '折枝':      { type: '副C',  element: '衍射', weaponType: '迅刀' },
  '相里要':    { type: '副C',  element: '导电', weaponType: '臂铠' },
  '守岸人':    { type: '辅助', element: '衍射', weaponType: '音感仪' },
  '椿':        { type: '主C',  element: '湮灭', weaponType: '迅刀' },
  '珂莱塔':    { type: '主C',  element: '冷凝', weaponType: '佩枪' },
  '洛可可':    { type: '副C',  element: '湮灭', weaponType: '臂铠' },
  '菲比':      { type: '主C',  element: '衍射', weaponType: '音感仪' },
  '布兰特':    { type: '辅助', element: '热熔', weaponType: '迅刀' },
  '坎特蕾拉':  { type: '副C',  element: '湮灭', weaponType: '音感仪' },
  '赞妮':      { type: '主C',  element: '衍射', weaponType: '长刃' },
  '夏空':      { type: '辅助', element: '气动', weaponType: '音感仪' },
  '卡提希娅':  { type: '主C',  element: '气动', weaponType: '迅刀' },
  '露帕':      { type: '副C',  element: '热熔', weaponType: '长刃' },
  '弗洛洛':    { type: '主C',  element: '湮灭', weaponType: '音感仪' },
  '奥古斯塔':  { type: '主C',  element: '导电', weaponType: '臂铠' },
  '尤诺':      { type: '主C',  element: '冷凝', weaponType: '佩枪' },
  '嘉贝莉娜':  { type: '主C',  element: '热熔', weaponType: '佩枪' },
  '仇远':      { type: '主C',  element: '气动', weaponType: '长刃' },
  '千咲':      { type: '主C',  element: '湮灭', weaponType: '臂铠' },
  '琳奈':      { type: '副C',  element: '衍射', weaponType: '佩枪' },
  '莫宁':      { type: '主C',  element: '冷凝', weaponType: '迅刀' },
  '爱弥斯':    { type: '主C',  element: '导电', weaponType: '长刃' },
  '陆·赫斯':   { type: '辅助', element: '冷凝', weaponType: '臂铠' },
  '西格莉卡':  { type: '主C',  element: '衍射', weaponType: '音感仪' },
  '绯雪':      { type: '主C',  element: '冷凝', weaponType: '迅刀' },
  '达妮娅':    { type: '主C',  element: '热熔', weaponType: '佩枪' },
  '露西':      { type: '主C',  element: '衍射', weaponType: '佩枪' },
  '丽贝卡':    { type: '副C',  element: '导电', weaponType: '佩枪' },
  '洛瑟菈':    { type: '副C',  element: '湮灭', weaponType: '音感仪' },

  // 常驻 5 星
  '维里奈':    { type: '治疗', element: '衍射', weaponType: '音感仪' },
  '卡卡罗':    { type: '主C',  element: '导电', weaponType: '长刃' },
  '安可':      { type: '主C',  element: '热熔', weaponType: '佩枪' },
  '凌阳':      { type: '主C',  element: '冷凝', weaponType: '迅刀' },
  '鉴心':      { type: '辅助', element: '气动', weaponType: '臂铠' },

  // 4 星
  '丹瑾':      { type: '副C',  element: '湮灭', weaponType: '长刃' },
  '炽霞':      { type: '副C',  element: '热熔', weaponType: '佩枪' },
  '秋水':      { type: '副C',  element: '气动', weaponType: '佩枪' },
  '渊武':      { type: '辅助', element: '导电', weaponType: '臂铠' },
  '桃祈':      { type: '辅助', element: '衍射', weaponType: '臂铠' },
  '散华':      { type: '副C',  element: '冷凝', weaponType: '长刃' },
  '秧秧':      { type: '副C',  element: '气动', weaponType: '音感仪' },
  '莫特斐':    { type: '副C',  element: '热熔', weaponType: '佩枪' },
  '白芷':      { type: '治疗', element: '冷凝', weaponType: '音感仪' },
  '釉瑚':      { type: '副C',  element: '冷凝', weaponType: '臂铠' },
  '灯灯':      { type: '副C',  element: '衍射', weaponType: '臂铠' },
  '卜灵':      { type: '辅助', element: '导电', weaponType: '音感仪' }
};

// 默认元数据（找不到时用）
const DEFAULT_META = { type: '副C', element: '湮灭', weaponType: '长刃' };

export function getMeta(roleName) {
  return ROLE_META[roleName] || DEFAULT_META;
}

// 按角色等级计算基础属性
// 共鸣链效果统一在 battle/chains.js 中按原文折算，避免混入泛用每链加成。
export function getStats(roleName, level = 1, chain = 0) {
  const meta = getMeta(roleName);
  const tpl = TEMPLATES[meta.type];
  const scale = 0.20 + level * 0.0089;    // 1 级 0.21x, 90 级 1.0x
  return {
    hp: Math.round(tpl.hp * scale),
    atk: Math.round(tpl.atk * scale),
    def: Math.round(tpl.def * scale),
    crate: tpl.crate,
    cdmg: tpl.cdmg,
    dodge: tpl.dodge,
    maxEnergy: tpl.energy,
    element: meta.element,
    type: meta.type,
    weaponType: meta.weaponType
  };
}

// 升级所需经验书数量（累计经验 = sum(needForLevel(i) for i in 1..lv)）
// 简化：每级需要 level 本经验书
export function expBookForLevel(targetLevel) {
  return targetLevel; // 升到 N 级需要 N 本
}
