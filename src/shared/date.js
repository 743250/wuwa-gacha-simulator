// 日期工具(纯函数,无 DOM/状态依赖)
export const DAY = 86400000;
export const fmt = d => new Date(d).toISOString().slice(0, 10);
export const date = s => new Date(s + 'T00:00:00Z').getTime();
