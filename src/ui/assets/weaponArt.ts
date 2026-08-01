// 武器图标注册表 · UI 层
//
// 把武器名映射到图片 URL（encore.moe 官方资源）。
// 来源:api-v2.encore.moe/api/zh-Hans/weapon/{itemId} 的 IconMiddle(160px)/IconSmall(80px) 字段,
// 拼成 https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160|80/... 后逐条 curl 验证 HTTP 200(2026-07-31)。
// 部分武器(悲喜剧/血誓盟约/和光回唱等)的图标资源 ID 与自身 itemId 不一致,以 API 返回为准。
// 87 把全量收录;项目里训练系/暗夜系/限定武器等合成武器无官方图标,未收录,getWeaponArt 返回 undefined,UI 兜底不渲染 img。

export const WEAPON_ART: Record<string, string> = {
  '浩境粼光': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010015_UI.webp',
  '千古洑流': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020015_UI.webp',
  '停驻之烟': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030015_UI.webp',
  '擎渊怒涛': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040015_UI.webp',
  '漪澜浮录': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050015_UI.webp',
  '苍鳞千嶂': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010016_UI.webp',
  '掣傀之手': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050016_UI.webp',
  '时和岁稔': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010026_UI.webp',
  '赫奕流明': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020016_UI.webp',
  '琼枝冰绡': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050026_UI.webp',
  '诸方玄枢': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040016_UI.webp',
  '星序协响': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050027_UI.webp',
  '裁春': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020017_UI.webp',
  '悲喜剧': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040018_UI.webp',
  '死与舞': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030017_UI.webp',
  '不灭航路': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020025_UI.webp',
  '和光回唱': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050029_UI.webp',
  '海的呢喃': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050030_UI.webp',
  '血誓盟约': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020026_UI.webp',
  '焰光裁定': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040019_UI.webp',
  '林间的咏叹调': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030026_UI.webp',
  '不屈命定之冠': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020056_UI.webp',
  '焰痕': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010036_UI.webp',
  '幽冥的忘忧章': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050066_UI.webp',
  '驭冕铸雷之权': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010046_UI.webp',
  '光影双生': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030036_UI.webp',
  '裁竹': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020066_UI.webp',
  '昙切': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010056_UI.webp',
  '溢彩荧辉': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030046_UI.webp',
  '宙算仪轨': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010066_UI.webp',
  '源能机锋': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010045_UI.webp',
  '镭射切变': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020045_UI.webp',
  '相位涟漪': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030045_UI.webp',
  '脉冲协臂': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040045_UI.webp',
  '玻色星仪': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050045_UI.webp',
  '永远的启明星': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020076_UI.webp',
  '白昼之脊': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040056_UI.webp',
  '昭日译注': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040066_UI.webp',
  '赝作的矮星': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050076_UI.webp',
  '灼霜': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020086_UI.webp',
  '蜃影': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030056_UI.webp',
  '碎骨': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030066_UI.webp',
  '存帧': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050086_UI.webp',
  '纹秋': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010074_UI.webp',
  '飞景': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020074_UI.webp',
  '奔雷': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030074_UI.webp',
  '金掌': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040074_UI.webp',
  '清音': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050074_UI.webp',
  '异响空灵': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010024_UI.webp',
  '行进序曲': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020024_UI.webp',
  '华彩乐段': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030024_UI.webp',
  '呼啸重音': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040024_UI.webp',
  '奇幻变奏': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050024_UI.webp',
  '重破刃-41型': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010034_UI.webp',
  '瞬斩刀-18型': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020034_UI.webp',
  '穿击枪-26型': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030034_UI.webp',
  '钢影拳-21丁型': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040034_UI.webp',
  '鸣动仪-25型': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050034_UI.webp',
  '永夜长明': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010044_UI.webp',
  '不归孤军': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020044_UI.webp',
  '无眠烈火': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030044_UI.webp',
  '袍泽之固': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040044_UI.webp',
  '今州守望': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050044_UI.webp',
  '东落': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010064_UI.webp',
  '西升': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020064_UI.webp',
  '飞逝': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030064_UI.webp',
  '骇行': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040064_UI.webp',
  '异度': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050064_UI.webp',
  '凋亡频移': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon80/T_IconWeapon80_21010014_UI.webp',
  '永续坍缩': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon80/T_IconWeapon80_21020014_UI.webp',
  '悖论喷流': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon80/T_IconWeapon80_21030014_UI.webp',
  '尘云旋臂': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon80/T_IconWeapon80_21040074_UI.webp',
  '核熔星盘': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon80/T_IconWeapon80_21050014_UI.webp',
  '心之锚': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020019_UI.webp',
  '渊海回声': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050017_UI.webp',
  '容赦的沉思录': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010094_UI.webp',
  '风流的寓言诗': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020094_UI.webp',
  '叙别的罗曼史': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030094_UI.webp',
  '酩酊的英雄志': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040094_UI.webp',
  '虚饰的华尔兹': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050094_UI.webp',
  '大海的馈赠': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050036_UI.webp',
  '金穹': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21010094_UI.webp',
  '翼锋': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21020094_UI.webp',
  '阳焰': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21030094_UI.webp',
  '凌空': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040094_UI.webp',
  '曜光': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21050094_UI.webp',
  '万物持存的注释': 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon160/T_IconWeapon160_21040046_UI.webp',
};

export function getWeaponArt(name: string): string | undefined {
  return WEAPON_ART[name];
}

// 武器卡池大图(bannerBg) = 同一把武器的 732 横版艺术图
// (IconWeapon732/T_IconWeapon732_*,实测 731×391 横版,即武器唤取横幅),
// 由 IconWeapon160 图标 URL 换资源目录派生(同一资源 ID),2026-08-01 已逐个验证 HTTP 200。
// 无官方图标/合成的武器返回 undefined,UI 兜底不铺背景。
export function getWeaponBannerArt(name: string): string | undefined {
  const icon = WEAPON_ART[name];
  if (!icon) return undefined;
  return icon.replace(/IconWeapon(?:160|80)\/T_IconWeapon(?:160|80)_/, 'IconWeapon732/T_IconWeapon732_');
}
