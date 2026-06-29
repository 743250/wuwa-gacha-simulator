// 声骸套装 5 件运行时触发
//
// 1.0 套装的 5 件条件型 bonus（elem_dmg_cond）在 stats.js 里按 ×0.5 折半计入面板，
// 旨在给玩家一个"基础估算值"。但战斗中条件触发的另一半（剩余 ×0.5）原本没运行时实现，
// 导致玩家看似激活 5 件但实际只拿一半增益。
//
// 这里在动作命中后调用 fireEchoSetTrigger，根据当前角色激活的 5 件条件型套装 cond
// 关键字匹配触发动作，给角色补足剩余 ×0.5 的元素伤害 buff（持续 3 回合 ≈ 官方 15 秒）。
//
// 只覆盖最常见、能稳定触发的 6 套（1.0 套装），其他依赖外部状态（dot/风蚀/光噪/暗涌）
// 或复杂条件（在场每 1.5 秒/协同/治疗延奏下角色）的套装仍走 stats.js 折半估算。

const TRIGGER_TURN_DURATION = 3; // 持续 3 回合 ≈ 官方 15 秒

// cond 触发关键字 → 战斗事件名 映射
// cond 文案参考 src/data/echoes.js 各套装 bonus5.cond
const COND_TRIGGER_MAP = [
  // 火套 fire 5件：技能命中后 持续15秒
  { match: /技能命中后.*持续/, event: 'skill_hit', elem: '热熔', stackable: false, setId: 'fire' },
  // 风套 wind 5件：变奏入场后 持续15秒
  { match: /变奏入场后.*持续/, event: 'variation_in', elem: '气动', stackable: false, setId: 'wind' },
  // 湮灭套 havoc 5件：使用解放后 持续15秒
  { match: /使用解放后.*持续/, event: 'burst_cast', elem: '湮灭', stackable: false, setId: 'havoc' },
  // 衍射套 spectro 5件：普攻命中 可叠2层
  { match: /普攻命中.*可叠2层/, event: 'normal_hit', elem: '衍射', stackable: true, maxStacks: 2, setId: 'spectro' },
  // 冷凝套 frost 5件：普攻或重击命中 可叠3层
  { match: /普攻或重击命中.*可叠3层/, event: 'normal_or_heavy_hit', elem: '冷凝', stackable: true, maxStacks: 3, setId: 'frost' },
  // 雷套 thunder 5件：重击/技能命中 可叠2层 各持续15秒
  { match: /重击\/技能命中.*可叠2层/, event: 'heavy_or_skill_hit', elem: '导电', stackable: true, maxStacks: 2, setId: 'thunder' },
  // 2.0 凝冽寒渊 frost_new 5件：释放技能后冷凝伤害+30%
  { match: /释放技能后冷凝伤害/, event: 'skill_hit', elem: '冷凝', stackable: false, setId: 'frost_new' },
];

/**
 * 在动作命中后激活对应 5 件条件型套装效果
 * @param {object} unit 当前出招的己方角色
 * @param {string} event 触发事件名：'normal_hit' | 'heavy_hit' | 'skill_hit' | 'burst_cast' | 'variation_in' | 'normal_or_heavy_hit' | 'heavy_or_skill_hit'
 * @param {object} battle battle 实例（用于记日志）
 */
export function fireEchoSetTrigger(unit, event, battle) {
  if (!unit?.echoStats?.setBonuses) return;
  for (const sb of unit.echoStats.setBonuses) {
    if (sb.tier !== 5) continue;
    if (sb.type !== 'elem_dmg_cond') continue;
    // 找到匹配此 cond 的 trigger 配置
    const trig = COND_TRIGGER_MAP.find(t => t.setId === sb.setId && t.event === event);
    if (!trig) continue;
    // 实际加成值 = bonus.value × 0.5（剩余的"运行时另一半"，stats.js 的 ×0.5 折半已计入基础面板）
    const bonusValue = sb.value * 0.5;
    applyEchoBuff(unit, trig, bonusValue, battle);
  }
}

function applyEchoBuff(unit, trig, bonusValue, battle) {
  if (!unit.buffs) unit.buffs = [];
  // 已有同源 buff 的话：叠层型 +1 层并刷新持续；非叠层型只刷新持续
  const src = `声骸套装·${trig.setId}`;
  let buff = unit.buffs.find(b => b.src === src && b.type === 'echoElemDmg' && b.element === trig.elem);
  if (buff) {
    if (trig.stackable) {
      buff.stacks = Math.min(trig.maxStacks || 1, (buff.stacks || 1) + 1);
      buff.value = bonusValue * buff.stacks;
    }
    buff.duration = TRIGGER_TURN_DURATION + 1; // 多 1 是因为 endTurn 末尾会先 -1
    return;
  }
  unit.buffs.push({
    type: 'echoElemDmg',
    element: trig.elem,
    value: bonusValue * (trig.stackable ? 1 : 1),
    stacks: 1,
    duration: TRIGGER_TURN_DURATION + 1,
    src,
  });
  battle?.log?.push({
    type: 'mechanic', src: unit.name,
    msg: `声骸套装 · ${trig.elem}伤害 +${(bonusValue * 100).toFixed(0)}%（持续 ${TRIGGER_TURN_DURATION} 回合）`
  });
}