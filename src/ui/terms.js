// 角色专有名词 / 通用战斗术语 tooltip 字典
//
// 用途：把已经高亮过的 <b class="term-xxx">关键词</b> 自动再包一层
//      .tip-term[data-tip='...']，鼠标悬停时弹出术语解释。
//
// 配合 styles/main.css 的 .tip-term，以及 src/main.js 全局
// .tip[data-tip] / .tip-term[data-tip] mouseover 监听。
//
// 注意 data-tip 内容必须避免裸单引号，attachTermTips() 会做 ' → &#39; 转义。

// 术语解释字典（同一条术语写一次，跨角色共用）
// applyTermTips 会按 key 长度从长到短匹配（如"变奏技能" > "变奏"）
export const TERM_DICT = {
  // ===== 通用战斗术语 =====
  '协奏值': '<b style="color:#69b8ff">协奏值</b>（0-100）<br>所有角色出招时积累，满 100 时切换角色将触发<b style="color:var(--accent)">强化变奏</b>（变奏倍率 ×2 + 触发武器变奏被动）。',
  '协奏': '<b style="color:#69b8ff">协奏值</b>（0-100）<br>所有角色出招时积累，满 100 时切换角色将触发<b style="color:var(--accent)">强化变奏</b>（变奏倍率 ×2 + 触发武器变奏被动）。',
  '变奏技能': '<b style="color:var(--accent)">变奏技能</b>（切换上场）<br>切换角色时，入场角色对当前主目标造成一段攻击。<br>基础倍率 <b>80%</b>；离场角色协奏值已满时强化为 <b>160%</b>。',
  '变奏': '<b style="color:var(--accent)">变奏</b>（切换上场）<br>切换角色时，入场角色对当前主目标造成一段攻击。<br>基础倍率 <b>80%</b>；离场角色协奏值满时强化为 <b>160%</b>。',
  '延奏技能': '<b style="color:#c39bff">延奏技能</b><br>切换角色时，离场角色触发的"离场被动"，效果由武器或共鸣链提供（例如停驻之烟：下场角色攻击 +10%）。',
  '延奏': '<b style="color:#c39bff">延奏</b>（离场被动）<br>切换角色时，离场角色触发的离场被动效果。',
  '共鸣回路': '<b style="color:#c39bff">共鸣回路</b><br>角色专属的资源条/状态机，是角色差异化核心。<br>不同角色资源不同（破阵值/韶光/离火 等），积满后通常触发<b style="color:var(--gold)">强化形态</b>。',
  '共鸣解放': '<b style="color:var(--gold)">共鸣解放</b><br>3 AP · 需共鸣能量满。<b>主目标 400% / 副目标 200%</b> 攻击 · 削破韧 30。',
  '共鸣技能': '<b style="color:var(--accent)">共鸣技能</b><br>1 AP · 默认 CD 3 回合（部分共鸣链可减）。单体 180% 攻击 · 削破韧 20 · +22 能量。',
  '重击': '<b style="color:#ff8c5e">重击</b><br>2 AP · CD 1 回合。220% 攻击 · 削破韧 25 · +15 能量。',
  '普攻': '<b style="color:var(--text)">普攻</b><br>1 AP。100% 攻击 · 削破韧 8 · +12 能量。',
  '破韧值': '<b style="color:var(--green)">破韧值</b><br>敌人的硬直条。打满后进入<b>易伤期 2 回合</b>，且当前回合 <b>+2 AP</b>（爆发窗口）。',
  '破韧': '<b style="color:var(--green)">破韧值</b><br>敌人的硬直条。打满后进入<b>易伤期 2 回合</b>，且当前回合 <b>+2 AP</b>（爆发窗口）。',

  // ===== 忌炎专属 =====
  '锐意之势': '<b style="color:var(--gold)">锐意之势</b>（忌炎专属）<br>每次<b style="color:#ff8c5e">重击</b> / <b style="color:var(--accent)">共鸣技能</b> / <b style="color:var(--accent)">变奏入场</b>积 <b>1</b> 层，上限 <b>2</b> 层（6 链 <b>3</b> 层）。<br>释放<b style="color:var(--gold)">共鸣解放</b>时消耗全部层数，<b>每层使解放伤害 +100%</b>（6 链 +120%）。<br>2 层 = 解放 <b>×3</b>；3 层 6 链 = 解放 <b>×4.6</b>。',
  '破阵值': '<b style="color:var(--gold)">破阵值</b>（忌炎共鸣回路）<br>普攻 +12 · 技能 +25 · 解放 +40。<br>积满 100 后，下次<b style="color:var(--text)">普攻</b>变成<b>枪扫风定·强化连段</b>（伤害 ×2）。',

  // ===== 守岸人专属 =====
  '星域': '<b style="color:var(--gold)">星域</b>（守岸人专属领域）<br>展开 <b>3</b> 回合（1 链 <b>5</b> 回合 + 切人不消散）<br>· 全队每回合回血<br>· 全队暴击率 +20% · 暴击伤害 +30%<br>· 2 链：星域内全队攻击 +40%',

  // ===== 吟霖专属 =====
  '审判值': '<b style="color:#7bd6ff">审判值</b>（吟霖共鸣回路 0-100）<br>普攻 +<b>15</b> · 共鸣技能 +<b>30</b> · 命中印记目标额外 +<b>5</b>（2 链）。<br>积满 100 自动触发<b style="color:var(--gold)">审判之雷</b>。',
  '审判印记': '<b style="color:var(--gold)">审判印记</b>（吟霖标记 · 挂在敌人身上）<br>持续 <b>3</b> 回合，最多 <b>3</b> 层。<br>· 吟霖技能/解放命中即叠 1 层；解放命中主目标必挂 1 层<br>· <b>3 链</b>：印记每层使目标受到伤害 +<b>10%</b>（全队全伤害类型生效）<br>· <b>1 链</b>：吟霖技能/解放对印记目标 <b>×1.7</b>；<b>5 链</b>：解放对印记目标再 <b>×1.5</b>',
  '审判之雷': '<b style="color:var(--gold)">审判之雷</b>（吟霖触发机制）<br>审判值满 100 时自动触发：<br>· 给当前主目标挂 <b>1</b> 层<b style="color:var(--gold)">审判印记</b><br>· <b>4 链</b>：触发瞬间全队攻击 +<b>15%</b>，持续 <b>2</b> 回合',
  '疾霆昭彰': '<b style="color:var(--accent)">疾霆昭彰</b>（吟霖 6 链 · 解放后开启 2 回合）<br>期间，吟霖<b style="color:var(--text)">普攻</b>命中带<b style="color:var(--gold)">审判印记</b>的目标时，额外触发一次：<br>· 攻击 × <b>70%</b> 导电伤害（视为共鸣技能伤害，享受 1 链 ×1.7）<br>· 每回合最多触发 <b>1</b> 次',

  // ===== 其他角色专属（后续做哪个角色补哪个）=====
  '离火': '<b style="color:#ff8c5e">离火</b>（长离共鸣回路 · 0-6 层）<br>普攻/技能/重击各 +1 / 解放 +3。<br>每持有 <b>1</b> 层，<b style="color:#ff8c5e">热熔伤害 +5%</b>（满 6 层 +30%），随层数实时变化。<br>攒满 <b>6</b> 层进入<b style="color:#ff8c5e">心眼模式</b>。',
  '心眼模式': '<b style="color:#ff8c5e">心眼模式</b>（长离 · 满 6 层离火进入）<br>三个攻击键变身、倍率与伤害类型一起拔高：<br>· 普攻→<b>心眼·征</b>：攻击 × 180% 共鸣技能伤害（平时 100% 普攻）<br>· 技能→<b>心眼·劫</b>：攻击 × 200% 共鸣技能伤害，不吃冷却<br>· 重击→<b>心眼·冲</b>：攻击 × 400% 共鸣技能伤害（爆发顶点）<br>出招优先用离火抵 AP：<b>每 2 层离火 = 1 点 AP</b>，缺口用回合 AP 补。<br>离火 &lt; 2 层时退出，三招还原。',
  '焰羽': '<b style="color:#ff8c5e">焰羽</b>（长离 · 共鸣解放后 2 回合）<br>攻击力 +<b>50%</b>，攻击无视目标 <b>40%</b> 防御。<br>与心眼模式独立，可叠加。',
  '韶光': '<b style="color:#7bd6ff">韶光</b>（今汐共鸣回路 · 0-100）<br>普攻 +10 / 共鸣技能 +20 / 变奏入场 +50。<br>满 100 时下次<b style="color:var(--accent)">共鸣技能</b>替换为<b style="color:var(--gold)">惊龙破空</b>，配合<b style="color:#7bd6ff">惊蛰</b>（4 层）消耗，伤害大幅放大。',
  '惊蛰': '<b style="color:#7bd6ff">惊蛰</b>（今汐战斗状态 · 0-4 层）<br>普攻 +1 / 共鸣技能 +1。<br><b style="color:var(--gold)">惊龙破空</b>释放时消耗所有层数，每层让本次伤害 +25%（满 4 层 +100%）。',
  '红椿蕊': '<b style="color:#c39bff">红椿蕊</b>（椿共鸣回路 · 0-100）<br>普攻 +<b>10</b> / 共鸣技能 +<b>20</b>。<br>满 <b>100</b> 时<b style="color:var(--accent)">共鸣技能</b>替换为<b style="color:var(--gold)">永生花</b>，释放后消耗 <b>50</b> 红椿蕊 + <b>50</b> 协奏，进入<b style="color:#c39bff">含苞</b>状态 <b>3</b> 回合（普攻/技能 ×1.5；6 链 ×2.5）。',
  '含苞': '<b style="color:#c39bff">含苞</b>（椿强化状态 · 持续 3 回合）<br>进入方式：积满 100 红椿蕊后释放<b style="color:var(--gold)">永生花</b>触发。<br>· 普攻/技能伤害 ×<b>1.5</b>（6 链 ×<b>2.5</b>）<br>· 3 链：含苞期间自身攻击 +<b>58%</b><br>· 含苞期间释放<b style="color:var(--burst)">共鸣解放·芳华绽烬</b>伤害进一步放大<br>· 3 回合后自动退出',
  '永生花': '<b style="color:var(--gold)">永生花</b>（椿强化共鸣技能 · 替换形态）<br>触发条件：<br>· <b style="color:#c39bff">红椿蕊</b>满 <b>100</b>，且<br>· 协奏值 ≥ <b>50</b><br>满足时下次施放共鸣技能时变为永生花：消耗 50 红椿蕊 + 50 协奏，造成<b style="color:var(--accent)">湮灭伤害</b>，进入<b style="color:#c39bff">含苞</b>形态。',
  '焰光': '<b style="color:#ff9b3a">焰光</b>（赞妮专属资源 · 0-100）<br>进入<b class="term-state">灼焰形态</b>时 +50，形态内每回合 +10（<b class="term-state">烈阳余烬</b>简化转化）。<b class="term-heavy">重斩</b>消耗 20 焰光。退出形态时清空。',
  '灼焰形态': '<b style="color:#ff9b3a">灼焰形态</b>（赞妮强化状态 · 3 回合）<br>进入方式：<b style="color:var(--burst)">共鸣解放·重燃</b>。<br>· 焰光 +50，每回合 +10<br>· 普攻键替换为<b class="term-heavy">重斩</b>（HP × 12%，消耗 20 焰光，6 链 ×1.4）<br>· 形态结束自动施放<b class="term-burst">终绝将至之刻</b>（HP × 20%，3 链按消耗焰光 +2%/点 最多 +200%）<br>· 6 链：焰光 <70 立即回 70（每场 1 次）；致死不倒（每场 1 次）',
  '重斩': '<b style="color:#ff9b3a">重斩</b>（赞妮灼焰形态内普攻键替换 · 重击伤害类型）<br>消耗 2 AP + 20 焰光，对主目标造成 HP × 12% 衍射伤害（6 链 ×1.4 = HP × 16.8%）。CD 1 回合。灼焰形态外不可用。',
  '终绝将至之刻': '<b style="color:var(--gold)">终绝将至之刻</b>（赞妮终结解放 · 自动触发）<br><b class="term-state">灼焰形态</b> 3 回合结束时自动施放，不消耗 AP。<br>对主目标造成 HP × 20% 衍射伤害（副目标半额）。<br>3 链：按本场消耗焰光总量每点 +2%（最多 +200% → HP × 60%）。<br>施放后退出灼焰形态、清空焰光。',
  '烈阳余烬': '<b style="color:#ff9b3a">烈阳余烬</b>（赞妮团队资源 · 简化版）<br>官方为队友施加光噪效应时转化、每层 6 秒、上限 60 层。模拟器简化为<b class="term-state">灼焰形态</b>内每回合自动 +10 焰光，不再追踪层数与团队联动。',
  '乐声': '<b style="color:#c39bff">乐声</b>（弗洛洛专属资源 · 0-6 枚）<br>普攻/共鸣技能/重击/变奏各 +1，战斗开始 +4（固有·八重奏）。满 6 枚时重击替换为<b class="term-heavy">谱曲终末</b>。指挥状态期间赫卡忒每次攻击 +1。',
  '余响': '<b style="color:#c39bff">余响</b>（弗洛洛奏回路资源 · 0-24 层 · 双重放大器）<br>全动作积累，战斗开始 +10。<br>· <b>收益一</b>：每层使<b class="term-heavy">谱曲终末</b>倍率 +20%（2链 +35%），满 24 层 ×3.0<br>· <b>收益二</b>：每层暴伤 +2.5%（满层 +60% 暴伤，固有·八重奏）',
  '定音': '<b style="color:var(--accent)">定音</b>（弗洛洛状态 · 解锁解放）<br>施放<b class="term-heavy">谱曲终末</b>后进入。处于定音状态才能施放<b class="term-burst">共鸣解放·往日深渊的圆舞曲</b>（0AP，对应官方"能量上限为0"）。解放后退出定音，进入<b class="term-state">指挥状态</b>。',
  '指挥状态': '<b style="color:#9b6dff">指挥状态</b>（弗洛洛终极形态 · 3 回合）<br>施放<b style="color:var(--gold)">共鸣解放·往日深渊的圆舞曲</b>后进入（0AP，需定音）。<br>· 弗洛洛攻击 +120%，本人正常行动（不锁定）<br>· 召唤<b class="term-resource">赫卡忒</b>（HP = 弗洛洛 HP × 1.0），每回合自动攻击 HP×12%（+1 乐声+2 余响），每第 2 次后强化 HP×24%（+1 乐声+3 余响）<br>· <b>赫卡忒替主人挡刀</b>，HP 归零则指挥状态立即结束<br>· 5 链：受伤 -30%；6 链：登场湮灭 +60% / 非登场受伤 +40%<br>· 切人时消失（指挥状态不保留）',
  '赫卡忒': '<b style="color:#9b6dff">赫卡忒</b>（弗洛洛召唤物 · 指挥状态期间存在）<br>HP = 弗洛洛 HP × 1.0（继承属性）。每回合自动攻击 HP×12%，每第 2 次后强化 HP×24%（6 链 +24%）。<b>替主人挡刀</b>，主人受伤优先由赫卡忒承担，overflow 打主人。HP 归零则消散，指挥状态立即结束。不可被玩家控制、不可切换。',
  '谱曲终末': '<b style="color:#ff6b9d">谱曲终末</b>（弗洛洛核爆招 · 重击替换 · 共鸣技能伤害 + 声骸技能）<br>满 6 枚<b class="term-resource">乐声</b>时，重击替换为谱曲终末。消耗 2AP + CD 1 回合。<br>对主目标造成 HP × 20% 湮灭 AOE 伤害。消耗全部 6 枚乐声。<br>每层<b class="term-resource">余响</b> +20% 倍率（2链 +35%），满 24 层 ×3.0（满层核爆约 HP×348%）。<br>施放后进入<b class="term-state">定音</b>状态。<br>2 链：倍率 +75% + 余响效果 +75% + 施放后 +14 余响。3 链：声骸技能伤害 +80%。',
  '墨鹤': '<b style="color:#7bd6ff">墨鹤</b>（折枝召唤物 · 上限 6 / 12）<br><b style="color:var(--burst)">共鸣解放·虚实境趣</b>展开<b class="term-resource">墨鹤领域</b> 3 回合并初召 6 只墨鹤（2 链上限 +6 = 12 只）。<br>领域内己方攻击命中主目标时消耗 <b>1</b> 只墨鹤追击，每只造成 atk × 35% 冷凝伤害（共鸣解放类型），墨鹤耗尽停止追击。',
  '墨鹤领域': '<b style="color:#7bd6ff">墨鹤领域</b>（折枝共鸣解放状态 · 3 回合）<br><b style="color:var(--burst)">共鸣解放·虚实境趣</b>展开，期间<b class="term-resource">墨鹤</b>跟随己方攻击追击。4 链「随类赋彩」期间全队攻击 +20%（与领域同寿）。领域结束自动清零墨鹤与计数。',
  '点睛': '<b style="color:#7bd6ff">点睛</b>（折枝重击 · 护盾转化）<br>折枝在墨鹤领域内可释放。消耗 ⌊当前墨鹤/2⌋ 只（至少 1 只），每只转化为 atk × 50% 的<b>全队护盾</b>。剩余半数墨鹤继续追击。CD 2 回合，不造成伤害、不触发墨鹤追击。',
  '邃古遗墟': '<b style="color:#7bd6ff">邃古遗墟</b>（相里要 buff · 5 次）<br>释放<b style="color:var(--gold)">共鸣解放·思维矩阵</b>后获得 <b>5</b> 次。<br>每次<b style="color:var(--accent)">共鸣技能</b>消耗 1 次，让本次伤害 +63%（24 秒内有效）。',
  '锐意': '<b style="color:var(--gold)">锐意之势</b>（忌炎专属，简写）<br>详见<b style="color:var(--gold)">锐意之势</b>。',
  '晶体': '<b style="color:#7bd6ff">晶体</b>（珂莱塔旧称资源）<br>当前以<b style="color:#7bd6ff">灵萃</b>表现：命中解离/变彩目标回复灵萃，满后<b style="color:var(--accent)">共鸣技能</b>进入<b style="color:var(--gold)">暴力美学</b>强化形态。',
  '灵萃': '<b style="color:#7bd6ff">灵萃</b>（珂莱塔共鸣回路）<br>对解离目标命中共鸣技能<b style="color:var(--accent)">示我璀璨</b>额外回 30 灵萃（1 链）。满后<b style="color:var(--accent)">共鸣技能</b>进入<b style="color:var(--gold)">暴力美学</b>强化。',
  '决意': '<b style="color:var(--gold)">决意</b>（卡提希娅专属资源 · 上限 3 层）<br>普攻/重击/共鸣技能命中时获得 <b>1</b> 层（持续 2 回合，获得新决意时刷新全部持续时间）。<br>每层：自身<b class="term-normal">气动伤害</b> +<b>10%</b>。消耗全部层数进入芙露德莉斯形态。',
  '人权': '<b style="color:#6bb5ff">人权</b>（卡提希娅形态之力 · 消耗 1 层决意获得）<br>芙露德莉斯形态下防御力增强，受到伤害 <b>-30%</b>。',
  '神权': '<b style="color:var(--gold)">神权</b>（卡提希娅形态之力 · 消耗 2 层决意获得）<br>芙露德莉斯形态下暴击率 <b>+25%</b>。',
  '异权': '<b style="color:#ff6b9d">异权</b>（卡提希娅形态之力 · 消耗 3 层决意获得）<br>芙露德莉斯形态下，非大招技能（普攻/重击/共鸣技能）叠加 <b>2 层</b>风蚀效应（取代 1 层）。',
  '听骑士从心祈愿': '<b style="color:var(--gold)">共鸣解放·听骑士从心祈愿</b>（卡提希娅第一次解放 · 3 AP）<br>消耗全部【决意】层数，根据消耗层数获得人权/神权/异权，进入<b style="color:#a78bff">芙露德莉斯形态</b>。<br>此技能无直接伤害。',
  '看潮怒风哮之刃': '<b style="color:#ff6b9d">共鸣解放·看潮怒风哮之刃</b>（卡提希娅第二次解放 · 3 AP · 需芙露德莉斯形态中）<br>基于生命值 × 46.2% + 每层<b style="color:var(--green)">风蚀效应</b> +20% 伤害。<br>施放后清空全部风蚀并退出芙露德莉斯形态。6 链时层数翻倍、不清空。',
  '风蚀效应': '<b style="color:var(--green)">风蚀效应</b>（气动属性效应 · 可叠层 DoT）<br>部分气动角色的技能可为敌人附加。<br>敌人回合开始时造成伤害 = 敌人攻击力 × 层数 × <b>0.3</b>。<br>芙露德莉斯形态第二次解放·看潮怒风哮之刃：每层 <b>+20%</b> 伤害，施放后清空全部风蚀。',
  '芙露德莉斯': '<b style="color:#a78bff">芙露德莉斯形态</b>（卡提希娅解放强化 · 持续 3 回合）<br>进入方式：共鸣解放·听骑士从心祈愿（消耗全部【决意】层数）<br>· 每次攻击/技能给目标附加 <b>1</b> 层风蚀效应（异权：<b>2</b> 层）<br>· 命中额外回复 <b>+8</b> 共鸣能量<br>· 再次释放共鸣解放 → 看潮怒风哮之刃：风蚀爆发终结<br>形态结束时清除人权/神权/异权状态。',
  '余火': '<b style="color:#ff8c5e">余火</b>（嘉贝莉娜共鸣回路 · 0-10 点）<br>每 1 点给 8% 暴击伤害（1 链）、3.5% 热熔加深（6 链）。<b style="color:var(--burst)">共鸣解放·永恒位格</b>开启强化形态。',
  '永恒位格': '<b style="color:var(--gold)">永恒位格</b>（嘉贝莉娜解放强化 · 持续战斗剩余时间）<br>进入方式：释放<b style="color:var(--burst)">共鸣解放·永恒位格</b>触发。<br>· 6 链：自身全伤害 +<b>60%</b>，余火满层热熔加深 +<b>35%</b><br>· 4 链：声骸技能后全队伤害 +<b>20%</b><br>· 是嘉贝莉娜的主输出窗口，配合重击·炼羽裁决',
  '杀意': '<b style="color:var(--gold)">杀意</b>（卡卡罗解放强化）<br><b style="color:var(--burst)">共鸣解放·杀戮武装</b>开启<b style="color:var(--gold)">Deathblade 形态</b>，期间普攻/技能 +50%，持续 <b>2</b> 回合。',
  'Deathblade': '<b style="color:var(--gold)">Deathblade 形态</b>（卡卡罗解放强化 · 持续 2 回合）<br>进入方式：释放<b style="color:var(--burst)">共鸣解放·杀戮武装</b>触发。<br>· 普攻/技能 +<b>50%</b><br>· 3 链：解放期间导电伤害 +<b>25%</b><br>· 6 链：每次重击·死告召唤 2 个猎杀影协同攻击（atk × 100% 导电）<br>· 2 回合后自动退出，重新攒满能量再开',
  '想象力': '<b style="color:#a78bff">想象力</b>（洛可可共鸣回路）<br><b style="color:var(--accent)">共鸣技能·高难度设计</b>回 100 想象力 + 10 协奏。普攻每段给全队<b style="color:#a78bff">湮灭伤害</b> +10%（满 3 层 +40%）。',
  '迷离': '<b style="color:#a78bff">迷离</b>（坎特蕾拉共鸣回路）<br><b style="color:var(--accent)">共鸣技能</b>每次释放 +1 点。配合<b style="color:#a78bff">迷梦</b>状态触发<b style="color:#a78bff">惊醒</b>爆发伤害。',
  '迷梦': '<b style="color:#a78bff">迷梦</b>（坎特蕾拉 debuff）<br><b style="color:var(--burst)">共鸣解放·陷溺</b>给目标附加迷梦状态，触发<b style="color:#a78bff">惊醒</b>大幅放大伤害（2 链 +245%）。',
  '惊醒': '<b style="color:var(--gold)">惊醒</b>（坎特蕾拉爆发触发）<br>对带<b style="color:#a78bff">迷梦</b>状态的目标命中时触发，造成<b class="term-burst">共鸣解放</b>类型伤害。',
  '蜃境': '<b style="color:#a78bff">蜃境</b>（坎特蕾拉解放后状态）<br>进入方式：3 链：施放<b style="color:var(--burst)">共鸣解放·陷溺</b>后直接进入；无 3 链时需要触发条件（迷离满 + 释放陷溺）。<br>· 4 链：蜃境期间治疗加成 +<b>25%</b><br>· 是坎特蕾拉的输出窗口，配合<b>惊醒</b>触发爆发<br>· 重复释放陷溺不会重复进入',
  '光噪效应': '<b style="color:var(--accent)">光噪效应</b>（菲比 debuff · 衍射易伤）<br>由<b style="color:var(--accent)">共鸣技能·FFF</b>的<b class="term-resource">镜之环</b>附加。<b style="color:#ff8c5e">重击·星辉</b>引爆：2 链对光噪目标伤害 +120%。',
  '福音': '<b style="color:#a78bff">福音</b>（菲比共鸣回路 · 切换形态）<br>普攻/共鸣技能积累，满 <b>1</b> 点可消耗切换<b style="color:var(--gold)">赦罪</b>/<b style="color:#a78bff">告解</b>双形态。<br><br>切换规则：<br>· 默认：<b style="color:var(--gold)">赦罪</b>形态（衍射 buff 主导）<br>· 施放<b style="color:var(--accent)">共鸣技能·FFF</b>时消耗 <b>1</b> 福音切换到<b style="color:#a78bff">告解</b><br>· 再次施放共鸣技能切回赦罪<br>· 战斗开始 / 切人入场重置为赦罪',
  '赦罪': '<b style="color:var(--gold)">赦罪</b>（菲比形态 1 · 默认形态）<br>强化共鸣解放的形态：<br>· 解放·启明之誓愿伤害倍率从 <b>255%</b> 提升到 <b>480%</b>（1 链）<br>· 重击星辉伤害 +<b>91%</b>（3 链）<br>· 战斗开始默认进入此形态<br>· 用<b style="color:#a78bff">福音</b>切换到<b>告解</b>形态',
  '告解': '<b style="color:#a78bff">告解</b>（菲比形态 2 · 切换形态）<br>强化重击的形态：<br>· 重击·星辉伤害 +<b>249%</b>（3 链）<br>· FFF 镜之环叠满光噪（1 链：附加层数提升至上限）<br>· 用<b style="color:#a78bff">福音</b>从赦罪切换而来；再次施放共鸣技能切回',
  '航向': '<b style="color:#ff8c5e">航向确定！</b>（布兰特延奏）<br>切下场后给登场角色加 buff；2 链：20 秒内队友共鸣技能命中时触发布兰特爆炸 atk×440% 热熔。',

  // ===== 常驻 5★ & 4★ 专属 =====
  '羊咩': '<b style="color:#ff8c5e">羊咩</b>（安可常态攻击体系）<br>安可与白咩/黑咩玩偶一起攻击。常态下是<b class="term-normal">羊咩出击</b> + <b class="term-skill">热力羊咩</b>；释放<b class="term-burst">黑咩大暴走</b>后进入黑咩形态。',
  '失序值': '<b style="color:#a78bff">失序值</b>（安可共鸣回路 · 0-100）<br>普攻 +<b>20</b> / 共鸣技能 +<b>35</b> / 变奏 +<b>30</b>；黑咩窗口内命中额外 +<b>10</b>。<br>满 <b>100</b> 时施放重击，消耗全部失序值并触发<b class="term-burst">白咩·失控之炎</b>或<b class="term-burst">黑咩·暴走之炎</b>（均视为共鸣解放伤害）。',
  '黑咩大暴走': '<b style="color:#a78bff">黑咩大暴走</b>（安可共鸣解放 · 强化形态）<br>释放后进入<b style="color:#a78bff">黑咩形态</b>，持续 <b>4</b> 回合。期间攻击和技能获得强化，命中额外 +<b>10</b> <b class="term-resource">失序值</b>。',
  '行狮': '<b style="color:var(--gold)">行狮形态</b>（凌阳解放强化 · 持续战斗剩余时间）<br>进入方式：释放<b style="color:var(--burst)">共鸣解放·狮子奋迅</b>触发。<br>· 3 链：普攻 +<b>20%</b> / 共鸣技能 +<b>10%</b><br>· 6 链：每次共鸣技能·飞身式后，下次普攻 +<b>100%</b><br>· 1 链：行狮状态期间抗打断<br>· 形态持续到下一次进入战斗 / 切人下场',
  '架势': '<b style="color:var(--green)">架势</b>（鉴心战斗状态）<br>进入方式：施放<b style="color:var(--accent)">共鸣技能·静气循行</b>。<br>· 进入架势姿态保持 <b>1</b> 回合<br>· 期间可施放<b style="color:var(--accent)">行气反击</b>（3 链：架势保持后才能打出）<br>· 2 链：静气循行使用次数 +<b>1</b><br>· 5 链：解放·涤净力场范围 +<b>33%</b>',
  '雾化分身': '<b style="color:var(--green)">雾化分身</b>（秋水召唤物）<br><b style="color:var(--accent)">共鸣技能·移位戏法</b>召唤；嘲讽敌人，2 链：秋水攻击被嘲讽目标 +15% 攻击。',
  '热压弹': '<b style="color:#ff8c5e">热压弹</b>（炽霞解放资源）<br><b style="color:var(--burst)">共鸣解放·炽烈焰火</b>开启时获 60 发，配合重置技能 CD 实现高速持续输出。',
  '朱蚀之刻': '<b style="color:#a78bff">朱蚀之刻</b>（丹瑾 debuff）<br><b style="color:var(--accent)">共鸣技能·朱蚀之刻</b>给目标附加。攻击带朱蚀的目标时丹瑾攻击 +5%/层（满 6 层 +30%），伤害 +20%（2 链）。',
  '彤华': '<b style="color:#a78bff">彤华</b>（丹瑾共鸣回路 · 0-100）<br>≥ 60 时丹瑾暴击 +15%（4 链）。<b style="color:#ff8c5e">重击·缭乱</b>消耗所有彤华。',
  '雷厉风行': '<b style="color:#7bd6ff">雷厉风行</b>（渊武战斗状态）<br>1 链：进入后普攻/重击攻速 +20%（等效提升攻击 +10%）。',
  '诗中物': '<b style="color:#7bd6ff">诗中物</b>（釉瑚共鸣回路）<br>对偶/联珠/合说三种叠层触发不同效果；2 链：对偶/联珠/合说对诗中物的伤害额外生效一次。',

  // ===== 战斗状态 / debuff / 派生技能 =====
  '冰绽': '<b style="color:#7bd6ff">冰绽</b>（散华共鸣回路 · 冰锥引爆）<br><b style="color:#ff8c5e">重击·爆裂</b>引爆累计的<b>冰棘</b>/<b>冰棱</b>/<b>冰川</b>造成冷凝伤害。<br>· 5 链：冰绽暴击伤害 +<b>100%</b>，冰棘/冰棱/冰川消失时自动爆炸（不需手动引爆）<br>· 6 链：引爆冰棱/冰川后全队攻击 +<b>10%</b>，可叠 <b>2</b> 层',
  '焕彩': '<b style="color:var(--gold)">焕彩</b>（珂莱塔解放 debuff · 停滞效果）<br><b style="color:var(--burst)">共鸣解放·死兆</b>的射击命中目标时附加：<br>· 目标持续时间内无法行动（停滞）<br>· 受到伤害或持续 <b>1.5</b> 秒时清除',
  '行气反击': '<b style="color:var(--accent)">行气反击</b>（鉴心派生技能 · 架势后触发）<br>处于<b>架势</b>状态时，下次施放<b style="color:var(--accent)">共鸣技能</b>会变为<b>行气反击</b>。<br>· 高倍率气动伤害<br>· 6 链：在重击·混元气旋期间可施放<b>特殊行气反击</b>（atk × <b>557%</b> 重击类型）',
  '迷失羔羊': '<b style="color:#a78bff">迷失羔羊</b>（安可 6 链 buff · 0-5 层）<br><b style="color:var(--burst)">共鸣解放·黑咩大暴走</b>期间，每次造成伤害自身叠 <b>1</b> 层，每层使攻击 +<b>5%</b>，最多 <b>5</b> 层（满层 +25% 攻击）。',

  // ===== 通用战斗机制 =====
  '空中攻击': '<b style="color:#ff8c5e">空中攻击</b>（部分角色机制）<br>跳跃 / 腾空后的派生攻击。战斗中按<b style="color:#ff8c5e">重击</b>类型结算，享受重击伤害加成。典型代表：卡提希娅、布兰特、秧秧。',
  '空中攻击空翻': '<b style="color:#ff8c5e">空中攻击空翻</b>（布兰特机制）<br>布兰特在空中做空翻，是其核心爆发段。每次空翻给布兰特<b style="color:#ff8c5e">"跟随洋流和信风"</b> +1 层伤害提升（1 链）。战斗中按<b style="color:#ff8c5e">重击</b>类型结算。',
  '空中释羽': '<b style="color:#ff8c5e">空中释羽</b>（秧秧标志性输出段）<br>秧秧跳跃后释放羽箭群的派生<b style="color:#ff8c5e">重击</b>。是秧秧的主要爆发段。<br>· 4 链：空中释羽伤害 +<b>95%</b><br>· 6 链：施放后全队攻击 +<b>20%</b>，持续 20 秒',
  '闪避反击': '<b style="color:var(--green)">闪避反击</b>（部分角色机制）<br>成功闪避后立刻反击的派生动作。战斗中视作变奏类派生，通常用于触发角色的反击/追击效果。',
  '强化·前扑': '<b style="color:var(--accent)">强化·前扑</b>（灯灯派生）<br>灯灯特定条件下普攻强化为前扑，向目标突进。<br>· 2 链：前扑攻击无视 <b>20%</b> 防御',
  '强化·后撤': '<b style="color:var(--accent)">强化·后撤</b>（灯灯派生）<br>灯灯特定条件下普攻强化为后撤，拉远距离同时攻击。<br>· 1 链：后撤后 <b>3</b> 秒内回复 <b>60%</b> 耐力<br>· 2 链：后撤攻击无视 <b>20%</b> 防御',
  '牵引': '<b style="color:var(--green)">牵引</b>（控场效果）<br>把附近敌人拉到一起，方便范围伤害命中更多目标。战斗中表现为聚怪效果，提高 AOE 技能的命中价值。典型代表：秧秧·风场鸣声、菲比·镜之环。',
  '风场鸣声': '<b style="color:var(--accent)">风场鸣声</b>（秧秧共鸣技能）<br>召唤气动风场，<b>牵引</b>范围内敌人到一起。<br>· 3 链：风场牵引范围 +<b>33%</b>',
  '停滞': '<b style="color:var(--gold)">停滞</b>（控制 debuff）<br>使目标短暂无法行动的状态，类似"冻结"但只锁动作不锁伤害。<br>触发：珂莱塔·焕彩、菲比·镜之环、坎特蕾拉·迷梦、布兰特·火焰归亡曲等。',
  '嘲讽': '<b style="color:var(--green)">嘲讽</b>（仇恨控制 debuff）<br>使敌人优先攻击指定目标，保护队伍中的输出角色。典型代表：秋水·雾化分身。',
  '协同攻击': '<b style="color:var(--accent)">协同攻击</b>（召唤物/链接攻击）<br>角色下场后由召唤物/连接物触发的攻击。在模拟器中由其他机制触发，享受当前角色的攻击/暴击。<br>典型代表：折枝·墨鹤追击、莫特斐·浮翼狂想协同、维里奈 6 链协同。',
  '再燃': '<b style="color:#ff8c5e">再燃</b>（布兰特解放 6 链派生）<br>施放<b style="color:var(--burst)">火焰归亡曲</b>后在原地产生一次<b style="color:#ff8c5e">再燃</b>爆炸，造成火焰归亡曲 <b>30%</b> 的伤害，此次伤害为<b style="color:var(--text)">普攻</b>类型。',

  // ===== 召唤物 =====
  '猎杀影': '<b style="color:#7bd6ff">猎杀影</b>（卡卡罗 6 链召唤物）<br><b style="color:var(--gold)">Deathblade</b> 形态下，每次<b style="color:#ff8c5e">重击·死告</b>召唤 <b>2</b> 个猎杀影协同攻击，每个造成 atk × <b>100%</b> 导电伤害，视为<b style="color:var(--burst)">共鸣解放</b>类型。',
  '白鹤': '<b style="color:#7bd6ff">白鹤</b>（折枝 6 链召唤物）<br>施放<b style="color:var(--accent)">共鸣技能·以形写神</b>命中时，额外召唤 <b>1</b> 只白鹤，造成折枝 atk × 120% 冷凝伤害（共鸣技能伤害类型）。白鹤独立结算，不计入<b class="term-resource">墨鹤</b>计数。',
  '衍构模体': '<b style="color:#7bd6ff">衍构模体</b>（相里要 1 链召唤物）<br>施放<b style="color:var(--accent)">共鸣技能·万方法则</b>时，额外生成 <b>6</b> 个衍构模体攻击目标，每个伤害倍率为万方法则的 <b>8%</b>，此次伤害视为<b style="color:var(--burst)">共鸣解放</b>类型。',
  '织梦水母': '<b style="color:#7bd6ff">织梦水母</b>（坎特蕾拉 5 链召唤物）<br><b style="color:var(--burst)">共鸣解放·弥漫</b>召唤的水母群。每只持续协同攻击。<br>· 5 链：最大召唤数 +<b>5</b>',
  '雷之楔': '<b style="color:var(--accent)">雷之楔</b>（渊武召唤物）<br>渊武<b style="color:var(--accent)">共鸣技能·雷之楔</b>召唤的雷电协同武器，存在期间持续协同攻击。<br>· 3 链：命中按渊武 20% 防御额外加伤<br>· 5 链：雷之楔在场时渊武解放 +<b>50%</b>',
  '镜之环': '<b style="color:var(--accent)">镜之环</b>（菲比召唤区域）<br><b style="color:var(--accent)">共鸣技能·FFF</b>召唤；持续期间对进入的目标附加<b class="term-resource">光噪效应</b> + <b>停滞</b>效果（最多 12 个目标，每个 1 次）。',

  // ===== 状态 / debuff =====
  '解离': '<b style="color:#7bd6ff">解离</b>（珂莱塔特性 · debuff）<br>珂莱塔技能给目标附加的冷凝易伤标记。命中解离目标时，珂莱塔可获得额外灵萃。<br>· 1 链：对解离目标暴击 +<b>12.5%</b>',
  '变彩': '<b style="color:#7bd6ff">变彩</b>（珂莱塔 1 链状态 · debuff）<br>珂莱塔对解离目标施加的进阶状态，命中变彩目标时<b style="color:var(--accent)">共鸣技能·示我璀璨</b>额外回 30 灵萃。',
  '虚实之门': '<b style="color:var(--green)">虚实之门</b>（秋水召唤区域）<br>秋水<b style="color:var(--accent)">共鸣技能·移位戏法</b>召唤的传送门，配合<b class="term-resource">雾化分身</b>。<br>· 3 链：普攻穿过虚实之门额外生成 <b>2</b> 颗子弹<br>· 6 链：重击穿过虚实之门伤害额外 +<b>50%</b>',
  '迷雾潜行': '<b style="color:var(--green)">迷雾潜行</b>（秋水战斗状态）<br>秋水进入隐身潜行状态。<br>· 4 链：潜行期间受到的伤害 -<b>30%</b><br>· 5 链：潜行期间秋水气动伤害加成 +<b>25%</b>',
  '阴阳相生': '<b style="color:#7bd6ff">阴阳相生</b>（卜灵战斗状态）<br>卜灵<b style="color:var(--accent)">共鸣技能·五雷荡煞阵</b>触发的双形态平衡态。<br>· 2 链：进入阴阳相生时回 <b>25</b> 共鸣能量',
  '五雷荡煞阵': '<b style="color:var(--gold)">五雷荡煞阵</b>（卜灵共鸣技能）<br>召唤雷阵覆盖战场，对范围内敌人附加<b>电磁效应</b> + 全队治疗。<br>· 3 链：荡煞阵期间队友 HP < 50% 时立即治疗<br>· 5 链：生成时附加 <b>6</b> 层电磁效应',
  '雷法·三才合一': '<b style="color:var(--gold)">雷法·三才合一</b>（卜灵 6 链终极形态）<br>触发条件：完整完成<b>阴阳相生</b>叠层。<br>· 期间登场角色获得<b style="color:var(--accent)">共鸣技能伤害加成</b> +<b>50%</b>',
  '电磁效应': '<b style="color:#7bd6ff">电磁效应</b>（导电类 debuff · 0-N 层）<br>导电角色给目标附加的层数 debuff。叠满后触发"电导聚能"放大伤害。<br>典型来源：卜灵·五雷荡煞阵、吟霖·磁殛咆哮。',
  '加麻加辣': '<b style="color:#ff8c5e">加麻加辣</b>（炽霞固有技能）<br>炽霞普攻 / 重击命中目标的层数 buff，叠满给攻击 buff。<br>· 5 链：叠加至满层时攻击额外 +<b>30%</b>',
  '霁青': '<b style="color:#7bd6ff">霁青</b>（釉瑚 6 链 buff · 0-4 层）<br>每次施放<b style="color:var(--accent)">共鸣技能·奇珍赏</b>获得 <b>1</b> 层，最多 <b>4</b> 层（持续 7 秒）。<br>· 每层使釉瑚暴击伤害 +<b>15%</b>（满层 +60%）',
  '天籁': '<b style="color:#7bd6ff">天籁</b>（白芷固有技能 · 战场掉落物）<br>白芷战斗中产生的掉落物，队友拾取触发 buff。<br>· 6 链：拾取天籁时附近全队冷凝伤害加成 +<b>12%</b>',
  '念意': '<b style="color:#7bd6ff">念意</b>（白芷共鸣回路 · 0-4 点）<br>普攻积攒，满 <b>4</b> 点时<b style="color:var(--accent)">共鸣技能·应急预案</b>触发<b>频隙回响</b>（治疗 + 冷凝 buff）。<br>· 1 链：每消耗 1 念意回 <b>2.5</b> 能量',
  '频隙回响': '<b style="color:var(--accent)">频隙回响</b>（白芷共鸣解放派生）<br>满 4 念意时施放<b style="color:var(--burst)">共鸣解放·刹那合弥</b>触发的多段治疗 + 冷凝攻击。<br>· 4 链：频隙回响 +<b>2</b> 段 + 治疗 +<b>20%</b>',
  '攻防转换': '<b style="color:var(--green)">攻防转换</b>（桃祈共鸣回路 · 派生攻击 / 护盾）<br>桃祈<b style="color:#ff8c5e">重击</b>触发的反击 + 护盾派生段。<br>· 1 链：获得的护盾量 +<b>40%</b><br>· 5 链：攻防转换伤害 +<b>50%</b>，命中回 <b>20</b> 能量',
  '光合能量': '<b style="color:var(--green)">光合能量</b>（维里奈资源）<br><b style="color:var(--accent)">共鸣技能·扩繁试验</b>积攒 <b>1</b> 点，满后可释放<b style="color:var(--burst)">共鸣解放·草木生长</b>。<br>· 2 链：技能额外回 1 光合 + 10 协奏',
  '光合标记': '<b style="color:var(--green)">光合标记</b>（维里奈解放 buff）<br><b style="color:var(--burst)">共鸣解放·草木生长</b>给全队挂的持续治疗状态。<br>· 3 链：光合标记治疗加成 +<b>12%</b>',

  // ===== 釉瑚的对偶/联珠/合说 =====
  '对偶': '<b style="color:#7bd6ff">对偶</b>（釉瑚<b class="term-resource">诗中物</b>派生 1）<br>釉瑚共鸣技能配合诗中物触发的派生段之一，对目标造成冷凝伤害。<br>· 2 链：对诗中物的伤害额外生效一次',
  '联珠': '<b style="color:#7bd6ff">联珠</b>（釉瑚<b class="term-resource">诗中物</b>派生 2）<br>釉瑚共鸣技能配合诗中物触发的派生段之二，对目标造成冷凝伤害。<br>· 2 链：对诗中物的伤害额外生效一次',
  '合说': '<b style="color:#7bd6ff">合说</b>（釉瑚<b class="term-resource">诗中物</b>派生 3）<br>釉瑚共鸣技能配合诗中物触发的派生段之三，三段同时触发即为完整诗中物。<br>· 2 链：对诗中物的伤害额外生效一次',

  // ===== 安可/凌阳的形态招式（之前 forteDesc 提了但没解释）=====
  '热力羊咩': '<b style="color:var(--accent)">热力羊咩</b>（安可共鸣技能）<br>召唤白咩与黑咩，用高温射线攻击目标。战斗中按一次共鸣技能完成完整射线攻击，命中回复 <b>35</b> 失序值。',
  '热情欢迎式': '<b style="color:var(--accent)">热情欢迎式</b>（安可共鸣技能连续攻击）<br>在施放<b>热力羊咩</b>后衔接释放的追加攻击。战斗中作为<b style="color:var(--accent)">热力羊咩</b>的一部分结算。',
  '黑咩·胡闹': '<b style="color:#a78bff">黑咩·胡闹</b>（安可黑咩窗口普攻）<br><b style="color:var(--burst)">黑咩大暴走</b>期间，普攻·羊咩出击替换为黑咩·胡闹。普攻伤害 ×<b>1.5</b>，命中额外 +<b>10</b> 失序值。',
  '黑咩·狂热': '<b style="color:#a78bff">黑咩·狂热</b>（安可黑咩窗口共鸣技能）<br><b style="color:var(--burst)">黑咩大暴走</b>期间，共鸣技能·热力羊咩替换为黑咩·狂热。技能伤害 ×<b>1.5</b>，命中额外 +<b>10</b> 失序值。',
  '白咩失控之炎': '<b style="color:#ff8c5e">白咩·失控之炎</b>（安可失序满 · 常态特殊重击）<br>常态下<b class="term-resource">失序值</b>满 <b>100</b> 时施放重击触发，消耗全部失序值，造成热熔伤害。官方归类为<b class="term-burst">共鸣解放伤害</b>。<br>· 3 链：白咩/黑咩特殊重击伤害倍率 +<b>40%</b>',
  '黑咩暴走之炎': '<b style="color:#a78bff">黑咩·暴走之炎</b>（安可失序满 · 黑咩形态特殊重击）<br><b class="term-burst">黑咩大暴走</b>期间，失序值满 <b>100</b> 时施放重击触发，消耗全部失序值，造成更高热熔伤害。官方归类为<b class="term-burst">共鸣解放伤害</b>。<br>· 3 链：白咩/黑咩特殊重击伤害倍率 +<b>40%</b><br>· 4 链：施放黑咩·暴走之炎时全队热熔伤害加成 +<b>20%</b>',
};

// 把 dict 的 key 按长度从长到短排序，避免短词先匹配（"变奏"先于"变奏技能"）
const TERM_KEYS_SORTED = Object.keys(TERM_DICT).sort((a, b) => b.length - a.length);

// HTML 属性转义：data-tip 用单引号包，所以把 & 和 ' 转掉
function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;');
}

// 把已经高亮过的 <b class="term-xxx">关键词</b> 自动再包一层 .tip-term[data-tip]
// 用法：renderXxx() 最后 attachTermTips(html) 一次
// 注意：本函数只处理 <b class="term-...">...</b>（避免对纯文本里同名词命中）
export function attachTermTips(html) {
  if (!html) return '';
  // Step 1: 保护 data-tip 属性内容，防止 term 在 tooltip 内部被二次替换
  const tipContents = [];
  let tipIdx = 0;
  let safe = String(html).replace(/ data-tip='([^']*)'/g, (full, content) => {
    const idx = tipIdx++;
    tipContents.push(content);
    return ` data-tip='__TPROT_${idx}__'`;
  });
  safe = safe.replace(/ data-tip="([^"]*)"/g, (full, content) => {
    const idx = tipIdx++;
    tipContents.push(content);
    return ` data-tip="__TPROT_${idx}__"`;
  });
  // Step 2: 在受保护区域外替换 term
  const processed = safe.replace(/<b\s+class="(term-[\w-]+)"\s*>([^<]+)<\/b>/g, (full, cls, inner) => {
    const text = inner.trim();
    if (TERM_DICT[text]) {
      return `<span class="tip-term" data-tip='${escAttr(TERM_DICT[text])}'>${full}</span>`;
    }
    for (const key of TERM_KEYS_SORTED) {
      if (text.includes(key)) {
        return `<span class="tip-term" data-tip='${escAttr(TERM_DICT[key])}'>${full}</span>`;
      }
    }
    return full;
  });
  // Step 3: 还原 protected data-tip 内容
  return processed.replace(/__TPROT_(\d+)__/g, (full, idx) => {
    return tipContents[parseInt(idx)] || '';
  });
}
