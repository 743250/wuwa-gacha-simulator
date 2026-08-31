// 美术资源注册表 · UI 层
//
// 把「pool id / 角色名 / 版本号」映射到图片 URL。未登记的 key 返回 undefined,
// 调用方走现有 CSS 渐变兜底,行为不变。BANNER_ART 现仅有 standardChar(常驻角色池)用官方横版壁纸。
//
// 填图步骤(等图片来源调研结果出来后):
//   1. 把图片文件放进 public/assets/(或走 Vite import),拿到 URL/路径
//   2. 按下面的 key 填进对应表
//   3. GachaBanner / 角色弹窗 / 翻牌动画已接好查询函数,自动生效
//
// key 与领域层数据对齐:
//   · pool id:见 src/gacha/core.js activeBanners() 的 b.pool,
//     beginner / noviceChoice / noviceWeapon / standardChar / standardWeapon /
//     eventChar / eventWeapon / collabChar / collabWeapon
//   · 角色名:与 src/data/chars.js 同名(忌炎 / 吟霖 / 今汐 …)
//   · 版本号:与 src/data/phases.js 的 v 一致(1.0 … 3.4)

export interface ArtRef {
  bg?: string;   // 卡池大图(背景层)
  logo?: string; // 卡池 logo(可选)
}
export interface RoleArtRef {
  icon?: string;      // 头像/小图(列表、翻牌卡背)
  portrait?: string;  // 立绘/大图(角色弹窗、banner 兜底)
  bannerBg?: string;  // 卡池大图 = 官方海报立绘(横版 16:9 宣传图),整块 banner 背景
                     // 注意:不是游戏 BgCgBig/T_LuckdrawBg* —— 那套是单色全屏背景(弗洛洛=一片红),
                     // 游戏自 2.4 起不再为角色出静态卡池图,新角色的卡池大图即官方海报立绘
}
export interface VersionArtRef {
  promo?: string; // 版本宣传图
}

export const BANNER_ART: Record<string, ArtRef> = {
  // 常驻角色池(海上共潮生)暂无合适的多人同框海报,有意留空走文字布局
  // (ba-main 显示池名 + 常驻五星 5 人列表)。个别角色无「唤取」海报时,
  // 其 bannerBg 用「壁纸-横」官方横版壁纸兜底(见 ROLE_ART)。
};

export const ROLE_ART: Record<string, RoleArtRef> = {
  // portrait(立绘) = encore.moe 官方角色活动立绘,批量抓取(2026-07-31,api-v2.encore.moe/api/zh-Hans/character/{id}),
  // 53 个条目全量(50 实装 + 漂泊者三形态),URL 由官方 API 返回、已逐个验证 HTTP 200
  // (部分角色 API 返回的文件名大小写有误,已按服务器实际文件修正,如尤诺/奥古斯塔=全小写)。卡面/翻牌/banner 兜底用。
  // bannerBg(卡池大图) = 官方海报立绘,来自灰机wiki共享站(huiji-public.huijistatic.com),
  // 已实测 HTTP 200 无防盗链;官方美术,仅限本项目个人非商业用途。
  // 优先取文件名含「唤取」的官方卡池横版图,其次取「壁纸-横」官方横版壁纸;已排除 同人/演唱会/周年/合影/联动/PV/版本KV 等图。
  // 缺 bannerBg 的角色回落 portrait;游戏自 2.4 起无静态卡池图,新角色卡池大图即海报立绘。
  '忌炎': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleJiyan1.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/3/3f/%E5%BF%8C%E7%82%8E-%E5%94%A4%E5%8F%96-1.3%E5%A4%8D%E5%88%BB.jpg',
  },
  '吟霖': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleYinlin.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/7/74/%E5%94%A4%E5%8F%96-%E5%90%9F%E9%9C%96.jpg',
  },
  '今汐': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleJinxi.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/9/98/%E4%BB%8A%E6%B1%90-%E5%A3%81%E7%BA%B81-%E6%A8%AA.jpg',
  },
  '长离': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleChangli.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/a/a5/%E9%95%BF%E7%A6%BB-%E5%94%A4%E5%8F%96.jpg',
  },
  '折枝': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleZhezhi.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/9/9b/%E6%8A%98%E6%9E%9D-%E5%94%A4%E5%8F%96.jpg',
  },
  '相里要': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleXiangliyao.webp',
    bannerBg: 'https://storage.moegirl.org.cn/moegirl/commons/b/bf/相里要壁纸.png',
  },
  '守岸人': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleShouanren.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/b/bf/%E5%AE%88%E5%B2%B8%E4%BA%BA-%E5%94%A4%E5%8F%96.jpg',
  },
  '椿': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleChun.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/a/aa/%E6%A4%BF-%E5%94%A4%E5%8F%96.jpg',
  },
  '珂莱塔': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleKelaita.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/f/f2/%E7%8F%82%E8%8E%B1%E5%A1%94-%E5%94%A4%E5%8F%96.jpg',
  },
  '洛可可': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleLuokeke.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/5/56/%E6%B4%9B%E5%8F%AF%E5%8F%AF-%E5%94%A4%E5%8F%96.jpg',
  },
  '菲比': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleFeibi.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/8/82/%E8%8F%B2%E6%AF%94-%E5%94%A4%E5%8F%96.jpg',
  },
  '布兰特': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleBulante.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/9/9a/%E5%B8%83%E5%85%B0%E7%89%B9-%E5%94%A4%E5%8F%96.jpg',
  },
  '坎特蕾拉': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleKanteleila.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/6/61/%E5%9D%8E%E7%89%B9%E8%95%BE%E6%8B%89-%E5%94%A4%E5%8F%96.jpg',
  },
  '赞妮': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleZanni.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/9/97/%E8%B5%9E%E5%A6%AE-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '夏空': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleXiakong.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/a/a7/%E5%A4%8F%E7%A9%BA-%E5%94%A4%E5%8F%96.jpg',
  },
  '卡提希娅': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleKatixiya.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/3/38/%E5%8D%A1%E6%8F%90%E5%B8%8C%E5%A8%85-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '露帕': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleLupa.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/9/9f/%E9%9C%B2%E5%B8%95-%E5%94%A4%E5%8F%96.jpg',
  },
  '弗洛洛': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleFuluoluo.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/c/c3/%E5%BC%97%E6%B4%9B%E6%B4%9B-%E5%94%A4%E5%8F%96.jpg',
  },
  '奥古斯塔': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleaogusita.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/6/67/%E5%A5%A5%E5%8F%A4%E6%96%AF%E5%A1%94-%E5%94%A4%E5%8F%96.jpg',
  },
  '尤诺': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleyounuo.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/8/89/%E5%B0%A4%E8%AF%BA-%E5%94%A4%E5%8F%96.jpg',
  },
  '琳奈': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleLinnai.webp',
    bannerBg: 'https://storage.moegirl.org.cn/moegirl/commons/6/6c/鸣潮-琳奈-背景.jpg',
  },
  '莫宁': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleMoning.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/f/f3/%E8%8E%AB%E5%AE%81-%E5%94%A4%E5%8F%96.jpg',
  },
  '爱弥斯': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleAimisi.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/9/9c/%E7%88%B1%E5%BC%A5%E6%96%AF-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '陆·赫斯': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleLuhesi.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/c/cd/%E9%99%86%E8%B5%AB%E6%96%AF-%E5%94%A4%E5%8F%96.jpg',
  },
  '嘉贝莉娜': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleJiabeilina.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/1/17/%E5%98%89%E8%B4%9D%E8%8E%89%E5%A8%9C-%E5%94%A4%E5%8F%96.jpg',
  },
  '仇远': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleQiuyuan.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/1/10/%E4%BB%87%E8%BF%9C-%E5%94%A4%E5%8F%96.jpg',
  },
  '西格莉卡': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleXigelika.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/e/ed/%E8%A5%BF%E6%A0%BC%E8%8E%89%E5%8D%A1-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '露西': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleLuXi.webp',
    bannerBg: 'https://storage.moegirl.org.cn/moegirl/commons/c/c0/鸣潮-露西-海报.png',
  },
  '丽贝卡': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleLiBeiKa.webp',
    bannerBg: 'https://storage.moegirl.org.cn/moegirl/commons/1/17/鸣潮-丽贝卡-海报.png',
  },
  '千咲': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleQianxiao.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/3/34/%E5%8D%83%E5%92%B2-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '绯雪': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleFeiXue.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/d/d0/%E7%BB%AF%E9%9B%AA-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '达妮娅': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleDaNiYa.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/4/49/%E5%94%A4%E5%8F%96-%E8%BE%BE%E5%A6%AE%E5%A8%85.jpg',
  },
  '洛瑟菈': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleLuoSeLa.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/5/54/%E6%B4%9B%E7%91%9F%E8%8F%88-%E5%94%A4%E5%8F%96.jpg',
  },
  '维里奈': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleJueyuan.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/d/d7/%E7%BB%B4%E9%87%8C%E5%A5%88-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '卡卡罗': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleKakaluo.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/9/9a/%E5%8D%A1%E5%8D%A1%E7%BD%97-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '安可': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleAnke.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/5/56/%E5%AE%89%E5%8F%AF-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '凌阳': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleLingyang.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/f/fd/%E5%87%8C%E9%98%B3-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '鉴心': {
    portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleJianxin.webp',
    bannerBg: 'https://huiji-public.huijistatic.com/wuwa/uploads/f/fe/%E9%89%B4%E5%BF%83-%E5%A3%81%E7%BA%B8-%E6%A8%AA.jpg',
  },
  '秧秧': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleYangyang.webp' },
  '丹瑾': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleDanjin.webp' },
  '桃祈': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleTaoqi.webp' },
  '秋水': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleQiushui.webp' },
  '散华': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleSanhua.webp' },
  '渊武': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleYuanwu.webp' },
  '莫特斐': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleMofeite.webp' },
  '白芷': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleBailian.webp' },
  '炽霞': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleZhixia.webp' },
  '釉瑚': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleYouhu.webp' },
  '灯灯': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleDengdeng.webp' },
  '卜灵': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleBuling.webp' },
  '漂泊者·衍射': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleNvzhu.webp' },
  '漂泊者·湮灭': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleNanzhu.webp' },
  '漂泊者·气动': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleNvzhu.webp' },
  '秧秧·玄翎': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleXuanling.webp' },
  '穗穗': { portrait: 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/PixActivity/T_ActivityRoleSuisui.webp' },
};

export const VERSION_ART: Record<string, VersionArtRef> = {
  // '2.0': { promo: '/assets/versions/v2.0.jpg' },
};

export function getBannerArt(pool: string): ArtRef | undefined {
  return BANNER_ART[pool];
}

export function getRoleArt(name: string): RoleArtRef | undefined {
  return ROLE_ART[name];
}

export function getVersionArt(v: string): VersionArtRef | undefined {
  return VERSION_ART[v];
}
