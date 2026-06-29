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

// ============ 卡提希娅专属套装（流云逝尽之空 / 愿戴荣光之旅）运行时触发 ============
//
// 这两套不属于 elem_dmg_cond 范式，走单独触发：
//   - 流云逝尽之空 5 件：自身添加风蚀效应时 → 全队气动+15% / 自身额外+15%（20 秒 ≈ 4 回合）
//   - 愿戴荣光之旅 5 件：自身攻击命中带有风蚀效应的目标时 → 自身暴击+10% / 气动+30%（10 秒 ≈ 2 回合）
//
// 触发判断依据：unit.echoStats.setBonuses 中存在 tier=5 & setId 匹配 & 类型为 cartethyia_wind_team / cartethyia_glory_self
//
// 触发点 1（添加风蚀时）：由 cartethyia.js 的 cartethyiaApplyErosion 内部调用 fireEchoSetOnErosion
// 触发点 2（命中风蚀目标时）：由 combat.js 在普攻/技能/重击/解放命中带风蚀目标时调用 fireEchoSetOnHitErosion

const CARTETHYIA_WIND_DURATION = 4;     // 20 秒 ≈ 4 回合
const CARTETHYIA_GLORY_DURATION = 2;    // 10 秒 ≈ 2 回合

function unitHasFivePiece(unit, setId) {
  if (!unit?.echoStats?.setBonuses) return false;
  return unit.echoStats.setBonuses.some(sb => sb.tier === 5 && sb.setId === setId);
}

// 触发点 1：自身添加风蚀 → 全队气动 +15% / 自身额外 +15%
export function fireEchoSetOnErosion(self, battle) {
  if (!unitHasFivePiece(self, 'cartethyia_wind')) return;
  if (!battle?.team) return;

  const team = battle.team.filter(t => t && t.alive);
  const teamSrc = '声骸套装·cartethyia_wind';
  team.forEach(t => {
    if (!t.buffs) t.buffs = [];
    t.buffs = t.buffs.filter(b => b.src !== teamSrc || b.type !== 'echoElemDmg' || b.element !== '气动');
    t.buffs.push({
      type: 'echoElemDmg',
      element: '气动',
      value: 0.15,
      duration: CARTETHYIA_WIND_DURATION + 1,
      src: teamSrc,
    });
  });
  // 自身额外 +15%（叠加在团队 buff 之上，单独标记以便不复用同 src）
  const selfSrc = '声骸套装·cartethyia_wind_self';
  self.buffs = (self.buffs || []).filter(b => b.src !== selfSrc);
  self.buffs.push({
    type: 'echoElemDmg',
    element: '气动',
    value: 0.15,
    duration: CARTETHYIA_WIND_DURATION + 1,
    src: selfSrc,
  });
  battle?.log?.push({
    type: 'mechanic', src: self.name,
    msg: `声骸套装 · 流云逝尽之空：全队气动 +15% / 自身额外 +15%（持续 ${CARTETHYIA_WIND_DURATION} 回合）`
  });
}

// 触发点 2：攻击命中带有风蚀效应的目标 → 自身暴击 +10% / 气动 +30%
export function fireEchoSetOnHitErosion(self, target, battle) {
  if (!unitHasFivePiece(self, 'cartethyia_glory')) return;
  if (!target || !(target.cartethyiaErosion > 0)) return;

  const src = '声骸套装·cartethyia_glory';
  self.buffs = (self.buffs || []).filter(b => b.src !== src);
  self.buffs.push({
    type: 'echoElemDmg',
    element: '气动',
    value: 0.30,
    duration: CARTETHYIA_GLORY_DURATION + 1,
    src,
  });
  self.buffs.push({
    type: 'crateUp',
    value: 0.10,
    duration: CARTETHYIA_GLORY_DURATION + 1,
    src,
  });
  battle?.log?.push({
    type: 'mechanic', src: self.name,
    msg: `声骸套装 · 愿戴荣光之旅：自身暴击 +10% / 气动 +30%（持续 ${CARTETHYIA_GLORY_DURATION} 回合）`
  });
}
// ============ 角色专属声骸套装（2.0+，encore.moe ID 10/11/18/23/27/28/30/31）运行时触发 ============
//
// 模拟器原则：不复刻鸣潮真实玩法（光噪/虚湮/聚爆/霜渐/谐度偏移 整套 debuff 状态机不实现）。
// 这里采取"动作命中即激活"的简化路径——5 件激活后，对应事件触发即给角色补足加成 buff，
// 持续时间按官方秒数换算回合约（1 回合 ≈ 5 秒）。
//
// 全部新套装的 stats.js setBonusToBonus 均返回 null（不进静态面板），由运行时触发统一提供加成。

const CHAR_SET_DURATION = {
  carlotta_skill:     3,    // 15s
  carlotta_burst:     1,    // 5s
  phoebe_lightnoise:  3,    // 15s
  phoebe_hit10:       3,    // 15s
  brant_burst:        7,    // 35s
  cantarella_void:    1,    // 5s
  brant_path:         2,    // 8s
  brant_mottle:       3,    // 15s
  brant_mottle_next:  3,    // 15s
  feixue_snow:        3,    // 15s / 11s 落雪 / 6s 爆发 / 15s 接力 简化为 3 回合
  lumera_chord:       6,    // 30s
};

function hasFivePiece(unit, setId) {
  if (!unit?.echoStats?.setBonuses) return false;
  return unit.echoStats.setBonuses.some(sb => sb.tier >= 5 && sb.setId === setId);
}

function pushBuff(unit, buff, srcKey) {
  if (!unit.buffs) unit.buffs = [];
  // 同源不叠加（除非显式 stackable）：刷持续
  const existing = unit.buffs.find(b => b.src === srcKey && b.type === buff.type && (buff.element == null || b.element === buff.element));
  if (existing) {
    existing.duration = buff.duration;
    existing.value = buff.value; // 刷新数次 buff 维持原值（叠层机制此处不实装）
    return;
  }
  unit.buffs.push({ ...buff, src: srcKey });
}

// ID 10 · 凌冽决断之心（珂莱塔）
//   - 共鸣技能命中 → 自身冷凝 +22.5% (3回合)
//   - 解放释放 → 共鸣技能 +18% (1回合, 官方可叠2层, 此处简化为不叠)
export function fireCarlottaSkill(unit, event, battle) {
  if (!hasFivePiece(unit, 'carlotta_skill')) return;
  if (event === 'skill_hit') {
    pushBuff(unit, { type: 'echoElemDmg', element: '冷凝', value: 0.225, duration: CHAR_SET_DURATION.carlotta_skill + 1 }, '声骸·carlotta_skill');
    battle?.log?.push({ type: 'mechanic', src: unit.name, msg: `声骸 · 凌冽决断之心：冷凝伤害 +22.5%（${CHAR_SET_DURATION.carlotta_skill} 回合）` });
  } else if (event === 'burst_cast') {
    pushBuff(unit, { type: 'skillDmgUp', value: 0.18, duration: CHAR_SET_DURATION.carlotta_burst + 1 }, '声骸·carlotta_skill_b');
    battle?.log?.push({ type: 'mechanic', src: unit.name, msg: `声骸 · 凌冽决断之心：共鸣技能伤害 +18%（${CHAR_SET_DURATION.carlotta_burst} 回合）` });
  }
}

// ID 11 · 此间永驻之光（菲比）
//   - 添加光噪效应时 → 暴击 +20% (3回合)
//   - 命中带有10层光噪目标时 → 衍射 +15% (3回合)
//   简化：不实装光噪 debuff，普攻/技能/重击命中直接触发暴击 buff；
//   若目标已存在 lightnoise debuff 则同时触发光噪衍射 buff。
export function firePhoebeLightnoise(unit, target, battle, event) {
  if (!hasFivePiece(unit, 'phoebe_lightnoise')) return;
  if (event !== 'normal_hit' && event !== 'skill_hit' && event !== 'heavy_hit') return;
  pushBuff(unit, { type: 'crateUp', value: 0.20, duration: CHAR_SET_DURATION.phoebe_lightnoise + 1 }, '声骸·phoebe_lightnoise');
  if (target?.debuffs?.some?.(d => d.type === 'lightnoise') || target?.phoebeLightnoise) {
    pushBuff(unit, { type: 'echoElemDmg', element: '衍射', value: 0.15, duration: CHAR_SET_DURATION.phoebe_hit10 + 1 }, '声骸·phoebe_lightnoise_10');
  }
  battle?.log?.push({ type: 'mechanic', src: unit.name, msg: `声骸 · 此间永驻之光：自身暴击 +20%${target?.phoebeLightnoise ? ' / 衍射 +15%' : ''}（持续 ${CHAR_SET_DURATION.phoebe_lightnoise} 回合）` });
}

// ID 18 · 奔狼燎原之焰（布兰特）
//   - 解放释放 → 全队热熔 +15% / 自身解放 +20% (7回合 ≈ 35s)
export function fireBrantBurst(unit, battle) {
  if (!hasFivePiece(unit, 'brant_burst')) return;
  if (!battle?.team) return;
  const team = battle.team.filter(t => t && t.alive);
  team.forEach(t => {
    pushBuff(t, { type: 'echoElemDmg', element: '热熔', value: 0.15, duration: CHAR_SET_DURATION.brant_burst + 1 }, '声骸·brant_burst_team');
  });
  pushBuff(unit, { type: 'burstDmgUp', value: 0.20, duration: CHAR_SET_DURATION.brant_burst + 1 }, '声骸·brant_burst_self');
  battle?.log?.push({ type: 'mechanic', src: unit.name, msg: `声骸 · 奔狼燎原之焰：全队热熔 +15% / 自身解放 +20%（${CHAR_SET_DURATION.brant_burst} 回合）` });
}

// ID 23 · 命理崩毁之弦（坎特蕾拉，3 件套结构）
//   - 添加虚湮效应 → 攻击 +20% / 解放 +30% (1回合 ≈ 5s)
export function fireCantarellaVoid(unit, event, battle) {
  if (!unit?.echoStats?.setBonuses?.some(sb => sb.tier === 3 && sb.setId === 'cantarella_void')) return;
  if (event !== 'skill_hit' && event !== 'normal_hit' && event !== 'heavy_hit') return;
  pushBuff(unit, { type: 'atkUp', value: 0.20, duration: CHAR_SET_DURATION.cantarella_void + 1 }, '声骸·cantarella_void');
  pushBuff(unit, { type: 'burstDmgUp', value: 0.30, duration: CHAR_SET_DURATION.cantarella_void + 1 }, '声骸·cantarella_void_b');
  battle?.log?.push({ type: 'mechanic', src: unit.name, msg: `声骸 · 命理崩毁之弦：攻击 +20% / 解放 +30%（${CHAR_SET_DURATION.cantarella_void} 回合）` });
}

// ID 27 · 长路启航之星（布兰特）
//   - 添加聚爆/震谐偏移 → 暴击 +20% / 热熔 +20% (2回合 ≈ 8s)
export function fireBrantPath(unit, event, battle) {
  if (!hasFivePiece(unit, 'brant_path')) return;
  if (event !== 'normal_hit' && event !== 'skill_hit' && event !== 'heavy_hit') return;
  pushBuff(unit, { type: 'crateUp', value: 0.20, duration: CHAR_SET_DURATION.brant_path + 1 }, '声骸·brant_path_c');
  pushBuff(unit, { type: 'echoElemDmg', element: '热熔', value: 0.20, duration: CHAR_SET_DURATION.brant_path + 1 }, '声骸·brant_path_d');
  battle?.log?.push({ type: 'mechanic', src: unit.name, msg: `声骸 · 长路启航之星：暴击 +20% / 热熔 +20%（${CHAR_SET_DURATION.brant_path} 回合）` });
}

// ID 28 · 斑驳粉饰之沫（布兰特）
//   - 添加聚爆 → 热熔 +10% (3回合)
//   - 持续期间延奏后下一位变奏登场角色热熔 +25% (3回合)
//   简化：命中时直接给自身热熔 +10%，并在变奏入场时给入场角色热熔 +25%。
export function fireBrantMottle(unit, event, battle) {
  if (!hasFivePiece(unit, 'brant_mottle')) return;
  if (event !== 'normal_hit' && event !== 'skill_hit' && event !== 'heavy_hit') return;
  pushBuff(unit, { type: 'echoElemDmg', element: '热熔', value: 0.10, duration: CHAR_SET_DURATION.brant_mottle + 1 }, '声骸·brant_mottle_self');
  unit._brantMottleActive = true;
  battle?.log?.push({ type: 'mechanic', src: unit.name, msg: `声骸 · 斑驳粉饰之沫：自身热熔 +10%（${CHAR_SET_DURATION.brant_mottle} 回合），延奏退场期间下位接力热熔 +25% 已备` });
}

// 变奏入场侧：检查入场角色上一位是否带 brant_mottle，再 +25% 热熔
export function fireBrantMottleNext(self, prevUnit, battle) {
  if (!self || !prevUnit) return;
  if (!prevUnit._brantMottleActive) return;
  if (!prevUnit.echoStats?.setBonuses?.some(sb => sb.tier >= 5 && sb.setId === 'brant_mottle')) return;
  pushBuff(self, { type: 'echoElemDmg', element: '热熔', value: 0.25, duration: CHAR_SET_DURATION.brant_mottle_next + 1 }, '声骸·brant_mottle_next');
  battle?.log?.push({ type: 'mechanic', src: self.name, msg: `声骸 · 斑驳粉饰之沫接力：自身热熔 +25%（${CHAR_SET_DURATION.brant_mottle_next} 回合）` });
}

// ID 30 · 雪落无声之愿（绯雪）
//   简化：技能命中 → 冷凝 +10% / 自身 +【落雪】标记 3回合；
//   后续解放 → 暴击 +25%；或后续延奏退场 → 下位冷凝 +25%。
export function fireFeixueSnow(unit, event, battle) {
  if (!hasFivePiece(unit, 'feixue_snow')) return;
  if (event !== 'skill_hit' && event !== 'normal_hit' && event !== 'heavy_hit') return;
  pushBuff(unit, { type: 'echoElemDmg', element: '冷凝', value: 0.10, duration: CHAR_SET_DURATION.feixue_snow + 1 }, '声骸·feixue_snow_d');
  unit._feixueSnow = true;
  battle?.log?.push({ type: 'mechanic', src: unit.name, msg: `声骸 · 雪落无声之愿：冷凝 +10% / 落雪已备（${CHAR_SET_DURATION.feixue_snow} 回合）` });
}

// 落雪 + 解放 → 暴击 +25% (2回合 ≈ 6s 简化)
export function fireFeixueSnowBurst(unit, battle) {
  if (!unit || !unit._feixueSnow) return;
  if (!hasFivePiece(unit, 'feixue_snow')) return;
  pushBuff(unit, { type: 'crateUp', value: 0.25, duration: 2 + 1 }, '声骸·feixue_snow_burst');
  unit._feixueSnow = false;
  battle?.log?.push({ type: 'mechanic', src: unit.name, msg: `声骸 · 雪落无声之愿爆发：清除落雪 → 暴击 +25%（2 回合）` });
}

// 落雪 + 延奏 → 下一位变奏登场角色冷凝 +25% (3回合)
export function fireFeixueSnowNext(self, prevUnit, battle) {
  if (!self || !prevUnit) return;
  if (!prevUnit._feixueSnow) return;
  if (!hasFivePiece(prevUnit, 'feixue_snow')) return;
  pushBuff(self, { type: 'echoElemDmg', element: '冷凝', value: 0.25, duration: CHAR_SET_DURATION.feixue_snow + 1 }, '声骸·feixue_snow_next');
  prevUnit._feixueSnow = false;
  battle?.log?.push({ type: 'mechanic', src: self.name, msg: `声骸 · 雪落无声之愿接力：清除落雪 → 下位冷凝 +25%（${CHAR_SET_DURATION.feixue_snow} 回合）` });
}

// ID 31 · 剪心辑梦之影（洛瑟菈）—— 全队谐度破坏增幅 +20 点（30s ≈ 6回合）
//   简化：当地震谐/集谐偏移无法实装，触发时机简化为「命中即触发」全队 buff。
//   模拟器无「谐度破坏增幅」字段，演化为：全队全元素伤害 +15%（数值近似 20点增幅 → 15% elemAllUp）
export function fireLumeraChord(unit, event, battle) {
  if (!hasFivePiece(unit, 'lumera_chord')) return;
  if (event !== 'normal_hit' && event !== 'skill_hit') return;
  if (!battle?.team) return;
  battle.team.filter(t => t && t.alive).forEach(t => {
    pushBuff(t, { type: 'elemAllUp', value: 0.15, duration: CHAR_SET_DURATION.lumera_chord + 1 }, '声骸·lumera_chord');
  });
  battle?.log?.push({ type: 'mechanic', src: unit.name, msg: `声骸 · 剪心辑梦之影：全队对应谐度增幅（+15% 全元素伤害，${CHAR_SET_DURATION.lumera_chord} 回合）` });
}

// 分发器：在普攻/技能/重击/解放/变奏入场后调用，统一派发所有角色专属套装触发
export function fireRoleEchoTriggers(unit, event, target, battle, prevUnit = null) {
  switch (event) {
    case 'normal_hit':
    case 'heavy_hit':
    case 'skill_hit':
      fireCarlottaSkill(unit, 'skill_hit' === event ? 'skill_hit' : ('heavy_hit' === event ? 'heavy_hit' : 'normal_hit'), battle);
      firePhoebeLightnoise(unit, target, battle, event);
      fireCantarellaVoid(unit, event, battle);
      fireBrantPath(unit, event, battle);
      fireBrantMottle(unit, event, battle);
      fireFeixueSnow(unit, event, battle);
      fireLumeraChord(unit, event, battle);
      break;
    case 'burst_cast':
      fireCarlottaSkill(unit, 'burst_cast', battle);
      fireBrantBurst(unit, battle);
      fireFeixueSnowBurst(unit, battle);
      break;
    case 'variation_in':
      if (prevUnit) {
        fireBrantMottleNext(unit, prevUnit, battle);
        fireFeixueSnowNext(unit, prevUnit, battle);
      }
      break;
  }
}
