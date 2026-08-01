// 资源骨架单测 · 保证空配置时行为安全,后续填图/填音不破坏调用方。
import { describe, it, expect } from 'vitest';
import {
  BANNER_ART, ROLE_ART, VERSION_ART,
  getBannerArt, getRoleArt, getVersionArt,
  SOUNDS, sfx, music, stopMusic, setVolume, unlock,
} from '../../src/ui/assets/index.ts';

describe('art 注册表:空配置兜底', () => {
  it('ROLE_ART 全量实装角色 53 个(50 实装 + 漂泊者三形态);BANNER_ART 留空(常驻池走文字布局);版本表为空', () => {
    expect(Object.keys(BANNER_ART)).toHaveLength(0);
    expect(Object.keys(VERSION_ART)).toHaveLength(0);
    expect(Object.keys(ROLE_ART).length).toBe(53);
    // 代表性子集:限定/常驻/四星 + 漂泊者三形态都有
    for (const n of ['弗洛洛', '忌炎', '今汐', '守岸人', '维里奈', '秧秧', '白芷', '漂泊者·衍射', '漂泊者·湮灭', '漂泊者·气动']) {
      expect(getRoleArt(n)).toBeTruthy();
    }
    // 常驻角色池(char=null)无 pool 级大图 → 走文字布局
    expect(getBannerArt('standardChar')).toBeUndefined();
    // 常驻五星 5 人都有官方横版壁纸,作各自卡池大图(点按钮切换)
    for (const n of ['维里奈', '卡卡罗', '安可', '凌阳', '鉴心']) {
      expect(getRoleArt(n)?.bannerBg).toMatch(/^https:\/\/huiji-public\.huijistatic\.com\/wuwa\/uploads\//);
    }
  });

  it('未登记的 key 返回 undefined(调用方走 CSS 兜底)', () => {
    expect(getBannerArt('eventChar')).toBeUndefined();
    expect(getRoleArt('测试角色')).toBeUndefined(); // 未登记角色
    expect(getVersionArt('2.0')).toBeUndefined();
  });

  it('登记的条目按 key 原样返回', () => {
    expect(getRoleArt('忌炎')?.portrait).toMatch(/^https:\/\/api\.encore\.moe\//);
    // portrait = encore 官方立绘(PixActivity/T_ActivityRole*)
    expect(getRoleArt('守岸人')?.portrait).toMatch(/^https:\/\/api\.encore\.moe\/.*\/T_ActivityRoleShouanren\.webp/);
    expect(getRoleArt('白芷')?.portrait).toMatch(/\/T_ActivityRoleBailian\.webp/);
    // 漂泊者三形态 portrait
    expect(getRoleArt('漂泊者·衍射')?.portrait).toMatch(/\/T_ActivityRoleNvzhu\.webp/);
    expect(getRoleArt('漂泊者·湮灭')?.portrait).toMatch(/\/T_ActivityRoleNanzhu\.webp/);
    expect(getRoleArt('漂泊者·气动')?.portrait).toMatch(/\/T_ActivityRoleNvzhu\.webp/);
    // 卡池大图 = 官方海报立绘(萌娘百科 commons / 灰机wiki huiji CDN),不是游戏 BgCgBig/T_LuckdrawBg* 单色背景
    expect(getRoleArt('弗洛洛')?.bannerBg).toMatch(/^https:\/\/(storage\.moegirl\.org\.cn|huiji-public\.huijistatic\.com)\//);
    expect(getRoleArt('忌炎')?.bannerBg).toMatch(/^https:\/\/(storage\.moegirl\.org\.cn|huiji-public\.huijistatic\.com)\//);
    // 今汐 无「唤取」官方图,取官方横版壁纸(壁纸1-横)作为卡池大图
    expect(getRoleArt('今汐')?.bannerBg).toMatch(/^https:\/\/(storage\.moegirl\.org\.cn|huiji-public\.huijistatic\.com)\//);
    // 用户反馈过的夏空/坎特蕾拉也应有海报(不再是角色立绘)
    expect(getRoleArt('坎特蕾拉')?.bannerBg).toMatch(/^https:\/\/(storage\.moegirl\.org\.cn|huiji-public\.huijistatic\.com)\//);
    // 写入临时条目验证查询函数是"直查不加工"
    BANNER_ART['eventChar'] = { bg: '/x.jpg' };
    VERSION_ART['2.0'] = { promo: '/p.jpg' };
    expect(getBannerArt('eventChar')).toEqual({ bg: '/x.jpg' });
    expect(getVersionArt('2.0')).toEqual({ promo: '/p.jpg' });
    // 清理,不影响其他测试
    delete BANNER_ART['eventChar'];
    delete VERSION_ART['2.0'];
  });
});

describe('audio 管理器:空配置 no-op', () => {
  it('SOUNDS 为空', () => {
    expect(Object.keys(SOUNDS)).toHaveLength(0);
  });

  it('sfx/music/stopMusic/setVolume 在未配置音频时静默不抛错', () => {
    expect(() => sfx('reveal')).not.toThrow();
    expect(() => music('banner')).not.toThrow();
    expect(() => stopMusic()).not.toThrow();
    expect(() => setVolume(0.5)).not.toThrow();
  });

  it('unlock 在无 AudioContext 环境静默不抛错', () => {
    expect(() => unlock()).not.toThrow();
  });
});
