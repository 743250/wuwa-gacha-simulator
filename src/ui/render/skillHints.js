import { makeSkillLines } from './skillLines.js';

// 角色技能与机制简要描述（模拟器抽象，参考 AI 第三轮校准）
export const SKILL_HINTS = {
  '忌炎': {
    intro: '气动 · 长刃 · 主C · 「锐意之势」',
    hasHeavy: true,  // 重击积锐意，必须保留
    // 文案=具体数值，tooltip=计算公式
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;

      // ===== 共鸣链相关参数 =====
      const skillCd = chain >= 1 ? 2 : 3;
      const ruiyiCap = chain >= 6 ? 3 : 2;
      const perStack = chain >= 6 ? 1.2 : 1.0;
      const fullMult = 1 + ruiyiCap * perStack;            // 满锐意倍率：×3 / ×4.6
      const tongbianAtk = chain >= 2 ? 0.28 : 0;
      const mingduanAtk = chain >= 5 ? 0.45 : 0;
      const totalAtkUp = tongbianAtk + mingduanAtk;

      // ===== 真实伤害数（命中前结算）=====
      const normalDmg = Math.round(atk * 1.0);
      const skillDmg  = Math.round(atk * 1.8);
      const heavyDmg  = Math.round(atk * 2.2);
      const burstZero = Math.round(atk * 4.0);                       // 0 锐意时的解放（主目标）
      const burstOne  = Math.round(atk * 4.0 * (1 + perStack));      // 1 锐意（主目标）
      const burstFull = Math.round(atk * 4.0 * fullMult);            // 满锐意（主目标）
      const burstSide = Math.round(atk * 2.0);                       // 副目标基础
      const burstSideFull = Math.round(atk * 2.0 * fullMult);        // 副目标满锐意
      const varDmg    = Math.round(atk * 0.8);
      const varStrong = Math.round(atk * 1.6);                       // 协奏满

      // ===== 公式 tooltips =====
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100% = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">命中前结算，最终伤害受暴击/抗性/防御影响</span>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 180% = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const heavyTip = tipAttr(
        `<b style="color:var(--gold)">重击伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 220% = <b style="color:#ff8c5e">${heavyDmg}</b>`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式</b><br>` +
        `· 主目标基础 = 攻击 <b>${atk}</b> × 400% = ${burstZero}<br>` +
        `· 副目标基础 = 攻击 <b>${atk}</b> × 200% = ${burstSide}<br>` +
        `· 锐意每层 +${(perStack*100).toFixed(0)}%${chain>=6?'（共鸣链 6 由 +100% 提升）':''}<br>` +
        `· 0 锐意：主 ${burstZero} / 副 ${burstSide}<br>` +
        `· 1 锐意：主 ${burstOne}<br>` +
        `· ${ruiyiCap} 锐意（满层）：主 <b style="color:#ff8c5e">${burstFull}</b> / 副 <b style="color:#ff8c5e">${burstSideFull}</b>`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `· 普通：攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满（×2）：攻击 <b>${atk}</b> × 160% = <b style="color:var(--accent)">${varStrong}</b>`
      );

      // 共鸣链激活效果（写真实数值，不写"激活提示"）
      let chainHints = '';
      if (chain >= 2 || chain >= 5) {
        const detail = [
          chain >= 2 ? `· 共鸣链 2「通变」：破阵 +30、攻击 +28%（2 回合）` : '',
          chain >= 5 ? `· 共鸣链 5「明断」：攻击 +45%（2 回合）` : '',
          chain >= 5 ? `· 合计攻击 ${atk} → <b style="color:#ff8c5e">${Math.round(atk*(1+totalAtkUp))}</b>` : ''
        ].filter(Boolean).join('<br>');
        const varBuffTip = tipAttr(`<b style="color:var(--gold)">变奏入场加成</b><br>${detail}`);
        chainHints = `<br>切换上场时还会触发 <span class="tip" data-tip='${varBuffTip}'>共鸣链入场 buff（攻击 +${(totalAtkUp*100).toFixed(0)}%）</span>`;
      }

      return [
        {
          icon: '⚔', name: '普攻 · 长枪连段', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">气动伤害</b>，命中后回复 12 共鸣能量、积累 8 协奏值。<br>积满<b class="term-resource">破阵值</b>时，下次普攻进入<b style="color:var(--gold)">枪扫风定·强化连段</b>（伤害 ×2）。`
        },
        {
          icon: '✦', name: '共鸣技能 · 枪扫风定', cost: `1 AP · 冷却 ${skillCd} 回合`,
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">气动伤害</b>，命中后回复 22 能量、+18 协奏。<br>获得 <b style="color:var(--gold)">1 层</b><b class="term-resource">锐意之势</b>${chain>=1?`（共鸣链 1 已将冷却由 3 缩短为 <b>${skillCd}</b> 回合）`:''}。`
        },
        {
          icon: '💢', name: '重击 · 突进', cost: '2 AP · 冷却 1 回合',
          color: '#ff8c5e',
          desc: `对目标造成 <span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavyDmg}</b> 点</span><b class="term-heavy">气动伤害</b>，命中后回复 15 能量、+14 协奏。<br>获得 <b style="color:var(--gold)">1 层</b><b class="term-resource">锐意之势</b>。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 苍躣八荒', cost: `3 AP · 需共鸣能量满 ${stats.maxEnergy}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'>基础 <b style="color:#ff8c5e">${burstZero}</b></span>、副目标 <span class="tip" data-tip='${burstTip}'>基础 <b style="color:#ff8c5e">${burstSide}</b></span> <b class="term-burst">气动伤害</b>，消耗全部<b class="term-resource">锐意之势</b>放大：<br>· 1 锐意 主 <b style="color:#ff8c5e">${burstOne}</b><br>· ${ruiyiCap} 锐意（满层）主 <b style="color:#ff8c5e">${burstFull}</b> / 副 <b style="color:#ff8c5e">${burstSideFull}</b>（<b>×${fullMult.toFixed(1)}</b>）${chain>=4?`<br>释放后 2 回合内，全队<b class="term-heavy">重击</b>伤害 +25%（共鸣链 4「奇正」）`:''}`
        },
        {
          icon: '🎵', name: '变奏技能 · 攻其不备', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换至忌炎上场，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varStrong}</b>）点</span><b class="term-variation">变奏伤害</b>，获得 <b style="color:var(--gold)">1 层</b><b class="term-resource">锐意之势</b>。${chainHints}`
        }
      ];
    },
    forteName: '破阵值',
    forteDesc: '<b class="term-resource">破阵值</b>（0-100）由普攻 +12 / 技能 +25 / 解放 +40 积累，满后下次<b class="term-normal">普攻</b>进入<b style="color:var(--gold)">枪扫风定·强化连段</b>（伤害 ×2）。<br><br>真正的核心是<b class="term-resource">锐意之势</b>—— <b class="term-heavy">重击</b> / <b class="term-skill">共鸣技能</b> / <b class="term-variation">变奏入场</b> 每次 +1 层，<b class="term-burst">共鸣解放</b>消耗全部层数放大终结伤害。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>切人入场（积 1 锐意 + 攻击 buff）→ 共鸣技能（2 锐意）→ 重击（满 3 锐意 / 6 链）→ 共鸣解放清场。'
  },
  '今汐': {
    intro: '衍射 · 长刃 · 主C · 「韶光」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '凌霄', skillName: '逐天取月', burstName: '移岁诛邪', varName: '蟠龙清辉',
      normalMech: '<span style="color:var(--muted)">资源积累：</span>普攻 +<b>10</b> <b class="term-resource">韶光</b>，并获得 <b>1</b> 层<b class="term-resource">惊蛰</b>（上限 4）。',
      skillMech: '<span style="color:var(--muted)">形态判定：</span><b class="term-resource">韶光</b>未满时为<b>逐天取月</b>（+20 韶光 / +1 惊蛰）；韶光满 <b>100</b> 时下次共鸣技能替换为<b style="color:var(--gold)">惊龙破空</b>，消耗全部韶光与惊蛰造成高额爆发。',
      burstMech: '<span style="color:var(--muted)">爆发窗口：</span>优先在<b class="term-resource">惊蛰</b>叠满 4 层后释放，用 4 层惊蛰放大解放/惊龙破空循环。',
      skillFollowUp: '1 链：惊龙破空每层惊蛰 +25%（满 4 层 +100%）。 6 链：共鸣技能·惊龙破空倍率 +45%，消耗韶光时再 +45%。',
      burstFollowUp: '5 链：解放·移岁诛邪倍率 +120%。'
    }),
    forteName: '韶光',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· <b class="term-resource">韶光</b> 0-100：普攻 +10 / 技能 +20 / 变奏入场 +50<br>· <b class="term-resource">惊蛰</b> 0-4：普攻/技能各 +1 层<br>· 韶光满 <b>100</b> 时，下次<b class="term-skill">共鸣技能</b>变为<b style="color:var(--gold)">惊龙破空</b>，消耗全部韶光和惊蛰；惊蛰层数越高，爆发越高<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻/技能积韶光与惊蛰 → 变奏切下再切回补韶光 → 韶光满 100 + 惊蛰 4 层 → 惊龙破空 → 共鸣解放清场。'
  },
  '长离': {
    intro: '热熔 · 迅刀 · 主C · 「离火」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '赫羽连斩', skillName: '赫羽三相', heavyName: '焚身以火', burstName: '离火照丹心', varName: '焰离入场',
      hasHeavy: true,
      normalMech: '<span style="color:var(--muted)">资源积累：</span>普攻每 <b>3</b> 段获得 <b>1</b> 层<b class="term-resource">离火</b>（上限 3）。',
      skillMech: '<span style="color:var(--muted)">资源积累：</span>共鸣技能命中获得 <b>1</b> 层<b class="term-resource">离火</b>。',
      heavyMech: '<span style="color:var(--muted)">派生条件：</span>拥有<b class="term-resource">离火</b>时，重击变为<b>焚身以火</b>；消耗 <b>1</b> 层离火，每层使本次重击 +50%。无离火时为普通重击。',
      burstMech: '<span style="color:var(--muted)">爆发窗口：</span>建议在 2-3 层<b class="term-resource">离火</b>后释放，先用重击焚身打出强化段，再接解放收尾。',
      skillFollowUp: '2 链：获得离火时暴击 +25%。',
      heavyFollowUp: '1 链：共鸣技能/重击伤害 +10%。 5 链：重击·焚身以火倍率 +50%。',
      burstFollowUp: '3 链：共鸣解放·离火照丹心 +80%。 6 链：共鸣技能/重击/解放无视 40% 防御。'
    }),
    forteName: '离火',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态/派生条件</span><br>· <b class="term-resource">离火</b> 0-3 层：共鸣技能 +1 / 普攻每 3 段 +1<br>· 拥有离火时，<b class="term-heavy">重击</b>变为<b style="color:#ff8c5e">焚身以火</b>；释放后消耗 1 层离火，每层让本次重击 +50%<br>· 没有离火时，重击只是普通蓄力段<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>变奏入场 → 共鸣技能积 1 层离火 → 普攻补到 2-3 层 → 重击·焚身以火消耗离火爆发 → 共鸣解放·离火照丹心收尾。'
  },
  '守岸人': {
    intro: '衍射 · 音感仪 · 辅助 · 「星域」',
    // 文案=具体数值，tooltip=计算公式
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;
      const hp = stats.hp;
      const healBonus = stats.healBonus || 0;
      const energyMax = stats.maxEnergy || 125;

      // ===== 共鸣链相关参数 =====
      const fieldDur   = chain >= 1 ? 5 : 3;
      const fieldMult  = chain >= 1 ? 2.5 : 1.0;             // 1 链：增益强度 ×2.5
      const heal4Mult  = chain >= 4 ? 1.7 : 1.0;             // 4 链：持续治疗再 ×1.7
      const fieldAtkPct  = Math.round((chain >= 2 ? 40 : 0) * fieldMult);
      const fieldCratePct = Math.round(20 * fieldMult);
      const fieldCdmgPct  = Math.round(30 * fieldMult);

      // ===== 真实伤害/治疗数（命中前结算）=====
      const normalDmg = Math.round(atk * 1.0);
      const skillDmg  = Math.round(atk * 1.8);
      const burstDmg  = Math.round(atk * 4.0);
      const burstSide = Math.round(atk * 2.0);

      // 共鸣技能 · 混沌理论 一次性治疗（命中后给全队，4 链放大）
      const skillHealBase  = Math.round(hp * 0.06 + atk * 0.5);
      const skillHealTotal = Math.round(skillHealBase * (1 + healBonus) * heal4Mult);

      // 星域每回合持续治疗（生命×8% + 攻击×80%）（共鸣链 4 / 1 共同放大）
      const hotTotal = Math.round((hp * 0.08 + atk * 0.8) * (1 + healBonus) * heal4Mult * fieldMult);

      // 变奏伤害（守岸人 6 链：×6 倍率）
      const varDmg       = Math.round(atk * 0.8);
      const varConcerto  = Math.round(atk * 1.6);
      const varChain6    = chain >= 6 ? Math.round(atk * 1.6 * 6) : 0;

      // ===== 公式 tooltips =====
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100% = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">命中前结算，最终伤害受暴击/抗性/防御影响</span>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 180% = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 400% = <b style="color:#ff8c5e">${burstDmg}</b><br>` +
        `· 副目标：攻击 <b>${atk}</b> × 200% = <b style="color:#ff8c5e">${burstSide}</b>`
      );
      const skillHealTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能治疗公式</b><br>` +
        `= (生命 <b>${hp}</b> × 6% + 攻击 <b>${atk}</b> × 50%)<br>` +
        `&nbsp;&nbsp;× (1 + 治疗加成 ${(healBonus*100).toFixed(1)}%)` +
        (chain >= 4 ? `<br>&nbsp;&nbsp;× <b style="color:var(--gold)">共鸣链 4 倍率 1.7</b>` : '') +
        `<br>= <b style="color:var(--green)">${skillHealTotal}</b>`
      );
      const hotTip = tipAttr(
        `<b style="color:var(--gold)">星域每回合治疗公式</b><br>` +
        `= (生命 <b>${hp}</b> × 8% + 攻击 <b>${atk}</b> × 80%)<br>` +
        `&nbsp;&nbsp;× (1 + 治疗加成 ${(healBonus*100).toFixed(1)}%)` +
        (chain >= 4 ? `<br>&nbsp;&nbsp;× <b style="color:var(--gold)">共鸣链 4 倍率 1.7</b>` : '') +
        (chain >= 1 ? `<br>&nbsp;&nbsp;× <b style="color:var(--gold)">共鸣链 1 增益 ×2.5</b>` : '') +
        `<br>= <b style="color:var(--green)">${hotTotal}</b>`
      );
      const crateTip = tipAttr(
        `<b style="color:var(--gold)">星域全队暴击公式</b><br>` +
        `= 基础 <b>20%</b>` +
        (chain >= 1 ? ` × <b style="color:var(--gold)">共鸣链 1 增益 ×2.5</b>` : '') +
        `<br>= <b style="color:#ffd96b">+${fieldCratePct}%</b>`
      );
      const cdmgTip = tipAttr(
        `<b style="color:var(--gold)">星域全队暴伤公式</b><br>` +
        `= 基础 <b>30%</b>` +
        (chain >= 1 ? ` × <b style="color:var(--gold)">共鸣链 1 增益 ×2.5</b>` : '') +
        `<br>= <b style="color:#ffd96b">+${fieldCdmgPct}%</b>`
      );
      const fieldAtkTip = chain >= 2 ? tipAttr(
        `<b style="color:var(--gold)">星域全队攻击公式</b>（共鸣链 2）<br>` +
        `= 基础 <b>40%</b>` +
        (chain >= 1 ? ` × <b style="color:var(--gold)">共鸣链 1 增益 ×2.5</b>` : '') +
        `<br>= <b style="color:#ff8c5e">+${fieldAtkPct}%</b>`
      ) : '';
      const fieldDurTip = tipAttr(
        `<b style="color:var(--gold)">星域持续时间</b><br>` +
        `· 基础：<b>3</b> 回合` +
        (chain >= 1 ? `<br>· 共鸣链 1：延长至 <b>${fieldDur}</b> 回合 + 切换角色后不消散` : '')
      );
      const fieldTip = tipAttr(
        `<b style="color:var(--gold)">星域总览</b>（持续 <b>${fieldDur}</b> 回合${chain>=1?' · 切人不消散':''}）<br>` +
        `· 每回合治疗：<b style="color:var(--green)">${hotTotal}</b>（生命×8% + 攻击×80%${chain>=4?' × 1.7':''}${chain>=1?' × 2.5':''}）<br>` +
        `· 全队暴击 +<b style="color:#ffd96b">${fieldCratePct}%</b><br>` +
        `· 全队暴伤 +<b style="color:#ffd96b">${fieldCdmgPct}%</b>` +
        (chain >= 2 ? `<br>· 全队攻击 +<b style="color:#ff8c5e">${fieldAtkPct}%</b>（共鸣链 2）` : '')
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `· 普通：攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满：攻击 <b>${atk}</b> × 160% = <b style="color:var(--accent)">${varConcerto}</b>` +
        (chain >= 6 ? `<br>· 共鸣链 6（×6）：${varConcerto} × 6 = <b style="color:var(--gold)">${varChain6}</b>` : '')
      );

      return [
        {
          icon: '⚔', name: '普攻 · 真源构演', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">衍射伤害</b>，命中后回复 12 共鸣能量、积累 8 协奏值。`
        },
        {
          icon: '✦', name: '共鸣技能 · 混沌理论', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">衍射伤害</b>，并为附近队伍中所有角色恢复 <span class="tip" data-tip='${skillHealTip}'><b style="color:var(--green)">${skillHealTotal}</b> 点生命值</span>。<br>命中后回复 22 共鸣能量。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 终末回环', cost: `3 AP · 需共鸣能量满 ${energyMax}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstDmg}</b> 点</span>、对副目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSide}</b> 点</span><b class="term-burst">衍射伤害</b>，展开 <span class="tip" data-tip='${fieldTip}'><b class="term-resource">星域</b></span>（<span class="tip" data-tip='${fieldDurTip}'><b>${fieldDur}</b> 回合</span>${chain>=1?' · 切人不消散':''}）：<br>· 每回合治疗全队 <span class="tip" data-tip='${hotTip}'><b style="color:var(--green)">${hotTotal}</b></span><br>· 全队暴击 +<span class="tip" data-tip='${crateTip}'><b style="color:#ffd96b">${fieldCratePct}%</b></span> · 暴伤 +<span class="tip" data-tip='${cdmgTip}'><b style="color:#ffd96b">${fieldCdmgPct}%</b></span>${chain>=2?` · 攻击 +<span class="tip" data-tip='${fieldAtkTip}'><b style="color:#ff8c5e">${fieldAtkPct}%</b></span>`:''}${chain>=3?'<br>额外回复 <b>20</b> 共鸣能量（每 <b>2</b> 回合 1 次 · 共鸣链 3）':''}`
        },
        {
          icon: '🎵', name: '变奏技能 · 洞悉', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>${chain>=6?` · 6 链 <b style="color:var(--gold)">${varChain6}</b>`:''}）点</span><b class="term-variation">变奏伤害</b>。${chain>=5?'<br>共鸣链 5：普攻额外攻击一名相邻敌人。':''}`
        }
      ];
    },
    forteName: '协奏',
    forteDesc: '<b class="term-burst">共鸣解放·终末回环</b>展开<b class="term-resource">星域</b>，为全队提供每回合治疗、暴击率 +20%、暴击伤害 +30%。<br>2 链追加全队攻击 +40%，1 链延长持续并切人不散。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能积攒能量与协奏 → 解放展开星域 → 切换主力输出 → 在星域加成下输出。'
  },
  '椿': {
    intro: '湮灭 · 迅刀 · 主C · 「红椿蕊」',
    customLines: makeSkillLines({
      element: '湮灭',
      normalName: '红椿剑舞', skillName: '一日花', burstName: '芳华绽烬', varName: '八千春秋',
      normalMech: '<span style="color:var(--muted)">资源积累：</span>每段普攻 +<b>10</b> <b class="term-resource">红椿蕊</b>。<b class="term-resource">含苞</b>状态下普攻 ×1.5（6 链 ×2.5）。',
      skillMech: '<span style="color:var(--muted)">形态切换：</span><b class="term-resource">红椿蕊</b>满 <b>100</b> 且协奏 ≥ <b>50</b> 时，共鸣技能替换为<b style="color:var(--gold)">永生花</b>：消耗 50 蕊 + 50 协奏，进入<b class="term-resource">含苞</b>状态 <b>3</b> 回合（普攻/技能 ×1.5；6 链 ×2.5）。<br><span style="color:var(--muted)">未满 100 蕊：</span>正常一日花，每次 +<b>20</b> 蕊。',
      burstMech: '<span style="color:var(--muted)">含苞期间释放：</span>伤害基础放大 ×1.5（6 链 ×2.5）+ 3 链时自身攻击 +58%。',
      skillFollowUp: '2 链：共鸣回路·一日花伤害倍率 +120%。 6 链：含苞强化倍率 1.5 → 2.5。',
      burstFollowUp: '3 链：解放·芳华绽烬 +50%，含苞期间攻击 +58%。',
      varFollowUp: '1 链：变奏后暴击伤害 +28%。 5 链：变奏倍率 +303%。'
    }),
    forteName: '红椿蕊',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· <b style="color:var(--text)">常态</b>（默认）：普攻 +10 / 技能 +20 <b class="term-resource">红椿蕊</b>（0-100）<br>· <b style="color:var(--gold)">永生花触发</b>：红椿蕊满 <b>100</b> + 协奏值 ≥ <b>50</b> → 下次共鸣技能变为<b style="color:var(--gold)">永生花</b>，消耗资源后进入<b class="term-resource">含苞</b>状态<br>· <b style="color:#c39bff">含苞形态</b>：普攻/技能 ×<b>1.5</b>（6 链 ×<b>2.5</b>）+ 自身攻击 +58%（3 链），持续 <b>3</b> 回合后自动退出<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>变奏起手 → 普攻 + 共鸣技能积蕊 + 协奏 → 满 100 蕊后释放<b style="color:var(--gold)">永生花</b>进入含苞 → 含苞 3 回合全程爆发（普攻/技能 ×1.5/×2.5）→ 共鸣解放收尾。'
  },
  '折枝': {
    intro: '冷凝 · 音感仪 · 副C · 「墨鹤召唤协同」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '挥毫', skillName: '神来之笔', burstName: '虚实境趣', varName: '展卷入场',
      skillFollowUp: '6 链：额外召唤 <b>1</b> 只<b class="term-resource">白鹤</b>（共鸣技能伤害 +120%）。',
      burstFollowUp: '召唤 <b>6</b> 只<b class="term-resource">墨鹤</b>持续协同，是折枝后台输出的核心。 2 链：墨鹤上限 +6 → 12 只。 4 链：解放时全队攻击 +20%。 5 链：协同墨鹤额外 +40% 伤害。'
    }),
    forteName: '墨鹤',
    forteDesc: '折枝是召唤型副C：<b class="term-burst">共鸣解放·虚实境趣</b>召唤 6 只<b class="term-resource">墨鹤</b>，切下场后<b>每回合自动协同</b>攻击。<br>2 链上限 +6（12 只）、5 链协同伤害 +40%、6 链共鸣技能额外白鹤。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏起手 → 共鸣技能 + 普攻积能量 → 释放解放召唤墨鹤 → 切到主 C → 墨鹤后台跟手。'
  },
  '相里要': {
    intro: '导电 · 臂铠 · 副C · 「邃古遗墟」',
    customLines: makeSkillLines({
      element: '导电',
      normalName: '基本推衍', skillName: '万方法则', burstName: '思维矩阵', varName: '链式入场',
      skillFollowUp: '<b class="term-resource">邃古遗墟</b>可用时，每次共鸣技能消耗 1 次伤害 +63%（最多 5 次）。 1 链：额外 6 个<b class="term-resource">衍构模体</b>（伤害 +48%）。 6 链：幻方强化共鸣技能 +76%。',
      burstFollowUp: '释放后获得 <b>5</b> 次<b class="term-resource">邃古遗墟</b>叠层。 4 链：解放时全队共鸣解放 +25%。 5 链：解放·思维矩阵倍率 +100%。'
    }),
    forteName: '幻方',
    forteDesc: '<b class="term-burst">共鸣解放·思维矩阵</b>释放后获得 5 次<b class="term-resource">邃古遗墟</b>buff：每次<b class="term-skill">共鸣技能</b>消耗 1 次，让本次 +63% 伤害。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣解放铺 buff → 切到主 C 输出 → 切回相里要打满 5 个共鸣技能爆发。'
  },
  '珂莱塔': {
    intro: '冷凝 · 佩枪 · 主C · 「解离」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '冷凝枪击', skillName: '示我璀璨', heavyName: '末路见行', burstName: '死兆', varName: '碎璃镜花',
      burstMech: '<span style="color:var(--muted)">控制效果：</span><b class="term-burst">共鸣解放·死兆</b>射击命中附加<b class="term-resource">焕彩</b>，使目标短暂停滞。',
      heavyMech: '<span style="color:var(--muted)">重击派生：</span><b class="term-heavy">重击·末路见行</b>是珂莱塔的爆发段；4 链时施放后全队共鸣技能 +25%。',
      skillMech: '<span style="color:var(--muted)">强化条件：</span>命中带<b class="term-resource">解离</b>/<b class="term-resource">变彩</b>的目标会回复<b class="term-resource">灵萃</b>。灵萃满时，共鸣技能进入<b style="color:var(--gold)">暴力美学</b>强化形态（高倍率冷凝伤害）。',
      hasHeavy: true,
      skillFollowUp: '<b class="term-resource">灵萃</b>满时强化为<b style="color:var(--gold)">暴力美学</b>。 3 链：共鸣技能·示我璀璨 +93%。',
      heavyFollowUp: '5 链：重击·末路见行 +47%。 4 链：施放重击时全队<b class="term-skill">共鸣技能</b>伤害 +25%。',
      burstFollowUp: '射击命中附加<b class="term-resource">焕彩</b><b class="term-resource">停滞</b>效果。 1 链：对<b class="term-resource">解离</b>目标暴击 +12.5%。 2 链：解放·致死以终 +126%。 6 链：死兆射击 + 晶体翻倍 = 解放 +186.6%。'
    }),
    forteName: '灵萃',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 强化条件</span><br>· 共鸣技能命中带<b class="term-resource">解离</b>/<b class="term-resource">变彩</b>的目标 → 回复<b class="term-resource">灵萃</b><br>· 灵萃满后，下次共鸣技能进入<b style="color:var(--gold)">暴力美学</b>强化形态<br>· <b class="term-heavy">重击·末路见行</b>是主要爆发段（4 链给全队共鸣技能 +25%）<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能挂解离/变彩 → 继续技能回灵萃 → 灵萃满释放暴力美学 → 重击末路见行 → 共鸣解放死兆附加焕彩停滞。'
  },
  '洛可可': {
    intro: '湮灭 · 臂铠 · 副C · 「想象力」',
    customLines: makeSkillLines({
      element: '湮灭',
      normalName: '幻想照进现实', skillName: '高难度设计', burstName: '即兴喜剧', varName: '佩洛，来帮忙',
      skillFollowUp: '回复 100 想象力 + 10 协奏；普攻幻想照进现实免疫打断。 4 链：共鸣技能后普攻幻想照进现实 +60%。',
      burstFollowUp: '开场强化普攻 + 重击。 2 链：普攻每层给全队湮灭 +10%（满 3 层 +40%）。 3 链：变奏后暴击/暴伤 +10%/+30%。 5 链：解放开场 +20%，重击 +80%。 6 链：解放期间普攻无视 60% 防御。'
    }),
    forteName: '想象力',
    forteDesc: '洛可可是<b style="color:#a78bff">湮灭副C</b>：<b class="term-skill">共鸣技能·高难度设计</b>回 100 想象力 + 10 协奏；普攻每段给全队<b class="term-resource">湮灭伤害 +10%</b>（满 3 层 +40%）。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏起手积湮灭 buff → 共鸣技能 → 普攻铺 3 层 → 切到主 C 享受湮灭团 buff。'
  },
  '菲比': {
    intro: '衍射 · 音感仪 · 主C · 「赦罪/告解双形态」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '夏弥尔之星', skillName: 'FFF · 镜之环', heavyName: '星辉', burstName: '启明之誓愿', varName: '金色恩典',
      hasHeavy: true,
      skillMech: '<span style="color:var(--muted)">形态切换：</span>消耗 <b>1</b> 点<b class="term-resource">福音</b>，<b style="color:var(--gold)">赦罪</b>↔<b style="color:#a78bff">告解</b>形态切换（战斗开始默认<b style="color:var(--gold)">赦罪</b>）。召唤<b class="term-resource">镜之环</b>对范围内目标附加<b class="term-resource">光噪效应</b>。',
      heavyMech: '<span style="color:var(--muted)">形态差异：</span><b style="color:var(--gold)">赦罪</b>下重击普通倍率；<b style="color:#a78bff">告解</b>下重击大幅强化（3 链 +249%）。消耗<b class="term-resource">福音</b>。',
      burstMech: '<span style="color:var(--muted)">形态差异：</span><b style="color:var(--gold)">赦罪</b>下解放高倍率（1 链 255% → 480%）；<b style="color:#a78bff">告解</b>下解放叠满<b class="term-resource">光噪</b>（1 链）。',
      skillFollowUp: '6 链：召唤<b class="term-resource">镜之环</b>时攻击 +10%。',
      heavyFollowUp: '2 链：赦罪状态下延奏对光噪目标 +120%。 3 链：重击·星辉 +91%。',
      burstFollowUp: '1 链：赦罪状态解放倍率从 255% → 480%。 5 链：自身衍射伤害 +12%。'
    }),
    forteName: '福音',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· <b style="color:var(--gold)">赦罪</b>（默认）：强化<b class="term-burst">共鸣解放</b>（解放倍率 +225%）<br>· <b style="color:#a78bff">告解</b>：强化<b class="term-heavy">重击·星辉</b>（重击 +249%）+ FFF 镜之环叠满光噪<br>· 施放<b class="term-skill">共鸣技能·FFF</b>消耗 <b>1</b> 点<b class="term-resource">福音</b>切换形态；战斗开始默认赦罪<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻铺<b class="term-resource">光噪效应</b> → FFF 召唤<b class="term-resource">镜之环</b> 切换告解 → 重击·星辉爆发 → 再 FFF 切回赦罪 → 共鸣解放·启明之誓愿清场。'
  },
  '卡提希娅': {
    intro: '气动 · 迅刀 · 主C · 「决意」与「芙露德莉斯」双形态',
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
          icon: '⚡', name: '共鸣解放 · 听骑士从心祈愿', cost: `3 AP · 需能量满 ${stats.maxEnergy || 125}`,
          color: 'var(--gold)',
          desc: `<b style="color:#a78bff">进入芙露德莉斯形态，无直接伤害。</b><br><br>` +
                `<b>消耗当前全部【决意】层数</b>，根据层数获得形态之力：<br>` +
                `<span style="color:var(--muted)">· 1 层 →</span> <b class="term-resource">人权</b> <span style="color:var(--muted)">· 2 层 →</span> <b class="term-resource">神权</b> <span style="color:var(--muted)">· 3 层 →</span> <b class="term-resource">异权</b><br><br>` +
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
      '叠满 3 层决意 → 解放·听骑士从心祈愿进芙露德莉斯形态 → 攻击叠风蚀 → 解放·看潮怒风哮之刃爆发 → 回到常态重新循环。'
  },
  '嘉贝莉娜': {
    intro: '热熔 · 佩枪 · 主C · 「余火」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '炼羽射击', skillName: '裁决', heavyName: '炼羽裁决', burstName: '永恒位格', varName: '声骸入场',
      heavyMech: '<span style="color:var(--muted)">爆发段：</span><b class="term-heavy">重击·炼羽裁决</b>是永恒位格期间的主输出。',
      burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">共鸣解放·永恒位格</b>后进入<b class="term-resource">永恒位格</b>强化状态；6 链时自身伤害 +60%，余火满层热熔加深 +35%。',
      skillMech: '<span style="color:var(--muted)">资源积累：</span>普攻/技能积攒<b class="term-resource">余火</b>（0-10 点），余火越高暴击伤害越高（1 链）。',
      hasHeavy: true,
      skillFollowUp: '积<b class="term-resource">余火</b>。 1 链：余火 10 点 × 8% = 暴击伤害 +80%。 5 链：共鸣技能伤害 +150%。',
      heavyFollowUp: '炼羽裁决是嘉贝主输出段。 2 链：内燃烧攻击 +150%。',
      burstFollowUp: '进入<b class="term-resource">永恒位格</b>，自身全面增益。 3 链：共鸣解放 +130%。 4 链：声骸后全队伤害 +20%。 6 链：永恒位格自身伤害 +60%，余火满层热熔加深 +35%。'
    }),
    forteName: '余火',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普攻/技能积攒<b class="term-resource">余火</b>（0-10）<br>· 释放<b class="term-burst">共鸣解放·永恒位格</b> → 进入永恒位格强化状态<br>· 永恒位格期间：自身伤害提升（6 链 +60%），重击·炼羽裁决主输出；余火越高，热熔加深越高<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻/技能积余火 → 余火接近满层 → 共鸣解放进入永恒位格 → 重击·炼羽裁决爆发。'
  },
  '卡卡罗': {
    intro: '导电 · 长刃 · 主C · 「杀戮武装」',
    customLines: makeSkillLines({
      element: '导电',
      normalName: '杀戮指令', skillName: '灭杀指令', heavyName: '死告', burstName: '杀戮武装', varName: '全境通缉',
      heavyMech: '<span style="color:var(--muted)">解放形态内：</span><b class="term-heavy">重击·死告</b>是 Deathblade 形态的终结段；6 链会召唤<b class="term-resource">猎杀影</b>协同。',
      burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">共鸣解放·杀戮武装</b>后进入<b class="term-resource">Deathblade</b>形态 <b>2</b> 回合；期间普攻/技能 +50%，结束后自动退出。',
      hasHeavy: true,
      skillFollowUp: '1 链：共鸣技能命中额外回 10 能量。 2 链：变奏后共鸣技能 +30%。',
      heavyFollowUp: '6 链：召唤 2 个<b class="term-resource">猎杀影</b><b class="term-resource">协同攻击</b>。',
      burstFollowUp: '进入 <b style="color:var(--gold)">Deathblade</b> 形态：普攻/技能 +50%（持续 2 回合）。 3 链：解放期间导电 +25%。 4 链：延奏后全队导电 +20%。 5 链：变奏伤害 +50%。'
    }),
    forteName: '杀意',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普攻/技能攒能量<br>· 释放<b class="term-burst">共鸣解放·杀戮武装</b> → 进入<b class="term-resource">Deathblade</b>形态 <b>2</b> 回合<br>· Deathblade 期间：普攻/技能 +50%；重击·死告是爆发终结段；6 链召唤猎杀影协同<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能攒能量 → 满能量开杀戮武装 → 2 回合内普攻/技能输出 → 重击·死告收尾。'
  },
  '布兰特': {
    intro: '热熔 · 迅刀 · 辅助 · 「火焰归亡曲护盾辅助」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '生活皆舞台', skillName: '空中攻击', burstName: '火焰归亡曲', varName: '为我！',
      skillFollowUp: '<b class="term-heavy">空中攻击</b>是布兰特核心。 1 链：变奏/<b class="term-heavy">空中攻击</b> +20%，叠 3 层（满 +60%）。 6 链：<b class="term-heavy">空中攻击</b>倍率 +30%。',
      burstFollowUp: '给全队上护盾。 2 链：<b class="term-heavy">空中攻击</b>/火焰归亡曲暴击 +30%。 3 链：火焰归亡曲伤害 +42%。 4 链：护盾 +20% + 治疗全队。 5 链：普攻伤害 +15%。 6 链：解放后<b class="term-normal">再燃</b> +30%。'
    }),
    forteName: '航向',
    forteDesc: '布兰特是<b style="color:#ff8c5e">热熔辅助</b>：<b class="term-burst">火焰归亡曲</b>给全队上护盾 + 治疗，<b class="term-variation">变奏·为我！</b>叠攻击 buff（3 层 +60%），适合配合主 C 输出。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏起手叠 3 层攻击 → 共鸣解放·火焰归亡曲铺护盾 → 切到主 C 主输出 → 切回触发延奏爆炸（2 链）。'
  },
  '坎特蕾拉': {
    intro: '湮灭 · 音感仪 · 副C · 「蜃境」',
    customLines: makeSkillLines({
      element: '湮灭',
      normalName: '蛰幻', skillName: '翩跹', burstName: '陷溺', varName: '幻梦入场',
      burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">陷溺</b>给目标附加<b class="term-resource">迷梦</b>，触发<b class="term-resource">惊醒</b>爆发；3 链时释放后直接进入<b class="term-resource">蜃境</b>。',
      skillMech: '<span style="color:var(--muted)">资源积累：</span>施放共鸣技能回复 <b>1</b> 点<b class="term-resource">迷离</b>。迷离满后配合解放·陷溺进入<b class="term-resource">蜃境</b>。',
      skillFollowUp: '回 1 点<b class="term-resource">迷离</b>。 1 链：共鸣技能 +50%。',
      burstFollowUp: '附加<b class="term-resource">迷梦</b>状态，触发<b class="term-resource">惊醒</b>。 2 链：惊醒伤害倍率 +245%。 3 链：解放·陷溺 +370% + 直接进入蜃境。 4 链：蜃境治疗加成 +25%。 6 链：解放期间无视 30% 防御。'
    }),
    forteName: '迷离',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 共鸣技能每次 +1 <b class="term-resource">迷离</b><br>· 释放<b class="term-burst">共鸣解放·陷溺</b>给目标附加<b class="term-resource">迷梦</b>，后续命中触发<b class="term-resource">惊醒</b><br>· 3 链：释放陷溺后直接进入<b class="term-resource">蜃境</b>；无 3 链时需迷离满才进入<br>· 蜃境期间治疗 +25%（4 链）并强化输出<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能积迷离 → 共鸣解放·陷溺挂迷梦 → 触发惊醒 → 进入蜃境继续输出。'
  },

  // ===== 常驻 5★ =====
  '维里奈': {
    intro: '衍射 · 音感仪 · 治疗 · 「光合标记」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '星星花', skillName: '扩繁试验', burstName: '草木生长', varName: '盛放入场',
      skillFollowUp: '回 <b class="term-resource">光合能量</b>。 2 链：技能额外回 1 光合 + 10 协奏。',
      burstFollowUp: '<b class="term-burst">解放</b>给全队挂<b class="term-resource">光合标记</b>（持续治疗）。 3 链：<b class="term-resource">光合标记</b>治疗加成 +12%。 4 链：重击/解放/延奏后全队衍射 +15%。 5 链：治疗低 HP 角色时治疗 +20%。 6 链：重击·星星花绽放 +20% + <b class="term-resource">协同攻击</b>。'
    }),
    forteName: '光合能量',
    forteDesc: '维里奈是<b style="color:var(--accent)">衍射治疗</b>位：<b class="term-burst">共鸣解放·草木生长</b>给全队<b class="term-resource">光合标记</b>持续回血，<b class="term-resource">延奏·盛放</b>给登场角色额外回血。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻技能积能量 → 解放铺光合标记 → 切到主 C → 后续切回挂延奏。'
  },
  '安可': {
    intro: '热熔 · 佩枪 · 主C · 「黑咩」',
    customLines: makeSkillLines({
      element: '热熔',
      forteName: '失序值',
      normalNameWhite: '羊咩出击', normalNameBlack: '黑咩·胡闹',
      skillNameWhite: '热力羊咩', skillNameBlack: '黑咩·狂热',
      heavyNameWhite: '白咩·失控之炎', heavyNameBlack: '黑咩·暴走之炎', burstName: '黑咩大暴走', varName: '咩咩帮手',
      normalForteGainWhite: 20, normalForteGainBlack: 10,
      skillForteGainWhite: 35, skillForteGainBlack: 10,
      hasHeavy: true,
      burstMechWhite: '安可释放<b class="term-burst">黑咩大暴走</b>进入<b style="color:#a78bff">黑咩形态</b>并持续 <b>4</b> 个回合，期间攻击和技能获得强化并额外 +<b>10</b> <b class="term-resource">失序值</b>。',
      burstMechBlack: '<b style="color:#a78bff">黑咩形态</b>期间，普攻和技能已切换为强化版；<b class="term-resource">失序值</b>满时重击触发<b class="term-burst">黑咩·暴走之炎</b>。',
      encoreBurstToggle: true,
      skillFollowUp: '1 链：普攻命中给自身热熔 +3%/层（最多 4 层）。 2 链：普攻/共鸣技能额外回 10 能量。 5 链：共鸣技能伤害加成 +35%。',
      heavyFollowUp: '3 链：白咩·失控之炎 / 黑咩·暴走之炎伤害倍率 +40%。 4 链：黑咩·暴走之炎后全队热熔 +20%。',
      burstFollowUp: '6 链：黑咩大暴走期间每段伤害叠 1 层<b class="term-resource">迷失羔羊</b>（攻击 +5%，最多 5 层）。'
    }),
    showSkillModeToggle: true,
    forteName: '失序值',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 核心资源</span><br>· <b class="term-resource">失序值</b> 0-100：普攻 +20 / 共鸣技能 +35 / 变奏 +30；黑咩形态内命中额外 +10<br>· 失序值满时施放重击：消耗 100 失序值，常态触发<b class="term-burst">白咩·失控之炎</b>；黑咩形态内触发<b class="term-burst">黑咩·暴走之炎</b>。'
  },
  '凌阳': {
    intro: '冷凝 · 迅刀 · 主C · 「狮子奋迅」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '挥斩', skillName: '飞身式·翻山越涧', burstName: '狮子奋迅', varName: '出洞·睡狮蛰醒',
      skillMech: '<span style="color:var(--muted)">行狮期间：</span>共鸣技能后下次普攻会获得 6 链强化（若已激活）。',
      burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">共鸣解放·狮子奋迅</b>后进入<b class="term-resource">行狮</b>形态；期间普攻/技能获得强化，6 链时技能后下次普攻 +100%。',
      skillFollowUp: '6 链：行狮状态下，共鸣技能后下次普攻 +100%。',
      burstFollowUp: '开启<b style="color:var(--gold)">行狮形态</b>。 2 链：变奏额外回 10 能量。 3 链：解放期间普攻 +20% / 技能 +10%。 4 链：延奏给全队冷凝 +20%。 5 链：解放额外 atk × 200% 冷凝伤害。'
    }),
    forteName: '行狮',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普通普攻/技能循环<br>· 释放<b class="term-burst">共鸣解放·狮子奋迅</b> → 进入<b class="term-resource">行狮</b>形态<br>· 行狮期间：3 链给普攻 +20% / 技能 +10%；6 链每次技能后下次普攻 +100%<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>变奏入场 → 共鸣解放进入行狮 → 技能 → 强化普攻 → 重复循环。'
  },
  '鉴心': {
    intro: '气动 · 臂铠 · 辅助 · 「涤净力场」',
    customLines: makeSkillLines({
      element: '气动',
      normalName: '掌击', skillName: '静气循行', burstName: '涤净力场', varName: '掌息之要',
      burstMech: '<span style="color:var(--muted)">重击联动：</span>施放<b class="term-heavy">重击·混元气旋</b>后，4 链会让<b class="term-burst">涤净力场</b>伤害 +80%。',
      skillMech: '<span style="color:var(--muted)">派生条件：</span>施放<b class="term-skill">静气循行</b>进入<b class="term-resource">架势</b>，保持 <b>1</b> 回合后下次技能变为<b class="term-skill">行气反击</b>。',
      skillFollowUp: '进入<b class="term-resource">架势</b>。 2 链：使用次数 +1。 3 链：架势保持后可打出<b class="term-skill">行气反击</b>。',
      burstFollowUp: '<b class="term-burst">涤净力场</b>清场。 4 链：重击·混元气旋时解放 +80%。 5 链：解放额外回 20 能量。 6 链：气动伤害 +20%。'
    }),
    forteName: '架势',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 派生条件</span><br>· 施放<b class="term-skill">共鸣技能·静气循行</b> → 进入<b class="term-resource">架势</b><br>· 架势保持 <b>1</b> 回合后，再次施放技能 → <b class="term-skill">行气反击</b><br>· 6 链：重击·混元气旋期间可施放特殊行气反击（atk×557% 重击类型）<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能进入架势 → 等 1 回合/或技能派生 → 行气反击 → 重击·混元气旋 → 共鸣解放·涤净力场。'
  },

  // ===== 4★ 角色 =====
  '莫特斐': {
    intro: '热熔 · 佩枪 · 副C · 「浮翼狂想协同」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '佩枪射击', skillName: '应援', burstName: '浮翼狂想', varName: '声骸入场',
      skillFollowUp: '4 链：技能命中后全队热熔 +12%。',
      burstFollowUp: '<b class="term-burst">浮翼狂想</b>协同窗口：主 C 用技能时莫特斐补刀。 1 链：解放期间共鸣技能触发协同。 2 链：声骸后额外回 10 能量。 3 链：加强音暴伤 +30%。 4 链：解放时长 +7 秒。 5 链：共鸣技能命中触发协同。 6 链：解放·暴烈终曲时全队攻击 +20%。'
    }),
    forteDesc: '莫特斐是<b style="color:#ff8c5e">热熔副C</b>：<b class="term-burst">共鸣解放·浮翼狂想</b>开启协同窗口，主 C 用技能时莫特斐补刀。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>解放铺协同 buff → 切到主 C 用技能触发莫特斐协同。'
  },
  '散华': {
    intro: '冷凝 · 长刃 · 副C · 「霜色」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '剑舞', skillName: '朔雪永冻', heavyName: '爆裂', burstName: '焦瞑冻土', varName: '剑修入场',
      hasHeavy: true,
      skillFollowUp: '1 链：第 5 段普攻后暴击 +15%。',
      heavyFollowUp: '4 链：解放后下次重击·爆裂 +120%。 6 链：重击·爆裂倍率 +50%。',
      burstFollowUp: '消耗<b class="term-resource">冰绽</b>。 4 链：解放回 10 能量。 5 链：<b class="term-resource">冰绽</b>暴击伤害 +100%，冰棘/冰棱/冰川消失时直接爆炸。 6 链：引爆冰棱/冰川后全队攻击 +10%×2 层。'
    }),
    forteDesc: '散华是<b style="color:#7bd6ff">冷凝副C</b>：核心是<b class="term-heavy">重击·爆裂</b>，配合 4 链解放后的高倍率爆发。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻 5 段 → 共鸣技能 → 共鸣解放 → 重击·爆裂爆发。'
  },
  '卜灵': {
    intro: '导电 · 音感仪 · 辅助 · 「五雷荡煞阵」',
    customLines: makeSkillLines({
      element: '导电',
      normalName: '符咒', skillName: '五雷荡煞阵', burstName: '飞雷诀·归一', varName: '索拉云游',
      skillFollowUp: '<b class="term-resource">五雷荡煞阵</b>给团队电磁 debuff + 治疗。 5 链：荡煞阵生成时附加 6 层<b class="term-resource">电磁效应</b>。',
      burstFollowUp: '<b class="term-burst">飞雷诀</b>清场。 1 链：解放暴击 +20%。 2 链：<b class="term-resource">阴阳相生</b>回 25 能量。 3 链：荡煞阵期间全队 HP <50% 时治疗。 4 链：治疗加成 +20%。 6 链：<b class="term-resource">雷法·三才合一</b>时全队共鸣技能 +50%。'
    }),
    forteDesc: '卜灵是<b style="color:#7bd6ff">导电辅助</b>：<b class="term-skill">五雷荡煞阵</b>给团队电磁 debuff + 治疗，最强的 6 链全队<b class="term-skill">共鸣技能 +30%</b> 是核心辅助价值。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>开场共鸣技能铺雷阵 → 解放·飞雷诀爆发 → 切到主 C 享受全队技能 buff。'
  },
  '丹瑾': {
    intro: '湮灭 · 长刃 · 副C · 「朱蚀之刻」',
    customLines: makeSkillLines({
      element: '湮灭',
      normalName: '红枝挥斩', skillName: '朱蚀之刻', burstName: '湮灭爆发', varName: '红椿入场',
      skillFollowUp: '给目标附加<b class="term-resource">朱蚀之刻</b>。 1 链：攻击带朱蚀目标 +5%/层（满 6 层 +30%）。 2 链：攻击带朱蚀目标伤害 +20%。',
      burstFollowUp: '3 链：共鸣解放伤害加成 +30%。 4 链：彤华 ≥ 60 时暴击 +15%。 5 链：湮灭伤害 +15%。 6 链：重击·缭乱后全队攻击 +20%。'
    }),
    forteDesc: '丹瑾是<b style="color:#a78bff">湮灭副C</b>：核心是<b class="term-resource">朱蚀之刻</b>给目标打 debuff，攻击朱蚀目标享受所有 1/2 链加成。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能挂朱蚀 → 普攻/重击堆攻击层数 → 共鸣解放爆发。'
  },
  '白芷': {
    intro: '冷凝 · 音感仪 · 治疗 · 「念意」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '音感弹', skillName: '应急预案', burstName: '刹那合弥', varName: '覆雪流盈',
      burstMech: '<span style="color:var(--muted)">治疗派生：</span>释放<b class="term-burst">刹那合弥</b>触发<b class="term-skill">频隙回响</b>多段治疗。',
      skillMech: '<span style="color:var(--muted)">资源消耗：</span>消耗<b class="term-resource">念意</b>治疗队友；满 4 点念意时治疗/冷凝加成更高。',
      skillFollowUp: '消耗<b class="term-resource">念意</b>给自身回能量。 1 链：每<b class="term-resource">念意</b>回 2.5 能量。 2 链：满<b class="term-resource">念意</b>时冷凝/治疗 +15%。',
      burstFollowUp: '<b class="term-burst">刹那合弥</b>触发<b class="term-skill">频隙回响</b>。 3 链：变奏后生命上限 +12%。 4 链：<b class="term-skill">频隙回响</b> +2 段 + 治疗 +20%。 5 链：复活倒下队友（每场战斗 1 次）。 6 链：拾取<b class="term-resource">天籁</b>时全队冷凝 +12%。'
    }),
    forteName: '念意',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 治疗循环</span><br>· <b class="term-resource">念意</b> 0-4：普攻积攒，技能消耗念意治疗队友<br>· 满 4 念意时，共鸣技能治疗更强（2 链：冷凝/治疗 +15%）<br>· 释放<b class="term-burst">共鸣解放·刹那合弥</b> → 触发<b class="term-skill">频隙回响</b>多段治疗<br>· 5 链：白芷存活时可复活一次倒下队友<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻积念意 → 共鸣技能治疗 → 能量满放解放持续回血 → 切主 C 输出。'
  },
  '秋水': {
    intro: '气动 · 佩枪 · 副C · 「雾化分身」',
    customLines: makeSkillLines({
      element: '气动',
      normalName: '佩枪射击', skillName: '移位戏法', burstName: '虚幻迷雾', varName: '影舞入场',
      burstMech: '<span style="color:var(--muted)">潜行窗口：</span>释放解放后进入<b class="term-resource">迷雾潜行</b>，期间减伤并获得气动增益（5 链）。',
      skillMech: '<span style="color:var(--muted)">召唤物：</span>施放共鸣技能召唤<b class="term-resource">雾化分身</b>并生成<b class="term-resource">虚实之门</b>；分身会<b class="term-resource">嘲讽</b>目标。',
      skillFollowUp: '生成<b class="term-resource">雾化分身</b><b class="term-resource">嘲讽</b>敌人。 1 链：技能冷却 -1 回合。 2 链：攻击被<b class="term-resource">嘲讽</b>目标时攻击 +15%。 3 链：穿<b class="term-resource">虚实之门</b>额外生成 2 颗子弹。 4 链：共鸣技能·雾化子弹 +30%。',
      burstFollowUp: '5 链：<b class="term-resource">迷雾潜行</b>时气动 +25%。 6 链：解放暴击 +8%；重击穿<b class="term-resource">虚实之门</b> +50%。'
    }),
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 机制说明</span><br>· <b class="term-skill">共鸣技能·移位戏法</b>召唤<b class="term-resource">雾化分身</b>，分身嘲讽目标<br>· <b class="term-resource">虚实之门</b>：普攻/重击穿过门时获得额外子弹/伤害<br>· <b class="term-resource">迷雾潜行</b>：释放解放后进入，期间减伤；5 链气动伤害 +25%<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能召分身 + 虚实之门 → 普攻穿门追加子弹 → 共鸣解放进入迷雾潜行 → 重击穿门爆发。'
  },
  '炽霞': {
    intro: '热熔 · 佩枪 · 副C · 「炽烈焰火」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '咻咻射击', skillName: '咻咻斗意', burstName: '炽烈焰火', varName: '英雄入场',
      skillFollowUp: '1 链：共鸣技能·轰轰必定暴击。 6 链：触发技能·轰轰后全队普攻 +25%。',
      burstFollowUp: '<b class="term-resource">热压弹</b> 60 发持续输出。 2 链：解放期间击败目标回 5 能量。 3 链：解放对低 HP 目标 +40%。 4 链：获 60 弹 + 重置技能 CD。 5 链：<b class="term-resource">加麻加辣</b>满层时攻击 +30%。'
    }),
    forteDesc: '炽霞是<b style="color:#ff8c5e">热熔副C</b>，核心是<b class="term-burst">共鸣解放·炽烈焰火</b>的 60 发热压弹 + 重置技能 CD。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能·轰轰 → 共鸣解放·炽烈焰火 → 60 弹高速输出 → 重置 CD 再放技能。'
  },
  '秧秧': {
    intro: '气动 · 音感仪 · 副C · 「风场」',
    customLines: makeSkillLines({
      element: '气动',
      normalName: '羽箭', skillName: '风场鸣声', heavyName: '空中释羽', burstName: '湛蓝礼赞', varName: '湛蓝入场',
      hasHeavy: true,
      skillFollowUp: '<b class="term-skill">风场鸣声</b><b class="term-resource">牵引</b>敌人。 3 链：共鸣技能 +40%。',
      heavyFollowUp: '<b class="term-heavy">空中释羽</b>是核心输出段。 4 链：<b class="term-heavy">空中释羽</b> +95%。',
      burstFollowUp: '1 链：变奏后气动 +15%。 2 链：重击命中回 10 能量。 5 链：解放·朔风旋涌 +85%。 6 链：<b class="term-heavy">空中释羽</b>后全队攻击 +20%。',
    }),
    forteDesc: '秧秧是<b style="color:var(--green)">气动副C</b>：<b class="term-skill">风场鸣声</b>牵引敌人 + <b class="term-heavy">空中释羽</b>主输出。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能铺风场 → 变奏入场叠气动 buff → 空中重击释羽爆发。'
  },
  '桃祈': {
    intro: '衍射 · 臂铠 · 辅助 · 「磐岩护壁」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '岩拳', skillName: '磐岩护壁', burstName: '不动如山', varName: '盾守入场',
      skillFollowUp: '<b class="term-skill">磐岩护壁</b>给全队护盾。 3 链：磐岩护壁持续延长。 6 链：磐岩护壁期间普攻/重击 +40%。',
      burstFollowUp: '<b class="term-burst">不动如山</b>反击爆发。 1 链：护盾量 +40%。 2 链：解放暴击/暴伤 +20%。 4 链：重击发后制人触发时回血 + 防御 +50%。 5 链：<b class="term-resource">攻防转换</b>命中回 20 能量。'
    }),
    forteDesc: '桃祈是<b style="color:var(--accent)">衍射辅助</b>（护盾型）：<b class="term-skill">磐岩护壁</b>给全队护盾，<b class="term-burst">共鸣解放·不动如山</b>反击爆发。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能上护盾 → 重击发后制人触发反击 → 共鸣解放收尾。'
  },
  '渊武': {
    intro: '导电 · 臂铠 · 辅助 · 「雷之楔」',
    customLines: makeSkillLines({
      element: '导电',
      normalName: '雷拳', skillName: '雷之楔', burstName: '寂土重明', varName: '轰雷入场',
      skillFollowUp: '<b class="term-skill">雷之楔</b>召唤协同武器。 3 链：<b class="term-skill">雷之楔</b>命中按 20% 防御加伤。',
      burstFollowUp: '<b class="term-burst">寂土重明</b>给全队护盾。 1 链：雷厉风行状态攻速 +20%。 2 链：变奏·轰雷回 15 能量。 5 链：<b class="term-skill">雷之楔</b>在场时解放 +50%。 6 链：<b class="term-skill">雷之楔</b>范围内全队防御 +32%。'
    }),
    forteDesc: '渊武是<b style="color:#7bd6ff">导电辅助</b>：<b class="term-skill">雷之楔</b>召唤协同武器，<b class="term-burst">共鸣解放·寂土重明</b>给全队护盾。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏入场积能量 → 共鸣技能召楔 → 共鸣解放给全队护盾。'
  },
  '釉瑚': {
    intro: '冷凝 · 臂铠 · 副C · 「诗中物对偶/联珠」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '匣中拳', skillName: '匣中问祯', burstName: '诗中物·终幕', varName: '酣睡入场',
      skillFollowUp: '靠<b class="term-resource">诗中物</b><b class="term-skill">对偶</b>/<b class="term-skill">联珠</b>/<b class="term-skill">合说</b>叠层。 1 链：技能·问祯有 10% 概率免伤。 2 链：<b class="term-skill">对偶</b>/<b class="term-skill">联珠</b>对诗中物效果二次触发。 4 链：20% 概率技能不进 CD。',
      burstFollowUp: '<b class="term-burst">诗中物·终幕</b>清场。 3 链：攻击 +20%。 5 链：变奏·遂心匣后暴击 +15%。 6 链：奇珍赏获<b class="term-resource">霁青</b> 4 层（暴击伤害 +60%）。'
    }),
    forteDesc: '釉瑚是<b style="color:#7bd6ff">冷凝副C</b>：靠<b class="term-resource">诗中物</b>的对偶/联珠/合说叠层放大伤害。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能·匣中问祯起手 → 普攻补段叠层 → 共鸣解放爆发。'
  },
  '灯灯': {
    intro: '衍射 · 臂铠 · 副C · 「啾啾专送」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '快递投掷', skillName: '强化·前扑', burstName: '啾啾专送', varName: '派送入场',
      skillFollowUp: '<b class="term-skill">强化·前扑/后撤</b>无视防御。 1 链：<b class="term-skill">强化·后撤</b>回耐力。 2 链：<b class="term-skill">强化·前扑</b>/后撤无视 20% 防御。 5 链：光能满时强光穿射倍率 +100%。',
      burstFollowUp: '3 链：共鸣解放·啾啾专送 +30%。 4 链：普攻伤害加成 +30%。 6 链：解放时全队攻击 +20%。'
    }),
    forteDesc: '灯灯是<b style="color:var(--accent)">衍射副C</b>：<b class="term-skill">强化·前扑/后撤</b>无视防御，<b class="term-normal">普攻</b>主输出。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>强化前扑/后撤 → 普攻铺伤害 → 共鸣解放·啾啾专送清场。'
  },

  '吟霖': {
    intro: '导电 · 音感仪 · 副C · 「审判印记」标记型副C',
    // 文案=具体数值，tooltip=计算公式
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;
      const energyMax = stats.maxEnergy || 125;

      // ===== 共鸣链相关参数 =====
      const markSkillMult = chain >= 1 ? 1.7 : 1.0;        // 1 链：技能/解放对印记 ×1.7
      const markBurstMult = chain >= 5 ? 1.5 : 1.0;        // 5 链：解放对印记额外 ×1.5（B-Tier 下调，原 ×2.0）
      const markVulnPerStack = chain >= 3 ? 0.10 : 0;      // 3 链：印记每层 +10%（B-Tier 下调，原 +15%）
      const teamAtkOnTrigger = chain >= 4 ? 0.15 : 0;      // 4 链：审判之雷触发时全队 atk +15%（B-Tier 下调，原 +20%）
      const jiTingMult = chain >= 6 ? 0.7 : 0;             // 6 链：疾霆昭彰 atk×70%（B-Tier 下调，原 ×100%）

      // ===== 真实伤害数（命中前结算，命中印记目标的总倍率）=====
      const normalDmg = Math.round(atk * 1.0);
      const skillDmg  = Math.round(atk * 1.8);
      const burstMainDmg = Math.round(atk * 4.0);
      const burstSideDmg = Math.round(atk * 2.0);
      // 对印记目标的额外加成：debuffBonus × 1链(技能/解放) × 5链(解放) × 3链每层
      const maxStacks = 3;
      const vulnFull = 1 + markVulnPerStack * maxStacks;   // 满 3 层易伤总倍率
      const markedSkillDmg = chain >= 1 ? Math.round(skillDmg * markSkillMult * vulnFull) : skillDmg;
      const markedBurstMain = Math.round(burstMainDmg * markSkillMult * markBurstMult * vulnFull);
      const jiTingDmg = chain >= 6 ? Math.round(atk * jiTingMult * markSkillMult) : 0;
      const varDmg = Math.round(atk * 0.8);
      const varConcerto = Math.round(atk * 1.6);

      // ===== 公式 tooltips =====
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100% = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">命中印记目标额外 +${(markVulnPerStack*100).toFixed(0)}%/层（3 链）；解放后窗口期内额外触发疾霆昭彰（6 链）</span>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `· 普通目标：攻击 <b>${atk}</b> × 180% = <b style="color:var(--accent)">${skillDmg}</b><br>` +
        (chain >= 1 ? `· 印记目标：${skillDmg} × <b style="color:var(--gold)">1.7</b>${markVulnPerStack>0?` × (1 + ${(markVulnPerStack*100).toFixed(0)}%×层)`:''} = <b style="color:var(--accent)">${markedSkillDmg}</b>（满 3 层）` : '') +
        `<br>命中后回复 22 能量、+30 审判值`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 400% = ${burstMainDmg}<br>` +
        `· 副目标：攻击 <b>${atk}</b> × 200% = ${burstSideDmg}<br>` +
        (chain >= 1 ? `· 主目标对印记叠满：${burstMainDmg} × <b style="color:var(--gold)">1.7</b>${chain>=5?` × <b style="color:var(--gold)">${markBurstMult.toFixed(1)}</b>`:''}${markVulnPerStack>0?` × <b style="color:var(--gold)">${vulnFull.toFixed(2)}</b>`:''} = <b style="color:#ff8c5e">${markedBurstMain}</b>`:``)
      );
      const jiTingTip = chain >= 6 ? tipAttr(
        `<b style="color:var(--gold)">疾霆昭彰公式</b>（共鸣链 6）<br>` +
        `= 攻击 <b>${atk}</b> × ${(jiTingMult*100).toFixed(0)}%${markVulnPerStack>0?` × 1.7（1 链 × 印记目标）`:''} = <b style="color:var(--accent)">${jiTingDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">解放后 2 回合内，普攻命中印记目标额外触发（每回合 1 次）</span>`
      ) : '';
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `· 普通：攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满：攻击 <b>${atk}</b> × 160% = <b style="color:var(--accent)">${varConcerto}</b>`
      );

      // 共鸣链激活的额外效果摘要
      const chainExtras = [
        chain >= 2 ? `命中印记目标额外 +<b>5</b> 审判 / +<b>5</b> 能量（共鸣链 2）` : '',
        chain >= 4 ? `审判之雷触发时全队攻击 +<b>${(teamAtkOnTrigger*100).toFixed(0)}%</b>（2 回合 · 共鸣链 4）` : ''
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
    forteDesc: '吟霖不依赖普通的破阵/技能循环，而是<b class="term-resource">审判值</b>（0-100）：<b class="term-normal">普攻</b> +<b>15</b> / <b class="term-skill">共鸣技能</b> +<b>30</b>。<br>满 <b>100</b> 自动触发<b class="term-resource">审判之雷</b>：给当前主目标挂 <b>1</b> 层<b class="term-resource">审判印记</b>（持续 3 回合，最高 3 层）。<br><br><b class="term-resource">审判印记</b>是吟霖的真正价值 —— <b>全队</b>对印记目标输出时享受加成（3 链 +15%/层 易伤；吟霖自己技能/解放 1 链 ×1.7、5 链 ×2.0）。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>开场普攻/技能堆审判 → 满 100 标记主目标 → 切到主 C 让队友打印记目标 → 能量满放解放给主目标补印记 + 全队 atk buff。'
  },

  // ═══════════════════════════════════════════════════════════════
  // 2.3+ & 3.0+ 新增角色 · 工厂版 SKILL_HINTS
  // ═══════════════════════════════════════════════════════════════

  // 2.3 · 赞妮（主C 衍射 臂铠）— 光噪效应·灼焰形态·重斩连段
  '赞妮': {
    intro: '衍射 · 臂铠 · 主C · 灼焰形态重斩连段',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '衍射', hasHeavy: true,
      normalName: '黯夜将明',
      skillName: '标准防卫预案 / 引燃明灯',
      burstName: '终绝将至之刻',
      heavyName: '重斩·破晓/将明/终夜/闪裂',
      varName: '即刻执行',
      forteName: '焰光',
      skillMech: '【焰光】≥30 时替换为引燃明灯；按住进入准备架势可闪反击发重斩。',
      burstMech: '处于灼焰形态时解锁重斩系列；【烈阳余烬】每层持续 2 回合。',
      heavyMech: '重斩·终夜消耗至多 40 焰光，每点放大倍率。',
      heavyFollowUp: '6 链：重斩倍率 +40%；焰光≤70 时立刻回满（每场 1 次）。'
    }),
    forteName: '焰光',
    forteDesc: '赞妮的核心资源 <b class="term-resource">焰光</b>（0-100/灼焰时 150）：<br>· 层数上限 60 层<b class="term-resource">【烈阳余烬】</b>，转化时每层得 5 焰光。<br>· <b class="term-skill">集中压制/破袭反击</b>得 10 焰光。<br>· <b class="term-burst">共鸣解放·重燃</b>得 50 焰光。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>叠光噪→转化烈阳余烬积焰光→进灼焰形态→重斩连段爆发。'
  },

  // 2.3 · 夏空（辅助 气动 佩枪）— 合奏音影·风蚀效应
  '夏空': {
    intro: '气动 · 佩枪 · 辅助 · 风蚀效应·合奏音影',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '气动', hasHeavy: false,
      normalName: '四拍的舞曲 / 音律独奏',
      skillName: '谐律速奏',
      burstName: '歌者的三重华彩',
      varName: '诗与乐的交响',
      forteName: '音律',
      normalMech: '普攻第 4 段附加<b class="term-resource">风蚀效应</b>并进入<b class="term-resource">音律独奏</b>，全队气动伤害 +24%。',
      burstMech: '持续期间全队气动伤害加成提升。',
      skillFollowUp: '2 链：解放持续期间全队气动伤害 +40%。'
    }),
    forteName: '音律',
    forteDesc: '夏空通过普攻 / 技能积攒<b class="term-resource">音律</b>（0-6 格）。<br>· 普攻第 4 段、共鸣技能各得 1 格。<br>· 满 6 格进入<b class="term-resource">音律独奏</b>，全队气动伤害 +24%。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能攒音律 → 满 6 格进独奏 → 切主 C 爆发。'
  },

  // 2.4 · 露帕（副C 热熔 长刃）— 狼焰·荣光·追猎
  '露帕': {
    intro: '热熔 · 长刃 · 副C · 狼焰·荣光·追猎',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '热熔', hasHeavy: true,
      normalName: '爪击',
      skillName: '凶噬',
      burstName: '荣光欢酣于火',
      heavyName: '狼咬 / 锐爪',
      varName: '你无法逃离！',
      forteName: '狼焰',
      burstMech: '施放后获得荣光效果，全队热熔收益提升。',
      heavyMech: '狼舞的决意·极免疫打断。',
      heavyFollowUp: '6 链：狼舞/解放/变奏无视 30% 防御。'
    }),
    forteName: '狼焰',
    forteDesc: '露帕的核心资源 <b class="term-resource">狼焰</b>（0-100）：<br>· <b class="term-skill">凶噬</b>命中 +15，<b class="term-normal">重击·狼咬</b> +20。<br>· 满 100 进入<b class="term-resource">追猎</b>状态，全队热熔伤害提升。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>技能/重击攒狼焰 → 满 100 进追猎 → 解放启动荣光 → 切主 C 输出。'
  },

  // 2.5 · 弗洛洛（主C 湮灭 音感仪）— 乐声·指挥·赫卡忒
  '弗洛洛': {
    intro: '湮灭 · 音感仪 · 主C · 「乐声 · 谱曲终末 · 赫卡忒」',
    hasHeavy: false,
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;

      // 共鸣链参数
      const skillDmgMult = 1 + (chain >= 1 ? 0.80 : 0) + (chain >= 3 ? 0.40 : 0);
      const burstMult = 1 + (chain >= 2 ? 0.75 : 0);
      const elemDmgBonus = chain >= 6 ? 0.60 : 0;
      const allDmgBonus = chain >= 5 ? 0.15 : 0;
      const totalMult = 1 + (chain >= 4 ? 0.20 : 0);

      // 伤害计算
      const normalDmg = Math.round(atk * 1.0 * (1 + allDmgBonus));
      const skillDmg  = Math.round(atk * 1.8 * skillDmgMult * totalMult);
      const burstMain = Math.round(atk * 4.5 * burstMult * totalMult);
      const burstSide = Math.round(atk * 2.25 * burstMult * totalMult);
      const varDmg    = Math.round(atk * 0.8 * (1 + allDmgBonus));
      const varConcerto = Math.round(atk * 1.6 * (1 + allDmgBonus));

      // 谱曲终末（替代重击的核心招式）
      const scoreFinal = Math.round(atk * 4.0 * skillDmgMult);    // 消耗 6 乐声 + 余响层数

      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100%${allDmgBonus>0?` × (1 + ${(allDmgBonus*100).toFixed(0)}%)`:''} = <b style="color:var(--text)">${normalDmg}</b>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 180%${skillDmgMult>1?` × 链增伤 ${skillDmgMult.toFixed(2)}`:''} = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const scoreFinalTip = tipAttr(
        `<b style="color:var(--gold)">谱曲终末伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 400%（基础）${skillDmgMult>1?` × 链增伤 ${skillDmgMult.toFixed(2)}`:''}<br>` +
        `+ 每层<b class="term-resource">余响</b>额外倍率<br>` +
        `触发条件：6 枚<b class="term-resource">乐声</b> + 谱曲激活 + 非定音状态`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式（谱曲终末）</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 450%${burstMult>1?` × 链增伤 ${burstMult.toFixed(2)}`:''} = <b style="color:#ff8c5e">${burstMain}</b><br>` +
        `· 副目标：攻击 <b>${atk}</b> × 225%${burstMult>1?` × 链增伤 ${burstMult.toFixed(2)}`:''} = <b style="color:#ff8c5e">${burstSide}</b>`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满：× 160% = <b style="color:var(--accent)">${varConcerto}</b>`
      );

      let chainHints = '';
      const parts = [];
      if (chain >= 1) parts.push(`<span style="color:var(--gold)">[1链]</span> 亡与死的乐章/梦呓伤害倍率 +80%`);
      if (chain >= 2) parts.push(`<span style="color:var(--gold)">[2链]</span> 谱曲终末伤害倍率 +75%`);
      if (chain >= 3) parts.push(`<span style="color:var(--gold)">[3链]</span> 声骸技能伤害加深 80%`);
      if (chain >= 4) parts.push(`<span style="color:var(--gold)">[4链]</span> 声骸技能时全队全属性伤害 +20%`);
      if (chain >= 5) parts.push(`<span style="color:var(--gold)">[5链]</span> 指挥状态减伤 30%`);
      if (chain >= 6) parts.push(`<span style="color:var(--gold)">[6链]</span> 指挥状态湮灭伤害 +60%`);
      if (parts.length) chainHints = '<br><span style="color:var(--muted);font-size:10px">·</span> ' + parts.join('<br><span style="color:var(--muted);font-size:10px">·</span> ');

      return [
        {
          icon: '⚔', name: '普攻 · 生与死的乐章', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">湮灭伤害</b>，命中后回复 12 能量、+8 协奏。<br>第 3 段进入<b class="term-resource">重世状态</b>。`
        },
        {
          icon: '✦', name: '共鸣技能 · 亡与死的乐章 / 永不消逝的梦呓', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">湮灭伤害</b>，命中后回复 22 能量、获取 <b>1</b> 枚<b class="term-resource">乐声</b>。${chain>=1?`<br><span style="color:var(--gold)">[1链]</span> 伤害倍率 +80%。`:''}`
        },
        {
          icon: '🎼', name: '谱曲终末（核心）', cost: '1 AP · 需 6 乐声 + 谱曲激活',
          color: '#ff6b9d',
          desc: `<span class="tip" data-tip='${scoreFinalTip}'><b style="color:#ff6b9d">${scoreFinal}</b> 点</span><b class="term-skill">湮灭伤害</b>（视为共鸣技能伤害 + 声骸技能）。<br>消耗 6 枚<b class="term-resource">乐声</b> + 激活<b class="term-resource">谱曲</b>（每 25 秒可激活 1 次），每层<b class="term-resource">余响</b>额外增伤。<br>施放后进入<b class="term-resource">定音</b>状态，谱曲进入冷却。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 谱曲终末', cost: `3 AP · 需共鸣能量满 ${stats.maxEnergy || 125}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstMain}</b> 点</span>、副目标 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSide}</b> 点</span><b class="term-burst">湮灭伤害</b>。<br>获得<b class="term-resource">余响</b>层数，强化下次谱曲终末。${chain>=2?`<br><span style="color:var(--gold)">[2链]</span> 伤害倍率 +75%。`:''}${chainHints}`
        },
        {
          icon: '🎵', name: '变奏技能 · 指挥入场', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">湮灭伤害</b>。`
        }
      ];
    },
    forteName: '乐声 / 余响',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 资源系统</span><br>· <b class="term-resource">乐声</b>（0-6 枚）：普攻/技能积累，集齐 6 枚可施放<b class="term-resource">谱曲终末</b><br>· <b class="term-resource">谱曲</b>（每 25 秒激活 1 次）：谱曲终末的激活条件之一<br>· <b class="term-resource">余响</b>（0-∞）：解放后获得，每层增加谱曲终末倍率<br>· <b class="term-resource">定音</b>：施放谱曲终末后进入，此时无法再次施放<br><br><span style="color:var(--gold);font-size:11px">▸ 指挥状态 · 赫卡忒</span><br>· 谱曲终末后进入<b class="term-resource">指挥状态</b>，可召唤赫卡忒协同攻击（6 链：湮灭伤害 +60%）<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能攒 6 乐声 → 激活谱曲 → 谱曲终末（消耗乐声 + 余响爆发）→ 共鸣解放获得余响 → 循环。'
  },

  // 2.6 · 奥古斯塔（主C 导电 长刃）— 以众愿为冕
  '奥古斯塔': {
    intro: '导电 · 长刃 · 主C · 以众愿为冕·暴击转化',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '导电', hasHeavy: true,
      normalName: '烁雷连斩',
      skillName: '不败恒阳',
      burstName: '赫日威临',
      heavyName: '烁雷·旋切 / 升拳',
      varName: '灼金的巡行',
      forteName: '众愿',
      heavyMech: '施放后获得【以众愿为冕】层数，提升暴击/暴伤。',
      skillFollowUp: '1 链：【以众愿为冕】暴击伤害 +15%/层，上限 2 层。<br>2 链：每层暴击 +20%，溢出暴击→暴伤转化。'
    }),
    forteName: '以众愿为冕',
    forteDesc: '奥古斯塔的核心增伤状态 <b class="term-resource">【以众愿为冕】</b>：<br>· 变奏/重击/技能可获得层数。<br>· 每层提升暴击与暴击伤害。<br>· 溢出暴击按比例转化为暴击伤害。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>叠冕层 → 满层解放爆发 → 重击旋切输出。'
  },

  // 2.6 · 尤诺（主C 冷凝 臂铠）— 月相流转·满月领域
  '尤诺': {
    intro: '冷凝 · 臂铠 · 主C · 月相流转·满月领域',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '冷凝', hasHeavy: true,
      normalName: '月弓·普攻',
      skillName: '越限的弦引',
      burstName: '满月领域',
      heavyName: '至臻的完满',
      varName: '月相入场',
      forteName: '灵性',
      normalMech: '月相流转状态下攻击获得强化。',
      heavyMech: '至臻的完满是尤诺的终极终结技。',
      skillFollowUp: '6 链：至臻完满倍率 +1600%，施放后重置月相流转。'
    }),
    forteName: '灵性',
    forteDesc: '尤诺通过战斗积累<b class="term-resource">灵性</b>，满 100 进入<b class="term-resource">月相流转</b>状态。<br>· 月相流转中攻击力 +40%（1 链）。<br>· 满月领域持续期间自身共鸣能量持续回复。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能攒灵性 → 月相流转 → 重击至臻完满爆发。'
  },

  // 2.7 · 仇远（主C 气动 迅刀）— 淋漓醉墨·竹照
  '仇远': {
    intro: '气动 · 迅刀 · 主C · 淋漓醉墨·且从容',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '气动', hasHeavy: false,
      normalName: '答剑',
      skillName: '弦歌不缀 / 割股之心 / 忠烈死节',
      burstName: '万钧一断',
      varName: '剑客入场',
      forteName: '挑灯问剑',
      normalMech: '普攻替换为答剑系列，第三段可衔接技能。',
      skillFollowUp: '3 链：解放倍率 +500%；额外施放荷蓑出林。<br>6 链：荷蓑出林时暴击伤害 +100%。'
    }),
    forteName: '挑灯问剑',
    forteDesc: '仇远通过答剑系列积累<b class="term-resource">【挑灯问剑】</b>值。<br>· 满值进入<b class="term-resource">淋漓醉墨</b>状态。<br>· 醉墨状态下答剑连段强化，且从容效果提升伤害。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>答剑连段攒值 → 淋漓醉墨 → 解放万钧一断终结。'
  },

  // 2.8 · 千咲（主C 湮灭 长刃）— 虚无绞痕·电锯模式
  '千咲': {
    intro: '湮灭 · 长刃 · 主C · 虚无绞痕·电锯模式',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '湮灭', hasHeavy: false,
      normalName: '锯环·疾攻 / 锯环·终结',
      skillName: '命弦·掠行',
      burstName: '即刻·归无',
      varName: '暗影入场',
      forteName: '锯环残响',
      normalMech: '电锯模式期间攻击替换为锯环系列。',
      skillFollowUp: '1 链：附加虚无绞痕时攻击 +30%。<br>6 链：虚无绞痕·终焉：目标受千咲伤害 +40%。'
    }),
    forteName: '锯环残响',
    forteDesc: '千咲的核心资源 <b class="term-resource">锯环残响</b>：<br>· 普攻/技能积累残响。<br>· 满值可施放<b class="term-resource">虚无绞痕</b>，使目标受到伤害加深。<br>· 电锯模式中锯环系列技能获得强化。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻攒锯环 → 挂虚无绞痕 → 解放归无爆发。'
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
      const skillDmg   = Math.round(effectiveAtk * 2.0 * skillMult * allDmgMult);
      const heavyDmg   = Math.round(effectiveAtk * 2.5 * flowCdmg * allDmgMult);
      const burstMain  = Math.round(effectiveAtk * 4.0 * burstMult * allDmgMult);
      const burstSide  = Math.round(effectiveAtk * 2.0 * burstMult * allDmgMult);
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
        `= 攻击 <b>${effectiveAtk}</b> × 250%${flowCdmg>1?` × 心之彩 ${flowCdmg.toFixed(2)}`:''} = <b style="color:#ff8c5e">${heavyDmg}</b>`
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
        `· 主目标：攻击 <b>${effectiveAtk}</b> × 400%${burstMult>1?` × 链增伤 ${burstMult.toFixed(2)}`:''} = <b style="color:#ff8c5e">${burstMain}</b><br>` +
        `· 副目标：攻击 <b>${effectiveAtk}</b> × 200%${burstMult>1?` × 链增伤 ${burstMult.toFixed(2)}`:''} = <b style="color:#ff8c5e">${burstSide}</b>`
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
          desc: `<span class="tip" data-tip='${chargeTip}'>光学取样阶段满<b class="term-resource">溢彩</b>时按住普攻蓄力</span> → 每 0.2 秒转换 15 溢彩 → 12.5%<b class="term-resource">流光</b>。<br><b class="term-resource">流光</b> ≥ 120 时进入<b style="color:var(--gold)">加色混合</b>爆发状态，绮彩巡游普攻第 1/4 段追击能力提升。`
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
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 资源系统</span><br>· <b class="term-resource">溢彩</b>（0-100）：战斗积累，光学取样阶段非战斗回复<br>· <b class="term-resource">流光</b>（0-120）：蓄力将溢彩转换为流光<br>· <b class="term-resource">加色混合</b>（流光 ≥ 120）：进入爆发状态，普攻/重击强化<br><br><span style="color:var(--gold);font-size:11px">▸ 绮彩巡游</span><br>· 进入后普攻替换为轮滑射击（最多 5 段）<br>· <b class="term-heavy">空中重击</b>：绮彩巡游期间核心输出段<br>· 流光 ≥ 120 时第 1/4 段追击能力提升<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能攒溢彩 → 光学取样蓄力转流光 → 流光 ≥ 120 进加色混合 → 绮彩巡游空中重击连段 → 解放爆炸喷涂终结。'
  },

  // 3.0 · 莫宁（主C 冷凝 迅刀）— 干涉标记·谐振场
  '莫宁': {
    intro: '冷凝 · 迅刀 · 主C · 「干涉标记 · 谐振场 · 广域观测」',
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
      const skillDmg   = Math.round(atk * 1.8 * skillMult * allDmgMult);
      const burstMain  = Math.round(atk * 4.5 * totalBurstMult);
      const burstSide  = Math.round(atk * 2.25 * totalBurstMult);
      const varDmg     = Math.round(atk * 0.8 * allDmgMult);
      const varConcerto = Math.round(atk * 1.6 * allDmgMult);

      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100%${allDmgMult>1?` × 干涉标记 ${allDmgMult.toFixed(2)}`:''} = <b style="color:var(--text)">${normalDmg}</b>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式（分布式阵列）</b><br>` +
        `= 攻击 <b>${atk}</b> × 180%${skillMult>1?` × 谐振场 ${skillMult.toFixed(2)}`:''} = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式（临界协议）</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 450%${burstMult1>1?` × 链 5 <b>${burstMult1.toFixed(2)}</b>`:''}${burstMult2>1?` × 链 6 <b>${burstMult2.toFixed(2)}</b>`:''}= <b style="color:#ff8c5e">${burstMain}</b><br>` +
        `· 副目标：攻击 <b>${atk}</b> × 225%${burstMult1>1?` × ${burstMult1.toFixed(2)}`:''}${burstMult2>1?` × ${burstMult2.toFixed(2)}`:''}= <b style="color:#ff8c5e">${burstSide}</b>`
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
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">冷凝伤害</b>，回复 12 能量、+8 协奏。<br>进入<b class="term-resource">广域观测模式</b>后普攻替换为 3 段观测射击。<br><span class="tip" data-tip='${markTip}'>附加<b class="term-resource">干涉标记</b> + <b class="term-resource">观测标记</b></span>（核心增伤 debuff）。`
        },
        {
          icon: '✦', name: '共鸣技能 · 分布式阵列', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">冷凝伤害</b>，回复 22 能量。<br>展开<b class="term-resource">分布式阵列</b>积累<b class="term-resource">相对动能</b>。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 临界协议', cost: `3 AP · 需共鸣能量满 ${energyMax}`,
          color: 'var(--gold)',
          desc: `展开<b class="term-resource">谐振场</b>，对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstMain}</b> 点</span>、副目标 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSide}</b> 点</span><b class="term-burst">冷凝伤害</b>。<br>谐振场持续提升全队偏谐值累积效率。${chainHints}`
        },
        {
          icon: '🎵', name: '变奏技能 · 观测入场', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">冷凝伤害</b>。`
        }
      ];
    },
    forteName: '相对动能 / 谐振场',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 核心资源</span><br>· <b class="term-resource">相对动能</b>（0-100）：普攻/技能积累，满值可触发额外效果<br>· <b class="term-resource">干涉标记</b>：普攻/技能给目标附加，莫宁对干涉目标伤害提升；2 链全队暴伤 +32%<br>· <b class="term-resource">观测标记</b>：广域观测模式下的特殊标记<br><br><span style="color:var(--gold);font-size:11px">▸ 谐振场</span><br>· 共鸣解放展开<b class="term-resource">谐振场</b>，提升全队偏谐值累积效率<br>· 能量上限 <b>175</b>，较普通角色更多（125→175）<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻挂干涉标记 → 广域观测模式射击 → 共鸣技能积累相对动能 → 共鸣解放·临界协议展开谐振场 → 谐振场持续中全队输出。'
  },

  // 3.1 · 爱弥斯（主C 导电 长刃）— 震谐/聚爆双模态
  '爱弥斯': {
    intro: '导电 · 长刃 · 主C · 「震谐/聚爆双模态 · 机兵形态」',
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
      const burstMain  = Math.round(atk * 4.5 * totalBurstMult);
      const burstSide  = Math.round(atk * 2.25 * totalBurstMult);
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
        `· 主目标：攻击 <b>${atk}</b> × 450%${burstMult>1?` × 链 3 <b>${burstMult.toFixed(2)}</b>`:''}${chain6Bonus>0?` × 链 6 <b>${(1+chain6Bonus).toFixed(2)}</b>`:''}= <b style="color:#ff8c5e">${burstMain}</b><br>` +
        `· 副目标：攻击 <b>${atk}</b> × 225%${burstMult>1?` × ${burstMult.toFixed(2)}`:''}${chain6Bonus>0?` × ${(1+chain6Bonus).toFixed(2)}`:''}= <b style="color:#ff8c5e">${burstSide}</b>`
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
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">导电伤害</b>，回复 12 能量、+8 协奏。<br>· <b class="term-resource">震谐</b>模态：普攻带震谐追加伤害<br>· <b class="term-resource">聚爆</b>模态：普攻积累聚爆效应引爆`
        },
        {
          icon: '✦', name: '共鸣技能 · 光翼共奏', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">导电伤害</b>，回复 22 能量。<br>效果取决于当前模态：震谐→追加震谐伤害；聚爆→引爆聚爆效应。`
        },
        {
          icon: '💢', name: '重击 · 蓄力（进入即刻响应）', cost: '1 AP · 蓄力 1-2 段',
          color: '#ff8c5e',
          desc: `<span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavyDmg}</b> 点</span><b class="term-burst">导电伤害</b>（视为共鸣解放伤害）。<br>· 一段蓄力：常规蓄力攻击<br>· 二段蓄力：高伤害（需即刻响应状态快速完成）<br>· <b class="term-resource">即刻响应</b>状态下快速完成二段蓄力，积累<b class="term-resource">同步率</b>。<br>施放后移除即刻响应。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 星辉破界而来', cost: `3 AP · 需共鸣能量满 ${stats.maxEnergy || 125}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstMain}</b> 点</span>、副目标 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSide}</b> 点</span><b class="term-burst">导电伤害</b>。<br>· 震谐模态 → <b>星辉·终结</b>（高倍率单体）<br>· 聚爆模态 → <b>星辉·过载</b>（范围引爆）${chainHints}`
        },
        {
          icon: '🎵', name: '变奏技能 · 以旋律穿越长空', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">导电伤害</b>。`
        }
      ];
    },
    forteName: '同步率 / 模态',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 双模态系统</span><br>· <b style="color:var(--text)">震谐模态</b>：追加额外震谐伤害，适合持续单体输出<br>· <b style="color:var(--accent)">聚爆模态</b>：引爆聚爆效应，适合范围爆发<br>· 通过<b class="term-skill">光翼共奏</b>切换模态<br><br><span style="color:var(--gold);font-size:11px">▸ 核心资源</span><br>· <b class="term-resource">同步率</b>（0-100）：重击蓄力（即刻响应）积累，满值增强技能<br>· <b class="term-resource">即刻响应</b>：重击蓄力进入，快速完成二段蓄力<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>选择模态 → 重击蓄力进即刻响应 → 光翼共奏（模态对应效果）→ 共鸣解放·星辉破界而来（终结/过载）→ 循环。'
  },

  // 3.1 · 陆·赫斯（辅助 冷凝 臂铠）— 黄金的裁量·谐度破坏
  '陆·赫斯': {
    intro: '冷凝 · 臂铠 · 辅助 · 黄金的裁量·谐度破坏',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '冷凝', hasHeavy: false,
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
    forteDesc: '陆·赫斯的核心机制 <b class="term-resource">谐度破坏</b>：<br>· 攻击附加集谐·干涉层数。<br>· 谐度破坏增幅提升全队伤害。<br>· <b class="term-resource">黄金的裁量</b>状态大幅强化空中攻击和斩杀日冕。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>挂谐度破坏 → 进黄金的裁量 → 空中攻击连段 + 解放。'
  },

  // 3.2 · 西格莉卡（主C 衍射 音感仪）— 语义·凝语·天赋
  '西格莉卡': {
    intro: '衍射 · 音感仪 · 主C · 语义·凝语·天赋',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '衍射', hasHeavy: false,
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
    forteDesc: '西格莉卡通过普攻/技能积累<b class="term-resource">凝语</b>层数。<br>· <b class="term-resource">「天赋？」</b>层数上限 3→4（1 链），全面提升符语系列伤害。<br>· 超过 4 秒非战斗获得专注状态。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能攒凝语和天赋？→ 叠满后解放爆发。'
  },

  // 3.3 · 绯雪（主C 冷凝 迅刀）— 预求身·居合·霜渐效应
  '绯雪': {
    intro: '冷凝 · 迅刀 · 主C · 预求身·居合·霜渐',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '冷凝', hasHeavy: false,
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
    forteDesc: '绯雪的<b class="term-resource">锻雪·归刃</b>是非战斗回复机制：<br>· 脱离战斗 4 秒后回复 3 点锻雪。<br>· <b class="term-resource">雪锈</b>层数提升霜渐效应附加效率。<br>· 2 层雪锈时霜渐额外倍率 +488%。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻连段 → 居合追击 → 触发霜渐 → 解放归刃终结。'
  },

  // 3.3 · 达妮娅（主C 热熔 佩枪）— 布景/幻灭双形态·黯核
  '达妮娅': {
    intro: '热熔 · 佩枪 · 主C · 布景/幻灭双形态·黯核',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '热熔', hasHeavy: false,
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
    forteDesc: '达妮娅的核心资源 <b class="term-resource">黯核</b>（上限 3）和<b class="term-resource">虚质粒子</b>：<br>· 布景形态远程消耗黯核输出。<br>· 幻灭形态近战消耗虚质粒子。<br>· 进入战斗时黯核与虚质粒子回满。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>选择形态 → 消耗黯核/粒子输出 → 进熵变强化 → 解放终结。'
  },

  // 3.4 · 露西（主C 衍射 佩枪）— 欺骗程式·骇破
  '露西': {
    intro: '衍射 · 佩枪 · 主C · 欺骗程式·骇破·赛博朋克',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '衍射', hasHeavy: true,
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
    forteDesc: '露西通过技能积累<b class="term-resource">Ram</b>点数（初始 0，上限 32+6 链）：<br>· 欺骗程式·义体故障/突破协议/运动失能/武装故障/赛博精神病。<br>· 击败带欺骗程式的目标可记录并激活快捷响应。<br>· 骇破响应·数据崩解触发停滞效果。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>附加欺骗程式 → 积累 Ram → 解放覆写 → 骇破触发。'
  },

  // 3.4 · 丽贝卡（副C 导电 佩枪）— 街头直觉·手感火热
  '丽贝卡': {
    intro: '导电 · 佩枪 · 副C · 猎手/铁胆双形态',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '导电', hasHeavy: true,
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
    forteDesc: '丽贝卡通过战斗积累<b class="term-resource">手感火热</b>/<b class="term-resource">狂热</b>：<br>· 获得<b class="term-resource">街头直觉</b>层数提升闪避和输出。<br>· 战术闪避消耗街头直觉回复耐力。<br>· 狂热满值可进入爆发状态。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻攒手感火热 → 叠街头直觉 → 战术闪避 → 解放爆发。'
  },

  // 3.4 · 洛瑟菈（副C 湮灭 音感仪）— 追忆·聚焦·照片
  '洛瑟菈': {
    intro: '湮灭 · 音感仪 · 副C · 追忆·聚焦·照片',
    hasHeavy: false,
    customLines: makeSkillLines({
      element: '湮灭', hasHeavy: false,
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
    forteDesc: '洛瑟菈的核心资源 <b class="term-resource">印象</b>（0-150）和<b class="term-resource">照片</b>：<br>· 追忆状态期间消耗<b class="term-resource">照片</b>强化断舍离。<br>· 每消耗 1 张照片获得 1 层<b class="term-resource">铭记</b>（上限 3 层）。<br>· 击败目标获得怀恋——非战斗时回复印象。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>聚焦 → 进追忆 → 消耗照片叠铭记 → 断舍离终结。'
  },
};