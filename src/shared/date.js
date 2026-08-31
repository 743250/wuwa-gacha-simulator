// 日期工具(纯函数,无 DOM/状态依赖)
export const DAY = 86400000;
export const fmt = d => new Date(d).toISOString().slice(0, 10);
export const date = s => new Date(s + 'T00:00:00Z').getTime();

// 该日期所在周的周一日期 key（ISO 字符串，周重置用）
export const thisMondayKey = today => {
  const d = new Date(today);
  const daysFromMon = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - daysFromMon * DAY).toISOString().slice(0, 10);
};
