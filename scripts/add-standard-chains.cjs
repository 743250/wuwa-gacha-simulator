// scripts/add-standard-chains.cjs — 给 chains-extracted.json 补齐 5 个常驻 + 12 个 4 星
const fs = require('fs');
const p = 'src/data/chains-extracted.json';
const d = JSON.parse(fs.readFileSync(p, 'utf-8'));

// 工具：基于 seq.js 原文生成"简化模拟器版"6 链 entry
// 每条 entry：{ title, summary（一句话）, desc（模拟器实装说明）}

// ===== 常驻 5 星 =====
// 维里奈（S · 衍射 · 音感仪 · 治疗）
d['维里奈'] = [
  { title: "萌芽的一瞬", summary: "<b class=\"term-resource\">延奏·盛放</b>给登场角色持续回血。", desc: "施放延奏技能<b class=\"term-resource\">盛放</b>时，登场角色每 5 秒回复维里奈 <b class=\"term-num\">20%</b> 攻击的生命值，持续 30 秒。" },
  { title: "抽叶的思考", summary: "<b class=\"term-skill\">共鸣技能</b>额外回 <b class=\"term-num\">1</b> 光合能量 + <b class=\"term-num\">10</b> 协奏。", desc: "施放<b class=\"term-skill\">共鸣技能·扩繁试验</b>时，额外获得 <b class=\"term-num\">1</b> 点光合能量与 <b class=\"term-num\">10</b> 点协奏能量。" },
  { title: "生长的选择", summary: "<b class=\"term-burst\">共鸣解放·光合标记</b>治疗加成 +<b class=\"term-num\">12%</b>。", desc: "<b class=\"term-burst\">共鸣解放·光合标记</b>的治疗效果加成 +<b class=\"term-num\">12%</b>。模拟器实装为永久治疗加成 +12%。" },
  { title: "盛放的拥抱", summary: "重击/解放后全队<b class=\"term-resource\">衍射伤害加成</b> +<b class=\"term-num\">15%</b>。", desc: "施放<b class=\"term-heavy\">重击·星星花绽放</b>、<b class=\"term-burst\">共鸣解放·草木生长</b>或<b class=\"term-resource\">延奏·盛放</b>时，全队衍射伤害加成 +<b class=\"term-num\">15%</b>，持续 24 秒。" },
  { title: "饮过的甘霖", summary: "<b class=\"term-burst\">共鸣解放</b>命中目标，全队治疗效果 +<b class=\"term-num\">20%</b>。", desc: "解放命中目标时，全队治疗效果 +<b class=\"term-num\">20%</b>，持续 20 秒。模拟器实装为永久治疗加成 +20%。" },
  { title: "扎根的承诺", summary: "<b class=\"term-burst\">解放·草木生长</b>伤害倍率 +<b class=\"term-num\">60%</b>。", desc: "<b class=\"term-burst\">共鸣解放·草木生长</b>伤害倍率 +<b class=\"term-num\">60%</b>。" }
];

// 安可（A · 热熔 · 佩枪 · 主C）
d['安可'] = [
  { title: "羊咩的童话书", summary: "<b class=\"term-normal\">普攻</b>命中给<b class=\"term-resource\">热熔伤害</b> +<b class=\"term-num\">3%</b>/层，4 层（满 +12%）。", desc: "<b class=\"term-normal\">普攻</b>命中给自身热熔伤害 +<b class=\"term-num\">3%</b>，可叠 <b class=\"term-num\">4</b> 层。模拟器实装为永久热熔 +12%。" },
  { title: "数羊安眠曲", summary: "<b class=\"term-skill\">共鸣技能</b>额外回 <b class=\"term-num\">10</b> 能量（CD）。", desc: "施放<b class=\"term-normal\">普攻·咩咩</b>或<b class=\"term-skill\">共鸣技能·热情欢迎式</b>时，额外回 <b class=\"term-num\">10</b> 能量（10 秒 CD）。" },
  { title: "迷雾？黑海岸！", summary: "<b class=\"term-heavy\">重击·失控之炎/暴走之炎</b>伤害 +<b class=\"term-num\">40%</b>。", desc: "<b class=\"term-heavy\">重击·白咩失控之炎</b>、<b class=\"term-heavy\">重击·黑咩暴走之炎</b>伤害倍率 +<b class=\"term-num\">40%</b>。" },
  { title: "冒险？好有趣！", summary: "<b class=\"term-heavy\">重击·黑咩</b>后全队<b class=\"term-resource\">热熔伤害</b> +<b class=\"term-num\">20%</b>。", desc: "施放<b class=\"term-heavy\">重击·黑咩暴走之炎</b>时，全队热熔伤害加成 +<b class=\"term-num\">20%</b>，持续 30 秒。" },
  { title: "万圣？开 party！", summary: "<b class=\"term-burst\">共鸣解放·热情欢迎式</b>伤害 +<b class=\"term-num\">50%</b>。", desc: "<b class=\"term-burst\">共鸣解放·热情欢迎式</b>伤害倍率 +<b class=\"term-num\">50%</b>。" },
  { title: "约定？指头钩！", summary: "<b class=\"term-heavy\">重击·黑咩暴走之炎</b>有 <b class=\"term-num\">50%</b> 概率额外触发一次（折算 +50%）。", desc: "<b class=\"term-heavy\">重击·黑咩暴走之炎</b>命中时 50% 概率额外触发一次。模拟器实装为<b class=\"term-heavy\">重击伤害 +50%</b>。" }
];

// 凌阳（A · 冷凝 · 迅刀 · 主C）
d['凌阳'] = [
  { title: "醒狮开光，如意吉祥", summary: "<b class=\"term-burst\">共鸣解放·狮子奋迅</b>持续期间抗打断。", desc: "<b class=\"term-burst\">共鸣解放·狮子奋迅</b>持续期间提升凌阳抗打断能力。模拟器实装为<b class=\"term-burst\">解放伤害 +10%</b>（折算韧性收益）。" },
  { title: "威风凛凛，四方张狂", summary: "<b class=\"term-variation\">变奏</b>额外回 <b class=\"term-num\">10</b> 共鸣能量（CD）。", desc: "施放<b class=\"term-variation\">变奏技能·出洞·睡狮蛰醒</b>时，额外回 <b class=\"term-num\">10</b> 共鸣能量（20 秒 CD）。" },
  { title: "瞠目顾盼，其声昂昂", summary: "<b class=\"term-burst\">解放</b>期间<b class=\"term-normal\">普攻</b> +<b class=\"term-num\">20%</b>、<b class=\"term-skill\">技能</b> +<b class=\"term-num\">10%</b>。", desc: "<b class=\"term-burst\">共鸣解放·狮子奋迅</b>持续期间，凌阳的<b class=\"term-normal\">普攻伤害加成</b> +<b class=\"term-num\">20%</b>，<b class=\"term-skill\">共鸣技能伤害加成</b> +<b class=\"term-num\">10%</b>。" },
  { title: "一跳三叫，众仙折腰", summary: "延奏后全队<b class=\"term-resource\">冷凝伤害加成</b> +<b class=\"term-num\">20%</b>。", desc: "凌阳施放延奏技能<b class=\"term-resource\">留痕·踏雪点星</b>时，全队冷凝伤害加成 +<b class=\"term-num\">20%</b>，持续 30 秒。" },
  { title: "蹑罡踏斗，七星悬朗", summary: "<b class=\"term-burst\">解放·狮子奋迅</b>额外打 atk × <b class=\"term-num\">200%</b> 冷凝。", desc: "施放<b class=\"term-burst\">共鸣解放·奋进·狮子奋迅，俱足万行</b>时，额外造成凌阳 <b class=\"term-num\">200%</b> 攻击的冷凝伤害。模拟器实装为<b class=\"term-burst\">解放伤害 +200%</b>。" },
  { title: "神功盖世，百鬼震惶", summary: "行狮状态下<b class=\"term-skill\">共鸣技能</b>后下次<b class=\"term-normal\">普攻</b> +<b class=\"term-num\">100%</b>。", desc: "处于共鸣回路行狮状态时，凌阳每次施放<b class=\"term-skill\">共鸣技能·飞身式·翻山越涧</b>后下 1 次<b class=\"term-normal\">普攻</b>的伤害加成 +<b class=\"term-num\">100%</b>。" }
];

// 鉴心（B · 气动 · 臂铠 · 辅助）
d['鉴心'] = [
  { title: "林间青枝", summary: "<b class=\"term-variation\">变奏</b>后<b class=\"term-normal\">普攻</b>获得【气】 +<b class=\"term-num\">100%</b>。", desc: "施放<b class=\"term-variation\">变奏技能·掌息之要</b>后，<b class=\"term-normal\">普攻</b>获得的【气】额外 +<b class=\"term-num\">100%</b>，持续 10 秒。模拟器实装为<b class=\"term-normal\">普攻 +20%</b>。" },
  { title: "道者稚徒", summary: "<b class=\"term-skill\">共鸣技能·静气循行</b>使用次数 +<b class=\"term-num\">1</b>。", desc: "<b class=\"term-skill\">共鸣技能·静气循行</b>的使用次数 +<b class=\"term-num\">1</b>。模拟器实装为<b class=\"term-skill\">共鸣技能伤害 +30%</b>（次数折算）。" },
  { title: "无心无为", summary: "<b class=\"term-skill\">共鸣技能·静气循行</b>架势 2.5 秒后可打出<b class=\"term-skill\">行气反击</b>。", desc: "<b class=\"term-skill\">共鸣技能·静气循行</b>进入架势姿态持续 2.5 秒后，可直接打出<b class=\"term-skill\">行气反击</b>。模拟器实装为<b class=\"term-skill\">共鸣技能 +15%</b>。" },
  { title: "十问之思", summary: "重击·混元气旋时<b class=\"term-burst\">解放·涤净力场</b>伤害 +<b class=\"term-num\">80%</b>。", desc: "施放共鸣回路<b class=\"term-heavy\">重击·混元气旋</b>时，<b class=\"term-burst\">共鸣解放·涤净力场</b>伤害 +<b class=\"term-num\">80%</b>，持续 14 秒。" },
  { title: "百谋经心", summary: "<b class=\"term-burst\">共鸣解放·涤净力场</b>额外回 <b class=\"term-num\">20</b> 共鸣能量。", desc: "<b class=\"term-burst\">共鸣解放·涤净力场</b>施放时额外回 <b class=\"term-num\">20</b> 共鸣能量（每 25 秒 1 次）。" },
  { title: "顺势而为", summary: "<b class=\"term-resource\">气动伤害</b> +<b class=\"term-num\">20%</b>。", desc: "鉴心的<b class=\"term-resource\">气动伤害加成</b> +<b class=\"term-num\">20%</b>。" }
];

// ===== 4 星 =====
// 莫特斐（A · 热熔 · 佩枪 · 副C）
d['莫特斐'] = [
  { title: "孤独的练习曲", summary: "<b class=\"term-burst\">解放·浮翼狂想</b>期间登场角色<b class=\"term-skill\">共鸣技能</b>触发协同（热熔伤害）。", desc: "<b class=\"term-burst\">共鸣解放·浮翼狂想</b>持续期间，队伍中登场角色施放<b class=\"term-skill\">共鸣技能</b>时，莫特斐协同攻击 2 发<b class=\"term-burst\">共鸣解放加强音</b>。模拟器实装为<b class=\"term-burst\">解放伤害 +50%</b>。" },
  { title: "虚伪的赞美诗", summary: "声骸技能后额外回 <b class=\"term-num\">10</b> 共鸣能量（CD）。", desc: "使用声骸技能后额外回 <b class=\"term-num\">10</b> 共鸣能量（20 秒 CD）。" },
  { title: "孤注一掷", summary: "<b class=\"term-burst\">共鸣解放·浮翼狂想</b>伤害 +<b class=\"term-num\">25%</b>。", desc: "<b class=\"term-burst\">共鸣解放·浮翼狂想</b>伤害倍率 +<b class=\"term-num\">25%</b>。" },
  { title: "彻夜不眠", summary: "<b class=\"term-skill\">共鸣技能·应援</b>命中后全队<b class=\"term-resource\">热熔伤害</b> +<b class=\"term-num\">12%</b>。", desc: "施放<b class=\"term-skill\">共鸣技能·应援</b>命中目标后，全队热熔伤害 +<b class=\"term-num\">12%</b>，持续 14 秒。" },
  { title: "完美演奏", summary: "<b class=\"term-burst\">解放</b>协同伤害倍率 +<b class=\"term-num\">30%</b>。", desc: "<b class=\"term-burst\">共鸣解放</b>协同攻击伤害倍率 +<b class=\"term-num\">30%</b>。" },
  { title: "返场欢呼", summary: "击败目标后回 <b class=\"term-num\">8</b> 共鸣能量。", desc: "击败目标后回 <b class=\"term-num\">8</b> 共鸣能量（10 秒 CD）。" }
];

// 散华（A · 冷凝 · 长刃 · 副C）
d['散华'] = [
  { title: "孤身孑然", summary: "<b class=\"term-normal\">普攻</b>第 5 段后暴击 +<b class=\"term-num\">15%</b>。", desc: "施放第 5 段普攻时，散华自身暴击 +<b class=\"term-num\">15%</b>，持续 10 秒。模拟器实装为永久暴击 +15%。" },
  { title: "净雪明心", summary: "<b class=\"term-heavy\">重击·爆裂</b>耐力降 10。", desc: "<b class=\"term-heavy\">重击·爆裂</b>消耗耐力 -10。施放<b class=\"term-skill\">共鸣技能</b>时抗打断 5 秒。模拟器实装为<b class=\"term-heavy\">重击伤害 +20%</b>（折算）。" },
  { title: "目视异常", summary: "对生命 <70% 目标伤害 +<b class=\"term-num\">35%</b>。", desc: "散华攻击生命低于 70% 的目标时，造成的伤害 +<b class=\"term-num\">35%</b>。模拟器实装为永久全伤害 +20%（保守折算）。" },
  { title: "剑修五蕴", summary: "<b class=\"term-burst\">共鸣解放</b>回 <b class=\"term-num\">10</b> 能量 + 下次<b class=\"term-heavy\">重击</b> +<b class=\"term-num\">120%</b>。", desc: "施放<b class=\"term-burst\">共鸣解放·焦瞑冻土</b>时，回 <b class=\"term-num\">10</b> 共鸣能量，5 秒内下次<b class=\"term-heavy\">重击·爆裂</b>伤害 +<b class=\"term-num\">120%</b>。模拟器实装为<b class=\"term-heavy\">重击伤害 +50%</b>。" },
  { title: "心如止水", summary: "<b class=\"term-resource\">冷凝伤害</b> +<b class=\"term-num\">15%</b>。", desc: "<b class=\"term-resource\">冷凝伤害</b>加成 +<b class=\"term-num\">15%</b>。" },
  { title: "剑道无极", summary: "<b class=\"term-heavy\">重击·爆裂</b>伤害倍率 +<b class=\"term-num\">50%</b>。", desc: "<b class=\"term-heavy\">重击·爆裂</b>伤害倍率 +<b class=\"term-num\">50%</b>。" }
];

// 卜灵（A · 导电 · 音感仪 · 辅助）
d['卜灵'] = [
  { title: "百般法宝，借物打力", summary: "<b class=\"term-burst\">共鸣解放·飞雷诀</b>暴击 +<b class=\"term-num\">20%</b>。", desc: "<b class=\"term-burst\">共鸣解放·飞雷诀·归一</b>造成伤害时，此次暴击 +<b class=\"term-num\">20%</b>。模拟器实装为<b class=\"term-burst\">解放伤害 +15%</b>（折算暴击收益）。" },
  { title: "符法通玄，神鬼咸听", summary: "阴阳相生状态回 <b class=\"term-num\">25</b> 能量。", desc: "卜灵进入【阴阳相生】状态时，回 <b class=\"term-num\">25</b> 共鸣能量（24 秒 CD）。" },
  { title: "召灵遣将，窥探天机", summary: "五雷荡煞阵期间全队 HP <50% 时治疗（350 + atk×150%）。", desc: "【五雷荡煞阵】持续期间，队伍中角色生命值低于 50% 时，立即回 <b class=\"term-num\">350 + atk × 150%</b> 生命（24 秒 CD）。模拟器实装为永久治疗加成 +25%。" },
  { title: "索拉云游，气运加身", summary: "治疗效果加成 +<b class=\"term-num\">20%</b>。", desc: "卜灵的治疗效果加成 +<b class=\"term-num\">20%</b>。" },
  { title: "论坛禁言，速换马甲", summary: "<b class=\"term-resource\">五雷荡煞阵</b>生成时对范围内目标附加 <b class=\"term-num\">6</b> 层电磁效应。", desc: "【五雷荡煞阵】生成时，立即对范围内所有目标附加 6 层【电磁效应】。模拟器实装为<b class=\"term-skill\">共鸣技能 +40%</b>。" },
  { title: '"天地混元雷符水帖天尊"', summary: "<b class=\"term-resource\">雷法·三才合一</b>期间登场角色<b class=\"term-skill\">共鸣技能伤害加成</b> +<b class=\"term-num\">50%</b>。", desc: "【雷法·三才合一】状态持续期间，队伍中登场角色获得的<b class=\"term-skill\">共鸣技能伤害加成</b> +<b class=\"term-num\">50%</b>。模拟器实装为永久全队共鸣技能 +30%。" }
];

// 丹瑾（B · 湮灭 · 长刃 · 副C）
d['丹瑾'] = [
  { title: "丹心本如鉴", summary: "攻击带<b class=\"term-resource\">朱蚀之刻</b>目标 +<b class=\"term-num\">5%</b>/层，6 层（满 +30%）。", desc: "丹瑾攻击带<b class=\"term-skill\">共鸣技能·朱蚀之刻</b>的目标时，自身攻击 +<b class=\"term-num\">5%</b>，可叠 <b class=\"term-num\">6</b> 层。模拟器实装为永久攻击 +30%。" },
  { title: "明镜却蒙尘", summary: "攻击带<b class=\"term-resource\">朱蚀之刻</b>目标伤害 +<b class=\"term-num\">20%</b>。", desc: "攻击带<b class=\"term-resource\">朱蚀之刻</b>的目标时，造成的伤害 +<b class=\"term-num\">20%</b>。" },
  { title: "刹那芳华不长久", summary: "<b class=\"term-burst\">共鸣解放</b>伤害加成 +<b class=\"term-num\">30%</b>。", desc: "<b class=\"term-burst\">共鸣解放伤害加成</b> +<b class=\"term-num\">30%</b>。" },
  { title: "孤艳难红", summary: "<b class=\"term-resource\">彤华</b> ≥ 60 时暴击 +<b class=\"term-num\">15%</b>。", desc: "<b class=\"term-resource\">彤华</b>积攒 60 点以上时，丹瑾的暴击 +<b class=\"term-num\">15%</b>。模拟器实装为永久暴击 +15%。" },
  { title: "剑扫春秋", summary: "<b class=\"term-resource\">湮灭伤害</b> +<b class=\"term-num\">15%</b>（生命 <60% 再 +15%）。", desc: "丹瑾的<b class=\"term-resource\">湮灭伤害加成</b> +<b class=\"term-num\">15%</b>。模拟器简化为永久 +15%。" },
  { title: "绯染碧玉岂堪留", summary: "<b class=\"term-heavy\">重击·缭乱</b>后全队攻击 +<b class=\"term-num\">20%</b>。", desc: "施放<b class=\"term-heavy\">重击·缭乱</b>时，全队攻击 +<b class=\"term-num\">20%</b>，持续 20 秒。" }
];

// 白芷（B · 冷凝 · 音感仪 · 治疗）
d['白芷'] = [
  { title: "极简与繁复", summary: "<b class=\"term-skill\">共鸣技能·应急预案</b>每念意回 <b class=\"term-num\">2.5</b> 能量。", desc: "施放<b class=\"term-skill\">共鸣技能·应急预案</b>时，每消耗 1 点念意回 <b class=\"term-num\">2.5</b> 共鸣能量。" },
  { title: "沉默的冰原", summary: "<b class=\"term-skill\">共鸣技能</b>满念意时<b class=\"term-resource\">冷凝伤害</b>/治疗 +<b class=\"term-num\">15%</b>。", desc: "施放<b class=\"term-skill\">共鸣技能·应急预案</b>时若有 4 念意，白芷的<b class=\"term-resource\">冷凝伤害加成</b> +<b class=\"term-num\">15%</b>、治疗加成 +<b class=\"term-num\">15%</b>，持续 12 秒。" },
  { title: "真理的崇奉", summary: "<b class=\"term-variation\">变奏</b>后生命上限 +<b class=\"term-num\">12%</b>。", desc: "施放<b class=\"term-variation\">变奏技能·覆雪流盈</b>时，白芷的生命上限 +<b class=\"term-num\">12%</b>，持续 10 秒。" },
  { title: "被追溯的本源", summary: "<b class=\"term-burst\">共鸣解放·刹那合弥</b>强化频隙回响（+2 段，治疗 +<b class=\"term-num\">20%</b>，额外冷凝伤害）。", desc: "施放<b class=\"term-burst\">共鸣解放·刹那合弥</b>时，频隙回响 +2 段，治疗倍率 +<b class=\"term-num\">20%</b>。模拟器实装为治疗加成 +20%。" },
  { title: "无终的对话", summary: "频隙回响治疗加成 +<b class=\"term-num\">25%</b>。", desc: "频隙回响治疗加成 +<b class=\"term-num\">25%</b>。模拟器实装为治疗加成 +25%。" },
  { title: "被聆听的歌谣", summary: "<b class=\"term-burst\">共鸣解放</b>命中给全队<b class=\"term-resource\">冷凝伤害</b> +<b class=\"term-num\">15%</b>。", desc: "<b class=\"term-burst\">共鸣解放·刹那合弥</b>命中目标时，全队冷凝伤害加成 +<b class=\"term-num\">15%</b>，持续 20 秒。" }
];

// 秋水（B · 气动 · 佩枪 · 副C）
d['秋水'] = [
  { title: "恶作剧开场", summary: "<b class=\"term-skill\">共鸣技能·移位戏法</b>冷却 -4 秒。", desc: "<b class=\"term-skill\">共鸣技能·移位戏法</b>冷却时间 -4 秒。" },
  { title: "织雾首秀", summary: "雾化分身生命 +<b class=\"term-num\">100%</b>，攻击嘲讽目标 +<b class=\"term-num\">15%</b> 攻击。", desc: "【雾化分身】继承生命 +<b class=\"term-num\">100%</b>。秋水攻击被分身嘲讽目标时攻击 +<b class=\"term-num\">15%</b>。模拟器实装为永久攻击 +15%。" },
  { title: "雾化转场", summary: "<b class=\"term-normal\">普攻</b>穿<b class=\"term-resource\">虚实之门</b>额外生成 2 子弹（50% 伤害）。", desc: "<b class=\"term-normal\">普攻</b>或空中攻击穿过【虚实之门】时，额外生成 2 颗子弹（普攻/空攻 <b class=\"term-num\">50%</b> 伤害）。模拟器实装为<b class=\"term-normal\">普攻伤害 +30%</b>。" },
  { title: "终幕的黑花", summary: "<b class=\"term-skill\">共鸣技能·雾化子弹</b> +<b class=\"term-num\">30%</b>，迷雾潜行减伤 30%。", desc: "<b class=\"term-skill\">共鸣技能·雾化子弹</b> +<b class=\"term-num\">30%</b>；迷雾潜行状态下受到伤害 -30%。" },
  { title: "雾中之刺", summary: "<b class=\"term-resource\">气动伤害</b> +<b class=\"term-num\">15%</b>。", desc: "<b class=\"term-resource\">气动伤害</b>加成 +<b class=\"term-num\">15%</b>。" },
  { title: "影舞终曲", summary: "<b class=\"term-burst\">共鸣解放</b>伤害 +<b class=\"term-num\">50%</b>。", desc: "<b class=\"term-burst\">共鸣解放</b>伤害倍率 +<b class=\"term-num\">50%</b>。" }
];

// 炽霞（B · 热熔 · 佩枪 · 副C）
d['炽霞'] = [
  { title: "剧院的英雄戏", summary: "<b class=\"term-skill\">共鸣技能·轰轰</b>必定暴击。", desc: "施放<b class=\"term-skill\">共鸣技能·轰轰</b>时必定暴击。模拟器实装为永久暴击 +20%（折算）。" },
  { title: "跃动的火星", summary: "<b class=\"term-burst\">解放·炽烈焰火</b>击败目标回 <b class=\"term-num\">5</b> 能量（最多 20）。", desc: "<b class=\"term-burst\">共鸣解放·炽烈焰火</b>期间，每击败目标回 <b class=\"term-num\">5</b> 共鸣能量（每次最多 20）。" },
  { title: "不灭的火把", summary: "对生命 <50% 目标<b class=\"term-burst\">解放</b>伤害 +<b class=\"term-num\">40%</b>。", desc: "<b class=\"term-burst\">共鸣解放·炽烈焰火</b>对生命低于 50% 的目标伤害 +<b class=\"term-num\">40%</b>。模拟器实装为<b class=\"term-burst\">解放伤害 +25%</b>。" },
  { title: "英雄的绝招", summary: "<b class=\"term-burst\">解放·炽烈焰火</b>获 60 发热压弹 + 重置<b class=\"term-skill\">共鸣技能</b> CD。", desc: "施放<b class=\"term-burst\">共鸣解放·炽烈焰火</b>时，炽霞获 60 发【热压弹】并立即重置一次<b class=\"term-skill\">共鸣技能·咻咻斗意</b>冷却。模拟器实装为<b class=\"term-burst\">解放伤害 +30%</b>。" },
  { title: "射星的箭手", summary: "<b class=\"term-resource\">热熔伤害</b> +<b class=\"term-num\">15%</b>。", desc: "<b class=\"term-resource\">热熔伤害</b>加成 +<b class=\"term-num\">15%</b>。" },
  { title: "燃情的孤勇", summary: "<b class=\"term-burst\">解放·炽烈焰火</b>伤害倍率 +<b class=\"term-num\">60%</b>。", desc: "<b class=\"term-burst\">共鸣解放·炽烈焰火</b>伤害倍率 +<b class=\"term-num\">60%</b>。" }
];

// 秧秧（C · 气动 · 音感仪 · 副C）
d['秧秧'] = [
  { title: "底色湛蓝如洗", summary: "<b class=\"term-variation\">变奏</b>后<b class=\"term-resource\">气动伤害</b> +<b class=\"term-num\">15%</b>。", desc: "施放<b class=\"term-variation\">变奏技能·湛蓝礼赞</b>后，秧秧的气动伤害加成 +<b class=\"term-num\">15%</b>，持续 8 秒。模拟器实装为永久气动 +15%。" },
  { title: "雀鸟衔枝而行", summary: "<b class=\"term-heavy\">重击</b>命中回 <b class=\"term-num\">10</b> 共鸣能量（CD）。", desc: "<b class=\"term-heavy\">重击</b>命中目标时，秧秧额外回 <b class=\"term-num\">10</b> 共鸣能量（20 秒 CD）。" },
  { title: "流息声声不绝", summary: "<b class=\"term-skill\">共鸣技能</b> +<b class=\"term-num\">40%</b>。", desc: "<b class=\"term-skill\">共鸣技能伤害加成</b> +<b class=\"term-num\">40%</b>，风场牵引范围 +33%。" },
  { title: "若可侧耳倾听", summary: "空中攻击释羽 +<b class=\"term-num\">95%</b>。", desc: "空中攻击释羽的伤害 +<b class=\"term-num\">95%</b>。模拟器实装为<b class=\"term-heavy\">重击伤害 +50%</b>。" },
  { title: "天空之眼", summary: "<b class=\"term-resource\">气动伤害</b> +<b class=\"term-num\">12%</b>。", desc: "<b class=\"term-resource\">气动伤害</b>加成 +<b class=\"term-num\">12%</b>。" },
  { title: "天空之歌", summary: "<b class=\"term-burst\">共鸣解放</b>伤害 +<b class=\"term-num\">50%</b>。", desc: "<b class=\"term-burst\">共鸣解放</b>伤害倍率 +<b class=\"term-num\">50%</b>。" }
];

// 桃祈（C · 衍射 · 臂铠 · 辅助）
d['桃祈'] = [
  { title: "怀悠然之心", summary: "<b class=\"term-resource\">攻防转换</b>护盾 +<b class=\"term-num\">40%</b>。", desc: "共鸣回路<b class=\"term-resource\">攻防转换</b>获得的护盾量 +<b class=\"term-num\">40%</b>。模拟器实装为永久生命 +12%（护盾折算）。" },
  { title: "假泯于众人", summary: "<b class=\"term-burst\">解放·不动如山</b>暴击/暴伤 +<b class=\"term-num\">20%</b>。", desc: "<b class=\"term-burst\">共鸣解放·不动如山</b>的暴击 +<b class=\"term-num\">20%</b>，暴击伤害 +<b class=\"term-num\">20%</b>。模拟器实装为永久暴击 +10% / 暴伤 +20%。" },
  { title: "观万物之细", summary: "<b class=\"term-skill\">共鸣技能·磐岩护壁</b>持续 30 秒。", desc: "<b class=\"term-skill\">共鸣技能·磐岩护壁</b>持续时间 +至 30 秒。模拟器实装为<b class=\"term-skill\">共鸣技能 +20%</b>。" },
  { title: "承负重之担", summary: "<b class=\"term-heavy\">重击·发后制人</b>回 25% HP + 防御 +<b class=\"term-num\">50%</b>。", desc: "成功触发<b class=\"term-heavy\">重击·发后制人</b>时，回桃祈 25% 生命，防御 +<b class=\"term-num\">50%</b>，持续 5 秒（15 秒 CD）。模拟器实装为永久防御 +20%。" },
  { title: "山岳屹立", summary: "防御 +<b class=\"term-num\">12%</b>。", desc: "防御 +<b class=\"term-num\">12%</b>。" },
  { title: "万物归一", summary: "<b class=\"term-burst\">共鸣解放</b>伤害 +<b class=\"term-num\">40%</b>。", desc: "<b class=\"term-burst\">共鸣解放</b>伤害倍率 +<b class=\"term-num\">40%</b>。" }
];

// 渊武（C · 导电 · 臂铠 · 辅助）
d['渊武'] = [
  { title: "点一盏清茗", summary: "<b class=\"term-resource\">雷厉风行</b>状态<b class=\"term-normal\">普攻</b>/<b class=\"term-heavy\">重击</b>攻速 +<b class=\"term-num\">20%</b>。", desc: "处于共鸣回路<b class=\"term-resource\">雷厉风行</b>时，自身<b class=\"term-normal\">普攻</b>攻速 +<b class=\"term-num\">20%</b>、<b class=\"term-heavy\">重击</b>攻速 +<b class=\"term-num\">20%</b>。模拟器实装为永久攻击 +10%。" },
  { title: "敛狂戾之心", summary: "<b class=\"term-variation\">变奏·轰雷</b>回 <b class=\"term-num\">15</b> 能量。", desc: "施放<b class=\"term-variation\">变奏技能·轰雷</b>时回 <b class=\"term-num\">15</b> 共鸣能量。" },
  { title: "正周身之气", summary: "<b class=\"term-skill\">共鸣技能·雷之楔</b>命中按防御 20% 加伤。", desc: "<b class=\"term-skill\">共鸣技能·雷之楔</b>命中目标时，按渊武 20% 防御额外提升伤害。模拟器实装为<b class=\"term-skill\">共鸣技能 +20%</b>。" },
  { title: "挥刚猛之拳", summary: "<b class=\"term-burst\">解放·寂土重明</b>给全队 atk × 200% 防御护盾。", desc: "施放<b class=\"term-burst\">共鸣解放·寂土重明</b>时，登场角色获得 atk × 200% 防御的护盾，持续 10 秒。模拟器实装为<b class=\"term-burst\">解放伤害 +30%</b>（护盾折算）。" },
  { title: "天雷震怒", summary: "<b class=\"term-resource\">导电伤害</b> +<b class=\"term-num\">12%</b>。", desc: "<b class=\"term-resource\">导电伤害</b>加成 +<b class=\"term-num\">12%</b>。" },
  { title: "守护之锤", summary: "<b class=\"term-burst\">共鸣解放</b>伤害 +<b class=\"term-num\">40%</b>。", desc: "<b class=\"term-burst\">共鸣解放</b>伤害倍率 +<b class=\"term-num\">40%</b>。" }
];

// 釉瑚（C · 冷凝 · 臂铠 · 副C）
d['釉瑚'] = [
  { title: "港边小憩", summary: "<b class=\"term-skill\">共鸣技能·问祯</b>10% 概率免伤 5 秒。", desc: "施放<b class=\"term-skill\">共鸣技能·问祯</b>时 10% 概率免疫伤害和受击，持续 5 秒。模拟器实装为永久生命 +6%。" },
  { title: "堂侧酣睡", summary: "对偶/联珠/合说额外触发<b class=\"term-skill\">共鸣回路·诗中物</b>。", desc: "对偶/联珠/合说对共鸣回路<b class=\"term-resource\">诗中物</b>的伤害效果额外生效一次。模拟器实装为<b class=\"term-skill\">共鸣技能 +20%</b>。" },
  { title: "火中噩魇", summary: "攻击 +<b class=\"term-num\">20%</b>。", desc: "釉瑚攻击 +<b class=\"term-num\">20%</b>。" },
  { title: "雪夜迷寐", summary: "<b class=\"term-skill\">共鸣技能·匣中问祯</b> 20% 概率不进入冷却。", desc: "每次施放<b class=\"term-skill\">共鸣技能·匣中问祯</b>时，20% 概率不进入冷却。模拟器实装为<b class=\"term-skill\">共鸣技能 +20%</b>。" },
  { title: "寒霜之诗", summary: "<b class=\"term-resource\">冷凝伤害</b> +<b class=\"term-num\">12%</b>。", desc: "<b class=\"term-resource\">冷凝伤害</b>加成 +<b class=\"term-num\">12%</b>。" },
  { title: "诗韵入梦", summary: "<b class=\"term-burst\">共鸣解放</b>伤害 +<b class=\"term-num\">40%</b>。", desc: "<b class=\"term-burst\">共鸣解放</b>伤害倍率 +<b class=\"term-num\">40%</b>。" }
];

// 灯灯（C · 衍射 · 臂铠 · 副C）
d['灯灯'] = [
  { title: "包裹正等待揽收", summary: "强化·后撤后回 60% 耐力。", desc: "施放强化·后撤后 3 秒内逐渐回 60% 耐力。模拟器实装为<b class=\"term-skill\">共鸣技能 +15%</b>（机动性折算）。" },
  { title: "呜呜物流已收件", summary: "强化·前扑/后撤无视目标 <b class=\"term-num\">20%</b> 防御。", desc: "强化·前扑和强化·后撤攻击敌人时，无视对方 <b class=\"term-num\">20%</b> 防御。" },
  { title: "特快专递运输中", summary: "<b class=\"term-burst\">共鸣解放·啾啾专送</b>伤害 +<b class=\"term-num\">30%</b>。", desc: "<b class=\"term-burst\">共鸣解放·啾啾专送</b>造成的伤害 +<b class=\"term-num\">30%</b>。" },
  { title: "灯灯正为您派送", summary: "<b class=\"term-normal\">普攻伤害加成</b> +<b class=\"term-num\">30%</b>。", desc: "灯灯的<b class=\"term-normal\">普攻伤害加成</b> +<b class=\"term-num\">30%</b>。" },
  { title: "光速首发", summary: "<b class=\"term-resource\">衍射伤害</b> +<b class=\"term-num\">12%</b>。", desc: "<b class=\"term-resource\">衍射伤害</b>加成 +<b class=\"term-num\">12%</b>。" },
  { title: "夜行不眠", summary: "<b class=\"term-burst\">共鸣解放</b>伤害 +<b class=\"term-num\">40%</b>。", desc: "<b class=\"term-burst\">共鸣解放</b>伤害倍率 +<b class=\"term-num\">40%</b>。" }
];

fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
console.log('Added', 4 + 12, 'standard 5★ + 4★ chains. Total keys now:', Object.keys(d).length);
