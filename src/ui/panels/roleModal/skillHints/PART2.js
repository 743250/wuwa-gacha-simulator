// 自动切分 · 角色技能文案 2/5（卡提希娅 ~ 灯灯）
import { makeSkillLines } from '../skillLines.js';
import { ACTION_MULTIPLIER } from '../../../../battle/balance.js';

export const PART2 = {
  '卡提希娅': {
    intro: '气动 · 迅刀 · 主C · 「决意·芙露德莉斯」',
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const hp = stats.hp;

      // ===== 决意系统（不变）=====
      const resolveCap = 3;
      const resolveDmgPct = 10;
      const resolveBonus = 1 + (resolveCap * resolveDmgPct / 100); // 满决意 = 1.30

      // ===== HP 核倍率 =====
      const normalMult = 0.12;
      const skillMult  = 0.22;
      const burstFurBase = 0.462;  // 第二次解放基础倍率
      const chain3Bonus  = chain >= 3 ? 0.60 : 0;

      // ===== 伤害数字（满决意时）=====
      const normalDmg   = Math.round(hp * normalMult * resolveBonus);
      const skillDmg    = Math.round(hp * skillMult * resolveBonus);
      // 第二次解放：显示风蚀 0 层基础值，每层 +20% 在 tooltip 中说明
      const burstFurBaseDmg = Math.round(hp * (burstFurBase + chain3Bonus));
      const burstFurMain = burstFurBaseDmg;
      const burstFurSide = Math.round(burstFurBaseDmg * 0.5);
      const varDmg      = Math.round(hp * 0.10 * resolveBonus);
      const varConcerto = Math.round(hp * 0.20 * resolveBonus);

      // ===== tooltips =====
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 生命 <b>${hp}</b> × ${(normalMult*100).toFixed(0)}% × 满决意 ${resolveBonus.toFixed(2)} = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">伤害基于生命值</span>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 生命 <b>${hp}</b> × ${(skillMult*100).toFixed(0)}% × 满决意 ${resolveBonus.toFixed(2)} = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const burstFurMainTip = tipAttr(
        `<b style="color:var(--gold)">解放·看潮怒风哮之刃（主目标 · 风蚀 0 层）</b><br>` +
        `= 生命 <b>${hp}</b> × (${(burstFurBase*100).toFixed(1)}%` +
        (chain3Bonus > 0 ? ` + <b style="color:var(--gold)">链3 ${(chain3Bonus*100).toFixed(0)}%</b>` : '') +
        `)<br>= <b style="color:#ff8c5e">${burstFurMain}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">敌人每层<b class="term-resource">风蚀效应</b> +20% 最终伤害<br>例：5 层 = ${burstFurMain} × 2.0 = <b>${Math.round(burstFurMain * 2.0)}</b></span>`
      );
      const burstFurSideTip = tipAttr(
        `<b style="color:var(--gold)">解放·看潮怒风哮之刃（副目标）</b><br>` +
        `= 主目标伤害 × 50% = <b style="color:#ff8c5e">${burstFurSide}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">同样受风蚀层数加成</span>`
      );
      const burstFurTip = tipAttr(
        `<b style="color:var(--gold)">解放·看潮怒风哮之刃 伤害公式</b><br>` +
        `= 生命 <b>${hp}</b> × (${(burstFurBase*100).toFixed(1)}%` +
        (chain3Bonus > 0 ? ` + <b style="color:var(--gold)">链3 ${(chain3Bonus*100).toFixed(0)}%</b>` : '') +
        `) × (1 + <b class="term-resource">风蚀效应</b>层数 × 20%)<br>` +
        `· 主目标（0 层）：<b style="color:#ff8c5e">${burstFurMain}</b><br>` +
        `· 主目标（5 层）：<b style="color:#ff8c5e">${Math.round(burstFurMain * 2.0)}</b><br>` +
        `· 副目标 = 主目标 × 50%<br>` +
        `<span style="color:var(--muted);font-size:10px">施放后清空全部风蚀层数，退出芙露德莉斯形态</span>`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `= 生命 <b>${hp}</b> × 10% × 满决意 ${resolveBonus.toFixed(2)} = ${varDmg}<br>` +
        `· 协奏满：× 20% × 满决意 ${resolveBonus.toFixed(2)} = <b style="color:var(--accent)">${varConcerto}</b>`
      );

      // 决意工具提示
      const resolveTip = tipAttr(
        `<b style="color:var(--gold)">决意机制</b><br>` +
        `普攻 / 共鸣技能命中获得 <b>1</b> 层【决意】（上限 ${resolveCap} 层，持续 2 回合）。<br>` +
        `获得新决意时刷新全部持续时间。<br>` +
        `每层：气动伤害 +${resolveDmgPct}%（满 ${resolveCap} 层 = +${resolveCap * resolveDmgPct}%）`
      );
      const furTip = tipAttr(
        `<b style="color:var(--gold)">芙露德莉斯形态</b><br>` +
        `持续 <b>3</b> 回合：<br>` +
        `· 每次攻击 / 技能附加 <b>1</b> 层<b class="term-resource">风蚀效应</b><br>` +
        `· 命中额外回复 <b>+8</b> 共鸣能量<br>` +
        `· 形态结束时清除人权/神权/异权`
      );

      // ===== 共鸣链效果（仅用于对应技能行内，不集中 dump）=====

      return [
        {
          icon: '⚔', name: '普攻 · 以剑奉读此身', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">气动伤害</b>，回复 12 能量、+8 协奏。<br>获得 <b>1</b> 层<span class="tip" data-tip='${resolveTip}'><b class="term-resource">【决意】</b></span>（上限 ${resolveCap} 层，持续 2 回合，刷新机制）。`
        },
        {
          icon: '✦', name: '共鸣技能 · 看潮怒风', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">气动伤害</b>，回复 22 能量。<br>获得 <b>1</b> 层<span class="tip" data-tip='${resolveTip}'><b class="term-resource">【决意】</b></span>（上限 ${resolveCap} 层，持续 2 回合，刷新机制）。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 听骑士从心祈愿', cost: `0 AP · 需能量满 ${stats.maxEnergy || 125}`,
          color: 'var(--gold)',
          desc: `<b style="color:#a78bff">进入芙露德莉斯形态，无直接伤害。</b><br><br>` +
                `<b>消耗当前全部【决意】层数</b>，根据层数获得形态之力：<br>` +
                `<span style="color:var(--muted)">· 1 层：</span> <b class="term-resource">人权</b> <span style="color:var(--muted)">· 2 层：</span> <b class="term-resource">神权</b> <span style="color:var(--muted)">· 3 层：</span> <b class="term-resource">异权</b><br><br>` +
                `切换至<span class="tip" data-tip='${furTip}'><b style="color:#a78bff">芙露德莉斯形态</b></span>，持续 <b>3</b> 回合。${chain>=4?`<br><span style="color:var(--gold)">[4链]</span> 附加风蚀时全队元素伤害 +20%（2 回合）。`:''}`
        },
        {
          icon: '⚡', name: '共鸣解放 · 看潮怒风哮之刃', cost: `3 AP · 需芙露德莉斯形态中 + 能量满 ${stats.maxEnergy || 125}`,
          color: '#ff6b9d',
          desc: `<span class="tip" data-tip='${burstFurTip}'><b style="color:#ff6b9d">风蚀爆发</b></span>：对主目标造成 <span class="tip" data-tip='${burstFurMainTip}'><b style="color:#ff8c5e">${burstFurMain}</b></span> 点、副目标 <span class="tip" data-tip='${burstFurSideTip}'><b>${burstFurSide}</b></span> 点<b class="term-burst">气动伤害</b>（风蚀 <b>0</b> 层时）。<br>` +
                `敌人每层<b class="term-resource">【风蚀效应】</b>使此技能伤害 <b>+20%</b>（5 层时主目标 <b style="color:#ff8c5e">${Math.round(burstFurMain * 2.0)}</b>）。<br>` +
                `施放后清空全部<b class="term-resource">风蚀效应</b>层数，退出<b class="term-resource">芙露德莉斯</b>形态。${chain>=3?`<br><span style="color:var(--gold)">[3链]</span> 倍率 +60% 最大生命。`:''}${chain>=6?`<br><span style="color:var(--gold)">[6链]</span> <b class="term-resource">风蚀效应</b>层数翻倍，立即触发一次伤害，不清空层数。`:''}`
        },
        {
          icon: '🎵', name: '变奏技能 · 此剑，为自由的未来', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `对主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">气动伤害</b>。${chain>=2?`<br><span style="color:var(--gold)">[2链]</span> 变奏上场时给主目标附加 1 层<b class="term-resource">风蚀效应</b>。`:''}`
        }
      ];
    },
    forteName: '决意 / 风蚀效应',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 决意</span><br>普攻/共鸣技能积攒<b class="term-resource">【决意】</b>（上限 3 层），每层气动伤害 +10%，持续 2 回合。<br><br>' +
      '<span style="color:var(--gold);font-size:11px">▸ 双形态循环</span><br>' +
      '满决意后施放<b class="term-burst">共鸣解放·听骑士从心祈愿</b>进入<b style="color:#a78bff">芙露德莉斯形态</b>（3 回合）。<br>' +
      '芙露德莉斯形态下：攻击附加<b class="term-resource">风蚀效应</b> · 命中额外回能 · 可施放终结解放。<br><br>' +
      '<span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>' +
      '叠满 3 层决意，解放·听骑士从心祈愿进入芙露德莉斯形态，攻击叠风蚀，解放·看潮怒风哮之刃爆发，回到常态重新循环。'
  },
  '嘉贝莉娜': {
    intro: '热熔 · 佩枪 · 主C · 「猎杀阈值」强化解放爆发',
    hasHeavy: true,
    customLines: (stats, role) => {
      const atk = stats.atk || 0;
      const chain = role.chain || 0;
      const tip = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      // Phase 3 · N130 / S140 / H400 / 解放全局 700·350 × 猎杀阈值
      const normalBase = 1.3;
      const skillBase = 1.4 * (1 + (chain >= 5 ? 1.5 : 0));
      const heavyBaseM = 4.0;
      const burstBase = ACTION_MULTIPLIER.burstMain * (1 + (chain >= 3 ? 1.3 : 0));
      const threshMult = chain >= 6 ? 2.1 : 1.6;
      const allDmg = chain >= 6 ? 0.6 : 0;
      const skill = Math.round(atk * skillBase * (1 + allDmg));
      const heavy = Math.round(atk * heavyBaseM * (1 + allDmg));
      const burstMain = Math.round(atk * burstBase * (1 + allDmg));
      const burstSide = Math.round(atk * ACTION_MULTIPLIER.burstSide * (1 + (chain >= 3 ? 1.3 : 0)) * (1 + allDmg));
      const burstMainFull = Math.round(atk * burstBase * threshMult * (1 + allDmg));
      return [
        {
          name: '普攻',
          desc: `造成 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × 130%`)}'>${Math.round(atk * normalBase * (1 + allDmg))}</b> 点热熔伤害，猎杀阈值 +8。`
        },
        {
          name: '共鸣技能',
          desc: `造成 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × ${(skillBase * 100).toFixed(0)}%`)}'>${skill}</b> 点热熔伤害，猎杀阈值 +18。` +
            (chain >= 5 ? ' <span style="color:var(--gold)">[5链] 技能伤害 +150%。</span>' : '')
        },
        {
          name: '重击',
          desc: `造成 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × 400%`)}'>${heavy}</b> 点热熔伤害，猎杀阈值 +12。`
        },
        {
          name: '共鸣解放 · 炼净',
          desc: `主目标 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × ${(burstBase * 100).toFixed(0)}%`)}'>${burstMain}</b> / 副目标 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × ${(ACTION_MULTIPLIER.burstSide * 100 * (1 + (chain >= 3 ? 1.3 : 0))).toFixed(0)}%`)}'>${burstSide}</b> 热熔伤害。猎杀阈值满时 ×${threshMult.toFixed(1)}，主目标 <b class="tip-num" data-tip='${tip(`满阈值 = 攻击 ${atk} × ${(burstBase * 100).toFixed(0)}% × ${threshMult}`)}'>${burstMainFull}</b>。` +
            (chain >= 1 ? ' <span style="color:var(--gold)">[1链] 暴伤 +80%。</span>' : '') +
            (chain >= 2 ? ' <span style="color:var(--gold)">[2链] 攻击 +150%。</span>' : '') +
            (chain >= 3 ? ' <span style="color:var(--gold)">[3链] 解放伤害 +130%。</span>' : '') +
            (chain >= 4 ? ' <span style="color:var(--gold)">[4链] 解放后全队全伤害 +20%（3 回合）。</span>' : '') +
            (chain >= 6 ? ' <span style="color:var(--gold)">[6链] 全伤害 +60%；满阈值解放 ×2.1。</span>' : '')
        }
      ];
    },
    forteName: '猎杀阈值',
    forteDesc: '嘉贝莉娜核心资源 <b class="term-resource">猎杀阈值</b>（0-100）：<br>· <b class="term-normal">普攻</b>+8，<b class="term-skill">共鸣技能</b>+18，<b class="term-heavy">重击</b>+12，<b class="term-burst">共鸣解放</b>+25。<br>· 满 100 时下一发<b class="term-burst">共鸣解放·炼净</b>伤害 ×1.6（6 链 ×2.1），施放后重置。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能/重击攒阈值，满阈值开炼净爆发。'
  },
  '卡卡罗': {
    intro: '导电 · 长刃 · 主C · 「杀戮武装」',
    customLines: makeSkillLines({
      element: '导电',
      normalName: '猎犬剑技·獠牙撕扯', skillName: '灭杀指令', heavyName: '死告', burstName: '幻影蚀刻', varName: '全境通缉',
      normalMult: 1.7, skillMult: 2.4, heavyMult: 4.0,
      burstMain: 6.0, burstSide: 3.0, variationMult: 2.0,
      heavyMech: '<span style="color:var(--muted)">终结段：</span><b class="term-heavy">重击·死告</b>攻击力 <b>400%</b> 导电；6 链额外召唤 2 个<b class="term-resource">猎杀影</b>协同。',
      burstMech: '<span style="color:var(--muted)">形态切换：</span>释放后进入<b class="term-resource">杀戮武装</b> <b>3</b> 回合；期间普攻/技能伤害 ×1.5。',
      hasHeavy: true,
      skillFollowUp: '1 链：共鸣技能命中额外回 10 能量。 2 链：变奏后共鸣技能 +30%。',
      heavyFollowUp: '6 链：召唤 2 个<b class="term-resource">猎杀影</b><b class="term-resource">协同攻击</b>。',
      burstFollowUp: '3 链：武装期间导电 +25%。 4 链：延奏后全队导电 +20%。 5 链：变奏伤害 +50%。'
    }),
    forteName: '杀意',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普攻/技能攒能量<br>· 释放<b class="term-burst">共鸣解放·幻影蚀刻</b>（主 600% / 副 300%）进入<b class="term-resource">杀戮武装</b> <b>3</b> 回合<br>· 武装期间：普攻/技能 ×1.5；重击·死告收尾；6 链召唤猎杀影协同<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能攒能量，满能量开解放入武装，窗内普攻/技能倾泻，重击·死告收尾。'
  },
  '布兰特': {
    intro: '热熔 · 迅刀 · 辅助 · 「火焰归亡曲」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '生活皆舞台', skillName: '起锚！', heavyName: '狂想即兴', burstName: '火焰归亡曲', varName: '为我！',
      // Phase 3 · S320 / H400 / 未满解放 680·340；满航路火焰归亡曲 1889·944（WIKI）
      normalMult: 1.0, skillMult: 3.2, heavyMult: 4.0, burstMain: 6.80, burstSide: 3.40, variationMult: 2.5, concertoVariationMult: 5.0,
      hasHeavy: true,
      heavyMech: '<span style="color:var(--muted)">空中攻击：</span>布兰特的空中攻击派生<b class="term-heavy">重击·狂想即兴</b>，造成热熔伤害并积攒<b class="term-resource">航路</b>。',
      skillMech: '<span style="color:var(--muted)">共鸣技能：</span><b class="term-skill">共鸣技能·起锚！</b>造成热熔伤害并积攒<b class="term-resource">航路</b>。',
      burstMech: '<span style="color:var(--muted)">爆发形态：</span>未满航路解放主 atk×680%/副×340%；满<b class="term-resource">航路</b>时施放<b class="term-burst">共鸣解放·火焰归亡曲</b>主 atk×1889%/副×944% + 全队治疗。6 链后解放附加<b class="term-normal">再燃</b>，额外 30% 热熔伤害。',
      skillFollowUp: '1 链：变奏/空中攻击 +20%，叠 3 层（满 +60%）。',
      heavyFollowUp: '空中攻击可积攒<b class="term-resource">航路</b>。',
      burstFollowUp: '满航路时解放：全队治疗。 2 链：延奏后下个角色技能触发爆炸 atk × 440%。 3 链：火焰归亡曲伤害 +42%。 4 链：护盾 +20% + 全队回血。 5 链：普攻伤害 +15%。 6 链：解放后再燃 +30%。'
    }),
    forteName: '航路',
    forteDesc: '布兰特是<b style="color:#ff8c5e">热熔辅助</b>：<b class="term-variation">变奏·为我！</b>获 3 层<b class="term-resource">乘风</b>（每层 +20% 伤害，满 +60%），<b class="term-burst">火焰归亡曲</b>给全队治疗。满<b class="term-resource">航路</b>时解放替换为火焰归亡曲（主 atk×1889%/副×944%）。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏入场叠 3 层乘风，攒满航路，共鸣解放·火焰归亡曲治疗全队并造成范围伤害，切主C 爆发（2 链延奏爆炸）。'
  },
  '坎特蕾拉': {
    intro: '湮灭 · 音感仪 · 副C · 「蜃境」',
    customLines: makeSkillLines({
      element: '湮灭',
      normalName: '蛰幻', skillName: '翩跹', heavyName: '浮潜幻海', burstName: '陷溺', varName: '幻梦入场',
      // Phase 3 · WIKI N100 / S380 / H400 / 陷溺 376·188（满迷离×1.8→677·338）/ 变奏 120
      normalMult: 1.0, skillMult: 3.8, heavyMult: 4.0, burstMain: 3.76, burstSide: 1.88, variationMult: 1.2,
      hasHeavy: true,
      heavyMech: '<span style="color:var(--muted)">重击形态切换：</span>拥有<b class="term-resource">迷离</b>时，重击替换为<b>浮潜幻海</b>，造成湮灭伤害，进入<b class="term-resource">蜃境</b>状态（已在蜃境则不重复进入）。',
      burstMech: '<span style="color:var(--muted)">强化条件：</span>主 atk×376% / 副 atk×188%；满<b class="term-resource">迷离</b>时解放 ×1.8（主 677% / 副 338%）。释放后可附加<b class="term-resource">迷梦</b>；3 链时直接进入<b class="term-resource">蜃境</b>。',
      skillMech: '<span style="color:var(--muted)">资源积累：</span>施放共鸣技能 atk×380%，回复迷离。迷离满后解放进入强化。',
      skillFollowUp: '回 1 点<b class="term-resource">迷离</b>。 1 链：共鸣技能 +50%。',
      heavyFollowUp: '持有迷离时，重击变为浮潜幻海并进入蜃境。',
      burstFollowUp: '附加<b class="term-resource">迷梦</b>状态，触发<b class="term-resource">惊醒</b>。 2 链：惊醒伤害倍率 +245%。 3 链：解放·陷溺 +370% + 直接进入蜃境。 4 链：蜃境治疗加成 +25%。 6 链：解放期间无视 30% 防御。'
    }),
    forteName: '迷离',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 共鸣技能每次 +1 <b class="term-resource">迷离</b><br>· 释放<b class="term-burst">共鸣解放·陷溺</b>给目标附加<b class="term-resource">迷梦</b>，后续命中触发<b class="term-resource">惊醒</b><br>· 3 链：释放陷溺后直接进入<b class="term-resource">蜃境</b>；无 3 链时需迷离满才进入<br>· 蜃境期间治疗 +25%（4 链）并强化输出<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能积迷离，共鸣解放·陷溺挂迷梦，触发惊醒，进入蜃境继续输出。'
  },

  // ===== 常驻 5★ =====
  '维里奈': {
    intro: '衍射 · 音感仪 · 治疗 · 「光合标记」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '育苗', skillName: '扩繁试验', burstName: '草木生长', varName: '蔓延',
      // Phase 3 · N100 / S120 / 解放 200·100 / 变奏 100（治疗位低伤）
      normalMult: 1.0, skillMult: 1.2, burstMain: 2.0, burstSide: 1.0, variationMult: 1.0,
      skillFollowUp: '回 <b class="term-resource">光合能量</b>。 2 链：技能额外回 1 光合 + 10 协奏。',
      burstFollowUp: '<b class="term-burst">解放</b>给全队挂<b class="term-resource">光合标记</b>（持续治疗）。 3 链：<b class="term-resource">光合标记</b>治疗加成 +12%。 4 链：重击/解放/延奏后全队衍射 +15%。 5 链：治疗低 HP 角色时治疗 +20%。 6 链：重击·星星花绽放 +20% + <b class="term-resource">协同攻击</b>。'
    }),
    forteName: '光合能量',
    forteDesc: '维里奈是<b style="color:var(--accent)">衍射治疗</b>位：<b class="term-burst">共鸣解放·草木生长</b>给全队<b class="term-resource">光合标记</b>持续回血，<b class="term-resource">延奏·盛放</b>给登场角色额外回血。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻技能积能量，解放铺光合标记，切到主C，后续切回挂延奏。'
  },
  '安可': {
    intro: '热熔 · 佩枪 · 主C · 「黑咩」',
    customLines: makeSkillLines({
      element: '热熔',
      forteName: '失序值',
      normalNameWhite: '羊咩出击', normalNameBlack: '黑咩·胡闹',
      skillNameWhite: '热力羊咩', skillNameBlack: '黑咩·狂热',
      heavyNameWhite: '白咩·失控之炎', heavyNameBlack: '黑咩·暴走之炎', burstName: '黑咩大暴走', varName: '咩咩帮手',
      normalMult: 1.0, skillMult: 2.2, heavyMult: 4.0,
      burstMain: 0, burstSide: 0, variationMult: 2.0,
      normalForteGainWhite: 25, normalForteGainBlack: 10,
      skillForteGainWhite: 35, skillForteGainBlack: 10,
      hasHeavy: true,
      burstMechWhite: '施放后进入<b style="color:#a78bff">黑咩形态</b> <b>4</b> 回合（无独立开场大伤）；期间普攻/技能 ×1.5，命中额外 +<b>10</b> <b class="term-resource">失序值</b>。',
      burstMechBlack: '<b style="color:#a78bff">黑咩形态</b>期间普攻/技能 ×1.5；<b class="term-resource">失序值</b>满时重击触发<b class="term-burst">黑咩·暴走之炎</b>（775% 解放伤）。',
      encoreBurstToggle: true,
      skillFollowUp: '1 链：普攻命中给自身热熔 +3%/层（最多 4 层）。 2 链：普攻/共鸣技能额外回 10 能量。 5 链：共鸣技能伤害加成 +35%。',
      heavyFollowUp: '3 链：失控之炎 / 暴走之炎倍率 +40%。 4 链：暴走之炎后全队热熔 +20%。',
      burstFollowUp: '6 链：黑咩期间每段伤害叠 1 层<b class="term-resource">迷失羔羊</b>（攻击 +5%，最多 5 层）。'
    }),
    showSkillModeToggle: true,
    forteName: '失序值',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 核心资源</span><br>· <b class="term-resource">失序值</b> 0-100：普攻 +25 / 共鸣技能 +35 / 变奏 +30 / 通常重击 +20；黑咩形态内命中额外 +10<br>· 失序满时重击：白咩·失控之炎 <b>500%</b> / 黑咩·暴走之炎 <b>775%</b>（共鸣解放伤害），并清空失序<br>· 共鸣解放仅开黑咩窗 4 回合，无独立开场大伤'
  },
  '凌阳': {
    intro: '冷凝 · 臂铠 · 主C · 「狮子奋迅」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '常态·凛凛威风拳', skillName: '冲掌·势式相承', burstName: '奋进·狮子奋迅，俱足万行', varName: '出洞·睡狮蛰醒',
      // Phase 3 · N125 / S210 / 解放 400·200 / 变奏 100
      normalMult: 1.25, skillMult: 2.1, burstMain: 4.0, burstSide: 2.0, variationMult: 1.0,
      skillMech: '<span style="color:var(--muted)">行狮期间：</span>共鸣技能后下次普攻会获得 6 链强化（若已激活）。',
      burstMech: '<span style="color:var(--muted)">形态切换：</span>主 atk×400% / 副 atk×200%。释放后进入<b class="term-resource">行狮</b>形态；期间普攻/技能获得强化，6 链时技能后下次普攻 +100%。',
      skillFollowUp: '6 链：行狮状态下，共鸣技能后下次普攻 +100%。',
      burstFollowUp: '开启<b style="color:var(--gold)">行狮形态</b>。 2 链：变奏额外回 10 能量。 3 链：解放期间普攻 +20% / 技能 +10%。 4 链：延奏给全队冷凝 +20%。 5 链：解放额外 atk × 200% 冷凝伤害。'
    }),
    forteName: '行狮',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普通普攻/技能循环<br>· 释放<b class="term-burst">共鸣解放·狮子奋迅</b>进入<b class="term-resource">行狮</b>形态<br>· 行狮期间：3 链给普攻 +20% / 技能 +10%；6 链每次技能后下次普攻 +100%<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>变奏入场，共鸣解放进入行狮，技能，强化普攻，重复循环。'
  },
  '鉴心': {
    intro: '气动 · 臂铠 · 辅助 · 「涤净力场」',
    customLines: makeSkillLines({
      element: '气动',
      normalName: '风仪拳术', skillName: '静气循行', burstName: '涤净力场', varName: '掌息之要',
      // Phase 3 · N110 / S300 / H400 / 解放 650·325 / 变奏 100
      normalMult: 1.1, skillMult: 3.0, heavyMult: 4.0, burstMain: 6.5, burstSide: 3.25, variationMult: 1.0,
      hasHeavy: true,
      burstMech: '<span style="color:var(--muted)">重击联动：</span>主 atk×650% / 副 atk×325%。施放<b class="term-heavy">重击·混元气旋</b>后，4 链会让<b class="term-burst">涤净力场</b>伤害 +80%。',
      skillMech: '<span style="color:var(--muted)">派生条件：</span>施放<b class="term-skill">静气循行</b>（atk×300%）进入<b class="term-resource">架势</b>，保持 <b>1</b> 回合后下次技能变为<b class="term-skill">行气反击</b>。',
      skillFollowUp: '进入<b class="term-resource">架势</b>。 1 链：变奏后 2 回合普攻积气 ×2。 2 链：技能伤害 +30%。 3 链：架势期间行气反击伤害 +15%。',
      burstFollowUp: '<b class="term-burst">涤净力场</b>清场。 4 链：重击·混元气旋后解放 +80%（2 回合）。 5 链：解放伤害 +10%。 6 链：重击伤害 +80%。',
      normalFollowUp: '1 链：变奏入场后 2 回合内，普攻获得的<b class="term-resource">气</b>额外 +100%。',
    }),
    forteName: '架势',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 派生条件</span><br>· 施放<b class="term-skill">共鸣技能·静气循行</b>进入<b class="term-resource">架势</b><br>· 架势保持 <b>1</b> 回合后，再次施放技能触发<b class="term-skill">行气反击</b><br>· 6 链：重击·混元气旋期间可施放特殊行气反击（atk×557% 重击类型）<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能进入架势，等待 1 回合或技能派生，行气反击，重击·混元气旋，共鸣解放·涤净力场。'
  },

  // ===== 4★ 角色 =====
  '莫特斐': {
    intro: '热熔 · 佩枪 · 副C · 「浮翼狂想协同」',
    customLines: makeSkillLines({
      normalMult: 1.2, skillMult: 2.1, burstMain: 3.2, burstSide: 1.6, variationMult: 1.7,
      element: '热熔',
      normalName: '即兴发挥', skillName: '激昂变奏', burstName: '暴烈终曲', varName: '不协和音',
      skillFollowUp: '4 链：技能命中后全队热熔 +12%。',
      burstFollowUp: '<b class="term-burst">浮翼狂想</b>协同窗口：主C 用技能时莫特斐补刀。 1 链：解放期间共鸣技能触发协同。 2 链：声骸后额外回 10 能量。 3 链：加强音暴伤 +30%。 4 链：解放时长 +1 回合。 5 链：共鸣技能命中触发协同。 6 链：解放·暴烈终曲时全队攻击 +20%。'
    }),
    forteDesc: '莫特斐是<b style="color:#ff8c5e">热熔副C</b>：<b class="term-burst">共鸣解放·浮翼狂想</b>开启协同窗口，主C 用技能时莫特斐补刀。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>解放铺协同攻击窗口，切到主C 用技能触发莫特斐协同。'
  },
  '散华': {
    intro: '冷凝 · 迅刀 · 副C · 「冰棘 · 重击爆裂」',
    customLines: makeSkillLines({
      normalMult: 1.2, skillMult: 3.6, heavyMult: 3.7, burstMain: 8.1, burstSide: 4.05, variationMult: 1.4,
      element: '冷凝',
      normalName: '寒光', skillName: '朔雪永冻', heavyName: '爆裂', burstName: '焦瞑冻土', varName: '凛刺',
      hasHeavy: true,
      skillFollowUp: '1 链：每第 5 次普攻后暴击 +15%，持续 2 回合。',
      heavyFollowUp: '需<b class="term-resource">冰棘</b>满。2 链：重击伤害 +20%。4 链：解放后下次爆裂 +120%。5 链：爆裂暴伤 +100%。6 链：爆裂后全队攻击 +10%，可叠 2 层。',
      burstFollowUp: '4 链：回复 10 点共鸣能量，并强化下次<b class="term-heavy">重击·爆裂</b>。',
      varFollowUp: '获得 15 点<b class="term-resource">冰棘</b>。延奏·凛絜：下一位登场角色普攻伤害加深 38%，持续 2 回合。'
    }),
    forteDesc: '散华是<b style="color:#7bd6ff">冷凝副C</b>：核心是攒满<b class="term-resource">冰棘</b>后施放<b class="term-heavy">重击·爆裂</b>，再以延奏·凛絜交棒。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能灌冰棘 →（可选解放挂 4 链窗）→ 重击·爆裂清空 → 切换交给主 C。'
  },
  '卜灵': {
    intro: '导电 · 音感仪 · 辅助 · 「五雷荡煞阵」',
    customLines: makeSkillLines({
      normalMult: 1.0, skillMult: 0.6, burstMain: 5.4, burstSide: 2.7, variationMult: 1.3,
      element: '导电',
      normalName: '符咒', skillName: '五雷荡煞阵', burstName: '飞雷诀·归一', varName: '索拉云游',
      skillFollowUp: '<b class="term-resource">五雷荡煞阵</b>给团队附加电磁效应并治疗。 5 链：荡煞阵生成时附加 6 层<b class="term-resource">电磁效应</b>。',
      burstFollowUp: '<b class="term-burst">飞雷诀</b>清场。 1 链：解放暴击 +20%。 2 链：<b class="term-resource">阴阳相生</b>回 25 能量。 3 链：荡煞阵期间全队 HP <50% 时治疗。 4 链：治疗加成 +20%。 6 链：<b class="term-resource">雷法·三才合一</b>时全队共鸣技能 +50%。'
    }),
    forteDesc: '卜灵是<b style="color:#7bd6ff">导电辅助</b>：<b class="term-skill">五雷荡煞阵</b>给团队附加电磁效应并治疗，最强的 6 链全队<b class="term-skill">共鸣技能 +30%</b> 是核心辅助价值。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>开场共鸣技能铺雷阵，解放·飞雷诀爆发，切到主C 享受全队共鸣技能伤害提升。'
  },
  '丹瑾': {
    intro: '湮灭 · 迅刀 · 副C · 「朱蚀之刻」',
    customLines: makeSkillLines({
      normalMult: 1.0, skillMult: 3.5, burstMain: 7.9, burstSide: 3.95, variationMult: 2.0,
      element: '湮灭',
      normalName: '执刃', skillName: '朱华残章', burstName: '绯红绽放', varName: '击雠',
      skillFollowUp: '给目标附加<b class="term-resource">朱蚀之刻</b>。 1 链：攻击带朱蚀目标 +5%/层（满 6 层 +30%）。 2 链：攻击带朱蚀目标伤害 +20%。',
      burstFollowUp: '3 链：共鸣解放伤害加成 +30%。 4 链：彤华 ≥ 60 时暴击 +15%。 5 链：湮灭伤害 +15%。 6 链：重击·缭乱后全队攻击 +20%。'
    }),
    forteDesc: '丹瑾是<b style="color:#a78bff">湮灭副C</b>：核心是<b class="term-resource">朱蚀之刻</b>给目标附加朱蚀之刻，攻击朱蚀目标享受所有 1/2 链加成。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能挂朱蚀，普攻/重击堆攻击层数，共鸣解放爆发。'
  },
  '白芷': {
    intro: '冷凝 · 音感仪 · 治疗 · 「念意」',
    customLines: makeSkillLines({
      normalMult: 1.0, skillMult: 0.2, burstMain: 0.5, burstSide: 0.25, variationMult: 0.8,
      element: '冷凝',
      normalName: '应许', skillName: '应急预案', burstName: '刹那合弥', varName: '覆雪流盈',
      burstMech: '<span style="color:var(--muted)">治疗派生：</span>释放<b class="term-burst">刹那合弥</b>触发<b class="term-skill">频隙回响</b>多段治疗。',
      skillMech: '<span style="color:var(--muted)">资源消耗：</span>消耗<b class="term-resource">念意</b>治疗队友；满 4 点念意时治疗/冷凝加成更高。',
      skillFollowUp: '消耗<b class="term-resource">念意</b>给自身回能量。 1 链：每<b class="term-resource">念意</b>回 2.5 能量。 2 链：满<b class="term-resource">念意</b>时冷凝/治疗 +15%。',
      burstFollowUp: '<b class="term-burst">刹那合弥</b>触发<b class="term-skill">频隙回响</b>。 3 链：变奏后生命上限 +12%。 4 链：<b class="term-skill">频隙回响</b> +2 段 + 治疗 +20%。 5 链：复活倒下队友（每场战斗 1 次）。 6 链：拾取<b class="term-resource">天籁</b>时全队冷凝 +12%。'
    }),
    forteName: '念意',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 治疗循环</span><br>· <b class="term-resource">念意</b> 0-4：普攻积攒，技能消耗念意治疗队友<br>· 满 4 念意时，共鸣技能治疗更强（2 链：冷凝/治疗 +15%）<br>· 释放<b class="term-burst">共鸣解放·刹那合弥</b>触发<b class="term-skill">频隙回响</b>多段治疗<br>· 5 链：白芷存活时可复活一次倒下队友<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻积念意，共鸣技能治疗，能量满放解放持续回血，切主C 输出。'
  },
  '秋水': {
    intro: '气动 · 佩枪 · 副C · 「雾化分身」',
    customLines: makeSkillLines({
      normalMult: 1.2, skillMult: 0.6, burstMain: 4.0, burstSide: 2.0, variationMult: 2.0,
      element: '气动',
      normalName: '真假参半', skillName: '移位戏法', burstName: '雾里观花', varName: '虚晃一枪',
      burstMech: '<span style="color:var(--muted)">潜行窗口：</span>释放解放后进入<b class="term-resource">迷雾潜行</b>，期间减伤并获得气动增益（5 链）。',
      skillMech: '<span style="color:var(--muted)">召唤物：</span>施放共鸣技能召唤<b class="term-resource">雾化分身</b>并生成<b class="term-resource">虚实之门</b>；分身会<b class="term-resource">嘲讽</b>目标。',
      skillFollowUp: '生成<b class="term-resource">雾化分身</b><b class="term-resource">嘲讽</b>敌人。 1 链：技能冷却 -1 回合。 2 链：攻击被<b class="term-resource">嘲讽</b>目标时攻击 +15%。 3 链：穿<b class="term-resource">虚实之门</b>额外生成 2 颗子弹。 4 链：共鸣技能·雾化子弹 +30%。',
      burstFollowUp: '5 链：<b class="term-resource">迷雾潜行</b>时气动 +25%。 6 链：解放暴击 +8%；重击穿<b class="term-resource">虚实之门</b> +50%。'
    }),
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 机制说明</span><br>· <b class="term-skill">共鸣技能·移位戏法</b>召唤<b class="term-resource">雾化分身</b>，分身嘲讽目标<br>· <b class="term-resource">虚实之门</b>：普攻/重击穿过门时获得额外子弹/伤害<br>· <b class="term-resource">迷雾潜行</b>：释放解放后进入，期间减伤；5 链气动伤害 +25%<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能召分身并开虚实之门，普攻穿门追加子弹，共鸣解放进入迷雾潜行，重击穿门爆发。'
  },
  '炽霞': {
    intro: '热熔 · 佩枪 · 副C · 「炽烈焰火」',
    customLines: makeSkillLines({
      normalMult: 1.2, skillMult: 2.5, burstMain: 9.5, burstSide: 4.75, variationMult: 1.0,
      element: '热熔',
      normalName: '砰砰', skillName: '咻咻斗意', burstName: '炽烈焰火', varName: '堂堂登场',
      skillFollowUp: '1 链：共鸣技能·轰轰必定暴击。 6 链：触发技能·轰轰后全队普攻 +25%。',
      burstFollowUp: '<b class="term-resource">热压弹</b> 60 发持续输出。 2 链：解放期间击败目标回 5 能量。 3 链：解放对低 HP 目标 +40%。 4 链：获 60 弹 + 重置技能 CD。 5 链：<b class="term-resource">加麻加辣</b>满层时攻击 +30%。'
    }),
    forteDesc: '炽霞是<b style="color:#ff8c5e">热熔副C</b>，核心是<b class="term-burst">共鸣解放·炽烈焰火</b>的 60 发热压弹 + 重置技能 CD。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能·轰轰，共鸣解放·炽烈焰火，60 弹高速输出，重置冷却后再放技能。'
  },
  '秧秧': {
    intro: '气动 · 迅刀 · 副C · 「流息·空中释羽」',
    customLines: makeSkillLines({
      normalMult: 1.1, skillMult: 1.4, heavyMult: 2.2, burstMain: 5.6, burstSide: 2.8, variationMult: 1.6,
      element: '气动',
      normalName: '风羽为刃', skillName: '流风载域', heavyName: '空中释羽', burstName: '朔风旋涌', varName: '湛蓝礼赞',
      hasHeavy: true,
      skillFollowUp: '<b class="term-skill">流风载域</b><b class="term-resource">牵引</b>敌人。 3 链：共鸣技能 +40%。',
      heavyFollowUp: '<b class="term-heavy">空中释羽</b>是核心输出段。 4 链：<b class="term-heavy">空中释羽</b> +95%。',
      burstFollowUp: '1 链：变奏后气动 +15%。 2 链：重击命中回 10 能量。 5 链：解放·朔风旋涌 +85%。 6 链：<b class="term-heavy">空中释羽</b>后全队攻击 +20%。',
    }),
    forteDesc: '秧秧是<b style="color:var(--green)">气动副C</b>：<b class="term-skill">流风载域</b>牵引敌人 + <b class="term-heavy">空中释羽</b>主输出。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能铺风场，变奏入场叠气动伤害加成，空中重击释羽爆发。'
  },
  '桃祈': {
    intro: '湮灭 · 长刃 · 辅助 · 「磐岩护壁·攻防转换」',
    customLines: makeSkillLines({
      normalMult: 1.1, skillMult: 1.3, heavyMult: 2.2, burstMain: 4.5, burstSide: 2.25, variationMult: 2.1,
      element: '湮灭',
      normalName: '重器藏锋', skillName: '固若金汤', heavyName: '发后制人', burstName: '不动如山', varName: '携攻守阵',
      hasHeavy: true,
      skillFollowUp: '<b class="term-skill">固若金汤</b>给全队护盾。 3 链：磐岩护壁持续延长。 6 链：磐岩护壁期间普攻/重击 +40%。',
      burstFollowUp: '<b class="term-burst">不动如山</b>反击爆发。 1 链：护盾量 +40%。 2 链：解放暴击/暴伤 +20%。 4 链：重击发后制人触发时回血 + 防御 +50%。 5 链：<b class="term-resource">攻防转换</b>命中回 20 能量。'
    }),
    forteDesc: '桃祈是<b style="color:#a78bff">湮灭辅助</b>（护盾型）：<b class="term-skill">固若金汤</b>给全队护盾，<b class="term-burst">共鸣解放·不动如山</b>反击爆发。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能上护盾，重击发后制人触发反击，共鸣解放收尾。'
  },
  '渊武': {
    intro: '导电 · 臂铠 · 辅助 · 「雷之楔」',
    customLines: makeSkillLines({
      normalMult: 1.1, skillMult: 2.0, burstMain: 3.5, burstSide: 1.75, variationMult: 0.6,
      element: '导电',
      normalName: '雷煌拳', skillName: '拳震凌武', burstName: '寂土重明', varName: '轰雷',
      skillFollowUp: '<b class="term-skill">拳震凌武</b>展开雷之楔。 3 链：<b class="term-skill">雷之楔</b>命中按 20% 防御加伤。',
      burstFollowUp: '<b class="term-burst">寂土重明</b>给全队护盾。 1 链：雷厉风行状态攻速 +20%。 2 链：变奏·轰雷回 15 能量。 5 链：<b class="term-skill">雷之楔</b>在场时解放 +50%。 6 链：<b class="term-skill">雷之楔</b>范围内全队防御 +32%。'
    }),
    forteDesc: '渊武是<b style="color:#7bd6ff">导电辅助</b>：<b class="term-skill">拳震凌武</b>展开雷之楔，<b class="term-burst">共鸣解放·寂土重明</b>给全队护盾。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏入场积能量，共鸣技能召楔，共鸣解放给全队护盾。'
  },
  '釉瑚': {
    intro: '冷凝 · 臂铠 · 副C · 「诗中物对偶/联珠」',
    customLines: makeSkillLines({
      normalMult: 1.0, skillMult: 3.7, burstMain: 3.3, burstSide: 1.65, variationMult: 0.9,
      element: '冷凝',
      normalName: '霜坠', skillName: '匣中问祯', burstName: '如意卜', varName: '遂心匣',
      skillFollowUp: '靠<b class="term-resource">诗中物</b><b class="term-skill">对偶</b>/<b class="term-skill">联珠</b>/<b class="term-skill">合说</b>叠层。 1 链：技能·问祯有 10% 概率免伤。 2 链：<b class="term-skill">对偶</b>/<b class="term-skill">联珠</b>对诗中物效果二次触发。 4 链：20% 概率技能不进 CD。',
      burstFollowUp: '<b class="term-burst">如意卜</b>清场。 3 链：攻击 +20%。 5 链：变奏·遂心匣后暴击 +15%。 6 链：奇珍赏获<b class="term-resource">霁青</b> 4 层（暴击伤害 +60%）。'
    }),
    forteDesc: '釉瑚是<b style="color:#7bd6ff">冷凝副C</b>：靠<b class="term-resource">诗中物</b>的对偶/联珠/合说叠层放大伤害。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能·匣中问祯起手，普攻补段叠层，共鸣解放爆发。'
  },
  '灯灯': {
    intro: '导电 · 长刃 · 副C · 「啾啾专送」',
    customLines: makeSkillLines({
      normalMult: 1.1, skillMult: 3.6, burstMain: 9.5, burstSide: 4.75, variationMult: 1.7,
      element: '导电',
      normalName: '前路领航', skillName: '灯光探照', burstName: '啾啾专送', varName: '专项派送',
      skillFollowUp: '<b class="term-skill">强化·前扑/后撤</b>无视防御。 1 链：<b class="term-skill">强化·后撤</b>回耐力。 2 链：<b class="term-skill">强化·前扑</b>/后撤无视 20% 防御。 5 链：光能满时强光穿射倍率 +100%。',
      burstFollowUp: '3 链：共鸣解放·啾啾专送 +30%。 4 链：普攻伤害加成 +30%。 6 链：解放时全队攻击 +20%。'
    }),
    forteDesc: '灯灯是<b style="color:var(--accent)">导电副C</b>：<b class="term-skill">强化·前扑/后撤</b>无视防御，<b class="term-normal">普攻</b>主输出。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>强化前扑/后撤，普攻铺伤害，共鸣解放·啾啾专送清场。'
  },

};
