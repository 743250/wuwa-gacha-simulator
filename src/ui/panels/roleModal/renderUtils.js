// 渲染共享工具
// 从 render.js 抽取，避免多个渲染模块重复定义

/** 百分比格式化 (0.25 → "25%") */
export function fmtPct(v) {
  return `${(v * 100).toFixed(0)}%`;
}

/** 数据属性的 tooltip 文本安全转义 */
export function escTip(s) {
  return String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;');
}
