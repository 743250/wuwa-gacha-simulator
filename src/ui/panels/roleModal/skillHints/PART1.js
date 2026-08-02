// 自动切分 · 角色技能文案 1/5（忌炎 ~ 菲比）
import { makeSkillLines } from '../skillLines.js';
import { ACTION_MULTIPLIER } from '../../../../battle/balance.js';

export const PART1 = {
  '忌炎': {
    intro: '气动 · 长刃 · 主C · 「锐意之势」爆发解放机',
    hasHeavy: true,  // 重击积锐意，必须保留
    // 文案=具体数值，tooltip=计算公式
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;

      // ===== 共鸣链相关参数 =====
      const skillCharges = chain >= 1 ? 2 : 1;
      const skillCd = 3; // 单层回复间隔；1 链双充能可连放
      const ruiyiCap = chain >= 6 ? 3 : 2;
      const perStack = chain >= 6 ? 1.2 : 0.4;
      const fullMult = 1 + ruiyiCap * perStack;            // 满锐意：0链×1.8 / 6链×4.6
      const tongbianAtk = chain >= 2 ? 0.28 : 0;
      const mingduanAtk = chain >= 5 ? 0.45 : 0;
      const totalAtkUp = tongbianAtk + mingduanAtk;

      // ===== 真实伤害数（文档校准：普攻220/技能240/重击440/后动715）=====
      const normalDmg = Math.round(atk * 2.2);
      const normalEnh = Math.round(atk * 3.2);
      const skillDmg  = Math.round(atk * 2.4);
      const heavyDmg  = Math.round(atk * 4.4);
      const burstZero = Math.round(atk * 7.15);                      // 0 锐意后动（主目标）
      const burstOne  = Math.round(atk * 7.15 * (1 + perStack));     // 1 锐意
      const burstFull = Math.round(atk * 7.15 * fullMult);           // 满锐意
      const burstSide = Math.round(atk * 3.58);                      // 副目标基础
      const burstSideFull = Math.round(atk * 3.58 * fullMult);
      const varDmg    = Math.round(atk * 2.0);
      const varStrong = Math.round(atk * 4.0);                       // 协奏满变奏 400%

      // ===== 公式 tooltips =====
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 220% = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `破阵强化：× 320% = <b style="color:var(--gold)">${normalEnh}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">命中前结算，最终伤害受暴击/抗性/防御影响</span>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 240% = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const heavyTip = tipAttr(
        `<b style="color:var(--gold)">重击伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 440% = <b style="color:#ff8c5e">${heavyDmg}</b>`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放 · 后动公式</b><br>` +
        `· 主目标基础 = 攻击 <b>${atk}</b> × 715% = ${burstZero}<br>` +
        `· 副目标基础 = 攻击 <b>${atk}</b> × 358% = ${burstSide}<br>` +
        `· 锐意每层 +${(perStack*100).toFixed(0)}%${chain>=6?'（共鸣链 6 由 +40% 提升至 +120%）':'（0–5 链）'}<br>` +
        `· 0 锐意：主 ${burstZero} / 副 ${burstSide}<br>` +
        `· 1 锐意：主 ${burstOne}<br>` +
        `· ${ruiyiCap} 锐意（满层）：主 <b style="color:#ff8c5e">${burstFull}</b> / 副 <b style="color:#ff8c5e">${burstSideFull}</b>`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `· 普通：攻击 <b>${atk}</b> × 200% = ${varDmg}<br>` +
        `· 协奏满：攻击 <b>${atk}</b> × 400% = <b style="color:var(--accent)">${varStrong}</b>`
      );

      // 共鸣链激活效果（写真实数值，不写"激活提示"）
      let chainHints = '';
      if (chain >= 2 || chain >= 5) {
        const detail = [
          chain >= 2 ? `· 共鸣链 2「通变」：破阵 +30、攻击 +28%（2 回合）` : '',
          chain >= 5 ? `· 共鸣链 5「明断」：攻击 +45%（2 回合）` : '',
          chain >= 5 ? `· 合计攻击 ${atk}，提升至 <b style="color:#ff8c5e">${Math.round(atk*(1+totalAtkUp))}</b>` : ''
        ].filter(Boolean).join('<br>');
        const varBuffTip = tipAttr(`<b style="color:var(--gold)">变奏入场加成</b><br>${detail}`);
        chainHints = `<br>切换上场时还会触发 <span class="tip" data-tip='${varBuffTip}'>共鸣链入场效果（攻击 +${(totalAtkUp*100).toFixed(0)}%）</span>`;
      }

      return [
        {
          icon: '⚔', name: '普攻 · 孤枪止戈', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">气动伤害</b>，命中后回复 12 共鸣能量、积累 8 协奏值。<br>积满<b class="term-resource">破阵值</b>时，下次普攻强化为 <b style="color:var(--gold)">320%</b> 气动伤害。`
        },
        {
          icon: '✦', name: '共鸣技能 · 枪扫风定', cost: chain >= 1 ? `1 AP · 充能 ${skillCharges} 层 · 回复 ${skillCd} 回合` : `1 AP · 冷却 ${skillCd} 回合`,
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">气动伤害</b>，命中后回复 22 能量、+18 协奏。<br>获得 <b style="color:var(--gold)">1 层</b><b class="term-resource">锐意之势</b>${chain>=1?`。<br>共鸣链 1 · 济世：充能上限 <b>${skillCharges}</b> 层，可连续施放两次` : ''}。`
        },
        {
          icon: '💢', name: '重击 · 破阵之枪', cost: '2 AP · 冷却 1 回合',
          color: '#ff8c5e',
          desc: `对目标造成 <span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavyDmg}</b> 点</span><b class="term-heavy">气动伤害</b>，命中后回复 15 能量、+14 协奏。<br>获得 <b style="color:var(--gold)">1 层</b><b class="term-resource">锐意之势</b>。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 苍躣八荒·谋定', cost: `3 AP · 需共鸣能量满 ${stats.maxEnergy}`,
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
    forteDesc: '<b class="term-resource">破阵值</b>（0-100）由普攻 +12 / 技能 +25 / 解放 +40 积累，满后下次<b class="term-normal">普攻</b>强化为攻击力 <b style="color:var(--gold)">320%</b> 气动伤害。<br><br>真正的核心是<b class="term-resource">锐意之势</b>—— <b class="term-heavy">重击</b> / <b class="term-skill">共鸣技能</b> / <b class="term-variation">变奏入场</b> 每次 +1 层，<b class="term-burst">共鸣解放</b>消耗全部层数放大终结伤害。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>切人入场（积 1 锐意并提升攻击），共鸣技能（2 锐意），重击（满 3 锐意 / 6 链），共鸣解放清场。'
  },
  '今汐': {
    intro: '衍射 · 长刃 · 主C · 「韶光」',
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;
      const energyMax = stats.maxEnergy || 125;
      const skillBonus = role.skillBonus || 0; // C1 +0.8
      const burstBonus = role.burstBonus || 0; // C5 +1.2
      // 惊龙 = skillMult 1.6 × effectMult 3.0（C6 FORTE_BOOST → 3.4）
      const forteMult = 3.0 + (chain >= 6 ? 0.4 : 0);
      const skillBaseMult = 1.6;
      const jingAbsMult = skillBaseMult * forteMult;
      const normalDmg = Math.round(atk * 1.1);
      const skillBase = Math.round(atk * skillBaseMult * (1 + skillBonus));
      const jingDmg = Math.round(atk * jingAbsMult * (1 + skillBonus));
      const heavyDmg = Math.round(atk * 4.0);
      const burstMain = Math.round(atk * 10.0 * (1 + burstBonus));
      const burstSide = Math.round(atk * 5.0 * (1 + burstBonus));
      const varDmg = Math.round(atk * 1.6);
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能</b><br>` +
        `· 流光夕影：攻击 <b>${atk}</b> × 160%${skillBonus ? ` × (1+${(skillBonus * 100).toFixed(0)}%)` : ''} = <b>${skillBase}</b><br>` +
        `· 惊龙破空（满 4 层韶光）：160% × <b>${forteMult.toFixed(1)}</b>${skillBonus ? ` × (1+${(skillBonus * 100).toFixed(0)}%)` : ''} = <b style="color:var(--accent)">${jingDmg}</b>`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放 · 移岁诛邪</b><br>` +
        `主目标：攻击 <b>${atk}</b> × 1000%${burstBonus ? ` × (1+${(burstBonus * 100).toFixed(0)}%)` : ''} = <b>${burstMain}</b><br>` +
        `副目标：攻击 <b>${atk}</b> × 500%${burstBonus ? ` × (1+${(burstBonus * 100).toFixed(0)}%)` : ''} = <b>${burstSide}</b>`
      );
      return [
        {
          icon: '⚔', name: '普攻 · 浮光霁寒', cost: '1 AP', color: 'var(--text)',
          desc: `对目标造成 <b style="color:var(--text)">${normalDmg}</b> 点<b class="term-normal">衍射伤害</b>。不积攒<b class="term-resource">韶光层数</b>。`
        },
        {
          icon: '✦', name: '共鸣技能 · 流光夕影', cost: '1 AP · 冷却 3 回合', color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillBase}</b></span> 点<b class="term-skill">衍射伤害</b>，<b class="term-resource">韶光</b> +<b>1</b>。<br>满 <b>4</b> 层时替换为<b style="color:var(--gold)">惊龙破空</b>（攻击力 <b>${Math.round(jingAbsMult * 100)}%</b>，约 <b style="color:var(--gold)">${jingDmg}</b>），消耗全部韶光。${chain >= 4 ? `<br>4 链：惊龙破空后全队全伤害 +<b>20%</b>（2 回合）。` : ''}${chain >= 1 ? `<br>1 链：共鸣技能伤害 +<b>80%</b>。` : ''}`
        },
        {
          icon: '💥', name: '重击 · 霁月', cost: '2 AP · 冷却 1 回合', color: 'var(--text)',
          desc: `对目标造成 <b style="color:var(--text)">${heavyDmg}</b> 点<b class="term-heavy">衍射伤害</b>。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 移岁诛邪', cost: `3 AP · 需共鸣能量满 ${energyMax}`, color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstMain}</b></span>、副目标 <b style="color:#ff8c5e">${burstSide}</b> 点<b class="term-burst">衍射伤害</b>，<b class="term-resource">韶光</b> +<b>2</b>。${chain >= 4 ? `<br>4 链：解放后全队全伤害 +<b>20%</b>（2 回合）。` : ''}${chain >= 5 ? `<br>5 链：解放伤害 +<b>120%</b>。` : ''}`
        },
        {
          icon: '🎵', name: '变奏技能 · 蟠龙清辉', cost: '切换上场时触发', color: '#c39bff',
          desc: `入场对主目标造成 <b style="color:var(--accent)">${varDmg}</b> 点伤害，<b class="term-resource">韶光</b> +<b>2</b>。${chain >= 3 ? `<br>3 链：获得<b class="term-resource">谪仙</b>，攻击 +<b>50%</b>。` : ''}`
        }
      ];
    },
    forteName: '韶光层数',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 资源条（层数 · 上限 4）</span><br>· 普攻 +<b>0</b> / 共鸣技能 +<b>1</b> / 变奏入场 +<b>2</b> 层<br>· 共鸣解放 +<b>2</b> 层<br>· 满 <b>4</b> 层时，下次<b class="term-skill">共鸣技能</b>替换为<b style="color:var(--gold)">惊龙破空</b>，消耗全部韶光，攻击力 <b>480%</b> 衍射（6 链 <b>544%</b>）<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>变奏入场并技能积韶光层数，满 4 层后惊龙破空爆发，再共鸣解放清场。'
  },
  '长离': {
    intro: '热熔 · 迅刀 · 副C · 「离火 · 心眼」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '衔火洞明', skillName: '赫羽三相', heavyName: '焚身以火', burstName: '离火照丹心', varName: '天道持枢',
      hasHeavy: true,
      normalMult: 1.0, skillMult: 2.0, heavyMult: 4.0,
      burstMain: 9.0, burstSide: 4.5, variationMult: 1.5,
      normalMech: '<span style="color:var(--muted)">资源积累：</span>普攻命中获得 <b>1</b> 层<b class="term-resource">离火</b>（上限 6）。<span style="color:var(--muted)">心眼态：</span>变身<b class="term-skill">心眼·征</b>，倍率提升至 <b>300%</b>、转<b>共鸣技能</b>伤害，消耗 2 层离火抵 1 AP。',
      skillMech: '<span style="color:var(--muted)">资源积累：</span>共鸣技能命中获得 <b>1</b> 层<b class="term-resource">离火</b>。<span style="color:var(--muted)">心眼态：</span>变身<b class="term-skill">心眼·劫</b>，倍率提升至 <b>410%</b>，消耗 2 层离火抵 1 AP、不吃冷却。',
      heavyMech: '<span style="color:var(--muted)">资源积累：</span>重击命中获得 <b>1</b> 层<b class="term-resource">离火</b>。<span style="color:var(--muted)">心眼态：</span>变身<b class="term-skill">心眼·冲</b>（爆发顶点），倍率提升至 <b>650%</b>、转<b>共鸣技能</b>伤害，消耗 4 层离火抵 2 AP。',
      burstMech: '<span style="color:var(--muted)">爆发增益：</span>造成热熔伤害、获得 <b>3</b> 层<b class="term-resource">离火</b>，进入<b class="term-buff">焰羽</b>（2 回合攻击 +50%、无视 40% 防御）。',
      skillFollowUp: '1 链：共鸣技能与重击伤害提升 10%。 2 链：持有离火时暴击提升 25%。',
      heavyFollowUp: '5 链：重击·焚身以火伤害提升 100%。 6 链：共鸣技能、重击与共鸣解放忽视目标 40% 防御。',
      burstFollowUp: '3 链：共鸣解放·离火照丹心伤害提升 80%。 4 链：变奏后全队攻击提升 20%，持续 2 回合。'
    }),
    forteName: '离火',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 离火（核心资源 · 0-6 层）</span><br>· 普攻/技能/重击各 +1 层，解放 +3 层<br>· 每持有 1 层，<b style="color:#ff8c5e">热熔伤害 +5%</b>（满 6 层 +30%），随层数实时变化<br>· 攒满 <b>6</b> 层进入<b style="color:#ff8c5e">心眼模式</b><br><br><span style="color:var(--gold);font-size:11px">▸ 心眼模式（变身爆发窗口）</span><br>· 三招变身：<b class="term-skill">心眼·征 300%</b> / <b class="term-skill">心眼·劫 410%</b> / <b class="term-skill">心眼·冲 650%</b>，伤害类型均为共鸣技能<br>· 出招优先用离火抵 AP：<b>每 2 层离火 = 1 点 AP</b>，缺口用回合 AP 补<br>· 离火 &lt; 2 层时退出心眼，三招还原<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻/技能攒离火，解放 +3 层开焰羽，凑满 6 层进心眼，心眼·冲与心眼·征倾泻，烧空后退出再攒。'
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
      const heal4Mult  = chain >= 4 ? 1.7 : 1.0;             // 4 链：仅技能治疗 ×1.7
      const fieldAtkPct  = Math.round((chain >= 2 ? 40 : 0) * fieldMult);
      const fieldCratePct = Math.round(20 * fieldMult);
      const fieldCdmgPct  = Math.round(30 * fieldMult);

      // ===== 真实伤害/治疗数（命中前结算）=====
      const normalDmg = Math.round(atk * ACTION_MULTIPLIER.normal);
      const skillDmg  = Math.round(atk * 0.8);               // 设计 80%，非通用技能倍率
      const burstDmg  = Math.round(atk * ACTION_MULTIPLIER.burstMain);
      const burstSide = Math.round(atk * ACTION_MULTIPLIER.burstSide);

      // 共鸣技能 · 混沌理论 一次性治疗（命中后给全队，4 链放大）
      const skillHealBase  = Math.round(hp * 0.06 + atk * 0.5);
      const skillHealTotal = Math.round(skillHealBase * (1 + healBonus) * heal4Mult);

      // 星域每跳治疗（生命×5% + 攻击×40%）；展开立即 1 跳 + 持续；1 链 ×2.5；4 链不进 HOT
      const hotTotal = Math.round((hp * 0.05 + atk * 0.4) * (1 + healBonus) * fieldMult);

      // 变奏伤害（6 链：倍率 +42% + 自身暴伤 +500% 窗口；文案展示基底×1.42）
      const varBaseMult  = 0.8 * (chain >= 6 ? 1.42 : 1);
      const varDmg       = Math.round(atk * varBaseMult);
      const varConcerto  = Math.round(atk * varBaseMult * 2);
      const varChain6Note = chain >= 6;

      // ===== 公式 tooltips =====
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100% = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">命中前结算，最终伤害受暴击/抗性/防御影响</span>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 80% = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 700% = <b style="color:#ff8c5e">${burstDmg}</b><br>` +
        `· 副目标：攻击 <b>${atk}</b> × 350% = <b style="color:#ff8c5e">${burstSide}</b>`
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
        `= (生命 <b>${hp}</b> × 5% + 攻击 <b>${atk}</b> × 40%)<br>` +
        `&nbsp;&nbsp;× (1 + 治疗加成 ${(healBonus*100).toFixed(1)}%)` +
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
        `· 展开立即 + 每回合：<b style="color:var(--green)">${hotTotal}</b>（生命×5% + 攻击×40%${chain>=1?' × 2.5':''}）<br>` +
        `· 全队暴击 +<b style="color:#ffd96b">${fieldCratePct}%</b><br>` +
        `· 全队暴伤 +<b style="color:#ffd96b">${fieldCdmgPct}%</b>` +
        (chain >= 2 ? `<br>· 全队攻击 +<b style="color:#ff8c5e">${fieldAtkPct}%</b>（共鸣链 2）` : '')
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `· 普通：攻击 <b>${atk}</b> × ${chain>=6?'80% × 1.42':'80%'} = ${varDmg}<br>` +
        `· 协奏满：攻击 <b>${atk}</b> × ${chain>=6?'160% × 1.42':'160%'} = <b style="color:var(--accent)">${varConcerto}</b>` +
        (chain >= 6 ? `<br>· 共鸣链 6：变奏时自身暴击伤害 +500%（2 回合）` : '')
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
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstDmg}</b> 点</span>、对副目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSide}</b> 点</span><b class="term-burst">衍射伤害</b>，展开 <span class="tip" data-tip='${fieldTip}'><b class="term-resource">星域</b></span>（<span class="tip" data-tip='${fieldDurTip}'><b>${fieldDur}</b> 回合</span>${chain>=1?' · 切人不消散':''}）：<br>· 展开立即治疗全队 <span class="tip" data-tip='${hotTip}'><b style="color:var(--green)">${hotTotal}</b></span>，之后每回合再治疗同等数值<br>· 全队暴击 +<span class="tip" data-tip='${crateTip}'><b style="color:#ffd96b">${fieldCratePct}%</b></span> · 暴伤 +<span class="tip" data-tip='${cdmgTip}'><b style="color:#ffd96b">${fieldCdmgPct}%</b></span>${chain>=2?` · 攻击 +<span class="tip" data-tip='${fieldAtkTip}'><b style="color:#ff8c5e">${fieldAtkPct}%</b></span>`:''}${chain>=3?'<br>额外回复 <b>20</b> 共鸣能量（每 <b>2</b> 回合 1 次 · 共鸣链 3）':''}`
        },
        {
          icon: '🎵', name: '变奏技能 · 洞悉', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">变奏伤害</b>。${chain>=6?'<br>共鸣链 6：变奏倍率 +42%，施放时自身暴击伤害 +500%（2 回合）。':''}${chain>=5?'<br>共鸣链 5：普攻额外攻击一名相邻敌人。':''}`
        }
      ];
    },
    forteName: '协奏',
    forteDesc: '<b class="term-burst">共鸣解放·终末回环</b>展开<b class="term-resource">星域</b>：当场治疗全队一跳，之后每回合持续回血，并提供暴击率 +20%、暴击伤害 +30%。<br>2 链追加全队攻击 +40%，1 链延长持续并切人不散。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能积攒能量与协奏，解放展开星域稳住队伍，切换主力输出。'
  },
  '椿': {
    intro: '湮灭 · 迅刀 · 主C · 「红椿·蕊 · 永生花 · 含苞酣梦」',
    hasHeavy: true,
    customLines: (stats, role) => {
      const atk = stats.atk || 0;
      const chain = role.chain || 0;
      const energyMax = stats.maxEnergy || 125;
      const tip = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const yongMult = 8.0 * (chain >= 2 ? 2.2 : 1);
      const yong = Math.round(atk * yongMult);
      const hanbao = chain >= 6 ? 2.5 : 1.5;
      const normal = Math.round(atk * 1.2);
      const skill = Math.round(atk * 2.0);
      const heavy = Math.round(atk * 4.0);
      const burstMain = Math.round(atk * 9.0);
      const burstSide = Math.round(atk * 4.5);
      const varDmg = Math.round(atk * 2.0);
      const varStrong = Math.round(atk * 4.0);
      const normalHanbao = Math.round(normal * hanbao);
      const skillHanbao = Math.round(skill * hanbao);

      const normalTip = tip(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 120% = <b style="color:var(--text)">${normal}</b><br>` +
        `含苞·酣梦：× ${hanbao} = <b style="color:var(--gold)">${normalHanbao}</b>`
      );
      const skillTip = tip(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 200% = <b style="color:var(--accent)">${skill}</b><br>` +
        `含苞·酣梦：× ${hanbao} = <b style="color:var(--gold)">${skillHanbao}</b>`
      );
      const yongTip = tip(
        `<b style="color:var(--gold)">永生花伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × ${(yongMult * 100).toFixed(0)}% = <b style="color:var(--accent)">${yong}</b><br>` +
        `红椿·蕊满 100 且协奏 ≥ 50 时，共鸣技能替换为永生花<br>` +
        `消耗 50 红椿·蕊 + 50 协奏，进入含苞 3 回合` +
        (chain >= 2 ? `<br>2 链：永生花倍率 +120%（×2.2）` : '')
      );
      const heavyTip = tip(
        `<b style="color:var(--gold)">重击伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 400% = <b style="color:#ff8c5e">${heavy}</b>`
      );
      const burstTip = tip(
        `<b style="color:var(--gold)">解放伤害公式</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 900% = <b style="color:#ff8c5e">${burstMain}</b><br>` +
        `· 副目标：攻击 <b>${atk}</b> × 450% = <b style="color:#ff8c5e">${burstSide}</b>` +
        (chain >= 3 ? `<br>3 链：含苞期间攻击 +58%、解放伤害 +50%` : '')
      );
      const varTip = tip(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `· 普通：攻击 <b>${atk}</b> × 200% = ${varDmg}<br>` +
        `· 协奏满：攻击 <b>${atk}</b> × 400% = <b style="color:var(--accent)">${varStrong}</b>`
      );

      return [
        {
          icon: '⚔', name: '普攻 · 育种', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normal}</b> 点</span><b class="term-normal">湮灭伤害</b>，命中后回复 12 共鸣能量、积累 8 协奏值，<b class="term-resource">红椿·蕊</b> +10。<br>处于<b class="term-resource">含苞</b>时伤害 ×${hanbao}（<span class="tip" data-tip='${normalTip}'>${normalHanbao}</span>）。`
        },
        {
          icon: '✦', name: '共鸣技能 · 盛放与凋零的轮舞', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skill}</b> 点</span><b class="term-skill">湮灭伤害</b>，命中后回复 22 能量，<b class="term-resource">红椿·蕊</b> +15。<br>处于<b class="term-resource">含苞</b>时伤害 ×${hanbao}（<span class="tip" data-tip='${skillTip}'>${skillHanbao}</span>）。` +
            `<br>红椿·蕊满 100 且协奏 ≥ 50 时，本技能替换为<b class="term-skill">永生花</b>。`
        },
        {
          icon: '✿', name: '永生花', cost: '1 AP · 双资源就绪时替换技能',
          color: 'var(--gold)',
          desc: `红椿·蕊满 100 且协奏 ≥ 50 时可用。对目标造成 <span class="tip" data-tip='${yongTip}'><b style="color:var(--gold)">${yong}</b> 点</span><b class="term-skill">湮灭伤害</b>，消耗 50 红椿·蕊 + 50 协奏，进入<b class="term-resource">含苞</b> 3 回合。` +
            (chain >= 2 ? ' <span style="color:var(--gold)">[2链] 永生花倍率 +120%（×2.2）。</span>' : '') +
            (chain >= 6 ? ' <span style="color:var(--gold)">[6链] 含苞中可再放 1 次续窗，酣梦 ×2.5。</span>' : '')
        },
        {
          icon: '💢', name: '重击 · 修枝', cost: '2 AP · 冷却 1 回合',
          color: '#ff8c5e',
          desc: `对目标造成 <span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavy}</b> 点</span><b class="term-heavy">湮灭伤害</b>，命中后回复 15 能量。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 芳华绽烬', cost: `3 AP · 需共鸣能量满 ${energyMax}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstMain}</b> 点</span>、副目标 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSide}</b> 点</span><b class="term-burst">湮灭伤害</b>，红椿·蕊 +30。` +
            (chain >= 3 ? ' <span style="color:var(--gold)">[3链] 含苞期间攻击 +58%、解放伤害 +50%。</span>' : '')
        },
        {
          icon: '🎵', name: '变奏技能 · 八千春秋', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varStrong}</b>）点</span><b class="term-variation">湮灭伤害</b>，红椿·蕊 +20。` +
            (chain >= 1 ? ' <span style="color:var(--gold)">[1链] 入场后暴击伤害 +28%（2 回合）。</span>' : '') +
            (chain >= 4 ? ' <span style="color:var(--gold)">[4链] 全队普攻伤害 +25%（2 回合）。</span>' : '')
        }
      ];
    },
    forteName: '红椿·蕊',
    forteDesc: '椿双资源：<b class="term-resource">红椿·蕊</b>（0-100）+ 协奏。<br>· 普攻 +10 / 技能 +15 / 解放 +30 / 变奏 +20。<br>· 红椿·蕊满 100 且协奏 ≥ 50 时，共鸣技能替换为<b class="term-skill">永生花</b>（攻击 ×800%，2 链 ×1760%），进入<b class="term-resource">含苞</b> 3 回合（普攻/技能 ×1.5，6 链 ×2.5）。'
  },
  '折枝': {
    intro: '冷凝 · 音感仪 · 副C · 「墨鹤领域」',
    hasHeavy: true,
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '轻云淡墨', skillName: '以形写神', burstName: '虚实境趣', varName: '柔翰生辉',
      skillFollowUp: '领域内命中补 <b>1</b> 只<b class="term-resource">墨鹤</b>（上限内）。 6 链：额外召唤 <b>1</b> 只<b class="term-resource">白鹤</b>（atk × 120% 共鸣技能伤害）。',
      burstFollowUp: '展开墨鹤领域 <b>3</b> 回合并初召 <b>6</b> 只<b class="term-resource">墨鹤</b>。 2 链：上限增加 6 只，合计 12 只。 4 链：解放时全队攻击 +20%。 5 链：累计召唤 3 只时额外召唤 1 只，造成 140% 伤害。',
      heavyName: '点睛',
      heavyFollowUp: '消耗 ⌊墨鹤/2⌋ 只（至少 1 只）转全队护盾，每只 atk × 50%。剩余墨鹤继续追击。CD 2 回合。'
    }),
    forteName: '墨鹤',
    forteDesc: '折枝是召唤型副C：<b class="term-burst">共鸣解放·虚实境趣</b>展开<b class="term-resource">墨鹤领域</b> 3 回合并初召 6 只<b class="term-resource">墨鹤</b>。<br>· <b>墨鹤追击</b>：领域内己方攻击命中主目标时消耗 1 只墨鹤，atk × 35% 冷凝追击。墨鹤耗尽则停止。<br>· <b>重击点睛</b>：消耗半数墨鹤转全队护盾，每只 atk × 50%。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能与普攻积能量，释放解放召唤墨鹤，切到主C，墨鹤跟手追击，折枝回场点睛转护盾保命。'
  },
  '相里要': {
    intro: '导电 · 臂铠 · 副C · 「衍构」',
    customLines: makeSkillLines({
      element: '导电',
      normalName: '问难', skillName: '基本推衍', heavyName: '勘破', burstName: '思维矩阵', varName: '正理',
      // Phase 3 · WIKI N130 / S200 / H400 / 思维矩阵 1466·733 / 变奏 100
      normalMult: 1.3, skillMult: 2.0, heavyMult: 4.0, burstMain: 14.66, burstSide: 7.33, variationMult: 1.0,
      hasHeavy: true,
      forteName: '衍构',
      normalForteGain: 8, skillForteGain: 18, heavyForteGain: 12,
      skillMech: '处于<b class="term-resource">洞见状态</b>时，共鸣技能伤害提升。',
      burstMech: '施放后进入<b class="term-resource">洞见状态</b> 2 回合：普攻/共鸣技能伤害 +50%（6 链 +90%）。',
      skillFollowUp: '1 链：共鸣技能伤害 +48%。 3 链：共鸣技能伤害 +63%。 6 链：共鸣技能伤害 +76%。',
      burstFollowUp: '4 链：全队共鸣解放伤害 +25%。 5 链：共鸣解放伤害 +100%。',
    }),
    forteName: '衍构',
    forteDesc: '<b class="term-resource">衍构</b>（0-100）：普攻 +8 / 技能 +18 / 重击 +12 / 解放 +25。<br>· 满能量施放<b class="term-burst">共鸣解放·思维矩阵</b>（主 1500% / 副 750%）进入<b class="term-resource">洞见状态</b> 2 回合。<br>· 洞见期间普攻/技能伤害 +50%（6 链 +90%）。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能攒衍构与能量，解放开洞见窗，窗内连甩技能倾泻。'
  },
  '珂莱塔': {
    intro: '冷凝 · 佩枪 · 主C · 「解离」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '缄默执行', skillName: '暴力美学', heavyName: '末路见行', burstName: '新浪潮时代', varName: '入冬叹调',
      // Phase 3 · WIKI N120 / S280 / 满晶体×2→560 / 末路见行 H835 / 致死以终 644·322 / 变奏 200
      normalMult: 1.2, skillMult: 2.8, heavyMult: 8.35, burstMain: 6.44, burstSide: 3.22, variationMult: 2.0, concertoVariationMult: 4.0,
      burstMech: '<span style="color:var(--muted)">控制效果：</span><b class="term-burst">共鸣解放·致死以终</b>命中附加<b class="term-resource">焕彩</b>，使目标短暂停滞。主目标 atk×644% / 副目标 atk×322%。',
      heavyMech: '<span style="color:var(--muted)">重击派生：</span><b class="term-heavy">重击·末路见行</b> atk×835% 是珂莱塔的爆发段；4 链时施放后全队共鸣技能 +25%。',
      skillMech: '<span style="color:var(--muted)">强化条件：</span>命中带<b class="term-resource">解离</b>/<b class="term-resource">变彩</b>的目标会回复<b class="term-resource">灵萃</b>。灵萃满时，共鸣技能进入<b style="color:var(--gold)">示我璀璨</b>强化形态（280%×2.0=560%）。',
      hasHeavy: true,
      skillFollowUp: '<b class="term-resource">灵萃</b>满时强化为<b style="color:var(--gold)">示我璀璨</b>。 3 链：共鸣技能·示我璀璨 +93%。',
      heavyFollowUp: '5 链：重击·末路见行 +47%。 4 链：施放重击时全队<b class="term-skill">共鸣技能</b>伤害 +25%。',
      burstFollowUp: '射击命中附加<b class="term-resource">焕彩</b><b class="term-resource">停滞</b>效果。 1 链：对<b class="term-resource">解离</b>目标暴击 +12.5%。 2 链：解放·致死以终 +126%。 6 链：死兆射击 + 晶体翻倍 = 解放 +186.6%。'
    }),
    forteName: '灵萃',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 强化条件</span><br>· 共鸣技能命中带<b class="term-resource">解离</b>/<b class="term-resource">变彩</b>的目标时回复<b class="term-resource">灵萃</b><br>· 灵萃满后，下次共鸣技能进入<b style="color:var(--gold)">暴力美学</b>强化形态<br>· <b class="term-heavy">重击·末路见行</b>是主要爆发段（4 链给全队共鸣技能 +25%）<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能挂解离/变彩，继续技能回灵萃，灵萃满释放暴力美学，重击末路见行，共鸣解放死兆附加焕彩停滞。'
  },
  '洛可可': {
    intro: '湮灭 · 臂铠 · 副C · 「想象力」',
    customLines: makeSkillLines({
      element: '湮灭',
      normalName: '幻想照进现实', skillName: '高难度设计', heavyName: '飞跃幻想', burstName: '即兴喜剧', varName: '佩洛，来帮忙',
      // Phase 3 · N100 / S180 / H400 / 解放 835·417.5（满想象力 1336·668）/ 变奏 170 · WIKI
      normalMult: 1.0, skillMult: 1.8, heavyMult: 4.0, burstMain: 8.35, burstSide: 4.175, variationMult: 1.7,
      hasHeavy: true,
      heavyMech: '<span style="color:var(--muted)">蓄力重击：</span>蓄力重击命中且<b class="term-resource">想象力</b>≥<b>100</b>时送洛可可上空中，进入<b style="color:var(--gold)">飞跃幻想</b>状态（仅空中可触发）。该状态下可消耗 <b>100</b> 想象力续接普攻·幻想照进现实（视为<b class="term-heavy">重击伤害</b>）。',
      burstMech: '<span style="color:var(--muted)">强化条件：</span>主 atk×835% / 副 atk×417.5%。满<b class="term-resource">想象力</b>时解放伤害 ×1.6（主 1336% / 副 668%）。',
      skillFollowUp: '回复 100 想象力 + 10 协奏；普攻幻想照进现实免疫打断。 4 链：共鸣技能后普攻幻想照进现实 +60%。',
      heavyFollowUp: '5 链：解放期间重击倍率 +80%。',
      burstFollowUp: '开场强化普攻 + 重击。 2 链：普攻每层给全队湮灭 +10%（满 3 层 +40%）。 3 链：变奏后暴击/暴伤 +10%/+30%。 5 链：解放开场 +20%，重击 +80%。 6 链：解放期间普攻无视 60% 防御。'
    }),
    forteName: '想象力',
    forteDesc: '洛可可是<b style="color:#a78bff">湮灭副C</b>：<b class="term-skill">共鸣技能·高难度设计</b>回 100 想象力 + 10 协奏；普攻每段给全队<b class="term-resource">湮灭伤害 +10%</b>（满 3 层 +40%）。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏起手积湮灭伤害加成，共鸣技能，普攻铺 3 层，切到主C 享受全队湮灭伤害加成。'
  },
  '菲比': {
    intro: '衍射 · 音感仪 · 主C · 「赦罪/告解双形态」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '夏弥尔之星', skillName: 'FFF · 镜之环', heavyName: '星辉', burstName: '启明之誓愿', varName: '金色恩典',
      // Phase 3 · N100 / S180 / H400 / 解放 400·200 / 变奏 200（官方解放偏低，赦罪链再抬）
      normalMult: 1.0, skillMult: 1.8, heavyMult: 4.0, burstMain: 4.0, burstSide: 2.0, variationMult: 2.0, concertoVariationMult: 4.0,
      hasHeavy: true,
      skillMech: '<span style="color:var(--muted)">形态切换：</span>消耗 <b>1</b> 点<b class="term-resource">福音</b>，<b style="color:var(--gold)">赦罪</b>↔<b style="color:#a78bff">告解</b>形态切换（战斗开始默认<b style="color:var(--gold)">赦罪</b>）。召唤<b class="term-resource">镜之环</b>对范围内目标附加<b class="term-resource">光噪效应</b>。',
      heavyMech: '<span style="color:var(--muted)">形态差异：</span><b style="color:var(--gold)">赦罪</b>下重击 atk×400%；<b style="color:#a78bff">告解</b>下重击大幅强化（3 链 +249%）。消耗<b class="term-resource">福音</b>。',
      burstMech: '<span style="color:var(--muted)">形态差异：</span>解放主 atk×400% / 副 atk×200%。<b style="color:var(--gold)">赦罪</b>下解放吃链乘区；<b style="color:#a78bff">告解</b>下解放叠满<b class="term-resource">光噪</b>（1 链）。',
      skillFollowUp: '6 链：召唤<b class="term-resource">镜之环</b>时攻击 +10%。',
      heavyFollowUp: '2 链：赦罪状态下延奏对光噪目标 +120%。 3 链：重击·星辉 +91%。',
      burstFollowUp: '1 链：赦罪状态解放倍率再抬。 5 链：自身衍射伤害 +12%。'
    }),
    forteName: '福音',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· <b style="color:var(--gold)">赦罪</b>（默认）：强化<b class="term-burst">共鸣解放</b>（解放倍率 +225%）<br>· <b style="color:#a78bff">告解</b>：强化<b class="term-heavy">重击·星辉</b>（重击 +249%）+ FFF 镜之环叠满光噪<br>· 施放<b class="term-skill">共鸣技能·FFF</b>消耗 <b>1</b> 点<b class="term-resource">福音</b>切换形态；战斗开始默认赦罪<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻铺<b class="term-resource">光噪效应</b>，FFF 召唤<b class="term-resource">镜之环</b>切换告解，重击·星辉爆发，再 FFF 切回赦罪，共鸣解放·启明之誓愿清场。'
  },
};
