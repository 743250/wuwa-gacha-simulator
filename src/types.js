// JSDoc typedef 集散地 —— 纯类型注释,不参与运行时。
// VSCode / TS Language Server 会自动吃到,给编辑器带出类型提示。
// 加/改字段时同步这里,让引用方(combat.js / stats.js / battleRenderers) 拿到最新形状。

/**
 * 战斗内的一名角色单位。由 combat.js `createTeamUnit` 构造,存活于 `Battle.team` 数组。
 * @typedef {object} Unit
 * @property {string} name          角色名(中文,查 CHARACTERS 用)
 * @property {number} idx           队伍位置 0/1/2
 * @property {number} chain         已激活共鸣链数 0-6
 * @property {number} level         角色等级 1-90
 * @property {number} hp            当前生命
 * @property {number} hpMax         生命上限
 * @property {number} atk           攻击力(已算武器/声骸/共鸣链)
 * @property {number} def           防御力
 * @property {number} crate         暴击率 0-1
 * @property {number} cdmg          暴伤 0-∞,基线 0.5
 * @property {number} [dodge]       闪避率 0-1
 * @property {number} energy        当前解放能量 0-energyMax
 * @property {number} energyMax     解放能量上限(角色专属)
 * @property {string} element       六元素之一
 * @property {string} type          定位模板(输出/辅助/治疗/坦克)
 * @property {{skill:number, heavy:number}} cd 技能/重击 CD 剩余回合
 * @property {UnitBuff[]} buffs     增益列表
 * @property {UnitBuff[]} debuffs   减益/异常
 * @property {Record<string,number>} elemBonus  元素专项伤害加成
 * @property {number} elemAllBonus  全元素伤害加成
 * @property {number} normalBonus   普攻伤害加成
 * @property {number} skillBonus    技能伤害加成
 * @property {number} burstBonus    解放伤害加成
 * @property {number} heavyBonus    重击伤害加成
 * @property {number} healBonus     治疗量加成
 * @property {number} pierceDef     无视防御 0-1
 * @property {number} skillCdReduce 技能 CD 缩减(轮)
 * @property {number} resonanceBonus 共鸣效率(能量 / 协奏)
 * @property {string} weapon        装备武器名
 * @property {WeaponTrigger[]} weaponTriggers 武器被动触发器
 * @property {Record<string,any>} weaponStacks 触发器运行时叠层
 * @property {object} [echoStats]   声骸套装效果
 * @property {boolean} alive        是否存活
 * @property {number} frozenTurns   冰冻剩余回合
 * @property {number} skillLockedTurns 技能封锁剩余回合
 * @property {number} energyRefund  每回合能量返还
 * @property {number} concerto      协奏值 0-100
 * @property {number} forteStart    真实数值角色开局自带 forte 值
 * @property {number} ruiyi         忌炎「锐意之势」层数(其他角色 0)
 * @property {number} verdict       吟霖「审判值」0-100
 * @property {number} encoreDisorder 安可「失序值」0-100
 * @property {boolean} hasHeavy     是否 opt-in 重击
 * @property {object} [forte]       奏回路运行时状态(角色专属结构,由 forte.js 挂)
 * @property {boolean} _isPlayerUnit 玩家单位标记(区分召唤物)
 */

/**
 * @typedef {object} UnitBuff
 * @property {string} type       buff 类型键(atkUp / heavyDmgUp / skillDmgUp / burstDmgUp / wastes_heal / ...)
 * @property {number} value      数值(比例或绝对量)
 * @property {number} duration   剩余回合
 * @property {string} [src]      来源标注(共鸣链/武器/信物)
 */

/**
 * @typedef {object} WeaponTrigger
 * @property {string} on         触发时机('onAttack' / 'onSkill' / 'onBurst' / 'battleStart')
 * @property {string} type       效果类型
 * @property {number} [value]
 * @property {number} [max]      叠层上限
 */

/**
 * 一名敌人。由 enemies.js `spawnEnemy` 构造。
 * @typedef {object} Enemy
 * @property {string} name
 * @property {number} idx        敌人位 100+
 * @property {number} hp
 * @property {number} hpMax
 * @property {number} atk
 * @property {number} def
 * @property {string} [weakness] 弱点元素(命中 ×1.5)
 * @property {Record<string,number>} [resist] 元素抗性
 * @property {object} [mechanic] 敌人机制(周期/阈值/护盾/召唤)
 * @property {UnitBuff[]} [buffs]
 * @property {UnitBuff[]} [debuffs]
 * @property {boolean} alive
 */

/**
 * 一场战斗的运行时状态。由 `createBattle` / `startEncounter` 返回。
 * @typedef {object} Battle
 * @property {number} turn                   当前回合(1 起)
 * @property {number} ap                     本回合剩余 AP
 * @property {number} apMax                  每回合起始 AP(基线 4,信物可 +1)
 * @property {number} active                 当前出手队员 idx 0/1/2
 * @property {Unit[]} team                   我方队伍
 * @property {Enemy[]} enemies               敌方
 * @property {BattleLog[]} log               战斗日志
 * @property {boolean} finished              战斗是否结束
 * @property {'win'|'lose'|null} result
 * @property {number} initialHpTotal         用于评星的初始总血
 * @property {boolean} burstUsedThisTurn
 * @property {boolean} switchUsedThisTurn    每回合切人限 1
 * @property {Record<string,number>} burnTimer 持续效果计时
 * @property {Record<number,number>} freezeOn 冻结 { teamIdx: turnsLeft }
 * @property {object|null} wastesTokens      冥歌海墟信物效果
 * @property {Enemy[]} summons               玩家侧召唤物(非编队)
 */

/**
 * @typedef {object} BattleLog
 * @property {string} type     'system' | 'damage' | 'heal' | 'buff' | 'skill' | ...
 * @property {string} msg
 * @property {any}    [payload] 结构化附加数据
 */

/**
 * `startEncounter` 的参数结构。
 * @typedef {object} EncounterConfig
 * @property {string[]} team       3 名角色名,可含 null(空位)
 * @property {string[]} enemies    敌人名列表(全部必须在 ENEMIES 表)
 * @property {object}   [options]  createBattle 的 opts:enemyLevel / enemyScale / enemyScales / wastesTokens
 */

export {};
