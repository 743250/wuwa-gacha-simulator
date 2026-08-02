// 自动切分 · 角色技能文案 4/5（尤诺 ~ 琳奈）
import { makeSkillLines } from '../skillLines.js';
import { ACTION_MULTIPLIER } from '../../../../battle/balance.js';

export const PART4 = {
  '尤诺': {
    intro: '气动 · 臂铠 · 主C · 「月相流转·满月领域」',
    hasHeavy: true,
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk || 450;
      const normalDmg = Math.round(atk * ACTION_MULTIPLIER.normal);
      const skillDmg = Math.round(atk * ACTION_MULTIPLIER.skill);
      const heavyBase = Math.round(atk * 4.0); // 至臻的完满专属，非全局重击
      const heavyC6 = Math.round(atk * 20.0);
      const heavyShown = chain >= 6 ? heavyC6 : heavyBase;
      const burstMain = Math.round(atk * 4.0); // 设计 §4 主 400%（非全局 700）
      const burstSide = Math.round(atk * 2.0);
      const burstBonus = chain >= 5 ? 0.2 : 0;
      const finalBurstMain = Math.round(burstMain * (1 + burstBonus));
      const finalBurstSide = Math.round(burstSide * (1 + burstBonus));
      const varDmg = Math.round(atk * 0.8); // 设计 §4 变奏 80%

      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100% = <b style="color:var(--text)">${normalDmg}</b>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 180% = <b style="color:var(--accent)">${skillDmg}</b><br>` +
        `月相流转中：<b class="term-skill">越限的弦引</b>按共鸣解放伤害类型结算`
      );
      const heavyTip = tipAttr(
        `<b style="color:var(--gold)">重击·至臻的完满公式</b><br>` +
        `· 基础：攻击 <b>${atk}</b> × 400% = <b style="color:#ff8c5e">${heavyBase}</b><br>` +
        (chain >= 6
          ? `· 6 链 +1600%：攻击 <b>${atk}</b> × 2000% = <b style="color:#ff8c5e">${heavyC6}</b>`
          : `· 6 链：倍率 +1600%（变 2000%）`)
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">共鸣解放伤害公式</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 400%${burstBonus ? ` × (1 + 解放加成 20%)` : ''} = <b style="color:var(--gold)">${finalBurstMain}</b><br>` +
        `· 副目标：攻击 <b>${atk}</b> × 200%${burstBonus ? ` × (1 + 解放加成 20%)` : ''} = <b style="color:var(--gold)">${finalBurstSide}</b>`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 80% = <b>${varDmg}</b>`
      );

      const parts = [];
      if (chain >= 1) parts.push(`<span style="color:var(--gold)">[1链]</span> 月相流转中攻击 +40%`);
      if (chain >= 2) parts.push(`<span style="color:var(--gold)">[2链]</span> 变奏/解放后全队全伤害加深 +40%（2 回合）`);
      if (chain >= 3) parts.push(`<span style="color:var(--gold)">[3链]</span> 月相流转中全伤害 +65%`);
      if (chain >= 4) parts.push(`<span style="color:var(--gold)">[4链]</span> 至臻完满后全队攻击 +10%（3 回合）`);
      if (chain >= 5) parts.push(`<span style="color:var(--gold)">[5链]</span> 共鸣解放伤害 +20%`);
      if (chain >= 6) parts.push(`<span style="color:var(--gold)">[6链]</span> 至臻完满 ×2000%，施放后重置月相流转 + 满灵性 + 技能 CD`);
      const chainHints = parts.length
        ? '<br><span style="color:var(--muted);font-size:10px">·</span> ' + parts.join('<br><span style="color:var(--muted);font-size:10px">·</span> ')
        : '';

      return [
        {
          icon: '\u2694', name: '普攻 · 祭者独步', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">气动伤害</b>。<br><b class="term-resource">灵性</b> +<b>12</b>（<b class="term-state">月相流转</b>中 +<b>20</b>）。`
        },
        {
          icon: '\u2726', name: '共鸣技能 · 告终的喧响 / 越限的弦引', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `· <b class="term-skill">告终的喧响</b>（非月相）：造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">气动伤害</b>，进入<b class="term-state">月相流转</b>。<br>· <b class="term-skill">越限的弦引</b>（月相中）：同倍率，视为共鸣解放伤害。<br><b class="term-resource">灵性</b> +<b>25</b>。${chainHints}`
        },
        {
          icon: '\u2600', name: '重击 · 至臻的完满', cost: '2 AP · 冷却 1 回合',
          color: '#ff8c5e',
          desc: `仅<b class="term-resource">满月领域</b>内可用。对目标造成 <span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavyShown}</b> 点</span><b class="term-heavy">气动伤害</b>（atk×${chain >= 6 ? '2000' : '400'}%）。施放后退出月相并清空灵性。`
        },
        {
          icon: '\u2605', name: '共鸣解放 · 溺失月海', cost: '3 AP · 满能量',
          color: 'var(--gold)',
          desc: `主目标 <span class="tip" data-tip='${burstTip}'><b style="color:var(--gold)">${finalBurstMain}</b> 点</span> / 副目标 <b>${finalBurstSide}</b> 点气动伤害。进入<b class="term-state">月相流转</b>。<b class="term-resource">灵性</b> +<b>40</b>。`
        },
        {
          icon: '\u21c4', name: '变奏 · 照我以显', cost: '0 AP · 切人',
          color: 'var(--muted)',
          desc: `切人入场时对目标造成 <span class="tip" data-tip='${varTip}'><b>${varDmg}</b> 点</span>气动伤害。<b class="term-resource">灵性</b> +<b>15</b>。`
        }
      ];
    },
    forteName: '灵性',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 共鸣回路 · 于盈亏间涨落</span><br>· <b class="term-resource">灵性</b>（0-100）：普攻+12（月相流转中+20）、技能+25、变奏+15、解放+40。满100进入<b class="term-state">月相流转</b>并展开<b class="term-resource">满月领域</b>3回合。<br>· <b class="term-state">月相流转</b>（3回合）：攻击力+20%（1链+40%）；技能替换为越限的弦引。<br>· <b class="term-resource">满月领域</b>（3回合）：解锁<b class="term-heavy">至臻的完满</b>（atk×400%，6链×2000%）。'
  },

  // 2.7 · 仇（主C 气动 迅刀）— 漓醉墨·答剑连爆发
  '仇远': {
    intro: '气动 · 迅刀 · 主C · 「淋漓醉墨·答剑三连」',
    hasHeavy: true,
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk || 375;

      // 共鸣链参数
      const c4AtkBonus = chain >= 4 ? 0.20 : 0;
      const effectiveAtk = Math.round(atk * (1 + c4AtkBonus));

      // Phase 3 · N120 / S220 / 答剑 550 / 解放 800·400 / C3 1200·600 / 变奏 200
      const normalDmg = Math.round(effectiveAtk * 1.2);
      const skillDmg = Math.round(effectiveAtk * 2.2);
      const zhuijiaDmg = Math.round(effectiveAtk * 0.8);
      const heavyBase = Math.round(effectiveAtk * 5.5);
      const heavyCalm = Math.round(effectiveAtk * 5.5 * 1.5);
      const burstMain = Math.round(effectiveAtk * 8.0);
      const burstSide = Math.round(effectiveAtk * 4.0);
      const varDmg = Math.round(effectiveAtk * 2.0);

      // C3 强化
      const c3Active = chain >= 3;
      const c3BurstMain = c3Active ? Math.round(effectiveAtk * 12.0) : 0;
      const c3BurstSide = c3Active ? Math.round(effectiveAtk * 6.0) : 0;
      const heavyC3 = c3Active ? Math.round(effectiveAtk * 5.5 * 7.0) : 0;
      const heavyCalmC3 = c3Active ? Math.round(effectiveAtk * 5.5 * 7.0 * 1.5) : 0;

      // tooltips
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${effectiveAtk}</b> × 120% = <b style="color:var(--text)">${normalDmg}</b>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 攻击 <b>${effectiveAtk}</b> × 220% = <b style="color:var(--accent)">${skillDmg}</b><br>` +
        `追加·不辞远 = 攻击 <b>${effectiveAtk}</b> × 80% = <b>${zhuijiaDmg}</b>`
      );
      const heavyTip = tipAttr(
        `<b style="color:var(--gold)">答剑三连伤害公式</b><br>` +
        `· 基础：攻击 <b>${effectiveAtk}</b> × 550% = <b style="color:#ff8c5e">${heavyBase}</b><br>` +
        `· 且从容（×1.5）：<b style="color:#ff8c5e">${heavyCalm}</b><br>` +
        (c3Active ? `· C3 +600%（×7）：<b style="color:#ff8c5e">${heavyC3}</b><br>` +
        `· C3+且从（×10.5）：<b style="color:#ff8c5e">${heavyCalmC3}</b>` : '')
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">共鸣解放伤害公式</b><br>` +
        `· 主目标：攻击 <b>${effectiveAtk}</b> × 800% = <b style="color:var(--gold)">${burstMain}</b><br>` +
        `· 副目标：攻击 <b>${effectiveAtk}</b> × 400% = <b style="color:var(--gold)">${burstSide}</b>` +
        (c3Active ? `<br>· C3：主 <b style="color:#ff8c5e">${c3BurstMain}</b> / 副 <b style="color:#ff8c5e">${c3BurstSide}</b>` : '')
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `= 攻击 <b>${effectiveAtk}</b> × 200% = <b>${varDmg}</b>`
      );

      // 共鸣链激活提示
      let chainHints = '';
      const parts = [];
      if (chain >= 1) parts.push(`<span style="color:var(--gold)">[1链]</span> 暴击 +20%`);
      if (chain >= 2) parts.push(`<span style="color:var(--gold)">[2链]</span> <b class="term-resource">竹照</b>全属性伤害由 +30% 提升至 +60%`);
      if (chain >= 3) parts.push(`<span style="color:var(--gold)">[3链]</span> 解放抬至主1200%/副600%；协奏满时技能替换为<b class="term-resource">荷蓑出林</b>（atk×500% 气动，直接满挑灯问剑进入淋漓醉墨）；下次答剑三连 +600%；延奏替换为<b class="term-resource">新筠坠箨</b>`);
      if (chain >= 4) parts.push(`<span style="color:var(--gold)">[4链]</span> 攻击 +20%`);
      if (chain >= 5) parts.push(`<span style="color:var(--gold)">[5链]</span> 无视目标 15% 防御`);
      if (chain >= 6) parts.push(`<span style="color:var(--gold)">[6链]</span> 退出淋漓醉墨时 600% AOE；荷蓑出林时暴伤 +100%；忠烈死节停滞目标`);
      if (parts.length) chainHints = '<br><span style="color:var(--muted);font-size:10px">·</span> ' + parts.join('<br><span style="color:var(--muted);font-size:10px">·</span> ');

      return [
        {
          icon: '\u2694', name: '普攻 · 质黑相青', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">气动伤害</b>。<br><b class="term-resource">挑灯问剑</b> +<b>10</b>。`
        },
        {
          icon: '\u2726', name: '共鸣技能 · 穿林打叶', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">气动伤害</b>，命中后自动追加一段 <b>不辞远</b>（<span class="tip" data-tip='${skillTip}'><b>${zhuijiaDmg}</b> 点</span><b class="term-skill">气动伤害</b>，0 AP）。<br><b class="term-resource">挑灯问剑</b> +<b>25</b>。`
        },
        {
          icon: '\u2728', name: '重击 · 答剑三连（淋漓醉墨中）', cost: '2 AP · 冷却 1 回合',
          color: '#ff8c5e',
          desc: `仅在<b class="term-resource">淋漓醉墨</b>状态中可用。三段合并结算：<span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavyBase}</b> 点</span><b class="term-heavy">气动伤害</b>，消耗全部<b class="term-resource">挑灯问剑</b>。<br>· <b class="term-resource">且从容</b> ×1.5：<b style="color:#ff8c5e">${heavyCalm}</b>${c3Active?`<br>· C3 +600%（×7）：<b style="color:#ff8c5e">${heavyC3}</b> / +且从容：<b style="color:#ff8c5e">${heavyCalmC3}</b>`:''}<br>· 忠烈死节回复 <b>30</b> 协奏。<br>· 退出淋漓醉墨。<br>· <b class="term-resource">竹照</b>全队全属性伤害 +30%（3 回合）。`
        },
        {
          icon: '\u26A1', name: '共鸣解放 · 万钧一断', cost: `3 AP · 需共鸣能量满 ${stats.maxEnergy || 125}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:var(--gold)">${c3Active ? c3BurstMain : burstMain}</b> 点</span>、副目标 <span class="tip" data-tip='${burstTip}'><b style="color:var(--gold)">${c3Active ? c3BurstSide : burstSide}</b> 点</span><b class="term-burst">气动伤害</b>（主800%/副400%${c3Active?'，C3→主1200%/副600%':''}）。<br>· 暴击 >50% 时，每 1% 超出暴击使登场角色 <b>+2%</b> 暴伤（上限 30%，3 回合）。<br>· <b class="term-resource">挑灯问剑</b> +<b>40</b>。${chainHints}`
        },
        {
          icon: '\u266C', name: '变奏 · 攻其必救', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `对主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b> 点</span><b class="term-variation">变奏伤害</b>（视为重击伤害）。<br><b class="term-resource">挑灯问剑</b> +<b>5</b>。`
        }
      ];
    },
    forteName: '挑灯问剑',
    forteDesc: '<b class="term-resource">挑灯问剑</b>（0-100）由普攻+<b>10</b> / 共鸣技能+<b>25</b> / 共鸣解放+<b>40</b> / 变奏+<b>5</b> 积累。<br>满值时进入<b class="term-resource">淋漓醉墨</b>状态 2 回合：<b class="term-resource">重击</b>替换为<b class="term-resource">答剑三连</b>（atk×550% 气动）。<br>首次进入触发<b class="term-resource">且从容</b>（答剑三连×1.5，每场 1 次）。<br>进入时触发<b class="term-resource">竹照</b>：全队全属性伤害+30%（3 回合）。<br>非当前角色时每回合-5。<br><br><span style="color:var(--gold);font-size:10px">\u25B8 推荐战斗节奏</span><br>普攻/技能攒挑灯问剑，进入淋漓醉墨，且从容×1.5答剑三连爆发，退出后继续攒。'
  },


  // 2.8 · 千咲（主C 湮灭 长刃 · HP 核）— 虚无绞痕·电锯模式
  '千咲': {
    intro: '湮灭 · 长刃 · 主C · 「虚无绞痕·电锯模式」',
    hasHeavy: false,
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const hp = stats.hp;

      const normalMult = 0.041;
      const skillMult  = 0.073;
      const sawSlashCombined = 0.053 * 3; // 15.9%
      const sawFinishMult = 0.122;
      const burstMainMult = 0.163 * (chain >= 5 ? 2 : 1);
      const burstSideMult = 0.081 * (chain >= 5 ? 2 : 1);
      const varMult = 0.033;
      const chiguiMult = 0.073;

      // 展示：基础倍率；万缕·汇终 / 链3 写在 follow-up，不默认乘进主数字
      const wanlvMult = 1 + 1.20;
      const c3Mult = chain >= 3 ? (1 + 1.20 + 1.20) : wanlvMult;

      const normalDmg    = Math.round(hp * normalMult);
      const skillDmg     = Math.round(hp * skillMult);
      const chiguiDmg    = Math.round(hp * chiguiMult);
      const sawSlashBase = Math.round(hp * sawSlashCombined);
      const sawFinishBase = Math.round(hp * sawFinishMult);
      const sawSlashWanlv = Math.round(hp * sawSlashCombined * wanlvMult);
      const sawFinishWanlv = Math.round(hp * sawFinishMult * wanlvMult);
      const sawSlashC3 = Math.round(hp * sawSlashCombined * c3Mult);
      const sawFinishC3 = Math.round(hp * sawFinishMult * c3Mult);
      const burstMainDmg = Math.round(hp * burstMainMult);
      const burstSideDmg = Math.round(hp * burstSideMult);
      const varDmg       = Math.round(hp * varMult);

      const normalTip = tipAttr(
        '<b style="color:var(--gold)">普攻·俱寂伤害公式(HP 核)</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 4.1% = <b style="color:var(--text)">' + normalDmg + '</b>'
      );
      const skillTip = tipAttr(
        '<b style="color:var(--gold)">共鸣技能·碎面构图伤害公式</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 7.3% = <b style="color:var(--accent)">' + skillDmg + '</b><br>' +
        '命中后 <b class="term-resource">锯环残响</b> +25，附加<b class="term-resource">虚无绞痕</b>'
      );
      const chiguiTip = tipAttr(
        '<b style="color:var(--gold)">齿轨轮回伤害公式</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 7.3% = <b style="color:var(--accent)">' + chiguiDmg + '</b><br>' +
        '消耗全部残响，进入<b class="term-state">电锯模式</b> 3 回合，附加虚无绞痕'
      );
      const sawSlashTip = tipAttr(
        '<b style="color:var(--gold)">锯环·疾攻伤害公式(电锯模式普攻)</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 5.3% × 3 段 = HP×15.9%<br>' +
        '基础: <b style="color:var(--text)">' + sawSlashBase + '</b><br>' +
        '万缕·汇终(+120%): <b style="color:#ff6b9d">' + sawSlashWanlv + '</b>' +
        (chain >= 3 ? '<br>万缕+链3(+240%): <b style="color:var(--gold)">' + sawSlashC3 + '</b>' : '') +
        '<br>每段+12 残响，三段+36'
      );
      const sawFinishTip = tipAttr(
        '<b style="color:var(--gold)">锯环·终结伤害公式</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 12.2%<br>' +
        '基础: <b style="color:#ff8c5e">' + sawFinishBase + '</b><br>' +
        '万缕·汇终(+120%): <b style="color:#ff6b9d">' + sawFinishWanlv + '</b>' +
        (chain >= 3 ? '<br>万缕+链3(+240%): <b style="color:var(--gold)">' + sawFinishC3 + '</b>' : '') +
        '<br>消耗全部残响，退出电锯模式'
      );
      const burstTip = tipAttr(
        '<b style="color:var(--gold)">共鸣解放·即刻·归无伤害公式(HP 核)</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 16.3%' +
        (chain >= 5 ? ' × 2(5链+100%)' : '') +
        '<br>= 主目标: <b style="color:var(--gold)">' + burstMainDmg + '</b><br>' +
        '副目标: <b style="color:var(--text)">' + burstSideDmg + '</b><br>' +
        '施放后进入<b class="term-resource">万缕·汇终</b> 2 回合，全队回血 HP×5%'
      );
      const varTip = tipAttr(
        '<b style="color:var(--gold)">变奏·鸣响·再临伤害公式(HP 核)</b><br>' +
        '= 最大生命 <b>' + hp + '</b> × 3.3% = <b style="color:var(--accent)">' + varDmg + '</b>'
      );

      return [
        {
          icon: '⚔', name: '普攻 · 俱寂 / 锯环系列', cost: '1 AP',
          color: 'var(--text)',
          desc: '非<b class="term-state">电锯模式</b>时对主目标造成 <span class="tip" data-tip="' + normalTip + '"><b style="color:var(--text)">' + normalDmg + '</b> 点</span><b class="term-normal">湮灭伤害</b>，<b class="term-resource">锯环残响</b> +10。' +
          '电锯模式下替换为锯环系列：<br>' +
          '• <b class="term-heavy">锯环·疾攻</b> <span class="tip" data-tip="' + sawSlashTip + '"><b style="color:var(--text)">' + sawSlashBase + '</b> 点</span>(3段合并)残响+36<br>' +
          '• 残响满时替换为<b class="term-heavy">锯环·终结</b> <span class="tip" data-tip="' + sawFinishTip + '"><b style="color:#ff8c5e">' + sawFinishBase + '</b> 点</span>，消耗全部残响退出电锯模式'
        },
        {
          icon: '✦', name: '共鸣技能 · 碎面构图', cost: '1 AP · CD 3 回合',
          color: 'var(--accent)',
          desc: '非电锯模式下对主目标造成 <span class="tip" data-tip="' + skillTip + '"><b style="color:var(--accent)">' + skillDmg + '</b> 点</span><b class="term-skill">湮灭伤害</b>。<b class="term-resource">锯环残响</b> +25。附加<b class="term-resource">虚无绞痕</b>。' +
          '残响满 100 时替换为<span class="tip" data-tip="' + chiguiTip + '"><b style="color:var(--accent)">齿轨轮回</b></span>：消耗全部残响，进入电锯模式 3 回合。' +
          (chain >= 1 ? '<br><span style="color:var(--gold)">[1 链]</span> 附加虚无绞痕时攻击 +30%(2 回合)。' : '') +
          (chain >= 2 ? '<br><span style="color:var(--gold)">[2 链]</span> <b class="term-resource">虚湮之线</b>：全队全属性伤害 +50%。' : '')
        },
        {
          icon: '⚡', name: '共鸣解放 · 即刻·归无', cost: '3 AP · 需能量满',
          color: 'var(--gold)',
          desc: '对主目标造成 <span class="tip" data-tip="' + burstTip + '"><b style="color:var(--gold)">' + burstMainDmg + '</b> 点</span>，对副目标造成 <b style="color:var(--text)">' + burstSideDmg + '</b> 点<b class="term-burst">湮灭伤害</b>。<br>施放后进入<b class="term-resource">万缕·汇终</b> 2 回合：<b class="term-heavy">锯环·疾攻</b>/<b class="term-heavy">终结</b>倍率 +120%，全队回血 HP×5%。' +
          (chain >= 5 ? '<br><span style="color:var(--gold)">[5 链]</span> 解放伤害 +100%。' : '') +
          (chain >= 6 ? '<br><span style="color:var(--gold)">[6 链]</span> 电锯模式下致死伤不倒(每场 1 次)，虚无绞痕升级为<b class="term-resource">虚无绞痕·终焉</b>：目标受千咲伤害 +40%。' : '')
        },
        {
          icon: '♫', name: '变奏入场 · 鸣响·再临', cost: '切换上场时触发',
          color: '#c39bff',
          desc: '切换上场时，对主目标造成 <span class="tip" data-tip="' + varTip + '"><b style="color:var(--accent)">' + varDmg + '</b> 点</span><b class="term-variation">湮灭伤害</b>。电锯模式下变奏接<b class="term-heavy">锯环·疾攻</b>第2段。'
        }
      ];
    },
    forteName: '锯环残响',
    forteDesc: '千咲的核心资源 <b class="term-resource">锯环残响</b>(0-100)：' +
      '<br>• <b class="term-normal">普攻</b>+10 / <b class="term-skill">碎面构图</b>+25 / <b class="term-heavy">锯环·疾攻</b>每段+12(三段+36)' +
      '<br>• 满 100 时共鸣技能替换为<b class="term-resource">齿轨轮回</b>(消耗全部残响，进入<b class="term-state">电锯模式</b> 3 回合)' +
      '<br>• 电锯模式下普攻替换为<b class="term-heavy">锯环·疾攻</b>(3段，残响+36)，再次满时替换为<b class="term-heavy">锯环·终结</b>(消耗全部残响，退出电锯模式)' +
      '<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>' +
      '普攻/技能攒残响，齿轨轮回进入电锯模式，锯环疾攻连段，残响满放锯环终结，解放万缕汇终后再进电锯'
  },

  // 3.0 · 琳奈（副C 衍射 佩枪）— 颜料·流光·绮彩巡游
  '琳奈': {
    intro: '衍射 · 佩枪 · 副C · 「溢彩」',
    hasHeavy: true,
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;

      // 共鸣链参数
      const skillMult = 1 + (chain >= 1 ? 0.30 : 0);        // 普攻·幻光折跃 +120%(折算)
      const allDmgMult = 1 + (chain >= 2 ? 0.25 : 0);        // 全伤害加深 25%
      const normalMult = 1 + (chain >= 3 ? 0.45 : 0);        // 视觉冲击/虹彩飞溅 +90%(折算)
      const atkBonus = chain >= 4 ? 0.20 : 0;                 // 攻击 +20%
      const burstMult = 1 + (chain >= 5 ? 0.70 : 0);          // 解放 +70%
      const chain6Normal = chain >= 6 ? 0.60 : 0;             // 心之彩 3 层虹彩飞溅/视觉冲击 +90%(折算)
      const effectiveAtk = Math.round(atk * (1 + atkBonus));
      const flowCdmg = chain >= 6 ? (1 + chain6Normal) : 1;

      const normalDmg  = Math.round(effectiveAtk * 1.0 * allDmgMult);
      const skillDmg   = Math.round(effectiveAtk * 2.0 * skillMult * allDmgMult); // 加色混合 200%
      const heavyDmg   = Math.round(effectiveAtk * 4.0 * flowCdmg * allDmgMult); // 满流光灵感碰撞
      const burstMain  = Math.round(effectiveAtk * 2.8 * burstMult * allDmgMult); // 设计 §4 280%
      const burstSide  = Math.round(effectiveAtk * 1.4 * burstMult * allDmgMult);
      const varDmg     = Math.round(effectiveAtk * 0.8 * allDmgMult);
      const varConcerto = Math.round(effectiveAtk * 1.6 * allDmgMult);

      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b>${atkBonus>0?` × (1 + ${(atkBonus*100).toFixed(0)}%) = ${effectiveAtk}`:''} × 100% = <b style="color:var(--text)">${normalDmg}</b>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">幻光折跃 / 视觉冲击 / 虹彩飞溅伤害公式</b><br>` +
        `= 攻击 <b>${effectiveAtk}</b> × 200%${skillMult>1?` × 链增伤 ${skillMult.toFixed(2)}`:''} = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const heavyTip = tipAttr(
        `<b style="color:var(--gold)">绮彩巡游·空中重击伤害公式</b><br>` +
        `= 攻击 <b>${effectiveAtk}</b> × 400%（满流光）${flowCdmg>1?` × 心之彩 ${flowCdmg.toFixed(2)}`:''} = <b style="color:#ff8c5e">${heavyDmg}</b>`
      );
      const chargeTip = tipAttr(
        `<b style="color:var(--gold)">灵感碰撞蓄力（3 级）</b><br>` +
        `· 1 级：流光 < 50%<br>` +
        `· 2 级：50% ≤ 流光 < 100%<br>` +
        `· 3 级：流光 = 100%<br>` +
        `光学取样阶段满溢彩时按住普攻蓄力，将溢彩转换为流光。`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式（爆炸喷涂）</b><br>` +
        `· 主目标：攻击 <b>${effectiveAtk}</b> × 280%${burstMult>1?` × 链增伤 ${burstMult.toFixed(2)}`:''} = <b style="color:#ff8c5e">${burstMain}</b><br>` +
        `· 副目标：攻击 <b>${effectiveAtk}</b> × 140%${burstMult>1?` × 链增伤 ${burstMult.toFixed(2)}`:''} = <b style="color:#ff8c5e">${burstSide}</b>`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `= 攻击 <b>${effectiveAtk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满：× 160% = <b style="color:var(--accent)">${varConcerto}</b>`
      );

      let chainHints = '';
      const parts = [];
      if (chain >= 1) parts.push(`<span style="color:var(--gold)">[1链]</span> 普攻·幻光折跃倍率 +120%`);
      if (chain >= 2) parts.push(`<span style="color:var(--gold)">[2链]</span> 全伤害加深 25%`);
      if (chain >= 3) parts.push(`<span style="color:var(--gold)">[3链]</span> 视觉冲击/虹彩飞溅倍率 +90%`);
      if (chain >= 4) parts.push(`<span style="color:var(--gold)">[4链]</span> 攻击 +20%`);
      if (chain >= 5) parts.push(`<span style="color:var(--gold)">[5链]</span> 共鸣解放·爆炸喷涂倍率 +70%`);
      if (chain >= 6) parts.push(`<span style="color:var(--gold)">[6链]</span> 心之彩 3 层：虹彩飞溅/视觉冲击伤害 +90%`);
      if (parts.length) chainHints = '<br><span style="color:var(--muted);font-size:10px">·</span> ' + parts.join('<br><span style="color:var(--muted);font-size:10px">·</span> ');

      return [
        {
          icon: '⚔', name: '普攻 · 泛彩流光 / 幻光折跃', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">衍射伤害</b>，命中后回复 12 能量、+8 协奏。`
        },
        {
          icon: '✦', name: '共鸣技能 · 视觉冲击 / 虹彩飞溅', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">衍射伤害</b>，命中后回复 22 能量。<br>· <b class="term-resource">光学取样</b>阶段非战斗回复<b class="term-resource">溢彩</b>。`
        },
        {
          icon: '💢', name: '重击 · 绮彩巡游·空中重击（核心）', cost: '2 AP · 冷却 1 回合',
          color: '#ff8c5e',
          desc: `对目标造成 <span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavyDmg}</b> 点</span><b class="term-heavy">衍射伤害</b>（视为普攻伤害）。<br><b class="term-resource">绮彩巡游</b>状态期间的主输出手段，<b>地面</b>按住普攻持续攻击后松开施放<b>跃动集束</b>。`
        },
        {
          icon: '⛸', name: '灵感碰撞（蓄力转换）', cost: '按住普攻',
          color: '#6bb5ff',
          desc: `<span class="tip" data-tip='${chargeTip}'>光学取样阶段满<b class="term-resource">溢彩</b>时按住普攻蓄力</span>：蓄力期间持续转换溢彩为流光（每段转换 15 溢彩为 12.5%<b class="term-resource">流光</b>）。<br><b class="term-resource">流光</b> ≥ 120 时进入<b style="color:var(--gold)">加色混合</b>爆发状态，绮彩巡游普攻第 1/4 段追击能力提升。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 爆炸喷涂', cost: `3 AP · 需共鸣能量满 ${stats.maxEnergy || 125}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstMain}</b> 点</span>、副目标 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSide}</b> 点</span><b class="term-burst">衍射伤害</b>。${chainHints}`
        },
        {
          icon: '🎵', name: '变奏技能 · 有空一起兜风！', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">衍射伤害</b>。`
        }
      ];
    },
    forteName: '溢彩 / 流光',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 资源系统</span><br>· <b class="term-resource">溢彩</b>（0-100）：战斗积累，光学取样阶段非战斗回复<br>· <b class="term-resource">流光</b>（0-120）：蓄力将溢彩转换为流光<br>· <b class="term-resource">加色混合</b>（流光 ≥ 120）：进入爆发状态，普攻/重击强化<br><br><span style="color:var(--gold);font-size:11px">▸ 绮彩巡游</span><br>· 进入后普攻替换为轮滑射击（最多 5 段）<br>· <b class="term-heavy">空中重击</b>：绮彩巡游期间核心输出段<br>· 流光 ≥ 120 时第 1/4 段追击能力提升<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能攒溢彩，光学取样蓄力转流光，流光 ≥ 120 进加色混合，绮彩巡游空中重击连段，解放爆炸喷涂终结。'
  },

  // 3.0 · 莫宁（主C 热熔 长刃 · ROLE_META）— 干涉标记·谐振场
};
