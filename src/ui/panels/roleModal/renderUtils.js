// 渲染共享工具
// 从 render.js 抽取，避免多个渲染模块重复定义

/** HTML 属性内 JS 字符串转义 */
export function escJs(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** 百分比格式化 (0.25 → "25%") */
export function fmtPct(v) {
  return `${(v * 100).toFixed(0)}%`;
}

/** 数据属性的 tooltip 文本安全转义 */
export function escTip(s) {
  return String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;');
}

/** 构建带 tooltip 的 span */
export function tipSpan(text, tipContent, style) {
  const safe = escTip(tipContent);
  const st = style ? ` style="${style}"` : '';
  return `<span class="tip" data-tip='${safe}'${st}>${text}</span>`;
}
