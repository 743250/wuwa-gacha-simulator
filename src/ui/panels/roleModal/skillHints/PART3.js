// 自动切分 · 角色技能文案 3/5（吟霖 ~ 奥古斯塔）
import { makeSkillLines } from '../skillLines.js';
import { ACTION_MULTIPLIER } from '../../../../battle/balance.js';

export const PART3 = {
  '吟霖': {
    intro: '导电 · 音感仪 · 副C · 「审判印记」',
    // 文案=具体数值，tooltip=计算公式
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;
      const energyMax = stats.maxEnergy || 125;

      // ===== 共鸣链相关参数 =====
      const markSkillMult = chain >= 1 ? 1.7 : 1.0;        // 1 链：技能/解放对印记 ×1.7
      const markBurstMult = chain >= 5 ? 1.5 : 1.0;        // 5 链：解放对印记额外 ×1.5
      const judgmentBoost = chain >= 3 ? 0.55 : 0;         // 3 链：审判之雷本体 +55%
      const teamAtkOnTrigger = chain >= 4 ? 0.15 : 0;      // 4 链：审判之雷/解放全队 atk +15%
      const jiTingMult = chain >= 6 ? 4.2 : 0;             // 6 链：疾霆昭彰 atk×420%

      // ===== 真实伤害数（命中前结算，命中印记目标的总倍率）=====
      const normalDmg = Math.round(atk * ACTION_MULTIPLIER.normal);
      const skillDmg  = Math.round(atk * ACTION_MULTIPLIER.skill);
      // WIKI 破天 815.92% → 主 816% / 副 408%
      const BURST_MAIN = 8.16, BURST_SIDE = 4.08;
      const burstMainDmg = Math.round(atk * BURST_MAIN);
      const burstSideDmg = Math.round(atk * BURST_SIDE);
      // 对印记目标：1 链技能/解放 ×1.7；5 链解放再 ×1.5；3 链只放大审判之雷本体
      const markedSkillDmg = chain >= 1 ? Math.round(skillDmg * markSkillMult) : skillDmg;
      const markedBurstMain = Math.round(burstMainDmg * markSkillMult * markBurstMult);
      const jiTingDmg = chain >= 6 ? Math.round(atk * jiTingMult) : 0;
      const judgmentDmg = Math.round(atk * 1.0 * (1 + judgmentBoost));
      const varDmg = Math.round(atk * 0.8);
      const varConcerto = Math.round(atk * 1.6);

      // ===== 公式 tooltips =====
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100% = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">满审判触发审判之雷挂印记；解放后窗口期可触发疾霆昭彰（6 链）</span>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `· 普通目标：攻击 <b>${atk}</b> × 180% = <b style="color:var(--accent)">${skillDmg}</b><br>` +
        (chain >= 1 ? `· 印记目标：${skillDmg} × <b style="color:var(--gold)">1.7</b> = <b style="color:var(--accent)">${markedSkillDmg}</b>` : '') +
        `<br>命中后回复 22 能量、+30 审判值`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 816% = ${burstMainDmg}<br>` +
        `· 副目标：攻击 <b>${atk}</b> × 408% = ${burstSideDmg}<br>` +
        (chain >= 1 ? `· 主目标对印记：${burstMainDmg} × <b style="color:var(--gold)">1.7</b>${chain>=5?` × <b style="color:var(--gold)">${markBurstMult.toFixed(1)}</b>`:''} = <b style="color:#ff8c5e">${markedBurstMain}</b>`:``)
      );
      const jiTingTip = chain >= 6 ? tipAttr(
        `<b style="color:var(--gold)">疾霆昭彰公式</b>（共鸣链 6）<br>` +
        `= 攻击 <b>${atk}</b> × ${(jiTingMult*100).toFixed(0)}% = <b style="color:var(--accent)">${jiTingDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">解放后 2 回合内，普攻命中印记目标额外触发（每回合 1 次）</span>`
      ) : '';
      const judgmentTip = tipAttr(
        `<b style="color:var(--gold)">审判之雷公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100%${judgmentBoost?` × (1+${(judgmentBoost*100).toFixed(0)}% · 3 链)`:''} = <b style="color:var(--accent)">${judgmentDmg}</b>`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `· 普通：攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满：攻击 <b>${atk}</b> × 160% = <b style="color:var(--accent)">${varConcerto}</b>`
      );

      // 共鸣链激活的额外效果摘要
      const chainExtras = [
        chain >= 2 ? `命中印记目标额外 +<b>5</b> 审判 / +<b>5</b> 能量（共鸣链 2）` : '',
        chain >= 3 ? `审判之雷伤害 +<b>55%</b>（共鸣链 3 · 约 <b>${judgmentDmg}</b>）` : '',
        chain >= 4 ? `审判之雷/解放时全队攻击 +<b>${(teamAtkOnTrigger*100).toFixed(0)}%</b>（2 回合 · 共鸣链 4）` : ''
      ].filter(Boolean).join('<br>');
      const chainHints = chainExtras ? `<br>${chainExtras}` : '';

      return [
        {
          icon: '⚔', name: '普攻 · 音感弹', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">导电伤害</b>，命中后回复 12 共鸣能量、积累 8 协奏值、<b class="term-resource">审判值</b> +<b>15</b>。${chain>=6?`<br>解放后 2 回合内，命中印记目标额外触发 <span class="tip" data-tip='${jiTingTip}'><b class="term-skill">疾霆昭彰</b>（<b style="color:var(--accent)">${jiTingDmg}</b>）</span>。`:''}`
        },
        {
          icon: '✦', name: '共鸣技能 · 磁殛咆哮', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b>${chain>=1?`（对印记目标 <b style="color:var(--gold)">${markedSkillDmg}</b>）`:''} 点</span><b class="term-skill">导电伤害</b>，命中后回复 22 能量、<b class="term-resource">审判值</b> +<b>30</b>。${chainHints}`
        },
        {
          icon: '⚡', name: '共鸣解放 · 破天雷灭击', cost: `3 AP · 需共鸣能量满 ${energyMax}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstMainDmg}</b>${chain>=1?`（印记叠满 <b style="color:var(--gold)">${markedBurstMain}</b>）`:''} 点</span>、副目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSideDmg}</b> 点</span><b class="term-burst">导电伤害</b>。<br>必为主目标挂 <b>1</b> 层<b class="term-resource">审判印记</b>。${chain>=6?`<br>释放后 <b>2</b> 回合内开启<b class="term-skill">疾霆昭彰</b>（见普攻）。`:''}`
        },
        {
          icon: '🎵', name: '变奏技能 · 雷霆入场', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换至吟霖上场，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">导电伤害</b>。`
        }
      ];
    },
    forteName: '审判值',
    forteDesc: '吟霖以<b class="term-resource">审判值</b>（0-100）驱动：<b class="term-normal">普攻</b> +<b>15</b> / <b class="term-skill">共鸣技能</b> +<b>30</b>。<br>满 <b>100</b> 自动触发<b class="term-resource">审判之雷</b>：造成技能型导电伤害并为当前主目标挂 <b>1</b> 层<b class="term-resource">审判印记</b>（持续 3 回合，最高 3 层）。3 链提升审判之雷倍率。<br><br>对印记目标：1 链技能/解放 +70%，5 链解放再 +50%；4 链审判之雷或解放时全队攻击 +15%；6 链解放后普攻可触发疾霆昭彰（攻击 ×420%）。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>开场普攻/技能堆审判，满 100 标记主目标，切到主C 倾泻，能量满放解放补印记并开启疾霆窗口。'
  },

  // ═══════════════════════════════════════════════════════════════
  // 2.3+ & 3.0+ 新增角色 · 工厂版 SKILL_HINTS
  // ═══════════════════════════════════════════════════════════════

  // 2.3 · 赞妮（主C 衍射 臂铠 · HP 核）— 灼焰形态 / 焰光 / 重斩 / 终绝
  '赞妮': {
    intro: '衍射 · 臂铠 · 主C · 「灼焰形态」',
    hasHeavy: true,
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const hp = stats.hp;

      const normalMult = 0.04;
      const skillMult = 0.075 * (chain >= 2 ? 1.8 : 1);
      const heavyMult = 0.09;
      const slashMult = 0.12 * (chain >= 6 ? 1.4 : 1);
      const burstMainMult = 0.16 * (chain >= 5 ? 2.2 : 1);
      const burstSideMult = burstMainMult * 0.5;
      const finalBase = 0.20;
      const varMult = 0.03;

      const normalDmg = Math.round(hp * normalMult);
      const skillDmg = Math.round(hp * skillMult);
      const heavyDmg = Math.round(hp * heavyMult);
      const slashDmg = Math.round(hp * slashMult);
      const burstMainDmg = Math.round(hp * burstMainMult);
      const burstSideDmg = Math.round(hp * burstSideMult);
      const finalDmg = Math.round(hp * finalBase);
      const varDmg = Math.round(hp * varMult);

      const normalTip = tipAttr(
        '<b style="color:var(--gold)">普攻·例行交涉(HP 核)</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 4% = <b style="color:var(--text)">' + normalDmg + '</b>'
      );
      const skillTip = tipAttr(
        '<b style="color:var(--gold)">共鸣技能·无眠守望(HP 核)</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 7.5%' +
        (chain >= 2 ? ' × 1.8(2链+80%)' : '') +
        ' = <b style="color:var(--accent)">' + skillDmg + '</b>'
      );
      const heavyTip = tipAttr(
        '<b style="color:var(--gold)">重击(非灼焰形态·HP 核)</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 9% = <b style="color:#ff8c5e">' + heavyDmg + '</b><br>' +
        '灼焰形态下重击禁用，普攻键替换为重斩'
      );
      const slashTip = tipAttr(
        '<b style="color:var(--gold)">重斩·破晓(灼焰形态普攻)</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 12%' +
        (chain >= 6 ? ' × 1.4(6链)' : '') +
        ' = <b style="color:#ff9b3a">' + slashDmg + '</b><br>' +
        '消耗 20 焰光，伤害类型为重击'
      );
      const burstTip = tipAttr(
        '<b style="color:var(--gold)">共鸣解放·重燃(HP 核)</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 16%' +
        (chain >= 5 ? ' × 2.2(5链+120%)' : '') +
        '<br>主: <b style="color:var(--gold)">' + burstMainDmg + '</b> · 副: <b>' + burstSideDmg + '</b><br>' +
        '进入<b class="term-state">灼焰形态</b> 3 回合：焰光+50、每回+10、普攻变为重斩'
      );
      const finalTip = tipAttr(
        '<b style="color:var(--gold)">终绝将至之刻(形态结束自动)</b><br>' +
        '基础 HP × 20% = <b style="color:var(--gold)">' + finalDmg + '</b><br>' +
        (chain >= 3
          ? '3 链：每消耗 1 点焰光 +2%（上限 +200%，最高 HP×60%）'
          : '3 链未激活时无焰光加成')
      );
      const varTip = tipAttr(
        '<b style="color:var(--gold)">变奏·即刻执行(HP 核)</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 3% = <b style="color:var(--accent)">' + varDmg + '</b>'
      );

      return [
        {
          icon: '⚔', name: '普攻 · 例行交涉 / 重斩', cost: '1 AP',
          color: 'var(--text)',
          desc: '非<b class="term-state">灼焰形态</b>时对主目标造成 <span class="tip" data-tip="' + normalTip + '"><b style="color:var(--text)">' + normalDmg + '</b> 点</span><b class="term-normal">衍射伤害</b>。' +
          '灼焰形态下普攻替换为<span class="tip" data-tip="' + slashTip + '"><b class="term-heavy">重斩·破晓</b></span>（HP×12%，消耗 20 <b class="term-resource">焰光</b>）。'
        },
        {
          icon: '✦', name: '共鸣技能 · 无眠守望', cost: '1 AP · CD 3 回合',
          color: 'var(--accent)',
          desc: '对主目标造成 <span class="tip" data-tip="' + skillTip + '"><b style="color:var(--accent)">' + skillDmg + '</b> 点</span><b class="term-skill">衍射伤害</b>。' +
          (chain >= 1 ? '<br><span style="color:var(--gold)">[1 链]</span> 施放后衍射伤害 +50%（2 回合）。' : '') +
          (chain >= 2 ? '<br><span style="color:var(--gold)">[2 链]</span> 技能倍率 +80%。' : '')
        },
        {
          icon: '☄', name: '重击 · 例行交涉', cost: '2 AP · CD 1 回合',
          color: '#ff8c5e',
          desc: '非灼焰形态下对主目标造成 <span class="tip" data-tip="' + heavyTip + '"><b style="color:#ff8c5e">' + heavyDmg + '</b> 点</span><b class="term-heavy">衍射伤害</b>。灼焰形态下不可用。' +
          (chain >= 6 ? '<br><span style="color:var(--gold)">[6 链]</span> 重斩 ×1.4；焰光&lt;70 回 70（每场 1 次）；致死不倒（每场 1 次）。' : '')
        },
        {
          icon: '⚡', name: '共鸣解放 · 重燃 / 终绝将至之刻', cost: '3 AP · 需能量满',
          color: 'var(--gold)',
          desc: '对主目标造成 <span class="tip" data-tip="' + burstTip + '"><b style="color:var(--gold)">' + burstMainDmg + '</b> 点</span>，副目标 <b>' + burstSideDmg + '</b> 点<b class="term-burst">衍射伤害</b>，进入灼焰形态 3 回合。' +
          '形态结束自动施放<span class="tip" data-tip="' + finalTip + '"><b class="term-burst">终绝将至之刻</b></span>（基础 HP×20%）。' +
          (chain >= 3 ? '<br><span style="color:var(--gold)">[3 链]</span> 每消耗 1 焰光终绝 +2%（上限 +200%）。' : '') +
          (chain >= 5 ? '<br><span style="color:var(--gold)">[5 链]</span> 重燃倍率 +120%。' : '')
        },
        {
          icon: '♫', name: '变奏入场 · 即刻执行', cost: '切换上场时触发',
          color: '#c39bff',
          desc: '切换上场时对主目标造成 <span class="tip" data-tip="' + varTip + '"><b style="color:var(--accent)">' + varDmg + '</b> 点</span><b class="term-variation">衍射伤害</b>。' +
          (chain >= 4 ? '<br><span style="color:var(--gold)">[4 链]</span> 全队攻击 +20%（2 回合）。' : '')
        }
      ];
    },
    forteName: '焰光',
    forteDesc: '赞妮的核心资源 <b class="term-resource">焰光</b>（上限 100）：' +
      '<br>• <b class="term-burst">共鸣解放·重燃</b>进入<b class="term-state">灼焰形态</b>时 +50 焰光' +
      '<br>• 灼焰形态内每回合 +10（<b class="term-state">烈阳余烬</b>简化）' +
      '<br>• <b class="term-heavy">重斩</b>消耗 20 焰光' +
      '<br>• 形态结束按消耗焰光强化<b class="term-burst">终绝将至之刻</b>（3 链每点 +2%，最多 +200%）' +
      '<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>' +
      '解放进入灼焰，重斩连段消耗焰光，形态结束终绝爆发'
  },


  '夏空': {
    intro: '气动 · 佩枪 · 辅助 · 「合奏音影·风蚀效应」',
    hasHeavy: false,
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk || 375;
      const normalDmg = Math.round(atk * 1.0);
      const skillDmg = Math.round(atk * 1.5);
      const quadDmg = Math.round(atk * 2.0);
      const burstBonus = chain >= 5 ? 0.4 : 0;
      // Phase 3 · 解放 1100/550 · 变奏 190
      const burstMain = Math.round(atk * 11.0 * (1 + burstBonus));
      const burstSide = Math.round(atk * 5.5 * (1 + burstBonus));
      const varDmg = Math.round(atk * 1.9);
      const skillCharges = chain >= 3 ? 2 : 1;
      const skillCd = 3; // 单层回复间隔；3 链双充能可连放

      const normalTip = tipAttr(`<b style="color:var(--gold)">普攻伤害公式</b><br>= 攻击 <b>${atk}</b> × 100% = <b>${normalDmg}</b>`);
      const skillTip = tipAttr(`<b style="color:var(--gold)">共鸣技能伤害公式</b><br>= 攻击 <b>${atk}</b> × 150% = <b style="color:var(--accent)">${skillDmg}</b>`);
      const quadTip = tipAttr(`<b style="color:var(--gold)">四拍重奏伤害公式</b><br>= 攻击 <b>${atk}</b> × 200% = <b style="color:#ff8c5e">${quadDmg}</b>（重击类型）`);
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">共鸣解放伤害公式</b><br>` +
        `· 主：攻击 <b>${atk}</b> × 1100%${burstBonus ? ' × (1+40%)' : ''} = <b style="color:var(--gold)">${burstMain}</b><br>` +
        `· 副：攻击 <b>${atk}</b> × 550%${burstBonus ? ' × (1+40%)' : ''} = <b>${burstSide}</b>`
      );
      const varTip = tipAttr(`<b style="color:var(--gold)">变奏伤害公式</b><br>= 攻击 <b>${atk}</b> × 190% = <b>${varDmg}</b>`);

      const parts = [];
      if (chain >= 1) parts.push(`<span style="color:var(--gold)">[1链]</span> 进入音律独奏时攻击 +35%（2 回合）`);
      if (chain >= 2) parts.push(`<span style="color:var(--gold)">[2链]</span> 演绎期间全队气动 +40%`);
      if (chain >= 3) parts.push(`<span style="color:var(--gold)">[3链]</span> 普攻额外 +1 音律；技能充能上限 ${skillCharges} 层`);
      if (chain >= 4) parts.push(`<span style="color:var(--gold)">[4链]</span> 四拍重奏/解放无视 45% 防御`);
      if (chain >= 5) parts.push(`<span style="color:var(--gold)">[5链]</span> 解放伤害 +40%；演绎期间全队受伤 -30%`);
      if (chain >= 6) parts.push(`<span style="color:var(--gold)">[6链]</span> 进入音律独奏时 220% 气动 AOE（解放类型）`);
      const chainHints = parts.length
        ? '<br><span style="color:var(--muted);font-size:10px">·</span> ' + parts.join('<br><span style="color:var(--muted);font-size:10px">·</span> ')
        : '';

      return [
        {
          icon: '\u2694', name: '普攻 · 四拍的舞曲', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b>${normalDmg}</b> 点</span>气动伤害。叠 <b class="term-resource">风蚀效应</b> +1，进入 <b class="term-resource">音律独奏</b>（全队气动 +24%，演绎下 +48%），<b class="term-resource">音律</b> +1。<br>满 3 音律时替换为 <span class="tip" data-tip='${quadTip}'><b class="term-heavy">四拍重奏</b>（${quadDmg} 点）</span>，消耗全部音律。${chainHints}`
        },
        {
          icon: '\u2726', name: '共鸣技能 · 谐律速奏', cost: chain >= 3 ? `1 AP · 充能 ${skillCharges} 层 · 回复 ${skillCd} 回合` : `1 AP · 冷却 ${skillCd} 回合`,
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span>气动伤害（atk×150%）。叠风蚀 +1。${chain>=3?`<br>共鸣链 3：充能上限 <b>${skillCharges}</b> 层，可连续施放两次。`:''}`
        },
        {
          icon: '\u2605', name: '共鸣解放 · 歌者的三重华彩', cost: '3 AP · 满能量',
          color: 'var(--gold)',
          desc: `主 <span class="tip" data-tip='${burstTip}'><b style="color:var(--gold)">${burstMain}</b></span> / 副 <b>${burstSide}</b> 点气动伤害（atk×1100%/550%）。进入 <b class="term-state">演绎状态</b> 2 回合，获得 HP×100% 护盾。`
        },
        {
          icon: '\u21c4', name: '变奏 · 携风吟游', cost: '0 AP · 切人',
          color: 'var(--muted)',
          desc: `切人入场造成 <span class="tip" data-tip='${varTip}'><b>${varDmg}</b> 点</span>气动伤害。叠风蚀 +1，音律 +1。`
        }
      ];
    },
    forteName: '音律',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 共鸣回路 · 音律</span><br>· <b class="term-resource">音律</b>（0-3）：普攻 +1（3 链再 +1）/ 变奏 +1。满 3 格普攻替换为 <b class="term-heavy">四拍重奏</b>（atk×200% 重击，叠风蚀）。<br>· <b class="term-resource">音律独奏</b>：普攻后进入，全队气动 +24%（演绎下 +48%），持续至回合结束。<br>· <b class="term-state">演绎状态</b>：解放后 2 回合，独奏翻倍 + 护盾。'
  },

  // 2.4 · 露帕（副C 热熔 长刃）— 「狼焰·荣光·追猎」· 手写对账（勿走工厂假强化）
  '露帕': {
    intro: '热熔 · 长刃 · 副C · 「狼焰·荣光·追猎」',
    hasHeavy: true,
    customLines: (stats, role) => {
      const atk = stats.atk || 0;
      const chain = role.chain || 0;
      const tip = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const skill = Math.round(atk * 3.0);
      const heavy = Math.round(atk * 4.0);
      const burstMain = Math.round(atk * 11.0);
      const burstSide = Math.round(atk * 5.5);
      let langwuMult = 5.8;
      if (chain >= 6) langwuMult += 0.4;
      if (chain >= 4) langwuMult *= (1 + 1.25);
      const langwu = Math.round(atk * langwuMult);
      const lines = [
        {
          name: '普攻 · 燃星',
          desc: `造成 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × 120%`)}'>${Math.round(atk * 1.2)}</b> 点热熔伤害，狼焰 +10。`
        },
        {
          name: '共鸣技能 · 凶噬',
          desc: `造成 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × 300%`)}'>${skill}</b> 点热熔伤害，狼焰 +15。` +
            (chain >= 6 ? ' <span style="color:var(--gold)">[6链] 命中额外回 100 狼焰（冷却 2 回合）。</span>' : '')
        },
        {
          name: '重击 · 狼 / 锐',
          desc: `造成 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × 400%`)}'>${heavy}</b> 点热熔伤害，狼焰 +20。` +
            (chain >= 2 ? ' <span style="color:var(--gold)">[2链] 放重击时全队热熔 +40%（4 回合）。</span>' : '')
        },
        {
          name: '狼舞·决意·极',
          desc: `狼焰满时技能替换。造成 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × ${(langwuMult * 100).toFixed(0)}%（视为共鸣解放）`)}'>${langwu}</b> 点热熔伤害（视为共鸣解放），消耗全部狼焰。` +
            (chain >= 4 ? ' <span style="color:var(--gold)">[4链] 倍率 +125%。</span>' : '') +
            (chain >= 6 ? ' <span style="color:var(--gold)">[6链] 无视 30% 防御。</span>' : '')
        },
        {
          name: '共鸣解放 · 荣光欢酣于火',
          desc: `主目标 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × 1100%`)}'>${burstMain}</b> / 副目标 <b class="tip-num" data-tip='${tip(`= 攻击 ${atk} × 550%`)}'>${burstSide}</b> 热熔伤害。狼焰回满；激活追猎（全队热熔 +10%）与荣光（无视热熔抗性 ${chain >= 3 ? '15%' : '3%'}，4 回合）。` +
            (chain >= 1 ? ' <span style="color:var(--gold)">[1链] 本次暴击 +20%。</span>' : '') +
            (chain >= 2 ? ' <span style="color:var(--gold)">[2链] 全队热熔 +40%（4 回合）。</span>' : '') +
            (chain >= 5 ? ' <span style="color:var(--gold)">[5链] 变奏后首次解放伤害 +15%。</span>' : '')
        },
        {
          name: '变奏 · 你在看哪里？',
          desc: chain >= 3
            ? `造成 atk×400% 热熔伤害（3 链变奏乘区）。`
            : `造成 atk×200% 热熔伤害。`
        }
      ];
      return lines;
    },
    forteName: '狼焰',
    forteDesc: '露帕的核心资源 <b class="term-resource">狼焰</b>（0-100）：<br>· <b class="term-normal">普攻</b>+10，<b class="term-skill">凶噬</b>+15，<b class="term-heavy">重击</b>+20，<b class="term-burst">共鸣解放</b>全满。<br>· 满 100 时共鸣技能替换为<b class="term-heavy">狼舞·决意·极</b>（atk×580% 热熔，视为共鸣解放伤害）。<br>· <b class="term-burst">共鸣解放</b>激活 <b class="term-resource">追猎</b>（全队热熔 +10%）与 <b class="term-resource">荣光</b>（全队无视热熔抗性，3 链 15%），持续 4 回合。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>技能/重击攒狼焰，满 100 放狼舞·决意·极，解放开荣光，切主C。'
  },

  // 2.5 · 弗洛洛（主C 湮灭 音感仪 · ATK 核）— 乐声·谱曲终末·定音·指挥状态·赫卡忒
  '弗洛洛': {
    intro: '湮灭 · 音感仪 · 主C · 「乐声 · 谱曲终末 · 赫卡忒指挥」',
    hasHeavy: true,
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk || 0;

      const c1RequiemMult = chain >= 1 ? 1.80 : 1;
      const normalMult = 5.05 * c1RequiemMult;
      const skillMult  = 4.64 * c1RequiemMult;
      const c2 = chain >= 2 ? 1.75 : 1;
      const dirgeBase = 6.6016 * c2;
      const echoAdd = 0.8255 * c2;               // 官方 Lv10 表每层 +82.55%
      const dirgeFullMult = dirgeBase + 24 * echoAdd;
      // 3 链 +80% 已移给赫卡忒（指挥窗），谱曲不再吃 3/6 链乘区
      const c3Hecate = chain >= 3 ? 1.80 : 1;
      const hecastAutoMult = 0.56;
      const hecastAugMult = 3.40 * (chain >= 6 ? 1.24 : 1);
      const varMult = 2.02;
      const varCmdMult = 5.96;

      const normalDmg = Math.round(atk * normalMult);
      const skillDmg  = Math.round(atk * skillMult);
      const dirgeDmg  = Math.round(atk * dirgeFullMult);
      const hecastAutoDmg = Math.round(atk * hecastAutoMult * c3Hecate);
      const hecastAugDmg  = Math.round(atk * hecastAugMult * c3Hecate);
      const varDmg    = Math.round(atk * varMult);
      const varCmdDmg = Math.round(atk * varCmdMult);

      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻 · 亡与死的乐章</b><br>` +
        `= 攻击 <b>${atk}</b> × 505%${chain>=1?` × 1.80（1链）`:''} = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `命中后 +1 乐声`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能 · 永不消逝的梦呓</b><br>` +
        `= 攻击 <b>${atk}</b> × 464%${chain>=1?` × 1.80（1链）`:''} = <b style="color:var(--accent)">${skillDmg}</b><br>` +
        `命中后 +1 乐声`
      );
      const dirgeTip = tipAttr(
        `<b style="color:var(--gold)">谱曲终末</b><br>` +
        `= 攻击 <b>${atk}</b> ×（${dirgeBase.toFixed(4)} + 余响 × ${echoAdd.toFixed(4)}）<br>` +
        `满 24 层时倍率 ≈ ${dirgeFullMult.toFixed(2)} = <b style="color:#ff6b9d">${dirgeDmg}</b><br>` +
        `冷却 3 回合。消耗全部 6 枚乐声与全部余响，进入定音状态`
      );
      const hecastTip = tipAttr(
        `<b style="color:var(--gold)">赫卡忒协同追击</b><br>` +
        `指挥状态内触发：每回合结束、弗洛洛重击时各攻击 1 次；6 链时普攻/技能命中立刻攻击<br>` +
        `· 协同追击：攻击 × 56%${chain>=3?` × 1.80（3链）`:''} = ${hecastAutoDmg}（+1 乐声 +1 余响）<br>` +
        `· 强化追击：攻击 × 340%${chain>=6?` × 1.24（6链）`:''}${chain>=3?` × 1.80（3链）`:''} = ${hecastAugDmg}（+1 乐声 +1 余响）<br>` +
        `每第 2 次协同后升级为强化`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏 · 致命组歌</b><br>` +
        `= 攻击 <b>${atk}</b> × 202% = ${varDmg}<br>` +
        `指挥状态期间替换为永生组歌：攻击 × 596% = ${varCmdDmg}<br>` +
        `+1 乐声`
      );

      return [
        {
          icon: '⚔', name: '普攻 · 亡与死的乐章',
          nameHtml: '普攻 · <b class="term-skill">亡与死的乐章</b>', cost: '1 AP',
          color: 'var(--text)',
          desc: `对主目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">湮灭伤害</b>。命中后获得 1 枚<b class="term-resource">乐声</b>。${chain>=1?'<br><span style="color:var(--gold)">[1 链]</span> 伤害倍率提升 80%。':''}${chain>=6?'<br><span style="color:var(--gold)">[6 链]</span> <b class="term-state">指挥状态</b>期间施放时，赫卡忒立刻协同追击。':''}`
        },
        {
          icon: '✦', name: '共鸣技能 · 永不消逝的梦呓',
          nameHtml: '共鸣技能 · <b class="term-skill">永不消逝的梦呓</b>', cost: '1 AP · CD 3 回合',
          color: 'var(--accent)',
          desc: `对主目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">湮灭伤害</b>。命中后获得 1 枚<b class="term-resource">乐声</b>。${chain>=1?'<br><span style="color:var(--gold)">[1 链]</span> 伤害倍率提升 80%。':''}${chain>=6?'<br><span style="color:var(--gold)">[6 链]</span> <b class="term-state">指挥状态</b>期间施放时，赫卡忒立刻协同追击。':''}`
        },
        {
          icon: '🎼', name: '谱曲终末（重击替换）', cost: '2 AP · CD 3 回合 · 需 6 乐声',
          color: '#ff6b9d',
          desc: `乐声满 6 枚时，重击替换为谱曲终末。对主目标造成 <span class="tip" data-tip='${dirgeTip}'><b style="color:#ff6b9d">${dirgeDmg}</b> 点</span><b class="term-heavy">湮灭范围伤害</b>（满 24 层余响示意）。施放时消耗全部 6 枚乐声与全部余响。倍率 = 660.16% + 每层余响 82.55%（2 链两系数均 ×1.75）。施放后进入<b class="term-state">定音</b>状态。${chain>=2?'<br><span style="color:var(--gold)">[2 链]</span> 基础倍率与余响加点均提升 75%，施放后获得 14 层余响。':''}${chain>=4?'<br><span style="color:var(--gold)">[4 链]</span> 施放时全队全属性伤害提升 20%，持续 4 回合。':''}`
        },
        {
          icon: '⚡', name: '共鸣解放 · 往日深渊的圆舞曲', cost: '0 AP · 需定音状态',
          color: 'var(--gold)',
          desc: `弗洛洛处于<b class="term-state">定音</b>状态时可施放，不消耗 AP。进入<b class="term-state">指挥状态</b>，持续 3 回合，期间弗洛洛攻击提升 120% 并召唤<b class="term-resource">赫卡忒</b><span class="tip" data-tip='${hecastTip}'>协同追击</span>。指挥内每回合结束与弗洛洛重击时，赫卡忒各攻击 1 次。登场时赫卡忒与弗洛洛共伤（同额，不替挡）。大招前不会召唤赫卡忒。${chain>=5?'<span style="color:var(--gold)">[5 链]</span> 指挥状态期间受到的伤害降低 30%。':''}${chain>=6?'<span style="color:var(--gold)">[6 链]</span> 指挥期间普攻/技能命中时赫卡忒立刻协同追击；登场湮灭伤害加成提升 60%；非登场时目标受到赫卡忒与弗洛洛的伤害提升 36%。':''}`
        },
        {
          icon: '🎵', name: '变奏入场 · 致命组歌', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b> 点</span><b class="term-variation">湮灭伤害</b>。获得 1 枚<b class="term-resource">乐声</b>。指挥状态期间，此变奏替换为永生组歌（攻击 × 596%）。`
        }
      ];
    },
    forteName: '余响 / 乐声',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 共鸣回路 · 新世界狂想曲</span><br>· <b class="term-resource">乐声</b>（上限 6 枚）：满 6 枚时重击替换为<b class="term-heavy">谱曲终末</b>。<br>· <b class="term-resource">余响</b>（上限 24 层）：战斗开始 +10；赫卡忒每次攻击 +1；共鸣链额外层数。谱曲终末每层绝对 +82.55% 攻击倍率（2 链 ×1.75），施放后消耗全部余响；每层暴伤 +2.5%。不上场 3 回合后消散。<br>· <b class="term-state">定音</b>：谱曲终末后进入，解锁共鸣解放。<br>· <b class="term-state">指挥状态</b>（3 回合）：攻击 +120%，召唤<b class="term-resource">赫卡忒</b>协同追击。'
  },

  // 2.6 · 奥古斯塔（主C 导电 长刃）— 以众愿为冕 · HP 核
  '奥古斯塔': {
    intro: '导电 · 长刃 · 主C · 「以众愿为冕」',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '导电', hasHeavy: true,
      normalName: '逐狩 · 烁雷连斩',
      skillName: '斩锋 / 不败恒阳',
      burstName: '誓锋不殒 / 赫日威临',
      heavyName: '鸣铁 / 烁雷',
      varName: '灼金的巡行',
      forteName: '众愿 / 威慑',
      normalMech: '对主目标造成 HP×4.5% 导电伤害。积攒协奏与能量。赫日威临窗口内替换为烈阳（HP×8.5%，重击伤害）。',
      skillMech: '对主目标造成 HP×8.1% 导电伤害。冕层≥1 时强化为不败恒阳（×1.5，HP×12.2%；3 链再 ×1.25）。1 链起命中 +1 冕层。',
      heavyMech: '对主目标造成 HP×9.9% 导电重击伤害。冕层≥1 时强化为烁雷（×1.5，HP×14.9%；3 链再 ×1.25）。1 链起命中 +1 冕层；6 链再 +2 冕层并触发怒霆（HP×4.5%×2）。',
      burstMech: '誓锋不殒：主目标 HP×18% / 副目标 HP×9%（耗能量，不耗威慑）。<br>赫日威临：威慑≥2 时替换，耗 2 威慑不耗能量；主 HP×36% / 副 HP×18%（3 链 ×1.25），进入俯首之刻 2 回合（不可切人），普攻变为烈阳；窗口结束冕层与威慑清零。',
      varMech: '切换入场时对主目标造成 HP×3.6% 导电伤害。1 链起 +1 冕层；4 链全队攻击 +20%（2 回合）。',
      skillFollowUp: '1 链：冕层上限 2，每层暴伤 +15%，变奏/技能/重击叠冕层。<br>2 链：每层暴击 +20%。<br>3 链：技能/重击/烈阳/赫日威临倍率 +25%。<br>4 链：变奏后全队攻击 +20%（2 回合）。<br>5 链：减伤 30%。<br>6 链：冕层上限 4；烁雷额外 +2 冕层并怒霆。'
    }),
    forteName: '以众愿为冕 / 威慑',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 共鸣回路 · 以众愿为冕 / 威慑</span><br>· <b class="term-resource">以众愿为冕</b>：上限 1（C0）/ 2（C1）/ 4（C6）。每层全元素伤害 +15%；1 链每层暴伤 +15%；2 链每层暴击 +20%。来源：延奏 +1、1 链起变奏/技能/重击 +1（6 链重击再 +2）。<br>· <b class="term-resource">威慑</b>（上限 2）：战斗开始补至 1；延奏离场 +1。满 2 层将解放替换为赫日威临（耗 2 威慑）。<br>· <b class="term-state">俯首之刻</b>（2 回合）：不可切人，普攻替换为<b class="term-heavy">烈阳</b>（HP×8.5%）。窗口结束冕层与威慑清零。'
  },

  // 2.6 · 尤诺（主C 气动 臂铠）— 月相流转·满月领域
  // 重击为满月终结 atk×400%/C6×2000%，不可走工厂通用重击
};
