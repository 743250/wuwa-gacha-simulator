// 回归测试:attachTermTips 不得破坏 data-tip 属性值内部的 <b class="term-x">
// 复现路径:卡提希娅 burstFurTip 内容含 <b class="term-resource">风蚀效应</b>,
// 被塞进 data-tip='…' 后整段 desc 再过 attachTermTips,旧实现会把属性值内的
// <b> 也包成 <span data-tip='…'>,内层单引号截断外层属性,导致 "'>风蚀效应…"
// 这段 HTML 漏成可见文本(用户报"露出来了")。
import { describe, it, expect } from 'vitest';
import { attachTermTips } from '../../src/ui/terms.js';

describe('attachTermTips — data-tip 属性内不被二次包裹', () => {
  it('普通文本里的 <b class="term-x"> 会被包成 tip-term', () => {
    const out = attachTermTips('叠加 <b class="term-resource">风蚀效应</b>+1 层。');
    expect(out).toContain('tip-term');
    expect(out).toContain("data-tip='");
    // 关键术语仍可悬停
    expect(out).toMatch(/风蚀效应/);
  });

  it('弗洛洛1链的两个派生招式名都有术语下划线解释', () => {
    const html = '<b class="term-skill">亡与死的乐章</b>、<b class="term-skill">永不消逝的梦呓</b>';
    const out = attachTermTips(html);
    expect((out.match(/class="tip-term"/g) || []).length).toBe(2);
    expect(out).toContain('重世普攻派生');
    expect(out).toContain('重世技能派生');
  });

  it('data-tip 属性值内部的 <b class="term-x"> 保持原样,不嵌套 tip-term', () => {
    // 模拟卡提希娅的实际场景:外层已有 data-tip,内层公式说明也用了 term-resource 高亮
    const inner = "命中前结算,每层<b class=\"term-resource\">风蚀效应</b> +20% 最终伤害";
    const html = `<span class="tip" data-tip='${inner}'>看公式</span>`;
    const out = attachTermTips(html);

    // 外层 .tip 仍只有一个 data-tip
    const dataTipCount = (out.match(/\bdata-tip='/g) || []).length;
    expect(dataTipCount).toBe(1);

    // 内层的 <b class="term-resource">风蚀效应</b> 不应被替换成 tip-term
    expect(out).not.toContain('tip-term');

    // 原文完整保留
    expect(out).toContain(inner);
  });

  it('混合场景:外部 term 被包,内部 term 不被包', () => {
    const inner = "<b class=\"term-resource\">风蚀效应</b> 每层 +20%";
    const html = `技能:<b class="term-resource">风蚀效应</b>+1<br><span class="tip" data-tip='${inner}'>公式</span>`;
    const out = attachTermTips(html);

    // 外部那个被包成 tip-term
    expect(out).toContain('tip-term');
    // 内部 data-tip 属性值里的 term 标签不被替换(由 TPROT 保护),外部那个
    // 原版 attachTermTips 把匹配的 <b class="term-...">整段包成 tip-term,
    // 原 term-xxx 标签本身保留在外(作为 tip-term 的内容),所以 term-resource
    // 出现 2 次:内层 1 次(TPROT 保护未替换)+ 外层 1 次(被包但标签保留)
    const termResourceCount = (out.match(/class="term-resource"/g) || []).length;
    expect(termResourceCount).toBe(2);

    // 新增 1 个 data-tip(外层那个 tip-term 的),原 .tip 的 data-tip 不变 → 共 2
    const dataTipCount = (out.match(/\bdata-tip='/g) || []).length;
    expect(dataTipCount).toBe(2);
  });

  it('多个 data-tip 属性并行,每个内部 term 都不被破坏', () => {
    const tipA = "<b class=\"term-resource\">风蚀效应</b> ×1";
    const tipB = "<b class=\"term-resource\">音律</b> 满 3";
    const html = `<span data-tip='${tipA}'>A</span> 和 <span data-tip='${tipB}'>B</span>`;
    const out = attachTermTips(html);

    const dataTipCount = (out.match(/\bdata-tip='/g) || []).length;
    expect(dataTipCount).toBe(2);
    expect(out).not.toContain('tip-term');
    expect(out).toContain(tipA);
    expect(out).toContain(tipB);
  });
});
