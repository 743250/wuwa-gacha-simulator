// 应用游戏开局设置:把 S 重置成选定入坑方式的初始状态
//
// 流程: reset → jumpToVersion → commit 应用 profile (astrite/spent/days/roles/weapons/log)
//
// 买号特别说明:按"被玩的天数"累积模拟一个老账号 ——
// 不是一次性配齐所有 UP 角色/武器/声骸,而是从 1.0 开始,每虚拟 1 天概率推进:
// 已有角色升级、抽到新角色、加武器、加声骸,直到 days 上限,自然形成"老玩家"账号
//
// 调用方:StartSetupModal 确认按钮 / 首次进入游戏时自动触发

import { S, resetState, DAY, fmt, pick } from '../../state.js';
import { saveState, clearSave } from '../../save.js';
import { commit } from '../../state/commit';
import { jumpToVersion } from '../../time/timeline.js';
import { addRole, addWeapon } from '../../gacha/core.js';
import { generateEcho } from '../../equip/echoActions.js';
import { equipEcho } from '../../equip/echoActions.js';
import { ECHO_CATALOG, ECHO_MAX_LEVEL } from '../../data/echoes.js';
import { rerenderAll } from '../../rerender.js';
import {
  resolveProfile,
  collectUPTChars,
  collectUPTWeapons,
  generateFillerPulls,
} from '../../data/startProfiles.js';

const SETUP_DONE_KEY = 'wuwa_setup_done';

export type StartType = 'newbie' | 'self' | 'buy';

// 买号模拟:从 days=0 累积推进到目标 days
// 输入:目标 version、profile.days(总天数)、chainMax
// 副作用:改 S.roles/S.weapons/S.echos + 返回生成的 5★ 抽卡日志条目
function simulateBuyAccountPlaythrough(version: string, totalDays: number, chainMax: number, today: number) {
  // 截至选定版本的所有 UP 角色和武器(按版本顺序排列)
  const uptChars = collectUPTChars(version);
  const uptWeapons = collectUPTWeapons(version);
  // 角色与武器的对应关系:每个 UP 角色对应一把专属武器
  const charToWeapon: Record<string, string> = {};
  uptChars.forEach((c, i) => {
    if (uptWeapons[i]) charToWeapon[c] = uptWeapons[i];
  });

  // 已获得角色集合(按获得顺序)
  const ownedChars: string[] = [];
  // 已获得武器集合
  const ownedWeapons = new Set<string>();
  // 5★ 抽卡记录(按时间顺序,后面前)
  const fivePulls: Array<{ r: number; n: string; t: string; pool: string; pity: number; up: boolean; no: number; date: string }> = [];
  let pullNo = 0; // 全局 no 计数器(后面会再用 filler 填前段)

  // 第一天:必送该版本第一个 UP 角色(就是"创号后第一次抽到的那个 5★")
  const firstChar = uptChars[0];
  if (firstChar) {
    ownedChars.push(firstChar);
    addRole(firstChar, 5);
    S.roles[firstChar].level = 1;
    pullNo++;
    fivePulls.push({
      r: 5, n: firstChar, t: '限定角色', pool: 'eventChar',
      pity: 20 + Math.floor(Math.random() * 60), up: true, no: pullNo,
      date: fmt(today - (totalDays - 1) * DAY),
    });
  }

  // 每虚拟 1 天推进一次(用天数步长压缩,避免 600 次循环)
  // totalDays 通常 30~600,直接循环也 OK
  // 每天概率:
  //   - 5% 概率抽到新 UP 角色(如果还有未拥有的)
  //   - 3% 概率抽到 UP 武器(对应已有角色)
  //   - 4% 概率加 1 个声骸(给随机已有角色)
  //   - 每天所有已有角色累积经验,等级按累计推进
  const daysStep = Math.max(1, Math.floor(totalDays / 200)); // 压缩步长,最多 ~200 次循环
  for (let d = 1; d <= totalDays; d += daysStep) {
    const dateStr = fmt(today - (totalDays - d) * DAY);

    // 抽新 UP 角色
    if (Math.random() < 0.04 * daysStep && ownedChars.length < uptChars.length) {
      const nextChar = uptChars[ownedChars.length];
      ownedChars.push(nextChar);
      addRole(nextChar, 5);
      const o = S.roles[nextChar];
      o.level = 1;
      // 共鸣链:老号才能堆,前几名保持 0,后面按 chainMax 随机
      const chainIdx = ownedChars.length - 1;
      if (chainIdx > 0 && chainMax > 0) {
        const chain = Math.floor(Math.random() * (chainMax + 1));
        o.chain = chain;
        o.pulled = chain + 1;
        o.spare = 0;
      }
      pullNo++;
      fivePulls.push({
        r: 5, n: nextChar, t: '限定角色', pool: 'eventChar',
        pity: 20 + Math.floor(Math.random() * 60), up: true, no: pullNo, date: dateStr,
      });
    }

    // 抽 UP 武器(给已有角色配武器)
    if (Math.random() < 0.03 * daysStep) {
      // 找一个还没武器的已有角色
      const candidates = ownedChars.filter((c) => charToWeapon[c] && !ownedWeapons.has(charToWeapon[c]));
      if (candidates.length > 0) {
        const c = pick(candidates);
        const w = charToWeapon[c];
        ownedWeapons.add(w);
        addWeapon(w, 5);
        const wo = S.weapons[w];
        const refine = 1 + Math.floor(Math.random() * 3); // 1~3 精炼
        wo.refine = refine;
        wo.pulled = refine;
        wo.spareRefine = 0;
        wo.level = 1;
        // 装备到对应角色
        S.roles[c].equipWeapon = w;
        pullNo++;
        fivePulls.push({
          r: 5, n: w, t: '限定武器', pool: 'eventWeapon',
          pity: 30 + Math.floor(Math.random() * 50), up: true, no: pullNo, date: dateStr,
        });
      }
    }

    // 加声骸并装备(给已有角色)
    if (Math.random() < 0.05 * daysStep && ownedChars.length > 0) {
      const targetChar = pick(ownedChars);
      const role = S.roles[targetChar];
      if (!Array.isArray(role.equipEchoes)) role.equipEchoes = [null, null, null, null, null];
      // 找空槽
      const emptySlot = role.equipEchoes.findIndex((id: any) => id == null);
      if (emptySlot >= 0) {
        // 随机选个声骸 catalog 条目
        const echoData = pick(ECHO_CATALOG);
        const echo = generateEcho(echoData.id);
        if (echo) {
          // 升到一定等级(老号声骸不会是 1 级)
          const targetLv = Math.min(ECHO_MAX_LEVEL, 5 + Math.floor(Math.random() * 20));
          echo.level = targetLv;
          // 解锁对应数量副词条
          const unlockedCount = Math.floor(targetLv / 5);
          echo.subStats.forEach((s: any, i: number) => { s.unlocked = i < unlockedCount; });
          // 装备
          equipEcho(targetChar, emptySlot, echo.id);
        }
      }
    }

    // 每天给所有已有角色升级(线性按天数推进到 90)
    // 累积进度 = d / totalDays,等级 = 1 + floor(进度 * 89)
    const progress = d / totalDays;
    const targetLevel = Math.min(90, 1 + Math.floor(progress * 89));
    ownedChars.forEach((c) => {
      const r = S.roles[c];
      if (r) r.level = Math.max(r.level || 1, targetLevel);
    });
    // 武器也跟着升级
    ownedWeapons.forEach((w) => {
      const wo = S.weapons[w];
      if (wo) wo.level = Math.max(wo.level || 1, targetLevel);
    });
  }

  // 返回 5★ 抽卡记录(按 no 升序,后面会跟 filler 合并)
  return { fivePulls, totalFiveCount: pullNo };
}

export function applyStartSetup(type: StartType, version: string) {
  // 1. 清旧的(连同 setup_done 标记一起清,确保买号/自抽都能干净开始)
  resetState();
  clearSave();
  localStorage.removeItem(SETUP_DONE_KEY);

  // 2. 跳到选定版本(顺带 resetDaily/Weekly 等内部副作用)
  // 注意:advanceTo 会 settleDays,但 S.days 刚 reset 为 0,无月卡可领,no-op
  jumpToVersion(version);

  // 3. 按类型应用 profile
  const profile = resolveProfile(type, version);
  const today = S.today;

  commit(() => {
    S.astrite = profile.astrite;
    S.stamina = profile.stamina;
    S.spent = profile.spent;
    S.days = profile.days;

    if (type === 'buy') {
      // 按天数累积模拟一个老账号
      const { fivePulls, totalFiveCount } = simulateBuyAccountPlaythrough(
        version, profile.days, profile.chainMax || 0, today
      );

      // 填充 4★/3★ filler 记录(profile.logCount - 5★ 数)
      const fillerCount = Math.max(0, profile.logCount - totalFiveCount);
      const filler = generateFillerPulls(fillerCount, today, profile.days);

      // 合并 5★ + filler,按 no 降序(最新在前)
      // 5★ 的 no 从 1 开始,filler 的 no 也从 1 开始,需要重新分配
      // 简单做法:filler no 范围 1 ~ fillerCount,5★ no 范围 fillerCount+1 ~ fillerCount+totalFiveCount
      fivePulls.forEach((p) => { p.no += fillerCount; });
      S.log = [...fivePulls, ...filler].sort((a, b) => b.no - a.no);

      // 同步全局计数器(让 StatsTab 立刻有数据)
      S.total = profile.logCount;
      S.five = totalFiveCount;
      S.four = filler.filter((x: any) => x.r === 4).length;
      S.upHits = totalFiveCount; // 全部 UP 命中
    }
    // newbie: astrite 已降到 1600,0 角色 0 抽卡
    // self: astrite 按 profile 设好,0 角色 0 抽卡
  });

  // 4. 标记已开局 + 落盘 + 重渲染
  localStorage.setItem(SETUP_DONE_KEY, '1');
  saveState();
  rerenderAll();
}

export function isSetupDone(): boolean {
  return localStorage.getItem(SETUP_DONE_KEY) === '1';
}

export function clearSetupDone() {
  localStorage.removeItem(SETUP_DONE_KEY);
}