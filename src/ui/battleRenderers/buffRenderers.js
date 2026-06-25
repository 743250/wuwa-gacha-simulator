// Buff 渲染器注册表
// 避免在 renderBuffStripe() 里堆砌 if (buf.type === '...') 分支。
// 新增 buff 类型时在这里加一条即可，不用改 battle.js。

function pct(v) { return `${(v * 100).toFixed(0)}%`; }

export const BUFF_RENDERERS = {
  burstWindow: {
    cls: 'burst', icon: '🔥',
    label(buf, t) { return `${t.name} 强化形态 +${pct(buf.value)}`; }
  },
  defense: {
    cls: 'def', icon: '🛡',
    label(buf, t) { return `${t.name} 减伤 ${pct(buf.value)}`; }
  },
  healUp: {
    cls: 'heal', icon: '💚',
    label(buf, t) { return `${t.name} 治疗效果 +${pct(buf.value)}`; }
  },
  critUp: {
    cls: 'crit', icon: '✦',
    label(buf, t) { return `全队 暴击 +${pct(buf.value)}`; }
  },
  cdmgUp: {
    cls: 'crit', icon: '✦',
    label(buf, t) { return `全队 暴伤 +${pct(buf.value)}`; }
  },
  atkUp: {
    cls: 'atk', icon: '⚔',
    label(buf, t) { return `全队 攻击 +${pct(buf.value)}`; }
  },
  field: {
    cls: 'field', icon: '🌐',
    label(buf, t) { return `${t.name} ${buf.label || '领域'}`; }
  },
  healOverTime: {
    cls: 'heal', icon: '💚',
    label(buf, t) { return `${buf.src || '领域'} 每回合回血 ${buf.value.toFixed(0)}`; }
  },
  heavyDmgUp: {
    cls: 'atk', icon: '⚔',
    label(buf, t) { return `全队 重击伤害 +${pct(buf.value)}`; }
  }
};

// TEAM_BUFF_TYPES: 去重白名单 — 全队 buff 只在 UI 显示一次
export const TEAM_BUFF_TYPES = new Set(['critUp', 'cdmgUp', 'atkUp', 'heavyDmgUp', 'healOverTime']);
