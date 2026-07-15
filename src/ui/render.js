// Preact 已接管所有 gacha 视图渲染（Stage 6.1b）
// render() 变为 no-op，只保留 initRoleModal 副作用注册

import { initRoleModal } from './render/roleModal.js';
import { saveState } from '../save.js';

export function render() {
  // Preact 已接管，不再 innerHTML 写
  // 仅保留存档副作用
  saveState();
}

initRoleModal({ render });

// 对原版共鸣链文案做关键词高亮（不改语义，只加 <b class="term-xxx">）
// 顺序要从长到短，避免"共鸣解放"被"共鸣"先匹配。
const CHAIN_TERM_PATTERNS = [
  // 数值百分比 / 数值秒数（最先匹配，避免影响后续文本）
  { re: /(\d+(?:\.\d+)?%)/g,                                                  cls: 'term-num' },
  { re: /(\d+(?:\.\d+)?\s*(?:秒|回合|层|点|次))/g,                            cls: 'term-num' },
  // 招式术语（长串优先 — 角色专属技能名先匹配，防止贪心截断）
  { re: /(看潮怒风哮之刃|听骑士从心祈愿)/g,                                    cls: 'term-burst' },
  { re: /(共鸣解放[··]终末回环|共鸣解放|终末回环)/g,                       cls: 'term-burst' },
  { re: /(共鸣技能[··][一-龥]{2,6}|共鸣技能)/g,                   cls: 'term-skill' },
  { re: /(共鸣回路|延奏技能|变奏技能|变奏|延奏|协奏)/g, replaceCls: dynamicTermCls },
  { re: /(重击)/g,                                                            cls: 'term-heavy' },
  { re: /(普攻)/g,                                                            cls: 'term-normal' },
  // 角色独有资源/状态名
  { re: /(星蝶|星域|破阵值|破阵|离火|韶光|晶体|红椿|杀意|猎杀阈值|决意|气动侵蚀|衍射失序|心眼模式|心眼[··][征劫冲]|心眼|焰羽)/g, cls: 'term-resource' },
  // 折枝 专属术语（长串优先 — 墨鹤领域需排在墨鹤之前）
  { re: /(墨鹤领域|墨鹤|白鹤|点睛|鹤影)/g, cls: 'term-resource' },
  // 卡提希娅 专属术语
  { re: /(风蚀效应|芙露德莉斯)/g, cls: 'term-resource' },
  { re: /(人权|神权|异权)/g, cls: 'term-resource' },
  // 弗洛洛 专属术语（长串优先 — 谱曲终末需排在乐声/余响前）
  { re: /(谱曲终末|往日深渊的圆舞曲)/g, cls: 'term-heavy' },
  { re: /(亡与死的乐章|永不消逝的梦呓)/g, cls: 'term-skill' },
  { re: /(指挥状态|定音|赫卡忒|乐声|余响)/g, cls: 'term-resource' },
  { re: /(形态之力)/g, cls: 'term-forte' },
  // 千咲（2.8）专属术语
  { re: /(虚无绞痕|虚湮效应|虚湮之线|万缕[··]汇终|锯环残响|锯环[··]疾攻|锯环[··]终结|齿轨轮回)/g, cls: 'term-resource' },
  { re: /(电锯模式|终焉)/g, cls: 'term-state' },
  // 仇远（2.7）专属术语
  { re: /(淋漓醉墨|答剑三连|挑灯问剑|竹照|且从容|荷蓑出林|新筠坠箨)/g, cls: 'term-resource' },
  // 尤诺（2.6）专属术语
  { re: /(月相流转|满月领域|至臻的完满|越限的弦引|告终的喧响|苍白死光的祝颂|灵性)/g, cls: 'term-resource' },
  // 奥古斯塔（2.6）专属术语
  { re: /(以众愿为冕|赫日威临|俯首之刻|不朽者之肃|不败恒阳|烁雷|怒霆|威慑|烈阳|权炳)/g, cls: 'term-resource' },
  // 露帕（2.4）专属术语
  { re: /(狼舞[··]决意[··]极|狼焰|追猎|荣光|赛点沸腾)/g, cls: 'term-resource' },
  // 夏空（2.3）专属术语
  { re: /(四拍重奏|音律独奏|演绎状态|合奏音影|音律)/g, cls: 'term-resource' },
  // 漂泊者专属术语
  { re: /(浮声千斩|回响奏鸣|临渊死寂|缥缈无相|万象归墟|重击[··]灭音|灭音|暗涌)/g, cls: 'term-resource' }
];

function dynamicTermCls(t) {
  if (t.includes('变奏')) return 'term-variation';
  if (t.includes('延奏')) return 'term-outro';
  if (t.includes('协奏')) return 'term-concerto';
  if (t.includes('回路')) return 'term-forte';
  return 'term-normal';
}

// 先把已经是 <b ...> 的部分锁住（占位），高亮完再换回去
export function highlightChainTerms(text) {
  if (!text) return '';
  // 已经含 <b>，跳过避免双重包裹
  if (/<b\s+class="term-/.test(text)) return text;
  let out = String(text);
  CHAIN_TERM_PATTERNS.forEach(p => {
    out = out.replace(p.re, (m) => {
      const cls = p.replaceCls ? p.replaceCls(m) : p.cls;
      return `<b class="${cls}">${m}</b>`;
    });
  });
  return out;
}
