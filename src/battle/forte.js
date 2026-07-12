// 共鸣回路（Forte Circuit）
// 数据校准（2026-06，第三轮联网 AI）：
//   每个角色独有的资源条/状态机制，是角色差异化核心
//   AI 警告："不要把简化描述当官方技能原文"，这里全部走简化建模
//
// 设计：每个角色一个 forte 配置
//   - kind: 'gauge' (资源条积累) / 'stacks' (层数) / 'state' (形态切换) / 'threshold' (阈值)
//   - resourceName: UI 显示名
//   - max: 满值
//   - gainPerSkill: 每次技能积累多少
//   - gainPerNormal: 每次普攻积累多少
//   - gainPerBurst: 解放给多少
//   - effectAtFull: 满值时的效果说明（战斗中可触发）
//   - effectType: 满值效果实际类型（影响战斗逻辑）

import { S } from '../state.js';

export const FORTE = {
  // ===== 第三轮 AI 校准的 10 个重点角色 =====
  '忌炎': {
    kind: 'gauge', resourceName: '破阵值', max: 100,
    gainPerNormal: 12, gainPerSkill: 25, gainPerBurst: 40,
    effectType: 'enhancedNormal',  // 满后下一次普攻强化（大范围长枪连段）
    effectMult: 2.0,
    desc: '攒满破阵值后，下次普攻进入强化形态（×2 段伤害）'
  },
  '今汐': {
    kind: 'stacks', resourceName: '韶光层数', max: 4,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 2,
    effectType: 'enhancedSkill',
    effectMult: 1.8,
    desc: '韶光满层时共鸣技能进入强化形态（×1.8 伤害）'
  },
  '长离': {
    // 离火由 combat.js 的 changliGainLihuo 专门控制（含心眼进出 + 每层 +5% 热熔），
    // 故通用 gainForte 全部置 0，避免双算（同安可失序值做法）。
    kind: 'stacks', resourceName: '离火', max: 6,
    gainPerNormal: 0, gainPerSkill: 0, gainPerBurst: 0, gainPerHeavy: 0,
    effectType: 'mindEye',
    desc: '普攻/技能/重击各 +1 离火、解放 +3；每层离火 +5% 热熔伤害；满 6 层进入心眼模式（攻击键变身、离火抵 AP）'
  },
  '守岸人': {
    kind: 'gauge', resourceName: '协奏', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 30,
    effectType: 'shorekeeperField',           // 仅作 UI 标识，实际效果在 doBurst 里
    desc: '共鸣解放·终末回环展开「星域」：全队每回合回血 + 暴击 +20% + 暴伤 +30%（3 回合）。守岸人是治疗位，所有共鸣链都用来加强星域'
  },
  '椿': {
    kind: 'gauge', resourceName: '红椿·蕊', max: 100,
    gainPerNormal: 10, gainPerSkill: 15, gainPerBurst: 30,
    effectType: 'chunHanbao',
    desc: '红椿·蕊满 100 + 协奏 ≥ 50 时共鸣技能替换为永生花；永生花消耗 50 蕊 + 50 协奏进入含苞 3 回合（普攻/技能 ×1.5，6 链 ×2.5）'
  },
  '珂莱塔': {
    kind: 'stacks', resourceName: '晶体层数', max: 5,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 2,
    effectType: 'enhancedSkill',
    effectMult: 2.0,
    desc: '晶体满层强化共鸣技能（×2.0 冷凝爆发）'
  },
  '菲比': {
    kind: 'state', resourceName: '衍射形态', max: 1,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 0,
    effectType: 'toggleForm',
    effectMult: 1.5,
    desc: '使用技能切换衍射形态，普攻附带衍射状态（×1.5 元素伤害）'
  },
  '卡提希娅': {
    kind: 'stacks', resourceName: '决意', max: 3,
    gainPerNormal: 1, gainPerSkill: 1, gainPerBurst: 0,
    effectType: 'resolveBuff',
    effectMult: 0.10,
    desc: '普攻/重击/共鸣技能获得 1 层【决意】（上限 3 层），每层气动伤害 +10%，持续 2 回合。满决意时共鸣解放消耗全部决意获得形态之力进入芙露德莉斯形态。'
  },
  '嘉贝莉娜': {
    kind: 'threshold', resourceName: '猎杀阈值', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'enhancedBurst',
    effectMult: 1.6,
    desc: '阈值满时共鸣解放伤害 ×1.6'
  },
  '赞妮': {
    kind: 'gauge', resourceName: '焰光', max: 100,
    // 焰光由 zanyan.js 状态机控制（进灼焰 +50 / 每回合 +10 / 重斩 -20），通用 gainForte 全部置 0
    gainPerNormal: 0, gainPerSkill: 0, gainPerBurst: 0, gainPerHeavy: 0,
    effectType: 'zanYanBlaze',
    desc: '焰光上限 100。共鸣解放·重燃进入灼焰形态 3 回合（+50 焰光，每回合 +10），期间普攻替换为重斩（HP×12%，消耗 20 焰光）。形态结束自动施放终绝将至之刻（HP×20%，3 链按消耗焰光 +2%/点 最多 +200%）。'
  },
  '仇远': {
    kind: 'gauge', resourceName: '挑灯问剑', max: 100,
    // 挑灯问剑由 chouyuan.js 状态机精确控制（攻+10/技能+25/解放+40/变奏+5，
    // 非当前角色-5/回合），故通用 gainForte 置 0 避免双算
    gainPerNormal: 0, gainPerSkill: 0, gainPerBurst: 0, gainPerHeavy: 0,
    effectType: 'chouyuanDrunk',
    desc: '挑灯问剑上限 100。满值时进入<b class="term-resource">淋漓醉墨</b> 2 回合，<b class="term-resource">重击</b>替换为<b class="term-resource">答剑三连</b>（atk×550% 气动），退出时清空。<br>首次进入发<b class="term-resource">且从容</b>（答剑三连×1.5，每场 1 次）；同时触发<b class="term-resource">竹照</b>全队全属性伤害+30%（3 回合）。'
  },
  '千咲': {
    kind: 'gauge', resourceName: '锯环残响', max: 100,
    // 锯环残响由 qianxiao.js 状态机精确控制（普攻+10/技能+25/锯环疾攻每段+12）
    gainPerNormal: 0, gainPerSkill: 0, gainPerBurst: 0, gainPerHeavy: 0,
    effectType: 'qianxiaoStack',
    desc: '锯环残响上限 100。残响满 100 时共鸣技能替换为<b class="term-resource">齿轨轮回</b>（消耗全部残响，进入电锯模式 3 回合）。电锯模式下普攻替换为<b class="term-resource">锯环·疾攻</b>（3 段，HP×5.3%×3=HP×15.9%，每段+12残响），残响再次满 100 时普攻替换为<b class="term-resource">锯环·终结</b>（消耗全部残响，退出电锯模式）。'
  },
  '弗洛洛': {
    kind: 'gauge', resourceName: '余响', max: 24,
    // 余响由 frolo.js 状机控制（普攻+3/技能+5/重击+4/变奏+2/谱曲终末+6/赫卡忒自动+2/强化+3/战斗开始+10）
    gainPerNormal: 0, gainPerSkill: 0, gainPerBurst: 0, gainPerHeavy: 0,
    effectType: 'furoloEchoes',
    desc: '余响上限 24 层。每层使谱曲终末倍率线性 +60%（2 链 +105%）；每层暴伤 +2.5%（固有·八重）。战斗开始 +10 层。'
  },
  '夏空': {
    kind: 'stacks', resourceName: '音律', max: 3,
    gainPerNormal: 0, gainPerSkill: 0, gainPerBurst: 0, gainPerHeavy: 0,
    effectType: 'xiakongHeavy',
    desc: '音律（0-3）：普攻第 4 段 / 变奏入场 +1 音律，满 3 格时普攻自动替换为四拍重奏（atk×200% 气动，牵引 + 叠风蚀）'
  },
  '露帕': {
    kind: 'gauge', resourceName: '狼焰', max: 100,
    gainPerNormal: 10, gainPerSkill: 15, gainPerBurst: 100, gainPerHeavy: 20,
    effectType: 'enhancedBurst',
    effectMult: 3.2,
    desc: '普攻+10/技能+15/重击+20/解放全满。满100时共鸣技能替换为狼舞·决意·极（atk×320%热熔，视为共鸣解放伤害；链4+125%=×720%）并消耗全部狼焰'
  },
  '安可': {
    kind: 'gauge', resourceName: '失序值', max: 100,
    // 安可失序值由 combat.js 的 encoreGainDisorder 专门控制，避免 generic gainForte 双算
    gainPerNormal: 0, gainPerSkill: 0, gainPerBurst: 0, gainPerHeavy: 0,
    effectType: 'encoreDisorder',
    effectMult: 1.0,
    desc: '普攻/技能/变奏积攒失序值，满 100 时重击触发白咩·失控之炎；黑咩大暴走期间触发黑咩·暴走之炎'
  },
  '卡卡罗': {
    kind: 'state', resourceName: '杀意', max: 100,
    gainPerNormal: 5, gainPerSkill: 15, gainPerBurst: 100,  // 解放期间杀意拉满
    effectType: 'burstWindow',
    effectMult: 1.5,
    desc: '解放期间进入 Deathblade 形态，普攻/技能伤害 +50%'
  },

  // ── 限定 5★（补）──
  '吟霖': {
    kind: 'gauge', resourceName: '审判值', max: 100,
    gainPerNormal: 15, gainPerSkill: 30, gainPerBurst: 40,
    effectType: 'judgmentMark',
    effectMult: 1.0,
    desc: '满审判值触发审判之雷，给主目标挂审判印记（3 层上限，命中印记目标增伤）'
  },
  '折枝': {
    kind: 'gauge', resourceName: '墨韵', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 1.8,
    desc: '墨韵满时共鸣技能强化，召唤墨鹤协同攻击（×1.8）'
  },
  '相里要': {
    kind: 'gauge', resourceName: '衍构', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'burstWindow',
    effectMult: 1.5,
    desc: '满衍构时进入「思维矩阵」，攻击/技能伤害 +50%，持续 2 回合'
  },
  '洛可可': {
    kind: 'gauge', resourceName: '想象力', max: 100,
    gainPerNormal: 8, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedBurst',
    effectMult: 1.6,
    desc: '想象力满时共鸣解放「即兴喜剧」伤害 ×1.6'
  },
  '布兰特': {
    kind: 'gauge', resourceName: '航路', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'enhancedBurst',
    effectMult: 1.6,
    desc: '航路满时「火焰归亡曲」伤害 +60% + 全队治疗'
  },
  '坎特蕾拉': {
    kind: 'gauge', resourceName: '迷离', max: 100,
    gainPerNormal: 8, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedBurst',
    effectMult: 1.8,
    desc: '迷离满时进入「蜃境」，解放伤害 ×1.8'
  },

  // ── 常驻 5★（补）──
  '维里奈': {
    kind: 'gauge', resourceName: '光合', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'healField',
    effectMult: 0.8,
    desc: '光合满时展开持续治疗领域（3 回合，每回合恢复 atk×80%）'
  },
  '凌阳': {
    kind: 'gauge', resourceName: '狮势', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 40,
    effectType: 'burstWindow',
    effectMult: 1.3,
    desc: '狮势满时进入「狮子奋迅」，普攻 +20% / 技能 +10%，持续 2 回合'
  },
  '鉴心': {
    kind: 'gauge', resourceName: '气', max: 100,
    gainPerNormal: 12, gainPerSkill: 25, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 2.0,
    desc: '气满时「行气反击」伤害 ×2.0'
  },

  // ── 2.6 限定 ──
  '奥古斯塔': {
    kind: 'stacks', resourceName: '以众愿为冕', max: 1,
    gainPerNormal: 0, gainPerSkill: 0, gainPerBurst: 0, gainPerHeavy: 0,
    effectType: 'aogusitaBurst',
    desc: '【以众愿为冕】（层数型）上限1层（C0→2/C6→4），每层导电伤害+15%/暴伤+15%（C1）/暴击+20%（C2）。仅延奏获得（C0）；C1+变奏/技能/重击也可获得。赫日威临结束时清零。<br>【威慑】（阈值型）上限2层。非战斗开始补至1层，延奏+1层。消耗2层释放赫日威临。'
  },
  '尤诺': {
    kind: 'gauge', resourceName: '灵性', max: 100,
    gainPerNormal: 0, gainPerSkill: 0, gainPerBurst: 0, gainPerHeavy: 0,
    effectType: 'younuoMoon',
    effectMult: 1.0,
    desc: '灵性（0-100）：普攻+12（月相流转+20）、共鸣技能+25、变奏+15、解放+40。满100时进入月相流转状态，展开满月领域3回合，解锁重击·至臻的完满。至臻完满施放后清空灵性。'
  },

  // ── 4★ ──
  '丹瑾': {
    kind: 'gauge', resourceName: '彤华', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 1.7,
    desc: '彤华满时共鸣技能伤害 ×1.7（消耗彤华触发缭乱/纷落）'
  },
  '炽霞': {
    kind: 'stacks', resourceName: '热压弹', max: 60,
    gainPerNormal: 3, gainPerSkill: 10, gainPerBurst: 60,
    effectType: 'enhancedBurst',
    effectMult: 1.5,
    desc: '热压弹满 60 时共鸣解放伤害 ×1.5（加麻加辣满层额外攻击 +30%）'
  },
  '秋水': {
    kind: 'gauge', resourceName: '迷雾', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 25,
    effectType: 'enhancedSkill',
    effectMult: 1.6,
    desc: '迷雾满时共鸣技能·雾化子弹伤害 ×1.6（潜行状态气动 +25%）'
  },
  '渊武': {
    kind: 'gauge', resourceName: '雷势', max: 100,
    gainPerNormal: 10, gainPerSkill: 15, gainPerBurst: 30,
    effectType: 'enhancedBurst',
    effectMult: 1.5,
    desc: '雷势满时共鸣解放伤害 ×1.5（雷之楔在场额外 +50%）'
  },
  '桃祈': {
    kind: 'gauge', resourceName: '守势', max: 100,
    gainPerNormal: 8, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 1.6,
    desc: '守势满时「攻防转换」伤害 ×1.6 + 获得护盾'
  },
  '散华': {
    kind: 'gauge', resourceName: '冰棘', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedHeavy',
    effectMult: 1.8,
    desc: '冰棘满时重击·爆裂伤害 ×1.8（引爆冰棱/冰川范围伤害）'
  },
  '秧秧': {
    kind: 'gauge', resourceName: '流息', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 25,
    effectType: 'enhancedSkill',
    effectMult: 1.6,
    desc: '流息满时共鸣技能伤害 ×1.6（风场牵引范围扩大）'
  },
  '莫特斐': {
    kind: 'gauge', resourceName: '音律', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 30,
    effectType: 'enhancedBurst',
    effectMult: 1.5,
    desc: '音律满时共鸣解放伤害 ×1.5（浮翼狂想持续期间加强音协同）'
  },
  '白芷': {
    kind: 'stacks', resourceName: '念意', max: 4,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 2,
    effectType: 'enhancedHeal',
    effectMult: 1.5,
    desc: '念意满 4 层时治疗加成 ×1.5（消耗念意触发频隙回响强化）'
  },
  '釉瑚': {
    kind: 'gauge', resourceName: '奇珍', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'enhancedSkill',
    effectMult: 1.6,
    desc: '奇珍满时共鸣技能伤害 ×1.6（霁青层数额外暴伤）'
  },
  '灯灯': {
    kind: 'gauge', resourceName: '光能', max: 100,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 1.7,
    desc: '光能满时「强光穿射」伤害 ×1.7（快件已签收）'
  },
  '卜灵': {
    kind: 'gauge', resourceName: '符法', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 25,
    effectType: 'enhancedHeal',
    effectMult: 1.5,
    desc: '符法满时治疗加成 ×1.5（五雷荡煞阵 + 三才合一强化）'
  },

  // ── 3.0-3.4 限定 5★ ──
  '琳奈': {
    // 溢彩为主资源条（满 100 时重击替换为灵感碰撞蓄力爆发，倍率随流光百分比线性放大）
    kind: 'gauge', resourceName: '溢彩', max: 100,
    gainPerNormal: 15, gainPerSkill: 25, gainPerBurst: 50,
    effectType: 'enhancedHeavy',
    effectMult: 4.0,
    desc: '溢彩满 100 时<b class="term-resource">重击</b>替换为<b class="term-resource">灵感碰撞</b>蓄力，按当前 <b class="term-resource">【流光】</b> 百分比线性放大伤害（满流光 atk×400%）。施放后清空流光，进入<b class="term-resource">绮彩巡游</b> 3 回合。'
  },
  '莫宁': {
    // 协奏能量（175 上限，比通用角色更多）+ 干涉标记 / 谐振场
    kind: 'gauge', resourceName: '协奏能量', max: 175,
    gainPerNormal: 10, gainPerSkill: 25, gainPerBurst: 60,
    effectType: 'enhancedBurst',
    effectMult: 1.6,
    desc: '协奏能量上限 175（较通用角色更多）。普攻/技能给目标附加<b class="term-resource">干涉标记</b>，莫宁对干涉目标伤害 +15%。共鸣解放·临界协议展开<b class="term-resource">谐振场</b>，全队偏谐值累积效率 +20%。'
  },
  '爱弥斯': {
    // 同步率满 100 时共鸣技能替换为光翼共奏（视为共鸣解放伤害）
    kind: 'gauge', resourceName: '同步率', max: 100,
    gainPerNormal: 10, gainPerSkill: 25, gainPerBurst: 50, gainPerHeavy: 30,
    effectType: 'enhancedSkill',
    effectMult: 4.0,
    desc: '同步率上限 100。普攻+10/技能+25/重击+30/解放+50。<b class="term-resource">【同步率】</b>满 100 时共鸣技能替换为<b class="term-resource">光翼共奏</b>（atk×400% 导电 AOE，视为共鸣解放伤害）。震谐模态附加震谐轨迹，聚爆模态引爆聚爆效应。'
  },
  '陆·赫斯': {
    // 谐度破坏增幅辅助，满值共鸣解放 +60%（2链）
    kind: 'gauge', resourceName: '谐度', max: 100,
    gainPerNormal: 8, gainPerSkill: 18, gainPerBurst: 35,
    effectType: 'enhancedBurst',
    effectMult: 1.6,
    desc: '攻击累积<b class="term-resource">谐度</b>。满 100 时共鸣解放·于永冻中释义触发<b class="term-resource">黄金的裁量</b>，伤害 ×1.6（2 链 +60%=×2.56）。攻击附加集谐·偏移，谐度破坏触发后转化为集谐·干涉，干涉层数决定全队伤害加深。'
  },
  '西格莉卡': {
    // 凝语层数 + 「天赋？」层数，强化共鸣回路·我即语义
    kind: 'stacks', resourceName: '凝语', max: 3,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 0, gainPerHeavy: 1,
    effectType: 'enhancedSkill',
    effectMult: 2.2,
    desc: '凝语上限 3 层（1 链 +1）。普攻/技能写入符文（红/蓝/黄语义），重击消耗符文组合释放<b class="term-resource">我即语义</b>爆发（atk×220% 衍射 AOE）。每层<b class="term-resource">「天赋？」</b>使符语系列伤害+15%（6 链至多 +60%）+ 无视 7.5% 防御（至多 30%）。'
  },
  '绯雪': {
    // 心念 + 寒意 + 雪锈 stacks；满心念 300 解锁重击·寒簇·常世身
    kind: 'gauge', resourceName: '心念', max: 300,
    gainPerNormal: 30, gainPerSkill: 60, gainPerBurst: 100, gainPerHeavy: 50,
    effectType: 'enhancedHeavy',
    effectMult: 2.0,
    desc: '<b class="term-resource">心念</b>上限 300。满值时解锁<b class="term-resource">重击·寒簇·常世身</b>（atk×200% 冷凝 AOE）。重击后进入<b class="term-resource">预求身</b>状态，普攻替换为<b class="term-resource">居合斩</b>。<b class="term-resource">雪锈</b>层数（0-3）让霜渐效应附加额外倍率，3 层时霜冻效应最终伤害+25%。'
  },
  '达妮娅': {
    // 黯核 stacks + 虚质粒子，双形态切换
    kind: 'stacks', resourceName: '黯核', max: 3,
    gainPerNormal: 0, gainPerSkill: 1, gainPerBurst: 0,
    effectType: 'enhancedBurst',
    effectMult: 1.5,
    desc: '<b class="term-resource">黯核</b>上限 3（3 链 +5）。布景形态下普攻/技能积累黯核，幻灭形态消耗黯核让共鸣解放·帷幕终景伤害 ×1.5/枚。形态切换由重击键触发（无实际重击伤害）。'
  },
  '露西': {
    // Ram 点数（初始 24，2 链 32）+ SQL层数 + 欺骗程式
    kind: 'gauge', resourceName: '传输协议', max: 100,
    gainPerNormal: 8, gainPerSkill: 20, gainPerBurst: 35, gainPerHeavy: 15,
    effectType: 'enhancedBurst',
    effectMult: 1.5,
    desc: '<b class="term-resource">传输协议</b>上限 100。满 100 时共鸣技能替换为<b class="term-resource">死锁</b>（atk×220% 衍射），并进入<b class="term-resource">算法压缩</b>状态获得 1 层 SQL。共鸣解放·网络行者展开协议界面，覆写篡改对标记目标造成衍射重击伤害。'
  },
  '丽贝卡': {
    // 狂热 120，满后重击替换；街头直觉 stacks
    kind: 'gauge', resourceName: '狂热', max: 120,
    gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 40, gainPerHeavy: 25,
    effectType: 'enhancedHeavy',
    effectMult: 1.5,
    desc: '<b class="term-resource">狂热</b>上限 120。满值时重击替换为<b class="term-resource">重击·哒哒哒！·猎手</b>或<b class="term-resource">重击·砰砰砰！·铁胆</b>（atk×150% 导电）。每次施放重击获得 2 层<b class="term-resource">街头直觉</b>（上限 20 层），每层重击伤害+5%。共鸣解放·狂欢时间！切换为重机枪模式持续射击。'
  },
  '洛瑟菈': {
    // 印象 gauge + 照片 stacks；追忆状态强化断舍离
    kind: 'gauge', resourceName: '印象', max: 100,
    gainPerNormal: 8, gainPerSkill: 20, gainPerBurst: 30,
    effectType: 'enhancedSkill',
    effectMult: 1.8,
    desc: '<b class="term-resource">印象</b>上限 100。施放共鸣技能·幻象定帧积累<b class="term-resource">【照片】</b>（上限 3 张）。普攻·溯念留形第 3 段消耗 1 张照片施放<b class="term-resource">遗忘</b>（atk×180% 湮灭）。消耗全部 3 张施放<b class="term-resource">断舍离</b>（atk×320% 湮灭 AOE，每张额外印象倍率+30%）。共鸣解放进入追忆状态，强化断舍离。'
  }
};

// 通用回路（其他 5 星角色）：简化攻击堆叠
const GENERIC_FORTE = {
  kind: 'gauge', resourceName: '专注', max: 100,
  gainPerNormal: 10, gainPerSkill: 20, gainPerBurst: 30,
  effectType: 'enhancedNormal',
  effectMult: 1.5,
  desc: '专注满时下次普攻 ×1.5'
};

export function getForte(roleName) {
  return FORTE[roleName] || GENERIC_FORTE;
}

// 战斗中给单位添加 forte 状态
export function initForte(unit) {
  const f = getForte(unit.name);
  // 起始值（如守岸人开局自带 50 坍缩核，避免裸打第一次技能）
  const start = unit.forteStart || 0;
  unit.forte = {
    ...f,
    current: Math.min(start, f.max),
    ready: start >= f.max          // 满值标志（满后下次相应操作触发效果，触发后清空）
  };
}

// 角色出手后增加资源
export function gainForte(unit, actionType /* 'normal'|'skill'|'burst'|'heavy' */) {
  if (!unit.forte) return;
  const f = unit.forte;
  let gain = 0;
  if (actionType === 'normal') gain = f.gainPerNormal;
  else if (actionType === 'skill') gain = f.gainPerSkill;
  else if (actionType === 'burst') gain = f.gainPerBurst;
  else if (actionType === 'heavy') gain = (f.gainPerHeavy ?? f.gainPerNormal * 1.5);
  f.current = Math.min(f.max, f.current + gain);
  if (f.current >= f.max) f.ready = true;
}

// 消费 forte（满值后释放强化效果时调用）
export function consumeForte(unit) {
  if (!unit.forte) return false;
  if (!unit.forte.ready) return false;
  unit.forte.current = 0;
  unit.forte.ready = false;
  return true;
}

// 检查 forte 满后该不该自动强化当前动作
export function forteEnhances(unit, actionType) {
  if (!unit.forte?.ready) return null;
  const t = unit.forte.effectType;
  // 强化对应动作？
  if (actionType === 'normal' && t === 'enhancedNormal') return unit.forte;
  if (actionType === 'skill' && t === 'enhancedSkill') return unit.forte;
  if (actionType === 'burst' && t === 'enhancedBurst') return unit.forte;
  return null;
}
