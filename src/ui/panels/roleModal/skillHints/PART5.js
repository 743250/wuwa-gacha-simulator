// 自动切分 · 角色技能文案 5/5（莫宁 ~ 漂泊者·气动）
import { makeSkillLines } from '../skillLines.js';
import { ACTION_MULTIPLIER } from '../../../../battle/balance.js';

export const PART5 = {
  '莫宁': {
    intro: '热熔 · 长刃 · 主C · 「干涉标记 · 谐振场 · 广域观测」',
    hasHeavy: false,
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;
      const energyMax = stats.maxEnergy || 175;

      // 共鸣链参数
      const allDmgMult = 1 + (chain >= 1 ? 0.15 : 0);          // 干涉标记伤害提升
      const teamCdmgBonus = chain >= 2 ? 0.32 : 0;              // 全队对干涉目标暴伤 +32%
      const skillMult = 1 + (chain >= 3 ? 0.20 : 0);            // 谐振场额外
      const healBonus = chain >= 4 ? 0.30 : 0;                  // 强谐振场治疗量 +30% (折算)
      const burstMult1 = 1 + (chain >= 5 ? 0.50 : 0);           // 解放伤害 +50%
      const burstMult2 = 1 + (chain >= 6 ? 0.80 : 0);           // 临界协议强化 +80%
      const totalBurstMult = burstMult1 * burstMult2;

      const normalDmg  = Math.round(atk * 1.0 * allDmgMult);
      const skillDmg   = Math.round(atk * 1.5 * skillMult * allDmgMult); // 分布式阵列 §4
      const burstMain  = Math.round(atk * 4.0 * totalBurstMult);
      const burstSide  = Math.round(atk * 2.0 * totalBurstMult);
      const varDmg     = Math.round(atk * 0.8 * allDmgMult);
      const varConcerto = Math.round(atk * 1.6 * allDmgMult);

      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100%${allDmgMult>1?` × 干涉标记 ${allDmgMult.toFixed(2)}`:''} = <b style="color:var(--text)">${normalDmg}</b>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式（分布式阵列）</b><br>` +
        `= 攻击 <b>${atk}</b> × 150%${skillMult>1?` × 谐振场 ${skillMult.toFixed(2)}`:''} = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式（临界协议）</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 400%${burstMult1>1?` × 链 5 <b>${burstMult1.toFixed(2)}</b>`:''}${burstMult2>1?` × 链 6 <b>${burstMult2.toFixed(2)}</b>`:''}= <b style="color:#ff8c5e">${burstMain}</b><br>` +
        `· 副目标：攻击 <b>${atk}</b> × 200%${burstMult1>1?` × ${burstMult1.toFixed(2)}`:''}${burstMult2>1?` × ${burstMult2.toFixed(2)}`:''}= <b style="color:#ff8c5e">${burstSide}</b>`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满：× 160% = <b style="color:var(--accent)">${varConcerto}</b>`
      );
      const markTip = tipAttr(
        `<b style="color:var(--gold)">干涉标记</b><br>` +
        `普攻/技能给目标附加<b class="term-resource">干涉标记</b>，莫宁对干涉目标的伤害提升 15%${chain>=2?`，且全队对干涉目标暴击伤害 +32%`:''}。<br><br>` +
        `<b style="color:var(--gold)">谐振场</b><br>` +
        `共鸣解放展开<b class="term-resource">谐振场</b>，持续提升全队偏谐值累积效率${chain>=4?`，强谐振场额外治疗 +30%`:''}。`
      );

      let chainHints = '';
      const parts = [];
      if (chain >= 1) parts.push(`<span style="color:var(--gold)">[1链]</span> 对干涉目标伤害 +15%`);
      if (chain >= 2) parts.push(`<span style="color:var(--gold)">[2链]</span> 全队对干涉目标暴击伤害 +32%`);
      if (chain >= 3) parts.push(`<span style="color:var(--gold)">[3链]</span> 谐振场额外效果`);
      if (chain >= 4) parts.push(`<span style="color:var(--gold)">[4链]</span> 强谐振场治疗量 +30%（折算）`);
      if (chain >= 5) parts.push(`<span style="color:var(--gold)">[5链]</span> 共鸣解放伤害 +50%（含粒子射流）`);
      if (chain >= 6) parts.push(`<span style="color:var(--gold)">[6链]</span> 临界协议伤害强化 +80%`);
      if (parts.length) chainHints = '<br><span style="color:var(--muted);font-size:10px">·</span> ' + parts.join('<br><span style="color:var(--muted);font-size:10px">·</span> ');

      return [
        {
          icon: '⚔', name: '普攻 · 基态校准 / 广域观测模式', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">热熔伤害</b>，回复 12 能量、+8 协奏。<br>进入<b class="term-resource">广域观测模式</b>后普攻替换为 3 段观测射击。<br><span class="tip" data-tip='${markTip}'>附加<b class="term-resource">干涉标记</b> + <b class="term-resource">观测标记</b></span>（核心增伤标记）。`
        },
        {
          icon: '✦', name: '共鸣技能 · 分布式阵列', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">热熔伤害</b>，回复 22 能量。<br>展开<b class="term-resource">分布式阵列</b>积累<b class="term-resource">相对动能</b>。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 临界协议', cost: `3 AP · 需共鸣能量满 ${energyMax}`,
          color: 'var(--gold)',
          desc: `展开<b class="term-resource">谐振场</b>，对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstMain}</b> 点</span>、副目标 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSide}</b> 点</span><b class="term-burst">热熔伤害</b>。<br>谐振场持续提升全队偏谐值累积效率。${chainHints}`
        },
        {
          icon: '🎵', name: '变奏技能 · 观测入场', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">热熔伤害</b>。`
        }
      ];
    },
    forteName: '相对动能 / 谐振场',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 核心资源</span><br>· <b class="term-resource">相对动能</b>（0-100）：普攻/技能积累，满值可触发额外效果<br>· <b class="term-resource">干涉标记</b>：普攻/技能给目标附加，莫宁对干涉目标伤害提升；2 链全队暴伤 +32%<br>· <b class="term-resource">观测标记</b>：广域观测模式下的特殊标记<br><br><span style="color:var(--gold);font-size:11px">▸ 谐振场</span><br>· 共鸣解放展开<b class="term-resource">谐振场</b>，提升全队偏谐值累积效率<br>· 能量上限 <b>175</b>，较普通角色更多（通常 125）<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻挂干涉标记，广域观测模式射击，共鸣技能积累相对动能，共鸣解放·临界协议展开谐振场，谐振场持续中全队输出。'
  },

  // 3.1 · 爱弥斯（主C 热熔 迅刀）— 震谐/聚爆双模态（ROLE_META / 官方 JSON）
  '爱弥斯': {
    intro: '热熔 · 迅刀 · 主C · 「震谐/聚爆双模态 · 机兵形态」',
    hasHeavy: true,
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;

      // 共鸣链参数
      const heavyCdmgBonus = chain >= 1 ? 0.50 : 0;            // 重击暴击伤害 +300%（折算 50%）
      const skillMult = 1 + (chain >= 2 ? 1.00 : 0);            // 光翼共奏倍率 +100%
      const burstMult = 1 + (chain >= 3 ? 0.50 : 0);            // 解放倍率 +50%
      const teamAllDmg = chain >= 4 ? 0.20 : 0;                 // 全队全属性伤害 +20%
      const chain6Bonus = chain >= 6 ? 0.40 : 0;                // 共鸣解放伤害加深 40%

      const effectiveSkillMult = skillMult;
      const totalBurstMult = burstMult * (1 + chain6Bonus);

      const normalDmg  = Math.round(atk * 1.0);
      const skillDmg   = Math.round(atk * 1.8 * effectiveSkillMult);
      const heavyDmg   = Math.round(atk * 3.0 * (1 + heavyCdmgBonus));    // 重击蓄力·二段
      const burstMain  = Math.round(atk * 4.0 * totalBurstMult);
      const burstSide  = Math.round(atk * 2.0 * totalBurstMult);
      const varDmg     = Math.round(atk * 0.8);
      const varConcerto = Math.round(atk * 1.6);

      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100% = <b style="color:var(--text)">${normalDmg}</b>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式（光翼共奏）</b><br>` +
        `= 攻击 <b>${atk}</b> × 180%${skillMult>1?` × 链 2 倍率 ${skillMult.toFixed(2)}`:''} = <b style="color:var(--accent)">${skillDmg}</b><br>` +
        `<span style="color:var(--muted)">震谐模态：</span>追加震谐伤害<br>` +
        `<span style="color:var(--muted)">聚爆模态：</span>引爆聚爆效应`
      );
      const heavyTip = tipAttr(
        `<b style="color:var(--gold)">重击·蓄力伤害公式</b><br>` +
        `· 一段蓄力：攻击 × 150%<br>` +
        `· 二段蓄力：攻击 <b>${atk}</b> × 300%${heavyCdmgBonus>0?` × 链 1 重击暴伤 ${(1+heavyCdmgBonus).toFixed(2)}`:''} = <b style="color:#ff8c5e">${heavyDmg}</b><br>` +
        `· 即刻响应状态下可快速完成二段蓄力<br>` +
        `· 伤害视为<b class="term-burst">共鸣解放伤害</b>`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式（星辉破界而来）</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 400%${burstMult>1?` × 链 3 <b>${burstMult.toFixed(2)}</b>`:''}${chain6Bonus>0?` × 链 6 <b>${(1+chain6Bonus).toFixed(2)}</b>`:''}= <b style="color:#ff8c5e">${burstMain}</b><br>` +
        `· 副目标：攻击 <b>${atk}</b> × 200%${burstMult>1?` × ${burstMult.toFixed(2)}`:''}${chain6Bonus>0?` × ${(1+chain6Bonus).toFixed(2)}`:''}= <b style="color:#ff8c5e">${burstSide}</b>`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满：× 160% = <b style="color:var(--accent)">${varConcerto}</b>`
      );

      let chainHints = '';
      const parts = [];
      if (chain >= 1) parts.push(`<span style="color:var(--gold)">[1链]</span> 重击暴击伤害 +300%（折算 +50% 倍率）`);
      if (chain >= 2) parts.push(`<span style="color:var(--gold)">[2链]</span> 光翼共奏倍率 +100%`);
      if (chain >= 3) parts.push(`<span style="color:var(--gold)">[3链]</span> 共鸣解放倍率 +50%`);
      if (chain >= 4) parts.push(`<span style="color:var(--gold)">[4链]</span> 全队全属性伤害 +20%`);
      if (chain >= 5) parts.push(`<span style="color:var(--gold)">[5链]</span> 受致命伤时护盾效果`);
      if (chain >= 6) parts.push(`<span style="color:var(--gold)">[6链]</span> 共鸣解放伤害加深 40% + 震谐伤害可暴击（固定 80%/275%）`);
      if (parts.length) chainHints = '<br><span style="color:var(--muted);font-size:10px">·</span> ' + parts.join('<br><span style="color:var(--muted);font-size:10px">·</span> ');

      return [
        {
          icon: '⚔', name: '普攻 · 爱弥斯 / 机兵形态', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">热熔伤害</b>，回复 12 能量、+8 协奏。<br>· <b class="term-resource">震谐</b>模态：普攻带震谐追加伤害<br>· <b class="term-resource">聚爆</b>模态：普攻积累聚爆效应引爆`
        },
        {
          icon: '✦', name: '共鸣技能 · 光翼共奏', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">热熔伤害</b>，回复 22 能量。<br>效果取决于当前模态：震谐模态追加震谐伤害，聚爆模态引爆聚爆效应。`
        },
        {
          icon: '💢', name: '重击 · 蓄力（进入即刻响应）', cost: '1 AP · 蓄力 1-2 段',
          color: '#ff8c5e',
          desc: `<span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavyDmg}</b> 点</span><b class="term-burst">热熔伤害</b>（视为共鸣解放伤害）。<br>· 一段蓄力：常规蓄力攻击<br>· 二段蓄力：高伤害（需即刻响应状态快速完成）<br>· <b class="term-resource">即刻响应</b>状态下快速完成二段蓄力，积累<b class="term-resource">同步率</b>。<br>施放后移除即刻响应。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 星辉破界而来', cost: `3 AP · 需共鸣能量满 ${stats.maxEnergy || 125}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstMain}</b> 点</span>、副目标 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSide}</b> 点</span><b class="term-burst">热熔伤害</b>。<br>· 震谐模态：<b>星辉·终结</b>（高倍率单体）<br>· 聚爆模态：<b>星辉·过载</b>（范围引爆）${chainHints}`
        },
        {
          icon: '🎵', name: '变奏技能 · 以旋律穿越长空', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">热熔伤害</b>。`
        }
      ];
    },
    forteName: '同步率 / 模态',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 双模态系统</span><br>· <b style="color:var(--text)">震谐模态</b>：追加额外震谐伤害，适合持续单体输出<br>· <b style="color:var(--accent)">聚爆模态</b>：引爆聚爆效应，适合范围爆发<br>· 通过<b class="term-skill">光翼共奏</b>切换模态<br><br><span style="color:var(--gold);font-size:11px">▸ 核心资源</span><br>· <b class="term-resource">同步率</b>（0-100）：重击蓄力（即刻响应）积累，满值增强技能<br>· <b class="term-resource">即刻响应</b>：重击蓄力进入，快速完成二段蓄力<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>选择模态，重击蓄力进即刻响应，光翼共奏（模态对应效果），共鸣解放·星辉破界而来（终结/过载），循环。'
  },

  // 3.1 · 陆·赫斯（辅助 衍射 臂铠 · ROLE_META）— 黄金的裁量·谐度破坏
  '陆·赫斯': {
    intro: '衍射 · 臂铠 · 辅助 · 黄金的裁量·谐度破坏',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '衍射', hasHeavy: false, normalMult: 1, skillMult: 1.5, burstMain: 3, burstSide: 1.5, variationMult: 0.6,
      normalName: '凝辉斩',
      skillName: '斩杀日冕 / 流金回潮',
      burstName: '于永冻中释义',
      varName: '注入黎明以前',
      forteName: '日辉庇覆',
      skillMech: '黄金的裁量状态中斩杀日冕获得强化。',
      burstMech: '谐度破坏辅助核心，全队收益。',
      skillFollowUp: '4 链：全队谐度破坏后伤害 +20%。'
    }),
    forteName: '谐度破坏',
    forteDesc: '陆·赫斯的核心机制 <b class="term-resource">谐度破坏</b>：<br>· 攻击附加集谐·干涉层数。<br>· 谐度破坏增幅提升全队伤害。<br>· <b class="term-resource">黄金的裁量</b>状态大幅强化空中攻击和斩杀日冕。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>挂谐度破坏，进黄金的裁量，空中攻击连段并解放。'
  },

  // 3.2 · 西格莉卡（主C 气动 臂铠 · ROLE_META）— 语义·凝语·天赋
  '西格莉卡': {
    intro: '气动 · 臂铠 · 主C · 语义·凝语·天赋',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '气动', hasHeavy: true, normalMult: 1, skillMult: 1.8, heavyMult: 2.2, burstMain: 4, burstSide: 2, variationMult: 0.8,
      normalName: '明悟',
      skillName: '大嘭嘭！ / 日灵帮帮忙',
      burstName: '如那期望般！',
      varName: '在这一瞬间',
      forteName: '凝语',
      skillMech: '施放技能后积累凝语层数。',
      normalMech: '「天赋？」层数提升各技能伤害。',
      skillFollowUp: '6 链：天赋？每层伤害加深 15%，最多 60%。'
    }),
    forteName: '凝语',
    forteDesc: '西格莉卡通过普攻/技能积累<b class="term-resource">凝语</b>层数。<br>· <b class="term-resource">「天赋？」</b>层数上限由 3 提升至 4（1 链），全面提升符语系列伤害。<br>· 脱离战斗 1 回合后获得专注状态。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能攒凝语和天赋？，叠满后解放爆发。'
  },

  // 3.3 · 绯雪（主C 冷凝 迅刀）— 预求身·居合·霜渐效应
  '绯雪': {
    intro: '冷凝 · 迅刀 · 主C · 预求身·居合·霜渐',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '冷凝', hasHeavy: true, normalMult: 1, skillMult: 1.8, heavyMult: 0.01, burstMain: 4, burstSide: 2, variationMult: 0.8,
      normalName: '预求身（普攻）/ 居合',
      skillName: '常世身 / 霜罚·白玉切 / 霜罚·落华',
      burstName: '预求我身·见心 / 预求我身·归刃',
      varName: '踏雪入场',
      forteName: '锻雪·归刃',
      normalMech: '普攻 5 段，第 4/5 段免疫打断；居合为强化普攻。',
      skillMech: '常世身/白玉切/落华积累寒意，触发霜渐效应。',
      skillFollowUp: '6 链：见心/归刃暴击伤害 +500%；全队角色附加霜渐时额外异常倍率。'
    }),
    forteName: '锻雪·归刃',
    forteDesc: '绯雪的<b class="term-resource">锻雪·归刃</b>是非战斗回复机制：<br>· 脱离战斗 1 回合后回复 3 点锻雪。<br>· <b class="term-resource">雪锈</b>层数提升霜渐效应附加效率。<br>· 2 层雪锈时霜渐额外倍率 +488%。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻连段，居合追击，触发霜渐，解放归刃终结。'
  },

  // 3.3 · 达妮娅（主C 热熔 音感仪 · ROLE_META）— 布景/幻灭双形态·黯核
  '达妮娅': {
    intro: '热熔 · 音感仪 · 主C · 布景/幻灭双形态·黯核',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '热熔', hasHeavy: false, normalMult: 1, skillMult: 1.8, burstMain: 4, burstSide: 2, variationMult: 0.8,
      normalName: '布景之形 / 幻灭之形',
      skillName: '拟态泡泡·布景之形 / 放逐·幻灭之形',
      burstName: '帷幕终景',
      varName: '形态切换入场',
      forteName: '黯核',
      normalMech: '布景形态远程，幻灭形态近战。',
      burstMech: '帷幕终景根据当前形态有不同效果。',
      skillFollowUp: '3 链：黯核上限 5 枚，熵变强化大幅提升技能倍率。<br>6 链：熵变强化时攻击 +60%，热熔伤害 +60%。'
    }),
    forteName: '黯核 / 虚质粒子',
    forteDesc: '达妮娅的核心资源 <b class="term-resource">黯核</b>（上限 3）和<b class="term-resource">虚质粒子</b>：<br>· 布景形态远程消耗黯核输出。<br>· 幻灭形态近战消耗虚质粒子。<br>· 进入战斗时黯核与虚质粒子回满。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>选择形态，消耗黯核/粒子输出，进熵变强化，解放终结。'
  },

  // 3.4 · 露西（主C 衍射 佩枪）— 欺骗程式·骇破
  '露西': {
    intro: '衍射 · 佩枪 · 主C · 欺骗程式·骇破·赛博朋克',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '衍射', hasHeavy: true, normalMult: 1, skillMult: 1.8, heavyMult: 2.2, burstMain: 4.5, burstSide: 2.25, variationMult: 0.8,
      normalName: '双线程',
      skillName: '有效载荷 / 脉冲干扰',
      burstName: '网络行者 / 暗网深潜',
      heavyName: '双线程·重击 / 多线程·重击',
      varName: '过时幻觉',
      forteName: 'Ram',
      skillMech: '脉冲干扰附加欺骗程式效果。',
      heavyMech: '多线程消耗 SQL 大幅提升伤害倍率。',
      burstMech: '覆写篡改造成衍射伤害。',
      skillFollowUp: '4 链：全队附加骇破·偏移后全属性伤害 +20%。'
    }),
    forteName: 'Ram',
    forteDesc: '露西通过技能积累<b class="term-resource">Ram</b>点数（初始 0，上限 32+6 链）：<br>· 欺骗程式·义体故障/突破协议/运动失能/武装故障/赛博精神病。<br>· 击败带欺骗程式的目标可记录并激活快捷响应。<br>· 骇破响应·数据崩解触发停滞效果。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>附加欺骗程式，积累 Ram，解放覆写，骇破触发。'
  },

  // 3.4 · 丽贝卡（副C 导电 佩枪）— 街头直觉·手感火热
  '丽贝卡': {
    intro: '导电 · 佩枪 · 副C · 猎手/铁胆双形态',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '导电', hasHeavy: true, normalMult: 1, skillMult: 1.8, heavyMult: 2.2, burstMain: 4, burstSide: 2, variationMult: 0.8,
      normalName: '猎手 / 铁胆',
      skillName: '小孩子才做选择！ / 战术闪避',
      burstName: '狂欢时间！ / 大烟花！',
      heavyName: '哒哒哒！·猎手 / 砰砰砰！·铁胆',
      varName: '呜呼，来发大的！ / 蠢货，有本事来抓我！',
      forteName: '手感火热 / 狂热',
      skillMech: '小孩子才做选择！提供多种属性加成。<br>战术闪避消耗街头直觉回复耐力。',
      burstMech: '狂欢时间引爆全场，大烟花单体爆发。',
      skillFollowUp: '2 链：全队全属性伤害 +20%；附加骇破·偏移时全伤害加深 15%。'
    }),
    forteName: '手感火热',
    forteDesc: '丽贝卡通过战斗积累<b class="term-resource">手感火热</b>/<b class="term-resource">狂热</b>：<br>· 获得<b class="term-resource">街头直觉</b>层数提升闪避和输出。<br>· 战术闪避消耗街头直觉回复耐力。<br>· 狂热满值可进入爆发状态。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻攒手感火热，叠街头直觉，战术闪避，解放爆发。'
  },

  // 3.4 · 洛瑟菈（副C 湮灭 音感仪）— 追忆·聚焦·照片
  '洛瑟菈': {
    intro: '湮灭 · 音感仪 · 副C · 追忆·聚焦·照片',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '湮灭', hasHeavy: false, normalMult: 1, skillMult: 1.6, burstMain: 0, burstSide: 0, variationMult: 0.8,
      normalName: '溯念留形',
      skillName: '幻象定帧 / 追光',
      burstName: '历历在目',
      varName: '聚焦入场',
      forteName: '印象',
      normalMech: '普攻第 3 段免疫打断，降低受到伤害。',
      skillMech: '幻象定帧展开聚焦环，指针进入完美焦距可充满。',
      burstMech: '进入追忆状态，消耗照片强化断舍离。',
      skillFollowUp: '2 链：解放时根据模态提供霜渐/声骸伤害加成。<br>6 链：铭记 3 层使断舍离伤害 +600%。'
    }),
    forteName: '印象 / 照片',
    forteDesc: '洛瑟菈的核心资源 <b class="term-resource">印象</b>（0-150）和<b class="term-resource">照片</b>：<br>· 追忆状态期间消耗<b class="term-resource">照片</b>强化断舍离。<br>· 每消耗 1 张照片获得 1 层<b class="term-resource">铭记</b>（上限 3 层）。<br>· 击败目标获得怀恋——非战斗时回复印象。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>聚焦，进追忆，消耗照片叠铭记，断舍离终结。'
  },

  // ===== 漂泊者三形态（免费迅刀主角 · A 级工厂）=====
  '漂泊者·衍射': {
    intro: '衍射 · 迅刀 · 主C · 「属性调谐·衍射」',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '衍射', hasHeavy: false,
      normalMult: 1.0, skillMult: 2.0, burstMain: 6.0, burstSide: 3.0, variationMult: 1.2,
      normalName: '迅刀连斩',
      skillName: '浮声千斩',
      burstName: '回响奏鸣',
      varName: '调谐入场',
      skillMech: '施放<b class="term-skill">浮声千斩</b>造成衍射伤害。',
      burstMech: '施放<b class="term-burst">回响奏鸣</b>造成范围衍射伤害。',
      skillFollowUp: '1 链：施放浮声千斩后暴击 +15%。 6 链：浮声千斩命中后衍射伤害 +10%。',
      burstFollowUp: '4 链：回响奏鸣为队伍回复生命。 5 链：共鸣解放伤害 +40%。',
    }),
    forteName: '属性调谐·衍射',
    forteDesc: '漂泊者·衍射为免费迅刀主角形态。<br>· <b class="term-skill">浮声千斩</b>起手攒能<br>· <b class="term-burst">回响奏鸣</b>收束<br>· 2 链衍射伤害 +20%；3 链技能额外回能<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能攒能，共鸣解放·回响奏鸣收束。',
  },
  '漂泊者·湮灭': {
    intro: '湮灭 · 迅刀 · 主C · 「暗涌」',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '湮灭', hasHeavy: true,
      normalMult: 1.1, skillMult: 2.2, heavyMult: 4.0, burstMain: 6.5, burstSide: 3.25, variationMult: 1.2,
      normalName: '迅刀连斩',
      skillName: '灭音斩',
      heavyName: '灭音',
      burstName: '临渊死寂',
      varName: '调谐入场',
      heavyMech: '施放<b class="term-heavy">重击·灭音</b>进入<b class="term-resource">暗涌</b>感，造成湮灭伤害。',
      skillMech: '施放共鸣技能造成湮灭伤害；暗涌期间技能收益提升。',
      burstMech: '施放<b class="term-burst">临渊死寂</b>造成范围湮灭伤害。',
      skillFollowUp: '1 链：共鸣技能伤害 +30%。 2 链：重击·灭音后技能伤害 +10%。',
      heavyFollowUp: '4 链：灭音/临渊死寂命中后湮灭伤害 +10%。',
      burstFollowUp: '5 链：暗涌中普攻伤害 +15%。 6 链：暗涌中暴击 +25%。',
    }),
    forteName: '暗涌',
    forteDesc: '漂泊者·湮灭以<b class="term-resource">暗涌</b>为核心：<br>· <b class="term-heavy">重击·灭音</b>切入暗涌感<br>· 技能与普攻在暗涌期间收益提升<br>· <b class="term-burst">临渊死寂</b>收束<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>重击·灭音，技能循环，共鸣解放·临渊死寂收束。',
  },
  '漂泊者·气动': {
    intro: '气动 · 迅刀 · 主C · 「属性调谐·气动」',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '气动', hasHeavy: false,
      normalMult: 1.0, skillMult: 2.4, burstMain: 6.2, burstSide: 3.1, variationMult: 1.2,
      normalName: '迅刀连斩',
      skillName: '缥缈无相',
      burstName: '万象归墟',
      varName: '调谐入场',
      skillMech: '施放<b class="term-skill">缥缈无相</b>造成气动伤害，为技能主循环。',
      burstMech: '施放<b class="term-burst">万象归墟</b>造成范围气动伤害。',
      skillFollowUp: '2 链：缥缈无相后为队伍回复生命。 4 链：共鸣技能伤害 +15%。 6 链：缥缈无相伤害 +30%。',
      burstFollowUp: '3 链：气动伤害 +15%。 5 链：万象归墟伤害 +20%。',
    }),
    forteName: '属性调谐·气动',
    forteDesc: '漂泊者·气动以技能循环为主：<br>· <b class="term-skill">缥缈无相</b>主输出<br>· <b class="term-burst">万象归墟</b>收束<br>· 链提升气动与技能倍率<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能循环，共鸣解放·万象归墟收束。',
  },

};
