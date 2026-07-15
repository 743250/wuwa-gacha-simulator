// ===== 通用 customLines 工厂 =====
// 大部分主C/副C 角色没有"专属状态机"那种结构化战斗（如忌炎锐意、守岸人星域、吟霖印记），
// 他们的差异在元素 / 招式名 / 共鸣链数值，customLines 主要是把数值反映到公式 tooltip。
// 工厂把通用模板抽出来，角色只需要传一个 config（招式名 + 元素 + 标志性 quirks）。
//
// quirks 字段：
//   hasHeavy: boolean              — 是否在技能区显示重击行（必须跟 battle/characters/index.js 的 hasHeavyAttack 一致）
//   normalMech/skillMech/heavyMech/burstMech/varMech: string
//                                  — 该招式的"基础机制说明"（双形态切换条件 / 派生规则 等）
//                                    无"N 链："前缀，永久显示在该招式描述里
//   skillFollowUp/...: string      — 共鸣链效果（按 "N 链：" 切分，按当前 chain 过滤）
//   forteHint: string              — forteDesc 中"推荐战斗节奏"前的核心循环说明

import { escTip } from './utils.js';
import { encoreBurstModeSignal } from '../../ui/panels/roleModal/signals.js';
import { ACTION_MULTIPLIER } from '../../battle/balance.js';

export function makeSkillLines(cfg) {
  return (stats, role) => {
    const chain = role.chain || 0;
    const atk = stats.atk;
    const energyMax = stats.maxEnergy || 125;
    const elem = cfg.element || '元素';

    // 动态过滤 followUp 文案：把"N 链：xxx；M 链：yyy"按当前 chain 数过滤
    //   - 未激活：直接隐藏（不让玩家提前看到未购买内容）
    //   - 已激活：去掉"N 链："前缀，正文用浅金色高亮（表示这是共鸣链强化）
    //   - 不含"N 链："标记的句子：通用机制说明，永远显示
    function renderFollowUp(text) {
      if (!text) return '';
      // 按"N 链："切分，每段独立判断
      const parts = text.split(/(?=\d\s*链[：:])/g);
      const out = [];
      for (const part of parts) {
        const m = part.match(/^(\d)\s*链[：:]\s*([\s\S]*)$/);
        if (!m) {
          if (part.trim()) out.push(part.trim());
          continue;
        }
        const need = parseInt(m[1], 10);
        if (chain >= need) {
          const body = m[2].replace(/[；;]\s*$/, '').trim();
          out.push(`<span style="color:var(--gold)">[${need}链] ${body}</span>`);
        }
        // 未激活：丢弃，不让玩家提前看到内容
      }
      return out.join(' ');
    }

    // 倍率：cfg 可覆盖角色专属基底（与 characters/*.js hook 对账）
    const m = {
      normal: cfg.normalMult ?? ACTION_MULTIPLIER.normal,
      skill: cfg.skillMult ?? ACTION_MULTIPLIER.skill,
      heavy: cfg.heavyMult ?? ACTION_MULTIPLIER.heavy,
      burstMain: cfg.burstMain ?? ACTION_MULTIPLIER.burstMain,
      burstSide: cfg.burstSide ?? ACTION_MULTIPLIER.burstSide,
      variation: cfg.variationMult ?? ACTION_MULTIPLIER.variation,
      concertoVariation: cfg.concertoVariationMult ?? ACTION_MULTIPLIER.concertoVariation,
    };
    const pct = (x) => Math.round(x * 100);
    const normalDmg = Math.round(atk * m.normal);
    const skillDmg  = Math.round(atk * m.skill);
    const heavyDmg  = Math.round(atk * m.heavy);
    const burstMain = Math.round(atk * m.burstMain);
    const burstSide = Math.round(atk * m.burstSide);
    const varDmg    = Math.round(atk * m.variation);
    const varConcerto = Math.round(atk * m.concertoVariation);

    // typeBonus：须由 getSkillHintRoleContext（applyChainBonuses + battleStart）注入；
    // 存档角色没有这些字段，会恒为 0 → 公式失真
    const normalBonus = (role.normalBonus || 0);
    const skillBonus  = (role.skillBonus  || 0);
    const burstBonus  = (role.burstBonus  || 0);
    const heavyBonus  = (role.heavyBonus  || 0);

    const finalNormal = Math.round(normalDmg * (1 + normalBonus));
    const finalSkill  = Math.round(skillDmg  * (1 + skillBonus));
    const finalHeavy  = Math.round(heavyDmg  * (1 + heavyBonus));
    const finalBurstMain = Math.round(burstMain * (1 + burstBonus));
    const finalBurstSide = Math.round(burstSide * (1 + burstBonus));

    const fmtPct = v => `${(v*100).toFixed(0)}%`;

    const encoreMode = cfg.encoreBurstToggle ? encoreBurstModeSignal.value : '';
    const isEncoreBlack = encoreMode === 'black';
    // 黑咩窗仅普攻/技能 ×1.5；重击不吃窗（爆发在失序满替换）
    const encoreMult = isEncoreBlack ? (cfg.encoreDamageMult || 1.5) : 1;
    const normalShown = Math.round(finalNormal * encoreMult);
    const skillShown = Math.round(finalSkill * encoreMult);
    const heavyShown = finalHeavy;

    const normalTip = escTip(
      `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
      `= 攻击 <b>${atk}</b> × ${pct(m.normal)}%${normalBonus>0?` × (1 + 普攻加成 ${fmtPct(normalBonus)})`:''}${encoreMult>1?` × 黑咩强化 ${encoreMult}`:''} = <b style="color:var(--text)">${normalShown}</b><br>` +
      `<span style="color:var(--muted);font-size:10px">命中前结算，最终伤害受暴击/抗性/防御影响</span>`
    );
    const skillTip = escTip(
      `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
      `= 攻击 <b>${atk}</b> × ${pct(m.skill)}%${skillBonus>0?` × (1 + 技能加成 ${fmtPct(skillBonus)})`:''}${encoreMult>1?` × 黑咩强化 ${encoreMult}`:''} = <b style="color:var(--accent)">${skillShown}</b>`
    );
    const heavyTip = cfg.hasHeavy ? escTip(
      `<b style="color:var(--gold)">重击伤害公式</b><br>` +
      `= 攻击 <b>${atk}</b> × ${pct(m.heavy)}%${heavyBonus>0?` × (1 + 重击加成 ${fmtPct(heavyBonus)})`:''} = <b style="color:#ff8c5e">${heavyShown}</b>` +
      (cfg.encoreBurstToggle
        ? `<br>失序满：白咩·失控之炎 <b>${Math.round(atk * 5.0 * (1 + heavyBonus))}</b>（500%） / 黑咩·暴走之炎 <b>${Math.round(atk * 7.75 * (1 + heavyBonus))}</b>（775%），均为共鸣解放伤害`
        : '')
    ) : '';
    const burstOpenOnly = cfg.burstMain === 0 && cfg.burstSide === 0;
    const burstTip = escTip(
      burstOpenOnly
        ? `<b style="color:var(--gold)">共鸣解放</b><br>仅开启形态窗口，无独立开场大伤`
        : `<b style="color:var(--gold)">解放伤害公式</b><br>` +
          `· 主目标：攻击 <b>${atk}</b> × ${pct(m.burstMain)}%${burstBonus>0?` × (1 + 解放加成 ${fmtPct(burstBonus)})`:''} = <b style="color:#ff8c5e">${finalBurstMain}</b><br>` +
          `· 副目标：攻击 <b>${atk}</b> × ${pct(m.burstSide)}%${burstBonus>0?` × (1 + 解放加成 ${fmtPct(burstBonus)})`:''} = <b style="color:#ff8c5e">${finalBurstSide}</b>`
    );
    const varTip = escTip(
      `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
      `· 普通：攻击 <b>${atk}</b> × ${pct(m.variation)}% = ${varDmg}<br>` +
      `· 协奏满：攻击 <b>${atk}</b> × ${pct(m.concertoVariation)}% = <b style="color:var(--accent)">${varConcerto}</b>`
    );

    const pickEncore = (base, white, black) => {
      if (!cfg.encoreBurstToggle) return base;
      return encoreMode === 'black'
        ? (black ?? white ?? base)
        : (white ?? base);
    };
    const normalName = pickEncore(cfg.normalName, cfg.normalNameWhite, cfg.normalNameBlack);
    const skillName = pickEncore(cfg.skillName, cfg.skillNameWhite, cfg.skillNameBlack);
    const heavyName = pickEncore(cfg.heavyName, cfg.heavyNameWhite, cfg.heavyNameBlack);
    const normalForteGain = pickEncore(cfg.normalForteGain, cfg.normalForteGainWhite, cfg.normalForteGainBlack);
    const skillForteGain = pickEncore(cfg.skillForteGain, cfg.skillForteGainWhite, cfg.skillForteGainBlack);
    const heavyForteGain = pickEncore(cfg.heavyForteGain, cfg.heavyForteGainWhite, cfg.heavyForteGainBlack);

    const skillFollow = renderFollowUp(cfg.skillFollowUp);
    const heavyFollow = renderFollowUp(cfg.heavyFollowUp);
    const rawBurstMech = (() => {
      if (!cfg.encoreBurstToggle) return cfg.burstMech || '';
      const mode = encoreMode || 'white';
      const text = mode === 'black' ? cfg.burstMechBlack : cfg.burstMechWhite;
      return text || '';
    })();
    const burstFollow = renderFollowUp(cfg.burstFollowUp);
    const varFollow   = renderFollowUp(cfg.varFollowUp);

    const lines = [
      {
        icon: '⚔', name: `普攻 · ${normalName || '常态攻击'}`, cost: '1 AP',
        color: 'var(--text)',
        desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalShown}</b> 点</span><b class="term-normal">${elem}伤害</b>，命中后回复 12 共鸣能量、积累 8 协奏值${normalForteGain ? `，回复 ${normalForteGain} <b class="term-resource">${cfg.forteName || '资源'}</b>` : ''}。`
      },
      {
        icon: '✦', name: `共鸣技能 · ${skillName || '共鸣斩击'}`, cost: '1 AP · 冷却 3 回合',
        color: 'var(--accent)',
        desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillShown}</b> 点</span><b class="term-skill">${elem}伤害</b>，命中后回复 22 能量${skillForteGain ? `、回复 ${skillForteGain} <b class="term-resource">${cfg.forteName || '资源'}</b>` : ''}。${skillFollow ? '<br>' + skillFollow : ''}`
      }
    ];
    if (cfg.hasHeavy) {
      lines.push({
        icon: '💢', name: `重击 · ${heavyName || '蓄力斩'}`, cost: '2 AP · 冷却 1 回合',
        color: '#ff8c5e',
        desc: `对目标造成 <span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavyShown}</b> 点</span><b class="term-heavy">${elem}伤害</b>，回复 15 能量${heavyForteGain ? `、回复 ${heavyForteGain} <b class="term-resource">${cfg.forteName || '资源'}</b>` : ''}。${heavyFollow ? '<br>' + heavyFollow : ''}`
      });
    }
    lines.push({
      icon: '⚡', name: `共鸣解放 · ${cfg.burstName || '元素爆发'}`, cost: `3 AP · 需共鸣能量满 ${energyMax}`,
      color: 'var(--gold)',
      desc: burstOpenOnly
        ? `<span class="tip" data-tip='${burstTip}'>开启形态窗口</span>（无独立开场大伤）。${rawBurstMech ? '<br>' + rawBurstMech : ''}${burstFollow ? '<br>' + burstFollow : ''}`
        : `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${finalBurstMain}</b> 点</span>、副目标 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${finalBurstSide}</b> 点</span><b class="term-burst">${elem}伤害</b>。${rawBurstMech ? '<br>' + rawBurstMech : ''}${burstFollow ? '<br>' + burstFollow : ''}`
    });
    lines.push({
      icon: '🎵', name: `变奏技能 · ${cfg.varName || '上场袭击'}`, cost: '切换上场时触发',
      color: '#c39bff',
      desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">${elem}伤害</b>。${cfg.varMech ? '<br>' + cfg.varMech : ''}${varFollow ? '<br>' + varFollow : ''}`
    });

    return lines;
  };
}
