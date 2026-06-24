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
  '共鸣解放': '<b style="color:var(--gold)">共鸣解放</b><br>3 AP · 需共鸣能量满。AOE 高伤（基础倍率 <b>300%</b> 攻击）· 削破韧 30。',
  '共鸣技能': '<b style="color:var(--accent)">共鸣技能</b><br>1 AP · 默认 CD 3 回合（部分共鸣链可减）。单体 180% 攻击 · 削破韧 20 · +22 能量。',
  '重击': '<b style="color:#ff8c5e">重击</b><br>2 AP · CD 1 回合。220% 攻击 · 削破韧 25 · +15 能量。',
  '普攻': '<b style="color:var(--text)">普攻</b><br>1 AP。100% 攻击 · 削破韧 8 · +12 能量。',
  '破韧值': '<b style="color:var(--green)">破韧值</b><br>敌人的硬直条。打满后进入<b>易伤期 2 回合</b>，且当前回合 <b>+2 AP</b>（爆发窗口）。',
  '破韧': '<b style="color:var(--green)">破韧值</b><br>敌人的硬直条。打满后进入<b>易伤期 2 回合</b>，且当前回合 <b>+2 AP</b>（爆发窗口）。',

  // ===== 忌炎专属 =====
  '锐意之势': '<b style="color:var(--gold)">锐意之势</b>（忌炎专属）<br>每次<b style="color:#ff8c5e">重击</b> / <b style="color:var(--accent)">共鸣技能</b> / <b style="color:var(--accent)">变奏入场</b>积 <b>1</b> 层，上限 <b>2</b> 层（6 链 <b>3</b> 层）。<br>释放<b style="color:var(--gold)">共鸣解放</b>时消耗全部层数，<b>每层使解放伤害 +100%</b>（6 链 +120%）。<br>2 层 = 解放 <b>×3</b>；3 层 6 链 = 解放 <b>×4.6</b>。',
  '破阵值': '<b style="color:var(--gold)">破阵值</b>（忌炎共鸣回路）<br>普攻 +12 · 技能 +25 · 解放 +40。<br>积满 100 后，下次<b style="color:var(--text)">普攻</b>变成<b>枪扫风定·强化连段</b>（伤害 ×2）。',

  // ===== 守岸人专属 =====
  '星域': '<b style="color:var(--gold)">星域</b>（守岸人专属领域）<br>展开 <b>3</b> 回合（1 链 <b>5</b> 回合 + 切人不消散）<br>· 全队每回合回血<br>· 全队暴击率 +20% · 暴击伤害 +30%<br>· 2 链：星域内全队攻击 +40%<br>· 1 链：所有星域增益强度 ×2.5',

  // ===== 其他角色专属（占位，后续做哪个角色补哪个）=====
  '离火': '<b style="color:#ff8c5e">离火</b>（长离共鸣回路）<br>普攻 +1 / 技能 +2 / 解放 +3 层，上限 6 层。<br>积满后下次<b>普攻</b>派生「心眼·焚身以火」（重击 ×2.2）。',
  '韶光': '<b style="color:#7bd6ff">韶光</b>（今汐共鸣回路）<br>技能 +1 / 解放 +2 层，上限 4 层。<br>积满后下次<b style="color:var(--accent)">共鸣技能</b>进入强化形态（伤害 ×1.8）。',
  '红椿': '<b style="color:#c39bff">红椿</b>（椿共鸣回路）<br>普攻 +10 / 技能 +15 / 解放 +30，上限 100。<br>积满后下次<b style="color:var(--text)">普攻</b>进入强化形态（伤害 ×1.7）。',
  '晶体': '<b style="color:#7bd6ff">晶体</b>（珂莱塔共鸣回路）<br>技能 +1 / 解放 +2 层，上限 5 层。<br>积满后下次<b style="color:var(--accent)">共鸣技能</b>强化（伤害 ×2.0）。',
  '气动侵蚀': '<b style="color:var(--green)">气动侵蚀</b>（卡提希娅共鸣回路）<br>积满 3 层后下次<b style="color:var(--accent)">共鸣技能</b>给当前目标施加易伤 debuff（受气动伤害 +15%）。',
  '猎杀阈值': '<b style="color:#ff8c5e">猎杀阈值</b>（嘉贝莉娜共鸣回路）<br>积满 100 后<b style="color:var(--gold)">共鸣解放</b>伤害 ×1.6。',
  '杀意': '<b style="color:var(--gold)">杀意</b>（卡卡罗共鸣回路）<br>满后<b style="color:var(--gold)">共鸣解放</b>期间进入 <b>Deathblade</b> 形态：普攻/技能 +50%，持续 2 回合。',
  '决意': '<b style="color:var(--gold)">决意</b>（卡提希娅·芙露德莉斯专属）<br>原版机制：每 30 / 60 / 90 / 120 点决意叠加暴击伤害 +25%，最高 4 层。',
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
  // 匹配单层 <b class="term-xxx">...</b>，内部不再含 <b>
  return String(html).replace(/<b\s+class="(term-[\w-]+)"\s*>([^<]+)<\/b>/g, (full, cls, inner) => {
    // 先 trim 再查表
    const text = inner.trim();
    // 完全匹配优先
    if (TERM_DICT[text]) {
      return `<span class="tip-term" data-tip='${escAttr(TERM_DICT[text])}'>${full}</span>`;
    }
    // 子串匹配：查找文本里是否包含字典中某个 key（按长度优先）
    for (const key of TERM_KEYS_SORTED) {
      if (text.includes(key)) {
        return `<span class="tip-term" data-tip='${escAttr(TERM_DICT[key])}'>${full}</span>`;
      }
    }
    return full;
  });
}
